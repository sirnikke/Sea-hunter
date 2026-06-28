import type { IGame, Projected, SfxName, View } from './types'
import { clamp, dist2, lerp } from './types'
import { projectWith } from './camera'
import { ParticleSystem } from './particles'
import { AudioEngine } from './audio'
import { InputManager } from './input'
import { Background } from './background'
import { Player } from './player'
import { Enemy, Threat, type EnemyKind } from './enemies'
import { Kraken } from './kraken'
import { LevelDirector } from './level'
import { Hud, type GameState, type HudData, type UiButton } from './hud'

const BEST_KEY = 'seahunter_best'

export class Game implements IGame {
  view: View = { W: 1, H: 1, cx: 0.5, cy: 0.5, dpr: 1, touch: false }
  readonly particles = new ParticleSystem()
  private readonly audio = new AudioEngine()
  private readonly background = new Background()
  private readonly hud = new Hud()

  private input!: InputManager
  state: GameState = 'title'

  private player = new Player()
  private enemies: Enemy[] = []
  private threats: Threat[] = []
  private boss: Kraken | null = null
  private level!: LevelDirector

  private time = 0
  private score = 0
  private best = 0
  private combo = 0
  private maxCombo = 0
  private shots = 0
  private hits = 0
  private damageTaken = 0
  private shakeAmt = 0
  private timeScale = 1
  private muted = false
  private debugBoss = false

  get elapsed(): number {
    return this.time
  }

  bindInput(input: InputManager): void {
    this.input = input
    input.onUnlock = () => this.audio.resume()
    try {
      this.best = Number(localStorage.getItem(BEST_KEY)) || 0
    } catch {
      this.best = 0
    }
    try {
      this.debugBoss = new URLSearchParams(location.search).has('boss')
    } catch {
      this.debugBoss = false
    }
    this.resetRun()
  }

  setView(view: View): void {
    this.view = view
  }

  /** UI-hook for InputManager: returns true if a press hit a HUD button. */
  handleUi(x: number, y: number): boolean {
    const b = this.hud.hitButton(x, y, this.state)
    if (!b) return false
    this.onUiButton(b)
    return true
  }

  private onUiButton(b: UiButton): void {
    this.audio.resume()
    switch (b) {
      case 'mute':
        this.muted = this.audio.toggleMute()
        break
      case 'pause':
        this.togglePause()
        break
      case 'reload':
        this.tryReload()
        break
      case 'focus':
        if (this.player.activateFocus()) this.sfx('focus')
        break
    }
  }

  // ── IGame surface ──
  project(x: number, y: number, z: number): Projected {
    return projectWith(this.view, x, y, z)
  }
  sfx(name: SfxName): void {
    this.audio.play(name)
  }
  shake(amount: number): void {
    this.shakeAmt = Math.max(this.shakeAmt, amount)
  }
  spawnThreat(x: number, y: number, z: number, opts?: { speed?: number; dmg?: number }): void {
    this.threats.push(new Threat(x, y, z, opts?.speed ?? 0.22, opts?.dmg ?? 10))
  }
  spawnSwarm(count: number): void {
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 1.2
      const y = (Math.random() - 0.5) * 0.6
      this.enemies.push(new Enemy('swarm', x, y))
    }
  }
  damagePlayer(amount: number): void {
    if (this.state !== 'playing') return
    this.player.hurt(amount)
    this.damageTaken += amount
    this.combo = 0
    this.sfx('hurt')
    this.shake(6 + amount * 0.4)
    if (this.player.dead) this.gameOver()
  }

  // ── lifecycle ──
  private resetRun(): void {
    this.player = new Player()
    this.enemies = []
    this.threats = []
    this.boss = null
    this.time = 0
    this.score = 0
    this.combo = 0
    this.maxCombo = 0
    this.shots = 0
    this.hits = 0
    this.damageTaken = 0
    this.shakeAmt = 0
    this.level = new LevelDirector(
      (k: EnemyKind, x: number, y: number) => this.enemies.push(new Enemy(k, x, y)),
      () => this.startBoss()
    )
  }

  private startRun(): void {
    this.resetRun()
    this.state = 'playing'
    if (this.debugBoss) this.startBoss() // dev: ?boss in the URL jumps straight to the Kraken
  }

  private startBoss(): void {
    this.level.bossStarted = true // halt wave spawning (also covers the ?boss dev shortcut)
    this.enemies = []
    this.threats = []
    this.boss = new Kraken()
  }

  private win(): void {
    if (this.state !== 'playing') return
    this.state = 'result'
    this.commitBest()
  }
  private gameOver(): void {
    this.state = 'gameover'
    this.commitBest()
  }
  private commitBest(): void {
    if (this.score > this.best) {
      this.best = this.score
      try {
        localStorage.setItem(BEST_KEY, String(this.best))
      } catch {
        /* ignore */
      }
    }
  }

  private togglePause(): void {
    if (this.state === 'playing') this.state = 'paused'
    else if (this.state === 'paused') this.state = 'playing'
  }
  private tryReload(): void {
    if (!this.player.reloading && this.player.ammo < this.player.maxAmmo) {
      this.player.startReload()
      this.sfx('reload')
    }
  }
  private onConfirm(): void {
    if (this.state === 'paused') this.state = 'playing'
    else this.startRun()
  }

  // ── update ──
  update(realDt: number, input: InputManager): void {
    this.input = input
    this.shakeAmt = Math.max(0, this.shakeAmt - realDt * 40)
    if (input.mutePressed) this.muted = this.audio.toggleMute()

    this.timeScale = this.state === 'playing' && this.player.focusActive ? 0.4 : 1
    const gdt = realDt * this.timeScale

    const playing = this.state === 'playing'
    this.background.update(playing ? gdt : realDt * 0.4, playing ? 0.5 : 0.12)
    this.particles.update(playing ? gdt : realDt)

    if (input.pausePressed && (this.state === 'playing' || this.state === 'paused')) this.togglePause()

    if (this.state !== 'playing') {
      if (input.firePressed || input.confirmPressed) this.onConfirm()
      return
    }

    this.time += realDt
    this.player.update(realDt)
    this.level.update(gdt)

    for (const e of this.enemies) e.update(gdt, this)
    this.enemies = this.enemies.filter((e) => !e.dead)
    for (const t of this.threats) t.update(gdt, this)
    this.threats = this.threats.filter((t) => !t.dead)
    if (this.boss) this.boss.update(gdt, this)

    if (input.reloadPressed) this.tryReload()
    if (input.focusPressed && this.player.activateFocus()) this.sfx('focus')
    if (input.firePressed) this.resolveFire()

    if (this.boss && this.boss.dead) this.win()
  }

  private mult(): number {
    return 1 + Math.min(this.combo, 30) * 0.1
  }
  private registerHit(): void {
    this.combo++
    this.hits++
    if (this.combo > this.maxCombo) this.maxCombo = this.combo
  }

  private resolveFire(): void {
    if (!this.player.canFire()) {
      this.sfx('empty')
      return
    }
    const ax = this.input.aimX
    const ay = this.input.aimY
    const charge = this.input.firedChargeT >= 0.45
    const dmg = charge ? 22 + this.input.firedChargeT * 22 : 14

    this.player.fire(charge, ax, ay)
    this.shots++
    this.sfx(charge ? 'chargeShot' : 'shoot')

    if (this.hitThreat(ax, ay)) return
    if (this.boss && this.hitBoss(ax, ay, dmg)) return
    if (this.hitEnemy(ax, ay, dmg)) return

    // clean miss → combo break
    this.combo = 0
    this.particles.burst(ax, ay, 4, { color: 'rgba(180,220,255,0.5)', speed: 110, life: 0.18, grav: 0 })
  }

  private hitThreat(ax: number, ay: number): boolean {
    let best: Threat | null = null
    let bestD = Infinity
    for (const t of this.threats) {
      if (!t.hitTest(ax, ay, this)) continue
      const p = this.project(t.x, t.y, t.z)
      const d = dist2(ax, ay, p.sx, p.sy)
      if (d < bestD) {
        bestD = d
        best = t
      }
    }
    if (!best) return false
    best.parry(this)
    this.registerHit()
    this.score += Math.round(120 * this.mult())
    this.player.addFocus(16)
    this.particles.floatText(ax, ay - 12, 'PARRY', '#ffe6a0')
    return true
  }

  private hitBoss(ax: number, ay: number, dmg: number): boolean {
    const boss = this.boss
    if (!boss || boss.targets.length === 0) return false
    let bestId: string | null = null
    let bestD = Infinity
    let bestX = ax
    let bestY = ay
    for (const tg of boss.targets) {
      const d = dist2(ax, ay, tg.sx, tg.sy)
      if (d <= tg.radius * tg.radius && d < bestD) {
        bestD = d
        bestId = tg.id
        bestX = tg.sx
        bestY = tg.sy
      }
    }
    if (!bestId) return false
    boss.hitTarget(bestId, dmg, this)
    this.registerHit()
    const eye = bestId === 'eye'
    this.player.addFocus(eye ? 14 : 10)
    this.score += Math.round((eye ? 200 : 120) * this.mult())
    this.particles.floatText(bestX, bestY - 12, eye ? 'EYE!' : 'WEAK', '#aef0ff')
    return true
  }

  private hitEnemy(ax: number, ay: number, dmg: number): boolean {
    let best: Enemy | null = null
    let bestWeak = false
    let bestZ = Infinity
    for (const e of this.enemies) {
      const info = e.hitInfo(ax, ay, this)
      if (info && e.z < bestZ) {
        bestZ = e.z
        best = e
        bestWeak = info.weak
      }
    }
    if (!best) return false
    const p = this.project(best.x, best.y, best.z)
    const died = best.damage(dmg * (bestWeak ? 2 : 1))
    this.registerHit()
    if (bestWeak) {
      this.sfx('weak')
      this.particles.floatText(ax, ay - 12, 'WEAK', '#ffe48a')
    } else {
      this.sfx('hit')
    }
    this.particles.burst(p.sx, p.sy, bestWeak ? 12 : 6, {
      color: bestWeak ? '#ffe48a' : '#bfe9ff',
      speed: 220,
      life: 0.3
    })
    if (died) {
      this.sfx('kill')
      this.player.addFocus(10)
      this.particles.bubbles(p.sx, p.sy, 8)
      this.particles.ring(p.sx, p.sy, 'rgba(191,233,255,0.85)', 8)
      const pts = Math.round(150 * this.mult())
      this.score += pts
      this.particles.floatText(p.sx, p.sy - 20, '+' + pts)
    } else {
      this.player.addFocus(5)
      this.score += Math.round(30 * this.mult())
    }
    return true
  }

  // ── draw ──
  draw(ctx: CanvasRenderingContext2D): void {
    const view = this.view
    ctx.save()
    if (this.shakeAmt > 0.3) {
      ctx.translate((Math.random() - 0.5) * this.shakeAmt, (Math.random() - 0.5) * this.shakeAmt)
    }

    this.background.draw(ctx, view)

    if (this.boss) this.boss.draw(ctx, this)
    const ents: (Enemy | Threat)[] = [...this.enemies, ...this.threats]
    ents.sort((a, b) => b.z - a.z)
    for (const e of ents) e.draw(ctx, this)

    if (this.boss && this.boss.ink > 0.01) this.drawInk(ctx, view, this.boss.ink)

    if (this.state === 'playing' || this.state === 'paused') {
      this.drawBeam(ctx)
      this.player.drawGun(ctx, view)
    }
    this.particles.draw(ctx)
    if (this.state === 'playing') this.drawReticle(ctx)

    ctx.restore()

    if (this.player.hurtFlash > 0) this.drawHurt(ctx, view)
    this.hud.draw(ctx, view, this.hudData())
  }

  private drawInk(ctx: CanvasRenderingContext2D, view: View, ink: number): void {
    const g = ctx.createRadialGradient(view.cx, view.H * 0.28, view.H * 0.1, view.cx, view.H * 0.5, view.H * 0.9)
    g.addColorStop(0, `rgba(4,2,12,${ink * 0.15})`)
    g.addColorStop(1, `rgba(4,2,12,${ink * 0.85})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, view.W, view.H)
  }

  private drawBeam(ctx: CanvasRenderingContext2D): void {
    const p = this.player
    if (p.beamT <= 0) return
    const m = p.muzzle(this.view)
    ctx.globalAlpha = p.beamT
    ctx.strokeStyle = p.beamCharge ? '#ffd166' : '#cfe8f2'
    ctx.lineWidth = p.beamCharge ? 5 : 3
    ctx.beginPath()
    ctx.moveTo(m.x, m.y)
    ctx.lineTo(p.beamX, p.beamY)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  private drawReticle(ctx: CanvasRenderingContext2D): void {
    const x = this.input.aimX
    const y = this.input.aimY
    const over = this.aimOverTarget(x, y)
    const col = over ? '#ffe48a' : '#bfe9ff'
    ctx.strokeStyle = col
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 16, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x - 22, y)
    ctx.lineTo(x - 8, y)
    ctx.moveTo(x + 8, y)
    ctx.lineTo(x + 22, y)
    ctx.moveTo(x, y - 22)
    ctx.lineTo(x, y - 8)
    ctx.moveTo(x, y + 8)
    ctx.lineTo(x, y + 22)
    ctx.stroke()
    const c = this.input.chargeT
    if (c > 0.05) {
      ctx.strokeStyle = c >= 0.45 ? '#ffd166' : '#7fe0ff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(x, y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * c)
      ctx.stroke()
    }
  }

  private aimOverTarget(x: number, y: number): boolean {
    if (this.boss) {
      for (const tg of this.boss.targets) {
        if (dist2(x, y, tg.sx, tg.sy) <= tg.radius * tg.radius) return true
      }
    }
    for (const e of this.enemies) {
      if (e.hitInfo(x, y, this)) return true
    }
    return false
  }

  private drawHurt(ctx: CanvasRenderingContext2D, view: View): void {
    const a = this.player.hurtFlash
    const g = ctx.createRadialGradient(view.cx, view.cy, view.H * 0.3, view.cx, view.cy, view.H * 0.8)
    g.addColorStop(0, 'rgba(255,0,0,0)')
    g.addColorStop(1, `rgba(255,0,0,${a * 0.45})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, view.W, view.H)
  }

  private hudData(): HudData {
    return {
      state: this.state,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      ammo: this.player.ammo,
      maxAmmo: this.player.maxAmmo,
      reloading: this.player.reloading,
      reloadFrac: this.player.reloadFrac,
      focus: this.player.focus,
      maxFocus: this.player.maxFocus,
      focusActive: this.player.focusActive,
      combo: this.combo,
      score: this.score,
      best: this.best,
      bannerText: this.level ? this.level.banner : '',
      bannerAlpha: this.level ? this.level.bannerAlpha : 0,
      boss: this.boss
        ? { name: this.boss.name, hpFrac: this.boss.hpFrac, phase: this.boss.phase, intro: this.boss.introActive }
        : null,
      touch: this.view.touch,
      muted: this.muted,
      rank: this.rank()
    }
  }

  private rank(): string {
    const acc = this.shots ? this.hits / this.shots : 0
    const hpScore = clamp(1 - this.damageTaken / 220, 0, 1)
    const comboScore = clamp(this.maxCombo / 30, 0, 1)
    const c = acc * 0.4 + hpScore * 0.35 + comboScore * 0.25
    return c > 0.9 ? 'S' : c > 0.78 ? 'A' : c > 0.6 ? 'B' : c > 0.4 ? 'C' : 'D'
  }
}
