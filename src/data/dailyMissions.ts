/**
 * Daily Mission System for Max10 AI
 * Generates one specific, achievable learning goal each day.
 * Completed automatically when student finishes 10 interactions.
 */

import { awardStudentActivity } from './initialAchievements';

export interface DailyMission {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  targetInteractions: number; // 10 interactions
  currentInteractions: number;
  xpReward: number; // e.g. 150 XP
  isCompleted: boolean;
  rewardClaimed: boolean;
  tag: string;
}

const STORAGE_KEY_DAILY_MISSION = 'max10_daily_mission_v2';

const MISSION_TEMPLATES = [
  {
    title: 'Chinh phục 10 lượt hỏi bài & Vạch bẫy đề thi THCS',
    description: 'Thực hiện 10 lượt hỏi bài tập hoặc đề thi cùng Gia sư Max10 để làm chủ tư duy giải nhanh và nhận diện bẫy đề thi hay gặp.',
    tag: 'Tư Duy Điểm 10',
  },
  {
    title: 'Rèn luyện 10 tương tác chuyên sâu & Quét sạch lỗi sai',
    description: 'Hỏi 10 câu hỏi về các dạng bài trọng tâm, nhờ AI sửa lỗi diễn đạt và chuẩn hóa công thức toán học.',
    tag: 'Rèn Luyện',
  },
  {
    title: 'Đột phá 10 câu hỏi phân loại điểm 9-10 THCS',
    description: 'Cùng Gia sư phân tích 10 câu hỏi nâng cao, bài toán thực tế và mẹo phản xạ làm bài thi vào 10.',
    tag: 'Săn Điểm 10',
  },
  {
    title: 'Làm chủ 10 lượt ôn tập toàn diện cùng Gia sư Max10',
    description: 'Tận dụng trọn vẹn 10 lượt tương tác mỗi ngày để ôn tập lý thuyết, giải bài khó và tạo sơ đồ tư duy.',
    tag: 'Kiến Thức Vững',
  },
  {
    title: 'Bứt phá 10 lượt tương tác tư duy logic & Phản xạ phòng thi',
    description: 'Hoàn thành 10 câu hỏi tương tác để rèn luyện tốc độ làm bài và phản xạ tư duy không bị trừ điểm oan.',
    tag: 'Phản Xạ Nhanh',
  },
  {
    title: 'Chinh phục 10 lượt hỏi bài tổng hợp liên môn THCS',
    description: 'Hỏi bài các môn Toán, Văn, Anh, KHTN để chuẩn bị tinh thần tự tin nhất cho các bài kiểm tra tuần này.',
    tag: 'Liên Môn',
  },
  {
    title: 'Về đích 10 lượt hỏi bài & Chơi Mini Game săn Top 1 Bảng Vàng',
    description: 'Hoàn thành 10 tương tác hỏi bài trong ngày để sẵn sàng thử sức Mini Game vinh danh Top 1 Bảng Vàng Danh Dự.',
    tag: 'Vinh Danh Top 1',
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDailyMission(usedQuestionsCount: number = 0): DailyMission {
  const today = getTodayDateString();
  let saved: DailyMission | null = null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_MISSION);
    if (raw) {
      saved = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read daily mission', e);
  }

  // If saved mission exists and is for today, update progress
  if (saved && saved.date === today) {
    const current = Math.min(10, Math.max(saved.currentInteractions, usedQuestionsCount));
    const isCompleted = current >= 10;
    let rewardClaimed = saved.rewardClaimed;

    // Auto-claim reward once if just completed
    if (isCompleted && !rewardClaimed) {
      rewardClaimed = true;
      try {
        awardStudentActivity({
          type: 'complete_exam',
          count: 1,
        });
      } catch (err) {
        console.warn('Award mission xp error', err);
      }
    }

    const updated: DailyMission = {
      ...saved,
      currentInteractions: current,
      isCompleted,
      rewardClaimed,
    };

    try {
      localStorage.setItem(STORAGE_KEY_DAILY_MISSION, JSON.stringify(updated));
    } catch {}

    return updated;
  }

  // Generate new mission for today using day of the month as seed
  const dayNum = new Date().getDate();
  const template = MISSION_TEMPLATES[dayNum % MISSION_TEMPLATES.length];

  const current = Math.min(10, usedQuestionsCount);
  const isCompleted = current >= 10;

  const newMission: DailyMission = {
    id: `mission-${today}`,
    date: today,
    title: template.title,
    description: template.description,
    targetInteractions: 10,
    currentInteractions: current,
    xpReward: 150,
    isCompleted,
    rewardClaimed: isCompleted,
    tag: template.tag,
  };

  try {
    localStorage.setItem(STORAGE_KEY_DAILY_MISSION, JSON.stringify(newMission));
  } catch {}

  return newMission;
}
