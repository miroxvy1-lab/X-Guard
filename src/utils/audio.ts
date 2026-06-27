// Sound synthesizer using Web Audio API for high-fidelity beeps without external assets
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume context if suspended (browser auto-play restrictions)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playBeep(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Gain envelop for click-free fade-out
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Audio play failed', error);
  }
}

// 1-minute warning: Clean double beep
export function playOneMinuteWarning() {
  playBeep(880, 0.1, 'sine', 0.25);
  setTimeout(() => {
    playBeep(880, 0.1, 'sine', 0.25);
  }, 150);
}

// 30-second warning: Alarm warning beep
export function playThirtySecondWarning() {
  playBeep(660, 0.25, 'triangle', 0.3);
  setTimeout(() => {
    playBeep(554, 0.25, 'triangle', 0.3);
  }, 300);
}

// Countdown beep: sharp sound that gets higher on final seconds
export function playCountdownBeep(secondsLeft: number) {
  // 5 -> 1000Hz, 4 -> 1100Hz, 3 -> 1200Hz, 2 -> 1300Hz, 1 -> 1500Hz
  const freq = 1000 + (6 - secondsLeft) * 100;
  playBeep(freq, 0.08, 'sine', 0.35);
}

// System lock / unlock sounds
export function playLockSound() {
  playBeep(330, 0.15, 'sine', 0.2);
  setTimeout(() => {
    playBeep(220, 0.25, 'sine', 0.2);
  }, 120);
}

export function playUnlockSound() {
  playBeep(440, 0.1, 'sine', 0.2);
  setTimeout(() => {
    playBeep(554, 0.1, 'sine', 0.2);
    setTimeout(() => {
      playBeep(659, 0.15, 'sine', 0.2);
    }, 100);
  }, 100);
}

// Denied access sound cue (Dual short low-frequency buzz)
export function playDeniedAccessSound() {
  playBeep(180, 0.12, 'sawtooth', 0.2);
  setTimeout(() => {
    playBeep(150, 0.15, 'sawtooth', 0.2);
  }, 150);
}

// Lockout siren sound cue (Warning high-low buzzer cycle)
export function playSystemLockoutSound() {
  const playSiren = (freq1: number, freq2: number) => {
    playBeep(freq1, 0.15, 'triangle', 0.25);
    setTimeout(() => {
      playBeep(freq2, 0.15, 'triangle', 0.25);
    }, 180);
  };
  
  playSiren(450, 300);
  setTimeout(() => {
    playSiren(450, 300);
  }, 400);
}

