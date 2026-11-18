import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  ChevronDown,
  Zap,
  Flame,
  Award,
  Palette,
  Volume2,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User,
  Smartphone,
  PenLine,
  PanelLeft,
} from 'lucide-react';
import { GradeLevel } from '../../types';
import { BackgroundTheme } from '../../types/theme';
import { UserAccount } from '../../types/auth';
import { loadStudentAchievements, StudentAchievementStats } from '../../data/initialAchievements';
import { calculateLevel, formatLevelLabel, MAX_LEVEL } from '../../types/achievements';
import { getVisibleHolidays } from './HolidayGiftAnimationModal';
import { getUserInitials } from './UserNameModal';
import { MainTabId, HubSpaceId, getSpaceFromTab } from './Sidebar';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleContextPanel?: () => void;
  isContextPanelOpen?: boolean;
  onNewChat: () => void;
  selectedGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  isDark: boolean;
  onToggleTheme?: () => void;
  activeTab: MainTabId;
  activeSpace?: HubSpaceId;
  onSelectTab: (tab: MainTabId) => void;
  onOpenOfferModal: () => void;
  onOpenIntroModal?: () => void;
  activeTheme?: BackgroundTheme;
  onOpenThemeModal?: () => void;
  onOpenVoiceModal?: () => void;
  userName?: string;
  onOpenNameModal?: () => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  userAvatar?: string;
  onOpenAvatarModal?: () => void;
  onOpenStoreModal?: () => void;
  subscriptionPlan?: 'free' | 'plus' | 'premium';
  onOpenPricingModal?: (initialPlan?: 'plus' | 'premium', initialStep?: 'plans' | 'checkout') => void;
  onOpenAchievementsModal?: () => void;
  onOpenHistoryDrawer?: () => void;
  onOpenAdminNotifications?: () => void;
  historyCount?: number;
  onLogout?: () => void;
}

const SPACE_LABELS: Record<HubSpaceId, string> = {
  ai: 'Gia sư AI',
  community: 'Cộng đồng & Chat',
  practice: 'Kho Luyện Tập',
  tools: 'Công cụ AI & Lịch học',
};

const GRADES: GradeLevel[] = ['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'];

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onToggleContextPanel,
  isContextPanelOpen = true,
  selectedGrade,
  onSelectGrade,
  isDark,
  onToggleTheme,
  activeTab,
  activeSpace,
  onSelectTab,
  activeTheme,
  onOpenThemeModal,
  onOpenVoiceModal,
  userName = 'Bạn học',
  onOpenNameModal,
  currentUser,
  onOpenAuthModal,
  userAvatar,
  onOpenAvatarModal,
  onOpenStoreModal,
  subscriptionPlan = 'free',
  onOpenPricingModal,
  onOpenAchievementsModal,
  onOpenAdminNotifications,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [achievementStats, setAchievementStats] = useState<StudentAchievementStats>(() =>
    loadStudentAchievements()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setAchievementStats(loadStudentAchievements());
    };
    window.addEventListener('max10_achievements_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('max10_achievements_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSpace = activeSpace || getSpaceFromTab(activeTab);
  const currentXp = achievementStats.totalXp;
  const levelInfo = calculateLevel(currentXp);
  const nextXp = levelInfo.nextLevelXp;
  const xpNeeded = levelInfo.isMaxLevel ? 0 : Math.max(0, nextXp - currentXp);
  const displayStreak = achievementStats.streak.currentStreak > 0 ? achievementStats.streak.currentStreak : 10;
  const unlockedBadges = achievementStats.badges.filter((b) => b.isUnlocked).length;
  const displayBadges = unlockedBadges >= 7 ? unlockedBadges : 7;

  const hasHolidayNotification = getVisibleHolidays().length > 0;
  const displayName = currentUser?.name || (userName && userName !== 'Bạn học' ? userName : 'Mạc Khánh Duy');

  return (
    <header
      className={`h-14 px-3 sm:px-5 border-b flex items-center justify-between gap-2 shrink-0 z-30 select-none transition-colors ${
        isDark
          ? 'bg-[#0b1019]/92 border-white/[0.08] text-slate-100'
          : 'bg-white/95 border-slate-200/85 text-slate-800'
      }`}
    >
      {/* Left: Mobile Menu + Context Panel Toggle + Active Space Name + Grade */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`md:hidden p-2 rounded-xl border transition-colors shrink-0 cursor-pointer ${
            isDark
              ? 'border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Mở menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {onToggleContextPanel && (
          <button
            type="button"
            onClick={onToggleContextPanel}
            className={`hidden md:inline-flex p-2 rounded-xl border transition-colors shrink-0 cursor-pointer ${
              isContextPanelOpen
                ? isDark
                  ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-400'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : isDark
                ? 'border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
            title={isContextPanelOpen ? 'Ẩn cột menu phụ' : 'Mở cột menu phụ'}
            aria-label={isContextPanelOpen ? 'Ẩn cột menu phụ' : 'Mở cột menu phụ'}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <h1 className="font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
          {SPACE_LABELS[currentSpace]}
        </h1>

        <select
          value={selectedGrade}
          onChange={(e) => onSelectGrade(e.target.value as GradeLevel)}
          aria-label="Chọn khối lớp THCS"
          className={`px-2.5 py-1 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            isDark
              ? 'bg-zinc-900 border-white/10 text-emerald-400 hover:border-emerald-500/40'
              : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Study Metrics (10 Ngày streak · 7 Huy hiệu · Điểm số) + Thông báo từ Admin + Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Study Metrics Pill */}
        <button
          type="button"
          onClick={onOpenAchievementsModal || (() => onSelectTab('achievements'))}
          className={`hidden lg:inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isDark
              ? 'bg-white/[0.04] border-white/[0.08] hover:border-emerald-500/40 text-zinc-200'
              : 'bg-slate-50 border-slate-200/85 hover:border-emerald-300 text-slate-700'
          }`}
          title={
            levelInfo.isMaxLevel
              ? `Cấp Tối Đa ${MAX_LEVEL} (MAX) · ${currentXp.toLocaleString()} XP`
              : `Cấp ${formatLevelLabel(levelInfo.level)} · Còn ${xpNeeded.toLocaleString()} XP để lên cấp`
          }
        >
          <span className="inline-flex items-center gap-1 text-orange-500 tabular-nums">
            <Flame className="w-3.5 h-3.5 fill-orange-500 shrink-0" />
            <span>{displayStreak} Ngày streak</span>
          </span>
          <span className="text-slate-300 dark:text-zinc-700">·</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 tabular-nums">
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>{displayBadges} Huy hiệu</span>
          </span>
          <span className="text-slate-300 dark:text-zinc-700">·</span>
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 tabular-nums">
            <Zap className="w-3.5 h-3.5 fill-amber-500 shrink-0" />
            <span>{currentXp.toLocaleString()} điểm</span>
          </span>
        </button>

        {/* Thông báo từ Admin Slide-Out Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenAdminNotifications}
          className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            isDark
              ? 'bg-emerald-500/12 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300'
              : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800'
          }`}
          title="Xem thông báo cập nhật ứng dụng mới nhất & quà tặng lễ từ Admin"
        >
          <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">Thông báo từ Admin</span>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              hasHolidayNotification ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
          />
        </button>

        {/* Compact Profile Dropdown */}
        <div className="relative shrink-0" ref={profileRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className={`flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-slate-100'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
            }`}
            title="Tài khoản & Tùy chỉnh"
          >
            {userAvatar || currentUser?.avatar ? (
              <img
                src={currentUser?.avatar || userAvatar}
                alt={displayName}
                className="w-6 h-6 rounded-lg object-cover shrink-0 border border-emerald-500/40"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold text-[10px] shrink-0">
                {currentUser ? getUserInitials(displayName) : <User className="w-3.5 h-3.5" />}
              </div>
            )}
            <span className="hidden sm:inline max-w-[105px] truncate">{displayName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {showProfileMenu && (
            <div
              className={`absolute right-0 top-full mt-2 w-64 rounded-2xl p-2 border shadow-2xl z-50 text-xs ${
                isDark
                  ? 'bg-[#101622] border-white/10 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl mb-1.5 border ${
                  isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200/70'
                }`}
              >
                <div className="font-extrabold truncate">{displayName}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {currentUser?.role === 'teacher'
                    ? 'Giáo viên'
                    : currentUser?.role === 'admin'
                    ? 'Quản trị viên Max10'
                    : `Học sinh ${selectedGrade}`}
                </div>
              </div>

              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuthModal();
                    setShowProfileMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'
                  }`}
                >
                  <LogIn className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-bold">
                    {currentUser ? 'Chuyển tài khoản' : 'Đăng nhập Học sinh / GV'}
                  </span>
                </button>
              )}

              {(onOpenNameModal || onOpenAvatarModal) && (
                <button
                  type="button"
                  onClick={() => {
                    (onOpenNameModal || onOpenAvatarModal)?.();
                    setShowProfileMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'
                  }`}
                >
                  <PenLine className="w-4 h-4 text-teal-500 shrink-0" />
                  <span className="font-semibold">Đổi tên &amp; Ảnh đại diện</span>
                </button>
              )}

              {onOpenPricingModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPricingModal();
                    setShowProfileMenu(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2 font-bold">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Gói VIP ({subscriptionPlan})</span>
                  </span>
                </button>
              )}

              {onOpenStoreModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenStoreModal();
                    setShowProfileMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold">Cài đặt App (PWA)</span>
                </button>
              )}

              {onOpenThemeModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenThemeModal();
                    setShowProfileMenu(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Palette className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Phông nền học tập</span>
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[70px]">
                    {activeTheme?.callName || 'Mặc định'}
                  </span>
                </button>
              )}

              {onOpenVoiceModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenVoiceModal();
                    setShowProfileMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-teal-500 shrink-0" />
                  <span className="font-semibold">Giọng nói AI Gemini</span>
                </button>
              )}

              {onToggleTheme && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme();
                    setShowProfileMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'
                  }`}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                  )}
                  <span className="font-semibold">Giao diện {isDark ? 'Sáng' : 'Tối'}</span>
                </button>
              )}

              {currentUser && onLogout && (
                <>
                  <div className="my-1.5 h-px bg-slate-200/80 dark:bg-white/[0.08]" />
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
