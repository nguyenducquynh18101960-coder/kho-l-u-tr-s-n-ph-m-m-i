export const MAX_DAILY_QUESTIONS = 10;
export const STORAGE_KEY_QUESTION_QUOTA = 'max10_daily_question_quota_v2';
export const STORAGE_KEY_RESET_REQUESTS = 'max10_reset_requests_v1';

export interface QuestionQuotaStatus {
  used: number;
  remaining: number;
  max: number;
  isLocked: boolean;
  date: string;
  msUntilMidnight: number;
}

export function getTodayDateKey(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next 00:00:00
  return Math.max(0, midnight.getTime() - now.getTime());
}

export function getDailyQuestionQuota(isAdmin: boolean = false): QuestionQuotaStatus {
  const today = getTodayDateKey();
  let used = 0;

  try {
    if (typeof window !== 'undefined') {
      const savedStr = localStorage.getItem(STORAGE_KEY_QUESTION_QUOTA);
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (saved && saved.date === today && typeof saved.used === 'number') {
          used = saved.used;
        } else {
          // New day! Automatically resets to 0
          localStorage.setItem(
            STORAGE_KEY_QUESTION_QUOTA,
            JSON.stringify({ date: today, used: 0 })
          );
          used = 0;
        }
      } else {
        localStorage.setItem(
          STORAGE_KEY_QUESTION_QUOTA,
          JSON.stringify({ date: today, used: 0 })
        );
        used = 0;
      }
    }
  } catch (e) {
    console.error('Error reading daily question quota', e);
  }

  const remaining = Math.max(0, MAX_DAILY_QUESTIONS - used);
  const isLocked = !isAdmin && remaining <= 0;

  return {
    used,
    remaining: isAdmin ? MAX_DAILY_QUESTIONS : remaining,
    max: MAX_DAILY_QUESTIONS,
    isLocked,
    date: today,
    msUntilMidnight: getMsUntilMidnight(),
  };
}

export function useQuestionSlot(isAdmin: boolean = false): { success: boolean; remaining: number } {
  if (isAdmin) {
    return { success: true, remaining: MAX_DAILY_QUESTIONS };
  }

  const today = getTodayDateKey();
  const current = getDailyQuestionQuota(false);

  if (current.remaining <= 0) {
    return { success: false, remaining: 0 };
  }

  const newUsed = current.used + 1;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        STORAGE_KEY_QUESTION_QUOTA,
        JSON.stringify({ date: today, used: newUsed })
      );
      // Dispatch event to sync quota live across components
      window.dispatchEvent(
        new CustomEvent('max10_quota_updated', {
          detail: { used: newUsed, remaining: Math.max(0, MAX_DAILY_QUESTIONS - newUsed) },
        })
      );
    }
  } catch (e) {
    console.error('Error updating question slot', e);
  }

  return { success: true, remaining: Math.max(0, MAX_DAILY_QUESTIONS - newUsed) };
}

export function adminResetDailyQuota(): void {
  const today = getTodayDateKey();
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        STORAGE_KEY_QUESTION_QUOTA,
        JSON.stringify({ date: today, used: 0, adminResetAt: Date.now() })
      );
      window.dispatchEvent(
        new CustomEvent('max10_quota_updated', {
          detail: { used: 0, remaining: MAX_DAILY_QUESTIONS, adminReset: true },
        })
      );
    }
  } catch (e) {
    console.error('Error admin resetting quota', e);
  }
}

export function requestAdminReset(studentName: string): boolean {
  try {
    if (typeof window !== 'undefined') {
      const savedStr = localStorage.getItem(STORAGE_KEY_RESET_REQUESTS) || '[]';
      const requests = JSON.parse(savedStr);
      requests.push({
        id: 'req-' + Date.now(),
        studentName: studentName || 'Học sinh',
        timestamp: Date.now(),
        date: getTodayDateKey(),
      });
      localStorage.setItem(STORAGE_KEY_RESET_REQUESTS, JSON.stringify(requests));
      return true;
    }
  } catch (e) {
    console.error('Error requesting admin reset', e);
  }
  return false;
}

export function formatCountdown(ms: number): { hours: string; minutes: string; seconds: string; fullText: string } {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return {
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    fullText: `${pad(hours)} giờ : ${pad(minutes)} phút : ${pad(seconds)} giây`,
  };
}
