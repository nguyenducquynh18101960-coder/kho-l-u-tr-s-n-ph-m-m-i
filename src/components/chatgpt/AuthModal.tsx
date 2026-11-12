import React, { useState } from 'react';
import {
  X,
  User,
  LogOut,
  Sparkles,
  GraduationCap,
  School,
  Check,
  Camera,
  Crown,
  Lock,
} from 'lucide-react';
import {
  UserAccount,
  AuthProvider,
  STORAGE_KEY_AUTH_USER,
  STORAGE_KEY_USER_PRESENCE,
  ADMIN_NAME,
  ADMIN_EMAIL,
  ADMIN_DEFAULT_PIN,
  ADMIN_ID,
  MASTER_SECURITY_CODE,
} from '../../types/auth';
import { UserPresenceStatus } from '../../types';
import { PRESENCE_STATUS_CONFIG } from './UserAvatarWithStatus';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLoginSuccess: (user: UserAccount) => void;
  onLogout: () => void;
  isDark: boolean;
  defaultEmail?: string;
  onOpenAvatarModal?: () => void;
  onPresenceStatusChange?: (status: UserPresenceStatus) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  isDark,
  onOpenAvatarModal,
  onPresenceStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState<'guest' | 'admin'>('guest');

  // Form states
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('Mạc Khánh Duy');
  const [adminPin, setAdminPin] = useState<string>('');
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(null);
  const [notification, setNotification] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [authGender, setAuthGender] = useState<'male' | 'female'>('male');
  const [authDob, setAuthDob] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('max10_user_dob_v1') || '2010-09-15' : '2010-09-15';
  });
  const [currentPresence, setCurrentPresence] = useState<UserPresenceStatus>(() => {
    return (currentUser?.presenceStatus as UserPresenceStatus) || 'online';
  });

  if (!isOpen) return null;

  // Quản trị viên Mạc Khánh Duy login (Chỉ Mạc Khánh Duy mới xác thực được với PIN / Mã bảo mật 24122012@duy)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAdminName = adminName.trim().toLowerCase();
    const isDuy = cleanAdminName === 'mạc khánh duy' || cleanAdminName === 'mac khanh duy';

    // Anti-hack payload check
    const pinVal = adminPin.trim();
    const isMaliciousPayload =
      pinVal.includes('<script') ||
      pinVal.includes('javascript:') ||
      pinVal.includes('DROP') ||
      pinVal.includes('UNION SELECT') ||
      pinVal.includes('--') ||
      pinVal.includes("' OR '");

    if (isMaliciousPayload || failedAttempts >= 4) {
      // Trigger automatic account ban and deletion!
      localStorage.setItem('max10_permanently_banned', 'true');
      localStorage.setItem('max10_ban_reason', 'Phát hiện hành vi hack / chèn mã độc vào form đăng nhập quản trị!');
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
      fetch('/api/security/report-hack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_login_hack_attempt',
          payload: pinVal,
          targetUser: currentUser?.id || 'unauthenticated',
        }),
      }).catch(() => {});
      window.location.reload();
      return;
    }

    if (!isDuy) {
      setNotification('Chỉ duy nhất Mạc Khánh Duy mới có quyền xác thực Quản trị viên!');
      setFailedAttempts((prev) => prev + 1);
      return;
    }

    if (
      pinVal === '24122012@duy' ||
      pinVal === MASTER_SECURITY_CODE ||
      pinVal === '24122012@' ||
      pinVal === ADMIN_DEFAULT_PIN
    ) {
      const adminUser: UserAccount = {
        id: ADMIN_ID,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        phone: '0778901259',
        avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=MacKhanhDuy',
        provider: 'admin',
        role: 'admin',
        createdAt: new Date().toLocaleDateString('vi-VN'),
        plan: 'premium',
        isSuperAdmin: true,
      };
      localStorage.removeItem('max10_admin_reset_to_guest');
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(adminUser));
      localStorage.setItem('max10_admin_email', ADMIN_EMAIL);
      localStorage.setItem('max10_is_owner_access', 'true');
      sessionStorage.setItem('max10_master_security_verified', 'true');
      syncUserToServer(adminUser);
      onLoginSuccess(adminUser);
      onClose();
    } else {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      if (nextFail >= 3) {
        setNotification(`⚠️ Cảnh báo an ninh: Bạn đã nhập sai ${nextFail} lần! Nếu nhập sai tiếp tục hoặc cố tình hack, hệ thống sẽ TỰ ĐỘNG BAN và XÓA TÀI KHOẢN VĨNH VIỄN!`);
      } else {
        setNotification('Mã PIN / Mã bảo mật quản trị viên không chính xác!');
      }
    }
  };

  // Helper to sync user to server
  const syncUserToServer = async (user: UserAccount) => {
    try {
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch (e) {
      console.warn('Sync user failed, using local mode', e);
    }
  };

  // ĐĂNG NHẬP KHÁCH THÀNH HỌC SINH HOẶC THẦY CÔ
  const handleGuestLogin = (customName?: string) => {
    const finalName = (customName || name).trim() || (role === 'teacher' ? 'Thầy Cô' : 'Bạn học');
    setLoadingProvider('guest');

    setTimeout(() => {
      const isDuy =
        finalName.toLowerCase().trim() === 'mạc khánh duy' ||
        finalName.toLowerCase().trim() === 'mac khanh duy';

      if (isDuy) {
        // Chỉ Mạc Khánh Duy mới xác thực được và BẮT BUỘC phải nhập mã PIN 24122012@
        setActiveTab('admin');
        setAdminName('Mạc Khánh Duy');
        setNotification('Chào Mạc Khánh Duy! Vui lòng nhập mã PIN xác thực quản trị viên.');
        setLoadingProvider(null);
        return;
      }

      // Khách vào học/dạy: Học sinh hoặc Thầy cô
      const user: UserAccount = {
        id: 'guest-' + (role === 'teacher' ? 'tc-' : 'hs-') + Math.random().toString(36).substring(2, 8),
        name: finalName,
        email: `${finalName.toLowerCase().replace(/\s+/g, '')}@max10.edu.vn`,
        avatar:
          role === 'teacher'
            ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&auto=format&fit=crop&q=80'
            : authGender === 'female'
            ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
        gender: authGender,
        dob: authDob,
        provider: 'guest',
        role: role,
        createdAt: new Date().toLocaleDateString('vi-VN'),
        presenceStatus: 'online',
        plan: 'free',
        isSuperAdmin: false,
      };

      localStorage.setItem('max10_user_dob_v1', authDob);
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
      syncUserToServer(user);
      onLoginSuccess(user);
      setLoadingProvider(null);
      onClose();
    }, 250);
  };

  const handleSelectStatus = async (status: UserPresenceStatus) => {
    setCurrentPresence(status);
    try {
      localStorage.setItem(STORAGE_KEY_USER_PRESENCE, status);
      if (currentUser) {
        const updated = { ...currentUser, presenceStatus: status };
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
        await fetch('/api/users/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, status }),
        });
      }
      if (onPresenceStatusChange) {
        onPresenceStatusChange(status);
      }
      setNotification(`Đã đổi trạng thái sang "${PRESENCE_STATUS_CONFIG[status].label}"!`);
      setTimeout(() => setNotification(''), 2500);
    } catch (e) {}
  };

  const handleLogoutClick = () => {
    onLogout();
    setActiveTab('guest');
    setName('');
    setNotification('✓ Bạn đã đăng xuất thành công. Vui lòng chọn vai trò Học sinh hoặc Thầy cô để đăng nhập.');
  };

  const studentNameSuggestions = ['Quỳnh', 'Minh Anh', 'Bảo Châu', 'Hải Đăng', 'Phương Linh', 'Đức Huy', 'Khánh Vy'];
  const teacherNameSuggestions = ['Thầy Duy', 'Cô Mai', 'Thầy Tuấn', 'Cô Lan', 'Thầy Nam', 'Cô Linh'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              M10
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {currentUser ? 'Hồ Sơ Tài Khoản Max10' : 'Đăng Nhập Khách Max10 AI'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {currentUser
                  ? 'Đang hoạt động trên hệ thống'
                  : 'Chọn vai trò Học sinh hoặc Thầy cô để vào học và giải bài'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Already Logged In */}
        {currentUser ? (
          <div className="p-6 space-y-5">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-850/80 border-zinc-750' : 'bg-slate-50 border-slate-200'} space-y-3`}>
              <div className="flex items-center gap-3.5">
                <div className="relative group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md overflow-hidden">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  {onOpenAvatarModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAvatarModal();
                      }}
                      className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs transition-transform group-hover:scale-110 cursor-pointer"
                      title="Đổi ảnh đại diện"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-base">{currentUser.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold">
                      {currentUser.role === 'teacher' ? 'Thầy Cô' : currentUser.role === 'admin' ? 'Quản trị' : 'Học sinh'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                    {currentUser.email || `${currentUser.name} @ Max10`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-300">
                      Vai trò:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {currentUser.role === 'teacher' ? 'Giáo viên / Thầy cô' : currentUser.role === 'admin' ? 'Quản trị viên' : 'Học sinh'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Presence Status Selector */}
            <div className={`p-3.5 rounded-2xl border text-xs ${isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between gap-1.5 font-bold mb-2">
                <span className="text-slate-800 dark:text-zinc-200">
                  TRẠNG THÁI HOẠT ĐỘNG:
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
                  {PRESENCE_STATUS_CONFIG[currentPresence]?.iconEmoji} {PRESENCE_STATUS_CONFIG[currentPresence]?.label}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(PRESENCE_STATUS_CONFIG) as UserPresenceStatus[]).map((st) => {
                  const conf = PRESENCE_STATUS_CONFIG[st];
                  const isSelected = currentPresence === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleSelectStatus(st)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-2xs font-bold'
                          : isDark
                          ? 'bg-zinc-800/80 hover:bg-zinc-750 border-zinc-700 text-zinc-300'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full shrink-0 border border-white dark:border-zinc-900 ${conf.colorClass}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{conf.label}</span>
                          {isSelected && <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">✓</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate leading-tight">
                          {conf.sublabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {notification && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 text-center">
                  ✓ {notification}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {onOpenAvatarModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAvatarModal();
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Thay Đổi Ảnh Đại Diện</span>
                </button>
              )}

              {/* Nút Đăng Xuất: Khi bấm sẽ hiện ngay chỗ đăng nhập khách thành học sinh và thầy cô */}
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full py-3 px-4 rounded-2xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất Khỏi Tài Khoản Này</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Notification message (e.g. after logout) */}
            {notification && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold text-center animate-in fade-in">
                {notification}
              </div>
            )}

            {/* Top Tabs: Đăng Nhập Khách vs Quản Trị Viên Mạc Khánh Duy */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-zinc-800 p-1 gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('guest');
                  setNotification('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'guest'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Đăng nhập Khách (Học sinh & Thầy cô)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setNotification('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
                }`}
                title="Dành riêng cho Mạc Khánh Duy"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>👑 Quản trị</span>
              </button>
            </div>

            {/* TAB 1: ĐĂNG NHẬP KHÁCH - CHỌN HỌC SINH HOẶC THẦY CÔ */}
            {activeTab === 'guest' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleGuestLogin();
                }}
                className="space-y-4"
              >
                {/* 2 Big Visual Role Cards: Học sinh vs Thầy cô */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Chọn vai trò đăng nhập của bạn:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Role Card 1: Học Sinh */}
                    <div
                      onClick={() => setRole('student')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        role === 'student'
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 shadow-sm ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${role === 'student' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-100 dark:bg-zinc-800 text-emerald-600'}`}>
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        {role === 'student' && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm flex items-center gap-1.5">
                          Học Sinh
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">THCS</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-snug">
                          Hỏi bài, xem giải chi tiết từng bước, sơ đồ tư duy & bẫy điểm 10.
                        </p>
                      </div>
                    </div>

                    {/* Role Card 2: Thầy Cô */}
                    <div
                      onClick={() => setRole('teacher')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        role === 'teacher'
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-100 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${role === 'teacher' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-zinc-800 text-indigo-600'}`}>
                          <School className="w-5 h-5" />
                        </div>
                        {role === 'teacher' && (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm flex items-center gap-1.5">
                          Thầy Cô
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">Giáo Viên</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-snug">
                          Soạn giáo án, đề kiểm tra, chấm bài & đồng hành cùng học sinh.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name Input */}
                <div className="text-left">
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                    {role === 'teacher' ? 'Họ và tên Thầy / Cô giáo:' : 'Họ và tên Học sinh:'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        role === 'teacher'
                          ? 'Ví dụ: Thầy Duy, Cô Mai, Thầy Tuấn...'
                          : 'Ví dụ: Quỳnh, Minh Anh, Bảo Châu...'
                      }
                      className={`w-full pl-10 pr-3 py-2.5 rounded-xl text-sm font-semibold border outline-hidden transition-all ${
                        isDark
                          ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Quick Name Suggestions tailored to role */}
                <div className="text-left">
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-400 mb-1.5">
                    Gợi ý tên nhanh:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(role === 'teacher' ? teacherNameSuggestions : studentNameSuggestions).map((sName) => (
                      <button
                        key={sName}
                        type="button"
                        onClick={() => setName(sName)}
                        className={`text-xs px-2.5 py-1 rounded-xl border font-semibold transition-all cursor-pointer ${
                          name === sName
                            ? role === 'teacher'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : isDark
                            ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {sName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender Selector */}
                <div className="text-left">
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                    Giới tính (để chọn ảnh đại diện phù hợp):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthGender('male')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        authGender === 'male'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                      }`}
                    >
                      <span className="text-sm">👦</span>
                      <span>Nam</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthGender('female')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        authGender === 'female'
                          ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                      }`}
                    >
                      <span className="text-sm">👧</span>
                      <span>Nữ</span>
                    </button>
                  </div>
                </div>

                {/* USER REQUIREMENT: HỎI NGÀY THÁNG NĂM SINH ĐỂ CÓ ĐIỀU BẤT NGỜ */}
                <div className="text-left p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                  <label className="block text-xs font-bold mb-1.5 text-slate-800 dark:text-zinc-200">
                    🎂 Ngày tháng năm sinh (để nhận bất ngờ sinh nhật):
                  </label>
                  <input
                    type="date"
                    value={authDob}
                    onChange={(e) => setAuthDob(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-white focus:border-amber-500'
                        : 'bg-white border-amber-300 text-slate-900 focus:border-amber-500'
                    }`}
                  />
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1 font-medium">
                    ✨ Vào ngày sinh nhật, bạn sẽ nhận được phần quà bất ngờ, huy hiệu danh dự và +500 XP từ Max10!
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!name.trim() || loadingProvider !== null}
                  className={`w-full py-3 px-4 rounded-2xl text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50 ${
                    role === 'teacher'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {loadingProvider === 'guest'
                      ? 'Đang vào...'
                      : role === 'teacher'
                      ? 'Đăng Nhập Khách: Thầy Cô 🏫'
                      : 'Đăng Nhập Khách: Học Sinh 🚀'}
                  </span>
                </button>
              </form>
            )}

            {/* TAB 2: QUẢN TRỊ VIÊN MẠC KHÁNH DUY */}
            {activeTab === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                  <Crown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-left">
                    <span className="font-black block">Cổng Đăng Nhập Quản Trị Viên Tối Cao</span>
                    <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/80">
                      Chỉ dành riêng cho <strong>Mạc Khánh Duy</strong> (<code>{ADMIN_EMAIL}</code>). Người dùng thông thường vào liên kết chỉ làm Học sinh hoặc Giáo viên.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300 text-left">
                    Họ và tên Quản trị viên:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => {
                        setAdminName(e.target.value);
                        setNotification('');
                      }}
                      placeholder="Mạc Khánh Duy"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300 text-left">
                    Mã PIN xác thực Quản trị viên:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      autoFocus
                      value={adminPin}
                      onChange={(e) => {
                        setAdminPin(e.target.value);
                        setNotification('');
                      }}
                      placeholder="Nhập mã PIN xác thực quản trị viên..."
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm font-mono tracking-widest border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {notification && (
                  <div className="text-xs text-rose-500 font-bold text-left">
                    {notification}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!adminPin.trim()}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Crown className="w-4 h-4" />
                  <span>Xác Thực Quản Trị Viên Mạc Khánh Duy</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
