import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Lock, Unlock, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import { MASTER_SECURITY_CODE } from '../../types/auth';

interface PermanentlyBannedScreenProps {
  reason?: string;
  onUnbanSuccess?: () => void;
  isDark?: boolean;
}

export const PermanentlyBannedScreen: React.FC<PermanentlyBannedScreenProps> = ({
  reason = 'Hệ thống an ninh phát hiện hành vi cố tình hack / xâm nhập trái phép hoặc giả mạo quyền quản trị viên.',
  onUnbanSuccess,
  isDark = true,
}) => {
  const [securityCode, setSecurityCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [unbanned, setUnbanned] = useState(false);

  const handleVerifyMasterCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const code = securityCode.trim();

    if (!code) {
      setErrorMsg('Vui lòng nhập mã bảo mật.');
      return;
    }

    if (code !== MASTER_SECURITY_CODE) {
      setErrorMsg('❌ Mã bảo mật không chính xác! Hành vi tiếp tục bị ngăn chặn.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/security/unban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ securityCode: code }),
      });
      const data = await res.json();
      if (data.success) {
        setUnbanned(true);
        localStorage.removeItem('max10_permanently_banned');
        localStorage.removeItem('max10_ban_reason');
        sessionStorage.setItem('max10_master_security_verified', 'true');
        setTimeout(() => {
          if (onUnbanSuccess) {
            onUnbanSuccess();
          } else {
            window.location.reload();
          }
        }, 1200);
      } else {
        setErrorMsg(data.error || 'Mã bảo mật không hợp lệ.');
      }
    } catch {
      // Local fallback
      localStorage.removeItem('max10_permanently_banned');
      localStorage.removeItem('max10_ban_reason');
      sessionStorage.setItem('max10_master_security_verified', 'true');
      setUnbanned(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none ${
        isDark ? 'bg-[#090b10] text-white' : 'bg-rose-50 text-slate-900'
      }`}
    >
      {/* Background Warning Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-600 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-700 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg rounded-3xl border border-rose-500/50 bg-slate-900/95 backdrop-blur-2xl shadow-[0_0_50px_rgba(244,63,94,0.3)] p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 text-white">
        {/* Animated Skull/Shield Alert Badge */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 via-red-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md text-xs font-black">
            ✕
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-rose-500/20 border border-rose-500/60 text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>TỰ ĐỘNG BAN &amp; XÓA VĨNH VIỄN</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">
            Tài Khoản Đã Bị Khóa &amp; Xóa Vĩnh Viễn
          </h2>

          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs sm:text-sm font-medium leading-relaxed text-left space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-base shrink-0">⛔</span>
              <div>
                <strong>Lý do xử lý an ninh:</strong>
                <p className="mt-0.5 text-rose-300/90">{reason}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-rose-900/60 text-[11px] text-rose-400">
              ⚡ Hệ thống bảo vệ Max10 AI đã tự động kích hoạt lệnh trừng phạt cao nhất: <strong>Ban tài khoản ngay lập tức</strong> và <strong>xóa toàn bộ dữ liệu vĩnh viễn</strong>.
            </div>
          </div>
        </div>

        {/* Master Security Key Input */}
        <div className="pt-2">
          {unbanned ? (
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 flex items-center justify-center gap-2 font-bold text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Xác thực mã bảo mật thành công! Đang tải lại hệ thống...</span>
            </div>
          ) : (
            <form onSubmit={handleVerifyMasterCode} className="space-y-3">
              <div className="text-left">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mã bảo mật chống hack để mở khóa khôi phục:</span>
                </label>
                <input
                  type="password"
                  value={securityCode}
                  onChange={(e) => {
                    setSecurityCode(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Nhập mã bảo mật (24122012@duy)..."
                  className="w-full text-center tracking-wider font-mono text-sm sm:text-base px-3.5 py-2.5 rounded-xl border border-rose-500/40 bg-black/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-400"
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-400 font-bold bg-rose-950/40 p-2 rounded-lg border border-rose-800">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                <span>Xác Thực Mã Bảo Mật Không Bị Hack</span>
              </button>
            </form>
          )}
        </div>

        <p className="text-[10px] text-slate-500">
          Chỉ Quản trị viên tối cao Mạc Khánh Duy sở hữu mã bảo mật <code>24122012@duy</code> mới có thể khôi phục truy cập an toàn.
        </p>
      </div>
    </div>
  );
};
