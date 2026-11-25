import React, { useState, useEffect } from 'react';
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
  Mail,
  Trash2,
  Users,
  Eye,
  EyeOff,
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
  loadSavedAccounts,
  saveAccountToHistory,
  removeSavedAccount,
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
  const [studentAccount, setStudentAccount] = useState<string>('');
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
  const [showAdminPin, setShowAdminPin] = useState<boolean>(false);
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
  const [savedAccounts, setSavedAccounts] = useState<UserAccount[]>(() => loadSavedAccounts());

  useEffect(() => {
    if (!isOpen) return;
    if (currentUser?.presenceStatus) {
      setCurrentPresence(currentUser.presenceStatus as UserPresenceStatus);
    }
    const localList = loadSavedAccounts();
    setSavedAccounts(localList);

    fetch('/api/users/accounts')
      .then((r) =>
        r.ok && (r.headers.get('content-type') || '').includes('application/json') ? r.json() : null
      )
      .then((data) => {
        if (data?.success && Array.isArray(data.accounts)) {
          const mergedMap = new Map<string, UserAccount>();
          localList.forEach((acc) => mergedMap.set(acc.id, acc));
          data.accounts.forEach((srvAcc: UserAccount) => {
            if (srvAcc?.id && srvAcc?.name && srvAcc.role !== 'admin') {
              mergedMap.set(srvAcc.id, { ...mergedMap.get(srvAcc.id), ...srvAcc });
            }
          });
          setSavedAccounts(Array.from(mergedMap.values()));
        }
      })
      .catch(() => {});
  }, [isOpen, currentUser?.id]);

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
      pinVal === 'duykobell123' ||
      pinVal === MASTER_SECURITY_CODE ||
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

      const rawAccountInput = (role === 'teacher' ? teacherEmail : studentAccount).trim();
      const resolvedAccountEmail = rawAccountInput
        ? rawAccountInput.includes('@')
          ? rawAccountInput.toLowerCase()
          : `${rawAccountInput.toLowerCase().replace(/[^a-z0-9._-]/g, '') || cleanSlug || 'user'}@max10.edu.vn`
        : `${cleanSlug || 'user'}@max10.edu.vn`;

      const user: UserAccount = {
        id: 'real-' + (role === 'teacher' ? 'gv-' : 'hs-') + (cleanSlug || 'user') + '-' + Date.now().toString(36),
        name: resolvedTeacherName,
        email: resolvedAccountEmail,
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
      const updatedHistory = saveAccountToHistory(user);
      setSavedAccounts(updatedHistory);

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

  const handleQuickLoginAccount = (account: UserAccount) => {
    const normalized: UserAccount = {
      ...account,
      presenceStatus: account.presenceStatus || 'online',
    };
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(normalized));
    if (normalized.dob) {
      localStorage.setItem('max10_user_dob_v1', normalized.dob);
    }
    const updatedHistory = saveAccountToHistory(normalized);
    setSavedAccounts(updatedHistory);

    if (normalized.role === 'teacher') {
      registerTeacherForClasses(normalized);
    } else if (normalized.role === 'student' && normalized.studentClass) {
      enrollRealStudentInClass(normalized);
    }

    syncUserToServer(normalized);
    onLoginSuccess(normalized);
    onClose();
  };

  const handleRemoveSavedAccount = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeSavedAccount(accountId);
    setSavedAccounts((prev) => prev.filter((a) => a.id !== accountId || updated.some((u) => u.id === a.id)));
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
    if (currentUser) {
      setSavedAccounts(saveAccountToHistory(currentUser));
    }
    onLogout();
    setActiveTab('guest');
    setName('');
    setStudentAccount('');
    setNotification('✓ Bạn đã đăng xuất thành công. Chọn tài khoản bên dưới hoặc đăng ký mới.');
  };

  const discordCardBg = isDark
    ? 'bg-[#313338] text-[#dbdee1] border-white/[0.06]'
    : 'bg-white text-[#060607] border-slate-200';
  const discordSubPanelBg = isDark
    ? 'bg-[#2b2d31] border-white/[0.06]'
    : 'bg-[#f2f3f5] border-slate-200/80';
  const discordInputClass = isDark
    ? 'bg-[#1e1f22] text-[#dbdee1] placeholder-[#87898c] border border-transparent focus:border-[#00a8fc]'
    : 'bg-[#e3e5e8] text-[#060607] placeholder-[#5c5e66] border border-transparent focus:border-[#006ce7]';
  const discordLabelClass = isDark
    ? 'text-[#b5bac1]'
    : 'text-[#4e5058]';
  const discordMutedClass = isDark
    ? 'text-[#949ba4]'
    : 'text-[#5c5e66]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0d14]/75 backdrop-blur-xs transition-opacity animate-in fade-in">
      {/* Subtle Discord Blurple Atmospheric Backdrop Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[620px] h-[320px] rounded-full bg-[#5865F2]/25 blur-[110px]" />
      </div>

      <div
        className={`relative w-full ${
          !currentUser && activeTab === 'guest' && role === 'teacher' ? 'max-w-[560px]' : 'max-w-[480px]'
        } max-h-[92vh] flex flex-col rounded-lg border shadow-[0_8px_32px_rgba(0,0,0,0.45)] overflow-hidden transition-all ${discordCardBg}`}
      >
        {/* Top-Right Close Button (Discord Style) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className={`absolute top-3.5 right-3.5 z-20 p-1.5 rounded-md transition-colors cursor-pointer ${
            isDark
              ? 'text-[#b5bac1] hover:text-white hover:bg-white/10'
              : 'text-[#5c5e66] hover:text-[#060607] hover:bg-black/5'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto flex-1">
          {/* ========================================================== */}
          {/* VIEW 1: ĐÃ ĐĂNG NHẬP (DISCORD USER PROFILE & STATUS MODAL) */}
          {/* ========================================================== */}
          {currentUser ? (
            <div>
              {/* Discord Profile Banner */}
              <div className="h-24 w-full bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#5865F2] relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:14px_14px]" />
              </div>

              <div className="px-6 pb-6">
                {/* Overlapping Avatar + Role Tag */}
                <div className="flex items-end justify-between gap-3 -mt-11 mb-4 relative z-10">
                  <div className="relative group">
                    <div
                      className={`w-20 h-20 rounded-full overflow-hidden border-[5px] flex items-center justify-center font-black text-2xl text-white bg-[#5865F2] shadow-md ${
                        isDark ? 'border-[#313338]' : 'border-white'
                      }`}
                    >
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        currentUser.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span
                      className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] ${
                        isDark ? 'border-[#313338]' : 'border-white'
                      } ${PRESENCE_STATUS_CONFIG[currentPresence]?.colorClass || 'bg-emerald-500'}`}
                    />
                    {onOpenAvatarModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAvatarModal();
                        }}
                        className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                        title="Đổi ảnh đại diện"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {onOpenAvatarModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAvatarModal();
                      }}
                      className="px-3.5 py-1.5 rounded-[4px] bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Sửa hồ sơ
                    </button>
                  )}
                </div>

                {/* Inner Discord Profile Card */}
                <div className={`p-4 rounded-lg border space-y-3 ${isDark ? 'bg-[#111214] border-white/[0.06]' : 'bg-[#f2f3f5] border-slate-200'}`}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-[#060607]'}`}>
                        {currentUser.name}
                      </h3>
                      <span className={`text-xs font-medium ${discordMutedClass}`}>
                        ·{' '}
                        {currentUser.role === 'teacher'
                          ? currentUser.teacherRoleType === 'both'
                            ? 'GV Bộ môn & Chủ nhiệm'
                            : currentUser.teacherRoleType === 'homeroom'
                            ? 'GV Chủ nhiệm'
                            : 'GV Bộ môn'
                          : currentUser.role === 'admin'
                          ? 'Quản trị viên'
                          : 'Học sinh'}
                      </span>
                    </div>
                    <p className={`text-xs font-mono mt-0.5 truncate ${discordMutedClass}`}>
                      {currentUser.email || `${currentUser.name.toLowerCase().replace(/\s+/g, '')}@max10.edu.vn`}
                    </p>
                    {currentUser.role === 'teacher' && (
                      <p className="text-xs font-medium text-[#00a8fc] mt-1.5">
                        {currentUser.homeroomClass ? `Chủ nhiệm lớp ${currentUser.homeroomClass}` : ''}
                        {currentUser.teachingSubject ? ` · Môn ${currentUser.teachingSubject}` : ''}
                        {currentUser.teachingClasses?.length ? ` · Dạy lớp: ${currentUser.teachingClasses.join(', ')}` : ''}
                      </p>
                    )}
                    {currentUser.role === 'student' && currentUser.studentClass && (
                      <p className="text-xs font-medium text-[#23a55a] mt-1.5">
                        Đang học tại Lớp {currentUser.studentClass}
                      </p>
                    )}
                  </div>

                  <div className={`pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                    <div>
                      <span className={`block text-[11px] font-semibold ${discordLabelClass}`}>
                        Tài khoản
                      </span>
                      <span className={`font-mono text-xs break-all ${isDark ? 'text-[#dbdee1]' : 'text-[#060607]'}`}>
                        {currentUser.email || `${currentUser.id}@max10.edu.vn`}
                      </span>
                    </div>
                    <div>
                      <span className={`block text-[11px] font-semibold ${discordLabelClass}`}>
                        Mã người dùng
                      </span>
                      <span className={`font-mono text-xs break-all ${isDark ? 'text-[#dbdee1]' : 'text-[#060607]'}`}>
                        {currentUser.id}
                      </span>
                    </div>
                    {(currentUser.schoolName || currentUser.phone) && (
                      <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-1">
                        <span className={`text-xs ${discordLabelClass}`}>
                          {currentUser.schoolName || 'THCS Max10'}
                        </span>
                        {currentUser.phone && (
                          <span className="font-mono text-xs font-semibold text-[#23a55a]">
                            {currentUser.phone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Discord Presence Status Selector */}
                <div className={`mt-4 p-3.5 rounded-lg border ${discordSubPanelBg}`}>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-xs font-bold ${discordLabelClass}`}>
                      Trạng thái hoạt động
                    </span>
                    <span className={`text-xs font-medium ${discordMutedClass}`}>
                      {PRESENCE_STATUS_CONFIG[currentPresence]?.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(PRESENCE_STATUS_CONFIG) as UserPresenceStatus[]).map((st) => {
                      const conf = PRESENCE_STATUS_CONFIG[st];
                      const isSelected = currentPresence === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleSelectStatus(st)}
                          className={`px-2.5 py-2 rounded-[4px] text-left transition-colors cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? 'bg-[#5865F2] text-white'
                              : isDark
                              ? 'bg-[#1e1f22] hover:bg-[#35373c] text-[#dbdee1]'
                              : 'bg-white hover:bg-slate-100 text-[#060607] border border-slate-200'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${conf.colorClass}`} />
                          <span className="text-xs font-medium truncate flex-1">{conf.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {notification && (
                    <p className="text-xs text-[#23a55a] font-medium mt-2 text-center">
                      {notification}
                    </p>
                  )}
                </div>

                {/* Discord Account Switcher */}
                {savedAccounts.filter((a) => a.id !== currentUser.id).length > 0 && (
                  <div className={`mt-4 p-3.5 rounded-lg border ${discordSubPanelBg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold ${discordLabelClass}`}>
                        Chuyển tài khoản
                      </span>
                      <span className={`text-[11px] tabular-nums ${discordMutedClass}`}>
                        {savedAccounts.filter((a) => a.id !== currentUser.id).length} đã lưu
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {savedAccounts
                        .filter((a) => a.id !== currentUser.id)
                        .map((acc) => (
                          <div
                            key={acc.id}
                            onClick={() => handleQuickLoginAccount(acc)}
                            className={`px-2.5 py-2 rounded-[4px] flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                              isDark
                                ? 'bg-[#1e1f22] hover:bg-[#35373c]'
                                : 'bg-white hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={
                                  acc.avatar ||
                                  `https://api.dicebear.com/7.x/${acc.role === 'teacher' ? 'personas' : 'avataaars'}/svg?seed=${encodeURIComponent(acc.name)}`
                                }
                                alt={acc.name}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-[#060607]'}`}>
                                    {acc.name}
                                  </span>
                                  <span className={`text-[11px] shrink-0 ${discordMutedClass}`}>
                                    · {acc.role === 'teacher' ? 'Thầy/Cô' : 'Học sinh'}
                                  </span>
                                </div>
                                <p className={`text-[11px] font-mono truncate ${discordMutedClass}`}>
                                  {acc.email || acc.id}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-[#5865F2] shrink-0 whitespace-nowrap">
                              Đăng nhập
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Logout Button */}
                <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="w-full py-2.5 px-4 rounded-[4px] bg-[#da373c] hover:bg-[#a12828] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /* VIEW 2: ĐĂNG NHẬP KIỂU DISCORD (KHÔNG CÓ MÃ QR)            */
            /* ========================================================== */
            <div className="p-6 sm:p-7 space-y-5">
              {/* Centered Discord Welcome Header */}
              <div className="text-center space-y-1.5 pt-1">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center font-black text-base shadow-sm mb-2">
                  M10
                </div>
                <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#060607]'}`}>
                  {activeTab === 'admin'
                    ? 'Xác thực Quản trị viên'
                    : role === 'teacher'
                    ? 'Đăng nhập Giáo viên'
                    : 'Chào mừng trở lại!'}
                </h3>
                <p className={`text-sm ${discordMutedClass}`}>
                  {activeTab === 'admin'
                    ? 'Khu vực dành riêng cho Quản trị viên hệ thống'
                    : role === 'teacher'
                    ? 'Rất vui được đồng hành cùng Thầy/Cô trên Max10 AI!'
                    : 'Rất vui được gặp lại bạn trên Max10 AI!'}
                </p>
              </div>

              {notification && (
                <div
                  className={`p-3 rounded-[4px] text-xs font-medium text-center border animate-in fade-in ${
                    notification.includes('⚠️') || notification.includes('không chính xác') || notification.includes('Vui lòng')
                      ? 'bg-[#da373c]/15 border-[#da373c]/40 text-[#f23f42]'
                      : 'bg-[#23a55a]/15 border-[#23a55a]/40 text-[#23a55a]'
                  }`}
                >
                  {notification}
                </div>
              )}

              {/* Clean Segmented Portal Switcher (Học sinh / Giáo viên / Quản trị) */}
              <div className={`grid grid-cols-3 gap-1 p-1 rounded-[6px] ${isDark ? 'bg-[#1e1f22]' : 'bg-[#e3e5e8]'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('guest');
                    setRole('student');
                    setNotification('');
                  }}
                  className={`py-2 px-2 rounded-[4px] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'guest' && role === 'student'
                      ? 'bg-[#5865F2] text-white shadow-xs'
                      : isDark
                      ? 'text-[#b5bac1] hover:text-white'
                      : 'text-[#4e5058] hover:text-[#060607]'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>Học sinh</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('guest');
                    setRole('teacher');
                    setNotification('');
                  }}
                  className={`py-2 px-2 rounded-[4px] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'guest' && role === 'teacher'
                      ? 'bg-[#5865F2] text-white shadow-xs'
                      : isDark
                      ? 'text-[#b5bac1] hover:text-white'
                      : 'text-[#4e5058] hover:text-[#060607]'
                  }`}
                >
                  <School className="w-3.5 h-3.5 shrink-0" />
                  <span>Giáo viên</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin');
                    setNotification('');
                  }}
                  className={`py-2 px-2 rounded-[4px] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'admin'
                      ? 'bg-[#f0b232] text-[#111214] shadow-xs'
                      : isDark
                      ? 'text-[#b5bac1] hover:text-white'
                      : 'text-[#4e5058] hover:text-[#060607]'
                  }`}
                  title="Dành riêng cho Mạc Khánh Duy"
                >
                  <Crown className="w-3.5 h-3.5 shrink-0" />
                  <span>Quản trị</span>
                </button>
              </div>

              {activeTab === 'guest' && (
                <div className="space-y-4">
                  {/* Discord Quick Account Switcher (Saved Accounts) */}
                  {savedAccounts.length > 0 && (
                    <div className={`p-3 rounded-lg border space-y-2 ${discordSubPanelBg}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${discordLabelClass}`}>
                          <Users className="w-3.5 h-3.5 text-[#5865F2]" />
                          <span>Chọn nhanh tài khoản đã lưu</span>
                        </span>
                        <span className={`text-[11px] tabular-nums ${discordMutedClass}`}>
                          {savedAccounts.length} tài khoản
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {savedAccounts.map((acc) => (
                          <div
                            key={acc.id}
                            onClick={() => handleQuickLoginAccount(acc)}
                            className={`px-2.5 py-2 rounded-[4px] flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                              isDark
                                ? 'bg-[#1e1f22] hover:bg-[#35373c]'
                                : 'bg-white hover:bg-slate-50 border border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={
                                  acc.avatar ||
                                  `https://api.dicebear.com/7.x/${acc.role === 'teacher' ? 'personas' : 'avataaars'}/svg?seed=${encodeURIComponent(acc.name)}`
                                }
                                alt={acc.name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0 text-left">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-[#060607]'}`}>
                                    {acc.name}
                                  </span>
                                  <span className={`text-[11px] ${discordMutedClass}`}>
                                    · {acc.role === 'teacher' ? 'Thầy/Cô' : 'Học sinh'}
                                    {acc.role === 'student' && acc.studentClass ? ` · Lớp ${acc.studentClass}` : ''}
                                    {acc.role === 'teacher' && acc.teachingSubject ? ` · ${acc.teachingSubject}` : ''}
                                  </span>
                                </div>
                                <p className={`text-[11px] font-mono truncate ${discordMutedClass}`}>
                                  {acc.email || acc.id}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-2.5 py-1 rounded-[3px] bg-[#5865F2] text-white text-[11px] font-semibold whitespace-nowrap">
                                Đăng nhập
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleRemoveSavedAccount(acc.id, e)}
                                className={`p-1 rounded-[3px] transition-colors cursor-pointer ${
                                  isDark
                                    ? 'text-[#949ba4] hover:text-[#f23f42] hover:bg-[#f23f42]/10'
                                    : 'text-[#5c5e66] hover:text-[#da373c] hover:bg-rose-50'
                                }`}
                                title="Xóa khỏi danh sách gợi ý"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleGuestLogin();
                    }}
                    className="space-y-4"
                  >
                    {role === 'student' ? (
                      <div className="space-y-3.5 text-left">
                        <div>
                          <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                            Họ và tên <span className="text-[#f23f42]">*</span>
                          </label>
                          <div className="relative">
                            <User className={`w-4 h-4 absolute left-3 top-3 ${discordMutedClass}`} />
                            <input
                              type="text"
                              required
                              autoFocus
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="VD: Nguyễn Minh Anh"
                              className={`w-full pl-9 pr-3 py-2.5 rounded-[4px] text-sm font-medium outline-none transition-colors ${discordInputClass}`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                            Email hoặc tên tài khoản
                          </label>
                          <div className="relative">
                            <Mail className={`w-4 h-4 absolute left-3 top-3 ${discordMutedClass}`} />
                            <input
                              type="text"
                              value={studentAccount}
                              onChange={(e) => setStudentAccount(e.target.value)}
                              placeholder={`${
                                name.trim()
                                  ? name
                                      .trim()
                                      .toLowerCase()
                                      .normalize('NFD')
                                      .replace(/[\u0300-\u036f]/g, '')
                                      .replace(/[^a-z0-9]/g, '') || 'hocsinh'
                                  : 'nguyenminhanh'
                              }@max10.edu.vn`}
                              className={`w-full pl-9 pr-3 py-2.5 rounded-[4px] text-sm font-mono outline-none transition-colors ${discordInputClass}`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                            Lớp đang theo học
                          </label>
                          <select
                            value={studentClass}
                            onChange={(e) => setStudentClass(e.target.value as ClassCode | '')}
                            className={`w-full px-3 py-2.5 rounded-[4px] text-xs font-semibold outline-none transition-colors ${discordInputClass}`}
                          >
                            <option value="">
                              {activeClassCodes.length > 0
                                ? '-- Chọn lớp đang theo học --'
                                : '-- Tự học (chưa chọn lớp) --'}
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
                            <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                              Giới tính
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setAuthGender('male')}
                                className={`py-2 px-3 rounded-[4px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                  authGender === 'male'
                                    ? 'bg-[#5865F2] text-white'
                                    : isDark
                                    ? 'bg-[#1e1f22] text-[#dbdee1] hover:bg-[#35373c]'
                                    : 'bg-[#e3e5e8] text-[#060607] hover:bg-slate-300/70'
                                }`}
                              >
                                <span>Nam</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAuthGender('female')}
                                className={`py-2 px-3 rounded-[4px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                  authGender === 'female'
                                    ? 'bg-[#5865F2] text-white'
                                    : isDark
                                    ? 'bg-[#1e1f22] text-[#dbdee1] hover:bg-[#35373c]'
                                    : 'bg-[#e3e5e8] text-[#060607] hover:bg-slate-300/70'
                                }`}
                              >
                                <span>Nữ</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                              Ngày sinh
                            </label>
                            <input
                              type="date"
                              value={authDob}
                              onChange={(e) => setAuthDob(e.target.value)}
                              className={`w-full px-3 py-2 rounded-[4px] text-xs font-semibold outline-none transition-colors ${discordInputClass}`}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* PORTAL GIÁO VIÊN TRONG GIAO DIỆN DISCORD */
                      <div className={`p-4 rounded-lg border space-y-3.5 text-left ${discordSubPanelBg}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                              Danh xưng
                            </label>
                            <div className="grid grid-cols-2 gap-1">
                              {(['Cô', 'Thầy'] as const).map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setTeacherTitle(t)}
                                  className={`py-2 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                                    teacherTitle === t
                                      ? 'bg-[#5865F2] text-white'
                                      : isDark
                                      ? 'bg-[#1e1f22] text-[#b5bac1] hover:text-white'
                                      : 'bg-white text-[#060607] border border-slate-200'
                                  }`}
                                >
                                  {t} giáo
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                              Họ và tên Giáo viên <span className="text-[#f23f42]">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              autoFocus
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="VD: Nguyễn Thị Minh Thu"
                              className={`w-full px-3 py-2 rounded-[4px] text-sm font-medium outline-none transition-colors ${discordInputClass}`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                              Trường THCS
                            </label>
                            <input
                              type="text"
                              value={schoolName}
                              onChange={(e) => setSchoolName(e.target.value)}
                              placeholder="THCS Nguyễn Du"
                              className={`w-full px-3 py-2 rounded-[4px] text-xs font-medium outline-none ${discordInputClass}`}
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                              SĐT liên hệ
                            </label>
                            <input
                              type="tel"
                              value={teacherPhone}
                              onChange={(e) => setTeacherPhone(e.target.value)}
                              placeholder="09xx xxx xxx"
                              className={`w-full px-3 py-2 rounded-[4px] text-xs font-medium outline-none ${discordInputClass}`}
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                              Email Giáo viên
                            </label>
                            <input
                              type="text"
                              value={teacherEmail}
                              onChange={(e) => setTeacherEmail(e.target.value)}
                              placeholder="giaovien@max10.edu.vn"
                              className={`w-full px-3 py-2 rounded-[4px] text-xs font-mono outline-none ${discordInputClass}`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                            Vai trò phụ trách
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                            {[
                              { id: 'subject' as const, label: 'GV Bộ môn', sub: 'Dạy & ra đề' },
                              { id: 'homeroom' as const, label: 'GV Chủ nhiệm', sub: 'Quản lý lớp' },
                              { id: 'both' as const, label: 'Bộ môn & CN', sub: 'Toàn quyền' },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setTeacherRoleType(opt.id)}
                                className={`p-2 rounded-[4px] text-left transition-colors cursor-pointer ${
                                  teacherRoleType === opt.id
                                    ? 'bg-[#5865F2] text-white'
                                    : isDark
                                    ? 'bg-[#1e1f22] text-[#dbdee1] hover:bg-[#35373c]'
                                    : 'bg-white text-[#060607] border border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="text-xs font-semibold leading-tight">{opt.label}</div>
                                <div className={`text-[11px] mt-0.5 ${teacherRoleType === opt.id ? 'text-white/80' : discordMutedClass}`}>
                                  {opt.sub}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(teacherRoleType === 'subject' || teacherRoleType === 'both') && (
                            <div>
                              <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                                Bộ môn giảng dạy
                              </label>
                              <select
                                value={teachingSubject}
                                onChange={(e) => setTeachingSubject(e.target.value)}
                                className={`w-full px-3 py-2 rounded-[4px] text-xs font-semibold outline-none ${discordInputClass}`}
                              >
                                {SUBJECT_LIST.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {(teacherRoleType === 'homeroom' || teacherRoleType === 'both') && (
                            <div>
                              <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                                Lớp Chủ Nhiệm
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
                                className={`w-full px-3 py-2 rounded-[4px] text-xs font-semibold outline-none ${discordInputClass}`}
                              >
                                {ALL_CLASSES_LIST.map((c) => (
                                  <option key={c} value={c}>Lớp {c}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {(teacherRoleType === 'subject' || teacherRoleType === 'both') && (
                          <div>
                            <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                              Các lớp giảng dạy (6A1 - 9D6)
                            </label>
                            <div className="grid grid-cols-6 gap-1">
                              {ALL_CLASSES_LIST.map((c) => {
                                const active = teachingClasses.includes(c) || (teacherRoleType === 'both' && homeroomClass === c);
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => toggleTeachingClass(c)}
                                    className={`py-1.5 rounded-[4px] text-[11px] font-bold transition-colors cursor-pointer ${
                                      active
                                        ? 'bg-[#5865F2] text-white'
                                        : isDark
                                        ? 'bg-[#1e1f22] text-[#b5bac1] hover:bg-[#35373c]'
                                        : 'bg-white border border-slate-200 text-[#060607] hover:border-[#5865F2]'
                                    }`}
                                  >
                                    {c}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <label className="flex items-start gap-2 text-xs cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={teacherVerifiedCommit}
                            onChange={(e) => setTeacherVerifiedCommit(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-[#5865F2] rounded"
                          />
                          <span className={`leading-snug ${discordMutedClass}`}>
                            Tôi xác nhận đăng ký với tư cách <strong className={isDark ? 'text-white' : 'text-[#060607]'}>Giáo viên thật</strong> để mở lớp và quản lý bài tập.
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Discord Blurple Primary Login Button */}
                    <button
                      type="submit"
                      disabled={!name.trim() || loadingProvider !== null}
                      className="w-full h-11 px-4 rounded-[4px] bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3c45a5] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>
                        {loadingProvider === 'guest'
                          ? 'Đang đăng nhập...'
                          : role === 'teacher'
                          ? 'Đăng nhập & Mở lớp Giáo viên'
                          : 'Đăng nhập'}
                      </span>
                    </button>

                    {/* Discord-style Bottom Helper Link */}
                    <div className={`text-xs pt-0.5 ${discordMutedClass}`}>
                      {role === 'student' ? (
                        <>
                          <span>Bạn là Giáo viên? </span>
                          <button
                            type="button"
                            onClick={() => {
                              setRole('teacher');
                              setNotification('');
                            }}
                            className="text-[#00a8fc] hover:underline font-medium cursor-pointer"
                          >
                            Đăng ký hồ sơ Giáo viên
                          </button>
                        </>
                      ) : (
                        <>
                          <span>Bạn là Học sinh? </span>
                          <button
                            type="button"
                            onClick={() => {
                              setRole('student');
                              setNotification('');
                            }}
                            className="text-[#00a8fc] hover:underline font-medium cursor-pointer"
                          >
                            Quay lại cổng Học sinh
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: QUẢN TRỊ VIÊN MẠC KHÁNH DUY (DISCORD STYLE) */}
              {activeTab === 'admin' && (
                <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                  <div className={`p-3 rounded-[4px] border text-xs flex items-start gap-2.5 ${
                    isDark
                      ? 'bg-[#f0b232]/10 border-[#f0b232]/30 text-[#f5d07a]'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <Crown className="w-4 h-4 text-[#f0b232] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Cổng xác thực dành riêng cho <strong>Mạc Khánh Duy</strong> (<code className="font-mono">{ADMIN_EMAIL}</code>).
                    </p>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                      Tên Quản trị viên <span className="text-[#f23f42]">*</span>
                    </label>
                    <div className="relative">
                      <User className={`w-4 h-4 absolute left-3 top-3 ${discordMutedClass}`} />
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => {
                          setAdminName(e.target.value);
                          setNotification('');
                        }}
                        placeholder="Mạc Khánh Duy"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-[4px] text-sm font-medium outline-none transition-colors ${discordInputClass}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${discordLabelClass}`}>
                      Mã PIN xác thực <span className="text-[#f23f42]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className={`w-4 h-4 absolute left-3 top-3 ${discordMutedClass}`} />
                      <input
                        type={showAdminPin ? 'text' : 'password'}
                        required
                        autoFocus
                        value={adminPin}
                        onChange={(e) => {
                          setAdminPin(e.target.value);
                          setNotification('');
                        }}
                        placeholder="Nhập mã PIN xác thực..."
                        className={`w-full pl-9 pr-10 py-2.5 rounded-[4px] text-sm font-mono tracking-wider outline-none transition-colors ${discordInputClass}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPin((v) => !v)}
                        className={`absolute right-2.5 top-2.5 p-1 rounded cursor-pointer ${discordMutedClass} hover:text-white`}
                        aria-label={showAdminPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                      >
                        {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!adminPin.trim()}
                    className="w-full h-11 px-4 rounded-[4px] bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Đăng nhập Quản trị viên</span>
                  </button>

                  <div className={`text-xs ${discordMutedClass}`}>
                    <span>Không phải quản trị viên? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('guest');
                        setNotification('');
                      }}
                      className="text-[#00a8fc] hover:underline font-medium cursor-pointer"
                    >
                      Quay lại đăng nhập Học sinh
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
