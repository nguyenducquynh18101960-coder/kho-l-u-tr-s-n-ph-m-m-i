import React, { useEffect, useState } from 'react';
import {
  X,
  Swords,
  MessageSquare,
  ShieldCheck,
  Trophy,
  GraduationCap,
  Calendar,
  Zap,
  Sparkles,
  UserPlus,
  UserCheck,
  Send,
  Award,
} from 'lucide-react';
import { PublicMemberProfile, UserPresenceStatus } from '../../types';
import { UserAvatarWithStatus, PRESENCE_STATUS_CONFIG } from './UserAvatarWithStatus';
import { safeFetchJson } from '../../utils/safeFetchJson';
import { calculateLevel, formatLevelLabel } from '../../types/achievements';
import {
  BADGE_CATALOG,
  UserDecorationConfig,
  getMemberDecoration,
  getNameplateById,
  loadLocalDecorations,
} from '../../data/profileDecorations';
import {
  NameplateBannerStrip,
  NameplateEffectOverlay,
  UserBadgesStrip,
} from './ProfileDecorationSystem';
import { CountryCode } from '../../data/countryCultures';

export function scrubPrivateContactStrings(val?: string): string | undefined {
  if (!val) return undefined;
  const cleaned = String(val)
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    .replace(/(\+?84|0)\d{8,10}/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s·,-]+|[\s·,-]+$/g, '')
    .trim();
  return cleaned || undefined;
}

export function buildSafePublicProfile(
  raw: Record<string, any> & { id: string; name: string }
): PublicMemberProfile {
  // Strictly whitelist ONLY non-sensitive public fields.
  // Never read or forward password, pin, email, gmail, phone, emailOrPhone, or dob.
  const roleRaw = String(raw.role || raw.senderRole || raw.roleType || 'student').toLowerCase();
  let roleType: PublicMemberProfile['roleType'] = 'student';
  let roleLabel = 'Học sinh';

  if (roleRaw === 'admin' || raw.id === 'admin-mac-khanh-duy') {
    roleType = 'admin';
    roleLabel = 'Quản trị viên';
  } else if (roleRaw === 'teacher') {
    roleType = 'teacher';
    roleLabel = raw.teacherTitle ? String(raw.teacherTitle) : 'Giáo viên';
  } else if (raw.isFriend) {
    roleType = 'friend';
    roleLabel = 'Bạn bè';
  }

  const rawName = String(raw.name || 'Thành viên Max10');
  const safeName =
    raw.id === 'admin-mac-khanh-duy' && rawName.includes('Mạc Khánh Duy')
      ? 'Quản trị viên Max10'
      : scrubPrivateContactStrings(rawName) || 'Thành viên Max10';

  const statusRaw = raw.presenceStatus as UserPresenceStatus | undefined;
  const presenceStatus: UserPresenceStatus =
    statusRaw === 'dnd' || statusRaw === 'gaming' || statusRaw === 'offline' ? statusRaw : 'online';

  return {
    id: String(raw.id),
    name: safeName,
    avatar: typeof raw.avatar === 'string' ? raw.avatar : '',
    roleLabel: raw.roleLabel ? String(raw.roleLabel) : roleLabel,
    roleType,
    presenceStatus,
    grade: raw.grade ? String(raw.grade) : undefined,
    studentClass: raw.studentClass ? String(raw.studentClass) : undefined,
    schoolName: scrubPrivateContactStrings(raw.schoolName || raw.school),
    teachingSubject: raw.teachingSubject ? String(raw.teachingSubject) : undefined,
    homeroomClass: raw.homeroomClass ? String(raw.homeroomClass) : undefined,
    level: typeof raw.level === 'number' ? raw.level : undefined,
    levelTitle: raw.levelTitle ? String(raw.levelTitle) : undefined,
    xp: typeof raw.xp === 'number' ? raw.xp : undefined,
    streak: typeof raw.streak === 'number' ? raw.streak : undefined,
    duelWins: typeof raw.duelWins === 'number' ? raw.duelWins : 0,
    duelPlayed: typeof raw.duelPlayed === 'number' ? raw.duelPlayed : 0,
    bio: scrubPrivateContactStrings(raw.bio),
    joinedAt: raw.joinedAt ? String(raw.joinedAt) : undefined,
  };
}

interface MemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: PublicMemberProfile | null;
  currentUserId: string;
  currentUserName?: string;
  currentUserAvatar?: string;
  contextLabel?: string;
  isDark: boolean;
  isFriendMember?: boolean;
  countryCode?: CountryCode;
  peerDecoration?: UserDecorationConfig;
  onToggleFriend?: (targetMember: PublicMemberProfile) => void;
  onStartDuel: (targetMember: PublicMemberProfile) => void;
  onOpenDirectMessage?: (targetMember: PublicMemberProfile, initialMessage?: string) => void;
  onOpenDecorationModal?: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  isOpen,
  onClose,
  member,
  currentUserId,
  currentUserName = 'Bạn học',
  currentUserAvatar = '',
  contextLabel = 'Cộng đồng & Nhóm',
  isDark,
  isFriendMember = false,
  countryCode = 'VN',
  peerDecoration,
  onToggleFriend,
  onStartDuel,
  onOpenDirectMessage,
  onOpenDecorationModal,
}) => {
  const [profile, setProfile] = useState<PublicMemberProfile | null>(member);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [localFriendState, setLocalFriendState] = useState(isFriendMember);
  const [quickDmText, setQuickDmText] = useState('');
  const [sendingQuickDm, setSendingQuickDm] = useState(false);
  const [quickDmSent, setQuickDmSent] = useState(false);

  useEffect(() => {
    setProfile(member);
    setLocalFriendState(isFriendMember);
    setQuickDmText('');
    setQuickDmSent(false);
    if (!isOpen || !member?.id) return;

    let cancelled = false;
    setLoadingProfile(true);
    safeFetchJson<{ success?: boolean; profile?: Record<string, any> }>(
      `/api/users/public-profile/${encodeURIComponent(member.id)}`
    )
      .then((res) => {
        if (cancelled || !res?.success || !res.profile) return;
        const safeRemote = buildSafePublicProfile({
          ...member,
          ...res.profile,
          name:
            res.profile.name && res.profile.name !== 'Thành viên Max10'
              ? res.profile.name
              : member.name,
          avatar: res.profile.avatar || member.avatar,
        });
        setProfile(safeRemote);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, member, isFriendMember]);

  if (!isOpen || !profile) return null;

  const isSelf = profile.id === currentUserId;
  const presenceConf = PRESENCE_STATUS_CONFIG[profile.presenceStatus] || PRESENCE_STATUS_CONFIG.online;
  const computedLevel = typeof profile.xp === 'number' ? calculateLevel(profile.xp) : null;
  const displayLevel = profile.level ?? computedLevel?.level ?? (profile.roleType === 'admin' ? 99 : 1);
  const displayLevelTitle = profile.levelTitle || computedLevel?.title;

  const decoration = isSelf
    ? loadLocalDecorations(profile.roleType === 'admin')
    : peerDecoration ||
      getMemberDecoration({
        id: profile.id,
        role: profile.roleType === 'admin' ? 'admin' : profile.roleType === 'teacher' ? 'teacher' : 'member',
        isAi: profile.id.includes('max10-ai'),
      });
  const npTemplate = getNameplateById(decoration.nameplateId);

  const handleQuickDirectSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickDmText.trim();
    if (!text || sendingQuickDm || isSelf) return;
    setSendingQuickDm(true);
    try {
      await fetch('/api/direct-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          recipientId: profile.id,
          content: text,
        }),
      });
      setQuickDmText('');
      setQuickDmSent(true);
      setTimeout(() => setQuickDmSent(false), 2600);
    } catch {}
    setSendingQuickDm(false);
  };

  const badgeObjects = decoration.badges
    .map((id) => BADGE_CATALOG.find((b) => b.id === id))
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all max-h-[92vh] flex flex-col ${
          isDark
            ? 'bg-[#111214] border-white/15 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Discord-style Large Cover Banner */}
        <div
          className="relative h-28 px-5 pt-4 pb-10 np-bg-animate overflow-hidden shrink-0"
          style={{ backgroundImage: npTemplate.gradientCss }}
        >
          <NameplateEffectOverlay effectType={npTemplate.effectType} />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/35 hover:bg-black/55 text-white transition-colors cursor-pointer"
            aria-label="Đóng hồ sơ thành viên"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 flex items-center gap-1.5 text-[11px] font-bold text-white/95 drop-shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Hồ sơ Discord · {contextLabel}</span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="px-5 pb-5 -mt-10 relative z-10 space-y-3.5 overflow-y-auto">
          {/* Avatar with Animated Frame + Action Badges */}
          <div className="flex items-end justify-between gap-3">
            <div className="p-1.5 rounded-full bg-white dark:bg-[#111214] shadow-xl">
              <UserAvatarWithStatus
                name={profile.name}
                src={profile.avatar}
                presenceStatus={profile.presenceStatus}
                frameId={decoration.frameId}
                size="xl"
              />
            </div>

            <div className="flex items-center gap-1.5 pb-1">
              {!isSelf && onToggleFriend && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalFriendState((prev) => !prev);
                    onToggleFriend(profile);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    localFriendState
                      ? 'bg-[#248046] text-white hover:bg-[#1a6334]'
                      : 'bg-[#5865f2] text-white hover:bg-[#4752c4]'
                  }`}
                >
                  {localFriendState ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Đã kết bạn</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Kết bạn</span>
                    </>
                  )}
                </button>
              )}

              {isSelf && onOpenDecorationModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDecorationModal();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-extrabold cursor-pointer"
                >
                  🎨 Trang trí hồ sơ
                </button>
              )}
            </div>
          </div>

          {/* Nameplate Strip Showcase */}
          <NameplateBannerStrip nameplateId={decoration.nameplateId} className="rounded-2xl px-3.5 py-2.5 shadow-md">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className={`text-base font-black tracking-tight truncate ${npTemplate.textColorClass}`}>
                    {profile.name}
                  </h3>
                  {isSelf && (
                    <span className="text-[11px] font-bold text-white/90">(Bạn)</span>
                  )}
                </div>
                <p className={`text-[11px] font-semibold mt-0.5 flex items-center gap-1.5 ${npTemplate.subTextColorClass}`}>
                  <span>{presenceConf.iconEmoji}</span>
                  <span>{presenceConf.shortLabel} · {profile.roleLabel}</span>
                </p>
              </div>
              <UserBadgesStrip
                role={profile.roleType === 'admin' ? 'admin' : profile.roleType === 'teacher' ? 'teacher' : 'student'}
                isAi={profile.id.includes('max10-ai')}
                countryCode={isSelf ? countryCode : undefined}
                level={displayLevel}
                badges={decoration.badges}
                size="xs"
              />
            </div>
          </NameplateBannerStrip>

          {/* Badges List Card */}
          <div
            className={`p-3 rounded-2xl border space-y-2 ${
              isDark ? 'bg-[#1e1f22] border-white/[0.08]' : 'bg-slate-50 border-slate-200/85'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#949ba4]">
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Huy hiệu nổi bật
              </span>
              <span>{npTemplate.previewEmoji} {npTemplate.name}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {badgeObjects.length > 0 ? (
                badgeObjects.map((b) => (
                  <span
                    key={b!.id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold ${
                      isDark ? b!.colorClass : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <span>{b!.emoji}</span>
                    <span>{b!.name}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Chưa gắn huy hiệu</span>
              )}
            </div>
          </div>

          {/* Public Details Grid (ONLY non-sensitive public info) */}
          <div
            className={`p-3 rounded-2xl border grid grid-cols-2 gap-3 text-xs ${
              isDark
                ? 'bg-[#1e1f22] border-white/[0.08]'
                : 'bg-slate-50 border-slate-200/85'
            }`}
          >
            <div className="flex items-start gap-2 min-w-0">
              <GraduationCap className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Lớp &amp; Trường
                </div>
                <div className="font-bold truncate mt-0.5">
                  {profile.studentClass
                    ? `Lớp ${profile.studentClass}`
                    : profile.homeroomClass
                    ? `Chủ nhiệm ${profile.homeroomClass}`
                    : profile.grade || 'Thành viên THCS'}
                </div>
                {profile.schoolName && (
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    {profile.schoolName}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 min-w-0">
              <Trophy className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Thành tích Thi Đấu
                </div>
                <div className="font-black tabular-nums mt-0.5 text-amber-500">
                  {profile.duelWins ?? 0} thắng / {profile.duelPlayed ?? 0} trận
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 min-w-0">
              <Zap className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Cấp độ &amp; XP
                </div>
                <div className="font-bold tabular-nums mt-0.5">
                  Cấp {formatLevelLabel(displayLevel)}
                  {typeof profile.xp === 'number' ? ` · ${profile.xp.toLocaleString()} XP` : ''}
                </div>
                {displayLevelTitle && (
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    {displayLevelTitle}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 min-w-0">
              <Calendar className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Chuyên môn / Tham gia
                </div>
                <div className="font-bold truncate mt-0.5">
                  {profile.teachingSubject || profile.joinedAt || 'Thành viên tích cực'}
                </div>
              </div>
            </div>
          </div>

          {profile.bio && (
            <div
              className={`px-3.5 py-2 rounded-xl border text-xs leading-relaxed ${
                isDark ? 'bg-[#1e1f22] border-white/[0.07] text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="font-bold text-slate-500 dark:text-zinc-400">Giới thiệu: </span>
              {profile.bio}
            </div>
          )}

          {/* Inline Direct Message Box (Discord Popover Quick DM) */}
          {!isSelf && (
            <form onSubmit={handleQuickDirectSend} className="space-y-1.5">
              <div
                className={`flex items-center gap-1.5 p-1.5 rounded-xl border ${
                  isDark ? 'bg-[#1e1f22] border-white/10' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <input
                  type="text"
                  value={quickDmText}
                  onChange={(e) => setQuickDmText(e.target.value)}
                  placeholder={`Nhắn tin trực tiếp tới @${profile.name}...`}
                  className="flex-1 min-w-0 bg-transparent px-2 py-1 text-xs outline-none text-slate-900 dark:text-white placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={!quickDmText.trim() || sendingQuickDm}
                  className="px-2.5 py-1.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  title="Gửi tin nhắn trực tiếp"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </div>
              {quickDmSent && (
                <div className="text-[11px] font-bold text-emerald-500 px-1">
                  ✓ Đã gửi tin nhắn trực tiếp cho {profile.name}!
                </div>
              )}
            </form>
          )}

          {/* Privacy Guarantee */}
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-[10px] font-semibold ${
              isDark
                ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              Bảo mật riêng tư: Ẩn hoàn toàn Mật khẩu, Gmail &amp; Số điện thoại.
            </span>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartDuel(profile);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Swords className="w-4 h-4 shrink-0" />
              <span>{isSelf ? 'Tạo phòng Thi Đấu' : 'Thi đấu ngay'}</span>
            </button>

            {!isSelf && onOpenDirectMessage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDirectMessage(profile);
                }}
                className={`py-2.5 px-4 rounded-xl border font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isDark
                    ? 'bg-white/[0.06] border-white/10 hover:bg-white/12 text-zinc-200'
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-[#5865f2]" />
                <span>Mở khung chat 1-1</span>
              </button>
            )}
          </div>

          {loadingProfile && (
            <div className="text-[10px] text-center text-slate-400 dark:text-zinc-500">
              Đang đồng bộ thành tích mới nhất...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
