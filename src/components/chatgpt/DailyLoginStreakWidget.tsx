import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Check, Gift } from 'lucide-react';
import {
  loadStudentAchievements,
  checkIfCheckedInToday,
  performDailyCheckIn,
} from '../../data/initialAchievements';
import { soundEffects } from '../../utils/soundEffects';
import { celebrationEngine } from '../../utils/confettiFireworks';

interface DailyLoginStreakWidgetProps {
  isDark: boolean;
  className?: string;
  onNavigateToAchievements?: () => void;
}

export const DailyLoginStreakWidget: React.FC<DailyLoginStreakWidgetProps> = ({
  isDark,
  className = '',
  onNavigateToAchievements,
}) => {
  const [streakCount, setStreakCount] = useState<number>(0);
  const [isCheckedInToday, setIsCheckedInToday] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [showFloatingBonus, setShowFloatingBonus] = useState<boolean>(false);
  const [floatingBonusText, setFloatingBonusText] = useState<string>('+50 XP');
  const [checkInHistory, setCheckInHistory] = useState<string[]>([]);

  const refreshStreakData = () => {
    try {
      const stats = loadStudentAchievements();
      setStreakCount(stats.streak.currentStreak || 0);
      setCheckInHistory(stats.streak.checkInHistory || []);
      setIsCheckedInToday(checkIfCheckedInToday());
    } catch (e) {
      console.warn('Failed to load streak stats', e);
    }
  };

  useEffect(() => {
    refreshStreakData();

    // Listen for cross-component achievements/streak updates
    const handleUpdate = () => {
      refreshStreakData();
    };

    window.addEventListener('max10_achievements_updated', handleUpdate);
    return () => {
      window.removeEventListener('max10_achievements_updated', handleUpdate);
    };
  }, []);

  const handleClaimDailyXp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCheckedInToday || isClaiming) return;

    setIsClaiming(true);

    try {
      const res = performDailyCheckIn();

      // Trigger pleasant Web Audio chime
      soundEffects.playCheckInReward();

      // Launch cheerful confetti celebration
      celebrationEngine.launchConfetti(2500);

      // Display floating +50 XP bonus animation
      setFloatingBonusText(`+${res.xpEarned || 50} XP`);
      setShowFloatingBonus(true);
      setStreakCount(res.streak);
      setIsCheckedInToday(true);

      setTimeout(() => {
        setShowFloatingBonus(false);
        setIsClaiming(false);
      }, 1600);
    } catch (err) {
      console.error('Check-in error', err);
      setIsClaiming(false);
    }
  };

  // Generate 7 dots for the last 7 days (including today)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const isToday = i === 6;
    const isCompleted = checkInHistory.includes(dateStr);
    return {
      dateStr,
      label: dayNames[d.getDay()],
      isToday,
      isCompleted,
    };
  });

  return (
    <div
      onClick={onNavigateToAchievements}
      className={`relative p-3 rounded-2xl border transition-all cursor-pointer group ${
        isDark
          ? 'bg-zinc-900/90 border-white/10 hover:border-amber-500/40 text-zinc-100 shadow-md'
          : 'bg-white border-slate-200 hover:border-amber-400 text-slate-800 shadow-xs'
      } ${className}`}
      title="Bấm để xem chi tiết Bảng Vàng & Huy hiệu chuyên cần"
    >
      {/* Floating XP Animation when claimed */}
      {showFloatingBonus && (
        <div className="absolute top-2 right-4 pointer-events-none z-50 flex items-center gap-1 animate-in fade-in zoom-in-50 duration-300">
          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-lg shadow-amber-500/50 flex items-center gap-1 animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            {floatingBonusText}
          </span>
        </div>
      )}

      {/* Header: Fire icon + Streak Day Count */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform ${
              isCheckedInToday
                ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm shadow-orange-500/30'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            } ${showFloatingBonus ? 'scale-125 transition-transform duration-300' : ''}`}
          >
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold text-slate-800 dark:text-zinc-200">
                Chuỗi chuyên cần
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                {streakCount} ngày
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-400">
              {isCheckedInToday
                ? 'Đã duy trì hôm nay 🔥'
                : 'Điểm danh ngay nhận +50 XP'}
            </p>
          </div>
        </div>

        {/* Small gift icon badge */}
        <div className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
          <Gift className="w-3 h-3" />
          <span>+50 XP</span>
        </div>
      </div>

      {/* 7-Day Mini Streak Track */}
      <div className="grid grid-cols-7 gap-1 mb-2.5 px-0.5">
        {last7Days.map((day, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center gap-1"
            title={`${day.label} (${day.dateStr}): ${day.isCompleted ? 'Đã học' : 'Chưa điểm danh'}`}
          >
            <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500">
              {day.label}
            </span>
            <div
              className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                day.isCompleted
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-2xs shadow-emerald-500/30 font-bold'
                  : day.isToday
                  ? 'border-2 border-dashed border-amber-500 text-amber-500 bg-amber-500/5'
                  : isDark
                  ? 'bg-zinc-800 text-zinc-600'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {day.isCompleted ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : (
                <span className="text-[9px] font-medium opacity-60">•</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Check-in Button with small animation */}
      {isCheckedInToday ? (
        <div className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1.5 select-none">
          <Check className="w-3.5 h-3.5" />
          <span>Đã điểm danh hôm nay (+50 XP)</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClaimDailyXp}
          disabled={isClaiming}
          className={`w-full py-1.5 px-3 rounded-xl font-bold text-[11px] text-white flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            isClaiming
              ? 'bg-amber-400 opacity-80 cursor-wait'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:scale-98 shadow-amber-500/25 animate-pulse'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>{isClaiming ? 'Đang nhận thưởng...' : 'Điểm danh nhận +50 XP'}</span>
        </button>
      )}
    </div>
  );
};
