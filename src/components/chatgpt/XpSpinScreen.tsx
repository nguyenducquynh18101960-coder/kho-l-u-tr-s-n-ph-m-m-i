import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  RotateCw,
  Zap,
  Trophy,
  Sparkles,
  TrendingUp,
  History,
  Compass,
  Calendar,
  Gift,
} from 'lucide-react';
import {
  RARITY_TIERS,
  RARITY_MAP,
  GiftRarity,
  getVisibleHolidays,
  HolidayId,
  HOLIDAY_CONFIGS,
  HOLIDAY_GIFT_POOLS,
  saveReceivedHolidayGiftRecords,
} from './HolidayGiftAnimationModal';
import {
  loadStudentAchievements,
  saveStudentAchievements,
  StudentAchievementStats,
} from '../../data/initialAchievements';
import { calculateLevel, formatLevelLabel, MAX_LEVEL } from '../../types/achievements';
import {
  celebrateMilestone,
  launchCanvasFireworks,
  launchConfettiCannons,
  launchGoldenStarBurst,
} from '../../utils/confettiFireworks';
import { soundEffects } from '../../utils/soundEffects';
import ronaldoSiuStadiumImg from '../../assets/images/ronaldo_siu_stadium_1794918922903.jpg';
import type { MainTabId } from './Sidebar';

export interface XpSpinItem {
  id: string;
  name: string;
  icon: string;
  rarity: GiftRarity;
  xpBonus: number;
  description: string;
  isRonaldoSiu?: boolean;
  holidayId?: HolidayId;
}

export interface XpSpinHistoryRecord {
  id: string;
  item: XpSpinItem;
  spunAt: string;
}

export const XP_SPIN_POOL: XpSpinItem[] = [
  // 0,5% Thần Thoại — Xanh Lá (Emerald/Green)
  {
    id: 'xp-mythic-emerald-champion',
    name: 'Hào Quang Nhà Vô Địch Max10',
    icon: '⚽',
    rarity: 'mythic',
    xpBonus: 5000,
    isRonaldoSiu: true,
    description:
      'Tuyệt phẩm Thần Thoại Xanh Lá (0,5%)! Cộng thẳng +5.000 XP thăng nhiều cấp liên tiếp cùng hiệu ứng sân cỏ đặc biệt!',
  },
  {
    id: 'xp-mythic-golden-ball',
    name: 'Quả Bóng Vàng Kinh Nghiệm',
    icon: '🏆',
    rarity: 'mythic',
    xpBonus: 3500,
    isRonaldoSiu: true,
    description:
      'Bảo vật Thần Thoại Xanh Lá (0,5%) giúp bứt phá tốc độ chinh phục Cấp 2412 (MAX)!',
  },
  {
    id: 'xp-mythic-emerald-core',
    name: 'Ngọc Lục Bảo Tri Thức Max10',
    icon: '💚',
    rarity: 'mythic',
    xpBonus: 2500,
    isRonaldoSiu: true,
    description:
      'Tinh hoa Thần Thoại Xanh Lá (0,5%) rực sáng hào quang — thăng cấp siêu tốc ngay lập tức!',
  },

  // 10% Huyền Thoại — Vàng Cam
  {
    id: 'xp-leg-crown',
    name: 'Vương Miện Thủ Khoa',
    icon: '👑',
    rarity: 'legendary',
    xpBonus: 900,
    description: 'Phần thưởng Huyền Thoại (10%) giúp tích lũy gần 1.000 XP thăng cấp tức thì.',
  },
  {
    id: 'xp-leg-bolt',
    name: 'Tia Sét Tăng Tốc Cấp',
    icon: '⚡',
    rarity: 'legendary',
    xpBonus: 850,
    description: 'Nguồn năng lượng bùng nổ giúp vượt cấp nhanh chóng trên bảng xếp hạng.',
  },
  {
    id: 'xp-leg-flame',
    name: 'Ngọn Lửa Bứt Phá XP',
    icon: '🔥',
    rarity: 'legendary',
    xpBonus: 800,
    description: 'Thắp sáng tinh thần ôn thi THCS với lượng XP Huyền Thoại cực lớn.',
  },

  // 15% Siêu Hiếm — Tím
  {
    id: 'xp-sr-rocket',
    name: 'Tên Lửa Vượt Cấp',
    icon: '🚀',
    rarity: 'super_rare',
    xpBonus: 500,
    description: 'Vật phẩm Siêu Hiếm (15%) đẩy thanh kinh nghiệm tiến vọt về mốc cấp tiếp theo.',
  },
  {
    id: 'xp-sr-diamond',
    name: 'Kim Cương Trí Tuệ',
    icon: '💎',
    rarity: 'super_rare',
    xpBonus: 460,
    description: 'Viên kim cương lấp lánh mang theo lượng XP quý giá cho hành trình Điểm 10.',
  },
  {
    id: 'xp-sr-target',
    name: 'Mũi Tên Điểm 10',
    icon: '🎯',
    rarity: 'super_rare',
    xpBonus: 450,
    description: 'Bắn trúng hồng tâm tri thức, nhận ngay +450 XP vinh dự.',
  },

  // 50% Hiếm — Xanh Dương
  {
    id: 'xp-rare-star',
    name: 'Ngôi Sao May Mắn',
    icon: '🌟',
    rarity: 'rare',
    xpBonus: 280,
    description: 'Ngôi sao sáng giúp cộng thêm +280 XP vào hồ sơ thành tích.',
  },
  {
    id: 'xp-rare-book',
    name: 'Bí Kíp Luyện Đề',
    icon: '📘',
    rarity: 'rare',
    xpBonus: 250,
    description: 'Cuốn bí kíp cô đọng kiến thức Toán, Văn, Anh THCS kèm +250 XP.',
  },
  {
    id: 'xp-rare-compass',
    name: 'La Bàn Thông Thái',
    icon: '🧭',
    rarity: 'rare',
    xpBonus: 260,
    description: 'Định hướng lộ trình học tập chuẩn xác và tích lũy +260 XP.',
  },

  // 70% Bình Thường — Xám Bạc
  {
    id: 'xp-com-clover',
    name: 'Cỏ Bốn Lá Kinh Nghiệm',
    icon: '🍀',
    rarity: 'common',
    xpBonus: 140,
    description: 'Món quà may mắn nhẹ nhàng cộng +140 XP mỗi lượt quay.',
  },
  {
    id: 'xp-com-coin',
    name: 'Đồng Xu XP Sáng Lấp',
    icon: '🪙',
    rarity: 'common',
    xpBonus: 120,
    description: 'Tích tiểu thành đại — từng đồng xu XP đưa bạn tới gần đỉnh cao 2412.',
  },
  {
    id: 'xp-com-battery',
    name: 'Pin Năng Lượng Học Tập',
    icon: '🔋',
    rarity: 'common',
    xpBonus: 130,
    description: 'Nạp đầy năng lượng học bài mỗi ngày với +130 XP.',
  },
];

interface WheelWedge {
  rarity: GiftRarity;
  label: string;
  xpText: string;
  icon: string;
  fill: string;
  stroke: string;
  textColor: string;
}

const WEDGE_PALETTE: Record<GiftRarity, Array<{ fill: string; stroke: string; textColor: string }>> = {
  mythic: [{ fill: '#10b981', stroke: '#bbf7d0', textColor: '#022c22' }],
  legendary: [
    { fill: '#f59e0b', stroke: '#fde68a', textColor: '#451a03' },
    { fill: '#d97706', stroke: '#fde68a', textColor: '#fffbeb' },
  ],
  super_rare: [
    { fill: '#9333ea', stroke: '#d8b4fe', textColor: '#faf5ff' },
    { fill: '#7e22ce', stroke: '#d8b4fe', textColor: '#faf5ff' },
  ],
  rare: [
    { fill: '#0284c7', stroke: '#7dd3fc', textColor: '#f0f9ff' },
    { fill: '#0369a1', stroke: '#7dd3fc', textColor: '#f0f9ff' },
  ],
  common: [
    { fill: '#475569', stroke: '#94a3b8', textColor: '#f8fafc' },
    { fill: '#334155', stroke: '#94a3b8', textColor: '#f8fafc' },
  ],
};

const WEDGE_RARITY_SLOTS: GiftRarity[] = [
  'mythic',
  'common',
  'rare',
  'super_rare',
  'common',
  'legendary',
  'rare',
  'super_rare',
  'common',
  'legendary',
];

function buildWedgesFromPool(pool: XpSpinItem[]): WheelWedge[] {
  const rarityCursor: Record<GiftRarity, number> = {
    mythic: 0,
    legendary: 0,
    super_rare: 0,
    rare: 0,
    common: 0,
  };

  return WEDGE_RARITY_SLOTS.map((rarity, idx) => {
    const candidates = pool.filter((item) => item.rarity === rarity);
    const chosen =
      candidates.length > 0
        ? candidates[rarityCursor[rarity] % candidates.length]
        : pool[idx % pool.length];
    const paletteList = WEDGE_PALETTE[rarity];
    const palette = paletteList[rarityCursor[rarity] % paletteList.length];
    rarityCursor[rarity] += 1;

    return {
      rarity,
      label: RARITY_MAP[rarity].label,
      xpText: `+${chosen.xpBonus.toLocaleString()} XP`,
      icon: chosen.icon,
      fill: palette.fill,
      stroke: palette.stroke,
      textColor: palette.textColor,
    };
  });
}

const STORAGE_KEY_XP_SPIN_HISTORY = 'max10_xp_spin_history_v1';
const STORAGE_KEY_XP_SPIN_COUNT = 'max10_xp_spin_daily_count_v1';

const SLOT_WIDTH = 104;
const WINNING_INDEX = 28;
const TOTAL_SLOTS = 34;

const RARITY_RANK: Record<GiftRarity, number> = {
  mythic: 5,
  legendary: 4,
  super_rare: 3,
  rare: 2,
  common: 1,
};

function rollWeightedFromPool(pool: XpSpinItem[]): XpSpinItem {
  const totalWeight = RARITY_TIERS.reduce((sum, t) => sum + t.weight, 0);
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

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadSpinCount(): number {
  try {
    const today = getTodayKey();
    if (localStorage.getItem(`${STORAGE_KEY_XP_SPIN_COUNT}_date`) !== today) {
      localStorage.setItem(STORAGE_KEY_XP_SPIN_COUNT, '0');
      localStorage.setItem(`${STORAGE_KEY_XP_SPIN_COUNT}_date`, today);
      return 0;
    }
    const n = Number(localStorage.getItem(STORAGE_KEY_XP_SPIN_COUNT) || 0);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function saveSpinCount(count: number) {
  try {
    localStorage.setItem(STORAGE_KEY_XP_SPIN_COUNT, String(count));
    localStorage.setItem(`${STORAGE_KEY_XP_SPIN_COUNT}_date`, getTodayKey());
  } catch {}
}

function loadSpinHistory(): XpSpinHistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_XP_SPIN_HISTORY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSpinHistory(records: XpSpinHistoryRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_XP_SPIN_HISTORY, JSON.stringify(records.slice(0, 20)));
  } catch {}
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeWedge(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', cx, cy, 'L', start.x, start.y, 'A', r, r, 0, largeArc, 0, end.x, end.y, 'Z'].join(' ');
}

export interface XpSpinScreenProps {
  isDark: boolean;
  userName?: string;
  variant?: 'page' | 'modal';
  onClose?: () => void;
  onNavigateToTab?: (tab: MainTabId) => void;
}

export const XpSpinScreen: React.FC<XpSpinScreenProps> = ({
  isDark,
  userName = 'Bạn học',
  variant = 'page',
  onClose,
  onNavigateToTab,
}) => {
  const visibleHolidays = useMemo(() => getVisibleHolidays(new Date()), []);
  const currentMonth = new Date().getMonth() + 1;

  const [spinMode, setSpinMode] = useState<'xp' | HolidayId>('xp');
  const [stats, setStats] = useState<StudentAchievementStats>(() => loadStudentAchievements());
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'spinning_multi' | 'result'>('ready');
  const [spinTrack, setSpinTrack] = useState<XpSpinItem[]>(() => [
    ...XP_SPIN_POOL,
    ...XP_SPIN_POOL,
  ]);
  const [trackOffsetPx, setTrackOffsetPx] = useState<number>(0);
  const [wheelRotationDeg, setWheelRotationDeg] = useState<number>(0);
  const [wonItems, setWonItems] = useState<XpSpinItem[]>([]);
  const [spinCount, setSpinCount] = useState<number>(() => loadSpinCount());
  const [sessionXpEarned, setSessionXpEarned] = useState<number>(0);
  const [levelUpNotice, setLevelUpNotice] = useState<{
    prevLevel: number;
    newLevel: number;
    newTitle: string;
    xpGained: number;
  } | null>(null);
  const [showRonaldoSiu, setShowRonaldoSiu] = useState<boolean>(false);
  const [ronaldoImgFailed, setRonaldoImgFailed] = useState<boolean>(false);
  const [history, setHistory] = useState<XpSpinHistoryRecord[]>(() => loadSpinHistory());

  const spinTimersRef = useRef<number[]>([]);

  const activeHolidayConfig = spinMode !== 'xp' ? HOLIDAY_CONFIGS[spinMode] : null;

  const activePool: XpSpinItem[] = useMemo(() => {
    if (spinMode === 'xp') return XP_SPIN_POOL;
    const hPool = HOLIDAY_GIFT_POOLS[spinMode] || [];
    return hPool.map((item) => ({
      id: item.id,
      name: item.name,
      icon: item.icon,
      rarity: item.rarity,
      xpBonus: item.xpBonus,
      description: item.description,
      isRonaldoSiu: item.rarity === 'mythic',
      holidayId: spinMode,
    }));
  }, [spinMode]);

  const activeWedges = useMemo(() => buildWedgesFromPool(activePool), [activePool]);

  const clearSpinTimers = () => {
    spinTimersRef.current.forEach((id) => window.clearTimeout(id));
    spinTimersRef.current = [];
  };

  useEffect(() => {
    setStats(loadStudentAchievements());
    setSpinCount(loadSpinCount());
    setHistory(loadSpinHistory());
    const sync = () => setStats(loadStudentAchievements());
    window.addEventListener('max10_achievements_updated', sync);
    return () => {
      window.removeEventListener('max10_achievements_updated', sync);
      clearSpinTimers();
    };
  }, []);

  const handleSelectMode = (nextMode: 'xp' | HolidayId) => {
    if (phase === 'spinning' || phase === 'spinning_multi') return;
    clearSpinTimers();
    setShowRonaldoSiu(false);
    setLevelUpNotice(null);
    setWonItems([]);
    setPhase('ready');
    setTrackOffsetPx(0);
    setSpinMode(nextMode);

    if (nextMode === 'xp') {
      setSpinTrack([...XP_SPIN_POOL, ...XP_SPIN_POOL]);
    } else {
      const hPool = (HOLIDAY_GIFT_POOLS[nextMode] || []).map((item) => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        rarity: item.rarity,
        xpBonus: item.xpBonus,
        description: item.description,
        isRonaldoSiu: item.rarity === 'mythic',
        holidayId: nextMode,
      }));
      setSpinTrack([...hPool, ...hPool, ...hPool]);
    }
  };

  const levelInfo = calculateLevel(stats.totalXp);
  const levelSpan = Math.max(1, levelInfo.nextLevelXp - levelInfo.currentLevelXp);
  const xpIntoLevel = Math.max(0, stats.totalXp - levelInfo.currentLevelXp);
  const xpProgressPct = levelInfo.isMaxLevel
    ? 100
    : Math.min(100, Math.round((xpIntoLevel / levelSpan) * 100));
  const xpNeeded = levelInfo.isMaxLevel ? 0 : Math.max(0, levelInfo.nextLevelXp - stats.totalXp);

  const awardItemsXp = (items: XpSpinItem[]) => {
    const totalBonus = items.reduce((sum, it) => sum + it.xpBonus, 0);
    const current = loadStudentAchievements();
    const prevLv = calculateLevel(current.totalXp).level;
    const nextTotalXp = current.totalXp + totalBonus;
    const nextLvInfo = calculateLevel(nextTotalXp);

    const updated: StudentAchievementStats = {
      ...current,
      totalXp: nextTotalXp,
      level: nextLvInfo.level,
      levelTitle: nextLvInfo.title,
      nextLevelXp: nextLvInfo.nextLevelXp,
    };
    saveStudentAchievements(updated);
    setStats(updated);
    setSessionXpEarned((prev) => prev + totalBonus);

    if (nextLvInfo.level > prevLv) {
      setLevelUpNotice({
        prevLevel: prevLv,
        newLevel: nextLvInfo.level,
        newTitle: nextLvInfo.title,
        xpGained: totalBonus,
      });
    } else {
      setLevelUpNotice(null);
    }

    // If any items came from an active seasonal holiday pool, persist to Holiday Gift Collection too
    const holidayItems = items.filter((it) => Boolean(it.holidayId));
    if (holidayItems.length > 0) {
      const dateStr = new Date().toLocaleDateString('vi-VN');
      saveReceivedHolidayGiftRecords(
        holidayItems.map((it, idx) => {
          const hCfg = HOLIDAY_CONFIGS[it.holidayId!];
          return {
            id: `hgift-spin-${Date.now()}-${idx}`,
            holidayId: hCfg.id,
            holidayTitle: hCfg.badgeText,
            gift: {
              id: it.id,
              name: it.name,
              icon: it.icon,
              type: 'festive',
              rarity: it.rarity,
              xpBonus: it.xpBonus,
              description: it.description,
            },
            receivedAt: dateStr,
          };
        })
      );
    }

    const nowLabel = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newRecords: XpSpinHistoryRecord[] = items.map((item, idx) => ({
      id: `xpspin-${Date.now()}-${idx}`,
      item,
      spunAt: nowLabel,
    }));
    const mergedHistory = [...newRecords, ...history].slice(0, 20);
    setHistory(mergedHistory);
    saveSpinHistory(mergedHistory);
  };

  const triggerRonaldoSiuCelebration = (durationMs = 6800) => {
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

    const endTimer = window.setTimeout(() => {
      setShowRonaldoSiu(false);
    }, durationMs);
    spinTimersRef.current.push(endTimer);
  };

  const computeTargetWheelAngle = (rarity: GiftRarity, prevRotation: number): number => {
    const wedgeAngle = 360 / activeWedges.length;
    const matchingIndices = activeWedges
      .map((w, idx) => (w.rarity === rarity ? idx : -1))
      .filter((idx) => idx >= 0);
    const chosenIdx =
      matchingIndices.length > 0
        ? matchingIndices[Math.floor(Math.random() * matchingIndices.length)]
        : 0;
    const wedgeCenter = chosenIdx * wedgeAngle + wedgeAngle / 2;
    const targetMod = (360 - (wedgeCenter % 360)) % 360;
    const jitter = Math.random() * 14 - 7;
    const currentMod = ((prevRotation % 360) + 360) % 360;
    const deltaMod = (targetMod - currentMod + 360) % 360;
    return prevRotation + 360 * 6 + deltaMod + jitter;
  };

  const handleSpinSingle = () => {
    if (phase === 'spinning' || phase === 'spinning_multi') return;
    clearSpinTimers();
    setShowRonaldoSiu(false);
    setLevelUpNotice(null);

    const winningItem = rollWeightedFromPool(activePool);
    const generatedTrack: XpSpinItem[] = Array.from({ length: TOTAL_SLOTS }, (_, idx) =>
      idx === WINNING_INDEX ? winningItem : rollWeightedFromPool(activePool)
    );

    setSpinTrack(generatedTrack);
    setWonItems([winningItem]);
    setTrackOffsetPx(0);
    setPhase('spinning');
    setSpinCount((c) => {
      const next = c + 1;
      saveSpinCount(next);
      return next;
    });
    soundEffects.playCorrect();

    const startFrame = window.setTimeout(() => {
      const jitter = Math.floor(Math.random() * 24) - 12;
      setTrackOffsetPx(WINNING_INDEX * SLOT_WIDTH + jitter);
      setWheelRotationDeg((prev) => computeTargetWheelAngle(winningItem.rarity, prev));
    }, 50);

    [220, 440, 700, 1000, 1360, 1780, 2240, 2680].forEach((ms) => {
      const t = window.setTimeout(() => {
        try {
          soundEffects.playClick();
        } catch {}
      }, ms);
      spinTimersRef.current.push(t);
    });

    const finishTimer = window.setTimeout(() => {
      setPhase('result');
      awardItemsXp([winningItem]);

      if (winningItem.rarity === 'mythic') {
        triggerRonaldoSiuCelebration(6800);
      } else if (winningItem.rarity === 'legendary' || winningItem.rarity === 'super_rare') {
        celebrateMilestone();
        launchGoldenStarBurst();
        soundEffects.playBadgeUnlocked();
      } else {
        soundEffects.playCheckInReward();
      }
    }, 3150);

    spinTimersRef.current.push(startFrame, finishTimer);
  };

  const handleSpinMulti5 = () => {
    if (phase === 'spinning' || phase === 'spinning_multi') return;
    clearSpinTimers();
    setShowRonaldoSiu(false);
    setLevelUpNotice(null);

    const batch = Array.from({ length: 5 }, () => rollWeightedFromPool(activePool));
    const topBatchItem = [...batch].sort(
      (a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || b.xpBonus - a.xpBonus
    )[0];

    setWonItems(batch);
    setPhase('spinning_multi');
    setSpinCount((c) => {
      const next = c + 5;
      saveSpinCount(next);
      return next;
    });
    soundEffects.playCorrect();

    const kickWheel = window.setTimeout(() => {
      if (topBatchItem) {
        setWheelRotationDeg((prev) => computeTargetWheelAngle(topBatchItem.rarity, prev));
      }
    }, 40);
    spinTimersRef.current.push(kickWheel);

    [150, 320, 500, 700].forEach((ms) => {
      const t = window.setTimeout(() => {
        try {
          soundEffects.playClick();
        } catch {}
      }, ms);
      spinTimersRef.current.push(t);
    });

    const finishTimer = window.setTimeout(() => {
      setPhase('result');
      awardItemsXp(batch);

      const hasMythic = batch.some((item) => item.rarity === 'mythic');
      const hasLegendaryOrSuper = batch.some(
        (item) => item.rarity === 'legendary' || item.rarity === 'super_rare'
      );

      if (hasMythic) {
        triggerRonaldoSiuCelebration(6800);
      } else if (hasLegendaryOrSuper) {
        celebrateMilestone();
        launchConfettiCannons();
        soundEffects.playBadgeUnlocked();
      } else {
        soundEffects.playCheckInReward();
      }
    }, 1150);

    spinTimersRef.current.push(finishTimer);
  };

  const handleClose = () => {
    clearSpinTimers();
    setShowRonaldoSiu(false);
    onClose?.();
  };

  const bestWonItem = useMemo(() => {
    if (wonItems.length === 0) return null;
    return [...wonItems].sort(
      (a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || b.xpBonus - a.xpBonus
    )[0];
  }, [wonItems]);

  const totalBatchXp = useMemo(
    () => wonItems.reduce((sum, item) => sum + item.xpBonus, 0),
    [wonItems]
  );

  const mythicCount = history.filter((h) => h.item.rarity === 'mythic').length;
  const isSpinning = phase === 'spinning' || phase === 'spinning_multi';
  const wedgeAngle = 360 / activeWedges.length;

  const headerGradient = activeHolidayConfig
    ? activeHolidayConfig.accentGradient
    : 'from-emerald-700 via-green-700 to-slate-900';

  return (
    <div
      className={
        variant === 'modal'
          ? `relative z-10 w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden transition-all my-auto select-none ${
              showRonaldoSiu ? 'animate-cr7-shake ring-4 ring-emerald-400/80' : ''
            } ${
              isDark
                ? 'bg-[#0e1422] border-white/15 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`
          : `w-full max-w-5xl mx-auto p-3 sm:p-5 space-y-4 select-none ${
              showRonaldoSiu ? 'animate-cr7-shake' : ''
            }`
      }
    >
      {/* Top Banner Header (Chỉ hiển thị Quay XP Lên Cấp & Lễ theo tháng — không ghi hiệu ứng ẩn ra ngoài) */}
      <div
        className={`px-5 py-4 bg-gradient-to-r ${headerGradient} text-white relative ${
          variant === 'page' ? 'rounded-3xl shadow-lg border border-emerald-500/30' : ''
        }`}
      >
        {variant === 'modal' && onClose && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-black/25 hover:bg-black/40 text-white transition-colors cursor-pointer"
            aria-label="Đóng màn hình quay XP lên cấp"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-100 mb-1 pr-10">
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>{activeHolidayConfig ? `Sự Kiện ${activeHolidayConfig.dateLabel}` : 'Quay XP Lên Cấp Max10'}</span>
          <span aria-hidden="true">·</span>
          <span>Thần Thoại Xanh Lá (0,5%)</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              {activeHolidayConfig
                ? `Quay Quà & XP: ${activeHolidayConfig.badgeText}`
                : 'Quay XP Lên Cấp'}
            </h2>
            <p className="text-xs text-white/85 mt-0.5">
              Xin chào <strong>{userName || 'Bạn học'}</strong> —{' '}
              {activeHolidayConfig
                ? activeHolidayConfig.subtitle
                : `quay trực tiếp trên vòng quay hoặc thanh trượt để lên Cấp ${MAX_LEVEL} (MAX)!`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToTab && variant === 'page' && (
              <button
                type="button"
                onClick={() => onNavigateToTab('group')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Thi đấu trong Cộng đồng</span>
              </button>
            )}
          </div>
        </div>

        {/* Mode Switcher: Quay XP Lên Cấp + Chỉ các ngày lễ thuộc tháng hiện tại */}
        <div className="mt-3 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => handleSelectMode('xp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                spinMode === 'xp'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'bg-black/20 hover:bg-black/35 text-white/90'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Quay XP Lên Cấp</span>
            </button>

            {visibleHolidays.map((holiday) => {
              const isSelected = spinMode === holiday.id;
              return (
                <button
                  key={holiday.id}
                  type="button"
                  disabled={isSpinning}
                  onClick={() => handleSelectMode(holiday.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-300 text-slate-950 shadow-sm'
                      : 'bg-black/20 hover:bg-black/35 text-white/90'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>
                    {holiday.petals[0]} {holiday.badgeText}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/80">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Tháng {currentMonth}: {visibleHolidays.length > 0 ? `${visibleHolidays.length} lễ đang mở` : 'Chưa tới tháng lễ'} (lễ tháng khác tự ẩn)
            </span>
          </span>
        </div>
      </div>

      {/* Main Spin Body */}
      <div
        className={
          variant === 'modal'
            ? 'p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto'
            : 'space-y-4 pb-8'
        }
      >
        {/* LIVE LEVEL & XP PROGRESS HUD */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border ${
            isDark ? 'bg-[#0e1523] border-white/[0.08]' : 'bg-white border-slate-200/90 shadow-2xs'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-sm tabular-nums">
                Lv.{levelInfo.level}
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black truncate">
                  Cấp {formatLevelLabel(levelInfo.level)} · {levelInfo.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
                  Tổng XP:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {stats.totalXp.toLocaleString()} XP
                  </strong>
                  <span className="mx-1.5" aria-hidden="true">
                    ·
                  </span>
                  {levelInfo.isMaxLevel
                    ? 'Đã đạt cấp tối đa!'
                    : `Còn ${xpNeeded.toLocaleString()} XP lên Cấp ${formatLevelLabel(
                        levelInfo.level + 1
                      )}`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-zinc-400 tabular-nums">
              <span>
                Hôm nay: <strong className="text-slate-900 dark:text-white">{spinCount} lượt</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Phiên này:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  +{sessionXpEarned.toLocaleString()} XP
                </strong>
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-green-400 to-teal-400 transition-all duration-500"
              style={{ width: `${xpProgressPct}%` }}
            />
          </div>
        </div>

        {/* Inline Level-Up Alert */}
        {levelUpNotice && (
          <div className="px-4 py-2.5 rounded-xl border border-emerald-500/45 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>
                Thăng cấp thành công: Cấp {levelUpNotice.prevLevel} → Cấp{' '}
                {formatLevelLabel(levelUpNotice.newLevel)} ({levelUpNotice.newTitle})
              </span>
            </span>
            <span className="tabular-nums font-black">
              +{levelUpNotice.xpGained.toLocaleString()} XP
            </span>
          </div>
        )}

        {/* 5 RARITY TIERS */}
        <div
          className={`p-3 rounded-2xl border ${
            isDark ? 'bg-slate-900/70 border-white/[0.08]' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-2">
            <span>
              Bảng Tỷ Lệ {activeHolidayConfig ? activeHolidayConfig.itemCategoryLabel : 'Quay XP Lên Cấp'}:
            </span>
            <span className="tabular-nums">
              Thần Thoại Xanh Lá đã mở:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">{mythicCount}</strong>
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {RARITY_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`px-1.5 py-2 rounded-xl border ${tier.cardBorder} bg-gradient-to-b ${tier.cardBg}`}
              >
                <div className={`text-xs sm:text-sm font-black tabular-nums ${tier.textClass}`}>
                  {tier.rateLabel}
                </div>
                <div className="text-[10px] font-bold truncate">{tier.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ALWAYS-VISIBLE SPIN WHEEL + HORIZONTAL GACHA REEL STAGE */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border space-y-5 ${
            isDark
              ? 'bg-gradient-to-b from-[#0b1322] to-[#0f172a] border-emerald-500/30'
              : 'bg-gradient-to-b from-slate-50 to-white border-emerald-200 shadow-sm'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* LEFT: ALWAYS VISIBLE ROTATING 10-WEDGE SVG WHEEL */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                {/* Top Pointer Triangle */}
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_10px_rgba(16,185,129,0.75)]"
                  aria-hidden="true"
                >
                  <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-emerald-400" />
                </div>

                {/* Outer Rim Glow */}
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/60 shadow-[0_0_32px_rgba(16,185,129,0.28)] pointer-events-none" />

                {/* Rotating Wheel SVG */}
                <div
                  className="w-full h-full rounded-full overflow-hidden will-change-transform"
                  style={{
                    transform: `rotate(${wheelRotationDeg}deg)`,
                    transition: isSpinning
                      ? 'transform 3.05s cubic-bezier(0.08, 0.88, 0.14, 1)'
                      : 'transform 0.35s ease-out',
                  }}
                >
                  <svg viewBox="0 0 320 320" className="w-full h-full">
                    {activeWedges.map((wedge, idx) => {
                      const startAngle = idx * wedgeAngle;
                      const endAngle = startAngle + wedgeAngle;
                      const midAngle = startAngle + wedgeAngle / 2;
                      const iconPos = polarToCartesian(160, 160, 118, midAngle);
                      const xpPos = polarToCartesian(160, 160, 84, midAngle);
                      return (
                        <g key={idx}>
                          <path
                            d={describeWedge(160, 160, 156, startAngle, endAngle)}
                            fill={wedge.fill}
                            stroke={wedge.stroke}
                            strokeWidth="1.5"
                          />
                          <text
                            x={iconPos.x}
                            y={iconPos.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="18"
                            transform={`rotate(${midAngle}, ${iconPos.x}, ${iconPos.y})`}
                          >
                            {wedge.icon}
                          </text>
                          <text
                            x={xpPos.x}
                            y={xpPos.y}
                            fill={wedge.textColor}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="9.5"
                            fontWeight="900"
                            transform={`rotate(${midAngle}, ${xpPos.x}, ${xpPos.y})`}
                          >
                            {wedge.xpText}
                          </text>
                        </g>
                      );
                    })}
                    <circle
                      cx="160"
                      cy="160"
                      r="44"
                      fill="#0b1322"
                      stroke="#34d399"
                      strokeWidth="3"
                    />
                  </svg>
                </div>

                {/* Center Spin Button */}
                <button
                  type="button"
                  disabled={isSpinning}
                  onClick={handleSpinSingle}
                  className="absolute z-20 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 hover:brightness-110 disabled:opacity-75 text-slate-950 font-black text-xs shadow-xl border-2 border-white flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer"
                >
                  <RotateCw className={`w-5 h-5 mb-0.5 ${isSpinning ? 'animate-spin' : ''}`} />
                  <span>{isSpinning ? 'QUAY...' : 'QUAY XP'}</span>
                </button>
              </div>
            </div>

            {/* RIGHT: ALWAYS VISIBLE HORIZONTAL GACHA REEL + SPIN ACTIONS */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {phase === 'spinning'
                      ? 'Đang quay thanh trượt — Chờ kết quả nhận XP!'
                      : phase === 'spinning_multi'
                      ? 'Đang mở nhanh 5 lượt liên tiếp...'
                      : activeHolidayConfig
                      ? `Dải Quà Lễ ${activeHolidayConfig.badgeText} (+XP)`
                      : 'Thanh Trượt Quay XP Lên Cấp'}
                  </span>
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 tabular-nums">
                  {activePool.length} vật phẩm
                </span>
              </div>

              {/* Horizontal Gacha Reel Container — ALWAYS VISIBLE */}
              <div
                className={`relative w-full h-32 rounded-2xl border-2 overflow-hidden flex items-center ${
                  isDark ? 'bg-slate-950 border-emerald-500/60' : 'bg-slate-900 border-emerald-500'
                }`}
              >
                {/* Center Emerald Laser Pointer Needle */}
                <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-1 bg-emerald-400 z-20 shadow-[0_0_14px_rgba(52,211,153,0.95)]" />
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-emerald-400 z-20" />
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-emerald-400 z-20" />

                <div
                  className="flex items-center h-full will-change-transform"
                  style={{
                    paddingLeft: 'calc(50% - 48px)',
                    transform: `translateX(-${trackOffsetPx}px)`,
                    transition:
                      phase === 'spinning'
                        ? 'transform 3.05s cubic-bezier(0.08, 0.88, 0.14, 1)'
                        : 'none',
                  }}
                >
                  {spinTrack.map((item, idx) => {
                    const tier = RARITY_MAP[item.rarity];
                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        style={{ width: '96px', marginRight: '8px' }}
                        className={`shrink-0 h-24 rounded-xl border-2 ${tier.cardBorder} bg-gradient-to-b ${tier.cardBg} bg-slate-900 flex flex-col items-center justify-center p-1.5 text-center`}
                      >
                        <span className="text-2xl mb-0.5">{item.icon}</span>
                        <span className="text-[10px] font-bold text-white line-clamp-1 tabular-nums">
                          +{item.xpBonus.toLocaleString()} XP
                        </span>
                        <span className={`text-[9px] font-black ${tier.textClass}`}>{tier.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons (Chỉ hiển thị nút quay XP lên cấp & quay nhanh x5) */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={isSpinning}
                  onClick={handleSpinSingle}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:brightness-110 disabled:opacity-60 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCw className={`w-4 h-4 ${phase === 'spinning' ? 'animate-spin' : ''}`} />
                  <span>{phase === 'spinning' ? 'Đang quay 1 lượt...' : 'Quay 1 Lượt Nhận XP'}</span>
                </button>

                <button
                  type="button"
                  disabled={isSpinning}
                  onClick={handleSpinMulti5}
                  className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>{phase === 'spinning_multi' ? 'Đang mở x5...' : 'Quay Nhanh x5 Lượt'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Multi-5 Spin Progress Strip */}
          {phase === 'spinning_multi' && (
            <div className="grid grid-cols-5 gap-2 max-w-xl mx-auto pt-1">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="h-20 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 flex flex-col items-center justify-center animate-pulse"
                >
                  <span className="text-2xl">✨</span>
                  <span className="text-[10px] font-bold text-emerald-500 mt-1">Lượt {idx + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RONALDO "SIUUUUU" STADIUM CELEBRATION STAGE (HIỆU ỨNG KHI TRÚNG THẦN THOẠI 0,5%) */}
        {showRonaldoSiu && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-400 bg-slate-950 text-white shadow-[0_0_45px_rgba(34,197,94,0.65)] animate-cr7-stadium">
            <div className="relative h-52 sm:h-60 w-full overflow-hidden">
              {!ronaldoImgFailed ? (
                <img
                  src={ronaldoSiuStadiumImg}
                  alt="Hiệu ứng ăn mừng Thần Thoại trên sân cỏ"
                  referrerPolicy="no-referrer"
                  onError={() => setRonaldoImgFailed(true)}
                  className="w-full h-full object-cover object-center scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-slate-950 to-green-950 flex items-center justify-center">
                  <span className="text-7xl">⚽</span>
                </div>
              )}

              <div
                className="pointer-events-none absolute -top-12 left-6 w-28 h-56 bg-gradient-to-b from-white/45 via-emerald-200/20 to-transparent blur-xl origin-top animate-floodlight"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -top-12 right-6 w-28 h-56 bg-gradient-to-b from-white/45 via-lime-200/20 to-transparent blur-xl origin-top animate-floodlight"
                style={{ animationDelay: '1.1s' }}
                aria-hidden="true"
              />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-2 border-emerald-400/80 animate-cr7-shockwave" />
                <div
                  className="w-40 h-40 rounded-full border-2 border-lime-300/70 animate-cr7-shockwave"
                  style={{ animationDelay: '0.55s' }}
                />
              </div>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-950 via-black/30 to-black/55" />

              <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-400 via-green-400 to-lime-300 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-lg">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>⚽ CHÚC MỪNG TRÚNG THẦN THOẠI 0,5%!</span>
                </div>
              </div>

              <div className="absolute bottom-2 inset-x-0 z-20 px-4 text-center">
                <div className="animate-cr7-siu-text font-black text-2xl sm:text-4xl italic tracking-widest bg-gradient-to-r from-emerald-300 via-white to-lime-300 bg-clip-text text-transparent drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] select-none whitespace-nowrap">
                  SIUUUUUUUUUUUU!!!
                </div>
              </div>
            </div>

            <div
              className="relative px-4 py-2.5 border-t-2 border-white/80 text-center overflow-hidden"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #15803d 0px, #15803d 28px, #16a34a 28px, #16a34a 56px)',
              }}
            >
              <p className="relative z-10 text-xs font-black text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                🏟️ Hiệu ứng bùng nổ sân cỏ xanh chúc mừng giải THẦN THOẠI XANH LÁ!
              </p>
            </div>
          </div>
        )}

        {/* RESULT SECTION AFTER SPIN */}
        {phase === 'result' && bestWonItem && (
          <div className="space-y-3">
            {wonItems.length === 1 ? (
              (() => {
                const tier = RARITY_MAP[bestWonItem.rarity];
                return (
                  <div
                    className={`p-5 rounded-2xl border-2 text-center space-y-2.5 bg-gradient-to-br ${tier.cardBg} ${tier.cardBorder} ${tier.glowClass}`}
                  >
                    <div className="flex items-center justify-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${tier.badgeClass}`}
                      >
                        {tier.label} · Tỷ lệ {tier.rateLabel}
                      </span>
                    </div>
                    <div className="text-5xl select-none">{bestWonItem.icon}</div>
                    <div className="space-y-1">
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        Đã cộng +{bestWonItem.xpBonus.toLocaleString()} XP vào cấp độ của bạn!
                      </div>
                      <h3 className="text-lg font-black">{bestWonItem.name}</h3>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed max-w-md mx-auto">
                        {bestWonItem.description}
                      </p>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <span className="text-xs font-black text-slate-700 dark:text-zinc-200">
                    Kết quả Quay Nhanh x5 Lượt:
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    Tổng cộng +{totalBatchXp.toLocaleString()} XP đã nhận!
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {wonItems.map((item, idx) => {
                    const tier = RARITY_MAP[item.rarity];
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border-2 text-center flex flex-col items-center justify-between gap-1 bg-gradient-to-b ${tier.cardBg} ${tier.cardBorder} ${tier.glowClass}`}
                      >
                        <span className={`text-[10px] font-black uppercase ${tier.textClass}`}>
                          {tier.label}
                        </span>
                        <span className="text-3xl my-0.5 select-none">{item.icon}</span>
                        <span className="text-[11px] font-extrabold line-clamp-2 leading-tight">
                          {item.name}
                        </span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{item.xpBonus.toLocaleString()} XP
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RECENT SPIN HISTORY STRIP */}
        {history.length > 0 && (
          <div className={`pt-3 border-t ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-2">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-emerald-500" />
                <span>Lịch sử quay gần đây ({history.length})</span>
              </span>
              <span className="text-[10px]">Tự động lưu XP vào cấp độ</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {history.slice(0, 10).map((rec) => {
                const tier = RARITY_MAP[rec.item.rarity];
                return (
                  <div
                    key={rec.id}
                    className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-[11px] flex items-center gap-1.5 bg-gradient-to-r ${tier.cardBg} ${tier.cardBorder}`}
                  >
                    <span>{rec.item.icon}</span>
                    <span className="font-bold max-w-[110px] truncate">{rec.item.name}</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{rec.item.xpBonus}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
