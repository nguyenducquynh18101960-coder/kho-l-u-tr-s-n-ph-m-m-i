import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Pin,
  Smartphone,
  Zap,
  Users,
  UserPlus,
  BookOpen,
  FileCheck2,
  Trophy,
  Sparkles,
  Calendar,
  GitFork,
  Lightbulb,
  Image as ImageIcon,
  Video,
  Target,
  GraduationCap,
  Sliders,
  PanelLeftClose,
  Globe,
  Bell,
  Gamepad2,
  TrendingUp,
} from 'lucide-react';
import { ChatSession, ChatGroup, FriendItem } from '../../types';
import { UserAccount } from '../../types/auth';
import { MainTabId, HubSpaceId, getSpaceFromTab } from './Sidebar';

interface ContextPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  activeTab: MainTabId;
  activeSpace: HubSpaceId;
  setActiveTab: (tab: MainTabId) => void;
  isDark: boolean;
  // Chat history props
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  // Modals & User
  currentUser: UserAccount | null;
  isAdmin: boolean;
  subscriptionPlan: 'free' | 'plus' | 'premium';
  onOpenStoreModal?: () => void;
  onOpenPricingModal?: (initialPlan?: 'plus' | 'premium', initialStep?: 'plans' | 'checkout') => void;
  onOpenAchievementsModal?: () => void;
}

const STORAGE_KEY_GROUPS = 'max10_real_groups_v15';
const STORAGE_KEY_FRIENDS = 'max10_real_friends_list_v15';

export const ContextPanel: React.FC<ContextPanelProps> = ({
  isOpen,
  onClose,
  activeTab,
  activeSpace,
  setActiveTab,
  isDark,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  currentUser,
  isAdmin,
  subscriptionPlan,
  onOpenStoreModal,
  onOpenPricingModal,
  onOpenAchievementsModal,
}) => {
  const [historySearch, setHistorySearch] = useState('');
  const [friendSearch, setFriendSearch] = useState('');

  // Community Groups & Friends synced with GroupChatStudio
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [selectedCommunityKey, setSelectedCommunityKey] = useState<string>('');

  const loadCommunityLists = () => {
    try {
      const gRaw = localStorage.getItem(STORAGE_KEY_GROUPS);
      if (gRaw) {
        const parsedG = JSON.parse(gRaw);
        if (Array.isArray(parsedG)) {
          setGroups((prev) => (JSON.stringify(prev) === gRaw ? prev : parsedG));
        }
      }
      const fRaw = localStorage.getItem(STORAGE_KEY_FRIENDS);
      if (fRaw) {
        const parsedF = JSON.parse(fRaw);
        if (Array.isArray(parsedF)) {
          setFriends((prev) => (JSON.stringify(prev) === fRaw ? prev : parsedF));
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadCommunityLists();
    const onRefresh = () => loadCommunityLists();
    const onCommunitySelection = (e: Event) => {
      const detail = (e as CustomEvent<{ type: 'group' | 'direct'; id: string }>).detail;
      if (detail?.id) {
        setSelectedCommunityKey(`${detail.type}:${detail.id}`);
      }
    };
    window.addEventListener('max10_groups_updated', onRefresh);
    window.addEventListener('max10_friends_updated', onRefresh);
    window.addEventListener('max10_community_active_changed', onCommunitySelection);
    window.addEventListener('focus', onRefresh);
    return () => {
      window.removeEventListener('max10_groups_updated', onRefresh);
      window.removeEventListener('max10_friends_updated', onRefresh);
      window.removeEventListener('max10_community_active_changed', onCommunitySelection);
      window.removeEventListener('focus', onRefresh);
    };
  }, []);

  if (!isOpen) return null;

  const effectiveSpace = activeSpace || getSpaceFromTab(activeTab);

  // Filtered AI chat sessions
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(historySearch.toLowerCase())
  );
  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const recentSessions = filteredSessions.filter((s) => !s.isPinned);

  // Filtered Community friends & groups
  const qCommunity = friendSearch.trim().toLowerCase();
  const visibleGroups = groups.filter((g) =>
    !qCommunity
      ? true
      : (g.name || '').toLowerCase().includes(qCommunity) ||
        (g.gameTitle || '').toLowerCase().includes(qCommunity) ||
        (g.gamePlatform || '').toLowerCase().includes(qCommunity)
  );
  const visibleFriends = friends.filter((f) =>
    !qCommunity ? true : (f.name || '').toLowerCase().includes(qCommunity)
  );

  const LEGACY_SEPARATE_GAME_IDS = new Set([
    'community-game-minecraft',
    'community-game-roblox',
    'community-game-hoyoverse',
    'community-game-fortnite',
    'community-game-party-coop',
    'community-game-sports-racing',
    'community-game-board-web',
    'community-game-lienquan',
    'community-game-pubg-ff',
    'community-game-supercell',
    'community-game-playtogether',
    'community-game-lol-tft',
    'community-game-valorant-cs2',
    'community-game-steam-sandbox',
    'community-game-nintendo',
    'community-game-ps-xbox',
    'community-game-retro-rhythm',
  ]);

  const regularGroups = visibleGroups.filter((g) => !g.isCommunity);
  const communityGroups = visibleGroups.filter(
    (g) =>
      Boolean(g.isCommunity) &&
      (g.approvalStatus || 'approved') === 'approved' &&
      !LEGACY_SEPARATE_GAME_IDS.has(g.id)
  );
  const gameCommunityGroups = communityGroups.filter((g) => g.communityCategory === 'game');
  const pinnedTrendingGames = gameCommunityGroups.filter((g) => Boolean(g.isPinnedTrending));

  const handleOpenCommunityItem = (type: 'group' | 'direct', id: string) => {
    setSelectedCommunityKey(`${type}:${id}`);
    setActiveTab('group');
    try {
      localStorage.setItem(
        'max10_target_chat_open',
        JSON.stringify({ type, targetId: id, timestamp: Date.now() })
      );
    } catch {}
    window.dispatchEvent(
      new CustomEvent('max10_community_select', { detail: { type, id } })
    );
  };

  const handleOpenCommunitiesDirectory = (category: 'all' | 'game' | 'study' | 'chat' = 'all') => {
    if (category === 'game') {
      setSelectedCommunityKey('group:community-game-max10');
      setActiveTab('group');
      window.dispatchEvent(new CustomEvent('max10_open_game_community'));
      return;
    }
    setSelectedCommunityKey('communities_directory');
    setActiveTab('group');
    window.dispatchEvent(new CustomEvent('max10_open_communities', { detail: { category } }));
  };

  const handleOpenCommunityModal = (modal: 'find_friends' | 'create_group') => {
    setActiveTab('group');
    window.dispatchEvent(
      new CustomEvent('max10_community_modal', { detail: { modal } })
    );
  };

  const spaceHeading: Record<HubSpaceId, { title: string; sub: string }> = {
    ai: { title: 'Gia sư AI', sub: 'Lịch sử & Tiện ích' },
    community: { title: 'Cộng đồng & Chat', sub: 'Nhóm học & Bạn bè 1-1' },
    practice: { title: 'Kho Luyện Tập', sub: 'Đề thi, Chấm bài & Game' },
    tools: { title: 'Công cụ & Lịch học', sub: 'Hệ sinh thái Điểm 10' },
  };

  return (
    <aside
      className={`hidden md:flex flex-col w-[240px] shrink-0 h-full border-r select-none transition-colors z-20 ${
        isDark
          ? 'bg-[#0e131e]/95 border-white/[0.08] text-slate-200'
          : 'bg-[#f8fafc]/95 border-slate-200/85 text-slate-800'
      }`}
      aria-label="Menu phụ không gian học tập"
    >
      {/* Context Panel Header */}
      <div
        className={`h-14 px-3.5 border-b flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'border-white/[0.07]' : 'border-slate-200/80'
        }`}
      >
        <div className="min-w-0">
          <div className="text-xs font-black tracking-tight text-slate-900 dark:text-white truncate">
            {spaceHeading[effectiveSpace].title}
          </div>
          <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
            {spaceHeading[effectiveSpace].sub}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
                : 'text-slate-400 hover:bg-slate-200/70 hover:text-slate-700'
            }`}
            title="Thu gọn cột menu phụ"
            aria-label="Thu gọn cột menu phụ"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* SPACE 1: GIA SƯ AI (Recent Questions + New Question + App/VIP) */}
      {/* ========================================================= */}
      {effectiveSpace === 'ai' && (
        <>
          <div className="p-3 space-y-2.5 shrink-0">
            <button
              type="button"
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Đặt câu hỏi mới</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Tìm bài đã hỏi..."
                className={`w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border outline-none transition-colors ${
                  isDark
                    ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-zinc-500 focus:border-emerald-500/60'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-3 text-xs">
            {pinnedSessions.length > 0 && (
              <div>
                <div className="px-2 pb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <Pin className="w-3 h-3 text-amber-500" />
                  <span>Đã ghim</span>
                </div>
                <div className="space-y-0.5">
                  {pinnedSessions.map((s) => {
                    const isActive = activeTab === 'chat' && currentSessionId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => onSelectSession(s.id)}
                        className={`group flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-bold'
                            : isDark
                            ? 'hover:bg-white/[0.05] text-zinc-300'
                            : 'hover:bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        <span className="truncate flex-1">{s.title}</span>
                        <button
                          type="button"
                          onClick={(e) => onDeleteSession(s.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:text-rose-500 shrink-0 cursor-pointer"
                          title="Xóa bài hỏi"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="px-2 pb-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                <span>Bài hỏi gần đây</span>
                <span className="tabular-nums">{recentSessions.length}</span>
              </div>
              {recentSessions.length === 0 ? (
                <div className="px-2.5 py-4 text-center text-[11px] text-slate-400 dark:text-zinc-500">
                  Chưa có bài hỏi phù hợp
                </div>
              ) : (
                <div className="space-y-0.5">
                  {recentSessions.map((s) => {
                    const isActive = activeTab === 'chat' && currentSessionId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => onSelectSession(s.id)}
                        className={`group flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-bold'
                            : isDark
                            ? 'hover:bg-white/[0.05] text-zinc-300'
                            : 'hover:bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{s.title}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => onDeleteSession(s.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:text-rose-500 shrink-0 cursor-pointer"
                          title="Xóa bài hỏi"
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

          {/* Compact App Settings & VIP Upgrade Cards at Bottom */}
          <div
            className={`p-2.5 border-t space-y-1.5 shrink-0 ${
              isDark ? 'border-white/[0.07]' : 'border-slate-200/80'
            }`}
          >
            {onOpenStoreModal && (
              <button
                type="button"
                onClick={onOpenStoreModal}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.07] text-zinc-200'
                    : 'bg-white border-slate-200/90 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">Cài đặt App</span>
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  PWA
                </span>
              </button>
            )}

            {onOpenPricingModal && (
              <button
                type="button"
                onClick={() => onOpenPricingModal()}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-extrabold transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/15 text-amber-300'
                    : 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="truncate">
                    {subscriptionPlan === 'free' ? 'Nâng cấp VIP' : `Gói ${subscriptionPlan.toUpperCase()}`}
                  </span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20">0.1s</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* SPACE 2: CỘNG ĐỒNG & CHAT (Study Groups + 1-1 Friends) */}
      {/* ========================================================= */}
      {effectiveSpace === 'community' && (
        <>
          <div className="p-3 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="Tìm bạn bè hoặc nhóm..."
                className={`w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border outline-none transition-colors ${
                  isDark
                    ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-zinc-500 focus:border-emerald-500/60'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenCommunityModal('find_friends')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-zinc-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                <span>Kết bạn</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenCommunityModal('create_group')}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo nhóm</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCommunitiesDirectory('game')}
              className={`w-full flex items-center justify-between gap-2 py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                selectedCommunityKey === 'communities_game' || selectedCommunityKey === 'group:community-game-max10'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : isDark
                  ? 'bg-emerald-500/12 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <Gamepad2 className="w-4 h-4 shrink-0" />
                <span className="truncate">Cộng đồng Trò chơi</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/15 shrink-0 tabular-nums">
                21+
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCommunitiesDirectory('all')}
              className={`w-full flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                selectedCommunityKey === 'communities_directory'
                  ? 'bg-slate-900 text-white border-slate-700 dark:bg-white dark:text-slate-900'
                  : isDark
                  ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07] text-zinc-300'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <Globe className="w-3.5 h-3.5 shrink-0 text-teal-500" />
                <span className="truncate">Tất cả Cộng đồng</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0 tabular-nums">
                {communityGroups.length}
              </span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-4 text-xs">
            {/* Official Notifications & Admin Updates Inside Messaging */}
            <button
              type="button"
              onClick={() => {
                handleOpenCommunityItem('direct', 'all_broadcast');
                window.dispatchEvent(new CustomEvent('max10_open_notifications_in_chat'));
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedCommunityKey === 'direct:all_broadcast'
                  ? 'bg-emerald-500/12 border-emerald-500/35 text-emerald-700 dark:text-emerald-300 font-bold'
                  : isDark
                  ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] text-zinc-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">Thông báo &amp; Admin</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate">
                  Cập nhật hệ thống, quà lễ &amp; phản hồi
                </div>
              </div>
            </button>

            {/* Game thịnh hành được Admin ghim */}
            {pinnedTrendingGames.length > 0 && (
              <div>
                <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-1">
                    <Pin className="w-3 h-3" />
                    <span>Game thịnh hành ({pinnedTrendingGames.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenCommunitiesDirectory('game')}
                    className="text-[10px] font-bold normal-case text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Quản lý ↗
                  </button>
                </div>
                <div className="space-y-0.5">
                  {pinnedTrendingGames.map((g) => {
                    const isSelected = selectedCommunityKey === `group:${g.id}`;
                    const realMembers = (g.members || []).filter((m) => !m.isAi && m.role !== 'ai_tutor').length;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleOpenCommunityItem('group', g.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-bold'
                            : isDark
                            ? 'hover:bg-white/[0.05] text-zinc-200'
                            : 'hover:bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center text-sm shrink-0">
                          <span>{g.avatarIcon || '🎮'}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{g.gameTitle || g.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate tabular-nums">
                            {g.trendingBadge || 'Thịnh hành'} · {realMembers || 1} người thật
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List 0: Cộng đồng do Admin lập */}
            {communityGroups.length > 0 && (
              <div>
                <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <span>Cộng đồng ({communityGroups.length})</span>
                  <button
                    type="button"
                    onClick={() => handleOpenCommunitiesDirectory('all')}
                    className="text-[10px] font-bold normal-case text-teal-600 dark:text-teal-300 hover:underline cursor-pointer"
                  >
                    Tất cả ↗
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto pr-0.5 space-y-0.5">
                  {communityGroups.map((g) => {
                    const isSelected = selectedCommunityKey === `group:${g.id}`;
                    const realMembers = (g.members || []).filter((m) => !m.isAi && m.role !== 'ai_tutor').length;
                    const categoryLabel =
                      g.communityCategory === 'game'
                        ? g.gamePlatform
                          ? `Game · ${g.gamePlatform}`
                          : 'Cộng đồng Game'
                        : g.communityCategory === 'chat'
                        ? 'Trò chuyện tự do'
                        : 'Học tập';
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleOpenCommunityItem('group', g.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-bold'
                            : isDark
                            ? 'hover:bg-white/[0.05] text-zinc-200'
                            : 'hover:bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        <div className="relative w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm shrink-0">
                          <span>
                            {g.avatarIcon ||
                              (g.communityCategory === 'game'
                                ? '🎮'
                                : g.communityCategory === 'chat'
                                ? '💬'
                                : '📚')}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{g.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate tabular-nums">
                            {categoryLabel} · {realMembers || 1} người thật
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List 1: Nhóm học tập của tôi */}
            <div>
              <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                <span>Nhóm học tập của tôi</span>
                <span className="tabular-nums">{regularGroups.length}</span>
              </div>

              {regularGroups.length === 0 ? (
                <div className="px-2.5 py-3 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 text-center space-y-1.5">
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Chưa có nhóm học tập nào
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenCommunityModal('create_group')}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    + Tạo Nhóm Toán 9 / Ôn thi vào 10
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {regularGroups.map((g) => {
                    const isSelected = selectedCommunityKey === `group:${g.id}`;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleOpenCommunityItem('group', g.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-bold'
                            : isDark
                            ? 'hover:bg-white/[0.05] text-zinc-200'
                            : 'hover:bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        <div className="relative w-7 h-7 rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm shrink-0">
                          <span>{g.avatarIcon || '📚'}</span>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0e131e]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{g.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate tabular-nums">
                            {g.members?.length || 1} thành viên · Online
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List 2: Tin nhắn bạn bè 1-1 */}
            <div>
              <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                <span>Tin nhắn bạn bè 1-1</span>
                <span className="tabular-nums">{visibleFriends.length}</span>
              </div>

              {visibleFriends.length === 0 ? (
                <div className="px-2.5 py-3 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 text-center space-y-1.5">
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {friendSearch ? 'Không tìm thấy bạn bè' : 'Chưa kết bạn với học sinh nào'}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenCommunityModal('find_friends')}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    + Tìm &amp; Kết bạn ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {visibleFriends.map((f) => {
                    const isSelected = selectedCommunityKey === `direct:${f.id}`;
                    const isOnline = (f.presenceStatus || 'online') !== 'offline';
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleOpenCommunityItem('direct', f.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-bold'
                            : isDark
                            ? 'hover:bg-white/[0.05] text-zinc-200'
                            : 'hover:bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        <div className="relative w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-extrabold shrink-0 overflow-visible">
                          {f.avatar ? (
                            <img
                              src={f.avatar}
                              alt={f.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span>{f.name.slice(0, 1).toUpperCase()}</span>
                          )}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#0e131e] ${
                              isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{f.name}</div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate">
                            {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* SPACE 3: KHO LUYỆN TẬP (Luyện đề, Chấm bài, Mini game, Quay XP) */}
      {/* ========================================================= */}
      {effectiveSpace === 'practice' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
          <div className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Luyện thi &amp; Kiểm tra
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('exam')}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
              activeTab === 'exam'
                ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold'
                : isDark
                ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06]'
                : 'bg-white border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold truncate">Luyện đề thi &amp; Offline</div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                Làm đề Toán, Văn, Anh, KHTN
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grade')}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
              activeTab === 'grade'
                ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold'
                : isDark
                ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06]'
                : 'bg-white border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-teal-500 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold truncate">Chấm bài tự luận AI</div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                Chấm điểm chi tiết chuẩn barem
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
              activeTab === 'tracker'
                ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold'
                : isDark
                ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06]'
                : 'bg-white border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold truncate">Phân tích Lỗ hổng AI</div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                Biểu đồ môn yếu &amp; lộ trình ôn bù
              </div>
            </div>
          </button>

          <div className="pt-2 px-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Săn Điểm 10 nhanh
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('spin')}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
              activeTab === 'spin'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                : isDark
                ? 'bg-emerald-500/12 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-900'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0 fill-current" />
            <div className="min-w-0">
              <div className="font-extrabold truncate">Quay XP Lên Cấp</div>
              <div className="text-[10px] opacity-80 truncate">Nhận XP &amp; Quà lễ theo tháng</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('chat');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('max10_open_minigame'));
              }, 60);
            }}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
              isDark
                ? 'bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/15 text-amber-300'
                : 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <div className="font-extrabold truncate">Mini game thuộc bài</div>
              <div className="text-[10px] opacity-80 truncate">Đua Top 1 &amp; nhận XP</div>
            </div>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* SPACE 4: CÔNG CỤ AI & LỊCH HỌC */}
      {/* ========================================================= */}
      {effectiveSpace === 'tools' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-xs">
          <div className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Công cụ AI &amp; Lịch học
          </div>

          {[
            { id: 'schedule' as const, label: 'Lịch học cá nhân', icon: Calendar, color: 'text-emerald-500' },
            { id: 'mindmap' as const, label: 'Sơ đồ tư duy AI', icon: GitFork, color: 'text-teal-500' },
            { id: 'tips' as const, label: 'Cảnh báo bẫy đề thi', icon: Lightbulb, color: 'text-amber-500' },
            { id: 'image' as const, label: 'Vẽ ảnh & Poster AI', icon: ImageIcon, color: 'text-sky-500' },
            { id: 'video' as const, label: 'Video người AI giảng', icon: Video, color: 'text-rose-500' },
            { id: 'plan' as const, label: 'Lộ trình ôn thi', icon: Target, color: 'text-indigo-500' },
            { id: 'teacher' as const, label: 'Hỏi bài Thầy Cô', icon: GraduationCap, color: 'text-emerald-500' },
            { id: 'achievements' as const, label: 'Thành tích & Huy hiệu', icon: Trophy, color: 'text-amber-500' },
          ].map((tool) => {
            const Icon = tool.icon;
            const active = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  if (tool.id === 'achievements' && onOpenAchievementsModal) {
                    setActiveTab('achievements');
                  } else {
                    setActiveTab(tool.id);
                  }
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-bold'
                    : isDark
                    ? 'hover:bg-white/[0.05] text-zinc-200'
                    : 'hover:bg-slate-200/60 text-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${tool.color}`} />
                <span className="truncate">{tool.label}</span>
              </button>
            );
          })}

          {((currentUser?.role === 'teacher' && currentUser?.isVerifiedTeacher !== false) || isAdmin) && (
            <button
              type="button"
              onClick={() => setActiveTab('class_management')}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'class_management'
                  ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-bold'
                  : isDark
                  ? 'hover:bg-white/[0.05] text-zinc-200'
                  : 'hover:bg-slate-200/60 text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Users className="w-4 h-4 text-violet-500 shrink-0" />
                <span className="truncate">Quản lý Lớp học</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-300 font-extrabold">
                GV
              </span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('control')}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                activeTab === 'control'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold'
                  : isDark
                  ? 'hover:bg-white/[0.05] text-zinc-200'
                  : 'hover:bg-slate-200/60 text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">Điều khiển Max10 AI</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold">
                Admin
              </span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
