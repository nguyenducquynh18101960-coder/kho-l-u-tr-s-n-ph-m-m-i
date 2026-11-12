import React, { useState } from 'react';
import { Download, Smartphone, Apple, Check, Share2, PlusSquare, ExternalLink, Globe, Sparkles } from 'lucide-react';
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
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showIOSPopup, setShowIOSPopup] = useState(false);
  const [showAndroidPopup, setShowAndroidPopup] = useState(false);

  // Check if opening inside in-app browser (e.g. Zalo, Facebook, Messenger, TikTok)
  const isInAppBrowser = typeof window !== 'undefined' && /fbav|fban|instagram|messenger|zalo|line|tiktok|micromessenger/i.test(
    navigator.userAgent.toLowerCase()
  );

  const handleOpenInChrome = () => {
    try {
      const currentUrl = window.location.href.replace(/^https?:\/\//, '');
      // Android Intent scheme to open directly in Google Chrome
      window.location.href = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    } catch (e) {
      window.open(window.location.href, '_system');
    }
  };

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        if (isAndroid) setShowAndroidPopup(true);
        else if (isIOS) setShowIOSPopup(true);
        else if (onOpenStoreModal) onOpenStoreModal();
      }
    } else if (isAndroid) {
      setShowAndroidPopup(true);
    } else if (isIOS) {
      setShowIOSPopup(true);
    } else if (onOpenStoreModal) {
      onOpenStoreModal();
    }
  };

  // Shared Android Guided Modal Component
  const renderAndroidModal = () => (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-2xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">
              Cài Max10 Ra Màn Hình Điện Thoại
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Tải & cài đặt thành ứng dụng độc lập</p>
          </div>
        </div>

        {isInAppBrowser ? (
          <div className="p-3 mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-2">
            <p className="font-bold">⚠️ Bạn đang mở link qua Zalo / Facebook</p>
            <p className="text-[11px] leading-relaxed">
              Trình duyệt Zalo/Facebook chặn tính năng cài đặt ứng dụng. Hãy bấm nút dưới đây để chuyển sang <strong>Google Chrome</strong> cài app 1-chạm!
            </p>
            <button
              onClick={handleOpenInChrome}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở bằng Google Chrome để cài app</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-300 my-4 bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-700/60">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p>
                Mở link trên trình duyệt <strong>Google Chrome</strong> (điện thoại Android).
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <p>
                Bấm vào nút <strong>Menu 3 chấm (⋮)</strong> ở góc trên bên phải màn hình Chrome.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <p>
                Chọn <strong>"Cài đặt ứng dụng"</strong> (hoặc <strong>"Thêm vào Màn hình chính"</strong>) &gt; Bấm <strong>"Cài đặt"</strong>.
              </p>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
              ✓ Ứng dụng Max10 sẽ xuất hiện ngay trên màn hình chính như app CH Play!
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={async () => {
                await install();
                setShowAndroidPopup(false);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cài Đặt 1-Chạm</span>
            </button>
          )}
          <button
            onClick={() => setShowAndroidPopup(false)}
            className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );

  // Shared iOS Guided Modal Component
  const renderIOSModal = () => (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-2xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Apple className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">
              Cài đặt Max10 trên iPhone / iPad
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Chỉ mất 5 giây với Safari</p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-300 my-4 bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-700/60">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <p>
              Bấm vào nút <strong>Chia sẻ (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> ở thanh công cụ dưới đáy Safari.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <p>
              Kéo xuống và chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-600" />.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <p>
              Bấm <strong>"Thêm" (Add)</strong> ở góc trên bên phải. Biểu tượng Max10 sẽ xuất hiện như ứng dụng native trên màn hình iPhone!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowIOSPopup(false);
              if (onOpenStoreModal) onOpenStoreModal();
            }}
            className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Xem App Store / CH Play
          </button>
          <button
            onClick={() => setShowIOSPopup(false)}
            className="py-2 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );

  if (isInstalled && variant !== 'banner') {
    return (
      <button
        onClick={onOpenStoreModal}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer ${className}`}
        title="Ứng dụng Max10 đã được cài đặt trên thiết bị của bạn. Bấm để xem cài đặt App Store / CH Play"
      >
        <Check className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Đã Cài Đặt</span>
      </button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <>
        <div className="p-3 mx-2 my-2 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                <Download className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-bold">Cài Max10 về máy</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400/30 font-semibold">
              iOS & Android
            </span>
          </div>
          <p className="text-[11px] text-white/90 leading-tight mb-2.5">
            Mở toàn màn hình, học mượt mà không cần mở trình duyệt, hỗ trợ App Store & CH Play.
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClick}
              className="flex-1 py-1.5 px-2 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cài đặt ngay</span>
            </button>
            {onOpenStoreModal && (
              <button
                onClick={onOpenStoreModal}
                className="py-1.5 px-2 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 text-white text-[11px] font-semibold transition-all cursor-pointer"
                title="Xem hướng dẫn App Store & CH Play"
              >
                Store ↗
              </button>
            )}
          </div>
        </div>

        {showAndroidPopup && renderAndroidModal()}
        {showIOSPopup && renderIOSModal()}
      </>
    );
  }

  // Header default button
  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] border border-white/20 animate-pulse duration-1000 ${className}`}
        title="Cài đặt Max10 ngay vào Máy tính, Điện thoại (Android & iPhone) - Miễn phí 100%"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Cài Đặt Ứng Dụng (PC · Android · iOS)</span>
        <span className="inline lg:hidden">Cài App 1-Chạm</span>
      </button>

      {showAndroidPopup && renderAndroidModal()}
      {showIOSPopup && renderIOSModal()}
    </>
  );
};
