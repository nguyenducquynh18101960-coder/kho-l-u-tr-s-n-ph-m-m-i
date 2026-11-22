import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Gift, Sparkles, Flower2, Check, RotateCw, Crown, Trophy } from 'lucide-react';
import { celebrateMilestone, launchCanvasFireworks, launchGoldenStarBurst } from '../../utils/confettiFireworks';
import { soundEffects } from '../../utils/soundEffects';
import { loadStudentAchievements, saveStudentAchievements } from '../../data/initialAchievements';
import { calculateLevel, formatLevelLabel } from '../../types/achievements';
import ronaldoSiuStadiumImg from '../../assets/images/ronaldo_siu_stadium_1794918922903.jpg';

export type HolidayId =
  | 'tet'
  | '14_02'
  | '08_03'
  | '30_04'
  | '01_06'
  | '02_09'
  | 'trung_thu'
  | '20_10'
  | 'halloween'
  | '20_11'
  | 'noel';
export type GiftRarity = 'mythic' | 'legendary' | 'super_rare' | 'rare' | 'common';

export interface RarityTierConfig {
  id: GiftRarity;
  label: string;
  rateLabel: string;
  weight: number;
  cardBorder: string;
  cardBg: string;
  badgeClass: string;
  textClass: string;
  glowClass: string;
}

export const RARITY_TIERS: RarityTierConfig[] = [
  {
    id: 'mythic',
    label: 'Thần Thoại',
    rateLabel: '0,5%',
    weight: 0.5,
    cardBorder: 'border-emerald-500',
    cardBg: 'from-emerald-500/25 via-green-500/20 to-lime-400/25',
    badgeClass: 'bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 text-slate-950',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    glowClass: 'shadow-[0_0_28px_rgba(34,197,94,0.55)]',
  },
  {
    id: 'legendary',
    label: 'Huyền Thoại',
    rateLabel: '10%',
    weight: 10,
    cardBorder: 'border-amber-400',
    cardBg: 'from-amber-500/20 to-orange-500/20',
    badgeClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950',
    textClass: 'text-amber-500 dark:text-amber-400',
    glowClass: 'shadow-[0_0_18px_rgba(245,158,11,0.35)]',
  },
  {
    id: 'super_rare',
    label: 'Siêu Hiếm',
    rateLabel: '15%',
    weight: 15,
    cardBorder: 'border-purple-500',
    cardBg: 'from-purple-500/20 to-indigo-500/20',
    badgeClass: 'bg-purple-600 text-white',
    textClass: 'text-purple-500 dark:text-purple-400',
    glowClass: 'shadow-[0_0_14px_rgba(168,85,247,0.3)]',
  },
  {
    id: 'rare',
    label: 'Hiếm',
    rateLabel: '50%',
    weight: 50,
    cardBorder: 'border-sky-500',
    cardBg: 'from-sky-500/15 to-cyan-500/15',
    badgeClass: 'bg-sky-600 text-white',
    textClass: 'text-sky-500 dark:text-sky-400',
    glowClass: '',
  },
  {
    id: 'common',
    label: 'Bình Thường',
    rateLabel: '70%',
    weight: 70,
    cardBorder: 'border-slate-400/70 dark:border-zinc-600',
    cardBg: 'from-slate-500/15 to-zinc-500/10',
    badgeClass: 'bg-slate-600 text-white',
    textClass: 'text-slate-600 dark:text-zinc-300',
    glowClass: '',
  },
];

export const RARITY_MAP: Record<GiftRarity, RarityTierConfig> = RARITY_TIERS.reduce(
  (acc, t) => ({ ...acc, [t.id]: t }),
  {} as Record<GiftRarity, RarityTierConfig>
);

export interface HolidayConfig {
  id: HolidayId;
  dateLabel: string;
  title: string;
  subtitle: string;
  greetingTeacher: string;
  greetingStudent: string;
  petals: string[];
  accentGradient: string;
  badgeText: string;
  itemCategoryLabel: string;
}

export interface HolidayGiftItem {
  id: string;
  name: string;
  icon: string;
  type: 'flower' | 'item' | 'festive';
  rarity: GiftRarity;
  xpBonus: number;
  description: string;
}

export interface ReceivedHolidayGiftRecord {
  id: string;
  holidayId: HolidayId;
  holidayTitle: string;
  gift: HolidayGiftItem;
  receivedAt: string;
}

export const HOLIDAY_CONFIGS: Record<HolidayId, HolidayConfig> = {
  tet: {
    id: 'tet',
    dateLabel: 'Tết Nguyên Đán',
    title: 'Chúc Mừng Năm Mới — Tết Cổ Truyền',
    subtitle: 'Đón lộc đầu xuân với bao lì xì đỏ, mai đào khoe sắc và quà Tết rực rỡ',
    greetingTeacher: 'Kính chúc Thầy/Cô một năm mới An Khang Thịnh Vượng, Vạn Sự Như Ý và thật nhiều niềm vui!',
    greetingStudent: 'Chúc bạn năm mới tràn đầy tiếng cười, may mắn ngập tràn và đón thật nhiều lộc xuân!',
    petals: ['🧧', '🌸', '🌼', '🎆', '🏮', '✨'],
    accentGradient: 'from-red-600 via-rose-600 to-amber-500',
    badgeText: 'Tết Nguyên Đán',
    itemCategoryLabel: 'Lộc Xuân & Quà Tết',
  },
  '08_03': {
    id: '08_03',
    dateLabel: '08 / 03',
    title: 'Chúc Mừng Ngày Quốc Tế Phụ Nữ 8/3',
    subtitle: 'Tôn vinh các Cô giáo, các bạn Nữ và Một nửa yêu thương của thế giới',
    greetingTeacher: 'Kính chúc Cô luôn rạng rỡ, trẻ trung, hạnh phúc và ngập tràn yêu thương!',
    greetingStudent: 'Chúc bạn luôn tự tin, tỏa sáng rực rỡ và nhận thật nhiều hoa tươi cùng niềm vui bất ngờ!',
    petals: ['🌹', '🌸', '🌷', '🌺', '💐', '✨'],
    accentGradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    badgeText: 'Quốc tế Phụ nữ 8/3',
    itemCategoryLabel: 'Hoa & Trang Sức 8/3',
  },
  '20_10': {
    id: '20_10',
    dateLabel: '20 / 10',
    title: 'Chúc Mừng Ngày Phụ Nữ Việt Nam 20/10',
    subtitle: 'Gửi ngàn đóa hoa tươi thắm và quà tặng sang trọng ngày 20/10',
    greetingTeacher: 'Kính chúc Cô thật nhiều sức khỏe, niềm vui và hạnh phúc bên gia đình thân yêu!',
    greetingStudent: 'Chúc bạn một ngày 20/10 thật rạng ngời, ngập tràn hoa tươi và những món quà đáng yêu!',
    petals: ['💐', '🌺', '🌸', '🌹', '🪷', '✨'],
    accentGradient: 'from-pink-600 via-rose-500 to-amber-500',
    badgeText: 'Phụ nữ Việt Nam 20/10',
    itemCategoryLabel: 'Hoa & Quà Tặng 20/10',
  },
  halloween: {
    id: 'halloween',
    dateLabel: '31 / 10',
    title: 'Lễ Hội Hóa Trang Halloween Huyền Bí',
    subtitle: 'Khám phá kho báu bí ngô ma thuật, kẹo ngọt đêm hội và báu vật bóng đêm',
    greetingTeacher: 'Chúc Thầy/Cô có một mùa Halloween thật vui nhộn, thú vị và đầy bất ngờ!',
    greetingStudent: 'Chúc bạn một đêm Halloween cực ngầu với thật nhiều kẹo ngọt và vật phẩm huyền bí!',
    petals: ['🎃', '👻', '🦇', '🍬', '🕷️', '✨'],
    accentGradient: 'from-orange-600 via-purple-700 to-slate-900',
    badgeText: 'Halloween 31/10',
    itemCategoryLabel: 'Bảo Vật & Kẹo Halloween',
  },
  '20_11': {
    id: '20_11',
    dateLabel: '20 / 11',
    title: 'Chúc Mừng Ngày Nhà Giáo Việt Nam 20/11',
    subtitle: 'Tri ân sâu sắc tới các Thầy giáo, Cô giáo — Gửi tặng hoa tươi và quà kỷ niệm ý nghĩa',
    greetingTeacher: 'Kính chúc Thầy/Cô luôn dồi dào sức khỏe, hạnh phúc và tràn đầy nhiệt huyết!',
    greetingStudent: 'Hãy gửi những đóa hoa tươi thắm và lời chúc đẹp nhất tới Thầy Cô nhân ngày 20/11!',
    petals: ['🌻', '🌹', '💐', '🌼', '🪷', '✨'],
    accentGradient: 'from-amber-500 via-orange-500 to-rose-500',
    badgeText: 'Nhà giáo Việt Nam 20/11',
    itemCategoryLabel: 'Hoa & Quà Tri Ân 20/11',
  },
  noel: {
    id: 'noel',
    dateLabel: '25 / 12',
    title: 'Chúc Mừng Giáng Sinh An Lành — Noel',
    subtitle: 'Ông già Noel mang tới cây thông lấp lánh, tuần lộc pha lê và muôn vàn quà Giáng Sinh',
    greetingTeacher: 'Kính chúc Thầy/Cô một mùa Giáng Sinh an lành, ấm áp và ngập tràn hạnh phúc!',
    greetingStudent: 'Chúc bạn một mùa Noel thật vui, ấm áp bên gia đình và mở được thật nhiều quà xinh!',
    petals: ['❄️', '🎄', '🎅', '🔔', '⭐', '⛄'],
    accentGradient: 'from-emerald-600 via-red-600 to-amber-500',
    badgeText: 'Giáng Sinh / Noel',
    itemCategoryLabel: 'Quà Tặng Giáng Sinh',
  },
  trung_thu: {
    id: 'trung_thu',
    dateLabel: 'Rằm 15/8 Âm Lịch',
    title: 'Vui Hội Trăng Rằm — Tết Trung Thu',
    subtitle: 'Đêm hội đèn lồng ông sao lung linh, chị Hằng chú Cuội và bánh nướng bánh dẻo sum vầy',
    greetingTeacher: 'Kính chúc Thầy/Cô một mùa Tết Trung Thu đoàn viên, ấm áp và tràn ngập tiếng cười!',
    greetingStudent: 'Chúc bạn đón Tết Trung Thu thật rực rỡ với đèn ông sao lung linh và thật nhiều bánh ngon!',
    petals: ['🏮', '🌕', '🐇', '🥮', '⭐', '✨'],
    accentGradient: 'from-amber-500 via-orange-500 to-indigo-700',
    badgeText: 'Tết Trung Thu',
    itemCategoryLabel: 'Đèn Lồng & Bánh Trung Thu',
  },
  '14_02': {
    id: '14_02',
    dateLabel: '14 / 02',
    title: 'Ngày Lễ Yêu Thương & Tình Bạn 14/2',
    subtitle: 'Trao gửi thiệp chúc mừng, sô-cô-la ngọt ngào và những bông hồng rực rỡ',
    greetingTeacher: 'Kính chúc Thầy/Cô luôn tràn đầy nhiệt huyết, yêu thương và hạnh phúc!',
    greetingStudent: 'Chúc bạn có một ngày 14/2 thật ấm áp bên gia đình, thầy cô và những người bạn thân!',
    petals: ['💝', '🍫', '🌹', '💌', '🎀', '✨'],
    accentGradient: 'from-rose-500 via-pink-500 to-red-500',
    badgeText: 'Lễ 14/2',
    itemCategoryLabel: 'Sô-cô-la & Thiệp 14/2',
  },
  '30_04': {
    id: '30_04',
    dateLabel: '30/04 & 01/05',
    title: 'Chào Mừng Đại Lễ 30/4 & Quốc Tế Lao Động 1/5',
    subtitle: 'Tự hào non sông thống nhất — rực rỡ cờ hoa chào mừng ngày hội lớn của dân tộc',
    greetingTeacher: 'Kính chúc Thầy/Cô kỳ nghỉ lễ 30/4 - 1/5 thật nhiều sức khỏe, niềm vui và bình an!',
    greetingStudent: 'Chúc bạn kỳ nghỉ lễ 30/4 - 1/5 thật ý nghĩa, nạp đầy năng lượng bứt phá học tập!',
    petals: ['🇻🇳', '⭐', '🎆', '🕊️', '🎉', '✨'],
    accentGradient: 'from-red-600 via-rose-600 to-amber-500',
    badgeText: 'Đại lễ 30/4 - 1/5',
    itemCategoryLabel: 'Kỷ Niệm Chương 30/4',
  },
  '01_06': {
    id: '01_06',
    dateLabel: '01 / 06',
    title: 'Chúc Mừng Ngày Quốc Tế Thiếu Nhi 1/6',
    subtitle: 'Ngày hội tuổi thơ ngập tràn sắc màu, bóng bay rực rỡ và quà tặng bất ngờ',
    greetingTeacher: 'Chúc Thầy/Cô luôn giữ mãi nụ cười tươi trẻ và niềm vui đồng hành cùng các em học sinh!',
    greetingStudent: 'Chúc bạn ngày 1/6 thật vui nhộn, rạng rỡ tiếng cười và mở được nhiều quà xịn!',
    petals: ['🎈', '🧸', '🍭', '🎨', '🎉', '✨'],
    accentGradient: 'from-sky-500 via-cyan-500 to-emerald-500',
    badgeText: 'Quốc tế Thiếu nhi 1/6',
    itemCategoryLabel: 'Quà Tuổi Thơ 1/6',
  },
  '02_09': {
    id: '02_09',
    dateLabel: '02 / 09',
    title: 'Chào Mừng Ngày Quốc Khánh Việt Nam 2/9',
    subtitle: 'Tự hào Tổ quốc Việt Nam — cờ đỏ sao vàng rực sáng bầu trời mùa thu lịch sử',
    greetingTeacher: 'Kính chúc Thầy/Cô một kỳ nghỉ Quốc Khánh 2/9 trang trọng, bình an và hạnh phúc!',
    greetingStudent: 'Chúc bạn ngày Quốc Khánh 2/9 thật tự hào, tràn đầy năng lượng cho năm học mới!',
    petals: ['🇻🇳', '⭐', '🎇', '🪷', '🎉', '✨'],
    accentGradient: 'from-red-600 via-red-500 to-yellow-500',
    badgeText: 'Quốc Khánh 2/9',
    itemCategoryLabel: 'Huy Hiệu Quốc Khánh 2/9',
  },
};

// Distinct non-study item pools for every single holiday
export const HOLIDAY_GIFT_POOLS: Record<HolidayId, HolidayGiftItem[]> = {
  tet: [
    {
      id: 'tet-mythic-envelope',
      name: 'Bao Lì Xì Hoàng Kim Thần Tài',
      icon: '🧧',
      type: 'festive',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Bảo vật Thần Thoại ngày Tết (0,5%) — Tượng trưng cho tài lộc dồi dào và phúc lộc quanh năm!',
    },
    {
      id: 'tet-mythic-dragon',
      name: 'Linh Vật Rồng Vàng Phú Quý',
      icon: '🐉',
      type: 'item',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Tuyệt phẩm Rồng Vàng Thần Thoại mang lại vượng khí rực rỡ suốt cả năm mới.',
    },
    {
      id: 'tet-legendary-peach',
      name: 'Cây Đào Cổ Thụ Đón Xuân',
      icon: '🌸',
      type: 'flower',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Cây đào thế lâu năm nở hoa rực hồng chào đón năm mới an khang.',
    },
    {
      id: 'tet-legendary-fireworks',
      name: 'Pháo Hoa Đêm Giao Thừa',
      icon: '🎆',
      type: 'festive',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Màn pháo hoa rực sáng bầu trời khoảnh khắc chuyển giao năm mới.',
    },
    {
      id: 'tet-super-lantern',
      name: 'Đôi Đèn Lồng Đỏ Phát Tài',
      icon: '🏮',
      type: 'item',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Cặp đèn lồng đỏ rực treo trước hiên nhà đón may mắn và bình an.',
    },
    {
      id: 'tet-super-fruit-tray',
      name: 'Mâm Ngũ Quả Tài Lộc',
      icon: '🍊',
      type: 'festive',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Mâm ngũ quả tươi ngon sum vầy, cầu chúc gia đình sung túc đủ đầy.',
    },
    {
      id: 'tet-rare-apricot',
      name: 'Cành Mai Vàng Rực Rỡ',
      icon: '🌼',
      type: 'flower',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Cành mai vàng năm cánh khoe sắc nắng ấm phương Nam ngày đầu xuân.',
    },
    {
      id: 'tet-rare-banh-chung',
      name: 'Bánh Chưng Xanh Truyền Thống',
      icon: '🎋',
      type: 'festive',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Chiếc bánh chưng vuông vắn đậm đà hương vị Tết cổ truyền dân tộc.',
    },
    {
      id: 'tet-common-lucky-money',
      name: 'Phong Bao Lì Xì May Mắn',
      icon: '🧧',
      type: 'festive',
      rarity: 'common',
      xpBonus: 150,
      description: 'Phong bao đỏ thắm gửi gắm lời chúc bình an và niềm vui đầu năm.',
    },
    {
      id: 'tet-common-candies',
      name: 'Hộp Mứt Tết Ngọt Ngào',
      icon: '🍬',
      type: 'festive',
      rarity: 'common',
      xpBonus: 150,
      description: 'Khay mứt gừng, mứt dừa, hạt sen thơm lừng đãi khách ngày xuân.',
    },
    {
      id: 'tet-common-kumquat',
      name: 'Chậu Quất Cảnh Sai Trĩu Quả',
      icon: '🪴',
      type: 'flower',
      rarity: 'common',
      xpBonus: 150,
      description: 'Chậu quất vàng ươm mang lại không khí Tết ấm cúng cho mọi nhà.',
    },
  ],
  '08_03': [
    {
      id: '0803-mythic-crown',
      name: 'Vương Miện Kim Cương Hồng',
      icon: '👑',
      type: 'item',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Bảo vật Thần Thoại 8/3 (0,5%) — Tỏa sáng lấp lánh tôn vinh vẻ đẹp kiêu hãnh!',
    },
    {
      id: '0803-mythic-crystal-rose',
      name: 'Hoa Hồng Pha Lê Bất Tử',
      icon: '🌹',
      type: 'flower',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Đóa hồng pha lê chế tác tinh xảo lưu giữ sắc hương rực rỡ mãi mãi.',
    },
    {
      id: '0803-legendary-pearl',
      name: 'Dây Chuyền Ngọc Trai Đại Dương',
      icon: '📿',
      type: 'item',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Chuỗi ngọc trai óng ánh sang trọng làm quà tặng tinh tế ngày 8/3.',
    },
    {
      id: '0803-legendary-bouquet',
      name: 'Lẵng Hoa Hồng Hoàng Gia',
      icon: '💐',
      type: 'flower',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Bó hoa hồng nhung kết hợp cẩm chướng tuyệt đẹp ngát hương.',
    },
    {
      id: '0803-super-gem-ring',
      name: 'Nhẫn Đá Ruby Lấp Lánh',
      icon: '💍',
      type: 'item',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Chiếc nhẫn đính đá hồng ngọc rực rỡ dành tặng phái đẹp.',
    },
    {
      id: '0803-super-teddy',
      name: 'Gấu Bông Ôm Hoa Tươi',
      icon: '🧸',
      type: 'item',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Chú gấu bông mềm mại ôm bó hoa xinh xắn mang lại nụ cười ngọt ngào.',
    },
    {
      id: '0803-rare-tulip',
      name: 'Bó Hoa Tulip Pha Lê',
      icon: '🌷',
      type: 'flower',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Những bông tulip tươi tắn biểu tượng cho niềm vui và sự dịu dàng.',
    },
    {
      id: '0803-rare-chocolate',
      name: 'Hộp Socola Tình Yêu',
      icon: '🍫',
      type: 'festive',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Hộp socola Bỉ hảo hạng tan chảy ngọt ngào trong ngày 8/3.',
    },
    {
      id: '0803-common-rose',
      name: 'Đóa Hoa Hồng Tươi Thắm',
      icon: '🌹',
      type: 'flower',
      rarity: 'common',
      xpBonus: 150,
      description: 'Đóa hoa hồng đỏ thắm gửi tặng nụ cười rạng rỡ suốt ngày dài.',
    },
    {
      id: '0803-common-sakura',
      name: 'Nhành Hoa Anh Đào Ngọt Ngào',
      icon: '🌸',
      type: 'flower',
      rarity: 'common',
      xpBonus: 150,
      description: 'Cánh hoa anh đào dịu dàng mang đến niềm vui nhẹ nhàng.',
    },
    {
      id: '0803-common-card',
      name: 'Thiệp Chúc Mừng Yêu Thương',
      icon: '💌',
      type: 'item',
      rarity: 'common',
      xpBonus: 150,
      description: 'Tấm thiệp xinh xắn chứa đựng những lời chúc ấm áp nhất.',
    },
  ],
  '20_10': [
    {
      id: '2010-mythic-lotus',
      name: 'Đóa Sen Ngọc Lục Bảo',
      icon: '🪷',
      type: 'flower',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Bảo vật Thần Thoại 20/10 (0,5%) — Tôn vinh nét đẹp thanh cao của Phụ nữ Việt Nam!',
    },
    {
      id: '2010-mythic-hairpin',
      name: 'Trâm Cài Phượng Hoàng Vàng',
      icon: '🦚',
      type: 'item',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Trang sức cổ điển chạm khắc phượng hoàng tinh xảo tỏa ánh hào quang.',
    },
    {
      id: '2010-legendary-orchid',
      name: 'Chậu Hoa Lan Hồ Điệp Quý Phái',
      icon: '🌺',
      type: 'flower',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Những cành lan hồ điệp nở rộ sang trọng và bền hương.',
    },
    {
      id: '2010-legendary-silk',
      name: 'Khăn Lụa Tơ Tằm Thượng Hạng',
      icon: '🧣',
      type: 'item',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Chiếc khăn lụa dệt thủ công mềm mại tôn nét duyên dáng Việt Nam.',
    },
    {
      id: '2010-super-bracelet',
      name: 'Vòng Tay Đá Quý May Mắn',
      icon: '💎',
      type: 'item',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Vòng tay đính đá phong thủy óng ánh mang lại bình an và niềm vui.',
    },
    {
      id: '2010-super-handbag',
      name: 'Túi Xách Hoa Cúc Xinh Xắn',
      icon: '👜',
      type: 'item',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Chiếc túi thời trang thanh lịch với họa tiết hoa cúc tinh tế.',
    },
    {
      id: '2010-rare-hydrangea',
      name: 'Bó Hoa Cẩm Tú Cầu Xanh',
      icon: '💐',
      type: 'flower',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Bó hoa cẩm tú cầu tròn đầy tượng trưng cho lòng biết ơn chân thành.',
    },
    {
      id: '2010-rare-sunflower',
      name: 'Bó Hoa Hướng Dương Rạng Rỡ',
      icon: '🌻',
      type: 'flower',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Bó hướng dương vàng tươi mang nguồn năng lượng tích cực mỗi ngày.',
    },
    {
      id: '2010-common-daisy',
      name: 'Bó Hoa Cúc Họa Mi Tinh Khôi',
      icon: '🌼',
      type: 'flower',
      rarity: 'common',
      xpBonus: 150,
      description: 'Những bông cúc họa mi trắng muốt dịu dàng trong gió thu.',
    },
    {
      id: '2010-common-ribbon',
      name: 'Kẹp Tóc Nơ Ngọc Trai',
      icon: '🎀',
      type: 'item',
      rarity: 'common',
      xpBonus: 150,
      description: 'Chiếc kẹp nơ nhỏ nhắn làm điểm nhấn duyên dáng ngày 20/10.',
    },
    {
      id: '2010-common-hibiscus',
      name: 'Đóa Hoa Rực Rỡ Đầu Thu',
      icon: '🌺',
      type: 'flower',
      rarity: 'common',
      xpBonus: 150,
      description: 'Đóa hoa tươi thắm gửi tặng niềm vui rạng ngời.',
    },
  ],
  halloween: [
    {
      id: 'hal-mythic-pumpkin',
      name: 'Bí Ngô Ma Thuật Vương Giả',
      icon: '🎃',
      type: 'festive',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Bảo vật Thần Thoại Halloween (0,5%) — Phát ánh sáng phép thuật cam rực trong đêm hội!',
    },
    {
      id: 'hal-mythic-orb',
      name: 'Quả Cầu Pha Lê Bóng Đêm',
      icon: '🔮',
      type: 'item',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Quả cầu tiên tri huyền bí ẩn chứa nguồn năng lượng ngân hà lung linh.',
    },
    {
      id: 'hal-legendary-cape',
      name: 'Áo Choàng Bá Tước Ánh Trăng',
      icon: '🧛',
      type: 'item',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Chiếc áo choàng nhung đen viền đỏ cực ngầu cho đêm hội hóa trang.',
    },
    {
      id: 'hal-legendary-lantern',
      name: 'Đèn Lồng Ma Trơi Phát Sáng',
      icon: '🕯️',
      type: 'item',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Ngọn đèn lồng soi sáng lâu đài cổ tích đêm trăng tròn 31/10.',
    },
    {
      id: 'hal-super-hat',
      name: 'Mũ Phù Thủy Tím Huyền Bí',
      icon: '🧙',
      type: 'item',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Chiếc mũ nhọn gắn sao vàng đầy phong cách phù thủy thiện lành.',
    },
    {
      id: 'hal-super-owl',
      name: 'Cú Đêm Đưa Thư Bí Ẩn',
      icon: '🦉',
      type: 'festive',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Chú cú thông thái đồng hành trong mọi chuyến phiêu lưu đêm hội.',
    },
    {
      id: 'hal-rare-mask',
      name: 'Mặt Nạ Dạ Hội Hóa Trang',
      icon: '🎭',
      type: 'item',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Chiếc mặt nạ nghệ thuật bí ẩn giúp bạn nổi bật tại lễ hội Halloween.',
    },
    {
      id: 'hal-rare-bat',
      name: 'Chú Dơi Nhỏ Cánh Bạc',
      icon: '🦇',
      type: 'festive',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Linh vật dơi bạc tinh nghịch bay lượn dưới ánh trăng bạc.',
    },
    {
      id: 'hal-common-candy',
      name: 'Kẹo Mút Bí Ngô Ngọt Ngào',
      icon: '🍭',
      type: 'festive',
      rarity: 'common',
      xpBonus: 150,
      description: 'Món quà "Cho kẹo hay bị ghẹo" siêu thơm ngon đêm Halloween!',
    },
    {
      id: 'hal-common-ghost',
      name: 'Chú Ma Nhỏ Dễ Thương',
      icon: '👻',
      type: 'festive',
      rarity: 'common',
      xpBonus: 150,
      description: 'Linh hồn nhỏ tinh nghịch thích nhảy múa và phát kẹo cho mọi người.',
    },
    {
      id: 'hal-common-cookie',
      name: 'Bánh Quy Mạng Nhện Giòn Rụm',
      icon: '🕸️',
      type: 'festive',
      rarity: 'common',
      xpBonus: 150,
      description: 'Chiếc bánh quy socola trang trí hình mạng nhện vui mắt.',
    },
  ],
  '20_11': [
    {
      id: '2011-mythic-trophy',
      name: 'Cúp Tri Ân Pha Lê Ánh Sáng',
      icon: '🏆',
      type: 'item',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Bảo vật Thần Thoại 20/11 (0,5%) — Biểu tượng tôn vinh cao quý nhất ngày Nhà giáo Việt Nam!',
    },
    {
      id: '2011-mythic-golden-lotus',
      name: 'Đóa Sen Vàng Tri Ân Bất Tử',
      icon: '🪷',
      type: 'flower',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Tuyệt phẩm sen vàng rực rỡ biểu tượng cho tấm lòng tôn kính sâu sắc.',
    },
    {
      id: '2011-legendary-tea-set',
      name: 'Bộ Ấm Chén Sứ Hoàng Gia',
      icon: '🍵',
      type: 'item',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Bộ ấm trà men ngọc tinh xảo mang lại phút giây thư giãn ấm áp.',
    },
    {
      id: '2011-legendary-bouquet',
      name: 'Lẵng Hoa Tri Ân Khổng Lồ',
      icon: '💐',
      type: 'flower',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Lẵng hoa tươi rực rỡ kết từ hàng chục bông hồng vàng và hướng dương.',
    },
    {
      id: '2011-super-scarf',
      name: 'Khăn Choàng Lụa Thanh Lịch',
      icon: '🧣',
      type: 'item',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Chiếc khăn choàng mềm mịn giữ ấm trong những ngày gió se lạnh tháng 11.',
    },
    {
      id: '2011-super-orchid',
      name: 'Chậu Lan Hoàng Kim Rực Rỡ',
      icon: '🌺',
      type: 'flower',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Chậu hoa lan vàng quý phái khoe sắc tươi tắn suốt mùa thu đông.',
    },
    {
      id: '2011-rare-sunflower',
      name: 'Bó Hoa Hướng Dương Tri Ân',
      icon: '🌻',
      type: 'flower',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Những bông hướng dương rực rỡ luôn hướng về ánh sáng ấm áp.',
    },
    {
      id: '2011-rare-jasmine-tea',
      name: 'Hộp Trà Hoa Nhài Thơm Ngát',
      icon: '🫖',
      type: 'festive',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Hương trà nhài thanh khiết giúp tinh thần thư thái và sảng khoái.',
    },
    {
      id: '2011-common-rose',
      name: 'Đóa Hoa Hồng Thắm Kính Tặng',
      icon: '🌹',
      type: 'flower',
      rarity: 'common',
      xpBonus: 150,
      description: 'Đóa hoa hồng tươi thắm thay lời cảm ơn chân thành nhất.',
    },
    {
      id: '2011-common-cake',
      name: 'Bánh Kem Tri Ân Ngọt Ngào',
      icon: '🎂',
      type: 'festive',
      rarity: 'common',
      xpBonus: 150,
      description: 'Chiếc bánh kem trang trí hoa tươi chia sẻ niềm vui ngày 20/11.',
    },
    {
      id: '2011-common-card',
      name: 'Thiệp Lời Chúc Trân Trọng',
      icon: '💌',
      type: 'item',
      rarity: 'common',
      xpBonus: 150,
      description: 'Tấm thiệp tay viết đầy ắp kỷ niệm đẹp và lòng biết ơn.',
    },
  ],
  noel: [
    {
      id: 'noel-mythic-reindeer',
      name: 'Tuần Lộc Pha Lê Bắc Cực',
      icon: '🦌',
      type: 'festive',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Bảo vật Thần Thoại Giáng Sinh (0,5%) — Chú tuần lộc mũi đỏ phát sáng dẫn đường cho ông già Noel!',
    },
    {
      id: 'noel-mythic-star',
      name: 'Ngôi Sao Đỉnh Thông Hoàng Kim',
      icon: '🌟',
      type: 'item',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Ngôi sao vàng lấp lánh nhất bầu trời đêm Giáng Sinh mang lại điều ước thành hiện thực.',
    },
    {
      id: 'noel-legendary-sleigh',
      name: 'Cỗ Xe Tuyết Ông Già Noel',
      icon: '🛷',
      type: 'festive',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Cỗ xe chở đầy hộp quà bí mật bay xuyên qua màn tuyết trắng đêm 24/12.',
    },
    {
      id: 'noel-legendary-tree',
      name: 'Cây Thông Noel Phát Sáng',
      icon: '🎄',
      type: 'festive',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Cây thông xanh rì treo đầy châu báu và dải đèn lung linh sắc màu.',
    },
    {
      id: 'noel-super-snowglobe',
      name: 'Quả Cầu Tuyết Nhạc Kỳ Diệu',
      icon: '🔮',
      type: 'item',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Quả cầu thủy tinh với những bông tuyết rơi xoay vòng theo giai điệu Jingle Bells.',
    },
    {
      id: 'noel-super-scarf',
      name: 'Khăn Len Đỏ Ấm Áp Mùa Đông',
      icon: '🧣',
      type: 'item',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Chiếc khăn len đan tay đỏ rực sưởi ấm những ngày đông giá rét.',
    },
    {
      id: 'noel-rare-stocking',
      name: 'Tất Đỏ Đựng Quà Giáng Sinh',
      icon: '🧦',
      type: 'festive',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Chiếc tất Giáng Sinh treo bên lò sưởi chứa đầy bất ngờ thú vị.',
    },
    {
      id: 'noel-rare-snowman',
      name: 'Chú Người Tuyết Mũ Đỏ',
      icon: '⛄',
      type: 'festive',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Chú người tuyết mũi cà rốt đáng yêu vui đùa giữa sân tuyết trắng.',
    },
    {
      id: 'noel-common-candy-cane',
      name: 'Kẹo Gậy Bạc Hà Giáng Sinh',
      icon: '🍬',
      type: 'festive',
      rarity: 'common',
      xpBonus: 150,
      description: 'Thanh kẹo sọc đỏ trắng ngọt mát hương bạc hà truyền thống mùa Noel.',
    },
    {
      id: 'noel-common-bell',
      name: 'Chuông Vàng Leng Keng',
      icon: '🔔',
      type: 'item',
      rarity: 'common',
      xpBonus: 150,
      description: 'Chiếc chuông nhỏ ngân vang âm thanh rộn ràng đón đêm Giáng Sinh.',
    },
    {
      id: 'noel-common-gingerbread',
      name: 'Bánh Quy Gừng Thơm Lừng',
      icon: '🍪',
      type: 'festive',
      rarity: 'common',
      xpBonus: 150,
      description: 'Chiếc bánh quy hình người gừng nướng vàng ươm thơm vị quế mật ong.',
    },
  ],
  trung_thu: [
    {
      id: 'tt-mythic-moon-palace',
      name: 'Cung Trăng Ngọc Ngà Thần Thoại',
      icon: '🌕',
      type: 'festive',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Bảo vật Thần Thoại Đêm Rằm (0,5%) — Ánh trăng rằm tháng 8 tỏa sáng rực rỡ cùng chị Hằng!',
    },
    {
      id: 'tt-mythic-jade-rabbit',
      name: 'Thỏ Ngọc Bạch Kim Cung Trăng',
      icon: '🐇',
      type: 'item',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Linh vật Thỏ Ngọc huyền thoại mang lại bình an, trí tuệ và may mắn trọn vẹn.',
    },
    {
      id: 'tt-legendary-star-lantern',
      name: 'Đèn Ông Sao Khổng Lồ Rước Đèn',
      icon: '🏮',
      type: 'festive',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Chiếc đèn ông sao năm cánh truyền thống lung linh suốt đêm hội rước đèn.',
    },
    {
      id: 'tt-super-lion-dance',
      name: 'Đầu Lân Sư Rồng Múa Hội',
      icon: '🦁',
      type: 'festive',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Tiếng trống múa lân rộn ràng mang không khí tưng bừng khắp phố phường.',
    },
    {
      id: 'tt-rare-mooncake',
      name: 'Hộp Bánh Trung Thu Thập Cẩm',
      icon: '🥮',
      type: 'festive',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Hộp bánh nướng, bánh dẻo thơm ngon gắn kết tình thân đêm phá cỗ.',
    },
    {
      id: 'tt-common-carp-lantern',
      name: 'Đèn Cá Chép Vượt Vũ Môn',
      icon: '🎏',
      type: 'item',
      rarity: 'common',
      xpBonus: 150,
      description: 'Chiếc đèn lồng cá chép rực rỡ cổ vũ tinh thần học tập vượt khó.',
    },
  ],
  '14_02': [
    {
      id: '1402-mythic-crystal-heart',
      name: 'Trái Tim Pha Lê Vĩnh Cửu',
      icon: '💎',
      type: 'item',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Bảo vật Thần Thoại 14/2 (0,5%) — Biểu tượng của tình thân ái, sẻ chia và tri ân.',
    },
    {
      id: '1402-legendary-rose-bouquet',
      name: 'Bó Hồng Nhung Ngàn Cánh',
      icon: '💐',
      type: 'flower',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Bó hoa hồng thắm gửi tặng thầy cô, gia đình và bạn bè trân quý.',
    },
    {
      id: '1402-super-chocolate',
      name: 'Hộp Sô-cô-la Hoàng Gia',
      icon: '🍫',
      type: 'festive',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Hộp sô-cô-la ngọt ngào mang lại năng lượng vui vẻ cả ngày dài.',
    },
    {
      id: '1402-rare-ribbon',
      name: 'Hộp Quà Thắt Nơ Hồng',
      icon: '🎁',
      type: 'item',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Món quà nhỏ xinh gói trọn niềm vui bất ngờ ngày 14/2.',
    },
    {
      id: '1402-common-card',
      name: 'Thiệp Chúc Mừng Ấm Áp',
      icon: '💌',
      type: 'item',
      rarity: 'common',
      xpBonus: 150,
      description: 'Tấm thiệp viết tay gửi gắm lời chúc an lành tới người thân yêu.',
    },
  ],
  '30_04': [
    {
      id: '3004-mythic-victory-star',
      name: 'Sao Vàng Thống Nhất Non Sông',
      icon: '⭐',
      type: 'festive',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Bảo vật Thần Thoại 30/4 - 1/5 (0,5%) — Ngôi sao vàng rực sáng tinh thần tự hào dân tộc!',
    },
    {
      id: '3004-legendary-peace-dove',
      name: 'Chim Bồ Câu Hòa Bình Vàng',
      icon: '🕊️',
      type: 'item',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Biểu tượng hòa bình, khát vọng vươn lên và tinh thần đoàn kết.',
    },
    {
      id: '3004-super-fireworks',
      name: 'Pháo Hoa Đại Lễ 30/4',
      icon: '🎆',
      type: 'festive',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Màn pháo hoa rực rỡ chào mừng ngày hội non sông thống nhất.',
    },
    {
      id: '3004-rare-flag',
      name: 'Lá Cờ Đỏ Sao Vàng Kiêu Hãnh',
      icon: '🚩',
      type: 'festive',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Lá cờ tung bay phấp phới trong không khí đại lễ 30/4 - 1/5.',
    },
    {
      id: '3004-common-badge',
      name: 'Huy Hiệu Kỷ Niệm 30/4',
      icon: '🎖️',
      type: 'item',
      rarity: 'common',
      xpBonus: 150,
      description: 'Kỷ niệm chương nhỏ trang trọng lưu giữ dấu ấn lịch sử.',
    },
  ],
  '01_06': [
    {
      id: '0106-mythic-rainbow-crown',
      name: 'Vương Miện Cầu Vồng Tuổi Thơ',
      icon: '🌈',
      type: 'item',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Bảo vật Thần Thoại 1/6 (0,5%) — Tỏa sáng bảy sắc cầu vồng cùng niềm vui vô tận!',
    },
    {
      id: '0106-legendary-teddy',
      name: 'Gấu Bông Khổng Lồ Siêu Dễ Thương',
      icon: '🧸',
      type: 'item',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Chú gấu bông mềm mại đồng hành cùng tuổi học trò đầy ắp kỷ niệm.',
    },
    {
      id: '0106-super-palette',
      name: 'Hộp Màu Sáng Tạo 1/6',
      icon: '🎨',
      type: 'item',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Bộ màu vẽ rực rỡ khơi nguồn trí tưởng tượng bay cao bay xa.',
    },
    {
      id: '0106-rare-balloon',
      name: 'Chùm Bóng Bay Lễ Hội',
      icon: '🎈',
      type: 'festive',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Chùm bóng bay đủ màu sắc tung bay rộn ràng ngày 1/6.',
    },
    {
      id: '0106-common-lollipop',
      name: 'Kẹo Mút Cầu Vồng Ngọt Ngào',
      icon: '🍭',
      type: 'festive',
      rarity: 'common',
      xpBonus: 150,
      description: 'Chiếc kẹo mút nhiều tầng ngọt lịm ngày Quốc tế Thiếu nhi.',
    },
  ],
  '02_09': [
    {
      id: '0209-mythic-golden-lotus',
      name: 'Quốc Hoa Sen Vàng Rực Sáng',
      icon: '🪷',
      type: 'flower',
      rarity: 'mythic',
      xpBonus: 2000,
      description: 'Bảo vật Thần Thoại Quốc Khánh 2/9 (0,5%) — Đóa sen vàng cao quý biểu tượng tâm hồn Việt Nam!',
    },
    {
      id: '0209-legendary-sun-star',
      name: 'Ngôi Sao Độc Lập Lấp Lánh',
      icon: '🌟',
      type: 'festive',
      rarity: 'legendary',
      xpBonus: 800,
      description: 'Ánh sao vàng rực rỡ chào mừng ngày Tết Độc Lập 2/9.',
    },
    {
      id: '0209-super-fireworks',
      name: 'Pháo Hoa Mừng Tết Độc Lập',
      icon: '🎇',
      type: 'festive',
      rarity: 'super_rare',
      xpBonus: 450,
      description: 'Bầu trời rực sáng sắc pháo hoa đêm 2/9 lịch sử.',
    },
    {
      id: '0209-rare-drum',
      name: 'Trống Đồng Lạc Hồng Thu Nhỏ',
      icon: '🥁',
      type: 'item',
      rarity: 'rare',
      xpBonus: 250,
      description: 'Biểu tượng văn hóa ngàn năm văn hiến của dân tộc Việt Nam.',
    },
    {
      id: '0209-common-ribbon',
      name: 'Ruy Băng Đỏ Chúc Mừng 2/9',
      icon: '🎗️',
      type: 'festive',
      rarity: 'common',
      xpBonus: 150,
      description: 'Dải ruy băng kỷ niệm ngày Quốc Khánh trang trọng.',
    },
  ],
};

// Exact Mùng 1 Tết Nguyên Đán solar dates (2024 - 2035)
const LUNAR_TET_FIRST_DAY: Record<number, { month: number; day: number }> = {
  2024: { month: 2, day: 10 },
  2025: { month: 1, day: 29 },
  2026: { month: 2, day: 17 },
  2027: { month: 2, day: 6 },
  2028: { month: 1, day: 26 },
  2029: { month: 2, day: 13 },
  2030: { month: 2, day: 3 },
  2031: { month: 1, day: 23 },
  2032: { month: 2, day: 11 },
  2033: { month: 1, day: 31 },
  2034: { month: 2, day: 19 },
  2035: { month: 2, day: 8 },
};

// Exact Rằm Tháng 8 Âm Lịch (Tết Trung Thu) solar dates (2024 - 2035)
const LUNAR_TRUNG_THU_DAY: Record<number, { month: number; day: number }> = {
  2024: { month: 9, day: 17 },
  2025: { month: 10, day: 6 },
  2026: { month: 9, day: 25 },
  2027: { month: 9, day: 15 },
  2028: { month: 10, day: 3 },
  2029: { month: 9, day: 22 },
  2030: { month: 9, day: 12 },
  2031: { month: 10, day: 1 },
  2032: { month: 9, day: 19 },
  2033: { month: 9, day: 8 },
  2034: { month: 9, day: 27 },
  2035: { month: 9, day: 16 },
};

function isTetVisible(date: Date): { visible: boolean; isExactToday: boolean } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const tetInfo = LUNAR_TET_FIRST_DAY[year];

  if (tetInfo) {
    return {
      visible: month === tetInfo.month,
      isExactToday: month === tetInfo.month && day >= tetInfo.day && day <= tetInfo.day + 2,
    };
  }

  return { visible: month === 1 || month === 2, isExactToday: false };
}

function isTrungThuVisible(date: Date): { visible: boolean; isExactToday: boolean } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const ttInfo = LUNAR_TRUNG_THU_DAY[year];

  if (ttInfo) {
    return {
      visible: month === ttInfo.month,
      isExactToday: month === ttInfo.month && day === ttInfo.day,
    };
  }

  return { visible: month === 9, isExactToday: false };
}

/**
 * Visibility rules per user requirement:
 * - Shows ONLY during the calendar month of that holiday!
 * - Hidden completely in all other months.
 */
export function isHolidayVisible(holidayId: HolidayId, date: Date = new Date()): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  switch (holidayId) {
    case 'tet':
      return isTetVisible(date).visible;
    case '14_02':
      return month === 2;
    case '08_03':
      return month === 3;
    case '30_04':
      return month === 4 || (month === 5 && day <= 2);
    case '01_06':
      return month === 6;
    case '02_09':
      return month === 9;
    case 'trung_thu':
      return isTrungThuVisible(date).visible;
    case '20_10':
      return month === 10;
    case 'halloween':
      return month === 10;
    case '20_11':
      return month === 11;
    case 'noel':
      return month === 12;
    default:
      return false;
  }
}

export function getVisibleHolidays(date: Date = new Date()): HolidayConfig[] {
  const order: HolidayId[] = [
    'tet',
    '14_02',
    '08_03',
    '30_04',
    '01_06',
    '02_09',
    'trung_thu',
    '20_10',
    'halloween',
    '20_11',
    'noel',
  ];
  return order
    .filter((id) => isHolidayVisible(id, date))
    .map((id) => HOLIDAY_CONFIGS[id]);
}

export function detectActiveHoliday(date: Date = new Date()): HolidayConfig | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (isTetVisible(date).isExactToday) return HOLIDAY_CONFIGS.tet;
  if (month === 2 && day === 14) return HOLIDAY_CONFIGS['14_02'];
  if (month === 3 && day === 8) return HOLIDAY_CONFIGS['08_03'];
  if ((month === 4 && day === 30) || (month === 5 && day === 1)) return HOLIDAY_CONFIGS['30_04'];
  if (month === 6 && day === 1) return HOLIDAY_CONFIGS['01_06'];
  if (month === 9 && day === 2) return HOLIDAY_CONFIGS['02_09'];
  if (isTrungThuVisible(date).isExactToday) return HOLIDAY_CONFIGS.trung_thu;
  if (month === 10 && day === 20) return HOLIDAY_CONFIGS['20_10'];
  if (month === 10 && day === 31) return HOLIDAY_CONFIGS.halloween;
  if (month === 11 && day === 20) return HOLIDAY_CONFIGS['20_11'];
  if (month === 12 && (day === 24 || day === 25)) return HOLIDAY_CONFIGS.noel;
  return null;
}

export function getNearestHoliday(date: Date = new Date()): HolidayConfig {
  const active = detectActiveHoliday(date);
  if (active) return active;
  const visible = getVisibleHolidays(date);
  if (visible.length > 0) return visible[0];
  return HOLIDAY_CONFIGS['20_11'];
}

// Weighted Random Draw from the specific holiday's own non-study item pool
function rollWeightedGift(holidayId: HolidayId): HolidayGiftItem {
  const pool = HOLIDAY_GIFT_POOLS[holidayId] || HOLIDAY_GIFT_POOLS['20_11'];
  const totalWeight = RARITY_TIERS.reduce((sum, t) => sum + t.weight, 0); // 145.5
  let r = Math.random() * totalWeight;
  let chosenRarity: GiftRarity = 'common';

  for (const tier of RARITY_TIERS) {
    if (r < tier.weight) {
      chosenRarity = tier.id;
      break;
    }
    r -= tier.weight;
  }

  const candidates = pool.filter((item) => item.rarity === chosenRarity);
  if (candidates.length === 0) return pool[pool.length - 1];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const STORAGE_KEY_RECEIVED_GIFTS = 'max10_holiday_gifts_received_v1';
const STORAGE_KEY_SPIN_COUNT = 'max10_holiday_spin_count_v1';

export function loadReceivedHolidayGifts(): ReceivedHolidayGiftRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECEIVED_GIFTS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReceivedHolidayGiftRecords(newRecords: ReceivedHolidayGiftRecord[]) {
  try {
    const existing = loadReceivedHolidayGifts();
    const merged = [...newRecords, ...existing].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_RECEIVED_GIFTS, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('max10_holiday_gifts_updated'));
  } catch {}
}

interface HolidayGiftAnimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  isTeacher?: boolean;
  userGender?: 'male' | 'female' | 'other';
  teacherTitle?: 'Cô' | 'Thầy';
  isDark: boolean;
  initialHolidayId?: HolidayId;
  isExactHolidayToday?: boolean;
}

const getTodayDateKey = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const loadTodaySpinCount = (): number => {
  try {
    const today = getTodayDateKey();
    const savedDate = localStorage.getItem(`${STORAGE_KEY_SPIN_COUNT}_date`);
    if (savedDate !== today) {
      localStorage.setItem(STORAGE_KEY_SPIN_COUNT, '0');
      localStorage.setItem(`${STORAGE_KEY_SPIN_COUNT}_date`, today);
      return 0;
    }
    const saved = localStorage.getItem(STORAGE_KEY_SPIN_COUNT);
    const parsed = saved ? Number(saved) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
};

const saveTodaySpinCount = (count: number) => {
  try {
    localStorage.setItem(STORAGE_KEY_SPIN_COUNT, String(count));
    localStorage.setItem(`${STORAGE_KEY_SPIN_COUNT}_date`, getTodayDateKey());
  } catch {}
};

const SLOT_WIDTH = 104; // px width of each slot item + gap
const WINNING_INDEX = 28;
const TOTAL_SLOTS = 34;

export const HolidayGiftAnimationModal: React.FC<HolidayGiftAnimationModalProps> = ({
  isOpen,
  onClose,
  userName = 'Bạn',
  isTeacher = false,
  userGender = 'other',
  teacherTitle,
  isDark,
  initialHolidayId,
  isExactHolidayToday = false,
}) => {
  const visibleHolidays = useMemo(() => getVisibleHolidays(new Date()), [isOpen]);

  const resolveInitialHolidayId = (): HolidayId => {
    if (initialHolidayId && isHolidayVisible(initialHolidayId)) {
      return initialHolidayId;
    }
    if (visibleHolidays.length > 0) {
      return visibleHolidays[0].id;
    }
    return getNearestHoliday().id;
  };

  const [selectedHolidayId, setSelectedHolidayId] = useState<HolidayId>(resolveInitialHolidayId);
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'opened'>('ready');
  const [spinTrack, setSpinTrack] = useState<HolidayGiftItem[]>([]);
  const [trackOffsetPx, setTrackOffsetPx] = useState<number>(0);
  const [drawnGift, setDrawnGift] = useState<HolidayGiftItem | null>(null);
  const [spinCount, setSpinCount] = useState<number>(() => loadTodaySpinCount());
  const [claimBanner, setClaimBanner] = useState<string>('');
  const [showRonaldoSiu, setShowRonaldoSiu] = useState<boolean>(false);

  const spinTimersRef = useRef<number[]>([]);
  const hasClaimedCurrentRef = useRef<boolean>(false);
  const claimBannerTimerRef = useRef<number | null>(null);

  const isFemaleRecipient =
    (isTeacher && teacherTitle === 'Cô') || userGender === 'female';

  const clearSpinTimers = () => {
    spinTimersRef.current.forEach((id) => window.clearTimeout(id));
    spinTimersRef.current = [];
  };

  const awardGiftXpOnce = (
    gift: HolidayGiftItem | null
  ): { awarded: boolean; leveledUp?: boolean; newLevel?: number; newTitle?: string } => {
    if (!gift || hasClaimedCurrentRef.current) return { awarded: false };
    hasClaimedCurrentRef.current = true;
    try {
      const stats = loadStudentAchievements();
      const prevLevel = calculateLevel(stats.totalXp).level;
      const newTotal = stats.totalXp + gift.xpBonus;
      const lvl = calculateLevel(newTotal);
      const updatedStats = {
        ...stats,
        totalXp: newTotal,
        level: lvl.level,
        levelTitle: lvl.title,
        nextLevelXp: lvl.nextLevelXp,
      };
      saveStudentAchievements(updatedStats);
      window.dispatchEvent(
        new CustomEvent('max10_achievements_updated', { detail: updatedStats })
      );

      const existing = loadReceivedHolidayGifts();
      const newRecord: ReceivedHolidayGiftRecord = {
        id: `hgift-${Date.now()}`,
        holidayId: HOLIDAY_CONFIGS[selectedHolidayId].id,
        holidayTitle: HOLIDAY_CONFIGS[selectedHolidayId].badgeText,
        gift,
        receivedAt: new Date().toLocaleDateString('vi-VN'),
      };
      localStorage.setItem(
        STORAGE_KEY_RECEIVED_GIFTS,
        JSON.stringify([newRecord, ...existing].slice(0, 16))
      );
      return {
        awarded: true,
        leveledUp: lvl.level > prevLevel,
        newLevel: lvl.level,
        newTitle: lvl.title,
      };
    } catch {}
    return { awarded: true };
  };

  useEffect(() => {
    if (isOpen) {
      clearSpinTimers();
      setSelectedHolidayId(resolveInitialHolidayId());
      setPhase('ready');
      setDrawnGift(null);
      setSpinTrack([]);
      setTrackOffsetPx(0);
      setShowRonaldoSiu(false);
      setClaimBanner('');
      setSpinCount(loadTodaySpinCount());
      hasClaimedCurrentRef.current = false;
    }
    return () => {
      clearSpinTimers();
      if (claimBannerTimerRef.current) {
        window.clearTimeout(claimBannerTimerRef.current);
      }
    };
  }, [isOpen, initialHolidayId]);

  const holiday = HOLIDAY_CONFIGS[selectedHolidayId];

  const floatingPetals = useMemo(() => {
    return Array.from({ length: 24 }, (_, idx) => {
      const symbol = holiday.petals[idx % holiday.petals.length];
      return {
        id: idx,
        symbol,
        leftPercent: (idx * 4.3 + (idx % 3) * 2) % 98,
        delaySec: (idx % 7) * 0.45,
        durationSec: 4.5 + (idx % 5) * 0.9,
        fontSize: 18 + (idx % 4) * 5,
      };
    });
  }, [holiday]);

  if (!isOpen || visibleHolidays.length === 0) return null;

  const handleCloseModal = () => {
    if (phase === 'opened' && drawnGift) {
      awardGiftXpOnce(drawnGift);
      // Reset back to 0 spins once today's spin round is finished
      setSpinCount(0);
      saveTodaySpinCount(0);
    }
    clearSpinTimers();
    setDrawnGift(null);
    setSpinTrack([]);
    setTrackOffsetPx(0);
    setShowRonaldoSiu(false);
    setPhase('ready');
    onClose();
  };

  const handleClaimGift = () => {
    if (!drawnGift) return;
    const bonus = drawnGift.xpBonus;
    const result = awardGiftXpOnce(drawnGift);
    soundEffects.playCheckInReward();

    // Clear the just-spun gift and reset spin count back to 0 for the next round
    clearSpinTimers();
    setDrawnGift(null);
    setSpinTrack([]);
    setTrackOffsetPx(0);
    setShowRonaldoSiu(false);
    setPhase('ready');
    setSpinCount(0);
    saveTodaySpinCount(0);

    const levelUpText =
      result.leveledUp && result.newLevel
        ? ` 🎉 Lên Cấp ${formatLevelLabel(result.newLevel)} (${result.newTitle})!`
        : '';
    setClaimBanner(
      `Đã nhận quà (+${bonus} XP)!${levelUpText} Số lượt quay đã reset về 0 lượt để sẵn sàng quay tiếp.`
    );
    if (claimBannerTimerRef.current) {
      window.clearTimeout(claimBannerTimerRef.current);
    }
    claimBannerTimerRef.current = window.setTimeout(() => {
      setClaimBanner('');
    }, 3500);
  };

  const handleOpenAndSpin = () => {
    if (phase === 'spinning') return;

    // If spinning another gift directly from opened phase, claim current XP and clear previous gift immediately
    if (phase === 'opened' && drawnGift) {
      awardGiftXpOnce(drawnGift);
    }

    clearSpinTimers();
    setShowRonaldoSiu(false);
    setClaimBanner('');
    hasClaimedCurrentRef.current = false;

    const winningGift = rollWeightedGift(selectedHolidayId);
    const generatedTrack: HolidayGiftItem[] = Array.from({ length: TOTAL_SLOTS }, (_, idx) => {
      if (idx === WINNING_INDEX) return winningGift;
      return rollWeightedGift(selectedHolidayId);
    });

    setSpinTrack(generatedTrack);
    setDrawnGift(winningGift);
    setTrackOffsetPx(0);
    setPhase('spinning');
    setSpinCount((c) => {
      const next = c + 1;
      saveTodaySpinCount(next);
      return next;
    });
    soundEffects.playCorrect();

    // Trigger CSS transition on next frame so reel slides smoothly to WINNING_INDEX
    const startFrame = window.setTimeout(() => {
      const jitter = Math.floor(Math.random() * 24) - 12; // subtle natural stop jitter inside slot
      const targetOffset = WINNING_INDEX * SLOT_WIDTH + jitter;
      setTrackOffsetPx(targetOffset);
    }, 50);

    // Tick sound pulses while decelerating
    [250, 500, 800, 1150, 1550, 2000, 2450].forEach((ms) => {
      const t = window.setTimeout(() => {
        try {
          soundEffects.playClick();
        } catch {}
      }, ms);
      spinTimersRef.current.push(t);
    });

    // Finish spin at 3.2s and reveal Rarity Frame
    const finishTimer = window.setTimeout(() => {
      setPhase('opened');

      if (winningGift.rarity === 'mythic') {
        // Mythic drop: Trigger long Ronaldo "SIUUUUU" stadium celebration!
        setShowRonaldoSiu(true);
        celebrateMilestone();
        launchCanvasFireworks(5500);
        launchGoldenStarBurst();
        soundEffects.playBadgeUnlocked();

        [900, 1800, 2800, 3800].forEach((ms) => {
          const bt = window.setTimeout(() => {
            launchGoldenStarBurst();
          }, ms);
          spinTimersRef.current.push(bt);
        });

        const endSiuTimer = window.setTimeout(() => {
          setShowRonaldoSiu(false);
        }, 6800);
        spinTimersRef.current.push(endSiuTimer);
      } else if (winningGift.rarity === 'legendary' || winningGift.rarity === 'super_rare') {
        celebrateMilestone();
        window.setTimeout(() => launchGoldenStarBurst(), 260);
        soundEffects.playBadgeUnlocked();
      } else {
        soundEffects.playCorrect();
      }
    }, 3200);

    spinTimersRef.current.push(startFrame, finishTimer);
  };

  const rarityConfig = drawnGift ? RARITY_MAP[drawnGift.rarity] : null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      {/* Falling Petals / Festive Icons Overlay */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        {floatingPetals.map((p) => (
          <span
            key={p.id}
            className="animate-holiday-petal fixed -top-10 select-none"
            style={{
              left: `${p.leftPercent}%`,
              animationDelay: `${p.delaySec}s`,
              animationDuration: `${p.durationSec}s`,
              fontSize: `${p.fontSize}px`,
            }}
          >
            {p.symbol}
          </span>
        ))}
      </div>

      {/* Main Celebration & Gacha Spin Card */}
      <div
        className={`relative z-10 w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden transition-all my-auto ${
          showRonaldoSiu ? 'animate-cr7-shake ring-4 ring-amber-400/80' : ''
        } ${
          isDark
            ? 'bg-[#121624] border-white/15 text-slate-100'
            : 'bg-white border-rose-200 text-slate-900'
        }`}
      >
        {/* Top Gradient Banner */}
        <div className={`p-5 bg-gradient-to-r ${holiday.accentGradient} text-white relative`}>
          <button
            type="button"
            onClick={handleCloseModal}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 hover:bg-black/35 text-white transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ quà lễ"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold opacity-95 mb-1">
            <Flower2 className="w-4 h-4" />
            <span>{holiday.dateLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{isExactHolidayToday ? 'Sự kiện hôm nay' : 'Sự kiện lễ đang diễn ra'}</span>
            {isFemaleRecipient && (selectedHolidayId === '08_03' || selectedHolidayId === '20_10') && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-extrabold text-amber-200">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Đặc quyền {isTeacher ? 'Cô giáo' : 'Bạn nữ'}</span>
                </span>
              </>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-black leading-snug pr-8">{holiday.title}</h2>
          <p className="text-xs text-white/90 mt-0.5 leading-relaxed">{holiday.subtitle}</p>

          {/* Dynamic Switcher: Only shows holiday(s) currently active in this month & not yet expired */}
          {visibleHolidays.length > 1 && (
            <div className="mt-3.5 flex items-center gap-1.5 p-1 rounded-xl bg-black/20">
              {visibleHolidays.map((cfg) => {
                const active = selectedHolidayId === cfg.id;
                return (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => {
                      if (phase === 'opened' && drawnGift) {
                        awardGiftXpOnce(drawnGift);
                      }
                      clearSpinTimers();
                      setSelectedHolidayId(cfg.id);
                      setPhase('ready');
                      setDrawnGift(null);
                      setSpinTrack([]);
                      setTrackOffsetPx(0);
                      setShowRonaldoSiu(false);
                      setSpinCount(0);
                      saveTodaySpinCount(0);
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      active ? 'bg-white text-slate-900 shadow-sm' : 'text-white/85 hover:bg-white/10'
                    }`}
                  >
                    {cfg.badgeText}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Greeting */}
          <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-zinc-300 leading-relaxed">
            Kính gửi <strong>{isTeacher ? `${teacherTitle || 'Thầy/Cô'} ${userName}` : userName}</strong>:{' '}
            {isTeacher ? holiday.greetingTeacher : holiday.greetingStudent}
          </p>

          {/* TOP RARITY DROP-RATE FRAME (0,5% Thần Thoại -> 70% Bình Thường) */}
          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-2">
              <span>Tỷ Lệ Quay {holiday.itemCategoryLabel}:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black">
                Đã quay: {spinCount} lượt
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {RARITY_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className={`px-1.5 py-2 rounded-xl border ${tier.cardBorder} bg-gradient-to-b ${tier.cardBg}`}
                >
                  <div className={`text-xs sm:text-sm font-black ${tier.textClass}`}>{tier.rateLabel}</div>
                  <div className="text-[10px] font-bold truncate">{tier.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Claim Toast when previous gift was cleared */}
          {claimBanner && (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold text-center animate-in fade-in">
              ✅ {claimBanner}
            </div>
          )}

          {/* Interactive Gift Box / Always-Visible Gacha Reel Stage */}
          {phase === 'ready' ? (
            <div className="py-2 flex flex-col items-center justify-center space-y-4">
              {/* Live Holiday Gacha Reel Preview (always visible before spinning) */}
              <div
                className={`relative w-full h-32 rounded-2xl border-2 overflow-hidden flex items-center ${
                  isDark ? 'bg-slate-950 border-emerald-500/50' : 'bg-slate-900 border-emerald-400'
                }`}
              >
                <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-1 bg-emerald-400 z-20 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-emerald-400 z-20" />
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-emerald-400 z-20" />

                <div
                  className="flex items-center h-full"
                  style={{ paddingLeft: 'calc(50% - 48px)' }}
                >
                  {(HOLIDAY_GIFT_POOLS[selectedHolidayId] || []).map((item, idx) => {
                    const tier = RARITY_MAP[item.rarity];
                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        style={{ width: '96px', marginRight: '8px' }}
                        className={`shrink-0 h-24 rounded-xl border-2 ${tier.cardBorder} bg-gradient-to-b ${tier.cardBg} bg-slate-900 flex flex-col items-center justify-center p-1.5 text-center select-none`}
                      >
                        <span className="text-3xl mb-1">{item.icon}</span>
                        <span className="text-[10px] font-bold text-white line-clamp-1">{item.name}</span>
                        <span className={`text-[9px] font-black ${tier.textClass}`}>{tier.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAndSpin}
                className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${holiday.accentGradient} text-white font-black text-xs sm:text-sm shadow-lg hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap`}
              >
                <Gift className="w-4 h-4" />
                <span>Mở Hộp Quà {holiday.badgeText} &amp; Quay Thưởng</span>
              </button>

              <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 tabular-nums">
                Số lần đã quay: <strong className="text-amber-500 font-black">{spinCount} lượt</strong>
              </div>
            </div>
          ) : phase === 'spinning' ? (
            <div className="space-y-3 py-2">
              <div className="text-xs font-bold text-center text-amber-500 flex items-center justify-center gap-1.5">
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Đang quay quà {holiday.badgeText}... Chúc {isTeacher ? 'Thầy/Cô' : 'bạn'} may mắn!</span>
              </div>

              {/* Horizontal Gacha Reel Container */}
              <div
                className={`relative w-full h-32 rounded-2xl border-2 overflow-hidden flex items-center ${
                  isDark ? 'bg-slate-950 border-amber-500/50' : 'bg-slate-900 border-amber-400'
                }`}
              >
                {/* Center Winning Pointer Needle */}
                <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-1 bg-amber-400 z-20 shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-amber-400 z-20" />
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-amber-400 z-20" />

                {/* Moving Track */}
                <div
                  className="flex items-center h-full will-change-transform"
                  style={{
                    paddingLeft: 'calc(50% - 48px)',
                    transform: `translateX(-${trackOffsetPx}px)`,
                    transition: 'transform 3.05s cubic-bezier(0.08, 0.88, 0.14, 1)',
                  }}
                >
                  {spinTrack.map((item, idx) => {
                    const tier = RARITY_MAP[item.rarity];
                    return (
                      <div
                        key={idx}
                        style={{ width: '96px', marginRight: '8px' }}
                        className={`shrink-0 h-24 rounded-xl border-2 ${tier.cardBorder} bg-gradient-to-b ${tier.cardBg} bg-slate-900 flex flex-col items-center justify-center p-1.5 text-center select-none`}
                      >
                        <span className="text-3xl mb-1">{item.icon}</span>
                        <span className="text-[10px] font-bold text-white line-clamp-1">{item.name}</span>
                        <span className={`text-[9px] font-black ${tier.textClass}`}>{tier.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            drawnGift &&
            rarityConfig && (
              <div className="space-y-3">
                {/* RONALDO "SIUUUUU" STADIUM & GRASS PITCH MYTHIC CELEBRATION STAGE */}
                {drawnGift.rarity === 'mythic' && showRonaldoSiu && (
                  <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-400 bg-slate-950 text-white shadow-[0_0_45px_rgba(34,197,94,0.6)] animate-cr7-stadium">
                    {/* Real Stadium Scene with Cristiano Ronaldo's Face, #7 Jersey & Grass Pitch */}
                    <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                      <img
                        src={ronaldoSiuStadiumImg}
                        alt="Cristiano Ronaldo ăn mừng SIUUUU trên sân cỏ"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center scale-105"
                      />

                      {/* Stadium Floodlight Beams */}
                      <div
                        className="pointer-events-none absolute -top-12 left-6 w-28 h-56 bg-gradient-to-b from-white/45 via-emerald-200/20 to-transparent blur-xl origin-top animate-floodlight"
                        aria-hidden="true"
                      />
                      <div
                        className="pointer-events-none absolute -top-12 right-6 w-28 h-56 bg-gradient-to-b from-white/45 via-lime-200/20 to-transparent blur-xl origin-top animate-floodlight"
                        style={{ animationDelay: '1.1s' }}
                        aria-hidden="true"
                      />

                      {/* Shockwave Rings around Ronaldo */}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="w-40 h-40 rounded-full border-2 border-emerald-400/75 animate-cr7-shockwave" />
                        <div
                          className="w-40 h-40 rounded-full border-2 border-lime-400/65 animate-cr7-shockwave"
                          style={{ animationDelay: '0.55s' }}
                        />
                      </div>

                      {/* Gradient Scrim for Crisp Text Contrast */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-950 via-black/30 to-black/55" />

                      {/* Top Mythic Badge */}
                      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-400 via-green-400 to-lime-300 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-lg">
                          <Trophy className="w-3.5 h-3.5" />
                          <span>⚽ CHÚC MỪNG TRÚNG THẦN THOẠI 0,5%!</span>
                        </div>
                      </div>

                      {/* Giant SIUUUUU Typography Overlay */}
                      <div className="absolute bottom-2 inset-x-0 z-20 px-4 text-center">
                        <div className="animate-cr7-siu-text font-black text-2xl sm:text-4xl italic tracking-widest bg-gradient-to-r from-amber-300 via-white to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] select-none whitespace-nowrap">
                          SIUUUUUUUUUUUU!!!
                        </div>
                      </div>
                    </div>

                    {/* Vibrant Green Football Grass Pitch Foreground (Sân cỏ) */}
                    <div
                      className="relative px-4 py-3 border-t-2 border-white/80 text-center overflow-hidden"
                      style={{
                        background:
                          'repeating-linear-gradient(90deg, #15803d 0px, #15803d 28px, #16a34a 28px, #16a34a 56px)',
                      }}
                    >
                      {/* Center Pitch Circle & Halfway Line */}
                      <div
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/45"
                        aria-hidden="true"
                      />
                      <div
                        className="pointer-events-none absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-0.5 bg-white/45"
                        aria-hidden="true"
                      />

                      <p className="relative z-10 text-xs font-black text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                        🏟️ Bùng nổ sân cỏ cùng CR7! Bạn vừa quay trúng vật phẩm THẦN THOẠI hiếm nhất!
                      </p>
                    </div>
                  </div>
                )}

                {/* Mythic celebration triggers automatically when spun */}

                <div
                  className={`p-5 rounded-2xl border-2 text-center space-y-3 animate-in zoom-in-95 duration-300 bg-gradient-to-br ${rarityConfig.cardBg} ${rarityConfig.cardBorder} ${rarityConfig.glowClass}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${rarityConfig.badgeClass}`}>
                      {rarityConfig.label} · Tỷ lệ {rarityConfig.rateLabel}
                    </span>
                  </div>

                  <div className="text-6xl select-none">{drawnGift.icon}</div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-300">
                      {holiday.badgeText} · +{drawnGift.xpBonus} XP
                    </div>
                    <h3 className="text-lg font-black">{drawnGift.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed max-w-md mx-auto">
                      {drawnGift.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleOpenAndSpin}
                      className={`px-4 py-2.5 rounded-xl bg-gradient-to-r ${holiday.accentGradient} text-white text-xs font-black hover:brightness-105 cursor-pointer flex items-center gap-1.5 shadow-md`}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Quay tiếp món quà khác</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClaimGift}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      <span>Nhận Quà (+{drawnGift.xpBonus} XP)</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
