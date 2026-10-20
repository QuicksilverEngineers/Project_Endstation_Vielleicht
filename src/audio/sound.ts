/**
 * Kleine UI-Klänge, live mit der Web Audio API erzeugt. Keine Audiodateien, keine Fremddienste.
 * Ohne AudioContext (z. B. in Tests) passiert einfach nichts.
 */
export type SoundName =
  | 'click'
  | 'select'
  | 'draw'
  | 'play'
  | 'good'
  | 'bad'
  | 'critical'
  | 'arrival'
  | 'upgrade'
  | 'gameover'
  | 'victory'

let context: AudioContext | null = null
let master: GainNode | null = null
let enabled = true
let volume = 0.35

export function configureSound(options: { enabled: boolean; volume: number }): void {
  enabled = options.enabled
  volume = Math.min(1, Math.max(0, options.volume))
  if (master) master.gain.value = volume
}

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (!enabled || volume <= 0) return null
  const Ctor = typeof window === 'undefined' ? undefined : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
  if (!Ctor) return null
  try {
    if (!context) {
      context = new Ctor()
      master = context.createGain()
      master.gain.value = volume
      master.connect(context.destination)
    }
    if (context.state === 'suspended') void context.resume()
    return { ctx: context, out: master! }
  } catch {
    return null
  }
}

interface ToneOptions {
  freq: number
  /** Zielfrequenz für einen Gleitton */
  to?: number
  start?: number
  duration: number
  type?: OscillatorType
  gain?: number
}

function tone({ ctx, out }: { ctx: AudioContext; out: GainNode }, o: ToneOptions) {
  const t0 = ctx.currentTime + (o.start ?? 0)
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = o.type ?? 'square'
  osc.frequency.setValueAtTime(o.freq, t0)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.duration)
  const peak = o.gain ?? 0.2
  env.gain.setValueAtTime(0.0001, t0)
  env.gain.exponentialRampToValueAtTime(peak, t0 + 0.01)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + o.duration)
  osc.connect(env).connect(out)
  osc.start(t0)
  osc.stop(t0 + o.duration + 0.02)
}

function noise({ ctx, out }: { ctx: AudioContext; out: GainNode }, duration: number, from: number, to: number) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(from, ctx.currentTime)
  filter.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + duration)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.25, ctx.currentTime)
  env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
  src.connect(filter).connect(env).connect(out)
  src.start()
}

const NOTES = { G4: 392, C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5 }

export function playSound(name: SoundName): void {
  const a = audio()
  if (!a) return
  switch (name) {
    case 'click':
      tone(a, { freq: 660, duration: 0.04, gain: 0.08 })
      break
    case 'select':
      tone(a, { freq: 520, duration: 0.05, gain: 0.1 })
      tone(a, { freq: 780, start: 0.05, duration: 0.06, gain: 0.1 })
      break
    case 'draw':
      noise(a, 0.14, 600, 3000)
      break
    case 'play':
      tone(a, { freq: 300, to: 620, duration: 0.12, type: 'triangle', gain: 0.25 })
      break
    case 'good':
      ;[NOTES.C5, NOTES.E5, NOTES.G5].forEach((freq, i) => tone(a, { freq, start: i * 0.07, duration: 0.14, type: 'triangle', gain: 0.2 }))
      break
    case 'bad':
      tone(a, { freq: 190, to: 110, duration: 0.25, type: 'sawtooth', gain: 0.12 })
      break
    case 'critical':
      ;[880, 660, 880, 660].forEach((freq, i) => tone(a, { freq, start: i * 0.11, duration: 0.09, gain: 0.08 }))
      break
    case 'arrival':
      // Dreiklang-Gong: eigene, generische Tonfolge
      ;[NOTES.E5, NOTES.C5, NOTES.G4].forEach((freq, i) => tone(a, { freq, start: i * 0.18, duration: 0.5, type: 'sine', gain: 0.22 }))
      break
    case 'upgrade':
      ;[NOTES.G4, NOTES.C5, NOTES.E5, NOTES.C6].forEach((freq, i) => tone(a, { freq, start: i * 0.05, duration: 0.1, type: 'triangle', gain: 0.15 }))
      break
    case 'gameover':
      tone(a, { freq: 420, to: 70, duration: 0.9, type: 'sawtooth', gain: 0.14 })
      tone(a, { freq: 210, to: 45, start: 0.1, duration: 0.9, type: 'square', gain: 0.06 })
      break
    case 'victory':
      ;[NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6, NOTES.G5, NOTES.C6].forEach((freq, i) =>
        tone(a, { freq, start: i * 0.1, duration: 0.18, type: 'triangle', gain: 0.2 }),
      )
      break
  }
}
