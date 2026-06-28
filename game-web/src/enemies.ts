import type { IGame } from './types'

// Enemy archetypes (docs/bestiary.md §5) for the Caribbean slice:
//   Charger — rushes in and strikes on contact
//   Swarm   — weak, fast, comes in groups (combo fodder)
//   Shooter — holds at range and spits a parryable threat

export type EnemyKind = 'charger' | 'swarm' | 'shooter'

interface Config {
  hp: number
  speed: number // z units / sec
  radius: number // base half-size in px (before perspective)
  dmg: number
  color: string
  belly: string
  strikeZ: number
  holdZ?: number
  fireEvery?: number
  threatDmg?: number
}

const CONFIG: Record<EnemyKind, Config> = {
  charger: {
    hp: 3,
    speed: 0.12,
    radius: 0.22,
    dmg: 12,
    color: '#9fb4c0',
    belly: '#e8f2f6',
    strikeZ: 0.18
  },
  swarm: {
    hp: 1,
    speed: 0.17,
    radius: 0.1,
    dmg: 5,
    color: '#cf9a4e',
    belly: '#f3d79a',
    strikeZ: 0.16
  },
  shooter: {
    hp: 3,
    speed: 0.1,
    radius: 0.16,
    dmg: 0,
    color: '#c98f4e',
    belly: '#f0c27a',
    strikeZ: 0.14,
    holdZ: 0.5,
    fireEvery: 2.1,
    threatDmg: 10
  }
}

export interface HitInfo {
  weak: boolean
}

export class Enemy {
  kind: EnemyKind
  cfg: Config
  x: number
  y: number
  z = 0.96
  hp: number
  dead = false
  private t = Math.random() * 6
  private fireCd: number
  flash = 0
  telegraph = 0

  constructor(kind: EnemyKind, x: number, y: number) {
    this.kind = kind
    this.cfg = CONFIG[kind]
    this.x = x
    this.y = y
    this.hp = this.cfg.hp
    this.fireCd = this.cfg.fireEvery ?? 0
  }

  private get facing(): number {
    return this.x <= 0 ? 1 : -1
  }

  update(dt: number, game: IGame): void {
    this.t += dt
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 4)

    if (this.kind === 'shooter') {
      const hold = this.cfg.holdZ ?? 0.5
      if (this.z > hold) this.z -= this.cfg.speed * dt
      this.y += Math.sin(this.t * 1.4) * 0.04 * dt
      this.fireCd -= dt
      if (this.fireCd <= 0 && this.z <= hold + 0.02) {
        this.fireCd = this.cfg.fireEvery ?? 2
        this.telegraph = 0.4
        game.spawnThreat(this.x, this.y + 0.05, this.z, {
          speed: 0.22,
          dmg: this.cfg.threatDmg ?? 10
        })
        game.sfx('threat')
      }
      if (this.telegraph > 0) this.telegraph = Math.max(0, this.telegraph - dt)
      return
    }

    // charger / swarm: rush and strike
    this.z -= this.cfg.speed * dt
    this.y += Math.sin(this.t * 2.2) * 0.06 * dt
    if (this.z <= this.cfg.strikeZ + 0.05) this.telegraph = 1
    if (this.z <= this.cfg.strikeZ) {
      const p = game.project(this.x, this.y, this.z)
      game.damagePlayer(this.cfg.dmg)
      game.particles.burst(p.sx, p.sy, 14, { color: '#ffd2d2', speed: 320, life: 0.4 })
      this.dead = true
    }
  }

  /** Returns hit info if the aim point is over this enemy, else null. */
  hitInfo(px: number, py: number, game: IGame): HitInfo | null {
    const p = game.project(this.x, this.y, this.z)
    const r = this.cfg.radius * p.scale
    const dx = px - p.sx
    const dy = py - p.sy
    if (dx * dx + dy * dy > r * r) return null
    const ex = p.sx + this.facing * r * 0.5
    const ey = p.sy - r * 0.22
    const wr = r * 0.42
    const weak = (px - ex) * (px - ex) + (py - ey) * (py - ey) < wr * wr
    return { weak }
  }

  /** Returns true if this hit killed the enemy. */
  damage(amount: number): boolean {
    this.hp -= amount
    this.flash = 1
    if (this.hp <= 0 && !this.dead) {
      this.dead = true
      return true
    }
    return false
  }

  draw(ctx: CanvasRenderingContext2D, game: IGame): void {
    const p = game.project(this.x, this.y, this.z)
    const r = this.cfg.radius * p.scale
    if (r < 1) return
    const dir = this.facing
    const tele = this.telegraph > 0 && this.kind !== 'shooter'

    ctx.save()
    ctx.translate(p.sx, p.sy)
    ctx.scale(dir, 1)

    if (this.kind === 'shooter') this.drawPuffer(ctx, r)
    else if (this.kind === 'swarm') this.drawFish(ctx, r)
    else this.drawShark(ctx, r, tele)

    // hit flash
    if (this.flash > 0) {
      ctx.globalAlpha = this.flash * 0.7
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.restore()
  }

  private drawShark(ctx: CanvasRenderingContext2D, r: number, tele: boolean): void {
    ctx.fillStyle = this.cfg.color
    ctx.strokeStyle = tele ? '#ff5a5a' : '#062231'
    ctx.lineWidth = Math.max(1.5, r * 0.06)
    // tail
    ctx.beginPath()
    ctx.moveTo(-r * 0.7, 0)
    ctx.lineTo(-r * 1.15, -r * 0.5)
    ctx.lineTo(-r * 0.95, 0)
    ctx.lineTo(-r * 1.15, r * 0.5)
    ctx.closePath()
    ctx.fill()
    // body
    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // belly
    ctx.fillStyle = this.cfg.belly
    ctx.beginPath()
    ctx.ellipse(r * 0.1, r * 0.18, r * 0.7, r * 0.24, 0, 0, Math.PI * 2)
    ctx.fill()
    // dorsal
    ctx.fillStyle = this.cfg.color
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.45)
    ctx.lineTo(-r * 0.2, -r * 0.95)
    ctx.lineTo(r * 0.25, -r * 0.42)
    ctx.closePath()
    ctx.fill()
    // mouth
    ctx.strokeStyle = tele ? '#ff7a7a' : '#06222f'
    ctx.lineWidth = Math.max(1, r * 0.05)
    ctx.beginPath()
    ctx.moveTo(r * 0.45, r * 0.2)
    ctx.lineTo(r * 0.95, r * 0.12)
    ctx.stroke()
    // eye
    ctx.fillStyle = tele ? '#ffec8a' : '#0a1922'
    ctx.beginPath()
    ctx.arc(r * 0.55, -r * 0.16, Math.max(1.4, r * 0.09), 0, Math.PI * 2)
    ctx.fill()
  }

  private drawFish(ctx: CanvasRenderingContext2D, r: number): void {
    ctx.fillStyle = this.cfg.color
    ctx.strokeStyle = '#3a230a'
    ctx.lineWidth = Math.max(1, r * 0.08)
    ctx.beginPath()
    ctx.moveTo(-r * 0.6, 0)
    ctx.lineTo(-r, -r * 0.5)
    ctx.lineTo(-r, r * 0.5)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#1a0e02'
    ctx.beginPath()
    ctx.arc(r * 0.45, -r * 0.12, Math.max(1.2, r * 0.14), 0, Math.PI * 2)
    ctx.fill()
  }

  private drawPuffer(ctx: CanvasRenderingContext2D, r: number): void {
    const flare = this.telegraph > 0 ? 1.25 : 1
    ctx.fillStyle = this.cfg.color
    ctx.strokeStyle = this.telegraph > 0 ? '#ffd36a' : '#3a2308'
    ctx.lineWidth = Math.max(1.5, r * 0.06)
    // spikes
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7)
      ctx.lineTo(Math.cos(a) * r * flare, Math.sin(a) * r * flare)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = this.cfg.belly
    ctx.beginPath()
    ctx.arc(0, r * 0.2, r * 0.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a0e02'
    ctx.beginPath()
    ctx.arc(r * 0.28, -r * 0.16, Math.max(1.4, r * 0.12), 0, Math.PI * 2)
    ctx.arc(-r * 0.28, -r * 0.16, Math.max(1.4, r * 0.12), 0, Math.PI * 2)
    ctx.fill()
  }
}

// ── Threats: parryable incoming projectiles (shooter spit / kraken spines) ──

export class Threat {
  x: number
  y: number
  z: number
  private speed: number
  private dmg: number
  dead = false
  parried = false
  private t = Math.random() * 6

  constructor(x: number, y: number, z: number, speed: number, dmg: number) {
    this.x = x
    this.y = y
    this.z = z
    this.speed = speed
    this.dmg = dmg
  }

  update(dt: number, game: IGame): void {
    this.t += dt
    this.z -= this.speed * dt
    this.x += Math.sin(this.t * 3) * 0.02 * dt
    if (this.z <= 0.12) {
      const p = game.project(this.x, this.y, this.z)
      game.damagePlayer(this.dmg)
      game.particles.burst(p.sx, p.sy, 10, { color: '#ffb0b0', speed: 280, life: 0.35 })
      this.dead = true
    }
  }

  hitTest(px: number, py: number, game: IGame): boolean {
    const p = game.project(this.x, this.y, this.z)
    const r = 0.14 * p.scale
    const dx = px - p.sx
    const dy = py - p.sy
    return dx * dx + dy * dy <= r * r
  }

  parry(game: IGame): void {
    const p = game.project(this.x, this.y, this.z)
    this.dead = true
    this.parried = true
    game.particles.ring(p.sx, p.sy, 'rgba(255,230,150,0.9)', 10)
    game.particles.burst(p.sx, p.sy, 8, { color: '#ffe6a0', speed: 240, life: 0.3 })
    game.sfx('parry')
  }

  draw(ctx: CanvasRenderingContext2D, game: IGame): void {
    const p = game.project(this.x, this.y, this.z)
    const r = 22 * p.scale
    if (r < 1) return
    const urgency = 1 - this.z // closer = redder/bigger ring
    ctx.save()
    ctx.translate(p.sx, p.sy)
    // warning ring
    ctx.strokeStyle = `rgba(255,${120 - urgency * 80},${90 - urgency * 60},${0.5 + urgency * 0.4})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, r * (1.5 + Math.sin(this.t * 12) * 0.2), 0, Math.PI * 2)
    ctx.stroke()
    // spiky body
    ctx.rotate(this.t * 4)
    ctx.fillStyle = '#6a2233'
    ctx.strokeStyle = '#ff8a8a'
    ctx.lineWidth = Math.max(1, r * 0.12)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}
