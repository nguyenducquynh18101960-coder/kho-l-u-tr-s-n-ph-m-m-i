import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Apple,
  Share2,
  PlusSquare,
  ExternalLink,
  Copy,
  Check,
  MonitorSmartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenStoreModal?: () => void;
  className?: string;
  variant?: 'header' | 'sidebar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenStoreModal,
  className = '',
  variant = 'header',
}) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isInAppBrowser,
    install,
  } = usePWAInstall();

  const [guideMode, setGuideMode] = useState<'none' | 'android' | 'ios' | 'universal'>('none');
  const [copiedLink, setCopiedLink] = useState(false);

  // Never display install prompts when already running as a standalone installed app
  if (isInstalled) {
    return null;
  }

  const handleOpenInChrome = () => {
    try {
      const currentUrl = window.location.href.replace(/^https?:\/\//, '');
      window.location.href = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    } catch {
      window.open(window.location.href, '_system');
    }
  };

  const handleCopyUrl = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) return;
    }

    if (isIOS) {
      setGuideMode('ios');
    } else if (isAndroid) {
      setGuideMode('android');
    } else {
      setGuideMode('universal');
    }
  };

  const renderInstallGuideModal = () => {
    if (guideMode === 'none') return null;

    return (
      <div
        className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
        onClick={() => setGuideMode('none')}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-2xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Max10 AI App Icon Preview */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-sm shrink-0 bg-slate-900">
                <img
                  src="/pwa-192x192.png"
                  alt="Max10 AI"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                  Tải Max10 AI Thành Ứng Dụng Riêng
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Biểu tượng màn hình chính: <strong className="text-emerald-600 dark:text-emerald-400">Max10 AI</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGuideMode('none')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Đóng hướng dẫn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* In-app browser notice (Zalo, Facebook, Messenger, TikTok) */}
          {isInAppBrowser && (
            <div className="p-3 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-2">
              <p className="font-bold">
                Bạn đang mở link bên trong Zalo / Facebook / TikTok
              </p>
              <p className="text-[11px] leading-relaxed">
                Hãy mở đường link này bằng <strong>Safari</strong> (iPhone) hoặc <strong>Google Chrome</strong> (Android) để thêm <strong>Max10 AI</strong> ra màn hình chính thành app riêng.
              </p>
              <div className="flex gap-2">
                {isAndroid && (
                  <button
                    type="button"
                    onClick={handleOpenInChrome}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở bằng Chrome</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Đã chép link!' : 'Sao chép link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Switch tabs between iOS Safari / Android Chrome / Other browsers */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 mb-3 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setGuideMode('android')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                guideMode === 'android'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Chrome / Android</span>
            </button>
            <button
              type="button"
              onClick={() => setGuideMode('ios')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                guideMode === 'ios'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>Safari / iPhone</span>
            </button>
            <button
              type="button"
              onClick={() => setGuideMode('universal')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                guideMode === 'universal'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              <MonitorSmartphone className="w-3.5 h-3.5" />
              <span>Trình duyệt khác</span>
            </button>
          </div>

          {guideMode === 'android' && (
            <div className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-700/60">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Mở trang bằng <strong>Google Chrome</strong> (hoặc Samsung Internet / Edge / Cốc Cốc).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Bấm biểu tượng <strong>Menu 3 chấm (⋮)</strong> ở góc trên bên phải trình duyệt.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Chọn <strong>&quot;Cài đặt ứng dụng&quot;</strong> hoặc <strong>&quot;Thêm vào Màn hình chính&quot;</strong> &rarr; bấm <strong>Cài đặt</strong>.
                </p>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                ✓ App riêng tên &quot;Max10 AI&quot; sẽ xuất hiện ngoài màn hình điện thoại và chạy toàn màn hình!
              </p>
            </div>
          )}

          {guideMode === 'ios' && (
            <div className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-700/60">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Trên <strong>Safari</strong> (thanh dưới cùng) hoặc <strong>Chrome iPhone</strong> (góc trên phải), bấm nút <strong>Chia sẻ (Share)</strong>{' '}
                  <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" />.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Vuốt xuống chọn <strong>&quot;Thêm vào MH chính&quot; (Add to Home Screen)</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-600" />.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Kiểm tra tên hiển thị là <strong>Max10 AI</strong> rồi bấm <strong>&quot;Thêm&quot; (Add)</strong> ở góc trên phải.
                </p>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                ✓ Mở từ màn hình iPhone/iPad như một ứng dụng độc lập, không còn thanh địa chỉ trình duyệt!
              </p>
            </div>
          )}

          {guideMode === 'universal' && (
            <div className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-700/60">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  <strong>Chrome / Edge / Cốc Cốc (Máy tính &amp; Điện thoại):</strong> Bấm biểu tượng <strong>Cài đặt (⊕ / màn hình có mũi tên tải)</strong> trên thanh địa chỉ, hoặc vào Menu &rarr; <strong>Cài đặt Max10 AI</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  <strong>Safari (iPhone / iPad / Mac):</strong> Bấm <strong>Chia sẻ</strong> &rarr; <strong>Thêm vào MH chính / Thêm vào Dock</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  <strong>Samsung Internet / Opera / Firefox Mobile:</strong> Bấm Menu (≡ / ⋮) &rarr; <strong>Thêm trang vào Màn hình chính</strong>.
                </p>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                ✓ Biểu tượng ngoài màn hình sẽ hiển thị tên <strong>Max10 AI</strong> và mở thành cửa sổ ứng dụng riêng biệt!
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            {isInstallable && (
              <button
                type="button"
                onClick={async () => {
                  const ok = await install();
                  if (ok) setGuideMode('none');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Cài Đặt 1-Chạm Ngay</span>
              </button>
            )}
            {onOpenStoreModal && (
              <button
                type="button"
                onClick={() => {
                  setGuideMode('none');
                  onOpenStoreModal();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Tùy chọn nâng cao
              </button>
            )}
            <button
              type="button"
              onClick={() => setGuideMode('none')}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (variant === 'sidebar') {
    return (
      <>
        <div className="p-3 my-2 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl overflow-hidden bg-white/15 shrink-0">
                <img src="/pwa-192x192.png" alt="Max10 AI" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-extrabold truncate">Tải App Max10 AI</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/15 font-bold shrink-0">
              Chrome · Safari
            </span>
          </div>
          <p className="text-[11px] text-white/90 leading-snug mb-2.5">
            Thêm ra màn hình chính thành ứng dụng riêng tên <strong>Max10 AI</strong>, mở toàn màn hình cực mượt.
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleClick}
              className="flex-1 py-2 px-2.5 rounded-xl bg-white text-emerald-800 text-xs font-extrabold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cài về điện thoại</span>
            </button>
            {onOpenStoreModal && (
              <button
                type="button"
                onClick={onOpenStoreModal}
                className="py-2 px-2.5 rounded-xl bg-emerald-900/45 hover:bg-emerald-900/65 text-white text-[11px] font-bold transition-colors cursor-pointer"
                title="Xem hướng dẫn tải & đóng gói App"
              >
                Chi tiết
              </button>
            )}
          </div>
        </div>

        {renderInstallGuideModal()}
      </>
    );
  }

  // Header install button (compact on mobile, expressive on desktop)
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${className}`}
        title="Tải Max10 AI về điện thoại (Chrome, Safari...) thành ứng dụng riêng"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden lg:inline">Tải App Max10 AI</span>
        <span className="inline lg:hidden">Tải App</span>
      </button>

      {renderInstallGuideModal()}
    </>
  );
};
