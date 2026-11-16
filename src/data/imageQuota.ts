import { loadStudentAchievements, saveStudentAchievements } from './initialAchievements';
import { calculateLevel } from '../types/achievements';

export const FREE_DAILY_IMAGE_LIMIT = 5;
export const PLUS_DAILY_IMAGE_LIMIT = 25;
export const PREMIUM_DAILY_IMAGE_LIMIT = 100;
export const AVATAR_XP_COST = 50;

export interface DailyImageQuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  date: string;
  plan: string;
  role: string;
}

export function getPlanDailyImageLimit(
  plan: string = 'free',
  role: string = 'student',
  isAdmin: boolean = false
): number {
  if (isAdmin || role === 'admin') return 200;
  if (role === 'teacher') return PREMIUM_DAILY_IMAGE_LIMIT;
  if (plan === 'premium') return PREMIUM_DAILY_IMAGE_LIMIT;
  if (plan === 'plus') return PLUS_DAILY_IMAGE_LIMIT;
  return FREE_DAILY_IMAGE_LIMIT;
}

export async function fetchServerImageQuota(params: {
  userId: string;
  plan: string;
  role: string;
  isAdmin: boolean;
}): Promise<DailyImageQuotaStatus | null> {
  try {
    const query = new URLSearchParams({
      userId: params.userId,
      plan: params.plan,
      role: params.role,
      isAdmin: String(params.isAdmin),
    });
    const res = await fetch(`/api/image-quota?${query.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.quota) {
      return data.quota;
    }
  } catch (e) {
    console.warn('Could not sync server image quota:', e);
  }
  return null;
}

export function getAvatarXpBalance(): number {
  try {
    const stats = loadStudentAchievements();
    return stats.totalXp || 0;
  } catch {
    return 0;
  }
}

export function spendXpForCustomAvatar(cost: number = AVATAR_XP_COST): {
  success: boolean;
  remainingXp: number;
  usedFreeTrial: boolean;
} {
  try {
    const stats = loadStudentAchievements();
    if ((stats.totalXp || 0) >= cost) {
      const nextXp = stats.totalXp - cost;
      const levelData = calculateLevel(nextXp);
      saveStudentAchievements({
        ...stats,
        totalXp: nextXp,
        level: levelData.level,
        levelTitle: levelData.title,
        nextLevelXp: levelData.nextLevelXp,
      });
      return { success: true, remainingXp: nextXp, usedFreeTrial: false };
    }
    return { success: false, remainingXp: stats.totalXp || 0, usedFreeTrial: false };
  } catch {
    return { success: false, remainingXp: 0, usedFreeTrial: false };
  }
}
