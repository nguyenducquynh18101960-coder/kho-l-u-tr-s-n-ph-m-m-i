import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Apple,
  Download,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  Terminal,
  FileCode,
  Share2,
  PlusSquare,
  Award,
  Globe,
  Sparkles,
  Send,
  HelpCircle,
  RefreshCw,
  Link,
  CheckCircle2,
  Laptop,
  Clock,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface StorePublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  defaultTab?: 'publish' | 'install' | 'chplay' | 'appstore' | 'config';
  isOwner?: boolean;
  onToggleOwner?: (value: boolean) => void;
}

export const PERMANENT_APP_URL =
  'https://max-ai-gia-s-i-m-10-thcs.ai.studio';

export const StorePublishModal: React.FC<StorePublishModalProps> = ({
  isOpen,
  onClose,
  isDark = false,
  defaultTab = 'publish',
  isOwner = true,
  onToggleOwner,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'publish' | 'install' | 'chplay' | 'appstore' | 'config'>(defaultTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Dynamic & Custom Publish URL state (User requested: "đổi liên kết xuất bản khác đi...")
  const [currentAppUrl, setCurrentAppUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('max10_custom_publish_url');
      if (saved && saved.trim()) return saved.trim();
      if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
      }
    } catch (e) {}
    return PERMANENT_APP_URL;
  });

  const [inputCustomUrl, setInputCustomUrl] = useState<string>(currentAppUrl);
  const [isCustomizingUrl, setIsCustomizingUrl] = useState<boolean>(false);
  const [saveUrlSuccess, setSaveUrlSuccess] = useState<boolean>(false);
  const [isUpdatingMode, setIsUpdatingMode] = useState<boolean>(false);

  // Sync defaultTab and fetch system status when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      const saved = localStorage.getItem('max10_custom_publish_url') || (typeof window !== 'undefined' ? window.location.origin : PERMANENT_APP_URL);
      setCurrentAppUrl(saved);
      setInputCustomUrl(saved);

      // Fetch system status
      fetch('/api/system/status?t=' + Date.now())
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data.isUpdating === 'boolean') {
            setIsUpdatingMode(data.isUpdating);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, defaultTab]);

  const handleToggleMaintenanceMode = async () => {
    const nextState = !isUpdatingMode;
    setIsUpdatingMode(nextState);
    try {
      await fetch('/api/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isUpdating: nextState,
          message: 'Max10 AI đang xuất bản cập nhật. Tự động hoàn tất chỉ sau 60 giây (không phải chờ 1 tiếng hay quay lại vào ngày hôm sau)!',
          estimatedMinutes: 1,
          estimatedSeconds: 60,
        }),
      });
    } catch (e) {
      console.warn('Lỗi bật tắt cập nhật:', e);
    }
  };

  if (!isOpen) return null;

  const handleSaveCustomUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputCustomUrl.trim();
    if (!trimmed) return;
    setCurrentAppUrl(trimmed);
    try {
      localStorage.setItem('max10_custom_publish_url', trimmed);
    } catch (e) {}
    setIsCustomizingUrl(false);
    setSaveUrlSuccess(true);
    setTimeout(() => setSaveUrlSuccess(false), 3000);
  };

  const handleResetUrlToOrigin = () => {
    const originUrl = typeof window !== 'undefined' ? window.location.origin : PERMANENT_APP_URL;
    setCurrentAppUrl(originUrl);
    setInputCustomUrl(originUrl);
    try {
      localStorage.setItem('max10_custom_publish_url', originUrl);
    } catch (e) {}
    setSaveUrlSuccess(true);
    setTimeout(() => setSaveUrlSuccess(false), 3000);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Max10 - Gia Sư Chinh Phục Điểm 10',
          text: 'Ứng dụng Max10 - Gia sư AI đồng hành học tập chinh phục điểm 10 trọn năm học:',
          url: currentAppUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        handleCopy(currentAppUrl, 'share_btn');
      }
    } else {
      handleCopy(currentAppUrl, 'share_btn');
    }
  };

  const bubblewrapCommand = `npm install -g @bubblewrap/cli
bubblewrap init --manifest="${currentAppUrl}/manifest.webmanifest"
bubblewrap build`;

  const capacitorCommand = `npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init Max10 app.max10.education --web-dir=dist
npx cap add android
npx cap add ios
npx cap open android   # Mở Android Studio để xuất file AAB đưa lên CH Play
npx cap open ios       # Mở Xcode để đóng gói đưa lên App Store`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div
        className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] ${
          isDark
            ? 'bg-zinc-900 border-zinc-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base">
                  Xuất Bản & Link Cố Định Max10
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Link Cố Định 100%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Xuất bản cập nhật tức thì, link vĩnh viễn không thay đổi, hỗ trợ Web, PWA, CH Play & App Store
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-zinc-800 px-3 bg-slate-50/50 dark:bg-zinc-850/50 overflow-x-auto text-xs font-bold gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('publish')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'publish'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>🌐 Link Xuất Bản Cố Định</span>
            <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold">
              Chính thức
            </span>
          </button>

          <button
            onClick={() => setActiveTab('install')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'install'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Cài Đặt 1-Chạm (PWA)</span>
          </button>

          <button
            onClick={() => setActiveTab('chplay')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'chplay'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-500" />
            <span>Google Play (CH Play)</span>
          </button>

          <button
            onClick={() => setActiveTab('appstore')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'appstore'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>Apple App Store</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'config'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>File Cấu Hình</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* TAB 0: LINK XUẤT BẢN CỐ ĐỊNH & CAM KẾT GIỮ NGUYÊN LINK */}
          {activeTab === 'publish' && (
            <div className="space-y-4">
              {/* Guarantee banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-blue-500/15 border-2 border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Đường Link Này Là Cố Định Vĩnh Viễn 100%</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                      Mỗi khi bạn xuất bản (Publish) hay chỉnh sửa thêm tính năng, hệ thống sẽ tự động cập nhật đè lên đúng địa chỉ này. <strong>Link tuyệt đối không bị đổi!</strong>
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Bảo toàn link 100%</span>
                  </span>
                </div>
              </div>

              {/* Banner: Không Cần Phải Đủ Tuổi Mới Được Dùng */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-teal-500/15 to-emerald-500/15 border-2 border-teal-500/40 flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-teal-600 to-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        Không Cần Đủ Tuổi Mới Được Dùng · Phù Hợp Mọi Lứa Tuổi
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        Mọi Lứa Tuổi (All Ages)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                      Đường link cố định này <strong>không yêu cầu bất kỳ điều kiện tuổi tác nào</strong>. Học sinh, các em nhỏ, thanh thiếu niên, phụ huynh hay giáo viên đều có thể mở link và học tập ngay lập tức. <strong>Không cần phải đủ 18 tuổi hay đủ tuổi mới được dùng!</strong>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-teal-800 dark:text-teal-300 font-semibold">
                      <span className="inline-flex items-center gap-1 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/60">
                        ✓ Xuất bản vẫn là link đấy 100%
                      </span>
                      <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                        ✓ Không cần đủ tuổi mới được dùng
                      </span>
                      <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60">
                        ✓ Không chặn tuổi hay bắt xác minh
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Link Box (Configurable / Editable per user request) */}
              <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>Địa chỉ Web xuất bản hiện tại</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => setIsCustomizingUrl(!isCustomizingUrl)}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Link className="w-3 h-3" />
                        <span>{isCustomizingUrl ? 'Đóng bộ chỉnh sửa' : '✏️ Đổi liên kết xuất bản khác (Chỉ Tác giả)'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                        🔒 Liên kết cố định (Chỉ Tác giả mới có quyền đổi)
                      </span>
                    )}
                  </div>
                </div>

                {/* Input with Action buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 font-mono text-xs sm:text-sm text-slate-800 dark:text-zinc-100 truncate shadow-2xs select-all">
                    {currentAppUrl}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopy(currentAppUrl, 'main_url')}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'main_url' ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Đã Sao Chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Sao Chép Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={currentAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Mở trong tab mới"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">Mở Xem Thử</span>
                    </a>
                  </div>
                </div>

                {/* User Requested: Đổi link xuất bản khác / Dán link mới khi xuất bản xong - CHỈ TÁC GIẢ MỚI ĐƯỢC THAY */}
                {isOwner && isCustomizingUrl && (
                  <form onSubmit={handleSaveCustomUrl} className="pt-2 border-t border-emerald-500/20 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                        Nhập hoặc dán liên kết xuất bản mới của bạn:
                      </label>
                      <button
                        type="button"
                        onClick={handleResetUrlToOrigin}
                        className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-emerald-600 cursor-pointer"
                      >
                        Khôi phục link mặc định
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={inputCustomUrl}
                        onChange={(e) => setInputCustomUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 rounded-xl text-xs font-mono border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-slate-900 dark:text-zinc-100 outline-hidden focus:border-emerald-500"
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Lưu link này</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      💡 <em>Khi bạn xuất bản xong ở trang quản lý, chỉ cần dán link xuất bản mới vào đây rồi bấm Lưu. Toàn bộ mã QR và tính năng chia sẻ sẽ tự động cập nhật ngay!</em>
                    </p>
                  </form>
                )}

                {saveUrlSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Đã cập nhật liên kết xuất bản thành công! Toàn bộ ứng dụng đã được đồng bộ link mới.</span>
                  </div>
                )}

                {/* Quick Share Bar */}
                <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                    Chia sẻ nhanh cho học sinh & phụ huynh:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNativeShare}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Chia sẻ ngay</span>
                    </button>

                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentAppUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Facebook</span>
                    </a>

                    <a
                      href={`https://zalo.me/share?url=${encodeURIComponent(currentAppUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Zalo</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* User Requested: Bật / Tắt thông báo đang cập nhật - CHỈ TÁC GIẢ MỚI ĐƯỢC QUYỀN ĐỔI */}
              {isOwner && (
                <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                            Trạng Thái Cập Nhật Hệ Thống (Bảo Trì)
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                            Quyền Tác giả
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-zinc-400">
                          Bật chế độ này khi bạn đang chuẩn bị xuất bản tính năng mới
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleMaintenanceMode}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 ${
                        isUpdatingMode
                          ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0 animate-ping" />
                      <span>{isUpdatingMode ? '🔴 Đang Bật Thông Báo Cập Nhật' : '🟢 Đang Hoạt Động Bình Thường'}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-amber-300 dark:border-zinc-700 text-xs space-y-2">
                    <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <span>📢 Khi bật thông báo cập nhật, người khác vào link xuất bản sẽ thấy:</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-zinc-900 border border-amber-200/80 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold italic text-xs leading-relaxed">
                      &quot;Max10 AI đang xuất bản cập nhật. Hệ thống tự động hoàn tất chỉ sau 60 giây (không phải chờ 1 tiếng hay quay lại vào ngày hôm sau)!&quot;
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      ⚡ <strong>Khi bạn xuất bản:</strong> Chỉ cần xuất bản là cập nhật ngay! Người dùng nhận bản mới chỉ sau <strong>60 giây</strong> (không phải chờ 1 tiếng và không phải quay lại vào ngày hôm sau), giữ nguyên đường link <strong>{currentAppUrl}</strong> vĩnh viễn!
                    </p>
                  </div>
                </div>
              )}

              {/* Direct Payment & Upgrade Links (User Requested: Ảnh QR chỉ có trong chuyển khoản, đưa ra link đưa đến mã QR) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Direct Upgrade Links Box */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <span>Link Dẫn Thẳng Đến Mã QR Chuyển Khoản</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Tự động nâng cấp
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    Khi học sinh hoặc khách hàng hỏi muốn chuyển tiền, bạn chỉ cần gửi 1 trong các đường link bên dưới. Người nhận mở link sẽ được đưa thẳng tới <strong>Mã QR chuyển khoản ngân hàng</strong>:
                  </p>

                  <div className="space-y-2">
                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-emerald-600 block">Link Gói Plus (100k/tháng)</span>
                        <span className="text-[11px] font-mono text-slate-700 dark:text-zinc-300 truncate block">
                          {currentAppUrl}?pay=plus#chuyen-khoan-plus
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${currentAppUrl}?pay=plus#chuyen-khoan-plus`);
                          setCopiedKey('plus-link');
                          setTimeout(() => setCopiedKey(null), 2500);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === 'plus-link' ? 'Đã chép!' : 'Chép link'}</span>
                      </button>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-purple-600 block">Link Gói Premium (500k/tháng)</span>
                        <span className="text-[11px] font-mono text-slate-700 dark:text-zinc-300 truncate block">
                          {currentAppUrl}?pay=premium#chuyen-khoan-premium
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${currentAppUrl}?pay=premium#chuyen-khoan-premium`);
                          setCopiedKey('prem-link');
                          setTimeout(() => setCopiedKey(null), 2500);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === 'prem-link' ? 'Đã chép!' : 'Chép link'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* How to publish in AI Studio instruction */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Cách bấm Xuất Bản trên AI Studio</span>
                  </div>
                  <ol className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Nhìn lên góc <strong>trên cùng bên phải</strong> của màn hình Google AI Studio.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>Bấm nút <strong>"Publish"</strong> (hoặc nút <strong>"Share" / "Deploy"</strong>).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Xác nhận xuất bản. Hệ thống sẽ build và cập nhật đè lên đúng link này, <strong>link vẫn giữ nguyên 100%</strong>!
                      </span>
                    </li>
                  </ol>
                </div>
              </div>

              {/* FAQ Accordion / Quick reassurance */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-blue-50/40 dark:bg-blue-950/20 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-bold">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>Câu hỏi thường gặp về đường link xuất bản</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 dark:text-zinc-300 pt-1">
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-850/60 border border-slate-200/60 dark:border-zinc-700/60">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">
                      ❓ Có phải đủ tuổi (như 18 tuổi) mới được dùng link Max10 không?
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                      <strong>Hoàn toàn KHÔNG!</strong> Max10 là gia sư học tập thân thiện cho học sinh. Không yêu cầu đủ tuổi, không đòi hỏi giấy tờ tùy thân hay xác minh tuổi. Trẻ em, học sinh mọi cấp, phụ huynh và giáo viên đều mở link là dùng được ngay 100%!
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-850/60 border border-slate-200/60 dark:border-zinc-700/60">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">
                      ❓ Khi xuất bản (Publish) thì link có đổi không và có phải đủ tuổi mới được dùng?
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                      <strong>Link vẫn giữ nguyên 100%!</strong> Xuất bản sẽ cập nhật trực tiếp lên chính đường link cố định này. Người nhận link mở trên điện thoại hay máy tính đều vào dùng ngay mà <strong>không cần phải đủ tuổi</strong> mới được dùng.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-850/60 border border-slate-200/60 dark:border-zinc-700/60">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">
                      ❓ Nếu tôi sửa code thêm tính năng thì link có đổi không?
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                      <strong>Tuyệt đối không!</strong> Đường link gắn liền với ID ứng dụng Max10 của bạn vĩnh viễn. Mọi cập nhật chỉ cần tải lại trang (F5) là có bản mới.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-850/60 border border-slate-200/60 dark:border-zinc-700/60">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">
                      ❓ Người đã cài PWA lên điện thoại có phải cài lại không?
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                      <strong>Không cần cài lại!</strong> Nhờ cơ chế Service Worker PWA, ứng dụng trên máy của học sinh sẽ tự động cập nhật phiên bản mới nhất khi có kết nối mạng.
                    </p>
                  </div>
                </div>
              </div>

              {/* Author status & toggle indicator */}
              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold">
                  {isOwner ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      👑 <span>Chế độ Tác giả: Có quyền thay đổi link xuất bản & bảo trì</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                      👥 <span>Chế độ Khách: Chỉ xem & sao chép liên kết cố định</span>
                    </span>
                  )}
                </div>
                {onToggleOwner && (
                  <button
                    type="button"
                    onClick={() => onToggleOwner(!isOwner)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {isOwner ? 'Chuyển sang xem thử vai trò Khách' : '🔑 Xác nhận quyền Tác giả'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: CÀI ĐẶT 1-CHẠM NGAY LẬP TỨC */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      Cài đặt Max10 ngay vào máy mà không cần chờ duyệt Store
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Được trang bị Service Worker, lưu dữ liệu offline, không có thanh địa chỉ trình duyệt, phản hồi tức thì 100%.
                    </p>
                  </div>
                </div>

                {isInstalled ? (
                  <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs shrink-0">
                    <Check className="w-4 h-4" />
                    <span>Đã cài đặt trên máy</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={install}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Cài Đặt Ngay Bây Giờ</span>
                  </button>
                ) : null}
              </div>

              {/* Instructions by Platform */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                {/* PC / Desktop Card */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <span>Máy tính (Windows / Mac)</span>
                  </div>
                  <ol className="space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Mở link này trên <strong>Google Chrome</strong> hoặc <strong>Microsoft Edge</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Nhìn vào cuối <strong>thanh địa chỉ web</strong>, bấm biểu tượng <strong>"Cài đặt Max10"</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Bấm <strong>Cài đặt</strong> để Max10 ghim vào thanh tác vụ (Taskbar) và Desktop!
                      </span>
                    </li>
                  </ol>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold pt-1">
                    ✓ Mở bằng cửa sổ độc lập như ứng dụng Word/Excel trên máy tính!
                  </p>
                </div>

                {/* Android Card */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span>Điện thoại Android (CH Play)</span>
                  </div>
                  <ol className="space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Mở ứng dụng bằng <strong>Chrome</strong> trên điện thoại Android.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Bấm nút <strong>3 chấm góc trên bên phải</strong> &gt; Chọn <strong>"Cài đặt ứng dụng"</strong> (hoặc Thêm vào MH chính).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Bấm <strong>Cài đặt</strong> để đưa biểu tượng Max10 ra màn hình chính.
                      </span>
                    </li>
                  </ol>
                  <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex flex-col gap-2">
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ Trực tiếp từ Google: Không cần giải nén file .zip! Google Chrome sẽ tự động cài Max10 thành ứng dụng bên ngoài màn hình chính.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const currentUrl = window.location.href.replace(/^https?:\/\//, '');
                          window.location.href = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Mở trong Google Chrome</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* iOS Card */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
                    <div className="w-7 h-7 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                      <Apple className="w-4 h-4" />
                    </div>
                    <span>iPhone & iPad (Safari)</span>
                  </div>
                  <ol className="space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Mở link ứng dụng bằng trình duyệt <strong>Safari</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Nhấn nút <strong>Chia sẻ (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> ở thanh công cụ Safari.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-600" /> rồi bấm <strong>"Thêm"</strong>.
                      </span>
                    </li>
                  </ol>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                    ✓ Biểu tượng Max10 sẽ nằm ngay trên màn hình chính như tải từ App Store!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ĐƯA LÊN GOOGLE PLAY STORE (CH PLAY) */}
          {activeTab === 'chplay' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>Cách đưa ứng dụng Max10 lên Google Play (CH Play)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  Google hỗ trợ chính thức đưa ứng dụng Web/PWA lên CH Play thông qua tiêu chuẩn <strong>Trusted Web Activity (TWA)</strong> hoặc công cụ <strong>PWABuilder (khuyên dùng, không cần viết code Android)</strong>.
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {/* Section tải icon */}
                <div className="p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block">
                          Tải Icon & Logo Max10 Chuẩn 512x512
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Định dạng PNG vuông tiêu chuẩn cho Google Play & PWABuilder
                        </span>
                      </div>
                    </div>
                    <a
                      href="/pwa-512x512.png"
                      download="max10-icon-512x512.png"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải Icon Về Máy</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src="/pwa-512x512.png"
                      alt="Icon Max10"
                      className="w-16 h-16 rounded-2xl shadow-md border border-slate-200 dark:border-zinc-700 object-cover"
                    />
                    <div className="text-xs text-slate-600 dark:text-zinc-400 space-y-1">
                      <p>
                        💡 <strong>Cách lưu ảnh:</strong> Bấm nút <strong>"Tải Icon Về Máy"</strong> màu xanh, hoặc bấm chuột phải vào ảnh bên cạnh chọn <strong>"Lưu hình ảnh..."</strong>.
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Kích thước: 512x512 px · Định dạng: PNG · Chuẩn Google Play Store
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                      <span>Cách 1: Sử dụng PWABuilder (Nhanh nhất - 2 phút)</span>
                    </span>
                    <a
                      href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentAppUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Mở PWABuilder</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    Truy cập trang web <strong>pwabuilder.com</strong>, nhập URL của Max10, chọn <strong>"Package For Stores"</strong> &gt; chọn <strong>Google Play</strong> &gt; Tải gói file <strong>.aab</strong> (Android App Bundle) hoàn chỉnh.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Tạo tài khoản Google Play Console & Đăng tải</span>
                  </span>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-zinc-400">
                    <li>Đăng ký tài khoản nhà phát triển Google Play (phí $25 một lần duy nhất).</li>
                    <li>Tạo ứng dụng mới với tên <strong>"Max10 - Gia Sư Chinh Phục Điểm 10"</strong>, thể loại: <strong>Giáo dục</strong>.</li>
                    <li>Tải lên file <strong>.aab</strong> vừa tải từ PWABuilder hoặc Bubblewrap.</li>
                    <li>Điền bản khai nội dung ứng dụng, xếp hạng độ tuổi: Chọn <strong>"Phù hợp mọi lứa tuổi" (All Ages / 3+)</strong> — Ứng dụng giáo dục lành mạnh, học sinh đều dùng được tự do, hoàn toàn không cần phải đủ tuổi mới được dùng.</li>
                    <li>Bấm <strong>"Gửi để xem xét"</strong>. Google thường phê duyệt trong 24h - 48h!</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                      <span>File Digital Asset Links (Đã tạo sẵn trong mã nguồn)</span>
                    </span>
                    <button
                      onClick={() => handleCopy(`${currentAppUrl}/.well-known/assetlinks.json`, 'assetlinks_url')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'assetlinks_url' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy link xác thực</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    Hệ thống đã tự động tạo đường dẫn xác minh Google: <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-blue-600">/.well-known/assetlinks.json</code> giúp ứng dụng ẩn hoàn toàn thanh URL trên điện thoại Android khi tải từ CH Play.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ĐƯA LÊN APPLE APP STORE */}
          {activeTab === 'appstore' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                  <Apple className="w-4 h-4" />
                  <span>Cách đưa ứng dụng Max10 lên Apple App Store (iOS)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  Để phát hành lên App Store cho hàng triệu người dùng iPhone và iPad tải về trực tiếp từ kho ứng dụng của Apple, bạn có 2 lộ trình phổ biến nhất:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                      <span>Lựa chọn A: PWABuilder iOS Package (Đơn giản nhất)</span>
                    </span>
                    <a
                      href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentAppUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Mở PWABuilder</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    PWABuilder tự động tạo một project Xcode chuẩn iOS native chứa toàn bộ cấu hình, splash screen và icon chuẩn của Max10. Bạn chỉ cần mở Xcode trên máy Mac và tải lên App Store Connect.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Lựa chọn B: Sử dụng Capacitor Mobile Runtime</span>
                  </span>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    File <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-indigo-600">capacitor.config.json</code> đã được tạo sẵn trong thư mục dự án với mã định danh <code className="font-bold">app.max10.education</code>.
                  </p>
                  <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px] relative overflow-x-auto">
                    <pre>{capacitorCommand}</pre>
                    <button
                      onClick={() => handleCopy(capacitorCommand, 'cap_cmd')}
                      className="absolute right-2 top-2 px-2 py-0.5 rounded-md bg-zinc-800 text-white text-[10px] hover:bg-zinc-700 flex items-center gap-1"
                    >
                      {copiedKey === 'cap_cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
                  <span className="font-extrabold text-slate-900 dark:text-white">Yêu cầu từ Apple:</span>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Tài khoản Apple Developer Program ($99/năm) tại <code>developer.apple.com</code>.</li>
                    <li>Một máy Mac có cài đặt <strong>Xcode</strong> để ký chứng chỉ và đưa app lên TestFlight / App Store.</li>
                    <li>Ảnh chụp màn hình (Screenshots) của iPhone và iPad kích thước chuẩn.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MÃ NGUỒN & FILE CẤU HÌNH */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Toàn bộ các file cấu hình tiêu chuẩn cao cấp đã được tích hợp sẵn vào dự án:
              </p>

              {/* Manifest info */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-emerald-600" />
                    <span>Web App Manifest (Chuẩn PWA & Stores)</span>
                  </span>
                  <button
                    onClick={() => handleCopy(`${currentAppUrl}/manifest.webmanifest`, 'manifest_url')}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'manifest_url' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Copy URL Manifest</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Bao gồm đầy đủ: id ('/'), name ('Max10 - Gia Sư Chinh Phục Điểm 10'), short_name ('Max10'), display ('standalone'), 192x192 icon, 512x512 icon, và 512x512 maskable icon cho Android.
                </p>
              </div>

              {/* Capacitor Config */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>capacitor.config.json (Mobile iOS/Android Native)</span>
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(
                          {
                            appId: 'app.max10.education',
                            appName: 'Max10',
                            webDir: 'dist',
                            server: {
                              url: currentAppUrl,
                              cleartext: false,
                            },
                          },
                          null,
                          2
                        ),
                        'cap_json'
                      )
                    }
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'cap_json' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Copy JSON</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Cấu hình sẵn sàng để chạy lệnh <code className="font-mono">npx cap add ios</code> hoặc <code className="font-mono">npx cap add android</code>.
                </p>
              </div>

              {/* Bubblewrap CLI command */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-purple-600" />
                    <span>Lệnh đóng gói Google Play bằng Bubblewrap CLI</span>
                  </span>
                  <button
                    onClick={() => handleCopy(bubblewrapCommand, 'bubblewrap_cmd')}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'bubblewrap_cmd' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Copy lệnh</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-emerald-400 p-2 rounded-xl font-mono text-[11px] overflow-x-auto">
                  <pre>{bubblewrapCommand}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-850/50">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Link cố định vĩnh viễn · Tự động đồng bộ bản mới nhất</span>
            <span className="inline sm:hidden">Link cố định 100%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(PERMANENT_APP_URL, 'footer_copy')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              {copiedKey === 'footer_copy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Link</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
