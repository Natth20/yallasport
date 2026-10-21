// src/lib/audio/goal-alert.ts
let isAudioEnabled = false;

export function getGoalAudioEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('yalla-goal-sound');
    return saved === 'true';
  } catch {
    return false;
  }
}

export function setGoalAudioEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('yalla-goal-sound', enabled ? 'true' : 'false');
    isAudioEnabled = enabled;
  } catch {
    // ignore
  }
}

export function playGoalSound() {
  if (typeof window === 'undefined') return;
  if (!getGoalAudioEnabled()) return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    // Triumphal football goal celebration chime (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + index * 0.1;
      const duration = index === notes.length - 1 ? 0.5 : 0.22;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch {
    // Audio context might need user interaction first
  }
}
