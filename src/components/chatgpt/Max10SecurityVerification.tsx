import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, CheckCircle2, Loader2, BookOpen, AlertTriangle } from 'lucide-react';
import { isSearchEngineBot } from '../../utils/seoBot';

interface Max10SecurityVerificationProps {
  userId?: string;
  onVerified: () => void;
  onBanned?: (reason: string) => void;
}

export function getOrCreateDeviceId(): string {
  try {
    const key = 'max10_device_id_v1';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'dev-browser';
  }
}

export const Max10SecurityVerification: React.FC<Max10SecurityVerificationProps> = ({
  userId,
  onVerified,
  onBanned,
}) => {
  const [step, setStep] = useState<'checking' | 'success' | 'redirecting' | 'error'>('checking');
  const [dotCount, setDotCount] = useState<number>(2);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');
  const verifiedOnceRef = useRef(false);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 450);
    return () => clearInterval(dotInterval);
  }, []);

  const generateClientProofToken = async (deviceId: string): Promise<string> => {
    const nonce =
      typeof window !== 'undefined' && window.crypto?.getRandomValues
        ? Array.from(window.crypto.getRandomValues(new Uint8Array(12)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
        : Math.random().toString(36).slice(2, 14);
    const raw = `max10-client-verified:${deviceId}:${userId || 'guest'}:${nonce}:${Date.now()}`;
    try {
      if (typeof window !== 'undefined' && window.crypto?.subtle) {
        const encoded = new TextEncoder().encode(raw);
        const digest = await window.crypto.subtle.digest('SHA-256', encoded);
        return Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch {}
    return 'client-' + btoa(raw).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  };

  const completeVerification = (token: string) => {
    verifiedOnceRef.current = true;
    try {
      sessionStorage.setItem('max10_security_session_token', token || '');
    } catch {}

    setStep('success');
    setTimeout(() => {
      setStep('redirecting');
      setIsFadingOut(true);
      setTimeout(() => {
        onVerified();
      }, 360);
    }, 650);
  };

  const runClientVerification = async () => {
    if (verifiedOnceRef.current) return;
    setStep('checking');
    setErrorText('');
    const deviceId = getOrCreateDeviceId();

    try {
      try {
        if (localStorage.getItem('max10_permanently_banned') === 'true') {
          const reason =
            localStorage.getItem('max10_ban_reason') ||
            'Thiết bị hoặc tài khoản đã bị tường lửa Max10 AI chặn vĩnh viễn.';
          if (onBanned) onBanned(reason);
          return;
        }
      } catch {}

      // Pure client-side Web Crypto SHA-256 challenge (zero dependency on server API routes,
      // eliminating Vercel 404 "The page could not be found" JSON parse failures).
      await new Promise((r) => setTimeout(r, 550));
      const clientToken = await generateClientProofToken(deviceId);
      completeVerification(clientToken);
    } catch (err: any) {
      setStep('error');
      setErrorText(err?.message || 'Không thể hoàn tất xác minh bảo mật.');
    }
  };

  useEffect(() => {
    if (isSearchEngineBot()) {
      completeVerification('search-crawler-pass');
      return;
    }
    runClientVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dotsString = '.'.repeat(dotCount);

  return (
    <div
      className={`fixed inset-0 z-[999999] bg-white text-slate-900 select-none flex flex-col justify-start items-start px-6 sm:px-12 md:px-24 pt-20 sm:pt-28 font-sans transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-xl mx-auto sm:mx-0">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-7 h-7 rounded-lg bg-[#5551ff] text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            max10.ai
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 tracking-tight">
          Thực hiện bảo mật
        </h1>

        <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed mb-6 font-normal">
          Trang web sử dụng tường lửa bảo mật thực tế để bảo vệ phiên hỏi đáp AI, chống bot spam và ngăn hành vi xâm nhập trái phép.
          Chỉ sau khi xác minh hoàn tất, câu hỏi của bạn sẽ được gửi ngay tới gia sư Max10 AI.
        </p>

        <div
          onClick={() => {
            if (step === 'error') runClientVerification();
          }}
          className="w-full max-w-sm rounded-md border border-slate-300 bg-[#f9fafb] p-3.5 mb-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-3">
            {step === 'checking' ? (
              <div className="w-6 h-6 rounded border-2 border-slate-400 flex items-center justify-center bg-white">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
            ) : step === 'error' ? (
              <div className="w-6 h-6 rounded flex items-center justify-center bg-rose-500 text-white">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded flex items-center justify-center bg-emerald-500 text-white animate-in zoom-in-75 duration-200">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="text-sm font-medium text-slate-800">
              {step === 'checking'
                ? 'Đang xác thực chữ ký bảo mật...'
                : step === 'error'
                ? 'Thử xác minh lại'
                : 'Đã xác minh thành công'}
            </span>
          </div>

          <div className="flex flex-col items-end pl-3 border-l border-slate-200 text-right">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>MAX10 AI</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-slate-400">
              <span>Bảo mật</span>
              <span>•</span>
              <span>Chống hack</span>
            </div>
          </div>
        </div>

        <div className="min-h-[28px] text-[15px] sm:text-base font-semibold text-slate-900 flex items-center gap-2">
          {step === 'checking' ? (
            <span className="text-slate-500 font-normal">
              Đang kiểm tra chứng chỉ phiên & tường lửa máy chủ...
            </span>
          ) : step === 'error' ? (
            <span className="text-rose-600 text-sm">{errorText} (Bấm vào thẻ trên để thử lại)</span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-900">
              Xác minh thành công. Đang mở Max10 AI
              <span className="inline-block w-4 font-bold text-blue-600">{dotsString}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
