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

import {
  ALL_CLASSES_LIST,
  ClassCode,
  SUBJECT_LIST,
  getActiveClassCodes,
  registerTeacherForClasses,
  enrollRealStudentInClass,
} from '../../data/classSystemData';
import { TeacherRoleType } from '../../types/auth';

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
  const [teacherTitle, setTeacherTitle] = useState<'Cô' | 'Thầy'>('Cô');
  const [teacherPhone, setTeacherPhone] = useState<string>('');
  const [teacherEmail, setTeacherEmail] = useState<string>('');
  const [teacherVerifiedCommit, setTeacherVerifiedCommit] = useState<boolean>(true);
  const [teacherRoleType, setTeacherRoleType] = useState<TeacherRoleType>('both');
  const [teachingSubject, setTeachingSubject] = useState<string>(SUBJECT_LIST[0]);
  const [homeroomClass, setHomeroomClass] = useState<ClassCode>('9D1');
  const [teachingClasses, setTeachingClasses] = useState<ClassCode[]>(['9D1']);
  const [schoolName, setSchoolName] = useState<string>('THCS Max10');
  const [studentClass, setStudentClass] = useState<ClassCode | ''>(() => {
    const active = getActiveClassCodes();
    return active[0] || '';
  });

  const [adminName, setAdminName] = useState<string>('Mạc Khánh Duy');
  const [adminPin, setAdminPin] = useState<string>('');
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(null);
  const [notification, setNotification] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [authGender, setAuthGender] = useState<'male' | 'female'>('male');
  const [authDob, setAuthDob] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('max10_user_dob_v1') || '2012-09-15' : '2012-09-15';
  });
  const [currentPresence, setCurrentPresence] = useState<UserPresenceStatus>(() => {
    return (currentUser?.presenceStatus as UserPresenceStatus) || 'online';
  });

  if (!isOpen) return null;

  const activeClassCodes = getActiveClassCodes();

  const toggleTeachingClass = (code: ClassCode) => {
    setTeachingClasses((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Quản trị viên Mạc Khánh Duy login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAdminName = adminName.trim().toLowerCase();
    const isDuy = cleanAdminName === 'mạc khánh duy' || cleanAdminName === 'mac khanh duy';

    const pinVal = adminPin.trim();
    const isMaliciousPayload =
      pinVal.includes('<script') ||
      pinVal.includes('javascript:') ||
      pinVal.includes('DROP') ||
      pinVal.includes('UNION SELECT') ||
      pinVal.includes('--') ||
      pinVal.includes("' OR '");

    if (isMaliciousPayload || failedAttempts >= 4) {
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

  // ĐĂNG KÝ / ĐĂNG NHẬP HỌC SINH HOẶC GIÁO VIÊN XÁC THỰC
  const handleGuestLogin = (customName?: string) => {
    const finalName = (customName || name).trim();
    if (!finalName) {
      setNotification('Vui lòng nhập họ và tên thật của bạn!');
      return;
    }

    const isDuy =
      finalName.toLowerCase().trim() === 'mạc khánh duy' ||
      finalName.toLowerCase().trim() === 'mac khanh duy';

    if (isDuy) {
      setActiveTab('admin');
      setAdminName('Mạc Khánh Duy');
      setNotification('Chào Mạc Khánh Duy! Vui lòng nhập mã PIN xác thực quản trị viên.');
      return;
    }

    if (role === 'teacher') {
      if (!teacherVerifiedCommit) {
        setNotification('Vui lòng tích xác nhận hồ sơ Giáo viên thật trước khi mở lớp!');
        return;
      }
      if ((teacherRoleType === 'subject' || teacherRoleType === 'both') && teachingClasses.length === 0) {
        setNotification('Vui lòng chọn ít nhất 1 lớp giảng dạy!');
        return;
      }
    }

    setLoadingProvider('guest');

    setTimeout(() => {
      const cleanSlug = finalName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

      const finalTeachingClasses =
        role === 'teacher'
          ? teacherRoleType === 'homeroom'
            ? [homeroomClass]
            : teacherRoleType === 'both'
            ? Array.from(new Set([homeroomClass, ...teachingClasses]))
            : teachingClasses
          : undefined;

      const resolvedTeacherName =
        role === 'teacher' &&
        !finalName.toLowerCase().startsWith('cô ') &&
        !finalName.toLowerCase().startsWith('thầy ')
          ? `${teacherTitle} ${finalName}`
          : finalName;

      const user: UserAccount = {
        id: 'real-' + (role === 'teacher' ? 'gv-' : 'hs-') + (cleanSlug || 'user') + '-' + Date.now().toString(36),
        name: resolvedTeacherName,
        email: role === 'teacher' && teacherEmail.trim() ? teacherEmail.trim() : `${cleanSlug || 'user'}@max10.edu.vn`,
        phone: role === 'teacher' && teacherPhone.trim() ? teacherPhone.trim() : undefined,
        avatar:
          role === 'teacher'
            ? `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(resolvedTeacherName)}`
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalName)}`,
        gender: role === 'teacher' ? (teacherTitle === 'Cô' ? 'female' : 'male') : authGender,
        dob: role === 'student' ? authDob : undefined,
        provider: 'guest',
        role: role,
        createdAt: new Date().toLocaleDateString('vi-VN'),
        presenceStatus: 'online',
        plan: 'free',
        isSuperAdmin: false,
        // Thông tin xác thực giáo viên / học sinh thật
        isVerifiedTeacher: role === 'teacher' ? true : undefined,
        teacherTitle: role === 'teacher' ? teacherTitle : undefined,
        teacherRoleType: role === 'teacher' ? teacherRoleType : undefined,
        teachingSubject: role === 'teacher' && (teacherRoleType === 'subject' || teacherRoleType === 'both') ? teachingSubject : role === 'teacher' ? 'Chủ nhiệm lớp' : undefined,
        homeroomClass: role === 'teacher' && (teacherRoleType === 'homeroom' || teacherRoleType === 'both') ? homeroomClass : undefined,
        teachingClasses: finalTeachingClasses,
        schoolName: schoolName.trim() || 'THCS Max10',
        studentClass: role === 'student' && studentClass ? studentClass : undefined,
      };

      if (role === 'student') {
        localStorage.setItem('max10_user_dob_v1', authDob);
      }
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));

      if (role === 'teacher') {
        registerTeacherForClasses(user);
      } else if (role === 'student' && user.studentClass) {
        enrollRealStudentInClass(user);
      }

      syncUserToServer(user);
      onLoginSuccess(user);
      setLoadingProvider(null);
      onClose();
    }, 200);
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
    setNotification('✓ Bạn đã đăng xuất thành công. Vui lòng đăng ký hoặc chọn vai trò để tiếp tục.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className={`w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              M10
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {currentUser ? 'Hồ Sơ Tài Khoản Max10' : 'Đăng Ký & Đăng Nhập Max10 AI'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {currentUser
                  ? 'Đang hoạt động trên hệ thống'
                  : 'Chọn Học sinh hoặc Đăng ký tài khoản Giáo viên xác thực để mở lớp học'}
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

        <div className="overflow-y-auto flex-1">
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-base">{currentUser.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {currentUser.role === 'teacher'
                          ? currentUser.teacherRoleType === 'both'
                            ? 'GV Bộ môn & Chủ nhiệm'
                            : currentUser.teacherRoleType === 'homeroom'
                            ? 'GV Chủ nhiệm'
                            : 'GV Bộ môn'
                          : currentUser.role === 'admin'
                          ? 'Quản trị viên Thật'
                          : 'Học sinh'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
                      {currentUser.email || `${currentUser.name} @ Max10`}
                    </p>
                    {currentUser.role === 'teacher' && (
                      <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        {currentUser.homeroomClass ? `Chủ nhiệm lớp ${currentUser.homeroomClass}` : ''}{' '}
                        {currentUser.teachingSubject ? `· Môn ${currentUser.teachingSubject}` : ''}
                        {currentUser.teachingClasses?.length ? ` · Dạy lớp: ${currentUser.teachingClasses.join(', ')}` : ''}
                      </p>
                    )}
                    {currentUser.role === 'student' && currentUser.studentClass && (
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        Đang học tại Lớp {currentUser.studentClass}
                      </p>
                    )}
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
              {notification && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold text-center animate-in fade-in">
                  {notification}
                </div>
              )}

              {/* Top Tabs: Đăng Ký Học sinh & Giáo viên vs Quản Trị Viên Mạc Khánh Duy */}
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
                  <span>Học sinh & Đăng ký Giáo viên</span>
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

              {activeTab === 'guest' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGuestLogin();
                  }}
                  className="space-y-4"
                >
                  {/* Distinct Portal Switcher: Cổng Học Sinh vs Cổng Giáo Viên */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setRole('student');
                        setNotification('');
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        role === 'student'
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/35 text-emerald-950 dark:text-emerald-100 shadow-sm'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${role === 'student' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-emerald-600'}`}>
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        {role === 'student' && (
                          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">Đang chọn ✓</span>
                        )}
                      </div>
                      <div className="font-extrabold text-sm">Cổng Học Sinh</div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        Vào lớp học thực tế, tải đề thi, nộp bài tập & hỏi Gia sư AI.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRole('teacher');
                        setNotification('');
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        role === 'teacher'
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/35 text-indigo-950 dark:text-indigo-100 shadow-sm'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${role === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-indigo-600'}`}>
                          <School className="w-5 h-5" />
                        </div>
                        {role === 'teacher' && (
                          <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300">Hồ sơ GV ✓</span>
                        )}
                      </div>
                      <div className="font-extrabold text-sm">Cổng Giáo Viên</div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        Hồ sơ chuyên môn xác thực để mở lớp, giao đề thi & chấm bài.
                      </p>
                    </button>
                  </div>

                  {/* ======================================================== */}
                  {/* PORTAL A: GIAO DIỆN ĐĂNG KÝ HỌC SINH (ĐƠN GIẢN, TRẺ TRUNG) */}
                  {/* ======================================================== */}
                  {role === 'student' ? (
                    <div className={`p-4 rounded-2xl border space-y-4 text-left ${isDark ? 'bg-emerald-950/15 border-emerald-500/25' : 'bg-emerald-50/40 border-emerald-200'}`}>
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/15">
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                          Hồ Sơ Nhanh Học Sinh THCS
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">Bước 1 / Học tập</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                          Họ và tên Học sinh (Tên thật):
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                          <input
                            type="text"
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="VD: Nguyễn Minh Anh"
                            className={`w-full pl-10 pr-3 py-2.5 rounded-xl text-sm font-semibold border outline-hidden transition-all ${
                              isDark
                                ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                          Lớp đang theo học (chỉ lớp đã có Giáo viên thật mở):
                        </label>
                        <select
                          value={studentClass}
                          onChange={(e) => setStudentClass(e.target.value as ClassCode | '')}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                            isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="">
                            {activeClassCodes.length > 0
                              ? '-- Chọn lớp đang theo học --'
                              : '-- Chưa có giáo viên mở lớp (vẫn có thể tự học) --'}
                          </option>
                          {ALL_CLASSES_LIST.map((c) => {
                            const hasTeacher = activeClassCodes.includes(c);
                            return (
                              <option key={c} value={c}>
                                Lớp {c} {hasTeacher ? '✓ (Đã có Giáo viên mở lớp)' : '(Chưa có GV đăng ký)'}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                            Giới tính:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setAuthGender('male')}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                authGender === 'male'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                              }`}
                            >
                              <span>👦</span>
                              <span>Nam</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAuthGender('female')}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                authGender === 'female'
                                  ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                                  : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                              }`}
                            >
                              <span>👧</span>
                              <span>Nữ</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                            🎂 Ngày sinh (nhận quà sinh nhật):
                          </label>
                          <input
                            type="date"
                            value={authDob}
                            onChange={(e) => setAuthDob(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                              isDark
                                ? 'bg-zinc-800 border-zinc-700 text-white focus:border-amber-500'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ================================================================== */
                    /* PORTAL B: HỒ SƠ ĐĂNG KÝ GIÁO VIÊN XÁC THỰC (KHÁC BIỆT HOÀN TOÀN) */
                    /* ================================================================== */
                    <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-4 text-left ${isDark ? 'bg-[#11182c] border-indigo-500/40' : 'bg-slate-50 border-indigo-300'}`}>
                      {/* Distinct Academic Faculty Header */}
                      <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${isDark ? 'bg-indigo-950/50 border-indigo-500/30' : 'bg-indigo-600 text-white border-indigo-600'}`}>
                        <div>
                          <div className="text-xs font-black tracking-tight">
                            HỒ SƠ GIẢNG VIÊN & XÁC THỰC CHUYÊN MÔN
                          </div>
                          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-indigo-200' : 'text-indigo-100'}`}>
                            Thiết kế riêng cho Thầy/Cô · Mở lớp thật & Thư viện Đề thi
                          </div>
                        </div>
                        <School className="w-6 h-6 shrink-0 opacity-90" />
                      </div>

                      {/* 1. Danh xưng + Họ tên Giảng viên */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                            Danh xưng:
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['Cô', 'Thầy'] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setTeacherTitle(t)}
                                className={`py-2 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                                  teacherTitle === t
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : isDark
                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                    : 'bg-white border-slate-300 text-slate-700'
                                }`}
                              >
                                {t} giáo
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                            Họ và tên Giáo viên (Tên thật):
                          </label>
                          <input
                            type="text"
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="VD: Nguyễn Thị Minh Thu"
                            className={`w-full px-3.5 py-2 rounded-xl text-sm font-semibold border outline-hidden ${
                              isDark
                                ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-indigo-500'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                            }`}
                          />
                        </div>
                      </div>

                      {/* 2. Đơn vị công tác & Thông tin liên hệ */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                            Trường THCS công tác:
                          </label>
                          <input
                            type="text"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="THCS Nguyễn Du"
                            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                              isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                            SĐT liên hệ (hiển thị cho PH/HS):
                          </label>
                          <input
                            type="tel"
                            value={teacherPhone}
                            onChange={(e) => setTeacherPhone(e.target.value)}
                            placeholder="09xx xxx xxx"
                            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                              isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                            Email công tác:
                          </label>
                          <input
                            type="email"
                            value={teacherEmail}
                            onChange={(e) => setTeacherEmail(e.target.value)}
                            placeholder="giaovien@truong.edu.vn"
                            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                              isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>

                      {/* 3. Phân biệt vai trò: Giáo viên bộ môn / Giáo viên chủ nhiệm / Cả hai */}
                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                          Chức vụ & Quyền hạn trên hệ thống:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { id: 'subject' as const, label: 'Giáo viên bộ môn', sub: 'Dạy chuyên môn & up đề' },
                            { id: 'homeroom' as const, label: 'Giáo viên chủ nhiệm', sub: 'Quản lý lớp & điểm danh' },
                            { id: 'both' as const, label: 'Cả Bộ môn & Chủ nhiệm', sub: 'Toàn quyền phụ trách' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setTeacherRoleType(opt.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                teacherRoleType === opt.id
                                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                                  : isDark
                                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-indigo-500/50'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                              }`}
                            >
                              <div className="text-xs font-extrabold leading-tight">{opt.label}</div>
                              <div className={`text-[10px] mt-0.5 ${teacherRoleType === opt.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {opt.sub}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 4. Bộ môn & Lớp chủ nhiệm */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(teacherRoleType === 'subject' || teacherRoleType === 'both') && (
                          <div>
                            <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                              Bộ môn giảng dạy:
                            </label>
                            <select
                              value={teachingSubject}
                              onChange={(e) => setTeachingSubject(e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            >
                              {SUBJECT_LIST.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {(teacherRoleType === 'homeroom' || teacherRoleType === 'both') && (
                          <div>
                            <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                              Lớp Chủ Nhiệm (tạo lớp thật):
                            </label>
                            <select
                              value={homeroomClass}
                              onChange={(e) => {
                                const next = e.target.value as ClassCode;
                                setHomeroomClass(next);
                                if (!teachingClasses.includes(next)) {
                                  setTeachingClasses((prev) => [...prev, next]);
                                }
                              }}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            >
                              {ALL_CLASSES_LIST.map((c) => (
                                <option key={c} value={c}>Lớp {c}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* 5. Các lớp giảng dạy bộ môn */}
                      {(teacherRoleType === 'subject' || teacherRoleType === 'both') && (
                        <div>
                          <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                            Chọn các lớp trực tiếp giảng dạy (6A1 - 9D6):
                          </label>
                          <div className="grid grid-cols-6 gap-1.5">
                            {ALL_CLASSES_LIST.map((c) => {
                              const active = teachingClasses.includes(c) || (teacherRoleType === 'both' && homeroomClass === c);
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => toggleTeachingClass(c)}
                                  className={`py-1.5 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                                    active
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                      : isDark
                                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-indigo-400'
                                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400'
                                  }`}
                                >
                                  {c}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 6. Cam kết tài khoản giáo viên thật */}
                      <label className="flex items-start gap-2.5 text-xs cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={teacherVerifiedCommit}
                          onChange={(e) => setTeacherVerifiedCommit(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-indigo-600 rounded"
                        />
                        <span className="text-slate-600 dark:text-zinc-300 leading-snug">
                          Tôi xác nhận đăng ký với tư cách <strong>Giáo viên thật</strong> để mở lớp, duyệt bài tập và tải lên đề thi mẫu cho học sinh.
                        </span>
                      </label>
                    </div>
                  )}

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
                        ? 'Đang xác thực hồ sơ...'
                        : role === 'teacher'
                        ? 'Xác Thực Hồ Sơ Giáo Viên & Mở Lớp 🏫'
                        : 'Vào Học Ngay: Học Sinh 🚀'}
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
    </div>
  );
};
