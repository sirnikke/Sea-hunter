import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import type { Projected } from './types'
import type { Enemy, Threat } from './enemies'
import type { Kraken } from './kraken'

// ───────────────────────────────────────────────────────────────────────────
// 3D underwater renderer (WebGL / three.js).
//
// Game logic stays in the normalised "field" space (x,y ∈ ~[-1,1], depth z ∈
// 0.05 near … 1 far). This module maps field → world, renders a procedural
// underwater scene + creatures, and projects field points back to screen pixels
// so the existing screen-space combat/hit-testing keeps working unchanged.
// ───────────────────────────────────────────────────────────────────────────

const FOV = 56
const NEAR_D = 3.5 // world depth at field z=0 (closest)
const RANGE_D = 30 // added depth at field z=1 (farthest)
const SPREAD = 5.8 // lateral world scale

// small value-noise / fbm for terrain + textures
const hash2 = (x: number, z: number): number => {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
  return n - Math.floor(n)
}
const smooth = (t: number): number => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const vnoise = (x: number, z: number): number => {
  const xi = Math.floor(x)
  const zi = Math.floor(z)
  const xf = x - xi
  const zf = z - zi
  const u = smooth(xf)
  const v = smooth(zf)
  return lerp(
    lerp(hash2(xi, zi), hash2(xi + 1, zi), u),
    lerp(hash2(xi, zi + 1), hash2(xi + 1, zi + 1), u),
    v
  )
}
const fbm = (x: number, z: number): number => {
  let a = 0
  let amp = 0.5
  let f = 1
  for (let i = 0; i < 4; i++) {
    a += amp * vnoise(x * f, z * f)
    f *= 2
    amp *= 0.5
  }
  return a
}

function makeTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = cv.height = size
  const ctx = cv.getContext('2d')!
  draw(ctx, size)
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export class World3D {
  readonly renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private composer: EffectComposer
  private bloom: UnrealBloomPass
  private time = 0
  private W = 1
  private H = 1
  private focalPx = 1

  private caustics: THREE.Mesh
  private godRays: THREE.Mesh[] = []
  private snow!: THREE.Points
  private snowVel: Float32Array
  private bubbles!: THREE.Points
  private bubbleVel: Float32Array

  private enemyMeshes = new Map<Enemy, THREE.Group>()
  private threatMeshes = new Map<Threat, THREE.Group>()
  private bossGroup: THREE.Group | null = null
  private bossParts: {
    eye: THREE.Mesh
    head: THREE.Mesh
    mantle: THREE.Mesh
    tentacles: THREE.Mesh[]
    suckers: THREE.Mesh[]
  } | null = null

  private tmp = new THREE.Vector3()

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x07344a, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400)
    this.camera.position.set(0, 1.2, 0)
    this.camera.lookAt(0, -1.1, -30)
    this.camera.updateMatrixWorld()

    this.scene.fog = new THREE.FogExp2(0x0d4a60, 0.015)
    this.scene.background = makeGradientBg()

    this.buildLights()
    this.buildTerrain()
    this.caustics = this.buildCaustics()
    this.buildGodRays()
    this.buildParticles()

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.5, 0.82)
    this.composer.addPass(this.bloom)

    // Small scene — skip frustum culling so nothing is dropped by a stray
    // bounding-sphere computation, and the per-frame cost stays trivial.
    this.scene.traverse((o) => {
      o.frustumCulled = false
    })

    this.snowVel = new Float32Array(0)
    this.bubbleVel = new Float32Array(0)
  }

  // ── viewport ──
  resize(w: number, h: number, dpr: number): void {
    this.W = w
    this.H = h
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    this.composer.setPixelRatio(dpr)
    this.composer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.focalPx = (h * 0.5) / Math.tan((FOV * Math.PI) / 360)
  }

  // ── field → world / screen ──
  private worldPos(fx: number, fy: number, fz: number, out = this.tmp): THREE.Vector3 {
    const depth = NEAR_D + fz * RANGE_D
    return out.set(fx * SPREAD, -fy * SPREAD, -depth)
  }

  project(fx: number, fy: number, fz: number): Projected {
    const depth = NEAR_D + fz * RANGE_D
    const v = this.worldPos(fx, fy, fz, new THREE.Vector3()).project(this.camera)
    return {
      sx: (v.x * 0.5 + 0.5) * this.W,
      sy: (-v.y * 0.5 + 0.5) * this.H,
      scale: this.focalPx / depth
    }
  }

  // ── scene building ──
  private buildLights(): void {
    this.scene.add(new THREE.HemisphereLight(0x9fe3ff, 0x16323d, 1.05))
    const sun = new THREE.DirectionalLight(0xdff4ff, 1.3)
    sun.position.set(-6, 18, 4)
    this.scene.add(sun)
    const fill = new THREE.DirectionalLight(0xbfe6ff, 0.55) // from the camera side, lights the front of creatures
    fill.position.set(2, 3, 12)
    this.scene.add(fill)
    this.scene.add(new THREE.AmbientLight(0x2a6886, 0.7))
  }

  private buildTerrain(): void {
    const Wd = 220
    const Dd = 240
    const geo = new THREE.PlaneGeometry(Wd, Dd, 120, 130)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position as THREE.BufferAttribute
    const colors: number[] = []
    const cDark = new THREE.Color(0x33402a)
    const cLight = new THREE.Color(0x7e8a55)
    const cAlga = new THREE.Color(0x3f5f3a)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const h = fbm(x * 0.05 + 11, z * 0.05 + 7) * 7 + fbm(x * 0.16, z * 0.16) * 2.2
      const side = Math.pow(Math.min(1, Math.abs(x) / (Wd * 0.42)), 2.2) * 30
      const back = Math.max(0, -z - 40) * 0.7
      const y = -9.5 + h + side + back
      pos.setY(i, y)
      const t = Math.max(0, Math.min(1, (h - 1) / 7))
      const c = cDark.clone().lerp(cLight, t).lerp(cAlga, 0.25 + 0.2 * vnoise(x * 0.3, z * 0.3))
      colors.push(c.r, c.g, c.b)
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.z = -40
    this.scene.add(mesh)
  }

  private buildCaustics(): THREE.Mesh {
    const tex = makeTexture(256, (ctx, s) => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, s, s)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 120; i++) {
        const x = hash2(i, 1) * s
        const y = hash2(i, 2) * s
        const r = 8 + hash2(i, 3) * 26
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        const a = 0.05 + hash2(i, 4) * 0.12
        g.addColorStop(0, `rgba(160,235,255,${a})`)
        g.addColorStop(1, 'rgba(160,235,255,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    })
    tex.repeat.set(6, 6)
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.5
    })
    const geo = new THREE.PlaneGeometry(220, 240)
    geo.rotateX(-Math.PI / 2)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(0, -7.6, -40)
    this.scene.add(mesh)
    return mesh
  }

  private buildGodRays(): void {
    const tex = makeTexture(128, (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, 0, s)
      g.addColorStop(0, 'rgba(200,240,255,0.55)')
      g.addColorStop(1, 'rgba(200,240,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, s, s)
      // soft horizontal falloff
      const h = ctx.createLinearGradient(0, 0, s, 0)
      h.addColorStop(0, 'rgba(0,0,0,1)')
      h.addColorStop(0.5, 'rgba(0,0,0,0)')
      h.addColorStop(1, 'rgba(0,0,0,1)')
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = h
      ctx.fillRect(0, 0, s, s)
    })
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.18,
      side: THREE.DoubleSide
    })
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.PlaneGeometry(10, 70)
      const m = new THREE.Mesh(geo, mat.clone())
      m.position.set(-18 + i * 9, 16, -20 - i * 6)
      m.rotation.z = 0.18 + (i - 2) * 0.05
      this.scene.add(m)
      this.godRays.push(m)
    }
  }

  private buildParticles(): void {
    const sprite = makeTexture(64, (ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, s, s)
    })
    // marine snow
    const N = 320
    const p = new Float32Array(N * 3)
    this.snowVel = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      p[i * 3] = (Math.random() - 0.5) * 70
      p[i * 3 + 1] = (Math.random() - 0.5) * 30
      p[i * 3 + 2] = -2 - Math.random() * 55
      this.snowVel[i * 3] = (Math.random() - 0.5) * 0.3
      this.snowVel[i * 3 + 1] = -0.2 - Math.random() * 0.3
      this.snowVel[i * 3 + 2] = 0.2 + Math.random() * 0.6
    }
    const sg = new THREE.BufferGeometry()
    sg.setAttribute('position', new THREE.BufferAttribute(p, 3))
    this.snow = new THREE.Points(
      sg,
      new THREE.PointsMaterial({
        size: 0.22,
        map: sprite,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xcdeeff
      })
    )
    this.scene.add(this.snow)

    // bubbles
    const M = 90
    const bp = new Float32Array(M * 3)
    this.bubbleVel = new Float32Array(M * 3)
    for (let i = 0; i < M; i++) {
      bp[i * 3] = (Math.random() - 0.5) * 50
      bp[i * 3 + 1] = (Math.random() - 0.5) * 24
      bp[i * 3 + 2] = -3 - Math.random() * 40
      this.bubbleVel[i * 3] = (Math.random() - 0.5) * 0.2
      this.bubbleVel[i * 3 + 1] = 0.6 + Math.random() * 0.9
      this.bubbleVel[i * 3 + 2] = 0
    }
    const bg = new THREE.BufferGeometry()
    bg.setAttribute('position', new THREE.BufferAttribute(bp, 3))
    this.bubbles = new THREE.Points(
      bg,
      new THREE.PointsMaterial({
        size: 0.35,
        map: sprite,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xbfeaff
      })
    )
    this.scene.add(this.bubbles)
  }

  private updateEnv(dt: number): void {
    const ct = this.caustics.material as THREE.MeshBasicMaterial
    if (ct.map) {
      ct.map.offset.x += dt * 0.012
      ct.map.offset.y += dt * 0.008
    }
    ct.opacity = 0.4 + Math.sin(this.time * 0.8) * 0.12
    for (let i = 0; i < this.godRays.length; i++) {
      const m = this.godRays[i]
      const mm = m.material as THREE.MeshBasicMaterial
      mm.opacity = 0.12 + 0.08 * (0.5 + 0.5 * Math.sin(this.time * 0.5 + i))
      m.rotation.z += Math.sin(this.time * 0.3 + i) * dt * 0.02
    }
    this.driftPoints(this.snow, this.snowVel, dt, true)
    this.driftPoints(this.bubbles, this.bubbleVel, dt, false)
  }

  private driftPoints(pts: THREE.Points, vel: Float32Array, dt: number, snow: boolean): void {
    const arr = (pts.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] += vel[i] * dt
      arr[i + 1] += vel[i + 1] * dt
      arr[i + 2] += vel[i + 2] * dt
      if (snow && arr[i + 2] > -1) {
        arr[i] = (Math.random() - 0.5) * 70
        arr[i + 1] = (Math.random() - 0.5) * 30
        arr[i + 2] = -55
      }
      if (!snow && arr[i + 1] > 16) {
        arr[i + 1] = -16
        arr[i] = (Math.random() - 0.5) * 50
      }
    }
    ;(pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
  }

  // ── main entry ──
  render(
    dt: number,
    enemies: Enemy[],
    threats: Threat[],
    boss: Kraken | null,
    shake = 0
  ): void {
    this.time += dt
    this.updateEnv(dt)
    this.syncEnemies(enemies)
    this.syncThreats(threats)
    this.syncBoss(boss)
    if (shake > 0.3) {
      this.camera.position.set((Math.random() - 0.5) * shake * 0.008, 1.2 + (Math.random() - 0.5) * shake * 0.008, 0)
      this.camera.updateMatrixWorld()
    }
    this.composer.render()
    if (shake > 0.3) {
      this.camera.position.set(0, 1.2, 0)
      this.camera.updateMatrixWorld()
    }
  }

  // ── creatures ──
  private syncEnemies(enemies: Enemy[]): void {
    const seen = new Set<Enemy>()
    for (const e of enemies) {
      seen.add(e)
      let g = this.enemyMeshes.get(e)
      if (!g) {
        g = e.kind === 'charger' ? makeShark() : e.kind === 'swarm' ? makeFish() : makePuffer()
        g.userData.phase = Math.random() * 6
        g.traverse((o) => {
          o.frustumCulled = false
        })
        this.scene.add(g)
        this.enemyMeshes.set(e, g)
      }
      this.worldPos(e.x, e.y, e.z, g.position)
      const ph = this.time * 4 + (g.userData.phase as number)
      if (e.kind === 'shooter') {
        g.rotation.set(0, this.time * 0.6 + (g.userData.phase as number), 0) // round body, slow spin
        g.scale.setScalar(e.telegraph > 0 ? 1.18 : 1)
      } else {
        // elongated fish / shark: show the side profile, nose angled toward centre
        const face = e.x <= 0 ? 1 : -1
        g.rotation.set(
          Math.sin(ph * 0.4) * 0.1,
          face * Math.PI * 0.5 + Math.sin(ph * 0.2) * 0.2,
          Math.sin(ph * 0.5) * 0.06
        )
        const tail = g.userData.tail as THREE.Object3D | undefined
        if (tail) tail.rotation.y = Math.sin(ph) * 0.5
      }
      this.applyFlash(g, e.flash)
    }
    for (const [e, g] of this.enemyMeshes) {
      if (!seen.has(e)) {
        this.scene.remove(g)
        disposeGroup(g)
        this.enemyMeshes.delete(e)
      }
    }
  }

  private syncThreats(threats: Threat[]): void {
    const seen = new Set<Threat>()
    for (const t of threats) {
      seen.add(t)
      let g = this.threatMeshes.get(t)
      if (!g) {
        g = makeThreat()
        g.traverse((o) => {
          o.frustumCulled = false
        })
        this.scene.add(g)
        this.threatMeshes.set(t, g)
      }
      this.worldPos(t.x, t.y, t.z, g.position)
      g.rotation.x += 0.08
      g.rotation.y += 0.11
    }
    for (const [t, g] of this.threatMeshes) {
      if (!seen.has(t)) {
        this.scene.remove(g)
        disposeGroup(g)
        this.threatMeshes.delete(t)
      }
    }
  }

  private applyFlash(g: THREE.Group, flash: number): void {
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (m && m.emissive && m.userData.baseEmissive !== undefined) {
        m.emissiveIntensity = (m.userData.baseEmissive as number) + flash * 1.6
      }
    })
  }

  // ── boss ──
  private syncBoss(boss: Kraken | null): void {
    if (!boss || boss.dead) {
      if (this.bossGroup) {
        this.scene.remove(this.bossGroup)
        disposeGroup(this.bossGroup)
        this.bossGroup = null
        this.bossParts = null
      }
      return
    }
    if (!this.bossGroup) this.buildBoss()
    const parts = this.bossParts!
    const d = boss.renderData()

    this.worldPos(d.head.x, d.head.y, d.head.z, parts.head.position)
    const hr = d.head.r * SPREAD
    parts.head.scale.setScalar(hr)
    parts.mantle.position.copy(parts.head.position).add(new THREE.Vector3(0, hr * 0.7, 0))
    parts.mantle.scale.setScalar(hr)

    this.worldPos(d.eye.x, d.eye.y, d.eye.z, parts.eye.position)
    parts.eye.scale.setScalar(d.eye.r * SPREAD)
    const eyeMat = parts.eye.material as THREE.MeshStandardMaterial
    eyeMat.emissiveIntensity = d.eye.open ? 2.4 + Math.sin(this.time * 6) * 0.5 : 0.05
    eyeMat.color.set(d.eye.open ? 0xffe27a : 0x3a2030)

    // tentacles (rebuilt tubes) + suckers
    let si = 0
    for (let i = 0; i < parts.tentacles.length; i++) {
      const tEnt = d.tentacles[i]
      const tube = parts.tentacles[i]
      tube.geometry.dispose()
      const raw = tEnt.points.map((p) => this.worldPos(p.x, p.y, p.z, new THREE.Vector3()))
      // drop near-coincident points — they make CatmullRom/Tube frames go NaN
      const pts: THREE.Vector3[] = []
      for (const v of raw) {
        if (pts.length === 0 || pts[pts.length - 1].distanceToSquared(v) > 1e-4) pts.push(v)
      }
      while (pts.length < 2) pts.push(pts[pts.length - 1].clone().add(new THREE.Vector3(0, -0.02, 0)))
      const curve = new THREE.CatmullRomCurve3(pts)
      tube.geometry = new THREE.TubeGeometry(curve, 24, d.head.r * SPREAD * 0.13, 8, false)
      for (const s of tEnt.suckers) {
        const sm = parts.suckers[si++]
        if (!sm) continue
        sm.visible = s.alive
        this.worldPos(s.x, s.y, s.z, sm.position)
        sm.scale.setScalar(d.head.r * SPREAD * 0.12)
        const m = sm.material as THREE.MeshStandardMaterial
        m.emissiveIntensity = s.glow ? 2.2 + Math.sin(this.time * 8) * 0.6 : 0.0
        m.color.set(s.glow ? 0xaef0ff : 0x6a4a80)
      }
    }
    for (; si < parts.suckers.length; si++) parts.suckers[si].visible = false

    const flash = d.hitFlash
    parts.head.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (m && m.emissive && m.userData.baseEmissive !== undefined) {
        m.emissiveIntensity = (m.userData.baseEmissive as number) + flash * 1.2
      }
    })
  }

  private buildBoss(): void {
    const g = new THREE.Group()
    const skin = () => {
      const m = new THREE.MeshStandardMaterial({ color: 0x6a4684, roughness: 0.7, emissive: 0x2a1140 })
      m.emissiveIntensity = 0.18
      m.userData.baseEmissive = 0.18
      return m
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 22), skin())
    const mantle = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.6, 24), skin())
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0xffe27a, emissive: 0xffcc55, emissiveIntensity: 2 })
    )
    g.add(mantle, head, eye)
    const tentacles: THREE.Mesh[] = []
    const suckers: THREE.Mesh[] = []
    for (let i = 0; i < 2; i++) {
      const tube = new THREE.Mesh(new THREE.BufferGeometry(), skin())
      tentacles.push(tube)
      g.add(tube)
    }
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xaef0ff, emissive: 0x6fe0ff, emissiveIntensity: 0 })
      )
      s.visible = false
      suckers.push(s)
      g.add(s)
    }
    g.traverse((o) => {
      o.frustumCulled = false
    })
    this.scene.add(g)
    this.bossGroup = g
    this.bossParts = { eye, head, mantle, tentacles, suckers }
  }
}

// ── procedural meshes ─────────────────────────────────────────────────────

function makeGradientBg(): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 16
  cv.height = 256
  const ctx = cv.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#1f86ab')
  g.addColorStop(0.45, '#0c5878')
  g.addColorStop(1, '#04293c')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 16, 256)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function emissiveMat(color: number, rough = 0.65): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, vertexColors: true })
  m.emissive = new THREE.Color(color).multiplyScalar(0.15)
  m.emissiveIntensity = 0.1
  m.userData.baseEmissive = 0.1
  return m
}

function tintedBody(geo: THREE.BufferGeometry, back: number, belly: number): THREE.BufferGeometry {
  const pos = geo.attributes.position as THREE.BufferAttribute
  const cb = new THREE.Color(back)
  const cl = new THREE.Color(belly)
  const colors: number[] = []
  let maxY = 0.001
  for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, Math.abs(pos.getY(i)))
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) / maxY) * 0.5 + 0.5
    const c = cl.clone().lerp(cb, smooth(t))
    colors.push(c.r, c.g, c.b)
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return geo
}

function fishBody(len: number, girth: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 22, 16)
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const zt = z // -1..1
    const taper = 1 - 0.55 * Math.pow(Math.abs(zt), 1.6)
    pos.setXYZ(i, x * girth * taper, y * girth * 0.82 * taper, z * len)
  }
  geo.computeVertexNormals()
  return geo
}

function triFin(w: number, h: number, len: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, len, -w, 0, -len * 0.3, w, 0, -len * 0.3, 0, h, -len * 0.2], 3)
  )
  geo.setIndex([0, 1, 3, 0, 3, 2])
  geo.computeVertexNormals()
  const n = geo.attributes.position.count
  const colors = new Float32Array(n * 3).fill(0.45)
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

function makeShark(): THREE.Group {
  const g = new THREE.Group()
  const mat = emissiveMat(0xb8c8d2, 0.6)
  const body = new THREE.Mesh(tintedBody(fishBody(1.5, 0.6), 0x6b8694, 0xeef6f8), mat)
  g.add(body)
  // dorsal
  const dorsal = new THREE.Mesh(triFin(0.06, 0.55, 0.5), mat)
  dorsal.position.set(0, 0.42, 0.1)
  body.add(dorsal)
  // pectorals
  for (const sx of [-1, 1]) {
    const pec = new THREE.Mesh(triFin(0.05, 0.02, 0.45), mat)
    pec.position.set(sx * 0.32, -0.12, 0.25)
    pec.rotation.z = sx * 0.6
    body.add(pec)
  }
  // tail (animated)
  const tail = new THREE.Group()
  tail.position.z = -1.45
  const tf = new THREE.Mesh(triFin(0.05, 0.85, 0.55), mat)
  tf.rotation.x = Math.PI / 2
  tail.add(tf)
  g.add(tail)
  g.userData.tail = tail
  g.scale.setScalar(1.0)
  return g
}

function makeFish(): THREE.Group {
  const g = new THREE.Group()
  const mat = emissiveMat(0xd79a44, 0.55)
  const body = new THREE.Mesh(tintedBody(fishBody(0.6, 0.42), 0xb5742a, 0xf4d28a), mat)
  g.add(body)
  const tail = new THREE.Group()
  tail.position.z = -0.6
  const tf = new THREE.Mesh(triFin(0.04, 0.32, 0.28), mat)
  tf.rotation.x = Math.PI / 2
  tail.add(tf)
  g.add(tail)
  g.userData.tail = tail
  g.scale.setScalar(0.85)
  return g
}

function makePuffer(): THREE.Group {
  const g = new THREE.Group()
  const mat = emissiveMat(0xcf9a4e, 0.6)
  const body = new THREE.Mesh(tintedBody(new THREE.SphereGeometry(0.75, 20, 16), 0xb07c34, 0xf2d29a), mat)
  g.add(body)
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0xb88a44, roughness: 0.6 })
  for (let i = 0; i < 40; i++) {
    const a = Math.acos(1 - 2 * (i + 0.5) / 40)
    const b = Math.PI * (1 + Math.sqrt(5)) * i
    const dir = new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b), Math.cos(a))
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 5), spikeMat)
    sp.position.copy(dir.clone().multiplyScalar(0.72))
    sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    body.add(sp)
  }
  g.scale.setScalar(0.9)
  return g
}

function makeThreat(): THREE.Group {
  const g = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: 0x7a1f2e, emissive: 0xff4a4a, emissiveIntensity: 1.4, roughness: 0.5 })
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), mat)
  g.add(core)
  for (let i = 0; i < 10; i++) {
    const a = Math.acos(1 - 2 * (i + 0.5) / 10)
    const b = Math.PI * (1 + Math.sqrt(5)) * i
    const dir = new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b), Math.cos(a))
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.34, 5), mat)
    sp.position.copy(dir.clone().multiplyScalar(0.34))
    sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    g.add(sp)
  }
  return g
}

function disposeGroup(g: THREE.Object3D): void {
  g.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.geometry) m.geometry.dispose()
    const mat = m.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
    else if (mat) mat.dispose()
  })
}
