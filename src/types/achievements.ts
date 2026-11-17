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
  completedAssignments?: number;
  totalStudyMinutes?: number;
}

export const STORAGE_KEY_STUDENT_ACHIEVEMENTS = 'max10_student_achievements_v4';
export const STORAGE_KEY_STUDENT_STREAK = 'max10_student_streak_v4';

export const MAX_LEVEL = 2412;

export function formatLevelLabel(level: number): string {
  return level >= MAX_LEVEL ? `${MAX_LEVEL} (MAX)` : `${level}`;
}

function getTitleForLevel(level: number): string {
  if (level >= MAX_LEVEL) return 'Đỉnh Cao Tối Thượng 2412 (MAX)';
  if (level >= 1800) return 'Chí Tôn Điểm 10';
  if (level >= 1000) return 'Huyền Thoại Học Tập';
  if (level >= 500) return 'Đại Cao Thủ Toàn Năng';
  if (level >= 250) return 'Bậc Thầy Tri Thức';
  if (level >= 100) return 'Kỳ Tài Học Đường';
  if (level >= 50) return 'Siêu Sao Điểm 10';
  if (level >= 20) return 'Ngôi Sao Sáng Giá';
  if (level >= 7) return 'Học Bá Xuất Sắc';
  if (level === 6) return 'Thủ Khoa Toàn Năng';
  if (level === 5) return 'Bậc Thầy Chinh Phục Điểm 10';
  if (level === 4) return 'Cao Thủ Môn Học';
  if (level === 3) return 'Bảng Vàng Tập Sự';
  if (level === 2) return 'Chiến Binh Chăm Chỉ';
  return 'Tân Học Sinh Điểm 10';
}

export function calculateLevel(xp: number): {
  level: number;
  title: string;
  nextLevelXp: number;
  currentLevelXp: number;
  isMaxLevel: boolean;
} {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));

  const earlyLevels = [
    { level: 1, minXp: 0, nextXp: 100 },
    { level: 2, minXp: 100, nextXp: 250 },
    { level: 3, minXp: 250, nextXp: 500 },
    { level: 4, minXp: 500, nextXp: 800 },
    { level: 5, minXp: 800, nextXp: 1200 },
  ];

  for (let i = earlyLevels.length - 1; i >= 0; i--) {
    if (safeXp < 1200 && safeXp >= earlyLevels[i].minXp) {
      const lv = earlyLevels[i];
      return {
        level: lv.level,
        title: getTitleForLevel(lv.level),
        nextLevelXp: lv.nextXp,
        currentLevelXp: lv.minXp,
        isMaxLevel: false,
      };
    }
  }

  // From Level 6 up to MAX_LEVEL (2412): +400 XP per level so every activity levels up smoothly
  const BASE_LV6_XP = 1200;
  const XP_PER_LEVEL = 400;
  const computedLevel = Math.min(
    MAX_LEVEL,
    6 + Math.floor((safeXp - BASE_LV6_XP) / XP_PER_LEVEL)
  );

  const currentLevelXp = BASE_LV6_XP + (computedLevel - 6) * XP_PER_LEVEL;
  const isMaxLevel = computedLevel >= MAX_LEVEL;
  const nextLevelXp = isMaxLevel ? currentLevelXp : currentLevelXp + XP_PER_LEVEL;

  return {
    level: computedLevel,
    title: getTitleForLevel(computedLevel),
    nextLevelXp,
    currentLevelXp,
    isMaxLevel,
  };
}
