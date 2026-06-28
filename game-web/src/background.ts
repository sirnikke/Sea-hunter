import type { View } from './types'
import { projectWith } from './camera'

// Parallax atmosphere: sunlit gradient, drifting god rays, marine snow and
// scenery silhouettes that rush past to sell the on-rails forward motion.

interface Snow {
  x: number
  y: number
  z: number
}
interface Scenery {
  x: number
  y: number
  z: number
  type: number
  seed: number
}

export class Background {
  private snow: Snow[] = []
  private scenery: Scenery[] = []
  private t = 0

  constructor() {
    for (let i = 0; i < 110; i++) this.snow.push(this.newSnow(0.05 + Math.random() * 0.95))
    for (let i = 0; i < 8; i++) this.scenery.push(this.newScenery(0.2 + Math.random() * 0.8))
  }

  private newSnow(z: number): Snow {
    return { x: (Math.random() - 0.5) * 2.4, y: (Math.random() - 0.5) * 1.8, z }
  }
  private newScenery(z: number): Scenery {
    return {
      x: (Math.random() < 0.5 ? -1 : 1) * (0.45 + Math.random() * 0.7),
      y: 0.7 + Math.random() * 0.25,
      z,
      type: Math.floor(Math.random() * 2),
      seed: Math.random() * 1000
    }
  }

  update(dt: number, speed: number): void {
    this.t += dt
    for (const s of this.snow) {
      s.z -= dt * (0.12 + speed * 0.5)
      s.y += dt * 0.05
      if (s.z <= 0.05) {
        const n = this.newSnow(0.9 + Math.random() * 0.1)
        s.x = n.x
        s.y = n.y
        s.z = n.z
      }
    }
    for (const s of this.scenery) {
      s.z -= dt * (0.04 + speed * 0.22)
      if (s.z <= 0.06) {
        const n = this.newScenery(0.95)
        s.x = n.x
        s.y = n.y
        s.z = n.z
        s.type = n.type
        s.seed = n.seed
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, view: View): void {
    const { W, H } = view

    // Water column gradient
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#1f7fa8')
    g.addColorStop(0.32, '#0d5a82')
    g.addColorStop(0.62, '#073f5f')
    g.addColorStop(1, '#021f30')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    // God rays from the surface
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 6; i++) {
      const phase = this.t * 0.12 + i * 1.7
      const x = view.cx + Math.sin(phase) * W * 0.42 + (i - 3) * W * 0.12
      const w = W * (0.05 + 0.03 * (1 + Math.sin(phase * 0.7)))
      const rg = ctx.createLinearGradient(x, 0, x + W * 0.15, H * 0.85)
      rg.addColorStop(0, 'rgba(180,235,255,0.10)')
      rg.addColorStop(1, 'rgba(180,235,255,0)')
      ctx.fillStyle = rg
      ctx.beginPath()
      ctx.moveTo(x - w, 0)
      ctx.lineTo(x + w, 0)
      ctx.lineTo(x + w + W * 0.18, H * 0.9)
      ctx.lineTo(x - w + W * 0.05, H * 0.9)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()

    // Scenery silhouettes (coral / wreck) behind the action
    for (const s of this.scenery) {
      const p = projectWith(view, s.x, s.y, s.z)
      const a = Math.min(0.5, (1 - s.z) * 0.6)
      ctx.globalAlpha = a
      ctx.fillStyle = '#02212f'
      if (s.type === 0) this.drawCoral(ctx, p.sx, p.sy, 70 * p.scale, s.seed)
      else this.drawWreck(ctx, p.sx, p.sy, 90 * p.scale, s.seed)
    }
    ctx.globalAlpha = 1

    // Marine snow
    ctx.fillStyle = 'rgba(210,240,255,0.6)'
    for (const s of this.snow) {
      const p = projectWith(view, s.x, s.y, s.z)
      const r = 1.4 * p.scale
      if (r < 0.2) continue
      ctx.globalAlpha = Math.min(0.6, (1 - s.z) * 0.7)
      ctx.beginPath()
      ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  private drawCoral(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, seed: number): void {
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.4 + Math.sin(seed + i) * 0.1
      const len = s * (0.7 + ((seed * (i + 1)) % 1) * 0.6)
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
    }
    ctx.lineWidth = Math.max(2, s * 0.18)
    ctx.strokeStyle = '#02212f'
    ctx.stroke()
  }

  private drawWreck(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, seed: number): void {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.sin(seed) * 0.2)
    ctx.beginPath()
    ctx.moveTo(-s, 0)
    ctx.quadraticCurveTo(-s * 0.6, s * 0.5, s * 0.9, s * 0.25)
    ctx.lineTo(s, -s * 0.1)
    ctx.lineTo(-s * 0.7, -s * 0.35)
    ctx.closePath()
    ctx.fill()
    // mast
    ctx.fillRect(-s * 0.1, -s * 0.9, s * 0.08, s * 0.8)
    ctx.restore()
  }
}
