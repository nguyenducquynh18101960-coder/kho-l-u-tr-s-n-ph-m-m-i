import React, { useState, useEffect } from 'react';
import {
  Clock,
  Lock,
  Flame,
  Gamepad2,
  BellRing,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  getMsUntilMidnight,
  formatCountdown,
  adminResetDailyQuota,
  requestAdminReset,
  MAX_DAILY_QUESTIONS,
} from '../../data/questionQuota';

interface QuotaLimitCountdownCardProps {
  isDark: boolean;
  isAdmin?: boolean;
  userName?: string;
  onOpenMiniGame?: () => void;
  onOpenMathChallenge?: () => void;
  onResetSuccess?: () => void;
}

export const QuotaLimitCountdownCard: React.FC<QuotaLimitCountdownCardProps> = ({
  isDark,
  isAdmin = false,
  userName = 'Bạn học',
  onOpenMiniGame,
  onOpenMathChallenge,
  onResetSuccess,
}) => {
  const [msRemaining, setMsRemaining] = useState<number>(() => getMsUntilMidnight());
  const [requestSent, setRequestSent] = useState<boolean>(false);
  const [resetAlert, setResetAlert] = useState<string | null>(null);

  // Live timer tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      const nextMs = getMsUntilMidnight();
      setMsRemaining(nextMs);
      if (nextMs <= 0 && onResetSuccess) {
        onResetSuccess();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onResetSuccess]);

  const timeFormatted = formatCountdown(msRemaining);

  const handleRequestReset = () => {
    requestAdminReset(userName);
    setRequestSent(true);
    setResetAlert('Đã gửi yêu cầu cấp thêm lượt hỏi tới Quản trị viên Mạc Khánh Duy!');
    setTimeout(() => setResetAlert(null), 4000);
  };

  const handleAdminResetNow = () => {
    adminResetDailyQuota();
    setResetAlert('Quản trị viên đã reset thành công 10 lượt hỏi!');
    if (onResetSuccess) {
      setTimeout(() => onResetSuccess(), 600);
    }
  };

  return (
    <div
      className={`w-full max-w-3xl mx-auto rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden text-center transition-all animate-in fade-in zoom-in-95 duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-[#161b26] via-[#10141e] to-[#1c2233] border-amber-500/30 text-white'
          : 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/70 border-amber-300/80 text-slate-900 shadow-amber-500/10'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Lock Badge */}
      <div className="relative inline-flex items-center justify-center mb-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/30 animate-pulse">
          <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <div className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-400 font-black text-[10px] uppercase border border-amber-500/40 shadow-sm flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Hết Lượt</span>
        </div>
      </div>

      {/* Main Title & Status */}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight mb-2">
        Hết Thời Gian Nhắn &amp; Đã Dùng Hết{' '}
        <span className="text-amber-500 dark:text-amber-400">{MAX_DAILY_QUESTIONS}/{MAX_DAILY_QUESTIONS}</span> Lượt Hỏi Hôm Nay!
      </h2>

      <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-xl mx-auto leading-relaxed mb-6">
        Thanh hỏi bài đã tự động ẩn đi để bạn ôn tập lại kiến thức. Hệ thống đang tính giờ đếm ngược đến <strong>00:00:00 ngày mai</strong> để tự động mở khóa 10 lượt hỏi mới, hoặc bạn có thể chờ Quản trị viên duyệt reset.
      </p>

      {/* LIVE COUNTDOWN DISPLAY */}
      <div className="my-6 inline-block w-full max-w-lg">
        <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center justify-center gap-1.5">
          <Clock className="w-4 h-4 animate-spin" />
          <span>Thời Gian Đếm Ngược Tính Giờ Đến Ngày Mai</span>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* Hours */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col items-center justify-center shadow-md ${
              isDark ? 'bg-zinc-900/90 border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <span className="text-2xl sm:text-4xl font-black text-amber-500 font-mono tracking-tight">
              {timeFormatted.hours}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mt-1">Giờ</span>
          </div>

          {/* Minutes */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col items-center justify-center shadow-md ${
              isDark ? 'bg-zinc-900/90 border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <span className="text-2xl sm:text-4xl font-black text-amber-500 font-mono tracking-tight">
              {timeFormatted.minutes}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mt-1">Phút</span>
          </div>

          {/* Seconds */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col items-center justify-center shadow-md ${
              isDark ? 'bg-zinc-900/90 border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <span className="text-2xl sm:text-4xl font-black text-rose-500 font-mono tracking-tight animate-pulse">
              {timeFormatted.seconds}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mt-1">Giây</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-2">
          ⏳ Tự động cấp mới 10 lượt hỏi khi đồng hồ về 00:00:00
        </p>
      </div>

      {/* NOTIFICATION TOAST */}
      {resetAlert && (
        <div className="mb-4 text-center animate-in fade-in">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>{resetAlert}</span>
          </span>
        </div>
      )}

      {/* PROMINENT MINI GAME CALLOUT: +100 XP & TOP 1 BẢNG VÀNG THẬT */}
      {onOpenMiniGame && (
        <div className="my-5 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-indigo-500/20 border-2 border-amber-400/60 shadow-xl text-left max-w-xl mx-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <span className="text-xs sm:text-sm font-black uppercase text-amber-600 dark:text-amber-400">
                Thử Thách Vinh Dự Mini Game: Săn Top 1 Bảng Vàng
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black shadow-xs">
              +100 XP
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mb-3.5">
            Hết lượt hỏi bài nhưng bạn vẫn có thể chơi ngay <strong>Mini Game 10 câu hỏi trắc nghiệm THCS</strong>. Bảng Vàng đã được <strong>xóa sạch 100% tài khoản AI ảo</strong> — hoàn thành bài đạt điểm cao sẽ được <strong>tặng ngay +100 XP vinh dự</strong> và ghi danh thẳng lên <strong>Top 1 Bảng Vàng Danh Dự</strong>!
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onOpenMiniGame}
              className="flex-1 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white hover:brightness-110 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Gamepad2 className="w-5 h-5 animate-bounce" />
              <span>Mini Game THCS (+100 XP &amp; Lên Top)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onOpenMathChallenge && (
              <button
                type="button"
                onClick={onOpenMathChallenge}
                className="py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:brightness-110 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <span>📐 Thử Thách Toán Học (+50 XP)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ACTION BUTTONS & ADMIN RESET */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-xl mx-auto">
        {/* Request Admin Reset */}
        <button
          type="button"
          onClick={handleRequestReset}
          disabled={requestSent}
          className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer ${
            requestSent
              ? 'bg-slate-200 dark:bg-white/10 text-slate-400 border-transparent cursor-not-allowed'
              : isDark
              ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border-amber-500/30'
              : 'bg-white hover:bg-slate-100 text-amber-700 border-amber-300 shadow-sm'
          }`}
          title="Gửi tín hiệu xin cấp thêm lượt hỏi tới Admin Mạc Khánh Duy"
        >
          {requestSent ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Đã Gửi Yêu Cầu Chờ Admin Duyệt</span>
            </>
          ) : (
            <>
              <BellRing className="w-4 h-4 text-amber-500" />
              <span>Chờ Admin Reset / Gửi Yêu Cầu</span>
            </>
          )}
        </button>
      </div>

      {/* ADMIN PRIVILEGE BUTTON: Instant reset for Admin Mạc Khánh Duy */}
      {isAdmin && (
        <div className="mt-5 pt-4 border-t border-amber-500/20 max-w-md mx-auto">
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-2">
            👑 ĐẶC QUYỀN QUẢN TRỊ VIÊN MẠC KHÁNH DUY:
          </div>
          <button
            type="button"
            onClick={handleAdminResetNow}
            className="w-full py-2.5 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-slate-950 hover:brightness-110 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>[ADMIN] Khôi Phục &amp; Reset Ngay 10 Lượt Hỏi Bài</span>
          </button>
        </div>
      )}
    </div>
  );
};
export default QuotaLimitCountdownCard;
