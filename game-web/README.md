# Sea Hunter — Web Prototype (Phase 1 vertical slice)

A playable **rail-shooter vertical slice** for [Sea Hunter](../README.md): the
**Caribbean Sea**, escalating enemy waves, and the multi-phase **Young Kraken**
boss. Web-native **TypeScript + three.js (WebGL)** for the 3D underwater world,
with a 2D HUD overlay — one build for **phone and desktop**.

> This is the Phase 1 prototype from [docs/roadmap.md](../docs/roadmap.md) — the
> goal is to prove the core feel (aim, shoot, read the threat, kill the boss) on
> both touch and mouse before scaling up content.

## Run it

```bash
cd game-web
npm install
npm run dev        # opens a local dev server (Vite prints the URL)
```

Open the printed URL on your computer, or on your phone (same network) to test
touch. To make a production build:

```bash
npm run build      # type-checks (tsc) + bundles to dist/  (~13 KB gzipped)
npm run preview    # serve the production build locally
```

The build is fully static (`base: './'`), so `dist/` can be dropped onto any
static host (itch.io, GitHub Pages, Netlify, S3) and installed as a PWA-style
web game later.

## Controls

| | Desktop | Phone |
|---|---|---|
| Aim | move mouse | drag / where you tap |
| Fire | click | tap |
| Charge shot | hold, then release | hold, then release |
| Reload | `R` (auto when empty) | **R** button (bottom-left) |
| Hunter's Focus (slow-mo) | `Space` | **FOCUS** button (bottom-right) |
| Pause | `P` / `Esc` | ❚❚ button |
| Mute | `M` | ♪ button |

**How to win:** shoot the **glowing weak points**. On the Kraken, hit the
glowing **suckers** while a tentacle rears to cancel its slam; in later phases
shoot the **eye** when it opens. Shoot incoming **spiked threats** to parry them.
Keep your combo alive — misses and hits taken reset it.

## What's implemented (and where it maps to the design)

- **Cross-platform input** → `src/input.ts` (touch / mouse / keyboard → one `InputState`; [tech-design §6](../docs/technical-design.md))
- **2.5D projection / rail feel** → `src/camera.ts`, `src/background.ts`
- **Combat: aim, charge, reload, combo, parry, weak points** → `src/game.ts`, `src/player.ts`
- **Enemy archetypes** (Charger / Swarm / Shooter + Threats) → `src/enemies.ts` ([bestiary §5](../docs/bestiary.md))
- **Young Kraken** — 3-phase boss state machine, rearing tentacles, suckers, ink phase, eye → `src/kraken.ts` ([bestiary §2.1](../docs/bestiary.md))
- **Hunter's Focus** slow-motion → `src/player.ts` + `src/game.ts`
- **Scoring, combo multiplier, S–D rank** → `src/game.ts`
- **Responsive HUD + touch buttons + screens** → `src/hud.ts`
- **Level timeline** (waves → boss) → `src/level.ts`
- **Procedural audio** (no asset files) → `src/audio.ts`
- **Particles** (sparks, ink, bubbles, rings, score text) → `src/particles.ts`

## Project layout

```
src/
  main.ts        bootstrap, canvas/DPR, fixed-timestep loop
  game.ts        the scene: systems, combat resolution, scoring, draw order
  types.ts       shared types + the IGame surface entities talk back through
  camera.ts      pseudo-3D projection
  input.ts       touch/mouse/keyboard → InputState
  background.ts  parallax water, god rays, marine snow, scenery
  player.ts      harpoon gun, ammo/reload, Focus, health
  enemies.ts     Charger / Swarm / Shooter + parryable Threats
  kraken.ts      Young Kraken boss (phases, tentacles, weak points)
  level.ts       Caribbean wave timeline → boss trigger
  hud.ts         HUD, buttons, title / pause / result / game-over screens
  audio.ts       procedural Web Audio SFX
  particles.ts   screen-space particle system
```

## Dev shortcuts

- `?boss` in the URL jumps straight to the Young Kraken (skips the waves).
- `?demo` spawns one of each creature up close (for art / rendering checks).

## Notes / next steps

- Rendering is real 3D (three.js / WebGL): procedural rocky seabed, depth fog,
  animated caustics, god rays, drifting particulate, bloom, and procedurally-built
  creatures + Kraken — no external art assets. The HUD, reticle and hit-sparks are
  a 2D canvas overlay. Game logic is unchanged from the original 2D version (same
  systems in game.ts / level.ts / kraken.ts) — only the renderer (world3d.ts) is new.
- Not yet in this slice: upgrades/ship hub, the other seas, co-op, backend
  leaderboards/dailies. See [docs/roadmap.md](../docs/roadmap.md) for the plan.
