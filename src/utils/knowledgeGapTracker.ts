export type AttemptSource = 'exam' | 'minigame' | 'duel' | 'ai_quiz';

export interface KnowledgeAttemptEntry {
  id: string;
  subject: string;
  topic: string;
  question: string;
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  isCorrect: boolean;
  source: AttemptSource;
  timestamp: number;
  mastered?: boolean;
}

export interface SubjectMasteryStat {
  subject: string;
  total: number;
  correct: number;
  wrong: number;
  unmasteredWrong: number;
  accuracy: number;
  status: 'weak' | 'average' | 'strong' | 'no_data';
  weakTopics: string[];
}

export interface RemediationPlanItem {
  id: string;
  subject: string;
  topic: string;
  wrongCount: number;
  priority: 'high' | 'medium' | 'low';
  durationMinutes: number;
  actionTitle: string;
  tutorPrompt: string;
}

const STORAGE_KEY_KNOWLEDGE_TRACKER = 'max10_knowledge_gaps_v1';

export const CORE_TRACKER_SUBJECTS = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'KHTN (Lý · Hóa · Sinh)',
  'Lịch sử & Địa lý',
  'Tin học',
  'GDCD',
] as const;

export function normalizeTrackerSubject(raw?: string): string {
  const s = (raw || '').trim().toLowerCase();
  if (!s) return 'Toán học';
  if (s.includes('toán') || s.includes('đại số') || s.includes('hình học') || s.includes('math')) {
    return 'Toán học';
  }
  if (s.includes('văn') || s.includes('nghị luận') || s.includes('tiếng việt') || s.includes('literature')) {
    return 'Ngữ văn';
  }
  if (s.includes('anh') || s.includes('english') || s.includes('giao tiếp')) {
    return 'Tiếng Anh';
  }
  if (
    s.includes('khtn') ||
    s.includes('khoa học') ||
    s.includes('lý') ||
    s.includes('vật lí') ||
    s.includes('hóa') ||
    s.includes('sinh') ||
    s.includes('physics') ||
    s.includes('chemistry')
  ) {
    if (s.includes('địa lý') || s.includes('địa lí')) return 'Lịch sử & Địa lý';
    return 'KHTN (Lý · Hóa · Sinh)';
  }
  if (s.includes('sử') || s.includes('địa') || s.includes('history') || s.includes('geography')) {
    return 'Lịch sử & Địa lý';
  }
  if (s.includes('tin') || s.includes('lập trình') || s.includes('coding')) {
    return 'Tin học';
  }
  if (s.includes('gdcd') || s.includes('công dân')) {
    return 'GDCD';
  }
  return 'Toán học';
}

function readRawAttempts(): KnowledgeAttemptEntry[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY_KNOWLEDGE_TRACKER);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRawAttempts(list: KnowledgeAttemptEntry[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_KNOWLEDGE_TRACKER, JSON.stringify(list.slice(0, 300)));
    window.dispatchEvent(new CustomEvent('max10_knowledge_gaps_updated'));
  } catch {}
}

export function recordAttemptResult(entry: {
  subject: string;
  topic?: string;
  question: string;
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  isCorrect: boolean;
  source: AttemptSource;
}): void {
  const cleanQuestion = String(entry.question || '').trim();
  if (!cleanQuestion) return;

  const subject = normalizeTrackerSubject(entry.subject);
  const topic = (entry.topic || entry.subject || subject).trim();
  const list = readRawAttempts();

  // Deduplicate rapid repeated submissions of the exact same question within 10s
  const now = Date.now();
  const isDuplicateRecent = list.some(
    (item) =>
      item.question === cleanQuestion &&
      item.isCorrect === entry.isCorrect &&
      now - item.timestamp < 10000
  );
  if (isDuplicateRecent) return;

  const nextEntry: KnowledgeAttemptEntry = {
    id: `gap-${now}-${Math.random().toString(36).slice(2, 7)}`,
    subject,
    topic,
    question: cleanQuestion.slice(0, 420),
    userAnswer: entry.userAnswer ? String(entry.userAnswer).slice(0, 220) : undefined,
    correctAnswer: entry.correctAnswer ? String(entry.correctAnswer).slice(0, 220) : undefined,
    explanation: entry.explanation ? String(entry.explanation).slice(0, 500) : undefined,
    isCorrect: Boolean(entry.isCorrect),
    source: entry.source,
    timestamp: now,
    mastered: false,
  };

  writeRawAttempts([nextEntry, ...list]);
}

export function loadAllAttempts(): KnowledgeAttemptEntry[] {
  return readRawAttempts().sort((a, b) => b.timestamp - a.timestamp);
}

export function loadKnowledgeGaps(includeMastered = false): KnowledgeAttemptEntry[] {
  return loadAllAttempts().filter(
    (item) => !item.isCorrect && (includeMastered || !item.mastered)
  );
}

export function markGapMastered(id: string): void {
  const list = readRawAttempts().map((item) =>
    item.id === id ? { ...item, mastered: true } : item
  );
  writeRawAttempts(list);
}

export function clearKnowledgeGaps(): void {
  writeRawAttempts([]);
}

export function getSubjectMasteryStats(): SubjectMasteryStat[] {
  const attempts = readRawAttempts();
  const subjectSet = new Set<string>([...CORE_TRACKER_SUBJECTS]);
  attempts.forEach((a) => subjectSet.add(normalizeTrackerSubject(a.subject)));

  return Array.from(subjectSet).map((subject) => {
    const items = attempts.filter((a) => normalizeTrackerSubject(a.subject) === subject);
    const total = items.length;
    const correct = items.filter((a) => a.isCorrect).length;
    const wrong = total - correct;
    const unmasteredWrongItems = items.filter((a) => !a.isCorrect && !a.mastered);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    let status: SubjectMasteryStat['status'] = 'no_data';
    if (total > 0) {
      if (accuracy >= 80 && unmasteredWrongItems.length <= 1) status = 'strong';
      else if (accuracy >= 55) status = 'average';
      else status = 'weak';
    }

    const topicCounts = new Map<string, number>();
    unmasteredWrongItems.forEach((w) => {
      const t = w.topic || subject;
      topicCounts.set(t, (topicCounts.get(t) || 0) + 1);
    });
    const weakTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    return {
      subject,
      total,
      correct,
      wrong,
      unmasteredWrong: unmasteredWrongItems.length,
      accuracy,
      status,
      weakTopics,
    };
  });
}

export function getDailyRemediationPlan(): RemediationPlanItem[] {
  const gaps = loadKnowledgeGaps(false);
  const grouped = new Map<
    string,
    { subject: string; topic: string; count: number; sampleQuestion: string }
  >();

  gaps.forEach((g) => {
    const key = `${g.subject}::${g.topic}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      grouped.set(key, {
        subject: g.subject,
        topic: g.topic || g.subject,
        count: 1,
        sampleQuestion: g.question,
      });
    }
  });

  const sorted = Array.from(grouped.values()).sort((a, b) => b.count - a.count);

  if (sorted.length === 0) {
    return [
      {
        id: 'plan-default-1',
        subject: 'Toán học',
        topic: 'Ôn tập tổng hợp kiến thức trọng tâm THCS',
        wrongCount: 0,
        priority: 'low',
        durationMinutes: 15,
        actionTitle: 'Luyện 5 câu hỏi nhanh cùng Gia sư AI 3D để đo năng lực',
        tutorPrompt:
          'Hãy kiểm tra giúp mình 5 câu hỏi trắc nghiệm Toán THCS ngắn từ dễ đến vừa để tìm lỗ hổng kiến thức nhé!',
      },
      {
        id: 'plan-default-2',
        subject: 'Tiếng Anh',
        topic: 'Ngữ pháp & Phản xạ giao tiếp',
        wrongCount: 0,
        priority: 'low',
        durationMinutes: 10,
        actionTitle: 'Luyện hỏi đáp nhanh bằng giọng nói Tiếng Anh',
        tutorPrompt:
          'Hãy hỏi mình từng câu ngắn về ngữ pháp Tiếng Anh THCS và sửa phát âm giúp mình nhé!',
      },
    ];
  }

  return sorted.slice(0, 5).map((item, index) => {
    const priority: RemediationPlanItem['priority'] =
      item.count >= 3 || index === 0 ? 'high' : item.count === 2 ? 'medium' : 'low';
    const durationMinutes = priority === 'high' ? 20 : priority === 'medium' ? 15 : 10;
    return {
      id: `plan-${index}-${item.subject}`,
      subject: item.subject,
      topic: item.topic,
      wrongCount: item.count,
      priority,
      durationMinutes,
      actionTitle: `Ôn bù ${item.subject}: ${item.topic} (${item.count} câu hay sai)`,
      tutorPrompt: `Mình hay làm sai phần "${item.topic}" môn ${item.subject} (ví dụ câu: "${item.sampleQuestion.slice(
        0,
        140
      )}"). Hãy giải thích ngắn gọn bẫy dễ sai, tóm tắt công thức lên bảng trắng và hỏi lại mình từng câu dễ đến vừa để lấp lỗ hổng này nhé!`,
    };
  });
}
