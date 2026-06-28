import './styles.css'
import type { View } from './types'
import { Game } from './game'
import { InputManager } from './input'
import { World3D } from './world3d'

const webgl = document.getElementById('webgl') as HTMLCanvasElement
const hud = document.getElementById('hud') as HTMLCanvasElement
const maybeCtx = hud.getContext('2d')
if (!maybeCtx) throw new Error('2D canvas not supported')
const hudCtx: CanvasRenderingContext2D = maybeCtx

const game = new Game()
const input = new InputManager()
const world = new World3D(webgl)

function makeView(): View {
  const W = window.innerWidth
  const H = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  return { W, H, cx: W / 2, cy: H * 0.46, dpr, touch: input.touch }
}

let view = makeView()

function resize(): void {
  const W = window.innerWidth
  const H = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  hud.width = Math.floor(W * dpr)
  hud.height = Math.floor(H * dpr)
  hud.style.width = W + 'px'
  hud.style.height = H + 'px'
  world.resize(W, H, dpr)
  view = makeView()
  game.setView(view)
}

window.addEventListener('resize', resize)
window.addEventListener('orientationchange', () => setTimeout(resize, 50))

input.attach(hud, (x, y) => game.handleUi(x, y))
game.setWorld(world)
game.bindInput(input)
resize()

const STEP = 1 / 60
let last = performance.now()
let acc = 0

function frame(now: number): void {
  let dt = (now - last) / 1000
  last = now
  if (dt > 0.25) dt = 0.25

  input.update()
  if (view.touch !== input.touch) {
    view = makeView()
    game.setView(view)
  }

  acc += dt
  let steps = 0
  let first = true
  while (acc >= STEP && steps < 5) {
    game.update(STEP, input)
    if (first) {
      input.clearEdges()
      first = false
    }
    acc -= STEP
    steps++
  }
  if (steps >= 5) acc = 0

  // 3D world (WebGL) then the 2D overlay on top
  game.renderWorld(dt)
  hudCtx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0)
  hudCtx.clearRect(0, 0, view.W, view.H)
  game.drawOverlay(hudCtx)

  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
