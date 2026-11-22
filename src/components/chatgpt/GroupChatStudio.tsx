import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Plus,
  Send,
  ArrowLeft,
  AtSign,
  BookOpen,
  Info,
  X,
  Check,
  Smile,
  ShieldCheck,
  UserPlus,
  UserCheck,
  UserMinus,
  Trash2,
  AlertCircle,
  Heart,
  RefreshCw,
  Award,
  Copy,
  CheckCheck,
  FileText,
  Search,
  Compass,
  Globe,
  Camera,
  Bell,
  UserX,
  Ban,
  Phone,
  Video,
  MoreHorizontal,
  Image as ImageIcon,
  ThumbsUp,
  Reply,
  Pin,
  Settings,
  Folder,
  Briefcase,
  PanelRightClose,
  PanelRightOpen,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Share2,
  Download,
  ExternalLink,
  ChevronDown,
  MessageCircle,
  MoreVertical,
  Maximize2,
  Minimize2,
  Gamepad2,
  Crown,
  Flower2,
  Rocket,
  Zap,
  ArrowRight,
  Bot,
  Pencil,
  Flame,
  Swords,
  Trophy,
  Hash,
  Volume2,
  Headphones,
  ChevronRight,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { getVisibleHolidays } from './HolidayGiftAnimationModal';
import {
  ChatGroup,
  GroupChatMessage,
  GroupMember,
  GradeLevel,
  UserMuteRecord,
  FriendItem,
  FriendRequest,
  DirectChatMessage,
  UserPresenceStatus,
  BlockedUserItem,
  DuelChallenge,
  PublicMemberProfile,
} from '../../types';
import { UserAccount, ADMIN_ID, ADMIN_NAME, ADMIN_EMAIL, isUserAdmin } from '../../types/auth';
import { MemberProfileModal, buildSafePublicProfile } from './MemberProfileModal';
import { DuelArenaModal, loadLocalChallenges, saveLocalChallenge } from './DuelArenaModal';
import {
  INITIAL_GROUP_MESSAGES,
  DEFAULT_STUDENT_FRIENDS,
  DEFAULT_DIRECT_MESSAGES,
} from '../../data/defaultGroups';
import { checkProfanity, calculateMuteDurationMinutes } from '../../utils/profanityFilter';
import { UserAvatarWithStatus, PRESENCE_STATUS_CONFIG } from './UserAvatarWithStatus';
import { formatDolaMath } from '../../utils/dolaMathFormatter';
import { VideoAudioCallModal, CallParticipant } from './VideoAudioCallModal';
import {
  ALL_CLASSES_LIST,
  ClassCode,
  purgeUnrelatedLegacyClassGroups,
  isLegacyAutoCreatedClassGroup,
  createOrUpdateCustomClassGroup,
  deleteClassSeatingPlan,
} from '../../data/classSystemData';
import { formatAccurateTime } from '../../utils/timeFormat';

/** Helper to strictly detect and exclude AI bots and assistants from friend search and peer discovery */
export const isAiEntity = (member: { id?: string; name?: string; isAi?: boolean; role?: string }) => {
  if (!member) return true;
  if (member.isAi) return true;
  if (member.role === 'ai_tutor' || member.role === 'system') return true;
  const id = (member.id || '').toLowerCase();
  const name = (member.name || '').toLowerCase();
  if (id === 'user-quynh' || name === 'quỳnh' || name.includes('quỳnh')) {
    return true;
  }
  if (
    id.startsWith('ai-') ||
    id === 'system-bot' ||
    id.includes('system') ||
    id.includes('bot') ||
    id.includes('tutor') ||
    id.includes('tro-ly') ||
    id.includes('max10') ||
    id.includes('teacher')
  ) {
    return true;
  }
  if (
    name.includes('ai') ||
    name.includes('trợ lý') ||
    name.includes('robot') ||
    name.includes('bot') ||
    name.includes('hệ thống') ||
    name.includes('cô ') ||
    name.includes('thầy ') ||
    name.includes('giáo viên') ||
    name.includes('max10')
  ) {
    return true;
  }
  return false;
};

/**
 * Phân loại thành viên trong chỗ nhắn tin:
 * - Xanh lá: Giáo viên
 * - Vàng: Học sinh
 * - Tím: Bạn bè
 * - Xanh dương: Quản trị viên trong nhóm
 */
export type MemberCategory = 'teacher' | 'student' | 'friend' | 'admin';

export interface CategoryInfo {
  id: MemberCategory;
  label: string;
  colorName: string;
  badgeClass: string;
  dotClass: string;
}

export const CATEGORY_MAP: Record<MemberCategory, CategoryInfo> = {
  teacher: {
    id: 'teacher',
    label: 'Giáo viên',
    colorName: 'Xanh lá',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40',
    dotClass: 'bg-emerald-500',
  },
  student: {
    id: 'student',
    label: 'Học sinh',
    colorName: 'Vàng',
    badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
    dotClass: 'bg-amber-500',
  },
  friend: {
    id: 'friend',
    label: 'Bạn bè',
    colorName: 'Tím',
    badgeClass: 'bg-purple-500/15 text-purple-300 border border-purple-500/40',
    dotClass: 'bg-purple-500',
  },
  admin: {
    id: 'admin',
    label: 'Quản trị viên',
    colorName: 'Xanh dương',
    badgeClass: 'bg-blue-500/15 text-blue-300 border border-blue-500/40',
    dotClass: 'bg-blue-500',
  },
};

export const getSenderCategory = (
  sender: { id?: string; name?: string; role?: string },
  context?: { isDirectFriend?: boolean; isGroupAdmin?: boolean }
): MemberCategory => {
  const name = (sender?.name || '').toLowerCase();
  const role = (sender?.role || '').toLowerCase();

  // 1. Quản trị viên trong nhóm: xanh dương
  if (role === 'admin' || context?.isGroupAdmin || name.includes('quản trị') || name.includes('trưởng nhóm')) {
    return 'admin';
  }

  // 2. Giáo viên: xanh lá
  if (
    role === 'teacher' ||
    name.startsWith('cô ') ||
    name.startsWith('thầy ') ||
    name.includes('giáo viên') ||
    name.includes('bích thủy') ||
    name.includes('thùy dương') ||
    name.includes('thị liên')
  ) {
    return 'teacher';
  }

  // 3. Bạn bè: tím (trong direct friend chat, hoặc danh sách bạn bè)
  if (context?.isDirectFriend || role === 'friend') {
    return 'friend';
  }

  // 4. Học sinh: vàng (các thành viên học sinh trong nhóm)
  return 'student';
};

/**
 * Kí hiệu hình vuông phân loại bên cạnh tên theo yêu cầu:
 * - Giáo viên: Kí hiệu hình vuông Xanh lá (Emerald)
 * - Học sinh: Kí hiệu hình vuông Vàng (Amber)
 * - Bạn bè: Kí hiệu hình vuông Tím (Purple)
 * - Quản trị viên: Kí hiệu hình vuông Xanh dương (Blue)
 */
export const ClassificationSquare: React.FC<{
  category: MemberCategory;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ category, showLabel = true, size = 'sm', className = '' }) => {
  const cfg = CATEGORY_MAP[category] || CATEGORY_MAP.student;
  const squareSizeClass =
    size === 'lg' ? 'w-3 h-3 rounded-[3px]' : size === 'md' ? 'w-2.5 h-2.5 rounded-[2px]' : 'w-2 h-2 rounded-[2px]';

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border shrink-0 transition-colors ${cfg.badgeClass} ${className}`}
      title={`Phân loại: ${cfg.label} (Kí hiệu hình vuông ${cfg.colorName})`}
    >
      {/* Kí hiệu hình vuông phân loại */}
      <span className={`${squareSizeClass} ${cfg.dotClass} shrink-0 shadow-2xs`} />
      {showLabel && <span>{cfg.label}</span>}
    </span>
  );
};

export const ClassificationLegendBar: React.FC<{ isDark?: boolean; className?: string }> = ({
  isDark = false,
  className = '',
}) => (
  <div
    className={`p-2.5 rounded-2xl border text-[11px] flex flex-wrap items-center gap-2 ${
      isDark ? 'bg-zinc-850/80 border-zinc-750 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
    } ${className}`}
  >
    <span className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 shrink-0">
      <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-500 inline-block" />
      <span>Kí hiệu hình vuông phân loại:</span>
    </span>
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 shrink-0 shadow-2xs" />
        <span>Giáo viên (Xanh lá)</span>
      </span>
      <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
        <span className="w-2.5 h-2.5 rounded-[2px] bg-amber-500 shrink-0 shadow-2xs" />
        <span>Học sinh (Vàng)</span>
      </span>
      <span className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
        <span className="w-2.5 h-2.5 rounded-[2px] bg-purple-500 shrink-0 shadow-2xs" />
        <span>Bạn bè (Tím)</span>
      </span>
      <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
        <span className="w-2.5 h-2.5 rounded-[2px] bg-blue-500 shrink-0 shadow-2xs" />
        <span>Quản trị viên (Xanh dương)</span>
      </span>
    </div>
  </div>
);

interface GroupChatStudioProps {
  currentGrade: GradeLevel;
  userName: string;
  currentUser: UserAccount | null;
  isDark: boolean;
  onOpenAuthModal?: () => void;
  userAvatar?: string;
  onOpenAvatarModal?: () => void;
  onPresenceStatusChange?: (status: UserPresenceStatus) => void;
  onOpenMindMap?: () => void;
  onOpenImageStudio?: () => void;
  onOpenVideoStudio?: () => void;
  onSwitchToChat?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: (val?: boolean) => void;
  onExitFullscreen?: () => void;
  hideInnerSidebar?: boolean;
  autoUpdateNotice?: string | null;
  onOpenOfferModal?: () => void;
  onOpenStoreModal?: () => void;
  onOpenPricingModal?: () => void;
  onOpenIntroModal?: () => void;
}

const STORAGE_KEY_GROUPS = 'max10_real_groups_v15';
const STORAGE_KEY_GROUP_MSGS = 'max10_real_group_messages_v15';
const STORAGE_KEY_USER_VIOLATIONS = 'max10_real_user_violations_v15';
const STORAGE_KEY_FRIENDS = 'max10_real_friends_list_v15';
const STORAGE_KEY_DIRECT_MSGS = 'max10_real_direct_chat_messages_v15';
const STORAGE_KEY_REPLIED_ADMIN_THREADS = 'max10_replied_admin_threads_v1';
const STORAGE_KEY_HIDDEN_BROADCAST_AT = 'max10_hidden_other_broadcast_at_v1';

const UPDATED_BROADCAST_COPY =
  '📢 [CẬP NHẬT MỚI TỪ MAX10 AI - PHIÊN BẢN STUDY HUB]\n🚀 Max10 AI vừa nâng cấp toàn diện giao diện & tính năng học tập thông minh:\n✨ Không gian Study Hub 3 vùng gọn gàng: Gia sư AI, Cộng đồng & Chat, Kho Luyện Tập (hỗ trợ làm đề Offline), Công cụ AI & Lịch học.\n🎥 Gọi Video & Thoại dùng Camera & Micro thật, tự động hiện ảnh đại diện khi tắt cam và hộp thoại nhận/từ chối cuộc gọi tức thì.\n💬 Nhắn tin, trả lời trích dẫn và gọi @Max10 AI giải bài ngay trong nhóm lẫn chat 1-1.\nChúc các bạn học tập hiệu quả và chinh phục Điểm 10!';

const normalizeLegacyBroadcastText = (content?: string): string => {
  const c = String(content || '');
  if (
    c.includes('THÔNG BÁO TỰ ĐỘNG - MAX10 VỪA CẬP NHẬT PHIÊN BẢN MỚI') ||
    c.includes('THÔNG BÁO TỰ ĐỘNG - CẬP NHẬT ỨNG DỤNG') ||
    c.includes('câu hỏi ngày tháng năm sinh với bất ngờ sinh nhật')
  ) {
    return UPDATED_BROADCAST_COPY;
  }
  return c;
};

export const GroupChatStudio: React.FC<GroupChatStudioProps> = ({
  currentGrade,
  userName,
  currentUser,
  isDark,
  onOpenAuthModal,
  userAvatar,
  onOpenAvatarModal,
  onPresenceStatusChange,
  onOpenMindMap,
  onOpenImageStudio,
  onOpenVideoStudio,
  onSwitchToChat,
  isFullscreen: controlledFullscreen,
  onToggleFullscreen,
  onExitFullscreen,
  hideInnerSidebar = false,
  autoUpdateNotice,
  onOpenOfferModal,
  onOpenStoreModal,
  onOpenPricingModal,
  onOpenIntroModal,
}) => {
  // Purge any stale fake seeded chats and legacy auto-created "Nhóm Học Tập Chính Thức" groups
  const deletedGroupIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    [
      'max10_study_groups_v4',
      'max10_group_messages_v4',
      'max10_friends_list_v5',
      'max10_direct_chat_messages_v5',
      'max10_study_groups_zalo_v7',
      'max10_friends_list_zalo_v7',
      'max10_direct_chat_messages_zalo_v7',
      'max10_study_groups_zalo_v8',
      'max10_group_messages_zalo_v8',
      'max10_friends_list_zalo_v8',
      'max10_direct_chat_messages_zalo_v8',
    ].forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });
    const removed = purgeUnrelatedLegacyClassGroups();
    if (removed > 0) {
      setGroups((prev) => prev.filter((g) => !isLegacyAutoCreatedClassGroup(g)));
    }

    const onGroupsUpdated = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_GROUPS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setGroups(parsed.filter((g: ChatGroup) => !isLegacyAutoCreatedClassGroup(g) && !deletedGroupIdsRef.current.has(g.id)));
          }
        }
      } catch (e) {}
    };
    window.addEventListener('max10_groups_updated', onGroupsUpdated);
    return () => window.removeEventListener('max10_groups_updated', onGroupsUpdated);
  }, []);

  // Current logged in / active user representation
  const activeUserId = currentUser ? currentUser.id : 'user-local-' + userName.toLowerCase().replace(/\s+/g, '-');
  const activeUserName = currentUser ? currentUser.name : userName || 'Bạn học';
  const activeUserAvatar = currentUser?.avatar || userAvatar;
  const isRealAdmin =
    isUserAdmin(currentUser) ||
    (typeof window !== 'undefined' &&
      localStorage.getItem('max10_admin_reset_to_guest') !== 'true' &&
      Boolean(
        currentUser?.id === ADMIN_ID ||
          currentUser?.isSuperAdmin ||
          (currentUser?.email || '').toLowerCase() === ADMIN_EMAIL
      ));
  const REAL_ADMIN_AVATAR = 'https://api.dicebear.com/7.x/personas/svg?seed=MacKhanhDuy';

  // Admin Real Inbox & Broadcast states
  const [adminInboxThreads, setAdminInboxThreads] = useState<Array<{
    partnerId: string;
    partnerName: string;
    partnerAvatar?: string;
    partnerRole?: string;
    presenceStatus?: UserPresenceStatus;
    lastMessage: string;
    lastTimestamp: string;
    lastCreatedAt: number;
    messages: DirectChatMessage[];
  }>>([]);
  const [adminBroadcastMessages, setAdminBroadcastMessages] = useState<DirectChatMessage[]>([]);
  const [adminQuickBroadcastText, setAdminQuickBroadcastText] = useState<string>('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState<boolean>(false);

  // @Mention autocomplete state (works in Group/Community AND Direct chats)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionActiveIdx, setMentionActiveIdx] = useState<number>(0);

  // Communities Directory & Admin Game Pinning / Approval / Management state
  const [showCommunitiesView, setShowCommunitiesView] = useState<boolean>(false);
  const [communityCategoryFilter, setCommunityCategoryFilter] = useState<'all' | 'game' | 'study' | 'pending'>('all');
  const [communityPlatformFilter, setCommunityPlatformFilter] = useState<'all' | 'Cross-Platform' | 'Mobile' | 'PC' | 'Console'>('all');
  const [communitySearchQuery, setCommunitySearchQuery] = useState<string>('');
  const [newCommunityPlatform, setNewCommunityPlatform] = useState<'Cross-Platform' | 'Mobile' | 'PC' | 'Console'>('Cross-Platform');
  const [newCommunityGameTitle, setNewCommunityGameTitle] = useState<string>('');
  const [newCommunityGenre, setNewCommunityGenre] = useState<string>('Cộng đồng Game thủ');
  const [newCommunityPinTrending, setNewCommunityPinTrending] = useState<boolean>(false);
  const [newCommunityTrendingBadge, setNewCommunityTrendingBadge] = useState<string>('Thịnh hành');
  const [quickPinSelectedId, setQuickPinSelectedId] = useState<string>('');
  const [quickPinBadge, setQuickPinBadge] = useState<string>('Thịnh hành');
  const [editingCommunity, setEditingCommunity] = useState<ChatGroup | null>(null);
  const [editCommForm, setEditCommForm] = useState<{
    name: string;
    description: string;
    communityCategory: 'game' | 'study';
    gameTitle: string;
    gamePlatform: string;
    gameGenre: string;
    avatarIcon: string;
    pinnedNotice: string;
    isPinnedTrending: boolean;
    trendingBadge: string;
  }>({
    name: '',
    description: '',
    communityCategory: 'game',
    gameTitle: '',
    gamePlatform: 'Cross-Platform',
    gameGenre: '',
    avatarIcon: '🎮',
    pinnedNotice: '',
    isPinnedTrending: false,
    trendingBadge: 'Thịnh hành',
  });
  const [showProposeGameModal, setShowProposeGameModal] = useState<boolean>(false);
  const [proposeGameForm, setProposeGameForm] = useState<{
    name: string;
    gameTitle: string;
    gamePlatform: 'Cross-Platform' | 'Mobile' | 'PC' | 'Console';
    gameGenre: string;
    description: string;
    avatarIcon: string;
  }>({
    name: '',
    gameTitle: '',
    gamePlatform: 'Cross-Platform',
    gameGenre: 'MOBA / Đấu trường',
    description: '',
    avatarIcon: '🎮',
  });
  const [adminAutoReplyEnabled, setAdminAutoReplyEnabled] = useState<boolean>(true);
  const [adminAutoReplyGreeting, setAdminAutoReplyGreeting] = useState<string>('');
  const [isSavingAutoReply, setIsSavingAutoReply] = useState<boolean>(false);
  const [adminPendingMentions, setAdminPendingMentions] = useState<Array<{
    id: string;
    type: 'group' | 'direct';
    targetId: string;
    targetName: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp?: string;
    createdAt: number;
  }>>([]);

  // Presence status of current user
  const [userPresence, setUserPresence] = useState<UserPresenceStatus>(() => {
    return (
      (currentUser?.presenceStatus as UserPresenceStatus) ||
      ((localStorage.getItem('max10_user_presence_status') as UserPresenceStatus) || 'online')
    );
  });

  // Active view mode: 'group' for study groups, 'direct' for 1-on-1 private chat with friends
  const [activeMode, setActiveMode] = useState<'group' | 'direct'>('direct');
  const [sidebarTab, setSidebarTab] = useState<'groups' | 'friends'>('friends');
  
  // Navigation & layout state
  const [activeNav, setActiveNav] = useState<'messages' | 'contacts' | 'cloud' | 'settings'>('messages');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'friends' | 'groups'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MemberCategory>('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [internalFullscreen, setInternalFullscreen] = useState<boolean>(false);
  const isFullscreen = controlledFullscreen !== undefined ? controlledFullscreen : internalFullscreen;

  const setIsFullscreen = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isFullscreen) : val;
    setInternalFullscreen(nextVal);
    if (onToggleFullscreen) {
      onToggleFullscreen(nextVal);
    }
    if (!nextVal && onExitFullscreen) {
      onExitFullscreen();
    }
  };
  const [showRightDrawer, setShowRightDrawer] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1200 : false
  );
  const [rightDrawerTab, setRightDrawerTab] = useState<'members' | 'files'>('members');
  const [discordChannel, setDiscordChannel] = useState<'general' | 'ai_tutor' | 'duel'>('general');
  const [collapsedDiscordCats, setCollapsedDiscordCats] = useState<{
    text: boolean;
    voice: boolean;
    dm: boolean;
    servers: boolean;
  }>({ text: false, voice: false, dm: false, servers: false });
  const [discordMicMuted, setDiscordMicMuted] = useState<boolean>(false);
  const [discordDeafened, setDiscordDeafened] = useState<boolean>(false);
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);
  const [showComposerPlusMenu, setShowComposerPlusMenu] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; content: string } | null>(null);
  const [callModal, setCallModal] = useState<{
    active: boolean;
    type: 'video' | 'voice';
    roomType: 'group' | 'direct';
    targetId?: string;
    targetName: string;
    targetAvatar?: string;
    targetBadge?: string;
    participants?: CallParticipant[];
  } | null>(null);
  const [repliedAdminThreads, setRepliedAdminThreads] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REPLIED_ADMIN_THREADS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });
  const [hiddenOtherBroadcastAt, setHiddenOtherBroadcastAt] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIDDEN_BROADCAST_AT);
      return saved ? Number(saved) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showSearchInChat, setShowSearchInChat] = useState<boolean>(false);
  const [chatSearchText, setChatSearchText] = useState<string>('');
  const [sharedFilesTab, setSharedFilesTab] = useState<'media' | 'files'>('media');

  // Member Public Profile (no password/gmail/phone) + Quiz Duel Competition state
  const [profileTargetMember, setProfileTargetMember] = useState<PublicMemberProfile | null>(null);
  const [profileContextLabel, setProfileContextLabel] = useState<string>('Cộng đồng & Nhóm');
  const [challengesMap, setChallengesMap] = useState<Record<string, DuelChallenge>>(() => {
    const map: Record<string, DuelChallenge> = {};
    loadLocalChallenges().forEach((c) => {
      if (c?.id) map[c.id] = c;
    });
    return map;
  });
  const [duelModalState, setDuelModalState] = useState<{
    isOpen: boolean;
    contextType: 'community' | 'group' | 'direct';
    contextId: string;
    contextName: string;
    targetMember?: PublicMemberProfile | null;
    existingChallenge?: DuelChallenge | null;
  } | null>(null);

  // Groups list state: ONLY user/teacher explicitly created or joined groups (no fake or legacy auto-created groups)
  const [groups, setGroups] = useState<ChatGroup[]>(() => {
    try {
      purgeUnrelatedLegacyClassGroups();
      const saved = localStorage.getItem(STORAGE_KEY_GROUPS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((g: ChatGroup) => !isLegacyAutoCreatedClassGroup(g));
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc nhóm chat', e);
    }
    return [];
  });

  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    return groups[0]?.id || '';
  });

  // Friends list state: ONLY actual friends added by user (no fake strangers)
  const [friends, setFriends] = useState<FriendItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FRIENDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((f) => !isAiEntity(f) && !f.id.startsWith('std-') && f.id !== 'user-chu-hiep' && f.id !== 'user-thuy-duong' && f.id !== 'user-thang-ban' && f.id !== 'user-su-bell' && f.id !== 'user-thu-ngo');
          return valid;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc danh sách bạn bè', e);
    }
    return [];
  });

  const [activeFriendId, setActiveFriendId] = useState<string>(() => {
    return friends[0]?.id || '';
  });

  // Messages per group
  const [groupMessages, setGroupMessages] = useState<Record<string, GroupChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GROUP_MSGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi đọc tin nhắn nhóm', e);
    }
    return INITIAL_GROUP_MESSAGES;
  });

  // Direct 1-on-1 messages with friends
  const [directMessages, setDirectMessages] = useState<Record<string, DirectChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DIRECT_MSGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          const upgraded: Record<string, DirectChatMessage[]> = {};
          Object.entries(parsed).forEach(([k, arr]) => {
            if (Array.isArray(arr)) {
              upgraded[k] = arr.map((m: any) => ({
                ...m,
                content: normalizeLegacyBroadcastText(m?.content),
              }));
            }
          });
          return upgraded;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc tin nhắn riêng', e);
    }
    return DEFAULT_DIRECT_MESSAGES;
  });


  // Track violations count per user in this group: Record<groupId_userId, count>
  const [violationCounts, setViolationCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_VIOLATIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Lỗi đọc số lần vi phạm', e);
    }
    return {};
  });

  // Modals state
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
  const [showMembersModal, setShowMembersModal] = useState<boolean>(false);
  const [showFriendsModal, setShowFriendsModal] = useState<boolean>(false);
  const [friendsModalTab, setFriendsModalTab] = useState<'my_friends' | 'find_friends' | 'requests' | 'blocked'>('find_friends');
  const [friendSearchQuery, setFriendSearchQuery] = useState<string>('');
  const [newFriendName, setNewFriendName] = useState<string>('');
  const [groupToDelete, setGroupToDelete] = useState<ChatGroup | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [userToUnfriend, setUserToUnfriend] = useState<{ id: string; name: string } | null>(null);
  const [userToBlock, setUserToBlock] = useState<{ id: string; name: string } | null>(null);

  // USER REQUESTED: Single DM send, Creator-only member add, Add Friends, Search Groups like Zalo
  const [isSendingDm, setIsSendingDm] = useState<boolean>(false);
  const [newGroupOnlyAdminCanAdd, setNewGroupOnlyAdminCanAdd] = useState<boolean>(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [showSearchGroupsModal, setShowSearchGroupsModal] = useState<boolean>(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState<string>('');
  const [serverGroups, setServerGroups] = useState<ChatGroup[]>([]);
  const [addMemberSearchQuery, setAddMemberSearchQuery] = useState<string>('');

  // User Requirement: "muốn thoát ra thì ấn nút esc thì lại hiện ra từ đặt câu hỏi mới"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (callModal) {
          setCallModal(null);
        } else if (groupToDelete) {
          setGroupToDelete(null);
        } else if (userToUnfriend) {
          setUserToUnfriend(null);
        } else if (userToBlock) {
          setUserToBlock(null);
        } else if (editingCommunity) {
          setEditingCommunity(null);
        } else if (showProposeGameModal) {
          setShowProposeGameModal(false);
        } else if (showRulesModal) {
          setShowRulesModal(false);
        } else if (showCreateGroupModal) {
          setShowCreateGroupModal(false);
        } else if (showMembersModal) {
          setShowMembersModal(false);
        } else if (showFriendsModal) {
          setShowFriendsModal(false);
        } else if (showAddMemberModal) {
          setShowAddMemberModal(false);
        } else if (showSearchGroupsModal) {
          setShowSearchGroupsModal(false);
        } else if (showSearchInChat) {
          setShowSearchInChat(false);
        } else if (showEmojiPicker) {
          setShowEmojiPicker(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        } else if (onExitFullscreen) {
          onExitFullscreen();
        } else if (onSwitchToChat) {
          onSwitchToChat();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFullscreen,
    callModal,
    groupToDelete,
    userToUnfriend,
    userToBlock,
    editingCommunity,
    showProposeGameModal,
    showRulesModal,
    showCreateGroupModal,
    showMembersModal,
    showFriendsModal,
    showAddMemberModal,
    showSearchGroupsModal,
    showSearchInChat,
    showEmojiPicker,
    onExitFullscreen,
    onSwitchToChat,
  ]);

  // Friend Requests state: incoming & outgoing
  const [friendRequests, setFriendRequests] = useState<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({
    incoming: [],
    outgoing: [],
  });

  // Available users found via name search
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  // Save friends to localStorage & broadcast to ContextPanel
  useEffect(() => {
    try {
      const clean = friends.filter((f) => !isAiEntity(f) && !f.id.startsWith('std-'));
      localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(clean));
      window.dispatchEvent(new CustomEvent('max10_friends_updated'));
    } catch (e) {
      console.warn('Lỗi lưu danh sách bạn bè', e);
    }
  }, [friends]);

  // Sync / refresh friend requests & friends list from server
  const syncSocialData = async () => {
    try {
      // Fetch incoming & outgoing requests
      const resReq = await fetch(`/api/friends/requests?userId=${encodeURIComponent(activeUserId)}`);
      if (resReq.ok) {
        const data = await resReq.json();
        if (data && data.success) {
          const incomingClean = (data.incoming || []).filter((r: FriendRequest) => !r.fromUserId.startsWith('std-'));
          const outgoingClean = (data.outgoing || []).filter((r: FriendRequest) => !r.toUserId.startsWith('std-'));
          setFriendRequests({
            incoming: incomingClean,
            outgoing: outgoingClean,
          });
        }
      }

      // Fetch server friends (REAL human friends only)
      const resFriends = await fetch(`/api/friends/list?userId=${encodeURIComponent(activeUserId)}`);
      if (resFriends.ok) {
        const data = await resFriends.json();
        if (data && data.success && Array.isArray(data.friends)) {
          const validFriends = data.friends.filter((f: FriendItem) => !isAiEntity(f) && !f.id.startsWith('std-'));
          setFriends(validFriends);
        }
      }

      // Fetch blocked users
      const resBlocked = await fetch(`/api/friends/blocked?userId=${encodeURIComponent(activeUserId)}`);
      if (resBlocked.ok) {
        const data = await resBlocked.json();
        if (data && data.success && Array.isArray(data.blocked)) {
          setBlockedUsers(data.blocked);
        }
      }

      // Fetch Admin Auto-Reply config & pending @Admin mentions
      const resAutoReply = await fetch('/api/admin/auto-reply');
      if (resAutoReply.ok) {
        const cfg = await resAutoReply.json();
        if (cfg && cfg.success) {
          setAdminAutoReplyEnabled(typeof cfg.enabled === 'boolean' ? cfg.enabled : true);
          if (typeof cfg.customGreeting === 'string') {
            setAdminAutoReplyGreeting(cfg.customGreeting);
          }
          if (isRealAdmin && Array.isArray(cfg.pendingMentions)) {
            setAdminPendingMentions(cfg.pendingMentions);
          }
        }
      }

      // If logged in as REAL Admin (Mạc Khánh Duy), fetch full Admin Inbox & Broadcast channel
      if (isRealAdmin) {
        const resInbox = await fetch('/api/admin/inbox');
        if (resInbox.ok) {
          const data = await resInbox.json();
          if (data && data.success) {
            const cleanBroadcasts = (data.broadcastMessages || []).map((m: any) => ({
              ...m,
              content: normalizeLegacyBroadcastText(m?.content),
            }));
            setAdminBroadcastMessages(cleanBroadcasts);
            setAdminInboxThreads(data.threads || []);
            setDirectMessages((prev) => {
              const next = { ...prev };
              next['all_broadcast'] = cleanBroadcasts;
              (data.threads || []).forEach((t: any) => {
                next[t.partnerId] = t.messages || [];
              });
              return next;
            });
          }
        }
      }
    } catch (e) {
      // Offline fallback
    }
  };

  // Search REAL users by name only (No fake users, no grade/class required!)
  const searchUsersByName = async (nameQuery: string = '') => {
    setIsLoadingUsers(true);
    try {
      const url = `/api/users/search?q=${encodeURIComponent(nameQuery)}&excludeId=${encodeURIComponent(activeUserId)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.users)) {
          // Strictly filter out AI entities and fake mock users
          const realUsers = data.users.filter((u: any) => !isAiEntity(u) && !u.id.startsWith('std-'));
          setAvailableUsers(realUsers);
        }
      }
    } catch (e) {
      console.warn('Search users failed', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Sync direct 1-1 messages from server (Strict deduplication - only 1 message sent and shown)
  const syncDirectMessages = async () => {
    if (!activeFriendId) return;
    try {
      const res = await fetch(
        `/api/friends/messages?userId=${encodeURIComponent(activeUserId)}&friendId=${encodeURIComponent(activeFriendId)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.messages)) {
          setDirectMessages((prev) => {
            const existing = prev[activeFriendId] || [];
            const combined = [...existing, ...data.messages];
            const seenIds = new Set<string>();
            const seenSignatures = new Set<string>();
            const result: DirectChatMessage[] = [];

            for (const m of combined) {
              if (!m || !m.content) continue;
              if (m.id && seenIds.has(m.id)) continue;

              const cleanContent = (m.content || '').trim();
              const bucket = typeof m.createdAt === 'number' && m.createdAt > 0 ? Math.floor(m.createdAt / 10000) : 'legacy';
              const signature = `${m.senderId}_${m.recipientId}_${cleanContent}_${bucket}`;
              if (seenSignatures.has(signature)) {
                continue;
              }

              if (m.id) seenIds.add(m.id);
              seenSignatures.add(signature);
              result.push({
                ...m,
                content: normalizeLegacyBroadcastText(m?.content),
                timestamp: formatAccurateTime(m.createdAt, m.timestamp),
              });
            }

            return {
              ...prev,
              [activeFriendId]: result,
            };
          });
        }
      }
    } catch (e) {}
  };

  // Sync groups from server (For search groups, multi-member groups & Admin communities)
  const syncServerGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.groups)) {
          const cleanServerGroups = data.groups
            .filter((g: ChatGroup) => !isLegacyAutoCreatedClassGroup(g) && !deletedGroupIdsRef.current.has(g.id))
            .map((g: ChatGroup) =>
              g.isCommunity
                ? { ...g, onlyAdminCanAdd: false, members: (g.members || []).filter((m) => !isAiEntity(m)) }
                : g
            );
          setServerGroups(cleanServerGroups);
          // Merge with local groups cleanly (server wins for shared community membership updates)
          setGroups((prev) => {
            const map = new Map<string, ChatGroup>();
            prev
              .filter((g) => !isLegacyAutoCreatedClassGroup(g) && !deletedGroupIdsRef.current.has(g.id))
              .forEach((g: ChatGroup) => map.set(g.id, g));
            cleanServerGroups.forEach((g: ChatGroup) => {
              const existing = map.get(g.id);
              if (existing && existing.members && g.members) {
                const memberMap = new Map<string, GroupMember>();
                [...existing.members, ...g.members]
                  .filter((m) => !isAiEntity(m))
                  .forEach((m) => memberMap.set(m.id, m));
                map.set(g.id, { ...existing, ...g, members: Array.from(memberMap.values()) });
              } else {
                map.set(g.id, g);
              }
            });
            return Array.from(map.values());
          });
        }
      }
    } catch (e) {}
  };

  // Sync group messages from server (deduplicated & ordered by createdAt)
  const syncGroupMessages = async (overrideGroupId?: string) => {
    const targetGid = overrideGroupId || activeGroupId;
    if (!targetGid) return;
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(targetGid)}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.messages)) {
          setGroupMessages((prev) => {
            const currentList = prev[targetGid] || [];
            const seen = new Set<string>();
            const merged: GroupChatMessage[] = [];
            [...currentList, ...data.messages].forEach((m: GroupChatMessage) => {
              if (!m || !m.id || seen.has(m.id)) return;
              seen.add(m.id);
              merged.push(m);
            });
            merged.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            return {
              ...prev,
              [targetGid]: merged,
            };
          });
        }
      }
    } catch (e) {}
    try {
      const resChallenges = await fetch('/api/challenges');
      if (resChallenges.ok) {
        const data = await resChallenges.json();
        if (data?.success && Array.isArray(data.challenges)) {
          setChallengesMap((prev) => {
            const next = { ...prev };
            data.challenges.forEach((c: DuelChallenge) => {
              if (c?.id) {
                next[c.id] = c;
                saveLocalChallenge(c);
              }
            });
            return next;
          });
        }
      }
    } catch {}
  };

  // Auto-switch to conversation if notified + listen to ContextPanel selection & modals
  useEffect(() => {
    const checkTargetOpen = () => {
      try {
        const raw = localStorage.getItem('max10_target_chat_open');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.targetId && Date.now() - parsed.timestamp < 15000) {
            setShowCommunitiesView(false);
            if (parsed.type === 'group') {
              setActiveMode('group');
              setActiveGroupId(parsed.targetId);
            } else {
              setActiveMode('direct');
              setActiveFriendId(parsed.targetId);
            }
            localStorage.removeItem('max10_target_chat_open');
          }
        }
      } catch (e) {}
    };
    checkTargetOpen();
    const interval = setInterval(checkTargetOpen, 1000);

    const onCommunitySelect = (e: Event) => {
      const detail = (e as CustomEvent<{ type: 'group' | 'direct'; id: string }>).detail;
      if (!detail?.id) return;
      setShowCommunitiesView(false);
      if (detail.type === 'group') {
        setActiveMode('group');
        setActiveGroupId(detail.id);
      } else {
        setActiveMode('direct');
        setActiveFriendId(detail.id);
      }
    };

    const onOpenCommunities = (e: Event) => {
      const detail = (e as CustomEvent<{ category?: 'all' | 'game' | 'study' | 'pending' }>).detail;
      if (detail?.category) {
        setCommunityCategoryFilter(detail.category);
        if (detail.category === 'study') setCommunityPlatformFilter('all');
      }
      setShowCommunitiesView(true);
    };

    const onOpenNotificationsInChat = () => {
      setShowCommunitiesView(false);
      setActiveMode('direct');
      setActiveFriendId('all_broadcast');
    };

    const onCommunityModal = (e: Event) => {
      const detail = (e as CustomEvent<{ modal: 'find_friends' | 'create_group' }>).detail;
      if (detail?.modal === 'find_friends') {
        setFriendsModalTab('find_friends');
        setShowFriendsModal(true);
      } else if (detail?.modal === 'create_group') {
        setShowCreateGroupModal(true);
      }
    };

    window.addEventListener('max10_community_select', onCommunitySelect);
    window.addEventListener('max10_open_communities', onOpenCommunities);
    window.addEventListener('max10_open_notifications_in_chat', onOpenNotificationsInChat);
    window.addEventListener('max10_community_modal', onCommunityModal);
    return () => {
      clearInterval(interval);
      window.removeEventListener('max10_community_select', onCommunitySelect);
      window.removeEventListener('max10_open_communities', onOpenCommunities);
      window.removeEventListener('max10_open_notifications_in_chat', onOpenNotificationsInChat);
      window.removeEventListener('max10_community_modal', onCommunityModal);
    };
  }, [currentUser, onOpenAuthModal]);

  // Real-time listener for auto-update admin messages with exact publish timestamp
  useEffect(() => {
    const handleAdminUpdateMsg = (e: Event) => {
      const detail = (e as CustomEvent<DirectChatMessage>).detail;
      if (!detail || !detail.id) return;
      const formattedMsg: DirectChatMessage = {
        ...detail,
        timestamp: formatAccurateTime(detail.createdAt, detail.timestamp),
      };
      setAdminBroadcastMessages((prev) =>
        prev.some((m) => m.id === formattedMsg.id) ? prev : [...prev, formattedMsg]
      );
      setDirectMessages((prev) => {
        const next = { ...prev };
        ['all_broadcast', 'admin-mac-khanh-duy'].forEach((key) => {
          const list = next[key] || [];
          if (!list.some((m) => m.id === formattedMsg.id)) {
            next[key] = [...list, formattedMsg];
          }
        });
        return next;
      });
    };
    window.addEventListener('max10:admin-message', handleAdminUpdateMsg);
    return () => window.removeEventListener('max10:admin-message', handleAdminUpdateMsg);
  }, []);

  useEffect(() => {
    if (activeMode === 'direct' && activeFriendId === 'all_broadcast') {
      window.dispatchEvent(new CustomEvent('max10_notifications_viewed'));
    }
  }, [activeMode, activeFriendId]);

  // Sync on mount and periodically every 2.5 seconds for real-time friend requests, direct messages, and groups
  useEffect(() => {
    syncSocialData();
    syncServerGroups();
    searchUsersByName(friendSearchQuery);
    if (activeMode === 'direct') {
      syncDirectMessages();
    } else if (activeMode === 'group') {
      syncGroupMessages();
    }

    const interval = setInterval(() => {
      syncSocialData();
      syncServerGroups();
      if (activeMode === 'direct') {
        syncDirectMessages();
      } else if (activeMode === 'group') {
        syncGroupMessages();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeUserId, activeFriendId, activeGroupId, activeMode, isRealAdmin]);

  useEffect(() => {
    if (isRealAdmin && activeMode === 'direct' && !activeFriendId) {
      setActiveFriendId('all_broadcast');
    }
  }, [isRealAdmin, activeMode, activeFriendId]);

  // Trigger search whenever friendSearchQuery changes or modal opens
  useEffect(() => {
    if (showFriendsModal) {
      searchUsersByName(friendSearchQuery);
    }
  }, [friendSearchQuery, showFriendsModal]);

  const isFriend = (memberId: string) => {
    return friends.some((f) => f.id === memberId && f.status === 'friend');
  };

  // Has sent pending friend request to target
  const hasSentRequest = (targetUserId: string) => {
    return friendRequests.outgoing.some(
      (r) => r.toUserId === targetUserId && r.status === 'pending'
    );
  };

  // Has received pending friend request from target
  const getIncomingRequest = (targetUserId: string) => {
    return friendRequests.incoming.find(
      (r) => r.fromUserId === targetUserId && r.status === 'pending'
    );
  };

  // Send a Friend Request (Gửi lời kết bạn)
  const handleSendFriendRequest = async (targetUser: { id: string; name: string; avatar?: string }) => {
    if (targetUser.id === activeUserId || isAiEntity(targetUser)) return;

    // Check if already friends
    if (isFriend(targetUser.id)) {
      setToastMessage(`Bạn và ${targetUser.name} đã là bạn bè rồi!`);
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUser: {
            id: activeUserId,
            name: activeUserName,
            avatar: activeUserAvatar,
          },
          toUser: {
            id: targetUser.id,
            name: targetUser.name,
            avatar: targetUser.avatar,
          },
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        if (data.status === 'accepted') {
          // Both invited each other -> auto accepted
          const newFriend: FriendItem = {
            id: targetUser.id,
            name: targetUser.name,
            avatar: targetUser.avatar,
            school: 'Học sinh Max10',
            status: 'friend',
            addedAt: 'Vừa xong',
          };
          setFriends((prev) => [...prev.filter((f) => f.id !== targetUser.id), newFriend]);
          setToastMessage(`Đã kết bạn thành công với "${targetUser.name}"! 🎉`);
        } else {
          // Pending request
          if (data.request) {
            setFriendRequests((prev) => ({
              ...prev,
              outgoing: [data.request, ...prev.outgoing.filter((r) => r.id !== data.request.id)],
            }));
          }
          setToastMessage(`Đã gửi lời mời kết bạn tới "${targetUser.name}"! Đang chờ bạn ấy đồng ý.`);
        }
      }
    } catch (e) {
      setToastMessage(`Lỗi gửi lời kết bạn tới ${targetUser.name}`);
    }

    syncSocialData();
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Cancel an outgoing friend request
  const handleCancelFriendRequest = async (requestId: string, toUserId: string) => {
    try {
      await fetch('/api/friends/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, fromUserId: activeUserId, toUserId }),
      });
      setFriendRequests((prev) => ({
        ...prev,
        outgoing: prev.outgoing.filter((r) => r.id !== requestId && r.toUserId !== toUserId),
      }));
      setToastMessage('Đã hủy lời mời kết bạn.');
    } catch (e) {}
    syncSocialData();
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Respond to incoming friend request: ĐỒNG Ý (Accept) or TỪ CHỐI (Decline)
  const handleRespondFriendRequest = async (request: FriendRequest, action: 'accept' | 'decline') => {
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id, action }),
      });

      const data = await res.json();
      if (data && data.success) {
        if (action === 'accept') {
          const newFriend: FriendItem = {
            id: request.fromUserId,
            name: request.fromUserName,
            avatar: request.fromUserAvatar,
            school: 'Học sinh Max10',
            status: 'friend',
            addedAt: 'Vừa xong',
          };
          setFriends((prev) => [...prev.filter((f) => f.id !== request.fromUserId), newFriend]);
          setToastMessage(`Đã đồng ý kết bạn với "${request.fromUserName}"! 🎉 Hai bạn có thể nhắn tin riêng 1-1 ngay.`);
        } else {
          setToastMessage(`Đã từ chối lời mời kết bạn từ "${request.fromUserName}".`);
        }

        // Remove from incoming requests
        setFriendRequests((prev) => ({
          ...prev,
          incoming: prev.incoming.filter((r) => r.id !== request.id),
        }));
      }
    } catch (e) {
      setToastMessage('Lỗi xử lý lời mời kết bạn');
    }

    syncSocialData();
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Add custom real friend by name directly (No class/grade needed)
  const handleAddCustomFriendByName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newFriendName.trim();
    if (!trimmed) return;

    const targetUser = {
      id: 'user-' + trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now(),
      name: trimmed,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    };

    // Send friend request
    await handleSendFriendRequest(targetUser);
    setNewFriendName('');
  };

  // Extract real human student peers only from user-created groups (no fake preset peers, no teachers, no AI)
  const allPeers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatar?: string; school?: string; groupName: string }>();

    // Dynamic peers only from groups created by the user (excluding active user, teachers, and all AI entities)
    groups.forEach((g) => {
      g.members.forEach((m) => {
        if (m.id !== activeUserId && !isAiEntity(m)) {
          if (!map.has(m.id)) {
            map.set(m.id, {
              id: m.id,
              name: m.name,
              avatar: m.avatar,
              school: m.school || 'THCS Nguyễn Du',
              groupName: g.name,
            });
          }
        }
      });
    });

    return Array.from(map.values());
  }, [groups, activeUserId]);

  // Peers that are not yet added as friends (for instant 1-click adding without searching)
  const unfriendedPeers = useMemo(() => {
    return allPeers.filter((p) => !isFriend(p.id));
  }, [allPeers, friends]);

  const handleOpenFriendsModal = (preferredTab?: 'my_friends' | 'find_friends' | 'requests' | 'blocked') => {
    if (preferredTab) {
      setFriendsModalTab(preferredTab);
    } else {
      // If user has incoming friend requests, open requests tab first
      if (friendRequests.incoming.length > 0) {
        setFriendsModalTab('requests');
      } else {
        setFriendsModalTab(friends.length === 0 ? 'find_friends' : 'my_friends');
      }
    }
    setShowFriendsModal(true);
  };

  const handleToggleFriend = (member: { id: string; name: string; avatar?: string; school?: string }) => {
    if (member.id === activeUserId || isAiEntity(member)) return;

    if (isFriend(member.id)) {
      setUserToUnfriend({ id: member.id, name: member.name });
    } else {
      handleSendFriendRequest(member);
    }
  };

  const handleConfirmUnfriend = async (friendId: string, friendName: string) => {
    try {
      await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUserId, friendId }),
      });
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      setToastMessage(`Đã hủy kết bạn với "${friendName}"`);
    } catch (e) {
      setToastMessage(`Lỗi hủy kết bạn với ${friendName}`);
    }
    setUserToUnfriend(null);
    syncSocialData();
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleConfirmBlock = async (targetId: string, targetName: string) => {
    try {
      await fetch('/api/friends/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUserId, targetId }),
      });
      setFriends((prev) => prev.filter((f) => f.id !== targetId));
      setBlockedUsers((prev) => [
        ...prev.filter((b) => b.userId !== targetId),
        { userId: targetId, name: targetName, blockedAt: new Date().toLocaleDateString('vi-VN') },
      ]);
      setToastMessage(`Đã chặn "${targetName}". Người này sẽ không thể nhắn tin hay gửi lời mời cho bạn.`);
    } catch (e) {
      setToastMessage(`Lỗi chặn ${targetName}`);
    }
    setUserToBlock(null);
    syncSocialData();
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleUnblock = async (targetId: string, targetName: string) => {
    try {
      await fetch('/api/friends/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUserId, targetId }),
      });
      setBlockedUsers((prev) => prev.filter((b) => b.userId !== targetId));
      setToastMessage(`Đã bỏ chặn "${targetName}" thành công.`);
    } catch (e) {
      setToastMessage(`Lỗi bỏ chặn ${targetName}`);
    }
    syncSocialData();
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleUpdatePresenceStatus = async (newStatus: UserPresenceStatus) => {
    setUserPresence(newStatus);
    try {
      localStorage.setItem('max10_user_presence_status', newStatus);
      if (onPresenceStatusChange) {
        onPresenceStatusChange(newStatus);
      }
      await fetch('/api/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUserId, status: newStatus }),
      });
      setToastMessage(
        `Đã đổi trạng thái: ${PRESENCE_STATUS_CONFIG[newStatus].iconEmoji} ${PRESENCE_STATUS_CONFIG[newStatus].label}`
      );
    } catch (e) {}
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Delete group handler (just like Messenger)
  const handleDeleteGroup = (groupId: string) => {
    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) return;

    deletedGroupIdsRef.current.add(groupId);
    const remainingGroups = groups.filter((g) => g.id !== groupId);

    setGroups(remainingGroups);
    setServerGroups((prev) => prev.filter((g) => g.id !== groupId));
    try {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(remainingGroups));
    } catch (e) {
      console.warn('Lỗi cập nhật nhóm sau khi xóa', e);
    }

    if (targetGroup.isClassGroup && targetGroup.classCode) {
      deleteClassSeatingPlan(targetGroup.classCode as ClassCode);
    }

    fetch(`/api/groups/${encodeURIComponent(groupId)}`, {
      method: 'DELETE',
    }).catch(() => {});

    // Clean messages
    setGroupMessages((prev) => {
      const nextMsgs = { ...prev };
      delete nextMsgs[groupId];
      try {
        localStorage.setItem(STORAGE_KEY_GROUP_MSGS, JSON.stringify(nextMsgs));
      } catch (err) {
        console.warn(err);
      }
      return nextMsgs;
    });

    if (activeGroupId === groupId) {
      setActiveGroupId(remainingGroups[0]?.id || '');
    }

    setGroupToDelete(null);
    setToastMessage(`Đã xóa nhóm "${targetGroup.name}" thành công! 🗑️`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // New Group & Community Form State
  const isVerifiedTeacherOrAdmin = Boolean(
    currentUser &&
      ((currentUser.role === 'teacher' && currentUser.isVerifiedTeacher !== false) ||
        currentUser.role === 'admin' ||
        currentUser.isSuperAdmin)
  );
  const [newGroupMode, setNewGroupMode] = useState<'class_homeroom' | 'study' | 'community'>(() =>
    isRealAdmin ? 'community' : isVerifiedTeacherOrAdmin ? 'class_homeroom' : 'study'
  );
  const [newCommunityCategory, setNewCommunityCategory] = useState<'study' | 'game'>('study');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupSubject, setNewGroupSubject] = useState<string>('Toán học');
  const [newGroupGrade, setNewGroupGrade] = useState<GradeLevel>(currentGrade);
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');
  const [newGroupIcon, setNewGroupIcon] = useState<string>('🏫');
  const [newClassCode, setNewClassCode] = useState<ClassCode>(
    (currentUser?.homeroomClass as ClassCode) || '9D1'
  );
  const [newClassStudentCount, setNewClassStudentCount] = useState<number>(36);
  const [newSeatingRows, setNewSeatingRows] = useState<number>(5);
  const [newSeatingCols, setNewSeatingCols] = useState<number>(4);
  const [newSeatsPerDesk, setNewSeatsPerDesk] = useState<1 | 2>(2);

  // Input & Sending State
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isAiReplying, setIsAiReplying] = useState<boolean>(false);

  // Search state for groups and friends
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');

  const [copiedRules, setCopiedRules] = useState<boolean>(false);

  const handleCopyRules = () => {
    const rulesText = `📜 NỘI QUY NHÓM CHAT HỌC SINH (THCS NGUYỄN DU)
- Tự do trò chuyện, thoải mái kết bạn và học cùng nhau.
- Xưng hô mày - tao thân mật thoải mái, không cấm đoán.
- CHỈ CÓ NGƯỜI THẬT MỚI ĐƯỢC NHẮN TIN, TUYỆT ĐỐI KHÔNG CHO AI NHẮN!
- Nếu cần giải bài cùng Max10 AI, hãy chuyển sang mục Trò chuyện riêng.`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(rulesText);
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 2500);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active group object (safe if groups is empty)
  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const messages = activeGroupId ? groupMessages[activeGroupId] || [] : [];

  // Official Admin-created multi-user Communities (Game & Study) — strictly real human members, zero AI
  const communityGroups = useMemo(() => {
    const map = new Map<string, ChatGroup>();
    [...groups, ...serverGroups].forEach((g) => {
      if (g && g.isCommunity && !deletedGroupIdsRef.current.has(g.id)) {
        const cleanMembers = (g.members || []).filter((m) => !isAiEntity(m));
        const existing = map.get(g.id);
        if (existing) {
          const memberMap = new Map<string, GroupMember>();
          [...existing.members, ...cleanMembers].forEach((m) => memberMap.set(m.id, m));
          map.set(g.id, { ...existing, ...g, onlyAdminCanAdd: false, members: Array.from(memberMap.values()) });
        } else {
          map.set(g.id, { ...g, onlyAdminCanAdd: false, members: cleanMembers });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [groups, serverGroups]);

  const approvedCommunities = useMemo(
    () => communityGroups.filter((c) => (c.approvalStatus || 'approved') === 'approved'),
    [communityGroups]
  );

  const pendingCommunities = useMemo(
    () => communityGroups.filter((c) => c.approvalStatus === 'pending'),
    [communityGroups]
  );

  const approvedGameCommunities = useMemo(
    () => approvedCommunities.filter((c) => c.communityCategory === 'game'),
    [approvedCommunities]
  );

  const approvedStudyCommunities = useMemo(
    () => approvedCommunities.filter((c) => (c.communityCategory || 'study') === 'study'),
    [approvedCommunities]
  );

  const pinnedTrendingGames = useMemo(
    () =>
      approvedGameCommunities
        .filter((c) => Boolean(c.isPinnedTrending))
        .sort((a, b) => (b.pinnedTrendingAt || b.createdAt || 0) - (a.pinnedTrendingAt || a.createdAt || 0)),
    [approvedGameCommunities]
  );

  const unpinnedGameCommunities = useMemo(
    () => approvedGameCommunities.filter((c) => !c.isPinnedTrending),
    [approvedGameCommunities]
  );

  const handleTogglePinTrendingGame = async (
    comm: ChatGroup,
    explicitPinned?: boolean,
    explicitBadge?: string
  ) => {
    if (!isRealAdmin) return;
    const nextPinned = explicitPinned !== undefined ? explicitPinned : !comm.isPinnedTrending;
    const nextBadge = explicitBadge || comm.trendingBadge || 'Thịnh hành';
    const nowTs = Date.now();

    const applyUpdate = (list: ChatGroup[]) =>
      list.map((g) =>
        g.id === comm.id
          ? {
              ...g,
              isPinnedTrending: nextPinned,
              pinnedTrendingAt: nextPinned ? nowTs : undefined,
              trendingBadge: nextPinned ? nextBadge : g.trendingBadge,
            }
          : g
      );

    setGroups(applyUpdate);
    setServerGroups(applyUpdate);

    try {
      await fetch(`/api/communities/${encodeURIComponent(comm.id)}/pin-trending`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinned: nextPinned,
          trendingBadge: nextBadge,
          adminId: activeUserId,
          isAdminRequester: isRealAdmin,
        }),
      });
      await syncServerGroups();
    } catch {}

    setToastMessage(
      nextPinned
        ? `Đã ghim "${comm.gameTitle || comm.name}" lên mục Trò chơi đang thịnh hành!`
        : `Đã bỏ ghim "${comm.gameTitle || comm.name}" khỏi mục Thịnh hành.`
    );
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleApproveCommunity = async (
    comm: ChatGroup,
    action: 'approve' | 'reject',
    pinTrending = false
  ) => {
    if (!isRealAdmin) return;
    const nowTs = Date.now();

    const applyUpdate = (list: ChatGroup[]) =>
      list.map((g) =>
        g.id === comm.id
          ? {
              ...g,
              approvalStatus: action === 'approve' ? ('approved' as const) : ('rejected' as const),
              approvedAt: nowTs,
              approvedBy: ADMIN_ID,
              ...(action === 'approve' && pinTrending
                ? {
                    isPinnedTrending: true,
                    pinnedTrendingAt: nowTs,
                    trendingBadge: g.trendingBadge || 'Thịnh hành',
                  }
                : action === 'reject'
                ? { isPinnedTrending: false }
                : {}),
            }
          : g
      );

    setGroups(applyUpdate);
    setServerGroups(applyUpdate);

    try {
      await fetch(`/api/communities/${encodeURIComponent(comm.id)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          pinTrending,
          trendingBadge: comm.trendingBadge || 'Thịnh hành',
          adminId: activeUserId,
          isAdminRequester: isRealAdmin,
        }),
      });
      await syncServerGroups();
    } catch {}

    setToastMessage(
      action === 'approve'
        ? pinTrending
          ? `Đã duyệt & ghim thịnh hành cộng đồng "${comm.name}"!`
          : `Đã duyệt cộng đồng "${comm.name}"!`
        : `Đã từ chối đề xuất "${comm.name}".`
    );
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleOpenEditCommunity = (comm: ChatGroup) => {
    setEditingCommunity(comm);
    setEditCommForm({
      name: comm.name || '',
      description: comm.description || '',
      communityCategory: comm.communityCategory === 'study' ? 'study' : 'game',
      gameTitle: comm.gameTitle || '',
      gamePlatform: comm.gamePlatform || 'Cross-Platform',
      gameGenre: comm.gameGenre || '',
      avatarIcon: comm.avatarIcon || (comm.communityCategory === 'game' ? '🎮' : '📚'),
      pinnedNotice: comm.pinnedNotice || '',
      isPinnedTrending: Boolean(comm.isPinnedTrending),
      trendingBadge: comm.trendingBadge || 'Thịnh hành',
    });
  };

  const handleSaveEditedCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRealAdmin || !editingCommunity || !editCommForm.name.trim()) return;

    const targetId = editingCommunity.id;
    const isGame = editCommForm.communityCategory === 'game';
    const applyUpdate = (list: ChatGroup[]) =>
      list.map((g) =>
        g.id === targetId
          ? {
              ...g,
              name: editCommForm.name.trim(),
              description: editCommForm.description.trim(),
              communityCategory: editCommForm.communityCategory,
              subject: isGame ? `Trò chơi · ${editCommForm.gamePlatform}` : 'Học tập',
              gameTitle: isGame ? editCommForm.gameTitle.trim() : undefined,
              gamePlatform: isGame ? editCommForm.gamePlatform : undefined,
              gameGenre: isGame ? editCommForm.gameGenre.trim() : undefined,
              avatarIcon: editCommForm.avatarIcon,
              pinnedNotice: editCommForm.pinnedNotice.trim(),
              isPinnedTrending: isGame ? editCommForm.isPinnedTrending : false,
              pinnedTrendingAt:
                isGame && editCommForm.isPinnedTrending ? g.pinnedTrendingAt || Date.now() : undefined,
              trendingBadge: isGame ? editCommForm.trendingBadge : undefined,
            }
          : g
      );

    setGroups(applyUpdate);
    setServerGroups(applyUpdate);
    setEditingCommunity(null);

    try {
      await fetch(`/api/communities/${encodeURIComponent(targetId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: activeUserId,
          isAdminRequester: isRealAdmin,
          ...editCommForm,
        }),
      });
      await syncServerGroups();
    } catch {}

    setToastMessage(`Đã cập nhật thông tin cộng đồng "${editCommForm.name.trim()}"!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleProposeGameCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuthModal?.();
      return;
    }
    if (!proposeGameForm.name.trim()) return;

    try {
      const res = await fetch('/api/communities/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: proposeGameForm.name.trim(),
          gameTitle: proposeGameForm.gameTitle.trim() || proposeGameForm.name.trim(),
          gamePlatform: proposeGameForm.gamePlatform,
          gameGenre: proposeGameForm.gameGenre.trim() || 'Cộng đồng Game thủ',
          description: proposeGameForm.description.trim(),
          avatarIcon: proposeGameForm.avatarIcon || '🎮',
          communityCategory: 'game',
          requesterId: activeUserId,
          requesterName: activeUserName,
          requesterAvatar: activeUserAvatar || '',
          isAdminRequester: isRealAdmin,
        }),
      });
      const data = await res.json();
      if (data?.success && data.group) {
        setGroups((prev) => [data.group, ...prev]);
        setServerGroups((prev) => [data.group, ...prev]);
        setShowProposeGameModal(false);
        setProposeGameForm({
          name: '',
          gameTitle: '',
          gamePlatform: 'Cross-Platform',
          gameGenre: 'MOBA / Đấu trường',
          description: '',
          avatarIcon: '🎮',
        });
        setToastMessage(
          isRealAdmin
            ? `Đã tạo Cộng đồng Game "${data.group.name}"!`
            : `Đã gửi đề xuất "${data.group.name}"! Đang chờ Admin duyệt.`
        );
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch {
      setToastMessage('Lỗi gửi đề xuất cộng đồng Game.');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleSaveAdminAutoReply = async (nextEnabled: boolean, nextGreeting?: string) => {
    if (!isRealAdmin || isSavingAutoReply) return;
    setIsSavingAutoReply(true);
    const greetingToSave = nextGreeting !== undefined ? nextGreeting : adminAutoReplyGreeting;
    try {
      const res = await fetch('/api/admin/auto-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: activeUserId,
          enabled: nextEnabled,
          customGreeting: greetingToSave,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setAdminAutoReplyEnabled(Boolean(data.enabled));
        setAdminAutoReplyGreeting(data.customGreeting || '');
        setToastMessage(
          data.enabled
            ? '🤖 Đã bật chế độ Admin Tự động trả lời khi có người @Admin!'
            : '✍️ Đã chuyển sang chế độ Admin Tự trả lời thủ công khi bị @Admin!'
        );
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch {
      setToastMessage('Không thể lưu cấu hình trả lời @Admin.');
      setTimeout(() => setToastMessage(''), 2500);
    } finally {
      setIsSavingAutoReply(false);
    }
  };

  const handleJumpToPendingMention = async (mention: {
    id: string;
    type: 'group' | 'direct';
    targetId: string;
    targetName: string;
    senderName: string;
    content: string;
  }) => {
    setShowCommunitiesView(false);
    if (mention.type === 'group') {
      setActiveMode('group');
      setActiveGroupId(mention.targetId);
      await syncGroupMessages(mention.targetId);
    } else {
      setActiveMode('direct');
      setActiveFriendId(mention.targetId);
      await syncDirectMessages();
    }
    setReplyingTo({
      id: mention.id,
      senderName: mention.senderName,
      content: mention.content,
    });
    fetch('/api/admin/mentions/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentionId: mention.id }),
    }).catch(() => {});
    setAdminPendingMentions((prev) => prev.filter((item) => item.id !== mention.id));
  };

  // Active friend for 1-on-1 private chat or Admin real inbox / broadcast channel
  const matchedAdminThread = isRealAdmin
    ? adminInboxThreads.find((t) => t.partnerId === activeFriendId)
    : undefined;

  const activeFriend =
    activeFriendId === 'all_broadcast'
      ? {
          id: 'all_broadcast',
          name: '📢 Thông Báo & Cập Nhật Hệ Thống',
          avatar: REAL_ADMIN_AVATAR,
          school: 'Kênh phát hành chính thức Max10 AI',
          status: 'friend' as const,
          presenceStatus: 'online' as const,
          role: 'admin',
        }
      : friends.find((f) => f.id === activeFriendId) ||
        (matchedAdminThread
          ? {
              id: matchedAdminThread.partnerId,
              name: matchedAdminThread.partnerName,
              avatar: matchedAdminThread.partnerAvatar,
              school: matchedAdminThread.partnerRole === 'teacher' ? 'Giáo viên Max10' : 'Học sinh Max10',
              status: 'friend' as const,
              presenceStatus: matchedAdminThread.presenceStatus || ('online' as const),
              role: matchedAdminThread.partnerRole || 'student',
            }
          : activeFriendId === ADMIN_ID && !isRealAdmin
          ? {
              id: ADMIN_ID,
              name: 'Ban Quản Trị Max10',
              avatar: REAL_ADMIN_AVATAR,
              school: 'Ban Quản Trị Hệ Thống Max10 AI',
              status: 'friend' as const,
              presenceStatus: 'online' as const,
              role: 'admin',
            }
          : undefined);
  const isConfirmedFriend =
    !!activeFriend &&
    (isRealAdmin || activeFriend.id === ADMIN_ID || activeFriend.id === 'all_broadcast' || isFriend(activeFriend.id));
  const currentDirectMsgs = activeFriendId ? directMessages[activeFriendId] || [] : [];
  const isFriendBlocked = useMemo(() => {
    if (!activeFriend) return false;
    return blockedUsers.some((b) => b.userId === activeFriend.id);
  }, [activeFriend, blockedUsers]);

  // Group mute status based on violation count & expiration
  const activeGroupMute = activeGroup?.mutedUsers?.[activeUserId];
  const [nowTime, setNowTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCurrentlyMuted =
    activeMode === 'group' &&
    !!activeGroupMute &&
    activeGroupMute.mutedUntil > nowTime;
  const muteRemainingSeconds = isCurrentlyMuted
    ? Math.max(0, Math.ceil((activeGroupMute.mutedUntil - nowTime) / 1000))
    : 0;

  // Save groups to localStorage & broadcast to ContextPanel
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
      window.dispatchEvent(new CustomEvent('max10_groups_updated'));
    } catch (e) {
      console.warn('Lỗi lưu nhóm', e);
    }
  }, [groups]);

  // Broadcast active chat selection to ContextPanel
  useEffect(() => {
    const activeId = activeMode === 'group' ? activeGroupId : activeFriendId;
    if (activeId) {
      window.dispatchEvent(
        new CustomEvent('max10_community_active_changed', {
          detail: { type: activeMode, id: activeId },
        })
      );
    }
  }, [activeMode, activeGroupId, activeFriendId]);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GROUP_MSGS, JSON.stringify(groupMessages));
    } catch (e) {
      console.warn('Lỗi lưu tin nhắn', e);
    }
  }, [groupMessages]);

  // Save violations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER_VIOLATIONS, JSON.stringify(violationCounts));
    } catch (e) {
      console.warn('Lỗi lưu vi phạm', e);
    }
  }, [violationCounts]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentDirectMsgs, isAiReplying, activeMode]);

  // Handle Send Message (Direct chat: allows profanity between friends; Group chat: strictly bans profanity)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text) return;

    const nowMs = Date.now();
    const timeStr = formatAccurateTime(nowMs);

    // MODE 1: DIRECT 1-ON-1 CHAT WITH FRIEND
    if (activeMode === 'direct') {
      if (!activeFriend) {
        setToastMessage('Vui lòng chọn một người bạn để trò chuyện!');
        setTimeout(() => setToastMessage(''), 3000);
        return;
      }

      // REQUIREMENT: "chỉ đc nói chuyện với bạn bè khi kết bạn"
      if (!isConfirmedFriend) {
        setToastMessage(`Bạn chưa kết bạn với ${activeFriend.name}. Cần kết bạn trước mới được nhắn tin riêng!`);
        setTimeout(() => setToastMessage(''), 3000);
        return;
      }

      // REQUIREMENT: "khi chat với bạn bè thì chỉ gửi một lần tin nhắn"
      if (isSendingDm) return;
      setIsSendingDm(true);

      setInputMessage('');

      // If sending in the official Admin Updates & Messages channel ('all_broadcast')
      if (activeFriend.id === 'all_broadcast') {
        const currentReply = replyingTo || undefined;
        setReplyingTo(null);

        if (isRealAdmin) {
          try {
            const res = await fetch('/api/admin/broadcast', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: text,
                publishUpdate: false,
                senderId: ADMIN_ID,
                senderName: `${ADMIN_NAME} (Quản trị viên)`,
                senderAvatar: REAL_ADMIN_AVATAR,
                replyTo: currentReply,
              }),
            });
            const data = await res.json();
            if (data?.success && data.message) {
              setAdminBroadcastMessages((prev) => [...prev, data.message]);
              setDirectMessages((prev) => ({
                ...prev,
                all_broadcast: [...(prev['all_broadcast'] || []), data.message],
              }));
            }
          } catch (err) {}
          if (currentReply) {
            const hideAt = Date.now();
            setHiddenOtherBroadcastAt(hideAt);
            try {
              localStorage.setItem(STORAGE_KEY_HIDDEN_BROADCAST_AT, String(hideAt));
            } catch {}
          }
          setTimeout(() => setIsSendingDm(false), 250);
          setToastMessage(
            currentReply
              ? 'Đã trả lời tin nhắn trong kênh Admin & ẩn tin nhắn người khác gửi!'
              : 'Đã gửi tin nhắn Admin tới toàn bộ người dùng!'
          );
          setTimeout(() => setToastMessage(''), 2500);
          return;
        }
      }

      const currentReply = replyingTo || undefined;
      const dmMsgId = 'dm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const dmMsg: DirectChatMessage = {
        id: dmMsgId,
        senderId: activeUserId,
        senderName: activeUserName,
        senderAvatar: activeUserAvatar,
        recipientId: activeFriend.id,
        content: text,
        timestamp: timeStr,
        createdAt: nowMs,
        status: 'delivered',
        replyTo: currentReply,
      };
      setReplyingTo(null);

      setDirectMessages((prev) => {
        const currentList = prev[activeFriend.id] || [];
        const isDuplicate = currentList.some(
          (m) =>
            m.id === dmMsgId ||
            (m.senderId === activeUserId &&
              m.recipientId === activeFriend.id &&
              (m.content || '').trim() === text &&
              Math.abs((m.createdAt || 0) - nowMs) < 5000)
        );
        if (isDuplicate) return prev;
        return {
          ...prev,
          [activeFriend.id]: [...currentList, dmMsg],
        };
      });

      // After replying in Admin Updates ('all_broadcast') or Admin Inbox thread, hide other senders' incoming messages section
      if (activeFriend.id === 'all_broadcast' && currentReply) {
        const hideAt = Date.now();
        setHiddenOtherBroadcastAt(hideAt);
        try {
          localStorage.setItem(STORAGE_KEY_HIDDEN_BROADCAST_AT, String(hideAt));
        } catch {}
      }
      if (isRealAdmin && matchedAdminThread) {
        const nextReplied = { ...repliedAdminThreads, [activeFriend.id]: Date.now() };
        setRepliedAdminThreads(nextReplied);
        try {
          localStorage.setItem(STORAGE_KEY_REPLIED_ADMIN_THREADS, JSON.stringify(nextReplied));
        } catch {}
      }
      if (isRealAdmin) {
        fetch('/api/admin/mentions/ack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetId: activeFriend.id }),
        }).catch(() => {});
      }

      // Persist direct message to server (Exact ID + replyTo preserved)
      fetch('/api/friends/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dmMsgId,
          senderId: activeUserId,
          senderName: activeUserName,
          senderAvatar: activeUserAvatar,
          recipientId: activeFriend.id,
          content: text,
          timestamp: timeStr,
          createdAt: nowMs,
          replyTo: currentReply,
        }),
      })
        .catch(() => {})
        .finally(() => {
          setTimeout(() => setIsSendingDm(false), 300);
        });

      setToastMessage(`Đã gửi tin nhắn tới ${activeFriend.name}`);
      setTimeout(() => setToastMessage(''), 2000);

      // Check @Admin mention in DM/Broadcast (if sender is not Admin)
      const lowerDm = text.toLowerCase();
      const isTaggingAdminDm =
        !isRealAdmin &&
        (lowerDm.includes('@admin') ||
          lowerDm.includes('@mạc khánh duy') ||
          lowerDm.includes('@mac khanh duy'));

      if (isTaggingAdminDm) {
        let shouldAutoReply = adminAutoReplyEnabled;
        let customPrefix = adminAutoReplyGreeting;
        try {
          const cfgRes = await fetch('/api/admin/auto-reply');
          if (cfgRes.ok) {
            const cfgData = await cfgRes.json();
            if (cfgData?.success) {
              shouldAutoReply = Boolean(cfgData.enabled);
              customPrefix = cfgData.customGreeting || '';
              setAdminAutoReplyEnabled(shouldAutoReply);
            }
          }
        } catch {}

        if (shouldAutoReply) {
          setIsAiReplying(true);
          try {
            const resAdmin = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: `Bạn là Quản trị viên hệ thống Max10 AI (đang bật chế độ tự động trả lời). Người dùng "${activeUserName}" vừa nhắn @tag bạn trong "${activeFriend.name}": "${text}". Hãy trả lời thân thiện, ngắn gọn, giải đáp trực tiếp bằng tiếng Việt.`,
                grade: currentGrade,
                subject: 'Tổng hợp',
              }),
            });
            const dataAdmin = await resAdmin.json();
            const replyCore =
              dataAdmin?.reply ||
              dataAdmin?.text ||
              `Chào ${activeUserName}! Quản trị viên Max10 đã nhận được câu hỏi của bạn và sẽ hỗ trợ bạn ngay.`;
            const finalAdminReply = customPrefix ? `${customPrefix}\n\n${replyCore}` : replyCore;

            const adminAutoMsg: DirectChatMessage = {
              id: 'dm-admin-auto-' + Date.now(),
              senderId: ADMIN_ID,
              senderName: 'Quản trị viên Max10 (Tự động)',
              senderAvatar: REAL_ADMIN_AVATAR,
              recipientId: activeFriend.id === 'all_broadcast' ? 'all_broadcast' : activeUserId,
              content: finalAdminReply,
              timestamp: formatAccurateTime(Date.now()),
              createdAt: Date.now(),
              replyTo: { id: dmMsgId, senderName: activeUserName, content: text },
            };

            setDirectMessages((prev) => ({
              ...prev,
              [activeFriend.id]: [...(prev[activeFriend.id] || []), adminAutoMsg],
            }));

            fetch(activeFriend.id === 'all_broadcast' ? '/api/admin/broadcast' : '/api/friends/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...adminAutoMsg,
                publishUpdate: false,
              }),
            }).catch(() => {});
          } catch {
          } finally {
            setIsAiReplying(false);
          }
        } else {
          setToastMessage('📩 Đã gửi câu hỏi tới Quản trị viên Max10 — Admin sẽ tự trả lời trực tiếp cho bạn!');
          setTimeout(() => setToastMessage(''), 3500);
        }
      }

      // Allow @Max10 AI inside 1-1 Direct Chat too!
      const isTaggingAiDm =
        lowerDm.includes('@max10 ai') ||
        lowerDm.includes('@max10') ||
        /(^|\s)@ai(\s|$|[.,!?])/.test(lowerDm);

      if (isTaggingAiDm) {
        setIsAiReplying(true);
        try {
          const resAi = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `Bạn là Max10 AI - Gia sư Điểm 10 THCS được gọi vào cuộc trò chuyện 1-1 giữa "${activeUserName}" và "${activeFriend.name}". Nội dung hỏi: "${text}". Hãy giải bài chi tiết, ngắn gọn, dễ hiểu bằng tiếng Việt.`,
              grade: currentGrade,
              subject: 'Toán',
            }),
          });
          const dataAi = await resAi.json();
          const aiReplyText =
            dataAi?.reply ||
            dataAi?.text ||
            `Chào **${activeUserName}** và **${activeFriend.name}**! Max10 AI đã có mặt để hỗ trợ hai bạn giải bài tập. Hãy gửi đề bài chi tiết nhé!`;

          const aiDmReply: DirectChatMessage = {
            id: 'ai-dm-' + Date.now(),
            senderId: 'ai-max10-dm',
            senderName: 'Max10 AI (Gia sư Điểm 10)',
            senderAvatar: '/max10-avatar.jpg',
            recipientId: activeFriend.id,
            content: aiReplyText,
            timestamp: formatAccurateTime(Date.now()),
            createdAt: Date.now(),
          };
          setDirectMessages((prev) => ({
            ...prev,
            [activeFriend.id]: [...(prev[activeFriend.id] || []), aiDmReply],
          }));
        } catch {
        } finally {
          setIsAiReplying(false);
        }
      }
      return;
    }

    // MODE 2: GROUP CHAT
    if (!activeGroup) {
      setToastMessage('Chưa có nhóm chat nào được chọn!');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    if (isCurrentlyMuted) {
      setToastMessage(`Bạn đang bị cấm chat trong nhóm (còn ${Math.floor(muteRemainingSeconds / 60)}p ${muteRemainingSeconds % 60}s) vì nói tục!`);
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    // REQUIREMENT: "còn trong nhóm thì ko [được nói tục]" -> PROFANITY STRICTLY CHECKED & FORBIDDEN
    const profanityResult = checkProfanity(text);
    if (profanityResult.hasProfanity) {
      const vKey = `${activeGroupId}_${activeUserId}`;
      const newCount = (violationCounts[vKey] || 0) + 1;
      setViolationCounts((prev) => ({ ...prev, [vKey]: newCount }));

      if (newCount === 1) {
        // Strike 1: Warning
        const warnMsg: GroupChatMessage = {
          id: 'sys-warn-' + Date.now(),
          groupId: activeGroupId,
          senderId: 'system-bot',
          senderName: 'Hệ thống Quản trị Nhóm',
          senderRole: 'system',
          isSystemNotice: true,
          isWarning: true,
          content: `⚠️ **CẢNH BÁO QUY TẮC NHÓM:**\nThành viên **${activeUserName}** vừa sử dụng từ ngữ không phù hợp trong nhóm: *${profanityResult.detectedWords.join(', ')}*.\n\n📌 **QUY ĐỊNH:** Trong nhóm học tập **NGHIÊM CẤM NÓI TỤC / NÓI BẬY**! Nhắc nhở lần 1. Tái phạm lần sau sẽ bị cấm chat 5p - 1h.\n👉 *Lưu ý: Chỉ khi chat riêng 1-1 với bạn bè (đã kết bạn) mới được nói tục tự do!*`,
          timestamp: timeStr,
        };
        setGroupMessages((prev) => ({
          ...prev,
          [activeGroupId]: [...(prev[activeGroupId] || []), warnMsg],
        }));
        setToastMessage('🚫 Trong nhóm nghiêm cấm nói tục! (Chỉ được nói tục khi chat riêng 1-1 với bạn bè)');
      } else {
        // Strike 2+: Mute user in this group
        const muteMin = calculateMuteDurationMinutes(newCount);
        const muteUntil = Date.now() + muteMin * 60 * 1000;
        const muteRec: UserMuteRecord = {
          userId: activeUserId,
          userName: activeUserName,
          mutedUntil: muteUntil,
          muteDurationMinutes: muteMin,
          violationCount: newCount,
          reason: `Nói tục lần ${newCount} trong nhóm: ${profanityResult.detectedWords.join(', ')}`,
          mutedAt: Date.now(),
        };
        setGroups((prev) =>
          prev.map((g) => (g.id === activeGroupId ? { ...g, mutedUsers: { ...g.mutedUsers, [activeUserId]: muteRec } } : g))
        );
        const muteNotice: GroupChatMessage = {
          id: 'sys-mute-' + Date.now(),
          groupId: activeGroupId,
          senderId: 'system-bot',
          senderName: 'Hệ thống Quản trị Nhóm',
          senderRole: 'system',
          isSystemNotice: true,
          isMuteNotice: true,
          muteDurationMinutes: muteMin,
          unmuteTime: muteUntil,
          content: `🚨 **XỬ PHẠT NÓI TỤC TRONG NHÓM:**\nThành viên **${activeUserName}** tiếp tục vi phạm nói tục trong nhóm lần ${newCount}.\n\n⛔ **HÌNH PHẠT:** CẤM CHAT TRONG NHÓM **${muteMin} PHÚT**!\n\n💡 *Muốn nói tục hoặc tâm sự tự do, vui lòng chuyển sang mục Bạn bè để chat riêng 1-1.*`,
          timestamp: timeStr,
        };
        setGroupMessages((prev) => ({
          ...prev,
          [activeGroupId]: [...(prev[activeGroupId] || []), muteNotice],
        }));
        setToastMessage(`🚫 Bạn bị cấm chat ${muteMin} phút vì nói tục trong nhóm!`);
      }
      setTimeout(() => setToastMessage(''), 4000);
      return; // BLOCKED! Do not post profane message
    }

    setInputMessage('');
    setMentionQuery(null);

    // Clean group message sent normally:
    const userMsg: GroupChatMessage = {
      id: 'msg-' + Date.now(),
      groupId: activeGroupId,
      senderId: activeUserId,
      senderName: activeUserName,
      senderAvatar: activeUserAvatar,
      senderRole: currentUser?.role === 'teacher' ? 'teacher' : currentUser?.role === 'admin' ? 'admin' : 'member',
      content: text,
      timestamp: timeStr,
      createdAt: nowMs,
      status: 'delivered',
      replyTo: replyingTo || undefined,
    };
    setReplyingTo(null);

    setGroupMessages((prev) => ({
      ...prev,
      [activeGroupId]: [...(prev[activeGroupId] || []), userMsg],
    }));

    // Sync to backend group messages
    fetch(`/api/groups/${encodeURIComponent(activeGroupId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userMsg),
    }).catch(() => {});

    if (isRealAdmin) {
      fetch('/api/admin/mentions/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: activeGroupId }),
      }).catch(() => {});
    }

    const lower = text.toLowerCase();

    // Trigger @Admin (Mạc Khánh Duy) in Community / Group when tagged:
    // If Admin Auto-Reply is ON -> automatically answer as Admin; if OFF -> notify Admin for manual self-reply!
    const isTaggingAdmin =
      !isRealAdmin &&
      (lower.includes('@admin') ||
        lower.includes('@quản trị viên') ||
        lower.includes('@mạc khánh duy') ||
        lower.includes('@mac khanh duy'));

    if (isTaggingAdmin) {
      let shouldAutoReply = adminAutoReplyEnabled;
      let customPrefix = adminAutoReplyGreeting;
      try {
        const cfgRes = await fetch('/api/admin/auto-reply');
        if (cfgRes.ok) {
          const cfgData = await cfgRes.json();
          if (cfgData?.success) {
            shouldAutoReply = Boolean(cfgData.enabled);
            customPrefix = cfgData.customGreeting || '';
            setAdminAutoReplyEnabled(shouldAutoReply);
          }
        }
      } catch {}

      if (shouldAutoReply) {
        setIsAiReplying(true);
        try {
          const resAdmin = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `Bạn là Quản trị viên hệ thống Max10 AI (đang bật chế độ Tự động trả lời). Trong ${activeGroup.isCommunity ? 'Cộng đồng' : 'Nhóm'} "${activeGroup.name}", thành viên "${activeUserName}" vừa @tag hỏi bạn: "${text}". Hãy trả lời thân thiện, chính xác và ngắn gọn bằng tiếng Việt.`,
              grade: currentGrade,
              subject: activeGroup.subject || 'Tổng hợp',
            }),
          });
          const dataAdmin = await resAdmin.json();
          const replyCore =
            dataAdmin?.reply ||
            dataAdmin?.text ||
            `Chào **${activeUserName}**! Quản trị viên Max10 đã nhận được câu hỏi của bạn trong **${activeGroup.name}** và sẵn sàng hỗ trợ nhé!`;
          const finalAdminReply = customPrefix ? `${customPrefix}\n\n${replyCore}` : replyCore;

          const adminReplyMsg: GroupChatMessage = {
            id: 'admin-auto-' + Date.now(),
            groupId: activeGroupId,
            senderId: ADMIN_ID,
            senderName: 'Quản trị viên Max10 (Tự động)',
            senderAvatar: REAL_ADMIN_AVATAR,
            senderRole: 'admin',
            isAi: false,
            content: finalAdminReply,
            createdAt: Date.now(),
            timestamp: formatAccurateTime(Date.now()),
            replyTo: { id: userMsg.id, senderName: activeUserName, content: text },
          };

          setGroupMessages((prev) => ({
            ...prev,
            [activeGroupId]: [...(prev[activeGroupId] || []), adminReplyMsg],
          }));

          fetch(`/api/groups/${encodeURIComponent(activeGroupId)}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminReplyMsg),
          }).catch(() => {});
        } catch {
        } finally {
          setIsAiReplying(false);
        }
      } else {
        setToastMessage('📩 Đã gửi @tag cho Quản trị viên Max10 — Admin sẽ tự trả lời trực tiếp!');
        setTimeout(() => setToastMessage(''), 3500);
      }
    }

    // Trigger @Max10 AI in group ONLY when explicitly tagged with @Max10 AI or @AI
    const isTaggingAi =
      lower.includes('@max10 ai') ||
      lower.includes('@max10') ||
      /(^|\s)@ai(\s|$|[.,!?])/.test(lower);

    if (isTaggingAi) {
      setIsAiReplying(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Bạn là Max10 AI - trợ lý học tập trong nhóm lớp "${activeGroup.name}". Học sinh "${activeUserName}" vừa tag bạn: "${text}". Hãy giải thích ngắn gọn, rõ ràng và dễ hiểu bằng tiếng Việt.`,
            grade: currentGrade,
            subject: activeGroup.subject || 'Toán',
          }),
        });
        const data = await res.json();
        const aiText =
          data?.reply ||
          data?.text ||
          `Chào **${activeUserName}**! Mình đã nhận được câu hỏi của bạn trong nhóm **${activeGroup.name}**. Hãy gửi thêm đề bài chi tiết để mình hướng dẫn từng bước đạt Điểm 10 nhé!`;

        const aiGroupReply: GroupChatMessage = {
          id: 'ai-group-' + Date.now(),
          groupId: activeGroupId,
          senderId: 'ai-max10-group',
          senderName: 'Max10 AI (AI trong nhóm)',
          senderAvatar: '/max10-avatar.jpg',
          senderRole: 'ai_tutor',
          isAi: true,
          content: aiText,
          createdAt: Date.now(),
          timestamp: formatAccurateTime(Date.now()),
        };

        setGroupMessages((prev) => ({
          ...prev,
          [activeGroupId]: [...(prev[activeGroupId] || []), aiGroupReply],
        }));

        fetch(`/api/groups/${encodeURIComponent(activeGroupId)}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(aiGroupReply),
        }).catch(() => {});
      } catch (err) {
        // Silent fail on network error
      } finally {
        setIsAiReplying(false);
      }
    }
  };

  // Create a new group or official Admin Community (Game / Study)
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    // MODE A: ADMIN CREATES OFFICIAL MULTI-USER COMMUNITY (NO AI MEMBERS)
    if (isRealAdmin && newGroupMode === 'community') {
      const catLabel = newCommunityCategory === 'game' ? 'Trò chơi' : 'Học tập';
      const defaultEmoji = newCommunityCategory === 'game' ? '🎮' : '📚';
      const isGameComm = newCommunityCategory === 'game';
      const communityPayload: ChatGroup = {
        id: 'community-' + Date.now(),
        name: newGroupName.trim(),
        description:
          newGroupDesc.trim() ||
          (isGameComm
            ? `Cộng đồng game ${newCommunityGameTitle.trim() || newGroupName.trim()} (${newCommunityPlatform}) do Quản trị viên Max10 lập — Mở cho tất cả game thủ người thật (không có AI giả).`
            : `Cộng đồng ${catLabel} do Quản trị viên Max10 lập — Mở cho tất cả thành viên người thật (không có AI giả).`),
        grade: newGroupGrade,
        subject: isGameComm ? `Trò chơi · ${newCommunityPlatform}` : catLabel,
        createdAt: Date.now(),
        avatarIcon: newGroupIcon && newGroupIcon !== '🏫' ? newGroupIcon : defaultEmoji,
        createdBy: ADMIN_ID,
        createdByAdmin: true,
        isCommunity: true,
        communityCategory: newCommunityCategory,
        ...(isGameComm
          ? {
              gamePlatform: newCommunityPlatform,
              gameTitle: newCommunityGameTitle.trim() || newGroupName.trim(),
              gameGenre: newCommunityGenre.trim() || 'Cộng đồng Game thủ',
              isPinnedTrending: newCommunityPinTrending,
              ...(newCommunityPinTrending
                ? {
                    pinnedTrendingAt: Date.now(),
                    trendingBadge: newCommunityTrendingBadge || 'Thịnh hành',
                  }
                : {}),
            }
          : {}),
        approvalStatus: 'approved',
        approvedAt: Date.now(),
        approvedBy: ADMIN_ID,
        isPublic: true,
        code: 'CD-' + Math.floor(1000 + Math.random() * 9000),
        onlyAdminCanAdd: false,
        pinnedNotice: isGameComm
          ? `🎮 Cộng đồng ${newCommunityGameTitle.trim() || newGroupName.trim()} (${newCommunityPlatform}) do Quản trị viên Max10 lập — Rủ bạn chơi chung & gõ @Admin khi cần hỗ trợ!`
          : `🌐 Cộng đồng ${catLabel} do Quản trị viên Max10 lập — Gõ @Admin khi cần hỗ trợ hoặc cùng thành viên người thật trao đổi!`,
        members: [
          {
            id: ADMIN_ID,
            name: 'Quản trị viên Max10',
            avatar: REAL_ADMIN_AVATAR,
            role: 'admin',
            school: 'Ban Quản Trị Max10 AI',
          },
        ],
        mutedUsers: {},
      };

      const welcomeNotice: GroupChatMessage = {
        id: 'comm-init-' + Date.now(),
        groupId: communityPayload.id,
        senderId: ADMIN_ID,
        senderName: 'Quản trị viên Max10',
        senderAvatar: REAL_ADMIN_AVATAR,
        senderRole: 'admin',
        content:
          `🌐 **CHÀO MỪNG ĐẾN VỚI CỘNG ĐỒNG ${catLabel.toUpperCase()}: ${communityPayload.name.toUpperCase()}**\n\n` +
          (isGameComm ? `🕹️ **Nền tảng:** ${newCommunityPlatform}\n` : '') +
          `👑 **Quản trị viên sáng lập:** Ban Quản Trị Max10\n` +
          `👥 **Thành viên:** Cộng đồng dành cho nhiều tài khoản người thật tham gia tự do (**không có AI giả**).\n` +
          `💬 **Hỏi đáp Admin:** Gõ **@Admin** bất cứ lúc nào để đặt câu hỏi trực tiếp!`,
        createdAt: Date.now(),
        timestamp: formatAccurateTime(Date.now()),
        isSystemNotice: true,
      };

      setGroups((prev) => [communityPayload, ...prev]);
      setGroupMessages((prev) => ({
        ...prev,
        [communityPayload.id]: [welcomeNotice],
      }));

      try {
        await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(communityPayload),
        });
        await fetch(`/api/groups/${encodeURIComponent(communityPayload.id)}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(welcomeNotice),
        });
      } catch {}

      setActiveGroupId(communityPayload.id);
      setActiveMode('group');
      setSidebarTab('groups');
      setShowCommunitiesView(false);
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewCommunityGameTitle('');
      setNewCommunityGenre('Cộng đồng Game thủ');
      setNewCommunityPinTrending(false);
      setToastMessage(`🌐 Đã lập Cộng đồng ${catLabel} "${communityPayload.name}" cho nhiều thành viên người thật!`);
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    if (isVerifiedTeacherOrAdmin && newGroupMode === 'class_homeroom') {
      const { groupId, seatingPlan } = createOrUpdateCustomClassGroup({
        classCode: newClassCode,
        customClassName: newGroupName.trim(),
        studentCapacity: newClassStudentCount,
        rows: newSeatingRows,
        cols: newSeatingCols,
        seatsPerDesk: newSeatsPerDesk,
        teacher: {
          id: activeUserId,
          name: activeUserName,
          avatar: activeUserAvatar,
          email: currentUser?.email,
          phone: currentUser?.phone,
          schoolName: currentUser?.schoolName || 'THCS Max10',
          teachingSubject: newGroupSubject || currentUser?.teachingSubject || 'Chủ nhiệm lớp',
        },
      });
      deletedGroupIdsRef.current.delete(groupId);

      // Reload updated groups list from localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY_GROUPS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setGroups(parsed.filter((g: ChatGroup) => !isLegacyAutoCreatedClassGroup(g)));
          }
        }
      } catch (err) {}

      const initialNotice: GroupChatMessage = {
        id: 'rule-' + Date.now(),
        groupId,
        senderId: 'system',
        senderName: 'Hệ thống Quản trị Lớp học Max10',
        senderRole: 'system',
        content:
          `🏫 **CHÀO MỪNG ĐẾN VỚI LỚP: ${seatingPlan.customClassName.toUpperCase()} (${seatingPlan.classCode})**\n\n` +
          `👩‍🏫 **Giáo viên chủ nhiệm:** ${seatingPlan.homeroomTeacherName}\n` +
          `👥 **Sĩ số lớp quy định:** ${seatingPlan.studentCapacity} học sinh\n` +
          `🪑 **Sơ đồ chỗ ngồi:** ${seatingPlan.cols} dãy × ${seatingPlan.rows} bàn (${seatingPlan.seatsPerDesk} chỗ/bàn · Tổng ${seatingPlan.cols * seatingPlan.rows * seatingPlan.seatsPerDesk} ghế)\n\n` +
          `Thầy/Cô có thể mở mục **Quản lý lớp → Sơ đồ chỗ ngồi** để xếp vị trí từng học sinh và quản lý lớp học.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isSystemNotice: true,
      };

      setGroupMessages((prev) => ({
        ...prev,
        [groupId]: [initialNotice, ...(prev[groupId] || [])],
      }));

      setActiveGroupId(groupId);
      setActiveMode('group');
      setSidebarTab('groups');
      setShowCommunitiesView(false);
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setToastMessage(
        `Đã lập nhóm lớp "${seatingPlan.customClassName}" (${seatingPlan.classCode} · ${seatingPlan.studentCapacity} HS) & tạo sơ đồ chỗ ngồi thành công!`
      );
      setTimeout(() => setToastMessage(''), 4500);
      return;
    }

    const groupCode = 'ZL-' + Math.floor(1000 + Math.random() * 9000);
    const newGroup: ChatGroup = {
      id: 'group-' + Date.now(),
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || 'Nhóm học tập và cùng nhau tiến bộ',
      grade: newGroupGrade,
      subject: newGroupSubject,
      createdAt: Date.now(),
      avatarIcon: newGroupIcon || '📚',
      createdBy: activeUserId,
      code: groupCode,
      onlyAdminCanAdd: newGroupOnlyAdminCanAdd,
      // REQUIREMENT: "nhóm khi tạo chỉ bạn" -> Initially ONLY YOU (the creator) in the group!
      members: [
        {
          id: activeUserId,
          name: activeUserName + ' (Bạn - Trưởng nhóm)',
          avatar: activeUserAvatar,
          role: 'admin',
          school: currentUser?.schoolName || 'THCS Max10',
        },
      ],
      mutedUsers: {},
    };

    // Add initial welcome & rules notice
    const initialNotice: GroupChatMessage = {
      id: 'rule-' + Date.now(),
      groupId: newGroup.id,
      senderId: 'system',
      senderName: 'Hệ thống Quản trị Nhóm Max10',
      senderRole: 'system',
      content:
        `📜 **CHÀO MỪNG ĐẾN VỚI NHÓM: ${newGroup.name.toUpperCase()}**\n\n` +
        `👑 **Trưởng nhóm:** ${activeUserName}\n` +
        `🔑 **Mã nhóm:** \`${newGroup.code}\`\n` +
        `🔒 **Quyền thêm người:** ${newGroup.onlyAdminCanAdd ? 'Chỉ Trưởng nhóm (Bạn) mới có thể thêm người vào nhóm' : 'Tất cả thành viên'}\n\n` +
        `1. **Thành viên ban đầu:** Hiện tại nhóm có bạn. Bạn có toàn quyền thêm bạn bè vào nhóm bất kỳ lúc nào.\n` +
        `2. **Xưng hô:** Xưng hô "mày - tao" hoàn toàn tự do giữa bạn bè thân thiết.\n` +
        `3. **Nội quy:** Nghiêm cấm nói tục trong nhóm (nhắc nhở lần 1, tái phạm cấm chat).\n` +
        `4. **Mời bạn bè:** Bấm nút **"+ Thêm bạn bè"** để mời các bạn học cùng vào trao đổi bài!`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isSystemNotice: true,
    };

    setGroups((prev) => [newGroup, ...prev]);
    setGroupMessages((prev) => ({
      ...prev,
      [newGroup.id]: [initialNotice],
    }));

    // Sync to server
    fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGroup),
    }).catch(() => {});

    setActiveGroupId(newGroup.id);
    setActiveMode('group');
    setSidebarTab('groups');
    setShowCommunitiesView(false);
    setShowCreateGroupModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setToastMessage(`Đã tạo nhóm "${newGroup.name}" thành công! Chỉ bạn mới có quyền thêm người vào nhóm.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Handler for adding member to group (Real humans only - no fake AI greetings!)
  const handleAddMemberToGroup = async (userToAdd: { id: string; name: string; avatar?: string; school?: string }) => {
    if (!activeGroup) return;
    if (isAiEntity(userToAdd)) {
      setToastMessage('Không thêm tài khoản AI vào danh sách thành viên!');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    const isCreator = activeGroup.createdBy === activeUserId || activeGroup.members.some((m) => m.id === activeUserId && m.role === 'admin');
    if (!activeGroup.isCommunity && activeGroup.onlyAdminCanAdd && !isCreator) {
      setToastMessage('Chỉ trưởng nhóm (bạn) mới có quyền thêm người vào nhóm này!');
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }

    if (activeGroup.members.some((m) => m.id === userToAdd.id)) {
      setToastMessage(`${userToAdd.name} đã ở trong nhóm rồi!`);
      setTimeout(() => setToastMessage(''), 2500);
      return;
    }

    const newMember: GroupMember = {
      id: userToAdd.id,
      name: userToAdd.name,
      avatar: userToAdd.avatar || '',
      role: 'member',
      school: userToAdd.school || 'THCS Nguyễn Du',
    };

    setGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroupId
          ? {
              ...g,
              members: [...g.members, newMember],
            }
          : g
      )
    );

    const addNotice: GroupChatMessage = {
      id: 'sys-add-' + Date.now(),
      groupId: activeGroupId,
      senderId: 'system',
      senderName: 'Hệ thống Quản trị Nhóm',
      senderRole: 'system',
      isSystemNotice: true,
      content: `👑 Trưởng nhóm **${activeUserName}** đã thêm **${userToAdd.name}** vào nhóm trò chuyện! Hãy cùng chào đón bạn ấy nào 🎉`,
      createdAt: Date.now(),
      timestamp: formatAccurateTime(Date.now()),
    };

    setGroupMessages((prev) => ({
      ...prev,
      [activeGroupId]: [...(prev[activeGroupId] || []), addNotice],
    }));

    // Sync to server
    fetch(`/api/groups/${activeGroupId}/add-member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterId: activeUserId,
        member: newMember,
      }),
    }).catch(() => {});

    setToastMessage(`Đã thêm ${userToAdd.name} vào nhóm thành công!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Handler for joining a group or official Admin Community
  const handleJoinGroup = async (targetGroup: ChatGroup) => {
    if (targetGroup.isCommunity && !currentUser) {
      setToastMessage('Vui lòng đăng nhập tài khoản để tham gia Cộng đồng!');
      setTimeout(() => setToastMessage(''), 3000);
      onOpenAuthModal?.();
      return;
    }

    const isAlreadyMember = (targetGroup.members || []).some((m) => m.id === activeUserId);
    if (isAlreadyMember) {
      setShowCommunitiesView(false);
      setActiveGroupId(targetGroup.id);
      setActiveMode('group');
      setSidebarTab('groups');
      setShowSearchGroupsModal(false);
      await syncGroupMessages(targetGroup.id);
      return;
    }

    const newMember: GroupMember = {
      id: activeUserId,
      name: activeUserName,
      avatar: activeUserAvatar || '',
      role: isRealAdmin ? 'admin' : 'member',
      school: currentUser?.schoolName || 'Thành viên Max10',
    };

    setGroups((prev) => {
      const exists = prev.some((g) => g.id === targetGroup.id);
      if (exists) {
        return prev.map((g) =>
          g.id === targetGroup.id
            ? { ...g, members: [...(g.members || []).filter((m) => !isAiEntity(m)), newMember] }
            : g
        );
      } else {
        return [{ ...targetGroup, members: [...(targetGroup.members || []).filter((m) => !isAiEntity(m)), newMember] }, ...prev];
      }
    });

    try {
      await fetch(`/api/groups/${encodeURIComponent(targetGroup.id)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          userName: activeUserName,
          userAvatar: activeUserAvatar,
          school: currentUser?.schoolName || 'Thành viên Max10',
        }),
      });
    } catch {}

    setShowCommunitiesView(false);
    setActiveGroupId(targetGroup.id);
    setActiveMode('group');
    setSidebarTab('groups');
    setShowSearchGroupsModal(false);
    await syncGroupMessages(targetGroup.id);
    await syncServerGroups();
    setToastMessage(`Bạn đã tham gia ${targetGroup.isCommunity ? 'Cộng đồng' : 'nhóm'} "${targetGroup.name}" thành công!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Reaction toggle helper
  const handleToggleReaction = (msgId: string, emoji: string) => {
    if (activeMode === 'direct') {
      if (!activeFriendId) return;
      setDirectMessages((prev) => {
        const list = prev[activeFriendId] || [];
        return {
          ...prev,
          [activeFriendId]: list.map((m) =>
            m.id === msgId ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m
          ),
        };
      });
    } else {
      if (!activeGroupId) return;
      setGroupMessages((prev) => {
        const list = prev[activeGroupId] || [];
        return {
          ...prev,
          [activeGroupId]: list.map((m) =>
            m.id === msgId ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m
          ),
        };
      });
    }
  };

  // Quick Like sender
  const handleSendQuickLike = () => {
    const nowMs = Date.now();
    const timeStr = formatAccurateTime(nowMs);
    if (activeMode === 'direct') {
      if (!activeFriend || isFriendBlocked) return;
      const dmMsg: DirectChatMessage = {
        id: 'dm-' + nowMs,
        senderId: activeUserId,
        senderName: activeUserName,
        senderAvatar: activeUserAvatar,
        recipientId: activeFriend.id,
        content: '👍',
        timestamp: timeStr,
        createdAt: nowMs,
        status: 'delivered',
        replyTo: replyingTo || undefined,
      };
      setDirectMessages((prev) => ({
        ...prev,
        [activeFriend.id]: [...(prev[activeFriend.id] || []), dmMsg],
      }));
      setReplyingTo(null);
    } else {
      if (!activeGroup || isCurrentlyMuted) return;
      const userMsg: GroupChatMessage = {
        id: 'msg-' + nowMs,
        groupId: activeGroupId,
        senderId: activeUserId,
        senderName: activeUserName,
        senderAvatar: activeUserAvatar,
        senderRole: 'member',
        content: '👍',
        timestamp: timeStr,
        createdAt: nowMs,
        status: 'delivered',
        replyTo: replyingTo || undefined,
      };
      setGroupMessages((prev) => ({
        ...prev,
        [activeGroupId]: [...(prev[activeGroupId] || []), userMsg],
      }));
      setReplyingTo(null);
    }
  };

  // Unified conversation list combining friends & groups
  const unifiedConversations = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'direct' | 'group';
      name: string;
      avatar?: string;
      icon?: string;
      presenceStatus?: UserPresenceStatus;
      lastMessage: string;
      lastTimestamp: string;
      unreadCount: number;
      data: any;
    }> = [];

    // Add friends
    friends.forEach((f) => {
      const msgs = directMessages[f.id] || [];
      const lastMsg = msgs[msgs.length - 1];
      let snippet = f.school || 'Bạn bè';
      let time = f.addedAt || 'Mới';
      if (lastMsg) {
        snippet = lastMsg.content;
        time = formatAccurateTime(lastMsg.createdAt, lastMsg.timestamp);
      }
      list.push({
        id: f.id,
        type: 'direct',
        name: f.name,
        avatar: f.avatar,
        presenceStatus: f.presenceStatus || 'online',
        lastMessage: snippet,
        lastTimestamp: time,
        unreadCount: 0,
        data: f,
      });
    });

    // Add official Admin conversations:
    // - If logged in as Real Admin: show Official Broadcast/Update Channel + every real student/teacher thread in Admin Inbox
    // - If logged in as Student/Teacher: show Real Admin (Mạc Khánh Duy) contact backed by server
    // Add official Admin Updates & Messages channel ('all_broadcast') for both Admin and Users
    const bcMsgs = directMessages['all_broadcast'] || adminBroadcastMessages;
    const lastBc = bcMsgs[bcMsgs.length - 1];
    list.unshift({
      id: 'all_broadcast',
      type: 'direct',
      name: '📢 Thông Báo & Cập Nhật Từ Admin',
      avatar: REAL_ADMIN_AVATAR,
      presenceStatus: 'online',
      lastMessage: lastBc ? lastBc.content : 'Nhắn tin & trả lời cập nhật mới từ Admin',
      lastTimestamp: lastBc ? formatAccurateTime(lastBc.createdAt, lastBc.timestamp) : 'Sẵn sàng',
      unreadCount: 0,
      data: { id: 'all_broadcast', role: 'admin' },
    });

    if (isRealAdmin) {
      adminInboxThreads.forEach((t) => {
        if (list.some((x) => x.id === t.partnerId && x.type === 'direct')) return;
        // Hide other users' incoming threads once Admin has replied until a newer incoming message arrives
        const repliedAt = repliedAdminThreads[t.partnerId] || 0;
        const lastIncomingMsg = [...(t.messages || [])]
          .reverse()
          .find((m: any) => m.senderId !== activeUserId && m.senderId !== ADMIN_ID);
        const lastIncomingTime = lastIncomingMsg?.createdAt || t.lastCreatedAt || 0;
        if (repliedAt > 0 && lastIncomingTime <= repliedAt) {
          return;
        }
        list.push({
          id: t.partnerId,
          type: 'direct',
          name: t.partnerName,
          avatar: t.partnerAvatar,
          presenceStatus: t.presenceStatus || 'online',
          lastMessage: t.lastMessage,
          lastTimestamp: formatAccurateTime(t.lastCreatedAt, t.lastTimestamp),
          unreadCount: 0,
          data: { id: t.partnerId, role: t.partnerRole || 'student' },
        });
      });
    } else if (Boolean(currentUser) && friends.every((f) => f.id !== ADMIN_ID)) {
      const msgs = directMessages[ADMIN_ID] || [];
      const lastMsg = msgs[msgs.length - 1];
      list.push({
        id: ADMIN_ID,
        type: 'direct',
        name: 'Ban Quản Trị Max10',
        avatar: REAL_ADMIN_AVATAR,
        presenceStatus: 'online',
        lastMessage: lastMsg ? lastMsg.content : '📩 Nhắn tin hỗ trợ trực tiếp với Ban Quản Trị Max10',
        lastTimestamp: lastMsg ? formatAccurateTime(lastMsg.createdAt, lastMsg.timestamp) : 'Trực tuyến',
        unreadCount: 0,
        data: {
          id: ADMIN_ID,
          name: 'Ban Quản Trị Max10',
          avatar: REAL_ADMIN_AVATAR,
          school: 'Ban Quản Trị Hệ Thống Max10 AI',
          status: 'friend',
          presenceStatus: 'online',
          role: 'admin',
        },
      });
    }

    // Add groups (including class groups with unlimited members)
    groups.forEach((g) => {
      const msgs = groupMessages[g.id] || [];
      const lastMsg = msgs[msgs.length - 1];
      let snippet = g.description || 'Nhóm học tập';
      let time = 'Hôm nay';
      if (lastMsg) {
        snippet = (lastMsg.senderId === activeUserId ? 'Bạn: ' : `${lastMsg.senderName}: `) + lastMsg.content;
        time = formatAccurateTime(lastMsg.createdAt, lastMsg.timestamp);
      }
      list.push({
        id: g.id,
        type: 'group',
        name: g.name,
        icon: g.avatarIcon || '📚',
        lastMessage: snippet,
        lastTimestamp: time,
        unreadCount: 0,
        data: g,
      });
    });

    // Keep official broadcast first for Admin, sort remaining by activity
    list.sort((a, b) => {
      if (a.id === 'all_broadcast') return -1;
      if (b.id === 'all_broadcast') return 1;
      return (b.lastTimestamp || '').localeCompare(a.lastTimestamp || '');
    });

    // Filter by search query
    let filtered = list;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (item) => item.name.toLowerCase().includes(q) || item.lastMessage.toLowerCase().includes(q)
      );
    }

    // Filter by category or tab
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item) => {
        const cat = getSenderCategory(
          { name: item.name, role: item.data?.role || (item.type === 'group' ? 'admin' : undefined) },
          { isDirectFriend: item.type === 'direct' }
        );
        return cat === categoryFilter;
      });
    } else if (filterTab === 'friends') {
      filtered = filtered.filter((item) => item.type === 'direct');
    } else if (filterTab === 'groups') {
      filtered = filtered.filter((item) => item.type === 'group');
    } else if (filterTab === 'unread') {
      filtered = filtered.filter((item) => item.unreadCount > 0);
    }

    return filtered;
  }, [friends, groups, directMessages, groupMessages, searchQuery, filterTab, categoryFilter, activeUserId, isRealAdmin, adminInboxThreads, adminBroadcastMessages, repliedAdminThreads]);

  // Handler to select conversation
  const handleSelectConversation = (item: { id: string; type: 'direct' | 'group' }) => {
    setShowCommunitiesView(false);
    setMobileShowChat(true);
    if (item.type === 'direct') {
      setActiveMode('direct');
      setActiveFriendId(item.id);
    } else {
      setActiveMode('group');
      setActiveGroupId(item.id);
      setDiscordChannel('general');
    }
  };

  // Active chat details
  const activeConversationTitle = activeMode === 'direct' ? (activeFriend?.name || 'Trò chuyện bạn bè') : (activeGroup?.name || 'Nhóm học tập');
  const activeConversationBadge = activeMode === 'direct'
    ? 'BẠN BÈ'
    : activeGroup?.isCommunity
    ? `CỘNG ĐỒNG (${(activeGroup?.members || []).filter((m) => !isAiEntity(m)).length} NGƯỜI THẬT)`
    : `NHÓM (${(activeGroup?.members || []).filter((m) => !isAiEntity(m)).length} THÀNH VIÊN)`;
  const activeConversationStatus = activeMode === 'direct'
    ? (activeFriend?.presenceStatus === 'dnd'
        ? '🔴 Không làm phiền'
        : activeFriend?.presenceStatus === 'gaming'
        ? '🟡 Đang chơi trò chơi'
        : activeFriend?.presenceStatus === 'offline'
        ? '⚪ Đang offline'
        : '🟢 Đang trực tuyến')
    : activeGroup?.isCommunity
    ? `🌐 Cộng đồng ${activeGroup.communityCategory === 'game' ? 'Trò chơi' : 'Học tập'} · ${(activeGroup?.members || []).filter((m) => !isAiEntity(m)).length} người thật (Không AI)`
    : `👥 ${(activeGroup?.members || []).filter((m) => !isAiEntity(m)).length} thành viên · ${activeGroup?.subject || 'Học tập'}`;

  // Filtered messages in active conversation for in-chat search & hiding replied messages from other users in Admin channel
  const displayedDirectMsgs = useMemo(() => {
    let base = currentDirectMsgs;
    if (activeFriendId === 'all_broadcast' && hiddenOtherBroadcastAt > 0) {
      base = base.filter((m) => {
        const isOwnOrOfficial =
          m.senderId === activeUserId || m.senderId === ADMIN_ID || Boolean((m as any).isAdminUpdate);
        if (isOwnOrOfficial) return true;
        return (m.createdAt || 0) > hiddenOtherBroadcastAt;
      });
    }
    if (!chatSearchText.trim()) return base;
    const q = chatSearchText.toLowerCase();
    return base.filter((m) => m.content.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q));
  }, [currentDirectMsgs, chatSearchText, activeFriendId, hiddenOtherBroadcastAt, activeUserId]);

  const displayedGroupMsgs = useMemo(() => {
    // Hiển thị thành viên người thật + Max10 AI (khi được tag @Max10 AI trong nhóm), loại bỏ bot giả cũ
    const cleanMsgs = messages.filter(
      (m) =>
        m.senderId !== 'user-quynh' &&
        !(m.senderId || '').startsWith('teacher-') &&
        !(m.senderId || '').startsWith('std-')
    );
    if (!chatSearchText.trim()) return cleanMsgs;
    const q = chatSearchText.toLowerCase();
    return cleanMsgs.filter(
      (m) => m.content.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q)
    );
  }, [messages, chatSearchText]);

  // Compute live @mention candidates across ALL chats (ALWAYS includes Admin + Max10 AI + real human members)
  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase().trim();
    const list: Array<{ id: string; name: string; roleLabel: string; avatar?: string; isAi?: boolean; isAdmin?: boolean }> = [
      {
        id: ADMIN_ID,
        name: `${ADMIN_NAME} (Admin)`,
        roleLabel: adminAutoReplyEnabled
          ? 'Quản trị viên · Đang bật Tự động trả lời'
          : 'Quản trị viên · Trả lời trực tiếp',
        avatar: REAL_ADMIN_AVATAR,
        isAi: false,
        isAdmin: true,
      },
      {
        id: 'ai-max10-group',
        name: 'Max10 AI',
        roleLabel: 'Gia sư AI · Hỗ trợ giải bài khi được @tag',
        avatar: '/max10-avatar.jpg',
        isAi: true,
      },
    ];

    if (activeMode === 'group' && activeGroup) {
      (activeGroup.members || [])
        .filter((m) => !isAiEntity(m) && m.id !== ADMIN_ID)
        .forEach((m) => {
          list.push({
            id: m.id,
            name: m.name,
            roleLabel:
              m.role === 'teacher'
                ? 'Giáo viên trong lớp'
                : m.role === 'admin'
                ? 'Trưởng nhóm'
                : 'Thành viên người thật',
            avatar: m.avatar,
            isAi: false,
          });
        });
    } else if (activeMode === 'direct' && activeFriend && activeFriend.id !== 'all_broadcast' && activeFriend.id !== ADMIN_ID) {
      list.push({
        id: activeFriend.id,
        name: activeFriend.name,
        roleLabel: 'Bạn bè 1-1',
        avatar: activeFriend.avatar,
        isAi: false,
      });
    }

    if (!q) return list;
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.isAdmin && ('admin'.includes(q) || 'mac khanh duy'.includes(q))) ||
        (item.isAi && 'ai'.includes(q))
    );
  }, [activeMode, activeGroup, activeFriend, mentionQuery, adminAutoReplyEnabled]);

  const handleInsertMention = (candidateName: string) => {
    const replaced = inputMessage.replace(/(^|\s)@([^\s@]*)$/, `$1@${candidateName} `);
    setInputMessage(replaced);
    setMentionQuery(null);
    setMentionActiveIdx(0);
  };

  const handleAdminQuickBroadcast = async (publishUpdate: boolean) => {
    const content = adminQuickBroadcastText.trim();
    if (!content || !isRealAdmin || isSendingBroadcast) return;
    setIsSendingBroadcast(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          publishUpdate,
          senderId: ADMIN_ID,
          senderName: `${ADMIN_NAME} (Quản trị viên)`,
          senderAvatar: REAL_ADMIN_AVATAR,
        }),
      });
      const data = await res.json();
      if (data?.success && data.message) {
        setAdminBroadcastMessages((prev) => [...prev, data.message]);
        setDirectMessages((prev) => ({
          ...prev,
          all_broadcast: [...(prev['all_broadcast'] || []), data.message],
        }));
        setAdminQuickBroadcastText('');
        setActiveMode('direct');
        setActiveFriendId('all_broadcast');
        setToastMessage(
          publishUpdate
            ? '🚀 Đã gửi tin nhắn & phát hành thông báo cập nhật từ Admin Thật!'
            : '📢 Đã gửi tin nhắn Admin tới toàn hệ thống!'
        );
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (e) {
      setToastMessage('Lỗi gửi thông báo Admin.');
      setTimeout(() => setToastMessage(''), 2500);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleOpenSafeMemberProfile = (
    raw: {
      id: string;
      name: string;
      avatar?: string;
      role?: string;
      senderRole?: string;
      school?: string;
      schoolName?: string;
      grade?: string;
      studentClass?: string;
      bio?: string;
      presenceStatus?: UserPresenceStatus;
    },
    contextLabel?: string
  ) => {
    if (!raw || !raw.id || isAiEntity(raw) || raw.id === 'all_broadcast') return;
    const safeProfile = buildSafePublicProfile({
      ...raw,
      isFriend: isFriend(raw.id),
    });
    setProfileTargetMember(safeProfile);
    setProfileContextLabel(
      contextLabel ||
        (activeMode === 'direct'
          ? 'Bạn bè 1-1'
          : activeGroup?.isCommunity
          ? `Cộng đồng: ${activeGroup.name}`
          : `Nhóm: ${activeGroup?.name || 'Học tập'}`)
    );
  };

  const handleStartDuelWithMember = (
    target?: PublicMemberProfile | null,
    existingChallenge?: DuelChallenge | null
  ) => {
    const cType: 'community' | 'group' | 'direct' =
      existingChallenge?.contextType ||
      (activeMode === 'direct'
        ? 'direct'
        : activeGroup?.isCommunity
        ? 'community'
        : 'group');
    const peerId = target?.id || (activeMode === 'direct' ? activeFriend?.id : undefined);
    const cId =
      existingChallenge?.contextId ||
      (cType === 'direct' && peerId
        ? [activeUserId, peerId].sort().join('__')
        : activeGroup?.id || 'community-study-max10');
    const cName =
      existingChallenge?.contextName ||
      (cType === 'direct'
        ? `Đấu với ${target?.name || activeFriend?.name || 'Bạn học'}`
        : activeGroup?.name || 'Cộng đồng Max10');

    setDuelModalState({
      isOpen: true,
      contextType: cType,
      contextId: cId,
      contextName: cName,
      targetMember: target || null,
      existingChallenge: existingChallenge || null,
    });
  };

  const handleDuelChallengeUpdated = async (
    challenge: DuelChallenge,
    mode: 'created' | 'completed'
  ) => {
    setChallengesMap((prev) => ({ ...prev, [challenge.id]: challenge }));
    saveLocalChallenge(challenge);

    const nowMs = Date.now();
    const timeStr = formatAccurateTime(nowMs);

    if (challenge.contextType === 'direct') {
      const targetId =
        mode === 'created'
          ? duelModalState?.targetMember?.id || challenge.opponentId || activeFriend?.id
          : challenge.challengerId === activeUserId
          ? challenge.opponentId
          : challenge.challengerId;

      if (targetId && targetId !== 'all_broadcast') {
        const msgId = `dm-duel-${mode}-${nowMs}`;
        const cSec = Math.round((challenge.challengerTimeMs || 0) / 1000);
        const text =
          mode === 'created'
            ? `⚔️ **THÁCH ĐẤU KIẾN THỨC (${challenge.subject} · ${challenge.grade})**\n**${challenge.challengerName}** đã hoàn thành phần thi với **${challenge.challengerScore}/${challenge.questions.length} điểm** (${cSec}s). Bấm **"Nhận kèo & Thi đấu"** để so tài!`
            : `🏆 **KẾT QUẢ THI ĐẤU (${challenge.subject} · ${challenge.grade})**\n**${challenge.challengerName}** (${challenge.challengerScore}) vs **${challenge.opponentName || activeUserName}** (${challenge.opponentScore ?? 0}). ${
                challenge.winnerId === 'draw'
                  ? 'Kết quả: HÒA NHAU!'
                  : `Người chiến thắng: **${challenge.winnerName}**!`
              }`;

        const dmMsg: DirectChatMessage = {
          id: msgId,
          senderId: activeUserId,
          senderName: activeUserName,
          senderAvatar: activeUserAvatar,
          recipientId: targetId,
          content: text,
          timestamp: timeStr,
          createdAt: nowMs,
          status: 'delivered',
          challengeId: challenge.id,
        };
        setDirectMessages((prev) => ({
          ...prev,
          [targetId]: [...(prev[targetId] || []), dmMsg],
        }));
        fetch('/api/friends/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dmMsg),
        }).catch(() => {});
      }
    } else if (challenge.contextId) {
      const msgId = `grp-duel-${mode}-${nowMs}`;
      const cSec = Math.round((challenge.challengerTimeMs || 0) / 1000);
      const text =
        mode === 'created'
          ? `⚔️ **MỞ KÈO THI ĐẤU TRONG ${challenge.contextType === 'community' ? 'CỘNG ĐỒNG' : 'NHÓM'} (${challenge.subject} · ${challenge.grade})**\n**${challenge.challengerName}** đạt **${challenge.challengerScore}/${challenge.questions.length} điểm** (${cSec}s)${
              challenge.opponentName ? ` — Thách đấu **${challenge.opponentName}**!` : ' — Ai tự tin nhận kèo ngay!'
            }`
          : `🏆 **KẾT QUẢ ĐẤU TRƯỜNG (${challenge.subject})**\n**${challenge.challengerName}** (${challenge.challengerScore}) vs **${challenge.opponentName || activeUserName}** (${challenge.opponentScore ?? 0}) → ${
              challenge.winnerId === 'draw' ? '🤝 Hòa!' : `🥇 Thắng cuộc: **${challenge.winnerName}**!`
            }`;

      const grpMsg: GroupChatMessage = {
        id: msgId,
        groupId: challenge.contextId,
        senderId: activeUserId,
        senderName: activeUserName,
        senderAvatar: activeUserAvatar,
        senderRole:
          currentUser?.role === 'teacher'
            ? 'teacher'
            : currentUser?.role === 'admin'
            ? 'admin'
            : 'member',
        content: text,
        timestamp: timeStr,
        createdAt: nowMs,
        status: 'delivered',
        challengeId: challenge.id,
      };
      setGroupMessages((prev) => ({
        ...prev,
        [challenge.contextId]: [...(prev[challenge.contextId] || []), grpMsg],
      }));
      fetch(`/api/groups/${encodeURIComponent(challenge.contextId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grpMsg),
      }).catch(() => {});
    }
  };

  const renderChallengeCard = (challengeId?: string, _isMeBubble = false) => {
    if (!challengeId) return null;
    const ch = challengesMap[challengeId];
    if (!ch) return null;
    const totalQ = Math.max(1, ch.questions?.length || 5);
    const canAccept =
      ch.status !== 'completed' &&
      ch.challengerId !== activeUserId &&
      (!ch.opponentId || ch.opponentId === activeUserId);
    const cSec = Math.round((ch.challengerTimeMs || 0) / 1000);
    const oSec = Math.round((ch.opponentTimeMs || 0) / 1000);

    return (
      <div
        className={`mt-2 max-w-md p-3.5 rounded-r-md rounded-l-[3px] border border-l-[4px] text-left space-y-2.5 shadow-2xs ${
          isDark
            ? 'bg-[#2b2d31] border-[#1f2023] border-l-[#23a559] text-[#dbdee1]'
            : 'bg-[#f2f3f5] border-slate-200 border-l-[#23a559] text-[#2e3338]'
        }`}
      >
        <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-[#23a559] dark:text-[#2dc770]">
            <Swords className="w-3.5 h-3.5 shrink-0" />
            <span>
              Đấu Trường · {ch.subject} · {ch.grade}
            </span>
          </span>
          <span
            className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
              ch.status === 'completed'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                : 'bg-[#5865f2]/20 text-[#5865f2] dark:text-[#949cf7]'
            }`}
          >
            {ch.status === 'completed' ? 'Đã phân thắng bại' : 'Đang chờ nhận kèo'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] tabular-nums">
          <div className={`p-2 rounded-[4px] ${isDark ? 'bg-[#1e1f22]' : 'bg-white border border-slate-200/80'}`}>
            <div className="font-bold truncate">{ch.challengerName}</div>
            <div className="font-black text-[#23a559] dark:text-[#2dc770] mt-0.5">
              {ch.challengerScore ?? 0}/{totalQ} ({cSec}s)
            </div>
          </div>
          <div className={`p-2 rounded-[4px] ${isDark ? 'bg-[#1e1f22]' : 'bg-white border border-slate-200/80'}`}>
            <div className="font-bold truncate">{ch.opponentName || 'Chờ đối thủ'}</div>
            <div className="font-black text-amber-500 mt-0.5">
              {typeof ch.opponentScore === 'number'
                ? `${ch.opponentScore}/${totalQ} (${oSec}s)`
                : 'Chưa thi đấu'}
            </div>
          </div>
        </div>

        {ch.status === 'completed' && ch.winnerName && (
          <div className="text-[11px] font-bold text-amber-500 dark:text-amber-300 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            <span>
              {ch.winnerId === 'draw' ? 'Hòa nhau (+80 XP)' : `Chiến thắng: ${ch.winnerName} (+150 XP)`}
            </span>
          </div>
        )}

        {canAccept && (
          <button
            type="button"
            onClick={() => handleStartDuelWithMember(null, ch)}
            className="w-full py-2 px-3 rounded-[4px] bg-[#248046] hover:bg-[#1a6334] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Nhận kèo &amp; Thi đấu ngay</span>
          </button>
        )}
      </div>
    );
  };

  const hasActiveChat = Boolean((activeMode === 'direct' && activeFriend) || (activeMode === 'group' && activeGroup));

  return (
    <div
      className={`select-none transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-[999999] h-screen w-screen overflow-hidden flex flex-col'
          : 'flex flex-col h-full w-full overflow-hidden'
      } ${isDark ? 'bg-[#313338] text-[#dbdee1]' : 'bg-white text-[#2e3338]'}`}
    >
      {/* Compact Workspace Action Strip when Fullscreen */}
      {isFullscreen && (
        <div
          className={`h-9 border-b flex items-center justify-between px-3.5 text-xs select-none shrink-0 ${
            isDark
              ? 'bg-[#1e1f22] border-[#111214] text-[#dbdee1]'
              : 'bg-[#e3e5e8] border-slate-300 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#5865f2]" />
            <span className="font-bold">{userName || 'Bạn học'} · Discord Học Tập Max10</span>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#da373c] hover:bg-[#a12828] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Thoát toàn màn hình (Esc)</span>
          </button>
        </div>
      )}

      {/* DISCORD 4-COLUMN WORKSPACE: 1. Server Rail | 2. Channels / DM Sidebar | 3. Chat Area | 4. Member List */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden relative">
        {/* 1. DISCORD SERVER / GUILD RAIL */}
        <div
          className={`${
            mobileShowChat || showCommunitiesView ? 'hidden md:flex' : 'flex'
          } w-[68px] flex-col items-center py-3 gap-2 shrink-0 select-none overflow-y-auto scrollbar-none border-r ${
            isDark
              ? 'bg-[#1e1f22] border-[#111214]'
              : 'bg-[#e3e5e8] border-slate-300/70'
          }`}
        >
          {/* Home / Direct Messages Blurple Button */}
          <div className="relative flex items-center justify-center w-full group">
            <span
              className={`absolute left-0 rounded-r-full transition-all duration-200 ${
                activeMode === 'direct' && !showCommunitiesView
                  ? 'h-10 w-1 bg-slate-900 dark:bg-white'
                  : 'h-0 group-hover:h-5 w-1 bg-slate-900 dark:bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setShowCommunitiesView(false);
                setActiveMode('direct');
                setActiveNav('messages');
                if (!activeFriendId) setActiveFriendId('all_broadcast');
              }}
              className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                activeMode === 'direct' && !showCommunitiesView
                  ? 'rounded-[16px] bg-[#5865f2] text-white shadow-sm'
                  : isDark
                  ? 'rounded-[24px] hover:rounded-[16px] bg-[#313338] text-[#dbdee1] hover:bg-[#5865f2] hover:text-white'
                  : 'rounded-[24px] hover:rounded-[16px] bg-white text-slate-700 hover:bg-[#5865f2] hover:text-white shadow-2xs'
              }`}
              title="Tin nhắn trực tiếp (DM) & Bạn bè"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>

          <div className={`w-8 h-[2px] rounded-full shrink-0 my-0.5 ${isDark ? 'bg-[#35363c]' : 'bg-slate-300'}`} />

          {/* Server Icons for Communities & Study Groups */}
          <div className="flex flex-col items-center gap-2 w-full">
            {groups.map((g) => {
              const isSelectedServer = activeMode === 'group' && activeGroupId === g.id && !showCommunitiesView;
              return (
                <div key={g.id} className="relative flex items-center justify-center w-full group">
                  <span
                    className={`absolute left-0 rounded-r-full transition-all duration-200 ${
                      isSelectedServer
                        ? 'h-10 w-1 bg-slate-900 dark:bg-white'
                        : 'h-0 group-hover:h-5 w-1 bg-slate-900 dark:bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowCommunitiesView(false);
                      setActiveMode('group');
                      setActiveGroupId(g.id);
                      setDiscordChannel('general');
                      setMobileShowChat(true);
                    }}
                    className={`relative w-12 h-12 flex items-center justify-center text-lg font-bold transition-all duration-200 cursor-pointer ${
                      isSelectedServer
                        ? 'rounded-[16px] bg-[#5865f2] text-white shadow-sm'
                        : isDark
                        ? 'rounded-[24px] hover:rounded-[16px] bg-[#313338] text-[#dbdee1] hover:bg-[#5865f2] hover:text-white'
                        : 'rounded-[24px] hover:rounded-[16px] bg-white text-slate-800 hover:bg-[#5865f2] hover:text-white shadow-2xs'
                    }`}
                    title={`${g.name}${g.isCommunity ? (g.communityCategory === 'game' ? ' · Cộng đồng Game' : ' · Cộng đồng') : ' · Nhóm'}`}
                  >
                    <span>{g.avatarIcon || (g.communityCategory === 'game' ? '🎮' : '📚')}</span>
                    {g.isPinnedTrending && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#23a559] border-2 border-[#e3e5e8] dark:border-[#1e1f22] flex items-center justify-center text-[8px] text-white font-black"
                        title="Thịnh hành"
                      >
                        ★
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className={`w-8 h-[2px] rounded-full shrink-0 my-0.5 ${isDark ? 'bg-[#35363c]' : 'bg-slate-300'}`} />

          {/* Discord Green '+' Add Server / Group Button */}
          <div className="relative flex items-center justify-center w-full group">
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
              className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-200 cursor-pointer ${
                isDark
                  ? 'bg-[#313338] text-[#23a559] hover:bg-[#23a559] hover:text-white'
                  : 'bg-white text-[#23a559] hover:bg-[#23a559] hover:text-white shadow-2xs'
              }`}
              title="Tạo Server / Nhóm học tập mới"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Discord Game Communities Button */}
          <div className="relative flex items-center justify-center w-full group">
            <span
              className={`absolute left-0 rounded-r-full transition-all duration-200 ${
                showCommunitiesView && communityCategoryFilter === 'game'
                  ? 'h-10 w-1 bg-slate-900 dark:bg-white'
                  : 'h-0 group-hover:h-5 w-1 bg-slate-900 dark:bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setCommunityCategoryFilter('game');
                setShowCommunitiesView(true);
                setMobileShowChat(true);
              }}
              className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                showCommunitiesView && communityCategoryFilter === 'game'
                  ? 'rounded-[16px] bg-[#23a559] text-white shadow-sm'
                  : isDark
                  ? 'rounded-[24px] hover:rounded-[16px] bg-[#313338] text-[#23a559] hover:bg-[#23a559] hover:text-white'
                  : 'rounded-[24px] hover:rounded-[16px] bg-white text-[#23a559] hover:bg-[#23a559] hover:text-white shadow-2xs'
              }`}
              title="Khám phá Cộng đồng Game (Trò chơi điện tử phổ biến & Thịnh hành)"
            >
              <Gamepad2 className="w-5 h-5" />
            </button>
          </div>

          {/* Discord Explore All Communities Compass Button */}
          <div className="relative flex items-center justify-center w-full group">
            <span
              className={`absolute left-0 rounded-r-full transition-all duration-200 ${
                showCommunitiesView && communityCategoryFilter !== 'game'
                  ? 'h-10 w-1 bg-slate-900 dark:bg-white'
                  : 'h-0 group-hover:h-5 w-1 bg-slate-900 dark:bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setCommunityCategoryFilter('all');
                setShowCommunitiesView(true);
                setMobileShowChat(true);
              }}
              className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                showCommunitiesView && communityCategoryFilter !== 'game'
                  ? 'rounded-[16px] bg-[#23a559] text-white shadow-sm'
                  : isDark
                  ? 'rounded-[24px] hover:rounded-[16px] bg-[#313338] text-[#23a559] hover:bg-[#23a559] hover:text-white'
                  : 'rounded-[24px] hover:rounded-[16px] bg-white text-[#23a559] hover:bg-[#23a559] hover:text-white shadow-2xs'
              }`}
              title="Khám phá tất cả Cộng đồng (Game & Học tập)"
            >
              <Compass className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. DISCORD CHANNEL & DM SIDEBAR */}
        <div
          className={`${
            mobileShowChat || showCommunitiesView ? 'hidden md:flex' : 'flex'
          } flex-1 md:flex-none md:w-[244px] flex-col shrink-0 border-r select-none ${
            isDark
              ? 'bg-[#2b2d31] border-[#1f2023] text-[#949ba4]'
              : 'bg-[#f2f3f5] border-slate-200 text-[#4e5058]'
          }`}
        >
          {/* Sidebar Header */}
          {activeMode === 'group' && activeGroup ? (
            <div
              className={`h-12 px-3.5 border-b flex items-center justify-between gap-2 shrink-0 transition-colors ${
                isDark
                  ? 'border-[#1f2023] hover:bg-[#35373c] text-white'
                  : 'border-slate-200/90 hover:bg-slate-200/60 text-slate-900'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                title="Xem nội quy & thông tin server"
              >
                <span className="text-base shrink-0">{activeGroup.avatarIcon || '📚'}</span>
                <span className="font-bold text-sm truncate">{activeGroup.name}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(true)}
                className={`p-1.5 rounded-[4px] transition-colors cursor-pointer shrink-0 ${
                  isDark ? 'hover:bg-[#404249] text-[#b5bac1] hover:text-white' : 'hover:bg-slate-300/70 text-slate-600'
                }`}
                title="Mời bạn bè vào server"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              className={`h-12 px-2.5 border-b flex items-center gap-1.5 shrink-0 ${
                isDark ? 'border-[#1f2023]' : 'border-slate-200/90'
              }`}
            >
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#949ba4] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm hoặc bắt đầu cuộc trò chuyện"
                  className={`w-full pl-8 pr-6 py-1.5 rounded-[4px] text-xs outline-none transition-colors ${
                    isDark
                      ? 'bg-[#1e1f22] text-[#dbdee1] placeholder-[#949ba4]'
                      : 'bg-[#e3e5e8] text-slate-900 placeholder-slate-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#949ba4] hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scrollable Channels / DMs List */}
          <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-3">
            {activeMode === 'group' && activeGroup ? (
              <>
                {/* TEXT CHANNELS CATEGORY */}
                <div>
                  <div className="flex items-center justify-between px-1 mb-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedDiscordCats((prev) => ({ ...prev, text: !prev.text }))
                      }
                      className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider hover:text-slate-900 dark:hover:text-[#dbdee1] cursor-pointer"
                    >
                      {collapsedDiscordCats.text ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      <span>Kênh văn bản</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateGroupModal(true)}
                      className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      title="Tạo nhóm / kênh mới"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!collapsedDiscordCats.text && (
                    <div className="space-y-0.5">
                      {[
                        {
                          id: 'general' as const,
                          label: 'chat-chung',
                          title: 'Kênh chat chính của nhóm / cộng đồng',
                        },
                        {
                          id: 'ai_tutor' as const,
                          label: 'hoi-max10-ai',
                          title: 'Gọi @Max10 AI giải bài trực tiếp trong server',
                        },
                        {
                          id: 'duel' as const,
                          label: 'thi-dau-kien-thuc',
                          title: 'Mở kèo Thi đấu kiến thức cùng thành viên',
                        },
                      ].map((ch) => {
                        const isActiveCh = discordChannel === ch.id;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => {
                              setDiscordChannel(ch.id);
                              setShowCommunitiesView(false);
                              setMobileShowChat(true);
                              if (ch.id === 'ai_tutor' && !inputMessage.trim()) {
                                setInputMessage('@Max10 AI ');
                              }
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-sm font-medium transition-colors cursor-pointer ${
                              isActiveCh
                                ? isDark
                                  ? 'bg-[#404249] text-white font-semibold'
                                  : 'bg-[#d4d7dc] text-slate-900 font-semibold'
                                : isDark
                                ? 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                                : 'text-[#4e5058] hover:bg-[#e3e5e8] hover:text-slate-900'
                            }`}
                            title={ch.title}
                          >
                            <Hash className="w-4 h-4 shrink-0 text-[#80848e]" />
                            <span className="truncate">{ch.label}</span>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setShowRulesModal(true)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-sm font-medium transition-colors cursor-pointer ${
                          isDark
                            ? 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                            : 'text-[#4e5058] hover:bg-[#e3e5e8] hover:text-slate-900'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0 text-[#80848e]" />
                        <span className="truncate">noi-quy-nhom</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* VOICE & VIDEO CHANNELS CATEGORY */}
                <div>
                  <div className="flex items-center justify-between px-1 mb-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedDiscordCats((prev) => ({ ...prev, voice: !prev.voice }))
                      }
                      className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider hover:text-slate-900 dark:hover:text-[#dbdee1] cursor-pointer"
                    >
                      {collapsedDiscordCats.voice ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      <span>Kênh thoại &amp; Video</span>
                    </button>
                  </div>

                  {!collapsedDiscordCats.voice && (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCallModal({
                            active: true,
                            type: 'voice',
                            roomType: 'group',
                            targetId: activeGroup.id,
                            targetName: activeGroup.name,
                            targetBadge: activeConversationBadge,
                            participants: activeGroup.members.map((m) => ({
                              id: m.id,
                              name: m.name,
                              role: m.role === 'admin' ? 'Trưởng nhóm' : 'Thành viên',
                              avatar: m.avatar,
                            })),
                          })
                        }
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-sm font-medium transition-colors cursor-pointer ${
                          isDark
                            ? 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                            : 'text-[#4e5058] hover:bg-[#e3e5e8] hover:text-slate-900'
                        }`}
                      >
                        <Volume2 className="w-4 h-4 shrink-0 text-[#80848e]" />
                        <span className="truncate">Phòng Học Thoại</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCallModal({
                            active: true,
                            type: 'video',
                            roomType: 'group',
                            targetId: activeGroup.id,
                            targetName: activeGroup.name,
                            targetBadge: activeConversationBadge,
                            participants: activeGroup.members.map((m) => ({
                              id: m.id,
                              name: m.name,
                              role: m.role === 'admin' ? 'Trưởng nhóm' : 'Thành viên',
                              avatar: m.avatar,
                            })),
                          })
                        }
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-sm font-medium transition-colors cursor-pointer ${
                          isDark
                            ? 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                            : 'text-[#4e5058] hover:bg-[#e3e5e8] hover:text-slate-900'
                        }`}
                      >
                        <Video className="w-4 h-4 shrink-0 text-[#80848e]" />
                        <span className="truncate">Phòng Video Nhóm</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Back to DMs + Other Servers shortcut */}
                <div className="pt-2 border-t border-black/10 dark:border-[#35363c] space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('direct');
                      setShowCommunitiesView(false);
                      if (!activeFriendId) setActiveFriendId('all_broadcast');
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-xs font-semibold transition-colors cursor-pointer ${
                      isDark
                        ? 'text-[#949ba4] hover:bg-[#35373c] hover:text-white'
                        : 'text-[#4e5058] hover:bg-[#e3e5e8] hover:text-slate-900'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#5865f2]" />
                    <span className="truncate">Chuyển sang Tin nhắn 1-1</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Discord DM Home Top Nav Items */}
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => handleOpenFriendsModal('find_friends')}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[5px] text-sm font-semibold transition-colors cursor-pointer ${
                      isDark
                        ? 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                        : 'text-[#4e5058] hover:bg-[#e3e5e8] hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 shrink-0" />
                      <span>Bạn bè</span>
                    </span>
                    {friendRequests.incoming.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#da373c] text-white text-[10px] font-black leading-none">
                        {friendRequests.incoming.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCommunityCategoryFilter('game');
                      setShowCommunitiesView(true);
                      setMobileShowChat(true);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[5px] text-sm font-semibold transition-colors cursor-pointer ${
                      isDark
                        ? 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                        : 'text-[#4e5058] hover:bg-[#e3e5e8] hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Gamepad2 className="w-4 h-4 shrink-0 text-[#23a559]" />
                      <span className="truncate">Cộng đồng Game</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#23a559]/15 text-[#23a559]">
                      {approvedGameCommunities.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCommunitiesView(false);
                      setActiveMode('direct');
                      setActiveFriendId('all_broadcast');
                      setMobileShowChat(true);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[5px] text-sm font-semibold transition-colors cursor-pointer ${
                      activeMode === 'direct' && activeFriendId === 'all_broadcast' && !showCommunitiesView
                        ? isDark
                          ? 'bg-[#404249] text-white'
                          : 'bg-[#d4d7dc] text-slate-900'
                        : isDark
                        ? 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                        : 'text-[#4e5058] hover:bg-[#e3e5e8] hover:text-slate-900'
                    }`}
                  >
                    <Bell className="w-4 h-4 shrink-0 text-amber-500" />
                    <span className="truncate">Thông báo &amp; Admin</span>
                  </button>
                </div>

                {/* Role Category Color Filter Strip (Giáo viên / Học sinh / Bạn bè / Quản trị viên) */}
                <div className="px-1 pt-1">
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
                    {[
                      { id: 'teacher' as const, label: 'GV', dot: 'bg-emerald-500', activeCls: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40' },
                      { id: 'student' as const, label: 'HS', dot: 'bg-amber-500', activeCls: 'bg-amber-500/20 text-amber-500 border-amber-500/40' },
                      { id: 'friend' as const, label: 'Bạn', dot: 'bg-purple-500', activeCls: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
                      { id: 'admin' as const, label: 'QTV', dot: 'bg-blue-500', activeCls: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
                    ].map((cat) => {
                      const isCatActive = categoryFilter === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryFilter(isCatActive ? 'all' : cat.id)}
                          className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
                            isCatActive
                              ? cat.activeCls
                              : isDark
                              ? 'bg-[#1e1f22]/70 border-transparent text-[#949ba4] hover:text-[#dbdee1]'
                              : 'bg-white/80 border-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                          title={`Lọc theo ${cat.label}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-[2px] ${cat.dot}`} />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* REAL ADMIN COMPOSER CARD */}
                {isRealAdmin && (
                  <div className="p-2 rounded-[6px] border border-amber-500/30 bg-amber-500/10 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-amber-500 uppercase tracking-wider">
                      <span>👑 Admin: {ADMIN_NAME}</span>
                    </div>
                    <textarea
                      rows={2}
                      value={adminQuickBroadcastText}
                      onChange={(e) => setAdminQuickBroadcastText(e.target.value)}
                      placeholder="Soạn thông báo gửi toàn hệ thống..."
                      className={`w-full px-2 py-1 rounded-[4px] border text-[11px] outline-none resize-none ${
                        isDark
                          ? 'bg-[#1e1f22] border-amber-500/30 text-white placeholder-zinc-500'
                          : 'bg-white border-amber-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        disabled={!adminQuickBroadcastText.trim() || isSendingBroadcast}
                        onClick={() => handleAdminQuickBroadcast(false)}
                        className="py-1 px-1.5 rounded-[4px] bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-40 text-white font-bold text-[10px] cursor-pointer"
                      >
                        📢 Gửi Tin
                      </button>
                      <button
                        type="button"
                        disabled={!adminQuickBroadcastText.trim() || isSendingBroadcast}
                        onClick={() => handleAdminQuickBroadcast(true)}
                        className="py-1 px-1.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-[10px] cursor-pointer"
                      >
                        🚀 Cập nhật App
                      </button>
                    </div>
                  </div>
                )}

                {/* DIRECT MESSAGES HEADER */}
                <div>
                  <div className="flex items-center justify-between px-1.5 mb-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedDiscordCats((prev) => ({ ...prev, dm: !prev.dm }))
                      }
                      className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider hover:text-slate-900 dark:hover:text-[#dbdee1] cursor-pointer"
                    >
                      {collapsedDiscordCats.dm ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      <span>Tin nhắn trực tiếp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenFriendsModal('find_friends')}
                      className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      title="Thêm bạn nhắn tin trực tiếp"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!collapsedDiscordCats.dm && (
                    <div className="space-y-0.5">
                      {unifiedConversations
                        .filter((item) => item.type === 'direct')
                        .map((item) => {
                          const isSelected =
                            activeMode === 'direct' && activeFriendId === item.id && !showCommunitiesView;
                          return (
                            <div
                              key={`${item.type}-${item.id}`}
                              onClick={() => handleSelectConversation(item)}
                              className={`group flex items-center gap-2.5 px-2 py-1.5 rounded-[5px] cursor-pointer transition-colors ${
                                isSelected
                                  ? isDark
                                    ? 'bg-[#404249] text-white'
                                    : 'bg-[#d4d7dc] text-slate-900'
                                  : isDark
                                  ? 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                                  : 'text-[#4e5058] hover:bg-[#e3e5e8] hover:text-slate-900'
                              }`}
                            >
                              <div className="shrink-0">
                                <UserAvatarWithStatus
                                  name={item.name}
                                  src={item.avatar}
                                  presenceStatus={item.presenceStatus || 'online'}
                                  size="sm"
                                  onClick={
                                    item.id !== 'all_broadcast'
                                      ? (e) => {
                                          e.stopPropagation();
                                          handleOpenSafeMemberProfile(
                                            {
                                              id: item.id,
                                              name: item.name,
                                              avatar: item.avatar,
                                              role: item.data?.role,
                                              school: item.data?.school,
                                              presenceStatus: item.presenceStatus,
                                            },
                                            'Bạn bè 1-1'
                                          );
                                        }
                                      : undefined
                                  }
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[13px] font-medium truncate leading-tight">
                                  {item.name}
                                </div>
                                <div className="text-[11px] opacity-75 truncate leading-tight">
                                  {item.lastMessage}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                      {unifiedConversations.filter((item) => item.type === 'direct').length === 0 && (
                        <div className="px-2 py-4 text-center space-y-2">
                          <p className="text-[11px]">Chưa có bạn bè phù hợp</p>
                          <button
                            type="button"
                            onClick={() => handleOpenFriendsModal('find_friends')}
                            className="w-full py-1.5 px-2 rounded-[4px] bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold cursor-pointer"
                          >
                            + Tìm &amp; Kết bạn
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* GROUPS & COMMUNITIES SHORTCUT LIST IN SIDEBAR */}
                {unifiedConversations.some((item) => item.type === 'group') && (
                  <div>
                    <div className="flex items-center justify-between px-1.5 mb-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedDiscordCats((prev) => ({ ...prev, servers: !prev.servers }))
                        }
                        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider hover:text-slate-900 dark:hover:text-[#dbdee1] cursor-pointer"
                      >
                        {collapsedDiscordCats.servers ? (
                          <ChevronRight className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                        <span>Nhóm &amp; Cộng đồng</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateGroupModal(true)}
                        className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        title="Tạo nhóm học tập mới"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {!collapsedDiscordCats.servers && (
                      <div className="space-y-0.5">
                        {unifiedConversations
                          .filter((item) => item.type === 'group')
                          .map((item) => (
                            <div
                              key={`${item.type}-${item.id}`}
                              onClick={() => handleSelectConversation(item)}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-[5px] cursor-pointer transition-colors ${
                                isDark
                                  ? 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                                  : 'text-[#4e5058] hover:bg-[#e3e5e8] hover:text-slate-900'
                              }`}
                            >
                              <span className="w-6 h-6 rounded-[6px] bg-[#5865f2]/15 text-sm flex items-center justify-center shrink-0">
                                {item.icon || '📚'}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-[13px] font-medium truncate">{item.name}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* BOTTOM DISCORD USER STATUS & VOICE CONTROL DOCK */}
          <div
            className={`h-[52px] px-2 flex items-center justify-between gap-1 shrink-0 border-t ${
              isDark
                ? 'bg-[#232428] border-[#1f2023] text-[#dbdee1]'
                : 'bg-[#ebedef] border-slate-200/90 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <UserAvatarWithStatus
                name={activeUserName}
                src={activeUserAvatar}
                presenceStatus={userPresence}
                size="sm"
                isEditable={true}
                onStatusChange={handleUpdatePresenceStatus}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate leading-tight">{activeUserName}</div>
                <div className="text-[10px] text-[#949ba4] truncate leading-tight">
                  {PRESENCE_STATUS_CONFIG[userPresence]?.label || 'Trực tuyến'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const next = !discordMicMuted;
                  setDiscordMicMuted(next);
                  setToastMessage(next ? 'Đã tắt Micro' : 'Đã bật Micro');
                  setTimeout(() => setToastMessage(''), 1800);
                }}
                className={`w-8 h-8 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer ${
                  discordMicMuted
                    ? 'text-[#da373c] hover:bg-[#35373c]/40'
                    : isDark
                    ? 'text-[#b5bac1] hover:bg-[#35373c] hover:text-white'
                    : 'text-slate-600 hover:bg-slate-300/60'
                }`}
                title={discordMicMuted ? 'Bật Micro' : 'Tắt Micro'}
              >
                {discordMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !discordDeafened;
                  setDiscordDeafened(next);
                  setToastMessage(next ? 'Đã tắt âm thanh nghe' : 'Đã bật âm thanh nghe');
                  setTimeout(() => setToastMessage(''), 1800);
                }}
                className={`w-8 h-8 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer relative ${
                  discordDeafened
                    ? 'text-[#da373c] hover:bg-[#35373c]/40'
                    : isDark
                    ? 'text-[#b5bac1] hover:bg-[#35373c] hover:text-white'
                    : 'text-slate-600 hover:bg-slate-300/60'
                }`}
                title={discordDeafened ? 'Bật tai nghe' : 'Tắt tai nghe'}
              >
                <Headphones className="w-4 h-4" />
                {discordDeafened && (
                  <span className="absolute w-5 h-[2px] bg-[#da373c] rotate-45 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenAvatarModal) {
                    onOpenAvatarModal();
                  } else {
                    const nexts: UserPresenceStatus[] = ['online', 'dnd', 'gaming', 'offline'];
                    const curIdx = nexts.indexOf(userPresence);
                    handleUpdatePresenceStatus(nexts[(curIdx + 1) % nexts.length]);
                  }
                }}
                className={`w-8 h-8 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer ${
                  isDark
                    ? 'text-[#b5bac1] hover:bg-[#35373c] hover:text-white'
                    : 'text-slate-600 hover:bg-slate-300/60'
                }`}
                title="Đổi ảnh đại diện & Cài đặt hồ sơ"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. DISCORD MAIN CHAT PANE */}
        <div
          className={`${
            mobileShowChat || showCommunitiesView ? 'flex' : 'hidden md:flex'
          } flex-1 flex-col h-full min-w-0 ${isDark ? 'bg-[#313338]' : 'bg-white'}`}
        >
        {showCommunitiesView ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Communities Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                    {communityCategoryFilter === 'game' ? (
                      <Gamepad2 className="w-5 h-5" />
                    ) : (
                      <Globe className="w-5 h-5" />
                    )}
                  </span>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {communityCategoryFilter === 'game'
                        ? 'Cộng đồng Game — Trò chơi điện tử phổ biến'
                        : 'Cộng Đồng Chính Thức (Cộng đồng Game & Học tập)'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Quản trị bởi <strong>{isRealAdmin ? ADMIN_NAME : 'Ban Quản Trị Max10'}</strong> · Thành viên người thật giao lưu trực tiếp (Không có AI giả)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isRealAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNewGroupMode('community');
                      setNewCommunityCategory('game');
                      setNewGroupIcon('🎮');
                      setNewCommunityPinTrending(true);
                      setShowCreateGroupModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo Cộng đồng Game</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        onOpenAuthModal?.();
                        return;
                      }
                      setShowProposeGameModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Đề xuất Cộng đồng Game</span>
                  </button>
                )}
                {hasActiveChat && (
                  <button
                    type="button"
                    onClick={() => setShowCommunitiesView(false)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    ← Quay lại chat
                  </button>
                )}
              </div>
            </div>

            {/* Admin Auto-Reply vs Manual Mode + Pending @Admin Mentions */}
            {isRealAdmin && (
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                      Chế độ trả lời khi có thành viên nhắn @Admin
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isSavingAutoReply}
                      onClick={() => handleSaveAdminAutoReply(true)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        adminAutoReplyEnabled
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isDark
                          ? 'bg-white/[0.06] text-zinc-300 hover:bg-white/10'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Tự động trả lời</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSavingAutoReply}
                      onClick={() => handleSaveAdminAutoReply(false)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        !adminAutoReplyEnabled
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : isDark
                          ? 'bg-white/[0.06] text-zinc-300 hover:bg-white/10'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Tự trả lời thủ công</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={adminAutoReplyGreeting}
                    onChange={(e) => setAdminAutoReplyGreeting(e.target.value)}
                    placeholder="Lời chào mở đầu khi tự động trả lời @Admin (tùy chọn)..."
                    className={`flex-1 px-3 py-1.5 rounded-xl text-xs border outline-hidden ${
                      isDark ? 'bg-zinc-900/80 border-white/10 text-white' : 'bg-white border-amber-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    disabled={isSavingAutoReply}
                    onClick={() => handleSaveAdminAutoReply(adminAutoReplyEnabled, adminAutoReplyGreeting)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold cursor-pointer shrink-0"
                  >
                    Lưu lời chào
                  </button>
                </div>

                {adminPendingMentions.length > 0 && (
                  <div className="pt-2 border-t border-amber-500/20 space-y-1.5">
                    <p className="text-[11px] font-extrabold text-rose-500 dark:text-rose-400">
                      Có {adminPendingMentions.length} câu hỏi đang @tag Admin chờ bạn trả lời:
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {adminPendingMentions.map((m) => (
                        <div
                          key={m.id}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                            isDark ? 'bg-zinc-900/80 border-white/10' : 'bg-white border-amber-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {m.senderName} <span className="font-normal text-slate-500">tại {m.targetName}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{m.content}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleJumpToPendingMention(m)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                          >
                            Trả lời ngay
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search & Category / Platform Filters */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={communitySearchQuery}
                  onChange={(e) => setCommunitySearchQuery(e.target.value)}
                  placeholder="Tìm kiếm Cộng đồng Game (Liên Quân, Minecraft, Roblox, Valorant, Free Fire, Genshin, Switch, PS5, Toán...)"
                  className={`w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs border outline-hidden transition-colors ${
                    isDark
                      ? 'bg-[#111622] border-white/[0.08] text-white placeholder-zinc-500 focus:border-emerald-500/60'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                  }`}
                />
                {communitySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCommunitySearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Community Category Tabs (explicitly includes 'Cộng đồng Game') */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  {
                    id: 'all' as const,
                    label: `Tất cả Cộng đồng`,
                    count: approvedCommunities.length,
                    icon: '🌐',
                  },
                  {
                    id: 'game' as const,
                    label: `Cộng đồng Game`,
                    count: approvedGameCommunities.length,
                    icon: '🎮',
                  },
                  {
                    id: 'study' as const,
                    label: `Cộng đồng Học tập`,
                    count: approvedStudyCommunities.length,
                    icon: '📚',
                  },
                  ...(isRealAdmin
                    ? [
                        {
                          id: 'pending' as const,
                          label: `Chờ duyệt`,
                          count: pendingCommunities.length,
                          icon: '⏳',
                        },
                      ]
                    : []),
                ].map((tab) => {
                  const active = communityCategoryFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setCommunityCategoryFilter(tab.id);
                        if (tab.id === 'study' || tab.id === 'pending') setCommunityPlatformFilter('all');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        active
                          ? tab.id === 'pending'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-emerald-600 text-white shadow-xs'
                          : isDark
                          ? 'bg-white/[0.05] text-zinc-300 hover:bg-white/10'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md tabular-nums ${
                          active ? 'bg-black/15' : 'bg-slate-200/70 dark:bg-white/10'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {communityCategoryFilter !== 'study' && communityCategoryFilter !== 'pending' && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mr-1">
                    Nền tảng Game:
                  </span>
                  {[
                    { id: 'all' as const, label: 'Tất cả nền tảng', icon: '🌐' },
                    { id: 'Cross-Platform' as const, label: 'Đa nền tảng / Web', icon: '🔄' },
                    { id: 'Mobile' as const, label: 'Mobile (iOS / Android)', icon: '📱' },
                    { id: 'PC' as const, label: 'PC / Steam / Riot', icon: '💻' },
                    { id: 'Console' as const, label: 'Console (Switch / PS5 / Xbox)', icon: '🕹️' },
                  ].map((plat) => {
                    const active = communityPlatformFilter === plat.id;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => setCommunityPlatformFilter(plat.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                            : isDark
                            ? 'bg-white/[0.04] text-zinc-300 border border-white/[0.06] hover:bg-white/10'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{plat.icon}</span>
                        <span>{plat.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ADMIN APPROVAL QUEUE SECTION (Duyệt nhóm Cộng đồng Game trực quan) */}
            {isRealAdmin && (pendingCommunities.length > 0 || communityCategoryFilter === 'pending') && (
              <section
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-[#111622] border-amber-500/35' : 'bg-white border-amber-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Kiểm duyệt đề xuất Cộng đồng Game ({pendingCommunities.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Chỉ Admin mới có quyền duyệt hoặc từ chối nhóm cộng đồng mới
                  </span>
                </div>

                {pendingCommunities.length === 0 ? (
                  <div className="py-5 text-center text-xs text-slate-500 dark:text-zinc-400 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                    Không có nhóm Cộng đồng Game nào đang chờ duyệt.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pendingCommunities.map((comm) => (
                      <div
                        key={comm.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                          isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-lg shrink-0">
                                {comm.avatarIcon || '🎮'}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                                  {comm.name}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                                  {comm.gameTitle || comm.name} · {comm.gamePlatform || 'Cross-Platform'} · Đề xuất bởi {comm.submittedByName || comm.createdByName}
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2">
                            {comm.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => handleApproveCommunity(comm, 'reject')}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-[11px] font-bold cursor-pointer"
                          >
                            Từ chối
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveCommunity(comm, 'approve', false)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveCommunity(comm, 'approve', true)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold cursor-pointer flex items-center gap-1"
                          >
                            <Pin className="w-3 h-3" />
                            <span>Duyệt &amp; Ghim Thịnh Hành</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* USER OWN PENDING PROPOSALS BANNER */}
            {!isRealAdmin && currentUser && pendingCommunities.some((c) => c.submittedById === activeUserId) && (
              <div className={`p-3.5 rounded-2xl border space-y-2 ${isDark ? 'bg-[#111622] border-amber-500/30' : 'bg-amber-50/70 border-amber-200'}`}>
                <div className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
                  Đề xuất Cộng đồng Game của bạn đang chờ Admin duyệt:
                </div>
                <div className="flex flex-wrap gap-2">
                  {pendingCommunities
                    .filter((c) => c.submittedById === activeUserId)
                    .map((c) => (
                      <div
                        key={c.id}
                        className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                          isDark ? 'bg-white/[0.04] border-white/10 text-zinc-200' : 'bg-white border-amber-200 text-slate-700'
                        }`}
                      >
                        <span>{c.avatarIcon || '🎮'}</span>
                        <span className="font-bold">{c.name}</span>
                        <span className="text-[11px] text-amber-600 dark:text-amber-400">· Chờ duyệt</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* PINNED TRENDING VIDEO GAMES SHOWCASE (Trò chơi điện tử đang thịnh hành - Admin ghim) */}
            {(communityCategoryFilter === 'game' || communityCategoryFilter === 'all') && (
              <section
                className={`p-4 rounded-2xl border space-y-3.5 ${
                  isDark ? 'bg-[#111622] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Trò chơi điện tử đang thịnh hành ({pinnedTrendingGames.length})
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Được {isRealAdmin ? `Admin ${ADMIN_NAME}` : 'Ban Quản Trị Max10'} ghim nổi bật trong danh mục Cộng đồng Game
                      </p>
                    </div>
                  </div>

                  {isRealAdmin && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {unpinnedGameCommunities.length > 0 && (
                        <>
                          <select
                            value={quickPinSelectedId}
                            onChange={(e) => setQuickPinSelectedId(e.target.value)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border outline-hidden max-w-[200px] ${
                              isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <option value="">Chọn game để ghim...</option>
                            {unpinnedGameCommunities.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.gameTitle || g.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={quickPinBadge}
                            onChange={(e) => setQuickPinBadge(e.target.value)}
                            className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border outline-hidden ${
                              isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <option value="Thịnh hành">Thịnh hành</option>
                            <option value="Hot Tuần Này">Hot Tuần Này</option>
                            <option value="Top Yêu Thích">Top Yêu Thích</option>
                            <option value="Giải đấu">Giải đấu</option>
                          </select>
                          <button
                            type="button"
                            disabled={!quickPinSelectedId}
                            onClick={() => {
                              const target = unpinnedGameCommunities.find((g) => g.id === quickPinSelectedId);
                              if (target) {
                                handleTogglePinTrendingGame(target, true, quickPinBadge);
                                setQuickPinSelectedId('');
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-[11px] font-extrabold cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            <Pin className="w-3.5 h-3.5" />
                            <span>Ghim ngay</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {pinnedTrendingGames.length === 0 ? (
                  <div className="py-5 text-center text-xs text-slate-500 dark:text-zinc-400 border border-dashed border-slate-200 dark:border-white/10 rounded-xl space-y-2">
                    <p>Chưa có trò chơi điện tử nào được ghim lên mục Thịnh hành.</p>
                    {isRealAdmin && (
                      <p className="text-[11px]">
                        Admin có thể bấm <strong>Ghim thịnh hành</strong> trên bất kỳ thẻ Cộng đồng Game nào bên dưới hoặc chọn nhanh ở thanh phía trên.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {pinnedTrendingGames.map((game, idx) => {
                      const humanCount = (game.members || []).filter((m) => !isAiEntity(m)).length;
                      const isJoined = (game.members || []).some((m) => m.id === activeUserId);
                      return (
                        <div
                          key={game.id}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-colors ${
                            isDark
                              ? 'bg-white/[0.03] border-white/[0.08] hover:border-amber-500/45'
                              : 'bg-slate-50/70 border-slate-200 hover:border-amber-400'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-lg shrink-0">
                                  {game.avatarIcon || '🎮'}
                                </span>
                                <div className="min-w-0">
                                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                    #{String(idx + 1).padStart(2, '0')} · {game.trendingBadge || 'Thịnh hành'}
                                  </div>
                                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                    {game.gameTitle || game.name}
                                  </h4>
                                </div>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                              {game.gamePlatform || 'Cross-Platform'} · {game.gameGenre || 'Game'} ·{' '}
                              <span className="tabular-nums">{humanCount} người</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
                            <button
                              type="button"
                              onClick={() => handleJoinGroup(game)}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                                isJoined
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              {isJoined ? 'Mở phòng' : 'Tham gia'}
                            </button>

                            {isRealAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCommunity(game)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isDark
                                      ? 'border-white/10 text-zinc-300 hover:bg-white/10'
                                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                  title="Chỉnh sửa cộng đồng"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePinTrendingGame(game, false)}
                                  className="p-1.5 rounded-lg border border-amber-500/35 text-amber-600 dark:text-amber-300 hover:bg-amber-500/15 transition-colors cursor-pointer"
                                  title="Bỏ ghim khỏi Thịnh hành"
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Communities Cards Grid */}
            {communityCategoryFilter !== 'pending' && (() => {
              const qComm = communitySearchQuery.trim().toLowerCase();
              const filteredCommunities = approvedCommunities.filter((comm) => {
                if (
                  communityCategoryFilter !== 'all' &&
                  (comm.communityCategory || 'study') !== communityCategoryFilter
                ) {
                  return false;
                }
                if (communityCategoryFilter !== 'study' && communityPlatformFilter !== 'all') {
                  if (comm.communityCategory !== 'game') return false;
                  if ((comm.gamePlatform || 'Cross-Platform') !== communityPlatformFilter) return false;
                }
                if (qComm) {
                  const hay = [
                    comm.name,
                    comm.description,
                    comm.subject,
                    comm.gameTitle,
                    comm.gamePlatform,
                    comm.gameGenre,
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                  if (!hay.includes(qComm)) return false;
                }
                return true;
              });

              if (filteredCommunities.length === 0) {
                const generalGameComm = approvedCommunities.find((c) => c.id === 'community-game-max10');
                return (
                  <div className={`p-6 rounded-2xl border border-dashed text-center space-y-3 ${isDark ? 'border-white/15 bg-[#111622]' : 'border-slate-300 bg-white'}`}>
                    <div className="text-3xl">🎮</div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Chưa thấy cộng đồng khớp với &ldquo;{communitySearchQuery}&rdquo;
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                      Bạn có thể tham gia <strong>Cộng Đồng Game Tổng Hợp Mọi Nền Tảng</strong> để rủ bạn chơi mọi tựa game, hoặc tạo / đề xuất phòng riêng cho tựa game này!
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {isRealAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            setNewGroupMode('community');
                            setNewCommunityCategory('game');
                            setNewGroupIcon('🎮');
                            setNewCommunityGameTitle(communitySearchQuery.trim());
                            setNewGroupName(`Cộng Đồng ${communitySearchQuery.trim()}`);
                            setShowCreateGroupModal(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer"
                        >
                          + Admin lập ngay Cộng đồng &ldquo;{communitySearchQuery.trim()}&rdquo;
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentUser) {
                              onOpenAuthModal?.();
                              return;
                            }
                            setProposeGameForm((p) => ({
                              ...p,
                              name: communitySearchQuery.trim() ? `Cộng Đồng ${communitySearchQuery.trim()}` : '',
                              gameTitle: communitySearchQuery.trim(),
                            }));
                            setShowProposeGameModal(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer"
                        >
                          + Đề xuất Cộng đồng Game mới
                        </button>
                      )}
                      {generalGameComm && (
                        <button
                          type="button"
                          onClick={() => handleJoinGroup(generalGameComm)}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-extrabold cursor-pointer"
                        >
                          Vào Cộng Đồng Game Tổng Hợp
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setCommunitySearchQuery('');
                          setCommunityPlatformFilter('all');
                          setCommunityCategoryFilter('all');
                        }}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-zinc-300 cursor-pointer"
                      >
                        Xem tất cả cộng đồng
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredCommunities.map((comm) => {
                    const humanMembers = (comm.members || []).filter((m) => !isAiEntity(m));
                    const isJoined = humanMembers.some((m) => m.id === activeUserId);
                    const isGame = comm.communityCategory === 'game';
                    const platformLabel = comm.gamePlatform || (isGame ? 'Cross-Platform' : '');

                    return (
                      <div
                        key={comm.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-colors ${
                          comm.isPinnedTrending
                            ? isDark
                              ? 'bg-[#111622] border-amber-500/35 hover:border-amber-400/60'
                              : 'bg-white border-amber-300 hover:border-amber-400'
                            : isDark
                            ? 'bg-[#111622] border-white/[0.08] hover:border-emerald-500/40'
                            : 'bg-white border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center text-xl shrink-0">
                                {comm.avatarIcon || (isGame ? '🎮' : '📚')}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                                  {comm.name}
                                </h3>
                                <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                                  <span>{isGame ? 'Cộng đồng Game' : 'Cộng đồng Học tập'}</span>
                                  {isGame && platformLabel && (
                                    <>
                                      <span aria-hidden="true"> · </span>
                                      <span>{platformLabel}</span>
                                    </>
                                  )}
                                  {comm.gameGenre && (
                                    <>
                                      <span aria-hidden="true"> · </span>
                                      <span>{comm.gameGenre}</span>
                                    </>
                                  )}
                                  {comm.isPinnedTrending && (
                                    <>
                                      <span aria-hidden="true"> · </span>
                                      <span className="font-bold text-amber-600 dark:text-amber-400">
                                        Ghim: {comm.trendingBadge || 'Thịnh hành'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                            {comm.description}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1 tabular-nums">
                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{humanMembers.length} người thật · Không AI</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isRealAdmin && (
                              <>
                                {isGame && (
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePinTrendingGame(comm)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                                      comm.isPinnedTrending
                                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
                                        : isDark
                                        ? 'border-white/10 text-zinc-300 hover:bg-white/10'
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                    title={comm.isPinnedTrending ? 'Bỏ ghim khỏi Thịnh hành' : 'Ghim lên Thịnh hành'}
                                  >
                                    <Pin className="w-3 h-3" />
                                    <span>{comm.isPinnedTrending ? 'Đã ghim' : 'Ghim'}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCommunity(comm)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isDark
                                      ? 'border-white/10 text-zinc-300 hover:bg-white/10'
                                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                  title="Quản lý & Chỉnh sửa"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGroupToDelete(comm)}
                                  className="p-1.5 rounded-lg border border-rose-500/25 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Xóa cộng đồng"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => handleJoinGroup(comm)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                                isJoined
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              }`}
                            >
                              {isJoined ? 'Mở cộng đồng' : 'Tham gia ngay'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : !hasActiveChat ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
            <div className="md:hidden w-full flex justify-start mb-4">
              <button
                type="button"
                onClick={() => setMobileShowChat(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#5865f2] text-white text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Danh sách kênh &amp; bạn bè</span>
              </button>
            </div>
            <div className="w-20 h-20 rounded-[24px] bg-[#5865f2]/15 border border-[#5865f2]/30 flex items-center justify-center mb-5 text-[#5865f2] shadow-sm">
              <MessageCircle className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              Chào mừng đến với Cộng đồng &amp; Chat
            </h2>
            <p className="text-sm text-slate-500 dark:text-[#949ba4] max-w-md mb-6 leading-relaxed">
              Chọn một Server nhóm, kênh thoại hoặc bạn bè bên trái để trò chuyện kiểu Discord. Gõ <strong className="text-amber-500">@Admin</strong> để hỏi Quản trị viên hoặc <strong className="text-[#5865f2]">@Max10 AI</strong> để giải bài trực tiếp!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                onClick={() => {
                  setCommunityCategoryFilter('game');
                  setShowCommunitiesView(true);
                  setMobileShowChat(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-[#248046] hover:bg-[#1a6334] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Cộng đồng Game ({approvedGameCommunities.length})</span>
              </button>
              <button
                onClick={() => {
                  setCommunityCategoryFilter('all');
                  setShowCommunitiesView(true);
                  setMobileShowChat(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>Tất cả Cộng đồng ({approvedCommunities.length})</span>
              </button>
              <button
                onClick={() => handleOpenFriendsModal('find_friends')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[4px] text-xs font-bold border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#2b2d31] border-[#1f2023] hover:bg-[#35373c] text-[#dbdee1]'
                    : 'bg-[#f2f3f5] border-slate-200 hover:bg-[#e3e5e8] text-slate-800'
                }`}
              >
                <UserPlus className="w-4 h-4 text-[#23a559]" />
                <span>+ Tìm &amp; Kết bạn mới</span>
              </button>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[4px] text-xs font-bold border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#2b2d31] border-[#1f2023] hover:bg-[#35373c] text-[#dbdee1]'
                    : 'bg-[#f2f3f5] border-slate-200 hover:bg-[#e3e5e8] text-slate-800'
                }`}
              >
                <Users className="w-4 h-4 text-[#5865f2]" />
                <span>+ Tạo Server / Nhóm học tập</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* DISCORD TOP CHANNEL HEADER BAR */}
            <div
              className={`h-12 px-3 sm:px-4 border-b flex items-center justify-between gap-2 shrink-0 ${
                isDark
                  ? 'bg-[#313338] border-[#1f2023] text-[#f2f3f5]'
                  : 'bg-white border-slate-200/90 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setMobileShowChat(false)}
                  className={`md:hidden p-1.5 rounded-[4px] shrink-0 cursor-pointer ${
                    isDark ? 'hover:bg-[#35373c] text-[#b5bac1]' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                  title="Quay lại danh sách Server & Kênh"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {activeMode === 'group' ? (
                  <Hash className="w-5 h-5 text-[#80848e] shrink-0" />
                ) : (
                  <AtSign className="w-5 h-5 text-[#80848e] shrink-0" />
                )}

                <h2 className="text-sm sm:text-[15px] font-bold truncate">
                  {activeMode === 'group'
                    ? discordChannel === 'ai_tutor'
                      ? 'hoi-max10-ai'
                      : discordChannel === 'duel'
                      ? 'thi-dau-kien-thuc'
                      : 'chat-chung'
                    : activeConversationTitle}
                </h2>

                {activeMode === 'direct' && activeFriend && (
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      activeFriend.presenceStatus === 'dnd'
                        ? 'bg-[#da373c]'
                        : activeFriend.presenceStatus === 'gaming'
                        ? 'bg-[#f0b232]'
                        : activeFriend.presenceStatus === 'offline'
                        ? 'bg-[#80848e]'
                        : 'bg-[#23a559]'
                    }`}
                    title={activeConversationStatus}
                  />
                )}

                {(() => {
                  const cat =
                    activeMode === 'direct'
                      ? getSenderCategory({ name: activeFriend?.name }, { isDirectFriend: true })
                      : getSenderCategory({ name: activeGroup?.name, role: 'admin' }, { isGroupAdmin: true });
                  return <ClassificationSquare category={cat} className="hidden sm:inline-flex" />;
                })()}

                <span className="hidden lg:inline-block h-5 w-px bg-black/10 dark:bg-white/10 mx-1 shrink-0" />
                <p className="hidden lg:block text-xs text-[#80848e] dark:text-[#949ba4] truncate">
                  {activeMode === 'group'
                    ? `${activeGroup?.name} · ${
                        discordChannel === 'ai_tutor'
                          ? 'Hỏi bài Gia sư @Max10 AI'
                          : discordChannel === 'duel'
                          ? 'Đấu trường Thi đấu kiến thức'
                          : activeConversationStatus
                      }`
                    : activeConversationStatus}
                </p>
              </div>

              {/* Discord Header Right Toolbar */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {!(activeMode === 'direct' && activeFriendId === 'all_broadcast') && (
                  <button
                    type="button"
                    onClick={() =>
                      handleStartDuelWithMember(
                        activeMode === 'direct' && activeFriend
                          ? buildSafePublicProfile({
                              id: activeFriend.id,
                              name: activeFriend.name,
                              avatar: activeFriend.avatar,
                              role: (activeFriend as any).role,
                              school: activeFriend.school,
                              presenceStatus: activeFriend.presenceStatus,
                              isFriend: isFriend(activeFriend.id),
                            })
                          : null
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#248046] hover:bg-[#1a6334] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    title="Tạo trận thi đấu kiến thức trong Cộng đồng / Nhóm / Bạn bè"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Thi đấu</span>
                  </button>
                )}

                {activeMode === 'group' && (
                  <button
                    type="button"
                    onClick={() => setShowRulesModal(true)}
                    className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
                      isDark ? 'text-[#b5bac1] hover:text-white hover:bg-[#35373c]' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Xem Nội quy & Tin ghim"
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setCallModal({
                      active: true,
                      type: 'voice',
                      roomType: activeMode,
                      targetId: activeMode === 'direct' ? activeFriend?.id : activeGroup?.id,
                      targetName: activeConversationTitle,
                      targetAvatar: activeMode === 'direct' ? activeFriend?.avatar : undefined,
                      targetBadge: activeConversationBadge,
                      participants:
                        activeMode === 'group' && activeGroup
                          ? activeGroup.members.map((m) => ({
                              id: m.id,
                              name: m.name,
                              role: m.role === 'admin' ? 'Trưởng nhóm' : 'Thành viên',
                              avatar: m.avatar,
                            }))
                          : undefined,
                    })
                  }
                  className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
                    isDark ? 'text-[#b5bac1] hover:text-white hover:bg-[#35373c]' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Bắt đầu cuộc gọi Thoại"
                >
                  <Phone className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCallModal({
                      active: true,
                      type: 'video',
                      roomType: activeMode,
                      targetId: activeMode === 'direct' ? activeFriend?.id : activeGroup?.id,
                      targetName: activeConversationTitle,
                      targetAvatar: activeMode === 'direct' ? activeFriend?.avatar : undefined,
                      targetBadge: activeConversationBadge,
                      participants:
                        activeMode === 'group' && activeGroup
                          ? activeGroup.members.map((m) => ({
                              id: m.id,
                              name: m.name,
                              role: m.role === 'admin' ? 'Trưởng nhóm' : 'Thành viên',
                              avatar: m.avatar,
                            }))
                          : undefined,
                    })
                  }
                  className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
                    isDark ? 'text-[#b5bac1] hover:text-white hover:bg-[#35373c]' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Bắt đầu cuộc gọi Video HD (Camera & Mic thật)"
                >
                  <Video className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowRightDrawer(!showRightDrawer)}
                  className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
                    showRightDrawer
                      ? isDark
                        ? 'text-white bg-[#404249]'
                        : 'text-slate-900 bg-slate-200'
                      : isDark
                      ? 'text-[#b5bac1] hover:text-white hover:bg-[#35373c]'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Ẩn / Hiện Danh sách thành viên"
                >
                  <Users className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowSearchInChat(!showSearchInChat)}
                  className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
                    showSearchInChat
                      ? 'bg-[#5865f2] text-white'
                      : isDark
                      ? 'text-[#b5bac1] hover:text-white hover:bg-[#35373c]'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Tìm kiếm tin nhắn trong kênh"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

        {/* In-chat search bar */}
        {showSearchInChat && (
          <div
            className={`px-4 py-2 border-b flex items-center gap-2 ${
              isDark ? 'bg-[#2b2d31] border-[#1f2023]' : 'bg-[#f2f3f5] border-slate-200'
            }`}
          >
            <Search className="w-4 h-4 text-[#5865f2]" />
            <input
              type="text"
              value={chatSearchText}
              onChange={(e) => setChatSearchText(e.target.value)}
              placeholder="Tìm tin nhắn theo nội dung hoặc người gửi..."
              className="flex-1 bg-transparent border-none text-xs outline-none text-slate-900 dark:text-[#dbdee1] placeholder-[#949ba4]"
              autoFocus
            />
            {chatSearchText && (
              <button
                onClick={() => setChatSearchText('')}
                className="text-[#949ba4] hover:text-slate-800 dark:hover:text-white text-xs cursor-pointer"
              >
                Xóa
              </button>
            )}
            <button
              onClick={() => setShowSearchInChat(false)}
              className="p-1 rounded-[4px] text-[#949ba4] hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Pinned Notice Banner */}
        {activeMode === 'group' && activeGroup?.pinnedNotice && (
          <div
            className={`px-4 py-1.5 border-b flex items-center justify-between text-xs ${
              isDark
                ? 'bg-[#2b2d31]/80 border-[#1f2023] text-[#dbdee1]'
                : 'bg-amber-50/90 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate font-medium">{activeGroup.pinnedNotice}</span>
            </div>
            <button
              onClick={() => setShowRulesModal(true)}
              className="text-[11px] font-bold text-[#5865f2] dark:text-[#949cf7] hover:underline shrink-0 ml-2 cursor-pointer"
            >
              Nội quy
            </button>
          </div>
        )}

        {/* DISCORD MESSAGES FEED */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Beginning of Channel / DM Discord Welcome Header */}
          <div className="px-4 pb-5 mb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
            {activeMode === 'group' && activeGroup ? (
              <div className="space-y-2">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-[#41434a] text-white' : 'bg-[#e3e5e8] text-slate-800'
                  }`}
                >
                  <Hash className="w-9 h-9" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Chào mừng đến với #
                  {discordChannel === 'ai_tutor'
                    ? 'hoi-max10-ai'
                    : discordChannel === 'duel'
                    ? 'thi-dau-kien-thuc'
                    : 'chat-chung'}
                  !
                </h3>
                <p className="text-xs sm:text-sm text-[#4e5058] dark:text-[#b5bac1]">
                  Đây là phần đầu của kênh trong <strong>{activeGroup.name}</strong>. Bấm vào ảnh đại diện thành viên để xem hồ sơ an toàn &amp; thách đấu!
                </p>
                {discordChannel === 'duel' && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleStartDuelWithMember(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#248046] hover:bg-[#1a6334] text-white text-xs font-bold cursor-pointer"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Mở kèo Thi đấu trong Server ngay</span>
                    </button>
                  </div>
                )}
              </div>
            ) : activeFriend ? (
              <div className="space-y-2">
                <div className="inline-block">
                  <UserAvatarWithStatus
                    name={activeFriend.name}
                    src={activeFriend.avatar}
                    presenceStatus={activeFriend.presenceStatus || 'online'}
                    size="xl"
                    onClick={
                      activeFriend.id !== 'all_broadcast'
                        ? () =>
                            handleOpenSafeMemberProfile(
                              {
                                id: activeFriend.id,
                                name: activeFriend.name,
                                avatar: activeFriend.avatar,
                                role: (activeFriend as any).role,
                                school: activeFriend.school,
                                presenceStatus: activeFriend.presenceStatus,
                              },
                              'Bạn bè 1-1'
                            )
                        : undefined
                    }
                  />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {activeConversationTitle}
                </h3>
                <p className="text-xs sm:text-sm text-[#4e5058] dark:text-[#b5bac1]">
                  Đây là phần đầu lịch sử trò chuyện trực tiếp giữa bạn và <strong>{activeConversationTitle}</strong>.
                </p>
              </div>
            ) : null}
          </div>

          {/* Integrated Notifications, Holiday Gifts & Admin Controls Hub inside Messaging ('all_broadcast') */}
          {activeMode === 'direct' && activeFriendId === 'all_broadcast' && (
            <div
              className={`mx-4 mb-4 p-3.5 sm:p-4 rounded-[6px] border border-l-[4px] space-y-3 ${
                isDark
                  ? 'bg-[#2b2d31] border-[#1f2023] border-l-[#5865f2]'
                  : 'bg-[#f2f3f5] border-slate-200 border-l-[#5865f2]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-[6px] bg-[#5865f2]/20 text-[#5865f2] flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      Trung tâm Thông báo, Sự kiện &amp; Hỏi đáp Admin
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-[#949ba4]">
                      Toàn bộ thông báo cập nhật, quà lễ và hỏi đáp với Admin đều nằm gọn trong kênh này
                    </p>
                  </div>
                </div>
                {Boolean(currentUser) && (
                  <button
                    type="button"
                    onClick={() => setShowCommunitiesView(true)}
                    className="px-3 py-1.5 rounded-[4px] bg-[#248046] hover:bg-[#1a6334] text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Vào Cộng đồng</span>
                  </button>
                )}
              </div>

              {autoUpdateNotice && (
                <div className="p-2.5 rounded-[4px] bg-[#23a559]/15 border border-[#23a559]/30 text-xs text-[#23a559] dark:text-[#2dc770] font-medium flex items-center gap-2">
                  <Rocket className="w-4 h-4 shrink-0" />
                  <span>{autoUpdateNotice}</span>
                </div>
              )}

              {/* Holiday gifts + Quick shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5">
                {getVisibleHolidays().slice(0, 3).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => onOpenOfferModal?.()}
                    className="px-2.5 py-1.5 rounded-[4px] bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>{h.petals?.[0] || '🎁'}</span>
                    <span>Quà {h.title}</span>
                  </button>
                ))}
                {getVisibleHolidays().length === 0 && onOpenOfferModal && (
                  <button
                    type="button"
                    onClick={onOpenOfferModal}
                    className="px-2.5 py-1.5 rounded-[4px] bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>🎁</span>
                    <span>Quà lễ &amp; Sự kiện</span>
                  </button>
                )}
                {onOpenStoreModal && (
                  <button
                    type="button"
                    onClick={onOpenStoreModal}
                    className={`px-2.5 py-1.5 rounded-[4px] text-[11px] font-bold border cursor-pointer ${
                      isDark
                        ? 'bg-[#1e1f22] border-[#35363c] text-[#dbdee1] hover:bg-[#35373c]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    📱 Cài đặt App
                  </button>
                )}
                {onOpenPricingModal && (
                  <button
                    type="button"
                    onClick={onOpenPricingModal}
                    className={`px-2.5 py-1.5 rounded-[4px] text-[11px] font-bold border cursor-pointer ${
                      isDark
                        ? 'bg-[#1e1f22] border-[#35363c] text-[#dbdee1] hover:bg-[#35373c]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    👑 Nâng cấp VIP
                  </button>
                )}
                {onOpenIntroModal && (
                  <button
                    type="button"
                    onClick={onOpenIntroModal}
                    className={`px-2.5 py-1.5 rounded-[4px] text-[11px] font-bold border cursor-pointer ${
                      isDark
                        ? 'bg-[#1e1f22] border-[#35363c] text-[#dbdee1] hover:bg-[#35373c]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ✨ Giới thiệu Max10
                  </button>
                )}
              </div>

              {isRealAdmin && (
                <div className="pt-2 border-t border-black/10 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-bold text-amber-500 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    <span>
                      @Admin đang ở chế độ: {adminAutoReplyEnabled ? '🤖 Tự động trả lời' : '✍️ Tự trả lời thủ công'}
                      {adminPendingMentions.length > 0 ? ` · ${adminPendingMentions.length} câu hỏi chờ` : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={isSavingAutoReply}
                    onClick={() => handleSaveAdminAutoReply(!adminAutoReplyEnabled)}
                    className="px-2.5 py-1 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold cursor-pointer"
                  >
                    {adminAutoReplyEnabled ? 'Chuyển sang Tự trả lời' : 'Bật Tự động trả lời'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DISCORD FLAT LEFT-ALIGNED GROUPED MESSAGE ROWS */}
          {activeMode === 'direct' ? (
            displayedDirectMsgs.map((msg, idx) => {
              const prev = idx > 0 ? displayedDirectMsgs[idx - 1] : null;
              const isAiDm = msg.senderId === 'ai-max10-dm' || (msg.senderName || '').includes('Max10 AI');
              const isAdminSender =
                msg.senderId === ADMIN_ID ||
                msg.senderId === 'all_broadcast' ||
                Boolean((msg as any).isAdminUpdate) ||
                (msg.senderName || '').includes('Quản trị');
              const isGrouped = Boolean(
                prev &&
                  !msg.replyTo &&
                  !prev.challengeId &&
                  prev.senderId === msg.senderId &&
                  Math.abs((msg.createdAt || 0) - (prev.createdAt || 0)) < 5 * 60 * 1000
              );
              const isMe = msg.senderId === activeUserId;
              const senderCat = getSenderCategory(
                { id: msg.senderId, name: msg.senderName },
                { isDirectFriend: !isAdminSender, isGroupAdmin: isAdminSender }
              );

              return (
                <div
                  key={msg.id}
                  className={`group relative px-4 py-[3px] transition-colors ${
                    isDark ? 'hover:bg-[#2e3035]' : 'hover:bg-[#f7f7f8]'
                  } ${isGrouped ? 'mt-0' : 'mt-3.5'}`}
                >
                  {/* Discord Reply Reference Spine */}
                  {msg.replyTo && (
                    <div className="flex items-center gap-1.5 mb-0.5 text-xs text-[#4e5058] dark:text-[#b5bac1]">
                      <div className="w-7 h-2.5 ml-[19px] mt-1.5 border-l-2 border-t-2 border-[#b5bac1] dark:border-[#4e5058] rounded-tl-[6px] shrink-0" />
                      <span className="font-semibold text-[#5865f2] dark:text-[#949cf7] shrink-0">
                        @{msg.replyTo.senderName}
                      </span>
                      <span className="truncate opacity-80">{msg.replyTo.content}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {/* Left 40px Avatar / Hover Timestamp Column */}
                    <div className="w-10 shrink-0 flex justify-center">
                      {!isGrouped ? (
                        <UserAvatarWithStatus
                          name={msg.senderName}
                          src={msg.senderAvatar}
                          presenceStatus={
                            isMe
                              ? userPresence
                              : isAiDm || isAdminSender
                              ? 'online'
                              : activeFriend?.presenceStatus || 'online'
                          }
                          size="md"
                          onClick={
                            !isAiDm && msg.senderId !== 'all_broadcast'
                              ? () =>
                                  handleOpenSafeMemberProfile(
                                    {
                                      id: msg.senderId,
                                      name: msg.senderName,
                                      avatar: msg.senderAvatar,
                                      presenceStatus: activeFriend?.presenceStatus,
                                    },
                                    'Bạn bè 1-1'
                                  )
                              : undefined
                          }
                        />
                      ) : (
                        <span className="text-[10px] text-[#80848e] opacity-0 group-hover:opacity-100 select-none pt-1 tabular-nums">
                          {formatAccurateTime(msg.createdAt, msg.timestamp)}
                        </span>
                      )}
                    </div>

                    {/* Message Body Column */}
                    <div className="min-w-0 flex-1">
                      {!isGrouped && (
                        <div className="flex items-center gap-1.5 flex-wrap leading-snug mb-0.5">
                          <span
                            onClick={
                              !isAiDm && msg.senderId !== 'all_broadcast'
                                ? () =>
                                    handleOpenSafeMemberProfile(
                                      {
                                        id: msg.senderId,
                                        name: msg.senderName,
                                        avatar: msg.senderAvatar,
                                        presenceStatus: activeFriend?.presenceStatus,
                                      },
                                      'Bạn bè 1-1'
                                    )
                                : undefined
                            }
                            className={`text-[14.5px] font-semibold ${
                              !isAiDm && msg.senderId !== 'all_broadcast' ? 'hover:underline cursor-pointer' : ''
                            } ${
                              isAiDm
                                ? 'text-[#5865f2] dark:text-[#949cf7]'
                                : isAdminSender
                                ? 'text-amber-600 dark:text-amber-400'
                                : isMe
                                ? 'text-[#23a559] dark:text-[#2dc770]'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {msg.senderName}
                          </span>

                          {isAiDm && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-[1px] rounded-[3px] bg-[#5865f2] text-white text-[9px] font-extrabold uppercase tracking-wide">
                              <Check className="w-2.5 h-2.5" />
                              <span>APP</span>
                            </span>
                          )}

                          {!isAiDm && isAdminSender && (
                            <span className="inline-flex items-center px-1 py-[1px] rounded-[3px] bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[9px] font-extrabold uppercase">
                              ADMIN
                            </span>
                          )}

                          {!isAiDm && <ClassificationSquare category={senderCat} />}

                          <span className="text-[11px] text-[#80848e] dark:text-[#949ba4] ml-0.5 tabular-nums">
                            {formatAccurateTime(msg.createdAt, msg.timestamp)}
                          </span>
                        </div>
                      )}

                      <div
                        className={`prose dark:prose-invert max-w-none text-[14px] leading-[1.45] break-words ${
                          isDark ? 'text-[#dbdee1]' : 'text-[#2e3338]'
                        }`}
                      >
                        <Markdown>{formatDolaMath(msg.content)}</Markdown>
                      </div>

                      {renderChallengeCard(msg.challengeId, false)}

                      {/* Inline Reply shortcut in Admin broadcast + Discord Reaction Pill */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {msg.reaction && (
                          <button
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, msg.reaction!)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] border border-[#5865f2]/40 bg-[#5865f2]/15 hover:bg-[#5865f2]/25 text-xs cursor-pointer transition-colors"
                            title="Bấm để gỡ cảm xúc"
                          >
                            <span>{msg.reaction}</span>
                            <span className="text-[11px] font-bold text-[#5865f2] dark:text-[#c9cdfb]">1</span>
                          </button>
                        )}
                        {activeFriendId === 'all_broadcast' && (
                          <button
                            type="button"
                            onClick={() =>
                              setReplyingTo({
                                id: msg.id,
                                senderName: msg.senderName,
                                content: msg.content,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5865f2] dark:text-[#949cf7] hover:underline cursor-pointer"
                          >
                            <Reply className="w-3 h-3" />
                            <span>Trả lời</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Discord Floating Hover Action Pill */}
                  <div
                    className={`hidden group-hover:flex items-center gap-0.5 absolute -top-3.5 right-4 p-0.5 rounded-[4px] border shadow-md text-xs z-20 ${
                      isDark ? 'bg-[#313338] border-[#1f2023]' : 'bg-white border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleReaction(msg.id, '👍')}
                      className="px-1.5 py-1 rounded-[3px] hover:bg-black/5 dark:hover:bg-[#404249] transition-colors cursor-pointer"
                      title="Thả 👍"
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleReaction(msg.id, '❤️')}
                      className="px-1.5 py-1 rounded-[3px] hover:bg-black/5 dark:hover:bg-[#404249] transition-colors cursor-pointer"
                      title="Thả ❤️"
                    >
                      ❤️
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setReplyingTo({
                          id: msg.id,
                          senderName: msg.senderName,
                          content: msg.content,
                        })
                      }
                      className="p-1.5 rounded-[3px] text-[#4e5058] dark:text-[#b5bac1] hover:text-[#5865f2] hover:bg-black/5 dark:hover:bg-[#404249] transition-colors cursor-pointer"
                      title="Trả lời trích dẫn"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator?.clipboard?.writeText(msg.content);
                        setToastMessage('Đã sao chép nội dung tin nhắn!');
                        setTimeout(() => setToastMessage(''), 2000);
                      }}
                      className="p-1.5 rounded-[3px] text-[#4e5058] dark:text-[#b5bac1] hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-[#404249] transition-colors cursor-pointer"
                      title="Sao chép tin nhắn"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            displayedGroupMsgs.map((msg, idx) => {
              const isMe = msg.senderId === activeUserId;
              const isAi = msg.isAi || msg.senderRole === 'ai_tutor';

              if (msg.isSystemNotice) {
                return (
                  <div
                    key={msg.id}
                    className={`mx-4 my-2 px-3 py-2 rounded-[4px] border-l-2 border-[#5865f2] text-xs flex items-center justify-between gap-2 ${
                      isDark ? 'bg-[#2b2d31]/80 text-[#b5bac1]' : 'bg-[#f2f3f5] text-slate-700'
                    }`}
                  >
                    <span className="font-medium">{msg.content}</span>
                    <span className="text-[10px] text-[#80848e] shrink-0 tabular-nums">
                      {formatAccurateTime(msg.createdAt, msg.timestamp)}
                    </span>
                  </div>
                );
              }

              const prev = idx > 0 ? displayedGroupMsgs[idx - 1] : null;
              const isGrouped = Boolean(
                prev &&
                  !prev.isSystemNotice &&
                  !msg.replyTo &&
                  !prev.challengeId &&
                  prev.senderId === msg.senderId &&
                  Math.abs((msg.createdAt || 0) - (prev.createdAt || 0)) < 5 * 60 * 1000
              );
              const isGrpAdmin =
                msg.senderRole === 'admin' || (activeGroup && activeGroup.createdBy === msg.senderId);
              const cat = getSenderCategory(
                { id: msg.senderId, name: msg.senderName, role: msg.senderRole },
                { isGroupAdmin: isGrpAdmin }
              );

              return (
                <div
                  key={msg.id}
                  className={`group relative px-4 py-[3px] transition-colors ${
                    isDark ? 'hover:bg-[#2e3035]' : 'hover:bg-[#f7f7f8]'
                  } ${isGrouped ? 'mt-0' : 'mt-3.5'}`}
                >
                  {/* Discord Reply Reference Spine */}
                  {msg.replyTo && (
                    <div className="flex items-center gap-1.5 mb-0.5 text-xs text-[#4e5058] dark:text-[#b5bac1]">
                      <div className="w-7 h-2.5 ml-[19px] mt-1.5 border-l-2 border-t-2 border-[#b5bac1] dark:border-[#4e5058] rounded-tl-[6px] shrink-0" />
                      <span className="font-semibold text-[#5865f2] dark:text-[#949cf7] shrink-0">
                        @{msg.replyTo.senderName}
                      </span>
                      <span className="truncate opacity-80">{msg.replyTo.content}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {/* Left 40px Avatar / Hover Timestamp Column */}
                    <div className="w-10 shrink-0 flex justify-center">
                      {!isGrouped ? (
                        <UserAvatarWithStatus
                          name={msg.senderName}
                          src={msg.senderAvatar}
                          presenceStatus={isMe ? userPresence : 'online'}
                          size="md"
                          onClick={
                            !isAi
                              ? () =>
                                  handleOpenSafeMemberProfile({
                                    id: msg.senderId,
                                    name: msg.senderName,
                                    avatar: msg.senderAvatar,
                                    role: msg.senderRole,
                                  })
                              : undefined
                          }
                        />
                      ) : (
                        <span className="text-[10px] text-[#80848e] opacity-0 group-hover:opacity-100 select-none pt-1 tabular-nums">
                          {formatAccurateTime(msg.createdAt, msg.timestamp)}
                        </span>
                      )}
                    </div>

                    {/* Message Body Column */}
                    <div className="min-w-0 flex-1">
                      {!isGrouped && (
                        <div className="flex items-center gap-1.5 flex-wrap leading-snug mb-0.5">
                          <span
                            onClick={
                              !isAi
                                ? () =>
                                    handleOpenSafeMemberProfile({
                                      id: msg.senderId,
                                      name: msg.senderName,
                                      avatar: msg.senderAvatar,
                                      role: msg.senderRole,
                                    })
                                : undefined
                            }
                            className={`text-[14.5px] font-semibold ${
                              !isAi ? 'hover:underline cursor-pointer' : ''
                            } ${
                              isAi
                                ? 'text-[#5865f2] dark:text-[#949cf7]'
                                : isGrpAdmin
                                ? 'text-blue-600 dark:text-sky-400'
                                : cat === 'teacher'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isMe
                                ? 'text-[#23a559] dark:text-[#2dc770]'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {msg.senderName}
                          </span>

                          {isAi && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-[1px] rounded-[3px] bg-[#5865f2] text-white text-[9px] font-extrabold uppercase tracking-wide">
                              <Check className="w-2.5 h-2.5" />
                              <span>APP</span>
                            </span>
                          )}

                          {!isAi && <ClassificationSquare category={cat} />}

                          <span className="text-[11px] text-[#80848e] dark:text-[#949ba4] ml-0.5 tabular-nums">
                            {formatAccurateTime(msg.createdAt, msg.timestamp)}
                          </span>
                        </div>
                      )}

                      <div
                        className={`prose dark:prose-invert max-w-none text-[14px] leading-[1.45] break-words ${
                          isDark ? 'text-[#dbdee1]' : 'text-[#2e3338]'
                        }`}
                      >
                        <Markdown>{formatDolaMath(msg.content)}</Markdown>
                      </div>

                      {renderChallengeCard(msg.challengeId, false)}

                      {msg.reaction && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, msg.reaction!)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] border border-[#5865f2]/40 bg-[#5865f2]/15 hover:bg-[#5865f2]/25 text-xs cursor-pointer transition-colors"
                            title="Bấm để gỡ cảm xúc"
                          >
                            <span>{msg.reaction}</span>
                            <span className="text-[11px] font-bold text-[#5865f2] dark:text-[#c9cdfb]">1</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Discord Floating Hover Action Pill */}
                  <div
                    className={`hidden group-hover:flex items-center gap-0.5 absolute -top-3.5 right-4 p-0.5 rounded-[4px] border shadow-md text-xs z-20 ${
                      isDark ? 'bg-[#313338] border-[#1f2023]' : 'bg-white border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleReaction(msg.id, '👍')}
                      className="px-1.5 py-1 rounded-[3px] hover:bg-black/5 dark:hover:bg-[#404249] transition-colors cursor-pointer"
                      title="Thả 👍"
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleReaction(msg.id, '❤️')}
                      className="px-1.5 py-1 rounded-[3px] hover:bg-black/5 dark:hover:bg-[#404249] transition-colors cursor-pointer"
                      title="Thả ❤️"
                    >
                      ❤️
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setReplyingTo({
                          id: msg.id,
                          senderName: msg.senderName,
                          content: msg.content,
                        })
                      }
                      className="p-1.5 rounded-[3px] text-[#4e5058] dark:text-[#b5bac1] hover:text-[#5865f2] hover:bg-black/5 dark:hover:bg-[#404249] transition-colors cursor-pointer"
                      title="Trả lời trích dẫn"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator?.clipboard?.writeText(msg.content);
                        setToastMessage('Đã sao chép tin nhắn!');
                        setTimeout(() => setToastMessage(''), 2000);
                      }}
                      className="p-1.5 rounded-[3px] text-[#4e5058] dark:text-[#b5bac1] hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-[#404249] transition-colors cursor-pointer"
                      title="Sao chép tin nhắn"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* DISCORD MESSAGE COMPOSER REGION */}
        <div className="px-4 pb-4 pt-1 relative shrink-0">
          {/* LIVE @MENTION POPOVER */}
          {mentionQuery !== null && mentionCandidates.length > 0 && (
            <div
              className={`absolute bottom-full left-4 right-4 mb-2 max-h-60 overflow-y-auto rounded-[8px] border shadow-2xl z-40 p-1.5 space-y-0.5 ${
                isDark
                  ? 'bg-[#2b2d31] border-[#1f2023] text-[#dbdee1]'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="px-2.5 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#949ba4] border-b border-black/10 dark:border-white/10 mb-1">
                <span>Tag Admin, Thành viên hoặc AI (@)</span>
                <span className="text-[#5865f2] dark:text-[#949cf7]">↑↓ Enter để chọn</span>
              </div>
              {mentionCandidates.map((cand, idx) => {
                const isSelected = idx === mentionActiveIdx;
                return (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => handleInsertMention(cand.name)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#5865f2] text-white'
                        : isDark
                        ? 'hover:bg-[#35373c] text-[#dbdee1]'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    {cand.avatar ? (
                      <img src={cand.avatar} alt={cand.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#5865f2]/20 text-[#5865f2] flex items-center justify-center text-[10px] font-bold shrink-0">
                        {cand.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">@{cand.name}</span>
                        {cand.isAdmin && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-black">
                            ADMIN
                          </span>
                        )}
                        {cand.isAi && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#5865f2] text-white font-black">
                            APP
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-[#949ba4]'}`}>
                        {cand.roleLabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick + Actions Menu */}
          {showComposerPlusMenu && (
            <div
              className={`absolute bottom-full left-4 mb-2 w-56 rounded-[6px] border shadow-xl z-40 p-1.5 space-y-1 text-xs ${
                isDark
                  ? 'bg-[#2b2d31] border-[#1f2023] text-[#dbdee1]'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setShowComposerPlusMenu(false);
                  const trimmed = inputMessage.trim();
                  if (!trimmed) setInputMessage('@Max10 AI ');
                  else if (!trimmed.toLowerCase().includes('@max10')) setInputMessage(`@Max10 AI ${trimmed}`);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[4px] hover:bg-[#5865f2] hover:text-white cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gọi @Max10 AI giải bài</span>
              </button>
              {!isRealAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowComposerPlusMenu(false);
                    const trimmed = inputMessage.trim();
                    if (!trimmed) setInputMessage('@Admin ');
                    else if (!trimmed.toLowerCase().includes('@admin')) setInputMessage(`@Admin ${trimmed}`);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[4px] hover:bg-[#5865f2] hover:text-white cursor-pointer transition-colors"
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Hỏi @Admin trực tiếp</span>
                </button>
              )}
              {!(activeMode === 'direct' && activeFriendId === 'all_broadcast') && (
                <button
                  type="button"
                  onClick={() => {
                    setShowComposerPlusMenu(false);
                    handleStartDuelWithMember(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[4px] hover:bg-[#248046] hover:text-white cursor-pointer transition-colors"
                >
                  <Swords className="w-4 h-4 text-[#23a559]" />
                  <span>Mở trận Thi đấu kiến thức</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowComposerPlusMenu(false);
                  handleSendQuickLike();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[4px] hover:bg-[#5865f2] hover:text-white cursor-pointer transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Gửi Like 👍 nhanh</span>
              </button>
            </div>
          )}

          {/* Quick Emoji Picker Drawer */}
          {showEmojiPicker && (
            <div
              className={`mb-2 px-3 py-2 rounded-[8px] border flex items-center gap-2 overflow-x-auto ${
                isDark ? 'bg-[#2b2d31] border-[#1f2023]' : 'bg-[#f2f3f5] border-slate-200'
              }`}
            >
              {['👍', '❤️', '😊', '🎉', '🔥', '📚', '📐', '🎯', '💯', '✨', '✍️', '🙏'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputMessage((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-base p-1 hover:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Quoted Replying Bar docked above composer */}
          {replyingTo && (
            <div
              className={`px-3 py-1.5 rounded-t-[8px] flex items-center justify-between text-xs border-b ${
                isDark
                  ? 'bg-[#2b2d31] border-[#1f2023] text-[#b5bac1]'
                  : 'bg-[#e3e5e8] border-slate-300/70 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Reply className="w-3.5 h-3.5 text-[#5865f2] shrink-0" />
                <span className="truncate">
                  Đang trả lời <strong className="text-slate-900 dark:text-white">@{replyingTo.senderName}</strong>:{' '}
                  <span className="opacity-80">"{replyingTo.content}"</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-0.5 rounded-full text-[#949ba4] hover:text-rose-500 cursor-pointer shrink-0"
                title="Hủy trả lời"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* DISCORD ROUNDED COMPOSER BAR */}
          <form
            onSubmit={handleSendMessage}
            className={`flex items-center gap-2 px-3 py-2 ${
              replyingTo ? 'rounded-b-[8px]' : 'rounded-[8px]'
            } ${isDark ? 'bg-[#383a40]' : 'bg-[#ebedef]'}`}
          >
            <button
              type="button"
              onClick={() => setShowComposerPlusMenu((prev) => !prev)}
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#b5bac1] text-[#313338] hover:bg-white'
                  : 'bg-[#4e5058] text-white hover:bg-slate-900'
              }`}
              title="Thêm tiện ích (@Max10 AI, @Admin, Thi đấu)"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>

            <input
              type="text"
              disabled={activeMode === 'direct' && isFriendBlocked}
              value={inputMessage}
              onChange={(e) => {
                const val = e.target.value;
                setInputMessage(val);
                const m = val.match(/(?:^|\s)@([^\s@]*)$/);
                if (m) {
                  setMentionQuery(m[1] || '');
                  setMentionActiveIdx(0);
                } else {
                  setMentionQuery(null);
                }
              }}
              onKeyDown={(e) => {
                if (mentionQuery !== null && mentionCandidates.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMentionActiveIdx((prev) => (prev + 1) % mentionCandidates.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMentionActiveIdx((prev) => (prev - 1 + mentionCandidates.length) % mentionCandidates.length);
                  } else if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    const chosen = mentionCandidates[mentionActiveIdx] || mentionCandidates[0];
                    if (chosen) handleInsertMention(chosen.name);
                  } else if (e.key === 'Escape') {
                    setMentionQuery(null);
                  }
                }
              }}
              placeholder={
                isAiReplying
                  ? 'Đang phản hồi...'
                  : activeMode === 'group'
                  ? `Nhắn tin tới #${
                      discordChannel === 'ai_tutor'
                        ? 'hoi-max10-ai'
                        : discordChannel === 'duel'
                        ? 'thi-dau-kien-thuc'
                        : 'chat-chung'
                    }`
                  : `Nhắn tin tới @${activeConversationTitle}`
              }
              className="flex-1 min-w-0 bg-transparent border-none text-xs sm:text-sm outline-none text-slate-900 dark:text-[#dbdee1] placeholder-[#6d6f78] dark:placeholder-[#87898c]"
            />

            {/* Quick @Admin & @Max10 AI chips */}
            {!isRealAdmin && (
              <button
                type="button"
                disabled={isAiReplying || (activeMode === 'direct' && isFriendBlocked)}
                onClick={() => {
                  const trimmed = inputMessage.trim();
                  if (!trimmed) setInputMessage('@Admin ');
                  else if (!trimmed.toLowerCase().includes('@admin') && !trimmed.toLowerCase().includes('@quản trị viên')) {
                    setInputMessage(`@Admin ${trimmed}`);
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 text-[11px] font-bold cursor-pointer shrink-0 disabled:opacity-50"
                title="Nhắn @Admin để hỏi Quản trị viên Max10"
              >
                <Crown className="w-3 h-3 text-amber-500" />
                <span>@Admin</span>
              </button>
            )}

            <button
              type="button"
              disabled={isAiReplying || (activeMode === 'direct' && isFriendBlocked)}
              onClick={() => {
                const trimmed = inputMessage.trim();
                if (!trimmed) setInputMessage('@Max10 AI ');
                else if (!trimmed.toLowerCase().includes('@max10')) setInputMessage(`@Max10 AI ${trimmed}`);
              }}
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-[#5865f2]/15 hover:bg-[#5865f2]/25 text-[#5865f2] dark:text-[#949cf7] text-[11px] font-bold cursor-pointer shrink-0 disabled:opacity-50"
              title="Gọi Gia sư @Max10 AI giải bài trực tiếp"
            >
              <Sparkles className="w-3 h-3" />
              <span>@Max10 AI</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 text-[#4e5058] dark:text-[#b5bac1] hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
              title="Chọn biểu tượng cảm xúc"
            >
              <Smile className="w-5 h-5" />
            </button>

            {inputMessage.trim() ? (
              <button
                type="submit"
                disabled={isSendingDm || isAiReplying}
                className="p-1.5 px-2.5 rounded-[4px] bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                title="Gửi tin nhắn"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendQuickLike}
                className="p-1 text-[#4e5058] dark:text-[#b5bac1] hover:text-[#5865f2] cursor-pointer shrink-0"
                title="Gửi Like 👍 nhanh"
              >
                <ThumbsUp className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
          </>
        )}
      </div>

      {/* 4. DISCORD RIGHT MEMBER LIST & INFO SIDEBAR */}
      {showRightDrawer && (
        <>
          <div
            onClick={() => setShowRightDrawer(false)}
            className="xl:hidden fixed inset-0 bg-black/45 z-30"
          />
          <aside
            className={`fixed inset-y-0 right-0 z-40 xl:static xl:z-auto w-[252px] border-l flex flex-col shrink-0 overflow-hidden select-none shadow-2xl xl:shadow-none ${
              isDark
                ? 'bg-[#2b2d31] border-[#1f2023] text-[#949ba4]'
                : 'bg-[#f2f3f5] border-slate-200 text-[#4e5058]'
            }`}
          >
            {/* Sidebar Header & Tabs */}
            <div
              className={`h-12 px-3 border-b flex items-center justify-between gap-2 shrink-0 ${
                isDark ? 'border-[#1f2023]' : 'border-slate-200/90'
              }`}
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRightDrawerTab('members')}
                  className={`px-2.5 py-1 rounded-[4px] text-xs font-bold transition-colors cursor-pointer ${
                    rightDrawerTab === 'members'
                      ? isDark
                        ? 'bg-[#404249] text-white'
                        : 'bg-[#d4d7dc] text-slate-900'
                      : 'hover:bg-black/5 dark:hover:bg-[#35373c]'
                  }`}
                >
                  Thành viên
                </button>
                <button
                  type="button"
                  onClick={() => setRightDrawerTab('files')}
                  className={`px-2.5 py-1 rounded-[4px] text-xs font-bold transition-colors cursor-pointer ${
                    rightDrawerTab === 'files'
                      ? isDark
                        ? 'bg-[#404249] text-white'
                        : 'bg-[#d4d7dc] text-slate-900'
                      : 'hover:bg-black/5 dark:hover:bg-[#35373c]'
                  }`}
                >
                  Tài liệu &amp; Cài đặt
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowRightDrawer(false)}
                className="p-1 rounded-[4px] hover:bg-black/10 dark:hover:bg-[#35373c] cursor-pointer"
                title="Đóng danh sách"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {rightDrawerTab === 'members' ? (
                activeMode === 'group' && activeGroup ? (
                  (() => {
                    const humanMembers = activeGroup.members.filter((m) => !isAiEntity(m));
                    const admins = humanMembers.filter(
                      (m) => m.role === 'admin' || activeGroup.createdBy === m.id
                    );
                    const teachers = humanMembers.filter(
                      (m) =>
                        m.role !== 'admin' &&
                        activeGroup.createdBy !== m.id &&
                        getSenderCategory(m) === 'teacher'
                    );
                    const others = humanMembers.filter(
                      (m) =>
                        m.role !== 'admin' &&
                        activeGroup.createdBy !== m.id &&
                        getSenderCategory(m) !== 'teacher'
                    );

                    const renderMemberGroup = (title: string, list: GroupMember[]) => {
                      if (list.length === 0) return null;
                      return (
                        <div className="space-y-1">
                          <div className="px-1.5 text-[11px] font-bold uppercase tracking-wider text-[#80848e] dark:text-[#949ba4]">
                            {title} — {list.length}
                          </div>
                          {list.map((member, mIdx) => {
                            const isGrpAdmin =
                              member.role === 'admin' || activeGroup.createdBy === member.id;
                            const cat = getSenderCategory(member, {
                              isGroupAdmin: isGrpAdmin,
                              isDirectFriend: isFriend(member.id),
                            });
                            return (
                              <div
                                key={`${member.id}-${mIdx}`}
                                onClick={() =>
                                  handleOpenSafeMemberProfile({
                                    id: member.id,
                                    name: member.name,
                                    avatar: member.avatar,
                                    role: member.role,
                                    school: member.school,
                                    presenceStatus: member.presenceStatus,
                                  })
                                }
                                className={`group flex items-center justify-between gap-2 px-2 py-1.5 rounded-[5px] cursor-pointer transition-colors ${
                                  isDark
                                    ? 'hover:bg-[#35373c] text-[#dbdee1]'
                                    : 'hover:bg-[#e3e5e8] text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <UserAvatarWithStatus
                                    name={member.name}
                                    src={member.avatar}
                                    presenceStatus={member.presenceStatus || 'online'}
                                    size="sm"
                                  />
                                  <div className="min-w-0">
                                    <div className="text-[13px] font-semibold truncate flex items-center gap-1">
                                      <span
                                        className={`truncate ${
                                          cat === 'admin'
                                            ? 'text-blue-500 dark:text-sky-400'
                                            : cat === 'teacher'
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : ''
                                        }`}
                                      >
                                        {member.name}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <ClassificationSquare category={cat} showLabel={false} size="sm" />
                              </div>
                            );
                          })}
                        </div>
                      );
                    };

                    return (
                      <>
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {activeGroup.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowAddMemberModal(true)}
                            className="text-[11px] font-bold text-[#5865f2] dark:text-[#949cf7] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Mời bạn</span>
                          </button>
                        </div>

                        {renderMemberGroup('Quản trị viên', admins)}
                        {renderMemberGroup('Giáo viên', teachers)}
                        {renderMemberGroup('Thành viên', others)}

                        {/* Bot Section */}
                        <div className="space-y-1">
                          <div className="px-1.5 text-[11px] font-bold uppercase tracking-wider text-[#80848e] dark:text-[#949ba4]">
                            Bot Học Tập — 1
                          </div>
                          <div
                            onClick={() => {
                              setDiscordChannel('ai_tutor');
                              if (!inputMessage.toLowerCase().includes('@max10')) {
                                setInputMessage('@Max10 AI ');
                              }
                            }}
                            className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-[5px] cursor-pointer transition-colors ${
                              isDark ? 'hover:bg-[#35373c] text-[#dbdee1]' : 'hover:bg-[#e3e5e8] text-slate-800'
                            }`}
                            title="Bấm để gọi @Max10 AI"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatarWithStatus
                                name="Max10 AI"
                                src="/max10-avatar.jpg"
                                presenceStatus="online"
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-[13px] font-semibold text-[#5865f2] dark:text-[#949cf7] truncate">
                                    Max10 AI
                                  </span>
                                  <span className="px-1 py-[1px] rounded-[3px] bg-[#5865f2] text-white text-[8px] font-extrabold">
                                    APP
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#949ba4] truncate">Gõ @Max10 AI để hỏi</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()
                ) : activeMode === 'direct' && activeFriend ? (
                  <div className="space-y-4">
                    <div
                      className={`p-3 rounded-[8px] border text-center space-y-2 ${
                        isDark ? 'bg-[#1e1f22] border-[#111214]' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="mx-auto inline-block">
                        <UserAvatarWithStatus
                          name={activeFriend.name}
                          src={activeFriend.avatar}
                          presenceStatus={activeFriend.presenceStatus || 'online'}
                          size="xl"
                          onClick={
                            activeFriend.id !== 'all_broadcast'
                              ? () =>
                                  handleOpenSafeMemberProfile(
                                    {
                                      id: activeFriend.id,
                                      name: activeFriend.name,
                                      avatar: activeFriend.avatar,
                                      role: (activeFriend as any).role,
                                      school: activeFriend.school,
                                      presenceStatus: activeFriend.presenceStatus,
                                    },
                                    'Bạn bè 1-1'
                                  )
                              : undefined
                          }
                        />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {activeConversationTitle}
                      </h3>
                      <p className="text-[11px] text-[#949ba4]">{activeConversationStatus}</p>

                      {activeFriend.id !== 'all_broadcast' && (
                        <div className="pt-1 flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenSafeMemberProfile(
                                {
                                  id: activeFriend.id,
                                  name: activeFriend.name,
                                  avatar: activeFriend.avatar,
                                  role: (activeFriend as any).role,
                                  school: activeFriend.school,
                                  presenceStatus: activeFriend.presenceStatus,
                                },
                                'Bạn bè 1-1'
                              )
                            }
                            className="w-full py-1.5 px-2.5 rounded-[4px] bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold cursor-pointer"
                          >
                            Xem hồ sơ công khai
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleStartDuelWithMember(
                                buildSafePublicProfile({
                                  id: activeFriend.id,
                                  name: activeFriend.name,
                                  avatar: activeFriend.avatar,
                                  role: (activeFriend as any).role,
                                  school: activeFriend.school,
                                  presenceStatus: activeFriend.presenceStatus,
                                  isFriend: isFriend(activeFriend.id),
                                })
                              )
                            }
                            className="w-full py-1.5 px-2.5 rounded-[4px] bg-[#248046] hover:bg-[#1a6334] text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Swords className="w-3.5 h-3.5" />
                            <span>Thách đấu kiến thức</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              ) : (
                <>
                  {/* Shared Media & Files Tabs */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <button
                        onClick={() => setSharedFilesTab('media')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-[4px] transition-colors cursor-pointer ${
                          sharedFilesTab === 'media'
                            ? 'bg-[#5865f2] text-white'
                            : 'hover:bg-black/5 dark:hover:bg-[#35373c]'
                        }`}
                      >
                        Hình ảnh (4)
                      </button>
                      <button
                        onClick={() => setSharedFilesTab('files')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-[4px] transition-colors cursor-pointer ${
                          sharedFilesTab === 'files'
                            ? 'bg-[#5865f2] text-white'
                            : 'hover:bg-black/5 dark:hover:bg-[#35373c]'
                        }`}
                      >
                        Tài liệu (3)
                      </button>
                    </div>

                    {sharedFilesTab === 'media' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="aspect-square rounded-[6px] bg-white dark:bg-[#1e1f22] border border-slate-200 dark:border-[#111214] flex flex-col items-center justify-center p-2 text-center text-[10px]">
                          <span className="text-xl mb-1">📐</span>
                          <span className="font-semibold line-clamp-1">Hinh_tron_O.png</span>
                        </div>
                        <div className="aspect-square rounded-[6px] bg-white dark:bg-[#1e1f22] border border-slate-200 dark:border-[#111214] flex flex-col items-center justify-center p-2 text-center text-[10px]">
                          <span className="text-xl mb-1">📝</span>
                          <span className="font-semibold line-clamp-1">So_do_tu_duy.jpg</span>
                        </div>
                        <div className="aspect-square rounded-[6px] bg-white dark:bg-[#1e1f22] border border-slate-200 dark:border-[#111214] flex flex-col items-center justify-center p-2 text-center text-[10px]">
                          <span className="text-xl mb-1">📊</span>
                          <span className="font-semibold line-clamp-1">Do_thi_ham_so.png</span>
                        </div>
                        <div className="aspect-square rounded-[6px] bg-white dark:bg-[#1e1f22] border border-slate-200 dark:border-[#111214] flex flex-col items-center justify-center p-2 text-center text-[10px]">
                          <span className="text-xl mb-1">🎓</span>
                          <span className="font-semibold line-clamp-1">De_thi_chuyen.jpg</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-[6px] bg-white dark:bg-[#1e1f22] border border-slate-200 dark:border-[#111214] flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-[#dbdee1] truncate">De_thi_thu_vao_10_2026.pdf</p>
                            <p className="text-[10px] text-[#949ba4]">1.4 MB · 19:30</p>
                          </div>
                          <Download className="w-4 h-4 text-[#5865f2] shrink-0 cursor-pointer" />
                        </div>
                        <div className="p-2.5 rounded-[6px] bg-white dark:bg-[#1e1f22] border border-slate-200 dark:border-[#111214] flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-[#dbdee1] truncate">De_cuong_Toan_chuong_3.docx</p>
                            <p className="text-[10px] text-[#949ba4]">520 KB · Hôm qua</p>
                          </div>
                          <Download className="w-4 h-4 text-[#5865f2] shrink-0 cursor-pointer" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Privacy & Settings */}
                  <div className="pt-2 border-t border-black/10 dark:border-[#35363c] space-y-2 text-xs">
                    {activeMode === 'direct' && activeFriend && activeFriend.id !== 'all_broadcast' ? (
                      <>
                        <button
                          onClick={() => handleToggleFriend(activeFriend)}
                          className="w-full py-2 px-3 rounded-[4px] border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UserMinus className="w-4 h-4" />
                          <span>Hủy kết bạn</span>
                        </button>
                        <button
                          onClick={() => setUserToBlock({ id: activeFriend.id, name: activeFriend.name })}
                          className="w-full py-2 px-3 rounded-[4px] border border-black/10 dark:border-[#35363c] hover:bg-black/5 dark:hover:bg-[#35373c] transition-colors font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Ban className="w-4 h-4 text-rose-500" />
                          <span>Chặn người này</span>
                        </button>
                      </>
                    ) : activeMode === 'group' && activeGroup ? (
                      <button
                        onClick={() => setGroupToDelete(activeGroup)}
                        className="w-full py-2 px-3 rounded-[4px] border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Xóa / Rời khỏi nhóm này</span>
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </aside>
        </>
      )}
      </div>

      {/* 5. VIDEO & AUDIO CALL MODAL WITH REAL CAMERA & MIC */}
      {callModal && (
        <VideoAudioCallModal
          isOpen={callModal.active}
          onClose={() => setCallModal(null)}
          callType={callModal.type}
          roomType={callModal.roomType}
          targetId={callModal.targetId}
          callerId={activeUserId}
          role="caller"
          targetName={callModal.targetName}
          targetAvatar={callModal.targetAvatar}
          targetBadge={callModal.targetBadge}
          participants={callModal.participants}
          userName={activeUserName}
          userAvatar={activeUserAvatar}
          isDark={isDark}
        />
      )}

      {/* MODAL 1: LUẬT NÓI CHUYỆN TRONG NHÓM CHAT (User Requested) */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-xl rounded-3xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } shadow-2xl overflow-hidden`}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Luật Khi Chat Trong Nhóm Học Tập</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Trường THCS Nguyễn Du & Hệ Thống Max10 AI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyRules}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Sao chép toàn bộ nội quy nhóm"
                >
                  {copiedRules ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Sao chép luật</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs sm:text-sm leading-relaxed">
              {/* Điều 1: Mục đích */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Điều 1: Mục đích & Tinh thần học tập</span>
                </h4>
                <p className="text-xs text-emerald-900 dark:text-emerald-200 mt-1">
                  Nhóm được lập ra để học sinh THCS cùng nhau học tập, hỏi đáp bài tập khó môn Toán, KHTN, Ngữ văn, Tin học và đồng hành cùng <strong>Trợ lý AI Max10</strong> để cùng nhau chinh phục điểm 10.
                </p>
              </div>

              {/* Điều 2: Mày - tao KHÔNG BỊ CẤM (User requirement) */}
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-400/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span>Điều 2: Quy định xưng hô thân mật (Mày - tao ĐƯỢC PHÉP)</span>
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 font-extrabold uppercase">
                    Không cấm
                  </span>
                </div>
                <p className="text-xs text-blue-900 dark:text-blue-200 mt-1">
                  Hệ thống tôn trọng cách nói chuyện tự nhiên giữa các bạn học sinh cùng trang lứa. Các cách xưng hô <strong>"mày", "tao", "chúng mày", "bọn tao" hoàn toàn HỢP LỆ và KHÔNG BỊ CẤM</strong> trong nhóm chat.
                </p>
              </div>

              {/* BẢNG SO SÁNH: ĐƯỢC PHÉP VS BỊ CẤM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 mb-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>TỪ NGỮ ĐƯỢC PHÉP</span>
                  </p>
                  <ul className="text-[11px] text-emerald-900 dark:text-emerald-200 space-y-0.5 list-disc list-inside">
                    <li>"Mày", "tao", "chúng mày", "bọn tao"</li>
                    <li>"Ê mày giải giúp tao câu 3b với"</li>
                    <li>"Bài này khó vãi / khó quá mày ơi"</li>
                  </ul>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800">
                  <p className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1 mb-1">
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    <span>TỪ NGỮ BỊ NGHIÊM CẤM</span>
                  </p>
                  <ul className="text-[11px] text-rose-900 dark:text-rose-200 space-y-0.5 list-disc list-inside">
                    <li>Chửi thề, văng tục thô tục, xúc phạm</li>
                    <li>Các từ tục tĩu (đm, lồn, cặc, vcl, buồi,...)</li>
                    <li>Lăng mạ danh dự bạn bè, thầy cô</li>
                  </ul>
                </div>
              </div>

              {/* Điều 3: Nói bậy & Chế tài xử phạt (User requirement: Nhắc nhở, cấm 5p - 1h) */}
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-400/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Điều 3: Nghiêm cấm nói bậy & Khung hình phạt tự động</span>
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 font-extrabold uppercase">
                    Cấm 5p - 1h
                  </span>
                </div>
                <div className="text-xs text-rose-950 dark:text-rose-200 space-y-2 mt-1.5">
                  <p>
                    Nghiêm cấm mọi hành vi nói tục, chửi thề, văng bậy thô tục hoặc lăng mạ bạn bè trong nhóm.
                  </p>
                  
                  {/* BẢNG KHUNG HÌNH PHẠT CHI TIẾT */}
                  <div className="p-3 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-rose-300 dark:border-rose-800 space-y-2">
                    <p className="font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <span>⚖️ BẢNG KHUNG XỬ PHẠT TỰ ĐỘNG KHI VI PHẠM:</span>
                    </p>
                    
                    <div className="space-y-1.5 text-[11px] sm:text-xs">
                      <div className="flex items-start gap-2 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                        <span className="font-extrabold text-amber-800 dark:text-amber-300 shrink-0">Lần 1:</span>
                        <div>
                          <span className="font-bold text-amber-900 dark:text-amber-200">Nhắc nhở & cảnh báo công khai</span> ngay trong đoạn chat để học sinh nhận thức và rút kinh nghiệm. Chưa khóa khung gửi tin.
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800">
                        <span className="font-extrabold text-rose-800 dark:text-rose-300 shrink-0">Lần 2:</span>
                        <div>
                          <span className="font-bold text-rose-900 dark:text-rose-100">CẤM CHAT TRONG 5 PHÚT (300 giây)</span>. Khung gửi tin nhắn bị khóa ngay lập tức và đếm ngược thời gian thực.
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800">
                        <span className="font-extrabold text-rose-800 dark:text-rose-300 shrink-0">Lần 3:</span>
                        <div>
                          <span className="font-bold text-rose-900 dark:text-rose-100">CẤM CHAT TRONG 15 PHÚT</span> do tái phạm lần thứ 2.
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800">
                        <span className="font-extrabold text-rose-800 dark:text-rose-300 shrink-0">Lần 4:</span>
                        <div>
                          <span className="font-bold text-rose-900 dark:text-rose-100">CẤM CHAT TRONG 30 PHÚT</span>.
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 border border-red-400 dark:border-red-800">
                        <span className="font-extrabold text-red-900 dark:text-red-200 shrink-0">Lần 5+:</span>
                        <div>
                          <span className="font-bold text-red-900 dark:text-red-100">CẤM CHAT NHIỀU NHẤT LÀ 1 GIỜ (60 PHÚT / 3600 GIÂY)</span>.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Điều 4: Không gian 100% người thật trò chuyện */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                <h4 className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Điều 4: Không gian 100% người thật trò chuyện (Không cho AI nhắn)</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                  Trong nhóm học tập, <strong>chỉ có bạn bè và học sinh người thật mới được nhắn tin</strong> trao đổi bài cùng nhau. Tuyệt đối không cho AI nhắn tin vào nhóm. Nếu muốn hỏi bài Max10 AI, các bạn vui lòng mở mục <strong>Trò chuyện Max10 AI riêng biệt</strong> nhé!
                </p>
              </div>

              {/* Điều 5: Giúp đỡ & Học tập văn minh */}
              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-500/30">
                <h4 className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Điều 5: Tinh thần giúp đỡ & Học tập văn minh</span>
                </h4>
                <p className="text-xs text-teal-900 dark:text-teal-200 mt-1">
                  Khuyến khích các thành viên chủ động giảng bài cho nhau. Không spam tin nhắn rác, không gửi đường dẫn độc hại, cùng nhau giữ gìn môi trường học tập THCS Nguyễn Du năng động và văn minh.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <button
                onClick={handleCopyRules}
                className="py-2 px-4 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedRules ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    <span>Đã sao chép nội quy</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Sao chép toàn bộ luật</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowRulesModal(false)}
                className="py-2.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                Tôi Đã Hiểu & Cam Kết Chấp Hành
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TẠO NHÓM CHAT MỚI / LẬP NHÓM LỚP CHỦ NHIỆM */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } shadow-2xl overflow-hidden`}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {isRealAdmin && newGroupMode === 'community'
                      ? 'Lập Cộng Đồng Mới (Chỉ Người Thật)'
                      : isVerifiedTeacherOrAdmin && newGroupMode === 'class_homeroom'
                      ? 'Lập Nhóm Lớp Mới & Sơ Đồ Chỗ Ngồi'
                      : 'Tạo Nhóm Trò Chuyện Học Tập Mới'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {isRealAdmin && newGroupMode === 'community'
                      ? 'Cộng đồng Trò chơi / Học tập cho nhiều tài khoản tham gia · Không có AI'
                      : isVerifiedTeacherOrAdmin && newGroupMode === 'class_homeroom'
                      ? 'Thầy/Cô tự đặt tên lớp, sĩ số học sinh & sơ đồ bàn học'
                      : 'Kết nối bạn bè và Trợ lý AI Điểm 10'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 space-y-4 overflow-y-auto">
              {isRealAdmin ? (
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setNewGroupMode('community');
                      setNewGroupIcon(newCommunityCategory === 'game' ? '🎮' : '📚');
                    }}
                    className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                      newGroupMode === 'community'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    🌐 Lập Cộng Đồng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewGroupMode('class_homeroom');
                      setNewGroupIcon('🏫');
                    }}
                    className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                      newGroupMode === 'class_homeroom'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    🏫 Nhóm Lớp
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewGroupMode('study');
                      setNewGroupIcon('📚');
                    }}
                    className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                      newGroupMode === 'study'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    📚 Nhóm Tự Do
                  </button>
                </div>
              ) : isVerifiedTeacherOrAdmin ? (
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setNewGroupMode('class_homeroom');
                      setNewGroupIcon('🏫');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      newGroupMode === 'class_homeroom'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    🏫 Lập Nhóm Lớp & Chỗ Ngồi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewGroupMode('study');
                      setNewGroupIcon('📚');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      newGroupMode === 'study'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    📚 Nhóm Học Tập Tự Do
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-500/25 text-[11px] text-blue-700 dark:text-blue-300">
                  🏫 Lưu ý: <strong>Nhóm Lớp chính thức</strong> (gồm học sinh, giáo viên chủ nhiệm và sơ đồ chỗ ngồi) chỉ xuất hiện khi có <strong>Thầy/Cô giáo</strong> lập lớp và đặt tên.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                  {isRealAdmin && newGroupMode === 'community'
                    ? 'Tên Cộng đồng do Admin đặt:'
                    : isVerifiedTeacherOrAdmin && newGroupMode === 'class_homeroom'
                    ? 'Tên nhóm lớp do Thầy/Cô đặt:'
                    : 'Tên nhóm học tập:'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isRealAdmin && newGroupMode === 'community'
                      ? 'VD: Cộng Đồng Đấu Trường Mini Game, CLB Học Giỏi Toán...'
                      : isVerifiedTeacherOrAdmin && newGroupMode === 'class_homeroom'
                      ? 'VD: Tập thể 9D1 - Chinh phục Điểm 10...'
                      : 'Ví dụ: Hội Luyện Đề Toán Chuyên 9A, Nhóm Học KHTN...'
                  }
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {isRealAdmin && newGroupMode === 'community' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                      Chủ đề Cộng đồng:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewCommunityCategory('study');
                          setNewGroupIcon('📚');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          newCommunityCategory === 'study'
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                            : isDark
                            ? 'border-zinc-700 text-zinc-300'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-sm font-black">📚 Học tập</div>
                        <div className="text-[11px] opacity-80 mt-0.5">Hỏi đáp Toán, Văn, Anh, KHTN...</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCommunityCategory('game');
                          setNewGroupIcon('🎮');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          newCommunityCategory === 'game'
                            ? 'border-purple-500 bg-purple-500/15 text-purple-600 dark:text-purple-300'
                            : isDark
                            ? 'border-zinc-700 text-zinc-300'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-sm font-black">🎮 Cộng đồng Game</div>
                        <div className="text-[11px] opacity-80 mt-0.5">Trò chơi điện tử Mobile, PC, Console, Web</div>
                      </button>
                    </div>
                  </div>

                  {newCommunityCategory === 'game' && (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                          Nền tảng Trò chơi:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {[
                            { id: 'Cross-Platform' as const, label: '🔄 Đa nền tảng' },
                            { id: 'Mobile' as const, label: '📱 Mobile' },
                            { id: 'PC' as const, label: '💻 PC / Steam' },
                            { id: 'Console' as const, label: '🕹️ Console' },
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setNewCommunityPlatform(p.id)}
                              className={`px-2.5 py-2 rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer ${
                                newCommunityPlatform === p.id
                                  ? 'border-purple-500 bg-purple-500/15 text-purple-600 dark:text-purple-300'
                                  : isDark
                                  ? 'border-zinc-700 text-zinc-300'
                                  : 'border-slate-200 text-slate-700'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                            Tên tựa Game:
                          </label>
                          <input
                            type="text"
                            placeholder="VD: Minecraft, Liên Quân, Valorant..."
                            value={newCommunityGameTitle}
                            onChange={(e) => setNewCommunityGameTitle(e.target.value)}
                            className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-hidden ${
                              isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                            Thể loại:
                          </label>
                          <input
                            type="text"
                            placeholder="VD: MOBA, FPS, Sandbox, RPG..."
                            value={newCommunityGenre}
                            onChange={(e) => setNewCommunityGenre(e.target.value)}
                            className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-hidden ${
                              isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>

                      <div className={`p-3 rounded-2xl border space-y-2 ${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-amber-800 dark:text-amber-200">
                          <input
                            type="checkbox"
                            checked={newCommunityPinTrending}
                            onChange={(e) => setNewCommunityPinTrending(e.target.checked)}
                            className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Ghim lên mục &ldquo;Trò chơi điện tử đang thịnh hành&rdquo;</span>
                        </label>
                        {newCommunityPinTrending && (
                          <div className="flex items-center gap-2 pl-6">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">Nhãn nổi bật:</span>
                            <select
                              value={newCommunityTrendingBadge}
                              onChange={(e) => setNewCommunityTrendingBadge(e.target.value)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border outline-hidden ${
                                isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-amber-300 text-slate-800'
                              }`}
                            >
                              <option value="Thịnh hành">Thịnh hành</option>
                              <option value="Hot Tuần Này">Hot Tuần Này</option>
                              <option value="Top Yêu Thích">Top Yêu Thích</option>
                              <option value="Giải đấu">Giải đấu</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                      Biểu tượng Cộng đồng:
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['🌐', '🎮', '📚', '🏆', '🧱', '🧊', '🎯', '📱', '💻', '🕹️', '♟️', '🔫', '⚽'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewGroupIcon(emoji)}
                          className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center transition-all cursor-pointer ${
                            newGroupIcon === emoji
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 scale-110'
                              : 'border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                      Mô tả Cộng đồng:
                    </label>
                    <input
                      type="text"
                      placeholder="Giới thiệu nội quy hoặc chủ đề cộng đồng..."
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-hidden ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-700 dark:text-emerald-300">
                    🌐 <strong>Mở cho nhiều tài khoản thật:</strong> Bất kỳ tài khoản nào đăng nhập đều có thể bấm nút Cộng đồng để vào giao lưu. Thành viên <strong>không chứa AI giả</strong>.
                  </div>
                </>
              ) : isVerifiedTeacherOrAdmin && newGroupMode === 'class_homeroom' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                        Chọn Lớp học (6A1 - 9D6):
                      </label>
                      <select
                        value={newClassCode}
                        onChange={(e) => setNewClassCode(e.target.value as ClassCode)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-hidden ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {ALL_CLASSES_LIST.map((code) => (
                          <option key={code} value={code}>
                            Lớp {code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                        Số lượng học sinh của lớp:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        required
                        value={newClassStudentCount}
                        onChange={(e) => setNewClassStudentCount(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border outline-hidden ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-2xl border space-y-2.5 ${isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                        🪑 Cấu hình Sơ đồ chỗ ngồi lớp {newClassCode}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        Tổng {newSeatingCols * newSeatingRows * newSeatsPerDesk} ghế
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold mb-1">Số dãy bàn:</label>
                        <select
                          value={newSeatingCols}
                          onChange={(e) => setNewSeatingCols(Number(e.target.value))}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold border outline-hidden ${
                            isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        >
                          {[2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n} dãy</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold mb-1">Số bàn / dãy:</label>
                        <select
                          value={newSeatingRows}
                          onChange={(e) => setNewSeatingRows(Number(e.target.value))}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold border outline-hidden ${
                            isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        >
                          {[3, 4, 5, 6, 7, 8].map((n) => (
                            <option key={n} value={n}>{n} bàn</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold mb-1">Chỗ / bàn:</label>
                        <select
                          value={newSeatsPerDesk}
                          onChange={(e) => setNewSeatsPerDesk(Number(e.target.value) as 1 | 2)}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold border outline-hidden ${
                            isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        >
                          <option value={2}>2 học sinh</option>
                          <option value={1}>1 học sinh</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-300">
                      👩‍🏫 Giáo viên chủ nhiệm: <strong>{activeUserName}</strong> · Sau khi lập nhóm, Thầy/Cô vào tab <strong>Quản lý lớp → Sơ đồ chỗ ngồi</strong> để xếp chỗ cho {newClassStudentCount} học sinh.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                        Khối lớp:
                      </label>
                      <select
                        value={newGroupGrade}
                        onChange={(e) => setNewGroupGrade(e.target.value as GradeLevel)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-hidden ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="Lớp 6">Lớp 6</option>
                        <option value="Lớp 7">Lớp 7</option>
                        <option value="Lớp 8">Lớp 8</option>
                        <option value="Lớp 9">Lớp 9</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                        Môn học trọng tâm:
                      </label>
                      <select
                        value={newGroupSubject}
                        onChange={(e) => setNewGroupSubject(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-hidden ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="Toán học">Toán học</option>
                        <option value="Khoa học Tự nhiên">Khoa học Tự nhiên</option>
                        <option value="Ngữ văn">Ngữ văn</option>
                        <option value="Tiếng Anh">Tiếng Anh</option>
                        <option value="Tin học và Công nghệ">Tin học và Công nghệ</option>
                        <option value="Tổng hợp">Tổng hợp các môn</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                      Biểu tượng nhóm (Emoji):
                    </label>
                    <div className="flex items-center gap-2">
                      {['🚀', '📚', '🔬', '💡', '🏆', '🎯', '🌟'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewGroupIcon(emoji)}
                          className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center transition-all ${
                            newGroupIcon === emoji
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 scale-110'
                              : 'border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                      Mô tả nhóm:
                    </label>
                    <input
                      type="text"
                      placeholder="Mục tiêu của nhóm..."
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-hidden ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* User requirement: "nhóm khi tạo chỉ bạn và bạn mới có thể thêm người vào" */}
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-300/40 text-xs">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newGroupOnlyAdminCanAdd}
                        onChange={(e) => setNewGroupOnlyAdminCanAdd(e.target.checked)}
                        className="mt-0.5 rounded border-blue-400 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-blue-900 dark:text-blue-200 block">
                          🔒 Chỉ bạn (Trưởng nhóm) mới có quyền thêm người vào nhóm
                        </span>
                        <span className="text-[11px] text-blue-700/80 dark:text-blue-300/80 block mt-0.5">
                          Ban đầu nhóm chỉ có bạn. Chỉ có bạn mới có quyền mời hoặc thêm bạn bè vào nhóm.
                        </span>
                      </div>
                    </label>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="py-2.5 px-4 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {isRealAdmin && newGroupMode === 'community'
                    ? '🌐 Lập Cộng Đồng Ngay'
                    : isVerifiedTeacherOrAdmin && newGroupMode === 'class_homeroom'
                    ? 'Lập Nhóm Lớp & Sơ Đồ Chỗ Ngồi'
                    : 'Tạo Nhóm Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DANH SÁCH THÀNH VIÊN NHÓM */}
      {showMembersModal && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } shadow-2xl overflow-hidden`}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  {activeGroup.isCommunity
                    ? 'Thành Viên Cộng Đồng (Chỉ Người Thật)'
                    : 'Thành Viên Trong Nhóm'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{activeGroup.name}</p>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Search Friends in Group Modal */}
            <div className="p-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Tìm bạn học theo tên hoặc trường..."
                  className={`w-full pl-8 pr-7 py-1.5 rounded-xl text-xs border outline-hidden transition-all ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
                {memberSearchQuery && (
                  <button
                    onClick={() => setMemberSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-2.5 max-h-80 overflow-y-auto">
              <ClassificationLegendBar isDark={isDark} className="mb-2.5" />

              {activeGroup.members
                .filter((member) => !isAiEntity(member))
                .filter((member) => {
                  if (!memberSearchQuery.trim()) return true;
                  const q = memberSearchQuery.toLowerCase().trim();
                  return (
                    member.name.toLowerCase().includes(q) ||
                    (member.school && member.school.toLowerCase().includes(q))
                  );
                })
                .map((member, mIdx) => {
                  const isGrpAdmin = member.role === 'admin' || (activeGroup && activeGroup.createdBy === member.id);
                  const isDirect = isFriend(member.id);
                  const cat = getSenderCategory(member, { isGroupAdmin: isGrpAdmin, isDirectFriend: isDirect });

                  return (
                    <div
                      key={`${member.id}-${mIdx}`}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">{member.name}</p>
                            {/* Kí hiệu hình vuông phân loại cạnh tên */}
                            <ClassificationSquare category={cat} />
                          </div>
                          <p className="text-[10px] text-slate-400">{member.school || 'THCS Nguyễn Du'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {member.id !== activeUserId && (
                        <button
                          onClick={() => handleToggleFriend(member)}
                          className={`px-2 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isFriend(member.id)
                              ? 'bg-emerald-100 hover:bg-rose-100 text-emerald-700 hover:text-rose-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                          }`}
                          title={isFriend(member.id) ? 'Bấm để hủy kết bạn' : 'Bấm để kết bạn'}
                        >
                          {isFriend(member.id) ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>Bạn bè</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              <span>+ Kết bạn</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {activeGroup.members
                .filter((member) => !isAiEntity(member))
                .filter((member) => {
                  if (!memberSearchQuery.trim()) return true;
                  const q = memberSearchQuery.toLowerCase().trim();
                  return (
                    member.name.toLowerCase().includes(q) ||
                    (member.school && member.school.toLowerCase().includes(q))
                  );
                }).length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">
                  Không tìm thấy bạn học nào khớp với "{memberSearchQuery}"
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center gap-2">
              {(activeGroup.createdBy === activeUserId || activeGroup.members.some(m => m.id === activeUserId && m.role === 'admin')) ? (
                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    setShowAddMemberModal(true);
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Thêm bạn bè vào nhóm</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    handleOpenFriendsModal('my_friends');
                  }}
                  className="py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Bạn bè ({friends.length})</span>
                </button>
              )}

              <button
                onClick={() => setShowMembersModal(false)}
                className="py-2 px-5 rounded-xl bg-slate-200 dark:bg-zinc-800 font-bold text-xs hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DANH SÁCH BẠN BÈ & TÌM KIẾM BẠN MỚI (User Requested) */}
      {showFriendsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } shadow-2xl overflow-hidden flex flex-col max-h-[85vh]`}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Tìm Bạn & Kết Nối Học Tập</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Kết nối bạn bè học tập · Gửi lời mời và trò chuyện trực tiếp</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFriendsModal(false);
                  setFriendSearchQuery('');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs: Tìm bạn mới & Lời mời kết bạn & Bạn bè của tôi */}
            <div className="p-2 px-4 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 bg-slate-50/50 dark:bg-zinc-850/50">
              <button
                onClick={() => setFriendsModalTab('find_friends')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  friendsModalTab === 'find_friends'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Tìm Bạn (Theo Tên)</span>
              </button>

              <button
                onClick={() => setFriendsModalTab('requests')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
                  friendsModalTab === 'requests'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Lời Mời</span>
                {friendRequests.incoming.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0 animate-pulse">
                    {friendRequests.incoming.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFriendsModalTab('my_friends')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  friendsModalTab === 'my_friends'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Bạn Bè ({friends.length})</span>
              </button>

              <button
                onClick={() => setFriendsModalTab('blocked')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  friendsModalTab === 'blocked'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
                }`}
                title="Quản lý những người đã bị chặn"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Đã Chặn ({blockedUsers.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {/* Bảng kí hiệu hình vuông phân loại trực quan */}
              <ClassificationLegendBar isDark={isDark} className="mb-2.5" />

              {/* TAB 1: TÌM BẠN MỚI (CHỈ CẦN TÊN TÌM PHÁT CÓ LUÔN - KHÔNG HỎI LỚP) */}
              {friendsModalTab === 'find_friends' && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Không cần phải hỏi lớp!</strong> Nhập tên bạn bè để tìm và gửi lời mời kết bạn ngay.
                    </span>
                  </div>

                  {/* Search by Name Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Tìm bạn học theo tên:
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={friendSearchQuery}
                        onChange={(e) => setFriendSearchQuery(e.target.value)}
                        placeholder="Gõ tên bạn bè để tìm kiếm..."
                        className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs border outline-hidden transition-all ${
                          isDark
                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                        }`}
                      />
                      {friendSearchQuery && (
                        <button
                          onClick={() => setFriendSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List of matching student accounts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                        {friendSearchQuery.trim()
                          ? `Kết quả tìm kiếm cho "${friendSearchQuery}" (${availableUsers.length}):`
                          : `Tài khoản đã đăng ký (${availableUsers.length}):`}
                      </span>
                      {isLoadingUsers && (
                        <span className="text-[10px] text-blue-500 animate-pulse font-semibold">Đang tìm...</span>
                      )}
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                      {availableUsers.map((user, uIdx) => {
                        const alreadyFriend = isFriend(user.id);
                        const incomingReq = getIncomingRequest(user.id);
                        const outgoingSent = hasSentRequest(user.id);
                        const userCat = getSenderCategory(user, { isDirectFriend: alreadyFriend });

                        return (
                          <div
                            key={`${user.id}-${uIdx}`}
                            className={`p-3 rounded-2xl border text-xs transition-all flex items-center justify-between ${
                              alreadyFriend
                                ? 'bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-750'
                                : incomingReq
                                ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/50'
                                : 'bg-white dark:bg-zinc-850 border-slate-200 dark:border-zinc-700 hover:border-blue-400 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatarWithStatus
                                name={user.name}
                                src={user.avatar}
                                presenceStatus={user.presenceStatus || 'online'}
                                size="md"
                                onClick={() =>
                                  handleOpenSafeMemberProfile(
                                    {
                                      id: user.id,
                                      name: user.name,
                                      avatar: user.avatar,
                                      role: user.role,
                                      school: user.schoolName || user.school,
                                      grade: user.grade,
                                      presenceStatus: user.presenceStatus,
                                    },
                                    'Tìm bạn & Kết nối'
                                  )
                                }
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                                    {user.name}
                                  </p>
                                  {/* Kí hiệu hình vuông phân loại cạnh tên khi kết bạn online */}
                                  <ClassificationSquare category={userCat} />
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {user.schoolName || user.school || (user.grade ? `Học sinh ${user.grade}` : 'Thành viên Max10')}
                                </p>
                              </div>
                            </div>

                            {/* Actions for this user */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {alreadyFriend ? (
                                <button
                                  onClick={() => {
                                    setActiveFriendId(user.id);
                                    setActiveMode('direct');
                                    setShowFriendsModal(false);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-emerald-200"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Nhắn tin</span>
                                </button>
                              ) : incomingReq ? (
                                // Incoming request from this user: CHẤP NHẬN or TỪ CHỐI
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleRespondFriendRequest(incomingReq, 'accept')}
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                                    title="Đồng ý kết bạn"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Đồng ý</span>
                                  </button>
                                  <button
                                    onClick={() => handleRespondFriendRequest(incomingReq, 'decline')}
                                    className="px-2 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 dark:bg-zinc-700 dark:hover:bg-rose-950 text-xs font-semibold cursor-pointer"
                                    title="Từ chối kết bạn"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Từ chối</span>
                                  </button>
                                </div>
                              ) : outgoingSent ? (
                                // Already sent pending request -> Option to cancel
                                <button
                                  onClick={() => handleCancelFriendRequest('', user.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-rose-100 text-amber-800 hover:text-rose-700 dark:bg-amber-950/80 dark:text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Bấm để hủy lời mời kết bạn"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Đã gửi (Hủy)</span>
                                </button>
                              ) : (
                                // Send Friend Request button
                                <button
                                  onClick={() => handleSendFriendRequest(user)}
                                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>Gửi lời kết bạn</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {availableUsers.length === 0 && !isLoadingUsers && (
                        <div className="p-6 text-center text-xs text-slate-500 dark:text-zinc-400 bg-slate-50/70 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 space-y-1.5">
                          <p className="font-bold text-slate-800 dark:text-zinc-200">
                            {friendSearchQuery.trim()
                              ? `Không có bạn học nào trùng tên "${friendSearchQuery}"`
                              : 'Chưa có bạn học nào khác đang trực tuyến'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                            Bạn có thể gõ trực tiếp tên bạn bè vào ô bên dưới để gửi lời kết bạn và nhắn tin riêng ngay!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Add Custom Friend by Name */}
                  <form
                    onSubmit={handleAddCustomFriendByName}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 space-y-2"
                  >
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                      Gửi lời kết bạn nhanh bằng tên:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={newFriendName}
                        onChange={(e) => setNewFriendName(e.target.value)}
                        placeholder="Nhập họ tên bạn bè (vd: Đức Quỳnh, Mai Anh...)"
                        className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-hidden ${
                          isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={!newFriendName.trim()}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Gửi lời kết bạn</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: LỜI MỜI KẾT BẠN (BÊN CÓ LỜI MỜI THÌ ĐỒNG Ý HAY TỪ CHỐI) */}
              {friendsModalTab === 'requests' && (
                <div className="space-y-4">
                  {/* INCOMING REQUESTS */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Bell className="w-4 h-4 text-rose-500" />
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Lời Mời Kết Bạn Đã Nhận ({friendRequests.incoming.length}):
                      </h4>
                    </div>

                    {friendRequests.incoming.length > 0 ? (
                      <div className="space-y-2">
                        {friendRequests.incoming.map((req) => {
                          const reqCat = getSenderCategory({ id: req.fromUserId, name: req.fromUserName });
                          return (
                          <div
                            key={req.id}
                            className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-zinc-800 dark:to-zinc-850 border border-blue-200 dark:border-blue-900/60 shadow-xs flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <UserAvatarWithStatus
                                name={req.fromUserName}
                                src={req.fromUserAvatar}
                                presenceStatus="online"
                                size="md"
                                onClick={() =>
                                  handleOpenSafeMemberProfile(
                                    {
                                      id: req.fromUserId,
                                      name: req.fromUserName,
                                      avatar: req.fromUserAvatar,
                                    },
                                    'Lời mời kết bạn'
                                  )
                                }
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-black text-sm text-slate-900 dark:text-white truncate">
                                    {req.fromUserName}
                                  </p>
                                  {/* Kí hiệu hình vuông phân loại cạnh tên */}
                                  <ClassificationSquare category={reqCat} />
                                </div>
                                <p className="text-[11px] text-blue-600 dark:text-blue-300 font-semibold mt-0.5">
                                  Muốn kết bạn với bạn · {req.createdAt}
                                </p>
                              </div>
                            </div>

                            {/* 2 NÚT TO RÕ: ĐỒNG Ý HOẶC TỪ CHỐI */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleRespondFriendRequest(req, 'accept')}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                title="Đồng ý kết bạn"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Đồng ý</span>
                              </button>

                              <button
                                onClick={() => handleRespondFriendRequest(req, 'decline')}
                                className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 dark:bg-zinc-700 dark:hover:bg-rose-950 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                title="Từ chối lời mời"
                              >
                                <X className="w-4 h-4" />
                                <span>Từ chối</span>
                              </button>
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/60 dark:border-zinc-800 text-center space-y-1">
                        <Check className="w-6 h-6 mx-auto text-emerald-500" />
                        <p className="font-bold text-xs text-slate-700 dark:text-zinc-300">
                          Chưa có lời mời kết bạn nào đang chờ
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Khi có bạn học gửi lời kết bạn, bạn có thể chọn Đồng ý hoặc Từ chối tại đây.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* OUTGOING REQUESTS */}
                  {friendRequests.outgoing.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <h4 className="font-bold text-xs text-slate-700 dark:text-zinc-300">
                          Lời Mời Bạn Đã Gửi Đi ({friendRequests.outgoing.length}):
                        </h4>
                      </div>

                      <div className="space-y-2">
                        {friendRequests.outgoing.map((req) => {
                          const toCat = getSenderCategory({ id: req.toUserId, name: req.toUserName });
                          return (
                          <div
                            key={req.id}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-750 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {req.toUserAvatar ? (
                                <img
                                  src={req.toUserAvatar}
                                  alt={req.toUserName}
                                  className="w-9 h-9 rounded-full object-cover shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-slate-300 dark:bg-zinc-700 font-bold flex items-center justify-center shrink-0">
                                  {req.toUserName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                                    {req.toUserName}
                                  </p>
                                  {/* Kí hiệu hình vuông phân loại cạnh tên */}
                                  <ClassificationSquare category={toCat} />
                                </div>
                                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                  Đang chờ bạn ấy đồng ý... ({req.createdAt})
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleCancelFriendRequest(req.id, req.toUserId)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-700 dark:bg-zinc-700 text-xs font-semibold cursor-pointer"
                            >
                              Hủy lời mời
                            </button>
                          </div>
                        );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: BẠN BÈ CỦA TÔI */}
              {friendsModalTab === 'my_friends' && (
                <div className="space-y-2">
                  {friends
                    .filter((f) => {
                      if (!friendSearchQuery.trim()) return true;
                      const q = friendSearchQuery.toLowerCase().trim();
                      return f.name.toLowerCase().includes(q);
                    })
                    .map((friend, fIdx) => {
                      const friendCat = getSenderCategory(friend, { isDirectFriend: true });
                      return (
                      <div
                        key={`${friend.id}-${fIdx}`}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatarWithStatus
                            name={friend.name}
                            src={friend.avatar}
                            presenceStatus={friend.presenceStatus || 'online'}
                            size="md"
                            onClick={() =>
                              handleOpenSafeMemberProfile(
                                {
                                  id: friend.id,
                                  name: friend.name,
                                  avatar: friend.avatar,
                                  role: 'friend',
                                  school: friend.school,
                                  presenceStatus: friend.presenceStatus,
                                },
                                'Danh sách Bạn bè'
                              )
                            }
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">{friend.name}</p>
                              {/* Kí hiệu hình vuông phân loại cạnh tên bạn bè */}
                              <ClassificationSquare category={friendCat} />
                            </div>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Bạn bè · Bấm ảnh đại diện để xem hồ sơ &amp; thi đấu
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setShowFriendsModal(false);
                              handleStartDuelWithMember(
                                buildSafePublicProfile({
                                  id: friend.id,
                                  name: friend.name,
                                  avatar: friend.avatar,
                                  school: friend.school,
                                  presenceStatus: friend.presenceStatus,
                                  isFriend: true,
                                })
                              );
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Thách đấu bạn bè 1-1"
                          >
                            <Swords className="w-3.5 h-3.5" />
                            <span>Thi đấu</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveFriendId(friend.id);
                              setActiveMode('direct');
                              setShowFriendsModal(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Nhắn tin riêng 1-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Nhắn tin</span>
                          </button>
                          <button
                            onClick={() => handleToggleFriend(friend)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 dark:bg-zinc-750 dark:hover:bg-rose-950 font-semibold text-xs cursor-pointer"
                            title="Hủy kết bạn"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Hủy</span>
                          </button>
                        </div>
                      </div>
                    );
                    })}

                  {friends.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Chưa có bạn bè nào</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 mb-3">
                        Bạn chưa kết bạn với ai. Hãy chuyển sang tab "Tìm Bạn (Theo Tên)" để kết nối ngay nhé!
                      </p>
                      <button
                        onClick={() => setFriendsModalTab('find_friends')}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Khám phá bạn học ngay
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DANH SÁCH NGƯỜI ĐÃ CHẶN (User Requested Plugin) */}
              {friendsModalTab === 'blocked' && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
                    <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Danh sách chặn:</strong> Những người bạn đã chặn sẽ không thể gửi tin nhắn hoặc kết bạn với bạn. Bấm <strong>&quot;Bỏ chặn&quot;</strong> bất cứ lúc nào để tiếp tục trò chuyện.
                    </span>
                  </div>

                  {blockedUsers.map((b) => (
                    <div
                      key={b.userId}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {b.avatar ? (
                          <img
                            src={b.avatar}
                            alt={b.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 grayscale"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-400 text-white font-bold flex items-center justify-center shrink-0">
                            {b.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">{b.name}</p>
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                            Đã chặn · {b.blockedAt}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnblock(b.userId, b.name)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                        title="Bỏ chặn người này"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Bỏ chặn</span>
                      </button>
                    </div>
                  ))}

                  {blockedUsers.length === 0 && (
                    <div className="text-center py-8">
                      <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Không có ai trong danh sách chặn</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                        Khi cần chặn ai đó, bấm biểu tượng Chặn 🚫 ở đầu tin nhắn riêng hoặc menu bạn bè.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 px-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-850/50">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                {friendsModalTab === 'my_friends'
                  ? `Đang có ${friends.length} bạn học đã kết nối`
                  : friendsModalTab === 'blocked'
                  ? `Đang chặn ${blockedUsers.length} tài khoản`
                  : 'Kết nối thêm bạn để cùng giải đề và săn điểm 10'}
              </span>
              <button
                onClick={() => {
                  setShowFriendsModal(false);
                  setFriendSearchQuery('');
                }}
                className="py-1.5 px-4 rounded-xl bg-slate-200 dark:bg-zinc-800 font-bold text-xs hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HỦY KẾT BẠN (User Requested) */}
      {userToUnfriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-sm rounded-3xl border p-5 shadow-2xl ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <UserMinus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-center mb-1">
              Hủy kết bạn với {userToUnfriend.name}?
            </h3>
            <p className="text-xs text-center text-slate-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Sau khi hủy kết bạn, hai bạn sẽ không thể nhắn tin riêng 1-1 nữa. Bạn có chắc chắn muốn hủy không?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setUserToUnfriend(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Không, giữ bạn
              </button>
              <button
                onClick={() => handleConfirmUnfriend(userToUnfriend.id, userToUnfriend.name)}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>Hủy kết bạn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN CHẶN NGƯỜI DÙNG (User Requested) */}
      {userToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-sm rounded-3xl border p-5 shadow-2xl ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Ban className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-center mb-1 text-rose-600">
              Chặn {userToBlock.name}?
            </h3>
            <p className="text-xs text-center text-slate-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Khi chặn <strong>{userToBlock.name}</strong>: người này sẽ bị xóa khỏi danh sách bạn bè, không thể gửi tin nhắn cho bạn và không thể gửi lời mời kết bạn. Bạn có thể bỏ chặn bất kỳ lúc nào.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setUserToBlock(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleConfirmBlock(userToBlock.id, userToBlock.name)}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Xác nhận chặn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: XÁC NHẬN XÓA NHÓM NHƯ MESSENGER (User Requested) */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-sm rounded-3xl border p-5 shadow-2xl ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-center mb-1">
              Xóa cuộc trò chuyện nhóm này?
            </h3>
            <p className="text-xs text-center text-slate-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Bạn có chắc muốn xóa nhóm <strong>"{groupToDelete.name}"</strong> không? Nhóm và tin nhắn sẽ được gỡ bỏ ngay lập tức tương tự như trên Messenger.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setGroupToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteGroup(groupToDelete.id)}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa nhóm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: THÊM BẠN BÈ VÀO NHÓM (Chỉ trưởng nhóm mới có quyền - Chuẩn Zalo) */}
      {showAddMemberModal && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } shadow-2xl overflow-hidden flex flex-col max-h-[85vh]`}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-1.5">
                    <span>Thêm Bạn Bè Vào Nhóm</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black">
                      Quyền Trưởng Nhóm
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Nhóm: <strong>{activeGroup.name}</strong> · Chỉ bạn mới có thể thêm người vào nhóm
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setAddMemberSearchQuery('');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input in Add Member Modal */}
            <div className="p-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={addMemberSearchQuery}
                  onChange={(e) => setAddMemberSearchQuery(e.target.value)}
                  placeholder="Tìm bạn bè theo tên, trường lớp hoặc số điện thoại..."
                  className={`w-full pl-8 pr-7 py-2 rounded-xl text-xs border outline-hidden transition-all ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white'
                  }`}
                />
                {addMemberSearchQuery && (
                  <button
                    onClick={() => setAddMemberSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List of Friends to Add */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 px-1 mb-1">
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  Danh sách bạn bè ({friends.length})
                </span>
                <span className="text-[10px]">
                  Đã trong nhóm: {activeGroup.members.length} người
                </span>
              </div>

                {/* Direct Add or Quick Suggestions when search input has text */}
                {addMemberSearchQuery.trim() && (
                  <div className="p-3 mb-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-emerald-900 dark:text-emerald-200 truncate">
                        Thêm: <strong>"{addMemberSearchQuery.trim()}"</strong>
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
                        Thêm bạn học này vào nhóm ngay và kích hoạt quyền nhắn tin trò chuyện!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleAddMemberToGroup({
                          id: 'user-classmate-' + Date.now(),
                          name: addMemberSearchQuery.trim(),
                          school: 'THCS Nguyễn Du',
                        });
                        setAddMemberSearchQuery('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs flex items-center gap-1 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm & Nhắn tin</span>
                    </button>
                  </div>
                )}

                {/* Quick Classmate Suggestions from THCS Nguyễn Du */}
                <div className="mb-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Gợi ý bạn cùng khóa THCS Nguyễn Du (Bấm thêm để cùng nhắn tin):</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { name: 'Nguyễn Hoàng Nam', school: 'Lớp 9A1 · THCS Nguyễn Du', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' },
                      { name: 'Trần Bảo Ngọc', school: 'Lớp 9A2 · THCS Nguyễn Du', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80' },
                      { name: 'Lê Minh Khôi', school: 'Lớp 9A1 · THCS Nguyễn Du', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
                      { name: 'Vũ Thảo Linh', school: 'Lớp 9A3 · THCS Nguyễn Du', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
                    ].map((sug) => {
                      const isAdded = activeGroup.members.some((m) => m.name.toLowerCase().includes(sug.name.toLowerCase()));
                      return (
                        <div
                          key={sug.name}
                          className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-700/80 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={sug.avatar}
                              alt={sug.name}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <p className="font-bold text-[11px] truncate text-slate-800 dark:text-zinc-200">{sug.name}</p>
                                <ClassificationSquare category="student" />
                              </div>
                              <p className="text-[9px] text-slate-400 truncate">{sug.school}</p>
                            </div>
                          </div>
                          {isAdded ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 shrink-0">
                              <Check className="w-3 h-3" /> Đã vào
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddMemberToGroup({ id: 'sug-' + sug.name.toLowerCase().replace(/\s+/g, '-'), name: sug.name, school: sug.school, avatar: sug.avatar })}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shrink-0 cursor-pointer shadow-2xs"
                            >
                              + Thêm
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {friends.length === 0 ? (
                  <div className="text-center py-5 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 space-y-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Gõ tên bạn bè vào ô tìm kiếm ở trên để thêm trực tiếp vào nhóm!
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Mọi thành viên sau khi được thêm đều có thể nhắn tin và trò chuyện tự do trong nhóm.
                    </p>
                  </div>
                ) : (
                  friends
                    .filter((friend) => {
                      if (!addMemberSearchQuery.trim()) return true;
                      const q = addMemberSearchQuery.toLowerCase().trim();
                      return (
                        friend.name.toLowerCase().includes(q) ||
                        (friend.school && friend.school.toLowerCase().includes(q))
                      );
                    })
                    .map((friend) => {
                      const isAlreadyInGroup = activeGroup.members.some((m) => m.id === friend.id);
                      const friendCat = getSenderCategory(friend, { isDirectFriend: true });

                      return (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60 text-xs transition-all hover:border-emerald-500/40"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {friend.avatar ? (
                              <img
                                src={friend.avatar}
                                alt={friend.name}
                                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-zinc-700"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                                {friend.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                                  {friend.name}
                                </p>
                                <ClassificationSquare category={friendCat} />
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {friend.school || 'THCS Nguyễn Du'} · Bạn bè
                              </p>
                            </div>
                          </div>

                          {isAlreadyInGroup ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 shrink-0">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Đã trong nhóm</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddMemberToGroup(friend)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Thêm vào nhóm</span>
                            </button>
                          )}
                        </div>
                      );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-850/50">
              <button
                type="button"
                onClick={() => {
                  setShowAddMemberModal(false);
                  handleOpenFriendsModal('find_friends');
                }}
                className="py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tìm thêm bạn bè mới</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddMemberModal(false);
                  setAddMemberSearchQuery('');
                }}
                className="py-2 px-5 rounded-xl bg-slate-200 dark:bg-zinc-800 font-bold text-xs hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: TÌM KIẾM NHÓM NHƯ ZALO (User Requested: "hoặc tìm nhóm như zalo") */}
      {showSearchGroupsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-xl rounded-3xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } shadow-2xl overflow-hidden flex flex-col max-h-[85vh]`}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-1.5">
                    <span>Tìm Kiếm Nhóm Học Tập</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-black">
                      Khám Phá Nhóm
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Tìm nhóm học tập theo tên môn học, lớp hoặc nhập Mã nhóm (#TOAN9, #MAX10-...)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSearchGroupsModal(false);
                  setGroupSearchQuery('');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  placeholder="Nhập tên nhóm, môn học (Toán, Văn, Anh...) hoặc mã nhóm (#TOAN9)..."
                  className={`w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs sm:text-sm border outline-hidden transition-all ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
                  }`}
                />
                {groupSearchQuery && (
                  <button
                    onClick={() => setGroupSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Filter Tags */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-0.5">
                <span className="text-[11px] font-semibold text-slate-400 shrink-0">Gợi ý tìm:</span>
                {['Tất cả', 'Toán học', 'Ngữ văn', 'Tiếng Anh', 'KHTN', 'Lớp 9', 'Chuyên'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setGroupSearchQuery(tag === 'Tất cả' ? '' : tag)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                      (tag === 'Tất cả' && !groupSearchQuery) || groupSearchQuery === tag
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Groups Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(() => {
                // Merge unique groups from server and local
                const map = new Map<string, ChatGroup>();
                serverGroups.forEach((g) => map.set(g.id, g));
                groups.forEach((g) => map.set(g.id, g));
                const allGroups = Array.from(map.values());

                const filtered = allGroups.filter((g) => {
                  if (!groupSearchQuery.trim()) return true;
                  const q = groupSearchQuery.toLowerCase().trim();
                  return (
                    (g.name && g.name.toLowerCase().includes(q)) ||
                    (g.code && g.code.toLowerCase().includes(q)) ||
                    (g.subject && g.subject.toLowerCase().includes(q)) ||
                    (g.description && g.description.toLowerCase().includes(q)) ||
                    (g.grade && g.grade.toLowerCase().includes(q))
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
                        <Compass className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          Không tìm thấy nhóm nào khớp với "{groupSearchQuery}"
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                          Hãy thử tìm bằng từ khóa khác hoặc bạn có thể tự tạo nhóm mới ngay!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSearchGroupsModal(false);
                          setShowCreateGroupModal(true);
                        }}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tạo nhóm học tập mới</span>
                      </button>
                    </div>
                  );
                }

                return filtered.map((grp) => {
                  const isMember = grp.members.some((m) => m.id === activeUserId);
                  const isCreator = grp.createdBy === activeUserId;

                  return (
                    <div
                      key={grp.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-blue-500/40 hover:shadow-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                          {grp.avatarIcon || '📚'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                              {grp.name}
                            </h4>
                            {grp.code && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-black">
                                #{grp.code}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-[10px] font-bold">
                              {grp.grade}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                            {grp.description || 'Nhóm học tập và trao đổi bài'}
                          </p>

                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 dark:text-zinc-400 flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              <BookOpen className="w-3 h-3" />
                              {grp.subject || 'Tổng hợp'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-blue-500" />
                              {grp.members.length} thành viên
                            </span>
                            {grp.onlyAdminCanAdd && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-medium">
                                🔒 Chỉ trưởng nhóm thêm người
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {isMember ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveGroupId(grp.id);
                              setActiveMode('group');
                              setSidebarTab('groups');
                              setShowSearchGroupsModal(false);
                            }}
                            className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Vào nhóm chat</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleJoinGroup(grp)}
                            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Tham gia nhóm</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-850/50">
              <button
                type="button"
                onClick={() => {
                  setShowSearchGroupsModal(false);
                  setShowCreateGroupModal(true);
                }}
                className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tạo nhóm học tập mới</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSearchGroupsModal(false);
                  setGroupSearchQuery('');
                }}
                className="py-2 px-5 rounded-xl bg-slate-200 dark:bg-zinc-800 font-bold text-xs hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN QUẢN LÝ & CHỈNH SỬA CỘNG ĐỒNG */}
      {editingCommunity && isRealAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } shadow-2xl overflow-hidden`}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Quản lý &amp; Chỉnh sửa Cộng đồng</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[280px]">
                    {editingCommunity.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCommunity(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCommunity} className="p-5 space-y-3.5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold mb-1">Tên cộng đồng *</label>
                <input
                  type="text"
                  required
                  value={editCommForm.name}
                  onChange={(e) => setEditCommForm((f) => ({ ...f, name: e.target.value }))}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold mb-1">Danh mục</label>
                  <select
                    value={editCommForm.communityCategory}
                    onChange={(e) =>
                      setEditCommForm((f) => ({
                        ...f,
                        communityCategory: e.target.value === 'study' ? 'study' : 'game',
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="game">Cộng đồng Game</option>
                    <option value="study">Cộng đồng Học tập</option>
                  </select>
                </div>

                {editCommForm.communityCategory === 'game' && (
                  <div>
                    <label className="block text-xs font-bold mb-1">Nền tảng</label>
                    <select
                      value={editCommForm.gamePlatform}
                      onChange={(e) => setEditCommForm((f) => ({ ...f, gamePlatform: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-hidden ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="Cross-Platform">Cross-Platform</option>
                      <option value="Mobile">Mobile</option>
                      <option value="PC">PC</option>
                      <option value="Console">Console</option>
                    </select>
                  </div>
                )}
              </div>

              {editCommForm.communityCategory === 'game' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold mb-1">Tên tựa game</label>
                    <input
                      type="text"
                      value={editCommForm.gameTitle}
                      onChange={(e) => setEditCommForm((f) => ({ ...f, gameTitle: e.target.value }))}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-hidden ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Thể loại</label>
                    <input
                      type="text"
                      value={editCommForm.gameGenre}
                      onChange={(e) => setEditCommForm((f) => ({ ...f, gameGenre: e.target.value }))}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-hidden ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1">Biểu tượng</label>
                <div className="flex flex-wrap gap-1.5">
                  {['🎮', '🧱', '🧊', '🎯', '📱', '💻', '🕹️', '♟️', '🔫', '⚽', '🏆', '📚', '🌐'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEditCommForm((f) => ({ ...f, avatarIcon: em }))}
                      className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center cursor-pointer ${
                        editCommForm.avatarIcon === em
                          ? 'border-emerald-500 bg-emerald-500/15'
                          : 'border-slate-200 dark:border-zinc-700'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Mô tả cộng đồng</label>
                <textarea
                  rows={2}
                  value={editCommForm.description}
                  onChange={(e) => setEditCommForm((f) => ({ ...f, description: e.target.value }))}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-hidden resize-none ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {editCommForm.communityCategory === 'game' && (
                <div className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-800 dark:text-amber-200">
                    <input
                      type="checkbox"
                      checked={editCommForm.isPinnedTrending}
                      onChange={(e) => setEditCommForm((f) => ({ ...f, isPinnedTrending: e.target.checked }))}
                      className="rounded border-amber-400 text-amber-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Ghim vào mục Trò chơi đang thịnh hành</span>
                  </label>
                  {editCommForm.isPinnedTrending && (
                    <select
                      value={editCommForm.trendingBadge}
                      onChange={(e) => setEditCommForm((f) => ({ ...f, trendingBadge: e.target.value }))}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold border outline-hidden ${
                        isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-amber-300 text-slate-800'
                      }`}
                    >
                      <option value="Thịnh hành">Thịnh hành</option>
                      <option value="Hot Tuần Này">Hot Tuần Này</option>
                      <option value="Top Yêu Thích">Top Yêu Thích</option>
                      <option value="Giải đấu">Giải đấu</option>
                    </select>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCommunity(null)}
                  className="py-2 px-4 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ĐỀ XUẤT CỘNG ĐỒNG GAME MỚI (CHỜ ADMIN DUYỆT) */}
      {showProposeGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } shadow-2xl overflow-hidden`}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Đề xuất Cộng đồng Game mới</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Đề xuất sẽ được gửi tới {isRealAdmin ? `Admin ${ADMIN_NAME}` : 'Ban Quản Trị Max10'} xét duyệt
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProposeGameModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleProposeGameCommunity} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">Tên Cộng đồng Game *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cộng Đồng Honkai / Wuthering Waves"
                  value={proposeGameForm.name}
                  onChange={(e) => setProposeGameForm((f) => ({ ...f, name: e.target.value }))}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold mb-1">Tên tựa game</label>
                  <input
                    type="text"
                    placeholder="VD: Wuthering Waves"
                    value={proposeGameForm.gameTitle}
                    onChange={(e) => setProposeGameForm((f) => ({ ...f, gameTitle: e.target.value }))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Nền tảng</label>
                  <select
                    value={proposeGameForm.gamePlatform}
                    onChange={(e) =>
                      setProposeGameForm((f) => ({
                        ...f,
                        gamePlatform: e.target.value as 'Cross-Platform' | 'Mobile' | 'PC' | 'Console',
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Cross-Platform">Cross-Platform</option>
                    <option value="Mobile">Mobile</option>
                    <option value="PC">PC</option>
                    <option value="Console">Console</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  placeholder="Tìm đồng đội chơi chung, giao lưu chiến thuật..."
                  value={proposeGameForm.description}
                  onChange={(e) => setProposeGameForm((f) => ({ ...f, description: e.target.value }))}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProposeGameModal(false)}
                  className="py-2 px-4 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                >
                  Gửi Admin duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAFE MEMBER PUBLIC PROFILE MODAL (STRICTLY NO PASSWORD, GMAIL OR PHONE) */}
      <MemberProfileModal
        isOpen={Boolean(profileTargetMember)}
        onClose={() => setProfileTargetMember(null)}
        member={profileTargetMember}
        currentUserId={activeUserId}
        contextLabel={profileContextLabel}
        isDark={isDark}
        onStartDuel={(target) => {
          setProfileTargetMember(null);
          handleStartDuelWithMember(target, null);
        }}
        onOpenDirectMessage={
          isFriend(profileTargetMember?.id || '')
            ? (target) => {
                setProfileTargetMember(null);
                setShowCommunitiesView(false);
                setActiveMode('direct');
                setActiveFriendId(target.id);
              }
            : undefined
        }
      />

      {/* QUIZ DUEL ARENA MODAL (COMMUNITY / GROUP / FRIENDS) */}
      {duelModalState && (
        <DuelArenaModal
          isOpen={duelModalState.isOpen}
          onClose={() => setDuelModalState(null)}
          isDark={isDark}
          contextType={duelModalState.contextType}
          contextId={duelModalState.contextId}
          contextName={duelModalState.contextName}
          currentGrade={currentGrade}
          currentUserId={activeUserId}
          currentUserName={activeUserName}
          currentUserAvatar={activeUserAvatar}
          targetMember={duelModalState.targetMember}
          existingChallenge={duelModalState.existingChallenge}
          onChallengeUpdated={handleDuelChallengeUpdated}
        />
      )}

      {/* Toast message for Actions */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
