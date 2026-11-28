import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Award,
  ArrowRight,
  BookOpen,
  Volume2,
  VolumeX,
  FastForward,
  AlertTriangle,
  GitFork,
  Users,
  CheckCircle2,
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
    text: 'Max10 AI đồng hành cùng học sinh THCS chinh phục Điểm 10 trọn năm học với lộ trình học tập thông minh hoàn toàn miễn phí.',
    highlight: 'Điểm 10',
  },
  {
    id: 'how_to_use',
    prefix: 'Khám phá ngay: ',
    text: 'Nhấn nút Trải nghiệm ngay bên dưới để bước vào không gian học tập thông minh và săn Điểm 10 cùng Max10 AI!',
    highlight: 'Trải nghiệm ngay',
  },
];

const FEATURE_BENTO_CARDS = [
  {
    id: 'step-by-step',
    title: 'Giải chi tiết từng bước',
    description: 'Đầy đủ các môn Toán, Văn, Anh, KHTN...',
    icon: BookOpen,
    iconWrap: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  },
  {
    id: 'exam-traps',
    title: 'Cảnh báo bẫy điểm 10',
    description: 'Chỉ ra lỗi sai học sinh hay gặp.',
    icon: AlertTriangle,
    iconWrap: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25',
  },
  {
    id: 'mindmap',
    title: 'Hệ thống Sơ đồ tư duy',
    description: 'Tóm tắt kiến thức trực quan.',
    icon: GitFork,
    iconWrap: 'bg-teal-500/12 text-teal-600 dark:text-teal-400 border-teal-500/25',
  },
  {
    id: 'community-video',
    title: 'Cộng đồng & Video bài giảng AI',
    description: 'Học nhóm, chat 1-1 và bài học sinh động.',
    icon: Users,
    iconWrap: 'bg-sky-500/12 text-sky-600 dark:text-sky-400 border-sky-500/25',
  },
];

export const Max10IntroSplash: React.FC<Max10IntroSplashProps> = ({
  isOpen,
  onClose,
  isDark = false,
}) => {
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [typedCharsCount, setTypedCharsCount] = useState(0);
  const [isTypingCompleted, setIsTypingCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);

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
      const pitchJitter = 1 + (Math.random() * 0.28 - 0.14);

      const oscClick = ctx.createOscillator();
      const gainClick = ctx.createGain();
      oscClick.type = 'triangle';
      oscClick.frequency.setValueAtTime(2600 * pitchJitter, now);
      oscClick.frequency.exponentialRampToValueAtTime(750 * pitchJitter, now + 0.022);
      gainClick.gain.setValueAtTime(0.08, now);
      gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      oscClick.connect(gainClick);
      gainClick.connect(ctx.destination);
      oscClick.start(now);
      oscClick.stop(now + 0.03);

      const oscThock = ctx.createOscillator();
      const gainThock = ctx.createGain();
      oscThock.type = 'sine';
      oscThock.frequency.setValueAtTime(450 * pitchJitter, now);
      oscThock.frequency.exponentialRampToValueAtTime(140, now + 0.035);
      gainThock.gain.setValueAtTime(0.06, now);
      gainThock.gain.exponentialRampToValueAtTime(0.001, now + 0.038);
      oscThock.connect(gainThock);
      gainThock.connect(ctx.destination);
      oscThock.start(now);
      oscThock.stop(now + 0.042);

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
      noiseGain.gain.setValueAtTime(0.04, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.008);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);
    } catch (e) {}
  };

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
        gain.gain.setValueAtTime(0.055, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentScriptIndex(0);
      setTypedCharsCount(0);
      setIsTypingCompleted(false);
    }
  }, [isOpen]);

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
      const delay = char === '.' || char === '!' || char === '?' ? 85 : char === ',' ? 42 : 16;

      const timeout = setTimeout(() => {
        setTypedCharsCount((prev) => prev + 1);
        playRobloxKeyboardSound();
      }, delay);

      return () => clearTimeout(timeout);
    } else {
      if (currentScriptIndex < INTRO_SCRIPTS.length - 1) {
        const pauseTimeout = setTimeout(() => {
          setCurrentScriptIndex((prev) => prev + 1);
          setTypedCharsCount(0);
        }, 260);
        return () => clearTimeout(pauseTimeout);
      } else {
        const finishTimeout = setTimeout(() => {
          setIsTypingCompleted(true);
          playFinishChime();
        }, 280);
        return () => clearTimeout(finishTimeout);
      }
    }
  }, [isOpen, currentScriptIndex, typedCharsCount, isTypingCompleted, soundEnabled]);

  if (!isOpen) return null;

  const handleSkipTyping = () => {
    setCurrentScriptIndex(INTRO_SCRIPTS.length - 1);
    setTypedCharsCount(INTRO_SCRIPTS[INTRO_SCRIPTS.length - 1].text.length);
    setIsTypingCompleted(true);
    playFinishChime();
  };

  const handleEnterApp = () => {
    try {
      sessionStorage.removeItem('max10_intro_dismissed_session');
    } catch (e) {}
    onClose();
  };

  // Render Hero Headline with Emerald Gradient Accent on "Max10 AI"
  const headlineVisible =
    currentScriptIndex === 0
      ? INTRO_SCRIPTS[0].text.slice(0, typedCharsCount)
      : INTRO_SCRIPTS[0].text;

  const renderStyledHeadline = (text: string) => {
    const brand = 'Max10 AI';
    const idx = text.indexOf(brand);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const after = text.slice(idx + brand.length);
    return (
      <>
        {before}
        <span className="bg-gradient-to-r from-emerald-700 via-emerald-500 to-teal-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200 bg-clip-text text-transparent">
          {brand}
        </span>
        {after}
      </>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col select-none overflow-y-auto overscroll-contain animate-in fade-in duration-300 ${
        isDark ? 'bg-[#080d16] text-zinc-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* 1. Ambient Background: Subtle Dot Grid + Soft Emerald Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(rgba(148, 163, 184, 0.14) 1px, transparent 1px)'
            : 'radial-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[780px] h-[460px] rounded-full blur-[110px] z-0"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(16,185,129,0.20) 0%, rgba(20,184,166,0.06) 55%, transparent 75%)'
            : 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(20,184,166,0.07) 55%, transparent 75%)',
        }}
      />

      {/* Top Glass Header - NO X close button */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-sm shrink-0">
            <img
              src="/max10-avatar.jpg"
              alt="Max10 AI"
              className="w-full h-full object-cover rounded-[13px]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-slate-900 dark:text-white">
                Max10 AI
              </span>
              <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                Gia sư điểm 10 THCS
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              Hệ sinh thái học tập thông minh <strong className="text-slate-800 dark:text-zinc-200">Max10 AI</strong>
            </div>
          </div>
        </div>

        {/* Right Controls: Frosted Glass Sound Toggle + Skip Typing */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSoundEnabled((prev) => !prev);
              if (!soundEnabled) {
                setTimeout(playRobloxKeyboardSound, 50);
              }
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold border backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
              soundEnabled
                ? isDark
                  ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-white/75 border-emerald-300/80 text-emerald-800 hover:bg-white'
                : isDark
                ? 'bg-white/[0.05] border-white/10 text-zinc-400 hover:text-zinc-200'
                : 'bg-white/65 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title={soundEnabled ? 'Tắt âm gõ phím' : 'Bật âm gõ phím'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>{soundEnabled ? 'Bật âm gõ' : 'Tắt âm gõ'}</span>
          </button>

          {!isTypingCompleted && (
            <button
              type="button"
              onClick={handleSkipTyping}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold border backdrop-blur-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-white/[0.06] border-white/10 hover:bg-white/[0.12] text-zinc-200'
                  : 'bg-white/80 border-slate-200 hover:bg-white text-slate-700'
              }`}
              title="Hiện toàn bộ nội dung ngay lập tức"
            >
              <FastForward className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Hiện hết chữ</span>
            </button>
          )}
        </div>
      </header>

      {/* Center Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-6 sm:py-10 max-w-6xl mx-auto w-full pb-16">
        {/* 2. Hero Section */}
        <section className="w-full max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Logo with Emerald Glow */}
          <div className="relative mb-5">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-3xl bg-emerald-500/30 blur-2xl scale-125"
            />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl overflow-hidden p-0.5 bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-xl shadow-emerald-600/20">
              <img
                src="/max10-avatar.jpg"
                alt="Max10 AI - Gia sư điểm 10 THCS"
                className="w-full h-full object-cover rounded-[22px]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Glowing Pill Badge: THCS ĐIỂM 10 • PRO 10 */}
          <div
            className={`mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-black tracking-wider uppercase shadow-[0_0_24px_rgba(16,185,129,0.22)] ${
              isDark
                ? 'bg-emerald-500/12 border-emerald-400/40 text-emerald-300'
                : 'bg-white/90 border-emerald-400/70 text-emerald-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>THCS ĐIỂM 10 • PRO 10</span>
          </div>

          {/* SEO H1 Headline with Gradient Emerald Max10 AI */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] max-w-3xl">
            {renderStyledHeadline(headlineVisible)}
            {currentScriptIndex === 0 && !isTypingCompleted && (
              <span className="inline-block w-1.5 h-7 sm:h-10 bg-emerald-600 ml-1.5 align-middle" />
            )}
          </h1>

          {/* Description + Refined Author Pill for Mạc Khánh Duy */}
          {currentScriptIndex >= 1 && (
            <div className="mt-4 space-y-3.5 flex flex-col items-center animate-in fade-in duration-300">
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
                {currentScriptIndex === 1
                  ? INTRO_SCRIPTS[1].text.slice(0, typedCharsCount)
                  : INTRO_SCRIPTS[1].text}
                {currentScriptIndex === 1 && !isTypingCompleted && (
                  <span className="inline-block w-1 h-4 sm:h-5 bg-emerald-600 ml-1 align-middle" />
                )}
              </p>

              {/* Platform Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold shadow-2xs ${
                  isDark
                    ? 'bg-white/[0.04] border-white/10 text-zinc-300'
                    : 'bg-white/90 border-slate-200/90 text-slate-700'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  Nền tảng học tập{' '}
                  <strong className="font-extrabold text-slate-900 dark:text-white">
                    Max10 AI
                  </strong>{' '}
                  · THCS Điểm 10 · Miễn phí 100%
                </span>
              </div>
            </div>
          )}
        </section>

        {/* 3. Feature Bento Cards (4 horizontal cards + SEO H2 heading) */}
        <section className="w-full mt-8 sm:mt-10" aria-label="Tính năng nổi bật">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Tính năng nổi bật của Max10 AI
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {FEATURE_BENTO_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  className={`group rounded-3xl p-5 border text-left transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_-10px_rgba(16,185,129,0.2)] ${
                    isDark
                      ? 'bg-[#0f1726]/85 border-white/[0.08] hover:border-emerald-500/40'
                      : 'bg-white/90 border-slate-200/85 hover:border-emerald-300 shadow-2xs backdrop-blur-xs'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl border flex items-center justify-center mb-3.5 transition-transform duration-200 group-hover:scale-105 ${card.iconWrap}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Typing line 3 prompt caption */}
        {currentScriptIndex >= 2 && (
          <div className="mt-5 text-center max-w-xl mx-auto animate-in fade-in duration-300">
            <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
              {currentScriptIndex === 2
                ? INTRO_SCRIPTS[2].text.slice(0, typedCharsCount)
                : INTRO_SCRIPTS[2].text}
              {currentScriptIndex === 2 && !isTypingCompleted && (
                <span className="inline-block w-1 h-4 bg-emerald-600 ml-1 align-middle" />
              )}
            </p>
          </div>
        )}

        {/* 4. CTA Action Button at bottom */}
        <div className="w-full max-w-sm mx-auto mt-6 flex flex-col items-center">
          {isTypingCompleted ? (
            <div className="w-full animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={handleEnterApp}
                className="group w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-[0_14px_34px_-6px_rgba(16,185,129,0.55)] hover:shadow-[0_18px_40px_-6px_rgba(16,185,129,0.7)] hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer border border-emerald-300/30"
              >
                <Sparkles className="w-5 h-5 text-amber-200 shrink-0" />
                <span>Trải nghiệm ngay</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-1.5" />
              </button>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium text-center flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Vào ngay không gian học tập thông minh Max10 AI THCS</span>
              </p>
            </div>
          ) : (
            <div
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border text-xs font-semibold shadow-2xs ${
                isDark
                  ? 'bg-white/[0.04] border-white/10 text-zinc-400'
                  : 'bg-white/90 border-slate-200/90 text-slate-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Đang gửi lời chào... (Hoặc bấm Hiện hết chữ ở góc phải)</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
