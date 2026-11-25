import { CountryCode, QuizTopicId, COUNTRY_CULTURES, getCountryCulture } from './countryCultures';

export type StudyPresenceStatus = 'Online' | 'Đang ôn bài' | 'Cần giúp đỡ';
export type StudyLanguageMode = 'vi' | 'native' | 'bilingual';

export interface CurriculumStandard {
  countryCode: CountryCode;
  countryName: string;
  flag: string;
  standardName: string;
  gradeSystem: string;
  unitSystem: string;
  examCulture: string;
  calibrationPrompt: string;
}

export interface VirtualStudyBuddy {
  id: string;
  name: string;
  tag: string; // e.g. "2048" -> displayed as #2048
  countryCode: CountryCode;
  countryName: string;
  flag: string;
  nativeLanguage: string;
  nativeGreeting: string;
  viTranslation: string;
  grade: string;
  strongSubject: QuizTopicId;
  status: StudyPresenceStatus;
  personality: string;
  badges: string[];
  avatarEmoji: string;
}

export interface GlobalStudyProfile {
  displayName: string;
  tag: string;
  countryCode: CountryCode;
  countryName: string;
  flag: string;
  languageMode: StudyLanguageMode;
  activeLanguageLabel: string;
  gradeLabel: string;
  subjectLabel: string;
  status: StudyPresenceStatus;
  badges: string[];
  friendIds: string[];
}

export interface SlashCommandSpec {
  command: string;
  syntax: string;
  description: string;
  example: string;
  badge: string;
}

export type DiscordStudyEmbedData =
  | {
      kind: 'welcome_activation';
      profile: GlobalStudyProfile;
      suggestedCommands: string[];
    }
  | {
      kind: 'profile';
      profile: GlobalStudyProfile;
      isSelf: boolean;
      buddy?: VirtualStudyBuddy;
      isFriend?: boolean;
    }
  | {
      kind: 'buddy_search';
      queryLabel: string;
      buddies: VirtualStudyBuddy[];
      friendIds: string[];
    }
  | {
      kind: 'friends_list';
      friends: VirtualStudyBuddy[];
    }
  | {
      kind: 'buddy_added';
      buddy: VirtualStudyBuddy;
      alreadyFriend: boolean;
      totalFriends: number;
    }
  | {
      kind: 'language_updated';
      countryCode: CountryCode;
      countryName: string;
      flag: string;
      languageMode: StudyLanguageMode;
      languageLabel: string;
    }
  | {
      kind: 'curriculum_prompt';
      title: string;
      subtitle: string;
      currentCountryCode: CountryCode;
      currentGrade: string;
      currentSubject: QuizTopicId;
      currentLanguageMode: StudyLanguageMode;
    }
  | {
      kind: 'help';
      commands: SlashCommandSpec[];
    };

export const STORAGE_KEY_GLOBAL_STUDY_PROFILE = 'max10_global_study_profile_v1';

export const CURRICULUM_STANDARDS: Record<CountryCode, CurriculumStandard> = {
  VN: {
    countryCode: 'VN',
    countryName: 'Việt Nam',
    flag: '🇻🇳',
    standardName: 'Chương trình GDPT 2018 (Bộ GD&ĐT)',
    gradeSystem: 'Tiểu học (Lớp 1–5), THCS (Lớp 6–9), THPT (Lớp 10–12)',
    unitSystem: 'Hệ đo lường SI / Mét (cm, m, km, kg, °C, lít)',
    examCulture: 'Trình bày tự luận từng bước chặt chẽ + trắc nghiệm nhận biết/vận dụng cao',
    calibrationPrompt:
      'Bám sát Chương trình GDPT 2018 Việt Nam, sử dụng hệ đo lường mét/SI (cm, m, kg, °C) và cách ký hiệu Toán/Lý/Hóa chuẩn SGK Việt Nam.',
  },
  US: {
    countryCode: 'US',
    countryName: 'Mỹ (USA)',
    flag: '🇺🇸',
    standardName: 'US Common Core, NGSS & SAT/AP Standards',
    gradeSystem: 'Elementary (Grades 1–5), Middle School (Grades 6–8), High School (Grades 9–12 / AP)',
    unitSystem: 'US Customary / Imperial (inches, feet, miles, pounds, °F) & SI in Science',
    examCulture: 'Conceptual reasoning, word problems, SAT/AP multiple-choice & free-response',
    calibrationPrompt:
      'Calibrate 100% to US Common Core / NGSS / SAT-AP curriculum standards. Use US Imperial/Customary units (feet, inches, miles, pounds, °F) for everyday math/word problems and SI units for lab science, plus American academic terminology (e.g., Grade 8/9, slope-intercept form, PEMDAS).',
  },
  GB: {
    countryCode: 'GB',
    countryName: 'Anh (UK)',
    flag: '🇬🇧',
    standardName: 'UK National Curriculum, GCSE & A-Level',
    gradeSystem: 'Key Stage 2 (Years 3–6), Key Stage 3 (Years 7–9), GCSE (Years 10–11), A-Level (Years 12–13)',
    unitSystem: 'Metric primary (cm, m, kg, °C) with UK everyday contexts (miles, £)',
    examCulture: 'Structured mark-scheme reasoning, GCSE Higher/Foundation style',
    calibrationPrompt:
      'Calibrate 100% to the UK National Curriculum / GCSE / A-Level mark scheme style, British English terminology ("maths", "practise", "trapezium", "Year 9/10"), and metric/UK standard units.',
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Nhật Bản',
    flag: '🇯🇵',
    standardName: 'Chương trình MEXT Nhật Bản (6-3-3)',
    gradeSystem: 'Shōgakkō (Tiểu học 1–6), Chūgakkō (THCS 1–3), Kōtōgakkō (THPT 1–3)',
    unitSystem: 'Hệ Mét chuẩn SI (cm, m, km, g, kg, °C)',
    examCulture: 'Tỉ mỉ từng bước suy luận, chú trọng hình học & bài toán lập phương trình chuẩn MEXT',
    calibrationPrompt:
      'Calibrate 100% to the Japanese MEXT curriculum (中学校/高等学校), using metric SI units (cm, m, kg, °C), structured logical step-by-step problem solving, and authentic Japanese educational terminology.',
  },
  KR: {
    countryCode: 'KR',
    countryName: 'Hàn Quốc',
    flag: '🇰🇷',
    standardName: 'Chương trình 2022 & Chuẩn CSAT (Suneung)',
    gradeSystem: 'Chodeung (1–6), Jung-hakgyo (THCS 1–3), Godeung-hakgyo (THPT 1–3)',
    unitSystem: 'Hệ Mét chuẩn SI (cm, m, kg, °C)',
    examCulture: 'Tư duy suy luận nhiều bước, bài toán hàm số & đọc hiểu chuẩn Hàn Quốc',
    calibrationPrompt:
      'Calibrate 100% to the South Korean National Curriculum (중학교/고등학교) and CSAT (수능) analytical style, using metric SI units and Korean academic phrasing.',
  },
  CN: {
    countryCode: 'CN',
    countryName: 'Trung Quốc',
    flag: '🇨🇳',
    standardName: 'Chương trình Giáo dục Phổ thông & Zhongkao / Gaokao',
    gradeSystem: 'Tiểu học (1–6), Chuzhong / THCS (7–9), Gaozhong / THPT (10–12)',
    unitSystem: 'Hệ Mét chuẩn SI (cm, m, kg, °C)',
    examCulture: 'Rèn kỹ năng tính toán chặt chẽ, biến đổi đại số & hình học cổ điển chuẩn mực',
    calibrationPrompt:
      'Calibrate 100% to the Chinese National Curriculum (初中/高中) & Zhongkao/Gaokao rigor, using metric SI units and clean step-by-step algebraic/geometric proofs.',
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Đức',
    flag: '🇩🇪',
    standardName: 'KMK Bildungsstandards / Gymnasium & Abitur',
    gradeSystem: 'Grundschule (Klasse 1–4), Sekundarstufe I (Klasse 5–10), Sekundarstufe II / Abitur (Klasse 11–12/13)',
    unitSystem: 'Hệ Mét chuẩn SI (cm, m, kg, °C)',
    examCulture: 'Chặt chẽ, định nghĩa rõ ràng, chứng minh logic chuẩn Gymnasium Đức',
    calibrationPrompt:
      'Calibrate 100% to German KMK / Gymnasium / Abitur academic standards, using SI metric units, European decimal notation awareness, and rigorous logical step definitions.',
  },
  FR: {
    countryCode: 'FR',
    countryName: 'Pháp',
    flag: '🇫🇷',
    standardName: 'Programme National / Collège (Brevet) & Lycée (Baccalauréat)',
    gradeSystem: 'École (CP–CM2), Collège (6e–3e), Lycée (Seconde, Première, Terminale)',
    unitSystem: 'Hệ Mét chuẩn SI (cm, m, kg, °C)',
    examCulture: 'Lập luận diễn dịch chuẩn mực ("On sait que... Or... Donc..."), giàu tính học thuật Pháp',
    calibrationPrompt:
      'Calibrate 100% to the French Éducation Nationale curriculum (Collège Brevet / Lycée Bac), using SI metric units and classic French deductive explanation style.',
  },
};

export const VIRTUAL_STUDY_BUDDIES: VirtualStudyBuddy[] = [
  // Việt Nam
  {
    id: 'buddy-vn-1',
    name: 'Minh Anh',
    tag: '1010',
    countryCode: 'VN',
    countryName: 'Việt Nam',
    flag: '🇻🇳',
    nativeLanguage: 'Tiếng Việt',
    nativeGreeting: 'Chào cậu! Hôm nay tụi mình cùng luyện đề Toán 9 săn điểm 10 nha!',
    viTranslation: 'Bạn học chuẩn chương trình GDPT 2018 Việt Nam, rất thích giải nhanh và kiểm tra bẫy.',
    grade: 'Lớp 9 (THCS)',
    strongSubject: 'Toán',
    status: 'Đang ôn bài',
    personality: 'Chăm chỉ, thân thiện, chuyên trị bài hình học phẳng & giải phương trình.',
    badges: ['Thủ khoa Toán', 'Streak 15 ngày', 'Biệt đội Điểm 10'],
    avatarEmoji: '🦊',
  },
  {
    id: 'buddy-vn-2',
    name: 'Gia Bảo',
    tag: '8604',
    countryCode: 'VN',
    countryName: 'Việt Nam',
    flag: '🇻🇳',
    nativeLanguage: 'Tiếng Việt',
    nativeGreeting: 'Ê bạn ơi, có câu KHTN Lý–Hóa nào hóc búa gửi mình cùng giải cho vui!',
    viTranslation: 'Bạn học năng động, thích thí nghiệm Lý–Hóa và mẹo nhớ công thức nhanh.',
    grade: 'Lớp 9 (THCS)',
    strongSubject: 'KHTN',
    status: 'Online',
    personality: 'Hài hước, nhiệt tình, giải thích hiện tượng tự nhiên cực dễ hiểu.',
    badges: ['Nhà khoa học nhí', 'Gia sư bạn học'],
    avatarEmoji: '🧪',
  },
  {
    id: 'buddy-vn-3',
    name: 'Thảo Vy',
    tag: '3912',
    countryCode: 'VN',
    countryName: 'Việt Nam',
    flag: '🇻🇳',
    nativeLanguage: 'Tiếng Việt',
    nativeGreeting: 'Xin chào! Cùng mình trau dồi Ngữ văn và Lịch sử thật nhẹ nhàng nhé!',
    viTranslation: 'Giỏi phân tích tác phẩm văn học, lập dàn ý mạch lạc và ghi nhớ mốc lịch sử.',
    grade: 'Lớp 10 (THPT)',
    strongSubject: 'Văn',
    status: 'Cần giúp đỡ',
    personality: 'Nhẹ nhàng, sâu sắc, rất thích trao đổi dàn ý viết văn nghị luận.',
    badges: ['Cây bút Vàng', 'Yêu Văn Học'],
    avatarEmoji: '🪷',
  },

  // Hàn Quốc
  {
    id: 'buddy-kr-1',
    name: 'Min-ji',
    tag: '2048',
    countryCode: 'KR',
    countryName: 'Hàn Quốc',
    flag: '🇰🇷',
    nativeLanguage: '한국어 (Tiếng Hàn)',
    nativeGreeting: '안녕하세요! 오늘도 같이 수학이랑 한국어 공부해요, 화이팅!',
    viTranslation: 'Xin chào! Hôm nay mình cùng học Toán và tiếng Hàn nhé, cố lên!',
    grade: 'Jung-hakgyo 3 (Tương đương Lớp 9)',
    strongSubject: 'Toán',
    status: 'Đang ôn bài',
    personality: 'Ấm áp, quyết tâm, thích lập study planner và động viên bạn học.',
    badges: ['Seoul Math Ace', 'CSAT Starter', 'Bilingual Buddy'],
    avatarEmoji: '🌸',
  },
  {
    id: 'buddy-kr-2',
    name: 'Joon-ho',
    tag: '5190',
    countryCode: 'KR',
    countryName: 'Hàn Quốc',
    flag: '🇰🇷',
    nativeLanguage: '한국어 (Tiếng Hàn)',
    nativeGreeting: '반가워요! 일상 한국어 회화나 영어 같이 연습해 볼래요?',
    viTranslation: 'Rất vui được gặp bạn! Cậu muốn cùng mình luyện giao tiếp tiếng Hàn hoặc tiếng Anh không?',
    grade: 'Godeung 1 (Tương đương Lớp 10)',
    strongSubject: 'Giao tiếp',
    status: 'Online',
    personality: 'Cởi mở, mê K-Pop & văn hóa Busan, thích trò chuyện giao tiếp hàng ngày.',
    badges: ['Seoul Talker', 'Helpful Friend'],
    avatarEmoji: '🎧',
  },
  {
    id: 'buddy-kr-3',
    name: 'Seo-yeon',
    tag: '7741',
    countryCode: 'KR',
    countryName: 'Hàn Quốc',
    flag: '🇰🇷',
    nativeLanguage: '한국어 (Tiếng Hàn)',
    nativeGreeting: '안녕! 과학 문제 풀다가 막히면 언제든 물어봐요!',
    viTranslation: 'Chào cậu! Nếu làm bài Khoa học bị bí chỗ nào thì cứ hỏi mình bất cứ lúc nào nhé!',
    grade: 'Jung-hakgyo 2 (Tương đương Lớp 8)',
    strongSubject: 'KHTN',
    status: 'Online',
    personality: 'Tỉ mỉ, thích công nghệ & hóa học, ghi chú cực đẹp.',
    badges: ['Science Star', 'KAIST Dreamer'],
    avatarEmoji: '🔭',
  },

  // Mỹ
  {
    id: 'buddy-us-1',
    name: 'Chloe',
    tag: '4419',
    countryCode: 'US',
    countryName: 'Mỹ (USA)',
    flag: '🇺🇸',
    nativeLanguage: 'English (US)',
    nativeGreeting: "Hey there! Ready to tackle some American English or Algebra together? Let's go!",
    viTranslation: 'Chào bạn! Sẵn sàng cùng mình chinh phục tiếng Anh Mỹ hoặc Đại số chưa? Bắt đầu thôi!',
    grade: 'Grade 9 (High School Freshman)',
    strongSubject: 'Anh',
    status: 'Online',
    personality: 'Năng động, lạc quan, dùng nhiều thành ngữ Mỹ tự nhiên.',
    badges: ['US Debate Club', 'Honor Roll', 'Native Speaker'],
    avatarEmoji: '🦅',
  },
  {
    id: 'buddy-us-2',
    name: 'Ethan',
    tag: '6302',
    countryCode: 'US',
    countryName: 'Mỹ (USA)',
    flag: '🇺🇸',
    nativeLanguage: 'English (US)',
    nativeGreeting: "Yo! Need help with feet, miles, or Common Core math word problems? I've got you!",
    viTranslation: 'Chào! Cần giúp đổi đơn vị feet, dặm hay giải toán đố chuẩn Common Core Mỹ không? Có mình đây!',
    grade: 'Grade 8 (Middle School)',
    strongSubject: 'Toán',
    status: 'Đang ôn bài',
    personality: 'Thực tế, thích bóng rổ và lập trình STEM.',
    badges: ['STEM Captain', 'SAT Prep'],
    avatarEmoji: '🏀',
  },
  {
    id: 'buddy-us-3',
    name: 'Maya',
    tag: '9125',
    countryCode: 'US',
    countryName: 'Mỹ (USA)',
    flag: '🇺🇸',
    nativeLanguage: 'English (US)',
    nativeGreeting: "Hi friend! Let's practice everyday English speaking or US History together!",
    viTranslation: 'Chào bạn! Cùng luyện nói tiếng Anh giao tiếp hàng ngày hoặc tìm hiểu Lịch sử Mỹ nhé!',
    grade: 'Grade 10 (Sophomore)',
    strongSubject: 'Lịch sử',
    status: 'Cần giúp đỡ',
    personality: 'Tò mò, thích đọc sách và trao đổi văn hóa đa quốc gia.',
    badges: ['History Buff', 'Exchange Buddy'],
    avatarEmoji: '🗽',
  },

  // Anh
  {
    id: 'buddy-gb-1',
    name: 'Oliver',
    tag: '1905',
    countryCode: 'GB',
    countryName: 'Anh (UK)',
    flag: '🇬🇧',
    nativeLanguage: 'English (UK)',
    nativeGreeting: 'Hello there! Fancy a spot of British English practice or GCSE Maths today?',
    viTranslation: 'Xin chào! Hôm nay bạn có muốn luyện chút tiếng Anh chuẩn Anh hoặc Toán GCSE cùng mình không?',
    grade: 'Year 10 (GCSE)',
    strongSubject: 'Anh',
    status: 'Online',
    personality: 'Lịch thiệp, chuẩn mực, giải thích rất rõ sự khác biệt Anh–Anh và Anh–Mỹ.',
    badges: ['Oxford Aspirant', 'UK Grammar Pro'],
    avatarEmoji: '🎩',
  },
  {
    id: 'buddy-gb-2',
    name: 'Amelia',
    tag: '3821',
    countryCode: 'GB',
    countryName: 'Anh (UK)',
    flag: '🇬🇧',
    nativeLanguage: 'English (UK)',
    nativeGreeting: 'Lovely to meet you! Shall we explore world history or literature together?',
    viTranslation: 'Rất vui được gặp bạn! Tụi mình cùng khám phá lịch sử thế giới hoặc văn học nhé?',
    grade: 'Year 9 (KS3)',
    strongSubject: 'Lịch sử',
    status: 'Đang ôn bài',
    personality: 'Tinh tế, thích uống trà chiều và kể chuyện lịch sử hấp dẫn.',
    badges: ['Crown Scholar', 'Essay Writer'],
    avatarEmoji: '👑',
  },
  {
    id: 'buddy-gb-3',
    name: 'Harry',
    tag: '7410',
    countryCode: 'GB',
    countryName: 'Anh (UK)',
    flag: '🇬🇧',
    nativeLanguage: 'English (UK)',
    nativeGreeting: 'Cheers! Let us work through some clever GCSE science puzzles step by step.',
    viTranslation: 'Chào nhé! Cùng mình giải từng bước các câu đố khoa học GCSE thú vị nào.',
    grade: 'Year 11 (GCSE)',
    strongSubject: 'KHTN',
    status: 'Online',
    personality: 'Điềm đạm, thích vật lý thiên văn và bóng đá Anh.',
    badges: ['Physics Club', 'Top Mark Scheme'],
    avatarEmoji: '🍵',
  },

  // Nhật Bản
  {
    id: 'buddy-jp-1',
    name: 'Haruto',
    tag: '8812',
    countryCode: 'JP',
    countryName: 'Nhật Bản',
    flag: '🇯🇵',
    nativeLanguage: '日本語 (Tiếng Nhật)',
    nativeGreeting: 'こんにちは！日本の数学や日本語を一緒に楽しく勉強しましょう！',
    viTranslation: 'Xin chào! Hãy cùng nhau học Toán Nhật Bản và tiếng Nhật thật vui nhé!',
    grade: 'Chūgakkō 3 (Tương đương Lớp 9)',
    strongSubject: 'Toán',
    status: 'Đang ôn bài',
    personality: 'Kiên nhẫn, lễ phép, giải hình học MEXT cực kỳ cẩn thận.',
    badges: ['Tokyo Math Ace', 'Ganbatte Spirit'],
    avatarEmoji: '⛩️',
  },
  {
    id: 'buddy-jp-2',
    name: 'Sakura',
    tag: '2209',
    countryCode: 'JP',
    countryName: 'Nhật Bản',
    flag: '🇯🇵',
    nativeLanguage: '日本語 (Tiếng Nhật)',
    nativeGreeting: 'はじめまして！日常の日本語会話、いつでも練習しようね！',
    viTranslation: 'Rất hân hạnh được làm quen! Mình có thể luyện giao tiếp tiếng Nhật hàng ngày cùng bạn bất cứ lúc nào!',
    grade: 'Kōtōgakkō 1 (Tương đương Lớp 10)',
    strongSubject: 'Giao tiếp',
    status: 'Online',
    personality: 'Dễ thương, thích anime, ẩm thực Nhật và dạy phát âm chuẩn Tokyo.',
    badges: ['Kyoto Guide', 'Anime Culture'],
    avatarEmoji: '🍡',
  },
  {
    id: 'buddy-jp-3',
    name: 'Ren',
    tag: '6054',
    countryCode: 'JP',
    countryName: 'Nhật Bản',
    flag: '🇯🇵',
    nativeLanguage: '日本語 (Tiếng Nhật)',
    nativeGreeting: 'やあ！理科や地理の面白いクイズを出してみようか？',
    viTranslation: 'Chào bạn! Để mình đố bạn vài câu Khoa học hoặc Địa lý siêu thú vị nhé?',
    grade: 'Chūgakkō 2 (Tương đương Lớp 8)',
    strongSubject: 'Địa lý',
    status: 'Cần giúp đỡ',
    personality: 'Thích bản đồ, núi Phú Sĩ và các hiện tượng tự nhiên.',
    badges: ['Geography Explorer', 'Eco Club'],
    avatarEmoji: '🗻',
  },

  // Trung Quốc
  {
    id: 'buddy-cn-1',
    name: 'Wei-chen',
    tag: '7731',
    countryCode: 'CN',
    countryName: 'Trung Quốc',
    flag: '🇨🇳',
    nativeLanguage: '中文 (Tiếng Trung)',
    nativeGreeting: '你好！我们一起来挑战几道超有趣的数学题吧，加油！',
    viTranslation: 'Xin chào! Tụi mình cùng thử sức vài bài Toán cực thú vị nhé, cố lên!',
    grade: 'Chuzhong 3 (Tương đương Lớp 9)',
    strongSubject: 'Toán',
    status: 'Đang ôn bài',
    personality: 'Thông minh, thích biến đổi đại số và mẹo tính nhẩm nhanh.',
    badges: ['Olympiad Starter', 'Fast Solver'],
    avatarEmoji: '🐼',
  },
  {
    id: 'buddy-cn-2',
    name: 'Lin-xi',
    tag: '4188',
    countryCode: 'CN',
    countryName: 'Trung Quốc',
    flag: '🇨🇳',
    nativeLanguage: '中文 (Tiếng Trung)',
    nativeGreeting: '嗨！想学日常中文对话或者历史故事吗？我来帮你！',
    viTranslation: 'Hi! Bạn muốn học hội thoại tiếng Trung hàng ngày hay chuyện lịch sử không? Mình giúp bạn nhé!',
    grade: 'Gaozhong 1 (Tương đương Lớp 10)',
    strongSubject: 'Giao tiếp',
    status: 'Online',
    personality: 'Vui vẻ, thích thư pháp và giao lưu văn hóa Á Đông.',
    badges: ['Mandarin Coach', 'Culture Star'],
    avatarEmoji: '🏮',
  },
  {
    id: 'buddy-cn-3',
    name: 'Zi-hao',
    tag: '9503',
    countryCode: 'CN',
    countryName: 'Trung Quốc',
    flag: '🇨🇳',
    nativeLanguage: '中文 (Tiếng Trung)',
    nativeGreeting: '你好呀！物理和化学实验原理我们可以一起讨论哦。',
    viTranslation: 'Chào bạn nhé! Nguyên lý thí nghiệm Vật lý và Hóa học tụi mình có thể thảo luận cùng nhau đấy.',
    grade: 'Chuzhong 3 (Tương đương Lớp 9)',
    strongSubject: 'KHTN',
    status: 'Online',
    personality: 'Điềm tĩnh, yêu thích công nghệ AI và robot.',
    badges: ['Tech Pioneer', 'Lab Master'],
    avatarEmoji: '🐉',
  },

  // Đức
  {
    id: 'buddy-de-1',
    name: 'Lukas',
    tag: '3390',
    countryCode: 'DE',
    countryName: 'Đức',
    flag: '🇩🇪',
    nativeLanguage: 'Deutsch (Tiếng Đức)',
    nativeGreeting: 'Hallo! Lass uns Schritt für Schritt Logik, Physik oder Deutsch üben!',
    viTranslation: 'Xin chào! Hãy cùng mình luyện tư duy logic, Vật lý hoặc tiếng Đức từng bước nhé!',
    grade: 'Klasse 9 (Gymnasium)',
    strongSubject: 'KHTN',
    status: 'Đang ôn bài',
    personality: 'Logic, chính xác, rất thích chứng minh khoa học rõ ràng.',
    badges: ['Berlin STEM', 'Logic Master'],
    avatarEmoji: '🥨',
  },
  {
    id: 'buddy-de-2',
    name: 'Hannah',
    tag: '5521',
    countryCode: 'DE',
    countryName: 'Đức',
    flag: '🇩🇪',
    nativeLanguage: 'Deutsch (Tiếng Đức)',
    nativeGreeting: 'Schön, dich kennenzulernen! Üben wir heute ein bisschen Deutsch im Alltag?',
    viTranslation: 'Rất vui được làm quen! Hôm nay chúng ta luyện một chút tiếng Đức giao tiếp hàng ngày nhé?',
    grade: 'Klasse 10 (Gymnasium)',
    strongSubject: 'Giao tiếp',
    status: 'Online',
    personality: 'Thân thiện, yêu âm nhạc cổ điển và du lịch châu Âu.',
    badges: ['Deutsch Buddy', 'Euro Explorer'],
    avatarEmoji: '🏰',
  },
  {
    id: 'buddy-de-3',
    name: 'Maximilian',
    tag: '1247',
    countryCode: 'DE',
    countryName: 'Đức',
    flag: '🇩🇪',
    nativeLanguage: 'Deutsch (Tiếng Đức)',
    nativeGreeting: 'Servus! Hast du Lust auf eine kleine Mathe-Aufgabe?',
    viTranslation: 'Chào bạn! Bạn có hứng thử một bài toán nhỏ chuẩn Đức không?',
    grade: 'Klasse 8 (Gymnasium)',
    strongSubject: 'Toán',
    status: 'Cần giúp đỡ',
    personality: 'Chăm chỉ, thích giải đố hình học và kỹ thuật cơ khí.',
    badges: ['Math Mind', 'Bavaria Club'],
    avatarEmoji: '⚙️',
  },

  // Pháp
  {
    id: 'buddy-fr-1',
    name: 'Camille',
    tag: '6152',
    countryCode: 'FR',
    countryName: 'Pháp',
    flag: '🇫🇷',
    nativeLanguage: 'Français (Tiếng Pháp)',
    nativeGreeting: 'Bonjour ! On révise le français, la littérature ou les maths ensemble aujourd’hui ?',
    viTranslation: 'Xin chào! Hôm nay tụi mình cùng ôn tiếng Pháp, văn học hay toán nhé?',
    grade: '3ème (Collège Brevet)',
    strongSubject: 'Văn',
    status: 'Online',
    personality: 'Lịch thiệp, giàu cảm hứng, hay khen ngợi bằng những câu tiếng Pháp dễ thương.',
    badges: ['Parisian Reader', 'Brevet Ace'],
    avatarEmoji: '🥐',
  },
  {
    id: 'buddy-fr-2',
    name: 'Théo',
    tag: '8094',
    countryCode: 'FR',
    countryName: 'Pháp',
    flag: '🇫🇷',
    nativeLanguage: 'Français (Tiếng Pháp)',
    nativeGreeting: 'Salut ! Prêt(e) pour un petit quiz de géographie ou d’histoire européenne ?',
    viTranslation: 'Chào bạn! Sẵn sàng cho mini quiz Địa lý hoặc Lịch sử châu Âu chưa?',
    grade: 'Seconde (Lycée)',
    strongSubject: 'Địa lý',
    status: 'Đang ôn bài',
    personality: 'Sôi nổi, thích địa lý thế giới và ẩm thực Lyon.',
    badges: ['Atlas Star', 'Geo Explorer'],
    avatarEmoji: '🗼',
  },
  {
    id: 'buddy-fr-3',
    name: 'Chloé',
    tag: '2765',
    countryCode: 'FR',
    countryName: 'Pháp',
    flag: '🇫🇷',
    nativeLanguage: 'Français (Tiếng Pháp)',
    nativeGreeting: 'Coucou ! Si tu veux pratiquer le français de tous les jours, je suis là !',
    viTranslation: 'Chào nhé! Nếu bạn muốn thực hành tiếng Pháp giao tiếp mỗi ngày, có mình ở đây!',
    grade: '4ème (Collège)',
    strongSubject: 'Giao tiếp',
    status: 'Online',
    personality: 'Dịu dàng, hay chia sẻ từ vựng tiếng Pháp thú vị.',
    badges: ['Bonjour Club', 'Friendly Voice'],
    avatarEmoji: '🎨',
  },
];

export const SLASH_COMMANDS: SlashCommandSpec[] = [
  {
    command: '/ngonngu',
    syntax: '/ngonngu [Tên ngôn ngữ / Quốc gia / song ngữ]',
    description: 'Chuyển đổi toàn bộ ngôn ngữ giao tiếp của AI hoặc bật chế độ Song ngữ.',
    example: '/ngonngu Tiếng Anh',
    badge: 'Ngôn ngữ',
  },
  {
    command: '/caidat',
    syntax: '/caidat [Quốc gia] | [Ngôn ngữ] | [Cấp học] | [Môn học]',
    description: 'Thiết lập nhanh chương trình học chuẩn quốc gia, cấp học và môn học.',
    example: '/caidat Mỹ | Song ngữ | Lớp 9 | Toán',
    badge: 'Chương trình',
  },
  {
    command: '/profile',
    syntax: '/profile',
    description: 'Hiển thị thẻ Hồ sơ Discord chi tiết của bạn kèm trạng thái & huy hiệu.',
    example: '/profile',
    badge: 'Hồ sơ',
  },
  {
    command: '/xem',
    syntax: '/xem [Tên hoặc #ID]',
    description: 'Xem thẻ Profile Discord chi tiết của một bạn học quốc tế.',
    example: '/xem Min-ji',
    badge: 'Hồ sơ',
  },
  {
    command: '/timban',
    syntax: '/timban [Quốc gia hoặc Môn học]',
    description: 'Gợi ý 3 bạn học ảo ngẫu nhiên từ khắp thế giới theo quốc gia hoặc môn học.',
    example: '/timban Hàn Quốc',
    badge: 'Kết bạn',
  },
  {
    command: '/ketban',
    syntax: '/ketban [Tên hoặc #ID]',
    description: 'Thêm một bạn học quốc tế vào danh sách bạn bè của bạn.',
    example: '/ketban Min-ji',
    badge: 'Kết bạn',
  },
  {
    command: '/listban',
    syntax: '/listban',
    description: 'Xem danh sách bạn bè đã kết bạn và trạng thái Online / Đang ôn bài.',
    example: '/listban',
    badge: 'Bạn bè',
  },
  {
    command: '/chat',
    syntax: '/chat [Tên bạn bè | off]',
    description: 'Trò chuyện & học cùng bạn nước ngoài bằng ngôn ngữ bản địa kèm dịch tiếng Việt.',
    example: '/chat Min-ji',
    badge: 'Song ngữ',
  },
  {
    command: '/hoibai',
    syntax: '/hoibai [Quốc gia] [Môn học]',
    description: 'Bắt đầu ngay phiên dò bài từng câu (dễ → khó) theo chuẩn chương trình nước đó.',
    example: '/hoibai Nhật Bản Toán',
    badge: 'Hỏi bài',
  },
];

function stripDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function generateDeterministicTag(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 9000;
  }
  return String(1000 + hash);
}

export function getLanguageLabelForConfig(countryCode: CountryCode, mode: StudyLanguageMode): string {
  const culture = getCountryCulture(countryCode);
  if (countryCode === 'VN' || mode === 'vi') {
    return 'Tiếng Việt';
  }
  if (mode === 'bilingual') {
    return `${culture.languageName} + Tiếng Việt (Song ngữ)`;
  }
  return `${culture.languageName} (Bản ngữ)`;
}

export function loadGlobalStudyProfile(
  fallbackName = 'Bạn học',
  fallbackGrade = 'Lớp 9',
  fallbackCountry: CountryCode = 'VN'
): GlobalStudyProfile {
  const culture = getCountryCulture(fallbackCountry);
  const cleanName = fallbackName.trim() || 'Bạn học';
  const defaultProfile: GlobalStudyProfile = {
    displayName: cleanName,
    tag: generateDeterministicTag(cleanName),
    countryCode: culture.code,
    countryName: culture.name,
    flag: culture.flag,
    languageMode: 'vi',
    activeLanguageLabel: 'Tiếng Việt (Mặc định)',
    gradeLabel: fallbackGrade || 'Lớp 9',
    subjectLabel: 'Toán',
    status: 'Online',
    badges: ['Thành viên Max10', 'Công dân Toàn cầu', 'Chinh phục Điểm 10'],
    friendIds: ['buddy-kr-1', 'buddy-us-1'],
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_GLOBAL_STUDY_PROFILE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GLOBAL_STUDY_PROFILE, JSON.stringify(defaultProfile));
      return defaultProfile;
    }
    const parsed = JSON.parse(raw) as Partial<GlobalStudyProfile>;
    const mergedCountry = getCountryCulture(parsed.countryCode || fallbackCountry);
    const mergedName =
      cleanName && cleanName !== 'Bạn học' ? cleanName : parsed.displayName || 'Bạn học';
    const languageMode: StudyLanguageMode =
      parsed.languageMode === 'native' || parsed.languageMode === 'bilingual' || parsed.languageMode === 'vi'
        ? parsed.languageMode
        : 'vi';

    return {
      displayName: mergedName,
      tag: parsed.tag || generateDeterministicTag(mergedName),
      countryCode: mergedCountry.code,
      countryName: mergedCountry.name,
      flag: mergedCountry.flag,
      languageMode,
      activeLanguageLabel: parsed.activeLanguageLabel || getLanguageLabelForConfig(mergedCountry.code, languageMode),
      gradeLabel: parsed.gradeLabel || fallbackGrade || 'Lớp 9',
      subjectLabel: parsed.subjectLabel || 'Toán',
      status:
        parsed.status === 'Đang ôn bài' || parsed.status === 'Cần giúp đỡ' || parsed.status === 'Online'
          ? parsed.status
          : 'Online',
      badges:
        Array.isArray(parsed.badges) && parsed.badges.length > 0
          ? parsed.badges
          : defaultProfile.badges,
      friendIds: Array.isArray(parsed.friendIds) ? parsed.friendIds : defaultProfile.friendIds,
    };
  } catch {
    return defaultProfile;
  }
}

export function saveGlobalStudyProfile(profile: GlobalStudyProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL_STUDY_PROFILE, JSON.stringify(profile));
  } catch {
    // ignore storage quota errors
  }
}

export function resolveCountryInput(rawText: string): CountryCode | null {
  const norm = stripDiacritics(rawText);
  if (!norm) return null;

  if (
    norm === 'vn' ||
    norm.includes('viet nam') ||
    norm.includes('vietnam') ||
    norm.includes('tieng viet')
  ) {
    return 'VN';
  }
  if (
    norm === 'us' ||
    norm === 'usa' ||
    norm.includes('hoa ky') ||
    norm.includes('nuoc my') ||
    norm === 'my' ||
    norm.includes('american') ||
    norm.includes('united states') ||
    norm.includes('anh my')
  ) {
    return 'US';
  }
  if (
    norm === 'gb' ||
    norm === 'uk' ||
    norm.includes('nuoc anh') ||
    norm === 'anh' ||
    norm.includes('british') ||
    norm.includes('england') ||
    norm.includes('vuong quoc anh') ||
    norm.includes('tieng anh') ||
    norm.includes('english')
  ) {
    // Default "Tiếng Anh" / "Anh" maps to US or GB? Map "Anh" / "UK" / "GB" to GB, "Tiếng Anh" / "English" to US if not specified GB
    if (norm.includes('tieng anh') || norm === 'english') return 'US';
    return 'GB';
  }
  if (norm === 'jp' || norm.includes('nhat') || norm.includes('japan') || norm.includes('nihon')) {
    return 'JP';
  }
  if (norm === 'kr' || norm.includes('han') || norm.includes('korea') || norm.includes('hanguk')) {
    return 'KR';
  }
  if (norm === 'cn' || norm.includes('trung') || norm.includes('china') || norm.includes('hoa')) {
    return 'CN';
  }
  if (norm === 'de' || norm.includes('duc') || norm.includes('germany') || norm.includes('deutsch')) {
    return 'DE';
  }
  if (norm === 'fr' || norm.includes('phap') || norm.includes('france') || norm.includes('francais')) {
    return 'FR';
  }

  // Fallback partial match against COUNTRY_CULTURES
  for (const c of COUNTRY_CULTURES) {
    if (
      norm.includes(stripDiacritics(c.shortName)) ||
      norm.includes(stripDiacritics(c.languageName))
    ) {
      return c.code;
    }
  }
  return null;
}

export function resolveLanguageInput(
  rawText: string,
  currentCountryCode: CountryCode
): { countryCode: CountryCode; languageMode: StudyLanguageMode; languageLabel: string } {
  const norm = stripDiacritics(rawText);

  if (!norm) {
    return {
      countryCode: currentCountryCode,
      languageMode: 'bilingual',
      languageLabel: getLanguageLabelForConfig(currentCountryCode, 'bilingual'),
    };
  }

  const wantsBilingual =
    norm.includes('song ngu') || norm.includes('bilingual') || norm.includes('hai ngon ngu');

  if (norm === 'tieng viet' || norm === 'viet' || norm === 'vi' || norm === 'vietnamese') {
    return {
      countryCode: currentCountryCode,
      languageMode: 'vi',
      languageLabel: 'Tiếng Việt',
    };
  }

  const matchedCountry = resolveCountryInput(rawText);
  if (matchedCountry) {
    const mode: StudyLanguageMode =
      matchedCountry === 'VN' ? 'vi' : wantsBilingual ? 'bilingual' : 'bilingual';
    // When user explicitly picks e.g. "/ngonngu Tiếng Anh" or "/ngonngu Nhật Bản", enable bilingual or native cleanly;
    // Wait: if user says "chỉ tiếng anh" or "100% tiếng anh" or "bản ngữ", make it 'native', otherwise 'bilingual' (or if they explicitly want native? Let's check!)
    const wantsPureNative =
      norm.includes('100%') ||
      norm.includes('ban ngu') ||
      norm.includes('native') ||
      norm.includes('hoan toan') ||
      norm.includes('chi ');
    const resolvedMode: StudyLanguageMode =
      matchedCountry === 'VN'
        ? 'vi'
        : wantsBilingual
        ? 'bilingual'
        : wantsPureNative
        ? 'native'
        : 'native';
    return {
      countryCode: matchedCountry,
      languageMode: resolvedMode,
      languageLabel: getLanguageLabelForConfig(matchedCountry, resolvedMode),
    };
  }

  if (wantsBilingual) {
    const targetCountry = currentCountryCode === 'VN' ? 'US' : currentCountryCode;
    return {
      countryCode: targetCountry,
      languageMode: 'bilingual',
      languageLabel: getLanguageLabelForConfig(targetCountry, 'bilingual'),
    };
  }

  return {
    countryCode: currentCountryCode,
    languageMode: 'bilingual',
    languageLabel: getLanguageLabelForConfig(currentCountryCode, 'bilingual'),
  };
}

export function resolveSubjectInput(rawText: string): QuizTopicId {
  const norm = stripDiacritics(rawText);
  if (!norm) return 'Toán';
  if (norm.includes('toan') || norm.includes('math') || norm.includes('algebra') || norm.includes('geometry')) {
    return 'Toán';
  }
  if (norm.includes('van') || norm.includes('ngu van') || norm.includes('literature')) {
    return 'Văn';
  }
  if (norm.includes('anh') || norm.includes('english')) {
    return 'Anh';
  }
  if (norm.includes('su') || norm.includes('history')) {
    return 'Lịch sử';
  }
  if (norm.includes('giao tiep') || norm.includes('noi') || norm.includes('speaking') || norm.includes('hoi thoai')) {
    return 'Giao tiếp';
  }
  if (
    norm.includes('khtn') ||
    norm.includes('khoa hoc') ||
    norm.includes('ly') ||
    norm.includes('hoa') ||
    norm.includes('sinh') ||
    norm.includes('science') ||
    norm.includes('physics') ||
    norm.includes('chemistry')
  ) {
    return 'KHTN';
  }
  if (norm.includes('dia') || norm.includes('geography')) {
    return 'Địa lý';
  }
  return 'Toán';
}

export function findRandomBuddies(query: string, count = 3): VirtualStudyBuddy[] {
  const cleanQuery = query.trim();
  const normQuery = stripDiacritics(cleanQuery);

  let pool = [...VIRTUAL_STUDY_BUDDIES];
  if (normQuery) {
    const matchedCountry = resolveCountryInput(cleanQuery);
    const matchedSubject =
      normQuery.includes('toan') ||
      normQuery.includes('van') ||
      normQuery.includes('anh') ||
      normQuery.includes('su') ||
      normQuery.includes('giao tiep') ||
      normQuery.includes('khtn') ||
      normQuery.includes('ly') ||
      normQuery.includes('hoa') ||
      normQuery.includes('sinh') ||
      normQuery.includes('dia') ||
      normQuery.includes('science') ||
      normQuery.includes('math')
        ? resolveSubjectInput(cleanQuery)
        : null;

    const filtered = pool.filter((b) => {
      const countryHit = matchedCountry ? b.countryCode === matchedCountry : false;
      const subjectHit = matchedSubject ? b.strongSubject === matchedSubject : false;
      const textHit =
        stripDiacritics(b.countryName).includes(normQuery) ||
        stripDiacritics(b.nativeLanguage).includes(normQuery) ||
        stripDiacritics(b.strongSubject).includes(normQuery) ||
        stripDiacritics(b.name).includes(normQuery);

      if (matchedCountry && matchedSubject) {
        return countryHit || subjectHit;
      }
      return countryHit || subjectHit || textHit;
    });

    if (filtered.length > 0) {
      pool = filtered;
    }
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // If country filter yielded 3, return those 3; if fewer than count, top up from others
  if (pool.length < count) {
    const existingIds = new Set(pool.map((b) => b.id));
    const extras = VIRTUAL_STUDY_BUDDIES.filter((b) => !existingIds.has(b.id));
    pool = [...pool, ...extras].slice(0, count);
  }

  return pool.slice(0, count);
}

export function findBuddyByNameOrId(query: string): VirtualStudyBuddy | null {
  const clean = query.trim();
  if (!clean) return null;

  const tagMatch = clean.match(/#?(\d{4})/);
  if (tagMatch) {
    const byTag = VIRTUAL_STUDY_BUDDIES.find((b) => b.tag === tagMatch[1]);
    if (byTag) return byTag;
  }

  const norm = stripDiacritics(clean.replace(/#\d+/, ''));
  if (!norm) return null;

  const exact = VIRTUAL_STUDY_BUDDIES.find((b) => stripDiacritics(b.name) === norm);
  if (exact) return exact;

  const partial = VIRTUAL_STUDY_BUDDIES.find(
    (b) =>
      stripDiacritics(b.name).includes(norm) ||
      norm.includes(stripDiacritics(b.name)) ||
      b.id === clean
  );
  if (partial) return partial;

  const byCountry = resolveCountryInput(clean);
  if (byCountry) {
    return VIRTUAL_STUDY_BUDDIES.find((b) => b.countryCode === byCountry) || null;
  }

  return null;
}

export interface ParsedSlashCommand {
  command: string;
  args: string;
}

export function parseSlashCommand(rawInput: string): ParsedSlashCommand | null {
  const trimmed = rawInput.trim();
  if (!trimmed.startsWith('/')) return null;

  const firstSpace = trimmed.search(/\s/);
  if (firstSpace === -1) {
    return { command: trimmed.toLowerCase(), args: '' };
  }
  return {
    command: trimmed.slice(0, firstSpace).toLowerCase(),
    args: trimmed.slice(firstSpace + 1).trim(),
  };
}
