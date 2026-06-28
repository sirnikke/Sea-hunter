import type { IGame, Vec2, View, WeakTarget } from './types'
import { clamp, lerp } from './types'

// The Young Kraken — the Caribbean apex (docs/bestiary.md §2.1).
// Three phases driven by an explicit state machine:
//   Phase 1: tentacle slams; shoot the glowing suckers to cancel a slam + damage it
//   Phase 2: ink darkens the field, swarms spawn, the eye opens in brief windows
//   Phase 3: the eye stays exposed; enraged, faster slams
// Weak points are published each frame as screen-space `targets` for the scene to hit-test.

const REAR_TIME = 1.35
const SLAM_TIME = 0.3
const RECOVER_TIME = 0.85
const STAGGER_TIME = 1.4
const SLAM_DMG = 12

type TState = 'idle' | 'rear' | 'slam' | 'recover' | 'stagger'

class Tentacle {
  side: number
  state: TState = 'idle'
  timer = 0
  slamP = 0
  sway: number
  staggerT = 0
  suckers: boolean[] = [true, true, true]
  private slammed = false

  constructor(side: number) {
    this.side = side
    this.sway = Math.random() * 6
  }

  attack(tempo: number): void {
    this.state = 'rear'
    this.timer = REAR_TIME * tempo
    this.suckers = [true, true, true]
    this.slamP = 0
    this.slammed = false
  }

  stagger(): void {
    this.state = 'stagger'
    this.staggerT = STAGGER_TIME
  }

  reset(): void {
    this.state = 'idle'
    this.timer = 0
    this.suckers = [true, true, true]
  }

  allDead(): boolean {
    return !this.suckers[0] && !this.suckers[1] && !this.suckers[2]
  }

  update(dt: number, game: IGame): void {
    this.sway += dt
    switch (this.state) {
      case 'rear':
        this.timer -= dt
        if (this.timer <= 0) {
          this.state = 'slam'
          this.slamP = 0
        }
        break
      case 'slam':
        this.slamP += dt / SLAM_TIME
        if (!this.slammed && this.slamP >= 0.85) {
          this.slammed = true
          game.damagePlayer(SLAM_DMG) // damagePlayer centralises the shake + hurt sfx
        }
        if (this.slamP >= 1) {
          this.state = 'recover'
          this.timer = RECOVER_TIME
        }
        break
      case 'recover':
        this.timer -= dt
        if (this.timer <= 0) this.state = 'idle'
        break
      case 'stagger':
        this.staggerT -= dt
        if (this.staggerT <= 0) {
          this.state = 'recover'
          this.timer = 0.5
        }
        break
      case 'idle':
        break
    }
  }
}

interface Geom {
  ax: number
  ay: number
  cpx: number
  cpy: number
  bx: number
  by: number
}

export class Kraken {
  readonly name = 'YOUNG KRAKEN'
  maxHp = 540
  hp = 540
  phase = 1
  mode: 'intro' | 'fight' | 'transition' | 'dying' | 'dead' = 'intro'
  ink = 0

  private introT = 2.6
  private transT = 0
  private dyingT = 0
  private bob = 0
  private rise = 1 // 1 hidden below … 0 fully risen
  private attackCd = 1.2
  private eyeOpen = false
  private eyeTimer = 0
  private eyeCd = 1.5
  private swarmCd = 3
  private hitFlash = 0
  private tentacles: Tentacle[] = [new Tentacle(-1), new Tentacle(1)]

  targets: WeakTarget[] = []

  get dead(): boolean {
    return this.mode === 'dead'
  }
  get introActive(): boolean {
    return this.mode === 'intro'
  }
  get transitioning(): boolean {
    return this.mode === 'transition'
  }
  get dying(): boolean {
    return this.mode === 'dying'
  }
  get hpFrac(): number {
    return clamp(this.hp / this.maxHp, 0, 1)
  }

  private head(view: View): { hx: number; hy: number; headR: number } {
    const headR = Math.min(view.W, view.H) * 0.26
    const baseY = view.H * 0.2
    const hx = view.cx + Math.sin(this.bob * 0.8) * view.W * 0.02
    const hy = baseY + this.rise * view.H * 0.78 + Math.sin(this.bob) * headR * 0.04
    return { hx, hy, headR }
  }

  private geom(t: Tentacle, view: View): Geom {
    const { hx, hy, headR } = this.head(view)
    const ax = hx + t.side * headR * 0.42
    const ay = hy + headR * 0.5
    const sway = Math.sin(t.sway * 1.5)
    let bx: number
    let by: number
    if (t.state === 'rear') {
      bx = ax + t.side * view.W * 0.11
      by = ay + view.H * 0.03
    } else if (t.state === 'slam') {
      const rx = ax + t.side * view.W * 0.11
      const ry = ay + view.H * 0.03
      const zx = view.cx + t.side * view.W * 0.16
      const zy = view.H * 0.76
      const e = t.slamP * t.slamP
      bx = lerp(rx, zx, e)
      by = lerp(ry, zy, e)
    } else if (t.state === 'stagger') {
      bx = ax + t.side * view.W * 0.18
      by = ay + view.H * 0.24
    } else {
      bx = ax + t.side * view.W * 0.05 + sway * view.W * 0.02
      by = ay + view.H * 0.16 + Math.sin(t.sway) * view.H * 0.02
    }
    const mx = (ax + bx) / 2
    const my = (ay + by) / 2
    return {
      ax,
      ay,
      cpx: mx + t.side * view.W * 0.07 + Math.cos(t.sway) * view.W * 0.02,
      cpy: my - view.H * 0.02,
      bx,
      by
    }
  }

  private bez(g: Geom, s: number): Vec2 {
    const u = 1 - s
    return {
      x: u * u * g.ax + 2 * u * s * g.cpx + s * s * g.bx,
      y: u * u * g.ay + 2 * u * s * g.cpy + s * s * g.by
    }
  }

  private suckerPositions(t: Tentacle, view: View): Vec2[] {
    const g = this.geom(t, view)
    return [0.55, 0.7, 0.85].map((s) => this.bez(g, s))
  }

  update(dt: number, game: IGame): void {
    this.bob += dt
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt * 3)

    switch (this.mode) {
      case 'intro':
        this.introT -= dt
        this.rise = clamp(this.introT / 2.6, 0, 1)
        if (this.introT <= 0) {
          this.rise = 0
          this.mode = 'fight'
          this.phase = 1
          this.attackCd = 1.0
          game.sfx('bossRoar')
        }
        break
      case 'fight': {
        const tempo = this.phase === 3 ? 0.7 : 1
        for (const t of this.tentacles) t.update(dt, game)
        const targetInk = this.phase === 2 ? 0.55 : this.phase === 3 ? 0.18 : 0
        this.ink = lerp(this.ink, targetInk, dt * 1.5)

        this.attackCd -= dt
        if (this.attackCd <= 0) {
          const idle = this.tentacles.filter((t) => t.state === 'idle')
          if (idle.length) {
            idle[Math.floor(Math.random() * idle.length)].attack(tempo)
            game.sfx('threat')
          }
          this.attackCd = this.phase === 1 ? 2.3 : this.phase === 2 ? 3.4 : 1.5
        }

        if (this.phase === 2) {
          if (this.eyeOpen) {
            this.eyeTimer -= dt
            if (this.eyeTimer <= 0) {
              this.eyeOpen = false
              this.eyeCd = 2.4
            }
          } else {
            this.eyeCd -= dt
            if (this.eyeCd <= 0) {
              this.eyeOpen = true
              this.eyeTimer = 1.7
              game.sfx('weak')
            }
          }
          this.swarmCd -= dt
          if (this.swarmCd <= 0) {
            this.swarmCd = 4.5
            game.spawnSwarm(3)
          }
        }

        if (this.phase === 1 && this.hp <= this.maxHp * 0.66) this.enterTransition(game)
        else if (this.phase === 2 && this.hp <= this.maxHp * 0.33) this.enterTransition(game)
        else if (this.hp <= 0) this.enterDying(game)
        break
      }
      case 'transition':
        this.transT -= dt
        this.ink = lerp(this.ink, 0.7, dt * 3)
        if (this.transT <= 0) this.advancePhase()
        break
      case 'dying':
        this.dyingT -= dt
        this.rise = (1 - clamp(this.dyingT / 3.2, 0, 1)) * 1.2
        this.ink = lerp(this.ink, 0.5, dt)
        if (Math.random() < 0.4) {
          const { hx, hy, headR } = this.head(game.view)
          game.particles.burst(
            hx + (Math.random() - 0.5) * headR,
            hy + (Math.random() - 0.5) * headR,
            6,
            { color: '#9ad7ff', speed: 200, life: 0.6 }
          )
        }
        if (this.dyingT <= 0) this.mode = 'dead'
        break
      case 'dead':
        break
    }

    this.recomputeTargets(game)
  }

  private enterTransition(game: IGame): void {
    this.mode = 'transition'
    this.transT = 1.8
    this.targets = []
    for (const t of this.tentacles) t.reset()
    this.eyeOpen = false
    game.sfx('phase')
    game.shake(14)
  }

  private advancePhase(): void {
    if (this.phase === 1) {
      this.phase = 2
      this.eyeCd = 1.2
      this.swarmCd = 2
    } else if (this.phase === 2) {
      this.phase = 3
      this.eyeOpen = true
    }
    for (const t of this.tentacles) t.reset()
    this.attackCd = 1.2
    this.mode = 'fight'
  }

  private enterDying(game: IGame): void {
    this.mode = 'dying'
    this.dyingT = 3.2
    this.targets = []
    game.sfx('bossRoar')
    game.shake(20)
  }

  private recomputeTargets(game: IGame): void {
    this.targets = []
    if (this.mode !== 'fight') return
    const view = game.view
    const { hx, hy, headR } = this.head(view)
    for (let i = 0; i < this.tentacles.length; i++) {
      const t = this.tentacles[i]
      if (t.state !== 'rear') continue
      const pts = this.suckerPositions(t, view)
      for (let s = 0; s < pts.length; s++) {
        if (!t.suckers[s]) continue
        this.targets.push({ id: `t${i}s${s}`, sx: pts[s].x, sy: pts[s].y, radius: headR * 0.15 })
      }
    }
    if (this.eyeOpen) {
      this.targets.push({ id: 'eye', sx: hx, sy: hy + headR * 0.02, radius: headR * 0.2 })
    }
  }

  /** Apply a hit to a published target. Returns damage dealt (for scoring). */
  hitTarget(id: string, dmg: number, game: IGame): number {
    if (this.mode !== 'fight') return 0
    this.hitFlash = 1
    const view = game.view
    if (id === 'eye') {
      this.hp -= dmg
      const { hx, hy } = this.head(view)
      game.particles.burst(hx, hy, 16, { color: '#ffe48a', speed: 300, life: 0.45 })
      game.sfx('weak')
      return dmg
    }
    const m = /^t(\d+)s(\d+)$/.exec(id)
    if (!m) return 0
    const ti = +m[1]
    const si = +m[2]
    const t = this.tentacles[ti]
    if (!t || !t.suckers[si]) return 0
    t.suckers[si] = false
    this.hp -= dmg
    const pts = this.suckerPositions(t, view)
    game.particles.burst(pts[si].x, pts[si].y, 12, { color: '#aef0ff', speed: 260, life: 0.35 })
    game.sfx('weak')
    if (t.allDead()) {
      t.stagger()
      this.hp -= dmg * 0.5
      const g = this.geom(t, view)
      game.particles.ring(g.bx, g.by, 'rgba(180,255,255,0.9)', 14)
      game.sfx('phase')
      game.shake(8)
    }
    return dmg
  }

  // ── Rendering ──

  draw(ctx: CanvasRenderingContext2D, game: IGame): void {
    if (this.mode === 'dead') return
    const view = game.view
    for (const t of this.tentacles) this.drawTentacle(ctx, t, view)
    this.drawHead(ctx, view)
  }

  private drawTentacle(ctx: CanvasRenderingContext2D, t: Tentacle, view: View): void {
    const g = this.geom(t, view)
    const N = 16
    const headR = Math.min(view.W, view.H) * 0.26
    const baseW = headR * 0.17
    const tipW = headR * 0.03
    const pts: Vec2[] = []
    for (let i = 0; i < N; i++) pts.push(this.bez(g, i / (N - 1)))

    const left: Vec2[] = []
    const right: Vec2[] = []
    for (let i = 0; i < N; i++) {
      const a = pts[Math.max(0, i - 1)]
      const b = pts[Math.min(N - 1, i + 1)]
      let nx = -(b.y - a.y)
      let ny = b.x - a.x
      const len = Math.hypot(nx, ny) || 1
      nx /= len
      ny /= len
      const w = lerp(baseW, tipW, i / (N - 1))
      left.push({ x: pts[i].x + nx * w, y: pts[i].y + ny * w })
      right.push({ x: pts[i].x - nx * w, y: pts[i].y - ny * w })
    }

    ctx.beginPath()
    ctx.moveTo(left[0].x, left[0].y)
    for (let i = 1; i < N; i++) ctx.lineTo(left[i].x, left[i].y)
    for (let i = N - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y)
    ctx.closePath()
    ctx.fillStyle = t.state === 'stagger' ? '#4a2f5c' : '#5b3a6e'
    ctx.fill()
    ctx.strokeStyle = '#2a1736'
    ctx.lineWidth = 2
    ctx.stroke()

    // suckers
    const rearing = t.state === 'rear'
    const sPts = this.suckerPositions(t, view)
    for (let s = 0; s < sPts.length; s++) {
      if (!t.suckers[s]) continue
      const r = headR * 0.13
      if (rearing) {
        ctx.fillStyle = 'rgba(150,240,255,0.25)'
        ctx.beginPath()
        ctx.arc(sPts[s].x, sPts[s].y, r * 1.7 + Math.sin(this.bob * 6 + s) * 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#bff2ff'
        ctx.strokeStyle = '#1d6f86'
      } else {
        ctx.fillStyle = '#7a558e'
        ctx.strokeStyle = '#2a1736'
      }
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(sPts[s].x, sPts[s].y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  }

  private drawHead(ctx: CanvasRenderingContext2D, view: View): void {
    const { hx, hy, headR } = this.head(view)
    ctx.save()
    ctx.translate(hx, hy)

    // mantle (pointed bell)
    ctx.fillStyle = '#5b3a6e'
    ctx.strokeStyle = '#2a1736'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, -headR * 1.5)
    ctx.quadraticCurveTo(headR * 0.95, -headR * 0.5, headR * 0.7, headR * 0.45)
    ctx.quadraticCurveTo(0, headR * 0.8, -headR * 0.7, headR * 0.45)
    ctx.quadraticCurveTo(-headR * 0.95, -headR * 0.5, 0, -headR * 1.5)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // side fins
    ctx.fillStyle = '#6f4a82'
    ctx.beginPath()
    ctx.moveTo(-headR * 0.6, -headR * 1.05)
    ctx.lineTo(-headR * 1.15, -headR * 1.3)
    ctx.lineTo(-headR * 0.5, -headR * 0.7)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(headR * 0.6, -headR * 1.05)
    ctx.lineTo(headR * 1.15, -headR * 1.3)
    ctx.lineTo(headR * 0.5, -headR * 0.7)
    ctx.closePath()
    ctx.fill()

    // belly highlight
    ctx.fillStyle = 'rgba(180,140,205,0.4)'
    ctx.beginPath()
    ctx.ellipse(0, -headR * 0.2, headR * 0.45, headR * 0.7, 0, 0, Math.PI * 2)
    ctx.fill()

    // eye
    const open = this.eyeOpen || this.phase === 3
    const er = headR * 0.34
    if (open) {
      ctx.fillStyle = 'rgba(255,210,120,0.35)'
      ctx.beginPath()
      ctx.arc(0, headR * 0.02, er * 1.6 + Math.sin(this.bob * 5) * 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffe49a'
      ctx.beginPath()
      ctx.arc(0, headR * 0.02, er, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#7a1d1d'
      ctx.beginPath()
      ctx.arc(0, headR * 0.02, er * 0.45, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.strokeStyle = '#2a1736'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(0, headR * 0.02, er, Math.PI * 0.1, Math.PI * 0.9)
      ctx.stroke()
    }

    if (this.hitFlash > 0) {
      ctx.globalAlpha = this.hitFlash * 0.6
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.ellipse(0, -headR * 0.3, headR, headR * 1.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }
}
