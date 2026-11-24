import React from 'react';
import {
  Plus,
  Image as ImageIcon,
  BookOpen,
  FileCheck2,
  Lightbulb,
  Calendar,
  MessageSquare,
  Sun,
  Moon,
  Sparkles,
  GraduationCap,
  GitFork,
  Video,
  Users,
  Sliders,
  Trophy,
  Target,
  Bell,
  Bot,
  LayoutGrid,
  User,
  X,
  RotateCw,
  TrendingUp,
} from 'lucide-react';
import { GradeLevel, ChatSession } from '../../types';
import { BackgroundTheme } from '../../types/theme';
import { UserAccount } from '../../types/auth';
import { getUserInitials } from './UserNameModal';

export type MainTabId =
  | 'chat'
  | 'group'
  | 'image'
  | 'video'
  | 'exam'
  | 'grade'
  | 'tips'
  | 'plan'
  | 'mindmap'
  | 'teacher'
  | 'control'
  | 'achievements'
  | 'schedule'
  | 'class_management'
  | 'spin'
  | 'tracker';

export type HubSpaceId = 'ai' | 'community' | 'practice' | 'tools';

export function getSpaceFromTab(tab: MainTabId): HubSpaceId {
  if (tab === 'group') return 'community';
  if (tab === 'exam' || tab === 'grade' || tab === 'spin' || tab === 'tracker') return 'practice';
  if (
    tab === 'schedule' ||
    tab === 'mindmap' ||
    tab === 'tips' ||
    tab === 'image' ||
    tab === 'video' ||
    tab === 'plan' ||
    tab === 'teacher' ||
    tab === 'achievements' ||
    tab === 'class_management' ||
    tab === 'control'
  ) {
    return 'tools';
  }
  return 'ai';
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions?: ChatSession[];
  currentSessionId?: string;
  onSelectSession?: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession?: (id: string, e: React.MouseEvent) => void;
  selectedGrade?: GradeLevel;
  onSelectGrade?: (grade: GradeLevel) => void;
  activeTab: MainTabId;
  setActiveTab: (tab: MainTabId) => void;
  activeSpace?: HubSpaceId;
  onSelectSpace?: (space: HubSpaceId) => void;
  isDark: boolean;
  onToggleTheme: () => void;
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
  isAdmin?: boolean;
  isFullscreen?: boolean;
  unreadGroupMessagesCount?: number;
  onOpenAchievementsModal?: () => void;
  onOpenAdminNotifications?: () => void;
  hasAdminNotificationDot?: boolean;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onNewChat,
  activeTab,
  setActiveTab,
  activeSpace,
  onSelectSpace,
  isDark,
  onToggleTheme,
  userName = 'Bạn học',
  onOpenNameModal,
  currentUser,
  onOpenAuthModal,
  userAvatar,
  isAdmin = false,
  isFullscreen = false,
  unreadGroupMessagesCount = 0,
  onOpenAdminNotifications,
  hasAdminNotificationDot = false,
}) => {
  if (isFullscreen) {
    return null;
  }

  const currentSpace: HubSpaceId = activeSpace || getSpaceFromTab(activeTab);
  const displayName =
    currentUser?.name || (userName && userName !== 'Bạn học' ? userName : 'Bạn học');
  const avatarSrc = currentUser?.avatar || userAvatar;
  const showNotifDot = Boolean(hasAdminNotificationDot);

  const railSpaces: Array<{
    id: HubSpaceId;
    label: string;
    subtitle: string;
    icon: React.FC<{ className?: string }>;
    badgeCount?: number;
    defaultTab: MainTabId;
  }> = [
    {
      id: 'ai',
      label: 'Gia sư AI',
      subtitle: 'Hỏi bài, giải chi tiết, sơ đồ tư duy',
      icon: Bot,
      defaultTab: 'chat',
    },
    {
      id: 'community',
      label: 'Cộng đồng & Chat',
      subtitle: 'Nhóm học tập & Nhắn tin 1-1',
      icon: Users,
      badgeCount: unreadGroupMessagesCount,
      defaultTab: 'group',
    },
    {
      id: 'practice',
      label: 'Kho Luyện Tập',
      subtitle: 'Luyện đề, Chấm bài, Mini game, Quay XP',
      icon: BookOpen,
      defaultTab: 'exam',
    },
    {
      id: 'tools',
      label: 'Công cụ AI & Lịch học',
      subtitle: 'Lịch học, Sơ đồ tư duy, Ảnh & Video AI',
      icon: LayoutGrid,
      defaultTab: 'schedule',
    },
  ];

  const handleSpaceClick = (space: (typeof railSpaces)[number]) => {
    if (onSelectSpace) {
      onSelectSpace(space.id);
    } else {
      setActiveTab(space.defaultTab);
    }
    onClose();
  };

  const mobileSubTools: Array<{
    id: MainTabId;
    label: string;
    icon: React.FC<{ className?: string }>;
    accent: string;
  }> = [
    { id: 'chat', label: 'Gia sư AI', icon: MessageSquare, accent: 'text-emerald-500' },
    { id: 'group', label: 'Cộng đồng & Chat', icon: Users, accent: 'text-teal-500' },
    { id: 'exam', label: 'Luyện đề thi', icon: BookOpen, accent: 'text-emerald-500' },
    { id: 'grade', label: 'Chấm bài AI', icon: FileCheck2, accent: 'text-sky-500' },
    { id: 'tracker', label: 'Phân tích Lỗ hổng AI', icon: TrendingUp, accent: 'text-emerald-500' },
    { id: 'spin', label: 'Quay XP Lên Cấp', icon: RotateCw, accent: 'text-emerald-500' },
    { id: 'schedule', label: 'Lịch học cá nhân', icon: Calendar, accent: 'text-emerald-500' },
    { id: 'mindmap', label: 'Sơ đồ tư duy', icon: GitFork, accent: 'text-teal-500' },
    { id: 'tips', label: 'Cảnh báo bẫy đề', icon: Lightbulb, accent: 'text-amber-500' },
    { id: 'image', label: 'Vẽ ảnh AI', icon: ImageIcon, accent: 'text-sky-500' },
    { id: 'video', label: 'Video bài giảng AI', icon: Video, accent: 'text-rose-500' },
    { id: 'plan', label: 'Lộ trình ôn thi', icon: Target, accent: 'text-indigo-500' },
    { id: 'teacher', label: 'Hỏi bài Thầy Cô', icon: GraduationCap, accent: 'text-emerald-500' },
    { id: 'achievements', label: 'Thành tích & Huy hiệu', icon: Trophy, accent: 'text-amber-500' },
    ...((currentUser?.role === 'teacher' && currentUser?.isVerifiedTeacher !== false) || isAdmin
      ? [{ id: 'class_management' as const, label: 'Quản lý Lớp học', icon: Users, accent: 'text-violet-500' }]
      : []),
    ...(isAdmin
      ? [{ id: 'control' as const, label: 'Điều khiển Max10 AI', icon: Sliders, accent: 'text-amber-500' }]
      : []),
  ];

  return (
    <>
      {/* DESKTOP 68px FLUSH NAVIGATION RAIL */}
      <aside
        className={`hidden md:flex flex-col items-center w-[68px] shrink-0 h-full border-r py-3.5 justify-between select-none z-30 transition-colors ${
          isDark
            ? 'bg-[#090d15] border-white/[0.08] text-slate-200'
            : 'bg-white border-slate-200/85 text-slate-700'
        }`}
        aria-label="Thanh điều hướng chính"
      >
        {/* Top Brand + 4 Study Hub Spaces */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          {/* Brand Emblem */}
          <div className="relative group flex justify-center w-full">
            <button
              type="button"
              onClick={() => {
                if (onSelectSpace) onSelectSpace('ai');
                setActiveTab('chat');
                onNewChat();
              }}
              className="w-11 h-11 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-sm hover:scale-105 transition-transform cursor-pointer"
              aria-label="Max10 AI - Gia sư điểm 10 THCS"
            >
              <img
                src="/max10-avatar.jpg"
                alt="Max10 AI"
                className="w-full h-full object-cover rounded-[14px]"
                referrerPolicy="no-referrer"
              />
            </button>
            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white text-xs font-bold whitespace-nowrap shadow-xl z-50 border border-white/10">
              Max10 AI · Trang chủ
            </div>
          </div>

          <div
            className={`w-8 h-px my-0.5 ${
              isDark ? 'bg-white/[0.08]' : 'bg-slate-200/80'
            }`}
          />

          {/* 4 Primary Spaces */}
          <nav className="flex flex-col items-center gap-2 w-full px-2">
            {railSpaces.map((space) => {
              const Icon = space.icon;
              const isActive = currentSpace === space.id;

              return (
                <div key={space.id} className="relative group flex justify-center w-full">
                  {/* Active Left Pill Marker (Discord-inspired indicator) */}
                  {isActive && (
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-500" />
                  )}

                  <button
                    type="button"
                    onClick={() => handleSpaceClick(space)}
                    className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                        : isDark
                        ? 'text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-100'
                        : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                    aria-label={space.label}
                  >
                    <Icon className="w-5 h-5" />
                    {typeof space.badgeCount === 'number' && space.badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs tabular-nums">
                        {space.badgeCount > 9 ? '9+' : space.badgeCount}
                      </span>
                    )}
                  </button>

                  {/* Hover Tooltip */}
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white shadow-xl z-50 border border-white/10 whitespace-nowrap">
                    <div className="text-xs font-extrabold">{space.label}</div>
                    <div className="text-[10px] text-slate-300 font-medium">{space.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail Actions: Notification Bell (Red Dot) + Light/Dark Toggle + Student Avatar */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          {/* Notification Bell with Red Dot */}
          <div className="relative group flex justify-center w-full">
            <button
              type="button"
              onClick={onOpenAdminNotifications}
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isDark
                  ? 'text-zinc-300 hover:bg-white/[0.07] hover:text-emerald-400'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
              aria-label="Thông báo từ Admin và Hệ thống"
            >
              <Bell className="w-5 h-5" />
              {showNotifDot && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#090d15]" />
              )}
            </button>
            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white text-xs font-bold whitespace-nowrap shadow-xl z-50 border border-white/10">
              Thông báo từ Admin &amp; Quà lễ
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="relative group flex justify-center w-full">
            <button
              type="button"
              onClick={onToggleTheme}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isDark
                  ? 'text-amber-400 hover:bg-white/[0.07]'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-label={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white text-xs font-bold whitespace-nowrap shadow-xl z-50 border border-white/10">
              {isDark ? 'Chế độ Sáng' : 'Chế độ Tối'}
            </div>
          </div>

          {/* Student Avatar */}
          <div className="relative group flex justify-center w-full pt-1">
            <button
              type="button"
              onClick={onOpenNameModal || onOpenAuthModal}
              className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/60 hover:border-emerald-400 shadow-sm transition-transform hover:scale-105 cursor-pointer bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs"
              aria-label={`Hồ sơ ${displayName}`}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{displayName ? getUserInitials(displayName) : <User className="w-4 h-4" />}</span>
              )}
            </button>
            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white text-xs font-bold whitespace-nowrap shadow-xl z-50 border border-white/10">
              {displayName} · Hồ sơ học sinh
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER (< md) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden select-none">
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
          />
          <aside
            className={`relative z-10 w-[272px] h-full flex flex-col border-r p-3.5 justify-between overflow-y-auto ${
              isDark
                ? 'bg-[#0b1019] border-white/10 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-emerald-600 to-teal-400">
                    <img
                      src="/max10-avatar.jpg"
                      alt="Max10 AI"
                      className="w-full h-full object-cover rounded-[9px]"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-black">Max10 AI</div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {displayName}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('chat');
                  onNewChat();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Đặt câu hỏi mới</span>
              </button>

              <div className="space-y-1">
                <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Không gian học tập
                </div>
                {mobileSubTools.map((tool) => {
                  const Icon = tool.icon;
                  const active = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tool.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${tool.accent}`} />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenAdminNotifications?.();
                  onClose();
                }}
                className="relative flex-1 px-3 py-2 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Thông báo</span>
                {showNotifDot && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                )}
              </button>
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold flex items-center gap-1.5"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{isDark ? 'Sáng' : 'Tối'}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
