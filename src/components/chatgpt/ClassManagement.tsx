import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trophy,
  Award,
  BookOpen,
  MessageSquare,
  UserPlus,
  UserX,
  Bell,
  Send,
  Calendar,
  FileCheck2,
  ClipboardCheck,
  Megaphone,
  PieChart as PieChartIcon,
  Printer,
  Filter,
  Star,
  Plus,
  X,
  Image as ImageIcon,
  FileText,
  ShieldCheck,
  Lock,
  Sparkles,
  Trash2,
  Check,
  GraduationCap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { UserAccount } from '../../types/auth';
import {
  ALL_CLASSES_LIST,
  ClassCode,
  SUBJECT_LIST,
  ClassStudent,
  HomeworkSubmission,
  ClassBulletinPost,
  SharedClassExamEvent,
  AttendanceSession,
  AttendanceStatus,
  CollectiveClassBadge,
  COLLECTIVE_BADGE_TEMPLATES,
  STUDENT_BADGE_METADATA,
  loadRegisteredClasses,
  getActiveClassCodes,
  getClassHomeroomTeacher,
  getClassTeachers,
  registerTeacherForClasses,
  loadClassStudents,
  addRealStudentByTeacher,
  kickStudentFromClass,
  loadHomeworkSubmissions,
  saveHomeworkSubmission,
  gradeHomeworkSubmission,
  loadClassBulletins,
  saveClassBulletin,
  loadSharedClassExams,
  saveSharedClassExam,
  deleteSharedClassExam,
  loadAttendanceSessions,
  saveAttendanceSession,
  loadCollectiveBadges,
  awardCollectiveBadge,
  dispatchClassPushNotification,
  syncClassGroupChat,
  computeStudentDigitalBadges,
} from '../../data/classSystemData';

interface ClassManagementProps {
  isDark: boolean;
  currentUser: UserAccount | null;
  onNavigateToTab?: (tab: any) => void;
  onOpenConversation?: (type: 'direct' | 'group', targetId: string) => void;
  onOpenAuthModal?: () => void;
}

type ManagementTab =
  | 'roster'
  | 'grading'
  | 'attendance'
  | 'bulletin'
  | 'shared_exams'
  | 'summary_report';

export const ClassManagement: React.FC<ClassManagementProps> = ({
  isDark,
  currentUser,
  onOpenConversation,
  onOpenAuthModal,
}) => {
  const isVerifiedTeacher = Boolean(
    currentUser &&
      ((currentUser.role === 'teacher' && currentUser.isVerifiedTeacher !== false) ||
        currentUser.role === 'admin' ||
        currentUser.isSuperAdmin)
  );

  const isHomeroomOrAdmin = Boolean(
    currentUser &&
      (currentUser.role === 'admin' ||
        currentUser.isSuperAdmin ||
        (currentUser.role === 'teacher' &&
          (currentUser.teacherRoleType === 'homeroom' ||
            currentUser.teacherRoleType === 'both' ||
            !currentUser.teacherRoleType)))
  );

  const [registeredVersion, setRegisteredVersion] = useState(0);

  useEffect(() => {
    const onUpdated = () => setRegisteredVersion((v) => v + 1);
    window.addEventListener('max10_classes_updated', onUpdated);
    window.addEventListener('max10_class_students_updated', onUpdated);
    return () => {
      window.removeEventListener('max10_classes_updated', onUpdated);
      window.removeEventListener('max10_class_students_updated', onUpdated);
    };
  }, []);

  const activeClassCodes = useMemo(() => getActiveClassCodes(), [registeredVersion]);
  const allRegistrations = useMemo(() => loadRegisteredClasses(), [registeredVersion]);

  const [selectedClass, setSelectedClass] = useState<ClassCode>(() => {
    if (currentUser?.homeroomClass && ALL_CLASSES_LIST.includes(currentUser.homeroomClass as ClassCode)) {
      return currentUser.homeroomClass as ClassCode;
    }
    if (currentUser?.teachingClasses?.[0] && ALL_CLASSES_LIST.includes(currentUser.teachingClasses[0] as ClassCode)) {
      return currentUser.teachingClasses[0] as ClassCode;
    }
    const active = getActiveClassCodes();
    return active[0] || '9D1';
  });

  const [activeTab, setActiveTab] = useState<ManagementTab>('roster');
  const [rosterViewMode, setRosterViewMode] = useState<'leaderboard' | 'table'>('leaderboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'practicing' | 'unsubmitted'>('all');
  const [toastMsg, setToastMsg] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Core Class Data
  const homeroomTeacher = useMemo(
    () => getClassHomeroomTeacher(selectedClass),
    [selectedClass, registeredVersion]
  );
  const classTeachers = useMemo(
    () => getClassTeachers(selectedClass),
    [selectedClass, registeredVersion]
  );
  const [students, setStudents] = useState<ClassStudent[]>(() => loadClassStudents(selectedClass));

  useEffect(() => {
    setStudents(loadClassStudents(selectedClass));
  }, [selectedClass, registeredVersion]);

  // Tab 1: Student Detail Modal & Add Student Modal & Kick confirm
  const [selectedStudent, setSelectedStudent] = useState<ClassStudent | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentGender, setNewStudentGender] = useState<'male' | 'female'>('male');
  const [newStudentDob, setNewStudentDob] = useState<string>('2012-05-15');
  const [confirmKickId, setConfirmKickId] = useState<string | null>(null);

  // Quick Notification Modal ("Thông báo nhanh")
  const [showQuickNotifModal, setShowQuickNotifModal] = useState<boolean>(false);
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifBody, setNotifBody] = useState<string>('');
  const [notifPriority, setNotifPriority] = useState<'normal' | 'high' | 'urgent'>('high');

  // Collective Class Badges ("Huy hiệu tập thể")
  const [collectiveBadges, setCollectiveBadges] = useState<CollectiveClassBadge[]>(() =>
    loadCollectiveBadges(selectedClass)
  );
  const [showAwardBadgeModal, setShowAwardBadgeModal] = useState<boolean>(false);

  useEffect(() => {
    setCollectiveBadges(loadCollectiveBadges(selectedClass));
  }, [selectedClass, registeredVersion]);

  // Tab 2: Homework Submissions ("Duyệt bài tập")
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>(() =>
    loadHomeworkSubmissions(selectedClass)
  );
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'graded'>('all');
  const [gradingSub, setGradingSub] = useState<HomeworkSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<string>('9.5');
  const [gradeRemark, setGradeRemark] = useState<string>('');
  const [showCreateSubModal, setShowCreateSubModal] = useState<boolean>(false);
  const [newSubStudentId, setNewSubStudentId] = useState<string>('');
  const [newSubSubject, setNewSubSubject] = useState<string>(SUBJECT_LIST[0]);
  const [newSubTitle, setNewSubTitle] = useState<string>('');
  const [newSubDesc, setNewSubDesc] = useState<string>('');
  const [newSubAttachmentUrl, setNewSubAttachmentUrl] = useState<string>('');
  const [newSubAttachmentName, setNewSubAttachmentName] = useState<string>('');

  useEffect(() => {
    setSubmissions(loadHomeworkSubmissions(selectedClass));
  }, [selectedClass, registeredVersion]);

  // Tab 3: Attendance ("Điểm danh lớp")
  const [attendanceDate, setAttendanceDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );
  const [attendanceSessionName, setAttendanceSessionName] = useState<string>('Buổi học chính khóa');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({});
  const [savedAttendanceHistory, setSavedAttendanceHistory] = useState<AttendanceSession[]>(() =>
    loadAttendanceSessions(selectedClass)
  );

  useEffect(() => {
    const sessions = loadAttendanceSessions(selectedClass);
    setSavedAttendanceHistory(sessions);
    const matching = sessions.find(
      (s) => s.date === attendanceDate && s.sessionName === attendanceSessionName
    );
    if (matching) {
      setAttendanceRecords(matching.records || {});
      setAttendanceNotes(matching.notes || {});
    } else {
      const init: Record<string, AttendanceStatus> = {};
      students.forEach((st) => {
        init[st.id] = 'present';
      });
      setAttendanceRecords(init);
      setAttendanceNotes({});
    }
  }, [selectedClass, attendanceDate, attendanceSessionName, students.length]);

  // Tab 4: Class Bulletin Board ("Bảng tin lớp" + Class Filter 6A1-9D6)
  const [bulletinClassFilter, setBulletinClassFilter] = useState<'all' | ClassCode>('all');
  const [bulletins, setBulletins] = useState<ClassBulletinPost[]>(() => loadClassBulletins('all'));
  const [bulletinTitle, setBulletinTitle] = useState<string>('');
  const [bulletinContent, setBulletinContent] = useState<string>('');
  const [bulletinCategory, setBulletinCategory] = useState<'announcement' | 'exam_schedule' | 'material'>('announcement');
  const [bulletinAttachment, setBulletinAttachment] = useState<string>('');

  // Tab 5: Shared Class Exam Calendar ("Lịch thi chung")
  const [sharedExams, setSharedExams] = useState<SharedClassExamEvent[]>(() =>
    loadSharedClassExams(selectedClass)
  );
  const [examTitle, setExamTitle] = useState<string>('');
  const [examSubject, setExamSubject] = useState<string>(SUBJECT_LIST[0]);
  const [examDate, setExamDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [examTime, setExamTime] = useState<string>('08:00');
  const [examSyllabus, setExamSyllabus] = useState<string>('');
  const [examNotes, setExamNotes] = useState<string>('');

  useEffect(() => {
    setSharedExams(loadSharedClassExams(selectedClass));
  }, [selectedClass, registeredVersion]);

  // Derived: Human-only sorted leaderboard
  const leaderboardStudents = useMemo(() => {
    return [...students]
      .filter((s) => s.isVerifiedHuman && !s.isKicked)
      .sort((a, b) => {
        if (b.xpScore !== a.xpScore) return b.xpScore - a.xpScore;
        if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
        return b.homeworkDoneCount - a.homeworkDoneCount;
      });
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return leaderboardStudents.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || s.homeworkStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [leaderboardStudents, searchQuery, statusFilter]);

  // Derived: PieChart data for Tab 'Báo cáo Tổng hợp'
  const pieChartData = useMemo(() => {
    const submitted = students.filter((s) => s.homeworkStatus === 'submitted').length;
    const practicing = students.filter((s) => s.homeworkStatus === 'practicing').length;
    const unsubmitted = students.filter((s) => s.homeworkStatus === 'unsubmitted').length;
    return [
      { name: 'Đã nộp bài tập', value: submitted, color: '#10b981' },
      { name: 'Đang ôn luyện', value: practicing, color: '#f59e0b' },
      { name: 'Chưa nộp bài', value: unsubmitted, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [students]);

  const crossClassBarData = useMemo(() => {
    const codes = activeClassCodes.length > 0 ? activeClassCodes : [selectedClass];
    return codes.map((code) => {
      const list = loadClassStudents(code);
      const total = list.length;
      const done = list.filter((s) => s.homeworkStatus === 'submitted').length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const avg =
        total > 0
          ? Number((list.reduce((acc, s) => acc + (s.avgScore || 0), 0) / total).toFixed(1))
          : 0;
      return {
        classCode: code,
        completionRate: pct,
        avgScore: avg,
        studentsCount: total,
      };
    });
  }, [activeClassCodes, selectedClass, students]);

  // ACCESS GATE FOR NON-TEACHERS
  if (!isVerifiedTeacher) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6">
        <div
          className={`max-w-lg w-full p-8 rounded-3xl border text-center space-y-5 shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black">Chỉ Dành Cho Giáo Viên Đã Xác Thực</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Module <strong>Quản lý Lớp học (6A1 - 9D6)</strong> chỉ mở khi có Thầy/Cô giáo đăng ký tài khoản Giáo viên xác thực (<strong>Giáo viên bộ môn</strong> hoặc <strong>Giáo viên chủ nhiệm</strong>). Hệ thống không sử dụng lớp học hay học sinh giả.
            </p>
          </div>
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg cursor-pointer inline-flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Đăng Ký Tài Khoản Giáo Viên Ngay</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // HANDLERS
  const handleClaimClassAsTeacher = () => {
    if (!currentUser || currentUser.role !== 'teacher') return;
    const updatedUser: UserAccount = {
      ...currentUser,
      isVerifiedTeacher: true,
      homeroomClass:
        currentUser.teacherRoleType === 'homeroom' || currentUser.teacherRoleType === 'both'
          ? selectedClass
          : currentUser.homeroomClass,
      teachingClasses: Array.from(new Set([...(currentUser.teachingClasses || []), selectedClass])),
    };
    localStorage.setItem('max10_auth_user_v1', JSON.stringify(updatedUser));
    registerTeacherForClasses(updatedUser);
    setRegisteredVersion((v) => v + 1);
    showToast(`✓ Đã mở & kích hoạt lớp ${selectedClass} dưới quyền của ${currentUser.name}!`);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    addRealStudentByTeacher(selectedClass, {
      name: newStudentName.trim(),
      gender: newStudentGender,
      dob: newStudentDob,
    });
    setStudents(loadClassStudents(selectedClass));
    setRegisteredVersion((v) => v + 1);
    setShowAddStudentModal(false);
    setNewStudentName('');
    showToast(`✓ Đã thêm học sinh "${newStudentName.trim()}" vào lớp ${selectedClass}!`);
  };

  const handleSendQuickNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) return;
    dispatchClassPushNotification({
      id: `notif-quick-${Date.now()}`,
      classCode: selectedClass,
      title: notifTitle.trim(),
      body: notifBody.trim(),
      category: notifPriority === 'urgent' ? 'urgent' : 'reminder',
      priority: notifPriority,
      senderTeacherName: currentUser?.name || homeroomTeacher?.name || 'Giáo viên',
      senderAvatar: currentUser?.avatar,
      createdAt: 'Vừa xong',
      deliveredCount: students.length || 1,
      readCount: 0,
    });
    setShowQuickNotifModal(false);
    setNotifTitle('');
    setNotifBody('');
    showToast(`🔔 Đã bắn thông báo tức thời tới thiết bị tất cả học sinh lớp ${selectedClass}!`);
  };

  const handleOpenClassGroupChat = () => {
    syncClassGroupChat(selectedClass, currentUser || undefined);
    const groupId = `class-group-${selectedClass.toLowerCase()}`;
    if (onOpenConversation) {
      onOpenConversation('group', groupId);
    }
  };

  const handleCreateSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent = students.find((s) => s.id === newSubStudentId) || students[0];
    if (!targetStudent || !newSubTitle.trim()) return;

    const newSub: HomeworkSubmission = {
      id: `sub-${Date.now()}`,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      studentAvatar: targetStudent.avatar,
      classCode: selectedClass,
      subject: newSubSubject,
      title: newSubTitle.trim(),
      description: newSubDesc.trim(),
      attachmentUrl: newSubAttachmentUrl.trim() || undefined,
      attachmentName: newSubAttachmentName.trim() || undefined,
      attachmentType: newSubAttachmentUrl.trim() ? 'image' : newSubAttachmentName.trim() ? 'file' : 'text',
      submittedAt: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      status: 'pending',
    };

    saveHomeworkSubmission(newSub);
    setSubmissions(loadHomeworkSubmissions(selectedClass));
    setStudents(loadClassStudents(selectedClass));
    setShowCreateSubModal(false);
    setNewSubTitle('');
    setNewSubDesc('');
    setNewSubAttachmentUrl('');
    setNewSubAttachmentName('');
    showToast(`✓ Đã ghi nhận bài nộp "${newSub.title}" của ${targetStudent.name}!`);
  };

  const handleUploadHomeworkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewSubAttachmentName(file.name);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewSubAttachmentUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub) return;
    const numScore = Math.min(10, Math.max(0, Number(gradeScore) || 0));
    gradeHomeworkSubmission(
      gradingSub.id,
      numScore,
      gradeRemark.trim(),
      currentUser?.name || 'Giáo viên'
    );
    setSubmissions(loadHomeworkSubmissions(selectedClass));
    setStudents(loadClassStudents(selectedClass));
    setGradingSub(null);
    setGradeRemark('');
    showToast(`✓ Đã chấm ${numScore}/10 điểm & gửi nhận xét cho ${gradingSub.studentName}!`);
  };

  const handleSaveAttendance = () => {
    const session: AttendanceSession = {
      id: `att-${selectedClass}-${attendanceDate}-${attendanceSessionName}`,
      classCode: selectedClass,
      date: attendanceDate,
      sessionName: attendanceSessionName,
      records: attendanceRecords,
      notes: attendanceNotes,
      updatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      recordedBy: currentUser?.name || 'Giáo viên',
    };
    const updated = saveAttendanceSession(session);
    setSavedAttendanceHistory(updated);
    showToast(`✅ Đã lưu điểm danh lớp ${selectedClass} (${attendanceDate}) thành công!`);
  };

  const handlePostBulletin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulletinTitle.trim() || !bulletinContent.trim()) return;
    const post: ClassBulletinPost = {
      id: `bul-${Date.now()}`,
      classCode: selectedClass,
      title: bulletinTitle.trim(),
      content: bulletinContent.trim(),
      category: bulletinCategory,
      attachmentName: bulletinAttachment.trim() || undefined,
      authorName: currentUser?.name || homeroomTeacher?.name || 'Giáo viên',
      authorRole:
        currentUser?.teacherRoleType === 'subject' ? 'Giáo viên bộ môn' : 'Giáo viên chủ nhiệm',
      createdAt: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
    };
    saveClassBulletin(post);
    setBulletins(loadClassBulletins('all'));
    setBulletinTitle('');
    setBulletinContent('');
    setBulletinAttachment('');
    showToast(`📢 Đã đăng bảng tin lên lớp ${selectedClass} & thông báo tới học sinh!`);
  };

  const handleCreateSharedExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) return;
    const evt: SharedClassExamEvent = {
      id: `sexam-${Date.now()}`,
      classCode: selectedClass,
      title: examTitle.trim(),
      subject: examSubject,
      date: examDate,
      time: examTime,
      syllabus: examSyllabus.trim() || 'Ôn tập theo đề cương trên lớp',
      notes: examNotes.trim() || undefined,
      creatorTeacherName: currentUser?.name || homeroomTeacher?.name || 'Giáo viên chủ nhiệm',
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };
    saveSharedClassExam(evt);
    setSharedExams(loadSharedClassExams(selectedClass));
    setExamTitle('');
    setExamSyllabus('');
    setExamNotes('');
    showToast(`📅 Đã tạo Lịch thi chung lớp ${selectedClass} & tự động đồng bộ vào Lịch học của học sinh!`);
  };

  const handleAwardCollective = (tpl: (typeof COLLECTIVE_BADGE_TEMPLATES)[number]) => {
    awardCollectiveBadge({
      id: `cbadge-${selectedClass}-${tpl.badgeId}`,
      classCode: selectedClass,
      badgeId: tpl.badgeId,
      title: tpl.title,
      icon: tpl.icon,
      description: tpl.description,
      awardedBy: currentUser?.name || 'Giáo viên chủ nhiệm',
      awardedAt: new Date().toLocaleDateString('vi-VN'),
    });
    setCollectiveBadges(loadCollectiveBadges(selectedClass));
    setShowAwardBadgeModal(false);
    showToast(`🏆 Đã trao danh hiệu "${tpl.title}" cho tập thể lớp ${selectedClass}!`);
  };

  const filteredSubmissions = submissions.filter((sub) =>
    submissionFilter === 'all' ? true : sub.status === submissionFilter
  );

  const visibleBulletins = bulletins.filter((b) =>
    bulletinClassFilter === 'all' ? true : b.classCode === bulletinClassFilter
  );

  const attendanceCounts = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    students.forEach((s) => {
      const st = attendanceRecords[s.id] || 'present';
      if (st === 'present') present++;
      else if (st === 'late') late++;
      else absent++;
    });
    return { present, late, absent, total: students.length };
  }, [students, attendanceRecords]);

  return (
    <div className={`min-h-full w-full p-4 sm:p-6 space-y-5 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER + CLASS DROPDOWN FILTER (6A1 - 9D6) + QUICK ACTIONS */}
      <div
        className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
          isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-violet-500/15 text-violet-500 border border-violet-500/30 text-[11px] font-black uppercase">
                Quản Lý Lớp Học Thực Tế
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[11px] font-bold">
                {activeClassCodes.length} Lớp đã có Giáo viên mở
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Bảng Điều Khiển Giáo Viên · Lớp {selectedClass}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {currentUser?.role === 'teacher' ? (
                <>
                  Đang đăng nhập: <strong>{currentUser.name}</strong> (
                  {currentUser.teacherRoleType === 'both'
                    ? 'Giáo viên bộ môn & Chủ nhiệm'
                    : currentUser.teacherRoleType === 'homeroom'
                    ? 'Giáo viên chủ nhiệm'
                    : 'Giáo viên bộ môn'}
                  )
                </>
              ) : (
                <>Giám sát Quản trị viên tối cao: <strong>{currentUser?.name}</strong></>
              )}
            </p>
          </div>

          {/* Class Filter Dropdown (6A1 - 9D6) + Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-violet-500 shrink-0" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value as ClassCode)}
                aria-label="Lọc theo lớp"
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border outline-none cursor-pointer ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-white focus:border-violet-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-violet-600'
                }`}
              >
                {ALL_CLASSES_LIST.map((code) => {
                  const isActive = activeClassCodes.includes(code);
                  const count = loadClassStudents(code).length;
                  return (
                    <option key={code} value={code}>
                      Lớp {code} {isActive ? `✓ (${count} HS)` : '(Chưa mở lớp)'}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowQuickNotifModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Thông báo nhanh</span>
            </button>

            <button
              type="button"
              onClick={handleOpenClassGroupChat}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Nhắn Tin Nhóm Lớp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddStudentModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm Học Sinh</span>
            </button>
          </div>
        </div>

        {/* Registered Teacher Card OR Empty State if No Teacher Registered This Class Yet */}
        {homeroomTeacher ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-200/70 dark:border-white/5">
            <div className={`lg:col-span-2 p-3.5 rounded-2xl border flex items-center gap-3.5 ${isDark ? 'bg-zinc-900/70 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <img
                src={homeroomTeacher.avatar}
                alt={homeroomTeacher.name}
                className="w-12 h-12 rounded-2xl object-cover border border-violet-500/40 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm">{homeroomTeacher.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-extrabold">
                    ✓ Giáo viên đã xác thực
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                  {homeroomTeacher.title} · {classTeachers.length} giáo viên phụ trách lớp {selectedClass}
                </p>
              </div>
              {currentUser?.role === 'teacher' &&
                !classTeachers.some((t) => t.teacherId === currentUser.id) && (
                  <button
                    type="button"
                    onClick={handleClaimClassAsTeacher}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    + Tham gia dạy lớp này
                  </button>
                )}
            </div>

            {/* Collective Class Badges Showcase ("Huy hiệu tập thể") */}
            <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-amber-950/15 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'}`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Huy hiệu tập thể lớp {selectedClass}</span>
                </span>
                {isHomeroomOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowAwardBadgeModal(true)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer"
                  >
                    + Trao huy hiệu
                  </button>
                )}
              </div>
              {collectiveBadges.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {collectiveBadges.map((b) => (
                    <span
                      key={b.id}
                      title={`${b.description} (Trao bởi ${b.awardedBy})`}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40 font-extrabold inline-flex items-center gap-1"
                    >
                      <span>{b.icon}</span>
                      <span>{b.title}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Chưa có huy hiệu tập thể. GVCN có thể trao huy hiệu thi đua cho lớp!
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'bg-zinc-900/60 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'}`}>
            <div className="text-xs space-y-0.5">
              <p className="font-extrabold text-amber-700 dark:text-amber-300">
                Lớp {selectedClass} chưa có Giáo viên thật đăng ký mở lớp
              </p>
              <p className="text-slate-500 dark:text-zinc-400">
                Hệ thống chỉ tạo lớp học khi có Giáo viên đăng ký thật (không tạo giáo viên hay học sinh giả).
              </p>
            </div>
            {currentUser?.role === 'teacher' && (
              <button
                type="button"
                onClick={handleClaimClassAsTeacher}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shrink-0 cursor-pointer shadow-sm"
              >
                + Mở & Quản Lý Lớp {selectedClass}
              </button>
            )}
          </div>
        )}
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'roster' as const, label: 'Danh sách & BXH Real-time', icon: Trophy },
          { id: 'grading' as const, label: `Duyệt bài tập (${submissions.filter((s) => s.status === 'pending').length})`, icon: FileCheck2 },
          { id: 'attendance' as const, label: 'Điểm danh lớp', icon: ClipboardCheck },
          { id: 'bulletin' as const, label: 'Bảng tin lớp', icon: Megaphone },
          { id: 'shared_exams' as const, label: 'Lịch thi chung', icon: Calendar },
          { id: 'summary_report' as const, label: 'Báo cáo Tổng hợp', icon: PieChartIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 shrink-0 border transition-all cursor-pointer ${
                active
                  ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                  : isDark
                  ? 'bg-zinc-900 border-white/10 text-zinc-300 hover:bg-zinc-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: REAL-TIME LEADERBOARD (HUMAN ONLY) & STUDENT ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
              isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRosterViewMode('leaderboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                  rosterViewMode === 'leaderboard'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                🏆 BXH Real-time (Chỉ Người Thật)
              </button>
              <button
                type="button"
                onClick={() => setRosterViewMode('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                  rosterViewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                📋 Danh Sách Chi Tiết ({students.length} HS)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên hoặc mã HS..."
                  className={`pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="all">Tất cả trạng thái bài</option>
                <option value="submitted">✅ Đã nộp bài</option>
                <option value="practicing">⏳ Đang ôn luyện</option>
                <option value="unsubmitted">❌ Chưa nộp bài</option>
              </select>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className={`p-10 rounded-3xl border text-center space-y-3 ${isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'}`}>
              <Users className="w-10 h-10 mx-auto text-slate-400" />
              <h3 className="font-black text-base">Lớp {selectedClass} chưa có học sinh thật nào</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                Hệ thống đã loại bỏ toàn bộ học sinh giả và AI khỏi danh sách & bảng xếp hạng. Bấm "+ Thêm Học Sinh" hoặc mời học sinh chọn Lớp {selectedClass} khi đăng nhập.
              </p>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Thêm Học Sinh Vào Lớp {selectedClass}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredStudents.map((st, idx) => {
                const badges = computeStudentDigitalBadges(st);
                const rank = idx + 1;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudent(st)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      rank === 1 && rosterViewMode === 'leaderboard'
                        ? isDark
                          ? 'bg-gradient-to-r from-amber-500/15 to-zinc-900 border-amber-500/40'
                          : 'bg-gradient-to-r from-amber-50 to-white border-amber-300 shadow-sm'
                        : isDark
                        ? 'bg-[#101521] border-white/10 hover:border-violet-500/40'
                        : 'bg-white border-slate-200 hover:border-violet-400 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          rank === 1
                            ? 'bg-amber-500 text-slate-950'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-900'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                        }`}
                      >
                        #{rank}
                      </div>
                      <img
                        src={st.avatar}
                        alt={st.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-emerald-500/30 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm truncate">{st.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">
                            Người thật
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{st.studentCode}</span>
                        </div>
                        {/* Achievement Badges displayed prominently */}
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {badges.length > 0 ? (
                            badges.map((bName) => {
                              const meta = STUDENT_BADGE_METADATA[bName];
                              return (
                                <span
                                  key={bName}
                                  className={`text-[10px] px-2 py-0.5 rounded-md border font-bold inline-flex items-center gap-1 ${
                                    meta?.colorClass || 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                  }`}
                                >
                                  <span>{meta?.icon || '🏅'}</span>
                                  <span>{bName}</span>
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Chưa có huy hiệu · Click để xem chi tiết tiến trình
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-5 justify-between md:justify-end shrink-0">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Điểm XP</p>
                        <p className="text-sm font-black text-amber-500">{st.xpScore.toLocaleString()} XP</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Điểm TB</p>
                        <p className="text-sm font-black text-emerald-500">{st.avgScore}/10</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Bài tập</p>
                        <p className="text-xs font-extrabold">
                          {st.homeworkDoneCount}/{st.totalHomework || st.homeworkDoneCount}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Thời gian học</p>
                        <p className="text-xs font-extrabold text-blue-500">{st.studyMinutes} phút</p>
                      </div>

                      {confirmKickId === st.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setStudents(kickStudentFromClass(selectedClass, st.id));
                              setConfirmKickId(null);
                              showToast(`Đã xóa "${st.name}" khỏi lớp ${selectedClass}`);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Xác nhận xóa
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmKickId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-zinc-700 text-[10px] font-bold cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmKickId(st.id);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Xóa khỏi lớp"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HOMEWORK REVIEW & GRADING ("Duyệt bài tập") */}
      {activeTab === 'grading' && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-3xl border flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {(['all', 'pending', 'graded'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSubmissionFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    submissionFilter === f
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  {f === 'all' ? 'Tất cả bài nộp' : f === 'pending' ? '⏳ Chờ chấm điểm' : '✅ Đã chấm điểm'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setNewSubStudentId(students[0]?.id || '');
                setShowCreateSubModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi nhận / Nộp bài tập mới</span>
            </button>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className={`p-10 rounded-3xl border text-center space-y-2 ${isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'}`}>
              <FileCheck2 className="w-10 h-10 mx-auto text-slate-400" />
              <h3 className="font-black text-base">Chưa có bài tập nào được nộp trong lớp {selectedClass}</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Khi học sinh nộp ảnh hoặc tệp bài tập, giáo viên có thể xem chi tiết, chấm điểm và gửi nhận xét trực tiếp tại đây.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className={`p-4 rounded-3xl border space-y-3 ${
                    isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          sub.studentAvatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sub.studentName)}`
                        }
                        alt={sub.studentName}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div>
                        <h4 className="font-black text-sm">{sub.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          {sub.studentName} · {sub.subject} · {sub.submittedAt}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full font-black shrink-0 ${
                        sub.status === 'graded'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-amber-500/15 text-amber-500'
                      }`}
                    >
                      {sub.status === 'graded' ? `✅ ${sub.score}/10 điểm` : '⏳ Chờ duyệt'}
                    </span>
                  </div>

                  {sub.description && (
                    <p className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl">
                      {sub.description}
                    </p>
                  )}

                  {sub.attachmentUrl && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 max-h-56">
                      <img src={sub.attachmentUrl} alt="Bài nộp học sinh" className="w-full h-full object-contain bg-black/10" />
                    </div>
                  )}

                  {sub.attachmentName && !sub.attachmentUrl && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/10 text-blue-500 text-xs font-bold">
                      <FileText className="w-4 h-4" />
                      <span>Tệp đính kèm: {sub.attachmentName}</span>
                    </div>
                  )}

                  {sub.teacherRemark && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300">
                      <strong>Nhận xét ({sub.gradedBy}):</strong> {sub.teacherRemark}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setGradingSub(sub);
                        setGradeScore(sub.score !== undefined ? String(sub.score) : '9.5');
                        setGradeRemark(sub.teacherRemark || '');
                      }}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold cursor-pointer"
                    >
                      {sub.status === 'graded' ? 'Sửa Điểm & Nhận Xét' : 'Chấm Điểm & Gửi Nhận Xét'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REAL-TIME ATTENDANCE ("Điểm danh lớp") */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-3xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
              isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ngày học</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Buổi học</label>
                <select
                  value={attendanceSessionName}
                  onChange={(e) => setAttendanceSessionName(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Buổi học chính khóa">Buổi học chính khóa</option>
                  <option value="Buổi Sáng">Buổi Sáng</option>
                  <option value="Buổi Chiều">Buổi Chiều</option>
                  <option value="Tiết Ôn Tập Điểm 10">Tiết Ôn Tập Điểm 10</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-500">
                Có mặt: {attendanceCounts.present}/{attendanceCounts.total}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-500">
                Đi muộn: {attendanceCounts.late}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-500">
                Vắng: {attendanceCounts.absent}
              </span>
              <button
                type="button"
                onClick={() => {
                  const allPresent: Record<string, AttendanceStatus> = {};
                  students.forEach((s) => {
                    allPresent[s.id] = 'present';
                  });
                  setAttendanceRecords(allPresent);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 cursor-pointer"
              >
                ✓ Có mặt tất cả
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={students.length === 0}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white cursor-pointer"
              >
                Lưu Điểm Danh
              </button>
            </div>
          </div>

          {students.length === 0 ? (
            <div className={`p-10 rounded-3xl border text-center text-xs text-slate-500 ${isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'}`}>
              Lớp {selectedClass} chưa có học sinh thật để điểm danh. Hãy thêm học sinh hoặc chờ học sinh đăng ký vào lớp.
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((st) => {
                const status = attendanceRecords[st.id] || 'present';
                return (
                  <div
                    key={st.id}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={st.avatar} alt={st.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <p className="font-extrabold text-sm">{st.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{st.studentCode}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {([
                        { id: 'present' as const, label: '✅ Có mặt', activeClass: 'bg-emerald-600 text-white border-emerald-600' },
                        { id: 'late' as const, label: '⏰ Đi muộn', activeClass: 'bg-amber-500 text-slate-950 border-amber-500' },
                        { id: 'absent' as const, label: '❌ Vắng', activeClass: 'bg-rose-600 text-white border-rose-600' },
                      ]).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setAttendanceRecords((prev) => ({ ...prev, [st.id]: opt.id }))
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer transition-all ${
                            status === opt.id
                              ? opt.activeClass
                              : isDark
                              ? 'bg-zinc-900 border-zinc-700 text-zinc-400'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                      <input
                        type="text"
                        value={attendanceNotes[st.id] || ''}
                        onChange={(e) =>
                          setAttendanceNotes((prev) => ({ ...prev, [st.id]: e.target.value }))
                        }
                        placeholder="Ghi chú (có phép/không phép)..."
                        className={`px-2.5 py-1.5 rounded-xl text-xs border outline-none w-44 ${
                          isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {savedAttendanceHistory.length > 0 && (
            <div className={`p-4 rounded-3xl border space-y-2 ${isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'}`}>
              <h4 className="font-black text-xs uppercase text-slate-400">
                Lịch sử điểm danh lớp {selectedClass}
              </h4>
              <div className="flex flex-wrap gap-2">
                {savedAttendanceHistory.slice(0, 6).map((ses) => {
                  const vals = Object.values(ses.records || {});
                  const pCount = vals.filter((v) => v === 'present').length;
                  return (
                    <div
                      key={ses.id}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs"
                    >
                      <strong>{ses.date}</strong> · {ses.sessionName} · Có mặt {pCount}/{vals.length} ({ses.updatedAt})
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CLASS BULLETIN BOARD ("Bảng tin lớp" + Class Filter 6A1-9D6) */}
      {activeTab === 'bulletin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form
            onSubmit={handlePostBulletin}
            className={`p-5 rounded-3xl border space-y-3.5 h-fit ${
              isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <h3 className="font-black text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-500" />
              <span>Đăng Tin Lên Lớp {selectedClass}</span>
            </h3>

            <div>
              <label className="block text-xs font-bold mb-1">Phân loại bài đăng:</label>
              <select
                value={bulletinCategory}
                onChange={(e) => setBulletinCategory(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="announcement">📢 Thông báo quan trọng</option>
                <option value="exam_schedule">📝 Lịch kiểm tra</option>
                <option value="material">📚 Tài liệu ôn tập mới</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Tiêu đề:</label>
              <input
                type="text"
                required
                value={bulletinTitle}
                onChange={(e) => setBulletinTitle(e.target.value)}
                placeholder="VD: Đề cương ôn tập Giữa kỳ I..."
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Nội dung chi tiết:</label>
              <textarea
                rows={4}
                required
                value={bulletinContent}
                onChange={(e) => setBulletinContent(e.target.value)}
                placeholder="Nhập thông báo, dặn dò hoặc hướng dẫn ôn tập cho cả lớp..."
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Tên tài liệu đính kèm (tùy chọn):</label>
              <input
                type="text"
                value={bulletinAttachment}
                onChange={(e) => setBulletinAttachment(e.target.value)}
                placeholder="VD: De_cuong_Toan_9.pdf"
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs cursor-pointer"
            >
              Đăng Bảng Tin & Thông Báo Lớp
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            <div
              className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-2 ${
                isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <span className="font-black text-sm">Bảng Tin Lớp Học (6A1 - 9D6)</span>
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-500" />
                <select
                  value={bulletinClassFilter}
                  onChange={(e) => setBulletinClassFilter(e.target.value as 'all' | ClassCode)}
                  aria-label="Lọc bảng tin theo lớp"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="all">Tất cả các lớp (6A1 - 9D6)</option>
                  {ALL_CLASSES_LIST.map((code) => (
                    <option key={code} value={code}>
                      Chỉ xem Lớp {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {visibleBulletins.length === 0 ? (
              <div className={`p-10 rounded-3xl border text-center text-xs text-slate-500 ${isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'}`}>
                Chưa có bài đăng nào trong Bảng tin {bulletinClassFilter === 'all' ? 'các lớp' : `lớp ${bulletinClassFilter}`}.
              </div>
            ) : (
              visibleBulletins.map((post) => (
                <div
                  key={post.id}
                  className={`p-4 rounded-3xl border space-y-2 ${
                    isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-500 font-black text-[10px]">
                        Lớp {post.classCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-500 font-bold text-[10px]">
                        {post.category === 'exam_schedule'
                          ? '📝 Lịch kiểm tra'
                          : post.category === 'material'
                          ? '📚 Tài liệu ôn tập'
                          : '📢 Thông báo'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{post.createdAt}</span>
                  </div>
                  <h4 className="font-black text-sm">{post.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                    {post.content}
                  </p>
                  {post.attachmentName && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[11px] font-bold">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{post.attachmentName}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 pt-1">
                    Đăng bởi: <strong>{post.authorName}</strong> ({post.authorRole})
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SHARED CLASS EXAM CALENDAR ("Lịch thi chung" + Auto-sync to PersonalSchedule) */}
      {activeTab === 'shared_exams' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form
            onSubmit={handleCreateSharedExam}
            className={`p-5 rounded-3xl border space-y-3.5 h-fit ${
              isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <h3 className="font-black text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span>Tạo Lịch Thi Chung Lớp {selectedClass}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Khi tạo, thông báo khẩn và lịch thi sẽ tự động hiển thị trên giao diện & Lịch học cá nhân của tất cả học sinh lớp {selectedClass}.
            </p>

            <div>
              <label className="block text-xs font-bold mb-1">Tên kỳ thi / kiểm tra:</label>
              <input
                type="text"
                required
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="VD: Kiểm tra Giữa Học Kỳ I - Toán 9"
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Môn thi:</label>
              <select
                value={examSubject}
                onChange={(e) => setExamSubject(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {SUBJECT_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold mb-1">Ngày thi:</label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Giờ thi:</label>
                <input
                  type="time"
                  required
                  value={examTime}
                  onChange={(e) => setExamTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Nội dung ôn tập trọng tâm:</label>
              <textarea
                rows={3}
                value={examSyllabus}
                onChange={(e) => setExamSyllabus(e.target.value)}
                placeholder="VD: Hệ thức lượng, Phương trình bậc hai, Định lý Vi-ét..."
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Lưu ý phòng thi / dụng cụ:</label>
              <input
                type="text"
                value={examNotes}
                onChange={(e) => setExamNotes(e.target.value)}
                placeholder="VD: Mang máy tính Casio, thước kẻ, compa"
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs cursor-pointer"
            >
              Phát Hành Lịch Thi Chung & Đồng Bộ
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-black text-sm px-1">
              Danh sách Lịch thi chung lớp {selectedClass} ({sharedExams.length} sự kiện)
            </h3>
            {sharedExams.length === 0 ? (
              <div className={`p-10 rounded-3xl border text-center text-xs text-slate-500 ${isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'}`}>
                Chưa có sự kiện lịch thi chung nào cho lớp {selectedClass}.
              </div>
            ) : (
              sharedExams.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-4 rounded-3xl border flex items-start justify-between gap-3 ${
                    isDark ? 'bg-[#101521] border-rose-500/30' : 'bg-white border-rose-200 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-500 font-black text-[10px]">
                        🏫 Lịch thi chung {evt.classCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-500 font-bold text-[10px]">
                        {evt.subject}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-500">
                        {evt.time} · {evt.date}
                      </span>
                    </div>
                    <h4 className="font-black text-sm">{evt.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-300">
                      <strong>Trọng tâm:</strong> {evt.syllabus}
                    </p>
                    {evt.notes && (
                      <p className="text-[11px] text-slate-400">💡 Lưu ý: {evt.notes}</p>
                    )}
                    <p className="text-[10px] text-slate-400">Tạo bởi: {evt.creatorTeacherName}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      deleteSharedClassExam(evt.id);
                      setSharedExams(loadSharedClassExams(selectedClass));
                      showToast('Đã xóa sự kiện lịch thi chung');
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                    title="Xóa lịch thi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: SUMMARY REPORT WITH RECHARTS PIE CHART ("Báo cáo Tổng hợp") */}
      {activeTab === 'summary_report' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base">Báo Cáo Tổng Hợp Hoàn Thành Bài Tập</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Thống kê trực quan tỷ lệ hoàn thành bài tập lớp {selectedClass} và so sánh các lớp đã mở
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Xuất Báo Cáo PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* PIE CHART */}
            <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'}`}>
              <h4 className="font-black text-sm mb-3">
                Tỷ Lệ Học Sinh Hoàn Thành Bài Tập · Lớp {selectedClass}
              </h4>
              {pieChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400 text-center">
                  Lớp {selectedClass} chưa có dữ liệu học sinh thật để vẽ biểu đồ tròn.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={4}
                        label={({ name, percent }) =>
                          `${name}: ${Math.round((percent || 0) * 100)}%`
                        }
                      >
                        {pieChartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* BAR CHART COMPARISON ACROSS ACTIVE CLASSES */}
            <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'}`}>
              <h4 className="font-black text-sm mb-3">
                So Sánh Tỷ Lệ Hoàn Thành (%) Giữa Các Lớp Thực Tế
              </h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crossClassBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e2e8f0'} />
                    <XAxis dataKey="classCode" stroke={isDark ? '#a1a1aa' : '#64748b'} fontSize={12} />
                    <YAxis domain={[0, 100]} stroke={isDark ? '#a1a1aa' : '#64748b'} fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completionRate" name="Tỷ lệ hoàn thành (%)" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className={`p-5 rounded-3xl border overflow-x-auto ${isDark ? 'bg-[#101521] border-white/10' : 'bg-white border-slate-200'}`}>
            <h4 className="font-black text-sm mb-3">Tổng Hợp Các Lớp Đã Kích Hoạt ({allRegistrations.length} phân công GV)</h4>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2 pr-4">Lớp</th>
                  <th className="py-2 pr-4">Giáo Viên Phụ Trách</th>
                  <th className="py-2 pr-4">Vai Trò</th>
                  <th className="py-2 pr-4">Sĩ Số Thật</th>
                  <th className="py-2 pr-4">Hoàn Thành BT</th>
                  <th className="py-2">Điểm TB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {crossClassBarData.map((row) => {
                  const teacher = getClassHomeroomTeacher(row.classCode as ClassCode);
                  return (
                    <tr key={row.classCode}>
                      <td className="py-2.5 pr-4 font-black text-violet-500">{row.classCode}</td>
                      <td className="py-2.5 pr-4 font-bold">{teacher?.name || 'Chưa có GV'}</td>
                      <td className="py-2.5 pr-4">{teacher?.subject || '-'}</td>
                      <td className="py-2.5 pr-4 font-bold">{row.studentsCount} HS</td>
                      <td className="py-2.5 pr-4 font-extrabold text-emerald-500">{row.completionRate}%</td>
                      <td className="py-2.5 font-extrabold text-blue-500">{row.avgScore}/10</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: STUDENT DETAIL MODAL (Submitted assignments, scores, badges, subject progress) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className={`w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border p-6 space-y-5 shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40" />
                <div>
                  <h3 className="text-lg font-black">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Mã HS: <strong>{selectedStudent.studentCode}</strong> · Lớp {selectedStudent.className} · Ngày sinh {selectedStudent.dob}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-extrabold">
                      {selectedStudent.xpScore} XP
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-extrabold">
                      Điểm TB: {selectedStudent.avgScore}/10
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 font-extrabold">
                      Thời gian học: {selectedStudent.studyMinutes} phút
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Digital Achievement Badges */}
            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">
                Huy Hiệu Thành Tích Đã Đạt
              </h4>
              <div className="flex flex-wrap gap-2">
                {computeStudentDigitalBadges(selectedStudent).length > 0 ? (
                  computeStudentDigitalBadges(selectedStudent).map((bName) => {
                    const meta = STUDENT_BADGE_METADATA[bName];
                    return (
                      <div
                        key={bName}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 ${
                          meta?.colorClass || 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                        }`}
                      >
                        <span>{meta?.icon || '🏅'}</span>
                        <span>{bName}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400">Chưa đạt huy hiệu nào. Cần nộp thêm bài tập & tăng thời gian ôn luyện.</p>
                )}
              </div>
            </div>

            {/* Subject-by-Subject Practice Progress */}
            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">
                Tiến Trình Ôn Luyện Từng Môn Học
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(selectedStudent.subjectProgress || {}).map(([subj, prog]) => (
                  <div
                    key={subj}
                    className={`p-3 rounded-2xl border ${isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs">{subj}</span>
                      <span className="text-xs font-black text-emerald-500">{prog.avgScore}/10</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Bài đã học: <strong>{prog.lessonsDone}</strong> · Đề đã luyện: <strong>{prog.quizzesDone}</strong> · {prog.studyMinutes} phút
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* All Submitted Assignments */}
            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">
                Danh Sách Tất Cả Bài Tập Đã Nộp
              </h4>
              {submissions.filter((s) => s.studentId === selectedStudent.id || s.studentName === selectedStudent.name).length === 0 ? (
                <p className="text-xs text-slate-400">Học sinh chưa có bài nộp nào trên hệ thống.</p>
              ) : (
                <div className="space-y-2">
                  {submissions
                    .filter((s) => s.studentId === selectedStudent.id || s.studentName === selectedStudent.name)
                    .map((sub) => (
                      <div
                        key={sub.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                          isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <p className="font-extrabold text-xs">{sub.title}</p>
                          <p className="text-[11px] text-slate-400">
                            {sub.subject} · Nộp lúc {sub.submittedAt}
                          </p>
                          {sub.teacherRemark && (
                            <p className="text-[11px] text-emerald-500 mt-0.5">Nhận xét: {sub.teacherRemark}</p>
                          )}
                        </div>
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-500">
                          {sub.status === 'graded' ? `${sub.score}/10` : 'Chờ chấm'}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD REAL STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <form
            onSubmit={handleAddStudent}
            className={`w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">Thêm Học Sinh Thật · Lớp {selectedClass}</h3>
              <button type="button" onClick={() => setShowAddStudentModal(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Họ và tên học sinh:</label>
              <input
                type="text"
                required
                autoFocus
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Nhập họ tên thật của học sinh..."
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Giới tính:</label>
                <select
                  value={newStudentGender}
                  onChange={(e) => setNewStudentGender(e.target.value as 'male' | 'female')}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Ngày sinh:</label>
                <input
                  type="date"
                  value={newStudentDob}
                  onChange={(e) => setNewStudentDob(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer">
              + Thêm Học Sinh Vào Lớp {selectedClass}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: QUICK NOTIFICATION ("Thông báo nhanh") */}
      {showQuickNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <form
            onSubmit={handleSendQuickNotification}
            className={`w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Thông Báo Nhanh · Lớp {selectedClass}</span>
              </h3>
              <button type="button" onClick={() => setShowQuickNotifModal(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Mức độ ưu tiên:</label>
              <select
                value={notifPriority}
                onChange={(e) => setNotifPriority(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              >
                <option value="urgent">🚨 Khẩn cấp (Nhắc nhở ngay)</option>
                <option value="high">⚡ Quan trọng</option>
                <option value="normal">📌 Thông thường</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Tiêu đề thông báo:</label>
              <input
                type="text"
                required
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="VD: Nhắc nộp bài tập Toán trước 21h tối nay!"
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Nội dung gửi tới thiết bị học sinh:</label>
              <textarea
                rows={4}
                required
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                placeholder="Soạn thông báo tức thời gửi toàn thể học sinh lớp..."
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer">
              <Send className="w-4 h-4" />
              <span>Gửi Ngay Tới Lớp {selectedClass}</span>
            </button>
          </form>
        </div>
      )}

      {/* MODAL: GRADING HOMEWORK */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <form
            onSubmit={handleSaveGrade}
            className={`w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">Chấm Bài: {gradingSub.studentName}</h3>
              <button type="button" onClick={() => setGradingSub(null)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">{gradingSub.title} ({gradingSub.subject})</p>
            <div>
              <label className="block text-xs font-bold mb-1">Điểm số (0 - 10):</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-sm font-black border outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Nhận xét & phản hồi trực tiếp cho học sinh:</label>
              <textarea
                rows={4}
                required
                value={gradeRemark}
                onChange={(e) => setGradeRemark(e.target.value)}
                placeholder="VD: Trình bày sạch đẹp, giải đúng trọng tâm! Cần chú ý thêm điều kiện..."
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs cursor-pointer">
              Lưu Điểm & Gửi Phản Hồi
            </button>
          </form>
        </div>
      )}

      {/* MODAL: CREATE SUBMISSION */}
      {showCreateSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <form
            onSubmit={handleCreateSubmission}
            className={`w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">Ghi Nhận Bài Tập Đã Nộp</h3>
              <button type="button" onClick={() => setShowCreateSubModal(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {students.length === 0 ? (
              <p className="text-xs text-rose-500 font-bold">Vui lòng thêm ít nhất 1 học sinh thật vào lớp {selectedClass} trước khi nộp bài.</p>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold mb-1">Học sinh nộp bài:</label>
                  <select
                    value={newSubStudentId}
                    onChange={(e) => setNewSubStudentId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>{st.name} ({st.studentCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Môn học:</label>
                  <select
                    value={newSubSubject}
                    onChange={(e) => setNewSubSubject(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  >
                    {SUBJECT_LIST.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Tên bài tập:</label>
                  <input
                    type="text"
                    required
                    value={newSubTitle}
                    onChange={(e) => setNewSubTitle(e.target.value)}
                    placeholder="VD: Bài tập Phương trình bậc hai"
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Nội dung / Ghi chú bài làm:</label>
                  <textarea
                    rows={3}
                    value={newSubDesc}
                    onChange={(e) => setNewSubDesc(e.target.value)}
                    placeholder="Ghi chú hoặc tóm tắt bài giải..."
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Tải lên ảnh hoặc tệp bài tập:</label>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleUploadHomeworkFile}
                    className="w-full text-xs"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer">
                  Gửi Bài Tập Lên Hệ Thống
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* MODAL: AWARD COLLECTIVE BADGE */}
      {showAwardBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Trao Huy Hiệu Tập Thể · Lớp {selectedClass}</span>
              </h3>
              <button type="button" onClick={() => setShowAwardBadgeModal(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {COLLECTIVE_BADGE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.badgeId}
                  type="button"
                  onClick={() => handleAwardCollective(tpl)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    isDark ? 'bg-zinc-800/80 border-zinc-700 hover:border-amber-500' : 'bg-slate-50 border-slate-200 hover:border-amber-400'
                  }`}
                >
                  <span className="text-2xl">{tpl.icon}</span>
                  <div>
                    <div className="font-black text-xs">{tpl.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{tpl.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
