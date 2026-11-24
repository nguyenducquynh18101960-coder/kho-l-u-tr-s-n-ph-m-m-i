import { CountryCode } from './countryCultures';

export type NameplateId =
  | 'admin_supreme'
  | 'galaxy_nebula'
  | 'cyberpunk_bolt'
  | 'sakura_drift'
  | 'fire_dragon'
  | 'ice_crystal'
  | 'hoc_ba_diem_10'
  | 'aurora_borealis'
  | 'ocean_tide'
  | 'golden_victory'
  | 'neon_synth'
  | 'meteor_shower';

export type AvatarFrameId =
  | 'none'
  | 'royal_gold'
  | 'neon_cyber'
  | 'galaxy_orbit'
  | 'sakura_ring'
  | 'fire_aura'
  | 'frost_halo'
  | 'diem10_champion';

export type ProfileBadgeId =
  | 'hoc_ba_10'
  | 'chien_than_duel'
  | 'streak_master'
  | 'mythic_star'
  | 'polyglot_explorer'
  | 'top_scholar';

export interface NameplateTemplate {
  id: NameplateId;
  name: string;
  description: string;
  xpRequired: number;
  gradientCss: string;
  borderCss: string;
  textColorClass: string;
  subTextColorClass: string;
  effectType:
    | 'sparks'
    | 'stars'
    | 'lightning'
    | 'sakura'
    | 'fire'
    | 'ice'
    | 'math'
    | 'aurora'
    | 'ocean'
    | 'victory'
    | 'synth'
    | 'meteor';
  previewEmoji: string;
  adminOnly?: boolean;
}

export interface AvatarFrameTemplate {
  id: AvatarFrameId;
  name: string;
  description: string;
  xpRequired: number;
  ringGradientCss: string;
  glowShadowCss: string;
  spin?: boolean;
  previewEmoji: string;
}

export interface ProfileBadgeTemplate {
  id: ProfileBadgeId;
  name: string;
  shortLabel: string;
  emoji: string;
  description: string;
  colorClass: string;
  xpRequired: number;
}

export interface UserDecorationConfig {
  nameplateId: NameplateId;
  frameId: AvatarFrameId;
  badges: ProfileBadgeId[];
  coverBannerGradient?: string;
}

export const NAMEPLATE_TEMPLATES: NameplateTemplate[] = [
  {
    id: 'hoc_ba_diem_10',
    name: 'Học bá Điểm 10',
    description: 'Nền xanh tri thức với công thức toán học, sách vở và ngôi sao điểm 10 bay nhẹ.',
    xpRequired: 0,
    gradientCss: 'linear-gradient(125deg, #0b3b5b 0%, #0f766e 48%, #0284c7 100%)',
    borderCss: 'rgba(56, 189, 248, 0.45)',
    textColorClass: 'text-white',
    subTextColorClass: 'text-cyan-100/90',
    effectType: 'math',
    previewEmoji: '📐',
  },
  {
    id: 'galaxy_nebula',
    name: 'Vũ trụ Galaxy',
    description: 'Nền tím xanh ngân hà với các ngôi sao nhấp nháy và dải tinh vân trôi nhẹ.',
    xpRequired: 0,
    gradientCss: 'linear-gradient(130deg, #1b103f 0%, #4338ca 50%, #7c3aed 100%)',
    borderCss: 'rgba(167, 139, 250, 0.45)',
    textColorClass: 'text-white',
    subTextColorClass: 'text-violet-200/90',
    effectType: 'stars',
    previewEmoji: '🌌',
  },
  {
    id: 'cyberpunk_bolt',
    name: 'Sấm sét Cyberpunk',
    description: 'Nền xanh neon tối màu với tia sét điện tử chạy ngang đầy năng lượng.',
    xpRequired: 0,
    gradientCss: 'linear-gradient(130deg, #090d1e 0%, #0f172a 45%, #0e7490 100%)',
    borderCss: 'rgba(34, 211, 238, 0.55)',
    textColorClass: 'text-cyan-50',
    subTextColorClass: 'text-cyan-300/90',
    effectType: 'lightning',
    previewEmoji: '⚡',
  },
  {
    id: 'sakura_drift',
    name: 'Hoa anh đào Sakura',
    description: 'Nền hồng pastel dịu mắt với những cánh hoa anh đào rơi nhẹ nhàng.',
    xpRequired: 0,
    gradientCss: 'linear-gradient(130deg, #9d174d 0%, #ec4899 52%, #f472b6 100%)',
    borderCss: 'rgba(251, 207, 232, 0.55)',
    textColorClass: 'text-white',
    subTextColorClass: 'text-pink-100/95',
    effectType: 'sakura',
    previewEmoji: '🌸',
  },
  {
    id: 'fire_dragon',
    name: 'Rồng lửa rực cháy',
    description: 'Nền đỏ cam rực lửa với đốm than hồng bay lên mạnh mẽ.',
    xpRequired: 100,
    gradientCss: 'linear-gradient(130deg, #450a0a 0%, #b91c1c 48%, #ea580c 100%)',
    borderCss: 'rgba(251, 146, 60, 0.55)',
    textColorClass: 'text-amber-50',
    subTextColorClass: 'text-orange-200/95',
    effectType: 'fire',
    previewEmoji: '🐉',
  },
  {
    id: 'ice_crystal',
    name: 'Băng giá Tinh thể',
    description: 'Nền xanh băng tuyết với tinh thể băng lấp lánh thanh khiết.',
    xpRequired: 100,
    gradientCss: 'linear-gradient(130deg, #0c4a6e 0%, #0284c7 48%, #38bdf8 100%)',
    borderCss: 'rgba(186, 230, 253, 0.55)',
    textColorClass: 'text-white',
    subTextColorClass: 'text-sky-100/95',
    effectType: 'ice',
    previewEmoji: '❄️',
  },
  {
    id: 'aurora_borealis',
    name: 'Cực quang Aurora',
    description: 'Dải cực quang xanh ngọc lục bảo chuyển sắc huyền ảo vùng Bắc Cực.',
    xpRequired: 150,
    gradientCss: 'linear-gradient(130deg, #064e3b 0%, #059669 45%, #6366f1 100%)',
    borderCss: 'rgba(52, 211, 153, 0.5)',
    textColorClass: 'text-white',
    subTextColorClass: 'text-emerald-100/90',
    effectType: 'aurora',
    previewEmoji: '✨',
  },
  {
    id: 'ocean_tide',
    name: 'Thủy triều Đại dương',
    description: 'Nền xanh lam đại dương với ánh sóng phản chiếu lấp lánh.',
    xpRequired: 150,
    gradientCss: 'linear-gradient(130deg, #0f172a 0%, #1d4ed8 50%, #06b6d4 100%)',
    borderCss: 'rgba(96, 165, 250, 0.45)',
    textColorClass: 'text-white',
    subTextColorClass: 'text-cyan-100/90',
    effectType: 'ocean',
    previewEmoji: '🌊',
  },
  {
    id: 'golden_victory',
    name: 'Hoàng kim Chiến thắng',
    description: 'Nền đen vàng ánh kim sang trọng dành cho nhà vô địch đấu trường.',
    xpRequired: 200,
    gradientCss: 'linear-gradient(130deg, #1c1917 0%, #92400e 50%, #eab308 100%)',
    borderCss: 'rgba(250, 204, 21, 0.6)',
    textColorClass: 'text-amber-50',
    subTextColorClass: 'text-yellow-200/90',
    effectType: 'victory',
    previewEmoji: '🏆',
  },
  {
    id: 'neon_synth',
    name: 'Vườn Neon Synthwave',
    description: 'Sắc tím hồng tương lai rực rỡ với đường chân trời lưới ánh sáng.',
    xpRequired: 250,
    gradientCss: 'linear-gradient(130deg, #3b0764 0%, #a21caf 50%, #f43f5e 100%)',
    borderCss: 'rgba(244, 114, 182, 0.5)',
    textColorClass: 'text-white',
    subTextColorClass: 'text-fuchsia-100/90',
    effectType: 'synth',
    previewEmoji: '🌆',
  },
  {
    id: 'meteor_shower',
    name: 'Mưa Sao Băng',
    description: 'Bầu trời đêm thẫm điểm xuyết vệt sao băng lướt qua liên tục.',
    xpRequired: 300,
    gradientCss: 'linear-gradient(130deg, #090d16 0%, #1e1b4b 55%, #312e81 100%)',
    borderCss: 'rgba(129, 140, 248, 0.5)',
    textColorClass: 'text-indigo-50',
    subTextColorClass: 'text-indigo-200/90',
    effectType: 'meteor',
    previewEmoji: '☄️',
  },
  {
    id: 'admin_supreme',
    name: 'Admin Tối Thượng',
    description: 'Nền đỏ vàng hoàng gia có hiệu ứng ánh kim lấp lánh và tia lửa.',
    xpRequired: 0,
    gradientCss: 'linear-gradient(130deg, #7f1d1d 0%, #b91c1c 45%, #d97706 78%, #f59e0b 100%)',
    borderCss: 'rgba(251, 191, 36, 0.78)',
    textColorClass: 'text-amber-50',
    subTextColorClass: 'text-amber-200',
    effectType: 'sparks',
    previewEmoji: '👑',
    adminOnly: true,
  },
];

export const AVATAR_FRAME_TEMPLATES: AvatarFrameTemplate[] = [
  {
    id: 'none',
    name: 'Mặc định gọn gàng',
    description: 'Viền tròn tinh giản hiện đại.',
    xpRequired: 0,
    ringGradientCss: 'linear-gradient(135deg, rgba(148,163,184,0.45), rgba(100,116,139,0.45))',
    glowShadowCss: 'none',
    previewEmoji: '⭕',
  },
  {
    id: 'diem10_champion',
    name: 'Vòng Tri Thức Điểm 10',
    description: 'Khung xanh ngọc lục bảo phát sáng chuẩn học bá.',
    xpRequired: 0,
    ringGradientCss: 'conic-gradient(from 0deg, #10b981, #06b6d4, #3b82f6, #10b981)',
    glowShadowCss: '0 0 10px rgba(16, 185, 129, 0.5)',
    spin: true,
    previewEmoji: '🎓',
  },
  {
    id: 'neon_cyber',
    name: 'Sấm Sét Neon',
    description: 'Vòng ánh sáng xanh cyan điện tử chuyển động.',
    xpRequired: 0,
    ringGradientCss: 'conic-gradient(from 90deg, #22d3ee, #3b82f6, #a855f7, #22d3ee)',
    glowShadowCss: '0 0 12px rgba(34, 211, 238, 0.6)',
    spin: true,
    previewEmoji: '⚡',
  },
  {
    id: 'sakura_ring',
    name: 'Vòng Hoa Anh Đào',
    description: 'Sắc hồng phấn dịu dàng chuyển sắc.',
    xpRequired: 0,
    ringGradientCss: 'conic-gradient(from 0deg, #f472b6, #fbcfe8, #ec4899, #f472b6)',
    glowShadowCss: '0 0 10px rgba(244, 114, 182, 0.5)',
    spin: true,
    previewEmoji: '🌸',
  },
  {
    id: 'galaxy_orbit',
    name: 'Quỹ Đạo Ngân Hà',
    description: 'Quỹ đạo tím xanh vũ trụ xoay liên tục.',
    xpRequired: 100,
    ringGradientCss: 'conic-gradient(from 45deg, #6366f1, #a855f7, #ec4899, #38bdf8, #6366f1)',
    glowShadowCss: '0 0 12px rgba(139, 92, 246, 0.6)',
    spin: true,
    previewEmoji: '🪐',
  },
  {
    id: 'fire_aura',
    name: 'Hào Quang Rồng Lửa',
    description: 'Vòng lửa đỏ cam bùng cháy rực rỡ.',
    xpRequired: 150,
    ringGradientCss: 'conic-gradient(from 0deg, #ef4444, #f97316, #facc15, #ef4444)',
    glowShadowCss: '0 0 14px rgba(249, 115, 22, 0.65)',
    spin: true,
    previewEmoji: '🔥',
  },
  {
    id: 'frost_halo',
    name: 'Tinh Thể Băng Giá',
    description: 'Vòng băng tuyết trong suốt lấp lánh.',
    xpRequired: 150,
    ringGradientCss: 'conic-gradient(from 0deg, #bae6fd, #38bdf8, #e0f2fe, #0284c7, #bae6fd)',
    glowShadowCss: '0 0 12px rgba(56, 189, 248, 0.55)',
    spin: true,
    previewEmoji: '❄️',
  },
  {
    id: 'royal_gold',
    name: 'Hoàng Kim Vương Giả',
    description: 'Khung vàng ánh kim rực sáng đẳng cấp.',
    xpRequired: 250,
    ringGradientCss: 'conic-gradient(from 0deg, #fde047, #d97706, #fef08a, #b45309, #fde047)',
    glowShadowCss: '0 0 14px rgba(245, 158, 11, 0.7)',
    spin: true,
    previewEmoji: '👑',
  },
];

export const BADGE_CATALOG: ProfileBadgeTemplate[] = [
  {
    id: 'hoc_ba_10',
    name: 'Học bá Điểm 10',
    shortLabel: 'Điểm 10',
    emoji: '💯',
    description: 'Danh hiệu chuyên cần đạt điểm tối đa.',
    colorClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    xpRequired: 0,
  },
  {
    id: 'chien_than_duel',
    name: 'Chiến thần Thi đấu',
    shortLabel: 'Đấu trường',
    emoji: '⚔️',
    description: 'Tích cực thách đấu kiến thức cùng bạn bè.',
    colorClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    xpRequired: 0,
  },
  {
    id: 'streak_master',
    name: 'Ngọn lửa Bền bỉ',
    shortLabel: 'Streak',
    emoji: '🔥',
    description: 'Duy trì thói quen học bài đều đặn mỗi ngày.',
    colorClass: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
    xpRequired: 0,
  },
  {
    id: 'mythic_star',
    name: 'Ngôi sao Thần thoại',
    shortLabel: 'Thần thoại',
    emoji: '🌟',
    description: 'May mắn quay trúng phần thưởng hiếm.',
    colorClass: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40',
    xpRequired: 100,
  },
  {
    id: 'polyglot_explorer',
    name: 'Nhà thám hiểm Đa ngôn ngữ',
    shortLabel: 'Đa ngữ',
    emoji: '🌍',
    description: 'Luyện giao tiếp cùng Gia sư AI đa quốc gia.',
    colorClass: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
    xpRequired: 0,
  },
  {
    id: 'top_scholar',
    name: 'Thủ khoa THCS',
    shortLabel: 'Thủ khoa',
    emoji: '🏅',
    description: 'Thành tích xuất sắc toàn diện các môn.',
    colorClass: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
    xpRequired: 200,
  },
];

export const STORAGE_KEY_PROFILE_DECORATIONS = 'max10_profile_decorations_v1';

export const DEFAULT_USER_DECORATION: UserDecorationConfig = {
  nameplateId: 'hoc_ba_diem_10',
  frameId: 'diem10_champion',
  badges: ['hoc_ba_10', 'chien_than_duel'],
};

export function loadLocalDecorations(isAdmin = false): UserDecorationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE_DECORATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          nameplateId: parsed.nameplateId || (isAdmin ? 'admin_supreme' : 'hoc_ba_diem_10'),
          frameId: parsed.frameId || (isAdmin ? 'royal_gold' : 'diem10_champion'),
          badges: Array.isArray(parsed.badges) ? parsed.badges : ['hoc_ba_10'],
        };
      }
    }
  } catch {}
  return isAdmin
    ? {
        nameplateId: 'admin_supreme',
        frameId: 'royal_gold',
        badges: ['hoc_ba_10', 'top_scholar', 'chien_than_duel'],
      }
    : DEFAULT_USER_DECORATION;
}

export function saveLocalDecorations(config: UserDecorationConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE_DECORATIONS, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('max10:decorations-updated', { detail: config }));
  } catch {}
}

export const STORAGE_KEY_VIP_UNLOCKS = 'max10_vip_unlocked_decorations_v1';

export function loadVipUnlockedDecorations(): { nameplates: string[]; frames: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIP_UNLOCKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        nameplates: Array.isArray(parsed?.nameplates) ? parsed.nameplates : [],
        frames: Array.isArray(parsed?.frames) ? parsed.frames : [],
      };
    }
  } catch {}
  return { nameplates: [], frames: [] };
}

export function addVipUnlockedDecorations(nameplates: string[], frames: string[]): void {
  try {
    const current = loadVipUnlockedDecorations();
    const next = {
      nameplates: Array.from(new Set([...current.nameplates, ...nameplates])),
      frames: Array.from(new Set([...current.frames, ...frames])),
    };
    localStorage.setItem(STORAGE_KEY_VIP_UNLOCKS, JSON.stringify(next));
  } catch {}
}

export function getNameplateById(id?: NameplateId | string): NameplateTemplate {
  return NAMEPLATE_TEMPLATES.find((n) => n.id === id) || NAMEPLATE_TEMPLATES[0];
}

export function getAvatarFrameById(id?: AvatarFrameId | string): AvatarFrameTemplate {
  return AVATAR_FRAME_TEMPLATES.find((f) => f.id === id) || AVATAR_FRAME_TEMPLATES[0];
}

/**
 * Deterministic fallback decoration for peers who haven't customized theirs yet,
 * ensuring every Admin, AI Tutor, Teacher, and Student has an expressive nameplate & frame.
 */
export function getMemberDecoration(
  member: { id: string; role?: string; isAi?: boolean; nameplateId?: NameplateId; frameId?: AvatarFrameId; badges?: ProfileBadgeId[] },
  peerMap?: Record<string, UserDecorationConfig>
): UserDecorationConfig {
  if (peerMap && peerMap[member.id]) {
    return peerMap[member.id];
  }
  if (member.nameplateId || member.frameId) {
    return {
      nameplateId: member.nameplateId || 'hoc_ba_diem_10',
      frameId: member.frameId || 'diem10_champion',
      badges: member.badges || ['hoc_ba_10'],
    };
  }
  const roleStr = String(member.role || '').toLowerCase();
  if (member.id === 'admin-mac-khanh-duy' || roleStr === 'admin') {
    return {
      nameplateId: 'admin_supreme',
      frameId: 'royal_gold',
      badges: ['top_scholar', 'chien_than_duel'],
    };
  }
  if (member.isAi || roleStr === 'ai_tutor' || member.id.includes('max10-ai')) {
    return {
      nameplateId: 'cyberpunk_bolt',
      frameId: 'neon_cyber',
      badges: ['polyglot_explorer', 'hoc_ba_10'],
    };
  }
  if (roleStr === 'teacher') {
    return {
      nameplateId: 'aurora_borealis',
      frameId: 'diem10_champion',
      badges: ['top_scholar', 'hoc_ba_10'],
    };
  }

  // Deterministic aesthetic pick from free pool based on member ID hash
  const pool: NameplateId[] = [
    'galaxy_nebula',
    'sakura_drift',
    'hoc_ba_diem_10',
    'cyberpunk_bolt',
    'ice_crystal',
    'ocean_tide',
    'aurora_borealis',
  ];
  const framePool: AvatarFrameId[] = ['diem10_champion', 'neon_cyber', 'sakura_ring', 'galaxy_orbit', 'frost_halo'];
  let hash = 0;
  for (let i = 0; i < member.id.length; i++) {
    hash = (hash * 31 + member.id.charCodeAt(i)) >>> 0;
  }
  return {
    nameplateId: pool[hash % pool.length],
    frameId: framePool[hash % framePool.length],
    badges: [BADGE_CATALOG[hash % BADGE_CATALOG.length].id],
  };
}

export function getCountryFlagFromCode(code?: CountryCode): string {
  const map: Record<CountryCode, string> = {
    VN: '🇻🇳',
    US: '🇺🇸',
    GB: '🇬🇧',
    JP: '🇯🇵',
    KR: '🇰🇷',
    CN: '🇨🇳',
    DE: '🇩🇪',
    FR: '🇫🇷',
  };
  return (code && map[code]) || '🇻🇳';
}
