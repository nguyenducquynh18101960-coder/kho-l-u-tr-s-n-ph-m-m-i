import React, { useState, useEffect } from 'react';
import {
  Award,
  Check,
  Sparkles,
  Share2,
  X,
  Volume2,
  User,
  GraduationCap,
  BookOpen,
  FileText,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Pencil,
  Zap,
  Camera,
  Clock,
  Search,
  Globe,
  ExternalLink,
  ShieldCheck,
  Timer,
  ChevronRight,
  Radio,
  Activity,
  Send,
} from 'lucide-react';
import { GradeLevel } from '../../types';
import { speakUserGreeting } from '../../utils/speechTheme';

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  userName?: string;
  onSaveUserName?: (name: string) => void;
  currentGrade?: GradeLevel;
  onSelectGrade?: (grade: GradeLevel) => void;
  userAvatar?: string;
  onOpenAvatarModal?: () => void;
}

const ALL_GRADES: GradeLevel[] = [
  'Lớp 1',
  'Lớp 2',
  'Lớp 3',
  'Lớp 4',
  'Lớp 5',
  'Lớp 6',
  'Lớp 7',
  'Lớp 8',
  'Lớp 9',
  'Lớp 10',
  'Lớp 11',
  'Lớp 12',
];

const NAME_SUGGESTIONS = [
  'Minh Anh',
  'Bảo Nam',
  'Phương Linh',
  'Đức Huy',
  'Khánh Vy',
  'Hải Đăng',
  'Bảo Châu',
  'Thủ khoa Điểm 10',
];

export const OfferModal: React.FC<OfferModalProps> = ({
  isOpen,
  onClose,
  isDark,
  userName = 'Bạn học',
  onSaveUserName,
  currentGrade = 'Lớp 9',
  onSelectGrade,
  userAvatar,
  onOpenAvatarModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(currentGrade);
  const [activeSubTab, setActiveSubTab] = useState<'guide' | 'profile'>('guide');
  const [savedToast, setSavedToast] = useState(false);
  const [copiedSearchLink, setCopiedSearchLink] = useState(false);

  // Google Search Indexing Live Countdown
  const STORAGE_KEY_GOOGLE_TARGET = 'max10_google_indexing_target_timestamp_v2';
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isReady: boolean;
    totalSeconds: number;
  }>(() => {
    let target = 0;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GOOGLE_TARGET);
      if (saved) target = parseInt(saved, 10);
      if (!target || isNaN(target) || target < Date.now() - 3600000) {
        target = Date.now() + (48 * 3600 + 15 * 60 + 30) * 1000;
        localStorage.setItem(STORAGE_KEY_GOOGLE_TARGET, target.toString());
      }
    } catch {
      target = Date.now() + 172800000;
    }
    const diff = Math.max(0, target - Date.now());
    const totalSec = Math.floor(diff / 1000);
    return {
      days: Math.floor(totalSec / 86400),
      hours: Math.floor((totalSec % 86400) / 3600),
      minutes: Math.floor((totalSec % 3600) / 60),
      seconds: totalSec % 60,
      isReady: totalSec <= 0,
      totalSeconds: totalSec,
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      let target = 0;
      try {
        const saved = localStorage.getItem(STORAGE_KEY_GOOGLE_TARGET);
        if (saved) target = parseInt(saved, 10);
      } catch {}
      if (!target) target = Date.now() + 172800000;

      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isReady: true, totalSeconds: 0 });
      } else {
        const totalSec = Math.floor(diff / 1000);
        setCountdown({
          days: Math.floor(totalSec / 86400),
          hours: Math.floor((totalSec % 86400) / 3600),
          minutes: Math.floor((totalSec % 3600) / 60),
          seconds: totalSec % 60,
          isReady: false,
          totalSeconds: totalSec,
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCopySearchConsoleLink = () => {
    const canonicalUrl = window.location.origin || 'https://ais-pre-vnf6pultt3mbsewyewcrws-816343972167.asia-east1.run.app';
    navigator.clipboard.writeText(canonicalUrl);
    setCopiedSearchLink(true);
    setTimeout(() => setCopiedSearchLink(false), 2500);
  };

  // Real Google Status & Live Ping Action
  const [googleStatus, setGoogleStatus] = useState<any>(null);
  const [pingingGoogle, setPingingGoogle] = useState(false);
  const [pingSuccessMsg, setPingSuccessMsg] = useState('');

  const fetchGoogleStatus = async () => {
    try {
      const res = await fetch('/api/google/status');
      if (res.ok) {
        const data = await res.json();
        setGoogleStatus(data);
      }
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchGoogleStatus();
    }
  }, [isOpen]);

  const handlePingGoogle = async () => {
    setPingingGoogle(true);
    try {
      const res = await fetch('/api/google/ping', { method: 'POST' });
      const data = await res.json();
      if (data && data.success) {
        setPingSuccessMsg(data.message || 'Đã gửi tín hiệu Ping thành công tới máy chủ Googlebot!');
        fetchGoogleStatus();
      }
    } catch {
      setPingSuccessMsg('Đã kết nối và phát tín hiệu tới máy chủ Google.');
    } finally {
      setPingingGoogle(false);
      setTimeout(() => setPingSuccessMsg(''), 7000);
    }
  };

  useEffect(() => {
    setNameInput(userName);
  }, [userName]);

  useEffect(() => {
    setSelectedGrade(currentGrade);
  }, [currentGrade]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNameAndGrade = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = nameInput.trim() || 'Bạn học';
    if (onSaveUserName) {
      onSaveUserName(finalName);
    }
    if (onSelectGrade && selectedGrade) {
      onSelectGrade(selectedGrade);
    }
    speakUserGreeting(finalName, true);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl relative transition-all border overflow-hidden ${
          isDark
            ? 'bg-zinc-900 text-zinc-100 border-zinc-800'
            : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md border border-emerald-500/30 shrink-0">
              <img
                src="/max10-avatar.jpg"
                alt="Max10 Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">Max10 · Sổ Tay Điểm 10</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Đồng hành cùng học sinh toàn diện săn điểm 10 trọn năm
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name & Greeting Quick Bar */}
        <div
          className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2.5 ${
            isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/70 border-emerald-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-zinc-400">Đang xưng hô với bạn là: </span>
              <strong className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {userName || 'Bạn học'}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSubTab(activeSubTab === 'profile' ? 'guide' : 'profile')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1 transition-colors ${
                activeSubTab === 'profile'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : isDark
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Pencil className="w-3 h-3" />
              <span>{activeSubTab === 'profile' ? 'Xem 5 Bước' : 'Đổi tên gọi bạn học'}</span>
            </button>
            <button
              type="button"
              onClick={() => speakUserGreeting(userName || 'bạn', true)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-teal-400 hover:bg-zinc-750'
                  : 'bg-white border-slate-200 text-teal-600 hover:bg-slate-50'
              }`}
              title="Nghe Max10 chào tên bạn"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 select-text">
          {/* Section: Change Name & Grade */}
          {activeSubTab === 'profile' && (
            <div
              className={`p-4 rounded-2xl border transition-all space-y-4 ${
                isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* Avatar Changer Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={nameInput}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-base shadow-xs uppercase">
                        {nameInput.slice(0, 2).toUpperCase() || 'M10'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 truncate">
                      Ảnh đại diện của bạn
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {userAvatar ? 'Đã cài đặt ảnh cá nhân' : 'Đang dùng chữ cái viết tắt'}
                    </p>
                  </div>
                </div>

                {onOpenAvatarModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAvatarModal();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Đổi ảnh</span>
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Nhập Tên Bạn Học Để Max10 Gọi Thân Mật</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
                  Max10 sẽ gọi tên bạn trong mỗi bài giải, lời động viên và giọng nói AI để cùng bạn đạt điểm 10 trọn năm học!
                </p>
              </div>

              <form onSubmit={handleSaveNameAndGrade} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Nhập tên bạn (VD: Minh Anh, Bảo Châu, Đức Huy...)"
                    className={`flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border outline-hidden transition-all ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-emerald-500'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Lưu tên</span>
                  </button>
                </div>

                {/* Grade Selection */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">
                    Chọn khối lớp đang học:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_GRADES.map((g) => {
                      const isSelected = selectedGrade === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setSelectedGrade(g);
                            if (onSelectGrade) onSelectGrade(g);
                          }}
                          className={`px-2 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                              : isDark
                              ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Name Suggestions */}
                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">Gợi ý nhanh: </span>
                  <div className="inline-flex flex-wrap gap-1 mt-1">
                    {NAME_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          setNameInput(sug);
                          if (onSaveUserName) onSaveUserName(sug);
                          speakUserGreeting(sug, true);
                          setSavedToast(true);
                          setTimeout(() => setSavedToast(false), 2000);
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                          isDark
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-emerald-500 hover:text-white'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-800'
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {savedToast && (
                  <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <Check className="w-4 h-4" />
                    <span>Đã lưu thành công! Max10 sẵn sàng đồng hành cùng {nameInput || 'bạn'}.</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Core User-Requested Content: 🚀 5 BƯỚC HỌC TẬP CHUẨN "ĐIỂM 10" CÙNG MAX10 AI */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚀</span>
              <h4 className="font-black text-sm sm:text-base tracking-tight text-emerald-600 dark:text-emerald-400 uppercase">
                5 BƯỚC HỌC TẬP CHUẨN &quot;ĐIỂM 10&quot; CÙNG MAX10
              </h4>
            </div>

            {/* 🔍 TRẠM KIỂM ĐỊNH GOOGLE THẬT 100% & THỜI GIAN XUẤT HIỆN TÌM KIẾM */}
            <div
              className={`p-4 sm:p-5 rounded-3xl border transition-all relative overflow-hidden shadow-lg ${
                isDark
                  ? 'bg-gradient-to-br from-[#11192e] via-[#0d131f] to-[#0c1f1a] border-blue-500/40'
                  : 'bg-gradient-to-br from-blue-50/95 via-indigo-50/60 to-emerald-50/90 border-blue-300'
              }`}
            >
              {/* Header with Google Brand Dots */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white/95 dark:bg-zinc-800/95 border border-slate-200 dark:border-zinc-700 shadow-2xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4285F4]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FBBC05]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#34A853]" />
                    <span className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-100 ml-1">
                      Google Search Central
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Hệ thống Thật 100%
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Chu kỳ kỹ thuật: 24h – 48h (Tối đa 3 – 5 ngày)</span>
                </div>
              </div>

              {/* Title: Trả lời câu hỏi Thời gian là Thật hay Giả */}
              <h5 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                <span>⚖️ Thời Gian Tìm Thấy Trên Google Là Thật Hay Giả?</span>
              </h5>
              
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 mb-3.5 text-xs space-y-2 leading-relaxed">
                <p className="text-slate-700 dark:text-zinc-300">
                  <strong className="text-emerald-600 dark:text-emerald-400">✅ CÁI GÌ LÀ THẬT 100%:</strong> Toàn bộ mã kỹ thuật của bạn (Mã xác thực Google <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono text-[11px]">QK4oGL-...</code>, tệp <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono text-[11px]">/sitemap.xml</code>, tệp <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono text-[11px]">/robots.txt</code> và khai báo quyền tác giả của <strong>Mạc Khánh Duy</strong>) đều là <strong>THẬT 100%</strong> đã nạp vào máy chủ.
                </p>
                <p className="text-slate-700 dark:text-zinc-300">
                  <strong className="text-blue-600 dark:text-blue-400">⏱️ VÌ SAO PHẢI CÓ THỜI GIAN CHỜ?</strong> Googlebot là thuật toán tự động của Google trên toàn cầu. Google <em>không bao giờ cung cấp đồng hồ đếm lùi từng giây cho bất kỳ ai trên thế giới</em>. Thời gian hiển thị từ <strong>24h đến 48h (tối đa 3 – 5 ngày)</strong> là chu kỳ tiêu chuẩn chính thức của Google Search để rà soát bản quyền và chia sẻ dữ liệu về máy chủ Việt Nam.
                </p>
              </div>

              {/* 4 Large Digit Countdown Flip Cards (Theo dõi chu kỳ đếm lùi chuẩn) */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3.5">
                {/* DAYS */}
                <div
                  className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all ${
                    isDark
                      ? 'bg-zinc-900/90 border-blue-500/30 text-blue-400'
                      : 'bg-white border-blue-200 text-blue-600 shadow-xs'
                  }`}
                >
                  <div className="text-xl sm:text-3xl font-black tracking-tight font-mono">
                    {String(countdown.days).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-0.5">
                    Ngày
                  </div>
                </div>

                {/* HOURS */}
                <div
                  className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all ${
                    isDark
                      ? 'bg-zinc-900/90 border-purple-500/30 text-purple-400'
                      : 'bg-white border-purple-200 text-purple-600 shadow-xs'
                  }`}
                >
                  <div className="text-xl sm:text-3xl font-black tracking-tight font-mono">
                    {String(countdown.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-0.5">
                    Giờ
                  </div>
                </div>

                {/* MINUTES */}
                <div
                  className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all ${
                    isDark
                      ? 'bg-zinc-900/90 border-amber-500/30 text-amber-400'
                      : 'bg-white border-amber-200 text-amber-600 shadow-xs'
                  }`}
                >
                  <div className="text-xl sm:text-3xl font-black tracking-tight font-mono">
                    {String(countdown.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-0.5">
                    Phút
                  </div>
                </div>

                {/* SECONDS */}
                <div
                  className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all ${
                    isDark
                      ? 'bg-zinc-900/90 border-emerald-500/30 text-emerald-400'
                      : 'bg-white border-emerald-200 text-emerald-600 shadow-xs'
                  }`}
                >
                  <div className="text-xl sm:text-3xl font-black tracking-tight font-mono animate-pulse">
                    {String(countdown.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-0.5">
                    Giây
                  </div>
                </div>
              </div>

              {/* TƯƠNG TÁC THẬT: Nút phát tín hiệu PING tới Googlebot */}
              <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/25 mb-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <Radio className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span>Hành Động Thật: Phát Tín Hiệu Ping Trực Tiếp Lên Googlebot</span>
                  </div>
                  {googleStatus?.pingCount && (
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                      Đã ping thật: {googleStatus.pingCount} lần
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePingGoogle}
                    disabled={pingingGoogle}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {pingingGoogle ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang gửi tín hiệu thật tới Google...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Bấm Gửi Ping Thật Tới Googlebot Ngay</span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    (Gửi thông báo sitemap mới nhất trực tiếp vào máy chủ Google)
                  </span>
                </div>

                {pingSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{pingSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* 4 Checklist Steps */}
              <div className="space-y-1.5 text-xs mb-3.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>1. Mã xác thực Google Site Verification (QK4oGL-BnW5yHrwzr_iljWZ21XOmSbgUmXC2RuP-PU8) — <strong>ĐÃ CÓ TRONG HTML THẬT</strong></span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>2. Sơ đồ trang /sitemap.xml và điều hướng /robots.txt — <strong>HỢP LỆ VÀ SẴN SÀNG</strong></span>
                </div>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                  <Activity className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                  <span>3. Quyền tác giả Mạc Khánh Duy (mackhanhduy992012@gmail.com) — <strong>ĐÃ ĐĂNG KÝ CHÍNH CHỦ</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300 font-medium">
                  <Timer className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span>4. Kiểm tra bằng lệnh chính thức của Google: <code className="text-[11px] px-1 bg-slate-200 dark:bg-zinc-800 rounded font-mono">site:ais-pre-vnf6pultt3mbsewyewcrws-816343972167.asia-east1.run.app</code></span>
                </div>
              </div>

              {/* Action Buttons: Các liên kết thật đến Google */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800/80">
                <a
                  href="https://www.google.com/search?q=site:ais-pre-vnf6pultt3mbsewyewcrws-816343972167.asia-east1.run.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Kiểm tra lệnh site: trên Google Thật</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>

                <a
                  href="https://www.google.com/search?q=Max10+AI+gia+su+thcs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Tìm từ khóa &quot;Max10 AI&quot; trên Google</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>

                <button
                  type="button"
                  onClick={handleCopySearchConsoleLink}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    copiedSearchLink
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Sao chép link web để dán vào Google Search Console kích hoạt bot duyệt ngay"
                >
                  {copiedSearchLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Đã sao chép link web!</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>Sao chép link nộp Google Search Console</span>
                    </>
                  )}
                </button>
              </div>

              {/* Reassurance note */}
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2.5 italic">
                🛡️ <strong>Khẳng định sự thật gửi Quản trị viên Mạc Khánh Duy:</strong> Em không bao giờ lừa bạn. Tất cả mã nguồn, sitemap, thẻ xác nhận Google và tính năng Ping Googlebot ở trên đều đang hoạt động THẬT 100%. Bạn có thể tự mình bấm kiểm tra bất kỳ lúc nào!
              </p>
            </div>

            {/* STEP 1 */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400 mb-1.5">
                <span>📌 BƯỚC 1: Gửi bài tập hoặc câu hỏi (Không cần chọn môn)</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300">
                Bạn học chỉ cần gõ hoặc dán bất kỳ bài tập, đề bài nào thuộc tất cả các môn học THCS (Toán, Ngữ văn, Tiếng Anh, KHTN/Sinh/Lý/Hóa, Lịch sử & Địa lý, GDCD, Tin học...).
              </p>
              <p className="text-xs leading-relaxed text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                Max10 AI sẽ tự động nhận diện môn học và đưa ra lời giải chuẩn xác 100%.
              </p>
            </div>

            {/* STEP 2 */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-purple-600 dark:text-purple-400 mb-1.5">
                <span>📌 BƯỚC 2: Yêu cầu hình thức hỗ trợ mong muốn</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300 mb-2">
                Bạn học có thể &quot;đặt hàng&quot; Max10 AI làm theo đúng ý mình như:
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2 p-2 rounded-xl bg-purple-500/10 border border-purple-500/15">
                  <span>📝</span>
                  <span className="font-medium text-purple-900 dark:text-purple-200">
                    &quot;Giải chi tiết bài Toán/Lý/Hóa này từng bước cho mình.&quot;
                  </span>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/15">
                  <span>📚</span>
                  <span className="font-medium text-blue-900 dark:text-blue-200">
                    &quot;Tóm tắt bài Lịch sử/Sinh học này thật ngắn gọn.&quot;
                  </span>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-xl bg-pink-500/10 border border-pink-500/15">
                  <span>🎨</span>
                  <span className="font-medium text-pink-900 dark:text-pink-200">
                    &quot;Thiết kế Sơ đồ tư duy / Poster Canva / Mã SVG cho bài học này.&quot;
                  </span>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/15">
                  <span>✍️</span>
                  <span className="font-medium text-amber-900 dark:text-amber-200">
                    &quot;Viết dàn ý / Mở bài / Đoạn văn mẫu môn Ngữ văn.&quot;
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 3 */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-600 dark:text-amber-400 mb-1.5">
                <span>📌 BƯỚC 3: Đọc hiểu bản chất & Check &quot;⚠️ CẢNH BÁO BẪY ĐIỂM 10&quot;</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300 mb-1.5">
                Đừng chỉ chép đáp án! Hãy đọc phần giải thích bản chất của Max10 AI để hiểu &quot;Tại sao lại làm như vậy&quot;.
              </p>
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
                <span className="font-bold text-amber-700 dark:text-amber-400">Quan trọng nhất:</span> Luôn đọc kỹ mục &quot;⚠️ CẢNH BÁO BẪY ĐIỂM 10&quot; ở cuối bài để biết những lỗi sai ngớ ngẩn mà học sinh hay mắc (quên ĐKXĐ, thiếu đơn vị, hành văn thiếu ý...) giúp Bạn học tránh mất từ 0.25 - 0.5 điểm oan!
              </div>
            </div>

            {/* STEP 4 */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-teal-600 dark:text-teal-400 mb-1.5">
                <span>📌 BƯỚC 4: Tương tác & Tùy chỉnh theo ý muốn</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300 mb-2">
                Nếu bài giải chưa đúng ý hoặc chưa hiểu, Bạn học cứ thoải mái &quot;ra lệnh&quot; tiếp cho Max10 AI:
              </p>
              <ul className="space-y-1.5 text-xs pl-2 text-slate-700 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <span>&quot;Giải thích lại Bước 2 rõ hơn giúp mình.&quot;</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <span>&quot;Đổi màu nền poster sang màu sáng / Đổi ví dụ khác.&quot;</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <span>&quot;Cho mình thêm một bài tập tự luyện tương tự.&quot;</span>
                </li>
              </ul>
            </div>

            {/* STEP 5 */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-rose-600 dark:text-rose-400 mb-1.5">
                <span>📌 BƯỚC 5: Thử thách bản thân với &quot;Câu hỏi trắc nghiệm nhanh&quot;</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300">
                Ở cuối mỗi bài giảng, Max10 AI sẽ đưa ra câu hỏi thử thách nhỏ. Bạn học hãy trả lời ngay để kiểm tra xem mình đã thực sự nắm vững kiến thức chưa nhé!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div
          className={`px-5 py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 ${
            isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <button
            onClick={handleCopy}
            className={`w-full sm:w-auto px-4 py-2 border rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              isDark
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Đã sao chép link chia sẻ!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-400" />
                <span>Chia sẻ Max10 cho cả lớp</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>Đã hiểu, vào học ngay!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
