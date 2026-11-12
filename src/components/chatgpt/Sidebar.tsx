import React, { useState } from 'react';
import {
  Plus,
  Image as ImageIcon,
  BookOpen,
  FileCheck2,
  Lightbulb,
  Calendar,
  Search,
  PanelLeftClose,
  MessageSquare,
  Trash2,
  Sun,
  Moon,
  Sparkles,
  Pin,
  GraduationCap,
  Award,
  Info,
  GitFork,
  Palette,
  Volume2,
  PenLine,
  Video,
  LogIn,
  User,
  Users,
  Globe,
  Zap,
  Sliders,
  Trophy,
  Flame,
} from 'lucide-react';
import { GradeLevel, ChatSession } from '../../types';
import { BackgroundTheme } from '../../types/theme';
import { getUserInitials } from './UserNameModal';
import { UserAccount } from '../../types/auth';
import { PWAInstallButton } from './PWAInstallButton';
import { DailyLoginStreakWidget } from './DailyLoginStreakWidget';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  selectedGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  activeTab: 'chat' | 'group' | 'image' | 'video' | 'exam' | 'grade' | 'tips' | 'plan' | 'mindmap' | 'teacher' | 'control' | 'achievements' | 'schedule' | 'class_management';
  setActiveTab: (tab: 'chat' | 'group' | 'image' | 'video' | 'exam' | 'grade' | 'tips' | 'plan' | 'mindmap' | 'teacher' | 'control' | 'achievements' | 'schedule' | 'class_management') => void;
  isDark: boolean;
  onToggleTheme: () => void;
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
  isAdmin?: boolean;
  isFullscreen?: boolean;
  unreadGroupMessagesCount?: number;
  onOpenAchievementsModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  selectedGrade,
  onSelectGrade,
  activeTab,
  setActiveTab,
  isDark,
  onToggleTheme,
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
  isAdmin = false,
  isFullscreen = false,
  unreadGroupMessagesCount = 0,
  onOpenAchievementsModal,
}) => {
  if (isFullscreen) {
    return null;
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const recentSessions = filteredSessions.filter((s) => !s.isPinned);

  // User Requirement: "thanh chỗ từ hỏi bài & gia sư AI từ chỗ đấy đến tạo ảnh và poster AI thìw giữ nguyên còn điều khiển Max10 AI chỉ có quản trị viên mới có"
  const tools = [
    {
      id: 'chat' as const,
      label: 'Hỏi bài & Gia sư AI',
      icon: MessageSquare,
      color: 'text-emerald-500',
    },
    {
      id: 'achievements' as const,
      label: 'Thành tích & Huy hiệu',
      icon: Trophy,
      color: 'text-amber-500',
      badge: '🔥 10 ngày',
      badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    },
    {
      id: 'exam' as const,
      label: 'Luyện đề & Bảng Vàng',
      icon: BookOpen,
      color: 'text-blue-500',
    },
    {
      id: 'schedule' as const,
      label: 'Lịch học cá nhân',
      icon: Calendar,
      color: 'text-cyan-500',
      badge: 'Mới',
      badgeColor: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'group' as const,
      label: 'Nhóm học tập & AI',
      icon: Users,
      color: 'text-indigo-500',
      badge: unreadGroupMessagesCount > 0 ? `${unreadGroupMessagesCount}` : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse shadow-xs',
    },
    {
      id: 'video' as const,
      label: 'Tạo Video Người AI Nói',
      icon: Video,
      color: 'text-rose-500',
    },
    {
      id: 'image' as const,
      label: 'Tạo Poster & Ảnh AI',
      icon: ImageIcon,
      color: 'text-rose-500',
      badge: '20/10',
    },
    {
      id: 'teacher' as const,
      label: 'Hỏi bài Thầy Cô',
      icon: GraduationCap,
      color: 'text-emerald-500',
    },
    // User Requirement: "Thêm một tab 'Quản lý Lớp học' trong sidebar chỉ hiển thị cho người dùng có vai trò là giáo viên. Tab này cho phép giáo viên chọn lớp (từ danh sách 6A1-9D6) và xem bảng điều khiển tổng hợp về danh sách học sinh, bài tập đã nộp, và tiến độ ôn luyện của từng học sinh trong lớp đó."
    ...(currentUser?.role === 'teacher' || isAdmin
      ? [
          {
            id: 'class_management' as const,
            label: 'Quản lý Lớp học',
            icon: Users,
            color: 'text-violet-500',
            badge: 'GV 6A1-9D6',
            badgeColor: 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30',
          },
        ]
      : []),
    // User Requirement: "còn điều khiển Max10 AI chỉ có quản trị viên mới có"
    ...(isAdmin
      ? [
          {
            id: 'control' as const,
            label: 'Điều khiển Max10 AI',
            icon: Sliders,
            color: 'text-amber-500',
            badge: 'Admin',
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-[275px] shrink-0 transition-all duration-200 ease-in-out select-none backdrop-blur-xl ${
          isOpen ? 'translate-x-0 flex' : '-translate-x-full md:hidden hidden'
        } ${
          isDark
            ? 'bg-[#0c1018]/95 text-slate-100 border-r border-white/[0.08] shadow-2xl shadow-black/40'
            : 'bg-white/95 text-slate-800 border-r border-slate-200/80 shadow-xl shadow-slate-200/40'
        }`}
      >
        {/* Top Header: Brand Identity */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06]">
          <div
            onClick={() => {
              setActiveTab('chat');
              onNewChat();
            }}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
            title="Max10 AI - Gia sư điểm 10 THCS"
          >
            {/* Unique Max10 Avatar with glowing ring */}
            <div className="w-8 h-8 rounded-xl overflow-hidden p-0.5 relative shrink-0 group-hover:scale-105 transition-transform bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/20">
              <img
                src="/max10-avatar.jpg"
                alt="Ảnh đại diện Max10"
                className="w-full h-full object-cover rounded-[9px]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-extrabold text-[13px] tracking-tight text-slate-900 dark:text-white block leading-tight">
                Max10 AI
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide block">
                Gia sư điểm 10 THCS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 rounded-xl transition-all neu-btn text-slate-600 dark:text-zinc-400"
              title="Tìm kiếm bài hỏi"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl transition-all neu-btn text-slate-600 dark:text-zinc-400 md:hidden"
              title="Đóng thanh bên"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar if expanded */}
        {showSearch && (
          <div className="px-3 pt-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài đã hỏi..."
              className="w-full px-3.5 py-2 text-xs rounded-xl neu-pressed text-slate-900 dark:text-white placeholder-slate-400 outline-none"
              autoFocus
            />
          </div>
        )}

        {/* New Question / Chat Action Button */}
        <div className="p-3">
          <button
            onClick={() => {
              setActiveTab('chat');
              onNewChat();
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl neu-accent-btn font-extrabold text-xs group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Đặt câu hỏi mới</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 opacity-90 group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        {/* Scrollable Content: Tools & History (Fully scrollable from question tools down to bottom) */}
        <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth px-3 space-y-3.5 text-xs pb-16">
          {/* Section 1: Công Cụ Điểm 10 */}
          <div>
            {/* 5 Bước Điểm 10 Button Link */}
            <button
              onClick={onOpenOfferModal}
              className="w-full mb-2 flex items-center justify-between p-2.5 rounded-2xl neu-btn text-xs font-bold text-emerald-800 dark:text-emerald-300"
              title="Bấm để xem 5 bước học tập chuẩn Điểm 10"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🚀</span>
                <span className="font-black tracking-tight">5 Bước Điểm 10</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full neu-pressed text-emerald-700 dark:text-emerald-300 font-extrabold">
                Bấm xem
              </span>
            </button>

            {/* Giới thiệu Max10 & Tác giả Mạc Khánh Duy */}
            {onOpenIntroModal && (
              <button
                type="button"
                onClick={onOpenIntroModal}
                className="w-full mb-2 flex items-center justify-between p-2.5 rounded-2xl neu-btn text-xs font-bold text-slate-800 dark:text-zinc-200"
                title="Giới thiệu Max10 AI, cách sử dụng và tác giả sáng lập Mạc Khánh Duy"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="font-bold tracking-tight">Giới thiệu Max10</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full neu-pressed text-amber-600 dark:text-amber-400 font-extrabold">
                  Tác giả
                </span>
              </button>
            )}

            {/* Permanent Link Button */}
            {onOpenStoreModal && (
              <button
                onClick={onOpenStoreModal}
                className={`w-full mb-2.5 flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-zinc-850/90 border-zinc-700 text-emerald-300 hover:bg-zinc-800'
                    : 'bg-white border-slate-200 text-emerald-800 hover:bg-slate-50 shadow-2xs'
                }`}
                title="Xem & Copy link xuất bản cố định 100% của Max10"
              >
                <div className="flex items-center gap-2 truncate">
                  <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">Link Xuất Bản Cố Định</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  Không đổi link
                </span>
              </button>
            )}

            <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Công cụ học tập
            </div>
            <div className="space-y-0.5">
              {tools.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all ${
                      isActive
                        ? isDark
                          ? 'bg-zinc-800/90 text-white font-semibold'
                          : 'bg-emerald-50/80 text-emerald-800 font-semibold border border-emerald-200/60'
                        : isDark
                        ? 'text-zinc-300 hover:bg-zinc-850 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${t.color}`} />
                      <span className="truncate">{t.label}</span>
                    </div>
                    {t.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black shrink-0 ${
                          t.badgeColor || 'neu-pressed text-rose-500'
                        }`}
                      >
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Login Streak: Shows consecutive study days and claims +50 XP bonus */}
          <DailyLoginStreakWidget
            isDark={isDark}
            className="my-1.5"
            onNavigateToAchievements={() => setActiveTab('achievements')}
          />

          {/* Section 2: Pinned / Important Questions */}
          {pinnedSessions.length > 0 && (
            <div>
              <div className="px-2.5 pb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                <Pin className="w-3 h-3 text-amber-500" />
                <span>Bài ghim quan trọng</span>
              </div>
              <div className="space-y-1">
                {pinnedSessions.map((s) => {
                  const isActive = activeTab === 'chat' && currentSessionId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSelectSession(s.id);
                        setActiveTab('chat');
                      }}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                        isActive
                          ? 'neu-pressed text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'neu-btn text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="truncate flex-1">{s.title}</span>
                      <button
                        onClick={(e) => onDeleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-500 transition-opacity shrink-0"
                        title="Xóa đoạn chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Recent History */}
          <div>
            <div className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Bài hỏi gần đây
            </div>
            {recentSessions.length === 0 ? (
              <p className="px-2.5 py-1 text-slate-400 text-[11px]">Chưa có bài hỏi nào.</p>
            ) : (
              <div className="space-y-1">
                {recentSessions.map((s) => {
                  const isActive = activeTab === 'chat' && currentSessionId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSelectSession(s.id);
                        setActiveTab('chat');
                      }}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                        isActive
                          ? 'neu-pressed text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'neu-btn text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="truncate flex-1">{s.title}</span>
                      <button
                        onClick={(e) => onDeleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-500 transition-opacity shrink-0"
                        title="Xóa"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Profile Area: Creator Signature & Theme Switcher */}
        <div
          className={`p-2.5 border-t text-xs ${
            isDark ? 'border-zinc-800/80 bg-zinc-900/60' : 'border-slate-200/80 bg-slate-50/80'
          }`}
        >
          {/* Install Max10 App / Store Publish Card */}
          <PWAInstallButton variant="sidebar" onOpenStoreModal={onOpenStoreModal} />

          {/* Account Login / User Profile */}
          {onOpenAuthModal && (
            <div
              onClick={onOpenAuthModal}
              className={`mb-2 p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                currentUser
                  ? isDark
                    ? 'bg-blue-950/30 border-blue-900/50 hover:bg-blue-900/40'
                    : 'bg-blue-50/70 border-blue-200 hover:bg-blue-100/80'
                  : 'bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
              title={
                currentUser
                  ? `Đang đăng nhập: ${currentUser.name} (${currentUser.role === 'teacher' ? 'Thầy cô' : currentUser.role === 'admin' ? 'Quản trị' : 'Học sinh'})`
                  : 'Đăng nhập Khách (Học sinh & Thầy cô)'
              }
            >
              <div className="flex items-center gap-2 min-w-0">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover shrink-0 border border-emerald-500/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-blue-600 text-white flex items-center justify-center shrink-0">
                    <LogIn className="w-3 h-3" />
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <p className="text-[11px] font-bold truncate text-slate-900 dark:text-zinc-100">
                    {currentUser ? currentUser.name : 'Đăng nhập Max10'}
                  </p>
                  <p className="text-[9px] text-slate-500 dark:text-zinc-400 truncate">
                    {currentUser
                      ? `${currentUser.role === 'teacher' ? 'Thầy cô' : currentUser.role === 'admin' ? 'Quản trị' : 'Học sinh'} · ${currentUser.email || 'Max10'}`
                      : 'Học sinh · Thầy cô giáo'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                {isAdmin ? 'Quản trị' : currentUser ? (currentUser.role === 'teacher' ? 'Thầy cô' : 'Học sinh') : 'Đăng nhập'}
              </span>
            </div>
          )}

          {/* Upgrade Plan Button (User requirement: Gói Plus 100k, Gói Premium 500k) */}
          {onOpenPricingModal && (
            <button
              type="button"
              onClick={() => onOpenPricingModal()}
              className={`w-full mb-2 p-2 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                subscriptionPlan === 'plus'
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : subscriptionPlan === 'premium'
                  ? 'border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : isDark
                  ? 'border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-amber-500/50 hover:text-amber-400'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-400 hover:text-amber-700 shadow-2xs'
              }`}
              title="Mở bảng nâng cấp gói Plus & Premium"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Zap className={`w-3.5 h-3.5 shrink-0 ${subscriptionPlan !== 'free' ? 'fill-current' : 'text-amber-500'}`} />
                <span className="truncate">
                  {subscriptionPlan === 'plus'
                    ? 'Gói Plus (100k)'
                    : subscriptionPlan === 'premium'
                    ? 'Gói Premium (500k)'
                    : '⚡ Nâng cấp gói VIP'}
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-extrabold bg-black/5 dark:bg-white/10 uppercase shrink-0">
                {subscriptionPlan === 'free' ? '0.1s tức thì' : 'Đang dùng'}
              </span>
            </button>
          )}

          {/* Student Profile Card */}
          <div
            className={`p-2 rounded-2xl border transition-all ${
              isDark ? 'bg-zinc-900/60 border-white/5 hover:border-amber-500/30' : 'bg-white border-slate-200/90 shadow-2xs hover:border-amber-400'
            }`}
          >
            <div
              onClick={onOpenAvatarModal || onOpenNameModal || onOpenOfferModal}
              className="flex items-center justify-between cursor-pointer"
              title={`Học sinh: ${userName} (Bấm để thay ảnh đại diện & đổi tên gọi)`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-emerald-500/50 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs uppercase">
                    {getUserInitials(userName)}
                  </div>
                )}
                <div className="text-left min-w-0">
                  <p className="font-bold leading-tight text-[11px] text-slate-900 dark:text-white flex items-center gap-1 truncate">
                    <span className="truncate">{userName}</span>
                    <Award className="w-3 h-3 text-amber-500 shrink-0" />
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-none mt-0.5 truncate">
                    Học sinh {selectedGrade} · Săn điểm 10
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenAchievementsModal) onOpenAchievementsModal();
                    else setActiveTab('achievements');
                  }}
                  className="p-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 cursor-pointer"
                  title="Mở Bảng Thành tích & Huy hiệu"
                >
                  <Trophy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onOpenAvatarModal || onOpenNameModal}
                  className="p-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0 cursor-pointer"
                  title="Đổi ảnh đại diện & tên gọi"
                >
                  <PenLine className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Earned Badges Row displayed directly in student profile */}
            <div
              onClick={() => {
                if (onOpenAchievementsModal) onOpenAchievementsModal();
                else setActiveTab('achievements');
              }}
              className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 cursor-pointer group"
              title="Xem chi tiết các huy hiệu đã đạt được"
            >
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[9px] font-black text-amber-700 dark:text-amber-400 shrink-0">
                <Flame className="w-2.5 h-2.5 fill-current text-amber-500" />
                <span>10 Ngày</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-[9px] font-black text-blue-700 dark:text-blue-400 shrink-0">
                <span>📐 Đại số</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-black text-emerald-700 dark:text-emerald-400 shrink-0 truncate">
                <span>🏆 7 Huy hiệu</span>
              </div>
            </div>
          </div>

          {/* Dark Mode / Light Mode Control */}
          <div className="mt-1.5 px-0.5">
            <div className="flex items-center justify-between px-1 pt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Giao diện</span>
              <button
                onClick={onToggleTheme}
                className={`p-1 px-2 rounded-lg border flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isDark ? (
                  <>
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>Sáng</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3 h-3 text-indigo-500" />
                    <span>Tối</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
