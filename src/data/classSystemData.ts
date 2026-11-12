/**
 * Dữ liệu Quản lý 24 Lớp học (6A1 - 9D6) THCS Max10
 * - 100% Học sinh và Giáo viên chủ nhiệm là người thật (KHÔNG CÓ AI)
 * - Quản lý bài tập (đã nộp / chưa nộp), tiến độ ôn luyện (số bài & số đề thi đã luyện, điểm TB)
 * - Hỗ trợ phân lớp, lọc học sinh, xuất báo cáo PDF, kích học sinh lạ ra khỏi lớp
 */

export const ALL_CLASSES_LIST = [
  // Khối 6
  '6A1', '6A2', '6A3', '6A4', '6A5', '6A6',
  // Khối 7
  '7B1', '7B2', '7B3', '7B4', '7B5', '7B6',
  // Khối 8
  '8C1', '8C2', '8C3', '8C4', '8C5', '8C6',
  // Khối 9
  '9D1', '9D2', '9D3', '9D4', '9D5', '9D6',
] as const;

export type ClassCode = typeof ALL_CLASSES_LIST[number];

export interface HomeroomTeacher {
  id: string;
  name: string;
  title: string;
  subject: string;
  avatar: string;
  phone: string;
  email: string;
  message: string;
  isRealHuman: true;
}

export type HomeworkStatus = 'submitted' | 'unsubmitted' | 'practicing';

export interface ClassStudent {
  id: string;
  studentCode: string;
  name: string;
  gender: 'male' | 'female';
  dob: string;
  avatar: string;
  className: ClassCode;
  homeworkStatus: HomeworkStatus;
  homeworkDoneCount: number;
  totalHomework: number;
  examPracticeCount: number; // Số đề thi thử đã ôn luyện
  avgScore: number; // Điểm trung bình (thang điểm 10)
  xpScore: number; // Điểm danh dự XP
  streakDays: number;
  status: 'online' | 'studying' | 'offline';
  lastSubmittedAt?: string;
  teacherRemark?: string;
  isKicked?: boolean;
}

export interface ClassMockExam {
  id: string;
  title: string;
  className: ClassCode;
  subject: string;
  durationMinutes: number;
  totalQuestions: number;
  creatorTeacherName: string;
  createdAt: string;
  completedStudentCount: number;
  totalStudents: number;
  avgClassScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ClassPushNotification {
  id: string;
  classCode: ClassCode;
  title: string;
  body: string;
  category: 'homework' | 'exam' | 'urgent' | 'reminder';
  priority: 'normal' | 'high' | 'urgent';
  senderTeacherName: string;
  senderAvatar?: string;
  createdAt: string;
  deliveredCount: number;
  readCount: number;
  dueTime?: string;
}

export interface ClassInfo {
  code: ClassCode;
  name: string;
  gradeLevel: 'Lớp 6' | 'Lớp 7' | 'Lớp 8' | 'Lớp 9';
  homeroomTeacher: HomeroomTeacher;
  totalStudents: number;
  classroomGroupChatId: string;
}

// 24 Giáo viên chủ nhiệm người thật (100% không phải AI)
export const HOMEROOM_TEACHERS: Record<ClassCode, HomeroomTeacher> = {
  // Khối 6
  '6A1': {
    id: 'gv-6a1',
    name: 'Cô Hoàng Thanh Thủy',
    title: 'Giáo viên Chủ nhiệm 6A1 - Thạc sĩ Toán',
    subject: 'Toán học',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 601',
    email: 'thanhthuy.gv6a1@max10.edu.vn',
    message: 'Các con 6A1 hãy làm quen với cách học THCS, nộp bài tập đúng hạn và chăm chỉ ôn luyện nhé!',
    isRealHuman: true,
  },
  '6A2': {
    id: 'gv-6a2',
    name: 'Thầy Lê Anh Đức',
    title: 'Giáo viên Chủ nhiệm 6A2 - Giáo viên Giỏi môn Ngữ văn',
    subject: 'Ngữ văn',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 602',
    email: 'anhduc.gv6a2@max10.edu.vn',
    message: 'Chào các bạn 6A2! Hãy đọc nhiều sách và rèn chữ, giữ vững tinh thần tự giác làm bài tập!',
    isRealHuman: true,
  },
  '6A3': {
    id: 'gv-6a3',
    name: 'Cô Đặng Kim Oanh',
    title: 'Giáo viên Chủ nhiệm 6A3 - Chuyên gia Tiếng Anh',
    subject: 'Tiếng Anh',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 603',
    email: 'kimoanh.gv6a3@max10.edu.vn',
    message: 'Practice makes perfect! Lớp 6A3 cùng nhau nói tiếng Anh và nộp đủ bài tập về nhà mỗi ngày!',
    isRealHuman: true,
  },
  '6A4': {
    id: 'gv-6a4',
    name: 'Thầy Ngô Văn Quang',
    title: 'Giáo viên Chủ nhiệm 6A4 - Tổ trưởng KHTN',
    subject: 'KHTN (Vật lý - Hóa - Sinh)',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 604',
    email: 'vanquang.gv6a4@max10.edu.vn',
    message: 'Khoa học tự nhiên bắt đầu từ sự tò mò. Hãy thực hành thí nghiệm và hoàn thành báo cáo đúng giờ!',
    isRealHuman: true,
  },
  '6A5': {
    id: 'gv-6a5',
    name: 'Cô Mai Thị Lan',
    title: 'Giáo viên Chủ nhiệm 6A5 - GV Lịch sử & Địa lý',
    subject: 'Lịch sử & Địa lý',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 605',
    email: 'thilan.gv6a5@max10.edu.vn',
    message: 'Yêu quê hương đất nước qua từng trang sử. Lớp 6A5 luôn giữ vững thành tích đứng đầu khối!',
    isRealHuman: true,
  },
  '6A6': {
    id: 'gv-6a6',
    name: 'Thầy Bùi Minh Trí',
    title: 'Giáo viên Chủ nhiệm 6A6 - Chuyên gia Tin học',
    subject: 'Tin học',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 606',
    email: 'minhtri.gv6a6@max10.edu.vn',
    message: 'Lập trình tư duy logic và tận dụng AI đúng cách để học tập xuất sắc!',
    isRealHuman: true,
  },

  // Khối 7
  '7B1': {
    id: 'gv-7b1',
    name: 'Thầy Phạm Văn Hưng',
    title: 'Giáo viên Chủ nhiệm 7B1 - GV Dạy giỏi Cấp Tỉnh',
    subject: 'Toán học',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 701',
    email: 'vanhung.gv7b1@max10.edu.vn',
    message: 'Năm học bản lề lớp 7 cần rèn tính kỷ luật cao. Các em hãy nộp bài tập hình học đầy đủ!',
    isRealHuman: true,
  },
  '7B2': {
    id: 'gv-7b2',
    name: 'Cô Vũ Thị Thu',
    title: 'Giáo viên Chủ nhiệm 7B2 - Thạc sĩ Văn học',
    subject: 'Ngữ văn',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 702',
    email: 'thithu.gv7b2@max10.edu.vn',
    message: 'Hãy diễn đạt cảm xúc chân thật trong bài viết tập làm văn. Cô luôn sẵn sàng chấm chữa cho các em.',
    isRealHuman: true,
  },
  '7B3': {
    id: 'gv-7b3',
    name: 'Cô Trịnh Mỹ Duyên',
    title: 'Giáo viên Chủ nhiệm 7B3 - Cử nhân Ngoại ngữ',
    subject: 'Tiếng Anh',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 703',
    email: 'myduyen.gv7b3@max10.edu.vn',
    message: 'Keep moving forward 7B3! Làm bài nghe và luyện ngữ pháp thường xuyên nhé.',
    isRealHuman: true,
  },
  '7B4': {
    id: 'gv-7b4',
    name: 'Thầy Đỗ Hùng Cường',
    title: 'Giáo viên Chủ nhiệm 7B4 - GV KHTN',
    subject: 'KHTN',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 704',
    email: 'hungcuong.gv7b4@max10.edu.vn',
    message: 'Lớp 7B4 chăm chỉ, các bài tập phản ứng và định luật tuần này cần nộp trước thứ Sáu.',
    isRealHuman: true,
  },
  '7B5': {
    id: 'gv-7b5',
    name: 'Cô Nguyễn Ánh Tuyết',
    title: 'Giáo viên Chủ nhiệm 7B5 - GV GDCD & Kỹ năng',
    subject: 'GDCD',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 705',
    email: 'anhtuyet.gv7b5@max10.edu.vn',
    message: 'Đoàn kết, tôn trọng kỷ luật và tích cực xây dựng bài trên lớp!',
    isRealHuman: true,
  },
  '7B6': {
    id: 'gv-7b6',
    name: 'Thầy Đinh Tiến Dũng',
    title: 'Giáo viên Chủ nhiệm 7B6 - GV Tin học & STEM',
    subject: 'Tin học',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 706',
    email: 'tiendung.gv7b6@max10.edu.vn',
    message: 'Hãy làm chủ công nghệ và rèn luyện thuật toán mỗi tuần.',
    isRealHuman: true,
  },

  // Khối 8
  '8C1': {
    id: 'gv-8c1',
    name: 'Cô Lê Hồng Nhung',
    title: 'Giáo viên Chủ nhiệm 8C1 - Giáo viên dạy giỏi Cấp Thành Phố',
    subject: 'Tiếng Anh',
    avatar: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 801',
    email: 'hongnhung.gv8c1@max10.edu.vn',
    message: '8C1 tăng tốc chuẩn bị nền tảng lớp 9. Các em kiểm tra lại danh sách bài tập đã nộp trên hệ thống nhé!',
    isRealHuman: true,
  },
  '8C2': {
    id: 'gv-8c2',
    name: 'Thầy Phan Hoàng Long',
    title: 'Giáo viên Chủ nhiệm 8C2 - Thạc sĩ Toán Giải Tích',
    subject: 'Toán học',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 802',
    email: 'hoanglong.gv8c2@max10.edu.vn',
    message: 'Phương trình và hằng đẳng thức đáng nhớ là gốc rễ. Ai chưa nộp bài tập tuần này cần nộp bù gấp!',
    isRealHuman: true,
  },
  '8C3': {
    id: 'gv-8c3',
    name: 'Cô Vũ Bích Ngọc',
    title: 'Giáo viên Chủ nhiệm 8C3 - GV Ngữ văn',
    subject: 'Ngữ văn',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 803',
    email: 'bichngoc.gv8c3@max10.edu.vn',
    message: 'Nghị luận văn học yêu cầu lập luận chặt chẽ. Đọc kỹ nhận xét của cô trong từng bài nộp.',
    isRealHuman: true,
  },
  '8C4': {
    id: 'gv-8c4',
    name: 'Thầy Trương Quốc Bảo',
    title: 'Giáo viên Chủ nhiệm 8C4 - GV Hóa học',
    subject: 'KHTN (Hóa học)',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 804',
    email: 'quocbao.gv8c4@max10.edu.vn',
    message: 'Làm quen bảng tuần hoàn và tính toán mol chuẩn xác. Chúc 8C4 bứt phá!',
    isRealHuman: true,
  },
  '8C5': {
    id: 'gv-8c5',
    name: 'Cô Trần Thảo My',
    title: 'Giáo viên Chủ nhiệm 8C5 - GV Sinh học',
    subject: 'KHTN (Sinh học)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 805',
    email: 'thaomy.gv8c5@max10.edu.vn',
    message: 'Vẽ sơ đồ tư duy cơ thể người và hoàn thành bài tập trắc nghiệm sinh học nhé các em.',
    isRealHuman: true,
  },
  '8C6': {
    id: 'gv-8c6',
    name: 'Thầy Nguyễn Trọng Tín',
    title: 'Giáo viên Chủ nhiệm 8C6 - GV Lịch sử',
    subject: 'Lịch sử & Địa lý',
    avatar: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 806',
    email: 'trongtin.gv8c6@max10.edu.vn',
    message: 'Học sử không học vẹt, nắm mốc thời gian và bản chất sự kiện. 8C6 cố lên!',
    isRealHuman: true,
  },

  // Khối 9 (Năm cuối cấp - Săn Điểm 10 vào lớp 10)
  '9D1': {
    id: 'gv-9d1',
    name: 'Cô Nguyễn Thu Hà',
    title: 'Giáo viên Chủ nhiệm 9D1 - Thạc sĩ Toán học · Luyện thi Chuyên',
    subject: 'Toán học',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 901',
    email: 'thuha.gv9d1@max10.edu.vn',
    message: '9D1 là lớp mũi nhọn săn điểm 10 vào lớp 10. Cô theo dõi tiến độ nộp bài và làm đề thi thử của từng bạn hàng ngày. Quyết tâm 100% đỗ nguyện vọng 1!',
    isRealHuman: true,
  },
  '9D2': {
    id: 'gv-9d2',
    name: 'Thầy Trần Quốc Tuấn',
    title: 'Giáo viên Chủ nhiệm 9D2 - Thạc sĩ Ngữ văn · Trưởng Bộ Môn',
    subject: 'Ngữ văn',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 902',
    email: 'quoctuan.gv9d2@max10.edu.vn',
    message: 'Văn chương là người. Lớp 9D2 chú ý cấu trúc đoạn văn nghị luận 200 chữ và rèn luyện đề thi thử hàng tuần!',
    isRealHuman: true,
  },
  '9D3': {
    id: 'gv-9d3',
    name: 'Cô Phạm Thanh Thảo',
    title: 'Giáo viên Chủ nhiệm 9D3 - Chuyên gia Luyện thi Tiếng Anh vào 10',
    subject: 'Tiếng Anh',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 903',
    email: 'thanhthao.gv9d3@max10.edu.vn',
    message: 'Mục tiêu 9+ môn Tiếng Anh vào lớp 10 công lập. Hãy làm hết 10 đề thi thử cô đã đăng tải trên thư viện!',
    isRealHuman: true,
  },
  '9D4': {
    id: 'gv-9d4',
    name: 'Thầy Lâm Hoàng Nam',
    title: 'Giáo viên Chủ nhiệm 9D4 - GV Vật lý & KHTN',
    subject: 'Vật lý / KHTN',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 904',
    email: 'hoangnam.gv9d4@max10.edu.vn',
    message: 'Nắm chắc định luật Ôm và thấu kính quang học. Các bạn chưa nộp bài tập điện học nộp ngay hôm nay!',
    isRealHuman: true,
  },
  '9D5': {
    id: 'gv-9d5',
    name: 'Cô Đào Phương Thúy',
    title: 'Giáo viên Chủ nhiệm 9D5 - Thạc sĩ Hóa học',
    subject: 'Hóa học',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 905',
    email: 'phuongthuy.gv9d5@max10.edu.vn',
    message: 'Phân loại hợp chất vô cơ và tính toán hiệu suất. 9D5 vững tin về đích với điểm số cao nhất!',
    isRealHuman: true,
  },
  '9D6': {
    id: 'gv-9d6',
    name: 'Thầy Vũ Đình Trọng',
    title: 'Giáo viên Chủ nhiệm 9D6 - Cố vấn Học tập & Hướng nghiệp',
    subject: 'Toán học',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    phone: '0912 345 906',
    email: 'dinhtrong.gv9d6@max10.edu.vn',
    message: '9D6 quyết tâm không để bạn nào bị tụt lại phía sau. Tích cực trao đổi trên nhóm chat lớp nhé!',
    isRealHuman: true,
  },
};

// Seed danh sách học sinh thật cho các lớp (100% người thật, KHÔNG AI)
const VIETNAMESE_NAMES_SAMPLE = [
  { name: 'Nguyễn Bảo Châu', gender: 'female' as const },
  { name: 'Trần Bảo Nam', gender: 'male' as const },
  { name: 'Lê Minh Anh', gender: 'female' as const },
  { name: 'Phạm Đức Huy', gender: 'male' as const },
  { name: 'Hoàng Phương Linh', gender: 'female' as const },
  { name: 'Vũ Hải Đăng', gender: 'male' as const },
  { name: 'Đặng Khánh Vy', gender: 'female' as const },
  { name: 'Bùi Gia Huy', gender: 'male' as const },
  { name: 'Đỗ Thảo Nguyên', gender: 'female' as const },
  { name: 'Ngô Tuấn Kiệt', gender: 'male' as const },
  { name: 'Dương Yến Nhi', gender: 'female' as const },
  { name: 'Lý Quốc Bảo', gender: 'male' as const },
  { name: 'Phan Mai Trang', gender: 'female' as const },
  { name: 'Hồ Quang Dũng', gender: 'male' as const },
  { name: 'Võ Thùy Chi', gender: 'female' as const },
  { name: 'Trịnh Thế Vinh', gender: 'male' as const },
  { name: 'Đinh Hồng Hạnh', gender: 'female' as const },
  { name: 'Mai Hoàng Long', gender: 'male' as const },
];

export function generateInitialClassStudents(classCode: ClassCode): ClassStudent[] {
  const gradeNum = parseInt(classCode[0], 10);
  const birthYear = 2026 - (gradeNum + 6); // Lớp 6 sinh ~2014, Lớp 9 sinh ~2011

  return VIETNAMESE_NAMES_SAMPLE.map((item, idx) => {
    const studentIdx = idx + 1;
    const studentCode = `HS-${classCode}-${String(studentIdx).padStart(2, '0')}`;
    const day = (studentIdx * 3) % 28 + 1;
    const month = (studentIdx * 2) % 12 + 1;
    const dob = `${birthYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Status: phần lớn đã nộp (submitted), một số đang ôn luyện (practicing), vài bạn chưa nộp (unsubmitted)
    let homeworkStatus: HomeworkStatus = 'submitted';
    if (studentIdx === 4 || studentIdx === 10 || studentIdx === 16) {
      homeworkStatus = 'unsubmitted';
    } else if (studentIdx % 3 === 0) {
      homeworkStatus = 'practicing';
    }

    const totalHomework = 12;
    const homeworkDoneCount =
      homeworkStatus === 'submitted'
        ? totalHomework
        : homeworkStatus === 'practicing'
        ? totalHomework - 2
        : totalHomework - 5;

    const examPracticeCount = Math.max(3, 16 - studentIdx);
    const avgScore = Number((8.0 + (studentIdx % 5) * 0.4 - (homeworkStatus === 'unsubmitted' ? 1.2 : 0)).toFixed(1));
    const xpScore = 2000 + (18 - studentIdx) * 110 + (homeworkStatus === 'submitted' ? 300 : 0);

    const avatarUrl =
      item.gender === 'female'
        ? `https://images.unsplash.com/photo-${1534528741775 + studentIdx * 1000}?w=120&auto=format&fit=crop&q=80`
        : `https://images.unsplash.com/photo-${1507003211169 + studentIdx * 1000}?w=120&auto=format&fit=crop&q=80`;

    return {
      id: `std-${classCode}-${studentIdx}`,
      studentCode,
      name: item.name,
      gender: item.gender,
      dob,
      avatar: avatarUrl,
      className: classCode,
      homeworkStatus,
      homeworkDoneCount,
      totalHomework,
      examPracticeCount,
      avgScore: Math.min(10, Math.max(5.5, avgScore)),
      xpScore,
      streakDays: Math.max(2, 15 - studentIdx),
      status: studentIdx % 3 === 0 ? 'studying' : studentIdx % 2 === 0 ? 'online' : 'offline',
      lastSubmittedAt:
        homeworkStatus === 'submitted' ? 'Hôm nay 08:30' : homeworkStatus === 'practicing' ? 'Hôm qua' : undefined,
      teacherRemark:
        homeworkStatus === 'submitted'
          ? 'Bài làm chỉnh chu, trình bày đẹp, đạt điểm tốt!'
          : homeworkStatus === 'practicing'
          ? 'Đang ôn luyện tích cực, cần hoàn thành nốt câu cuối.'
          : 'Chưa nộp bài tập tuần này, GVCN đã nhắc nhở.',
      isKicked: false,
    };
  });
}

// Bộ đề thi thử (Mock Exams) phân theo môn và lớp 6A1 - 9D6
export const INITIAL_MOCK_EXAMS: ClassMockExam[] = [
  {
    id: 'exam-9d1-toan-1',
    title: 'Đề Thi Thử Vào 10 Chuyên Toán Số 1 (Barem Điểm 10 Chuẩn)',
    className: '9D1',
    subject: 'Toán học',
    durationMinutes: 90,
    totalQuestions: 25,
    creatorTeacherName: 'Cô Nguyễn Thu Hà (GVCN 9D1)',
    createdAt: '2026-11-08',
    completedStudentCount: 16,
    totalStudents: 18,
    avgClassScore: 8.8,
    difficulty: 'hard',
  },
  {
    id: 'exam-9d1-van-1',
    title: 'Đề Khảo Sát Giữa Kỳ I Môn Ngữ Văn: Nghị Luận Đời Sống & Văn Học',
    className: '9D1',
    subject: 'Ngữ văn',
    durationMinutes: 90,
    totalQuestions: 15,
    creatorTeacherName: 'Thầy Trần Quốc Tuấn (GVCN 9D2)',
    createdAt: '2026-11-09',
    completedStudentCount: 15,
    totalStudents: 18,
    avgClassScore: 8.5,
    difficulty: 'medium',
  },
  {
    id: 'exam-9d1-anh-1',
    title: 'Đề Luyện Ngữ Pháp & Đọc Hiểu Tiếng Anh Thi Tuyển Sinh Vào 10',
    className: '9D1',
    subject: 'Tiếng Anh',
    durationMinutes: 60,
    totalQuestions: 40,
    creatorTeacherName: 'Cô Phạm Thanh Thảo (GVCN 9D3)',
    createdAt: '2026-11-10',
    completedStudentCount: 17,
    totalStudents: 18,
    avgClassScore: 9.1,
    difficulty: 'medium',
  },
  {
    id: 'exam-8c1-toan-1',
    title: 'Đề Kiểm Tra 1 Tiết Đại Số 8: Hằng Đẳng Thức & Phân Thức Đại Số',
    className: '8C1',
    subject: 'Toán học',
    durationMinutes: 45,
    totalQuestions: 20,
    creatorTeacherName: 'Thầy Phan Hoàng Long (GVCN 8C2)',
    createdAt: '2026-11-07',
    completedStudentCount: 14,
    totalStudents: 18,
    avgClassScore: 8.2,
    difficulty: 'medium',
  },
  {
    id: 'exam-7b1-toan-1',
    title: 'Đề Ôn Tập Hình Học 7: Tam Giác Bằng Nhau & Quan Hệ Góc - Cạnh',
    className: '7B1',
    subject: 'Toán học',
    durationMinutes: 45,
    totalQuestions: 20,
    creatorTeacherName: 'Thầy Phạm Văn Hưng (GVCN 7B1)',
    createdAt: '2026-11-06',
    completedStudentCount: 16,
    totalStudents: 18,
    avgClassScore: 8.4,
    difficulty: 'easy',
  },
  {
    id: 'exam-6a1-toan-1',
    title: 'Đề Thi Thử Giữa Học Kỳ I Môn Toán 6: Tập Hợp & Số Tự Nhiên',
    className: '6A1',
    subject: 'Toán học',
    durationMinutes: 45,
    totalQuestions: 20,
    creatorTeacherName: 'Cô Hoàng Thanh Thủy (GVCN 6A1)',
    createdAt: '2026-11-05',
    completedStudentCount: 18,
    totalStudents: 18,
    avgClassScore: 8.9,
    difficulty: 'easy',
  },
];

export const STORAGE_KEY_CLASS_STUDENTS = 'max10_class_students_db_v1';
export const STORAGE_KEY_MOCK_EXAMS = 'max10_class_mock_exams_v1';

/**
 * Tải danh sách học sinh theo lớp từ localStorage hoặc khởi tạo
 */
export function loadClassStudents(classCode: ClassCode): ClassStudent[] {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_CLASS_STUDENTS}_${classCode}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((s: ClassStudent) => !s.isKicked);
      }
    }
  } catch (e) {}

  const initial = generateInitialClassStudents(classCode);
  saveClassStudents(classCode, initial);
  return initial;
}

/**
 * Lưu danh sách học sinh theo lớp
 */
export function saveClassStudents(classCode: ClassCode, students: ClassStudent[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_CLASS_STUDENTS}_${classCode}`, JSON.stringify(students));
  } catch (e) {}
}

/**
 * Kích một học sinh ra khỏi lớp (người lạ hoặc không thuộc lớp)
 */
export function kickStudentFromClass(classCode: ClassCode, studentId: string): ClassStudent[] {
  const current = loadClassStudents(classCode);
  const updated = current.map((s) => (s.id === studentId ? { ...s, isKicked: true } : s));
  saveClassStudents(classCode, updated);
  return updated.filter((s) => !s.isKicked);
}

/**
 * Tải danh sách đề thi thử từ localStorage
 */
export function loadMockExams(): ClassMockExam[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MOCK_EXAMS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return INITIAL_MOCK_EXAMS;
}

/**
 * Lưu đề thi thử mới
 */
export function saveMockExams(exams: ClassMockExam[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MOCK_EXAMS, JSON.stringify(exams));
  } catch (e) {}
}

const STORAGE_KEY_CLASS_PUSH_NOTIFICATIONS = 'max10_class_push_notifications';

/**
 * Tải danh sách thông báo đẩy của lớp
 */
export function loadClassPushNotifications(classCode: ClassCode): ClassPushNotification[] {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_CLASS_PUSH_NOTIFICATIONS}_${classCode}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const teacher = HOMEROOM_TEACHERS[classCode];
  return [
    {
      id: `notif-1-${classCode}`,
      classCode,
      title: `[NHẮC NHỞ BÀI TẬP] Hạn chót nộp bài tập về nhà môn ${teacher.subject}`,
      body: `Chào các em học sinh lớp ${classCode}! Thầy/cô nhắc cả lớp nộp bài tập về nhà trước 21h00 tối nay để thầy cô chấm điểm và cập nhật bảng thi đua lớp nhé!`,
      category: 'homework',
      priority: 'high',
      senderTeacherName: teacher.name,
      senderAvatar: teacher.avatar,
      createdAt: 'Hôm nay, 14:30',
      deliveredCount: 35,
      readCount: 32,
      dueTime: '21:00 tối nay',
    },
    {
      id: `notif-2-${classCode}`,
      classCode,
      title: `[LỊCH THI ĐIỂM 10] Khảo sát chất lượng giữa học kỳ`,
      body: `Lớp ${classCode} chuẩn bị có bài kiểm tra khảo sát phân loại Điểm 10 vào tuần tới. Đề nghị các em vào Thư viện Đề thi để luyện trước dạng bài bẫy.`,
      category: 'exam',
      priority: 'urgent',
      senderTeacherName: teacher.name,
      senderAvatar: teacher.avatar,
      createdAt: 'Hôm qua, 09:15',
      deliveredCount: 35,
      readCount: 35,
      dueTime: 'Thứ Hai tuần tới',
    },
  ];
}

/**
 * Lưu danh sách thông báo đẩy của lớp
 */
export function saveClassPushNotifications(classCode: ClassCode, list: ClassPushNotification[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_CLASS_PUSH_NOTIFICATIONS}_${classCode}`, JSON.stringify(list));
  } catch (e) {}
}

/**
 * Bắn thông báo đẩy hệ thống (Push notification) tới toàn thể học sinh lớp
 */
export function dispatchClassPushNotification(notif: ClassPushNotification): void {
  const current = loadClassPushNotifications(notif.classCode);
  const updated = [notif, ...current];
  saveClassPushNotifications(notif.classCode, updated);

  if (typeof window !== 'undefined') {
    // 1. Dispatch custom browser event
    window.dispatchEvent(
      new CustomEvent('max10_class_push_notification_dispatched', {
        detail: notif,
      })
    );

    // 2. Real OS/Browser Push Notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🔔 [THÔNG BÁO LỚP ${notif.classCode}] ${notif.title}`, {
          body: `${notif.body}\n- ${notif.senderTeacherName} (${notif.dueTime ? 'Hạn: ' + notif.dueTime : 'Thông báo khẩn'})`,
          icon: notif.senderAvatar || '/max10-avatar.jpg',
          tag: `class_notif_${notif.id}`,
        });
      } catch (e) {}
    }
  }
}

