import type { SfxName } from './types'

// Tiny procedural sound engine — no audio assets, everything is synthesized with
// the Web Audio API. Created lazily on the first user gesture (autoplay policy).

export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  muted = false

  /** Call from a user gesture (pointerdown / keydown) to unlock audio. */
  resume(): void {
    if (!this.ctx) {
      try {
        const AC: typeof AudioContext =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AC) return
        this.ctx = new AC()
        this.master = this.ctx.createGain()
        this.master.gain.value = 0.5
        this.master.connect(this.ctx.destination)
      } catch {
        this.ctx = null
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume()
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5
    return this.muted
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    slideTo?: number
  ): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master || this.muted) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g)
    g.connect(master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  private noise(dur: number, gain: number, filterFreq: number, sweepTo?: number): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master || this.muted) return
    const t = ctx.currentTime
    const frames = Math.floor(ctx.sampleRate * dur)
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(filterFreq, t)
    if (sweepTo !== undefined) filter.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(filter)
    filter.connect(g)
    g.connect(master)
    src.start(t)
    src.stop(t + dur + 0.02)
  }

  play(name: SfxName): void {
    if (!this.ctx || this.muted) return
    switch (name) {
      case 'shoot':
        this.tone(420, 0.12, 'square', 0.12, 110)
        this.noise(0.09, 0.10, 1200, 400)
        break
      case 'chargeShot':
        this.tone(220, 0.28, 'sawtooth', 0.18, 70)
        this.noise(0.22, 0.16, 900, 200)
        break
      case 'hit':
        this.tone(680, 0.06, 'triangle', 0.10, 480)
        break
      case 'weak':
        this.tone(1040, 0.10, 'triangle', 0.14, 1500)
        this.tone(1560, 0.08, 'sine', 0.08)
        break
      case 'kill':
        this.noise(0.18, 0.16, 700, 120)
        this.tone(180, 0.18, 'sine', 0.10, 60)
        break
      case 'hurt':
        this.tone(120, 0.24, 'sawtooth', 0.20, 50)
        this.noise(0.18, 0.10, 300)
        break
      case 'reload':
        this.tone(300, 0.05, 'square', 0.08)
        window.setTimeout(() => this.tone(520, 0.06, 'square', 0.08), 120)
        break
      case 'empty':
        this.tone(160, 0.05, 'square', 0.06)
        break
      case 'focus':
        this.tone(300, 0.5, 'sine', 0.12, 900)
        break
      case 'bossRoar':
        this.tone(70, 1.2, 'sawtooth', 0.26, 42)
        this.noise(1.0, 0.14, 200, 80)
        break
      case 'phase':
        this.tone(330, 0.5, 'sine', 0.14)
        this.tone(440, 0.5, 'sine', 0.12)
        this.tone(550, 0.5, 'sine', 0.10)
        break
      case 'threat':
        this.tone(880, 0.08, 'square', 0.06, 1200)
        break
      case 'parry':
        this.tone(1400, 0.10, 'triangle', 0.14, 2200)
        break
      case 'ui':
        this.tone(520, 0.05, 'sine', 0.08)
        break
    }
  }
}
