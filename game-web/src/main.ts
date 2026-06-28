import './styles.css'
import type { View } from './types'
import { Game } from './game'
import { InputManager } from './input'

const canvas = document.getElementById('game') as HTMLCanvasElement
const maybeCtx = canvas.getContext('2d', { alpha: false })
if (!maybeCtx) throw new Error('2D canvas not supported')
const ctx: CanvasRenderingContext2D = maybeCtx

const game = new Game()
const input = new InputManager()

function makeView(): View {
  const W = window.innerWidth
  const H = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  return { W, H, cx: W / 2, cy: H * 0.46, dpr, touch: input.touch }
}

let view = makeView()

function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.floor(window.innerWidth * dpr)
  canvas.height = Math.floor(window.innerHeight * dpr)
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
  view = makeView()
  game.setView(view)
}

window.addEventListener('resize', resize)
window.addEventListener('orientationchange', () => setTimeout(resize, 50))

input.attach(canvas, (x, y) => game.handleUi(x, y))
game.bindInput(input)
resize()

const STEP = 1 / 60
let last = performance.now()
let acc = 0

function frame(now: number): void {
  let dt = (now - last) / 1000
  last = now
  if (dt > 0.25) dt = 0.25 // clamp after a tab-switch / long stall

  input.update()
  if (view.touch !== input.touch) {
    view = makeView()
    game.setView(view)
  }

  acc += dt
  let steps = 0
  let firstStep = true
  while (acc >= STEP && steps < 5) {
    game.update(STEP, input)
    if (firstStep) {
      input.clearEdges() // edges are one-shot: consume them on the first sub-step only
      firstStep = false
    }
    acc -= STEP
    steps++
  }
  if (steps >= 5) acc = 0 // avoid spiral of death

  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0)
  game.draw(ctx)

  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
