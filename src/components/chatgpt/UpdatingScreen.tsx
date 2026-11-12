import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Sparkles, ShieldCheck, Globe, Check, Lock, Unlock, ExternalLink } from 'lucide-react';
import { ADMIN_DEFAULT_PIN } from '../../types/auth';

interface UpdatingScreenProps {
  message?: string;
  publishedUrl?: string;
  onBypass?: () => void;
  onCheckStatus?: () => void;
  onAdminBypass?: () => void;
  isDark?: boolean;
}

export const UpdatingScreen: React.FC<UpdatingScreenProps> = ({
  message = 'Max10 AI đã cập nhật! Chỉ cần xuất bản là cập nhật ngay, tự động hoàn tất chỉ sau 60 giây (không phải chờ 1 tiếng và không phải quay lại vào ngày hôm sau)!',
  publishedUrl = 'https://max-ai-gia-s-i-m-10-thcs.ai.studio',
  onBypass,
  onCheckStatus,
  onAdminBypass,
  isDark = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');
  // User Requested: "cập nhật rồi chỉ cần xuất bản là cập nhật không phải chờ 1 tiếng và quay lại vào ngày hôm sau chỉ sau 60 giây thôi"
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((sec) => {
        if (sec <= 1) {
          // Auto reload when 60 seconds finish
          window.location.reload();
          return 0;
        }
        return sec - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCheckNow = () => {
    setChecking(true);
    if (onCheckStatus) {
      onCheckStatus();
    }
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = adminPinInput.trim();
    if (
      pin === '24122012@duy' ||
      pin === '24122012@' ||
      pin === ADMIN_DEFAULT_PIN ||
      pin.toLowerCase() === '24122012@duy'
    ) {
      localStorage.setItem('max10_is_owner_access', 'true');
      localStorage.setItem('max10_admin_email', 'mackhanhduy992012@gmail.com');
      sessionStorage.setItem('max10_bypass_update', 'true');
      sessionStorage.setItem('max10_master_security_verified', 'true');
      setShowAdminPinModal(false);
      if (onAdminBypass) {
        onAdminBypass();
      } else if (onBypass) {
        onBypass();
      } else {
        window.location.reload();
      }
    } else {
      setAdminPinError('Mã bảo mật / PIN quản trị không chính xác! Vui lòng nhập đúng mã bảo mật.');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none ${
        isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Background glowing effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg rounded-3xl border border-blue-500/30 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95">
        {/* Animated Brand Logo / Badge */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 animate-pulse">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md text-xs font-black">
            ⚡
          </div>
        </div>

        {/* Heading & Main User Notice */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>ĐÃ CẬP NHẬT • ĐANG TỰ ĐỘNG LÀM MỚI</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Xuất Bản Cập Nhật Thành Công
          </h2>

          {/* User's exact requested notice */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300/60 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 text-sm font-semibold leading-relaxed shadow-2xs">
            🎉 {message}
          </div>
        </div>

        {/* Live Countdown & Automatic Sync info: Exactly 60s */}
        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-xs space-y-2 text-left">
          <div className="flex items-center justify-between font-bold">
            <span className="text-slate-600 dark:text-zinc-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tự động làm mới trong:</span>
            </span>
            <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
              00:{String(secondsRemaining).padStart(2, '0')} ({secondsRemaining} giây)
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
            ⚡ <strong>Cập nhật tức thì:</strong> Chỉ cần xuất bản là cập nhật ngay! Học sinh & Thầy cô không cần chờ 1 tiếng và không phải quay lại vào ngày hôm sau, hệ thống tự động hoàn tất chỉ sau 60 giây.
          </p>
        </div>

        {/* Permanent link display */}
        <div className="p-3 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 text-xs text-left space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Link cố định vĩnh viễn:</span>
            </span>
            <button
              onClick={handleCopyLink}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : null}
              <span>{copied ? 'Đã chép link!' : 'Sao chép'}</span>
            </button>
          </div>
          <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 font-mono text-[11px] text-blue-600 dark:text-blue-300 truncate border border-slate-200 dark:border-zinc-700 select-all">
            {publishedUrl}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleCheckNow}
            disabled={checking}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Đang cập nhật...' : '🚀 Cập nhật ngay (Không cần chờ)'}</span>
          </button>

          {/* User Request: "quản trị viên không bị dính chờ để bảo trì" */}
          <button
            onClick={() => setShowAdminPinModal(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/50 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>🛡️ Quản trị viên (Mạc Khánh Duy): Vào ngay không cần chờ</span>
          </button>
        </div>
      </div>

      {/* Admin Fast Bypass Modal */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-amber-400/40 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-black text-xl">
              👑
            </div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              Xác Nhận Quản Trị Viên (Mạc Khánh Duy)
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Quản trị viên không bị gián đoạn hay phải chờ bảo trì. Vui lòng nhập mã PIN bảo mật quản trị viên để vào hệ thống ngay.
            </p>

            <form onSubmit={handleAdminVerify} className="space-y-3">
              <input
                type="password"
                autoFocus
                value={adminPinInput}
                onChange={(e) => {
                  setAdminPinInput(e.target.value);
                  setAdminPinError('');
                }}
                placeholder="Nhập mã PIN bảo mật quản trị viên..."
                className="w-full text-center tracking-widest font-mono text-base px-3 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {adminPinError && (
                <div className="text-xs text-rose-500 font-bold">
                  {adminPinError}
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdminPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                >
                  Vào Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
