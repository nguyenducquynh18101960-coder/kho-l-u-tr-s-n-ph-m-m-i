import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Check,
  RotateCcw,
  Image as ImageIcon,
  User,
  Link2,
} from 'lucide-react';
import { PRESET_AVATARS, AvatarPreset, STORAGE_KEY_USER_AVATAR, GenderType } from '../../data/presetAvatars';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | undefined;
  onSaveAvatar: (newAvatarUrl: string) => void;
  userName: string;
  currentGender?: GenderType;
  onSaveGender?: (gender: GenderType) => void;
  isDark: boolean;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  onSaveAvatar,
  userName,
  currentGender = 'male',
  onSaveGender,
  isDark,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || '');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'unisex'>(
    currentGender === 'female' ? 'female' : currentGender === 'male' ? 'male' : 'all'
  );
  const [previewError, setPreviewError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local file upload via FileReader (base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 5MB để đảm bảo tải nhanh.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedAvatar(reader.result);
        setPreviewError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    setSelectedAvatar(customUrl.trim());
    setPreviewError(false);
    setCustomUrl('');
  };

  const handleSave = () => {
    onSaveAvatar(selectedAvatar);
    if (onSaveGender && (genderFilter === 'male' || genderFilter === 'female')) {
      onSaveGender(genderFilter);
    }
    onClose();
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar('');
    setPreviewError(false);
  };

  // Filter presets based on gender
  const filteredPresets = PRESET_AVATARS.filter((p) => {
    if (genderFilter === 'all') return true;
    if (genderFilter === 'male') return p.gender === 'male';
    if (genderFilter === 'female') return p.gender === 'female';
    if (genderFilter === 'unisex') return p.gender === 'unisex';
    return true;
  });

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg flex flex-col rounded-3xl shadow-2xl relative border overflow-hidden ${
          isDark
            ? 'bg-[#0f1420] text-slate-100 border-white/[0.1] shadow-black/80'
            : 'bg-white text-slate-900 border-slate-200/90 shadow-slate-300/60'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Thay Đổi Ảnh Đại Diện Theo Giới Tính</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Dễ kiểm soát &amp; phân loại ảnh đại diện nam sinh, nữ sinh hoặc tải ảnh riêng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Avatar Preview & Status */}
        <div
          className={`p-4 border-b flex items-center justify-between gap-3 ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              {selectedAvatar && !previewError ? (
                <img
                  src={selectedAvatar}
                  alt={userName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                  onError={() => setPreviewError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center text-xl font-bold uppercase shadow-sm">
                  {userName ? userName.slice(0, 2).toUpperCase() : '10'}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold flex items-center gap-1.5">
                <span>{userName}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {selectedAvatar ? 'Ảnh đại diện đang chọn' : 'Đang dùng chữ cái viết tắt'}
              </p>
            </div>
          </div>

          {selectedAvatar && (
            <button
              onClick={handleRemoveAvatar}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold px-2.5 py-1.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Gỡ ảnh</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-2 gap-1.5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kho Ảnh Đẹp ({filteredPresets.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('upload');
              fileInputRef.current?.click();
            }}
            className={`flex-1 py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải Ảnh Từ Máy</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Dán Link Ảnh</span>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Content Area */}
        <div className="p-4 max-h-72 overflow-y-auto space-y-3">
          {/* TAB 1: PRESET GALLERY WITH GENDER FILTER */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              {/* Gender Filter Chips for easy control */}
              <div className="flex items-center gap-1.5 pb-1 overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 shrink-0">
                  Lọc giới tính:
                </span>
                <button
                  type="button"
                  onClick={() => setGenderFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    genderFilter === 'all'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
                  }`}
                >
                  🌟 Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('male')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    genderFilter === 'male'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
                  }`}
                >
                  👦 Nam sinh
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('female')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    genderFilter === 'female'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
                  }`}
                >
                  👧 Nữ sinh
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('unisex')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    genderFilter === 'unisex'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
                  }`}
                >
                  🤖 Chibi &amp; Robot
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {filteredPresets.map((preset) => {
                  const isChosen = selectedAvatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(preset.url);
                        setPreviewError(false);
                      }}
                      className={`group relative rounded-2xl overflow-hidden border-2 aspect-square transition-all cursor-pointer ${
                        isChosen
                          ? 'border-emerald-500 scale-105 shadow-md ring-2 ring-emerald-400/40'
                          : 'border-transparent hover:border-emerald-300 dark:hover:border-zinc-700 opacity-85 hover:opacity-100 hover:scale-102'
                      }`}
                      title={preset.name}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {/* Gender icon indicator */}
                      <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                        {preset.gender === 'female' ? 'Nữ' : preset.gender === 'male' ? 'Nam' : '★'}
                      </span>
                      {isChosen && (
                        <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="text-center py-6 border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50">
              <Upload className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold mb-1">Tải ảnh đại diện từ thiết bị</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
                Hỗ trợ định dạng JPG, PNG, WebP (Tối đa 5MB)
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Chọn tệp từ máy
              </button>
            </div>
          )}

          {/* TAB 3: URL LINK */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-zinc-300">
                  Dán đường dẫn (URL) ảnh của bạn:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Xem trước
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Lưu ảnh đại diện
          </button>
        </div>
      </div>
    </div>
  );
};
