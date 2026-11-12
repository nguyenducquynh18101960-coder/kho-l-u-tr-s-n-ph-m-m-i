export type GenderType = 'male' | 'female' | 'other';

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: 'chibi' | 'study' | 'cute' | 'pro';
  gender: 'male' | 'female' | 'unisex';
}

export const PRESET_AVATARS: AvatarPreset[] = [
  // ================= Nam sinh (Male) =================
  {
    id: 'av-boy-1',
    name: 'Nam sinh năng động',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    category: 'study',
    gender: 'male',
  },
  {
    id: 'av-boy-2',
    name: 'Thủ khoa Toán nam',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    category: 'study',
    gender: 'male',
  },
  {
    id: 'av-boy-3',
    name: 'Nam sinh sáng tạo',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    category: 'pro',
    gender: 'male',
  },
  {
    id: 'av-boy-4',
    name: 'Nam sinh kính cận chăm học',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    category: 'study',
    gender: 'male',
  },
  {
    id: 'av-boy-5',
    name: 'Nam sinh công nghệ',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    category: 'pro',
    gender: 'male',
  },
  {
    id: 'av-boy-chibi',
    name: 'Cậu bé Chibi thông thái',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Max10Boy&backgroundColor=b6e3f4',
    category: 'chibi',
    gender: 'male',
  },

  // ================= Nữ sinh (Female) =================
  {
    id: 'av-girl-1',
    name: 'Nữ sinh chăm chỉ',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    category: 'study',
    gender: 'female',
  },
  {
    id: 'av-girl-2',
    name: 'Cô bạn tích cực',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    category: 'study',
    gender: 'female',
  },
  {
    id: 'av-girl-3',
    name: 'Học sinh chuyên Văn',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    category: 'study',
    gender: 'female',
  },
  {
    id: 'av-girl-4',
    name: 'Nữ sinh tươi cười',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    category: 'study',
    gender: 'female',
  },
  {
    id: 'av-girl-5',
    name: 'Thủ khoa nữ xuất sắc',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    category: 'pro',
    gender: 'female',
  },
  {
    id: 'av-girl-chibi',
    name: 'Cô bé Chibi đáng yêu',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Max10Girl&backgroundColor=ffd5dc',
    category: 'chibi',
    gender: 'female',
  },

  // ================= Đồ vật / Mascot / Unisex =================
  {
    id: 'av-chibi-spark',
    name: 'Robot Trí tuệ Max10',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Max10Bot&backgroundColor=c0aede',
    category: 'chibi',
    gender: 'unisex',
  },
  {
    id: 'av-chibi-owl',
    name: 'Cú vọ thông thái',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ScholarOwl&backgroundColor=d1d4f9',
    category: 'chibi',
    gender: 'unisex',
  },
  {
    id: 'av-chibi-cat',
    name: 'Mèo Chibi chăm học',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Max10Cat&backgroundColor=b6e3f4',
    category: 'chibi',
    gender: 'unisex',
  },
  {
    id: 'av-chibi-star',
    name: 'Ngôi sao Điểm 10',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=StarStudent&backgroundColor=ffe4e6',
    category: 'chibi',
    gender: 'unisex',
  },
];

export const STORAGE_KEY_USER_AVATAR = 'max10_user_avatar_v1';
export const STORAGE_KEY_USER_GENDER = 'max10_user_gender_v1';
