import React, { useState, useRef, useEffect } from 'react';
import {
  PanelLeft,
  Sparkles,
  RotateCw,
  GraduationCap,
  Award,
  BookOpen,
  MessageSquare,
  FileCheck2,
  ImageIcon,
  Lightbulb,
  GitFork,
  Palette,
  Volume2,
  Video,
  LogIn,
  User,
  Users,
  Globe,
  Zap,
  ChevronDown,
  Layers,
  Trophy,
  Flame,
  Calendar,
} from 'lucide-react';
import { GradeLevel } from '../../types';
import { BackgroundTheme } from '../../types/theme';
import { UserAccount } from '../../types/auth';
import { PWAInstallButton } from './PWAInstallButton';
import { loadStudentAchievements, StudentAchievementStats } from '../../data/initialAchievements';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  selectedGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  isDark: boolean;
  activeTab: 'chat' | 'group' | 'image' | 'video' | 'exam' | 'grade' | 'tips' | 'plan' | 'mindmap' | 'teacher' | 'control' | 'achievements' | 'schedule' | 'class_management';
  onSelectTab: (tab: 'chat' | 'group' | 'image' | 'video' | 'exam' | 'grade' | 'tips' | 'plan' | 'mindmap' | 'teacher' | 'control' | 'achievements' | 'schedule' | 'class_management') => void;
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
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNewChat,
  selectedGrade,
  onSelectGrade,
  isDark,
  activeTab,
  onSelectTab,
  onOpenOfferModal,
  onOpenIntroModal,
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
}) => {
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Real-time XP Progress Bar state
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

  const currentXp = achievementStats.totalXp;
  const nextXp = achievementStats.nextLevelXp;
  const xpNeeded = Math.max(0, nextXp - currentXp);
  const xpPercent = Math.min(100, Math.round((currentXp / nextXp) * 100));

  // Close tools popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
    }
    if (showToolsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showToolsMenu]);

  const primaryTabs = [
    { id: 'chat' as const, label: 'Gia sư AI', icon: MessageSquare },
    { id: 'schedule' as const, label: 'Lịch học', icon: Calendar },
    { id: 'group' as const, label: 'Nhóm học', icon: Users },
    { id: 'exam' as const, label: 'Luyện đề', icon: BookOpen },
    { id: 'grade' as const, label: 'Chấm bài', icon: FileCheck2 },
  ];

  const secondaryTabs = [
    { id: 'schedule' as const, label: 'Lịch học cá nhân', icon: Calendar, desc: 'Lịch kiểm tra, bài tập & sự kiện' },
    { id: 'achievements' as const, label: 'Thành tích & Huy hiệu', icon: Trophy, desc: 'Theo dõi chuỗi 10 ngày, Bậc thầy Đại số & XP' },
    { id: 'video' as const, label: 'Làm Video AI', icon: Video, desc: 'Tạo video người nói thuyết trình' },
    { id: 'mindmap' as const, label: 'Sơ đồ tư duy', icon: GitFork, desc: 'Hệ thống hóa bài học điểm 10' },
    { id: 'image' as const, label: 'Vẽ ảnh AI', icon: ImageIcon, desc: 'Tạo hình ảnh minh họa bài học' },
    { id: 'tips' as const, label: 'Bẫy điểm 10', icon: Lightbulb, desc: 'Cảnh báo lỗi sai hay mất điểm' },
    { id: 'teacher' as const, label: 'Hỏi bài Thầy Cô', icon: GraduationCap, desc: 'Gửi bài giáo viên giải đáp' },
  ];

  const isSecondaryActive = secondaryTabs.some((t) => t.id === activeTab);
  const activeSecondaryItem = secondaryTabs.find((t) => t.id === activeTab);

  return (
    <header className="px-3 pt-2.5 pb-1 shrink-0 z-20 select-none">
      <div className="h-14 rounded-2xl flex items-center justify-between px-3 sm:px-4 transition-all bg-white/90 dark:bg-[#0c1018]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
      {/* Left: Sidebar toggle + Brand lockup + 5 Steps Điểm 10 button */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl transition-all neu-btn text-slate-600 dark:text-zinc-300"
          title="Đóng / Mở thanh bên"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Brand identity */}
        <div
          onClick={onNewChat}
          className="flex items-center gap-2 cursor-pointer group"
          title="Max10 AI - Trợ lý học tập thông minh"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs border border-white/60 dark:border-white/10 group-hover:scale-105 transition-transform shrink-0 p-0.5 neu-btn">
            <img
              src="/max10-avatar.jpg"
              alt="Max10"
              className="w-full h-full object-cover rounded-[9px]"
            />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-black text-sm tracking-tight text-slate-900 dark:text-zinc-100">
              Max10
            </span>
            <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              AI
            </span>
          </div>
        </div>

        {/* 5 Bước Điểm 10 Quick Button */}
        <button
          type="button"
          onClick={onOpenOfferModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer neu-btn text-emerald-800 dark:text-emerald-300"
          title="Mở hướng dẫn: 5 Bước học tập chuẩn Điểm 10"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>5 Bước Điểm 10</span>
        </button>

        {/* Giới thiệu Max10 & Tác giả Mạc Khánh Duy */}
        {onOpenIntroModal && (
          <button
            type="button"
            onClick={onOpenIntroModal}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer neu-btn text-slate-700 dark:text-zinc-300"
            title="Xem giới thiệu Max10 AI, cách sử dụng và tác giả sáng lập Mạc Khánh Duy"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Giới thiệu Max10</span>
          </button>
        )}
      </div>

      {/* Center: Main Clean Navigation Tabs */}
      <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/50 dark:border-white/[0.04]">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-slate-200/50 dark:shadow-none'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* Secondary Tools Dropdown */}
        <div className="relative" ref={toolsMenuRef}>
          <button
            type="button"
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isSecondaryActive
                ? 'neu-btn neu-btn-active text-emerald-600 dark:text-emerald-400 bg-white/90 dark:bg-zinc-800/90'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isSecondaryActive && activeSecondaryItem ? activeSecondaryItem.label : 'Công cụ AI'}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showToolsMenu && (
            <div
              className={`absolute top-full left-0 mt-2 w-56 rounded-2xl p-2 shadow-xl border z-50 text-xs ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                  : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
              }`}
            >
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Học tập & Sáng tạo
              </div>
              {secondaryTabs.map((tool) => {
                const Icon = tool.icon;
                const isItemActive = activeTab === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(tool.id);
                      setShowToolsMenu(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      isItemActive
                        ? isDark
                          ? 'bg-emerald-950/40 text-emerald-400 font-semibold'
                          : 'bg-emerald-50 text-emerald-700 font-semibold'
                        : isDark
                        ? 'hover:bg-zinc-800 text-zinc-300'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5 shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs">{tool.label}</div>
                      <div className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                        {tool.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Theme, Voice, User Profile, VIP plan, Install & Refresh */}
      <div className="flex items-center gap-1.5 sm:gap-2">

        {/* Real-time XP Progress Bar in Header */}
        <button
          type="button"
          onClick={onOpenAchievementsModal || (() => onSelectTab('achievements'))}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all neu-btn text-xs font-bold cursor-pointer hover:border-amber-400/50"
          title={`Điểm số hiện tại: ${currentXp}/${nextXp} XP (Cấp ${achievementStats.level} - ${achievementStats.levelTitle}) · Còn ${xpNeeded} XP nữa để lên cấp!`}
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
              {achievementStats.level}
            </span>
            <span className="font-extrabold text-[11px] text-amber-600 dark:text-amber-400">
              {currentXp}/{nextXp} XP
            </span>
          </div>

          {/* Animated XP Progress Track */}
          <div className="w-14 sm:w-20 h-2 rounded-full bg-slate-200/80 dark:bg-zinc-800 overflow-hidden relative shadow-inner shrink-0">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${xpPercent}%` }}
            />
          </div>

          <span className="hidden xl:inline text-[10px] text-slate-400 dark:text-zinc-500 font-semibold shrink-0">
            (còn {xpNeeded} XP)
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 pl-1 border-l border-amber-500/30 text-[10px] text-orange-500 font-bold shrink-0">
            <Flame className="w-3 h-3 fill-orange-500" />
            <span>{achievementStats.streak.currentStreak} ngày</span>
          </span>
        </button>

        {/* Voice Modal Toggle */}
        {onOpenVoiceModal && (
          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="p-2 rounded-xl transition-all neu-btn text-slate-600 dark:text-zinc-300"
            title="Cài đặt Giọng nói AI"
          >
            <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </button>
        )}

        {/* Quick Theme Switcher Button */}
        {onOpenThemeModal && (
          <button
            type="button"
            onClick={onOpenThemeModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all neu-btn text-slate-700 dark:text-zinc-200 cursor-pointer text-xs font-bold"
            title={`Đổi giao diện & phông nền mới (Hiện tại: ${activeTheme?.callName || 'Mặc định'})`}
          >
            <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden xl:inline text-[11px]">Đổi giao diện</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        )}

        {/* VIP / Subscription Badge */}
        {onOpenPricingModal && (
          <button
            type="button"
            onClick={() => onOpenPricingModal()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all neu-btn text-amber-700 dark:text-amber-400"
            title="Nâng cấp gói Plus (100k) hoặc Premium (500k) tốc độ cao"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
            <span>{subscriptionPlan === 'plus' ? 'PLUS' : subscriptionPlan === 'premium' ? 'PREMIUM' : 'VIP'}</span>
          </button>
        )}

        {/* User Account Button */}
        {onOpenAuthModal && (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all neu-btn text-slate-800 dark:text-zinc-100"
            title={currentUser ? `Tài khoản: ${currentUser.name}` : 'Đăng nhập tài khoản'}
          >
            {currentUser ? (
              <>
                <div className="relative shrink-0">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white dark:border-zinc-900 ${
                      currentUser.presenceStatus === 'dnd'
                        ? 'bg-rose-500'
                        : currentUser.presenceStatus === 'gaming'
                        ? 'bg-amber-400'
                        : currentUser.presenceStatus === 'offline'
                        ? 'bg-slate-400'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
                <span className="max-w-[70px] sm:max-w-[100px] truncate font-bold">{currentUser.name}</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Đăng nhập</span>
              </>
            )}
          </button>
        )}

        {/* PWA App Install Button */}
        <PWAInstallButton onOpenStoreModal={onOpenStoreModal} />

        {/* Refresh New Chat */}
        <button
          type="button"
          onClick={onNewChat}
          className="p-2 rounded-xl transition-all neu-btn text-slate-600 dark:text-zinc-300"
          title="Tạo hội thoại mới"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
      </div>
    </header>
  );
};
