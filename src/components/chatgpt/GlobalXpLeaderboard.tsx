import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Crown,
  Medal,
  Sparkles,
  TrendingUp,
  User,
  ArrowRight,
  Gamepad2,
  Calendar,
  Globe,
} from 'lucide-react';
import { StudentAchievementStats, loadStudentAchievements } from '../../data/initialAchievements';

interface GlobalXpLeaderboardProps {
  currentStats: StudentAchievementStats;
  userName: string;
  isDark: boolean;
  onOpenMiniGame?: () => void;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  school: string;
  grade: string;
  xp: number;
  level: number;
  streak: number;
  isCurrentUser?: boolean;
  avatar?: string;
  badgeCount: number;
}

export const GlobalXpLeaderboard: React.FC<GlobalXpLeaderboardProps> = ({
  currentStats,
  userName,
  isDark,
  onOpenMiniGame,
}) => {
  const [viewType, setViewType] = useState<'all_time' | 'weekly'>('weekly');
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Generate real-time ranked list including the current student
    const studentEntry: LeaderboardEntry = {
      id: 'current-user-entry',
      name: userName || 'Bạn học',
      school: 'THCS',
      grade: 'Lớp 9',
      xp: currentStats.totalXp,
      level: currentStats.level,
      streak: currentStats.streak.currentStreak,
      isCurrentUser: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName || 'Student')}`,
      badgeCount: currentStats.badges.filter((b) => b.isUnlocked).length,
    };

    // Load any real submitted student scores from honor roll or local storage
    let baseStudents: LeaderboardEntry[] = [];
    try {
      const savedHonor = localStorage.getItem('max10_real_leaderboard_students');
      if (savedHonor) {
        baseStudents = JSON.parse(savedHonor);
      }
    } catch {}

    // Combine current user with other real entries
    const combined = [...baseStudents.filter((s) => s.id !== studentEntry.id), studentEntry];

    // Sort by XP descending
    combined.sort((a, b) => b.xp - a.xp);

    // Limit to top 10 for weekly, or top 20 for all time
    setLeaderboardList(combined.slice(0, 10));
  }, [currentStats.totalXp, currentStats.level, currentStats.streak.currentStreak, userName, viewType]);

  const userRank = leaderboardList.findIndex((item) => item.isCurrentUser) + 1;

  return (
    <div className="space-y-4">
      {/* Top Toggle & Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
              {viewType === 'weekly' ? 'Bảng Xếp Hạng Tuần Này (Top 10 XP)' : 'Bảng Xếp Hạng XP Toàn Cầu'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Xếp hạng học sinh theo tổng điểm XP tích lũy từ hỏi bài, học tập &amp; Mini Game.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-zinc-800 self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => setViewType('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewType === 'weekly'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Top Tuần</span>
          </button>
          <button
            type="button"
            onClick={() => setViewType('all_time')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewType === 'all_time'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Toàn Cầu</span>
          </button>
        </div>
      </div>

      {/* HIGHLIGHT CURRENT STUDENT'S OWN RANK */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border-2 border-emerald-500/40 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
            #{userRank > 0 ? userRank : 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                Vị trí của bạn: {userName || 'Bạn học'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Cấp {currentStats.level}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              <span>Điểm XP: <strong className="text-amber-500 font-bold">{currentStats.totalXp} XP</strong></span>
              <span>•</span>
              <span>Chuỗi: <strong className="text-orange-500 font-bold">{currentStats.streak.currentStreak} ngày</strong></span>
            </div>
          </div>
        </div>

        {onOpenMiniGame && (
          <button
            type="button"
            onClick={onOpenMiniGame}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cày thêm XP</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* LEADERBOARD LIST */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
        {leaderboardList.map((entry, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;
          const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

          return (
            <div
              key={entry.id}
              className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                entry.isCurrentUser
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/25 ring-2 ring-emerald-500/40'
                  : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
              }`}
            >
              {/* Rank + Avatar + Name */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                    rank === 1
                      ? 'bg-amber-400 text-slate-950 font-bold text-sm'
                      : rank === 2
                      ? 'bg-slate-300 dark:bg-zinc-600 text-slate-900 dark:text-white'
                      : rank === 3
                      ? 'bg-amber-700/80 text-white'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {isTop3 ? medalEmoji : rank}
                </div>

                <img
                  src={entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.name}`}
                  alt={entry.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0 bg-white"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {entry.name}
                    </span>
                    {entry.isCurrentUser && (
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-white font-black text-[9px]">
                        BẠN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                    <span>{entry.school}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-orange-500">
                      <Flame className="w-3 h-3 fill-orange-500" />
                      <span>{entry.streak} ngày</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* XP Points */}
              <div className="text-right shrink-0">
                <div className="font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                  {entry.xp} XP
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Cấp {entry.level}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default GlobalXpLeaderboard;
