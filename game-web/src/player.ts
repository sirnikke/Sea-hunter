import type { View } from './types'
import { clamp } from './types'

// The hunter: harpoon gun (magazine + reload), health, and the Hunter's Focus
// slow-motion ability. Reticle and harpoon beam are drawn by the scene (game.ts)
// because they depend on what's under the aim.

export class Player {
  hp = 100
  maxHp = 100

  ammo = 6
  maxAmmo = 6
  reloading = false
  private reloadT = 0
  reloadDur = 0.9

  focus = 0
  maxFocus = 100
  focusActive = false
  focusT = 0
  focusDur = 3.2

  hurtFlash = 0
  recoil = 0

  // last beam (set by the scene on a successful/empty shot, drawn for a few frames)
  beamT = 0
  beamX = 0
  beamY = 0
  beamCharge = false

  get dead(): boolean {
    return this.hp <= 0
  }

  get reloadFrac(): number {
    return this.reloading ? clamp(1 - this.reloadT / this.reloadDur, 0, 1) : 1
  }

  update(dt: number): void {
    if (this.reloading) {
      this.reloadT -= dt
      if (this.reloadT <= 0) {
        this.reloading = false
        this.ammo = this.maxAmmo
      }
    }
    if (this.focusActive) {
      this.focusT -= dt
      if (this.focusT <= 0) this.focusActive = false
    }
    if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - dt * 2.2)
    if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - dt * 6)
    if (this.beamT > 0) this.beamT = Math.max(0, this.beamT - dt * 12)
  }

  canFire(): boolean {
    return !this.reloading && this.ammo > 0
  }

  fire(charge: boolean, tx: number, ty: number): void {
    this.ammo--
    this.recoil = 1
    this.beamT = 1
    this.beamX = tx
    this.beamY = ty
    this.beamCharge = charge
    if (this.ammo <= 0) this.startReload()
  }

  startReload(): void {
    if (this.reloading || this.ammo === this.maxAmmo) return
    this.reloading = true
    this.reloadT = this.reloadDur
  }

  addFocus(n: number): void {
    if (!this.focusActive) this.focus = clamp(this.focus + n, 0, this.maxFocus)
  }

  /** Returns true if Focus actually activated. */
  activateFocus(): boolean {
    if (this.focusActive || this.focus < this.maxFocus) return false
    this.focusActive = true
    this.focusT = this.focusDur
    this.focus = 0
    return true
  }

  hurt(amount: number): void {
    this.hp = clamp(this.hp - amount, 0, this.maxHp)
    this.hurtFlash = 1
  }

  muzzle(view: View): { x: number; y: number } {
    return { x: view.cx, y: view.H - 8 - this.recoil * 10 }
  }

  drawGun(ctx: CanvasRenderingContext2D, view: View): void {
    const { cx, H } = view
    const y = H - this.recoil * 12
    ctx.save()
    ctx.translate(cx, y)
    // barrel
    ctx.fillStyle = '#13323f'
    ctx.strokeStyle = '#0a2531'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-26, 40)
    ctx.lineTo(-10, -34)
    ctx.lineTo(10, -34)
    ctx.lineTo(26, 40)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // loaded harpoon
    ctx.strokeStyle = this.ammo > 0 ? '#cfe8f2' : '#3a4a52'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(0, 36)
    ctx.lineTo(0, -52)
    ctx.stroke()
    if (this.ammo > 0) {
      ctx.fillStyle = '#cfe8f2'
      ctx.beginPath()
      ctx.moveTo(0, -64)
      ctx.lineTo(-7, -48)
      ctx.lineTo(7, -48)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }
}
