import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Sparkles,
  Volume2,
  Check,
  Award,
  GraduationCap,
  Smile,
  Heart,
  Camera,
  Trophy,
  Flame,
} from 'lucide-react';
import { GradeLevel } from '../../types';
import { speakUserGreeting } from '../../utils/speechTheme';
import { PRESET_AVATARS, GenderType, STORAGE_KEY_USER_GENDER, STORAGE_KEY_USER_AVATAR } from '../../data/presetAvatars';
import { loadStudentAchievements } from '../../data/initialAchievements';

export function getUserInitials(name: string): string {
  if (!name || !name.trim()) return '10';
  const clean = name.trim();
  const words = clean.split(/\s+/);
  if (words.length === 1) {
    return clean.slice(0, 2).toUpperCase();
  }
  const first = words[0][0];
  const last = words[words.length - 1][0];
  return (first + last).toUpperCase();
}

interface UserNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSaveName: (newName: string) => void;
  currentGrade: GradeLevel;
  onSelectGrade?: (grade: GradeLevel) => void;
  currentGender?: GenderType;
  onSaveGender?: (gender: GenderType) => void;
  currentAvatar?: string;
  onSaveAvatar?: (newAvatar: string) => void;
  currentDob?: string;
  onSaveDob?: (dob: string) => void;
  onOpenBirthdaySurprise?: () => void;
  isDark: boolean;
  isFirstTime?: boolean;
  onOpenAchievements?: () => void;
}

const QUICK_SUGGESTIONS_MALE = [
  'Đức Huy',
  'Bảo Nam',
  'Hải Đăng',
  'Gia Huy',
  'Thủ khoa Toán nam',
];

const QUICK_SUGGESTIONS_FEMALE = [
  'Minh Anh',
  'Bảo Châu',
  'Phương Linh',
  'Khánh Vy',
  'Thủ khoa Nữ sinh',
];

export const UserNameModal: React.FC<UserNameModalProps> = ({
  isOpen,
  onClose,
  currentName,
  onSaveName,
  currentGrade,
  onSelectGrade,
  currentGender = 'male',
  onSaveGender,
  currentAvatar = '',
  onSaveAvatar,
  currentDob = '',
  onSaveDob,
  onOpenBirthdaySurprise,
  isDark,
  isFirstTime = false,
  onOpenAchievements,
}) => {
  const [name, setName] = useState(currentName || '');
  const [gender, setGender] = useState<GenderType>(currentGender || 'male');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || '');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(currentGrade || 'Lớp 9');
  const [dob, setDob] = useState<string>(() => {
    return currentDob || (typeof window !== 'undefined' ? localStorage.getItem('max10_user_dob_v1') || '2010-09-15' : '2010-09-15');
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [studentStats, setStudentStats] = useState(() => loadStudentAchievements());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName || '');
      setGender(currentGender || 'male');
      setSelectedAvatar(currentAvatar || '');
      setSelectedGrade(currentGrade || 'Lớp 9');
      if (currentDob) setDob(currentDob);
      else {
        const savedDob = localStorage.getItem('max10_user_dob_v1');
        if (savedDob) setDob(savedDob);
      }
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 150);
    }
  }, [isOpen, currentName, currentGender, currentAvatar, currentGrade, currentDob]);

  // When gender changes, automatically suggest matching avatar if none selected or if switching
  const handleGenderChange = (newGender: GenderType) => {
    setGender(newGender);
    const matchingAvatars = PRESET_AVATARS.filter(
      (a) => a.gender === newGender || (newGender === 'other' && a.gender === 'unisex')
    );
    if (matchingAvatars.length > 0) {
      // Pick first matching preset
      setSelectedAvatar(matchingAvatars[0].url);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = name.trim() || 'Bạn học';
    onSaveName(finalName);

    if (onSaveGender) {
      onSaveGender(gender);
    }
    if (onSaveAvatar && selectedAvatar) {
      onSaveAvatar(selectedAvatar);
    }
    if (onSelectGrade && selectedGrade !== currentGrade) {
      onSelectGrade(selectedGrade);
    }
    if (onSaveDob && dob) {
      onSaveDob(dob);
      try {
        localStorage.setItem('max10_user_dob_v1', dob);
      } catch (e) {}
    }
    // Speak greeting upon saving
    speakUserGreeting(finalName, true);
    onClose();
  };

  const handleTestVoice = () => {
    const testName = name.trim() || 'bạn';
    setIsSpeaking(true);
    speakUserGreeting(testName, true);
    setTimeout(() => setIsSpeaking(false), 2500);
  };

  const grades: GradeLevel[] = [
    'Lớp 6',
    'Lớp 7',
    'Lớp 8',
    'Lớp 9',
    'Lớp 10',
    'Lớp 11',
    'Lớp 12',
  ];

  // Avatars filtered by selected gender
  const currentCategoryAvatars = PRESET_AVATARS.filter(
    (a) => a.gender === gender || (gender === 'other' && a.gender === 'unisex')
  );

  const activeSuggestions = gender === 'female' ? QUICK_SUGGESTIONS_FEMALE : QUICK_SUGGESTIONS_MALE;

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative transition-all border max-h-[92vh] overflow-y-auto ${
          isDark
            ? 'bg-[#0f1420] text-slate-100 border-white/[0.1] shadow-black/80'
            : 'bg-white text-slate-900 border-slate-200/90 shadow-slate-300/60'
        }`}
      >
        {/* Close Button */}
        {!isFirstTime && (
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-200/60 dark:border-white/[0.08]">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 shadow-md shrink-0">
              {selectedAvatar ? (
                <img
                  src={selectedAvatar}
                  alt={name || 'Avatar'}
                  className="w-full h-full object-cover rounded-[14px]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-[14px] bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                  {getUserInitials(name || currentName || '10')}
                </div>
              )}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs text-white ${
                gender === 'female' ? 'bg-rose-500' : gender === 'male' ? 'bg-blue-600' : 'bg-emerald-500'
              }`}
            >
              {gender === 'female' ? '♀' : gender === 'male' ? '♂' : '★'}
            </span>
          </div>

          <div>
            <h3 className="font-extrabold text-base sm:text-lg leading-tight">
              {isFirstTime ? 'Chào mừng bạn đến với Max10!' : 'Thiết lập Hồ sơ & Giới tính'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Chọn giới tính để tự động kiểm soát &amp; đồng bộ ảnh đại diện phù hợp
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USER REQUIREMENT: HỎI CẢ GIỚI TÍNH NỮA ĐỂ CÓ ẢNH ĐẠI DIỆN DỄ KIỂM SOÁT */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
              Giới tính của bạn (để kiểm soát ảnh đại diện chuẩn xác):
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleGenderChange('male')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 ring-2 ring-blue-500/30'
                    : isDark
                    ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>👦</span>
                <span>Học sinh Nam</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenderChange('female')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30 ring-2 ring-rose-500/30'
                    : isDark
                    ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>👧</span>
                <span>Học sinh Nữ</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenderChange('other')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  gender === 'other'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                    : isDark
                    ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>✨</span>
                <span>Chibi / Robot</span>
              </button>
            </div>
          </div>

          {/* AVATAR SELECTION BY GENDER */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  Chọn ảnh đại diện {gender === 'female' ? 'Nữ sinh' : gender === 'male' ? 'Nam sinh' : 'Chibi'}:
                </span>
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Bấm vào ảnh để chọn ngay
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-white/[0.08]">
              {currentCategoryAvatars.map((preset) => {
                const isSelected = selectedAvatar === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedAvatar(preset.url)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40 scale-105 shadow-md'
                        : 'border-transparent hover:border-slate-300 dark:hover:border-zinc-600 hover:scale-102'
                    }`}
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
              Tên hoặc biệt danh của bạn:
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={gender === 'female' ? 'Ví dụ: Phương Linh 9D, Khánh Vy, Bảo Châu...' : 'Ví dụ: Đức Huy 9D4, Minh Anh, Bảo Nam...'}
                maxLength={40}
                className={`w-full px-4 py-2.5 rounded-2xl text-sm font-medium border outline-none transition-all pl-10 pr-20 ${
                  isDark
                    ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                }`}
              />
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

              {/* Pronounce preview button */}
              <button
                type="button"
                onClick={handleTestVoice}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : isDark
                    ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
                title="Nghe thử AI gọi tên bạn"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Nghe</span>
              </button>
            </div>
          </div>

          {/* Quick suggestions chips */}
          <div>
            <span className="block text-[11px] font-medium text-slate-400 dark:text-zinc-400 mb-1.5">
              Gợi ý tên nhanh theo giới tính:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setName(item);
                    inputRef.current?.focus();
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                    name === item
                      ? 'bg-emerald-500 text-white border-emerald-600 font-semibold shadow-2xs'
                      : isDark
                      ? 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* USER REQUIREMENT: HỎI NGÀY THÁNG NĂM SINH ĐỂ CÓ BẤT NGỜ CHO BẠN HỌC & GIÁO VIÊN */}
          <div className="p-3.5 rounded-2xl border bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="text-base">🎂</span>
                <span>Ngày tháng năm sinh của bạn:</span>
              </label>

              {onOpenBirthdaySurprise && (
                <button
                  type="button"
                  onClick={() => {
                    if (onSaveDob && dob) onSaveDob(dob);
                    onOpenBirthdaySurprise();
                  }}
                  className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                  title="Bấm để xem thử điều bất ngờ sinh nhật từ Max10"
                >
                  <span>🎁 Xem bất ngờ sinh nhật</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border outline-none transition-all ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-white focus:border-amber-500'
                    : 'bg-white border-amber-300 text-slate-900 focus:border-amber-500 shadow-2xs'
                }`}
              />
            </div>

            <p className="text-[11px] text-amber-700 dark:text-amber-300/90 mt-2 font-medium flex items-center gap-1">
              <span>🎉</span>
              <span>Đúng ngày sinh nhật, bạn học và thầy cô sẽ nhận được thiệp chúc mừng, quà tặng +500 XP &amp; pháo hoa rực rỡ từ Max10 AI!</span>
            </p>
          </div>

          {/* Grade selection */}
          {onSelectGrade && (
            <div className="pt-1">
              <details className="group">
                <summary className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 cursor-pointer flex items-center gap-1.5 hover:text-emerald-600 transition-colors list-none">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Tùy chọn khối lớp (mặc định Lớp 9, không bắt buộc)</span>
                  <span className="text-[10px] ml-auto text-emerald-600 font-bold group-open:hidden">
                    + Đổi lớp
                  </span>
                </summary>
                <div className="flex flex-wrap gap-1.5 mt-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
                  {grades.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGrade(g)}
                      className={`py-1 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                        selectedGrade === g
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-xs font-bold'
                          : isDark
                          ? 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* STUDENT ACHIEVEMENTS & EARNED BADGES SHOWCASE */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark
                ? 'bg-amber-500/5 border-amber-500/20 text-zinc-200'
                : 'bg-amber-50/70 border-amber-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 font-black text-xs text-amber-700 dark:text-amber-400">
                <Trophy className="w-3.5 h-3.5" />
                <span>Tủ Trưng Bày Huy Hiệu &amp; Chuỗi Ngày</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-600 dark:text-amber-400">
                <Flame className="w-3 h-3 fill-current" />
                <span>Chuỗi {studentStats.streak.currentStreak} ngày</span>
              </div>
            </div>

            {/* Earned badges row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2.5">
              {studentStats.badges
                .filter((b) => b.isUnlocked)
                .slice(0, 3)
                .map((b) => (
                  <div
                    key={b.id}
                    className={`p-2 rounded-xl border flex items-center gap-2 ${
                      isDark
                        ? 'bg-zinc-900/80 border-white/10'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <span className="text-xl shrink-0">{b.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold truncate leading-tight text-slate-900 dark:text-white">
                        {b.title}
                      </p>
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                        +{b.xpReward} XP
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Quick button to open full achievements view */}
            {onOpenAchievements && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAchievements();
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-amber-500/30"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Mở toàn bộ Bảng Thành Tích &amp; Nhiệm Vụ ({studentStats.badges.filter((b) => b.isUnlocked).length}/{studentStats.badges.length})</span>
              </button>
            )}
          </div>

          {/* Perks info box */}
          <div
            className={`p-3 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              isDark
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}
          >
            <Smile className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              Giới tính &amp; Ảnh đại diện sẽ được lưu trữ đồng bộ trên thiết bị của bạn, giúp bạn bè và nhóm học dễ nhận diện và tương tác!
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            {!isFirstTime && (
              <button
                type="button"
                onClick={onClose}
                className={`w-1/3 py-2.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Hủy
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-1.5 transition-all bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isFirstTime ? 'Bắt đầu học ngay 🚀' : 'Lưu hồ sơ & Ảnh đại diện'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
