import React from 'react';
import { Target, CheckCircle2, Sparkles, Trophy, Flame, Gamepad2, ArrowRight } from 'lucide-react';
import { DailyMission } from '../../data/dailyMissions';

interface DailyMissionCardProps {
  mission: DailyMission;
  isDark: boolean;
  onOpenMiniGame?: () => void;
  className?: string;
}

export const DailyMissionCard: React.FC<DailyMissionCardProps> = ({
  mission,
  isDark,
  onOpenMiniGame,
  className = '',
}) => {
  const progressPercent = Math.min(100, Math.round((mission.currentInteractions / mission.targetInteractions) * 100));

  return (
    <div
      className={`w-full rounded-2xl p-3.5 sm:p-4 border transition-all relative overflow-hidden shadow-sm ${
        mission.isCompleted
          ? isDark
            ? 'bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-teal-950/40 border-emerald-500/40'
            : 'bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-emerald-300'
          : isDark
          ? 'bg-gradient-to-r from-zinc-900/90 via-[#181d29] to-zinc-900/90 border-white/10'
          : 'bg-gradient-to-r from-white via-amber-50/40 to-slate-50 border-slate-200/90'
      } ${className}`}
    >
      {/* Decorative ambient flare */}
      {mission.isCompleted && (
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        {/* Left Side: Icon & Mission Info */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              mission.isCompleted
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white animate-bounce'
                : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white'
            }`}
          >
            {mission.isCompleted ? (
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Target className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-amber-500" />
                <span>Nhiệm vụ hôm nay</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                Mục tiêu: {mission.targetInteractions} tương tác
              </span>
              {mission.isCompleted && (
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  <span>ĐÃ HOÀN THÀNH</span>
                </span>
              )}
            </div>

            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-1 leading-snug">
              {mission.title}
            </h4>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              {mission.description}
            </p>
          </div>
        </div>

        {/* Right Side: Progress Bar, Reward & Action */}
        <div className="w-full sm:w-auto shrink-0 flex flex-col sm:items-end gap-1.5 pt-1 sm:pt-0">
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full text-xs">
            <span className="font-extrabold text-slate-700 dark:text-zinc-200">
              Tiến độ: <span className={mission.isCompleted ? 'text-emerald-500' : 'text-amber-500'}>{mission.currentInteractions}</span>/{mission.targetInteractions}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-[11px] flex items-center gap-1 border border-amber-500/20">
              <Trophy className="w-3 h-3" />
              <span>+{mission.xpReward} XP</span>
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full sm:w-44 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                mission.isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* If completed, prompt mini-game right away! */}
          {mission.isCompleted && onOpenMiniGame && (
            <button
              type="button"
              onClick={onOpenMiniGame}
              className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Chơi Mini Game Vinh Dự (+100 XP)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default DailyMissionCard;
