import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Award,
  Zap,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Volume2,
  VolumeX,
  FastForward,
} from 'lucide-react';

interface Max10IntroSplashProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  userName?: string;
  onSelectPrompt?: (prompt: string) => void;
}

const INTRO_SCRIPTS = [
  {
    id: 'greeting',
    prefix: '',
    text: 'Xin chào! Mình là Max10 AI — Trợ lý AI thế hệ mới.',
    highlight: 'Max10 AI',
  },
  {
    id: 'identity',
    prefix: '',
    text: 'Được sáng lập và xây dựng bởi tác giả Mạc Khánh Duy, Max10 AI ra đời nhằm giúp học sinh tự tin chinh phục Điểm 10 trọn năm học hoàn toàn miễn phí.',
    highlight: 'Mạc Khánh Duy',
  },
  {
    id: 'features',
    prefix: '✨ Tính năng nổi bật: ',
    text: 'Giải chi tiết từng bước mọi môn học (Toán, Văn, Anh, KHTN...), cảnh báo bẫy điểm 10 hay gặp, hệ thống hóa sơ đồ tư duy và tạo video bài học sinh động.',
    highlight: 'Giải chi tiết từng bước',
  },
  {
    id: 'how_to_use',
    prefix: '🚀 Khám phá ngay: ',
    text: 'Nhấn nút Bắt đầu bên dưới để bước vào không gian học tập thông minh và săn Điểm 10 cùng Max10 AI!',
    highlight: 'Bắt đầu',
  },
];

export const Max10IntroSplash: React.FC<Max10IntroSplashProps> = ({
  isOpen,
  onClose,
  isDark = false,
  userName = 'Bạn học',
  onSelectPrompt,
}) => {
  // Current typing script index
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [typedCharsCount, setTypedCharsCount] = useState(0);
  const [isTypingCompleted, setIsTypingCompleted] = useState(false);
  // Default sound enabled for the Roblox keyboard speed experience
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio Context for Roblox mechanical keyboard click sound
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Auto-unlock audio on user gesture
  useEffect(() => {
    const unlockAudio = () => {
      try {
        if (!audioCtxRef.current) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      } catch (e) {}
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Play realistic Roblox "+1 Keyboard Speed" mechanical switch sound
  const playRobloxKeyboardSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Pitch jitter for natural mechanical switch feeling
      const pitchJitter = 1 + (Math.random() * 0.28 - 0.14);

      // 1. High-frequency crisp tactile switch click
      const oscClick = ctx.createOscillator();
      const gainClick = ctx.createGain();
      oscClick.type = 'triangle';
      oscClick.frequency.setValueAtTime(2600 * pitchJitter, now);
      oscClick.frequency.exponentialRampToValueAtTime(750 * pitchJitter, now + 0.022);

      gainClick.gain.setValueAtTime(0.09, now);
      gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      oscClick.connect(gainClick);
      gainClick.connect(ctx.destination);
      oscClick.start(now);
      oscClick.stop(now + 0.03);

      // 2. Mechanical body keycap "thock"
      const oscThock = ctx.createOscillator();
      const gainThock = ctx.createGain();
      oscThock.type = 'sine';
      oscThock.frequency.setValueAtTime(450 * pitchJitter, now);
      oscThock.frequency.exponentialRampToValueAtTime(140, now + 0.035);

      gainThock.gain.setValueAtTime(0.07, now);
      gainThock.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

      oscThock.connect(gainThock);
      gainThock.connect(ctx.destination);
      oscThock.start(now);
      oscThock.stop(now + 0.042);

      // 3. Transient keycap friction noise burst
      const bufferSize = Math.floor(ctx.sampleRate * 0.006);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 3200 * pitchJitter;
      noiseFilter.Q.value = 3.5;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.045, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.008);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);
    } catch (e) {}
  };

  // Play Roblox Level-up / Finish chime when all text completes
  const playFinishChime = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.06, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    } catch (e) {}
  };

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentScriptIndex(0);
      setTypedCharsCount(0);
      setIsTypingCompleted(false);
    }
  }, [isOpen]);

  // Typewriter effect interval with Roblox key sound
  useEffect(() => {
    if (!isOpen || isTypingCompleted) return;

    const activeScript = INTRO_SCRIPTS[currentScriptIndex];
    if (!activeScript) {
      setIsTypingCompleted(true);
      playFinishChime();
      return;
    }

    const fullLength = activeScript.text.length;

    if (typedCharsCount < fullLength) {
      const char = activeScript.text[typedCharsCount];
      // Fast, snappy typing speed like +1 keyboard speed in Roblox
      const delay = char === '.' || char === '!' || char === '?' ? 90 : char === ',' ? 45 : 18;

      const timeout = setTimeout(() => {
        setTypedCharsCount((prev) => prev + 1);
        playRobloxKeyboardSound();
      }, delay);

      return () => clearTimeout(timeout);
    } else {
      // Completed current line, pause before next
      if (currentScriptIndex < INTRO_SCRIPTS.length - 1) {
        const pauseTimeout = setTimeout(() => {
          setCurrentScriptIndex((prev) => prev + 1);
          setTypedCharsCount(0);
        }, 280);
        return () => clearTimeout(pauseTimeout);
      } else {
        // All lines completed! Only now is typing completed and exit allowed
        const finishTimeout = setTimeout(() => {
          setIsTypingCompleted(true);
          playFinishChime();
        }, 300);
        return () => clearTimeout(finishTimeout);
      }
    }
  }, [isOpen, currentScriptIndex, typedCharsCount, isTypingCompleted, soundEnabled]);

  if (!isOpen) return null;

  // Skip typing animation immediately: instantly display all text and enable start
  const handleSkipTyping = () => {
    setCurrentScriptIndex(INTRO_SCRIPTS.length - 1);
    setTypedCharsCount(INTRO_SCRIPTS[INTRO_SCRIPTS.length - 1].text.length);
    setIsTypingCompleted(true);
    playFinishChime();
  };

  // Dismiss splash and enter app
  const handleEnterApp = () => {
    try {
      sessionStorage.removeItem('max10_intro_dismissed_session');
    } catch (e) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-white text-zinc-900 select-none overflow-y-auto overscroll-contain animate-in fade-in duration-300">
      {/* Top Minimalist Header - NO X BUTTON (User Requirement: không có nút X để thoát ra chỉ khi nào hiện hết ra thì sẽ kết thúc) */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between border-b border-zinc-100 shrink-0">
        <div className="flex items-center gap-3">
          {/* Max10 Iconic Emblem */}
          <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-zinc-900">
                Max10 AI
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                THCS Điểm 10
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">
              Tác giả sáng lập: <strong className="text-zinc-700">Mạc Khánh Duy</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle - Crisp mechanical keyboard click sound */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled((prev) => !prev);
              if (!soundEnabled) {
                setTimeout(playRobloxKeyboardSound, 50);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-800'
            }`}
            title={soundEnabled ? 'Tắt âm gõ phím' : 'Bật âm gõ phím'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px]">
              {soundEnabled ? 'Bật âm gõ' : 'Tắt âm gõ'}
            </span>
          </button>

          {/* Fast Forward / Skip typing button (Helps view immediately if user wants) */}
          {!isTypingCompleted && (
            <button
              type="button"
              onClick={handleSkipTyping}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
              title="Hiện toàn bộ lời chào ngay lập tức"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hiện hết chữ</span>
            </button>
          )}

          {/* NO X BUTTON: strictly removed as requested by user */}
        </div>
      </header>

      {/* Center Body: Typewriter Words & ONLY START BUTTON (No question input) */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-8 sm:py-12 max-w-4xl mx-auto w-full pb-20">
        {/* Subtle Brand Watermark Emblem */}
        <div className="mb-6 flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 text-white flex items-center justify-center shadow-xl shadow-zinc-200 border border-zinc-200">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md">
              PRO 10
            </div>
          </div>
        </div>

        {/* Dynamic Typewriter Text Area */}
        <div className="w-full text-center space-y-4 mb-6">
          {/* Script 1: Greeting Headline */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 leading-tight">
            {currentScriptIndex === 0
              ? INTRO_SCRIPTS[0].text.slice(0, typedCharsCount)
              : INTRO_SCRIPTS[0].text}
            {currentScriptIndex === 0 && (
              <span className="inline-block w-1.5 h-6 sm:h-9 bg-emerald-600 ml-1.5 animate-pulse align-middle" />
            )}
          </h1>

          {/* Script 2: Creator & Purpose */}
          {currentScriptIndex >= 1 && (
            <p className="text-sm sm:text-base md:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed animate-in fade-in duration-300">
              {currentScriptIndex === 1
                ? INTRO_SCRIPTS[1].text.slice(0, typedCharsCount)
                : INTRO_SCRIPTS[1].text}
              {currentScriptIndex === 1 && (
                <span className="inline-block w-1 h-4 sm:h-5 bg-emerald-600 ml-1 animate-pulse align-middle" />
              )}
            </p>
          )}

          {/* Script 3: Key Features */}
          {currentScriptIndex >= 2 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 max-w-2xl mx-auto text-xs sm:text-sm text-zinc-700 leading-relaxed text-left animate-in fade-in duration-300 shadow-2xs">
              <span className="font-bold text-emerald-700">{INTRO_SCRIPTS[2].prefix}</span>
              {currentScriptIndex === 2
                ? INTRO_SCRIPTS[2].text.slice(0, typedCharsCount)
                : INTRO_SCRIPTS[2].text}
              {currentScriptIndex === 2 && (
                <span className="inline-block w-1 h-3.5 bg-emerald-600 ml-1 animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Script 4: Discovery */}
          {currentScriptIndex >= 3 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 max-w-2xl mx-auto text-xs sm:text-sm text-emerald-900 leading-relaxed text-left animate-in fade-in duration-300 shadow-2xs">
              <span className="font-extrabold text-emerald-800">{INTRO_SCRIPTS[3].prefix}</span>
              {currentScriptIndex === 3
                ? INTRO_SCRIPTS[3].text.slice(0, typedCharsCount)
                : INTRO_SCRIPTS[3].text}
              {currentScriptIndex === 3 && (
                <span className="inline-block w-1 h-3.5 bg-emerald-600 ml-1 animate-pulse align-middle" />
              )}
            </div>
          )}
        </div>

        {/* User Requirement: "chỗ mà có chữ bắt đầu thì chỉ có chữ bắt đầu không chỗ đặt câu hỏi" */}
        {/* User Requirement: "chỗ xin chào phần mở đầu thì không có nút X để thoát ra chỉ khi nào hiện hết ra thì sẽ kết thúc" */}
        <div className="w-full max-w-md mx-auto my-6 flex flex-col items-center">
          {isTypingCompleted ? (
            /* ONLY the Bắt đầu button appears when typing finishes completely */
            <div className="w-full animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleEnterApp}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer border border-emerald-400/40"
              >
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>Bắt đầu</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
              <p className="text-[11px] text-zinc-400 font-medium text-center">
                Bấm <strong>Bắt đầu</strong> để vào ngay phòng học và hỏi bài tập cùng Max10 AI
              </p>
            </div>
          ) : (
            /* While still typing: no exit, displays progress indicator */
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-zinc-50 border border-zinc-200/90 text-zinc-500 text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Đang gửi lời chào... (Vui lòng đợi hiện hết chữ để Bắt đầu)</span>
            </div>
          )}
        </div>

        {/* Bottom Creator Credential */}
        <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-2xl text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              Tác giả sáng lập: <strong className="text-zinc-700">Mạc Khánh Duy</strong> (Lớp 9 · THCS Nguyễn Du)
            </span>
          </div>

          <div className="text-[11px] text-zinc-400 font-medium">
            THCS · Miễn phí 100%
          </div>
        </div>
      </main>
    </div>
  );
};
