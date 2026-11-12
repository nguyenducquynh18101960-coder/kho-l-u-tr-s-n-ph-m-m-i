export type GeminiVoiceName = 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';

export interface AIVoicePersona {
  id: string;
  name: string;
  title: string;
  geminiVoice: GeminiVoiceName;
  gender: 'female' | 'male';
  avatar: string;
  accent: string;
  description: string;
  sampleText: string;
  badgeColor: string;
}

export const AI_VOICE_PERSONAS: AIVoicePersona[] = [
  {
    id: 'kore',
    name: 'Cô giáo Thu Thủy',
    title: 'Giáo viên phụ trách - Dịu dàng & Tận tâm',
    geminiVoice: 'Kore',
    gender: 'female',
    avatar: '🌸',
    accent: 'Giọng Nữ chuẩn Hà Nội',
    description: 'Giọng đọc truyền cảm, phát âm tròn vành rõ chữ, chậm rãi dễ hiểu giúp học sinh tiếp thu bài nhanh.',
    sampleText: 'Chào em! Cô là Thu Thủy, sẵn sàng cùng em chinh phục điểm 10 mọi bài kiểm tra hôm nay.',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400',
  },
  {
    id: 'puck',
    name: 'Bạn học cùng bàn',
    title: 'Gia sư bạn học - Năng động & Dễ hiểu',
    geminiVoice: 'Puck',
    gender: 'male',
    avatar: '⚡',
    accent: 'Giọng Nam học sinh năng động',
    description: 'Giọng nam tươi vui, thân thiện như bạn cùng bàn cùng thảo luận và mách mẹo giải bài tập hay.',
    sampleText: 'Chào bạn nhé! Cùng mình thảo luận và giải bài này săn điểm 10 tuyệt đối nào!',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
  },
  {
    id: 'fenrir',
    name: 'Thầy giáo Minh Trí',
    title: 'Thủ khoa Toán & KHTN - Chuẩn mực, Đĩnh đạc',
    geminiVoice: 'Fenrir',
    gender: 'male',
    avatar: '👨‍🏫',
    accent: 'Giọng Nam trầm ấm, mạch lạc',
    description: 'Phong thái sư phạm vững vàng, nhấn mạnh các bước biến đổi công thức và cảnh báo bẫy trừ điểm.',
    sampleText: 'Thầy chào các em. Chúng ta cùng phân tích từng bước giải thật cẩn thận để không mất 0.25 điểm nào.',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400',
  },
  {
    id: 'zephyr',
    name: 'Gia sư Nhiệt Huyết',
    title: 'Cố vấn Phương pháp - Hào hứng, Truyền cảm hứng',
    geminiVoice: 'Zephyr',
    gender: 'female',
    avatar: '🌟',
    accent: 'Giọng Nữ rạng rỡ, tràn đầy năng lượng',
    description: 'Khích lệ tinh thần học sinh, tạo động lực tự học và biến những bài tập khó thành niềm vui.',
    sampleText: 'Tuyệt vời lắm! Bí kíp săn điểm 10 đã sẵn sàng, chúng ta bắt đầu ngay thôi em nhé!',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400',
  },
  {
    id: 'charon',
    name: 'Thầy giáo Văn Sử',
    title: 'Chuyên gia Xã hội - Trầm lắng, Giàu cảm xúc',
    geminiVoice: 'Charon',
    gender: 'male',
    avatar: '📖',
    accent: 'Giọng Nam sâu sắc, truyền cảm',
    description: 'Rất thích hợp khi đọc bài văn mẫu, phân tích tác phẩm văn học hoặc tóm tắt dòng sự kiện lịch sử.',
    sampleText: 'Mỗi trang sách là một chân trời tri thức. Hãy cùng thầy lắng đọng cảm xúc trong bài viết này.',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400',
  },
];

export interface AIVoiceSettings {
  personaId: string;
  speed: number; // 0.8, 1.0, 1.25
  autoReadResponse: boolean; // Auto-speak when AI responds
  preferGeminiTTS: boolean; // Prefer Gemini TTS over browser WebSpeech
  readingScope: 'full' | 'summary_only'; // Read full text or focus summary
}

export const DEFAULT_VOICE_SETTINGS: AIVoiceSettings = {
  personaId: 'kore',
  speed: 1.0,
  autoReadResponse: false,
  preferGeminiTTS: true,
  readingScope: 'full',
};

export const STORAGE_KEY_VOICE_SETTINGS = 'max10_ai_voice_settings_v3';
