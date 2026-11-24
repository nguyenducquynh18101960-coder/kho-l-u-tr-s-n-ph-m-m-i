import React, { useState } from 'react';
import { UserPresenceStatus } from '../../types';
import { AvatarFrameId, getAvatarFrameById } from '../../data/profileDecorations';

export interface UserAvatarWithStatusProps {
  src?: string;
  name: string;
  presenceStatus?: UserPresenceStatus;
  frameId?: AvatarFrameId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isEditable?: boolean;
  onStatusChange?: (newStatus: UserPresenceStatus) => void;
  showStatusTooltip?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

export const PRESENCE_STATUS_CONFIG: Record<
  UserPresenceStatus,
  {
    label: string;
    shortLabel: string;
    sublabel: string;
    colorClass: string;
    ringClass: string;
    iconEmoji: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  online: {
    label: 'Online (Xanh lá)',
    shortLabel: 'Online',
    sublabel: 'Đang trực tuyến, sẵn sàng học tập & trò chuyện',
    colorClass: 'bg-emerald-500',
    ringClass: 'ring-emerald-400/30',
    iconEmoji: '🟢',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  gaming: {
    label: 'Đang học bài (Vàng)',
    shortLabel: 'Đang học bài',
    sublabel: 'Đang tập trung ôn bài hoặc giải đề thi',
    colorClass: 'bg-amber-400',
    ringClass: 'ring-amber-400/30',
    iconEmoji: '🟡',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
    badgeText: 'text-amber-800 dark:text-amber-300',
  },
  dnd: {
    label: 'Bận (Đỏ)',
    shortLabel: 'Bận',
    sublabel: 'Đang bận — hạn chế làm phiền',
    colorClass: 'bg-rose-500',
    ringClass: 'ring-rose-400/30',
    iconEmoji: '🔴',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/80',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
  offline: {
    label: 'Offline (Xám)',
    shortLabel: 'Offline',
    sublabel: 'Đang ngoại tuyến / Tạm thời không hoạt động',
    colorClass: 'bg-slate-400 dark:bg-zinc-500',
    ringClass: 'ring-slate-400/30',
    iconEmoji: '⚪',
    badgeBg: 'bg-slate-100 dark:bg-zinc-800',
    badgeText: 'text-slate-600 dark:text-zinc-400',
  },
};

const SIZE_CLASSES = {
  xs: {
    container: 'w-6 h-6',
    dot: 'w-2 h-2 -bottom-0.5 -right-0.5 border',
    text: 'text-[10px]',
    framePad: 'p-[1.5px]',
  },
  sm: {
    container: 'w-8 h-8',
    dot: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 border-[1.5px]',
    text: 'text-xs',
    framePad: 'p-[2px]',
  },
  md: {
    container: 'w-10 h-10',
    dot: 'w-3 h-3 -bottom-0.5 -right-0.5 border-2',
    text: 'text-sm',
    framePad: 'p-[2.5px]',
  },
  lg: {
    container: 'w-12 h-12',
    dot: 'w-3.5 h-3.5 bottom-0 right-0 border-2',
    text: 'text-base',
    framePad: 'p-[2.5px]',
  },
  xl: {
    container: 'w-16 h-16',
    dot: 'w-4 h-4 bottom-0 right-0 border-2',
    text: 'text-xl',
    framePad: 'p-[3px]',
  },
};

export const UserAvatarWithStatus: React.FC<UserAvatarWithStatusProps> = ({
  src,
  name,
  presenceStatus = 'online',
  frameId = 'none',
  size = 'md',
  className = '',
  isEditable = false,
  onStatusChange,
  showStatusTooltip = true,
  onClick,
  title,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const sizeConfig = SIZE_CLASSES[size];
  const statusInfo = PRESENCE_STATUS_CONFIG[presenceStatus] || PRESENCE_STATUS_CONFIG.online;
  const frameTemplate = frameId && frameId !== 'none' ? getAvatarFrameById(frameId) : null;

  const initials = (name || 'Bạn')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSelectStatus = (s: UserPresenceStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onStatusChange) {
      onStatusChange(s);
    }
  };

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {/* Animated Outer Avatar Frame Ring */}
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        title={title || (onClick ? `Xem hồ sơ & Kết nối cùng ${name}` : undefined)}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick(e as unknown as React.MouseEvent);
                }
              }
            : undefined
        }
        className={`relative rounded-full flex items-center justify-center select-none ${
          frameTemplate ? `${sizeConfig.framePad}` : ''
        } ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
        style={
          frameTemplate
            ? {
                boxShadow: frameTemplate.glowShadowCss !== 'none' ? frameTemplate.glowShadowCss : undefined,
              }
            : undefined
        }
      >
        {frameTemplate && (
          <span
            aria-hidden="true"
            className={`absolute inset-0 rounded-full pointer-events-none ${
              frameTemplate.spin ? 'avatar-frame-spin' : 'avatar-frame-breathe'
            }`}
            style={{ background: frameTemplate.ringGradientCss }}
          />
        )}

        <div
          className={`relative z-10 ${sizeConfig.container} rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center border ${
            frameTemplate
              ? 'border-slate-900/70 dark:border-[#1e1f22]'
              : 'border-slate-200 dark:border-zinc-700'
          } shadow-2xs`}
        >
          {src ? (
            <img
              src={src}
              alt={name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className={sizeConfig.text}>{initials}</span>
          )}
        </div>
      </div>

      {/* Status Dot under Avatar */}
      <button
        type="button"
        onClick={(e) => {
          if (isEditable) {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }
        }}
        disabled={!isEditable}
        title={
          showStatusTooltip
            ? `${statusInfo.iconEmoji} ${statusInfo.label} - ${statusInfo.sublabel}${
                isEditable ? ' (Bấm để đổi trạng thái)' : ''
              }`
            : undefined
        }
        className={`absolute z-20 rounded-full border-white dark:border-zinc-900 transition-transform ${
          sizeConfig.dot
        } ${statusInfo.colorClass} ${
          isEditable ? 'cursor-pointer hover:scale-125 focus:outline-hidden ring-2 ' + statusInfo.ringClass : ''
        }`}
        aria-label={`Trạng thái: ${statusInfo.label}`}
      />

      {/* Dropdown menu to change status if editable */}
      {isEditable && showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
          <div
            className="absolute left-0 mt-2 z-50 w-64 p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl text-left animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1 mb-1 border-b border-slate-100 dark:border-zinc-800">
              <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                CHỌN TRẠNG THÁI HOẠT ĐỘNG:
              </p>
            </div>

            <div className="space-y-1">
              {(Object.keys(PRESENCE_STATUS_CONFIG) as UserPresenceStatus[]).map((key) => {
                const conf = PRESENCE_STATUS_CONFIG[key];
                const isCurrent = presenceStatus === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={(e) => handleSelectStatus(key, e)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 border border-white dark:border-zinc-900 ${conf.colorClass}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-tight">{conf.label}</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-tight truncate">
                        {conf.sublabel}
                      </p>
                    </div>
                    {isCurrent && <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
