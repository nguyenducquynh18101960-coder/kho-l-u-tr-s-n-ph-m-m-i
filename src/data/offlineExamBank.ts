import { ExamData, ExamQuestion, GradeLevel } from '../types';

export const STORAGE_KEY_OFFLINE_EXAMS = 'max10_offline_cached_exams_v1';
export const STORAGE_KEY_OFFLINE_HONOR_QUEUE = 'max10_offline_honor_queue_v1';
const MAX_CACHED_EXAMS = 24;

export interface CachedExamEntry {
  id: string;
  grade: GradeLevel;
  subjectId: string;
  subjectName: string;
  examType: string;
  topic: string;
  cachedAt: number;
  source: 'ai_generated' | 'library' | 'offline_starter';
  bestScore?: number;
  attemptCount?: number;
  exam: ExamData;
}

export interface PendingHonorRollSubmission {
  id: string;
  payload: {
    studentName: string;
    avatar: string;
    school: string;
    grade: string;
    subject: string;
    score: number;
    totalQuestions: number;
    correctCount: number;
    timeSpentSeconds: number;
    examType: string;
    note: string;
  };
  createdAt: number;
}

const STARTER_OFFLINE_EXAMS: CachedExamEntry[] = [
  {
    id: 'starter-toan-9-he-thuc',
    grade: 'Lớp 9',
    subjectId: 'toan',
    subjectName: 'Toán Học',
    examType: 'giua_ky',
    topic: 'Phương trình bậc hai & Hệ thức Vi-ét',
    cachedAt: 1763360000000,
    source: 'offline_starter',
    exam: {
      title: 'Đề Luyện Offline Chuẩn Điểm 10 — Toán 9 (Vi-ét & Căn thức)',
      durationMinutes: 15,
      instructions: 'Bộ đề mẫu lưu sẵn ngoại tuyến gồm 5 câu hỏi trọng tâm thi vào lớp 10.',
      questions: [
        {
          id: 9001,
          questionText: 'Điều kiện xác định của biểu thức $\\sqrt{2x - 6}$ là:',
          type: 'multiple_choice',
          options: ['x > 3', 'x ≥ 3', 'x ≤ 3', 'x ≠ 3'],
          correctAnswer: 'B',
          difficulty: 'Cơ bản',
          stepByStepSolution:
            'Biểu thức $\\sqrt{A}$ xác định khi và chỉ khi $A \\ge 0$.\nTa có $2x - 6 \\ge 0 \\Leftrightarrow 2x \\ge 6 \\Leftrightarrow x \\ge 3$.',
          score10Secret:
            'Bẫy hay gặp: Quên dấu "=" thành $x > 3$. Chỉ khi căn thức nằm dưới mẫu $\\frac{1}{\\sqrt{A}}$ thì mới lấy $A > 0$.',
        },
        {
          id: 9002,
          questionText:
            'Gọi $x_1, x_2$ là hai nghiệm của phương trình $x^2 - 5x + 3 = 0$. Giá trị của biểu thức $P = x_1^2 + x_2^2$ bằng:',
          type: 'multiple_choice',
          options: ['19', '25', '22', '31'],
          correctAnswer: 'A',
          difficulty: 'Thông hiểu',
          stepByStepSolution:
            'Ta có $\\Delta = (-5)^2 - 4 \\cdot 1 \\cdot 3 = 13 > 0$, phương trình có 2 nghiệm phân biệt.\nTheo hệ thức Vi-ét: $x_1 + x_2 = 5$ và $x_1 x_2 = 3$.\nKhi đó $x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2 = 5^2 - 2 \\cdot 3 = 25 - 6 = 19$.',
          score10Secret:
            'Luôn kiểm tra $\\Delta \\ge 0$ trước khi áp dụng Vi-ét để tránh mất điểm trình bày trong bài tự luận.',
        },
        {
          id: 9003,
          questionText:
            'Đồ thị hàm số $y = (m - 2)x + 3$ đi qua điểm $A(1; 5)$ khi giá trị của tham số $m$ là:',
          type: 'multiple_choice',
          options: ['m = 2', 'm = 3', 'm = 4', 'm = 5'],
          correctAnswer: 'C',
          difficulty: 'Cơ bản',
          stepByStepSolution:
            'Thay $x = 1, y = 5$ vào phương trình đường thẳng: $5 = (m - 2) \\cdot 1 + 3 \\Leftrightarrow m - 2 = 2 \\Leftrightarrow m = 4$.\nKiểm tra điều kiện hàm bậc nhất $m - 2 \\ne 0$ thấy $m = 4$ thỏa mãn.',
          score10Secret:
            'Đừng quên đối chiếu điều kiện hệ số góc $a \\ne 0$ đối với bài toán tìm tham số cho hàm số bậc nhất.',
        },
        {
          id: 9004,
          questionText:
            'Cho tam giác $ABC$ vuông tại $A$, đường cao $AH$. Biết $BH = 4\\text{ cm}, CH = 9\\text{ cm}$. Độ dài đường cao $AH$ bằng:',
          type: 'multiple_choice',
          options: ['6 cm', '5 cm', '6,5 cm', '13 cm'],
          correctAnswer: 'A',
          difficulty: 'Thông hiểu',
          stepByStepSolution:
            'Áp dụng hệ thức lượng trong tam giác vuông $ABC$ có đường cao $AH$: $AH^2 = BH \\cdot CH = 4 \\cdot 9 = 36$.\nSuy ra $AH = \\sqrt{36} = 6\\text{ (cm)}$ (vì $AH > 0$).',
          score10Secret:
            'Ghi nhớ bộ 4 hệ thức lượng cốt lõi: $h^2 = b\'c\'$, $b^2 = a b\'$, $ah = bc$, $\\frac{1}{h^2} = \\frac{1}{b^2} + \\frac{1}{c^2}$.',
        },
        {
          id: 9005,
          questionText:
            'Tìm giá trị nhỏ nhất của biểu thức $M = x + \\frac{4}{x - 1}$ với $x > 1$:',
          type: 'multiple_choice',
          options: ['4', '5', '6', '3'],
          correctAnswer: 'B',
          difficulty: 'Vận dụng cao (Điểm 10)',
          stepByStepSolution:
            'Viết lại $M = (x - 1) + \\frac{4}{x - 1} + 1$.\nVì $x > 1$ nên $x - 1 > 0$. Áp dụng bất đẳng thức Cô-si (AM-GM):\n$(x - 1) + \\frac{4}{x - 1} \\ge 2\\sqrt{(x - 1) \\cdot \\frac{4}{x - 1}} = 2 \\cdot 2 = 4$.\nDo đó $M \\ge 4 + 1 = 5$. Dấu "=" xảy ra khi $x - 1 = 2 \\Leftrightarrow x = 3$ (thỏa mãn $x > 1$).',
          score10Secret:
            'Bẫy Điểm 10: Nhiều bạn quên tách $-1$ và $+1$ để làm xuất hiện $(x - 1)$ triệt tiêu với mẫu, hoặc quên chỉ ra dấu "=" xảy ra tại $x = 3$.',
        },
      ],
    },
  },
  {
    id: 'starter-anh-thcs',
    grade: 'Lớp 9',
    subjectId: 'anh',
    subjectName: 'Tiếng Anh',
    examType: 'giua_ky',
    topic: 'Ngữ pháp trọng tâm THCS (Câu điều kiện, Bị động, Mệnh đề quan hệ)',
    cachedAt: 1763350000000,
    source: 'offline_starter',
    exam: {
      title: 'Đề Luyện Offline — Tiếng Anh THCS (Ngữ pháp Săn Điểm 10)',
      durationMinutes: 10,
      instructions: 'Bộ đề trắc nghiệm ngữ pháp Tiếng Anh lưu sẵn phục vụ ôn tập ngoại tuyến.',
      questions: [
        {
          id: 9101,
          questionText: 'If Lan ______ harder, she would pass the entrance exam easily.',
          type: 'multiple_choice',
          options: ['studies', 'studied', 'has studied', 'will study'],
          correctAnswer: 'B',
          difficulty: 'Cơ bản',
          stepByStepSolution:
            'Mệnh đề chính dùng `would + V(nguyên thể)` -> Đây là câu điều kiện loại 2 (giả định trái với hiện tại).\nMệnh đề `If` chia quá khứ đơn: `studied`.',
          score10Secret:
            'Quan sát mệnh đề còn lại để xác định chính xác loại câu điều kiện (Loại 1: will V; Loại 2: would V; Loại 3: would have V3).',
        },
        {
          id: 9102,
          questionText: 'The school library ______ in 2015 and is still very modern.',
          type: 'multiple_choice',
          options: ['built', 'was built', 'has built', 'is built'],
          correctAnswer: 'B',
          difficulty: 'Cơ bản',
          stepByStepSolution:
            'Chủ ngữ "The school library" là vật chịu tác động nên dùng thể bị động. Có mốc thời gian quá khứ xác định `in 2015` -> dùng bị động quá khứ đơn: `was built`.',
          score10Secret:
            'Luôn kiểm tra 2 bước: (1) Chủ động hay Bị động? (2) Thì nào theo dấu hiệu thời gian?',
        },
        {
          id: 9103,
          questionText: 'The student ______ won the first prize is my best friend.',
          type: 'multiple_choice',
          options: ['which', 'whom', 'who', 'whose'],
          correctAnswer: 'C',
          difficulty: 'Thông hiểu',
          stepByStepSolution:
            'Danh từ đứng trước là `The student` (chỉ người), ngay sau chỗ trống là động từ `won` -> cần đại từ quan hệ làm chủ ngữ chỉ người: `who`.',
          score10Secret:
            'Không dùng `whom` trước động từ chia thì! `whom` chỉ thay thế cho tân ngữ (sau nó là S + V).',
        },
        {
          id: 9104,
          questionText: 'She asked me where ______ the day before.',
          type: 'multiple_choice',
          options: ['did I go', 'I had gone', 'had I gone', 'I went'],
          correctAnswer: 'B',
          difficulty: 'Vận dụng',
          stepByStepSolution:
            'Câu tường thuật dạng Wh-question: giữ trật tự `Wh-word + S + V` (không đảo ngữ) và lùi thì.\n`the day before` tương ứng câu trực tiếp chia quá khứ đơn -> lùi về quá khứ hoàn thành: `I had gone`.',
          score10Secret:
            'Bẫy kinh điển: Thấy câu hỏi gián tiếp rồi vẫn chọn đảo ngữ `did I go` hoặc `had I gone`. Nhớ: Câu gián tiếp luôn có trật tự S + V!',
        },
      ],
    },
  },
  {
    id: 'starter-khtn-thcs',
    grade: 'Lớp 9',
    subjectId: 'khtn',
    subjectName: 'Khoa Học Tự Nhiên',
    examType: '15_phut',
    topic: 'Vật lý - Hóa học - Sinh học THCS trọng tâm',
    cachedAt: 1763340000000,
    source: 'offline_starter',
    exam: {
      title: 'Đề Luyện Offline — Khoa Học Tự Nhiên THCS',
      durationMinutes: 10,
      instructions: 'Bộ câu hỏi ôn tập nhanh Khoa học tự nhiên hoạt động 100% không cần mạng.',
      questions: [
        {
          id: 9201,
          questionText: 'Công thức tính công suất điện tiêu thụ của một đoạn mạch là:',
          type: 'multiple_choice',
          options: ['P = U / I', 'P = U . I', 'P = I² . t', 'P = U . I . t'],
          correctAnswer: 'B',
          difficulty: 'Cơ bản',
          stepByStepSolution:
            'Công suất điện của đoạn mạch bằng tích hiệu điện thế giữa hai đầu đoạn mạch và cường độ dòng điện chạy qua nó: $P = U \\cdot I$.',
          score10Secret:
            'Phân biệt Công suất $P = U\\cdot I$ (đơn vị Watt) và Công/Điện năng $A = P\\cdot t = U\\cdot I\\cdot t$ (đơn vị Joule).',
        },
        {
          id: 9202,
          questionText: 'Kim loại nào sau đây phản ứng với dung dịch $H_2SO_4$ loãng giải phóng khí $H_2$?',
          type: 'multiple_choice',
          options: ['Cu', 'Ag', 'Zn', 'Au'],
          correctAnswer: 'C',
          difficulty: 'Cơ bản',
          stepByStepSolution:
            'Theo dãy hoạt động hóa học của kim loại, chỉ kim loại đứng trước H (như K, Na, Ca, Mg, Al, Zn, Fe, Pb) mới tác dụng với axit loãng (HCl, $H_2SO_4$ loãng) giải phóng $H_2$. Cu, Ag, Au đứng sau H nên không phản ứng.',
          score10Secret:
            'Thuộc câu thần chú dãy hoạt động: Khi Nào Cần May Áo Záp Sắt Nhớ Sang Phố Hỏi Cửa Hàng Á Phi Âu.',
        },
        {
          id: 9203,
          questionText: 'Trong phân tử ADN (DNA), các nuclêôtit liên kết theo nguyên tắc bổ sung là:',
          type: 'multiple_choice',
          options: ['A liên kết với G; T liên kết với X', 'A liên kết với T; G liên kết với X (C)', 'A liên kết với U; G liên kết với X', 'A liên kết với X; T liên kết với G'],
          correctAnswer: 'B',
          difficulty: 'Cơ bản',
          stepByStepSolution:
            'Trên 2 mạch của phân tử DNA, A luôn liên kết với T bằng 2 liên kết hiđrô; G luôn liên kết với X (C) bằng 3 liên kết hiđrô.',
          score10Secret:
            'Bẫy đề thi: Nhầm sang RNA (ARN) vốn có U thay cho T!',
        },
      ],
    },
  },
];

export function loadCachedExams(): CachedExamEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_EXAMS);
    const parsed: CachedExamEntry[] = raw ? JSON.parse(raw) : [];
    const existingIds = new Set((Array.isArray(parsed) ? parsed : []).map((e) => e.id));
    const merged = Array.isArray(parsed) ? [...parsed] : [];
    for (const starter of STARTER_OFFLINE_EXAMS) {
      if (!existingIds.has(starter.id)) {
        merged.push(starter);
      }
    }
    return merged.sort((a, b) => b.cachedAt - a.cachedAt);
  } catch {
    return [...STARTER_OFFLINE_EXAMS];
  }
}

export function saveCachedExam(entry: Omit<CachedExamEntry, 'id' | 'cachedAt'> & { id?: string }): CachedExamEntry[] {
  const current = loadCachedExams();
  const normalizedTitle = (entry.exam.title || '').trim().toLowerCase();
  const existingIdx = current.findIndex(
    (item) =>
      (entry.id && item.id === entry.id) ||
      (item.exam.title.trim().toLowerCase() === normalizedTitle &&
        item.grade === entry.grade &&
        item.subjectId === entry.subjectId)
  );

  const nextEntry: CachedExamEntry = {
    id: entry.id || (existingIdx >= 0 ? current[existingIdx].id : `cached-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    grade: entry.grade,
    subjectId: entry.subjectId,
    subjectName: entry.subjectName,
    examType: entry.examType,
    topic: entry.topic,
    cachedAt: Date.now(),
    source: entry.source,
    bestScore: existingIdx >= 0 ? current[existingIdx].bestScore : undefined,
    attemptCount: existingIdx >= 0 ? current[existingIdx].attemptCount : 0,
    exam: entry.exam,
  };

  const filtered = current.filter((_, idx) => idx !== existingIdx);
  const updated = [nextEntry, ...filtered].slice(0, MAX_CACHED_EXAMS);
  try {
    localStorage.setItem(STORAGE_KEY_OFFLINE_EXAMS, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function deleteCachedExam(id: string): CachedExamEntry[] {
  const current = loadCachedExams();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_OFFLINE_EXAMS, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function updateCachedExamResult(examTitle: string, score: number): CachedExamEntry[] {
  const current = loadCachedExams();
  const normalizedTitle = (examTitle || '').trim().toLowerCase();
  let changed = false;
  const updated = current.map((item) => {
    if (item.exam.title.trim().toLowerCase() === normalizedTitle) {
      changed = true;
      return {
        ...item,
        attemptCount: (item.attemptCount || 0) + 1,
        bestScore: typeof item.bestScore === 'number' ? Math.max(item.bestScore, score) : score,
      };
    }
    return item;
  });

  if (changed) {
    try {
      localStorage.setItem(STORAGE_KEY_OFFLINE_EXAMS, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

export function buildOfflineMixedQuiz(options: {
  cachedExams: CachedExamEntry[];
  subjectId?: string;
  subjectName?: string;
  grade?: GradeLevel;
  numQuestions?: number;
}): { exam: ExamData; matchedSubjectOnly: boolean } | null {
  const { cachedExams, subjectId, subjectName, grade, numQuestions = 5 } = options;
  if (!cachedExams.length) return null;

  // Prefer questions matching current subject & grade, then same subject, then all cached questions
  const exactMatches = cachedExams.filter(
    (c) => (!subjectId || c.subjectId === subjectId) && (!grade || c.grade === grade)
  );
  const subjectMatches = cachedExams.filter((c) => !subjectId || c.subjectId === subjectId);

  const sourcePool =
    exactMatches.length > 0
      ? exactMatches
      : subjectMatches.length > 0
      ? subjectMatches
      : cachedExams;

  const matchedSubjectOnly = subjectMatches.length > 0;

  const seenTexts = new Set<string>();
  const collected: ExamQuestion[] = [];

  for (const entry of sourcePool) {
    for (const q of entry.exam.questions || []) {
      const key = (q.questionText || '').trim().toLowerCase();
      if (key && !seenTexts.has(key)) {
        seenTexts.add(key);
        collected.push(q);
      }
    }
  }

  // If fewer than requested in same subject, supplement from other cached exams if available
  if (collected.length < numQuestions && sourcePool !== cachedExams) {
    for (const entry of cachedExams) {
      for (const q of entry.exam.questions || []) {
        const key = (q.questionText || '').trim().toLowerCase();
        if (key && !seenTexts.has(key)) {
          seenTexts.add(key);
          collected.push(q);
        }
      }
    }
  }

  if (collected.length === 0) return null;

  // Fisher-Yates shuffle
  const shuffled = [...collected];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const picked = shuffled.slice(0, Math.min(numQuestions, shuffled.length)).map((q, idx) => ({
    ...q,
    id: idx + 1,
  }));

  return {
    matchedSubjectOnly,
    exam: {
      title: `Đề Luyện Offline Tổng Hợp (${matchedSubjectOnly && subjectName ? subjectName : 'Đa Môn'} · ${picked.length} câu)`,
      durationMinutes: Math.max(5, picked.length * 2),
      instructions:
        'Đề thi được tổng hợp tự động từ kho câu hỏi đã lưu gần đây trên thiết bị, hoạt động hoàn toàn không cần kết nối Internet.',
      questions: picked,
    },
  };
}

export function loadPendingHonorRoll(): PendingHonorRollSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_HONOR_QUEUE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function queuePendingHonorRoll(
  payload: PendingHonorRollSubmission['payload']
): PendingHonorRollSubmission[] {
  const current = loadPendingHonorRoll();
  const next: PendingHonorRollSubmission = {
    id: `honor-offline-${Date.now()}`,
    payload,
    createdAt: Date.now(),
  };
  const updated = [next, ...current].slice(0, 10);
  try {
    localStorage.setItem(STORAGE_KEY_OFFLINE_HONOR_QUEUE, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function removePendingHonorRoll(id: string): PendingHonorRollSubmission[] {
  const current = loadPendingHonorRoll();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_OFFLINE_HONOR_QUEUE, JSON.stringify(updated));
  } catch {}
  return updated;
}
