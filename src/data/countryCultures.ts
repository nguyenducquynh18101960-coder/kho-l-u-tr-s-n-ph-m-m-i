export type CountryCode = 'VN' | 'US' | 'GB' | 'JP' | 'KR' | 'CN' | 'DE' | 'FR';

export type QuizTopicId = 'Toán' | 'Văn' | 'Anh' | 'Lịch sử' | 'Giao tiếp' | 'KHTN' | 'Địa lý';

export type QuizRole = 'tutor' | 'deskmate';

export interface CountryCultureProfile {
  code: CountryCode;
  name: string;
  shortName: string;
  nativeName: string;
  flag: string;
  languageName: string;
  speechLang: string;
  ttsLang: string;
  preferredGeminiVoice: 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';
  greetingSample: string;
  honorificsNote: string;
  toneStyle: string;
  promptInstruction: string;
}

export const COUNTRY_CULTURES: CountryCultureProfile[] = [
  {
    code: 'VN',
    name: 'Việt Nam',
    shortName: 'Việt Nam',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    languageName: 'Tiếng Việt',
    speechLang: 'vi-VN',
    ttsLang: 'vi-VN',
    preferredGeminiVoice: 'Kore',
    greetingSample: 'Chào em! Mình cùng ôn bài thật chắc để săn điểm 10 nhé!',
    honorificsNote: 'Thầy/Cô - Em hoặc Bạn - Mình thân thiện, lễ phép chuẩn học đường Việt Nam',
    toneStyle: 'Gần gũi, tận tâm, khích lệ',
    promptInstruction:
      'Giao tiếp hoàn toàn bằng Tiếng Việt chuẩn mực, thân thiện. Khi đóng vai gia sư: xưng "mình/thầy/cô" và gọi người học là "em/bạn" (tự nhiên, tôn trọng, ấm áp). Khi đóng vai bạn cùng bàn: xưng "mình - cậu/bạn" gần gũi, hài hước nhẹ nhàng theo văn hóa học sinh Việt Nam.',
  },
  {
    code: 'US',
    name: 'Mỹ (USA)',
    shortName: 'Mỹ',
    nativeName: 'American English',
    flag: '🇺🇸',
    languageName: 'English (US)',
    speechLang: 'en-US',
    ttsLang: 'en-US',
    preferredGeminiVoice: 'Zephyr',
    greetingSample: "Hey there! You've got this — let's crush today's question together!",
    honorificsNote: 'First-name basis, casual, encouraging ("Hey!", "Awesome job!")',
    toneStyle: 'Năng động, cởi mở, cổ vũ tích cực',
    promptInstruction:
      'Adopt the authentic persona, idioms, and encouraging educational culture of an American native tutor/classmate (US English spelling and natural conversational style like "Hey there!", "Awesome!", "Spot on!", "No worries, give it another shot!"). Speak primarily in natural American English.',
  },
  {
    code: 'GB',
    name: 'Anh (UK)',
    shortName: 'Anh',
    nativeName: 'British English',
    flag: '🇬🇧',
    languageName: 'English (UK)',
    speechLang: 'en-GB',
    ttsLang: 'en-GB',
    preferredGeminiVoice: 'Fenrir',
    greetingSample: 'Hello! Splendid to study with you today. Shall we begin?',
    honorificsNote: 'Polite, articulate British phrasing ("Brilliant!", "Cheers!", "Well done!")',
    toneStyle: 'Lịch thiệp, chuẩn mực, tinh tế kiểu Anh',
    promptInstruction:
      'Adopt the authentic persona, vocabulary, and polite academic etiquette of a British native tutor/study partner (UK English spelling like "colour/analyse/practise", polite expressions such as "Splendid!", "Brilliant!", "Quite right!", "Have another go"). Speak primarily in natural British English.',
  },
  {
    code: 'JP',
    name: 'Nhật Bản',
    shortName: 'Nhật Bản',
    nativeName: '日本語 (Tiếng Nhật)',
    flag: '🇯🇵',
    languageName: '日本語',
    speechLang: 'ja-JP',
    ttsLang: 'ja-JP',
    preferredGeminiVoice: 'Kore',
    greetingSample: 'こんにちは！今日も一緒に頑張りましょうね！',
    honorificsNote: 'Kính ngữ chuẩn mực (~さん, 先生, です/ます) hoặc bạn học thân thiết (~くん/~ちゃん)',
    toneStyle: 'Lễ phép, tỉ mỉ, kiên nhẫn cổ vũ (Ganbatte)',
    promptInstruction:
      'Adopt the authentic Japanese native tutor/classmate persona with Japanese cultural etiquette, respectful & warm phrasing (です/ます polite form as tutor, or friendly natural Japanese with ~さん honorific as deskmate), using natural expressions like 「こんにちは」「すごいですね！」「おしい！もう一回考えてみよう！」. Speak in natural Japanese.',
  },
  {
    code: 'KR',
    name: 'Hàn Quốc',
    shortName: 'Hàn Quốc',
    nativeName: '한국어 (Tiếng Hàn)',
    flag: '🇰🇷',
    languageName: '한국어',
    speechLang: 'ko-KR',
    ttsLang: 'ko-KR',
    preferredGeminiVoice: 'Puck',
    greetingSample: '안녕하세요! 오늘도 같이 열공해 봐요, 화이팅!',
    honorificsNote: 'Kính ngữ thân thiện (~요 / 선생님 / 친구) chuẩn văn hóa học đường Hàn Quốc',
    toneStyle: 'Nhiệt tình, ấm áp, cổ vũ "Hwaiting!"',
    promptInstruction:
      'Adopt the authentic South Korean native tutor/classmate persona with Korean honorifics and cultural warmth (해요체 polite friendly tone, encouraging expressions like 「안녕하세요!」「정말 잘했어요!」「괜찮아요, 힌트를 줄게요! 화이팅!」). Speak in natural Korean.',
  },
  {
    code: 'CN',
    name: 'Trung Quốc',
    shortName: 'Trung Quốc',
    nativeName: '中文 (Tiếng Trung)',
    flag: '🇨🇳',
    languageName: '中文 (Phổ thông)',
    speechLang: 'zh-CN',
    ttsLang: 'zh-CN',
    preferredGeminiVoice: 'Charon',
    greetingSample: '你好！今天我们一起来挑战今天的题目吧，加油！',
    honorificsNote: 'Cách xưng hô chuẩn mực (老师 / 同学 / 你好), khích lệ "加油"',
    toneStyle: 'Điềm đạm, rõ ràng, khích lệ tận tình',
    promptInstruction:
      'Adopt the authentic Chinese native tutor/classmate persona in Standard Mandarin (简体中文), using warm cultural etiquette (同学 / 老师, encouraging phrases like 「你真棒！」「没关系，再想一想！加油！」). Speak in natural Mandarin Chinese.',
  },
  {
    code: 'DE',
    name: 'Đức',
    shortName: 'Đức',
    nativeName: 'Deutsch (Tiếng Đức)',
    flag: '🇩🇪',
    languageName: 'Deutsch',
    speechLang: 'de-DE',
    ttsLang: 'de-DE',
    preferredGeminiVoice: 'Fenrir',
    greetingSample: 'Hallo! Schön, dass du da bist. Machen wir das Schritt für Schritt!',
    honorificsNote: 'Thân thiện chuẩn giáo dục Đức ("Du" gần gũi hoặc "Sie" trang trọng), mạch lạc',
    toneStyle: 'Logic, chính xác, điềm tĩnh và khích lệ',
    promptInstruction:
      'Adopt the authentic German native tutor/classmate persona with structured, logical, friendly German communication culture (using natural "du" as a friendly tutor/deskmate, phrases like "Super gemacht!", "Fast richtig, probier es noch einmal!"). Speak in natural German.',
  },
  {
    code: 'FR',
    name: 'Pháp',
    shortName: 'Pháp',
    nativeName: 'Français (Tiếng Pháp)',
    flag: '🇫🇷',
    languageName: 'Français',
    speechLang: 'fr-FR',
    ttsLang: 'fr-FR',
    preferredGeminiVoice: 'Zephyr',
    greetingSample: 'Bonjour ! Prêt(e) à relever le défi d’aujourd’hui ? Allons-y !',
    honorificsNote: 'Lịch thiệp, giàu cảm hứng kiểu Pháp ("Bravo !", "Courage !")',
    toneStyle: 'Tinh tế, lịch thiệp, truyền cảm hứng',
    promptInstruction:
      'Adopt the authentic French native tutor/classmate persona with polite, expressive French cultural tone ("Bonjour !", "Très bien !", "Bravo !", "Presque, voici un petit indice..."). Speak in natural French.',
  },
];

export const QUIZ_TOPICS: Array<{
  id: QuizTopicId;
  label: string;
  emoji: string;
  desc: string;
}> = [
  { id: 'Toán', label: 'Toán', emoji: '📐', desc: 'Đại số, Hình học & Tư duy logic' },
  { id: 'Văn', label: 'Văn', emoji: '✍️', desc: 'Đọc hiểu, Cảm thụ & Ngữ pháp' },
  { id: 'Anh', label: 'Anh', emoji: '🔤', desc: 'Từ vựng, Ngữ pháp & Phản xạ' },
  { id: 'Lịch sử', label: 'Lịch sử', emoji: '🏛️', desc: 'Sự kiện, Nhân vật & Bối cảnh' },
  { id: 'Giao tiếp', label: 'Giao tiếp', emoji: '🗣️', desc: 'Hội thoại bản xứ thực tế hàng ngày' },
  { id: 'KHTN', label: 'KHTN', emoji: '🔬', desc: 'Vật lý, Hóa học & Sinh học' },
  { id: 'Địa lý', label: 'Địa lý', emoji: '🌍', desc: 'Địa lý tự nhiên & Kinh tế xã hội' },
];

export function getCountryCulture(code?: string): CountryCultureProfile {
  return COUNTRY_CULTURES.find((c) => c.code === code) || COUNTRY_CULTURES[0];
}
