import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Award,
  Plus,
  Image as ImageIcon,
  Sparkles,
  Brain,
  Mic,
  Copy,
  Check,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  Paperclip,
  BookOpen,
  Calculator,
  PenTool,
  FlaskConical,
  Compass,
  Zap,
  GitFork,
  Palette,
  QrCode,
  ExternalLink,
  Crown,
  Video,
  Clapperboard,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Film,
  Bot,
  Trophy,
} from 'lucide-react';
import { GradeLevel, ChatMessage } from '../../types';
import { BackgroundTheme, PRESET_THEMES } from '../../types/theme';
import { speakThemeName } from '../../utils/speechTheme';
import { aiVoice } from '../../utils/aiVoiceEngine';
import { AIVoicePlayerBar } from './AIVoicePlayerBar';
import { ChatGPTCodeBlock } from './ChatGPTCodeBlock';
import { ChatGPTVideoPlayer } from './ChatGPTVideoPlayer';
import { MiniGameQuizModal } from './MiniGameQuizModal';
import { MathChallengeModal } from './MathChallengeModal';
import { QuotaLimitCountdownCard } from './QuotaLimitCountdownCard';
import { DailyMissionCard } from './DailyMissionCard';
import { getTodayDailyMission, DailyMission } from '../../data/dailyMissions';
import { celebrationEngine } from '../../utils/confettiFireworks';
import { soundEffects } from '../../utils/soundEffects';
import {
  getDailyQuestionQuota,
  useQuestionSlot,
  MAX_DAILY_QUESTIONS,
  QuestionQuotaStatus,
} from '../../data/questionQuota';
import Markdown from 'react-markdown';
import { formatDolaMath } from '../../utils/dolaMathFormatter';

interface ChatViewProps {
  grade: GradeLevel;
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (
    text: string,
    image?: { data: string; mimeType: string; previewUrl: string } | null,
    isThinking?: boolean
  ) => void;
  onRegenerate: () => void;
  isDark: boolean;
  onOpenImageStudio?: () => void;
  onOpenMindMap?: () => void;
  onOpenVideoStudio?: () => void;
  onOpenControlCenter?: () => void;
  activeTheme?: BackgroundTheme;
  onSelectTheme?: (theme: BackgroundTheme) => void;
  onOpenThemeModal?: () => void;
  voiceThemeEnabled?: boolean;
  onOpenVoiceModal?: () => void;
  userName?: string;
  onOpenNameModal?: () => void;
  onOpenOfferModal?: () => void;
  onOpenIntroModal?: () => void;
  onOpenStoreModal?: () => void;
  subscriptionPlan?: 'free' | 'plus' | 'premium';
  onOpenPricingModal?: (initialPlan?: 'plus' | 'premium', initialStep?: 'plans' | 'checkout') => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: (val?: boolean) => void;
  isAdmin?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  grade,
  messages,
  loading,
  onSendMessage,
  onRegenerate,
  isDark,
  onOpenImageStudio,
  onOpenMindMap,
  onOpenVideoStudio,
  onOpenControlCenter,
  activeTheme,
  onSelectTheme,
  onOpenThemeModal,
  voiceThemeEnabled = true,
  onOpenVoiceModal,
  userName = 'Bạn học',
  onOpenNameModal,
  onOpenOfferModal,
  onOpenIntroModal,
  onOpenStoreModal,
  subscriptionPlan = 'free',
  onOpenPricingModal,
  isFullscreen: isFullscreenProp,
  onToggleFullscreen,
  isAdmin = false,
}) => {
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [deepThinking, setDeepThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [freeWaitStep, setFreeWaitStep] = useState(0);
  const [selectedModel, setSelectedModel] = useState<'gpt4o' | 'o3mini' | 'studio'>('gpt4o');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [localIsFullscreen, setLocalIsFullscreen] = useState(false);

  // Daily Question Quota (10 questions limit for students)
  const [quotaStatus, setQuotaStatus] = useState<QuestionQuotaStatus>(() =>
    getDailyQuestionQuota(isAdmin)
  );

  useEffect(() => {
    setQuotaStatus(getDailyQuestionQuota(isAdmin));
  }, [isAdmin]);

  useEffect(() => {
    const handleQuotaUpdate = () => {
      setQuotaStatus(getDailyQuestionQuota(isAdmin));
    };
    window.addEventListener('max10_quota_updated', handleQuotaUpdate);
    window.addEventListener('focus', handleQuotaUpdate);
    return () => {
      window.removeEventListener('max10_quota_updated', handleQuotaUpdate);
      window.removeEventListener('focus', handleQuotaUpdate);
    };
  }, [isAdmin]);

  // Daily Mission Goal (10 interactions = mission completed +150 XP)
  const [dailyMission, setDailyMission] = useState<DailyMission>(() =>
    getTodayDailyMission(quotaStatus.used)
  );

  useEffect(() => {
    setDailyMission(getTodayDailyMission(quotaStatus.used));
  }, [quotaStatus.used]);

  // Fullscreen state: Controlled via prop from App.tsx or fallback to local
  const isFullscreen = isFullscreenProp !== undefined ? isFullscreenProp : localIsFullscreen;

  const toggleFullscreen = (targetVal?: boolean) => {
    const nextVal = typeof targetVal === 'boolean' ? targetVal : !isFullscreen;
    setLocalIsFullscreen(nextVal);
    if (onToggleFullscreen) {
      onToggleFullscreen(nextVal);
    }
  };

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isFullscreen]);

  // Toast feedback and Mini-game states
  const [fixToast, setFixToast] = useState<string | null>(null);
  const [showMiniGameModal, setShowMiniGameModal] = useState<boolean>(false);
  const [showMathChallengeModal, setShowMathChallengeModal] = useState<boolean>(false);
  const [activeLessonContext, setActiveLessonContext] = useState<string>('');

  // Clipboard paste function
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setInput((prev) => (prev ? prev + ' ' + text.trim() : text.trim()));
        setFixToast('📋 Đã dán câu hỏi từ bộ nhớ tạm!');
        setTimeout(() => setFixToast(null), 2500);
        textareaRef.current?.focus();
      } else {
        setFixToast('⚠️ Bộ nhớ tạm chưa có nội dung sao chép nào.');
        setTimeout(() => setFixToast(null), 2500);
      }
    } catch (err) {
      setFixToast('⚠️ Hãy nhấn Ctrl+V để dán trực tiếp câu hỏi vào ô hỏi nhé!');
      setTimeout(() => setFixToast(null), 3000);
    }
  };

  // Auto-correction and formula standardization
  const handleFixQuestionErrors = () => {
    if (!input || !input.trim()) {
      setFixToast('⚠️ Hãy nhập hoặc dán câu hỏi trước khi sửa lỗi nhé.');
      setTimeout(() => setFixToast(null), 2500);
      return;
    }
    let fixed = input;
    const replacements: [RegExp, string][] = [
      [/\bko\b/gi, 'không'],
      [/\bk\b/gi, 'không'],
      [/\bdc\b/gi, 'được'],
      [/\bđc\b/gi, 'được'],
      [/\bvs\b/gi, 'với'],
      [/\bng\b/gi, 'người'],
      [/\bmk\b/gi, 'mình'],
      [/\bmik\b/gi, 'mình'],
      [/\bbt\b/gi, 'bài tập'],
      [/\bbth\b/gi, 'bình thường'],
      [/\bpt\b/gi, 'phương trình'],
      [/\bhpt\b/gi, 'hệ phương trình'],
      [/\bhsg\b/gi, 'học sinh giỏi'],
      [/\bsgk\b/gi, 'SGK'],
      [/\bđk\b/gi, 'điều kiện'],
      [/\bthcs\b/gi, 'THCS'],
      [/\bgdcd\b/gi, 'GDCD'],
      [/\bkhtn\b/gi, 'KHTN'],
      // Math formulas formatting
      [/x\^2/g, 'x²'],
      [/x\^3/g, 'x³'],
      [/y\^2/g, 'y²'],
      [/y\^3/g, 'y³'],
      [/\s*\*\s*/g, ' × '],
      [/\s*\/\s*/g, ' ÷ '],
      [/\bsqrt\(/gi, '√('],
      [/\bpi\b/gi, 'π'],
      [/<=\s*/g, '≤ '],
      [/>=\s*/g, '≥ '],
      [/!=\s*/g, '≠ '],
      [/\+\-/g, '±'],
      [/\bdeg\b/gi, '°'],
      [/\s{2,}/g, ' '],
    ];
    for (const [pattern, rep] of replacements) {
      fixed = fixed.replace(pattern, rep);
    }
    fixed = fixed.trim();
    if (fixed.length > 0) {
      fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);
    }
    setInput(fixed);
    setFixToast('✨ Đã sửa lỗi chính tả teen code & chuẩn hóa công thức toán!');
    setTimeout(() => setFixToast(null), 2500);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (loading && subscriptionPlan === 'free') {
      setFreeWaitStep(0);
      const t1 = setTimeout(() => setFreeWaitStep(1), 1800);
      const t2 = setTimeout(() => setFreeWaitStep(2), 3800);
      const t3 = setTimeout(() => setFreeWaitStep(3), 5500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [loading, subscriptionPlan]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Sync speakingId with aiVoice manager
  useEffect(() => {
    const unsub = aiVoice.subscribe((st) => {
      setSpeakingId(st.isPlaying ? st.activeMessageId : null);
    });
    return unsub;
  }, []);

  // Auto-read assistant response if enabled in voice settings
  const prevMsgCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && !loading) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && aiVoice.getSettings().autoReadResponse) {
        aiVoice.speak(lastMsg.content, lastMsg.id);
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, loading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    aiVoice.speak(text, id);
  };

  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${filename || 'max10-ai'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setAttachedImage({
        data: base64Data,
        mimeType: file.type,
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowPlusMenu(false);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Trình duyệt hiện tại chưa hỗ trợ ghi âm tiếng Việt trực tiếp.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        textareaRef.current?.focus();
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachedImage) || loading) return;

    if (!isAdmin && quotaStatus.remaining <= 0) {
      setQuotaStatus(getDailyQuestionQuota(isAdmin));
      return;
    }

    useQuestionSlot(isAdmin);
    const nextQuota = getDailyQuestionQuota(isAdmin);
    setQuotaStatus(nextQuota);

    // Trigger fireworks & celebration sound when completing 10 daily interactions!
    if (!isAdmin && nextQuota.used >= MAX_DAILY_QUESTIONS) {
      celebrationEngine.celebrate(4);
      soundEffects.playMissionComplete();
    }

    onSendMessage(input.trim(), attachedImage, deepThinking);
    setInput('');
    setAttachedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmptyState = messages.length === 0;

  const subjectPills = [
    { name: 'Toán học', prompt: 'Giải giúp mình bài toán: ', icon: Calculator, color: 'text-blue-500' },
    { name: 'Ngữ văn', prompt: 'Lập dàn ý chi tiết bài văn: ', icon: PenTool, color: 'text-emerald-500' },
    { name: 'Tiếng Anh', prompt: 'Giải thích ngữ pháp và sửa lỗi câu: ', icon: BookOpen, color: 'text-indigo-500' },
    { name: 'KHTN (Lý-Hóa-Sinh)', prompt: 'Giải bài tập và giải thích hiện tượng: ', icon: FlaskConical, color: 'text-amber-500' },
  ];

  const quickActionCards = [
    {
      title: 'Tạo Ảnh & Video AI Chung',
      desc: 'Tạo ảnh DALL·E 3 sắc nét 8K và dựng video người AI nói thuyết trình cùng lúc trong chat.',
      prompt: 'Hãy tạo ảnh và video có người AI nói chung về: ',
      icon: Film,
      gradient: 'from-amber-500/20 via-rose-500/20 to-purple-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400',
      badge: 'Cùng Lúc',
    },
    {
      title: 'Hỏi Bài & Giải Bài Tập',
      desc: 'Giải toán, Lý, Hóa, Sinh, Văn, Anh chi tiết từng bước & quét bẫy điểm 10.',
      prompt: 'Hãy hướng dẫn giải chi tiết bài tập sau từng bước và chỉ ra các bẫy đề thi hay trừ điểm: ',
      icon: Calculator,
      gradient: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Tạo Ảnh AI Chuẩn Xác',
      desc: 'Vẽ ảnh DALL·E 3 sắc nét 8K, chuẩn xác 100% chủ thể, không vẽ sai.',
      prompt: 'Hãy tạo ảnh AI chuẩn xác như ChatGPT về: ',
      icon: ImageIcon,
      gradient: 'from-emerald-500/10 to-indigo-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Tạo Poster & Áp Phích AI',
      desc: 'Áp phích học tập, sơ đồ infographic, công thức trọng tâm & khẩu hiệu.',
      prompt: 'Hãy tạo poster áp phích học tập tóm tắt kiến thức về: ',
      icon: GitFork,
      gradient: 'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Làm Video Người AI Nói',
      desc: 'Thuyết trình viên AI giảng bài, cử động môi tự nhiên và phụ đề.',
      prompt: 'Hãy tạo video có người AI nói thuyết trình về bài học: ',
      icon: Video,
      gradient: 'from-rose-500/10 to-amber-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
    },
  ];

  return (
    <div
      className={`select-text transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-[999999] h-screen w-screen bg-[#0f1117] dark:bg-[#0f1117] overflow-hidden flex flex-col'
          : 'flex-1 flex flex-col h-full overflow-hidden relative'
      }`}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />

      {/* ChatGPT-style Model Selector Header */}
      <div
        className={`h-11 border-b px-4 flex items-center justify-between shrink-0 select-none backdrop-blur-md z-20 ${
          isDark
            ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100'
            : 'bg-white/90 border-slate-200/80 text-slate-800'
        }`}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-sm font-extrabold text-slate-900 dark:text-zinc-100 transition-colors group cursor-pointer"
          >
            <span className="text-emerald-500 text-base">⚡</span>
            <span>
              {selectedModel === 'o3mini'
                ? 'Max10 O3-Mini (Bẫy Điểm 10)'
                : selectedModel === 'studio'
                ? 'Max10 Studio (Ảnh & Video AI)'
                : 'Max10 AI (GPT-4o Omnimodel)'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-zinc-200 transition-transform" />
          </button>

          {/* Model Dropdown Menu */}
          {showModelDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowModelDropdown(false)}
              />
              <div
                className={`absolute top-full left-0 mt-1.5 w-72 sm:w-80 rounded-2xl p-2 shadow-2xl border z-40 text-xs animate-in fade-in zoom-in-95 ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Mô hình thông minh Max10 AI
                </div>

                {/* Option 1: GPT-4o */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel('gpt4o');
                    setDeepThinking(false);
                    setShowModelDropdown(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-2.5 ${
                    selectedModel === 'gpt4o'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Bot className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Max10 AI (GPT-4o Omnimodel)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 font-extrabold">
                        Mặc định
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Giải bài tập, truy vấn kiến thức toàn diện phản hồi tức thì chuẩn barem Bộ GD&amp;ĐT.
                    </p>
                  </div>
                </button>

                {/* Option 2: O3-Mini */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel('o3mini');
                    setDeepThinking(true);
                    setShowModelDropdown(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-2.5 mt-1 ${
                    selectedModel === 'o3mini'
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Brain className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Max10 O3-Mini (Suy Luận Sâu)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-600 font-extrabold">
                        Bẫy Điểm 10
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Đào sâu lập luận, quét bẫy đề thi nâng cao và bài toán phân loại học sinh giỏi.
                    </p>
                  </div>
                </button>

                {/* Option 3: Studio Ảnh & Video */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel('studio');
                    setInput('Hãy tạo ảnh và video có người AI nói chung về: ');
                    setShowModelDropdown(false);
                    textareaRef.current?.focus();
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-2.5 mt-1 ${
                    selectedModel === 'studio'
                      ? 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Film className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Max10 Studio (Ảnh &amp; Video AI)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-600 font-extrabold">
                        Cùng Lúc
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Tạo hình ảnh DALL·E 3 sắc nét 8K và dựng video Người AI nói cùng lúc trong đoạn chat.
                    </p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Model status indicator & Fullscreen Toggle Button */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Phản hồi 0.1s</span>
          </span>

          <button
            type="button"
            onClick={() => toggleFullscreen()}
            className={`p-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isFullscreen
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : isDark
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200'
            }`}
            title={isFullscreen ? 'Thoát toàn màn hình (phím Esc)' : 'Phóng to toàn màn hình'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-white" />
                <span>Thoát phóng to (Esc)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Phóng to</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Scrollable Area - Full scroll enabled from question input downwards */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 scroll-smooth overscroll-contain">
        <div
          className={`mx-auto w-full pt-4 pb-36 transition-all duration-300 ${
            isFullscreen ? 'max-w-6xl px-1 sm:px-4' : 'max-w-3xl'
          }`}
        >
          {/* Distinctive Max10 Welcome Screen */}
          {isEmptyState && (
            <div
              className={`min-h-0 flex flex-col items-center justify-start py-4 sm:py-6 text-center mx-auto w-full px-2 pb-16 transition-all duration-300 ${
                isFullscreen ? 'max-w-5xl' : 'max-w-2xl'
              }`}
            >
              {/* Refined Quick Actions Bar */}
              <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onOpenOfferModal || onOpenNameModal}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                    isDark
                      ? 'bg-zinc-900/90 border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/40 hover:border-emerald-600'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300'
                  }`}
                  title="Xem 5 Bước học tập chuẩn Điểm 10"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>5 Bước học tập chuẩn &quot;Điểm 10&quot;</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-bold ml-0.5">Mở</span>
                </button>

                {/* Mini Game Thuộc Bài Săn Top 1 Quick Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveLessonContext('');
                    setShowMiniGameModal(true);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                    isDark
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
                      : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                  }`}
                  title="Luyện 10 câu mini game thuộc bài: Đúng +1đ, Sai -0.5đ săn Top 1 Bảng Vàng"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>🎮 Mini game thuộc bài (10 câu săn Top 1)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-extrabold ml-0.5">+1đ / -0.5đ</span>
                </button>

                {onOpenStoreModal && (
                  <button
                    type="button"
                    onClick={onOpenStoreModal}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-2xs ${
                      isDark
                        ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'
                    }`}
                    title="Cài đặt Max10 vào Thiết bị (PC · Android · iOS)"
                  >
                    <span>📲</span>
                    <span>Cài đặt App</span>
                  </button>
                )}
              </div>

              {/* Grand Modern Hero Canvas */}
              <div className="relative mb-6 flex flex-col items-center">
                <div className="relative mb-4 group cursor-pointer" onClick={onOpenOfferModal}>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500/40 p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 group-hover:scale-105 transition-transform duration-300">
                    <img
                      src="/max10-avatar.jpg"
                      alt="Max10 AI"
                      className="w-full h-full object-cover rounded-[20px]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider border-2 border-white dark:border-zinc-900 shadow-md flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>THCS</span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Trợ Lý Trí Tuệ Nhân Tạo Điểm 10 Thế Hệ Mới</span>
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 text-slate-900 dark:text-white text-center leading-tight">
                  Chinh Phục Điểm 10 Cùng{' '}
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 bg-clip-text text-transparent">
                    Max10 AI
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-lg mx-auto text-center leading-relaxed mb-4">
                  Giải chi tiết từng bước · Cảnh báo bẫy đề thi mất điểm oan · Sơ đồ tư duy &amp; Video bài giảng AI
                </p>

                {/* Subject Quick Chips in Soft Neumorphism */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-3 max-w-xl">
                  {subjectPills.map((sub) => {
                    const Icon = sub.icon;
                    return (
                      <button
                        key={sub.name}
                        type="button"
                        onClick={() => {
                          setInput(sub.prompt);
                          textareaRef.current?.focus();
                        }}
                        className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-zinc-200 cursor-pointer active:scale-95 transition-all"
                      >
                        <Icon className={`w-3.5 h-3.5 ${sub.color}`} />
                        <span>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PHÔNG NỀN GIỚI THIỆU TRƯỚC CHỖ ĐẶT CÂU HỎI */}
              <div className="w-full max-w-2xl mx-auto mb-6 text-left">
                <div
                  className={`neu-card rounded-3xl p-5 sm:p-6 transition-all relative overflow-hidden border ${
                    isDark
                      ? 'border-white/5 text-zinc-100'
                      : 'border-white/60 text-slate-800'
                  }`}
                >
                  {/* Top Bar: Brand Badge & Author Credit */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/10 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-sm shadow-[2px_2px_8px_rgba(16,185,129,0.35)] shrink-0">
                        M10
                      </div>
                      <div>
                        <div className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Giới thiệu Max10 AI</span>
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            THCS Điểm 10
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                          Gia sư Trí Tuệ Nhân Tạo Điểm 10 Hàng Đầu
                        </div>
                      </div>
                    </div>

                    {/* Author Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-black shadow-2xs">
                      <Award className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Tác giả sáng lập: Mạc Khánh Duy</span>
                    </div>
                  </div>

                  {/* Intro Description */}
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-zinc-300 leading-relaxed mb-4">
                    <strong>Max10 AI</strong> do tác giả <strong>Mạc Khánh Duy</strong> sáng tạo và phát triển nhằm mang đến cho học sinh một gia sư thông minh giải đáp toàn diện: hướng dẫn phương pháp giải bản chất, vạch trần các <strong>&quot;Bẫy Điểm 10&quot;</strong> trong đề thi, vẽ sơ đồ tư duy và dựng video bài giảng sinh động hoàn toàn miễn phí.
                  </p>

                  {/* 3 Interactive Feature Blocks in Soft Neumorphism */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="p-3.5 rounded-2xl neu-pressed text-xs transition-all group/item">
                      <div className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                        <span>🎯 Giải chi tiết từng bước</span>
                      </div>
                      <div className="text-slate-500 dark:text-zinc-400 text-[11px] mt-1 leading-snug">
                        Hiểu sâu công thức, định lý và phương pháp tư duy SGK
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl neu-pressed text-xs transition-all group/item">
                      <div className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                        <span>⚠️ Soi bẫy điểm 10</span>
                      </div>
                      <div className="text-slate-500 dark:text-zinc-400 text-[11px] mt-1 leading-snug">
                        Cảnh báo lỗi sai học sinh hay mắc để không bị trừ điểm oan
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl neu-pressed text-xs transition-all group/item">
                      <div className="font-black text-teal-600 dark:text-teal-400 flex items-center gap-1.5 text-xs">
                        <span>🗺️ Sơ đồ &amp; Video AI</span>
                      </div>
                      <div className="text-slate-500 dark:text-zinc-400 text-[11px] mt-1 leading-snug">
                        Hệ thống hóa kiến thức trực quan, dễ nhớ và ôn tập
                      </div>
                    </div>
                  </div>

                  {/* Micro Footer Action */}
                  <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400 text-[11px] font-medium">
                      👉 Nhập câu hỏi hoặc gửi ảnh đề bài ngay ở khung bên dưới:
                    </span>
                    <button
                      type="button"
                      onClick={onOpenIntroModal || onOpenOfferModal || onOpenNameModal}
                      className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline cursor-pointer text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Xem hướng dẫn &amp; Tác giả</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Prominent Daily Mission Card on Dashboard */}
              <div
                className={`w-full mx-auto mb-4 transition-all duration-300 ${
                  isFullscreen ? 'max-w-5xl' : 'max-w-2xl'
                }`}
              >
                <DailyMissionCard
                  mission={dailyMission}
                  isDark={isDark}
                  onOpenMiniGame={() => setShowMiniGameModal(true)}
                />
              </div>

              {/* Central Floating Master Input Box - Expands to maximum width on fullscreen */}
              <div
                className={`w-full mx-auto relative mb-6 transition-all duration-300 ${
                  isFullscreen ? 'max-w-5xl' : 'max-w-2xl'
                }`}
              >
                {quotaStatus.isLocked ? (
                  <QuotaLimitCountdownCard
                    isDark={isDark}
                    isAdmin={isAdmin}
                    userName={userName}
                    onOpenMiniGame={() => setShowMiniGameModal(true)}
                    onOpenMathChallenge={() => setShowMathChallengeModal(true)}
                    onResetSuccess={() => setQuotaStatus(getDailyQuestionQuota(isAdmin))}
                  />
                ) : (
                  <>
                    {/* Quota Remaining Header Pill */}
                    <div className="flex items-center justify-between mb-2 px-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 font-semibold">
                        <Bot className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Hỏi bài Gia sư Điểm 10 ({grade})</span>
                      </div>
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                          isAdmin
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : quotaStatus.remaining <= 3
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        <span>💬 Lượt hỏi hôm nay:</span>
                        <span className="font-black">
                          {isAdmin ? 'Vô hạn (Admin)' : `${quotaStatus.remaining}/${MAX_DAILY_QUESTIONS}`}
                        </span>
                      </div>
                    </div>

                    {/* Floating Notification for Paste & Autocorrect */}
                    {fixToast && (
                      <div className="mb-2 text-center animate-in fade-in slide-in-from-top-1">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-xl border border-white/10">
                          {fixToast}
                        </span>
                      </div>
                    )}

                {/* Image attachment preview if attached */}
                {attachedImage && (
                  <div className="mb-2 relative inline-block text-left">
                    <img
                      src={attachedImage.previewUrl}
                      alt="Ảnh bài tập đính kèm"
                      className="h-20 w-auto rounded-xl border border-emerald-500/40 shadow-sm object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="absolute -top-1.5 -right-1.5 bg-zinc-800 text-white rounded-full p-1 hover:bg-red-500 transition-colors shadow-xs cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Input Card in Modern Neumorphism */}
                <div
                  className={`w-full rounded-3xl p-3 sm:p-4 text-left transition-all neu-card border ${
                    isDark
                      ? 'border-white/5'
                      : 'border-white/70'
                  }`}
                >
                  <textarea
                    ref={textareaRef}
                    value={input}
                    rows={2}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="Hỏi bài tập, đề thi, yêu cầu vẽ sơ đồ tư duy, tạo ảnh hoặc video AI..."
                    className={`w-full resize-none bg-transparent border-0 outline-none text-xs sm:text-sm p-1 leading-relaxed ${
                      isDark
                        ? 'text-white placeholder-zinc-500'
                        : 'text-slate-900 placeholder-slate-400'
                    }`}
                  />

                  {/* Bottom Controls Bar inside Input */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/80 mt-1">
                    {/* Left: Tools / Plus Menu */}
                    <div className="relative shrink-0 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowPlusMenu(!showPlusMenu)}
                        className="neu-btn flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-zinc-200 cursor-pointer"
                        title="Đính kèm bài tập hoặc công cụ sáng tạo"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="hidden sm:inline">Công cụ</span>
                      </button>

                      {/* Popover */}
                      {showPlusMenu && (
                        <>
                          <div
                            onClick={() => setShowPlusMenu(false)}
                            className="fixed inset-0 z-30"
                          />
                          <div
                            className={`absolute bottom-full left-0 mb-2 w-64 rounded-3xl p-2.5 neu-card z-40 text-xs text-left border ${
                              isDark
                                ? 'border-zinc-800 text-zinc-200'
                                : 'border-white/80 text-slate-800'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                fileInputRef.current?.click();
                                setShowPlusMenu(false);
                              }}
                              className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors cursor-pointer ${
                                isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                              }`}
                            >
                              <Paperclip className="w-4 h-4 text-emerald-500" />
                              <div>
                                <div className="font-semibold">Tải ảnh bài tập</div>
                                <div className="text-[11px] text-slate-400 dark:text-zinc-500">Chụp hoặc tải ảnh đề bài ({grade})</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenMindMap) onOpenMindMap();
                                setShowPlusMenu(false);
                              }}
                              className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors cursor-pointer ${
                                isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                              }`}
                            >
                              <BookOpen className="w-4 h-4 text-teal-500" />
                              <div>
                                <div className="font-semibold">Sơ đồ tư duy Điểm 10</div>
                                <div className="text-[11px] text-slate-400 dark:text-zinc-500">Hệ thống hóa bài học trực quan</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setInput('Vẽ ảnh minh họa cho bài học: ');
                                setShowPlusMenu(false);
                                textareaRef.current?.focus();
                              }}
                              className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors cursor-pointer ${
                                isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                              }`}
                            >
                              <ImageIcon className="w-4 h-4 text-pink-500" />
                              <div>
                                <div className="font-semibold">Tạo ảnh AI minh họa</div>
                                <div className="text-[11px] text-slate-400 dark:text-zinc-500">Minh họa bài học chân thực</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setInput('Tạo video có người AI nói thuyết trình về: ');
                                setShowPlusMenu(false);
                                textareaRef.current?.focus();
                              }}
                              className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors cursor-pointer ${
                                isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                              }`}
                            >
                              <Video className="w-4 h-4 text-rose-500" />
                              <div>
                                <div className="font-semibold">Làm video người AI nói</div>
                                <div className="text-[11px] text-slate-400 dark:text-zinc-500">Thuyết trình bài giảng sinh động</div>
                              </div>
                            </button>
                          </div>
                        </>
                      )}

                      {/* Paste Button from Clipboard */}
                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="neu-btn flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-zinc-200 cursor-pointer hover:text-blue-500 transition-colors"
                        title="Dán câu hỏi từ bộ nhớ tạm (Clipboard)"
                      >
                        <Copy className="w-3.5 h-3.5 text-blue-500" />
                        <span>Dán</span>
                      </button>

                      {/* Auto-fix typos & format button */}
                      <button
                        type="button"
                        onClick={handleFixQuestionErrors}
                        className="neu-btn flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-xs font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer hover:scale-105 transition-all"
                        title="Tự động sửa lỗi chính tả teen code (ko -> không, dc -> được) và chuẩn hóa công thức toán"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Sửa lỗi</span>
                      </button>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Bẫy Điểm 10 Switch */}
                      <button
                        type="button"
                        onClick={() => setDeepThinking(!deepThinking)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                          deepThinking
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-[2px_2px_8px_rgba(245,158,11,0.4)]'
                            : 'neu-btn text-amber-700 dark:text-amber-400'
                        }`}
                        title={deepThinking ? 'Chế độ Vạch Bẫy Đề đang BẬT' : 'Bật chế độ Vạch Bẫy Đề'}
                      >
                        <Zap className={`w-3.5 h-3.5 ${deepThinking ? 'text-white' : 'text-amber-500 fill-amber-500'}`} />
                        <span className="hidden sm:inline">Bẫy Điểm 10</span>
                      </button>

                      {/* Microphone */}
                      <button
                        type="button"
                        onClick={handleVoiceInput}
                        className={`p-2 rounded-2xl transition-all cursor-pointer ${
                          isListening
                            ? 'bg-rose-500 text-white animate-pulse shadow-[2px_2px_8px_rgba(244,63,94,0.4)]'
                            : 'neu-btn text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Nói câu hỏi (Tiếng Việt)"
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      {/* Voice Settings */}
                      {onOpenVoiceModal && (
                        <button
                          type="button"
                          onClick={onOpenVoiceModal}
                          className="neu-btn p-2 rounded-2xl transition-colors cursor-pointer text-slate-600 dark:text-zinc-400"
                          title="Cài đặt Giọng nói AI"
                        >
                          <Volume2 className="w-4 h-4 text-teal-500" />
                        </button>
                      )}

                      {/* Submit */}
                      <button
                        type="button"
                        onClick={() => (input.trim() || attachedImage ? handleSubmit() : undefined)}
                        disabled={!input.trim() && !attachedImage}
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          input.trim() || attachedImage
                            ? 'neu-accent-btn'
                            : 'neu-btn opacity-40 cursor-not-allowed text-slate-400 dark:text-zinc-600'
                        }`}
                        title="Gửi câu hỏi"
                      >
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

              {/* 4 Feature Suggestion Cards - Modern Neumorphism */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl w-full text-left mb-6">
                {quickActionCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.title}
                      type="button"
                      onClick={() => {
                        setInput(card.prompt);
                        textareaRef.current?.focus();
                      }}
                      className="p-4 rounded-3xl neu-card text-left group flex items-start gap-3.5 cursor-pointer hover:-translate-y-1 active:translate-y-0 transition-all border border-white/60 dark:border-white/5"
                    >
                      <div className={`p-3 rounded-2xl shrink-0 bg-gradient-to-br ${card.gradient} shadow-[2px_2px_8px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-xs text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Refined Background Theme Bar in Soft Neumorphism */}
              <div
                className={`p-2.5 rounded-2xl neu-pressed max-w-2xl w-full flex flex-wrap items-center justify-between gap-2 text-xs transition-all ${
                  isDark
                    ? 'text-zinc-300'
                    : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Phông nền: <strong className="text-slate-800 dark:text-zinc-200">{activeTheme?.callName || 'Trắng'}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {PRESET_THEMES.slice(0, 5).map((theme) => {
                    const isCurrent = activeTheme?.id === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          if (onSelectTheme) {
                            onSelectTheme(theme);
                            speakThemeName(theme.callName, voiceThemeEnabled);
                          }
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'neu-accent-btn text-white'
                            : 'neu-btn text-slate-700 dark:text-zinc-300'
                        }`}
                        title={`Đổi sang "${theme.name}"`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                          style={{
                            background:
                              theme.type === 'image'
                                ? `url(${theme.value}) center/cover`
                                : theme.value,
                          }}
                        />
                        <span>{theme.callName}</span>
                      </button>
                    );
                  })}

                  {onOpenThemeModal && (
                    <button
                      type="button"
                      onClick={onOpenThemeModal}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Thêm...
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Messages List - Roomy scroll down to bottom */}
          {!isEmptyState && (
            <div className="space-y-6 pb-28">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {/* User Message */}
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div
                        className={`max-w-[85%] rounded-3xl px-5 py-3.5 text-[15px] leading-relaxed transition-all neu-btn ${
                          isDark
                            ? 'text-zinc-100 font-normal'
                            : activeTheme?.id === 'ai-hay'
                            ? 'bg-[#dcfce7] text-slate-800 border border-emerald-200/60 font-medium'
                            : 'text-slate-800 font-medium'
                        }`}
                      >
                        {msg.imagePreview && (
                          <div className="mb-2">
                            <img
                              src={msg.imagePreview}
                              alt="Đề bài đính kèm"
                              className="max-h-52 rounded-2xl object-contain border border-black/10 shadow-xs"
                            />
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message */
                    <div className="flex items-start gap-3.5">
                      {/* Max10 Avatar */}
                      <div className="w-9 h-9 rounded-2xl overflow-hidden shrink-0 mt-1 shadow-[2px_2px_8px_rgba(16,185,129,0.35)] select-none border border-emerald-500/30 bg-emerald-500/10">
                        <img
                          src="/max10-avatar.jpg"
                          alt="Max10"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 overflow-hidden">
                        {/* Deep Reasoning / Trap detector notice in Neumorphism */}
                        {msg.deepThinkingContent && (
                          <div className="mb-3 p-3.5 rounded-2xl neu-pressed text-xs leading-relaxed">
                            <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-600 dark:text-amber-400">
                              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>Đã quét bẫy đề thi & lập luận từng bước (Chuẩn barem Điểm 10)</span>
                            </div>
                            <p className="opacity-90">{msg.deepThinkingContent}</p>
                          </div>
                        )}

                        <div
                          className={`text-[15px] leading-relaxed select-text ${
                            isDark ? 'text-zinc-200' : 'text-slate-800'
                          }`}
                        >
                          <Markdown
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-lg sm:text-xl font-bold mt-4 mb-2 pb-1 border-b border-black/10 dark:border-white/10 text-emerald-700 dark:text-emerald-400">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-base sm:text-lg font-bold mt-3 mb-1.5 text-slate-900 dark:text-white">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-[15px] font-semibold mt-2.5 mb-1 text-emerald-600 dark:text-emerald-400">
                                  {children}
                                </h3>
                              ),
                              p: ({ children }) => (
                                <p className="mb-2 leading-relaxed">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>
                              ),
                              li: ({ children }) => (
                                <li className="leading-relaxed">{children}</li>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-3 border-emerald-500 pl-3 py-1.5 my-2.5 rounded-r-xl bg-emerald-500/10 text-slate-700 dark:text-zinc-300">
                                  {children}
                                </blockquote>
                              ),
                              code: ({ inline, className, children, ...props }: any) => {
                                const match = /language-(\w+)/.exec(className || '');
                                const lang = match ? match[1] : '';
                                const codeContent = String(children).replace(/\n$/, '');
                                if (inline || (!match && !codeContent.includes('\n'))) {
                                  return (
                                    <code className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold" {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                                return (
                                  <ChatGPTCodeBlock language={lang || 'toán học & code'} code={codeContent} />
                                );
                              },
                              hr: () => (
                                <hr className="my-3 border-black/10 dark:border-white/10" />
                              ),
                              a: ({ href, children }) => {
                                const is5StepLink =
                                  href === '#5-buoc-diem-10' ||
                                  href === '#5-buoc' ||
                                  href === '#guide' ||
                                  href === '#diem10' ||
                                  (typeof href === 'string' && href.includes('5-buoc'));
                                if (is5StepLink) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => onOpenOfferModal && onOpenOfferModal()}
                                      className="inline-flex items-center gap-1.5 px-3 py-1 my-1 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all cursor-pointer shadow-2xs group"
                                      title="Bấm vào để xem 5 Bước học tập chuẩn Điểm 10"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
                                      <span>{children}</span>
                                    </button>
                                  );
                                }

                                // Intercept Payment & QR Code links (User Requirement: khi người ta muốn hỏi hay muốn chuyển tiền thì sẽ đưa ra một link đưa đến mã QR này)
                                const isQrLink =
                                  href === '#chuyen-khoan' ||
                                  href === '#chuyen-khoan-plus' ||
                                  href === '#chuyen-khoan-premium' ||
                                  href === '#ma-qr' ||
                                  href === '#qr-code' ||
                                  href === '#bang-gia' ||
                                  (typeof href === 'string' && (
                                    href.includes('chuyen-khoan') ||
                                    href.includes('pay=') ||
                                    href.includes('upgrade') ||
                                    href.includes('ma-qr')
                                  ));

                                if (isQrLink) {
                                  const isPremium = typeof href === 'string' && (href.includes('premium') || href.includes('prerium'));
                                  const targetPlan = isPremium ? 'premium' : 'plus';
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onOpenPricingModal) {
                                          onOpenPricingModal(targetPlan, 'checkout');
                                        }
                                      }}
                                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 my-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 border ${
                                        isPremium
                                          ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-500 hover:to-pink-500 text-white border-purple-400/60 shadow-purple-500/20'
                                          : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/60 shadow-emerald-500/20'
                                      }`}
                                      title="Bấm vào để mở trực tiếp Mã QR Chuyển Khoản Ngân Hàng"
                                    >
                                      <QrCode className="w-4 h-4 shrink-0" />
                                      <span>{children}</span>
                                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                    </button>
                                  );
                                }

                                // Intercept Video Studio links (User requirement: tạo video có người AI nói)
                                if (
                                  href === '#open-video-studio' ||
                                  href === '#video-studio' ||
                                  href === '#video'
                                ) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => onOpenVideoStudio && onOpenVideoStudio()}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 my-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer border border-rose-400/40"
                                      title="Bấm vào để mở Xưởng Làm Video Có Người AI Nói"
                                    >
                                      <Video className="w-4 h-4 shrink-0" />
                                      <span>{children}</span>
                                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                    </button>
                                  );
                                }

                                // Intercept Image Studio links (User requirement: tạo ảnh chuẩn như ChatGPT DALL-E 3)
                                if (
                                  href === '#open-image-studio' ||
                                  href === '#image-studio' ||
                                  href === '#image'
                                ) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => onOpenImageStudio && onOpenImageStudio()}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 my-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer border border-emerald-400/40"
                                      title="Bấm vào để mở Xưởng Tạo Ảnh Chuẩn Xác Như ChatGPT"
                                    >
                                      <ImageIcon className="w-4 h-4 shrink-0" />
                                      <span>{children}</span>
                                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                    </button>
                                  );
                                }

                                // Intercept Control Center links (User requirement: điều khiển Max10 - Quản trị viên Mạc Khánh Duy)
                                if (
                                  href === '#open-control-center' ||
                                  href === '#control-center' ||
                                  href === '#control'
                                ) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => onOpenControlCenter && onOpenControlCenter()}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 my-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-600 via-orange-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer border border-amber-400/40"
                                      title="Bấm vào để mở Thanh Điều Khiển Max10 - Quản trị viên Mạc Khánh Duy"
                                    >
                                      <Crown className="w-4 h-4 shrink-0" />
                                      <span>{children}</span>
                                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                    </button>
                                  );
                                }

                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-600 dark:text-emerald-400 underline font-semibold hover:text-emerald-700"
                                  >
                                    {children}
                                  </a>
                                );
                              },
                            }}
                          >
                            {formatDolaMath(msg.content)}
                          </Markdown>
                        </div>

                        {/* Generated Image Showcase Card */}
                        {msg.generatedImage && (
                          <div className="mt-3.5 rounded-2xl overflow-hidden border border-black/10 dark:border-zinc-800 shadow-md bg-black/5 max-w-md transition-all">
                            <div className="relative group">
                              <img
                                src={msg.generatedImage.url}
                                alt={msg.generatedImage.prompt}
                                className="w-full max-h-[380px] object-contain cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]"
                                onClick={() => setFullscreenImage(msg.generatedImage?.url || null)}
                              />
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setFullscreenImage(msg.generatedImage?.url || null)}
                                  className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white backdrop-blur-xs transition-colors shadow-xs"
                                  title="Xem ảnh lớn"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDownloadImage(
                                      msg.generatedImage?.url || '',
                                      msg.generatedImage?.prompt || 'max10-ai'
                                    )
                                  }
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white backdrop-blur-xs transition-colors shadow-xs"
                                  title="Tải ảnh về máy"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div
                              className={`p-2.5 flex items-center justify-between gap-2 text-xs border-t ${
                                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200/80'
                              }`}
                            >
                              <span className="text-slate-400 truncate text-[11px]">
                                🎨 {msg.generatedImage.prompt}
                              </span>
                              <button
                                onClick={() =>
                                  handleDownloadImage(
                                    msg.generatedImage?.url || '',
                                    msg.generatedImage?.prompt || 'max10-ai'
                                  )
                                }
                                className="font-semibold text-emerald-600 hover:underline shrink-0 flex items-center gap-1 text-[11px]"
                              >
                                <Download className="w-3 h-3" />
                                Tải ảnh
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Generated Video Player (ChatGPT / Max10 Studio Style) */}
                        {msg.generatedVideo && (
                          <ChatGPTVideoPlayer
                            video={msg.generatedVideo}
                            isDark={isDark}
                            onOpenVideoStudio={onOpenVideoStudio}
                          />
                        )}

                        {/* Action buttons (ChatGPT Style) */}
                        <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400 select-none">
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                            }`}
                            title="Sao chép lời giải"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-bold">Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Sao chép</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setFeedbackGiven((prev) => ({ ...prev, [msg.id]: 'up' }));
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              feedbackGiven[msg.id] === 'up'
                                ? 'text-emerald-500 bg-emerald-500/10 font-bold'
                                : isDark
                                ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                            }`}
                            title="Câu trả lời hữu ích (Good response)"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setFeedbackGiven((prev) => ({ ...prev, [msg.id]: 'down' }));
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              feedbackGiven[msg.id] === 'down'
                                ? 'text-rose-500 bg-rose-500/10 font-bold'
                                : isDark
                                ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                            }`}
                            title="Chưa hài lòng (Bad response)"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleSpeak(msg.content, msg.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              speakingId === msg.id
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 ring-2 ring-emerald-500/20'
                                : isDark
                                ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                            }`}
                            title="Nghe giảng bài bằng Giọng nói AI (Gemini TTS)"
                          >
                            <Volume2
                              className={`w-3.5 h-3.5 ${
                                speakingId === msg.id ? 'animate-bounce text-emerald-500' : ''
                              }`}
                            />
                            <span>{speakingId === msg.id ? 'Dừng đọc' : 'Đọc bài'}</span>
                          </button>

                          <button
                            onClick={onRegenerate}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                            }`}
                            title="Tạo lại câu trả lời"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Tạo lại</span>
                          </button>

                          {/* Mini Game Thuộc Bài Săn Top 1 Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveLessonContext(msg.content);
                              setShowMiniGameModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-orange-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-black hover:scale-105 transition-all cursor-pointer shadow-2xs ml-1"
                            title="Kiểm tra kiến thức xem đã thuộc bài chưa: Đúng +1đ, Sai -0.5đ leo Top 1 Bảng Vàng"
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>🎮 Mini game thuộc bài (10 câu săn Top 1)</span>
                          </button>
                        </div>

                        {/* VIP Upgrade Callout Card (User requirement: Sau khi trả lời xong câu hỏi thì hiện ra dùng gói plus hoặc prerium và đưa người ta đến chỗ giống như chatgpt mà nạp tiền vào) */}
                        {subscriptionPlan === 'free' && onOpenPricingModal && (
                          <div className="mt-3.5 p-3 sm:p-3.5 rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                                <Zap className="w-4 h-4 fill-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                                    Đặc quyền Gói VIP Học Tập &amp; Tạo Ảnh - Video Không Giới Hạn
                                  </p>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                    VIP MAX10
                                  </span>
                                </div>
                                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed mt-0.5">
                                  Nâng cấp ngay <strong>Gói Plus (100.000đ/tháng)</strong> hoặc <strong>Gói Premium (500.000đ/tháng)</strong> để mở khóa trọn bộ Xưởng Tạo Ảnh DALL·E 3, Video Người AI Nói và giải đề thần tốc 0.1s!
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => (onOpenPricingModal ? onOpenPricingModal('plus', 'checkout') : undefined)}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Mở Mã QR Nâng cấp</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-start gap-3.5 pt-2">
                  <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs shrink-0 border border-emerald-500/30 select-none bg-emerald-500/10">
                    <img
                      src="/max10-avatar.jpg"
                      alt="Max10"
                      className="w-full h-full object-cover animate-pulse"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="py-1">
                    {subscriptionPlan === 'free' ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                          <span
                            className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          />
                          <span
                            className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                            style={{ animationDelay: '0.4s' }}
                          />
                        </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          ⚡ Max10 đang giải bài tập chi tiết từng bước &amp; quét bẫy điểm 10...
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                          <span
                            className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          />
                          <span
                            className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                            style={{ animationDelay: '0.4s' }}
                          />
                        </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          ⚡ [{subscriptionPlan.toUpperCase()}] Max10 đang phản hồi siêu tốc tức thì...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Docked Input Bar when active messages exist */}
      {!isEmptyState && (
        <div
          className={`p-2 sm:p-2.5 border-t transition-colors shrink-0 z-10 ${
            isDark
              ? 'bg-[#18181b] border-zinc-800'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div
            className={`mx-auto w-full transition-all duration-300 ${
              isFullscreen ? 'max-w-6xl px-1 sm:px-4' : 'max-w-3xl'
            }`}
          >
            {quotaStatus.isLocked ? (
              <div className="py-2">
                <QuotaLimitCountdownCard
                  isDark={isDark}
                  isAdmin={isAdmin}
                  userName={userName}
                  onOpenMiniGame={() => setShowMiniGameModal(true)}
                  onOpenMathChallenge={() => setShowMathChallengeModal(true)}
                  onResetSuccess={() => setQuotaStatus(getDailyQuestionQuota(isAdmin))}
                />
              </div>
            ) : (
              <>
                {/* Quota & Daily Mission Remaining Header Pill */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5 px-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                      Gia sư Điểm 10 Max10 ({grade})
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border transition-colors ${
                        dailyMission.isCompleted
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}
                    >
                      <span>🎯 Nhiệm vụ: {dailyMission.currentInteractions}/10</span>
                      {dailyMission.isCompleted && <span>✓ Đã xong (+150 XP)</span>}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border transition-colors ${
                      isAdmin
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : quotaStatus.remaining <= 3
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    💬 Còn {isAdmin ? 'vô hạn (Admin)' : `${quotaStatus.remaining}/${MAX_DAILY_QUESTIONS}`} lượt hỏi hôm nay
                  </span>
                </div>

                {/* Image attachment preview */}
                {attachedImage && (
                  <div className="mb-1.5 relative inline-block">
                    <img
                      src={attachedImage.previewUrl}
                      alt="Ảnh bài tập"
                      className="h-14 w-auto rounded-xl border border-emerald-500/40 shadow-xs object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="absolute -top-1.5 -right-1.5 bg-zinc-800 text-white rounded-full p-1 hover:bg-red-500 transition-colors shadow-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Floating Notification for Paste & Autocorrect */}
                {fixToast && (
                  <div className="mb-2 text-center animate-in fade-in slide-in-from-bottom-1">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-xl border border-white/10">
                      {fixToast}
                    </span>
                  </div>
                )}

                {/* Input Capsule Box in Modern Neumorphism */}
                <div
              className={`flex items-center gap-2 rounded-full transition-all px-3 sm:px-4 py-1.5 neu-pressed ${
                isDark
                  ? 'text-zinc-100'
                  : 'text-slate-800'
              }`}
            >
              {/* Plus Button */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPlusMenu(!showPlusMenu)}
                  className="neu-btn p-1.5 rounded-full text-emerald-600 dark:text-emerald-400 cursor-pointer"
                  title="Tải ảnh đề bài hoặc vẽ ảnh"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {showPlusMenu && (
                  <>
                    <div
                      onClick={() => setShowPlusMenu(false)}
                      className="fixed inset-0 z-30"
                    />
                    <div
                      className={`absolute bottom-full left-0 mb-2 w-56 rounded-2xl p-2 shadow-xl border z-40 text-xs text-left ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                          isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                        }`}
                      >
                        <Paperclip className="w-4 h-4 text-emerald-500" />
                        <span>Tải ảnh đề bài ({grade})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInput('Hãy tạo ảnh và video có người AI nói chung về: ');
                          setShowPlusMenu(false);
                          textareaRef.current?.focus();
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors font-bold ${
                          isDark ? 'hover:bg-zinc-800 text-amber-400' : 'hover:bg-slate-100 text-amber-600'
                        }`}
                      >
                        <Film className="w-4 h-4 text-amber-500" />
                        <span>🎨🎬 Tạo Ảnh &amp; Video AI Chung</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenMindMap) onOpenMindMap();
                          setShowPlusMenu(false);
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                          isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                        }`}
                      >
                        <GitFork className="w-4 h-4 text-teal-500" />
                        <span>Sơ đồ tư duy điểm 10</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenThemeModal) onOpenThemeModal();
                          setShowPlusMenu(false);
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                          isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                        }`}
                      >
                        <Palette className="w-4 h-4 text-emerald-500" />
                        <span>Tùy biến phông nền &amp; ảnh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInput('Tạo ảnh AI: ');
                          setShowPlusMenu(false);
                          textareaRef.current?.focus();
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                          isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4 text-pink-500" />
                        <span>🎨 Tạo Ảnh AI Chuẩn Xác</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInput('Tạo poster áp phích học tập: ');
                          setShowPlusMenu(false);
                          textareaRef.current?.focus();
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                          isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                        }`}
                      >
                        <GitFork className="w-4 h-4 text-purple-500" />
                        <span>🖼️ Tạo Poster &amp; Áp Phích AI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInput('Tạo video có người AI nói thuyết trình về: ');
                          setShowPlusMenu(false);
                          textareaRef.current?.focus();
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                          isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                        }`}
                      >
                        <Video className="w-4 h-4 text-rose-500" />
                        <span>🎬 Làm Video Người AI Nói</span>
                      </button>

                      {onOpenVoiceModal && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenVoiceModal) onOpenVoiceModal();
                            setShowPlusMenu(false);
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                            isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                          }`}
                        >
                          <Volume2 className="w-4 h-4 text-teal-500" />
                          <span>Giọng nói AI Gemini</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Paste Button from Clipboard */}
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="neu-btn hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-zinc-200 cursor-pointer hover:text-blue-500 transition-colors shrink-0"
                title="Dán câu hỏi từ bộ nhớ tạm (Clipboard)"
              >
                <Copy className="w-3.5 h-3.5 text-blue-500" />
                <span>Dán</span>
              </button>

              {/* Auto-fix typos & format button */}
              <button
                type="button"
                onClick={handleFixQuestionErrors}
                className="neu-btn flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-xs font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer hover:scale-105 transition-all shrink-0"
                title="Tự động sửa lỗi chính tả teen code (ko -> không, dc -> được) và chuẩn hóa công thức toán"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Sửa lỗi</span>
              </button>

              {/* Text Area */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Hỏi bài tập, tạo ảnh AI, poster AI hoặc làm video...`}
                rows={1}
                className={`flex-1 min-w-0 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs sm:text-sm resize-none leading-relaxed py-1 ${
                  isDark ? 'text-white placeholder-zinc-500' : 'text-slate-900 placeholder-slate-400'
                }`}
              />

              {/* Right Controls in Modern Neumorphism */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setDeepThinking(!deepThinking)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                    deepThinking
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-[2px_2px_8px_rgba(245,158,11,0.4)]'
                      : 'neu-btn text-amber-700 dark:text-amber-400'
                  }`}
                  title="Chế độ Vạch Bẫy Đề & Suy Luận"
                >
                  <Zap
                    className={`w-3.5 h-3.5 ${deepThinking ? 'text-white' : 'text-amber-500 fill-amber-500'}`}
                  />
                  <span className="hidden sm:inline">Bẫy Điểm 10</span>
                </button>

                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-full transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-[2px_2px_8px_rgba(244,63,94,0.4)]'
                      : 'neu-btn text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Nhập bằng giọng nói"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {onOpenVoiceModal && (
                  <button
                    type="button"
                    onClick={onOpenVoiceModal}
                    className="neu-btn p-2 rounded-full transition-colors cursor-pointer text-slate-600 dark:text-zinc-400"
                    title="Cài đặt Giọng nói AI"
                  >
                    <Volume2 className="w-4 h-4 text-teal-500" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => (input.trim() || attachedImage ? handleSubmit() : undefined)}
                  disabled={!input.trim() && !attachedImage}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                    input.trim() || attachedImage
                      ? 'neu-accent-btn'
                      : 'neu-btn opacity-40 cursor-not-allowed text-slate-400 dark:text-zinc-600'
                  }`}
                  title="Gửi bài hỏi"
                >
                  <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Footer text (ChatGPT Style) */}
            <p className="text-[10px] sm:text-[11px] text-center text-slate-400 dark:text-zinc-500 mt-1.5 select-none">
              Max10 AI có thể mắc lỗi. Hãy kiểm tra các thông tin học tập quan trọng. ·{' '}
              <button
                type="button"
                onClick={onOpenOfferModal || onOpenNameModal}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                title="Bấm để đổi tên gọi & xem 5 bước"
              >
                <span>{userName || 'bạn học'}</span>
              </button>{' '}
              săn điểm 10 ·{' '}
              <button
                type="button"
                onClick={onOpenOfferModal || onOpenNameModal}
                className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                🚀 5 Bước Điểm 10
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )}

      {/* Floating AI Voice Player Bar */}
      <AIVoicePlayerBar
        onOpenVoiceModal={onOpenVoiceModal || (() => {})}
        isDark={isDark}
      />

      {/* Fullscreen Lightbox Modal */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md"
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Phóng to ảnh"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Mini Game Quiz Modal (10 câu hỏi, +1đ đúng, -0.5đ sai, Săn Top 1 Bảng Vàng) */}
      <MiniGameQuizModal
        isOpen={showMiniGameModal}
        onClose={() => setShowMiniGameModal(false)}
        grade={grade}
        lessonContext={activeLessonContext}
        userName={userName}
        isDark={isDark}
      />

      {/* Math Challenge Modal (Đại số & Hình học kiếm +75XP thưởng khi hết lượt) */}
      <MathChallengeModal
        isOpen={showMathChallengeModal}
        onClose={() => setShowMathChallengeModal(false)}
        grade={grade}
        userName={userName}
        isDark={isDark}
      />
    </div>
  );
};
