import React, { useState, useRef } from 'react';
import {
  X,
  Palette,
  Volume2,
  VolumeX,
  Check,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  Sparkles,
  Sliders,
  Play,
  HelpCircle,
} from 'lucide-react';
import {
  BackgroundTheme,
  PRESET_THEMES,
} from '../../types/theme';
import { speakThemeName } from '../../utils/speechTheme';

interface ThemeBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: BackgroundTheme;
  onSelectTheme: (theme: BackgroundTheme) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  isDark: boolean;
}

export const ThemeBackgroundModal: React.FC<ThemeBackgroundModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSelectTheme,
  voiceEnabled,
  onToggleVoice,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'color' | 'gradient' | 'image' | 'custom'>('all');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customImageName, setCustomImageName] = useState('Ảnh của tôi');
  const [customColor, setCustomColor] = useState('#e0f2fe');
  const [customColorName, setCustomColorName] = useState('Màu xanh pastel');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(activeTheme.overlayOpacity ?? 65);
  const [blurValue, setBlurValue] = useState<number>(activeTheme.blur ?? 2);
  const [announcedName, setAnnouncedName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle selecting a theme & announce immediately
  const handlePickTheme = (theme: BackgroundTheme) => {
    onSelectTheme(theme);
    setAnnouncedName(theme.callName);

    // Call name via speech
    speakThemeName(theme.callName, voiceEnabled);

    // Auto-clear notification after 2.5s
    setTimeout(() => {
      setAnnouncedName((prev) => (prev === theme.callName ? null : prev));
    }, 2800);
  };

  // Preview voice call for any theme without necessarily setting it as active
  const handleTestVoice = (e: React.MouseEvent, callName: string) => {
    e.stopPropagation();
    speakThemeName(callName, true);
  };

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh (PNG, JPG, WebP...)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const resultUrl = uploadEvent.target?.result as string;
      if (!resultUrl) return;

      const safeName = customImageName.trim() || 'Ảnh Tự Chọn';
      const newCustomTheme: BackgroundTheme = {
        id: `custom-img-${Date.now()}`,
        name: safeName,
        callName: safeName,
        type: 'image',
        value: resultUrl,
        tag: 'Tự chọn',
        description: 'Ảnh phông nền tự chọn tải lên từ thiết bị của bạn.',
        overlayOpacity: overlayOpacity,
        blur: blurValue,
      };

      handlePickTheme(newCustomTheme);
    };
    reader.readAsDataURL(file);
  };

  // Handle applying image URL
  const handleApplyUrlImage = () => {
    if (!customImageUrl.trim()) {
      alert('Vui lòng dán đường link ảnh hợp lệ!');
      return;
    }

    const safeName = customImageName.trim() || 'Ảnh Liên Kết Web';
    const newCustomTheme: BackgroundTheme = {
      id: `custom-url-${Date.now()}`,
      name: safeName,
      callName: safeName,
      type: 'image',
      value: customImageUrl.trim(),
      tag: 'Tự chọn',
      description: 'Ảnh phông nền liên kết từ Internet.',
      overlayOpacity: overlayOpacity,
      blur: blurValue,
    };

    handlePickTheme(newCustomTheme);
  };

  // Handle applying custom solid color
  const handleApplyCustomColor = () => {
    const safeName = customColorName.trim() || 'Màu Tự Chọn';
    const newCustomTheme: BackgroundTheme = {
      id: `custom-color-${Date.now()}`,
      name: safeName,
      callName: safeName,
      type: 'color',
      value: customColor,
      tag: 'Tự chọn',
      description: `Màu nền tùy chỉnh mã ${customColor}.`,
      overlayOpacity: 0,
      blur: 0,
    };

    handlePickTheme(newCustomTheme);
  };

  // Filter themes based on current tab
  const filteredThemes = PRESET_THEMES.filter((t) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'color') return t.type === 'color';
    if (activeTab === 'gradient') return t.type === 'gradient';
    if (activeTab === 'image') return t.type === 'image';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold sm:text-lg">Tùy Biến Phông Nền Max10</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Gọi tên tức thì
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Đổi màu hoặc cài ảnh tùy thích • Tự động đọc tên ngay khi bấm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice Announcement Toggle */}
            <button
              onClick={onToggleVoice}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                voiceEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700'
              }`}
              title={voiceEnabled ? 'Giọng đọc tên đang BẬT' : 'Giọng đọc tên đang TẮT'}
            >
              {voiceEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">Gọi tên: Bật</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-zinc-400" />
                  <span className="hidden sm:inline">Gọi tên: Tắt</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Theme Quick Info Bar */}
        <div
          className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
            isDark ? 'border-zinc-800/80 bg-zinc-850/50' : 'border-slate-100 bg-emerald-50/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="text-slate-500 dark:text-zinc-400">Phông nền hiện tại:</div>
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-100">
              <span className="inline-block w-4 h-4 rounded-full border border-black/10 shadow-2xs overflow-hidden"
                style={{
                  background:
                    activeTheme.type === 'image'
                      ? `url(${activeTheme.value}) center/cover`
                      : activeTheme.value,
                }}
              />
              <span>{activeTheme.name}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
                Tên gọi: &ldquo;{activeTheme.callName}&rdquo;
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleTestVoice(e, activeTheme.callName)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-2xs"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Nghe gọi tên</span>
            </button>

            <button
              onClick={() => handlePickTheme(PRESET_THEMES[0])}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
                isDark
                  ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
              title="Về phông nền trắng ban đầu"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Về trắng tinh khôi</span>
            </button>
          </div>
        </div>

        {/* Floating live voice announcement notification */}
        {announcedName && (
          <div className="mx-5 mt-3 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-2 duration-200 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-white/20">
                <Volume2 className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <span>Đã kích hoạt &amp; gọi tên: </span>
                <span className="underline font-bold text-amber-200 ml-1 text-sm">
                  &ldquo;{announcedName}&rdquo;
                </span>
              </div>
            </div>
            <span className="text-[11px] opacity-80">Chạm bất kỳ mẫu nào để đổi tiếp</span>
          </div>
        )}

        {/* Category Navigation Tabs */}
        <div className="px-5 pt-3 flex items-center gap-1.5 overflow-x-auto shrink-0 pb-1 scrollbar-none">
          {[
            { id: 'all' as const, label: 'Tất cả' },
            { id: 'color' as const, label: 'Màu êm dịu' },
            { id: 'gradient' as const, label: 'Dải màu Gradient' },
            { id: 'image' as const, label: 'Ảnh học tập & Chill' },
            { id: 'custom' as const, label: 'Tùy thích (Tải ảnh / Mã màu)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isDark
                  ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body: Scrollable themes grid & custom controls */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Custom Section */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              {/* Box 1: Tải ảnh từ máy */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-zinc-850 border-zinc-750' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  <Upload className="w-4 h-4" />
                  <span>Cách 1: Tải ảnh bất kỳ từ máy tính / điện thoại</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
                  Chọn ảnh phong cảnh, thần tượng, góc học tập hoặc ảnh kỉ niệm bạn thích nhất.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                      Đặt tên gọi cho ảnh (để AI phát âm):
                    </label>
                    <input
                      type="text"
                      value={customImageName}
                      onChange={(e) => setCustomImageName(e.target.value)}
                      placeholder="VD: Góc học tập của tôi, Thần tượng..."
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-hidden transition-colors ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-emerald-500'
                          : 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="flex items-end">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Chọn tệp ảnh &amp; Áp dụng ngay</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Box 2: Dán link URL ảnh */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-zinc-850 border-zinc-750' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-bold text-sm text-teal-600 dark:text-teal-400">
                  <LinkIcon className="w-4 h-4" />
                  <span>Cách 2: Dán đường link ảnh trên mạng (URL)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://example.com/hinh-anh.jpg"
                    className={`sm:col-span-2 px-3 py-2 rounded-xl text-xs border outline-hidden transition-colors ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-teal-500'
                        : 'bg-white border-slate-300 text-slate-800 focus:border-teal-500'
                    }`}
                  />
                  <button
                    onClick={handleApplyUrlImage}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Áp dụng link ảnh</span>
                  </button>
                </div>
              </div>

              {/* Box 3: Chọn màu tùy thích bằng Color Picker */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-zinc-850 border-zinc-750' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-bold text-sm text-indigo-600 dark:text-indigo-400">
                  <Palette className="w-4 h-4" />
                  <span>Cách 3: Tự pha màu nền theo ý thích</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-black/20 p-0.5 bg-transparent"
                  />
                  <div className="flex-1 min-w-[160px]">
                    <input
                      type="text"
                      value={customColorName}
                      onChange={(e) => setCustomColorName(e.target.value)}
                      placeholder="Đặt tên màu (VD: Xanh ngọc bích)"
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-hidden transition-colors ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-indigo-500'
                          : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  <button
                    onClick={handleApplyCustomColor}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <span>Lưu màu &amp; Gọi tên</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preset Theme Grid (Visible in tabs: all, color, gradient, image) */}
          {activeTab !== 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredThemes.map((theme) => {
                const isSelected = activeTheme.id === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => handlePickTheme(theme)}
                    className={`group relative p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/30'
                        : isDark
                        ? 'border-zinc-800 bg-zinc-850 hover:border-zinc-700 hover:bg-zinc-800'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Visual Preview Box */}
                    <div
                      className="w-full h-24 rounded-xl border border-black/10 overflow-hidden relative mb-2.5 flex items-end p-2 transition-transform group-hover:scale-[1.01]"
                      style={{
                        background:
                          theme.type === 'image'
                            ? `url(${theme.value}) center/cover no-repeat`
                            : theme.value,
                      }}
                    >
                      {/* Sub-pill type tag */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                        {theme.tag}
                      </span>

                      {/* Checkmark badge if selected */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-white shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Content & Name */}
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {theme.name}
                        </h3>

                        {/* Direct Speaker button to pronounce this theme */}
                        <button
                          type="button"
                          onClick={(e) => handleTestVoice(e, theme.callName)}
                          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                            isDark
                              ? 'hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400'
                              : 'hover:bg-slate-100 text-slate-400 hover:text-emerald-600'
                          }`}
                          title={`Nghe phát âm: "${theme.callName}"`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                          📢 Gọi: &ldquo;{theme.callName}&rdquo;
                        </span>
                      </div>

                      {theme.description && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {theme.description}
                        </p>
                      )}
                    </div>

                    {/* Select Action Button */}
                    <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-zinc-400'}`}>
                        {isSelected ? 'Đang kích hoạt' : 'Chạm để chọn'}
                      </span>
                      <span className="text-[10px] opacity-70 group-hover:translate-x-0.5 transition-transform">
                        {isSelected ? '✓ Đã chọn' : 'Áp dụng →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Visual Tuning Controls for Image backgrounds */}
          {activeTheme.type === 'image' && (
            <div
              className={`p-4 rounded-2xl border ${
                isDark ? 'bg-zinc-850 border-zinc-750' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-3 font-bold text-xs text-slate-800 dark:text-zinc-200">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <span>Điều Chỉnh Độ Rõ Chữ &amp; Làm Dịu Nền (Cho Ảnh Nền)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Opacity slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-zinc-400">Độ phủ làm dịu chữ:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{overlayOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    step="5"
                    value={overlayOpacity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setOverlayOpacity(val);
                      onSelectTheme({
                        ...activeTheme,
                        overlayOpacity: val,
                      });
                    }}
                    className="w-full accent-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">Tăng lên để chữ bài tập, chat đọc rõ và chống chói hơn.</span>
                </div>

                {/* Blur slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-zinc-400">Làm mờ nền nghệ thuật (Blur):</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{blurValue}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={blurValue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setBlurValue(val);
                      onSelectTheme({
                        ...activeTheme,
                        blur: val,
                      });
                    }}
                    className="w-full accent-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">Làm mờ nhẹ để mắt tập trung 100% vào bài học.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Phông nền lưu tự động trên trình duyệt của bạn</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Hoàn Tất &amp; Tiếp Tục Học
          </button>
        </div>
      </div>
    </div>
  );
};
