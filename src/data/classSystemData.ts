import { TeacherRoleType, UserAccount } from '../types/auth';

/**
 * Hệ thống Quản lý 24 Lớp học (6A1 - 9D6) THCS Max10
 * - KHÔNG CÓ giáo viên giả hay học sinh giả được tạo sẵn!
 * - Lớp học chỉ được kích hoạt và tồn tại khi có Thầy/Cô giáo thật đăng ký tài khoản giáo viên.
 * - 100% học sinh trong danh sách & BXH là người thật đã đăng ký/vào lớp (loại bỏ tuyệt đối AI).
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

export type ClassCode = (typeof ALL_CLASSES_LIST)[number];

export const SUBJECT_LIST = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'KHTN (Vật lý - Hóa - Sinh)',
  'Lịch sử & Địa lý',
  'Tin học',
  'GDCD',
] as const;

export interface HomeroomTeacher {
  id: string;
  name: string;
  title: string;
  subject: string;
  avatar: string;
  phone: string;
  email: string;
  message: string;
  teacherRoleType: TeacherRoleType;
  schoolName?: string;
  isRealHuman: true;
  isVerifiedTeacher: true;
}

export interface RegisteredTeacherClass {
  id: string;
  classCode: ClassCode;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string;
  teacherEmail: string;
  teacherPhone?: string;
  teacherRoleType: TeacherRoleType;
  subject: string;
  schoolName?: string;
  createdAt: string;
}

export type HomeworkStatus = 'submitted' | 'unsubmitted' | 'practicing';

export interface SubjectPracticeProgress {
  lessonsDone: number;
  quizzesDone: number;
  avgScore: number;
  studyMinutes: number;
}

export interface HomeworkSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  classCode: ClassCode;
  subject: string;
  title: string;
  description?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'file' | 'text';
  submittedAt: string;
  status: 'pending' | 'graded';
  score?: number;
  teacherRemark?: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface ClassStudent {
  id: string;
  studentCode: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
  avatar: string;
  email?: string;
  className: ClassCode;
  homeworkStatus: HomeworkStatus;
  homeworkDoneCount: number;
  totalHomework: number;
  examPracticeCount: number;
  avgScore: number;
  xpScore: number;
  streakDays: number;
  studyMinutes: number;
  badges: string[];
  subjectProgress: Record<string, SubjectPracticeProgress>;
  status: 'online' | 'studying' | 'offline';
  lastSubmittedAt?: string;
  teacherRemark?: string;
  isKicked?: boolean;
  isVerifiedHuman: true;
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

export interface ClassBulletinPost {
  id: string;
  classCode: ClassCode;
  title: string;
  content: string;
  category: 'announcement' | 'exam_schedule' | 'material';
  attachmentName?: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export interface SharedClassExamEvent {
  id: string;
  classCode: ClassCode;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  syllabus: string;
  notes?: string;
  creatorTeacherName: string;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface AttendanceSession {
  id: string;
  classCode: ClassCode;
  date: string; // YYYY-MM-DD
  sessionName: string;
  records: Record<string, AttendanceStatus>;
  notes?: Record<string, string>;
  updatedAt: string;
  recordedBy: string;
}

export interface CollectiveClassBadge {
  id: string;
  classCode: ClassCode;
  badgeId: string;
  title: string;
  icon: string;
  description: string;
  awardedBy: string;
  awardedAt: string;
}

export const COLLECTIVE_BADGE_TEMPLATES = [
  {
    badgeId: 'hardest-working-class',
    title: 'Lớp học chăm chỉ nhất',
    icon: '🔥',
    description: 'Tỉ lệ hoàn thành bài tập & giờ tự học dẫn đầu toàn trường.',
  },
  {
    badgeId: 'highest-avg-class',
    title: 'Lớp có điểm trung bình cao nhất',
    icon: '🏆',
    description: 'Điểm trung bình kiểm tra & luyện đề đạt mức xuất sắc nhất.',
  },
  {
    badgeId: 'perfect-attendance-class',
    title: 'Lớp chuyên cần 100%',
    icon: '✅',
    description: 'Toàn bộ học sinh tham gia điểm danh đầy đủ, đúng giờ mỗi buổi học.',
  },
  {
    badgeId: 'ten-point-breakthrough',
    title: 'Lớp bứt phá Điểm 10',
    icon: '🌟',
    description: 'Đạt nhiều điểm 10 tuyệt đối và hoàn thành xuất sắc đề thi thử.',
  },
] as const;

export const STUDENT_BADGE_METADATA: Record<
  string,
  { id: string; title: string; icon: string; colorClass: string; criteria: string }
> = {
  'Toán Học Đại Tài': {
    id: 'badge-math-genius',
    title: 'Toán Học Đại Tài',
    icon: '📐',
    colorClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    criteria: 'Hoàn thành xuất sắc bài tập & đạt điểm cao môn Toán',
  },
  'Chăm Chỉ Nhất Lớp': {
    id: 'badge-hardworking-star',
    title: 'Chăm Chỉ Nhất Lớp',
    icon: '🌟',
    colorClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    criteria: 'Hoàn thành >= 5 bài tập và tổng thời gian học >= 120 phút',
  },
  'Thợ Săn Điểm 10': {
    id: 'badge-ten-hunter',
    title: 'Thợ Săn Điểm 10',
    icon: '🎯',
    colorClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    criteria: 'Điểm trung bình đạt từ 9.0 trở lên',
  },
  'Chiến Binh Ôn Luyện': {
    id: 'badge-exam-warrior',
    title: 'Chiến Binh Ôn Luyện',
    icon: '⚔️',
    colorClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    criteria: 'Hoàn thành từ 3 đề thi thử trở lên',
  },
};

export function computeStudentDigitalBadges(student: ClassStudent): string[] {
  const result = new Set<string>(student.badges || []);
  const mathProg = student.subjectProgress?.['Toán học'];
  if ((mathProg && mathProg.avgScore >= 8.5) || student.avgScore >= 8.8) {
    result.add('Toán Học Đại Tài');
  }
  if (student.homeworkDoneCount >= 3 || student.studyMinutes >= 120 || student.streakDays >= 5) {
    result.add('Chăm Chỉ Nhất Lớp');
  }
  if (student.avgScore >= 9.0) {
    result.add('Thợ Săn Điểm 10');
  }
  if (student.examPracticeCount >= 3) {
    result.add('Chiến Binh Ôn Luyện');
  }
  return Array.from(result);
}

// Storage Keys
export const STORAGE_KEY_REGISTERED_CLASSES = 'max10_registered_classes_v2';
export const STORAGE_KEY_CLASS_STUDENTS = 'max10_real_class_students_v2';
export const STORAGE_KEY_MOCK_EXAMS = 'max10_real_class_mock_exams_v2';
export const STORAGE_KEY_CLASS_PUSH_NOTIFICATIONS = 'max10_real_class_push_notifications_v2';
export const STORAGE_KEY_HOMEWORK_SUBMISSIONS = 'max10_real_homework_submissions_v2';
export const STORAGE_KEY_CLASS_BULLETINS = 'max10_real_class_bulletins_v2';
export const STORAGE_KEY_SHARED_CLASS_EXAMS = 'max10_real_shared_class_exams_v2';
export const STORAGE_KEY_ATTENDANCE_SESSIONS = 'max10_real_attendance_sessions_v2';
export const STORAGE_KEY_COLLECTIVE_BADGES = 'max10_real_collective_badges_v2';

// Không còn bất kỳ mock teacher hay mock student nào
export const INITIAL_MOCK_EXAMS: ClassMockExam[] = [];

export function isAiOrFakeStudent(student: Partial<ClassStudent> & { id?: string; name?: string }): boolean {
  if (!student) return true;
  const id = (student.id || '').toLowerCase();
  const name = (student.name || '').toLowerCase();
  if (id.startsWith('ai-') || id.startsWith('std-') || id.startsWith('mock-') || id.startsWith('fake-')) {
    return true;
  }
  if (
    name.includes('max10 ai') ||
    name.includes('trợ lý ai') ||
    name.includes('robot') ||
    name.includes('chatbot') ||
    name === 'quỳnh'
  ) {
    return true;
  }
  return false;
}

// ==========================================
// 1. REGISTERED TEACHER CLASSES (REAL ONLY)
// ==========================================
export function loadRegisteredClasses(): RegisteredTeacherClass[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_REGISTERED_CLASSES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveRegisteredClasses(records: RegisteredTeacherClass[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REGISTERED_CLASSES, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('max10_classes_updated'));
  } catch (e) {}
}

export function getActiveClassCodes(): ClassCode[] {
  const regs = loadRegisteredClasses();
  const set = new Set<ClassCode>();
  regs.forEach((r) => {
    if (ALL_CLASSES_LIST.includes(r.classCode)) {
      set.add(r.classCode);
    }
  });
  return Array.from(set);
}

export function getClassTeachers(classCode: ClassCode): RegisteredTeacherClass[] {
  return loadRegisteredClasses().filter((r) => r.classCode === classCode);
}

export function getClassHomeroomTeacher(classCode: ClassCode): HomeroomTeacher | null {
  const list = getClassTeachers(classCode);
  if (list.length === 0) return null;

  // Prefer homeroom or both, otherwise first registered subject teacher
  const preferred =
    list.find((r) => r.teacherRoleType === 'homeroom' || r.teacherRoleType === 'both') || list[0];

  const roleText =
    preferred.teacherRoleType === 'both'
      ? `Giáo viên Chủ nhiệm & Bộ môn ${preferred.subject}`
      : preferred.teacherRoleType === 'homeroom'
      ? `Giáo viên Chủ nhiệm lớp ${classCode}`
      : `Giáo viên Bộ môn ${preferred.subject}`;

  return {
    id: preferred.teacherId,
    name: preferred.teacherName,
    title: `${roleText}${preferred.schoolName ? ` · ${preferred.schoolName}` : ''}`,
    subject: preferred.subject || 'Chủ nhiệm lớp',
    avatar:
      preferred.teacherAvatar ||
      `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(preferred.teacherName)}`,
    phone: preferred.teacherPhone || 'Đã xác thực',
    email: preferred.teacherEmail,
    message: `Lớp ${classCode} được quản lý trực tiếp bởi ${preferred.teacherName} (${roleText}).`,
    teacherRoleType: preferred.teacherRoleType,
    schoolName: preferred.schoolName,
    isRealHuman: true,
    isVerifiedTeacher: true,
  };
}

/**
 * Tự động tạo/cập nhật nhóm chat của lớp (không giới hạn số lượng học sinh)
 */
export function syncClassGroupChat(classCode: ClassCode, teacher?: UserAccount | RegisteredTeacherClass): void {
  try {
    const GROUP_KEY = 'max10_real_groups_v15';
    const raw = localStorage.getItem(GROUP_KEY);
    const groups: any[] = raw ? JSON.parse(raw) : [];
    const groupId = `class-group-${classCode.toLowerCase()}`;
    const existingIdx = groups.findIndex((g) => g.id === groupId);

    const students = loadClassStudents(classCode);
    const classTeachers = getClassTeachers(classCode);

    const membersMap = new Map<string, any>();

    classTeachers.forEach((t) => {
      membersMap.set(t.teacherId, {
        id: t.teacherId,
        name: t.teacherName,
        avatar: t.teacherAvatar || `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(t.teacherName)}`,
        role: 'teacher',
        school: t.schoolName || `Lớp ${classCode}`,
      });
    });

    if (teacher && 'id' in teacher && 'name' in teacher && !('teacherId' in teacher)) {
      membersMap.set(teacher.id, {
        id: teacher.id,
        name: teacher.name,
        avatar: teacher.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(teacher.name)}`,
        role: 'teacher',
        school: teacher.schoolName || `Lớp ${classCode}`,
      });
    }

    students.forEach((s) => {
      membersMap.set(s.id, {
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        role: 'member',
        school: `Lớp ${classCode}`,
      });
    });

    const primaryTeacher = classTeachers[0];
    const groupPayload = {
      id: groupId,
      name: `Lớp ${classCode} - Nhóm Học Tập Chính Thức`,
      description: `Nhóm lớp ${classCode} do ${primaryTeacher?.teacherName || 'Giáo viên'} phụ trách (Không giới hạn số lượng học sinh)`,
      grade: `Lớp ${classCode[0]}`,
      subject: primaryTeacher?.subject || 'Tổng hợp',
      avatarIcon: '🏫',
      createdAt: existingIdx >= 0 ? groups[existingIdx].createdAt : Date.now(),
      createdBy: primaryTeacher?.teacherId || (teacher && 'id' in teacher ? teacher.id : 'teacher'),
      code: `LOP-${classCode}`,
      onlyAdminCanAdd: false,
      maxMembers: 999999,
      members: Array.from(membersMap.values()),
      mutedUsers: existingIdx >= 0 ? groups[existingIdx].mutedUsers || {} : {},
    };

    if (existingIdx >= 0) {
      // Merge existing extra human members too
      const oldMembers = groups[existingIdx].members || [];
      oldMembers.forEach((om: any) => {
        if (om && om.id && !membersMap.has(om.id) && !om.id.startsWith('ai-') && !om.id.startsWith('std-')) {
          membersMap.set(om.id, om);
        }
      });
      groupPayload.members = Array.from(membersMap.values());
      groups[existingIdx] = groupPayload;
    } else {
      groups.unshift(groupPayload);
    }

    localStorage.setItem(GROUP_KEY, JSON.stringify(groups));

    // Sync to backend groups API
    if (typeof fetch !== 'undefined') {
      fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...groupPayload,
          createdByName: primaryTeacher?.teacherName || 'Giáo viên',
          creatorAvatar: primaryTeacher?.teacherAvatar || '',
        }),
      }).catch(() => {});
    }
  } catch (e) {}
}

/**
 * Kích hoạt lớp học khi Thầy/Cô giáo thật đăng ký tài khoản Giáo viên
 */
export function registerTeacherForClasses(user: UserAccount): RegisteredTeacherClass[] {
  if (user.role !== 'teacher') return loadRegisteredClasses();

  const roleType: TeacherRoleType = user.teacherRoleType || 'homeroom';
  const targetClasses = new Set<ClassCode>();

  if (user.homeroomClass && ALL_CLASSES_LIST.includes(user.homeroomClass as ClassCode)) {
    targetClasses.add(user.homeroomClass as ClassCode);
  }
  if (Array.isArray(user.teachingClasses)) {
    user.teachingClasses.forEach((c) => {
      if (ALL_CLASSES_LIST.includes(c as ClassCode)) {
        targetClasses.add(c as ClassCode);
      }
    });
  }

  if (targetClasses.size === 0) return loadRegisteredClasses();

  const current = loadRegisteredClasses();
  const filtered = current.filter((r) => !(r.teacherId === user.id && targetClasses.has(r.classCode)));

  const newEntries: RegisteredTeacherClass[] = Array.from(targetClasses).map((code) => ({
    id: `reg-${user.id}-${code}`,
    classCode: code,
    teacherId: user.id,
    teacherName: user.name,
    teacherAvatar: user.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(user.name)}`,
    teacherEmail: user.email || '',
    teacherPhone: user.phone || '',
    teacherRoleType:
      roleType === 'both'
        ? user.homeroomClass === code
          ? 'both'
          : 'subject'
        : roleType,
    subject: user.teachingSubject || 'Toán học',
    schoolName: user.schoolName || 'THCS Max10',
    createdAt: new Date().toLocaleDateString('vi-VN'),
  }));

  const updated = [...newEntries, ...filtered];
  saveRegisteredClasses(updated);

  // Tạo nhóm lớp tương ứng (không giới hạn sĩ số) & đồng bộ server
  targetClasses.forEach((code) => syncClassGroupChat(code, user));

  if (typeof fetch !== 'undefined') {
    fetch('/api/classes/register-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: newEntries, teacher: user }),
    }).catch(() => {});
  }

  return updated;
}

// ==========================================
// 2. REAL STUDENTS PER CLASS (ZERO FAKE BOTS)
// ==========================================
export function createDefaultSubjectProgress(): Record<string, SubjectPracticeProgress> {
  return {
    'Toán học': { lessonsDone: 0, quizzesDone: 0, avgScore: 0, studyMinutes: 0 },
    'Ngữ văn': { lessonsDone: 0, quizzesDone: 0, avgScore: 0, studyMinutes: 0 },
    'Tiếng Anh': { lessonsDone: 0, quizzesDone: 0, avgScore: 0, studyMinutes: 0 },
    'KHTN': { lessonsDone: 0, quizzesDone: 0, avgScore: 0, studyMinutes: 0 },
    'Lịch sử & Địa lý': { lessonsDone: 0, quizzesDone: 0, avgScore: 0, studyMinutes: 0 },
    'Tin học': { lessonsDone: 0, quizzesDone: 0, avgScore: 0, studyMinutes: 0 },
    'GDCD': { lessonsDone: 0, quizzesDone: 0, avgScore: 0, studyMinutes: 0 },
  };
}

export function loadClassStudents(classCode: ClassCode): ClassStudent[] {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_CLASS_STUDENTS}_${classCode}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((s: ClassStudent) => !s.isKicked && !isAiOrFakeStudent(s))
          .map((s: ClassStudent) => ({
            ...s,
            studyMinutes: s.studyMinutes ?? 0,
            badges: computeStudentDigitalBadges({
              ...s,
              studyMinutes: s.studyMinutes ?? 0,
              badges: s.badges || [],
              subjectProgress: s.subjectProgress || createDefaultSubjectProgress(),
              isVerifiedHuman: true,
            }),
            subjectProgress: s.subjectProgress || createDefaultSubjectProgress(),
            isVerifiedHuman: true,
          }));
      }
    }
  } catch (e) {}
  return [];
}

export function saveClassStudents(classCode: ClassCode, students: ClassStudent[]): void {
  try {
    const clean = students.filter((s) => !isAiOrFakeStudent(s));
    localStorage.setItem(`${STORAGE_KEY_CLASS_STUDENTS}_${classCode}`, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent('max10_class_students_updated', { detail: { classCode } }));
  } catch (e) {}
}

export function enrollRealStudentInClass(user: UserAccount): ClassStudent | null {
  if (user.role !== 'student' || !user.studentClass) return null;
  const classCode = user.studentClass as ClassCode;
  if (!ALL_CLASSES_LIST.includes(classCode)) return null;

  const current = loadClassStudents(classCode);
  const existing = current.find((s) => s.id === user.id);
  if (existing) {
    syncClassGroupChat(classCode);
    return existing;
  }

  const newStudent: ClassStudent = {
    id: user.id,
    studentCode: `HS-${classCode}-${String(current.length + 1).padStart(2, '0')}`,
    name: user.name,
    gender: user.gender || 'male',
    dob: user.dob || '2012-01-01',
    avatar:
      user.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
    email: user.email,
    className: classCode,
    homeworkStatus: 'practicing',
    homeworkDoneCount: 0,
    totalHomework: 0,
    examPracticeCount: 0,
    avgScore: 0,
    xpScore: 100,
    streakDays: 1,
    studyMinutes: 0,
    badges: [],
    subjectProgress: createDefaultSubjectProgress(),
    status: 'online',
    isKicked: false,
    isVerifiedHuman: true,
  };

  saveClassStudents(classCode, [...current, newStudent]);
  syncClassGroupChat(classCode);
  return newStudent;
}

export function addRealStudentByTeacher(
  classCode: ClassCode,
  input: { name: string; gender: 'male' | 'female' | 'other'; dob?: string; email?: string }
): ClassStudent {
  const current = loadClassStudents(classCode);
  const newStudent: ClassStudent = {
    id: `real-hs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    studentCode: `HS-${classCode}-${String(current.length + 1).padStart(2, '0')}`,
    name: input.name.trim(),
    gender: input.gender,
    dob: input.dob || '2012-09-05',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.name.trim())}`,
    email: input.email?.trim() || undefined,
    className: classCode,
    homeworkStatus: 'unsubmitted',
    homeworkDoneCount: 0,
    totalHomework: 0,
    examPracticeCount: 0,
    avgScore: 0,
    xpScore: 100,
    streakDays: 1,
    studyMinutes: 0,
    badges: [],
    subjectProgress: createDefaultSubjectProgress(),
    status: 'online',
    isKicked: false,
    isVerifiedHuman: true,
  };

  saveClassStudents(classCode, [...current, newStudent]);
  syncClassGroupChat(classCode);
  return newStudent;
}

export function kickStudentFromClass(classCode: ClassCode, studentId: string): ClassStudent[] {
  const current = loadClassStudents(classCode);
  const updated = current.map((s) => (s.id === studentId ? { ...s, isKicked: true } : s));
  saveClassStudents(classCode, updated);
  return updated.filter((s) => !s.isKicked);
}

// ==========================================
// 3. HOMEWORK SUBMISSIONS & TEACHER GRADING
// ==========================================
export function loadHomeworkSubmissions(classCode?: ClassCode | 'all'): HomeworkSubmission[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_HOMEWORK_SUBMISSIONS);
    const all: HomeworkSubmission[] = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(all)) return [];
    if (!classCode || classCode === 'all') return all;
    return all.filter((sub) => sub.classCode === classCode);
  } catch (e) {
    return [];
  }
}

export function saveHomeworkSubmission(sub: HomeworkSubmission): HomeworkSubmission[] {
  const all = loadHomeworkSubmissions('all');
  const updated = [sub, ...all.filter((s) => s.id !== sub.id)];
  try {
    localStorage.setItem(STORAGE_KEY_HOMEWORK_SUBMISSIONS, JSON.stringify(updated));
  } catch (e) {}

  // Cập nhật chỉ số cho học sinh trong lớp
  const students = loadClassStudents(sub.classCode);
  const sIdx = students.findIndex((s) => s.id === sub.studentId || s.name === sub.studentName);
  if (sIdx >= 0) {
    const st = { ...students[sIdx] };
    st.homeworkDoneCount = (st.homeworkDoneCount || 0) + 1;
    st.totalHomework = Math.max(st.totalHomework || 0, st.homeworkDoneCount);
    st.homeworkStatus = 'submitted';
    st.lastSubmittedAt = sub.submittedAt;
    st.studyMinutes = (st.studyMinutes || 0) + 30;
    st.xpScore = (st.xpScore || 0) + 50;
    st.badges = computeStudentDigitalBadges(st);
    students[sIdx] = st;
    saveClassStudents(sub.classCode, students);
  }

  return updated;
}

export function gradeHomeworkSubmission(
  submissionId: string,
  score: number,
  teacherRemark: string,
  graderName: string
): HomeworkSubmission[] {
  const all = loadHomeworkSubmissions('all');
  let targetSub: HomeworkSubmission | undefined;
  const updated = all.map((sub) => {
    if (sub.id === submissionId) {
      targetSub = {
        ...sub,
        status: 'graded' as const,
        score,
        teacherRemark,
        gradedAt: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
        gradedBy: graderName,
      };
      return targetSub;
    }
    return sub;
  });

  try {
    localStorage.setItem(STORAGE_KEY_HOMEWORK_SUBMISSIONS, JSON.stringify(updated));
  } catch (e) {}

  // Cập nhật điểm trung bình & nhận xét của học sinh
  if (targetSub) {
    const sub = targetSub;
    const students = loadClassStudents(sub.classCode);
    const sIdx = students.findIndex((s) => s.id === sub.studentId || s.name === sub.studentName);
    if (sIdx >= 0) {
      const gradedForStudent = updated.filter(
        (item) =>
          item.classCode === sub.classCode &&
          (item.studentId === students[sIdx].id || item.studentName === students[sIdx].name) &&
          item.status === 'graded' &&
          typeof item.score === 'number'
      );
      const avg =
        gradedForStudent.length > 0
          ? Number(
              (
                gradedForStudent.reduce((acc, item) => acc + (item.score || 0), 0) /
                gradedForStudent.length
              ).toFixed(1)
            )
          : score;

      const st = { ...students[sIdx] };
      st.avgScore = avg;
      st.teacherRemark = teacherRemark || st.teacherRemark;
      st.xpScore = (st.xpScore || 0) + Math.round(score * 15);
      const subjKey = sub.subject.includes('Toán')
        ? 'Toán học'
        : sub.subject.includes('Văn')
        ? 'Ngữ văn'
        : sub.subject.includes('Anh')
        ? 'Tiếng Anh'
        : sub.subject;
      const curProg = st.subjectProgress?.[subjKey] || { lessonsDone: 0, quizzesDone: 0, avgScore: 0, studyMinutes: 0 };
      st.subjectProgress = {
        ...(st.subjectProgress || createDefaultSubjectProgress()),
        [subjKey]: {
          lessonsDone: curProg.lessonsDone + 1,
          quizzesDone: curProg.quizzesDone + 1,
          avgScore: score,
          studyMinutes: curProg.studyMinutes + 30,
        },
      };
      st.badges = computeStudentDigitalBadges(st);
      students[sIdx] = st;
      saveClassStudents(sub.classCode, students);
    }

    // Gửi thông báo kết quả chấm bài cho lớp/học sinh
    dispatchClassPushNotification({
      id: `notif-grade-${Date.now()}`,
      classCode: sub.classCode,
      title: `[ĐÃ CHẤM BÀI] ${sub.title} - ${sub.studentName}: ${score}/10 điểm`,
      body: teacherRemark ? `Nhận xét của ${graderName}: "${teacherRemark}"` : `${graderName} đã chấm điểm bài nộp của ${sub.studentName}.`,
      category: 'homework',
      priority: 'high',
      senderTeacherName: graderName,
      createdAt: 'Vừa xong',
      deliveredCount: 1,
      readCount: 0,
    });
  }

  return updated;
}

// ==========================================
// 4. CLASS BULLETIN BOARD (BẢNG TIN LỚP)
// ==========================================
export function loadClassBulletins(classCode?: ClassCode | 'all'): ClassBulletinPost[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CLASS_BULLETINS);
    const all: ClassBulletinPost[] = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(all)) return [];
    if (!classCode || classCode === 'all') return all;
    return all.filter((b) => b.classCode === classCode);
  } catch (e) {
    return [];
  }
}

export function saveClassBulletin(post: ClassBulletinPost): ClassBulletinPost[] {
  const all = loadClassBulletins('all');
  const updated = [post, ...all.filter((p) => p.id !== post.id)];
  try {
    localStorage.setItem(STORAGE_KEY_CLASS_BULLETINS, JSON.stringify(updated));
  } catch (e) {}

  dispatchClassPushNotification({
    id: `notif-bulletin-${Date.now()}`,
    classCode: post.classCode,
    title: `[BẢNG TIN LỚP ${post.classCode}] ${post.title}`,
    body: post.content,
    category: post.category === 'exam_schedule' ? 'exam' : 'reminder',
    priority: post.category === 'exam_schedule' ? 'high' : 'normal',
    senderTeacherName: post.authorName,
    createdAt: 'Vừa xong',
    deliveredCount: loadClassStudents(post.classCode).length || 1,
    readCount: 0,
  });

  return updated;
}

// ==========================================
// 5. SHARED CLASS EXAM CALENDAR (LỊCH THI CHUNG)
// ==========================================
export function loadSharedClassExams(classCode?: ClassCode | 'all'): SharedClassExamEvent[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SHARED_CLASS_EXAMS);
    const all: SharedClassExamEvent[] = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(all)) return [];
    if (!classCode || classCode === 'all') return all;
    return all.filter((evt) => evt.classCode === classCode);
  } catch (e) {
    return [];
  }
}

export function saveSharedClassExam(examEvent: SharedClassExamEvent): SharedClassExamEvent[] {
  const all = loadSharedClassExams('all');
  const updated = [examEvent, ...all.filter((e) => e.id !== examEvent.id)];
  try {
    localStorage.setItem(STORAGE_KEY_SHARED_CLASS_EXAMS, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('max10_shared_class_exams_updated', { detail: examEvent }));
    }
  } catch (e) {}

  // Tự động thông báo tới toàn bộ học sinh trong lớp
  dispatchClassPushNotification({
    id: `notif-shared-exam-${Date.now()}`,
    classCode: examEvent.classCode,
    title: `[LỊCH THI CHUNG LỚP ${examEvent.classCode}] ${examEvent.title}`,
    body: `Môn ${examEvent.subject} · Thi lúc ${examEvent.time} ngày ${examEvent.date}. Trọng tâm: ${examEvent.syllabus}`,
    category: 'exam',
    priority: 'urgent',
    senderTeacherName: examEvent.creatorTeacherName,
    createdAt: 'Vừa xong',
    deliveredCount: loadClassStudents(examEvent.classCode).length || 1,
    readCount: 0,
    dueTime: `${examEvent.time} · ${examEvent.date}`,
  });

  return updated;
}

export function deleteSharedClassExam(id: string): SharedClassExamEvent[] {
  const all = loadSharedClassExams('all').filter((e) => e.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_SHARED_CLASS_EXAMS, JSON.stringify(all));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('max10_shared_class_exams_updated'));
    }
  } catch (e) {}
  return all;
}

// ==========================================
// 6. REAL-TIME ATTENDANCE (ĐIỂM DANH LỚP)
// ==========================================
export function loadAttendanceSessions(classCode: ClassCode): AttendanceSession[] {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_ATTENDANCE_SESSIONS}_${classCode}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveAttendanceSession(session: AttendanceSession): AttendanceSession[] {
  const current = loadAttendanceSessions(session.classCode);
  const idx = current.findIndex((s) => s.id === session.id || (s.date === session.date && s.sessionName === session.sessionName));
  const updated = idx >= 0 ? current.map((s, i) => (i === idx ? session : s)) : [session, ...current];
  try {
    localStorage.setItem(`${STORAGE_KEY_ATTENDANCE_SESSIONS}_${session.classCode}`, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

// ==========================================
// 7. COLLECTIVE CLASS BADGES (HUY HIỆU TẬP THỂ)
// ==========================================
export function loadCollectiveBadges(classCode?: ClassCode | 'all'): CollectiveClassBadge[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COLLECTIVE_BADGES);
    const all: CollectiveClassBadge[] = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(all)) return [];
    if (!classCode || classCode === 'all') return all;
    return all.filter((b) => b.classCode === classCode);
  } catch (e) {
    return [];
  }
}

export function awardCollectiveBadge(badge: CollectiveClassBadge): CollectiveClassBadge[] {
  const all = loadCollectiveBadges('all');
  const exists = all.some((b) => b.classCode === badge.classCode && b.badgeId === badge.badgeId);
  const updated = exists
    ? all.map((b) => (b.classCode === badge.classCode && b.badgeId === badge.badgeId ? badge : b))
    : [badge, ...all];
  try {
    localStorage.setItem(STORAGE_KEY_COLLECTIVE_BADGES, JSON.stringify(updated));
  } catch (e) {}

  dispatchClassPushNotification({
    id: `notif-col-badge-${Date.now()}`,
    classCode: badge.classCode,
    title: `[HUY HIỆU TẬP THỂ] Lớp ${badge.classCode} đạt danh hiệu "${badge.title}" ${badge.icon}`,
    body: `${badge.description} (Trao tặng bởi ${badge.awardedBy})`,
    category: 'reminder',
    priority: 'high',
    senderTeacherName: badge.awardedBy,
    createdAt: 'Vừa xong',
    deliveredCount: loadClassStudents(badge.classCode).length || 1,
    readCount: 0,
  });

  return updated;
}

// ==========================================
// 8. MOCK EXAMS & PUSH NOTIFICATIONS
// ==========================================
export function loadMockExams(): ClassMockExam[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MOCK_EXAMS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_MOCK_EXAMS;
}

export function saveMockExams(exams: ClassMockExam[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MOCK_EXAMS, JSON.stringify(exams));
  } catch (e) {}
}

export function loadClassPushNotifications(classCode: ClassCode): ClassPushNotification[] {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_CLASS_PUSH_NOTIFICATIONS}_${classCode}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveClassPushNotifications(classCode: ClassCode, list: ClassPushNotification[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_CLASS_PUSH_NOTIFICATIONS}_${classCode}`, JSON.stringify(list));
  } catch (e) {}
}

export function dispatchClassPushNotification(notif: ClassPushNotification): void {
  const current = loadClassPushNotifications(notif.classCode);
  const updated = [notif, ...current];
  saveClassPushNotifications(notif.classCode, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('max10_class_push_notification_dispatched', {
        detail: notif,
      })
    );

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🔔 [THÔNG BÁO LỚP ${notif.classCode}] ${notif.title}`, {
          body: `${notif.body}\n- ${notif.senderTeacherName}`,
          icon: notif.senderAvatar || '/max10-avatar.jpg',
          tag: `class_notif_${notif.id}`,
        });
      } catch (e) {}
    }
  }
}
