import {
  AIVoicePersona,
  AI_VOICE_PERSONAS,
  AIVoiceSettings,
  DEFAULT_VOICE_SETTINGS,
  STORAGE_KEY_VOICE_SETTINGS,
} from '../types/voice';

export interface VoicePlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  activeMessageId: string | null;
  activeText: string;
  activePersona: AIVoicePersona;
  speed: number;
  engineUsed: 'gemini' | 'webspeech';
  progress: number; // 0 to 100
}

type StateListener = (state: VoicePlaybackState) => void;

class AIVoiceManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCache = new Map<string, string>(); // key -> audioDataUrl
  private listeners: Set<StateListener> = new Set();

  private settings: AIVoiceSettings = this.loadSettings();
  private state: VoicePlaybackState = {
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    activeMessageId: null,
    activeText: '',
    activePersona: AI_VOICE_PERSONAS[0],
    speed: 1.0,
    engineUsed: 'gemini',
    progress: 0,
  };

  constructor() {
    this.updateActivePersona();
  }

  public loadSettings(): AIVoiceSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOICE_SETTINGS);
      if (saved) {
        return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_VOICE_SETTINGS };
  }

  public saveSettings(newSettings: Partial<AIVoiceSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem(STORAGE_KEY_VOICE_SETTINGS, JSON.stringify(this.settings));
    this.updateActivePersona();
    this.notifyState();
  }

  public getSettings(): AIVoiceSettings {
    return { ...this.settings };
  }

  public getState(): VoicePlaybackState {
    return { ...this.state };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notifyState() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  private updateActivePersona() {
    const found =
      AI_VOICE_PERSONAS.find((p) => p.id === this.settings.personaId) ||
      AI_VOICE_PERSONAS[0];
    this.state.activePersona = found;
    this.state.speed = this.settings.speed;
  }

  // Pre-process text to sound natural in spoken Vietnamese and math
  public cleanTextForSpeech(rawText: string): string {
    return rawText
      // Remove image markdown
      .replace(/!\[.*?\]\(.*?\)/g, '')
      // Remove URLs
      .replace(/https?:\/\/\S+/g, '')
      // Remove markdown headers, bold, italics, code blocks
      .replace(/```[\s\S]*?```/g, ' đoạn mã ')
      .replace(/`([^`]+)`/g, ' $1 ')
      .replace(/[*#_~>]/g, ' ')
      // Math symbols to natural Vietnamese words
      .replace(/\$\$(.*?)\$\$/g, ' công thức toán $1 ')
      .replace(/\$(.*?)\$/g, ' $1 ')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, ' $1 trên $2 ')
      .replace(/\\sqrt\{([^}]+)\}/g, ' căn bậc hai của $1 ')
      .replace(/\+/g, ' cộng ')
      .replace(/-/g, ' trừ ')
      .replace(/×/g, ' nhân ')
      .replace(/÷/g, ' chia ')
      .replace(/=/g, ' bằng ')
      .replace(/≠/g, ' khác ')
      .replace(/≤/g, ' nhỏ hơn hoặc bằng ')
      .replace(/≥/g, ' lớn hơn hoặc bằng ')
      .replace(/²/g, ' bình phương ')
      .replace(/³/g, ' mũ ba ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  public async speak(
    rawText: string,
    messageId: string | null = null,
    customPersona?: AIVoicePersona
  ): Promise<void> {
    // If clicking the currently playing message, toggle stop
    if (
      this.state.isPlaying &&
      messageId &&
      this.state.activeMessageId === messageId
    ) {
      this.stop();
      return;
    }

    this.stop();

    const persona = customPersona || this.state.activePersona;
    const cleanText = this.cleanTextForSpeech(rawText);
    if (!cleanText) return;

    // Truncate to sensible length to prevent audio timeout
    const textToSpeak = cleanText.length > 900 ? cleanText.slice(0, 900) + '...' : cleanText;

    this.state = {
      ...this.state,
      isPlaying: true,
      isPaused: false,
      isLoading: true,
      activeMessageId: messageId,
      activeText: textToSpeak,
      activePersona: persona,
      speed: this.settings.speed,
      progress: 0,
    };
    this.notifyState();

    // Strategy 1: Try Gemini TTS API if enabled
    if (this.settings.preferGeminiTTS) {
      const cacheKey = `${persona.geminiVoice}_${textToSpeak.slice(0, 80)}`;
      const cachedUrl = this.audioCache.get(cacheKey);

      if (cachedUrl) {
        this.playAudioUrl(cachedUrl, 'gemini');
        return;
      }

      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textToSpeak,
            voice: persona.geminiVoice,
            speed: this.settings.speed,
          }),
        });

        const data = await res.json();
        if (data.success && data.audioUrl) {
          this.audioCache.set(cacheKey, data.audioUrl);
          this.playAudioUrl(data.audioUrl, 'gemini');
          return;
        }
      } catch (err) {
        console.warn('Gemini TTS failed, fallback to WebSpeech:', err);
      }
    }

    // Strategy 2: Fallback to Web Speech API
    this.speakWithWebSpeech(textToSpeak);
  }

  private playAudioUrl(url: string, engine: 'gemini' | 'webspeech') {
    try {
      const audio = new Audio(url);
      audio.playbackRate = this.settings.speed || 1.0;
      this.currentAudio = audio;

      audio.onloadstart = () => {
        this.state.isLoading = true;
        this.state.engineUsed = engine;
        this.notifyState();
      };

      audio.onplay = () => {
        this.state.isLoading = false;
        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.notifyState();
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          this.state.progress = Math.round((audio.currentTime / audio.duration) * 100);
          this.notifyState();
        }
      };

      audio.onended = () => {
        this.resetState();
      };

      audio.onerror = () => {
        console.warn('Audio playback error, fallback to WebSpeech');
        this.speakWithWebSpeech(this.state.activeText);
      };

      audio.play().catch((err) => {
        console.warn('Auto-play blocked or audio error:', err);
        this.speakWithWebSpeech(this.state.activeText);
      });
    } catch {
      this.speakWithWebSpeech(this.state.activeText);
    }
  }

  private speakWithWebSpeech(text: string) {
    if (!('speechSynthesis' in window)) {
      this.resetState();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = this.settings.speed || 1.0;

    // Adjust pitch based on persona gender
    if (this.state.activePersona.gender === 'female') {
      utterance.pitch = 1.15;
    } else {
      utterance.pitch = 0.95;
    }

    utterance.onstart = () => {
      this.state.isLoading = false;
      this.state.isPlaying = true;
      this.state.isPaused = false;
      this.state.engineUsed = 'webspeech';
      this.notifyState();
    };

    utterance.onend = () => {
      this.resetState();
    };

    utterance.onerror = () => {
      this.resetState();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.state.isPaused = true;
      this.notifyState();
    } else if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.state.isPaused = true;
      this.notifyState();
    }
  }

  public resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
      this.state.isPaused = false;
      this.notifyState();
    } else if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.state.isPaused = false;
      this.notifyState();
    }
  }

  public stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.resetState();
  }

  public setSpeed(speed: number) {
    this.saveSettings({ speed });
    if (this.currentAudio) {
      this.currentAudio.playbackRate = speed;
    }
  }

  private resetState() {
    this.state = {
      ...this.state,
      isPlaying: false,
      isPaused: false,
      isLoading: false,
      activeMessageId: null,
      progress: 0,
    };
    this.notifyState();
  }
}

export const aiVoice = new AIVoiceManager();
