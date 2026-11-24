import React from 'react';
import { Bot, Crown } from 'lucide-react';
import {
  BADGE_CATALOG,
  NameplateId,
  NameplateTemplate,
  ProfileBadgeId,
  getCountryFlagFromCode,
  getNameplateById,
} from '../../data/profileDecorations';
import { CountryCode } from '../../data/countryCultures';

interface NameplateEffectOverlayProps {
  effectType: NameplateTemplate['effectType'];
  compact?: boolean;
}

export const NameplateEffectOverlay: React.FC<NameplateEffectOverlayProps> = ({
  effectType,
  compact = false,
}) => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      {/* Subtle diagonal glass metallic sheen common across nameplates */}
      <div
        className="np-shimmer absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      {effectType === 'sparks' && (
        <>
          <svg className="absolute right-2 top-1 w-14 h-9 opacity-85" viewBox="0 0 60 36" fill="none">
            <path
              className="np-sparkle"
              d="M46 6L48 11L53 13L48 15L46 20L44 15L39 13L44 11L46 6Z"
              fill="#FDE047"
            />
            <circle className="np-ember" cx="26" cy="24" r="1.8" fill="#FBBF24" />
            <circle
              className="np-ember"
              style={{ animationDelay: '0.9s' }}
              cx="36"
              cy="28"
              r="1.4"
              fill="#FEF08A"
            />
          </svg>
        </>
      )}

      {effectType === 'stars' && (
        <svg className="absolute inset-0 w-full h-full opacity-80" viewBox="0 0 180 48" fill="none">
          <circle className="np-sparkle" cx="128" cy="12" r="1.6" fill="#E9D5FF" />
          <circle
            className="np-sparkle"
            style={{ animationDelay: '0.7s' }}
            cx="154"
            cy="26"
            r="2"
            fill="#FFFFFF"
          />
          <circle
            className="np-sparkle"
            style={{ animationDelay: '1.3s' }}
            cx="96"
            cy="34"
            r="1.3"
            fill="#C4B5FD"
          />
          <path
            className="np-sparkle"
            style={{ animationDelay: '0.4s' }}
            d="M164 8L165.3 11L168.5 12.2L165.3 13.4L164 16.4L162.7 13.4L159.5 12.2L162.7 11L164 8Z"
            fill="#F5D0FE"
          />
        </svg>
      )}

      {effectType === 'lightning' && (
        <svg
          className="np-lightning absolute right-0 top-0 h-full w-28"
          viewBox="0 0 120 48"
          fill="none"
        >
          <path
            d="M10 26L46 20L52 10L78 24L88 15L114 22"
            stroke="#22D3EE"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          <path
            d="M28 38L62 31L74 37L105 28"
            stroke="#67E8F9"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      )}

      {effectType === 'sakura' && (
        <div className="absolute inset-0">
          <span
            className="np-petal absolute right-8 top-0 text-[10px] select-none"
            style={{ animationDelay: '0s' }}
          >
            🌸
          </span>
          <span
            className="np-petal absolute right-20 top-1 text-[9px] select-none"
            style={{ animationDelay: '1.6s' }}
          >
            💮
          </span>
          {!compact && (
            <span
              className="np-petal absolute right-32 top-0 text-[9px] select-none"
              style={{ animationDelay: '2.9s' }}
            >
              🌸
            </span>
          )}
        </div>
      )}

      {effectType === 'fire' && (
        <svg className="absolute right-1 bottom-0 w-24 h-full opacity-90" viewBox="0 0 96 48" fill="none">
          <circle className="np-ember" cx="55" cy="36" r="2.2" fill="#FDE047" />
          <circle
            className="np-ember"
            style={{ animationDelay: '0.8s' }}
            cx="72"
            cy="38"
            r="1.8"
            fill="#FB923C"
          />
          <circle
            className="np-ember"
            style={{ animationDelay: '1.5s' }}
            cx="84"
            cy="34"
            r="2"
            fill="#FEF08A"
          />
        </svg>
      )}

      {effectType === 'ice' && (
        <svg className="absolute right-2 top-1 w-20 h-10 opacity-85" viewBox="0 0 80 40" fill="none">
          <path
            className="np-sparkle"
            d="M62 6V18M56 12H68M58 8L66 16M66 8L58 16"
            stroke="#E0F2FE"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle
            className="np-sparkle"
            style={{ animationDelay: '1.1s' }}
            cx="40"
            cy="28"
            r="1.6"
            fill="#BAE6FD"
          />
        </svg>
      )}

      {effectType === 'math' && (
        <div className="absolute inset-0 flex items-center justify-end pr-3 gap-2.5 text-[11px] font-black text-cyan-100/45 select-none">
          <span className="np-sparkle">π</span>
          <span className="np-sparkle" style={{ animationDelay: '0.7s' }}>
            ∑
          </span>
          {!compact && (
            <span className="np-sparkle" style={{ animationDelay: '1.3s' }}>
              10★
            </span>
          )}
        </div>
      )}

      {effectType === 'aurora' && (
        <div
          className="absolute inset-0 opacity-45"
          style={{
            background:
              'radial-gradient(ellipse at 75% 20%, rgba(110, 231, 183, 0.55), transparent 60%)',
          }}
        />
      )}

      {effectType === 'ocean' && (
        <svg className="absolute bottom-0 right-0 w-32 h-6 opacity-45" viewBox="0 0 128 24" fill="none">
          <path
            d="M0 16C24 6 48 22 72 12C96 2 112 18 128 10V24H0V16Z"
            fill="rgba(186,230,253,0.4)"
          />
        </svg>
      )}

      {effectType === 'victory' && (
        <div className="absolute right-2.5 top-1.5 flex items-center gap-1 opacity-75 text-[11px]">
          <span className="np-sparkle">✦</span>
          {!compact && (
            <span className="np-sparkle" style={{ animationDelay: '0.8s' }}>
              ★
            </span>
          )}
        </div>
      )}

      {effectType === 'synth' && (
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.28) 1px, transparent 1px), linear-gradient(to top, rgba(255,255,255,0.28) 1px, transparent 1px)',
            backgroundSize: '12px 10px',
          }}
        />
      )}

      {effectType === 'meteor' && (
        <svg className="absolute inset-0 w-full h-full opacity-90" viewBox="0 0 180 48" fill="none">
          <g className="np-meteor">
            <line x1="20" y1="8" x2="48" y2="20" stroke="#A5B4FC" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="48" cy="20" r="2" fill="#FFFFFF" />
          </g>
        </svg>
      )}
    </div>
  );
};

interface NameplateBannerStripProps {
  nameplateId?: NameplateId;
  className?: string;
  compact?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const NameplateBannerStrip: React.FC<NameplateBannerStripProps> = ({
  nameplateId = 'hoc_ba_diem_10',
  className = '',
  compact = false,
  onClick,
  children,
}) => {
  const np = getNameplateById(nameplateId);

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden np-bg-animate border transition-transform ${
        onClick ? 'cursor-pointer hover:brightness-110 active:scale-[0.99]' : ''
      } ${className}`}
      style={{
        backgroundImage: np.gradientCss,
        borderColor: np.borderCss,
      }}
    >
      <NameplateEffectOverlay effectType={np.effectType} compact={compact} />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

interface UserBadgesStripProps {
  role?: 'admin' | 'teacher' | 'member' | 'ai_tutor' | 'deputy' | 'student' | 'friend';
  isAi?: boolean;
  countryCode?: CountryCode;
  level?: number;
  badges?: ProfileBadgeId[];
  maxCustomBadges?: number;
  size?: 'xs' | 'sm';
}

export const UserBadgesStrip: React.FC<UserBadgesStripProps> = ({
  role,
  isAi = false,
  countryCode,
  level,
  badges = [],
  maxCustomBadges = 2,
  size = 'xs',
}) => {
  const isAdminRole = role === 'admin';
  const isAiRole = isAi || role === 'ai_tutor';
  const customBadgeObjs = badges
    .map((id) => BADGE_CATALOG.find((b) => b.id === id))
    .filter(Boolean)
    .slice(0, maxCustomBadges);

  const badgePad = size === 'xs' ? 'px-1 py-[1px] text-[9px]' : 'px-1.5 py-0.5 text-[10px]';

  return (
    <span className="inline-flex items-center gap-1 flex-wrap align-middle">
      {isAdminRole && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-[4px] bg-amber-400/25 border border-amber-300/60 text-amber-200 font-black uppercase ${badgePad}`}
          title="Quản trị viên Tối thượng"
        >
          <Crown className="w-2.5 h-2.5 text-amber-300 shrink-0" />
          <span>ADMIN</span>
        </span>
      )}

      {isAiRole && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-[4px] bg-[#5865f2] border border-indigo-300/40 text-white font-black uppercase ${badgePad}`}
          title="Gia sư Robot AI"
        >
          <Bot className="w-2.5 h-2.5 shrink-0" />
          <span>AI</span>
        </span>
      )}

      {countryCode && (
        <span
          className={`inline-flex items-center rounded-[4px] bg-black/25 border border-white/15 text-white font-bold ${badgePad}`}
          title={`Quốc gia đang học: ${countryCode}`}
        >
          {getCountryFlagFromCode(countryCode)}
        </span>
      )}

      {typeof level === 'number' && level > 0 && (
        <span
          className={`inline-flex items-center rounded-[4px] bg-emerald-500/25 border border-emerald-300/40 text-emerald-100 font-black tabular-nums ${badgePad}`}
          title={`Cấp độ ${level}`}
        >
          Lv.{level}
        </span>
      )}

      {customBadgeObjs.map((b) => (
        <span
          key={b!.id}
          className={`inline-flex items-center gap-0.5 rounded-[4px] border font-bold ${b!.colorClass} ${badgePad}`}
          title={`${b!.name}: ${b!.description}`}
        >
          <span>{b!.emoji}</span>
          {size === 'sm' && <span>{b!.shortLabel}</span>}
        </span>
      ))}
    </span>
  );
};
