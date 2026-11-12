export type AuthProvider = 'google' | 'facebook' | 'email' | 'name' | 'guest' | 'admin';

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
}

export const STORAGE_KEY_AUTH_USER = 'max10_logged_in_user_v1';
export const STORAGE_KEY_USER_PRESENCE = 'max10_user_presence_status';
export const STORAGE_KEY_USER_GENDER = 'max10_user_gender_v1';
export const STORAGE_KEY_USER_DOB = 'max10_user_dob_v1';

// Hằng số nhận diện duy nhất Quản trị viên Max10 AI: Mạc Khánh Duy
export const ADMIN_NAME = 'Mạc Khánh Duy';
export const ADMIN_EMAIL = 'mackhanhduy992012@gmail.com';
export const ADMIN_ID = 'admin-mac-khanh-duy';
export const ADMIN_DEFAULT_PIN = '24122012@';
// Mã bảo mật tối cao chống hack theo yêu cầu của Quản trị viên Mạc Khánh Duy: 24122012@duy
export const MASTER_SECURITY_CODE = '24122012@duy';

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

