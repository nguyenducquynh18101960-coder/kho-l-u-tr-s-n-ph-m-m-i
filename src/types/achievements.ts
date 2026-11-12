export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';
export type BadgeCategory = 'all' | 'streak' | 'mastery' | 'study' | 'special';

export interface StudentBadge {
  id: string;
  title: string;
  englishTitle?: string;
  description: string;
  icon: string; // Emoji or icon identifier
  tier: BadgeTier;
  category: 'streak' | 'mastery' | 'study' | 'special';
  target: number;
  current: number;
  isUnlocked: boolean;
  isClaimed: boolean;
  unlockedAt?: string;
  xpReward: number;
  isPinnedToProfile?: boolean;
}

export interface StudentStreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalDaysActive: number;
  checkInHistory: string[]; // List of YYYY-MM-DD
}

export interface StudentAchievementStats {
  totalXp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  streak: StudentStreakData;
  badges: StudentBadge[];
  pinnedBadgeIds: string[];
  solvedMathProblems: number;
  solvedAlgebraProblems: number;
  gradedEssays: number;
  completedExams: number;
  mindmapsCreated: number;
  trapsDiscovered: number;
  questionsAsked: number;
  groupChatsSent: number;
}

export const STORAGE_KEY_STUDENT_ACHIEVEMENTS = 'max10_student_achievements_v4';
export const STORAGE_KEY_STUDENT_STREAK = 'max10_student_streak_v4';

export function calculateLevel(xp: number): { level: number; title: string; nextLevelXp: number; currentLevelXp: number } {
  const levels = [
    { level: 1, title: 'Tân Học Sinh Điểm 10', minXp: 0, nextXp: 200 },
    { level: 2, title: 'Chiến Binh Chăm Chỉ', minXp: 200, nextXp: 500 },
    { level: 3, title: 'Bảng Vàng Tập Sự', minXp: 500, nextXp: 1000 },
    { level: 4, title: 'Cao Thủ Môn Học', minXp: 1000, nextXp: 2000 },
    { level: 5, title: 'Bậc Thầy Chinh Phục Điểm 10', minXp: 2000, nextXp: 3500 },
    { level: 6, title: 'Thủ Khoa Toàn Năng', minXp: 3500, nextXp: 6000 },
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXp) {
      return {
        level: levels[i].level,
        title: levels[i].title,
        nextLevelXp: levels[i].nextXp,
        currentLevelXp: levels[i].minXp,
      };
    }
  }

  return {
    level: 1,
    title: 'Tân Học Sinh Điểm 10',
    nextLevelXp: 200,
    currentLevelXp: 0,
  };
}
