import type { IGame, WeakTarget } from './types'
import { clamp, lerp } from './types'

// The Young Kraken — Caribbean apex (docs/bestiary.md §2.1).
// State machine is unchanged from the original; geometry is now expressed in the
// normalised "field" space (x,y,z) so the 3D renderer (world3d.ts) can build the
// creature, while weak-point targets are still published as screen-space circles.

const REAR_TIME = 1.35
const SLAM_TIME = 0.3
const RECOVER_TIME = 0.85
const STAGGER_TIME = 1.4
const SLAM_DMG = 12

const HEAD_Y0 = -0.42
const HEAD_Z = 0.46
const HEAD_R = 0.5

type TState = 'idle' | 'rear' | 'slam' | 'recover' | 'stagger'

interface FieldPt {
  x: number
  y: number
  z: number
}

export interface KrakenRenderData {
  head: { x: number; y: number; z: number; r: number }
  eye: { x: number; y: number; z: number; r: number; open: boolean }
  tentacles: { points: FieldPt[]; suckers: (FieldPt & { alive: boolean; glow: boolean })[] }[]
  phase: number
  dying: boolean
  hitFlash: number
}

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
          game.damagePlayer(SLAM_DMG)
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
  private rise = 1
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
  get hpFrac(): number {
    return clamp(this.hp / this.maxHp, 0, 1)
  }

  // ── field-space geometry ──
  private headField(): { x: number; y: number; z: number; r: number } {
    return {
      x: Math.sin(this.bob * 0.8) * 0.04,
      y: HEAD_Y0 + this.rise * 1.7 + Math.sin(this.bob) * 0.02,
      z: HEAD_Z,
      r: HEAD_R
    }
  }

  private eyeField(): FieldPt {
    const h = this.headField()
    return { x: h.x, y: h.y + 0.02, z: h.z - 0.08 }
  }

  private geom(t: Tentacle): { a: FieldPt; cp: FieldPt; b: FieldPt } {
    const h = this.headField()
    const a: FieldPt = { x: h.x + t.side * HEAD_R * 0.5, y: h.y + HEAD_R * 0.45, z: h.z + 0.03 }
    const sway = Math.sin(t.sway * 1.5)
    let b: FieldPt
    if (t.state === 'rear') {
      b = { x: h.x + t.side * 0.62, y: h.y + 0.34, z: h.z - 0.05 }
    } else if (t.state === 'slam') {
      const r = { x: h.x + t.side * 0.62, y: h.y + 0.34, z: h.z - 0.05 }
      const zone = { x: h.x + t.side * 0.34, y: 0.6, z: 0.14 }
      const e = t.slamP * t.slamP
      b = { x: lerp(r.x, zone.x, e), y: lerp(r.y, zone.y, e), z: lerp(r.z, zone.z, e) }
    } else if (t.state === 'stagger') {
      b = { x: h.x + t.side * 0.72, y: h.y + 0.95, z: h.z - 0.08 }
    } else {
      b = { x: h.x + t.side * 0.5 + sway * 0.08, y: h.y + 0.72, z: h.z - 0.12 }
    }
    const cp: FieldPt = {
      x: (a.x + b.x) / 2 + t.side * 0.18,
      y: (a.y + b.y) / 2 - 0.04,
      z: (a.z + b.z) / 2 - 0.05
    }
    return { a, cp, b }
  }

  private bez(g: { a: FieldPt; cp: FieldPt; b: FieldPt }, s: number): FieldPt {
    const u = 1 - s
    return {
      x: u * u * g.a.x + 2 * u * s * g.cp.x + s * s * g.b.x,
      y: u * u * g.a.y + 2 * u * s * g.cp.y + s * s * g.b.y,
      z: u * u * g.a.z + 2 * u * s * g.cp.z + s * s * g.b.z
    }
  }

  private suckerField(t: Tentacle): FieldPt[] {
    const g = this.geom(t)
    return [0.55, 0.7, 0.85].map((s) => this.bez(g, s))
  }

  renderData(): KrakenRenderData {
    const head = this.headField()
    const eyeOpen = this.eyeOpen || this.phase === 3
    const tentacles = this.tentacles.map((t) => {
      const g = this.geom(t)
      const points: FieldPt[] = []
      for (let i = 0; i <= 8; i++) points.push(this.bez(g, i / 8))
      const sf = this.suckerField(t)
      const suckers = sf.map((p, idx) => ({
        x: p.x,
        y: p.y,
        z: p.z,
        alive: t.suckers[idx],
        glow: t.state === 'rear' && t.suckers[idx]
      }))
      return { points, suckers }
    })
    const e = this.eyeField()
    return {
      head,
      eye: { x: e.x, y: e.y, z: e.z, r: HEAD_R * 0.4, open: eyeOpen },
      tentacles,
      phase: this.phase,
      dying: this.mode === 'dying',
      hitFlash: this.hitFlash
    }
  }

  // ── state machine ──
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
          const h = this.headField()
          const p = game.project(h.x + (Math.random() - 0.5) * 0.4, h.y + (Math.random() - 0.5) * 0.4, h.z)
          game.particles.burst(p.sx, p.sy, 6, { color: '#9ad7ff', speed: 200, life: 0.6 })
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
    for (let i = 0; i < this.tentacles.length; i++) {
      const t = this.tentacles[i]
      if (t.state !== 'rear') continue
      const sf = this.suckerField(t)
      for (let s = 0; s < sf.length; s++) {
        if (!t.suckers[s]) continue
        const p = game.project(sf[s].x, sf[s].y, sf[s].z)
        this.targets.push({ id: `t${i}s${s}`, sx: p.sx, sy: p.sy, radius: Math.max(20, p.scale * 0.085) })
      }
    }
    if (this.eyeOpen || this.phase === 3) {
      const e = this.eyeField()
      const p = game.project(e.x, e.y, e.z)
      this.targets.push({ id: 'eye', sx: p.sx, sy: p.sy, radius: Math.max(28, p.scale * 0.22) })
    }
  }

  hitTarget(id: string, dmg: number, game: IGame): number {
    if (this.mode !== 'fight') return 0
    this.hitFlash = 1
    if (id === 'eye') {
      this.hp -= dmg
      const e = this.eyeField()
      const p = game.project(e.x, e.y, e.z)
      game.particles.burst(p.sx, p.sy, 16, { color: '#ffe48a', speed: 300, life: 0.45 })
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
    const sf = this.suckerField(t)
    const p = game.project(sf[si].x, sf[si].y, sf[si].z)
    game.particles.burst(p.sx, p.sy, 12, { color: '#aef0ff', speed: 260, life: 0.35 })
    game.sfx('weak')
    if (t.allDead()) {
      t.stagger()
      this.hp -= dmg * 0.5
      game.particles.ring(p.sx, p.sy, 'rgba(180,255,255,0.9)', 14)
      game.sfx('phase')
      game.shake(8)
    }
    return dmg
  }
}
