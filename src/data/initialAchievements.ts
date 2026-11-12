import {
  StudentBadge,
  StudentAchievementStats,
  STORAGE_KEY_STUDENT_ACHIEVEMENTS,
  calculateLevel,
} from '../types/achievements';
import { GradeLevel } from '../types';

export type { StudentAchievementStats };

export const INITIAL_BADGES: StudentBadge[] = [
  {
    id: 'badge-streak-10',
    title: 'Chiến thần Bền bỉ (10-day streak)',
    englishTitle: '10-Day Streak Master',
    description: 'Học tập liên tục trong 10 ngày liên tiếp không bỏ sót ngày nào.',
    icon: '🔥',
    tier: 'gold',
    category: 'streak',
    target: 10,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 500,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-master-algebra',
    title: 'Bậc thầy Đại số (Master of Algebra)',
    englishTitle: 'Master of Algebra',
    description: 'Học xong bài và chiến thắng Mini Game Đại số (Phương trình, Hệ PT, Bất đẳng thức).',
    icon: '📐',
    tier: 'gold',
    category: 'mastery',
    target: 10,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 600,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-streak-3',
    title: 'Khởi động Chăm chỉ (3-day streak)',
    englishTitle: '3-Day Starter Streak',
    description: 'Duy trì thói quen học tập trong 3 ngày liên tục.',
    icon: '⚡',
    tier: 'bronze',
    category: 'streak',
    target: 3,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 150,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-streak-7',
    title: 'Tuần lễ Quyết tâm (7-day streak)',
    englishTitle: '7-Day Dedicated Streak',
    description: 'Hoàn thành trọn vẹn 1 tuần 7 ngày học tập chăm chỉ.',
    icon: '🌟',
    tier: 'silver',
    category: 'streak',
    target: 7,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 300,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-streak-30',
    title: 'Huyền thoại Kỷ luật (30-day streak)',
    englishTitle: '30-Day Legend Streak',
    description: 'Chinh phục cột mốc 30 ngày kỷ luật thép cùng Max10 AI.',
    icon: '👑',
    tier: 'diamond',
    category: 'streak',
    target: 30,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 1500,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-viet-theorem',
    title: 'Chiến thần Vi-ét',
    englishTitle: 'Viète Theorem Champion',
    description: 'Nắm vững hệ thức Vi-ét và các dạng toán tìm m nâng cao qua Mini Game.',
    icon: '⚡',
    tier: 'silver',
    category: 'mastery',
    target: 5,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 450,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-literature-master',
    title: 'Văn hào Nghị luận',
    englishTitle: 'Master of Literary Analysis',
    description: 'Chấm điểm và hoàn thành 5 bài văn nghị luận xã hội và văn học.',
    icon: '✍️',
    tier: 'silver',
    category: 'mastery',
    target: 5,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 400,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-english-warrior',
    title: 'Chiến binh Tiếng Anh',
    englishTitle: 'English Grammar Warrior',
    description: 'Chiến thắng Mini Game trắc nghiệm ngữ pháp & từ vựng Tiếng Anh.',
    icon: '🇬🇧',
    tier: 'silver',
    category: 'mastery',
    target: 10,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 400,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-science-guru',
    title: 'Bách khoa Khoa học Tự nhiên',
    englishTitle: 'Natural Science Guru',
    description: 'Chinh phục bài toán thực tế kết hợp Vật lý, Hóa học và Sinh học.',
    icon: '🔬',
    tier: 'gold',
    category: 'mastery',
    target: 5,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 500,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-score-10',
    title: 'Thợ săn Điểm 10 Tuyệt đối',
    englishTitle: 'Perfect 10 Hunter',
    description: 'Đạt điểm 10 trọn vẹn trong Mini Game hoặc Bài thi tuyển sinh thử.',
    icon: '🎯',
    tier: 'diamond',
    category: 'special',
    target: 1,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 1000,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-trap-detector',
    title: 'Thám tử Soi Bẫy Đề',
    englishTitle: 'Exam Trap Detective',
    description: 'Khám phá và nhận diện 5 bẫy đề thi hay làm mất điểm oan.',
    icon: '🕵️',
    tier: 'bronze',
    category: 'study',
    target: 5,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 350,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-mindmap-architect',
    title: 'Kiến trúc sư Sơ đồ tư duy',
    englishTitle: 'Mindmap Architect',
    description: 'Tạo 3 bản đồ tư duy tổng kết kiến thức các chương học.',
    icon: '🗺️',
    tier: 'bronze',
    category: 'study',
    target: 3,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 350,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-night-owl',
    title: 'Cú đêm Học Giỏi',
    englishTitle: 'Night Owl Scholar',
    description: 'Học tập chăm chỉ vào khung giờ 21:00 - 23:00 trước kỳ thi.',
    icon: '🦉',
    tier: 'bronze',
    category: 'special',
    target: 3,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 250,
    isPinnedToProfile: false,
  },
  {
    id: 'badge-team-player',
    title: 'Đồng đội Điểm 10',
    englishTitle: 'Collaborative Learner',
    description: 'Trao đổi bài học và học tập cùng bạn bè trong Nhóm học tập.',
    icon: '🤝',
    tier: 'bronze',
    category: 'special',
    target: 5,
    current: 0,
    isUnlocked: false,
    isClaimed: false,
    xpReward: 300,
    isPinnedToProfile: false,
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function loadStudentAchievements(): StudentAchievementStats {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENT_ACHIEVEMENTS);
      if (saved) {
        const parsed: StudentAchievementStats = JSON.parse(saved);
        const existingIds = new Set(parsed.badges.map((b) => b.id));
        const mergedBadges = [
          ...parsed.badges,
          ...INITIAL_BADGES.filter((b) => !existingIds.has(b.id)),
        ];

        const levelData = calculateLevel(parsed.totalXp || 0);

        return {
          ...parsed,
          badges: mergedBadges,
          level: levelData.level,
          levelTitle: levelData.title,
          nextLevelXp: levelData.nextLevelXp,
        };
      }
    }
  } catch (e) {
    console.error('Error loading student achievements', e);
  }

  // Clean initial state: Starts at 0 badges until earned via study and mini-games!
  const defaultXp = 0;
  const levelInfo = calculateLevel(defaultXp);

  return {
    totalXp: defaultXp,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    nextLevelXp: levelInfo.nextLevelXp,
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      totalDaysActive: 0,
      checkInHistory: [],
    },
    badges: INITIAL_BADGES,
    pinnedBadgeIds: [],
    solvedMathProblems: 0,
    solvedAlgebraProblems: 0,
    gradedEssays: 0,
    completedExams: 0,
    mindmapsCreated: 0,
    trapsDiscovered: 0,
    questionsAsked: 0,
    groupChatsSent: 0,
  };
}

export function saveStudentAchievements(stats: StudentAchievementStats): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STUDENT_ACHIEVEMENTS, JSON.stringify(stats));
      window.dispatchEvent(new CustomEvent('max10_achievements_updated', { detail: stats }));
    }
  } catch (e) {
    console.error('Error saving student achievements', e);
  }
}

// USER REQUIREMENT: "bao giờ học xong rồi chơi mini game mới có huy hiệu đạt được"
export function awardMiniGameAchievement(gameData: {
  score: number;
  grade: GradeLevel;
  subjectTitle?: string;
  correctCount: number;
}): { newlyUnlockedBadges: StudentBadge[]; bonusXp: number } {
  const stats = loadStudentAchievements();
  const today = getTodayDateString();
  const newlyUnlocked: StudentBadge[] = [];
  // +100 XP vinh dự cho học sinh khi vượt qua câu hỏi Mini Game
  let earnedXp = 100 + Math.round(Math.max(0, gameData.score) * 10);

  // 1. Advance daily streak when playing mini-game
  let newStreak = stats.streak.currentStreak;
  let newCheckIns = [...stats.streak.checkInHistory];
  if (!newCheckIns.includes(today)) {
    newStreak += 1;
    newCheckIns.push(today);
  }
  const newLongest = Math.max(newStreak, stats.streak.longestStreak);

  // 2. Process Badges
  const updatedBadges = stats.badges.map((b) => {
    let nextCurrent = b.current;
    let shouldUnlock = b.isUnlocked;

    // Streak Badges
    if (b.id === 'badge-streak-3') {
      nextCurrent = Math.min(b.target, newStreak);
      if (nextCurrent >= b.target && !b.isUnlocked) shouldUnlock = true;
    } else if (b.id === 'badge-streak-7') {
      nextCurrent = Math.min(b.target, newStreak);
      if (nextCurrent >= b.target && !b.isUnlocked) shouldUnlock = true;
    } else if (b.id === 'badge-streak-10') {
      nextCurrent = Math.min(b.target, newStreak);
      if (nextCurrent >= b.target && !b.isUnlocked) shouldUnlock = true;
    } else if (b.id === 'badge-streak-30') {
      nextCurrent = Math.min(b.target, newStreak);
      if (nextCurrent >= b.target && !b.isUnlocked) shouldUnlock = true;
    }

    // Master of Algebra: Earned when studying Math and scoring in Mini Game
    if (b.id === 'badge-master-algebra') {
      nextCurrent = Math.min(b.target, b.current + Math.max(1, Math.floor(gameData.correctCount / 2)));
      if (nextCurrent >= b.target || gameData.score >= 8.5) {
        nextCurrent = b.target;
        shouldUnlock = true;
      }
    }

    // Viète Theorem Champion
    if (b.id === 'badge-viet-theorem') {
      nextCurrent = Math.min(b.target, b.current + 1);
      if (gameData.score >= 8.0) {
        nextCurrent = b.target;
        shouldUnlock = true;
      }
    }

    // Perfect 10 Hunter: If student scores 10 in mini-game
    if (b.id === 'badge-score-10' && gameData.score >= 9.8) {
      nextCurrent = 1;
      shouldUnlock = true;
    }

    // English Warrior
    if (b.id === 'badge-english-warrior' && gameData.subjectTitle?.toLowerCase().includes('anh')) {
      nextCurrent = Math.min(b.target, b.current + 2);
      if (nextCurrent >= b.target || gameData.score >= 8.5) shouldUnlock = true;
    }

    // Natural Science Guru
    if (b.id === 'badge-science-guru' && (gameData.subjectTitle?.toLowerCase().includes('khoa học') || gameData.subjectTitle?.toLowerCase().includes('khtn'))) {
      nextCurrent = Math.min(b.target, b.current + 2);
      if (nextCurrent >= b.target || gameData.score >= 8.5) shouldUnlock = true;
    }

    const wasUnlocked = b.isUnlocked;
    const isNowUnlocked = shouldUnlock || wasUnlocked;

    if (isNowUnlocked && !wasUnlocked) {
      newlyUnlocked.push({ ...b, isUnlocked: true, unlockedAt: today });
      earnedXp += b.xpReward;
    }

    return {
      ...b,
      current: nextCurrent,
      isUnlocked: isNowUnlocked,
      unlockedAt: isNowUnlocked && !b.unlockedAt ? today : b.unlockedAt,
    };
  });

  // Pin newly unlocked badges to profile if pinned badges count < 3
  const newPinnedIds = [...stats.pinnedBadgeIds];
  newlyUnlocked.forEach((b) => {
    if (!newPinnedIds.includes(b.id) && newPinnedIds.length < 3) {
      newPinnedIds.push(b.id);
    }
  });

  const newTotalXp = stats.totalXp + earnedXp;
  const levelData = calculateLevel(newTotalXp);

  const updatedStats: StudentAchievementStats = {
    ...stats,
    totalXp: newTotalXp,
    level: levelData.level,
    levelTitle: levelData.title,
    nextLevelXp: levelData.nextLevelXp,
    streak: {
      ...stats.streak,
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
      totalDaysActive: stats.streak.totalDaysActive + 1,
      checkInHistory: newCheckIns,
    },
    badges: updatedBadges,
    pinnedBadgeIds: newPinnedIds,
  };

  saveStudentAchievements(updatedStats);
  return { newlyUnlockedBadges: newlyUnlocked, bonusXp: earnedXp };
}

export function awardStudentActivity(activity: {
  type: 'solve_algebra' | 'solve_math' | 'perfect_10' | 'complete_exam' | 'ask_question' | 'grade_essay' | 'create_mindmap';
  score?: number;
  count?: number;
}): void {
  try {
    const stats = loadStudentAchievements();
    const count = activity.count || 1;
    let earnedXp = 0;
    const today = getTodayDateString();

    let updatedBadges = [...stats.badges];

    if (activity.type === 'solve_algebra' || activity.type === 'solve_math') {
      stats.solvedAlgebraProblems += count;
      stats.solvedMathProblems += count;
      earnedXp += 25 * count;
    }

    if (activity.type === 'perfect_10' || (activity.score && activity.score === 10)) {
      earnedXp += 100;
      updatedBadges = updatedBadges.map((b) => {
        if (b.id === 'badge-score-10') {
          return {
            ...b,
            current: 1,
            isUnlocked: true,
            unlockedAt: b.unlockedAt || today,
          };
        }
        return b;
      });
    }

    const newTotalXp = stats.totalXp + earnedXp;
    const levelData = calculateLevel(newTotalXp);

    const updatedStats: StudentAchievementStats = {
      ...stats,
      totalXp: newTotalXp,
      level: levelData.level,
      levelTitle: levelData.title,
      nextLevelXp: levelData.nextLevelXp,
      badges: updatedBadges,
    };

    saveStudentAchievements(updatedStats);
  } catch (e) {
    console.error('Error awarding student activity', e);
  }
}

/**
 * Check if the student has checked in today
 */
export function checkIfCheckedInToday(): boolean {
  try {
    const stats = loadStudentAchievements();
    const today = getTodayDateString();
    return stats.streak.checkInHistory.includes(today);
  } catch {
    return false;
  }
}

/**
 * Perform daily check-in streak: awards +50 XP for the first login of each day
 */
export function performDailyCheckIn(): {
  alreadyCheckedIn: boolean;
  xpEarned: number;
  streak: number;
  newlyUnlockedBadges: StudentBadge[];
} {
  const stats = loadStudentAchievements();
  const today = getTodayDateString();
  const newlyUnlockedBadges: StudentBadge[] = [];

  if (stats.streak.checkInHistory.includes(today)) {
    return {
      alreadyCheckedIn: true,
      xpEarned: 0,
      streak: stats.streak.currentStreak,
      newlyUnlockedBadges: [],
    };
  }

  // Calculate streak continuity
  let newStreak = 1;
  if (stats.streak.lastActiveDate) {
    const lastDate = new Date(stats.streak.lastActiveDate);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      newStreak = stats.streak.currentStreak + 1;
    } else {
      newStreak = 1; // Missed more than 1 day
    }
  }

  const newLongest = Math.max(newStreak, stats.streak.longestStreak);
  const newCheckIns = [...stats.streak.checkInHistory, today];
  const earnedXp = 50; // +50 XP for first login of the day

  // Check streak badges
  const updatedBadges = stats.badges.map((b) => {
    let nextCurrent = b.current;
    let shouldUnlock = b.isUnlocked;

    if (b.id === 'badge-streak-3') {
      nextCurrent = Math.min(b.target, newStreak);
      if (nextCurrent >= b.target && !b.isUnlocked) shouldUnlock = true;
    } else if (b.id === 'badge-streak-7') {
      nextCurrent = Math.min(b.target, newStreak);
      if (nextCurrent >= b.target && !b.isUnlocked) shouldUnlock = true;
    } else if (b.id === 'badge-streak-10') {
      nextCurrent = Math.min(b.target, newStreak);
      if (nextCurrent >= b.target && !b.isUnlocked) shouldUnlock = true;
    } else if (b.id === 'badge-streak-30') {
      nextCurrent = Math.min(b.target, newStreak);
      if (nextCurrent >= b.target && !b.isUnlocked) shouldUnlock = true;
    }

    if (shouldUnlock && !b.isUnlocked) {
      newlyUnlockedBadges.push({ ...b, isUnlocked: true, unlockedAt: today });
    }

    return {
      ...b,
      current: nextCurrent,
      isUnlocked: shouldUnlock,
      unlockedAt: shouldUnlock && !b.unlockedAt ? today : b.unlockedAt,
    };
  });

  const newTotalXp = stats.totalXp + earnedXp;
  const levelData = calculateLevel(newTotalXp);

  const updatedStats: StudentAchievementStats = {
    ...stats,
    totalXp: newTotalXp,
    level: levelData.level,
    levelTitle: levelData.title,
    nextLevelXp: levelData.nextLevelXp,
    streak: {
      ...stats.streak,
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
      totalDaysActive: stats.streak.totalDaysActive + 1,
      checkInHistory: newCheckIns,
    },
    badges: updatedBadges,
  };

  saveStudentAchievements(updatedStats);

  return {
    alreadyCheckedIn: false,
    xpEarned: earnedXp,
    streak: newStreak,
    newlyUnlockedBadges,
  };
}

