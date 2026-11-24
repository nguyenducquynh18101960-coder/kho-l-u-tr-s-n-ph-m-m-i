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
  RotateCw,
  Mic,
  Globe,
  Check,
} from 'lucide-react';
import { GradeLevel } from '../../types';
import { BackgroundTheme } from '../../types/theme';
import { UserAccount } from '../../types/auth';
import { loadStudentAchievements, StudentAchievementStats } from '../../data/initialAchievements';
import { calculateLevel, formatLevelLabel, MAX_LEVEL } from '../../types/achievements';
import { getUserInitials } from './UserNameModal';
import { MainTabId, HubSpaceId, getSpaceFromTab } from './Sidebar';
import { CountryCode, COUNTRY_CULTURES, getCountryCulture } from '../../data/countryCultures';

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
  hasUnreadNotifications?: boolean;
  historyCount?: number;
  onLogout?: () => void;
  countryCode?: CountryCode;
  onSelectCountry?: (code: CountryCode) => void;
  bilingualMode?: boolean;
  onToggleBilingualMode?: () => void;
  quizVoiceMode?: boolean;
  onToggleQuizVoiceMode?: () => void;
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
  hasUnreadNotifications = false,
  onLogout,
  countryCode = 'VN',
  onSelectCountry,
  bilingualMode = true,
  onToggleBilingualMode,
  quizVoiceMode = false,
  onToggleQuizVoiceMode,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);

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
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setShowCountryMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCountry = getCountryCulture(countryCode);

  const currentSpace = activeSpace || getSpaceFromTab(activeTab);
  const currentXp = achievementStats.totalXp;
  const levelInfo = calculateLevel(currentXp);
  const nextXp = levelInfo.nextLevelXp;
  const xpNeeded = levelInfo.isMaxLevel ? 0 : Math.max(0, nextXp - currentXp);
  const displayStreak = achievementStats.streak.currentStreak > 0 ? achievementStats.streak.currentStreak : 10;
  const unlockedBadges = achievementStats.badges.filter((b) => b.isUnlocked).length;
  const displayBadges = unlockedBadges >= 7 ? unlockedBadges : 7;

  const displayName = currentUser?.name || (userName && userName !== 'Bạn học' ? userName : 'Bạn học');

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

        {onToggleContextPanel && activeTab !== 'group' && (
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

      {/* Right: Quick Quiz/Voice Mode + Country Selector + Study Metrics + Spin + Notifications + Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Quick Toggle: Hỏi bài cùng Gia sư AI (Interactive Quiz & Voice) */}
        {onToggleQuizVoiceMode && (
          <button
            type="button"
            onClick={onToggleQuizVoiceMode}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              quizVoiceMode && activeTab === 'chat'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/25'
                : isDark
                ? 'bg-indigo-500/12 border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300'
                : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700'
            }`}
            title="Chuyển nhanh chế độ Nói chuyện & Hỏi bài cùng Gia sư AI"
          >
            <Mic className={`w-3.5 h-3.5 shrink-0 ${quizVoiceMode && activeTab === 'chat' ? 'animate-pulse' : ''}`} />
            <span className="hidden xl:inline">Hỏi bài cùng Gia sư AI</span>
            <span className="hidden sm:inline xl:hidden">Hỏi bài AI</span>
            {quizVoiceMode && activeTab === 'chat' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" />
            )}
          </button>
        )}

        {/* Country & Language Selector Dropdown */}
        {onSelectCountry && (
          <div className="relative shrink-0" ref={countryRef}>
            <button
              type="button"
              onClick={() => setShowCountryMenu((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                countryCode !== 'VN'
                  ? isDark
                    ? 'bg-teal-500/15 border-teal-500/35 text-teal-300 hover:bg-teal-500/25'
                    : 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
                  : isDark
                  ? 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-zinc-200'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title={`Quốc gia & Ngôn ngữ AI: ${currentCountry.name} (${currentCountry.languageName})`}
            >
              <span className="text-sm leading-none shrink-0">{currentCountry.flag}</span>
              <span className="hidden md:inline max-w-[90px] truncate">{currentCountry.shortName}</span>
              <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
            </button>

            {showCountryMenu && (
              <div
                className={`absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl p-2 border shadow-2xl z-50 text-xs ${
                  isDark
                    ? 'bg-[#101622] border-white/10 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="px-2.5 py-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Quốc gia &amp; Văn hóa AI</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Giọng &amp; Xưng hô</span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1 pr-0.5">
                  {COUNTRY_CULTURES.map((c) => {
                    const isSelected = c.code === countryCode;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          onSelectCountry(c.code);
                          setShowCountryMenu(false);
                        }}
                        className={`w-full flex items-start justify-between gap-2 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? isDark
                              ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-300'
                              : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                            : isDark
                            ? 'hover:bg-white/[0.06] border border-transparent'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-base leading-none mt-0.5 shrink-0">{c.flag}</span>
                          <div className="min-w-0">
                            <div className="font-extrabold flex items-center gap-1.5 truncate">
                              <span>{c.name}</span>
                              <span className="text-[10px] font-semibold opacity-75">· {c.nativeName}</span>
                            </div>
                            <div className="text-[10px] opacity-75 truncate mt-0.5">{c.toneStyle}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>

                {onToggleBilingualMode && countryCode !== 'VN' && (
                  <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.08] px-1">
                    <button
                      type="button"
                      onClick={onToggleBilingualMode}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                        bilingualMode
                          ? 'bg-indigo-500/12 text-indigo-600 dark:text-indigo-300'
                          : isDark
                          ? 'bg-white/[0.04] text-zinc-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>Song ngữ (Kèm dịch Tiếng Việt)</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          bilingualMode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-400/30 text-slate-600 dark:text-zinc-300'
                        }`}
                      >
                        {bilingualMode ? 'BẬT' : 'BẢN NGỮ'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Study Metrics Pill */}
        <button
          type="button"
          onClick={onOpenAchievementsModal || (() => onSelectTab('achievements'))}
          className={`hidden 2xl:inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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

        {/* Màn hình quay XP Lên Cấp */}
        <button
          type="button"
          onClick={() => onSelectTab('spin')}
          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'spin'
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
              : isDark
              ? 'bg-emerald-500/12 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300'
              : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800'
          }`}
          title="Mở Màn Hình Quay XP Lên Cấp"
        >
          <RotateCw className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden lg:inline">Quay XP Lên Cấp</span>
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
          {hasUnreadNotifications && (
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          )}
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
