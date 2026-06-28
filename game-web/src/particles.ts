// Lightweight screen-space particle system for hit sparks, ink, bubbles,
// expanding rings and floating score text. Kept deliberately simple and pooled-ish
// (dead particles are compacted in place) so it stays cheap on phones.

type Kind = 'spark' | 'bubble' | 'ink' | 'ring' | 'text'

interface Particle {
  alive: boolean
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  grav: number
  drag: number
  color: string
  text: string
  rot: number
  vr: number
}

const make = (): Particle => ({
  alive: false,
  kind: 'spark',
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  life: 0,
  maxLife: 1,
  size: 1,
  grav: 0,
  drag: 0,
  color: '#fff',
  text: '',
  rot: 0,
  vr: 0
})

export class ParticleSystem {
  private pool: Particle[] = []
  private cap: number

  constructor(cap = 900) {
    this.cap = cap
  }

  private obtain(): Particle | null {
    for (const p of this.pool) {
      if (!p.alive) return p
    }
    if (this.pool.length < this.cap) {
      const p = make()
      this.pool.push(p)
      return p
    }
    return null // saturated — drop the request (keeps frame time bounded)
  }

  burst(
    x: number,
    y: number,
    n: number,
    opts: { color?: string; speed?: number; size?: number; life?: number; grav?: number; spread?: number } = {}
  ): void {
    const color = opts.color ?? '#bfe9ff'
    const speed = opts.speed ?? 220
    const size = opts.size ?? 3
    const life = opts.life ?? 0.5
    const grav = opts.grav ?? 220
    const spread = opts.spread ?? Math.PI * 2
    for (let i = 0; i < n; i++) {
      const p = this.obtain()
      if (!p) return
      const a = (Math.random() - 0.5) * spread - Math.PI / 2
      const sp = speed * (0.4 + Math.random() * 0.8)
      p.alive = true
      p.kind = 'spark'
      p.x = x
      p.y = y
      p.vx = Math.cos(a) * sp
      p.vy = Math.sin(a) * sp
      p.maxLife = p.life = life * (0.6 + Math.random() * 0.8)
      p.size = size * (0.6 + Math.random() * 0.9)
      p.grav = grav
      p.drag = 1.6
      p.color = color
    }
  }

  ink(x: number, y: number, n: number, color = 'rgba(20,12,40,0.55)'): void {
    for (let i = 0; i < n; i++) {
      const p = this.obtain()
      if (!p) return
      const a = Math.random() * Math.PI * 2
      const sp = 30 + Math.random() * 90
      p.alive = true
      p.kind = 'ink'
      p.x = x
      p.y = y
      p.vx = Math.cos(a) * sp
      p.vy = Math.sin(a) * sp
      p.maxLife = p.life = 0.9 + Math.random() * 0.8
      p.size = 16 + Math.random() * 30
      p.grav = -10
      p.drag = 1.1
      p.color = color
    }
  }

  bubbles(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const p = this.obtain()
      if (!p) return
      p.alive = true
      p.kind = 'bubble'
      p.x = x + (Math.random() - 0.5) * 24
      p.y = y + (Math.random() - 0.5) * 24
      p.vx = (Math.random() - 0.5) * 30
      p.vy = -40 - Math.random() * 70
      p.maxLife = p.life = 0.8 + Math.random() * 0.9
      p.size = 1.5 + Math.random() * 4
      p.grav = -20
      p.drag = 0.6
      p.color = 'rgba(200,240,255,0.6)'
    }
  }

  ring(x: number, y: number, color = 'rgba(180,240,255,0.8)', size = 8): void {
    const p = this.obtain()
    if (!p) return
    p.alive = true
    p.kind = 'ring'
    p.x = x
    p.y = y
    p.vx = 0
    p.vy = 0
    p.maxLife = p.life = 0.35
    p.size = size
    p.grav = 0
    p.drag = 0
    p.color = color
  }

  floatText(x: number, y: number, text: string, color = '#ffe6a0'): void {
    const p = this.obtain()
    if (!p) return
    p.alive = true
    p.kind = 'text'
    p.x = x
    p.y = y
    p.vx = 0
    p.vy = -46
    p.maxLife = p.life = 0.9
    p.size = 1
    p.grav = 0
    p.drag = 0.2
    p.color = color
    p.text = text
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.alive) continue
      p.life -= dt
      if (p.life <= 0) {
        p.alive = false
        continue
      }
      p.vx -= p.vx * p.drag * dt
      p.vy -= p.vy * p.drag * dt
      p.vy += p.grav * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.vr * dt
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.pool) {
      if (!p.alive) continue
      const t = p.life / p.maxLife
      switch (p.kind) {
        case 'spark': {
          ctx.globalAlpha = Math.min(1, t * 1.4)
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * (0.4 + t * 0.8), 0, Math.PI * 2)
          ctx.fill()
          break
        }
        case 'bubble': {
          ctx.globalAlpha = Math.min(0.7, t)
          ctx.strokeStyle = p.color
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.stroke()
          break
        }
        case 'ink': {
          ctx.globalAlpha = t * 0.5
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * (0.6 + (1 - t) * 0.8), 0, Math.PI * 2)
          ctx.fill()
          break
        }
        case 'ring': {
          const r = p.size + (1 - t) * 60
          ctx.globalAlpha = t
          ctx.strokeStyle = p.color
          ctx.lineWidth = 3 * t + 0.5
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.stroke()
          break
        }
        case 'text': {
          ctx.globalAlpha = Math.min(1, t * 1.6)
          ctx.fillStyle = p.color
          ctx.font = '700 22px ui-sans-serif, system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(p.text, p.x, p.y)
          break
        }
      }
    }
    ctx.globalAlpha = 1
  }
}
