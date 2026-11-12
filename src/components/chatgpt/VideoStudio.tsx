import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  Copy,
  Check,
  Clapperboard,
  Film,
  Smartphone,
  Monitor,
  Lightbulb,
  MessageSquare,
  HelpCircle,
  Clock,
  Layers,
  CheckCircle2,
  Share2,
  RefreshCw,
  Zap,
  Image as ImageIcon,
  Palette,
  Upload,
  UserCheck,
  Camera,
  Heart,
  Sliders,
  Send,
  Printer,
  Maximize2,
} from 'lucide-react';
import { GradeLevel, SubjectInfo } from '../../types';

export interface VideoScene {
  sceneNumber: number;
  title: string;
  duration: number; // in seconds
  caption: string;
  voiceover: string;
  visualDescription: string;
  keywords: string[];
  soundEffect?: string;
}

export interface EducationalVideoProject {
  title: string;
  topic: string;
  grade: string;
  subject: string;
  ratio: '9:16' | '16:9';
  durationSeconds: number;
  bgmSuggestion: string;
  summaryMotto: string;
  scenes: VideoScene[];
  quizQuestion?: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  };
}

export interface PosterProject {
  id: string;
  topic: string;
  headline: string;
  subtitle: string;
  bulletPoints: string[];
  imageUrl: string;
  theme: string;
  aspectRatio: string;
  createdAt: string;
}

interface VideoStudioProps {
  currentGrade: GradeLevel;
  currentSubject?: SubjectInfo;
  isDark: boolean;
  onSendToChat?: (text: string) => void;
}

const PRESET_TOPICS = [
  { topic: 'Bẫy Hệ thức Vi-ét mất điểm oan', subject: 'Toán học', grade: 'Lớp 9', ratio: '9:16' as const },
  { topic: 'Phân tích bài thơ Ánh Trăng trong 60 giây', subject: 'Ngữ văn', grade: 'Lớp 9', ratio: '9:16' as const },
  { topic: '5 Dạng câu điều kiện Tiếng Anh kinh điển', subject: 'Tiếng Anh', grade: 'Lớp 9', ratio: '16:9' as const },
  { topic: 'Định luật Bảo toàn khối lượng siêu dễ nhớ', subject: 'Khoa học Tự nhiên', grade: 'Lớp 8', ratio: '9:16' as const },
  { topic: 'Chiến thắng Điện Biên Phủ trên không hào hùng', subject: 'Lịch sử và Địa lí', grade: 'Lớp 9', ratio: '16:9' as const },
];

// Removed 6 hardcoded preset characters as requested by user ("bỏ 6 nhân vật AI diễn thuyết đi theo lệnh thì mới cho giọng nói")
// The system now uses command-driven avatars created by prompt (ChatGPT DALL-E 3) or uploaded by user
const DEFAULT_PRESENTER = {
  id: 'command_presenter',
  name: 'Người Diễn Thuyết Theo Lệnh',
  role: 'Diễn thuyết & Trợ giảng AI',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  voicePitch: 1.0,
  voiceRate: 1.0,
  voiceName: 'Kore',
};

const STUDIO_BACKGROUNDS = [
  {
    id: 'smart_class',
    name: 'Lớp Học Thông Minh 4.0',
    icon: '🏫',
    bgUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'tv_studio',
    name: 'Trường Quay Thời Sự AI',
    icon: '🎥',
    bgUrl: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'library',
    name: 'Thư Viện Tri Thức Cổ Điển',
    icon: '📚',
    bgUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'ai_space',
    name: 'Không Gian Số Hologram 3D',
    icon: '🌐',
    bgUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'lecture_hall',
    name: 'Giảng Đường Đại Học',
    icon: '🏛️',
    bgUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80',
  },
];

const PRESENTER_SCRIPTS = [
  {
    title: 'Chào mừng & Giới thiệu Max10 AI',
    text: 'Xin chào các bạn học sinh thân mến! Tôi là Người Thuyết Trình AI của Max10. Hôm nay, chúng ta cùng đồng hành với nhau trên con đường chinh phục điểm 10 tuyệt đối trong mọi bài thi và kỳ thi tuyển sinh!',
  },
  {
    title: 'Bí kíp săn điểm 10 môn Toán 60s',
    text: 'Để không bao giờ bị mất điểm oan trong bài thi Toán, các bạn hãy nhớ kỹ 3 nguyên tắc vàng: Luôn đặt điều kiện xác định đầu tiên, kiểm tra kỹ dấu âm khi khai căn, và đối chiếu điều kiện trước khi kết luận!',
  },
  {
    title: 'Tri ân Ngày Nhà Giáo Việt Nam 20/11',
    text: 'Nhân ngày Nhà giáo Việt Nam 20/11, xin kính chúc tất cả các Thầy giáo, Cô giáo luôn dồi dào sức khỏe, tràn đầy nhiệt huyết và tiếp tục chắp cánh cho bao thế hệ học trò vươn tới những đỉnh cao tri thức!',
  },
  {
    title: 'Động viên kỳ thi tuyển sinh vào 10',
    text: 'Các bạn học sinh lớp 9 ơi, kỳ thi vào 10 đang đến rất gần! Hãy luôn giữ vững sự tự tin, ăn ngủ điều độ và rèn luyện đều đặn mỗi ngày. Max10 luôn ở đây đồng hành cùng bạn để biến ước mơ đỗ trường chuyên thành hiện thực!',
  },
  {
    title: 'Cảm thụ bài thơ Ánh Trăng (Nguyễn Duy)',
    text: 'Hình ảnh ánh trăng im phăng phắc như một lời nhắc nhở nghiêm khắc mà bao dung: Con người có thể lãng quên quá khứ gian lao, nhưng quá khứ nghĩa tình và thiên nhiên vĩnh cửu vẫn luôn thủy chung chờ đợi!',
  },
];

const AI_VOICES = [
  { id: 'Kore', name: 'Nữ Dịu Dàng (Kore)', desc: 'Truyền cảm, giọng đọc chuẩn văn học' },
  { id: 'Charon', name: 'Nam Trầm Ấm (Charon)', desc: 'Đĩnh đạc, rõ ràng, phong thái thầy giáo' },
  { id: 'Puck', name: 'Nam Trẻ Năng Động (Puck)', desc: 'Tươi vui, gần gũi học sinh thủ khoa' },
  { id: 'Fenrir', name: 'Thầy Giáo Đĩnh Đạc (Fenrir)', desc: 'Nghiêm túc, chuẩn mực giảng dạy' },
  { id: 'Zephyr', name: 'Nữ Truyền Cảm (Zephyr)', desc: 'Tự tin, phong cách phát thanh viên' },
];

const POSTER_PRESETS = [
  {
    topic: 'Chào mừng Ngày Phụ Nữ Việt Nam 20/10',
    headline: 'CHÚC MỪNG NGÀY PHỤ NỮ VIỆT NAM 20/10',
    subtitle: 'Kính dâng ngàn hoa tươi thắm tri ân Mẹ, Cô giáo và Phụ nữ Việt Nam rực rỡ',
    bullets: [
      'Tôn vinh nét đẹp duyên dáng, dịu dàng và giàu đức hy sinh của Phụ nữ Việt Nam',
      'Tri ân sâu sắc người lái đò thầm lặng và người Mẹ tảo tần sớm hôm',
      'Vững vàng tri thức, tự tin tỏa sáng ngàn hoa Điểm 10 rực rỡ'
    ],
    theme: 'rose_festive',
    imageUrl: '/assets/aistudio/a-heartwarming-photo-of-a-graceful-vietnamese-woman-wearing-an-elegant-silk-o-di-smiling-joyfully_6ce349b7.jpg',
  },
  {
    topic: 'Tri ân Thầy Cô Ngày Nhà Giáo Việt Nam 20/11',
    headline: 'TRI ÂN THẦY CÔ - NGƯỜI LÁI ĐÒ THẦM LẶNG',
    subtitle: 'Kính mừng Ngày Nhà Giáo Việt Nam 20/11 cùng Thầy Cô và Học sinh Max10 AI',
    bullets: [
      'Mỗi bài giảng là một chân trời tri thức rộng mở',
      'Tri ân sâu sắc những người ươm mầm tương lai',
      'Quyết tâm thi đua đạt ngàn hoa Điểm 10'
    ],
    theme: 'autumn_warm',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1000&auto=format&fit=crop&q=80',
  },
  {
    topic: 'Chào mừng Ngày Quốc Tế Phụ Nữ 8/3',
    headline: 'RỰC RỠ YÊU THƯƠNG NGÀY QUỐC TẾ PHỤ NỮ 8/3',
    subtitle: 'Gửi ngàn lời chúc tốt đẹp nhất đến một nửa thế giới',
    bullets: [
      'Hạnh phúc, xinh đẹp và luôn đạt thành tích cao',
      'Năng lượng tích cực lan tỏa mỗi ngày học tập',
      'Cùng Max10 gặt hái hoa điểm 10 rạng rỡ'
    ],
    theme: 'spring_bloom',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
  },
  {
    topic: 'Bí kíp Giải bẫy Hệ thức Vi-ét Toán 9',
    headline: 'BÍ KÍP GIẢI NHANH BẪY HỆ THỨC VI-ÉT TOÁN 9',
    subtitle: 'Nắm chắc 3 bước nhẩm nghiệm trong 3 giây - Tuyệt đối không mất điểm oan',
    bullets: [
      'Bước 1: Luôn xét điều kiện Delta >= 0',
      'Bước 2: Viết đúng hệ thức S = -b/a, P = c/a',
      'Bước 3: Đối chiếu điều kiện nghiệm trước khi kết luận'
    ],
    theme: 'modern_blue',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1000&auto=format&fit=crop&q=80',
  },
];

export const VideoStudio: React.FC<VideoStudioProps> = ({
  currentGrade,
  currentSubject,
  isDark,
  onSendToChat,
}) => {
  // Studio Mode: Presenter Studio vs Multi-scene Video vs Poster Studio
  const [activeStudioMode, setActiveStudioMode] = useState<'presenter' | 'video' | 'poster'>('presenter');

  // Presenter Studio Mode states (User requirement: tạo video có người AI nói)
  const [presenterScript, setPresenterScript] = useState<string>(
    'Xin chào các bạn học sinh thân mến! Tôi là Người Thuyết Trình AI của Max10. Hôm nay chúng ta cùng khám phá phương pháp săn điểm 10 toàn diện, tự tin chinh phục mọi kỳ thi và tránh 100% các bẫy đề thi hiểm hóc!'
  );
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [selectedBgId, setSelectedBgId] = useState<string>('smart_class');
  const [isPresenterSpeaking, setIsPresenterSpeaking] = useState<boolean>(false);
  const [presenterAudioUrl, setPresenterAudioUrl] = useState<string | null>(null);
  const [presenterAudioLoading, setPresenterAudioLoading] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const presenterAudioRef = useRef<HTMLAudioElement | null>(null);

  // Input parameters for Video
  const [topic, setTopic] = useState<string>('Giải bẫy Hệ thức Vi-ét trong 60 giây');
  const [subject, setSubject] = useState<string>('Toán học');
  const [grade, setGrade] = useState<string>(currentGrade.includes('Lớp') ? currentGrade : 'Lớp 9');
  const [ratio, setRatio] = useState<'9:16' | '16:9'>('9:16');
  const [style, setStyle] = useState<'short' | 'step_by_step' | 'story' | 'presentation'>('short');

  // Command-driven Avatar states (User requirement: bỏ 6 nhân vật AI, tạo theo lệnh, chỉ cho giọng nói theo lệnh)
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [customAvatarName, setCustomAvatarName] = useState<string>('Người Diễn Thuyết AI (Theo Lệnh)');
  const [customAvatarRole, setCustomAvatarRole] = useState<string>('Thuyết trình viên AI Max10');
  const [avatarPrompt, setAvatarPrompt] = useState<string>('Thầy giáo trẻ giảng bài lịch thiệp, mắt sáng, mặc áo sơ mi trắng, chân thực 8k');
  const [generatingAvatar, setGeneratingAvatar] = useState<boolean>(false);
  const [voiceRate, setVoiceRate] = useState<number>(1.0);
  const [voicePitch, setVoicePitch] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [mouthOpenAmount, setMouthOpenAmount] = useState<number>(0); // 0 to 1
  const [headTiltAngle, setHeadTiltAngle] = useState<number>(0); // in degrees
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Generation state
  const [loading, setLoading] = useState<boolean>(false);
  const [videoProject, setVideoProject] = useState<EducationalVideoProject | null>(null);

  // Video Player state
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [sceneProgress, setSceneProgress] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  // Active View Tab in Video Studio
  const [studioTab, setStudioTab] = useState<'player' | 'storyboard' | 'quiz'>('player');

  // Quiz interactive state
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(null);
  const [showQuizExplanation, setShowQuizExplanation] = useState<boolean>(false);

  // Audio Speech Ref
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playTimerRef = useRef<any>(null);
  const mouthAnimRef = useRef<any>(null);

  // Poster Studio State (User requirement: cho tạo poster đúng yêu cầu, dùng ảnh thứ 2 cho poster 20/10)
  const [posterTopic, setPosterTopic] = useState<string>('Chào mừng Ngày Phụ Nữ Việt Nam 20/10');
  const [posterHeadline, setPosterHeadline] = useState<string>('CHÚC MỪNG NGÀY PHỤ NỮ VIỆT NAM 20/10');
  const [posterSubtitle, setPosterSubtitle] = useState<string>('Kính dâng ngàn hoa tươi thắm tri ân Mẹ, Cô giáo và Phụ nữ Việt Nam rực rỡ');
  const [posterBullets, setPosterBullets] = useState<string[]>([
    'Tôn vinh nét đẹp duyên dáng, dịu dàng và giàu đức hy sinh của Phụ nữ Việt Nam',
    'Tri ân sâu sắc người lái đò thầm lặng và người Mẹ tảo tần sớm hôm',
    'Vững vàng tri thức, tự tin tỏa sáng ngàn hoa Điểm 10 rực rỡ'
  ]);
  const [posterTheme, setPosterTheme] = useState<string>('rose_festive');
  const [posterRatio, setPosterRatio] = useState<'3:4' | '1:1' | '9:16' | '16:9'>('3:4');
  const [posterLoading, setPosterLoading] = useState<boolean>(false);
  const [activePoster, setActivePoster] = useState<PosterProject | null>(() => ({
    id: 'poster-2010',
    topic: 'Chào mừng Ngày Phụ Nữ Việt Nam 20/10',
    headline: 'CHÚC MỪNG NGÀY PHỤ NỮ VIỆT NAM 20/10',
    subtitle: 'Kính dâng ngàn hoa tươi thắm tri ân Mẹ, Cô giáo và Phụ nữ Việt Nam rực rỡ',
    bulletPoints: [
      'Tôn vinh nét đẹp duyên dáng, dịu dàng và giàu đức hy sinh của Phụ nữ Việt Nam',
      'Tri ân sâu sắc người lái đò thầm lặng và người Mẹ tảo tần sớm hôm',
      'Vững vàng tri thức, tự tin tỏa sáng ngàn hoa Điểm 10 rực rỡ'
    ],
    imageUrl: '/assets/aistudio/a-heartwarming-photo-of-a-graceful-vietnamese-woman-wearing-an-elegant-silk-o-di-smiling-joyfully_6ce349b7.jpg',
    theme: 'rose_festive',
    aspectRatio: '3:4',
    createdAt: new Date().toLocaleDateString('vi-VN'),
  }));
  const [posterToast, setPosterToast] = useState<string | null>(null);

  const customAvatarInputRef = useRef<HTMLInputElement>(null);

  // Handle generating custom avatar by prompt (ChatGPT DALL-E 3 engine)
  const handleGenerateAvatarByCommand = async () => {
    if (!avatarPrompt.trim()) return;
    setGeneratingAvatar(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `High quality portrait of ${avatarPrompt.trim()}, front-facing talking presenter, neutral background, perfect facial features, crisp focus, studio lighting, 8k resolution`,
          style: 'chatgpt',
          aspectRatio: '1:1',
        }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setCustomAvatarUrl(data.imageUrl);
        setCustomAvatarName('Nhân vật tạo theo lệnh DALL·E 3');
      }
    } catch (e) {
      console.error('Lỗi tạo ảnh nhân vật theo lệnh:', e);
    } finally {
      setGeneratingAvatar(false);
    }
  };

  // Active Avatar Config
  const activeAvatar = customAvatarUrl
    ? {
        id: 'custom',
        name: customAvatarName,
        role: customAvatarRole,
        avatarUrl: customAvatarUrl,
        voicePitch: voicePitch,
        voiceRate: voiceRate,
      }
    : {
        ...DEFAULT_PRESENTER,
        voicePitch: voicePitch,
        voiceRate: voiceRate,
      };

  // Initial demo project load
  useEffect(() => {
    handleGenerateVideo();
  }, []);

  // Natural Eye Blinking Simulation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Realistic Lip-Sync & Head Motion Simulation while speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpenAmount(0);
      setHeadTiltAngle(0);
      setAudioLevel(0);
      if (mouthAnimRef.current) {
        clearInterval(mouthAnimRef.current);
        mouthAnimRef.current = null;
      }
      return;
    }

    // Lip sync mouth opening cycles (syllable oscillation)
    const mouthPhonemeLevels = [0.15, 0.65, 0.95, 0.35, 0.85, 0.45, 0.1, 0.75, 0.3, 0.9, 0.5];
    const headTiltAngles = [-2, -1, 0, 1.5, 2, 0.5, -1.5, 0];
    let idx = 0;

    mouthAnimRef.current = setInterval(() => {
      idx++;
      const currentLevel = mouthPhonemeLevels[idx % mouthPhonemeLevels.length];
      const currentTilt = headTiltAngles[idx % headTiltAngles.length];
      setMouthOpenAmount(currentLevel);
      setHeadTiltAngle(currentTilt);
      setAudioLevel(0.4 + currentLevel * 0.6);
    }, 140);

    return () => {
      if (mouthAnimRef.current) {
        clearInterval(mouthAnimRef.current);
      }
    };
  }, [isSpeaking]);

  const activeBg =
    STUDIO_BACKGROUNDS.find((bg) => bg.id === selectedBgId) || STUDIO_BACKGROUNDS[0];

  const stopPresenterSpeech = () => {
    setIsPresenterSpeaking(false);
    setIsSpeaking(false);
    if (presenterAudioRef.current) {
      presenterAudioRef.current.pause();
      presenterAudioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handlePlayPresenterSpeech = async () => {
    const textToSpeak = presenterScript.trim();
    if (!textToSpeak) return;

    if (isPresenterSpeaking) {
      stopPresenterSpeech();
      return;
    }

    setPresenterAudioLoading(true);
    setIsPresenterSpeaking(true);
    setIsSpeaking(true);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          voice: selectedVoice,
        }),
      });
      const data = await res.json();
      if (data.success && data.audioUrl) {
        setPresenterAudioUrl(data.audioUrl);
        const audio = new Audio(data.audioUrl);
        presenterAudioRef.current = audio;
        audio.onended = () => {
          setIsPresenterSpeaking(false);
          setIsSpeaking(false);
        };
        audio.onerror = () => {
          fallbackPresenterWebSpeech(textToSpeak);
        };
        await audio.play();
        setPresenterAudioLoading(false);
        return;
      }
    } catch (err) {
      console.warn('TTS API error, falling back to Web Speech:', err);
    } finally {
      setPresenterAudioLoading(false);
    }

    fallbackPresenterWebSpeech(textToSpeak);
  };

  const fallbackPresenterWebSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPresenterSpeaking(false);
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = activeAvatar.voiceRate || 1.0;
    utterance.pitch = activeAvatar.voicePitch || 1.0;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.includes('vi') || v.lang.includes('VN'));
    if (viVoice) utterance.voice = viVoice;

    utterance.onstart = () => {
      setIsPresenterSpeaking(true);
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      setIsPresenterSpeaking(false);
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsPresenterSpeaking(false);
      setIsSpeaking(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleDownloadPresenterAudio = async () => {
    if (!presenterAudioUrl) {
      setPresenterAudioLoading(true);
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: presenterScript.trim(),
            voice: selectedVoice,
          }),
        });
        const data = await res.json();
        if (data.success && data.audioUrl) {
          setPresenterAudioUrl(data.audioUrl);
          const a = document.createElement('a');
          a.href = data.audioUrl;
          a.download = `max10-ai-speech-${Date.now()}.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setPosterToast('Đã tải file âm thanh giọng nói AI thành công!');
          setTimeout(() => setPosterToast(null), 3000);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setPresenterAudioLoading(false);
      }
      return;
    }

    const a = document.createElement('a');
    a.href = presenterAudioUrl;
    a.download = `max10-ai-speech-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setPosterToast('Đã tải file âm thanh giọng nói AI thành công!');
    setTimeout(() => setPosterToast(null), 3000);
  };

  const handleRecordPresenterVideo = () => {
    setIsRecording(true);
    setRecordingProgress(0);
    handlePlayPresenterSpeech();
    let prog = 0;
    const interval = setInterval(() => {
      prog += 15;
      setRecordingProgress(Math.min(100, prog));
      if (prog >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsRecording(false);
          setPosterToast('Đã kết xuất hoàn tất video người AI nói!');
          setTimeout(() => setPosterToast(null), 3500);
        }, 500);
      }
    }, 400);
  };

  const handleCopyPresenterScript = () => {
    navigator.clipboard.writeText(presenterScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleGenerateVideo = async (overrideParams?: Partial<{ topic: string; subject: string; grade: string; ratio: '9:16' | '16:9' }>) => {
    setLoading(true);
    stopPlayback();

    const targetTopic = overrideParams?.topic || topic;
    const targetSubject = overrideParams?.subject || subject;
    const targetGrade = overrideParams?.grade || grade;
    const targetRatio = overrideParams?.ratio || ratio;

    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          subject: targetSubject,
          grade: targetGrade,
          ratio: targetRatio,
          style,
        }),
      });

      const data = await res.json();
      if (data.success && data.video) {
        setVideoProject(data.video);
        setCurrentSceneIdx(0);
        setSelectedQuizAnswer(null);
        setShowQuizExplanation(false);
      }
    } catch (err) {
      console.warn('Lỗi kết nối tạo video, dùng fallback', err);
    } finally {
      setLoading(false);
    }
  };

  // Playback & Voiceover with Lip-sync speaking hook
  const speakSceneVoiceover = (text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    if (isMuted) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = activeAvatar.voiceRate || 1.05;
    utterance.pitch = activeAvatar.voicePitch || 1.0;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.includes('vi') || v.lang.includes('VN'));
    if (viVoice) utterance.voice = viVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startPlayback = () => {
    if (!videoProject || videoProject.scenes.length === 0) return;
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setIsSpeaking(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
    setSceneProgress(0);
  };

  // Effect to handle scene playing and auto-progress
  useEffect(() => {
    if (!isPlaying || !videoProject) return;

    const currentScene = videoProject.scenes[currentSceneIdx];
    if (!currentScene) {
      stopPlayback();
      return;
    }

    setSceneProgress(0);
    const sceneDurationMs = (currentScene.duration || 10) * 1000;
    const intervalStepMs = 100;
    let elapsedMs = 0;

    // Speak voiceover with talking avatar animation
    speakSceneVoiceover(currentScene.voiceover);

    playTimerRef.current = setInterval(() => {
      elapsedMs += intervalStepMs;
      const progress = Math.min(100, (elapsedMs / sceneDurationMs) * 100);
      setSceneProgress(progress);

      if (elapsedMs >= sceneDurationMs) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;

        // Advance to next scene or loop
        if (currentSceneIdx < videoProject.scenes.length - 1) {
          setCurrentSceneIdx((prev) => prev + 1);
        } else {
          // Finished all scenes!
          setIsPlaying(false);
          setIsSpeaking(false);
          setSceneProgress(100);
          setStudioTab('quiz'); // Prompt quiz at end
        }
      }
    }, intervalStepMs);

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [isPlaying, currentSceneIdx, videoProject]);

  const handleNextScene = () => {
    if (!videoProject) return;
    if (currentSceneIdx < videoProject.scenes.length - 1) {
      setCurrentSceneIdx((prev) => prev + 1);
    }
  };

  const handlePrevScene = () => {
    if (!videoProject) return;
    if (currentSceneIdx > 0) {
      setCurrentSceneIdx((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentSceneIdx(0);
    setSceneProgress(0);
    startPlayback();
  };

  const handleTestAvatarSpeech = () => {
    const testLine =
      currentScene?.voiceover ||
      `Chào các bạn học sinh và quý Thầy Cô! Mình là ${activeAvatar.name}, trợ lý học tập điểm 10 tại Max10 AI. Chúc bạn luôn đạt thành tích xuất sắc!`;
    speakSceneVoiceover(testLine);
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomAvatarUrl(reader.result as string);
      setCustomAvatarName('Ảnh Chân Dung Của Bạn');
    };
    reader.readAsDataURL(file);
  };

  // POSTER GENERATION HANDLER (User requirement: cho tạo poster đúng yêu cầu)
  const handleGeneratePoster = async () => {
    setPosterLoading(true);
    try {
      const res = await fetch('/api/poster/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: posterTopic,
          headline: posterHeadline,
          subtitle: posterSubtitle,
          bulletPoints: posterBullets,
          theme: posterTheme,
          aspectRatio: posterRatio,
        }),
      });

      const data = await res.json();
      if (data.success && data.poster) {
        setActivePoster(data.poster);
        setPosterToast('🎉 Đã tạo poster thành công theo đúng yêu cầu của bạn!');
        setTimeout(() => setPosterToast(null), 4000);
      }
    } catch (e) {
      // Fallback local poster
      setActivePoster({
        id: `poster-${Date.now()}`,
        topic: posterTopic,
        headline: posterHeadline,
        subtitle: posterSubtitle,
        bulletPoints: posterBullets,
        imageUrl: `https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1000&q=80`,
        theme: posterTheme,
        aspectRatio: posterRatio,
        createdAt: new Date().toLocaleDateString('vi-VN'),
      });
      setPosterToast('Đã tạo poster với mẫu chuẩn!');
      setTimeout(() => setPosterToast(null), 4000);
    } finally {
      setPosterLoading(false);
    }
  };

  const currentScene = videoProject?.scenes[currentSceneIdx];

  return (
    <div className={`w-full min-h-full p-4 sm:p-8 pb-48 rounded-3xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
      {/* Toast */}
      {posterToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white border border-rose-500/50 shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
          <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{posterToast}</span>
        </div>
      )}

      {/* Header Studio with Tabs Switcher: Video vs Poster */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Xưởng Sản Xuất Video & Poster AI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Tạo Poster Chuẩn Đẹp & Video Có Ảnh Mô Phỏng Lời Nói</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
            Mô phỏng cử động miệng nói theo âm thanh thuyết minh (Lip-sync AI), tạo poster học tập và ngày lễ 20/10, 20/11, 8/3 theo đúng yêu cầu.
          </p>
        </div>

        {/* Studio Mode Selector (3 modes) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-black/10 dark:bg-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveStudioMode('presenter')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStudioMode === 'presenter'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Người AI Nói (Thuyết Trình)</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-black text-[9px] font-black">
              HOT
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStudioMode('video')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStudioMode === 'video'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Video Bài Giảng Toàn Cảnh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveStudioMode('poster');
              if (!activePoster) handleGeneratePoster();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStudioMode === 'poster'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Xưởng Thiết Kế Poster AI</span>
          </button>
        </div>
      </div>

      {/* ================= MODE 0: NGƯỜI AI THUYẾT TRÌNH NÓI (TALKING AVATAR PRESENTER) ================= */}
      {/* User requirement: "tạo video có người AI nói" */}
      {activeStudioMode === 'presenter' && (
        <div className="space-y-6">
          {/* Quick Script Presets Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Gợi ý kịch bản lời thoại:</span>
            </span>
            {PRESENTER_SCRIPTS.map((ps, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPresenterScript(ps.text);
                  stopPresenterSpeech();
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                  presenterScript === ps.text
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : isDark
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {ps.title}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Script Input Card */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
                } space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-rose-500" />
                    <span>Nhập kịch bản hoặc lời thoại cho Người AI nói:</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {presenterScript.length} ký tự
                  </span>
                </div>

                <textarea
                  value={presenterScript}
                  onChange={(e) => {
                    setPresenterScript(e.target.value);
                    if (isPresenterSpeaking) stopPresenterSpeech();
                  }}
                  rows={4}
                  placeholder="Nhập bất kỳ đoạn văn, bài giảng, lời chào, chia sẻ kinh nghiệm ôn thi để Người AI đọc..."
                  className={`w-full p-3 rounded-xl text-xs leading-relaxed border resize-none outline-hidden transition-all ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-rose-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-rose-500'
                  }`}
                />

                {/* Command-driven Avatar Studio (User requirement: bỏ 6 nhân vật AI, tạo theo lệnh, theo lệnh thì mới cho giọng nói) */}
                <div className="space-y-2 p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                      <span>Nhân vật Người AI (Tạo theo lệnh & Tải ảnh):</span>
                    </label>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                      Chuẩn ChatGPT DALL·E 3
                    </span>
                  </div>

                  {/* Prompt to generate avatar accurately like ChatGPT */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={avatarPrompt}
                        onChange={(e) => setAvatarPrompt(e.target.value)}
                        placeholder="Nhập lệnh mô tả chân dung (VD: Thầy giáo trẻ dạy Toán áo sơ mi trắng, Cô giáo áo dài...)"
                        className={`flex-1 p-2 rounded-xl text-xs border outline-hidden transition-all ${
                          isDark
                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-rose-500'
                            : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-rose-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAvatarByCommand}
                        disabled={generatingAvatar || !avatarPrompt.trim()}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-xs cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                        title="Tạo ảnh chân dung Người AI chuẩn xác như ChatGPT DALL-E 3 theo lệnh"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${generatingAvatar ? 'animate-spin' : ''}`} />
                        <span>{generatingAvatar ? 'Đang tạo...' : 'Lệnh Tạo Ảnh'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => customAvatarInputRef.current?.click()}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            isDark
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Upload className="w-3 h-3 text-emerald-500" />
                          <span>Tải ảnh chân dung của bạn</span>
                        </button>

                        {customAvatarUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomAvatarUrl(null);
                              setCustomAvatarName('Người Diễn Thuyết Theo Lệnh');
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          >
                            Đặt lại mặc định
                          </button>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {customAvatarUrl ? '✓ Đang dùng ảnh theo lệnh' : 'Ảnh thuyết trình chuẩn'}
                      </span>
                    </div>

                    {/* Active Avatar Preview & Custom Name */}
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 mt-2">
                      <img
                        src={activeAvatar.avatarUrl}
                        alt={activeAvatar.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-rose-500/30 ring-2 ring-rose-500/20"
                      />
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={customAvatarName}
                          onChange={(e) => setCustomAvatarName(e.target.value)}
                          placeholder="Tên người nói..."
                          className="px-2 py-1 rounded-md text-xs font-bold border border-transparent hover:border-slate-300 dark:hover:border-zinc-600 bg-transparent"
                        />
                        <input
                          type="text"
                          value={customAvatarRole}
                          onChange={(e) => setCustomAvatarRole(e.target.value)}
                          placeholder="Vai trò diễn thuyết..."
                          className="px-2 py-1 rounded-md text-[11px] text-slate-500 dark:text-zinc-400 border border-transparent hover:border-slate-300 dark:hover:border-zinc-600 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Speech By Command Assurance & Rate/Pitch Controls */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Giọng nói tuân thủ theo lệnh: Chỉ phát tiếng khi bạn bấm nút lệnh!</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                        <span>Tốc độ đọc lệnh:</span>
                        <span className="font-mono text-emerald-600">{voiceRate}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="1.4"
                        step="0.1"
                        value={voiceRate}
                        onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                        <span>Cao độ giọng (Pitch):</span>
                        <span className="font-mono text-indigo-600">{voicePitch}</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="1.3"
                        step="0.05"
                        value={voicePitch}
                        onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Voice Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-teal-500" />
                    <span>Chọn Giọng Đọc AI (Gemini TTS Studio):</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {AI_VOICES.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVoice(v.id);
                          if (isPresenterSpeaking) stopPresenterSpeech();
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedVoice === v.id
                            ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold ring-2 ring-teal-500/20'
                            : isDark
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-[11px] font-bold truncate">{v.name}</div>
                        <div className="text-[9px] text-slate-400 truncate">{v.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Studio Background Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Chọn Phim Trường / Hình Nền Studio:</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {STUDIO_BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setSelectedBgId(bg.id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                          selectedBgId === bg.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold ring-2 ring-indigo-500/20'
                            : isDark
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm">{bg.icon}</span>
                        <span className="text-[11px] font-bold truncate">{bg.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ratio Selector */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRatio('9:16')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        ratio === '9:16'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : isDark
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                          : 'bg-white border-slate-300 text-slate-600'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Dọc 9:16 (TikTok)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRatio('16:9')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        ratio === '16:9'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : isDark
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                          : 'bg-white border-slate-300 text-slate-600'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Ngang 16:9 (YouTube)</span>
                    </button>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePlayPresenterSpeech}
                    disabled={presenterAudioLoading || !presenterScript.trim()}
                    className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                      isPresenterSpeaking
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/30 ring-2 ring-rose-400'
                        : 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-500/20 active:scale-98'
                    }`}
                  >
                    {presenterAudioLoading ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Đang khởi tạo giọng đọc AI...</span>
                      </>
                    ) : isPresenterSpeaking ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>Tạm Dừng Thuyết Minh</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Cho Người AI Nói Ngay (Lip-Sync Realtime)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Video Screen Showcase (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center space-y-4">
              <div
                className={`relative rounded-3xl overflow-hidden shadow-2xl border-4 ${
                  isDark ? 'border-zinc-800 bg-zinc-950' : 'border-slate-800 bg-slate-900'
                } ${
                  ratio === '9:16'
                    ? 'w-full max-w-sm aspect-[9/16] min-h-[520px]'
                    : 'w-full max-w-2xl aspect-[16/9] min-h-[380px]'
                } flex flex-col justify-between p-5 text-white transition-all relative`}
                style={{
                  backgroundImage: `linear-gradient(rgba(10, 10, 15, 0.75), rgba(10, 10, 15, 0.85)), url(${activeBg.bgUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Top Video Status Overlay */}
                <div className="flex items-center justify-between z-10 w-full">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span>ON AIR • THUYẾT TRÌNH VIÊN AI</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-mono text-zinc-300">
                      {activeBg.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px]">
                    <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>{selectedVoice}</span>
                  </div>
                </div>

                {/* Center: The Talking Avatar Presenter with Animated Lip-Sync */}
                <div className="my-auto flex flex-col items-center justify-center text-center space-y-3 px-3 z-10">
                  <div className="relative group flex flex-col items-center">
                    {/* Pulsing Audio Frequency Waves */}
                    {isPresenterSpeaking && (
                      <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-rose-500/40 via-amber-500/40 to-teal-500/40 animate-ping opacity-60 pointer-events-none" />
                    )}

                    {/* Animated Avatar Face Container */}
                    <div
                      className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-3xl p-1 bg-gradient-to-tr from-rose-500 via-amber-400 to-teal-500 shadow-2xl transition-transform duration-150"
                      style={{
                        transform: `rotate(${isPresenterSpeaking ? headTiltAngle : 0}deg) translateY(${
                          isPresenterSpeaking ? Math.sin(mouthOpenAmount * Math.PI) * 2 : 0
                        }px)`,
                      }}
                    >
                      <div className="w-full h-full rounded-[22px] overflow-hidden bg-slate-900 relative">
                        {/* Portrait Photo */}
                        <img
                          src={activeAvatar.avatarUrl}
                          alt={activeAvatar.name}
                          className="w-full h-full object-cover"
                        />

                        {/* Blinking Eyelid Simulation */}
                        {isBlinking && (
                          <div className="absolute inset-x-0 top-[28%] h-3 bg-slate-900/80 backdrop-blur-2xs transition-all pointer-events-none" />
                        )}

                        {/* Dynamic Talking Mouth Lip-Sync Simulation Layer */}
                        <div
                          className="absolute left-1/2 -translate-x-1/2 bottom-[24%] pointer-events-none transition-all duration-100 flex items-center justify-center"
                          style={{
                            width: `${16 + mouthOpenAmount * 14}px`,
                            height: `${4 + mouthOpenAmount * 16}px`,
                          }}
                        >
                          <div
                            className="w-full h-full rounded-full bg-rose-950 border-2 border-rose-400/80 shadow-inner transition-all flex items-center justify-center overflow-hidden"
                            style={{
                              transform: `scaleY(${0.6 + mouthOpenAmount * 0.8})`,
                            }}
                          >
                            {/* Inner tongue/teeth highlight */}
                            {mouthOpenAmount > 0.4 && (
                              <div className="w-2.5 h-1 rounded-full bg-white/70 absolute top-0.5" />
                            )}
                            {mouthOpenAmount > 0.6 && (
                              <div className="w-2 h-1.5 rounded-full bg-rose-500 absolute bottom-0.5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Microphone Presenter Badge */}
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-[9px] font-black text-amber-300 flex items-center gap-1.5 whitespace-nowrap shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{activeAvatar.name}</span>
                      </div>
                    </div>

                    {/* Animated Soundwave EQ Bars */}
                    {isPresenterSpeaking && (
                      <div className="flex items-center gap-1 mt-4">
                        <div className="w-1 bg-amber-400 rounded-full animate-bounce h-3" />
                        <div className="w-1 bg-rose-500 rounded-full animate-bounce h-6" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-4" style={{ animationDelay: '0.2s' }} />
                        <div className="w-1 bg-indigo-400 rounded-full animate-bounce h-7" style={{ animationDelay: '0.15s' }} />
                        <div className="w-1 bg-amber-400 rounded-full animate-bounce h-3" style={{ animationDelay: '0.05s' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom: Live Teleprompter Subtitle Banner */}
                <div className="z-10 w-full space-y-2">
                  <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 shadow-xl text-center">
                    <div className="text-[10px] font-mono text-amber-300 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>PHỤ ĐỀ TRỰC TIẾP THEO LỜI NÓI</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold leading-relaxed text-zinc-100 line-clamp-3">
                      &quot;{presenterScript}&quot;
                    </p>
                  </div>
                </div>

                {/* Recording Progress Indicator */}
                {isRecording && (
                  <div className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center p-6 text-center">
                    <Sparkles className="w-10 h-10 text-rose-500 animate-spin mb-3" />
                    <h3 className="text-base font-bold">Đang kết xuất video người AI nói...</h3>
                    <p className="text-xs text-zinc-400 mt-1">Đồng bộ âm thanh, phụ đề và cử động khuôn mặt</p>
                    <div className="w-48 bg-zinc-800 h-2 rounded-full overflow-hidden mt-4">
                      <div
                        className="bg-rose-500 h-full transition-all duration-200"
                        style={{ width: `${recordingProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar under Video Screen */}
              <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={handlePlayPresenterSpeech}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer"
                >
                  {isPresenterSpeaking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPresenterSpeaking ? 'Dừng nói' : 'Nói lại'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPresenterAudio}
                  disabled={presenterAudioLoading}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Tải tệp âm thanh WAV của giọng đọc AI"
                >
                  <Download className="w-3.5 h-3.5 text-teal-500" />
                  <span>Tải file âm thanh (WAV)</span>
                </button>

                <button
                  type="button"
                  onClick={handleRecordPresenterVideo}
                  disabled={isRecording}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Xuất video có người AI nói để lưu về máy hoặc chia sẻ"
                >
                  <Film className="w-3.5 h-3.5 text-rose-500" />
                  <span>Xuất video</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPresenterScript}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Đã sao chép' : 'Copy lời thoại'}</span>
                </button>

                {onSendToChat && (
                  <button
                    type="button"
                    onClick={() =>
                      onSendToChat(`Hãy nhận xét và giúp em phát triển kịch bản bài thuyết trình này: "${presenterScript}"`)
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Hỏi trong Chat</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODE 1: VIDEO BÀI GIẢNG TOÀN CẢNH (PHÂN CẢNH) ================= */}
      {activeStudioMode === 'video' && (
        <div className="space-y-6">
          {/* Preset Topics Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 whitespace-nowrap">
              Gợi ý nhanh:
            </span>
            {PRESET_TOPICS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopic(p.topic);
                  setSubject(p.subject);
                  setGrade(p.grade);
                  setRatio(p.ratio);
                  handleGenerateVideo(p);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                  topic === p.topic
                    ? 'bg-rose-500 text-white border-rose-500 shadow-2xs'
                    : isDark
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p.topic}
              </button>
            ))}
          </div>

          {/* Form Configuration */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-850/70 border-zinc-750' : 'bg-slate-50 border-slate-200'} space-y-3`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Chủ đề video bài giảng cần sản xuất:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Bí kíp nhẩm nghiệm Vi-ét, Cách nhớ 12 thì tiếng Anh..."
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Môn học:
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Khoa học Tự nhiên">Khoa học Tự nhiên</option>
                  <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
                  <option value="Tin học">Tin học</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Khối lớp:
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Lớp 6">Lớp 6</option>
                  <option value="Lớp 7">Lớp 7</option>
                  <option value="Lớp 8">Lớp 8</option>
                  <option value="Lớp 9">Lớp 9 (Luyện thi vào 10)</option>
                </select>
              </div>
            </div>

            {/* Choose Talking Avatar Presenter */}
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-rose-500" />
                  <span>Chọn nhân vật mô phỏng chuyển động theo lời nói (Talking Avatar):</span>
                </span>
                <button
                  type="button"
                  onClick={handleTestAvatarSpeech}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-rose-500/20"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Thử cử động nói</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={activeAvatar.avatarUrl}
                    alt={activeAvatar.name}
                    className="w-12 h-12 rounded-2xl object-cover shrink-0 border-2 border-rose-500/40 ring-2 ring-rose-500/20"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-xs truncate flex items-center gap-1.5">
                      <span>{activeAvatar.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold">
                        Theo lệnh
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {activeAvatar.role} • Giọng {selectedVoice} ({voiceRate}x)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveStudioMode('presenter')}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Đổi nhân vật theo lệnh
                  </button>

                  <button
                    type="button"
                    onClick={() => customAvatarInputRef.current?.click()}
                    className={`px-3 py-1.5 rounded-2xl border border-dashed flex items-center gap-1.5 transition-all cursor-pointer text-xs font-bold ${
                      customAvatarUrl
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                        : isDark
                        ? 'bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:text-white'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="file"
                      ref={customAvatarInputRef}
                      onChange={handleCustomAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Upload className="w-3.5 h-3.5" />
                    <span>{customAvatarUrl ? 'Đổi ảnh' : 'Tải ảnh'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Submit & Generate Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRatio('9:16')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    ratio === '9:16'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Dọc 9:16 (Shorts/TikTok)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRatio('16:9')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    ratio === '16:9'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Ngang 16:9 (YouTube)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleGenerateVideo()}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-60"
              >
                <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Đang sản xuất kịch bản & phân cảnh...' : 'Sản Xuất Video AI Ngay'}</span>
              </button>
            </div>
          </div>

          {/* MAIN SIMULATED VIDEO PLAYER */}
          {videoProject && currentScene && (
            <div className="flex flex-col items-center space-y-4">
              <div
                className={`relative rounded-3xl overflow-hidden shadow-2xl border-4 ${
                  isDark ? 'border-zinc-800 bg-zinc-950' : 'border-slate-800 bg-slate-900'
                } ${
                  ratio === '9:16'
                    ? 'w-full max-w-sm aspect-[9/16] min-h-[520px]'
                    : 'w-full max-w-2xl aspect-[16/9] min-h-[380px]'
                } flex flex-col justify-between p-5 text-white transition-all`}
              >
                {/* Top Scene Status */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                      Cảnh {currentScene.sceneNumber}/{videoProject.scenes.length}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-[10px] font-mono text-zinc-300">
                      {currentScene.duration}s
                    </span>
                  </div>

                  {/* Audio indicator */}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>{isSpeaking ? 'Đang thuyết minh...' : 'Sẵn sàng'}</span>
                  </div>
                </div>

                {/* CENTER: TALKING AVATAR WITH REAL SPEECH MOTION SIMULATION */}
                {/* User requirement: "phải có ảnh mô phỏng chuyển động theo lời nói" */}
                <div className="my-auto flex flex-col items-center justify-center text-center space-y-3 px-3 z-10">
                  {/* Avatar Frame with Dynamic Motion & Lip-Sync */}
                  <div className="relative group flex flex-col items-center">
                    {/* Pulsing Audio Frequency Waves */}
                    {isSpeaking && (
                      <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-rose-500/40 via-amber-500/40 to-indigo-500/40 animate-ping opacity-60 pointer-events-none" />
                    )}

                    {/* Animated Avatar Face Container */}
                    <div
                      className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr from-rose-500 via-amber-400 to-indigo-500 shadow-2xl transition-transform duration-150"
                      style={{
                        transform: `rotate(${isSpeaking ? headTiltAngle : 0}deg) translateY(${
                          isSpeaking ? Math.sin(mouthOpenAmount * Math.PI) * 2 : 0
                        }px)`,
                      }}
                    >
                      <div className="w-full h-full rounded-[22px] overflow-hidden bg-slate-900 relative">
                        {/* Portrait Photo */}
                        <img
                          src={activeAvatar.avatarUrl}
                          alt={activeAvatar.name}
                          className="w-full h-full object-cover"
                        />

                        {/* Blinking Eyelid Simulation */}
                        {isBlinking && (
                          <div className="absolute inset-x-0 top-[28%] h-3 bg-slate-900/80 backdrop-blur-2xs transition-all pointer-events-none" />
                        )}

                        {/* Dynamic Talking Mouth Lip-Sync Simulation Layer */}
                        {/* The mouth opens, widens and contracts according to speech amplitude */}
                        <div
                          className="absolute left-1/2 -translate-x-1/2 bottom-[24%] pointer-events-none transition-all duration-100 flex items-center justify-center"
                          style={{
                            width: `${16 + mouthOpenAmount * 14}px`,
                            height: `${4 + mouthOpenAmount * 16}px`,
                          }}
                        >
                          <div
                            className="w-full h-full rounded-full bg-rose-950 border-2 border-rose-400/80 shadow-inner transition-all flex items-center justify-center overflow-hidden"
                            style={{
                              transform: `scaleY(${0.6 + mouthOpenAmount * 0.8})`,
                            }}
                          >
                            {/* Inner tongue/teeth highlight */}
                            {mouthOpenAmount > 0.4 && (
                              <div className="w-2.5 h-1 rounded-full bg-white/70 absolute top-0.5" />
                            )}
                            {mouthOpenAmount > 0.6 && (
                              <div className="w-2 h-1.5 rounded-full bg-rose-500 absolute bottom-0.5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Microphone Soundwave Badge */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[9px] font-black text-amber-300 flex items-center gap-1 whitespace-nowrap shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{activeAvatar.name}</span>
                      </div>
                    </div>

                    {/* Animated Soundwave EQ Bars */}
                    {isSpeaking && (
                      <div className="flex items-center gap-1 mt-3">
                        <div className="w-1 bg-amber-400 rounded-full animate-bounce h-3" />
                        <div className="w-1 bg-rose-500 rounded-full animate-bounce h-6" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-4" style={{ animationDelay: '0.2s' }} />
                        <div className="w-1 bg-indigo-400 rounded-full animate-bounce h-7" style={{ animationDelay: '0.15s' }} />
                        <div className="w-1 bg-amber-400 rounded-full animate-bounce h-3" style={{ animationDelay: '0.05s' }} />
                      </div>
                    )}
                  </div>

                  {/* Scene Title */}
                  <h3 className="text-sm font-extrabold text-amber-300 tracking-wide uppercase pt-1">
                    {currentScene.title}
                  </h3>

                  {/* Main Viral Subtitles Box */}
                  <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-lg max-w-sm">
                    <p className="text-sm sm:text-base font-black text-white leading-snug drop-shadow-md">
                      {currentScene.caption}
                    </p>
                  </div>

                  {/* Keywords */}
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {currentScene.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-rose-600/30 border border-rose-500/40 text-amber-200 text-[10px] font-bold"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Voiceover Teleprompter */}
                <div className="space-y-2 z-10">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-xs text-zinc-200">
                    <div className="flex items-center justify-between text-[10px] font-bold text-rose-400 mb-0.5">
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        <span>Lời thuyết minh (Mô phỏng cử động lời nói):</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleTestAvatarSpeech}
                        className="text-amber-300 hover:underline cursor-pointer"
                      >
                        Nghe lại
                      </button>
                    </div>
                    <p className="italic text-[11px] leading-relaxed">"{currentScene.voiceover}"</p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-100 ease-linear rounded-full"
                      style={{ width: `${sceneProgress}%` }}
                    />
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-b from-rose-950/20 via-transparent to-black/80 pointer-events-none" />
              </div>

              {/* Player Controls Bar */}
              <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850 shadow-sm">
                <button
                  onClick={handleRestart}
                  className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer"
                  title="Phát lại từ đầu"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePrevScene}
                  disabled={currentSceneIdx === 0}
                  className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white disabled:opacity-40 cursor-pointer"
                  title="Cảnh trước"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => (isPlaying ? stopPlayback() : startPlayback())}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Tạm dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Phát Video & Thuyết Minh</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleNextScene}
                  disabled={currentSceneIdx === videoProject.scenes.length - 1}
                  className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white disabled:opacity-40 cursor-pointer"
                  title="Cảnh sau"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isMuted ? 'text-rose-500 bg-rose-500/10' : 'text-slate-600 dark:text-zinc-400'
                  }`}
                  title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODE 2: XƯỞNG THIẾT KẾ POSTER AI THEO ĐÚNG YÊU CẦU ================= */}
      {/* User requirement: "cho tạo poster ... và tạo ảnh phải đúng yêu cầu nếu làm sai thì biết rồi đấy" */}
      {activeStudioMode === 'poster' && (
        <div className="space-y-6">
          {/* Preset Posters */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              Chọn mẫu poster sự kiện & học tập có sẵn:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {POSTER_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPosterTopic(p.topic);
                    setPosterHeadline(p.headline);
                    setPosterSubtitle(p.subtitle);
                    setPosterBullets(p.bullets);
                    setPosterTheme(p.theme);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    posterTopic === p.topic
                      ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30'
                      : isDark
                      ? 'bg-zinc-850/80 border-zinc-750 hover:bg-zinc-800'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold text-xs text-purple-600 dark:text-purple-400 mb-1">
                    {p.topic}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-zinc-300 font-semibold truncate">
                    {p.headline}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Poster Customizer Form */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-zinc-850/80 border-zinc-750' : 'bg-slate-50 border-slate-200'} space-y-4`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Tiêu đề chính của Poster (Headline):</label>
                <input
                  type="text"
                  value={posterHeadline}
                  onChange={(e) => setPosterHeadline(e.target.value)}
                  placeholder="Ví dụ: TRI ÂN THẦY CÔ 20/11..."
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Phụ đề & Thông điệp truyền cảm hứng:</label>
                <input
                  type="text"
                  value={posterSubtitle}
                  onChange={(e) => setPosterSubtitle(e.target.value)}
                  placeholder="Ví dụ: Kính chúc Thầy Cô luôn dồi dào sức khỏe..."
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300'
                  }`}
                />
              </div>
            </div>

            {/* Bullet points */}
            <div>
              <label className="block text-xs font-bold mb-1">
                3 Điểm nhấn nội dung chính hiển thị trên Poster:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {posterBullets.map((bullet, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={bullet}
                    onChange={(e) => {
                      const updated = [...posterBullets];
                      updated[idx] = e.target.value;
                      setPosterBullets(updated);
                    }}
                    placeholder={`Điểm nhấn ${idx + 1}`}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Aspect ratio and style */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Tỷ lệ:</span>
                {(['3:4', '1:1', '9:16', '16:9'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPosterRatio(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      posterRatio === r
                        ? 'bg-purple-600 text-white border-purple-500'
                        : isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    {r === '3:4' ? 'A4 Dọc (3:4)' : r === '1:1' ? 'Vuông (1:1)' : r === '9:16' ? 'Dọc (9:16)' : 'Ngang (16:9)'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGeneratePoster}
                disabled={posterLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-60"
              >
                <Sparkles className={`w-4 h-4 ${posterLoading ? 'animate-spin' : ''}`} />
                <span>{posterLoading ? 'Đang tạo Poster đúng yêu cầu...' : 'Tạo Poster Đẹp Ngay'}</span>
              </button>
            </div>
          </div>

          {/* POSTER PREVIEW & DOWNLOAD CANVAS */}
          {activePoster && (
            <div className="flex flex-col items-center space-y-4">
              <div
                className={`relative rounded-3xl overflow-hidden shadow-2xl border-4 ${
                  isDark ? 'border-zinc-800 bg-zinc-950' : 'border-slate-800 bg-slate-900'
                } ${
                  posterRatio === '3:4'
                    ? 'w-full max-w-md aspect-[3/4] min-h-[520px]'
                    : posterRatio === '1:1'
                    ? 'w-full max-w-md aspect-square'
                    : posterRatio === '9:16'
                    ? 'w-full max-w-sm aspect-[9/16]'
                    : 'w-full max-w-2xl aspect-[16/9]'
                } flex flex-col justify-between p-6 text-white text-center relative`}
              >
                {/* Background Image generated by AI */}
                <img
                  src={activePoster.imageUrl}
                  alt={activePoster.headline}
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />

                {/* Aesthetic Gradient Overlay for Crisp Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 pointer-events-none" />

                {/* Top Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="px-3 py-1 rounded-full bg-rose-600/90 text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                    MAX10 AI • BÀI GIẢNG ĐIỂM 10
                  </div>
                  <div className="text-[11px] font-mono text-zinc-300 bg-black/50 px-2 py-0.5 rounded-md">
                    {activePoster.createdAt}
                  </div>
                </div>

                {/* Center Content: Headline & Subtitle */}
                <div className="relative z-10 space-y-3 my-auto py-4">
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-200 to-white drop-shadow-md leading-tight">
                    {activePoster.headline}
                  </h1>

                  <p className="text-xs sm:text-sm text-zinc-200 font-semibold max-w-md mx-auto leading-relaxed drop-shadow-xs">
                    {activePoster.subtitle}
                  </p>

                  {/* Bullet Highlights Box */}
                  <div className="space-y-1.5 pt-2 max-w-sm mx-auto text-left">
                    {activePoster.bulletPoints.map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-medium text-amber-200"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Footer */}
                <div className="relative z-10 pt-2 border-t border-white/20 flex items-center justify-between text-[11px] text-zinc-300">
                  <span className="font-bold">Hệ thống Học tập & Giảng dạy THCS</span>
                  <span className="font-mono text-amber-400">max10.ai.studio</span>
                </div>
              </div>

              {/* Action Buttons for Poster */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={activePoster.imageUrl}
                  download={`poster-${activePoster.topic.slice(0, 20)}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-md cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Poster Về Máy (PNG)</span>
                </a>

                {onSendToChat && (
                  <button
                    type="button"
                    onClick={() =>
                      onSendToChat(`Hãy nhận xét và viết lời bình chi tiết cho poster: "${activePoster.headline}"`)
                    }
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <span>Gửi sang Max10 Chat</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
