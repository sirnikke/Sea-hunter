import type { EnemyKind } from './enemies'

// Scripted timeline for the Caribbean slice: calm descent → escalating waves →
// the Young Kraken. Waves are time-based (simple and predictable for a vertical
// slice); a production build would gate them on "area cleared" via the SpawnDirector.

export type SpawnFn = (kind: EnemyKind, x: number, y: number) => void

interface TimedEvent {
  at: number
  fn: () => void
}

export class LevelDirector {
  private time = 0
  private idx = 0
  private events: TimedEvent[]
  bossStarted = false
  banner = ''
  bannerT = 0

  constructor(private spawn: SpawnFn, private onBoss: () => void) {
    this.events = this.build()
  }

  private build(): TimedEvent[] {
    const e: TimedEvent[] = []
    const wave = (at: number, defs: [EnemyKind, number, number][]) =>
      defs.forEach(([k, x, y], i) => e.push({ at: at + i * 0.35, fn: () => this.spawn(k, x, y) }))

    e.push({ at: 0.4, fn: () => this.setBanner('CARIBBEAN SEA') })
    wave(3, [
      ['swarm', -0.4, -0.1],
      ['swarm', -0.2, 0.1],
      ['swarm', 0, -0.05],
      ['swarm', 0.2, 0.1],
      ['swarm', 0.4, -0.1]
    ])
    wave(7, [
      ['charger', -0.5, 0],
      ['charger', 0.5, -0.1]
    ])
    wave(11, [
      ['shooter', -0.45, -0.2],
      ['swarm', 0.2, 0.1],
      ['swarm', 0.4, 0]
    ])
    wave(15.5, [
      ['charger', -0.3, 0.1],
      ['charger', 0.3, 0.05],
      ['shooter', 0.0, -0.25]
    ])
    wave(20.5, [
      ['swarm', -0.5, 0],
      ['swarm', -0.3, 0.12],
      ['swarm', -0.1, -0.1],
      ['swarm', 0.1, 0.1],
      ['swarm', 0.35, 0],
      ['charger', 0.0, 0.0]
    ])
    e.push({ at: 25.5, fn: () => this.setBanner('SOMETHING STIRS BELOW…') })
    e.push({
      at: 28,
      fn: () => {
        this.bossStarted = true
        this.onBoss()
      }
    })
    return e.sort((a, b) => a.at - b.at)
  }

  private setBanner(text: string): void {
    this.banner = text
    this.bannerT = 2.8
  }

  get bannerAlpha(): number {
    // fade in/out over the banner's 2.8s lifetime
    const t = this.bannerT
    if (t <= 0) return 0
    return Math.min(1, Math.min(t, 2.8 - t + 0.4) * 2)
  }

  update(dt: number): void {
    if (this.bannerT > 0) this.bannerT = Math.max(0, this.bannerT - dt)
    if (this.bossStarted) return
    this.time += dt
    while (this.idx < this.events.length && this.events[this.idx].at <= this.time) {
      this.events[this.idx].fn()
      this.idx++
    }
  }
}
