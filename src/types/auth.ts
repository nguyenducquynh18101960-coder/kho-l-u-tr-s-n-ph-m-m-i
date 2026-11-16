export type AuthProvider = 'google' | 'facebook' | 'email' | 'name' | 'guest' | 'admin';

export type TeacherRoleType = 'subject' | 'homeroom' | 'both';

export interface UserAccount {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  provider: AuthProvider;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  createdAt: string;
  presenceStatus?: 'online' | 'dnd' | 'gaming' | 'offline';
  plan?: 'free' | 'plus' | 'premium';
  isSuperAdmin?: boolean;
  // Teacher registration & verification fields
  isVerifiedTeacher?: boolean;
  teacherTitle?: 'Cô' | 'Thầy';
  teacherRoleType?: TeacherRoleType; // 'subject' = GV bộ môn, 'homeroom' = GV chủ nhiệm, 'both' = Cả hai
  teachingSubject?: string;
  homeroomClass?: string; // e.g., '9D1'
  teachingClasses?: string[]; // e.g., ['9D1', '9D2']
  schoolName?: string;
  // Student class field
  studentClass?: string;
}

export const STORAGE_KEY_AUTH_USER = 'max10_logged_in_user_v1';
export const STORAGE_KEY_SAVED_ACCOUNTS = 'max10_saved_accounts_v1';
export const STORAGE_KEY_USER_PRESENCE = 'max10_user_presence_status';
export const STORAGE_KEY_USER_GENDER = 'max10_user_gender_v1';
export const STORAGE_KEY_USER_DOB = 'max10_user_dob_v1';

export function loadSavedAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_ACCOUNTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (u: any) =>
        u &&
        u.id &&
        u.name &&
        u.role !== 'admin' &&
        u.id !== 'admin-mac-khanh-duy' &&
        !String(u.id).startsWith('std-') &&
        !String(u.id).startsWith('mock') &&
        !String(u.id).startsWith('fake')
    );
  } catch {
    return [];
  }
}

export function saveAccountToHistory(user: UserAccount): UserAccount[] {
  if (!user || !user.id || user.role === 'admin' || user.id === 'admin-mac-khanh-duy') {
    return loadSavedAccounts();
  }
  try {
    const existing = loadSavedAccounts();
    const filtered = existing.filter(
      (u) => u.id !== user.id && !(user.email && u.email && u.email === user.email && u.role === user.role)
    );
    const updated = [user, ...filtered].slice(0, 20);
    localStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function removeSavedAccount(accountId: string): UserAccount[] {
  try {
    const existing = loadSavedAccounts();
    const updated = existing.filter((u) => u.id !== accountId);
    localStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// Hằng số nhận diện duy nhất Quản trị viên Max10 AI: Mạc Khánh Duy
export const ADMIN_NAME = 'Mạc Khánh Duy';
export const ADMIN_EMAIL = 'mackhanhduy992012@gmail.com';
export const ADMIN_ID = 'admin-mac-khanh-duy';
export const ADMIN_DEFAULT_PIN = 'duykobell123';
// Mã bảo mật tối cao chống hack theo yêu cầu của Quản trị viên Mạc Khánh Duy: duykobell123
export const MASTER_SECURITY_CODE = 'duykobell123';

// User Requirement: "còn ảnh thứ 3 thì reset lại không cho làm quản trị viên cho làm khách"
// Tài khoản đã được reset thành Khách (Guest), không cho làm Quản trị viên
export function isUserAdmin(user: UserAccount | null | undefined, isOwnerFlag?: boolean): boolean {
  try {
    if (typeof window !== 'undefined') {
      const isResetToGuest = localStorage.getItem('max10_admin_reset_to_guest');
      if (isResetToGuest === 'true') {
        return false;
      }
      // If user holds master security session
      const masterVerified = sessionStorage.getItem('max10_master_security_verified');
      if (masterVerified === 'true' && user?.id === ADMIN_ID) {
        return true;
      }
    }
  } catch (e) {}

  if (!user) {
    return false;
  }

  // Nếu vai trò là guest / học sinh thì tuyệt đối là khách
  if (user.provider === 'guest' || user.role === 'student') {
    return false;
  }

  // Quyền quản trị viên chỉ khi role là admin và chưa bị reset thành khách
  return user.role === 'admin' && (user.isSuperAdmin === true || user.email === ADMIN_EMAIL || user.id === ADMIN_ID);
}

