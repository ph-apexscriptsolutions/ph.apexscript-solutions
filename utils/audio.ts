// Web Audio API sound synthesizer for Priority Announcements and Alerts

let audioCtx: AudioContext | null = null

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

export const isAudioMuted = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('priority_alert_muted') === 'true'
}

export const setAudioMuted = (muted: boolean): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('priority_alert_muted', String(muted))
}

/**
 * Play a high-priority alert chime (dual-tone chime)
 */
export const playPriorityAlertSound = () => {
  if (isAudioMuted()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Tone 1: High crisp alert note (880 Hz - A5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, now)
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    // Tone 2: Harmonious follow-up note (1318.5 Hz - E6) starting slightly after
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(1318.5, now + 0.15)
    gain2.gain.setValueAtTime(0.35, now + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    // Tone 3: Pulse chime for urgency (1760 Hz - A6)
    const osc3 = ctx.createOscillator()
    const gain3 = ctx.createGain()
    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(1760, now + 0.3)
    gain3.gain.setValueAtTime(0.4, now + 0.3)
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9)
    osc3.connect(gain3)
    gain3.connect(ctx.destination)

    osc1.start(now)
    osc1.stop(now + 0.4)

    osc2.start(now + 0.15)
    osc2.stop(now + 0.7)

    osc3.start(now + 0.3)
    osc3.stop(now + 0.95)
  } catch (err) {
    console.warn('Audio playback prevented or failed:', err)
  }
}
