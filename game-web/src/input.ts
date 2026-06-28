import { clamp } from './types'

// Cross-platform input. Touch, mouse and keyboard are all normalised into one
// InputState (see docs/technical-design.md §6). The game logic never asks where
// a press came from — it only reads aim + edges.

const CHARGE_FULL_MS = 650 // hold this long for a full charge shot

/** Returns true if the UI consumed the press (so it must not start aiming/firing). */
export type UiHook = (x: number, y: number) => boolean

export class InputManager {
  // continuous
  aimX = window.innerWidth / 2
  aimY = window.innerHeight / 2
  pointerDown = false
  chargeT = 0 // 0..1 while holding
  touch = false // last input was touch

  // edges (consumed + cleared each frame by the game)
  firePressed = false
  firedChargeT = 0
  reloadPressed = false
  focusPressed = false
  pausePressed = false
  mutePressed = false
  confirmPressed = false

  private activeId: number | null = null
  private downTime = 0
  private uiHook: UiHook | null = null
  onUnlock: (() => void) | null = null

  attach(el: HTMLElement, uiHook: UiHook): void {
    this.uiHook = uiHook

    el.addEventListener('pointerdown', (e) => {
      this.touch = e.pointerType === 'touch'
      this.onUnlock?.()
      const x = e.clientX
      const y = e.clientY
      this.aimX = x
      this.aimY = y
      if (this.uiHook && this.uiHook(x, y)) return // UI button handled it
      if (this.activeId === null) {
        this.activeId = e.pointerId
        this.pointerDown = true
        this.downTime = performance.now()
        this.chargeT = 0
      }
      e.preventDefault()
    })

    el.addEventListener('pointermove', (e) => {
      this.aimX = e.clientX
      this.aimY = e.clientY
    })

    const release = (e: PointerEvent, fire: boolean) => {
      if (e.pointerId !== this.activeId) return
      if (fire) {
        const held = performance.now() - this.downTime
        this.firedChargeT = clamp(held / CHARGE_FULL_MS, 0, 1)
        this.firePressed = true
      }
      this.pointerDown = false
      this.activeId = null
      this.chargeT = 0
    }
    el.addEventListener('pointerup', (e) => release(e, true))
    el.addEventListener('pointercancel', (e) => release(e, false))

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return
      this.touch = false
      this.onUnlock?.()
      switch (e.key.toLowerCase()) {
        case 'r':
          this.reloadPressed = true
          break
        case ' ':
        case 'shift':
          this.focusPressed = true
          e.preventDefault()
          break
        case 'enter':
          this.confirmPressed = true
          break
        case 'p':
        case 'escape':
          this.pausePressed = true
          break
        case 'm':
          this.mutePressed = true
          break
      }
    })

    // Right-click should not pop a context menu over the play field.
    el.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  update(): void {
    if (this.pointerDown) {
      this.chargeT = clamp((performance.now() - this.downTime) / CHARGE_FULL_MS, 0, 1)
    }
  }

  clearEdges(): void {
    this.firePressed = false
    this.reloadPressed = false
    this.focusPressed = false
    this.pausePressed = false
    this.mutePressed = false
    this.confirmPressed = false
  }
}
