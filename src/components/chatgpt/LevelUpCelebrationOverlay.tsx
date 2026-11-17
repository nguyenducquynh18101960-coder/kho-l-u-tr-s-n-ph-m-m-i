import React, { useEffect, useRef, useState } from 'react';
import { Crown, Sparkles, Star, Trophy, X } from 'lucide-react';
import { formatLevelLabel, MAX_LEVEL } from '../../types/achievements';
import {
  celebrateMilestone,
  launchCanvasFireworks,
  launchConfettiCannons,
  launchGoldenStarBurst,
} from '../../utils/confettiFireworks';
import { soundEffects } from '../../utils/soundEffects';

export interface LevelUpEventDetail {
  prevLevel: number;
  newLevel: number;
  title: string;
  totalXp: number;
  isMaxLevel: boolean;
  isMilestoneLevel?: boolean;
}

interface LevelUpCelebrationOverlayProps {
  userName?: string;
  isDark?: boolean;
  enabled?: boolean;
}

export const LevelUpCelebrationOverlay: React.FC<LevelUpCelebrationOverlayProps> = ({
  userName = 'Bạn học',
  isDark = false,
  enabled = true,
}) => {
  const [celebration, setCelebration] = useState<LevelUpEventDetail | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    if (!enabled) return;

    const handleLevelUp = (ev: Event) => {
      const detail = (ev as CustomEvent<LevelUpEventDetail>).detail;
      if (!detail || !detail.newLevel) return;

      clearTimers();
      setCelebration(detail);

      if (detail.isMaxLevel || detail.newLevel >= MAX_LEVEL) {
        // Grand celebration for reaching 2412 (MAX)
        celebrateMilestone();
        launchCanvasFireworks(6000);
        launchGoldenStarBurst();
        soundEffects.playMissionComplete();

        [700, 1500, 2400, 3400, 4500].forEach((ms) => {
          const burstTimer = window.setTimeout(() => {
            launchGoldenStarBurst();
            if (ms === 1500 || ms === 3400) {
              launchConfettiCannons();
            }
          }, ms);
          timersRef.current.push(burstTimer);
        });

        const soundTimer = window.setTimeout(() => {
          soundEffects.playBadgeUnlocked();
        }, 650);
        timersRef.current.push(soundTimer);

        const hideTimer = window.setTimeout(() => {
          setCelebration(null);
        }, 8500);
        timersRef.current.push(hideTimer);
      } else if (detail.isMilestoneLevel) {
        // Milestone level (Lv.5, Lv.10, Lv.20, Lv.100, ...)
        launchConfettiCannons();
        launchCanvasFireworks(3000);
        launchGoldenStarBurst();
        soundEffects.playMissionComplete();

        const hideTimer = window.setTimeout(() => {
          setCelebration(null);
        }, 4800);
        timersRef.current.push(hideTimer);
      } else {
        // Regular level-up halo + golden burst
        launchGoldenStarBurst();
        launchConfettiCannons();
        soundEffects.playBadgeUnlocked();

        const hideTimer = window.setTimeout(() => {
          setCelebration(null);
        }, 4000);
        timersRef.current.push(hideTimer);
      }
    };

    window.addEventListener('max10_level_up', handleLevelUp);
    return () => {
      window.removeEventListener('max10_level_up', handleLevelUp);
      clearTimers();
    };
  }, [enabled]);

  if (!enabled || !celebration) return null;

  const isMax = celebration.isMaxLevel || celebration.newLevel >= MAX_LEVEL;
  const levelLabel = formatLevelLabel(celebration.newLevel);

  const handleClose = () => {
    clearTimers();
    setCelebration(null);
  };

  // Grand Full-Screen Radiant Halo Celebration for 2412 (MAX)
  if (isMax) {
    return (
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        {/* Rotating Golden & Cyan Sunburst Halo Behind Card */}
        <div
          className="pointer-events-none absolute w-[540px] h-[540px] sm:w-[680px] sm:h-[680px] rounded-full opacity-45 animate-halo-rotate"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg 20deg, rgba(251,191,36,0.65) 30deg 45deg, transparent 55deg 85deg, rgba(34,211,238,0.55) 95deg 115deg, transparent 125deg 165deg, rgba(251,191,36,0.7) 175deg 195deg, transparent 205deg 245deg, rgba(16,185,129,0.55) 255deg 275deg, transparent 285deg 325deg, rgba(251,191,36,0.65) 335deg 350deg, transparent 360deg)',
            filter: 'blur(12px)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-lg rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-slate-950 via-[#1a1333] to-amber-950/90 p-7 sm:p-8 text-center text-white shadow-[0_0_70px_rgba(251,191,36,0.65)] animate-level-pop">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Đóng thông báo đạt cấp tối đa"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Radiant Halo Crown Emblem */}
          <div className="relative mx-auto w-28 h-28 flex items-center justify-center mb-4">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/50 via-yellow-300/40 to-cyan-400/50 blur-xl animate-halo-pulse"
              aria-hidden="true"
            />
            <div
              className="absolute inset-1 rounded-full border-2 border-dashed border-amber-300/80 animate-halo-rotate"
              aria-hidden="true"
            />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.9)]">
              <Crown className="w-11 h-11 stroke-[2.3]" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CHÚC MỪNG ĐẠT ĐỈNH CAO TỐI ĐA</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-white to-cyan-300 bg-clip-text text-transparent drop-shadow-md">
            CẤP {MAX_LEVEL} (MAX)
          </h2>

          <p className="mt-2 text-sm sm:text-base font-extrabold text-amber-200">
            {celebration.title}
          </p>

          <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
            Xuất sắc, <strong>{userName}</strong>! Bạn đã chinh phục cột mốc huyền thoại{' '}
            <strong className="text-amber-300">Level {MAX_LEVEL} (MAX)</strong> với{' '}
            <strong className="text-emerald-300">{celebration.totalXp.toLocaleString()} XP</strong>!
          </p>

          <button
            type="button"
            onClick={handleClose}
            className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 text-slate-950 font-black text-sm shadow-xl hover:brightness-105 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>Tuyệt vời! Tiếp tục</span>
          </button>
        </div>
      </div>
    );
  }

  // Standard & Milestone Level-Up Halo Toast/Banner (non-blocking background)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 sm:top-20 z-[100000] flex justify-center px-4">
      <div
        className={`pointer-events-auto relative overflow-hidden max-w-md w-full rounded-3xl border-2 p-4 sm:p-5 shadow-2xl animate-level-pop ${
          celebration.isMilestoneLevel
            ? 'border-amber-400 bg-gradient-to-r from-slate-950 via-indigo-950 to-amber-950 text-white shadow-[0_0_45px_rgba(251,191,36,0.5)]'
            : isDark
            ? 'border-emerald-400/70 bg-slate-900/95 text-white shadow-[0_0_32px_rgba(16,185,129,0.35)]'
            : 'border-amber-400 bg-white/95 text-slate-900 shadow-[0_12px_40px_rgba(245,158,11,0.3)]'
        }`}
      >
        {/* Rotating Radiant Halo Glow Inside Card */}
        <div
          className="pointer-events-none -top-16 -left-10 absolute w-44 h-44 rounded-full opacity-40 animate-halo-rotate"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg 40deg, rgba(251,191,36,0.75) 60deg 95deg, transparent 115deg 220deg, rgba(16,185,129,0.7) 245deg 280deg, transparent 300deg 360deg)',
            filter: 'blur(10px)',
          }}
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={handleClose}
          className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors cursor-pointer ${
            celebration.isMilestoneLevel || isDark
              ? 'text-white/70 hover:text-white hover:bg-white/10'
              : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
          }`}
          aria-label="Đóng thông báo lên cấp"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 flex items-center gap-3.5 pr-6">
          <div className="relative shrink-0 w-14 h-14 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full bg-amber-400/45 blur-md animate-halo-pulse"
              aria-hidden="true"
            />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Star className="w-6 h-6 fill-current" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>
                {celebration.isMilestoneLevel ? 'Cột mốc kinh nghiệm lớn!' : 'Thăng cấp thành công!'}
              </span>
            </div>

            <div className="text-base sm:text-lg font-black leading-tight">
              Cấp {celebration.prevLevel} → Cấp {levelLabel}
            </div>
            <div
              className={`text-xs font-bold mt-0.5 truncate ${
                celebration.isMilestoneLevel || isDark ? 'text-emerald-300' : 'text-emerald-700'
              }`}
            >
              {celebration.title} · {celebration.totalXp.toLocaleString()} XP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelUpCelebrationOverlay;
