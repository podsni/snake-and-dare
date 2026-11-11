import type { Settings } from '../game/types.ts'

export type SfxName = 'dice' | 'step' | 'ladder' | 'snake' | 'card' | 'reward' | 'win' | 'click' | 'bounce'

class AudioBus {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private musicTimer: ReturnType<typeof setInterval> | null = null
  private note = 0
  private unlocked = false
  sfx = true
  music = false
  volume = 0.7

  sync(settings: Settings): void {
    this.sfx = settings.sfx
    this.music = settings.music
    this.volume = settings.volume
    this.applyGain()
    if (!this.unlocked) return
    if (this.music) this.startMusic()
    else this.stopMusic()
  }

  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctx) return
        this.ctx = new Ctx()
        this.master = this.ctx.createGain()
        this.master.connect(this.ctx.destination)
        this.musicGain = this.ctx.createGain()
        this.musicGain.connect(this.master)
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      this.unlocked = true
      this.applyGain()
      if (this.music) this.startMusic()
    } catch {
      this.unlocked = false
    }
  }

  private applyGain(): void {
    if (!this.ctx || !this.master || !this.musicGain) return
    const now = this.ctx.currentTime
    this.master.gain.setValueAtTime(this.volume, now)
    this.musicGain.gain.setValueAtTime(this.music ? 0.22 : 0, now)
  }

  play(name: SfxName): void {
    if (!this.unlocked || !this.sfx || !this.ctx || !this.master) return
    try {
      const ctx = this.ctx
      const master = this.master
      const t0 = ctx.currentTime
      const tone = (
        freq: number,
        dur: number,
        type: OscillatorType,
        gain: number,
        delay = 0,
        slide?: number,
      ) => {
        const osc = ctx.createOscillator()
        const amp = ctx.createGain()
        osc.type = type
        osc.frequency.setValueAtTime(freq, t0 + delay)
        if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + delay + dur)
        amp.gain.setValueAtTime(0.0001, t0 + delay)
        amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + delay + 0.02)
        amp.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + dur)
        osc.connect(amp)
        amp.connect(master)
        osc.start(t0 + delay)
        osc.stop(t0 + delay + dur + 0.03)
      }
      if (name === 'dice') {
        tone(220, 0.08, 'triangle', 0.18)
        tone(140, 0.14, 'square', 0.05, 0.06)
        tone(90, 0.16, 'triangle', 0.08, 0.1)
      } else if (name === 'step') {
        tone(620, 0.06, 'sine', 0.08)
      } else if (name === 'ladder') {
        tone(392, 0.1, 'triangle', 0.12)
        tone(523, 0.12, 'triangle', 0.12, 0.08)
        tone(659, 0.16, 'triangle', 0.12, 0.16)
      } else if (name === 'snake') {
        tone(520, 0.28, 'sawtooth', 0.06, 0, 140)
      } else if (name === 'bounce') {
        tone(180, 0.16, 'square', 0.07)
      } else if (name === 'card') {
        tone(660, 0.1, 'sine', 0.1)
        tone(880, 0.14, 'sine', 0.08, 0.09)
      } else if (name === 'reward') {
        tone(523, 0.1, 'triangle', 0.12)
        tone(784, 0.16, 'triangle', 0.1, 0.08)
      } else if (name === 'win') {
        ;[523, 659, 784, 1046].forEach((freq, index) => tone(freq, 0.2, 'triangle', 0.12, index * 0.12))
      } else {
        tone(740, 0.05, 'sine', 0.06)
      }
    } catch {
      /* ignore audio graph errors */
    }
  }

  private startMusic(): void {
    if (this.musicTimer || !this.ctx || !this.musicGain) return
    const notes = [262, 330, 392, 330, 294, 392, 440, 349]
    this.musicTimer = setInterval(() => {
      if (!this.music || !this.unlocked || !this.ctx || !this.musicGain) return
      try {
        const ctx = this.ctx
        const osc = ctx.createOscillator()
        const amp = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = notes[this.note % notes.length] ?? 262
        this.note += 1
        const t0 = ctx.currentTime
        amp.gain.setValueAtTime(0.0001, t0)
        amp.gain.exponentialRampToValueAtTime(0.25, t0 + 0.03)
        amp.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.36)
        osc.connect(amp)
        amp.connect(this.musicGain)
        osc.start(t0)
        osc.stop(t0 + 0.4)
      } catch {
        /* ignore */
      }
    }, 520)
  }

  private stopMusic(): void {
    if (!this.musicTimer) return
    clearInterval(this.musicTimer)
    this.musicTimer = null
  }
}

export const audio = new AudioBus()
