import React, { useEffect, useState } from 'react';
import {
  X,
  Bell,
  Sparkles,
  Flower2,
  Rocket,
  Smartphone,
  Zap,
  Award,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { getVisibleHolidays } from './HolidayGiftAnimationModal';
import { formatAccurateTime } from '../../utils/timeFormat';

interface AdminNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  autoUpdateNotice?: string | null;
  onOpenOfferModal: () => void;
  onOpenStoreModal?: () => void;
  onOpenPricingModal?: () => void;
  onOpenIntroModal?: () => void;
}

interface AdminBroadcastNotice {
  id: string;
  senderName?: string;
  content: string;
  timestamp?: string;
  createdAt?: number;
}

const DEFAULT_ADMIN_UPDATES: AdminBroadcastNotice[] = [
  {
    id: 'upd-hub-2026',
    senderName: 'Mạc Khánh Duy (Quản trị viên)',
    content:
      'Ra mắt không gian học tập Modern EdTech Study Hub 3 cột siêu gọn: Gia sư AI Bento Dashboard, Cộng đồng học nhóm tích hợp @Max10 AI, Kho luyện đề Offline & Lịch học cá nhân!',
    timestamp: 'Mới nhất',
  },
  {
    id: 'upd-minigame-2412',
    senderName: 'Hệ thống Max10 AI',
    content:
      'Mở khóa hiệu ứng pháo hoa & hào quang khi đạt mốc XP mới và cấp tối đa 2412 (MAX) cùng Mini game thuộc bài săn Top 1.',
    timestamp: 'Nổi bật',
  },
];

export const AdminNotificationsDrawer: React.FC<AdminNotificationsDrawerProps> = ({
  isOpen,
  onClose,
  isDark,
  autoUpdateNotice,
  onOpenOfferModal,
  onOpenStoreModal,
  onOpenPricingModal,
  onOpenIntroModal,
}) => {
  const [broadcasts, setBroadcasts] = useState<AdminBroadcastNotice[]>(DEFAULT_ADMIN_UPDATES);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/admin/broadcasts')
      .then((res) =>
        res.ok && (res.headers.get('content-type') || '').includes('application/json')
          ? res.json()
          : null
      )
      .then((data) => {
        if (data?.success && Array.isArray(data.messages) && data.messages.length > 0) {
          const formatted: AdminBroadcastNotice[] = data.messages
            .slice(-5)
            .reverse()
            .map((m: any) => ({
              id: m.id || String(Math.random()),
              senderName: m.senderName || 'Mạc Khánh Duy (Quản trị viên)',
              content: m.content || '',
              timestamp: formatAccurateTime(m.createdAt, m.timestamp),
              createdAt: m.createdAt,
            }));
          setBroadcasts([...formatted, ...DEFAULT_ADMIN_UPDATES]);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const visibleHolidays = getVisibleHolidays();

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity"
      />

      {/* Slide-out Right Drawer */}
      <aside
        className={`relative z-10 w-full max-w-[380px] h-full flex flex-col border-l shadow-2xl ${
          isDark
            ? 'bg-[#0c1018]/98 border-white/[0.08] text-slate-100'
            : 'bg-white/98 border-slate-200/90 text-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3.5 border-b flex items-center justify-between gap-2 shrink-0 ${
            isDark ? 'border-white/[0.08]' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white truncate">
                Thông báo từ Admin
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                Cập nhật ứng dụng &amp; Quà tặng theo mùa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Live Auto-Update Alert */}
          {autoUpdateNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/12 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-xs">
                <Rocket className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Cập nhật trực tiếp mới nhất</span>
              </div>
              <p className="leading-relaxed">{autoUpdateNotice}</p>
            </div>
          )}

          {/* Always-Available XP Level-Up Spin Card */}
          <div className="space-y-2">
            <div className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Vòng quay kinh nghiệm
            </div>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('max10_open_xp_spin'));
                onClose();
              }}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer hover:-translate-y-0.5 ${
                isDark
                  ? 'bg-emerald-500/12 border-emerald-500/35 hover:border-emerald-400/60 text-emerald-200'
                  : 'bg-emerald-50/95 border-emerald-200 hover:border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs truncate">
                    Quay XP Lên Cấp
                  </div>
                  <div className="text-[11px] opacity-80 truncate">
                    Tích lũy XP thăng cấp &amp; quay lễ theo tháng
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
            </button>
          </div>

          {/* Seasonal Holiday Gifts Section */}
          {visibleHolidays.length > 0 && (
            <div className="space-y-2">
              <div className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-rose-500">
                Quà tặng lễ đặc biệt
              </div>
              {visibleHolidays.map((holiday) => (
                <button
                  key={holiday.id}
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('max10_open_holiday_gift', {
                        detail: { holidayId: holiday.id },
                      })
                    );
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer hover:-translate-y-0.5 ${
                    isDark
                      ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-400/60 text-rose-200'
                      : 'bg-rose-50/90 border-rose-200 hover:border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                      <Flower2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs truncate">
                        Quà Lễ: {holiday.badgeText}
                      </div>
                      <div className="text-[11px] opacity-80 truncate">
                        Bấm để mở hộp quà &amp; nhận thưởng XP
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-rose-500 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Admin App Updates */}
          <div className="space-y-2.5">
            <div className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Bản cập nhật ứng dụng Max10 AI
            </div>

            {broadcasts.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border space-y-1.5 ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.07]'
                    : 'bg-slate-50/90 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.senderName}</span>
                  </span>
                  {item.timestamp && (
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 shrink-0">
                      {item.timestamp}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Utility Cards */}
          <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
            <div className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Tiện ích nhanh
            </div>

            <button
              type="button"
              onClick={() => {
                onOpenOfferModal();
                onClose();
              }}
              className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                isDark
                  ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07]'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-bold">5 Bước Điểm 10 THCS</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {onOpenStoreModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenStoreModal();
                  onClose();
                }}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07]'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-teal-500 shrink-0" />
                  <span className="font-bold">Cài đặt App &amp; Link cố định</span>
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  PWA
                </span>
              </button>
            )}

            {onOpenPricingModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenPricingModal();
                  onClose();
                }}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15 text-amber-200'
                    : 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="font-bold">Nâng cấp VIP Max10 AI</span>
                </span>
                <span className="text-[10px] font-black uppercase">VIP</span>
              </button>
            )}

            {onOpenIntroModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenIntroModal();
                  onClose();
                }}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07]'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="font-bold">Trang giới thiệu &amp; Tác giả</span>
                </span>
                <Award className="w-3.5 h-3.5 text-amber-500" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
