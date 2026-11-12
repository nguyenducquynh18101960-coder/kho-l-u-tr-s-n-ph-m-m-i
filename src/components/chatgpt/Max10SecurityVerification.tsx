import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Loader2, Sparkles, BookOpen } from 'lucide-react';

interface Max10SecurityVerificationProps {
  onVerified: () => void;
}

export const Max10SecurityVerification: React.FC<Max10SecurityVerificationProps> = ({ onVerified }) => {
  // Verification states: 'checking' -> 'success' -> 'redirecting' -> done
  const [step, setStep] = useState<'checking' | 'success' | 'redirecting'>('checking');
  const [dotCount, setDotCount] = useState<number>(2);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // Animated dots for "Đang chờ max10.ai phản hồi.."
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 450);
    return () => clearInterval(dotInterval);
  }, []);

  // Automatic security verification cycle
  useEffect(() => {
    // 1. Initial scanning simulation (1.2 seconds)
    const scanTimer = setTimeout(() => {
      setStep('success');
    }, 1200);

    // 2. Verified success -> waiting for max10.ai response (1.3 seconds)
    const redirectTimer = setTimeout(() => {
      setStep('redirecting');
      setIsFadingOut(true);
    }, 2500);

    // 3. Complete fade out and enter the app
    const finishTimer = setTimeout(() => {
      onVerified();
    }, 2900);

    return () => {
      clearTimeout(scanTimer);
      clearTimeout(redirectTimer);
      clearTimeout(finishTimer);
    };
  }, [onVerified]);

  const handleManualCheck = () => {
    if (step === 'checking') {
      setStep('success');
      setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(onVerified, 400);
      }, 1000);
    }
  };

  const dotsString = '.'.repeat(dotCount);

  return (
    <div
      className={`fixed inset-0 z-[999999] bg-white text-slate-900 select-none flex flex-col justify-start items-start px-6 sm:px-12 md:px-24 pt-20 sm:pt-28 font-sans transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-xl mx-auto sm:mx-0">
        {/* Brand Header matching user screenshot: [Icon] max10.ai */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-7 h-7 rounded-lg bg-[#5551ff] text-white flex items-center justify-center shadow-xs">
            {/* Book / Graduation icon styled exactly like the screenshot emblem */}
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            max10.ai
          </span>
        </div>

        {/* Title: Thực hiện bảo mật */}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 tracking-tight">
          Thực hiện bảo mật
        </h1>

        {/* Description: Trang web này sử dụng dịch vụ bảo mật... */}
        <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed mb-6 font-normal">
          Trang web này sử dụng dịch vụ bảo mật để chống bot độc hại. Trang này hiển thị trong khi
          trang web xác định bạn không phải là bot.
        </p>

        {/* Cloudflare-style Turnstile Checkbox Card */}
        <div
          onClick={handleManualCheck}
          className="w-full max-w-sm rounded-md border border-slate-300 bg-[#f9fafb] p-3.5 mb-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-3">
            {step === 'checking' ? (
              <div className="w-6 h-6 rounded border-2 border-slate-400 flex items-center justify-center bg-white">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded flex items-center justify-center bg-emerald-500 text-white animate-in zoom-in-75 duration-200">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="text-sm font-medium text-slate-800">
              {step === 'checking' ? 'Đang xác minh bạn là con người...' : 'Đã xác minh thành công'}
            </span>
          </div>

          {/* Turnstile / Max10 Security Branding Badge */}
          <div className="flex flex-col items-end pl-3 border-l border-slate-200 text-right">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>MAX10 AI</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-slate-400">
              <span>Bảo mật</span>
              <span>•</span>
              <span>Điều khoản</span>
            </div>
          </div>
        </div>

        {/* Status response matching screenshot: "Xác minh thành công. Đang chờ max10.ai phản hồi.." */}
        <div className="min-h-[28px] text-[15px] sm:text-base font-semibold text-slate-900 flex items-center gap-2">
          {step === 'checking' ? (
            <span className="text-slate-500 font-normal">
              Đang phân tích chứng chỉ bảo mật kết nối...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-900">
              Xác minh thành công. Đang chờ max10.ai phản hồi
              <span className="inline-block w-4 font-bold text-blue-600">{dotsString}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
