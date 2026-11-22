import { DuelQuestion, GradeLevel } from '../types';

export type DuelSubjectOption =
  | 'Tổng hợp THCS'
  | 'Toán học'
  | 'Ngữ văn'
  | 'Tiếng Anh'
  | 'Khoa học Tự nhiên';

export const DUEL_SUBJECT_OPTIONS: DuelSubjectOption[] = [
  'Tổng hợp THCS',
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Khoa học Tự nhiên',
];

const DUEL_QUESTION_BANK: Array<DuelQuestion & { grades?: GradeLevel[] }> = [
  // TOÁN HỌC
  {
    id: 'duel-toan-1',
    subject: 'Toán học',
    grades: ['Lớp 9'],
    question: 'Điều kiện xác định của biểu thức √(2x - 6) là gì?',
    options: ['x ≥ 3', 'x > 3', 'x ≤ 3', 'x ≠ 3'],
    correctIndex: 0,
    explanation: 'Biểu thức √A có nghĩa khi A ≥ 0 ⇒ 2x - 6 ≥ 0 ⇔ x ≥ 3.',
  },
  {
    id: 'duel-toan-2',
    subject: 'Toán học',
    grades: ['Lớp 9'],
    question: 'Gọi x₁, x₂ là hai nghiệm của phương trình x² - 5x + 3 = 0. Giá trị P = x₁² + x₂² bằng:',
    options: ['19', '25', '22', '31'],
    correctIndex: 0,
    explanation: 'Theo Vi-ét: x₁ + x₂ = 5, x₁x₂ = 3 ⇒ x₁² + x₂² = (x₁ + x₂)² - 2x₁x₂ = 25 - 6 = 19.',
  },
  {
    id: 'duel-toan-3',
    subject: 'Toán học',
    grades: ['Lớp 9'],
    question: 'Đồ thị hàm số y = (m - 2)x + 3 đi qua điểm A(1; 5) khi m bằng:',
    options: ['m = 4', 'm = 2', 'm = 3', 'm = 5'],
    correctIndex: 0,
    explanation: 'Thay x = 1, y = 5 vào y = (m - 2)x + 3 ta được 5 = m - 2 + 3 ⇒ m = 4.',
  },
  {
    id: 'duel-toan-4',
    subject: 'Toán học',
    grades: ['Lớp 9'],
    question: 'Góc nội tiếp chắn nửa đường tròn luôn có số đo bằng bao nhiêu?',
    options: ['90°', '60°', '45°', '180°'],
    correctIndex: 0,
    explanation: 'Mọi góc nội tiếp chắn nửa đường tròn đều là góc vuông (90°).',
  },
  {
    id: 'duel-toan-5',
    subject: 'Toán học',
    grades: ['Lớp 8', 'Lớp 9'],
    question: 'Giá trị nhỏ nhất của biểu thức P = x² - 4x + 9 là bao nhiêu?',
    options: ['5 (khi x = 2)', '9 (khi x = 0)', '4 (khi x = 2)', '1 (khi x = 4)'],
    correctIndex: 0,
    explanation: 'P = (x - 2)² + 5 ≥ 5 với mọi x. Dấu bằng xảy ra tại x = 2.',
  },
  {
    id: 'duel-toan-6',
    subject: 'Toán học',
    grades: ['Lớp 6', 'Lớp 7', 'Lớp 8'],
    question: 'Hằng đẳng thức (a + b)² bằng biểu thức nào sau đây?',
    options: ['a² + 2ab + b²', 'a² + b²', 'a² - 2ab + b²', 'a² + ab + b²'],
    correctIndex: 0,
    explanation: 'Bình phương một tổng: (a + b)² = a² + 2ab + b².',
  },
  {
    id: 'duel-toan-7',
    subject: 'Toán học',
    grades: ['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'],
    question: 'Trong tam giác ABC vuông tại A có AB = 6 cm, AC = 8 cm. Độ dài cạnh huyền BC bằng:',
    options: ['10 cm', '14 cm', '12 cm', '7 cm'],
    correctIndex: 0,
    explanation: 'Theo định lý Pythagore: BC² = 6² + 8² = 36 + 64 = 100 ⇒ BC = 10 cm.',
  },
  {
    id: 'duel-toan-8',
    subject: 'Toán học',
    grades: ['Lớp 6', 'Lớp 7'],
    question: 'Phân số a/b (b ≠ 0) là phân số tối giản khi nào?',
    options: ['ƯCLN(|a|, |b|) = 1', 'a < b', 'a và b đều nguyên tố', 'b chia hết cho a'],
    correctIndex: 0,
    explanation: 'Phân số tối giản có tử và mẫu chỉ có ước chung là ±1 (ƯCLN = 1).',
  },

  // TIẾNG ANH
  {
    id: 'duel-anh-1',
    subject: 'Tiếng Anh',
    question: 'Choose the correct verb: "If she ______ harder, she will pass the entrance exam."',
    options: ['studies', 'studied', 'will study', 'would study'],
    correctIndex: 0,
    explanation: 'Câu điều kiện loại 1: If + S + V(hiện tại đơn), S + will + V nguyên thể.',
  },
  {
    id: 'duel-anh-2',
    subject: 'Tiếng Anh',
    question: 'Choose the correct verb: "If Lan ______ harder, she would pass the exam easily."',
    options: ['studied', 'studies', 'has studied', 'will study'],
    correctIndex: 0,
    explanation: 'Câu điều kiện loại 2 (không có thật ở hiện tại): If + S + V2/ed, S + would + V.',
  },
  {
    id: 'duel-anh-3',
    subject: 'Tiếng Anh',
    question: 'Choose the right preposition: "My school is very proud ______ its smart students."',
    options: ['of', 'in', 'at', 'with'],
    correctIndex: 0,
    explanation: 'Cụm tính từ cố định: to be proud of (tự hào về...).',
  },
  {
    id: 'duel-anh-4',
    subject: 'Tiếng Anh',
    question: 'Passive voice: "They built this library in 2020." → "This library ______ in 2020."',
    options: ['was built', 'is built', 'built', 'has been built'],
    correctIndex: 0,
    explanation: 'Bị động quá khứ đơn (in 2020) với chủ ngữ số ít: was + V3 (was built).',
  },
  {
    id: 'duel-anh-5',
    subject: 'Tiếng Anh',
    question: 'Choose the best option: "I wish I ______ speak English fluently like a native speaker."',
    options: ['could', 'can', 'will', 'am able'],
    correctIndex: 0,
    explanation: 'Câu ước ở hiện tại (wish): lùi thì từ can → could.',
  },
  {
    id: 'duel-anh-6',
    subject: 'Tiếng Anh',
    question: 'Relative pronoun: "The boy ______ sits next to me in class won the math prize."',
    options: ['who', 'which', 'whom', 'whose'],
    correctIndex: 0,
    explanation: 'Thay thế cho danh từ chỉ người (the boy) đóng vai trò chủ ngữ ⇒ dùng "who".',
  },

  // NGỮ VĂN
  {
    id: 'duel-van-1',
    subject: 'Ngữ văn',
    question: 'Hình ảnh "Đầu súng trăng treo" trong bài thơ "Đồng chí" của Chính Hữu mang ý nghĩa gì?',
    options: [
      'Kết hợp hài hòa giữa hiện thực chiến đấu và lãng mạn thi vị',
      'Chỉ miêu tả cảnh đêm trăng tình cờ nhìn thấy',
      'Báo hiệu cuộc chiến đã hoàn toàn kết thúc',
      'Sự cô đơn lạnh lẽo của người lính nơi rừng sâu',
    ],
    correctIndex: 0,
    explanation: 'Súng tượng trưng cho hiện thực chiến sĩ, trăng tượng trưng cho thi sĩ và khát vọng hòa bình.',
  },
  {
    id: 'duel-van-2',
    subject: 'Ngữ văn',
    question: 'Biện pháp tu từ nào được dùng trong câu: "Mặt trời xuống biển như hòn lửa"?',
    options: ['So sánh', 'Hoán dụ', 'Nói giảm nói tránh', 'Điệp ngữ'],
    correctIndex: 0,
    explanation: 'Có từ so sánh "như" ví mặt trời với hòn lửa (Huy Cận - Đoàn thuyền đánh cá).',
  },
  {
    id: 'duel-van-3',
    subject: 'Ngữ văn',
    question: 'Tác phẩm "Làng" nổi tiếng viết về lòng yêu làng, yêu nước của ông Hai là của nhà văn nào?',
    options: ['Kim Lân', 'Nam Cao', 'Tô Hoài', 'Nguyễn Thành Long'],
    correctIndex: 0,
    explanation: 'Truyện ngắn "Làng" (1948) là tác phẩm tiêu biểu của nhà văn Kim Lân.',
  },
  {
    id: 'duel-van-4',
    subject: 'Ngữ văn',
    question: 'Trong "Truyện Kiều" của Nguyễn Du, hai câu: "Cỏ non xanh tận chân trời / Cành lê trắng điểm một vài bông hoa" tả cảnh mùa nào?',
    options: ['Mùa xuân', 'Mùa hạ', 'Mùa thu', 'Mùa đông'],
    correctIndex: 0,
    explanation: 'Trích đoạn "Cảnh ngày xuân" miêu tả bức tranh mùa xuân tinh khôi, trong trẻo.',
  },
  {
    id: 'duel-van-5',
    subject: 'Ngữ văn',
    question: 'Phương thức biểu đạt chính của một văn bản nghị luận xã hội là gì?',
    options: ['Nghị luận', 'Tự sự', 'Biểu cảm', 'Miêu tả'],
    correctIndex: 0,
    explanation: 'Văn bản nghị luận xã hội dùng lý lẽ, dẫn chứng thuyết phục ⇒ phương thức biểu đạt chính là Nghị luận.',
  },

  // KHOA HỌC TỰ NHIÊN
  {
    id: 'duel-khtn-1',
    subject: 'Khoa học Tự nhiên',
    question: 'Kim loại nào phản ứng mãnh liệt với nước ở nhiệt độ thường tạo ra khí H₂?',
    options: ['Natri (Na)', 'Đồng (Cu)', 'Bạc (Ag)', 'Vàng (Au)'],
    correctIndex: 0,
    explanation: 'Natri là kim loại kiềm hoạt động mạnh: 2Na + 2H₂O → 2NaOH + H₂↑.',
  },
  {
    id: 'duel-khtn-2',
    subject: 'Khoa học Tự nhiên',
    question: 'Công thức tính công suất điện P của một đoạn mạch là gì?',
    options: ['P = U · I', 'P = U / I', 'P = I / U', 'P = U² · I'],
    correctIndex: 0,
    explanation: 'Công suất điện P = U·I (đơn vị Oát, ký hiệu W).',
  },
  {
    id: 'duel-khtn-3',
    subject: 'Khoa học Tự nhiên',
    question: 'Khí nào chiếm tỉ lệ thể tích lớn nhất trong không khí (khoảng 78%)?',
    options: ['Khí Nitơ (N₂)', 'Khí Oxi (O₂)', 'Khí Cacbonic (CO₂)', 'Hơi nước'],
    correctIndex: 0,
    explanation: 'Thành phần không khí gồm ~78% N₂, ~21% O₂ và ~1% khí khác.',
  },
  {
    id: 'duel-khtn-4',
    subject: 'Khoa học Tự nhiên',
    question: 'Đơn vị đo cường độ dòng điện trong hệ SI là gì?',
    options: ['Ampe (A)', 'Vôn (V)', 'Ôm (Ω)', 'Oát (W)'],
    correctIndex: 0,
    explanation: 'Cường độ dòng điện đo bằng Ampe (A), hiệu điện thế đo bằng Vôn (V), điện trở đo bằng Ôm (Ω).',
  },
  {
    id: 'duel-khtn-5',
    subject: 'Khoa học Tự nhiên',
    question: 'Bào quan nào trong tế bào được ví là "nhà máy năng lượng" tạo ra ATP?',
    options: ['Ti thể', 'Không bào', 'Lục lạp', 'Bộ máy Golgi'],
    correctIndex: 0,
    explanation: 'Ti thể thực hiện hô hấp tế bào để tổng hợp ATP cung cấp năng lượng.',
  },
];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildDuelQuestions(
  subject: DuelSubjectOption,
  grade: GradeLevel,
  count = 5
): DuelQuestion[] {
  let pool =
    subject === 'Tổng hợp THCS'
      ? DUEL_QUESTION_BANK
      : DUEL_QUESTION_BANK.filter((q) => q.subject === subject);

  // Prefer matching grade first if available, then fill from same subject pool
  const gradeMatched = pool.filter((q) => !q.grades || q.grades.includes(grade));
  const others = pool.filter((q) => q.grades && !q.grades.includes(grade));

  const picked = [
    ...shuffleArray(gradeMatched),
    ...shuffleArray(others),
  ].slice(0, count);

  return picked.map(({ grades: _g, ...rest }) => rest);
}
