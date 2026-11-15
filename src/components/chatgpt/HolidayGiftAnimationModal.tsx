import React, { useState, useEffect, useMemo } from 'react';
import { X, Gift, Sparkles, Flower2, Check, Heart } from 'lucide-react';
import { celebrateMilestone, launchGoldenStarBurst } from '../../utils/confettiFireworks';
import { soundEffects } from '../../utils/soundEffects';
import { loadStudentAchievements, saveStudentAchievements } from '../../data/initialAchievements';
import { calculateLevel } from '../../types/achievements';

export type HolidayId = '08_03' | '20_10' | '20_11';

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
}

export interface HolidayGiftItem {
  id: string;
  name: string;
  icon: string;
  type: 'flower' | 'item';
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
  '08_03': {
    id: '08_03',
    dateLabel: '08 / 03',
    title: 'Chúc Mừng Ngày Quốc Tế Phụ Nữ 8/3',
    subtitle: 'Tôn vinh các Cô giáo, Nữ sinh và Một nửa yêu thương của thế giới',
    greetingTeacher: 'Kính chúc Cô luôn rạng rỡ, nhiệt huyết và truyền thật nhiều cảm hứng học tập tới các em học sinh!',
    greetingStudent: 'Chúc bạn luôn tự tin, tỏa sáng, học thật giỏi và chinh phục mọi mục tiêu Điểm 10!',
    petals: ['🌹', '🌸', '🌷', '🌺', '💐', '✨'],
    accentGradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    badgeText: 'Quốc tế Phụ nữ 8/3',
  },
  '20_10': {
    id: '20_10',
    dateLabel: '20 / 10',
    title: 'Chúc Mừng Ngày Phụ Nữ Việt Nam 20/10',
    subtitle: 'Gửi ngàn đóa hoa tươi thắm tri ân Cô giáo & các bạn Nữ sinh Việt Nam',
    greetingTeacher: 'Kính chúc Cô thật nhiều sức khỏe, niềm vui và hạnh phúc bên gia đình cùng những chuyến đò tri thức!',
    greetingStudent: 'Chúc bạn một ngày 20/10 thật rạng ngời, ngập tràn hoa tươi và bứt phá thành tích học tập!',
    petals: ['💐', '🌺', '🌸', '🌹', '💮', '✨'],
    accentGradient: 'from-pink-600 via-rose-500 to-amber-500',
    badgeText: 'Phụ nữ Việt Nam 20/10',
  },
  '20_11': {
    id: '20_11',
    dateLabel: '20 / 11',
    title: 'Chúc Mừng Ngày Nhà Giáo Việt Nam 20/11',
    subtitle: 'Tri ân sâu sắc tới các Thầy giáo, Cô giáo — Những người lái đò thầm lặng',
    greetingTeacher: 'Kính chúc Thầy/Cô luôn dồi dào sức khỏe, vững tay chèo đưa bao thế hệ học sinh cập bến tri thức!',
    greetingStudent: 'Hãy gửi những lời tri ân đẹp nhất tới Thầy Cô và mở quà may mắn nhân ngày Nhà giáo Việt Nam 20/11!',
    petals: ['🌻', '🌹', '💐', '🌼', '📚', '✨'],
    accentGradient: 'from-amber-500 via-orange-500 to-rose-500',
    badgeText: 'Nhà giáo Việt Nam 20/11',
  },
};

export const HOLIDAY_GIFT_POOL: HolidayGiftItem[] = [
  {
    id: 'gift-rose-bouquet',
    name: 'Bó Hoa Hồng Nhung Tươi Thắm',
    icon: '💐',
    type: 'flower',
    xpBonus: 250,
    description: 'Biểu tượng của lòng biết ơn, sự trân trọng và tình cảm ấm áp nhất.',
  },
  {
    id: 'gift-sunflower-bouquet',
    name: 'Bó Hoa Hướng Dương Rực Rỡ',
    icon: '🌻',
    type: 'flower',
    xpBonus: 250,
    description: 'Luôn hướng về ánh mặt trời tri thức và tỏa sáng niềm tin.',
  },
  {
    id: 'gift-golden-pen',
    name: 'Bút Ký Điểm 10 Mạ Vàng',
    icon: '🖋️',
    type: 'item',
    xpBonus: 300,
    description: 'Vật phẩm may mắn đồng hành trong những kỳ thi và bài giảng xuất sắc.',
  },
  {
    id: 'gift-tulip-basket',
    name: 'Giỏ Hoa Tulip Sắc Xuân',
    icon: '🌷',
    type: 'flower',
    xpBonus: 220,
    description: 'Đóa hoa tươi tắn mang lại năng lượng tích cực cả ngày dài.',
  },
  {
    id: 'gift-honor-medal',
    name: 'Huy Hiệu Tri Ân & Tỏa Sáng',
    icon: '🏅',
    type: 'item',
    xpBonus: 350,
    description: 'Danh hiệu kỷ niệm đặc biệt chỉ xuất hiện vào các ngày lễ tôn vinh.',
  },
  {
    id: 'gift-notebook-charm',
    name: 'Sổ Tay Bí Kíp Tri Thức',
    icon: '📔',
    type: 'item',
    xpBonus: 200,
    description: 'Cuốn sổ ghi dấu những kỷ niệm đẹp giữa Thầy Cô và Học trò.',
  },
];

const STORAGE_KEY_RECEIVED_GIFTS = 'max10_holiday_gifts_received_v1';

export function detectActiveHoliday(date: Date = new Date()): HolidayConfig | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 3 && day === 8) return HOLIDAY_CONFIGS['08_03'];
  if (month === 10 && day === 20) return HOLIDAY_CONFIGS['20_10'];
  if (month === 11 && day === 20) return HOLIDAY_CONFIGS['20_11'];
  return null;
}

export function getNearestHoliday(date: Date = new Date()): HolidayConfig {
  const active = detectActiveHoliday(date);
  if (active) return active;
  const month = date.getMonth() + 1;
  if (month <= 3) return HOLIDAY_CONFIGS['08_03'];
  if (month <= 10) return HOLIDAY_CONFIGS['20_10'];
  return HOLIDAY_CONFIGS['20_11'];
}

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
  isDark: boolean;
  initialHolidayId?: HolidayId;
  isExactHolidayToday?: boolean;
}

export const HolidayGiftAnimationModal: React.FC<HolidayGiftAnimationModalProps> = ({
  isOpen,
  onClose,
  userName = 'Bạn',
  isTeacher = false,
  isDark,
  initialHolidayId,
  isExactHolidayToday = false,
}) => {
  const [selectedHolidayId, setSelectedHolidayId] = useState<HolidayId>(
    () => initialHolidayId || getNearestHoliday().id
  );
  const [phase, setPhase] = useState<'ready' | 'opening' | 'opened'>('ready');
  const [drawnGift, setDrawnGift] = useState<HolidayGiftItem | null>(null);
  const [giftHistory, setGiftHistory] = useState<ReceivedHolidayGiftRecord[]>(() =>
    loadReceivedHolidayGifts()
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedHolidayId(initialHolidayId || getNearestHoliday().id);
      setPhase('ready');
      setDrawnGift(null);
      setGiftHistory(loadReceivedHolidayGifts());
    }
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

  if (!isOpen) return null;

  const handleOpenGiftBox = () => {
    if (phase === 'opening') return;
    setPhase('opening');
    soundEffects.playCorrect();

    setTimeout(() => {
      const randomGift =
        HOLIDAY_GIFT_POOL[Math.floor(Math.random() * HOLIDAY_GIFT_POOL.length)];
      setDrawnGift(randomGift);
      setPhase('opened');

      celebrateMilestone();
      setTimeout(() => launchGoldenStarBurst(), 320);
      soundEffects.playBadgeUnlocked();

      // Award XP & store gift in collection
      try {
        const stats = loadStudentAchievements();
        const newTotal = stats.totalXp + randomGift.xpBonus;
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

        const newRecord: ReceivedHolidayGiftRecord = {
          id: `hgift-${Date.now()}`,
          holidayId: holiday.id,
          holidayTitle: holiday.badgeText,
          gift: randomGift,
          receivedAt: new Date().toLocaleDateString('vi-VN'),
        };
        const updatedHistory = [newRecord, ...giftHistory].slice(0, 12);
        setGiftHistory(updatedHistory);
        localStorage.setItem(STORAGE_KEY_RECEIVED_GIFTS, JSON.stringify(updatedHistory));
      } catch (e) {}
    }, 850);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-hidden">
      {/* Falling Flowers & Petals Animation Overlay */}
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

      {/* Main Celebration Card */}
      <div
        className={`relative z-10 w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#121624] border-white/15 text-slate-100'
            : 'bg-white border-rose-200 text-slate-900'
        }`}
      >
        {/* Top Gradient Banner */}
        <div className={`p-5 sm:p-6 bg-gradient-to-r ${holiday.accentGradient} text-white relative`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 hover:bg-black/35 text-white transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ quà lễ"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-xs font-bold opacity-95 mb-1.5">
            <Flower2 className="w-4 h-4" />
            <span>{holiday.dateLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{isExactHolidayToday ? 'Sự kiện hôm nay' : 'Quà tặng Tri ân Ngày Lễ'}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black leading-snug pr-8">{holiday.title}</h2>
          <p className="text-xs text-white/90 mt-1 leading-relaxed">{holiday.subtitle}</p>

          {/* Holiday Switcher (8/3 - 20/10 - 20/11) */}
          <div className="mt-4 flex items-center gap-1.5 p-1 rounded-xl bg-black/20">
            {(['08_03', '20_10', '20_11'] as HolidayId[]).map((hId) => {
              const cfg = HOLIDAY_CONFIGS[hId];
              const active = selectedHolidayId === hId;
              return (
                <button
                  key={hId}
                  type="button"
                  onClick={() => {
                    setSelectedHolidayId(hId);
                    setPhase('ready');
                    setDrawnGift(null);
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
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-center">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
            Kính gửi <strong>{isTeacher ? `Thầy/Cô ${userName}` : userName}</strong>:{' '}
            {isTeacher ? holiday.greetingTeacher : holiday.greetingStudent}
          </p>

          {/* Gift Box Stage */}
          {phase !== 'opened' ? (
            <div className="py-4 flex flex-col items-center justify-center space-y-4">
              <button
                type="button"
                onClick={handleOpenGiftBox}
                disabled={phase === 'opening'}
                className="group relative w-32 h-32 rounded-3xl bg-gradient-to-br from-rose-500/15 via-amber-500/15 to-pink-500/15 border-2 border-dashed border-rose-400/60 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <span className="text-6xl animate-holiday-gift select-none">
                  {phase === 'opening' ? '💐' : '🎁'}
                </span>
                <Sparkles className="w-5 h-5 text-amber-500 absolute -top-2 -right-2" />
              </button>

              <button
                type="button"
                onClick={handleOpenGiftBox}
                disabled={phase === 'opening'}
                className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${holiday.accentGradient} text-white font-black text-xs sm:text-sm shadow-lg hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70`}
              >
                <Gift className="w-4 h-4" />
                <span>
                  {phase === 'opening'
                    ? 'Đang gói hoa & mở hộp quà...'
                    : 'Mở Hộp Quà & Nhận Hoa Ngẫu Nhiên'}
                </span>
              </button>
            </div>
          ) : (
            drawnGift && (
              <div
                className={`p-5 rounded-2xl border space-y-3 animate-in zoom-in-95 duration-300 ${
                  isDark
                    ? 'bg-gradient-to-br from-rose-950/35 to-amber-950/25 border-rose-500/40'
                    : 'bg-gradient-to-br from-rose-50 to-amber-50 border-rose-200'
                }`}
              >
                <div className="text-6xl select-none">{drawnGift.icon}</div>
                <div className="space-y-1">
                  <div className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400">
                    {drawnGift.type === 'flower' ? 'Hoa Tươi Tri Ân' : 'Quà Tặng Kỷ Niệm'} · +{drawnGift.xpBonus} XP
                  </div>
                  <h3 className="text-lg font-black">{drawnGift.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                    {drawnGift.description}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhase('ready');
                      setDrawnGift(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-rose-400/50 text-rose-600 dark:text-rose-300 text-xs font-extrabold hover:bg-rose-500/10 cursor-pointer"
                  >
                    Tặng / Rút thêm quà khác
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Nhận Quà (+{drawnGift.xpBonus} XP)</span>
                  </button>
                </div>
              </div>
            )
          )}

          {/* Received Gifts Collection */}
          {giftHistory.length > 0 && (
            <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 text-left">
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Bộ sưu tập hoa & quà lễ đã nhận ({giftHistory.length})</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {giftHistory.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] shrink-0 flex items-center gap-1.5 ${
                      isDark ? 'bg-zinc-900 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                    title={`${item.gift.name} (${item.holidayTitle} - ${item.receivedAt})`}
                  >
                    <span className="text-base">{item.gift.icon}</span>
                    <span className="font-bold max-w-[110px] truncate">{item.gift.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
