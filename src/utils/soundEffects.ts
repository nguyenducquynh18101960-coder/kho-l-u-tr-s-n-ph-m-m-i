/**
 * Web Audio API Sound Effects Synthesizer
 * Provides crisp audio cues for:
 * - Correct answer (chime)
 * - Wrong answer
 * - Badge unlocked (fanfare sparkle)
 * - 10 interactions / mission completed (victory)
 * - Daily check-in (+50 XP)
 */

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Check saved audio preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('max10_sound_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('max10_sound_enabled', String(enabled));
    }
  }

  private getAudioContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Correct Answer: high pleasant double chime (E5 -> G5)
   */
  public playCorrect() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * Wrong Answer: gentle low buzz
   */
  public playWrong() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(175, now + 0.25);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Badge Unlocked: Magical sparkle chime (C5 -> E5 -> G5 -> C6)
   */
  public playBadgeUnlocked() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.16, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.42);
    });
  }

  /**
   * 10 Interactions / Daily Mission Complete: Victory Fanfare
   */
  public playMissionComplete() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const chords = [
      { f: 523.25, t: 0.0 }, // C5
      { f: 659.25, t: 0.12 }, // E5
      { f: 783.99, t: 0.24 }, // G5
      { f: 1046.5, t: 0.38 }, // C6
      { f: 1318.5, t: 0.52 }, // E6
    ];

    const now = ctx.currentTime;
    chords.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.2, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + 0.52);
    });
  }

  /**
   * Daily Check-in (+50 XP): Crisp bell sound
   */
  public playCheckInReward() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  /**
   * Study Schedule Alert (30 mins before exam or homework deadline): Melodic alert chime
   */
  public playStudyAlert() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [
      { f: 587.33, t: 0.0, d: 0.25 }, // D5
      { f: 783.99, t: 0.12, d: 0.35 }, // G5
      { f: 880.0, t: 0.24, d: 0.35 }, // A5
      { f: 1174.66, t: 0.36, d: 0.55 }, // D6
    ];

    const now = ctx.currentTime;
    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.2, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d + 0.02);
    });
  }

  /**
   * Subtle crisp UI/reel tick sound
   */
  public playClick() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Mythic Ronaldo "SIUUUUU" Long Stadium Celebration (~4.6 seconds)
   * Includes stadium crowd roar, landing bass boom, brass fanfare, and sustained "SIUUUUU" vocal formant sweep.
   */
  public playRonaldoSiuCelebration() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Stadium Crowd Roar (filtered noise over 4.6s)
    try {
      const duration = 4.6;
      const sampleRate = ctx.sampleRate;
      const bufferSize = Math.floor(sampleRate * duration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.950 * b2 + white * 0.048;
        data[i] = (b0 + b1 + b2) * 0.6;
      }

      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(750, now);
      bandpass.frequency.linearRampToValueAtTime(1250, now + 1.2);
      bandpass.frequency.linearRampToValueAtTime(650, now + 4.5);
      bandpass.Q.value = 0.7;

      const crowdGain = ctx.createGain();
      crowdGain.gain.setValueAtTime(0.01, now);
      crowdGain.gain.linearRampToValueAtTime(0.28, now + 0.75);
      crowdGain.gain.setValueAtTime(0.26, now + 3.0);
      crowdGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSrc.connect(bandpass);
      bandpass.connect(crowdGain);
      crowdGain.connect(ctx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + duration);
    } catch {}

    // 2. Iconic Jump Landing Impact Bass Boom at 0.55s
    try {
      const boomOsc = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boomOsc.type = 'sine';
      boomOsc.frequency.setValueAtTime(145, now + 0.55);
      boomOsc.frequency.exponentialRampToValueAtTime(40, now + 1.05);
      boomGain.gain.setValueAtTime(0.001, now);
      boomGain.gain.setValueAtTime(0.45, now + 0.55);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);
      boomOsc.connect(boomGain);
      boomGain.connect(ctx.destination);
      boomOsc.start(now + 0.55);
      boomOsc.stop(now + 1.2);
    } catch {}

    // 3. Long Sustained "S-I-U-U-U-U-U!" Vocal Formant Synth (0.6s -> 4.3s)
    try {
      const siuStart = now + 0.62;
      const siuEnd = now + 4.35;

      // Initial "Sss" hissing attack (0.55s - 0.78s)
      const sLen = Math.floor(ctx.sampleRate * 0.25);
      const sBuf = ctx.createBuffer(1, sLen, ctx.sampleRate);
      const sData = sBuf.getChannelData(0);
      for (let i = 0; i < sLen; i++) sData[i] = Math.random() * 2 - 1;
      const sSrc = ctx.createBufferSource();
      sSrc.buffer = sBuf;
      const sFilter = ctx.createBiquadFilter();
      sFilter.type = 'highpass';
      sFilter.frequency.value = 4200;
      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0.18, now + 0.52);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);
      sSrc.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(ctx.destination);
      sSrc.start(now + 0.52);
      sSrc.stop(now + 0.79);

      // Sustained voiced "IUUUUUUU" pitch glide + vibrato
      const vOsc1 = ctx.createOscillator();
      const vOsc2 = ctx.createOscillator();
      vOsc1.type = 'sawtooth';
      vOsc2.type = 'triangle';

      // Pitch contour: rises into "I", then drops powerfully into long "UUUUU"
      vOsc1.frequency.setValueAtTime(290, siuStart);
      vOsc1.frequency.exponentialRampToValueAtTime(360, siuStart + 0.25);
      vOsc1.frequency.exponentialRampToValueAtTime(220, siuStart + 1.1);
      vOsc1.frequency.linearRampToValueAtTime(175, siuEnd);

      vOsc2.frequency.setValueAtTime(290 * 1.005, siuStart);
      vOsc2.frequency.exponentialRampToValueAtTime(360 * 1.005, siuStart + 0.25);
      vOsc2.frequency.exponentialRampToValueAtTime(220 * 0.996, siuStart + 1.1);
      vOsc2.frequency.linearRampToValueAtTime(175 * 0.996, siuEnd);

      // Vibrato LFO
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 5.5;
      lfoGain.gain.value = 6;
      lfo.connect(lfoGain);
      lfoGain.connect(vOsc1.frequency);
      lfoGain.connect(vOsc2.frequency);

      // Formant filter transitioning from "ee" (~2200Hz) to long "oo/uu" (~480Hz)
      const formant = ctx.createBiquadFilter();
      formant.type = 'lowpass';
      formant.Q.value = 3.5;
      formant.frequency.setValueAtTime(2200, siuStart);
      formant.frequency.exponentialRampToValueAtTime(620, siuStart + 0.45);
      formant.frequency.linearRampToValueAtTime(420, siuEnd);

      const vGain = ctx.createGain();
      vGain.gain.setValueAtTime(0.01, siuStart);
      vGain.gain.linearRampToValueAtTime(0.24, siuStart + 0.14);
      vGain.gain.setValueAtTime(0.22, siuStart + 2.2);
      vGain.gain.exponentialRampToValueAtTime(0.001, siuEnd);

      vOsc1.connect(formant);
      vOsc2.connect(formant);
      formant.connect(vGain);
      vGain.connect(ctx.destination);

      lfo.start(siuStart);
      vOsc1.start(siuStart);
      vOsc2.start(siuStart);
      lfo.stop(siuEnd + 0.05);
      vOsc1.stop(siuEnd + 0.05);
      vOsc2.stop(siuEnd + 0.05);
    } catch {}

    // 4. Triumphant Stadium Brass Fanfare Chords
    const fanfare = [
      { f: 523.25, t: 0.0, d: 0.35 },
      { f: 659.25, t: 0.14, d: 0.35 },
      { f: 783.99, t: 0.28, d: 0.45 },
      { f: 1046.5, t: 0.55, d: 1.4 },
      { f: 1318.5, t: 0.55, d: 1.4 },
    ];
    fanfare.forEach(({ f, t, d }) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.14, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d + 0.05);
      } catch {}
    });

    // 5. Optional Web Speech API voice overlay for authentic long "SIUUUUU!"
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance('Siuuuuuuuuuuuu!');
        utter.rate = 0.62;
        utter.pitch = 1.15;
        utter.volume = 0.9;
        window.setTimeout(() => {
          try {
            window.speechSynthesis.speak(utter);
          } catch {}
        }, 520);
      }
    } catch {}
  }
}

export const soundEffects = new SoundEffectsEngine();

