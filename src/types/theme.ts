export type BackgroundMode = 'color' | 'gradient' | 'image';

export interface BackgroundTheme {
  id: string;
  name: string; // Tên gọi đầy đủ, ví dụ: "Xanh Ngọc Dịu Mắt"
  callName: string; // Tên ngắn gọn dễ gọi, ví dụ: "Xanh Dịu Mắt"
  type: BackgroundMode;
  value: string; // Màu hex, chuỗi gradient, hoặc link URL ảnh
  overlayOpacity?: number; // 0 -> 100 (% độ phủ để làm dịu, dễ đọc chữ)
  blur?: number; // 0 -> 20 (px)
  tag: 'Màu sắc' | 'Gradient' | 'Ảnh phong cảnh' | 'Ảnh học tập' | 'Tự chọn';
  description?: string;
  isDarkCompatible?: boolean;
}

export const STORAGE_KEY_BG_THEME = 'max10_custom_background_theme_v1';
export const STORAGE_KEY_VOICE_CALL = 'max10_theme_voice_call_enabled_v1';

export const PRESET_THEMES: BackgroundTheme[] = [
  // Nhóm 1: Phông nền hiện đại & AI Hay
  {
    id: 'ai-hay',
    name: 'Phông Nền AI Hay (Chuẩn Mạng Xã Hội AI Hay)',
    callName: 'AI Hay',
    type: 'gradient',
    value: 'radial-gradient(ellipse at 50% 0%, #ecfdf5 0%, #f7fee7 20%, #f0fdf4 45%, #ffffff 80%)',
    tag: 'Màu sắc',
    description: 'Phong cách mạng xã hội AI Hay: hào quang xanh ngọc bạc hà thanh khiết, tinh tế, dịu mắt, mang hơi thở trí tuệ nhân tạo thế hệ mới.',
    overlayOpacity: 0,
    blur: 0,
    isDarkCompatible: true,
  },
  {
    id: 'white-classic',
    name: 'Trắng Tinh Khôi',
    callName: 'Trắng Tinh Khôi',
    type: 'color',
    value: '#ffffff',
    tag: 'Màu sắc',
    description: 'Phông nền chuẩn sách giáo khoa, thanh thoát, rõ chữ nhất.',
    overlayOpacity: 0,
    blur: 0,
  },
  {
    id: 'sage-green',
    name: 'Xanh Ngọc Dịu Mắt',
    callName: 'Xanh Dịu Mắt',
    type: 'color',
    value: '#f0fdf4',
    tag: 'Màu sắc',
    description: 'Màu xanh lục thảo mộc dịu nhẹ, bảo vệ thị lực khi học bài lâu.',
    overlayOpacity: 0,
    blur: 0,
  },
  {
    id: 'warm-cream',
    name: 'Vàng Kem Ấm Áp',
    callName: 'Vàng Kem',
    type: 'color',
    value: '#fefce8',
    tag: 'Màu sắc',
    description: 'Tông vàng bơ trang giấy cổ điển, ấm cúng, chống lóa mắt.',
    overlayOpacity: 0,
    blur: 0,
  },
  {
    id: 'sky-blue',
    name: 'Bầu Trời Tri Thức',
    callName: 'Bầu Trời',
    type: 'color',
    value: '#f0f9ff',
    tag: 'Màu sắc',
    description: 'Sắc xanh da trời thanh bình, giúp tăng cường khả năng tập trung.',
    overlayOpacity: 0,
    blur: 0,
  },
  {
    id: 'blush-pink',
    name: 'Hồng Phấn Ngọt Ngào',
    callName: 'Hồng Phấn',
    type: 'color',
    value: '#fff1f2',
    tag: 'Màu sắc',
    description: 'Sắc hồng pastel nhẹ nhàng, xua tan căng thẳng thi cử.',
    overlayOpacity: 0,
    blur: 0,
  },
  {
    id: 'lavender-dream',
    name: 'Tím Oải Hương Sáng Tạo',
    callName: 'Tím Oải Hương',
    type: 'color',
    value: '#f5f3ff',
    tag: 'Màu sắc',
    description: 'Tông tím hoa oải hương kích thích trí tưởng tượng và sáng tạo.',
    overlayOpacity: 0,
    blur: 0,
  },

  // Nhóm 2: Gradient màu sắc nghệ thuật
  {
    id: 'gradient-dawn',
    name: 'Rạng Đông Tri Thức',
    callName: 'Rạng Đông',
    type: 'gradient',
    value: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fef3c7 100%)',
    tag: 'Gradient',
    description: 'Ánh nắng ban mai rạng rỡ, tiếp thêm động lực đạt điểm 10.',
    overlayOpacity: 0,
    blur: 0,
  },
  {
    id: 'gradient-mint-peach',
    name: 'Bạc Hà & Đào Tươi',
    callName: 'Bạc Hà',
    type: 'gradient',
    value: 'linear-gradient(135deg, #ecfdf5 0%, #ccfbf1 50%, #ffe4e6 100%)',
    tag: 'Gradient',
    description: 'Sự hòa quyện tươi mát giữa bạc hà mát dịu và đào ngọt ngào.',
    overlayOpacity: 0,
    blur: 0,
  },
  {
    id: 'gradient-aurora',
    name: 'Cực Quang Huyền Diệu',
    callName: 'Cực Quang',
    type: 'gradient',
    value: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 50%, #fce7f3 100%)',
    tag: 'Gradient',
    description: 'Dải màu cầu vồng pastel nhẹ dịu như cực quang bắc cực.',
    overlayOpacity: 0,
    blur: 0,
  },

  // Nhóm 3: Ảnh nền học tập & phong cảnh chill
  {
    id: 'img-study-desk',
    name: 'Góc Bàn Học Ấm Cúng',
    callName: 'Bàn Học Ấm Cúng',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1920&q=80',
    tag: 'Ảnh học tập',
    description: 'Bàn học gỗ với sách vở, tách trà ấm và ánh đèn bàn êm dịu.',
    overlayOpacity: 65,
    blur: 2,
  },
  {
    id: 'img-library',
    name: 'Thư Viện Cổ Điển',
    callName: 'Thư Viện Cổ',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1920&q=80',
    tag: 'Ảnh học tập',
    description: 'Không gian thư viện hàn lâm cổ kính truyền cảm hứng ôn luyện.',
    overlayOpacity: 70,
    blur: 2,
  },
  {
    id: 'img-anime-sky',
    name: 'Bầu Trời Mây Anime',
    callName: 'Mây Anime',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920&q=80',
    tag: 'Ảnh phong cảnh',
    description: 'Bầu trời xanh trong vắt với những đám mây bồng bềnh phong cách anime.',
    overlayOpacity: 60,
    blur: 1,
  },
  {
    id: 'img-cherry-blossom',
    name: 'Hoa Anh Đào Mùa Xuân',
    callName: 'Hoa Anh Đào',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1920&q=80',
    tag: 'Ảnh phong cảnh',
    description: 'Cung đường rợp bóng hoa anh đào nở rộ tinh khôi.',
    overlayOpacity: 65,
    blur: 2,
  },
  {
    id: 'img-starry-cosmos',
    name: 'Vũ Trụ & Ngân Hà Điểm 10',
    callName: 'Vũ Trụ Ngân Hà',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
    tag: 'Ảnh phong cảnh',
    description: 'Bầu trời sao đêm lung linh, mở rộng chân trời tri thức bất tận.',
    overlayOpacity: 70,
    blur: 2,
  },
  {
    id: 'img-rainy-cafe',
    name: 'Quán Cà Phê Mưa Lo-fi',
    callName: 'Cà Phê Mưa',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80',
    tag: 'Ảnh học tập',
    description: 'Góc học bài bên khung cửa kính ngắm mưa rơi bình yên.',
    overlayOpacity: 65,
    blur: 2,
  },
];
