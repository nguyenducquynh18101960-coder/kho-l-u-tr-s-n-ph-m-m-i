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
  Paperclip,
  Image as ImageIcon,
  ThumbsUp,
  Scissors,
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
} from 'lucide-react';
import Markdown from 'react-markdown';
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
} from '../../types';
import { UserAccount } from '../../types/auth';
import {
  INITIAL_GROUPS,
  INITIAL_GROUP_MESSAGES,
  DEFAULT_STUDENT_FRIENDS,
  DEFAULT_DIRECT_MESSAGES,
} from '../../data/defaultGroups';
import { checkProfanity, calculateMuteDurationMinutes } from '../../utils/profanityFilter';
import { UserAvatarWithStatus, PRESENCE_STATUS_CONFIG } from './UserAvatarWithStatus';
import { formatDolaMath } from '../../utils/dolaMathFormatter';
import { VideoAudioCallModal, CallParticipant } from './VideoAudioCallModal';

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
}

const STORAGE_KEY_GROUPS = 'max10_real_groups_v15';
const STORAGE_KEY_GROUP_MSGS = 'max10_real_group_messages_v15';
const STORAGE_KEY_USER_VIOLATIONS = 'max10_real_user_violations_v15';
const STORAGE_KEY_FRIENDS = 'max10_real_friends_list_v15';
const STORAGE_KEY_DIRECT_MSGS = 'max10_real_direct_chat_messages_v15';

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
}) => {
  // Purge any stale fake seeded chats from old sessions
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
  }, []);

  // Current logged in / active user representation (Mạc Khánh Duy - Admin)
  const activeUserId = currentUser ? currentUser.id : 'user-local-' + userName.toLowerCase().replace(/\s+/g, '-');
  const activeUserName = currentUser ? currentUser.name : userName || 'Mạc Khánh Duy';
  const activeUserAvatar = currentUser?.avatar || userAvatar;

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
  const [showRightDrawer, setShowRightDrawer] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; content: string } | null>(null);
  const [callModal, setCallModal] = useState<{
    active: boolean;
    type: 'video' | 'voice';
    roomType: 'group' | 'direct';
    targetName: string;
    targetAvatar?: string;
    targetBadge?: string;
    participants?: CallParticipant[];
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showSearchInChat, setShowSearchInChat] = useState<boolean>(false);
  const [chatSearchText, setChatSearchText] = useState<string>('');
  const [sharedFilesTab, setSharedFilesTab] = useState<'media' | 'files'>('media');

  // Groups list state: ONLY user created or joined groups (no fake groups)
  const [groups, setGroups] = useState<ChatGroup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GROUPS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((g: ChatGroup) => g && g.id && !g.id.startsWith('default-') && g.createdBy !== 'system' && g.id !== 'grp-noi-chuyen' && g.id !== 'grp-dai-hoi-do-an' && g.id !== 'grp-gia-dinh');
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
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
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

  // Save friends to localStorage (strictly filtering out any fake accounts)
  useEffect(() => {
    try {
      const clean = friends.filter((f) => !isAiEntity(f) && !f.id.startsWith('std-'));
      localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(clean));
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
              const signature = `${m.senderId}_${m.recipientId}_${cleanContent}`;
              if (seenSignatures.has(signature)) {
                continue;
              }

              if (m.id) seenIds.add(m.id);
              seenSignatures.add(signature);
              result.push(m);
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

  // Sync groups from server (For search groups like Zalo and multi-member groups)
  const syncServerGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.groups)) {
          setServerGroups(data.groups);
          // Merge with local groups
          setGroups((prev) => {
            const map = new Map<string, ChatGroup>();
            data.groups.forEach((g: ChatGroup) => map.set(g.id, g));
            prev.forEach((g: ChatGroup) => map.set(g.id, g));
            return Array.from(map.values());
          });
        }
      }
    } catch (e) {}
  };

  // Sync group messages from server
  const syncGroupMessages = async () => {
    if (!activeGroupId) return;
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(activeGroupId)}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.messages)) {
          setGroupMessages((prev) => {
            const currentList = prev[activeGroupId] || [];
            const existingIds = new Set(currentList.map((m) => m.id));
            const newOnes = data.messages.filter((m: any) => !existingIds.has(m.id));
            if (newOnes.length === 0) return prev;
            return {
              ...prev,
              [activeGroupId]: [...currentList, ...newOnes],
            };
          });
        }
      }
    } catch (e) {}
  };

  // Auto-switch to conversation if notified
  useEffect(() => {
    const checkTargetOpen = () => {
      try {
        const raw = localStorage.getItem('max10_target_chat_open');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.targetId && Date.now() - parsed.timestamp < 15000) {
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
    return () => clearInterval(interval);
  }, []);

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
  }, [activeUserId, activeFriendId, activeGroupId, activeMode]);

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

    const remainingGroups = groups.filter((g) => g.id !== groupId);
    const finalGroups = remainingGroups.length > 0 ? remainingGroups : INITIAL_GROUPS;

    setGroups(finalGroups);
    try {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(finalGroups));
    } catch (e) {
      console.warn('Lỗi cập nhật nhóm sau khi xóa', e);
    }

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
      setActiveGroupId(finalGroups[0]?.id || 'group-nguyendu-9a');
    }

    setGroupToDelete(null);
    setToastMessage(`Đã xóa nhóm "${targetGroup.name}" thành công! 🗑️`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupSubject, setNewGroupSubject] = useState<string>('Toán học');
  const [newGroupGrade, setNewGroupGrade] = useState<GradeLevel>(currentGrade);
  const [newGroupDesc, setNewGroupDesc] = useState<string>('Nhóm học tập & thảo luận điểm 10 THCS Nguyễn Du');
  const [newGroupIcon, setNewGroupIcon] = useState<string>('📚');

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

  // Active friend for 1-on-1 private chat (supports connecting with Admin Mạc Khánh Duy)
  const activeFriend =
    friends.find((f) => f.id === activeFriendId) ||
    (activeFriendId === 'admin-mac-khanh-duy'
      ? {
          id: 'admin-mac-khanh-duy',
          name: 'Mạc Khánh Duy (Quản trị viên)',
          avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=MacKhanhDuyAdmin',
          school: 'Ban Quản Trị Hệ Thống Max10 AI',
          status: 'friend' as const,
          presenceStatus: 'online' as const,
          role: 'admin',
        }
      : undefined);
  const isConfirmedFriend = !!activeFriend && (activeFriend.id === 'admin-mac-khanh-duy' || isFriend(activeFriend.id));
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

  // Save groups to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
    } catch (e) {
      console.warn('Lỗi lưu nhóm', e);
    }
  }, [groups]);

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

    const timeStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

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
      const dmMsgId = 'dm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const dmMsg: DirectChatMessage = {
        id: dmMsgId,
        senderId: activeUserId,
        senderName: activeUserName,
        senderAvatar: activeUserAvatar,
        recipientId: activeFriend.id,
        content: text,
        timestamp: timeStr,
        status: 'delivered',
        replyTo: replyingTo || undefined,
      };
      setReplyingTo(null);

      setDirectMessages((prev) => {
        const currentList = prev[activeFriend.id] || [];
        const isDuplicate = currentList.some(
          (m) =>
            m.id === dmMsgId ||
            (m.senderId === activeUserId &&
              m.recipientId === activeFriend.id &&
              (m.content || '').trim() === text)
        );
        if (isDuplicate) return prev;
        return {
          ...prev,
          [activeFriend.id]: [...currentList, dmMsg],
        };
      });

      // Persist direct message to server (Exact ID to prevent duplicate generation)
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
          createdAt: Date.now(),
        }),
      })
        .catch(() => {})
        .finally(() => {
          setTimeout(() => setIsSendingDm(false), 300);
        });

      setToastMessage(`Đã gửi tin nhắn tới ${activeFriend.name}`);
      setTimeout(() => setToastMessage(''), 2000);
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

    // Clean group message sent normally:
    const userMsg: GroupChatMessage = {
      id: 'msg-' + Date.now(),
      groupId: activeGroupId,
      senderId: activeUserId,
      senderName: activeUserName,
      senderAvatar: activeUserAvatar,
      senderRole: 'member',
      content: text,
      timestamp: timeStr,
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

    // User Requirement: "khi gửi tin nhắn vào trong nhóm thì chỉ có người thật mới được nhắn tin ko cho AI nhắn"
    // CẤM TUYỆT ĐỐI AI NHẮN TIN TRONG NHÓM - CHỈ CÓ NGƯỜI THẬT MỚI ĐƯỢC NHẮN TIN
    const lower = text.toLowerCase();
    const isTaggingAi =
      lower.includes('@ai') ||
      lower.includes('@max10') ||
      lower.includes('@cô') ||
      lower.includes('@thầy') ||
      lower.includes('@giáo viên');

    if (isTaggingAi) {
      setToastMessage('Trong nhóm chỉ có người thật mới được nhắn tin! AI không được nhắn tin trong nhóm. Để hỏi bài AI, bạn hãy mở mục Max10 AI.');
      setTimeout(() => setToastMessage(''), 3500);
    }

    // THÀNH VIÊN NGƯỜI THẬT TRONG NHÓM TƯƠNG TÁC (CHỈ NGƯỜI THẬT MỚI ĐƯỢC NHẮN TIN, KHÔNG CÓ AI)
    const otherMembers = (activeGroup.members || []).filter(
      (m) =>
        m.id !== activeUserId &&
        !isAiEntity(m) &&
        !m.id.startsWith('ai-') &&
        !m.id.startsWith('teacher-')
    );

      if (otherMembers.length > 0) {
        // Kiểm tra xem tin nhắn có tag thành viên nào không
        const taggedMember = otherMembers.find((m) =>
          lower.includes(`@${m.name.toLowerCase()}`) ||
          lower.includes(m.name.toLowerCase())
        );

        const respondingMember = taggedMember || otherMembers[Math.floor(Math.random() * otherMembers.length)];

        setTimeout(() => {
          let peerReply = '';
          if (taggedMember) {
            peerReply = `Chào **${activeUserName}**! Mình nghe nè, bài tập này bạn làm đến đâu rồi? Để mình gửi thử cách giải và đáp số nhé!`;
          } else if (lower.includes('chào') || lower.includes('hello') || lower.includes('hi')) {
            peerReply = `Chào **${activeUserName}** nhé! Hôm nay nhóm mình cùng thảo luận và làm bài tập nào thế?`;
          } else if (lower.includes('bài') || lower.includes('toán') || lower.includes('văn') || lower.includes('lý') || lower.includes('hóa') || lower.includes('sinh') || lower.includes('anh') || lower.includes('?') || lower.includes('sao')) {
            peerReply = `Câu này hay đó **${activeUserName}**! Mình cũng đang xem lại phần công thức và phương pháp giải, bạn chú ý tránh mấy cái bẫy đề bài nhé!`;
          } else {
            peerReply = `Đúng rồi đó, mình hoàn toàn đồng ý! Có câu nào cần giải chi tiết nữa thì ${activeUserName} cứ gửi lên nhóm để mọi người cùng thảo luận nha 👍`;
          }

          const peerMsg: GroupChatMessage = {
            id: 'peer-' + Date.now(),
            groupId: activeGroupId,
            senderId: respondingMember.id,
            senderName: respondingMember.name,
            senderAvatar: respondingMember.avatar,
            senderRole: respondingMember.role || 'member',
            content: peerReply,
            timestamp: new Date().toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };

          setGroupMessages((prev) => ({
            ...prev,
            [activeGroupId]: [...(prev[activeGroupId] || []), peerMsg],
          }));

          fetch(`/api/groups/${encodeURIComponent(activeGroupId)}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(peerMsg),
          }).catch(() => {});
        }, 1200);
      }
  };

  // Create a new group (User requested: "nhóm khi tạo chỉ bạn và bạn mới có thể thêm người vào")
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

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
          school: 'THCS Nguyễn Du',
        },
      ],
      mutedUsers: {},
    };

    // Add initial welcome & rules notice
    const initialNotice: GroupChatMessage = {
      id: 'rule-' + Date.now(),
      groupId: newGroup.id,
      senderId: 'system',
      senderName: 'Hệ thống Quản trị Nhóm THCS Nguyễn Du',
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
    setShowCreateGroupModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setToastMessage(`Đã tạo nhóm "${newGroup.name}" thành công! Chỉ bạn mới có quyền thêm người vào nhóm.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Handler for adding member to group (Only creator / admin can add!)
  const handleAddMemberToGroup = async (userToAdd: { id: string; name: string; avatar?: string; school?: string }) => {
    if (!activeGroup) return;

    const isCreator = activeGroup.createdBy === activeUserId || activeGroup.members.some((m) => m.id === activeUserId && m.role === 'admin');
    if (activeGroup.onlyAdminCanAdd && !isCreator) {
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
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setGroupMessages((prev) => ({
      ...prev,
      [activeGroupId]: [...(prev[activeGroupId] || []), addNotice],
    }));

    // Thành viên mới tự động gửi lời chào giao lưu và học hỏi cùng nhóm
    setTimeout(() => {
      const greetingMsg: GroupChatMessage = {
        id: 'msg-greet-' + Date.now(),
        groupId: activeGroupId,
        senderId: userToAdd.id,
        senderName: userToAdd.name,
        senderAvatar: userToAdd.avatar,
        senderRole: 'member',
        content: `Chào cả nhóm nhé! Mình là **${userToAdd.name}**, rất vui được ${activeUserName} thêm vào nhóm học tập để cùng trao đổi bài và săn điểm 10! Có bài nào hay cứ gửi lên cùng làm nha 🚀✨`,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setGroupMessages((prev) => ({
        ...prev,
        [activeGroupId]: [...(prev[activeGroupId] || []), greetingMsg],
      }));
    }, 600);

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

  // Handler for joining a group found via Zalo search
  const handleJoinGroup = async (targetGroup: ChatGroup) => {
    const isAlreadyMember = targetGroup.members.some((m) => m.id === activeUserId);
    if (isAlreadyMember) {
      setActiveGroupId(targetGroup.id);
      setActiveMode('group');
      setSidebarTab('groups');
      setShowSearchGroupsModal(false);
      return;
    }

    const newMember: GroupMember = {
      id: activeUserId,
      name: activeUserName,
      avatar: activeUserAvatar || '',
      role: 'member',
      school: 'THCS Nguyễn Du',
    };

    setGroups((prev) => {
      const exists = prev.some((g) => g.id === targetGroup.id);
      if (exists) {
        return prev.map((g) => (g.id === targetGroup.id ? { ...g, members: [...g.members, newMember] } : g));
      } else {
        return [{ ...targetGroup, members: [...targetGroup.members, newMember] }, ...prev];
      }
    });

    const joinNotice: GroupChatMessage = {
      id: 'sys-join-' + Date.now(),
      groupId: targetGroup.id,
      senderId: 'system',
      senderName: 'Hệ thống Quản trị Nhóm',
      senderRole: 'system',
      isSystemNotice: true,
      content: `👋 Thành viên **${activeUserName}** vừa tìm thấy và tham gia nhóm!`,
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setGroupMessages((prev) => ({
      ...prev,
      [targetGroup.id]: [...(prev[targetGroup.id] || []), joinNotice],
    }));

    fetch(`/api/groups/${targetGroup.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUserId,
        userName: activeUserName,
        userAvatar: activeUserAvatar,
      }),
    }).catch(() => {});

    setActiveGroupId(targetGroup.id);
    setActiveMode('group');
    setSidebarTab('groups');
    setShowSearchGroupsModal(false);
    setToastMessage(`Bạn đã tham gia nhóm "${targetGroup.name}" thành công!`);
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
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (activeMode === 'direct') {
      if (!activeFriend || isFriendBlocked) return;
      const dmMsg: DirectChatMessage = {
        id: 'dm-' + Date.now(),
        senderId: activeUserId,
        senderName: activeUserName,
        senderAvatar: activeUserAvatar,
        recipientId: activeFriend.id,
        content: '👍',
        timestamp: timeStr,
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
        id: 'msg-' + Date.now(),
        groupId: activeGroupId,
        senderId: activeUserId,
        senderName: activeUserName,
        senderAvatar: activeUserAvatar,
        senderRole: 'member',
        content: '👍',
        timestamp: timeStr,
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
        time = lastMsg.timestamp;
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

    // Always provide Administrator Mạc Khánh Duy as an official contact for non-admin users
    if (activeUserId !== 'admin-mac-khanh-duy' && friends.every((f) => f.id !== 'admin-mac-khanh-duy')) {
      const msgs = directMessages['admin-mac-khanh-duy'] || [];
      const lastMsg = msgs[msgs.length - 1];
      list.unshift({
        id: 'admin-mac-khanh-duy',
        type: 'direct',
        name: 'Mạc Khánh Duy (Quản trị viên)',
        avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=MacKhanhDuyAdmin',
        presenceStatus: 'online',
        lastMessage: lastMsg ? lastMsg.content : '📢 Quản trị viên hệ thống Max10 AI',
        lastTimestamp: lastMsg ? lastMsg.timestamp : 'Luôn hoạt động',
        unreadCount: 0,
        data: {
          id: 'admin-mac-khanh-duy',
          name: 'Mạc Khánh Duy (Quản trị viên)',
          avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=MacKhanhDuyAdmin',
          school: 'Ban Quản Trị Hệ Thống Max10 AI',
          status: 'friend',
          presenceStatus: 'online',
          role: 'admin',
        },
      });
    }

    // Add groups
    groups.forEach((g) => {
      const msgs = groupMessages[g.id] || [];
      const lastMsg = msgs[msgs.length - 1];
      let snippet = g.description || 'Nhóm học tập';
      let time = 'Hôm nay';
      if (lastMsg) {
        snippet = (lastMsg.senderId === activeUserId ? 'Bạn: ' : `${lastMsg.senderName}: `) + lastMsg.content;
        time = lastMsg.timestamp;
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

    // Sort by activity
    list.sort((a, b) => {
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
          { name: item.name, role: item.type === 'group' ? 'admin' : undefined },
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
  }, [friends, groups, directMessages, groupMessages, searchQuery, filterTab, categoryFilter, activeUserId]);

  // Handler to select conversation
  const handleSelectConversation = (item: { id: string; type: 'direct' | 'group' }) => {
    if (item.type === 'direct') {
      setActiveMode('direct');
      setActiveFriendId(item.id);
    } else {
      setActiveMode('group');
      setActiveGroupId(item.id);
    }
  };

  // Active chat details
  const activeConversationTitle = activeMode === 'direct' ? (activeFriend?.name || 'Trò chuyện bạn bè') : (activeGroup?.name || 'Nhóm học tập');
  const activeConversationBadge = activeMode === 'direct' ? 'BẠN BÈ' : `NHÓM (${activeGroup?.members?.length || 0} THÀNH VIÊN)`;
  const activeConversationStatus = activeMode === 'direct'
    ? (activeFriend?.presenceStatus === 'dnd'
        ? '🔴 Không làm phiền'
        : activeFriend?.presenceStatus === 'gaming'
        ? '🟡 Đang chơi trò chơi'
        : activeFriend?.presenceStatus === 'offline'
        ? '⚪ Đang offline'
        : '🟢 Đang trực tuyến')
    : `👥 ${activeGroup?.members?.length || 0} thành viên · ${activeGroup?.subject || 'Học tập'}`;

  // Filtered messages in active conversation for in-chat search
  const displayedDirectMsgs = useMemo(() => {
    if (!chatSearchText.trim()) return currentDirectMsgs;
    const q = chatSearchText.toLowerCase();
    return currentDirectMsgs.filter((m) => m.content.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q));
  }, [currentDirectMsgs, chatSearchText]);

  const displayedGroupMsgs = useMemo(() => {
    // Chỉ có người thật mới được nhắn tin trong nhóm, loại bỏ tuyệt đối tin nhắn AI
    const humanOnlyMsgs = messages.filter(
      (m) =>
        !m.isAi &&
        m.senderRole !== 'ai_tutor' &&
        !(m.senderId || '').startsWith('ai-') &&
        !(m.senderId || '').startsWith('teacher-') &&
        !(m.senderName || '').toLowerCase().includes('max10 ai') &&
        !(m.senderName || '').toLowerCase().includes('trợ lý ai')
    );
    if (!chatSearchText.trim()) return humanOnlyMsgs;
    const q = chatSearchText.toLowerCase();
    return humanOnlyMsgs.filter(
      (m) => m.content.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q)
    );
  }, [messages, chatSearchText]);

  const hasActiveChat = Boolean((activeMode === 'direct' && activeFriend) || (activeMode === 'group' && activeGroup));

  return (
    <div
      className={`select-none text-slate-200 transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-[999999] h-screen w-screen bg-[#111418] overflow-hidden flex flex-col'
          : 'flex flex-col h-full w-full overflow-hidden bg-[#111418]'
      }`}
    >
      {/* WINDOW TITLEBAR */}
      <div className="h-9 bg-[#181b20] border-b border-[#252830] flex items-center justify-between px-3 text-xs select-none shrink-0 text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center text-[10px] font-bold shadow-xs">
            <MessageSquare className="w-3 h-3" />
          </div>
          <span className="font-semibold text-slate-200 text-xs">{userName || 'Mạc Khánh Duy'}</span>
          {isFullscreen ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-500/40 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              Đang Phóng To Toàn Màn Hình
            </span>
          ) : (
            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-500/30">
              Nhấn nút Phóng To (□) để mở toàn màn hình
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* If fullscreen, display the prominent exit button */}
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 animate-pulse"
              title="Thoát chế độ phóng to toàn màn hình (phím Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Thoát toàn màn hình (Esc)</span>
            </button>
          )}

          <button
            onClick={() => {
              if (isFullscreen) setIsFullscreen(false);
              else if (onExitFullscreen) onExitFullscreen();
              else if (onSwitchToChat) onSwitchToChat();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-xs font-medium border border-blue-500/40 transition-colors cursor-pointer"
            title="Thoát toàn màn hình, quay lại phần Đặt câu hỏi mới (phím Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>Thoát (Esc) - Về Hỏi bài</span>
          </button>
          <div className="flex items-center ml-1 space-x-1 text-slate-400">
            <button
              onClick={() => {
                if (isFullscreen) setIsFullscreen(false);
                else if (onExitFullscreen) onExitFullscreen();
                else if (onSwitchToChat) onSwitchToChat();
              }}
              className="w-7 h-6 flex items-center justify-center hover:bg-white/10 rounded text-slate-400 cursor-pointer"
              title="Thu nhỏ"
            >
              ─
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-7 h-6 flex items-center justify-center hover:bg-white/10 rounded text-slate-400 cursor-pointer transition-colors"
              title={isFullscreen ? "Thu nhỏ (Esc)" : "Phóng to toàn màn hình"}
            >
              {isFullscreen ? '🗗' : '□'}
            </button>
            <button
              onClick={() => {
                if (isFullscreen) setIsFullscreen(false);
                else if (onExitFullscreen) onExitFullscreen();
                else if (onSwitchToChat) onSwitchToChat();
              }}
              className="w-7 h-6 flex items-center justify-center hover:bg-red-500 hover:text-white rounded text-slate-400 transition-colors cursor-pointer"
              title="Đóng - Về màn hình Hỏi bài (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* 3-COLUMN DESKTOP WORKSPACE */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* 1. SLIM LEFT ICON NAVIGATION RAIL */}
        <div className="w-14 sm:w-16 bg-[#0f1216] border-r border-[#1e2229] flex flex-col items-center py-3 justify-between shrink-0 select-none z-10">
          <div className="flex flex-col items-center gap-4 w-full">
            {/* User Profile Avatar with Presence status */}
            <div className="relative group cursor-pointer" title="Hồ sơ của bạn (Bấm để đổi trạng thái)">
              <UserAvatarWithStatus
                name={activeUserName}
                src={activeUserAvatar}
                presenceStatus={userPresence}
                size="md"
                isEditable={true}
                onStatusChange={handleUpdatePresenceStatus}
              />
            </div>

            <div className="w-8 h-px bg-slate-800 dark:bg-zinc-800" />

            {/* Navigation Tab Icons */}
            <button
              onClick={() => {
                setActiveNav('messages');
                setFilterTab('all');
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                activeNav === 'messages'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 dark:hover:bg-zinc-800/80'
              }`}
              title="Tin nhắn (Bạn bè & Nhóm)"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-blue-400 absolute top-2 right-2 ring-2 ring-slate-900" />
            </button>

            <button
              onClick={() => {
                setActiveNav('contacts');
                handleOpenFriendsModal('find_friends');
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                activeNav === 'contacts'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 dark:hover:bg-zinc-800/80'
              }`}
              title="Danh bạ & Tìm bạn mới"
            >
              <Users className="w-5 h-5" />
              {friendRequests.incoming.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveNav('cloud');
                setShowRightDrawer(true);
                setSharedFilesTab('files');
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeNav === 'cloud'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 dark:hover:bg-zinc-800/80'
              }`}
              title="To-Do & Tài liệu"
            >
              <FileText className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowRulesModal(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
              title="Xem nội quy học tập & phòng chống nói bậy"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>

            {onSwitchToChat && (
              <button
                onClick={onSwitchToChat}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
                title="Mở Trợ lý Max10 AI"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            )}
          </div>

        {/* Bottom Gear / Preferences */}
        <div className="flex flex-col items-center gap-3">
          {onOpenMindMap && (
            <button
              onClick={onOpenMindMap}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
              title="Mở Sơ Đồ Tư Duy Bài Học"
            >
              <Compass className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => {
              const nexts: UserPresenceStatus[] = ['online', 'dnd', 'gaming', 'offline'];
              const curIdx = nexts.indexOf(userPresence);
              const nextSt = nexts[(curIdx + 1) % nexts.length];
              handleUpdatePresenceStatus(nextSt);
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
            title="Đổi trạng thái online"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. MIDDLE COLUMN: UNIFIED CONVERSATION LIST (Groups & Friends) */}
      <div className="w-72 sm:w-80 md:w-84 border-r border-slate-200 dark:border-[#22252d] flex flex-col shrink-0 bg-slate-50/70 dark:bg-[#16181e]">
        {/* Top Search bar with Quick Actions (+👤, +👥) */}
        <div className="p-3 border-b border-slate-200/80 dark:border-[#22252d] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm"
              className={`w-full pl-9 pr-7 py-1.5 rounded-xl text-xs border outline-hidden transition-all ${
                isDark
                  ? 'bg-zinc-800/90 border-zinc-700/80 text-white placeholder-zinc-500 focus:border-blue-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Action: Thêm Bạn (+👤) */}
          <button
            onClick={() => handleOpenFriendsModal('find_friends')}
            className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Thêm bạn bè mới"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          {/* Quick Action: Tạo Nhóm (+👥) */}
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Tạo nhóm học tập mới"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs: Tất cả | Chưa đọc | Phân loại ▾ */}
        <div className="px-3 pt-2 border-b border-slate-200/80 dark:border-[#22252d] flex items-center justify-between text-xs font-semibold select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFilterTab('all');
                setCategoryFilter('all');
                setShowCategoryDropdown(false);
              }}
              className={`pb-2 transition-colors cursor-pointer text-xs ${
                filterTab === 'all' && categoryFilter === 'all'
                  ? 'border-b-2 border-blue-500 font-bold text-blue-500 dark:text-blue-400'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => {
                setFilterTab('unread');
                setCategoryFilter('all');
                setShowCategoryDropdown(false);
              }}
              className={`pb-2 transition-colors cursor-pointer text-xs ${
                filterTab === 'unread'
                  ? 'border-b-2 border-blue-500 font-bold text-blue-500 dark:text-blue-400'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              Chưa đọc
            </button>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className={`pb-2 transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                categoryFilter !== 'all' || showCategoryDropdown
                  ? 'border-b-2 border-blue-500 font-bold text-blue-500 dark:text-blue-400'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
              title="Phân loại theo vai trò: Giáo viên, Học sinh, Bạn bè, Quản trị viên"
            >
              <span>Phân loại</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <button
            onClick={() => handleOpenFriendsModal('find_friends')}
            className="pb-2 text-slate-400 hover:text-blue-500 cursor-pointer"
            title="Tùy chọn khác"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* User Requirement: "ở phần phân loại ở trong chỗ nhắn tin thì sẽ có các màu xanh lá là giáo viên, vàng là học sinh, tím là bạn bè, xanh dương là quản trị viên trong nhóm" */}
        <div className="px-2.5 py-1.5 border-b border-slate-200/60 dark:border-[#22252d] bg-slate-100/50 dark:bg-[#15181f] flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px]">
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold shrink-0 ml-0.5">Phân loại:</span>
          {[
            { id: 'teacher' as const, label: 'Giáo viên', color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40', dot: 'bg-emerald-500' },
            { id: 'student' as const, label: 'Học sinh', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40', dot: 'bg-amber-500' },
            { id: 'friend' as const, label: 'Bạn bè', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40', dot: 'bg-purple-500' },
            { id: 'admin' as const, label: 'Quản trị viên', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40', dot: 'bg-blue-500' },
          ].map((cat) => {
            const isCatActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryFilter(isCatActive ? 'all' : cat.id);
                }}
                className={`px-2 py-0.5 rounded-full font-bold border transition-all flex items-center gap-1 shrink-0 cursor-pointer text-[10px] ${
                  isCatActive
                    ? `${cat.color} ring-2 ring-white/20 font-black scale-105 shadow-2xs`
                    : 'bg-slate-200/50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 border-transparent hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
                title={`Lọc theo ${cat.label}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Conversation List Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60 dark:divide-zinc-800/40">
          {unifiedConversations.map((item) => {
            const isSelected =
              (item.type === 'direct' && activeMode === 'direct' && activeFriendId === item.id) ||
              (item.type === 'group' && activeMode === 'group' && activeGroupId === item.id);

            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelectConversation(item)}
                className={`px-3 py-2.5 flex items-center gap-3 cursor-pointer transition-all border-l-2 ${
                  isSelected
                    ? 'bg-blue-600/10 dark:bg-[#182538] border-blue-500'
                    : 'border-transparent hover:bg-slate-100/80 dark:hover:bg-[#1d2027]'
                }`}
              >
                {/* Avatar with status */}
                <div className="relative shrink-0">
                  {item.type === 'direct' ? (
                    <UserAvatarWithStatus
                      name={item.name}
                      src={item.avatar}
                      presenceStatus={item.presenceStatus || 'online'}
                      size="md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600/20 to-teal-600/20 text-lg flex items-center justify-center border border-emerald-500/30 text-emerald-400 font-bold shadow-2xs">
                      {item.icon || '📚'}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3
                      className={`text-xs font-bold truncate ${
                        isSelected
                          ? 'text-blue-600 dark:text-blue-300'
                          : 'text-slate-900 dark:text-zinc-100'
                      }`}
                    >
                      {item.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                      {item.lastTimestamp}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                    {item.lastMessage}
                  </p>
                </div>
              </div>
            );
          })}

          {unifiedConversations.length === 0 && (
            <div className="text-center py-12 px-4">
              <Users className="w-10 h-10 mx-auto text-slate-500 dark:text-zinc-600 mb-3" />
              <p className="text-xs font-bold text-slate-200">Chưa có hội thoại nào</p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 mb-4 leading-relaxed">
                Đã xóa sạch tin nhắn mẫu. Hãy kết bạn hoặc tạo nhóm học tập để bắt đầu trò chuyện!
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleOpenFriendsModal('find_friends')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer transition-colors"
                >
                  + Tìm & Thêm bạn bè
                </button>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer transition-colors"
                >
                  + Tạo nhóm học tập
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN CHAT PANE */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#f8fafc] dark:bg-[#111418]">
        {!hasActiveChat ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#111418] select-none">
            <div className="w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-5 text-blue-400 shadow-xl">
              <MessageSquare className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Chào mừng đến với Nhóm học tập & Bạn bè</h2>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              Tất cả các tin nhắn mẫu đã được xóa sạch. Chỉ khi kết bạn mới có thể nhắn tin hoặc tạo nhóm học tập mới.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                onClick={() => handleOpenFriendsModal('find_friends')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Thêm bạn bè mới</span>
              </button>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>+ Tạo nhóm học tập</span>
              </button>
              <button
                onClick={onExitFullscreen || onSwitchToChat}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-blue-400" />
                <span>Thoát (Esc) - Về Hỏi bài</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">ESC</kbd> bất kỳ lúc nào để quay lại màn hình Hỏi bài (Đặt câu hỏi mới).
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header Bar */}
            <div className="h-14 px-4 bg-white dark:bg-[#16191f] border-b border-slate-200 dark:border-[#22252d] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {activeMode === 'direct' && activeFriend ? (
                  <UserAvatarWithStatus
                    name={activeFriend.name}
                    src={activeFriend.avatar}
                    presenceStatus={activeFriend.presenceStatus || 'online'}
                    size="md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600/20 to-teal-600/20 text-lg flex items-center justify-center border border-emerald-500/30 text-emerald-400 font-bold shrink-0">
                    {activeGroup?.avatarIcon || '📚'}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {activeConversationTitle}
                    </h1>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 ${
                        activeMode === 'direct'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {activeConversationBadge}
                    </span>
                    {(() => {
                      const cat = activeMode === 'direct'
                        ? getSenderCategory({ name: activeFriend?.name }, { isDirectFriend: true })
                        : getSenderCategory({ name: activeGroup?.name, role: 'admin' }, { isGroupAdmin: true });
                      return <ClassificationSquare category={cat} />;
                    })()}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                    <span>{activeConversationStatus}</span>
                  </p>
                </div>
              </div>

              {/* Action Icons: Tìm kiếm 🔍, Gọi Video 📹, Gọi Thoại 📞, Thông tin ℹ️ */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  onClick={() => setShowSearchInChat(!showSearchInChat)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    showSearchInChat
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                  title="Tìm kiếm tin nhắn trong cuộc trò chuyện này"
                >
                  <Search className="w-4 h-4" />
                </button>

                <button
                  onClick={() =>
                    setCallModal({
                      active: true,
                      type: 'video',
                      roomType: activeMode,
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
                  className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Bắt đầu cuộc gọi Video HD có Camera & Mic"
                >
                  <Video className="w-4 h-4" />
                </button>

                <button
                  onClick={() =>
                    setCallModal({
                      active: true,
                      type: 'voice',
                      roomType: activeMode,
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
                  className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Bắt đầu cuộc gọi Thoại có Mic"
                >
                  <Phone className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowRightDrawer(!showRightDrawer)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    showRightDrawer
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                  title="Xem thông tin chi tiết hội thoại & thành viên"
                >
                  {showRightDrawer ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                </button>
              </div>
            </div>

        {/* In-chat search bar */}
        {showSearchInChat && (
          <div className="px-4 py-2 bg-blue-50/80 dark:bg-zinc-900 border-b border-blue-200 dark:border-zinc-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <input
              type="text"
              value={chatSearchText}
              onChange={(e) => setChatSearchText(e.target.value)}
              placeholder="Nhập từ khóa cần tìm trong tin nhắn..."
              className="flex-1 bg-transparent border-none text-xs outline-hidden text-slate-900 dark:text-zinc-100 placeholder-slate-400"
              autoFocus
            />
            {chatSearchText && (
              <button
                onClick={() => setChatSearchText('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-xs"
              >
                Xóa
              </button>
            )}
            <button
              onClick={() => setShowSearchInChat(false)}
              className="p-1 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Pinned Notice or Academic Rule Banner */}
        {activeMode === 'group' && activeGroup?.pinnedNotice && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/40 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 truncate">
              <Pin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate font-medium">{activeGroup.pinnedNotice}</span>
            </div>
            <button
              onClick={() => setShowRulesModal(true)}
              className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0 ml-2"
            >
              Nội quy
            </button>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeMode === 'direct' ? (
            // 1-on-1 Messages Feed
            displayedDirectMsgs.map((msg) => {
              const isMe = msg.senderId === activeUserId;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] sm:max-w-[70%] group relative ${
                    isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Sender Avatar */}
                  {!isMe && (
                    <UserAvatarWithStatus
                      name={msg.senderName}
                      src={msg.senderAvatar}
                      presenceStatus={activeFriend?.presenceStatus || 'online'}
                      size="sm"
                    />
                  )}

                  <div className={`min-w-0 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-1 px-1 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-300">
                          {msg.senderName}
                        </span>
                        {(() => {
                          const cat = getSenderCategory({ id: msg.senderId, name: msg.senderName }, { isDirectFriend: true });
                          return <ClassificationSquare category={cat} />;
                        })()}
                      </div>
                    )}
                    {/* Message Bubble */}
                    <div
                      className={`relative p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                        isMe
                          ? 'bg-[#142842] text-white rounded-tr-xs'
                          : 'bg-[#24272c] text-white rounded-tl-xs'
                      }`}
                    >
                      {/* QUOTED REPLY CARD (matching screenshot style) */}
                      {msg.replyTo && (
                        <div
                          className={`mb-2 p-2 rounded-lg border-l-3 text-xs ${
                            isMe
                              ? 'bg-[#1c3558] border-blue-400 text-sky-100'
                              : 'bg-[#1e2229] border-blue-400 text-slate-300'
                          }`}
                        >
                          <p className="font-bold text-[11px] text-blue-400">
                            {msg.replyTo.senderName}
                          </p>
                          <p className="truncate text-[11px] mt-0.5 opacity-90">
                            {msg.replyTo.content}
                          </p>
                        </div>
                      )}

                      {/* Main Message Content */}
                      <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm break-words">
                        <Markdown>{formatDolaMath(msg.content)}</Markdown>
                      </div>

                      {/* Message Footer: Timestamp + Checkmark status */}
                      <div
                        className={`flex items-center gap-1 text-[10px] mt-1.5 justify-end ${
                          isMe ? 'text-blue-100/80' : 'text-slate-400 dark:text-zinc-500'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {isMe && (
                          <span className="flex items-center gap-0.5 font-medium ml-1">
                            <CheckCheck className="w-3 h-3 text-sky-300" />
                            <span>Đã nhận</span>
                          </span>
                        )}
                      </div>

                      {/* Reaction badge under bubble if any */}
                      {msg.reaction && (
                        <div
                          onClick={() => handleToggleReaction(msg.id, msg.reaction!)}
                          className="absolute -bottom-2 right-2 px-1.5 py-0.5 rounded-full bg-[#1e2229] border border-[#2b303b] text-white shadow-xs text-xs cursor-pointer hover:scale-110 transition-transform"
                          title="Bấm để gỡ cảm xúc"
                        >
                          <span>{msg.reaction}</span>
                        </div>
                      )}

                      {/* Message Hover Quick Toolbar: Trả lời ↩️, Thả Like 👍, Thả Tim ❤️, Sao chép 📋 */}
                      <div
                        className={`absolute -top-3.5 ${
                          isMe ? 'right-0' : 'left-0'
                        } hidden group-hover:flex items-center gap-0.5 p-1 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-md text-xs z-10`}
                      >
                        <button
                          onClick={() =>
                            setReplyingTo({
                              id: msg.id,
                              senderName: msg.senderName,
                              content: msg.content,
                            })
                          }
                          className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                          title="Trả lời trích dẫn tin nhắn này"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleReaction(msg.id, '👍')}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                          title="Thả Like 👍"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => handleToggleReaction(msg.id, '❤️')}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                          title="Thả Tim ❤️"
                        >
                          ❤️
                        </button>
                        <button
                          onClick={() => {
                            navigator?.clipboard?.writeText(msg.content);
                            setToastMessage('Đã sao chép nội dung tin nhắn!');
                            setTimeout(() => setToastMessage(''), 2000);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                          title="Sao chép tin nhắn"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // Study Group Messages Feed
            displayedGroupMsgs.map((msg) => {
              const isMe = msg.senderId === activeUserId;
              const isAi = msg.isAi || msg.senderRole === 'ai_tutor';

              if (msg.isSystemNotice) {
                return (
                  <div
                    key={msg.id}
                    className="p-3 rounded-2xl max-w-lg mx-auto bg-blue-50/80 dark:bg-zinc-900 border border-blue-200 dark:border-zinc-800 text-xs text-center text-slate-700 dark:text-zinc-300"
                  >
                    <p className="font-semibold">{msg.content}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{msg.timestamp}</span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] sm:max-w-[70%] group relative ${
                    isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Sender Avatar */}
                  {!isMe && (
                    <UserAvatarWithStatus
                      name={msg.senderName}
                      src={msg.senderAvatar}
                      presenceStatus="online"
                      size="sm"
                    />
                  )}

                  <div className={`min-w-0 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-1 px-1 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                          {msg.senderName}
                        </span>
                        {(() => {
                          const isGrpAdmin = msg.senderRole === 'admin' || (activeGroup && activeGroup.createdBy === msg.senderId);
                          const cat = getSenderCategory({ id: msg.senderId, name: msg.senderName, role: msg.senderRole }, { isGroupAdmin: isGrpAdmin });
                          return <ClassificationSquare category={cat} />;
                        })()}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`relative p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                        isAi
                          ? 'bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-zinc-800 dark:to-emerald-950/30 border border-emerald-500/30 text-slate-900 dark:text-zinc-100'
                          : isMe
                          ? 'bg-blue-600 dark:bg-[#183a66] text-white rounded-tr-xs'
                          : 'bg-white dark:bg-[#232730] border border-slate-200/80 dark:border-zinc-700/60 text-slate-900 dark:text-zinc-100 rounded-tl-xs'
                      }`}
                    >
                      {/* QUOTED REPLY CARD */}
                      {msg.replyTo && (
                        <div
                          className={`mb-2 p-2 rounded-lg border-l-3 text-xs ${
                            isMe
                              ? 'bg-white/10 border-sky-300 text-sky-100'
                              : 'bg-black/5 dark:bg-black/30 border-blue-500 text-slate-600 dark:text-zinc-300'
                          }`}
                        >
                          <p className="font-bold text-[11px] text-blue-500 dark:text-blue-400">
                            {msg.replyTo.senderName}
                          </p>
                          <p className="truncate text-[11px] mt-0.5 opacity-90">
                            {msg.replyTo.content}
                          </p>
                        </div>
                      )}

                      {/* Main Message Content */}
                      <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm break-words">
                        <Markdown>{formatDolaMath(msg.content)}</Markdown>
                      </div>

                      {/* Message Footer */}
                      <div
                        className={`flex items-center gap-1 text-[10px] mt-1.5 justify-end ${
                          isMe ? 'text-blue-100/80' : 'text-slate-400 dark:text-zinc-500'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {isMe && (
                          <span className="flex items-center gap-0.5 font-medium ml-1">
                            <CheckCheck className="w-3 h-3 text-sky-300" />
                            <span>Đã nhận</span>
                          </span>
                        )}
                      </div>

                      {/* Reaction pill */}
                      {msg.reaction && (
                        <div
                          onClick={() => handleToggleReaction(msg.id, msg.reaction!)}
                          className="absolute -bottom-2 right-2 px-1.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-xs text-xs cursor-pointer hover:scale-110 transition-transform"
                        >
                          <span>{msg.reaction}</span>
                        </div>
                      )}

                      {/* Hover action toolbar */}
                      <div
                        className={`absolute -top-3.5 ${
                          isMe ? 'right-0' : 'left-0'
                        } hidden group-hover:flex items-center gap-0.5 p-1 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-md text-xs z-10`}
                      >
                        <button
                          onClick={() =>
                            setReplyingTo({
                              id: msg.id,
                              senderName: msg.senderName,
                              content: msg.content,
                            })
                          }
                          className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                          title="Trả lời trích dẫn"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleReaction(msg.id, '👍')}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => handleToggleReaction(msg.id, '❤️')}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                          ❤️
                        </button>
                        <button
                          onClick={() => {
                            navigator?.clipboard?.writeText(msg.content);
                            setToastMessage('Đã sao chép tin nhắn!');
                            setTimeout(() => setToastMessage(''), 2000);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quoted Replying Banner (if active) */}
        {replyingTo && (
          <div className="px-4 py-2 bg-blue-50/90 dark:bg-[#1a273b] border-t border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <Reply className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate text-slate-700 dark:text-zinc-200">
                Đang trả lời <strong>{replyingTo.senderName}</strong>: "{replyingTo.content}"
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
              title="Hủy trả lời"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* RICH TOOLBAR ABOVE CHAT INPUT (matches Zalo Desktop exactly) */}
        <div className="px-4 py-1.5 border-t border-slate-200 dark:border-[#22252d] bg-white dark:bg-[#16181e] flex items-center gap-3 text-slate-500 dark:text-zinc-400">
          {/* Emoji / Sticker button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-500 transition-colors cursor-pointer"
            title="Biểu cảm / Sticker"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Gửi ảnh */}
          <button
            type="button"
            onClick={() => {
              setInputMessage((prev) => (prev ? `${prev} [Ảnh bài tập]` : '[Ảnh bài tập] '));
              setToastMessage('Đã thêm thẻ ảnh vào tin nhắn');
              setTimeout(() => setToastMessage(''), 2000);
            }}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-500 transition-colors cursor-pointer"
            title="Gửi hình ảnh"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Đính kèm tài liệu */}
          <button
            type="button"
            onClick={() => {
              setInputMessage((prev) => (prev ? `${prev} 📎 De_cuong_on_tap.pdf ` : '📎 De_cuong_on_tap.pdf '));
              setToastMessage('Đã đính kèm tệp tài liệu PDF');
              setTimeout(() => setToastMessage(''), 2000);
            }}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-500 transition-colors cursor-pointer"
            title="Đính kèm tài liệu"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Danh thiếp / Liên hệ */}
          <button
            type="button"
            onClick={() => {
              setInputMessage((prev) => (prev ? `${prev} 📇 Danh thiếp học tập: ${userName || 'Học sinh'} ` : `📇 Danh thiếp học tập: ${userName || 'Học sinh'} `));
              setToastMessage('Đã gửi danh thiếp');
              setTimeout(() => setToastMessage(''), 2000);
            }}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-500 transition-colors cursor-pointer"
            title="Gửi danh thiếp"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Chụp màn hình (Scissors) */}
          <button
            type="button"
            onClick={() => {
              setToastMessage('Đã chụp vùng màn hình bài tập và dán vào khung chat');
              setInputMessage((prev) => (prev ? `${prev} [Ảnh chụp bài tập]` : '[Ảnh chụp bài tập] '));
              setTimeout(() => setToastMessage(''), 2000);
            }}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-500 transition-colors cursor-pointer"
            title="Chụp ảnh màn hình"
          >
            <Scissors className="w-4 h-4" />
          </button>

          {/* Định dạng văn bản A */}
          <button
            type="button"
            onClick={() => setInputMessage((prev) => (prev ? `${prev} **in đậm** ` : '**in đậm** '))}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-500 transition-colors font-bold text-xs cursor-pointer"
            title="Định dạng phông chữ"
          >
            <span className="font-serif">A</span>
          </button>

          {/* Tin nhắn nhanh */}
          <button
            type="button"
            onClick={() => {
              setInputMessage('Chào bạn, mình cùng nhau thảo luận bài tập nhé!');
            }}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-500 transition-colors cursor-pointer"
            title="Tin nhắn nhanh mẫu"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          {/* Giao việc / Nhắc nhở */}
          <button
            type="button"
            onClick={() => {
              setInputMessage((prev) => (prev ? `${prev} 📋 [Nhắc việc: Lấy tài liệu in trước 20h] ` : '📋 [Nhắc việc: Lấy tài liệu in trước 20h] '));
            }}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-500 transition-colors cursor-pointer"
            title="Giao việc / To-do"
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* Tùy chọn khác */}
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-500 transition-colors cursor-pointer"
            title="Thêm tùy chọn"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Tag @AI trợ lý */}
          {onSwitchToChat && (
            <button
              type="button"
              onClick={onSwitchToChat}
              className="p-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors font-bold text-xs flex items-center gap-1 cursor-pointer ml-auto"
              title="Hỏi trợ lý Max10 AI giải bài"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Trợ lý AI</span>
            </button>
          )}
        </div>

        {/* Quick Emoji Picker Drawer if open */}
        {showEmojiPicker && (
          <div className="px-4 py-2 bg-slate-100/90 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto">
            {['👍', '❤️', '😊', '🎉', '🔥', '📚', '📐', '🎯', '💯', '✨', '✍️', '🙏'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setInputMessage((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-base p-1.5 hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* CHAT INPUT BAR WITH DYNAMIC SEND / LIKE BUTTON */}
        <div className="p-3 bg-white dark:bg-[#16181e] border-t border-slate-200 dark:border-[#22252d]">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                disabled={activeMode === 'direct' && isFriendBlocked}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  activeMode === 'group'
                    ? 'Nhắn tin trò chuyện cùng nhóm (Chỉ người thật, không có AI)...'
                    : `Nhập tin nhắn tới ${activeConversationTitle}...`
                }
                className={`w-full py-2.5 pl-3.5 pr-10 rounded-2xl border text-xs sm:text-sm outline-hidden transition-all ${
                  isDark
                    ? 'bg-zinc-800/80 border-zinc-700/80 text-white placeholder-zinc-500 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            {/* DYNAMIC ACTION BUTTON: If input is empty -> show Like 👍; If typing -> show Send ➤ */}
            {inputMessage.trim() ? (
              <button
                type="submit"
                disabled={isSendingDm}
                className="p-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendQuickLike}
                className="p-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition-all cursor-pointer shrink-0"
                title="Gửi Like nhanh"
              >
                <ThumbsUp className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
          </>
        )}
      </div>

      {/* 4. COLLAPSIBLE RIGHT INFO DRAWER */}
      {showRightDrawer && (
        <div className="w-72 sm:w-80 border-l border-slate-200 dark:border-[#22252d] bg-white dark:bg-[#16181e] flex flex-col shrink-0 overflow-y-auto">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 dark:border-[#22252d] flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Thông tin hội thoại
            </h3>
            <button
              onClick={() => setShowRightDrawer(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Overview */}
          <div className="p-4 text-center border-b border-slate-200 dark:border-[#22252d]">
            <div className="mx-auto inline-block">
              {activeMode === 'direct' && activeFriend ? (
                <UserAvatarWithStatus
                  name={activeFriend.name}
                  src={activeFriend.avatar}
                  presenceStatus={activeFriend.presenceStatus || 'online'}
                  size="xl"
                />
              ) : (
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600/20 to-teal-600/20 text-3xl flex items-center justify-center border border-emerald-500/30 text-emerald-400 font-bold mx-auto shadow-xs">
                  {activeGroup?.avatarIcon || '📚'}
                </div>
              )}
            </div>
            <h2 className="font-extrabold text-sm sm:text-base mt-2 text-slate-900 dark:text-white">
              {activeConversationTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {activeConversationStatus}
            </p>
          </div>

          {/* Group Members (if in Group mode) */}
          {activeMode === 'group' && activeGroup && (
            <div className="p-4 border-b border-slate-200 dark:border-[#22252d]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-xs text-slate-700 dark:text-zinc-300">
                  Thành viên ({activeGroup.members.length})
                </h4>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Thêm bạn</span>
                </button>
              </div>

              <div className="space-y-2">
                {activeGroup.members.map((member, mIdx) => (
                  <div key={`${member.id}-${mIdx}`} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatarWithStatus
                        name={member.name}
                        src={member.avatar}
                        presenceStatus={member.presenceStatus || 'online'}
                        size="xs"
                      />
                      <span className="font-medium truncate text-slate-800 dark:text-zinc-200">
                        {member.name}
                      </span>
                    </div>
                    {(() => {
                      const isGrpAdmin = member.role === 'admin' || (activeGroup && activeGroup.createdBy === member.id);
                      const isDirect = isFriend(member.id);
                      const cat = getSenderCategory(member, { isGroupAdmin: isGrpAdmin, isDirectFriend: isDirect });
                      return <ClassificationSquare category={cat} />;
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shared Media & Files Tabs */}
          <div className="p-4 border-b border-slate-200 dark:border-[#22252d]">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setSharedFilesTab('media')}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${
                  sharedFilesTab === 'media'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                Hình ảnh (4)
              </button>
              <button
                onClick={() => setSharedFilesTab('files')}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${
                  sharedFilesTab === 'files'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                Tài liệu (3)
              </button>
            </div>

            {sharedFilesTab === 'media' ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex flex-col items-center justify-center p-2 text-center text-[10px] text-slate-600 dark:text-zinc-300">
                  <span className="text-xl mb-1">📐</span>
                  <span className="font-semibold line-clamp-1">Hinh_tron_O.png</span>
                </div>
                <div className="aspect-square rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex flex-col items-center justify-center p-2 text-center text-[10px] text-slate-600 dark:text-zinc-300">
                  <span className="text-xl mb-1">📝</span>
                  <span className="font-semibold line-clamp-1">So_do_tu_duy.jpg</span>
                </div>
                <div className="aspect-square rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex flex-col items-center justify-center p-2 text-center text-[10px] text-slate-600 dark:text-zinc-300">
                  <span className="text-xl mb-1">📊</span>
                  <span className="font-semibold line-clamp-1">Do_thi_ham_so.png</span>
                </div>
                <div className="aspect-square rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex flex-col items-center justify-center p-2 text-center text-[10px] text-slate-600 dark:text-zinc-300">
                  <span className="text-xl mb-1">🎓</span>
                  <span className="font-semibold line-clamp-1">De_thi_chuyen.jpg</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">De_thi_thu_vao_10_2026.pdf</p>
                    <p className="text-[10px] text-slate-400">1.4 MB · 19:30</p>
                  </div>
                  <Download className="w-4 h-4 text-blue-600 shrink-0 cursor-pointer" />
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">De_cuong_Toan_chuong_3.docx</p>
                    <p className="text-[10px] text-slate-400">520 KB · Hôm qua</p>
                  </div>
                  <Download className="w-4 h-4 text-blue-600 shrink-0 cursor-pointer" />
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Settings */}
          <div className="p-4 space-y-2 text-xs">
            {activeMode === 'direct' && activeFriend ? (
              <>
                <button
                  onClick={() => handleToggleFriend(activeFriend)}
                  className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-semibold flex items-center justify-center gap-1.5"
                >
                  <UserMinus className="w-4 h-4" />
                  <span>Hủy kết bạn</span>
                </button>
                <button
                  onClick={() => setUserToBlock({ id: activeFriend.id, name: activeFriend.name })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors font-semibold flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-4 h-4 text-rose-500" />
                  <span>Chặn người này</span>
                </button>
              </>
            ) : activeGroup ? (
              <button
                onClick={() => setGroupToDelete(activeGroup)}
                className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-semibold flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa / Rời khỏi nhóm này</span>
              </button>
            ) : null}
          </div>
        </div>
      )}
      </div>

      {/* 5. VIDEO & AUDIO CALL MODAL WITH REAL CAMERA & MIC */}
      {callModal && (
        <VideoAudioCallModal
          isOpen={callModal.active}
          onClose={() => setCallModal(null)}
          callType={callModal.type}
          roomType={callModal.roomType}
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

      {/* MODAL 2: TẠO NHÓM CHAT MỚI */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } shadow-2xl overflow-hidden`}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Tạo Nhóm Trò Chuyện Học Tập Mới</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Kết nối bạn bè và Trợ lý AI Điểm 10</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                  Tên nhóm học tập: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hội Luyện Đề Toán Chuyên 9A, Nhóm Học KHTN..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

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

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300/50 text-[11px] text-amber-800 dark:text-amber-300">
                ⚡ Nhóm mới tạo sẽ tự động áp dụng <strong>Luật nói chuyện</strong>: Xưng hô mày - tao thoải mái, nói bậy nhắc nhở 1 lần, tái phạm cấm chat từ 5p đến 1h.
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="py-2.5 px-4 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Tạo Nhóm Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DANH SÁCH THÀNH VIÊN NHÓM */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } shadow-2xl overflow-hidden`}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">Thành Viên Trong Nhóm</h3>
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
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-zinc-700"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                                  {user.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                                    {user.name}
                                  </p>
                                  {/* Kí hiệu hình vuông phân loại cạnh tên khi kết bạn online */}
                                  <ClassificationSquare category={userCat} />
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {user.email || 'Học sinh'}
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
                              {req.fromUserAvatar ? (
                                <img
                                  src={req.fromUserAvatar}
                                  alt={req.fromUserName}
                                  className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-blue-400"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
                                  {req.fromUserName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
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
                          {friend.avatar ? (
                            <img
                              src={friend.avatar}
                              alt={friend.name}
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                              {friend.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">{friend.name}</p>
                              {/* Kí hiệu hình vuông phân loại cạnh tên bạn bè */}
                              <ClassificationSquare category={friendCat} />
                            </div>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Bạn bè · Được nhắn tin riêng 1-1
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
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
