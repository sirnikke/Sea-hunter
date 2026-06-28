import type { ParticleSystem } from './particles'

export interface Vec2 {
  x: number
  y: number
}

/** Screen-space projection of a world point. */
export interface Projected {
  sx: number
  sy: number
  scale: number
}

export interface View {
  W: number
  H: number
  cx: number
  cy: number
  dpr: number
  /** true when the active input is touch (drives the on-screen control hints). */
  touch: boolean
}

export type SfxName =
  | 'shoot'
  | 'chargeShot'
  | 'hit'
  | 'weak'
  | 'kill'
  | 'hurt'
  | 'reload'
  | 'empty'
  | 'focus'
  | 'bossRoar'
  | 'phase'
  | 'threat'
  | 'parry'
  | 'ui'

/** A shootable circle in screen space (boss weak points). */
export interface WeakTarget {
  id: string
  sx: number
  sy: number
  radius: number
}

/**
 * The surface that entities use to talk back to the scene.
 * Declared as an interface so entities don't import the concrete Game (avoids cycles).
 * Mirrors the "systems" boundary from docs/technical-design.md.
 */
export interface IGame {
  readonly view: View
  readonly particles: ParticleSystem
  readonly elapsed: number
  project(x: number, y: number, z: number): Projected
  spawnThreat(x: number, y: number, z: number, opts?: { speed?: number; dmg?: number }): void
  spawnSwarm(count: number): void
  damagePlayer(amount: number): void
  sfx(name: SfxName): void
  shake(amount: number): void
}

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export const dist2 = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}
