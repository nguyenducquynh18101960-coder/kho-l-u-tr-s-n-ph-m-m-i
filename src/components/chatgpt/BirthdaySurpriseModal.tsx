import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Gift,
  Heart,
  Award,
  Star,
  Cake,
  Share2,
  Check,
  Flame,
  Volume2,
  Trophy,
} from 'lucide-react';
import { celebrationEngine, launchCanvasFireworks, launchGoldenStarBurst } from '../../utils/confettiFireworks';
import { soundEffects } from '../../utils/soundEffects';

interface BirthdaySurpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
  userDob?: string;
  isTeacher?: boolean;
  isDark: boolean;
  onClaimBirthdayReward?: () => void;
}

export const BirthdaySurpriseModal: React.FC<BirthdaySurpriseModalProps> = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  userDob,
  isTeacher = false,
  isDark,
  onClaimBirthdayReward,
}) => {
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [claimedReward, setClaimedReward] = useState(false);
  const [copiedWish, setCopiedWish] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCandlesBlown(false);
      // Play celebratory sound & fireworks
      soundEffects.playMissionComplete();
      celebrationEngine.launchConfetti(80);
      launchCanvasFireworks(3500);
      launchGoldenStarBurst();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBlowCandles = () => {
    setCandlesBlown(true);
    soundEffects.playBadgeUnlocked();
    celebrationEngine.launchConfetti(100);
    launchGoldenStarBurst();
  };

  const handleClaim = () => {
    setClaimedReward(true);
    soundEffects.playMissionComplete();
    celebrationEngine.launchConfetti(60);
    if (onClaimBirthdayReward) {
      onClaimBirthdayReward();
    }
    // Also save in localStorage that birthday gift for this year is claimed
    try {
      const year = new Date().getFullYear();
      localStorage.setItem(`max10_birthday_claimed_${year}`, 'true');
    } catch (e) {}
  };

  const formattedDob = userDob
    ? (() => {
        try {
          const parts = userDob.split('-');
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
          return userDob;
        } catch {
          return userDob;
        }
      })()
    : 'Hôm nay';

  const defaultWish = isTeacher
    ? `Kính chúc Thầy/Cô ${userName} một ngày sinh nhật ngập tràn niềm vui, dồi dào sức khỏe, luôn tươi trẻ và luôn là người truyền lửa tri thức vĩ đại cho các thế hệ học trò!`
    : `Chúc mừng sinh nhật bạn học ${userName}! Bước sang tuổi mới luôn chăm ngoan, tự tin, học giỏi và chinh phục trọn vẹn điểm 10 mọi bài kiểm tra cùng Max10 AI!`;

  const handleCopyWish = () => {
    navigator.clipboard?.writeText(defaultWish);
    setCopiedWish(true);
    setTimeout(() => setCopiedWish(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative transition-all border text-center overflow-hidden ${
          isDark
            ? 'bg-gradient-to-b from-[#1a1528] via-[#121624] to-[#0d101a] text-white border-amber-500/30 shadow-amber-500/20'
            : 'bg-gradient-to-b from-amber-50/95 via-rose-50/70 to-white text-slate-900 border-amber-300 shadow-amber-300/40'
        }`}
      >
        {/* Glow ambient background lights */}
        <div className="absolute -top-20 -left-20 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Floating Birthday Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
          <span>BẤT NGỜ SINH NHẬT TỪ MAX10 AI</span>
          <Sparkles className="w-3.5 h-3.5" />
        </div>

        {/* Birthday Cake & Candles Interactive Animation */}
        <div className="relative my-3 flex flex-col items-center justify-center">
          <div className="relative">
            {/* User Avatar with Birthday Hat & Glow */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1 bg-gradient-to-tr from-amber-400 via-rose-500 to-yellow-300 shadow-xl shadow-amber-500/30 mx-auto relative group">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full object-cover rounded-[22px]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-[22px] bg-slate-900 text-white flex items-center justify-center font-black text-2xl">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
              )}
              {/* Party Hat Emoji */}
              <span className="absolute -top-4 -right-3 text-3xl sm:text-4xl drop-shadow-md select-none transform rotate-12 animate-pulse">
                🥳
              </span>
              {/* Crown for teacher or student */}
              <span className="absolute -bottom-2 -left-2 text-2xl drop-shadow-md select-none">
                👑
              </span>
            </div>
          </div>

          {/* Interactive Cake */}
          <div className="mt-4 p-3 rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-xs border border-amber-500/30 max-w-xs w-full">
            <div className="text-4xl sm:text-5xl my-1 select-none transition-transform duration-300 hover:scale-110">
              {candlesBlown ? '🎂✨' : '🎂🕯️🕯️🕯️'}
            </div>
            <p className="text-[11px] font-bold text-amber-500 dark:text-amber-400 mt-1">
              {candlesBlown
                ? 'Nến đã tắt! Những điều ước của bạn đã bay đến các vì sao! 🌟'
                : 'Bấm nút dưới để thổi nến và nhận quà sinh nhật nhé!'}
            </p>
            {!candlesBlown ? (
              <button
                type="button"
                onClick={handleBlowCandles}
                className="mt-2 py-1.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
              >
                <span>💨 Thổi nến ước nguyện</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-bold mt-1">
                <Check className="w-3.5 h-3.5" /> Đã thổi nến thành công
              </span>
            )}
          </div>
        </div>

        {/* Headline greeting */}
        <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-2 text-slate-900 dark:text-white leading-tight">
          🎉 Chúc Mừng Sinh Nhật{' '}
          <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 bg-clip-text text-transparent">
            {isTeacher ? `Thầy/Cô ${userName}` : `Bạn học ${userName}`}
          </span>
          ! 🎂
        </h2>

        {userDob && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">
            Ngày sinh: {formattedDob} 🎈
          </p>
        )}

        {/* Personalized heartfelt message card */}
        <div
          className={`mt-4 p-4 rounded-2xl border text-left text-xs leading-relaxed ${
            isDark
              ? 'bg-zinc-900/80 border-amber-500/20 text-zinc-200'
              : 'bg-white/90 border-amber-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 font-black text-xs text-amber-600 dark:text-amber-400">
            <Heart className="w-4 h-4 fill-current text-rose-500" />
            <span>Lời chúc từ Gia Sư Điểm 10 Max10 AI &amp; Toàn bộ lớp học:</span>
          </div>
          <p className="italic font-medium">"{defaultWish}"</p>
        </div>

        {/* Exclusive Birthday Rewards Box */}
        <div
          className={`mt-4 p-4 rounded-2xl border ${
            isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-100/70 border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-black text-xs text-amber-700 dark:text-amber-300">
              <Gift className="w-4 h-4 text-amber-500" />
              <span>Hộp quà sinh nhật đặc biệt dành riêng cho bạn:</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
              ĐỘC QUYỀN
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-left">
            <div
              className={`p-2 rounded-xl border ${
                isDark ? 'bg-black/20 border-white/10' : 'bg-white border-amber-200 shadow-2xs'
              }`}
            >
              <div className="text-lg">⭐</div>
              <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 mt-0.5">+500 XP</p>
              <p className="text-[9px] text-slate-500 dark:text-zinc-400">Điểm danh dự</p>
            </div>

            <div
              className={`p-2 rounded-xl border ${
                isDark ? 'bg-black/20 border-white/10' : 'bg-white border-amber-200 shadow-2xs'
              }`}
            >
              <div className="text-lg">🎖️</div>
              <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 mt-0.5">Huy Hiệu VIP</p>
              <p className="text-[9px] text-slate-500 dark:text-zinc-400">Ngôi Sao Sinh Nhật</p>
            </div>

            <div
              className={`p-2 rounded-xl border ${
                isDark ? 'bg-black/20 border-white/10' : 'bg-white border-amber-200 shadow-2xs'
              }`}
            >
              <div className="text-lg">👑</div>
              <p className="text-[11px] font-black text-yellow-600 dark:text-yellow-400 mt-0.5">Viền Hoàng Gia</p>
              <p className="text-[9px] text-slate-500 dark:text-zinc-400">Hiệu ứng lấp lánh</p>
            </div>
          </div>

          {/* Claim Button */}
          <div className="mt-3">
            {claimedReward ? (
              <div className="py-2.5 px-4 rounded-xl bg-emerald-600/20 border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Đã Nhận Quà Sinh Nhật! Chúc bạn ngày mới rực rỡ!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaim}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Gift className="w-4 h-4" />
                <span>Mở Hộp Quà &amp; Nhận +500 XP Ngay 🚀</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-5">
          <button
            type="button"
            onClick={handleCopyWish}
            className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              copiedWish
                ? 'bg-emerald-600 text-white border-emerald-600'
                : isDark
                ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {copiedWish ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedWish ? 'Đã sao chép lời chúc!' : 'Sao chép lời chúc'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
          >
            Vào Bàn Học Điểm 10 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
