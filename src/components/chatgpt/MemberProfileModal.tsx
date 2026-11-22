import React, { useEffect, useState } from 'react';
import {
  X,
  Swords,
  MessageSquare,
  ShieldCheck,
  Trophy,
  Award,
  GraduationCap,
  Calendar,
  Zap,
  Sparkles,
} from 'lucide-react';
import { PublicMemberProfile, UserPresenceStatus } from '../../types';
import { UserAvatarWithStatus, PRESENCE_STATUS_CONFIG } from './UserAvatarWithStatus';
import { safeFetchJson } from '../../utils/safeFetchJson';
import { calculateLevel, formatLevelLabel } from '../../types/achievements';

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
  contextLabel?: string; // e.g. "Cộng đồng", "Nhóm học tập", "Bạn bè 1-1"
  isDark: boolean;
  onStartDuel: (targetMember: PublicMemberProfile) => void;
  onOpenDirectMessage?: (targetMember: PublicMemberProfile) => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  isOpen,
  onClose,
  member,
  currentUserId,
  contextLabel = 'Cộng đồng & Nhóm',
  isDark,
  onStartDuel,
  onOpenDirectMessage,
}) => {
  const [profile, setProfile] = useState<PublicMemberProfile | null>(member);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    setProfile(member);
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
          // Keep friendly local name if server returned generic fallback
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
  }, [isOpen, member]);

  if (!isOpen || !profile) return null;

  const isSelf = profile.id === currentUserId;
  const presenceConf = PRESENCE_STATUS_CONFIG[profile.presenceStatus] || PRESENCE_STATUS_CONFIG.online;
  const computedLevel = typeof profile.xp === 'number' ? calculateLevel(profile.xp) : null;
  const displayLevel = profile.level ?? computedLevel?.level;
  const displayLevelTitle = profile.levelTitle || computedLevel?.title;

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#0e1422] border-white/15 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Banner */}
        <div className="relative px-5 pt-5 pb-10 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-black/25 hover:bg-black/45 text-white transition-colors cursor-pointer"
            aria-label="Đóng hồ sơ thành viên"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Hồ sơ thành viên</span>
            <span aria-hidden="true">·</span>
            <span>{contextLabel}</span>
          </div>
        </div>

        {/* Avatar Overlap + Identity */}
        <div className="px-5 pb-5 -mt-8 relative z-10 space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div className="p-1 rounded-full bg-white dark:bg-[#0e1422] shadow-lg">
              <UserAvatarWithStatus
                name={profile.name}
                src={profile.avatar}
                presenceStatus={profile.presenceStatus}
                size="xl"
              />
            </div>

            <div className="flex items-center gap-1.5 pb-1">
              <span
                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                  profile.roleType === 'admin'
                    ? 'bg-blue-500/12 border-blue-500/30 text-blue-600 dark:text-blue-300'
                    : profile.roleType === 'teacher'
                    ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/12 border-amber-500/30 text-amber-700 dark:text-amber-300'
                }`}
              >
                {profile.roleLabel}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-black tracking-tight">{profile.name}</h3>
              {isSelf && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  (Bạn)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <span>{presenceConf.iconEmoji}</span>
              <span>{presenceConf.sublabel}</span>
            </p>
          </div>

          {/* Public Details Grid (ONLY non-sensitive public info) */}
          <div
            className={`p-3.5 rounded-2xl border grid grid-cols-2 gap-3 text-xs ${
              isDark
                ? 'bg-white/[0.03] border-white/[0.08]'
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
                <div className="font-black tabular-nums mt-0.5 text-amber-600 dark:text-amber-400">
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
                  {displayLevel
                    ? `Cấp ${formatLevelLabel(displayLevel)}${
                        typeof profile.xp === 'number' ? ` · ${profile.xp.toLocaleString()} XP` : ''
                      }`
                    : 'Đang tích lũy XP'}
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
              className={`px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed ${
                isDark ? 'bg-white/[0.02] border-white/[0.07] text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="font-bold text-slate-500 dark:text-zinc-400">Giới thiệu: </span>
              {profile.bio}
            </div>
          )}

          {/* Explicit Privacy Protection Notice */}
          <div
            className={`px-3 py-2 rounded-xl border flex items-center gap-2 text-[11px] font-semibold ${
              isDark
                ? 'bg-emerald-500/8 border-emerald-500/25 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Bảo mật riêng tư: Chỉ hiển thị thông tin công khai — ẩn hoàn toàn Mật khẩu, Gmail &amp; Số điện thoại.
            </span>
          </div>

          {/* Action Buttons: Thi đấu ngay + Nhắn tin 1-1 */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
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
                    ? 'bg-white/[0.05] border-white/10 hover:bg-white/10 text-zinc-200'
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Nhắn tin 1-1</span>
              </button>
            )}
          </div>

          {loadingProfile && (
            <div className="text-[10px] text-center text-slate-400 dark:text-zinc-500">
              Đang đồng bộ thành tích thi đấu mới nhất...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
