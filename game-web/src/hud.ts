import type { View } from './types'
import { clamp } from './types'

export type GameState = 'title' | 'playing' | 'paused' | 'result' | 'gameover'
export type UiButton = 'reload' | 'focus' | 'pause' | 'mute'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface HudData {
  state: GameState
  hp: number
  maxHp: number
  ammo: number
  maxAmmo: number
  reloading: boolean
  reloadFrac: number
  focus: number
  maxFocus: number
  focusActive: boolean
  combo: number
  score: number
  best: number
  bannerText: string
  bannerAlpha: number
  boss: { name: string; hpFrac: number; phase: number; intro: boolean } | null
  touch: boolean
  muted: boolean
  rank: string
}

export class Hud {
  private layout(): Record<UiButton, Rect> {
    const W = window.innerWidth
    const H = window.innerHeight
    const d = Math.max(58, Math.min(W, H) * 0.12)
    const m = Math.max(14, Math.min(W, H) * 0.03)
    const small = Math.max(40, Math.min(W, H) * 0.075)
    return {
      reload: { x: m, y: H - d - m, w: d, h: d },
      focus: { x: W - d - m, y: H - d - m, w: d, h: d },
      pause: { x: W - small - m, y: m, w: small, h: small },
      mute: { x: W - small * 2 - m * 1.6, y: m, w: small, h: small }
    }
  }

  private inside(x: number, y: number, r: Rect): boolean {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
  }

  hitButton(x: number, y: number, state: GameState): UiButton | null {
    const L = this.layout()
    if (this.inside(x, y, L.mute)) return 'mute'
    if (state === 'playing') {
      if (this.inside(x, y, L.pause)) return 'pause'
      if (this.inside(x, y, L.reload)) return 'reload'
      if (this.inside(x, y, L.focus)) return 'focus'
    }
    return null
  }

  draw(ctx: CanvasRenderingContext2D, view: View, d: HudData): void {
    if (d.state === 'playing' || d.state === 'paused') this.drawPlayHud(ctx, view, d)
    this.drawTopButtons(ctx, d)

    switch (d.state) {
      case 'title':
        this.drawTitle(ctx, view, d)
        break
      case 'paused':
        this.overlay(ctx, view, 'PAUSED', 'Tap / press P to resume', '#bfe9ff', d)
        break
      case 'result':
        this.drawResult(ctx, view, d)
        break
      case 'gameover':
        this.overlay(ctx, view, 'DRAGGED UNDER', `Score ${d.score}  ·  Tap to try again`, '#ff9a9a', d)
        break
    }
  }

  private drawPlayHud(ctx: CanvasRenderingContext2D, view: View, d: HudData): void {
    const { W } = view
    const m = Math.max(14, Math.min(view.W, view.H) * 0.03)

    // Health bar (top-left)
    const hw = Math.min(280, W * 0.4)
    const hh = 16
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    this.roundRect(ctx, m, m, hw, hh, 6)
    ctx.fill()
    const hpFrac = clamp(d.hp / d.maxHp, 0, 1)
    ctx.fillStyle = hpFrac > 0.3 ? '#46d6a0' : '#ff5a5a'
    this.roundRect(ctx, m, m, hw * hpFrac, hh, 6)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 1.5
    this.roundRect(ctx, m, m, hw, hh, 6)
    ctx.stroke()
    ctx.fillStyle = '#dff3ff'
    ctx.font = '700 12px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('HULL', m + 4, m + hh + 14)

    // Score + combo (top-center)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#eaf6ff'
    ctx.font = '700 20px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(String(d.score).padStart(6, '0'), view.cx, m + 18)
    if (d.combo > 1) {
      ctx.fillStyle = d.combo >= 8 ? '#ffd166' : '#bfe9ff'
      ctx.font = `800 ${22 + Math.min(18, d.combo)}px ui-sans-serif, system-ui, sans-serif`
      ctx.fillText(`x${d.combo}`, view.cx, m + 44)
    }

    // Ammo pips (above reload button)
    const L = this.layout()
    const pipR = 5
    const pipY = L.reload.y - 16
    const totalW = (d.maxAmmo - 1) * 16
    for (let i = 0; i < d.maxAmmo; i++) {
      const x = L.reload.x + L.reload.w / 2 - totalW / 2 + i * 16
      ctx.beginPath()
      ctx.arc(x, pipY, pipR, 0, Math.PI * 2)
      ctx.fillStyle = i < d.ammo ? '#cfe8f2' : 'rgba(255,255,255,0.18)'
      ctx.fill()
    }

    // Reload button
    this.drawCircleButton(ctx, L.reload, d.reloading ? '…' : 'R', '#1a4a5e', d.reloading)
    if (d.reloading) {
      ctx.strokeStyle = '#ffd166'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(
        L.reload.x + L.reload.w / 2,
        L.reload.y + L.reload.h / 2,
        L.reload.w / 2 - 4,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * d.reloadFrac
      )
      ctx.stroke()
    }

    // Focus button + meter
    const ready = d.focus >= d.maxFocus
    this.drawCircleButton(
      ctx,
      L.focus,
      'FOCUS',
      d.focusActive ? '#6a3aa0' : ready ? '#2a6a8a' : '#13323f',
      d.focusActive || ready
    )
    ctx.strokeStyle = d.focusActive ? '#caa6ff' : '#7fe0ff'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(
      L.focus.x + L.focus.w / 2,
      L.focus.y + L.focus.h / 2,
      L.focus.w / 2 - 4,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * clamp(d.focus / d.maxFocus, 0, 1)
    )
    ctx.stroke()

    // Boss bar (top)
    if (d.boss && !d.boss.intro) {
      const bw = Math.min(520, W * 0.7)
      const bx = view.cx - bw / 2
      const by = m + 56
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      this.roundRect(ctx, bx, by, bw, 12, 6)
      ctx.fill()
      ctx.fillStyle = '#b14ad0'
      this.roundRect(ctx, bx, by, bw * d.boss.hpFrac, 12, 6)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 1.5
      this.roundRect(ctx, bx, by, bw, 12, 6)
      ctx.stroke()
      ctx.fillStyle = '#f0d9ff'
      ctx.font = '700 13px ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${d.boss.name}  ·  PHASE ${d.boss.phase}`, view.cx, by - 6)
    }

    // Banner
    if (d.bannerAlpha > 0 && d.bannerText) {
      ctx.globalAlpha = d.bannerAlpha
      ctx.fillStyle = '#eaf6ff'
      ctx.font = `800 ${Math.max(26, view.W * 0.045)}px ui-sans-serif, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(d.bannerText, view.cx, view.H * 0.3)
      ctx.globalAlpha = 1
    }
  }

  private drawTopButtons(ctx: CanvasRenderingContext2D, d: HudData): void {
    const L = this.layout()
    this.drawCircleButton(ctx, L.mute, d.muted ? 'MUTE' : '♪', '#13323f', false)
    if (d.state === 'playing') this.drawCircleButton(ctx, L.pause, '❚❚', '#13323f', false)
  }

  private drawCircleButton(ctx: CanvasRenderingContext2D, r: Rect, label: string, fill: string, glow: boolean): void {
    const cx = r.x + r.w / 2
    const cy = r.y + r.h / 2
    if (glow) {
      ctx.shadowColor = '#7fe0ff'
      ctx.shadowBlur = 18
    }
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.arc(cx, cy, r.w / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, r.w / 2, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#eaf6ff'
    ctx.font = `700 ${Math.max(11, r.w * 0.22)}px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, cx, cy)
    ctx.textBaseline = 'alphabetic'
  }

  private drawTitle(ctx: CanvasRenderingContext2D, view: View, d: HudData): void {
    this.dim(ctx, view, 0.45)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#eaf6ff'
    ctx.font = `900 ${Math.max(42, view.W * 0.085)}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillText('SEA HUNTER', view.cx, view.H * 0.34)
    ctx.fillStyle = '#7fe0ff'
    ctx.font = `600 ${Math.max(16, view.W * 0.026)}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillText('Caribbean Sea — hunt the Young Kraken', view.cx, view.H * 0.34 + Math.max(34, view.W * 0.05))

    const cta = d.touch ? 'Tap to dive' : 'Click to dive'
    ctx.fillStyle = '#eaf6ff'
    ctx.font = `700 ${Math.max(20, view.W * 0.03)}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillText(cta, view.cx, view.H * 0.56)

    const hint = d.touch
      ? 'Tap to fire · hold to charge · buttons reload / Focus'
      : 'Aim mouse · click to fire · hold to charge · R reload · Space Focus'
    ctx.fillStyle = 'rgba(220,240,255,0.7)'
    ctx.font = `500 ${Math.max(12, view.W * 0.018)}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillText(hint, view.cx, view.H * 0.56 + 30)
    ctx.fillText('Shoot the glowing weak points. Shoot incoming spiked threats to parry.', view.cx, view.H * 0.56 + 52)
  }

  private drawResult(ctx: CanvasRenderingContext2D, view: View, d: HudData): void {
    this.dim(ctx, view, 0.55)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffe49a'
    ctx.font = `900 ${Math.max(40, view.W * 0.075)}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillText('KRAKEN SLAIN', view.cx, view.H * 0.32)
    ctx.fillStyle = '#eaf6ff'
    ctx.font = `800 ${Math.max(60, view.W * 0.12)}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillText(d.rank, view.cx, view.H * 0.5)
    ctx.font = `700 ${Math.max(18, view.W * 0.026)}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillText(`Score ${d.score}` + (d.score >= d.best ? '  ·  NEW BEST!' : `  ·  Best ${d.best}`), view.cx, view.H * 0.6)
    ctx.fillStyle = '#7fe0ff'
    ctx.fillText('Tap to hunt again', view.cx, view.H * 0.7)
  }

  private overlay(ctx: CanvasRenderingContext2D, view: View, title: string, sub: string, color: string, d: HudData): void {
    this.dim(ctx, view, 0.5)
    ctx.textAlign = 'center'
    ctx.fillStyle = color
    ctx.font = `900 ${Math.max(40, view.W * 0.07)}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillText(title, view.cx, view.H * 0.42)
    ctx.fillStyle = '#eaf6ff'
    ctx.font = `600 ${Math.max(16, view.W * 0.024)}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillText(sub, view.cx, view.H * 0.52)
  }

  private dim(ctx: CanvasRenderingContext2D, view: View, a: number): void {
    ctx.fillStyle = `rgba(2,15,25,${a})`
    ctx.fillRect(0, 0, view.W, view.H)
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
  }
}
