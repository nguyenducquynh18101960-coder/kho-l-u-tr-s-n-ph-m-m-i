import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  Pin,
  Calendar,
  Zap,
  Star,
  ChevronRight,
  BookOpen,
  Filter,
  ArrowRight,
  HelpCircle,
  Share2,
  RefreshCw,
  Gift,
} from 'lucide-react';
import {
  StudentBadge,
  StudentAchievementStats,
  BadgeCategory,
  BadgeTier,
  calculateLevel,
} from '../types/achievements';
import {
  loadStudentAchievements,
  saveStudentAchievements,
  getTodayDateString,
} from '../data/initialAchievements';
import { GlobalXpLeaderboard } from './chatgpt/GlobalXpLeaderboard';
import { ClassroomLeaderboard } from './chatgpt/ClassroomLeaderboard';
import { soundEffects } from '../utils/soundEffects';
import {
  celebrationEngine,
  launchGoldenStarBurst,
  launchCanvasFireworks,
} from '../utils/confettiFireworks';

interface AchievementsProps {
  isDark: boolean;
  userName?: string;
  userAvatar?: string;
  onNavigateToTab?: (tab: 'chat' | 'exam' | 'mindmap' | 'grade' | 'tips' | 'group') => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const Achievements: React.FC<AchievementsProps> = ({
  isDark,
  userName = 'Bạn học',
  userAvatar,
  onNavigateToTab,
  onClose,
  isModal = false,
}) => {
  const [stats, setStats] = useState<StudentAchievementStats>(() => loadStudentAchievements());
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('all');
  const [selectedBadge, setSelectedBadge] = useState<StudentBadge | null>(null);
  const [claimToast, setClaimToast] = useState<{ message: string; xp: number } | null>(null);
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'classroom' | 'badges' | 'leaderboard'>('classroom');

  // Listen for updates from other tabs/components
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setStats(e.detail);
      }
    };
    window.addEventListener('max10_achievements_updated', handleUpdate);
    return () => window.removeEventListener('max10_achievements_updated', handleUpdate);
  }, []);

  // Check if today is in checkInHistory
  useEffect(() => {
    const today = getTodayDateString();
    setHasCheckedInToday(stats.streak.checkInHistory.includes(today));
  }, [stats]);

  // Handle Daily Check-in action to build Streak
  const handleDailyCheckIn = () => {
    const today = getTodayDateString();
    if (stats.streak.checkInHistory.includes(today)) {
      setClaimToast({ message: 'Bạn đã điểm danh duy trì chuỗi hôm nay rồi! Tiếp tục phát huy nhé!', xp: 0 });
      setTimeout(() => setClaimToast(null), 3000);
      return;
    }

    const newStreak = stats.streak.currentStreak + 1;
    const newLongest = Math.max(newStreak, stats.streak.longestStreak);
    const updatedHistory = [...stats.streak.checkInHistory, today];
    const bonusXp = 50;

    // Check if streak badges should unlock
    const updatedBadges = stats.badges.map((b) => {
      if (b.category === 'streak') {
        const nextCurrent = Math.min(newStreak, b.target);
        const unlocked = nextCurrent >= b.target;
        return {
          ...b,
          current: nextCurrent,
          isUnlocked: unlocked || b.isUnlocked,
          unlockedAt: unlocked && !b.unlockedAt ? today : b.unlockedAt,
        };
      }
      return b;
    });

    const newTotalXp = stats.totalXp + bonusXp;
    const levelData = calculateLevel(newTotalXp);

    const newStats: StudentAchievementStats = {
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
        checkInHistory: updatedHistory,
      },
      badges: updatedBadges,
    };

    setStats(newStats);
    saveStudentAchievements(newStats);
    setHasCheckedInToday(true);
    soundEffects.playCheckInReward();
    celebrationEngine.launchConfetti(50);
    setClaimToast({ message: `🔥 Điểm danh thành công! Chuỗi ngày tăng lên ${newStreak} ngày! (+${bonusXp} XP)`, xp: bonusXp });
    setTimeout(() => setClaimToast(null), 4000);
  };

  // Claim XP reward for unlocked badge
  const handleClaimBadgeReward = (badgeId: string) => {
    const targetBadge = stats.badges.find((b) => b.id === badgeId);
    if (!targetBadge || !targetBadge.isUnlocked || targetBadge.isClaimed) return;

    const newTotalXp = stats.totalXp + targetBadge.xpReward;
    const levelData = calculateLevel(newTotalXp);

    const updatedBadges = stats.badges.map((b) => {
      if (b.id === badgeId) {
        return { ...b, isClaimed: true };
      }
      return b;
    });

    const newStats: StudentAchievementStats = {
      ...stats,
      totalXp: newTotalXp,
      level: levelData.level,
      levelTitle: levelData.title,
      nextLevelXp: levelData.nextLevelXp,
      badges: updatedBadges,
    };

    setStats(newStats);
    saveStudentAchievements(newStats);
    soundEffects.playBadgeUnlocked();
    launchGoldenStarBurst();
    launchCanvasFireworks(2800);
    setClaimToast({ message: `🎉 Nhận thưởng huy hiệu "${targetBadge.title}"!`, xp: targetBadge.xpReward });
    setTimeout(() => setClaimToast(null), 4000);
  };

  // Toggle pinning badge to profile
  const handleTogglePinBadge = (badgeId: string) => {
    const isCurrentlyPinned = stats.pinnedBadgeIds.includes(badgeId);
    let newPinnedIds: string[];

    if (isCurrentlyPinned) {
      newPinnedIds = stats.pinnedBadgeIds.filter((id) => id !== badgeId);
    } else {
      if (stats.pinnedBadgeIds.length >= 3) {
        // Replace oldest or cap at 3
        newPinnedIds = [...stats.pinnedBadgeIds.slice(1), badgeId];
      } else {
        newPinnedIds = [...stats.pinnedBadgeIds, badgeId];
      }
    }

    const updatedBadges = stats.badges.map((b) => ({
      ...b,
      isPinnedToProfile: newPinnedIds.includes(b.id),
    }));

    const newStats: StudentAchievementStats = {
      ...stats,
      pinnedBadgeIds: newPinnedIds,
      badges: updatedBadges,
    };

    setStats(newStats);
    saveStudentAchievements(newStats);
  };

  // Filtered badges
  const filteredBadges = stats.badges.filter((b) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'streak') return b.category === 'streak';
    if (selectedCategory === 'mastery') return b.category === 'mastery';
    if (selectedCategory === 'study') return b.category === 'study';
    if (selectedCategory === 'special') return b.isUnlocked; // 'special' or unlocked filter
    return true;
  });

  const unlockedCount = stats.badges.filter((b) => b.isUnlocked).length;
  const totalBadgesCount = stats.badges.length;
  const progressPercent = Math.round((unlockedCount / totalBadgesCount) * 100);

  // Level progress math
  const levelInfo = calculateLevel(stats.totalXp);
  const xpCurrentTier = stats.totalXp - levelInfo.currentLevelXp;
  const xpTierRange = levelInfo.nextLevelXp - levelInfo.currentLevelXp;
  const xpPercent = Math.min(100, Math.round((xpCurrentTier / xpTierRange) * 100));

  // Past 7 days streak history display
  const past7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return {
      date: iso,
      dayName: dayNames[d.getDay()],
      dayNum: d.getDate(),
      isActive: stats.streak.checkInHistory.includes(iso),
      isToday: i === 6,
    };
  });

  return (
    <div className={`w-full h-full overflow-y-auto ${isModal ? 'p-2 sm:p-4' : 'p-4 sm:p-6 lg:p-8'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Floating XP / Reward Toast */}
        {claimToast && (
          <div className="fixed top-6 right-6 z-[999999] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-2xl border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              <div>
                <p className="font-extrabold text-sm">{claimToast.message}</p>
                {claimToast.xp > 0 && (
                  <p className="text-xs text-emerald-100 font-semibold">+{claimToast.xp} Điểm danh dự (XP)</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TOP HERO: Level & Streak Master Header */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 overflow-hidden border shadow-xl transition-all ${
            isDark
              ? 'bg-gradient-to-br from-[#121927] via-[#0f1522] to-[#181f33] border-white/10 text-white'
              : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 border-slate-200/90 text-slate-900 shadow-slate-200/60'
          }`}
        >
          {/* Ambient background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: User Identity, Level & XP progress */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5 flex-1 min-w-0">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-amber-400 via-emerald-500 to-teal-400 shadow-lg">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">
                      {userName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-md border-2 border-white dark:border-slate-900 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>Lv.{stats.level}</span>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate">{userName}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {stats.levelTitle}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
                  Tổng điểm danh dự:{' '}
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {stats.totalXp.toLocaleString()} XP
                  </span>{' '}
                  · Cần{' '}
                  <span className="font-bold text-amber-500">
                    {(levelInfo.nextLevelXp - stats.totalXp).toLocaleString()} XP
                  </span>{' '}
                  để lên Cấp {stats.level + 1}
                </p>

                {/* Level XP Progress Bar */}
                <div className="w-full max-w-md">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>Tiến độ Cấp {stats.level}</span>
                    <span>{xpPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 10-Day Streak Highlight Card & Daily Check-in */}
            <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Streak Card */}
              <div
                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm'
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                    <Flame className="w-7 h-7 fill-current animate-pulse" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black tracking-tight">{stats.streak.currentStreak} Ngày</span>
                    <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 uppercase">
                      Chuỗi học
                    </span>
                  </div>
                  <p className="text-xs opacity-80 mt-0.5">
                    Kỷ lục chuỗi cao nhất: <strong>{stats.streak.longestStreak} ngày</strong>
                  </p>
                </div>
              </div>

              {/* Daily Check-in Button */}
              <button
                type="button"
                onClick={handleDailyCheckIn}
                className={`px-5 py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                  hasCheckedInToday
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white hover:brightness-110 shadow-amber-500/30 animate-bounce'
                }`}
                title="Bấm để điểm danh học tập hôm nay và tích lũy chuỗi ngày liên tiếp"
              >
                {hasCheckedInToday ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã Điểm Danh Hôm Nay</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 fill-current" />
                    <span>Điểm Danh Nhận Chuỗi (+50 XP)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 7-Day Activity Visual Row */}
          <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>Nhật ký 7 ngày gần nhất:</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {past7Days.map((day) => (
                <div
                  key={day.date}
                  className={`flex flex-col items-center justify-center w-9 h-11 sm:w-11 sm:h-13 rounded-xl border text-xs font-bold transition-all ${
                    day.isActive
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-500/30'
                      : day.isToday
                      ? 'bg-amber-500/20 text-amber-500 border-amber-500/50'
                      : isDark
                      ? 'bg-white/5 text-zinc-500 border-white/5'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                  title={`${day.date}: ${day.isActive ? 'Đã học' : 'Chưa điểm danh'}`}
                >
                  <span className="text-[10px] uppercase opacity-75">{day.dayName}</span>
                  <span className="text-xs font-black">{day.dayNum}</span>
                  {day.isActive && <CheckCircle2 className="w-3 h-3 mt-0.5 fill-current" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Switcher: Classroom Leaderboard vs Badges vs Global Leaderboard */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl neu-pressed max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => setViewMode('classroom')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'classroom'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <span>🏫 Bảng Xếp Hạng Lớp Học</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('badges')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'badges'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Tủ Huy Hiệu ({unlockedCount}/{totalBadgesCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('leaderboard')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Toàn Quốc (Top 10)</span>
          </button>
        </div>

        {viewMode === 'classroom' ? (
          <ClassroomLeaderboard
            currentStats={stats}
            userName={userName}
            userAvatar={userAvatar}
            isDark={isDark}
            onNavigateToTab={onNavigateToTab}
          />
        ) : viewMode === 'leaderboard' ? (
          <GlobalXpLeaderboard
            currentStats={stats}
            userName={userName}
            isDark={isDark}
            onOpenMiniGame={() => {
              if (onClose) onClose();
              if (onNavigateToTab) onNavigateToTab('exam');
            }}
          />
        ) : (
          <>
            {/* PINNED BADGES SHOWCASE (Displayed in their profile) */}
            <div
              className={`rounded-3xl p-5 sm:p-6 border transition-all ${
                isDark ? 'bg-[#0f1420] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
              }`}
            >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-base sm:text-lg flex items-center gap-2">
                  <span>Huy hiệu Danh dự trên Hồ sơ của Bạn</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({stats.pinnedBadgeIds.length}/3 đã ghim)
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Các huy hiệu này xuất hiện cạnh tên học sinh trong thanh bên, khung chat và nhóm học tập.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              🏆 {unlockedCount}/{totalBadgesCount} Đã Chinh Phục ({progressPercent}%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {stats.pinnedBadgeIds.map((pinnedId) => {
              const b = stats.badges.find((item) => item.id === pinnedId);
              if (!b) return null;
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBadge(b)}
                  className={`relative p-4 rounded-2xl border cursor-pointer group transition-all hover:scale-[1.02] ${
                    isDark
                      ? 'bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-900 border-amber-500/30'
                      : 'bg-gradient-to-br from-amber-50/80 via-white to-slate-50 border-amber-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl shrink-0 group-hover:scale-110 transition-transform">
                      {b.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black tracking-wider text-amber-500">
                          {b.tier} tier
                        </span>
                        <Pin className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      </div>
                      <h3 className="font-extrabold text-sm truncate text-slate-900 dark:text-white mt-0.5">
                        {b.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-snug">
                        {b.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CATEGORY FILTER TABS & BADGES GRID */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🌟 Tất cả ({totalBadgesCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('streak')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedCategory === 'streak'
                    ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🔥 Chuỗi ngày (Streaks)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('mastery')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedCategory === 'mastery'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📐 Bậc thầy Môn học (Mastery)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('study')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedCategory === 'study'
                    ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🎯 Phương pháp & Kỹ năng
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('special')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedCategory === 'special'
                    ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🏆 Đã Đạt Được ({unlockedCount})
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-zinc-400">
              Bấm vào từng huy hiệu để xem chi tiết hoặc ghim lên hồ sơ cá nhân.
            </div>
          </div>

          {/* BADGES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => {
              const percent = Math.min(100, Math.round((badge.current / badge.target) * 100));
              const isPinned = stats.pinnedBadgeIds.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`rounded-2xl p-5 border cursor-pointer transition-all hover:shadow-lg relative overflow-hidden group ${
                    badge.isUnlocked
                      ? isDark
                        ? 'bg-[#111723] border-white/10 hover:border-emerald-500/50 text-white'
                        : 'bg-white border-slate-200 hover:border-emerald-400 text-slate-900 shadow-xs'
                      : isDark
                      ? 'bg-[#0c1018]/60 border-white/5 opacity-70 hover:opacity-100 text-zinc-300'
                      : 'bg-slate-50/80 border-slate-200/60 opacity-75 hover:opacity-100 text-slate-700'
                  }`}
                >
                  {/* Tier indicator pill */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        badge.tier === 'diamond'
                          ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
                          : badge.tier === 'gold'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          : badge.tier === 'silver'
                          ? 'bg-slate-400/10 text-slate-400 border-slate-400/30'
                          : 'bg-orange-500/10 text-orange-500 border-orange-500/30'
                      }`}
                    >
                      {badge.tier}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {badge.isUnlocked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePinBadge(badge.id);
                          }}
                          className={`p-1 rounded-lg text-xs transition-colors ${
                            isPinned
                              ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-white/10'
                          }`}
                          title={isPinned ? 'Bỏ ghim khỏi hồ sơ' : 'Ghim huy hiệu này lên hồ sơ'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                        </button>
                      )}
                      <span className="text-xs font-extrabold text-amber-500">+{badge.xpReward} XP</span>
                    </div>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110 ${
                        badge.isUnlocked
                          ? 'bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 shadow-xs'
                          : 'bg-slate-200/50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 grayscale'
                      }`}
                    >
                      {badge.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                        {badge.title}
                      </h3>
                      {badge.englishTitle && (
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                          {badge.englishTitle}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 mt-1 leading-snug">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-500 dark:text-zinc-400 text-[11px]">
                        Tiến độ: {badge.current} / {badge.target}
                      </span>
                      <span
                        className={`text-[11px] font-extrabold ${
                          badge.isUnlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {badge.isUnlocked ? 'Hoàn thành 100%' : `${percent}%`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          badge.isUnlocked
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-amber-500 to-orange-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Claim Button / Status Action */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    {badge.isUnlocked ? (
                      badge.isClaimed ? (
                        <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã đạt được ({badge.unlockedAt || 'Mới đạt'})</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaimBadgeReward(badge.id);
                          }}
                          className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Nhận thưởng +{badge.xpReward} XP</span>
                        </button>
                      )
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Lock className="w-3 h-3" />
                        <span>Chưa mở khóa</span>
                      </div>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    )}

    {/* BADGE DETAIL POPUP MODAL */}
        {selectedBadge && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className={`w-full max-w-md rounded-3xl p-6 shadow-2xl relative border ${
                isDark ? 'bg-[#111723] text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>

              <div className="text-center pt-2 pb-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-amber-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-4xl shadow-xl mb-3">
                  {selectedBadge.icon}
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  {selectedBadge.tier} Tier · {selectedBadge.category}
                </span>
                <h3 className="font-black text-xl mt-2 text-slate-900 dark:text-white">
                  {selectedBadge.title}
                </h3>
                {selectedBadge.englishTitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{selectedBadge.englishTitle}</p>
                )}
                <p className="text-xs text-slate-600 dark:text-zinc-300 mt-2 max-w-sm mx-auto leading-relaxed">
                  {selectedBadge.description}
                </p>
              </div>

              {/* Progress Detail */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-2 mb-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-zinc-400">Điều kiện đạt huy hiệu:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {selectedBadge.current} / {selectedBadge.target}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${Math.min(100, Math.round((selectedBadge.current / selectedBadge.target) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-zinc-400 pt-1">
                  <span>Phần thưởng:</span>
                  <span className="font-extrabold text-amber-500">+{selectedBadge.xpReward} XP Điểm danh dự</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selectedBadge.isUnlocked ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTogglePinBadge(selectedBadge.id)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        stats.pinnedBadgeIds.includes(selectedBadge.id)
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-white/20'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5 fill-current" />
                      <span>
                        {stats.pinnedBadgeIds.includes(selectedBadge.id)
                          ? 'Huy hiệu đang được ghim trên Hồ sơ (Bấm để gỡ)'
                          : 'Ghim huy hiệu này lên Hồ sơ cá nhân'}
                      </span>
                    </button>
                    {!selectedBadge.isClaimed && (
                      <button
                        type="button"
                        onClick={() => {
                          handleClaimBadgeReward(selectedBadge.id);
                          setSelectedBadge({ ...selectedBadge, isClaimed: true });
                        }}
                        className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Nhận phần thưởng +{selectedBadge.xpReward} XP</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs text-center font-medium">
                    💡 Hãy hoàn thành thêm {selectedBadge.target - selectedBadge.current} bài tập nữa để mở khóa huy hiệu danh giá này!
                  </div>
                )}

                {/* Shortcut to study area if requested */}
                {onNavigateToTab && selectedBadge.category === 'mastery' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBadge(null);
                      if (onClose) onClose();
                      onNavigateToTab('exam');
                    }}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Luyện đề &amp; Bài tập ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Achievements;
