import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Gift, Sparkles, Flower2, Check, RotateCw, Crown, Trophy } from 'lucide-react';
import { celebrateMilestone, launchCanvasFireworks, launchGoldenStarBurst } from '../../utils/confettiFireworks';
import { soundEffects } from '../../utils/soundEffects';
import { loadStudentAchievements, saveStudentAchievements } from '../../data/initialAchievements';
import { calculateLevel } from '../../types/achievements';

export type HolidayId = 'tet' | '08_03' | '20_10' | 'halloween' | '20_11' | 'noel';
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
    cardBorder: 'border-rose-500',
    cardBg: 'from-rose-600/25 via-amber-500/25 to-fuchsia-600/25',
    badgeClass: 'bg-gradient-to-r from-rose-600 via-amber-500 to-fuchsia-600 text-white',
    textClass: 'text-rose-500 dark:text-rose-400',
    glowClass: 'shadow-[0_0_25px_rgba(244,63,94,0.45)]',
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
    cardBorder: 'border-emerald-500/60',
    cardBg: 'from-emerald-500/10 to-slate-500/10',
    badgeClass: 'bg-emerald-600 text-white',
    textClass: 'text-emerald-600 dark:text-emerald-400',
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

function isTetVisible(date: Date): { visible: boolean; isExactToday: boolean } {
  const year = date.getFullYear();
  const tetInfo = LUNAR_TET_FIRST_DAY[year];
  const todayMidnight = new Date(year, date.getMonth(), date.getDate()).getTime();

  if (tetInfo) {
    const tetStart = new Date(year, tetInfo.month - 1, tetInfo.day);
    // Visible from the 1st day of the solar month containing Tết (or 15 days before Mùng 1 Tết if early Feb) through Mùng 5 Tết (+4 days)
    const monthStart = new Date(year, tetInfo.month - 1, 1).getTime();
    const preTetStart = tetStart.getTime() - 15 * 24 * 60 * 60 * 1000;
    const windowStart = Math.min(monthStart, preTetStart);
    const windowEnd = tetStart.getTime() + 4 * 24 * 60 * 60 * 1000; // through Mùng 5 Tết

    const isExactToday =
      todayMidnight >= tetStart.getTime() &&
      todayMidnight <= tetStart.getTime() + 2 * 24 * 60 * 60 * 1000; // Mùng 1 - Mùng 3 Tết

    return {
      visible: todayMidnight >= windowStart && todayMidnight <= windowEnd,
      isExactToday,
    };
  }

  // Fallback for years outside lookup table: Jan 15 - Feb 20
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const visible = (m === 1 && d >= 15) || (m === 2 && d <= 20);
  return { visible, isExactToday: false };
}

/**
 * Visibility rules per user requirement:
 * - Shows ONLY when the month of that holiday arrives and BEFORE/ON the holiday date.
 * - Automatically hides as soon as the holiday date has passed!
 */
export function isHolidayVisible(holidayId: HolidayId, date: Date = new Date()): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  switch (holidayId) {
    case 'tet':
      return isTetVisible(date).visible;
    case '08_03':
      return month === 3 && day <= 8;
    case '20_10':
      return month === 10 && day <= 20;
    case 'halloween':
      return month === 10 && day <= 31;
    case '20_11':
      return month === 11 && day <= 20;
    case 'noel':
      return month === 12 && day <= 25;
    default:
      return false;
  }
}

export function getVisibleHolidays(date: Date = new Date()): HolidayConfig[] {
  const order: HolidayId[] = ['tet', '08_03', '20_10', 'halloween', '20_11', 'noel'];
  return order
    .filter((id) => isHolidayVisible(id, date))
    .map((id) => HOLIDAY_CONFIGS[id]);
}

export function detectActiveHoliday(date: Date = new Date()): HolidayConfig | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (isTetVisible(date).isExactToday) return HOLIDAY_CONFIGS.tet;
  if (month === 3 && day === 8) return HOLIDAY_CONFIGS['08_03'];
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
  const [spinCount, setSpinCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPIN_COUNT);
      const parsed = saved ? Number(saved) : 0;
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      return 0;
    }
  });
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

  const awardGiftXpOnce = (gift: HolidayGiftItem | null) => {
    if (!gift || hasClaimedCurrentRef.current) return false;
    hasClaimedCurrentRef.current = true;
    try {
      const stats = loadStudentAchievements();
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
    } catch {}
    return true;
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
    awardGiftXpOnce(drawnGift);
    soundEffects.playCheckInReward();

    // Clear the just-spun gift immediately so only spin count remains visible
    clearSpinTimers();
    setDrawnGift(null);
    setSpinTrack([]);
    setTrackOffsetPx(0);
    setShowRonaldoSiu(false);
    setPhase('ready');

    setClaimBanner(`Đã nhận quà (+${bonus} XP)! Tổng số lượt đã quay: ${spinCount} lượt.`);
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
      try {
        localStorage.setItem(STORAGE_KEY_SPIN_COUNT, String(next));
      } catch {}
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
        soundEffects.playRonaldoSiuCelebration();

        [900, 1800, 2800, 3800].forEach((ms) => {
          const bt = window.setTimeout(() => {
            launchGoldenStarBurst();
          }, ms);
          spinTimersRef.current.push(bt);
        });

        const endSiuTimer = window.setTimeout(() => {
          setShowRonaldoSiu(false);
        }, 5600);
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

          {/* Interactive Gift Box / Spinning Reel Stage */}
          {phase === 'ready' ? (
            <div className="py-4 flex flex-col items-center justify-center space-y-4">
              <button
                type="button"
                onClick={handleOpenAndSpin}
                className="group relative w-28 h-28 rounded-3xl bg-gradient-to-br from-rose-500/15 via-amber-500/15 to-pink-500/15 border-2 border-dashed border-rose-400/60 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <span className="text-5xl animate-holiday-gift select-none">🎁</span>
                <Sparkles className="w-5 h-5 text-amber-500 absolute -top-2 -right-2" />
              </button>

              <button
                type="button"
                onClick={handleOpenAndSpin}
                className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${holiday.accentGradient} text-white font-black text-xs sm:text-sm shadow-lg hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer`}
              >
                <Gift className="w-4 h-4" />
                <span>Mở Hộp Quà {holiday.badgeText} &amp; Quay Thưởng</span>
              </button>

              <div className="text-xs font-bold text-slate-500 dark:text-zinc-400">
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
                {/* RONALDO "SIUUUUU" LONG MYTHIC CELEBRATION STAGE */}
                {drawnGift.rarity === 'mythic' && showRonaldoSiu && (
                  <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-slate-950 via-rose-950/90 to-amber-950/90 p-5 text-center text-white shadow-[0_0_40px_rgba(245,158,11,0.55)]">
                    {/* Stadium spotlight & golden shockwave rings */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="w-36 h-36 rounded-full border-2 border-amber-400/60 animate-cr7-shockwave" />
                      <div
                        className="w-36 h-36 rounded-full border-2 border-rose-400/50 animate-cr7-shockwave"
                        style={{ animationDelay: '0.5s' }}
                      />
                    </div>

                    <div className="relative z-10 flex flex-col items-center space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-lg">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>⚽ ĐỒ THẦN THOẠI 0,5% · ĂN MỪNG CR7</span>
                      </div>

                      {/* Animated CR7 Jump-Spin-Spread Silhouette with #7 Jersey */}
                      <div className="relative flex items-center justify-center py-2">
                        <svg
                          viewBox="0 0 180 150"
                          className="w-36 h-28 drop-shadow-[0_0_18px_rgba(251,191,36,0.85)] animate-cr7-jump"
                          aria-hidden="true"
                        >
                          <circle cx="90" cy="75" r="54" fill="url(#cr7Aura)" opacity="0.45" />
                          <defs>
                            <radialGradient id="cr7Aura" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#fde047" />
                              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                            </radialGradient>
                          </defs>
                          <circle cx="90" cy="26" r="12" fill="#facc15" stroke="#fff" strokeWidth="2" />
                          <path
                            d="M72 42 L108 42 L102 84 L78 84 Z"
                            fill="#dc2626"
                            stroke="#fde047"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                          />
                          <text
                            x="90"
                            y="70"
                            textAnchor="middle"
                            fill="#fef08a"
                            fontSize="22"
                            fontWeight="900"
                            fontFamily="sans-serif"
                          >
                            7
                          </text>
                          <path
                            d="M74 46 L26 80 L34 88 L78 58"
                            fill="#facc15"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M106 46 L154 80 L146 88 L102 58"
                            fill="#facc15"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M80 84 L54 134 L68 138 L88 92"
                            fill="#1e293b"
                            stroke="#fde047"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M100 84 L126 134 L112 138 L92 92"
                            fill="#1e293b"
                            stroke="#fde047"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path d="M22 140 L158 140" stroke="#fde047" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" />
                        </svg>
                      </div>

                      {/* Long Stretching SIUUUUU Banner */}
                      <div className="w-full overflow-hidden py-1">
                        <div className="animate-cr7-siu-text font-black text-2xl sm:text-4xl italic tracking-widest bg-gradient-to-r from-amber-300 via-white to-rose-400 bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(251,191,36,0.9)] select-none whitespace-nowrap">
                          SIUUUUUUUUUUUU!!!
                        </div>
                      </div>

                      <p className="text-[11px] font-bold text-amber-200/95">
                        🔥 Bùng nổ sân vận động! Bạn vừa quay trúng vật phẩm THẦN THOẠI hiếm nhất!
                      </p>
                    </div>
                  </div>
                )}

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
