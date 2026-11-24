import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Lock, Palette, Image as ImageIcon, Award } from 'lucide-react';
import {
  AVATAR_FRAME_TEMPLATES,
  BADGE_CATALOG,
  NAMEPLATE_TEMPLATES,
  AvatarFrameId,
  NameplateId,
  ProfileBadgeId,
  UserDecorationConfig,
  getNameplateById,
  loadLocalDecorations,
  loadVipUnlockedDecorations,
  saveLocalDecorations,
} from '../../data/profileDecorations';
import { UserAvatarWithStatus } from './UserAvatarWithStatus';
import { NameplateBannerStrip, UserBadgesStrip } from './ProfileDecorationSystem';
import { CountryCode } from '../../data/countryCultures';
import { loadStudentAchievements } from '../../data/initialAchievements';
import { calculateLevel } from '../../types/achievements';

interface ProfileDecorationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userAvatar?: string;
  isAdmin?: boolean;
  isDark?: boolean;
  countryCode?: CountryCode;
  onOpenAvatarModal?: () => void;
  onSaved?: (config: UserDecorationConfig) => void;
}

export const ProfileDecorationModal: React.FC<ProfileDecorationModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userAvatar,
  isAdmin = false,
  isDark = true,
  countryCode = 'VN',
  onOpenAvatarModal,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'nameplate' | 'frame' | 'badges'>('nameplate');
  const [config, setConfig] = useState<UserDecorationConfig>(() => loadLocalDecorations(isAdmin));
  const [saving, setSaving] = useState(false);

  const stats = loadStudentAchievements();
  const totalXp = isAdmin ? Math.max(stats.totalXp, 99999) : stats.totalXp;
  const levelInfo = calculateLevel(totalXp);

  useEffect(() => {
    if (isOpen) {
      setConfig(loadLocalDecorations(isAdmin));
    }
  }, [isOpen, isAdmin]);

  if (!isOpen) return null;

  const selectedNameplate = getNameplateById(config.nameplateId);

  const handleToggleBadge = (badgeId: ProfileBadgeId) => {
    setConfig((prev) => {
      const exists = prev.badges.includes(badgeId);
      if (exists) {
        return { ...prev, badges: prev.badges.filter((b) => b !== badgeId) };
      }
      if (prev.badges.length >= 3) {
        return { ...prev, badges: [...prev.badges.slice(1), badgeId] };
      }
      return { ...prev, badges: [...prev.badges, badgeId] };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    saveLocalDecorations(config);
    try {
      await fetch('/api/profile/decorations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, decoration: config }),
      });
    } catch {}
    onSaved?.(config);
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[10070] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark
            ? 'bg-[#1e1f22] border-white/15 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-white/10 bg-[#2b2d31]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5865f2] to-emerald-500 text-white flex items-center justify-center shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Trang trí hồ sơ Discord &amp; Học bá</h2>
              <p className="text-[11px] text-slate-500 dark:text-[#949ba4]">
                Hiện có <strong className="text-emerald-500 tabular-nums">{totalXp.toLocaleString()} XP</strong> · Tự do chọn Dải nền tên, Khung viền &amp; Huy hiệu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Discord Nameplate + Avatar Frame Preview */}
        <div
          className={`px-5 py-4 border-b shrink-0 ${
            isDark ? 'border-white/10 bg-[#313338]' : 'border-slate-200 bg-slate-100/70'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#949ba4] mb-1.5">
                Xem trước thẻ Thành viên của bạn:
              </div>
              <NameplateBannerStrip
                nameplateId={config.nameplateId}
                className="rounded-xl px-3 py-2 shadow-md max-w-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatarWithStatus
                    name={userName}
                    src={userAvatar}
                    presenceStatus="online"
                    frameId={config.frameId}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-sm font-black truncate drop-shadow-xs ${selectedNameplate.textColorClass}`}>
                        {userName}
                      </span>
                      <UserBadgesStrip
                        role={isAdmin ? 'admin' : 'student'}
                        countryCode={countryCode}
                        level={levelInfo.level}
                        badges={config.badges}
                        maxCustomBadges={3}
                        size="xs"
                      />
                    </div>
                    <div className={`text-[11px] font-semibold truncate ${selectedNameplate.subTextColorClass}`}>
                      {selectedNameplate.previewEmoji} {selectedNameplate.name}
                    </div>
                  </div>
                </div>
              </NameplateBannerStrip>
            </div>

            {onOpenAvatarModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAvatarModal();
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-[#1e1f22] dark:hover:bg-[#404249] border border-slate-300 dark:border-white/15 text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span>Đổi Ảnh đại diện</span>
              </button>
            )}
          </div>
        </div>

        {/* Section Tabs */}
        <div
          className={`px-5 pt-3 flex items-center gap-2 border-b shrink-0 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          {[
            { id: 'nameplate' as const, label: `Dải nền tên (${NAMEPLATE_TEMPLATES.length})`, icon: Sparkles },
            { id: 'frame' as const, label: `Khung Avatar (${AVATAR_FRAME_TEMPLATES.length})`, icon: Palette },
            { id: 'badges' as const, label: `Huy hiệu (${config.badges.length}/3)`, icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-[#5865f2] text-[#5865f2] dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-[#949ba4] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Picker Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'nameplate' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NAMEPLATE_TEMPLATES.map((np) => {
                const vipUnlocks = loadVipUnlockedDecorations();
                const isVipUnlocked = vipUnlocks.nameplates.includes(np.id);
                const isLocked =
                  !isVipUnlocked &&
                  ((np.adminOnly && !isAdmin) || (!isAdmin && totalXp < np.xpRequired));
                const isSelected = config.nameplateId === np.id;
                return (
                  <button
                    key={np.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setConfig((prev) => ({ ...prev, nameplateId: np.id as NameplateId }))}
                    className={`text-left rounded-2xl p-2.5 border transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-[#5865f2] ring-2 ring-[#5865f2]/40 bg-[#5865f2]/10'
                        : isDark
                        ? 'border-white/10 bg-[#2b2d31] hover:border-white/25'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <NameplateBannerStrip nameplateId={np.id} className="rounded-xl px-3 py-2 mb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{np.previewEmoji}</span>
                          <span className={`text-xs font-black truncate ${np.textColorClass}`}>
                            {np.name}
                          </span>
                        </div>
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-white text-[#5865f2] flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : isLocked ? (
                          <span className="px-1.5 py-0.5 rounded bg-black/40 text-white text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <Lock className="w-2.5 h-2.5" />
                            {np.adminOnly ? 'Admin' : `${np.xpRequired} XP`}
                          </span>
                        ) : null}
                      </div>
                    </NameplateBannerStrip>
                    <p className="text-[11px] text-slate-500 dark:text-[#b5bac1] line-clamp-2 px-1">
                      {np.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'frame' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVATAR_FRAME_TEMPLATES.map((fr) => {
                const vipUnlocks = loadVipUnlockedDecorations();
                const isLocked =
                  !isAdmin && !vipUnlocks.frames.includes(fr.id) && totalXp < fr.xpRequired;
                const isSelected = config.frameId === fr.id;
                return (
                  <button
                    key={fr.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setConfig((prev) => ({ ...prev, frameId: fr.id as AvatarFrameId }))}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-[#5865f2] ring-2 ring-[#5865f2]/40 bg-[#5865f2]/10'
                        : isDark
                        ? 'border-white/10 bg-[#2b2d31] hover:border-white/25'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <UserAvatarWithStatus
                      name={userName}
                      src={userAvatar}
                      presenceStatus="online"
                      frameId={fr.id}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black truncate">
                          {fr.previewEmoji} {fr.name}
                        </span>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-[#5865f2] shrink-0" />
                        ) : isLocked ? (
                          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5 shrink-0">
                            <Lock className="w-3 h-3" /> {fr.xpRequired} XP
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#949ba4] mt-0.5">
                        {fr.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BADGE_CATALOG.map((badge) => {
                const isLocked = !isAdmin && totalXp < badge.xpRequired;
                const isSelected = config.badges.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleToggleBadge(badge.id)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/10'
                        : isDark
                        ? 'border-white/10 bg-[#2b2d31] hover:border-white/25'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center text-xl shrink-0">
                      {badge.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black truncate">{badge.name}</span>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : isLocked ? (
                          <span className="text-[10px] font-bold text-amber-500">{badge.xpRequired} XP</span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#949ba4] mt-0.5">
                        {badge.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-between gap-3 shrink-0 ${
            isDark ? 'border-white/10 bg-[#2b2d31]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <span className="text-[11px] text-slate-500 dark:text-[#949ba4]">
            Tự động đồng bộ trên danh sách thành viên &amp; khung chat
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/15 text-xs font-bold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 text-white text-xs font-black cursor-pointer shadow-sm"
            >
              {saving ? 'Đang lưu...' : 'Lưu trang trí'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
