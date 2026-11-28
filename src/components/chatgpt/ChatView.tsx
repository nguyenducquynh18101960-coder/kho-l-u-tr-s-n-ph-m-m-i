import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
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
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Film,
  Bot,
  Trophy,
  Camera,
  Flame,
  FileCheck2,
  ArrowRight,
  Award,
  ClipboardPaste,
  FileText,
} from 'lucide-react';
import { GradeLevel, ChatMessage } from '../../types';
import { UserAccount } from '../../types/auth';
import { BackgroundTheme, PRESET_THEMES } from '../../types/theme';
import { speakThemeName } from '../../utils/speechTheme';
import { aiVoice } from '../../utils/aiVoiceEngine';
import { AIVoicePlayerBar } from './AIVoicePlayerBar';
import { ChatGPTCodeBlock } from './ChatGPTCodeBlock';
import { ChatGPTVideoPlayer } from './ChatGPTVideoPlayer';
import { MiniGameQuizModal } from './MiniGameQuizModal';
import { MathChallengeModal } from './MathChallengeModal';
import { QuotaLimitCountdownCard } from './QuotaLimitCountdownCard';
import { getTodayDailyMission, DailyMission } from '../../data/dailyMissions';
import { loadStudentAchievements, StudentAchievementStats } from '../../data/initialAchievements';
import { calculateLevel, formatLevelLabel } from '../../types/achievements';
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
import { MainTabId } from './Sidebar';
import {
  CountryCode,
  QuizRole,
  QuizTopicId,
  QUIZ_TOPICS,
  getCountryCulture,
} from '../../data/countryCultures';
import { RobotTutor3D, RobotReactionType } from './RobotTutor3D';
import { SmartWhiteboard } from './SmartWhiteboard';
import { recordAttemptResult } from '../../utils/knowledgeGapTracker';
import { AIVoicePersona } from '../../types/voice';
import { DiscordStudyCards } from './DiscordStudyCards';
import {
  GlobalStudyProfile,
  VirtualStudyBuddy,
  StudyPresenceStatus,
  StudyLanguageMode,
  SLASH_COMMANDS,
  loadGlobalStudyProfile,
} from '../../data/globalStudySystem';

interface ChatViewProps {
  grade: GradeLevel;
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (
    text: string,
    image?: {
      data: string;
      mimeType: string;
      previewUrl?: string;
      name?: string;
      isImage?: boolean;
      size?: number;
    } | null,
    isThinking?: boolean,
    mode?: 'tutor' | 'grade_10_secret' | 'mindmap' | 'trap_detector' | 'all_in_one',
    quizOverrides?: {
      interactiveQuizMode?: boolean;
      quizSubject?: QuizTopicId;
      quizRole?: QuizRole;
      isImageMode?: boolean;
    }
  ) => void;
  onRegenerate: () => void;
  isDark: boolean;
  onOpenImageStudio?: () => void;
  onOpenMindMap?: () => void;
  onOpenVideoStudio?: () => void;
  onOpenControlCenter?: () => void;
  onSelectTab?: (tab: MainTabId) => void;
  onOpenAchievementsModal?: () => void;
  activeTheme?: BackgroundTheme;
  onSelectTheme?: (theme: BackgroundTheme) => void;
  onOpenThemeModal?: () => void;
  voiceThemeEnabled?: boolean;
  onOpenVoiceModal?: () => void;
  userName?: string;
  userAvatar?: string;
  currentUser?: UserAccount | null;
  onOpenNameModal?: () => void;
  onOpenIntroModal?: () => void;
  onOpenStoreModal?: () => void;
  subscriptionPlan?: 'free' | 'plus' | 'premium';
  onOpenPricingModal?: (initialPlan?: 'plus' | 'premium', initialStep?: 'plans' | 'checkout') => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: (val?: boolean) => void;
  isAdmin?: boolean;
  countryCode?: CountryCode;
  bilingualMode?: boolean;
  quizVoiceMode?: boolean;
  onToggleQuizVoiceMode?: () => void;
  quizSubject?: QuizTopicId;
  onSelectQuizSubject?: (topic: QuizTopicId) => void;
  quizRole?: QuizRole;
  onSelectQuizRole?: (role: QuizRole) => void;
  globalStudyProfile?: GlobalStudyProfile;
  activeStudyBuddy?: VirtualStudyBuddy | null;
  onExecuteSlashCommand?: (cmd: string) => void;
  onAddStudyFriend?: (buddy: VirtualStudyBuddy) => void;
  onStartBuddyChat?: (buddy: VirtualStudyBuddy) => void;
  onExitBuddyChat?: () => void;
  onCycleStudyStatus?: (status: StudyPresenceStatus) => void;
  onApplyCurriculumSetup?: (config: {
    countryCode: CountryCode;
    gradeLabel: string;
    subject: QuizTopicId;
    languageMode: StudyLanguageMode;
    startQuiz: boolean;
  }) => void;
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
  onSelectTab,
  onOpenAchievementsModal,
  activeTheme,
  onSelectTheme,
  onOpenThemeModal,
  voiceThemeEnabled = true,
  onOpenVoiceModal,
  userName = 'Bạn học',
  userAvatar,
  currentUser,
  onOpenNameModal,
  onOpenIntroModal,
  subscriptionPlan = 'free',
  onOpenPricingModal,
  isFullscreen: isFullscreenProp,
  onToggleFullscreen,
  isAdmin = false,
  countryCode = 'VN',
  bilingualMode = true,
  quizVoiceMode = false,
  onToggleQuizVoiceMode,
  quizSubject = 'Toán',
  onSelectQuizSubject,
  quizRole = 'tutor',
  onSelectQuizRole,
  globalStudyProfile,
  activeStudyBuddy = null,
  onExecuteSlashCommand,
  onAddStudyFriend,
  onStartBuddyChat,
  onExitBuddyChat,
  onCycleStudyStatus,
  onApplyCurriculumSetup,
}) => {
  const activeCountry = getCountryCulture(countryCode);
  const effectiveStudyProfile =
    globalStudyProfile || loadGlobalStudyProfile(userName, grade, countryCode);
  const [autoSpeakTutor, setAutoSpeakTutor] = useState<boolean>(true);
  const [input, setInput] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('toan');
  const [attachedImage, setAttachedImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
    name: string;
    isImage: boolean;
    size: number;
  } | null>(null);
  const [isImageMode, setIsImageMode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [failedImgUrls, setFailedImgUrls] = useState<Record<string, boolean>>({});
  const [imgSrcOverrides, setImgSrcOverrides] = useState<Record<string, string>>({});
  const [deepThinking, setDeepThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [activeVoicePersona, setActiveVoicePersona] = useState<AIVoicePersona>(() =>
    aiVoice.getState().activePersona
  );
  const [selectedModel, setSelectedModel] = useState<'ultra' | 'deepthink' | 'allinone' | 'studio'>('ultra');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [localIsFullscreen, setLocalIsFullscreen] = useState(false);
  const [robotReaction, setRobotReaction] = useState<RobotReactionType>('none');
  const [robotReactionTrigger, setRobotReactionTrigger] = useState<number>(0);

  // Live Achievement Stats for Welcome Dashboard Card
  const [achievementStats, setAchievementStats] = useState<StudentAchievementStats>(() =>
    loadStudentAchievements()
  );

  useEffect(() => {
    const handleStatsUpdate = () => {
      setAchievementStats(loadStudentAchievements());
    };
    window.addEventListener('max10_achievements_updated', handleStatsUpdate);
    window.addEventListener('focus', handleStatsUpdate);
    return () => {
      window.removeEventListener('max10_achievements_updated', handleStatsUpdate);
      window.removeEventListener('focus', handleStatsUpdate);
    };
  }, []);

  // Daily Question Quota
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

  // Daily Mission Goal
  const [dailyMission, setDailyMission] = useState<DailyMission>(() =>
    getTodayDailyMission(quotaStatus.used)
  );

  useEffect(() => {
    setDailyMission(getTodayDailyMission(quotaStatus.used));
  }, [quotaStatus.used]);

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

  const [fixToast, setFixToast] = useState<string | null>(null);
  const [showMiniGameModal, setShowMiniGameModal] = useState<boolean>(false);
  const [showMathChallengeModal, setShowMathChallengeModal] = useState<boolean>(false);
  const [activeLessonContext, setActiveLessonContext] = useState<string>('');

  useEffect(() => {
    const onOpenMiniGame = () => {
      setActiveLessonContext('');
      setShowMiniGameModal(true);
    };
    window.addEventListener('max10_open_minigame', onOpenMiniGame);
    return () => window.removeEventListener('max10_open_minigame', onOpenMiniGame);
  }, []);

  const showToast = (msg: string, duration = 2600) => {
    setFixToast(msg);
    setTimeout(() => setFixToast(null), duration);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setInput((prev) => (prev ? prev + ' ' + text.trim() : text.trim()));
        showToast('Đã dán câu hỏi từ bộ nhớ tạm!');
        textareaRef.current?.focus();
      } else {
        showToast('Bộ nhớ tạm chưa có nội dung sao chép nào.');
      }
    } catch {
      showToast('Nhấn Ctrl+V để dán trực tiếp câu hỏi vào khung nhập.');
    }
  };

  const handleFixQuestionErrors = () => {
    if (!input || !input.trim()) {
      showToast('Hãy nhập hoặc dán câu hỏi trước khi sửa lỗi.');
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
    showToast('Đã chuẩn hóa chính tả & công thức toán học!');
    textareaRef.current?.focus();
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  useEffect(() => {
    const unsub = aiVoice.subscribe((st) => {
      setSpeakingId(st.isPlaying ? st.activeMessageId : null);
      setActiveVoicePersona(st.activePersona);
    });
    return unsub;
  }, []);

  const prevMsgCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && !loading) {
      const lastMsg = messages[messages.length - 1];
      const shouldSpeak =
        lastMsg &&
        lastMsg.role === 'assistant' &&
        ((quizVoiceMode && autoSpeakTutor) || aiVoice.getSettings().autoReadResponse);
      if (shouldSpeak) {
        aiVoice.speak(lastMsg.content, lastMsg.id, undefined, activeCountry.ttsLang);
      }

      if (quizVoiceMode && lastMsg && lastMsg.role === 'assistant') {
        const lower = lastMsg.content.toLowerCase();
        const isCorrectPraise =
          /chính xác|đúng rồi|xuất sắc|tuyệt vời|giỏi quá|chuẩn rồi|correct|great job|well done|excellent|bravo|正解|すばらしい|잘했어요|정답|ausgezeichnet|parfait/.test(
            lower
          ) && !/chưa chính xác|chưa đúng|không chính xác/.test(lower);
        const isEncourageHint =
          /gần đúng|chưa đúng|chưa chính xác|thử lại|gợi ý nhẹ|suy nghĩ lại|almost|try again|not quite|hint|もう少し|다시 한 번|noch einmal|presque/.test(
            lower
          );

        const lastUserMsg = [...messages]
          .slice(0, -1)
          .reverse()
          .find((m) => m.role === 'user');
        const prevTutorQuestion = [...messages]
          .slice(0, -1)
          .reverse()
          .find((m) => m.role === 'assistant');

        if (isCorrectPraise) {
          setRobotReaction('celebrate');
          setRobotReactionTrigger((n) => n + 1);
          recordAttemptResult({
            subject: quizSubject,
            topic: `Hỏi bài 3D · ${quizSubject}`,
            question: prevTutorQuestion?.content.slice(0, 220) || `Câu hỏi ${quizSubject} cùng Gia sư 3D`,
            userAnswer: lastUserMsg?.content.slice(0, 140),
            explanation: lastMsg.content.slice(0, 240),
            isCorrect: true,
            source: 'ai_quiz',
          });
        } else if (isEncourageHint) {
          setRobotReaction('encourage');
          setRobotReactionTrigger((n) => n + 1);
          recordAttemptResult({
            subject: quizSubject,
            topic: `Hỏi bài 3D · ${quizSubject}`,
            question: prevTutorQuestion?.content.slice(0, 220) || `Câu hỏi ${quizSubject} cùng Gia sư 3D`,
            userAnswer: lastUserMsg?.content.slice(0, 140),
            explanation: lastMsg.content.slice(0, 260),
            isCorrect: false,
            source: 'ai_quiz',
          });
        }
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, loading, quizVoiceMode, autoSpeakTutor, activeCountry.ttsLang, quizSubject]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    aiVoice.speak(text, id, undefined, activeCountry.ttsLang);
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
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename || 'max10-ai'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('Tệp vượt quá 15MB. Vui lòng chọn tệp hoặc ảnh nhỏ hơn.');
      e.target.value = '';
      return;
    }

    const isImg =
      file.type.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = (reader.result as string) || '';
      const base64Data = result.includes(',') ? result.split(',')[1] : '';
      setAttachedImage({
        data: base64Data,
        mimeType: file.type || (isImg ? 'image/png' : 'text/plain'),
        previewUrl: isImg ? result : '',
        name: file.name,
        isImage: isImg,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowPlusMenu(false);
    textareaRef.current?.focus();
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast(`Trình duyệt hiện tại chưa hỗ trợ ghi âm giọng nói (${activeCountry.languageName}) trực tiếp.`);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = activeCountry.speechLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);
      showToast(`🎤 Đang nghe (${activeCountry.flag} ${activeCountry.languageName})...`);
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

  const handleStartQuizSession = (customTopic?: QuizTopicId) => {
    const topicToUse = customTopic || quizSubject;
    if (!isAdmin && quotaStatus.remaining <= 0) {
      setQuotaStatus(getDailyQuestionQuota(isAdmin));
      return;
    }
    useQuestionSlot(isAdmin);
    setQuotaStatus(getDailyQuestionQuota(isAdmin));
    const roleLabel = quizRole === 'deskmate' ? 'bạn học cùng bàn' : 'gia sư';
    const startPrompt = `Bắt đầu chế độ Nói chuyện & Hỏi bài (${roleLabel}) môn ${topicToUse} (${grade}, phong cách ${activeCountry.nativeName}). Hãy chào ngắn gọn và đặt cho mình câu hỏi đầu tiên (mức độ dễ trước) và đợi mình trả lời nhé!`;
    onSendMessage(startPrompt, null, false, 'tutor', {
      interactiveQuizMode: true,
      quizSubject: topicToUse,
      quizRole,
    });
  };

  const trimmedInput = input.trim();
  const isTypingSlashMenu = trimmedInput.startsWith('/') && !trimmedInput.includes(' ');
  const matchingSlashCommands = isTypingSlashMenu
    ? SLASH_COMMANDS.filter((c) => c.command.startsWith(trimmedInput.toLowerCase()))
    : [];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachedImage) || loading) return;

    const isLocalSlashCmd =
      trimmedInput.startsWith('/') &&
      !trimmedInput.startsWith('/hoibai') &&
      !trimmedInput.startsWith('/chat ');

    if (!isLocalSlashCmd) {
      if (!isAdmin && quotaStatus.remaining <= 0) {
        setQuotaStatus(getDailyQuestionQuota(isAdmin));
        return;
      }

      useQuestionSlot(isAdmin);
      const nextQuota = getDailyQuestionQuota(isAdmin);
      setQuotaStatus(nextQuota);

      if (!isAdmin && nextQuota.used >= MAX_DAILY_QUESTIONS) {
        celebrationEngine.celebrate(4);
        soundEffects.playMissionComplete();
      }
    }

    const activeModePayload =
      selectedModel === 'deepthink' || deepThinking
        ? 'grade_10_secret'
        : selectedModel === 'allinone'
        ? 'all_in_one'
        : 'tutor';
    const userTextPayload =
      input.trim() ||
      (attachedImage && !attachedImage.isImage
        ? `Hãy đọc và phân tích nội dung tệp "${attachedImage.name}" giúp mình.`
        : '');
    onSendMessage(
      userTextPayload,
      attachedImage,
      deepThinking || selectedModel === 'deepthink',
      activeModePayload,
      !attachedImage && isImageMode ? { isImageMode: true } : undefined
    );
    setInput('');
    setAttachedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && isTypingSlashMenu && matchingSlashCommands.length > 0) {
      e.preventDefault();
      setInput(`${matchingSlashCommands[0].command} `);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmptyState = messages.length === 0;

  // Quick subject options in Floating Command Bar
  const quickSubjects = [
    { id: 'toan', label: 'Toán', prompt: '[Toán] Giải giúp mình bài tập: ', icon: Calculator },
    { id: 'van', label: 'Văn', prompt: '[Ngữ văn] Lập dàn ý & phân tích: ', icon: PenTool },
    { id: 'anh', label: 'Anh', prompt: '[Tiếng Anh] Giải thích ngữ pháp & sửa câu: ', icon: BookOpen },
    { id: 'khtn', label: 'KHTN', prompt: '[KHTN] Giải bài tập & giải thích hiện tượng: ', icon: FlaskConical },
    { id: 'su_dia', label: 'Sử & Địa', prompt: '[Lịch sử & Địa lý] Tóm tắt trọng tâm: ', icon: Compass },
    { id: 'all_in_one', label: 'Đa năng AI', prompt: '[Đa năng] Hỗ trợ lập trình, viết bài, dịch thuật hoặc tóm tắt: ', icon: Sparkles },
  ];

  // Derived student metrics for Welcome Dashboard Card
  const studentDisplayName =
    currentUser?.name || (userName && userName !== 'Bạn học' ? userName : 'Bạn học');
  const studentClassLabel = currentUser?.studentClass
    ? `Lớp ${currentUser.studentClass}`
    : grade;
  const displayStreak =
    achievementStats.streak.currentStreak > 0 ? achievementStats.streak.currentStreak : 10;
  const unlockedBadgesCount = achievementStats.badges.filter((b) => b.isUnlocked).length;
  const displayBadgesCount = unlockedBadgesCount > 0 ? unlockedBadgesCount : 7;
  const levelInfo = calculateLevel(achievementStats.totalXp);

  // 3-Column Bento Grid Tasks
  const bentoTasks = [
    {
      id: 'photo-solve',
      title: 'Giải bài tập qua ảnh',
      desc: 'Tải ảnh chụp đề Toán, Lý, Hóa, Văn, Anh để nhận lời giải từng bước chuẩn SGK.',
      cta: 'Tải ảnh ngay',
      icon: Camera,
      iconBg: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-400/70 dark:hover:border-emerald-500/40',
      onClick: () => fileInputRef.current?.click(),
    },
    {
      id: 'exam-traps',
      title: 'Cảnh báo bẫy đề thi',
      desc: 'Nhận diện các bẫy điều kiện, đổi đơn vị và lỗi sai hay mất điểm oan trong đề.',
      cta: 'Soi bẫy ngay',
      icon: Zap,
      iconBg: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/20',
      hoverBorder: 'hover:border-amber-400/70 dark:hover:border-amber-500/40',
      onClick: () => {
        if (onSelectTab) {
          onSelectTab('tips');
        } else {
          setDeepThinking(true);
          setInput('Hãy phân tích và cảnh báo các bẫy đề thi hay mất điểm trong bài: ');
          textareaRef.current?.focus();
        }
      },
    },
    {
      id: 'mindmap',
      title: 'Sơ đồ tư duy',
      desc: 'Hệ thống hóa toàn bộ chương học bằng sơ đồ nhánh dễ nhớ, ôn thi cấp tốc.',
      cta: 'Mở MindMap',
      icon: GitFork,
      iconBg: 'bg-teal-500/12 text-teal-600 dark:text-teal-400 border-teal-500/20',
      hoverBorder: 'hover:border-teal-400/70 dark:hover:border-teal-500/40',
      onClick: () => {
        if (onOpenMindMap) onOpenMindMap();
        else if (onSelectTab) onSelectTab('mindmap');
      },
    },
    {
      id: 'minigame-top1',
      title: 'Mini game săn Top 1',
      desc: 'Trả lời nhanh câu hỏi thuộc bài, tích lũy điểm kinh nghiệm XP & lên cấp 2412.',
      cta: 'Chơi ngay',
      icon: Trophy,
      iconBg: 'bg-orange-500/12 text-orange-600 dark:text-orange-400 border-orange-500/20',
      hoverBorder: 'hover:border-orange-400/70 dark:hover:border-orange-500/40',
      onClick: () => {
        setActiveLessonContext('');
        setShowMiniGameModal(true);
      },
    },
    {
      id: 'quick-exam',
      title: 'Luyện đề cấp tốc',
      desc: 'Thử sức với bộ đề kiểm tra 15 phút, giữa kỳ & tuyển sinh vào 10 (hỗ trợ Offline).',
      cta: 'Vào phòng thi',
      icon: BookOpen,
      iconBg: 'bg-sky-500/12 text-sky-600 dark:text-sky-400 border-sky-500/20',
      hoverBorder: 'hover:border-sky-400/70 dark:hover:border-sky-500/40',
      onClick: () => {
        if (onSelectTab) onSelectTab('exam');
      },
    },
    {
      id: 'video-lecture',
      title: 'Video bài giảng AI',
      desc: 'Tạo video thuyết trình sinh động có giáo viên AI giảng bài và phụ đề rõ nét.',
      cta: 'Mở Video AI',
      icon: Video,
      iconBg: 'bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      hoverBorder: 'hover:border-indigo-400/70 dark:hover:border-indigo-500/40',
      onClick: () => {
        if (onOpenVideoStudio) onOpenVideoStudio();
        else if (onSelectTab) onSelectTab('video');
      },
    },
  ];

  return (
    <div
      className={`select-text transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-[999999] h-screen w-screen bg-[#f8fafc] dark:bg-[#0b0f17] overflow-hidden flex flex-col'
          : 'flex-1 flex flex-col h-full overflow-hidden relative'
      }`}
    >
      {/* Hidden File & Image Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.py,.html,.css,.sql,.log"
        className="hidden"
      />

      {/* Slim Model Mode & Fullscreen Top Strip */}
      <div
        className={`h-11 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none border-b ${
          isDark
            ? 'bg-[#0b1019]/75 border-white/[0.06] text-zinc-100'
            : 'bg-white/75 border-slate-200/70 text-slate-800'
        } backdrop-blur-md z-20`}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {selectedModel === 'deepthink'
                ? 'Max10 DeepThink (Soi Bẫy 10/10)'
                : selectedModel === 'allinone'
                ? 'Max10 Đa Năng (Code · Dịch · Viết)'
                : selectedModel === 'studio'
                ? 'Max10 Studio (Ảnh & Video AI)'
                : 'Max10 AI Ultra (Thế Hệ Mới)'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {showModelDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowModelDropdown(false)}
              />
              <div
                className={`absolute top-full left-0 mt-1.5 w-72 sm:w-80 rounded-2xl p-2 shadow-2xl border z-40 text-xs ${
                  isDark
                    ? 'bg-[#101622] border-white/10 text-zinc-200'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Chế độ Max10 AI Thế Hệ Mới
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel('ultra');
                    setDeepThinking(false);
                    setShowModelDropdown(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-2.5 cursor-pointer ${
                    selectedModel === 'ultra'
                      ? 'bg-emerald-500/12 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Bot className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Max10 AI Ultra (Gia sư &amp; Trợ lý)</div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Giải 2 cách (Tự luận + Mẹo nhanh), siêu nhanh &amp; chuẩn xác 100%.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel('deepthink');
                    setDeepThinking(true);
                    setShowModelDropdown(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-2.5 mt-1 cursor-pointer ${
                    selectedModel === 'deepthink'
                      ? 'bg-amber-500/12 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Brain className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Max10 DeepThink (Suy Luận Sâu)</div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Tự kiểm chứng đa tầng, quét mọi bẫy đề thi HSG &amp; câu 9–10 điểm.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel('allinone');
                    setDeepThinking(false);
                    setShowModelDropdown(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-2.5 mt-1 cursor-pointer ${
                    selectedModel === 'allinone'
                      ? 'bg-sky-500/12 border border-sky-500/30 text-sky-700 dark:text-sky-300 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Max10 Đa Năng (Code · Dịch · Viết)</div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Viết code, dịch thuật mượt mà, soạn văn &amp; tóm tắt mọi chủ đề.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel('studio');
                    setInput('Hãy tạo ảnh và video có người AI nói chung về: ');
                    setShowModelDropdown(false);
                    textareaRef.current?.focus();
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-2.5 mt-1 cursor-pointer ${
                    selectedModel === 'studio'
                      ? 'bg-rose-500/12 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Film className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Max10 Studio (Ảnh &amp; Video AI)</div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Tạo minh họa 8K và video người AI thuyết trình trong chat.
                    </p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: Quota Counter + Fullscreen Button */}
        <div className="flex items-center gap-2 text-xs shrink-0 whitespace-nowrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold tabular-nums ${
              isAdmin
                ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25'
                : quotaStatus.remaining <= 3
                ? 'bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/25'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
            }`}
          >
            <span>Lượt hỏi:</span>
            <span className="font-black">
              {isAdmin ? 'Vô hạn' : `${quotaStatus.remaining}/${MAX_DAILY_QUESTIONS}`}
            </span>
          </span>

          <button
            type="button"
            onClick={() => toggleFullscreen()}
            className={`p-1.5 px-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border ${
              isFullscreen
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'
                : isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border-white/10'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Phóng to không gian học tập'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Thu gọn (Esc)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Phóng to</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Quiz & Voice Tutor Control Strip */}
      {quizVoiceMode && (
        <div
          className={`px-4 sm:px-6 py-2.5 border-b shrink-0 flex flex-col gap-2 z-15 ${
            isDark
              ? 'bg-emerald-950/35 border-emerald-500/25 text-zinc-100'
              : 'bg-emerald-50/90 border-emerald-200 text-slate-900'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-extrabold shadow-xs">
                <Mic className="w-3.5 h-3.5" />
                <span>Hỏi bài &amp; Nói chuyện</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-emerald-500/30 bg-white/70 dark:bg-white/[0.06] font-bold">
                <span>{activeCountry.flag}</span>
                <span>{activeCountry.nativeName}</span>
                {countryCode !== 'VN' && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
                    ({bilingualMode ? 'Song ngữ' : 'Bản ngữ'})
                  </span>
                )}
              </span>

              <div className="inline-flex items-center p-0.5 rounded-xl border border-emerald-500/25 bg-white/70 dark:bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => onSelectQuizRole?.('tutor')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    quizRole === 'tutor'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  👩‍🏫 Gia sư
                </button>
                <button
                  type="button"
                  onClick={() => onSelectQuizRole?.('deskmate')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    quizRole === 'deskmate'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  🧑‍🎓 Bạn cùng bàn
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Strict Gender Voice Toggle (Nữ ra giọng Nữ, Nam ra giọng Nam) */}
              <div
                className="inline-flex items-center p-0.5 rounded-xl border border-emerald-500/25 bg-white/80 dark:bg-white/[0.04]"
                title={`Đang dùng: ${activeVoicePersona.name} (${activeVoicePersona.accent})`}
              >
                <button
                  type="button"
                  onClick={() => {
                    const next = aiVoice.setVoiceGender('female');
                    showToast(`👩 Đã chuyển sang ${next.name} (Giọng Nữ chuẩn)`);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    activeVoicePersona.gender === 'female'
                      ? 'bg-rose-500 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  👩 Giọng Nữ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = aiVoice.setVoiceGender('male');
                    showToast(`👨 Đã chuyển sang ${next.name} (Giọng Nam chuẩn)`);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    activeVoicePersona.gender === 'male'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  👨 Giọng Nam
                </button>
              </div>

              <button
                type="button"
                onClick={() => setAutoSpeakTutor((prev) => !prev)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border cursor-pointer flex items-center gap-1 transition-colors ${
                  autoSpeakTutor
                    ? 'bg-teal-600 text-white border-teal-600'
                    : isDark
                    ? 'bg-white/[0.04] border-white/10 text-zinc-300'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
                title="Tự động đọc phản hồi bằng giọng quốc gia đang chọn"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{autoSpeakTutor ? 'Tự đọc: Bật' : 'Tự đọc: Tắt'}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleStartQuizSession()}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-extrabold cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bắt đầu hỏi bài ngay</span>
              </button>

              <button
                type="button"
                onClick={handleVoiceInput}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border cursor-pointer flex items-center gap-1 transition-colors ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white dark:bg-white/[0.08] border-emerald-300 dark:border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isListening ? 'Đang nghe...' : 'Nói trả lời'}</span>
              </button>

              {!isEmptyState && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    onSendMessage(
                      'Mình sẵn sàng rồi, hãy đặt cho mình câu hỏi tiếp theo (nâng dần độ khó một chút) nhé!',
                      null,
                      false,
                      'tutor',
                      { interactiveQuizMode: true, quizSubject, quizRole }
                    )
                  }
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border cursor-pointer disabled:opacity-50 ${
                    isDark
                      ? 'bg-white/[0.05] border-white/10 text-zinc-200 hover:bg-white/10'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ⏭️ Câu tiếp theo
                </button>
              )}

              {onToggleQuizVoiceMode && (
                <button
                  type="button"
                  onClick={onToggleQuizVoiceMode}
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-500 cursor-pointer"
                  title="Tắt chế độ Hỏi bài cùng Gia sư AI"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Topic Selector */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 mr-1">Chủ đề:</span>
            {QUIZ_TOPICS.map((t) => {
              const activeTopic = quizSubject === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectQuizSubject?.(t.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold border cursor-pointer transition-colors flex items-center gap-1 ${
                    activeTopic
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : isDark
                      ? 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/10'
                      : 'bg-white border-emerald-200/80 text-slate-700 hover:bg-emerald-100/70'
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
            <span className="ml-auto hidden lg:inline text-[11px] text-emerald-700/85 dark:text-emerald-300/85 font-medium">
              Quy tắc: AI hỏi từng câu một · Đợi bạn trả lời rồi nhận xét &amp; tăng dần độ khó
            </span>
          </div>
        </div>
      )}

      {/* Interactive 3D Virtual Tutor Character Stage + Smart Whiteboard Side-by-Side */}
      {quizVoiceMode && (
        <div className="px-3 sm:px-6 pt-2.5 shrink-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            <div className="lg:col-span-5 min-w-0">
              <RobotTutor3D
                countryCode={countryCode}
                isListening={isListening}
                isSpeaking={speakingId !== null}
                reaction={robotReaction}
                reactionTrigger={robotReactionTrigger}
                isDark={isDark}
                compact={!isEmptyState}
                onTriggerTestReaction={(type) => {
                  setRobotReaction(type);
                  setRobotReactionTrigger((n) => n + 1);
                }}
              />
            </div>
            <div className="lg:col-span-7 min-w-0">
              <SmartWhiteboard
                latestAiText={
                  [...messages].reverse().find((m) => m.role === 'assistant')?.content || ''
                }
                subjectLabel={quizSubject}
                countryFlag={activeCountry.flag}
                countryName={activeCountry.name}
                isDark={isDark}
                compact={!isEmptyState}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active International Study Buddy Banner */}
      {activeStudyBuddy && (
        <div
          className={`mx-3 sm:mx-6 mt-2 px-3.5 py-2 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shrink-0 ${
            isDark
              ? 'bg-[#2b2d31] border-[#5865F2]/40 text-zinc-100'
              : 'bg-indigo-50/90 border-indigo-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 text-xs">
            <span className="text-lg shrink-0">{activeStudyBuddy.avatarEmoji}</span>
            <div className="min-w-0">
              <span className="font-extrabold">
                {activeStudyBuddy.flag} Đang trò chuyện cùng {activeStudyBuddy.name}#{activeStudyBuddy.tag}
              </span>
              <span className="opacity-75 ml-2 hidden sm:inline">
                ({activeStudyBuddy.nativeLanguage} kèm dịch Tiếng Việt)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onExecuteSlashCommand?.(`/xem ${activeStudyBuddy.name}`)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                isDark ? 'border-white/15 hover:bg-white/10' : 'border-indigo-200 bg-white hover:bg-indigo-50'
              }`}
            >
              Xem Profile
            </button>
            <button
              type="button"
              onClick={() => onExitBuddyChat?.()}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
            >
              Thoát (/chat off)
            </button>
          </div>
        </div>
      )}

      {/* Main Scrollable Viewport */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 scroll-smooth overscroll-contain">
        <div
          className={`mx-auto w-full pt-2.5 pb-4 transition-all ${
            isFullscreen ? 'max-w-6xl' : 'max-w-5xl'
          }`}
        >
          {/* MODERN EDTECH BENTO DASHBOARD (Empty State) */}
          {isEmptyState && (
            <div className="space-y-3">
              {/* Pre-generated Discord Global Tutor Profile & Starter Slash Commands */}
              <DiscordStudyCards
                embed={{
                  kind: 'welcome_activation',
                  profile: effectiveStudyProfile,
                  suggestedCommands: [
                    '/timban Hàn Quốc',
                    '/ngonngu Tiếng Anh',
                    '/hoibai Nhật Bản Toán',
                    '/caidat',
                    '/profile',
                    '/listban',
                  ],
                }}
                isDark={isDark}
                friendIds={effectiveStudyProfile.friendIds}
                onExecuteCommand={(cmd) =>
                  onExecuteSlashCommand ? onExecuteSlashCommand(cmd) : onSendMessage(cmd)
                }
                onAddFriend={(buddy) => onAddStudyFriend?.(buddy)}
                onStartBuddyChat={(buddy) => onStartBuddyChat?.(buddy)}
                onCycleStatus={onCycleStudyStatus}
                onApplyCurriculum={onApplyCurriculumSetup}
              />

              {/* TOP SECTION: Student Welcome & Achievement Card */}
              <section
                aria-label="Bảng chào mừng học sinh"
                className={`rounded-3xl p-3.5 sm:p-4 border transition-colors relative overflow-hidden ${
                  isDark
                    ? 'bg-[#0f1726]/90 border-white/[0.08] text-slate-100 shadow-lg shadow-black/20'
                    : 'bg-white/95 border-slate-200/85 text-slate-900 shadow-sm'
                }`}
              >
                {/* Soft Top Ambient Emerald Wash */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl"
                />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  {/* Student Identity + Greeting */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <button
                      type="button"
                      onClick={onOpenNameModal}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-md shrink-0 cursor-pointer hover:scale-105 transition-transform"
                      title="Chỉnh sửa hồ sơ học sinh"
                    >
                      <img
                        src={currentUser?.avatar || userAvatar || '/max10-avatar.jpg'}
                        alt={studentDisplayName}
                        className="w-full h-full object-cover rounded-[14px]"
                        referrerPolicy="no-referrer"
                      />
                    </button>

                    <div className="min-w-0">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                        Max10 AI - Gia sư điểm 10 THCS
                      </div>
                      <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-slate-900 dark:text-white leading-snug">
                        Chào {studentDisplayName} - {studentClassLabel}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                        Bảng điều khiển học tập cá nhân · Giải chi tiết từng bước &amp; Săn điểm 10 mỗi ngày
                      </p>
                    </div>
                  </div>

                  {/* Quick Primary Actions: Quay XP Lên Cấp + Mini game thuộc bài */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectTab) {
                          onSelectTab('spin');
                        } else {
                          window.dispatchEvent(new CustomEvent('max10_open_xp_spin'));
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-sm shadow-emerald-600/25 hover:-translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Zap className="w-4 h-4 shrink-0 fill-current" />
                      <span>Quay XP Lên Cấp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveLessonContext('');
                        setShowMiniGameModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs sm:text-sm shadow-sm shadow-amber-500/25 hover:-translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Trophy className="w-4 h-4 shrink-0" />
                      <span>Mini game thuộc bài</span>
                    </button>
                  </div>
                </div>

                {/* Highlight Metrics Row: 10 Ngày streak · 7 Huy hiệu · Điểm số XP · Nhiệm vụ */}
                <div className="relative z-10 mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/[0.08] grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Metric 1: Streak */}
                  <button
                    type="button"
                    onClick={onOpenAchievementsModal || (() => onSelectTab?.('achievements'))}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-white/[0.03] border-white/[0.07] hover:border-amber-500/40'
                        : 'bg-amber-50/60 border-amber-200/70 hover:border-amber-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Flame className="w-5 h-5 fill-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums leading-tight">
                        {displayStreak} Ngày streak
                      </div>
                      <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 truncate">
                        Học tập liên tục
                      </div>
                    </div>
                  </button>

                  {/* Metric 2: Badges */}
                  <button
                    type="button"
                    onClick={onOpenAchievementsModal || (() => onSelectTab?.('achievements'))}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-white/[0.03] border-white/[0.07] hover:border-emerald-500/40'
                        : 'bg-emerald-50/60 border-emerald-200/70 hover:border-emerald-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums leading-tight">
                        {displayBadgesCount} Huy hiệu
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                        Danh hiệu Điểm 10
                      </div>
                    </div>
                  </button>

                  {/* Metric 3: Score & Level */}
                  <button
                    type="button"
                    onClick={onOpenAchievementsModal || (() => onSelectTab?.('achievements'))}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-white/[0.03] border-white/[0.07] hover:border-teal-500/40'
                        : 'bg-slate-50 border-slate-200/80 hover:border-emerald-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 fill-teal-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums leading-tight">
                        {achievementStats.totalXp.toLocaleString()} XP
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 truncate">
                        Cấp {formatLevelLabel(levelInfo.level)} · {levelInfo.title}
                      </div>
                    </div>
                  </button>

                  {/* Metric 4: Daily Mission Progress */}
                  <div
                    className={`flex flex-col justify-center p-2.5 rounded-2xl border ${
                      isDark
                        ? 'bg-white/[0.03] border-white/[0.07]'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-600 dark:text-zinc-300 truncate">
                        Nhiệm vụ hôm nay
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                        {dailyMission.currentInteractions}/10
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((dailyMission.currentInteractions / 10) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 truncate">
                      {dailyMission.isCompleted ? 'Đã hoàn thành (+150 XP)' : 'Hoàn thành 10 câu nhận +150 XP'}
                    </div>
                  </div>
                </div>
              </section>

              {/* BOTTOM SECTION: 3-Column Bento Grid for Quick Study Tasks */}
              <section aria-label="Tác vụ học tập nhanh" className="overflow-y-auto py-0.5">
                <div className="flex items-center justify-between px-1 mb-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Tác vụ học tập nhanh
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Chọn công cụ để bắt đầu ngay cùng Max10 AI
                    </p>
                  </div>
                  {onOpenIntroModal && (
                    <button
                      type="button"
                      onClick={onOpenIntroModal}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap"
                    >
                      Giới thiệu Max10 &amp; Tác giả
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
                  {bentoTasks.map((task) => {
                    const Icon = task.icon;
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={task.onClick}
                        className={`group rounded-3xl p-3.5 sm:p-4 border text-left flex flex-col justify-between gap-2.5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_30px_-10px_rgba(16,185,129,0.22)] active:translate-y-0 ${
                          isDark
                            ? `bg-[#0f1726]/85 border-white/[0.08] ${task.hoverBorder}`
                            : `bg-white/95 border-slate-200/85 shadow-2xs ${task.hoverBorder}`
                        }`}
                      >
                        <div>
                          <div
                            className={`w-9 h-9 rounded-2xl border flex items-center justify-center mb-2.5 transition-transform duration-200 group-hover:scale-105 ${task.iconBg}`}
                          >
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <h3 className="text-sm sm:text-[15px] font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {task.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-snug">
                            {task.desc}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 pt-0.5">
                          <span>{task.cta}</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Compact Background Theme Quick Strip */}
              <div
                className={`px-4 py-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
                  isDark
                    ? 'bg-[#0f1726]/70 border-white/[0.06] text-zinc-300'
                    : 'bg-white/80 border-slate-200/80 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Phông nền học tập:{' '}
                    <strong className="text-slate-800 dark:text-zinc-200">
                      {activeTheme?.callName || 'Trắng'}
                    </strong>
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
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isDark
                            ? 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08]'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
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
                      className="px-2 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Tùy chọn...
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE CONVERSATION THREAD */}
          {!isEmptyState && (
            <div className="space-y-6 pb-8 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div
                        className={`max-w-[85%] rounded-3xl px-5 py-3.5 text-[15px] leading-relaxed border ${
                          isDark
                            ? 'bg-[#162032] border-white/[0.08] text-zinc-100'
                            : 'bg-emerald-50 border-emerald-200/70 text-slate-800 font-medium'
                        }`}
                      >
                        {(msg.imagePreview || msg.attachment?.previewUrl) && (
                          <div className="mb-2">
                            <img
                              src={msg.imagePreview || msg.attachment?.previewUrl || ''}
                              alt={msg.attachment?.name || 'Đề bài đính kèm'}
                              className="max-h-52 rounded-2xl object-contain border border-black/10 shadow-xs"
                            />
                          </div>
                        )}
                        {msg.attachment && !msg.attachment.isImage && (
                          <div
                            className={`mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                              isDark
                                ? 'bg-white/[0.06] border-white/10 text-emerald-300'
                                : 'bg-white border-emerald-200 text-emerald-700'
                            }`}
                          >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="truncate max-w-[220px]">{msg.attachment.name}</span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3.5">
                      {msg.buddyMeta ? (
                        <div className="w-9 h-9 rounded-2xl shrink-0 mt-1 shadow-xs select-none border border-[#5865F2]/40 bg-[#5865F2]/15 flex items-center justify-center text-lg">
                          {msg.buddyMeta.avatarEmoji}
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-2xl overflow-hidden shrink-0 mt-1 shadow-xs select-none border border-emerald-500/30 bg-emerald-500/10">
                          <img
                            src="/max10-avatar.jpg"
                            alt="Max10"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="flex-1 overflow-hidden">
                        {msg.buddyMeta && (
                          <div className="mb-1.5 flex items-center gap-2 text-xs">
                            <span className="font-extrabold text-[#5865F2]">
                              {msg.buddyMeta.flag} {msg.buddyMeta.name}#{msg.buddyMeta.tag}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                              {msg.buddyMeta.countryName} · {msg.buddyMeta.nativeLanguage}
                            </span>
                          </div>
                        )}
                        {msg.deepThinkingContent && (
                          <div
                            className={`mb-3 p-3.5 rounded-2xl border text-xs leading-relaxed ${
                              isDark
                                ? 'bg-amber-950/20 border-amber-500/25 text-amber-200'
                                : 'bg-amber-50 border-amber-200 text-amber-900'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-600 dark:text-amber-400">
                              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>Đã quét bẫy đề thi &amp; lập luận từng bước (Chuẩn barem Điểm 10)</span>
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
                                <blockquote className="border-l-2 border-emerald-500 pl-3 py-1.5 my-2.5 rounded-r-xl bg-emerald-500/10 text-slate-700 dark:text-zinc-300">
                                  {children}
                                </blockquote>
                              ),
                              code: ({ inline, className, children, ...props }: any) => {
                                const match = /language-(\w+)/.exec(className || '');
                                const lang = match ? match[1] : '';
                                const codeContent = String(children).replace(/\n$/, '');
                                if (inline || (!match && !codeContent.includes('\n'))) {
                                  return (
                                    <code
                                      className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold"
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                }
                                return (
                                  <ChatGPTCodeBlock
                                    language={lang || 'toán học & code'}
                                    code={codeContent}
                                  />
                                );
                              },
                              hr: () => (
                                <hr className="my-3 border-black/10 dark:border-white/10" />
                              ),
                              a: ({ href, children }) => {
                                const isQrLink =
                                  href === '#chuyen-khoan' ||
                                  href === '#chuyen-khoan-plus' ||
                                  href === '#chuyen-khoan-premium' ||
                                  href === '#ma-qr' ||
                                  href === '#qr-code' ||
                                  href === '#bang-gia' ||
                                  (typeof href === 'string' &&
                                    (href.includes('chuyen-khoan') ||
                                      href.includes('pay=') ||
                                      href.includes('upgrade') ||
                                      href.includes('ma-qr')));

                                if (isQrLink) {
                                  const isPremium =
                                    typeof href === 'string' &&
                                    (href.includes('premium') || href.includes('prerium'));
                                  const targetPlan = isPremium ? 'premium' : 'plus';
                                  return (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onOpenPricingModal && onOpenPricingModal(targetPlan, 'checkout')
                                      }
                                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 my-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm border ${
                                        isPremium
                                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400/50'
                                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/50'
                                      }`}
                                    >
                                      <QrCode className="w-4 h-4 shrink-0" />
                                      <span>{children}</span>
                                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                    </button>
                                  );
                                }

                                if (
                                  href === '#open-video-studio' ||
                                  href === '#video-studio' ||
                                  href === '#video'
                                ) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => onOpenVideoStudio && onOpenVideoStudio()}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 my-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm cursor-pointer"
                                    >
                                      <Video className="w-4 h-4 shrink-0" />
                                      <span>{children}</span>
                                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                    </button>
                                  );
                                }

                                if (
                                  href === '#open-image-studio' ||
                                  href === '#image-studio' ||
                                  href === '#image'
                                ) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => onOpenImageStudio && onOpenImageStudio()}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 my-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm cursor-pointer"
                                    >
                                      <ImageIcon className="w-4 h-4 shrink-0" />
                                      <span>{children}</span>
                                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                    </button>
                                  );
                                }

                                if (
                                  href === '#open-control-center' ||
                                  href === '#control-center' ||
                                  href === '#control'
                                ) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => onOpenControlCenter && onOpenControlCenter()}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 my-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-600 to-emerald-600 text-white shadow-sm cursor-pointer"
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
                              img: ({ src, alt }) => (
                                <img
                                  src={src}
                                  alt={alt || 'Hình minh họa AI'}
                                  referrerPolicy="no-referrer"
                                  className="my-2 rounded-2xl max-h-[380px] object-contain border border-black/10 dark:border-zinc-800 shadow-sm cursor-pointer"
                                  onClick={() => src && setFullscreenImage(src)}
                                />
                              ),
                            }}
                          >
                            {formatDolaMath(msg.content)}
                          </Markdown>
                        </div>

                        {msg.discordEmbed && (
                          <div className="mt-3">
                            <DiscordStudyCards
                              embed={msg.discordEmbed}
                              isDark={isDark}
                              friendIds={effectiveStudyProfile.friendIds}
                              onExecuteCommand={(cmd) =>
                                onExecuteSlashCommand ? onExecuteSlashCommand(cmd) : onSendMessage(cmd)
                              }
                              onAddFriend={(buddy) => onAddStudyFriend?.(buddy)}
                              onStartBuddyChat={(buddy) => onStartBuddyChat?.(buddy)}
                              onCycleStatus={onCycleStudyStatus}
                              onApplyCurriculum={onApplyCurriculumSetup}
                            />
                          </div>
                        )}

                        {(() => {
                          const imagesList =
                            msg.generatedImages && msg.generatedImages.length > 0
                              ? msg.generatedImages
                              : msg.generatedImage
                              ? [msg.generatedImage]
                              : [];
                          if (imagesList.length === 0) return null;

                          return imagesList.map((imgItem, imgIdx) => {
                            const stateKey = `${msg.id}-${imgIdx}`;
                            const activeUrl = imgSrcOverrides[stateKey] || imgItem.url;
                            const isBroken = Boolean(failedImgUrls[stateKey]);
                            const ratio = imgItem.aspectRatio || '1:1';
                            const isMindmap = imgItem.style === 'mindmap' || imgItem.style === 'diagram';
                            const maxWidthClass = isMindmap
                              ? 'max-w-xl'
                              : ratio === '16:9'
                              ? 'max-w-xl'
                              : ratio === '9:16' || ratio === '3:4'
                              ? 'max-w-sm'
                              : 'max-w-md';
                            const formatLabel = isMindmap
                              ? 'Sơ đồ tư duy · Mindmap'
                              : imgItem.loaiAnh === 'banner' || ratio === '16:9'
                              ? 'Banner · 16:9 (1344×768)'
                              : imgItem.loaiAnh === 'poster' || ratio === '9:16'
                              ? 'Poster · 9:16 (768×1344)'
                              : ratio === '3:4'
                              ? 'Poster Học Tập · 3:4'
                              : 'Avatar · 1:1 (1024×1024)';

                            return (
                              <div
                                key={stateKey}
                                className={`mt-3.5 rounded-2xl overflow-hidden border border-black/10 dark:border-zinc-800 shadow-md ${
                                  isMindmap ? 'bg-white dark:bg-zinc-900' : 'bg-black/5 dark:bg-zinc-900/60'
                                } ${maxWidthClass}`}
                              >
                                {isBroken ? (
                                  <div className="p-5 flex flex-col items-center justify-center text-center gap-2.5 min-h-[180px]">
                                    <ImageIcon className="w-8 h-8 text-emerald-500 opacity-80" />
                                    <p className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                                      Không tải được ảnh trực tiếp. Bạn có thể thử tải lại ảnh bên dưới.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFailedImgUrls((prev) => ({ ...prev, [stateKey]: false }));
                                        const nextUrl = imgItem.fallbackUrl || imgItem.url || '';
                                        if (nextUrl) {
                                          setImgSrcOverrides((prev) => ({ ...prev, [stateKey]: nextUrl }));
                                        }
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                                    >
                                      Thử tải lại ảnh
                                    </button>
                                  </div>
                                ) : (
                                  <div className="relative group">
                                    <img
                                      src={activeUrl}
                                      alt={imgItem.prompt}
                                      referrerPolicy="no-referrer"
                                      className="w-full max-h-[460px] object-contain cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]"
                                      onClick={() => setFullscreenImage(activeUrl || null)}
                                      onError={() => {
                                        const fb = imgItem.fallbackUrl;
                                        if (fb && activeUrl !== fb) {
                                          setImgSrcOverrides((prev) => ({ ...prev, [stateKey]: fb }));
                                        } else {
                                          setFailedImgUrls((prev) => ({ ...prev, [stateKey]: true }));
                                        }
                                      }}
                                    />
                                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setFullscreenImage(activeUrl || null)}
                                        className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white backdrop-blur-xs cursor-pointer"
                                        title="Xem ảnh lớn"
                                      >
                                        <Maximize2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDownloadImage(
                                            activeUrl || '',
                                            imgItem.prompt || 'max10-ai'
                                          )
                                        }
                                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                                        title="Tải ảnh về máy"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                                <div className="px-3.5 py-2 border-t border-black/5 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                                    {formatLabel}
                                  </span>
                                  <span className="truncate opacity-80 flex-1">{imgItem.prompt}</span>
                                  {!isBroken && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDownloadImage(
                                          activeUrl || '',
                                          imgItem.prompt || 'max10-ai'
                                        )
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold shrink-0 cursor-pointer"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Tải ảnh</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}

                        {msg.generatedVideo && (
                          <ChatGPTVideoPlayer
                            video={msg.generatedVideo}
                            isDark={isDark}
                            onOpenVideoStudio={onOpenVideoStudio}
                          />
                        )}

                        {/* Message Actions */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs text-slate-400 select-none">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                            }`}
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
                            onClick={() => setFeedbackGiven((prev) => ({ ...prev, [msg.id]: 'up' }))}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              feedbackGiven[msg.id] === 'up'
                                ? 'text-emerald-500 bg-emerald-500/10'
                                : isDark
                                ? 'hover:bg-zinc-800 text-zinc-400'
                                : 'hover:bg-slate-100 text-slate-500'
                            }`}
                            title="Câu trả lời hữu ích"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setFeedbackGiven((prev) => ({ ...prev, [msg.id]: 'down' }))}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              feedbackGiven[msg.id] === 'down'
                                ? 'text-rose-500 bg-rose-500/10'
                                : isDark
                                ? 'hover:bg-zinc-800 text-zinc-400'
                                : 'hover:bg-slate-100 text-slate-500'
                            }`}
                            title="Chưa hài lòng"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSpeak(msg.content, msg.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              speakingId === msg.id
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                                : isDark
                                ? 'hover:bg-zinc-800 text-zinc-400'
                                : 'hover:bg-slate-100 text-slate-500'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{speakingId === msg.id ? 'Dừng đọc' : 'Đọc bài'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={onRegenerate}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Tạo lại</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveLessonContext(msg.content);
                              setShowMiniGameModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-500/25 transition-colors cursor-pointer"
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Mini game thuộc bài</span>
                          </button>
                        </div>

                        {!loading && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {[
                              {
                                label: '⚡ Giải cách ngắn gọn hơn',
                                prompt: 'Hãy tóm tắt lại câu trả lời vừa rồi theo cách ngắn gọn, dễ nhớ và mẹo làm nhanh nhất có thể.',
                                deep: false,
                              },
                              {
                                label: '🎯 Ra 1 bài tương tự để tự luyện',
                                prompt: 'Hãy ra cho mình 1 bài tập tương tự (chưa hiện đáp án ngay, hoặc gợi ý hướng làm) để mình tự luyện rồi chấm giúp mình.',
                                deep: false,
                              },
                              {
                                label: '⚠️ Soi kỹ bẫy hay mất điểm',
                                prompt: 'Hãy kiểm tra thật kỹ lại các bước và chỉ rõ mọi bẫy dễ mất điểm oan nhất của dạng bài vừa rồi.',
                                deep: true,
                              },
                            ].map((chip) => (
                              <button
                                key={chip.label}
                                type="button"
                                onClick={() =>
                                  onSendMessage(
                                    chip.prompt,
                                    null,
                                    chip.deep,
                                    chip.deep ? 'trap_detector' : 'tutor'
                                  )
                                }
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                                  isDark
                                    ? 'bg-white/[0.04] hover:bg-emerald-500/15 border-white/10 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300'
                                    : 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700'
                                }`}
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {subscriptionPlan === 'free' && onOpenPricingModal && (
                          <div className="mt-3.5 p-3 sm:p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                                Nâng cấp gói Plus (100k) hoặc Premium (500k) mở khóa Xưởng Ảnh &amp; Video AI không giới hạn
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onOpenPricingModal('plus', 'checkout')}
                              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
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

              {loading && (
                <div className="flex items-start gap-3.5 pt-2">
                  <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs shrink-0 border border-emerald-500/30 bg-emerald-500/10">
                    <img
                      src="/max10-avatar.jpg"
                      alt="Max10"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="py-1 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Max10 đang giải bài tập chi tiết từng bước &amp; quét bẫy điểm 10...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* FLOATING PILL COMMAND BAR (Anchored cleanly at bottom on both Home & Chat) */}
      <div className="shrink-0 px-3 sm:px-6 pb-3 pt-1.5 z-20">
        <div
          className={`mx-auto w-full transition-all ${
            isFullscreen ? 'max-w-5xl' : 'max-w-4xl'
          }`}
        >
          {quotaStatus.isLocked ? (
            <QuotaLimitCountdownCard
              isDark={isDark}
              isAdmin={isAdmin}
              userName={studentDisplayName}
              onOpenMiniGame={() => setShowMiniGameModal(true)}
              onOpenMathChallenge={() => setShowMathChallengeModal(true)}
              onResetSuccess={() => setQuotaStatus(getDailyQuestionQuota(isAdmin))}
            />
          ) : (
            <div className="space-y-2">
              {fixToast && (
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-lg border border-white/10">
                    {fixToast}
                  </span>
                </div>
              )}

              {attachedImage && (
                <div className="relative inline-flex items-center">
                  {attachedImage.isImage && attachedImage.previewUrl ? (
                    <img
                      src={attachedImage.previewUrl}
                      alt={attachedImage.name || 'Ảnh bài tập đính kèm'}
                      className="h-16 w-auto rounded-2xl border-2 border-emerald-500/50 shadow-md object-cover bg-white"
                    />
                  ) : (
                    <div
                      className={`flex items-center gap-2.5 pl-3 pr-7 py-2 rounded-2xl border-2 border-emerald-500/45 shadow-md text-xs font-bold ${
                        isDark
                          ? 'bg-[#101622] text-emerald-300'
                          : 'bg-white text-emerald-700'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate max-w-[200px]">{attachedImage.name}</div>
                        <div className="text-[10px] font-medium opacity-75">
                          {(attachedImage.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 hover:bg-rose-500 transition-colors shadow-sm cursor-pointer"
                    title="Gỡ tệp đính kèm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Quick Subject Selector Row */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 shrink-0 mr-1">
                  Chọn nhanh môn:
                </span>
                {quickSubjects.map((sub) => {
                  const SubIcon = sub.icon;
                  const isActiveSub = selectedSubjectId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubjectId(sub.id);
                        setInput((prev) => {
                          const stripped = prev.replace(/^\[[^\]]+\]\s*[^:]*:\s*/, '');
                          return stripped ? `${sub.prompt}${stripped}` : sub.prompt;
                        });
                        textareaRef.current?.focus();
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isActiveSub
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : isDark
                          ? 'bg-[#101622]/90 border-white/10 text-zinc-300 hover:border-emerald-500/40'
                          : 'bg-white/90 border-slate-200 text-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      <SubIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    if (onExecuteSlashCommand) {
                      onExecuteSlashCommand('/help');
                    } else {
                      setInput('/');
                      textareaRef.current?.focus();
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isDark
                      ? 'bg-[#5865F2]/20 border-[#5865F2]/40 text-indigo-300 hover:bg-[#5865F2]/30'
                      : 'bg-indigo-50 border-indigo-200 text-[#4752C4] hover:bg-indigo-100'
                  }`}
                  title="Xem tất cả lệnh điều khiển / (Slash Commands)"
                >
                  <span>/ Lệnh</span>
                </button>
              </div>

              {/* Discord-style Slash Command Autocomplete Menu */}
              {isTypingSlashMenu && matchingSlashCommands.length > 0 && (
                <div
                  className={`rounded-2xl border p-2 shadow-xl max-h-60 overflow-y-auto ${
                    isDark
                      ? 'bg-[#1e1f22] border-white/10 text-zinc-100'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#5865F2] flex items-center justify-between">
                    <span>Lệnh điều khiển (Slash Commands)</span>
                    <span className="opacity-70 font-normal">Tab để điền nhanh</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingSlashCommands.map((spec) => (
                      <button
                        key={spec.command}
                        type="button"
                        onClick={() => {
                          if (spec.command === '/profile' || spec.command === '/listban') {
                            onExecuteSlashCommand?.(spec.command);
                            setInput('');
                          } else {
                            setInput(`${spec.command} `);
                            textareaRef.current?.focus();
                          }
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-[#2b2d31]' : 'hover:bg-indigo-50/80'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-extrabold text-[#5865F2]">
                            {spec.syntax}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                            {spec.description}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#5865F2]/10 text-[#5865F2] shrink-0">
                          {spec.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Floating Pill Input Container */}
              <div
                className={`rounded-[28px] p-2 sm:p-2.5 border backdrop-blur-xl transition-all flex items-end gap-2 ${
                  isDark
                    ? 'bg-[#111827]/95 border-white/[0.1] shadow-[0_14px_40px_-8px_rgba(0,0,0,0.65)]'
                    : 'bg-white/95 border-slate-200/95 shadow-[0_12px_36px_-8px_rgba(15,23,42,0.16)]'
                }`}
              >
                {/* Prominent File & Photo Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs sm:text-sm transition-all shrink-0 cursor-pointer whitespace-nowrap"
                  title="Đính kèm ảnh bài tập hoặc tệp tài liệu (PDF, TXT, Code...)"
                >
                  <Paperclip className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Ảnh / Tệp</span>
                  <span className="sm:hidden">Tệp</span>
                </button>

                {/* Extra Tools Popover Button */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPlusMenu(!showPlusMenu)}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Thêm công cụ (Dán, Sửa lỗi, Tạo ảnh/Video AI)"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {showPlusMenu && (
                    <>
                      <div
                        onClick={() => setShowPlusMenu(false)}
                        className="fixed inset-0 z-30"
                      />
                      <div
                        className={`absolute bottom-full left-0 mb-2.5 w-64 rounded-2xl p-2 shadow-2xl border z-40 text-xs text-left ${
                          isDark
                            ? 'bg-[#101622] border-white/10 text-zinc-200'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            handlePasteClipboard();
                            setShowPlusMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        >
                          <ClipboardPaste className="w-4 h-4 text-sky-500" />
                          <span className="font-semibold">Dán câu hỏi từ Clipboard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleFixQuestionErrors();
                            setShowPlusMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="font-semibold">Sửa lỗi chính tả &amp; công thức</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setShowPlusMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        >
                          <Paperclip className="w-4 h-4 text-emerald-500" />
                          <span className="font-semibold">Đính kèm ảnh / tài liệu ({grade})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenMindMap) onOpenMindMap();
                            setShowPlusMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        >
                          <GitFork className="w-4 h-4 text-teal-500" />
                          <span className="font-semibold">Mở Sơ đồ tư duy</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsImageMode((prev) => !prev);
                            setShowPlusMenu(false);
                            textareaRef.current?.focus();
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4 text-indigo-500" />
                          <span className="font-semibold">
                            {isImageMode ? 'Tắt chế độ Tạo ảnh AI' : 'Bật chế độ Tạo ảnh AI'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setInput('Tạo video có người AI nói thuyết trình về: ');
                            setShowPlusMenu(false);
                            textareaRef.current?.focus();
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        >
                          <Video className="w-4 h-4 text-rose-500" />
                          <span className="font-semibold">Tạo video người AI nói</span>
                        </button>

                        {onOpenVoiceModal && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenVoiceModal();
                              setShowPlusMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4 text-teal-500" />
                            <span className="font-semibold">Cài đặt giọng nói AI</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isImageMode
                      ? 'Mô tả hình ảnh bạn muốn Max10 AI vẽ (VD: Phi hành gia học toán trên sao Hỏa)...'
                      : activeStudyBuddy
                      ? `Nhắn tin với ${activeStudyBuddy.flag} ${activeStudyBuddy.name}#${activeStudyBuddy.tag} (${activeStudyBuddy.nativeLanguage}) hoặc gõ / để dùng lệnh...`
                      : quizVoiceMode
                      ? `Trả lời câu hỏi của ${quizRole === 'deskmate' ? 'bạn học cùng bàn' : 'gia sư'} (${activeCountry.nativeName}) bằng chữ hoặc nhấn Mic...`
                      : `Hỏi bài tập ${grade}, gõ lệnh /timban, /ngonngu, /hoibai hoặc đính kèm ảnh/tệp...`
                  }
                  rows={1}
                  className={`flex-1 min-w-0 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs sm:text-sm resize-none leading-relaxed py-2 px-1 ${
                    isDark ? 'text-white placeholder-zinc-500' : 'text-slate-900 placeholder-slate-400'
                  }`}
                />

                {/* Right Controls inside Pill */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isImageMode;
                      setIsImageMode(next);
                      showToast(
                        next
                          ? 'Đã bật chế độ Tạo ảnh AI — gõ mô tả để vẽ ngay!'
                          : 'Đã quay lại chế độ Trò chuyện & Giải bài.'
                      );
                      textareaRef.current?.focus();
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-full text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap ${
                      isImageMode
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                        : isDark
                        ? 'bg-white/[0.04] border-white/10 text-indigo-300 hover:bg-white/[0.08]'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                    }`}
                    title={isImageMode ? 'Đang bật chế độ Tạo ảnh AI (bấm để tắt)' : 'Bật chế độ Tạo ảnh AI'}
                  >
                    <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden md:inline">Tạo ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeepThinking(!deepThinking)}
                    className={`hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap ${
                      deepThinking
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : isDark
                        ? 'bg-white/[0.04] border-white/10 text-amber-400 hover:bg-white/[0.08]'
                        : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                    }`}
                    title={deepThinking ? 'Đang bật chế độ Soi Bẫy Điểm 10' : 'Bật chế độ Soi Bẫy Điểm 10'}
                  >
                    <Zap className={`w-3.5 h-3.5 ${deepThinking ? 'fill-white' : 'fill-amber-500'}`} />
                    <span className="hidden md:inline">Bẫy Điểm 10</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                      isListening
                        ? 'bg-rose-500 border-rose-500 text-white'
                        : isDark
                        ? 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Nhập câu hỏi bằng giọng nói"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => (input.trim() || attachedImage ? handleSubmit() : undefined)}
                    disabled={(!input.trim() && !attachedImage) || loading}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      input.trim() || attachedImage
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 active:scale-95'
                        : isDark
                        ? 'bg-white/[0.06] text-zinc-600 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    title="Gửi câu hỏi"
                    aria-label="Gửi câu hỏi"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
            type="button"
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Phóng to ảnh"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Mini Game Quiz Modal */}
      <MiniGameQuizModal
        isOpen={showMiniGameModal}
        onClose={() => setShowMiniGameModal(false)}
        grade={grade}
        lessonContext={activeLessonContext}
        userName={studentDisplayName}
        isDark={isDark}
      />

      {/* Math Challenge Modal */}
      <MathChallengeModal
        isOpen={showMathChallengeModal}
        onClose={() => setShowMathChallengeModal(false)}
        grade={grade}
        userName={studentDisplayName}
        isDark={isDark}
      />
    </div>
  );
};
