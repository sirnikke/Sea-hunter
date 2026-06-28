import type { Projected, View } from './types'

// Pseudo-3D "into the screen" projection. Entities live in a normalised water
// column (x,y in roughly [-1,1]) at depth z (≈0.05 near … 1.0 far). As z shrinks
// they scale up and spread out from the vanishing point — the cheap 2.5D look
// from docs/technical-design.md §3.

export const NEAR_Z = 0.16

export function projectWith(view: View, x: number, y: number, z: number): Projected {
  const scale = NEAR_Z / (z < 0.04 ? 0.04 : z)
  return {
    sx: view.cx + x * view.W * 0.6 * scale,
    sy: view.cy + y * view.H * 0.62 * scale,
    scale
  }
}
