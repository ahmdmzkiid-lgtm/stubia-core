/**
 * useNotificationSound — plays tones using Web Audio API (no external files needed)
 *
 * chatTone()        — short "ping" for incoming chat messages
 * notifyTone()      — double-beep for system notifications
 */

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  return audioCtx;
};

const playTone = (
  frequency: number,
  duration: number,
  gainValue: number = 0.18,
  type: OscillatorType = 'sine',
  startTime: number = 0
) => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);

    // Smooth attack and release (avoid click artifacts)
    gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration + 0.02);
  } catch {
    // silently fail if audio is blocked
  }
};

export const notificationSound = {
  /** Short friendly ping — used for received chat messages */
  chatPing: () => {
    playTone(880, 0.12, 0.15, 'sine', 0);
    playTone(1100, 0.12, 0.12, 'sine', 0.1);
  },

  /** Two-tone chime — used for new activity while app is in background */
  notifyChime: () => {
    playTone(660, 0.15, 0.15, 'sine', 0);
    playTone(880, 0.15, 0.15, 'sine', 0.18);
  },

  /** Soft click — used for sent messages */
  sentClick: () => {
    playTone(700, 0.06, 0.08, 'sine', 0);
  },
};
