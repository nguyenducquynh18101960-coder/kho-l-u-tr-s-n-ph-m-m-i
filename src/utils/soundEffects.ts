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
   * Mythic Ronaldo "SIUUUUU" Long Stadium Celebration (~5.2 seconds)
   * Includes football pitch referee whistle, 60,000-fan stadium crowd roar,
   * jump landing bass boom, multi-formant F1/F2/F3 "S-I-U-U-U-U!" vocal tract with stadium echo,
   * brass fanfare, and optional male speech overlay.
   */
  public playRonaldoSiuCelebration() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // 0. Quick Football Pitch Whistle Trill (0.02s - 0.34s)
    try {
      const wOsc1 = ctx.createOscillator();
      const wOsc2 = ctx.createOscillator();
      const wGain = ctx.createGain();
      wOsc1.type = 'sine';
      wOsc2.type = 'sine';
      wOsc1.frequency.setValueAtTime(2820, now + 0.02);
      wOsc2.frequency.setValueAtTime(3040, now + 0.02);
      wGain.gain.setValueAtTime(0.001, now);
      wGain.gain.linearRampToValueAtTime(0.11, now + 0.05);
      wGain.gain.setValueAtTime(0.11, now + 0.24);
      wGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      wOsc1.connect(wGain);
      wOsc2.connect(wGain);
      wGain.connect(ctx.destination);
      wOsc1.start(now + 0.02);
      wOsc2.start(now + 0.02);
      wOsc1.stop(now + 0.36);
      wOsc2.stop(now + 0.36);
    } catch {}

    // 1. Massive Stadium Crowd Roar & Cheers (filtered pink noise over 5.2s)
    try {
      const duration = 5.2;
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
        data[i] = (b0 + b1 + b2) * 0.7;
      }

      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(700, now);
      bandpass.frequency.linearRampToValueAtTime(1450, now + 0.85);
      bandpass.frequency.linearRampToValueAtTime(850, now + 3.2);
      bandpass.frequency.linearRampToValueAtTime(550, now + duration);
      bandpass.Q.value = 0.65;

      const crowdGain = ctx.createGain();
      crowdGain.gain.setValueAtTime(0.02, now);
      crowdGain.gain.linearRampToValueAtTime(0.34, now + 0.65);
      crowdGain.gain.setValueAtTime(0.30, now + 3.4);
      crowdGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSrc.connect(bandpass);
      bandpass.connect(crowdGain);
      crowdGain.connect(ctx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + duration);
    } catch {}

    // 2. Iconic Jump Landing Impact Bass Boom at 0.50s
    try {
      const boomOsc = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boomOsc.type = 'sine';
      boomOsc.frequency.setValueAtTime(155, now + 0.50);
      boomOsc.frequency.exponentialRampToValueAtTime(36, now + 1.10);
      boomGain.gain.setValueAtTime(0.001, now);
      boomGain.gain.setValueAtTime(0.5, now + 0.50);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      boomOsc.connect(boomGain);
      boomGain.connect(ctx.destination);
      boomOsc.start(now + 0.50);
      boomOsc.stop(now + 1.25);
    } catch {}

    // 3. Long Sustained Multi-Formant Male "S-I-U-U-U-U-U!" Vocal Synth + Stadium Echo (0.48s -> 4.65s)
    try {
      const siuStart = now + 0.56;
      const siuEnd = now + 4.55;

      // 3a. Crisp "Sss" consonant attack (0.46s - 0.68s)
      const sLen = Math.floor(ctx.sampleRate * 0.24);
      const sBuf = ctx.createBuffer(1, sLen, ctx.sampleRate);
      const sData = sBuf.getChannelData(0);
      for (let i = 0; i < sLen; i++) sData[i] = Math.random() * 2 - 1;
      const sSrc = ctx.createBufferSource();
      sSrc.buffer = sBuf;
      const sFilter = ctx.createBiquadFilter();
      sFilter.type = 'bandpass';
      sFilter.frequency.value = 5400;
      sFilter.Q.value = 1.4;
      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0.24, now + 0.46);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.70);
      sSrc.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(ctx.destination);
      sSrc.start(now + 0.46);
      sSrc.stop(now + 0.71);

      // 3b. Glottal pulse oscillators (male chest voice + harmonic presence)
      const vOsc1 = ctx.createOscillator();
      const vOsc2 = ctx.createOscillator();
      const vSub = ctx.createOscillator();
      vOsc1.type = 'sawtooth';
      vOsc2.type = 'sawtooth';
      vSub.type = 'triangle';

      // Pitch contour of Ronaldo shout: energetic rise into "SI-", powerful sustained drop on "UUUUUUU!"
      vOsc1.frequency.setValueAtTime(215, siuStart);
      vOsc1.frequency.exponentialRampToValueAtTime(288, siuStart + 0.22);
      vOsc1.frequency.exponentialRampToValueAtTime(195, siuStart + 1.05);
      vOsc1.frequency.linearRampToValueAtTime(152, siuEnd);

      vOsc2.frequency.setValueAtTime(215 * 1.006, siuStart);
      vOsc2.frequency.exponentialRampToValueAtTime(288 * 1.006, siuStart + 0.22);
      vOsc2.frequency.exponentialRampToValueAtTime(195 * 0.995, siuStart + 1.05);
      vOsc2.frequency.linearRampToValueAtTime(152 * 0.995, siuEnd);

      vSub.frequency.setValueAtTime(107.5, siuStart);
      vSub.frequency.exponentialRampToValueAtTime(144, siuStart + 0.22);
      vSub.frequency.exponentialRampToValueAtTime(97.5, siuStart + 1.05);
      vSub.frequency.linearRampToValueAtTime(76, siuEnd);

      // Passionate vocal vibrato LFO
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 5.8;
      lfoGain.gain.value = 5.5;
      lfo.connect(lfoGain);
      lfoGain.connect(vOsc1.frequency);
      lfoGain.connect(vOsc2.frequency);

      // Parallel Vowel Formant Filters (F1 + F2 + F3): transitions /i/ -> /u/
      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.Q.value = 4.5;
      f1.frequency.setValueAtTime(300, siuStart);
      f1.frequency.linearRampToValueAtTime(340, siuStart + 0.38);
      f1.frequency.linearRampToValueAtTime(310, siuEnd);

      const f2 = ctx.createBiquadFilter();
      f2.type = 'bandpass';
      f2.Q.value = 5.2;
      f2.frequency.setValueAtTime(2250, siuStart); // bright "I"
      f2.frequency.exponentialRampToValueAtTime(710, siuStart + 0.36); // deep "UUU"
      f2.frequency.linearRampToValueAtTime(620, siuEnd);

      const f3 = ctx.createBiquadFilter();
      f3.type = 'bandpass';
      f3.Q.value = 6.0;
      f3.frequency.setValueAtTime(2950, siuStart);
      f3.frequency.exponentialRampToValueAtTime(2150, siuStart + 0.36);

      const f1Gain = ctx.createGain();
      f1Gain.gain.value = 0.55;
      const f2Gain = ctx.createGain();
      f2Gain.gain.value = 0.38;
      const f3Gain = ctx.createGain();
      f3Gain.gain.value = 0.16;

      const vocalMaster = ctx.createGain();
      vocalMaster.gain.setValueAtTime(0.01, siuStart);
      vocalMaster.gain.linearRampToValueAtTime(0.42, siuStart + 0.12);
      vocalMaster.gain.setValueAtTime(0.36, siuStart + 2.3);
      vocalMaster.gain.exponentialRampToValueAtTime(0.001, siuEnd);

      // Stadium Slapback Echo (170ms)
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.17;
      const delayFeedback = ctx.createGain();
      delayFeedback.gain.value = 0.35;
      const delayWet = ctx.createGain();
      delayWet.gain.value = 0.32;

      vOsc1.connect(f1);
      vOsc1.connect(f2);
      vOsc1.connect(f3);
      vOsc2.connect(f1);
      vOsc2.connect(f2);
      vOsc2.connect(f3);
      vSub.connect(f1);

      f1.connect(f1Gain);
      f2.connect(f2Gain);
      f3.connect(f3Gain);

      f1Gain.connect(vocalMaster);
      f2Gain.connect(vocalMaster);
      f3Gain.connect(vocalMaster);

      vocalMaster.connect(ctx.destination);
      vocalMaster.connect(delay);
      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      delay.connect(delayWet);
      delayWet.connect(ctx.destination);

      lfo.start(siuStart);
      vOsc1.start(siuStart);
      vOsc2.start(siuStart);
      vSub.start(siuStart);
      lfo.stop(siuEnd + 0.05);
      vOsc1.stop(siuEnd + 0.05);
      vOsc2.stop(siuEnd + 0.05);
      vSub.stop(siuEnd + 0.05);
    } catch {}

    // 4. Triumphant Stadium Brass Fanfare Chords
    const fanfare = [
      { f: 523.25, t: 0.0, d: 0.35 },
      { f: 659.25, t: 0.14, d: 0.35 },
      { f: 783.99, t: 0.28, d: 0.45 },
      { f: 1046.5, t: 0.52, d: 1.5 },
      { f: 1318.5, t: 0.52, d: 1.5 },
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

    // 5. Smart Male Speech Overlay for authentic long "SIUUUUU!"
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance('Siuuu! Siuuuuuuuuu!');
        const voices = window.speechSynthesis.getVoices();
        const preferredMale = voices.find((v) =>
          /male|david|daniel|alex|paul|diego|jorge|cristiano|google uk english male/i.test(v.name)
        );
        if (preferredMale) {
          utter.voice = preferredMale;
          utter.lang = preferredMale.lang;
        } else {
          utter.lang = 'es-ES';
        }
        utter.rate = 0.56;
        utter.pitch = 0.85;
        utter.volume = 1.0;
        window.setTimeout(() => {
          try {
            window.speechSynthesis.speak(utter);
          } catch {}
        }, 460);
      }
    } catch {}
  }
}

export const soundEffects = new SoundEffectsEngine();

