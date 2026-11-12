import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Download,
  Filter,
  UserX,
  MessageSquare,
  Sparkles,
  GraduationCap,
  Award,
  BookOpen,
  Phone,
  Mail,
  X,
  Check,
  Flame,
  FileText,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Radio,
  Bell,
  BellRing,
  Send,
  Smartphone,
  CheckCheck,
  Megaphone,
  Trash2,
} from 'lucide-react';
import {
  ALL_CLASSES_LIST,
  ClassCode,
  ClassStudent,
  HOMEROOM_TEACHERS,
  loadClassStudents,
  saveClassStudents,
  kickStudentFromClass,
  HomeworkStatus,
  ClassPushNotification,
  loadClassPushNotifications,
  saveClassPushNotifications,
  dispatchClassPushNotification,
} from '../../data/classSystemData';
import { soundEffects } from '../../utils/soundEffects';
import { celebrationEngine } from '../../utils/confettiFireworks';

interface ClassManagementProps {
  isDark: boolean;
  currentUser?: any;
  onNavigateToTab?: (tab: any) => void;
  onOpenConversation?: (type: 'direct' | 'group', targetId: string) => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  isDark,
  currentUser,
  onNavigateToTab,
  onOpenConversation,
}) => {
  const [selectedClass, setSelectedClass] = useState<ClassCode>('9D1');
  const [filterStatus, setFilterStatus] = useState<HomeworkStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<ClassStudent[]>(() => loadClassStudents('9D1'));

  // Modals
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [studentToKick, setStudentToKick] = useState<ClassStudent | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Broadcast Push Notification Form State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifCategory, setNotifCategory] = useState<'homework' | 'exam' | 'urgent' | 'reminder'>('homework');
  const [notifPriority, setNotifPriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [notifDueTime, setNotifDueTime] = useState('21:00 tối nay');
  const [classNotifications, setClassNotifications] = useState<ClassPushNotification[]>(() =>
    loadClassPushNotifications('9D1')
  );
  const [pushPermissionStatus, setPushPermissionStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // When class changes, reload students & notifications
  const handleSelectClass = (cls: ClassCode) => {
    setSelectedClass(cls);
    const loaded = loadClassStudents(cls);
    setStudents(loaded);
    setClassNotifications(loadClassPushNotifications(cls));
  };

  const currentTeacher = HOMEROOM_TEACHERS[selectedClass];

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filterStatus !== 'all' && s.homeworkStatus !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchCode = s.studentCode.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [students, filterStatus, searchQuery]);

  // Statistics
  const totalCount = students.length;
  const submittedCount = students.filter((s) => s.homeworkStatus === 'submitted').length;
  const unsubmittedCount = students.filter((s) => s.homeworkStatus === 'unsubmitted').length;
  const practicingCount = students.filter((s) => s.homeworkStatus === 'practicing').length;
  const submittedPercent = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;
  const avgClassScore =
    totalCount > 0
      ? (students.reduce((acc, s) => acc + s.avgScore, 0) / totalCount).toFixed(1)
      : '0.0';

  // Handle Kick Student
  const handleConfirmKick = () => {
    if (!studentToKick) return;
    const updated = kickStudentFromClass(selectedClass, studentToKick.id);
    setStudents(updated);
    soundEffects.playWrong();
    setToastMessage(`🚫 Đã kích học sinh "${studentToKick.name}" khỏi lớp ${selectedClass} vì không thuộc lớp này!`);
    setTimeout(() => setToastMessage(null), 4000);
    setStudentToKick(null);
  };

  // Quick toggle student homework status
  const handleToggleHomeworkStatus = (studentId: string) => {
    const nextList = students.map((s) => {
      if (s.id === studentId) {
        let nextStatus: HomeworkStatus = 'submitted';
        if (s.homeworkStatus === 'submitted') nextStatus = 'unsubmitted';
        else if (s.homeworkStatus === 'unsubmitted') nextStatus = 'practicing';
        else nextStatus = 'submitted';

        return {
          ...s,
          homeworkStatus: nextStatus,
          homeworkDoneCount:
            nextStatus === 'submitted'
              ? s.totalHomework
              : nextStatus === 'practicing'
              ? s.totalHomework - 2
              : s.totalHomework - 5,
          lastSubmittedAt: nextStatus === 'submitted' ? 'Vừa xong' : s.lastSubmittedAt,
        };
      }
      return s;
    });
    setStudents(nextList);
    saveClassStudents(selectedClass, nextList);
    soundEffects.playCorrect();
  };

  // Direct shortcut to class group chat
  const handleGoToClassGroup = () => {
    if (onNavigateToTab) {
      onNavigateToTab('group');
    }
    if (onOpenConversation) {
      onOpenConversation('group', `class-group-${selectedClass.toLowerCase()}`);
    }
  };

  // Push Notification Templates
  const TEMPLATE_PRESETS = [
    {
      label: '⏳ Nhắc nộp bài tập tối nay',
      category: 'homework' as const,
      priority: 'high' as const,
      title: `[GẤP] Hạn chót nộp bài tập về nhà môn ${currentTeacher?.subject || 'Toán'} trước 21h00`,
      body: `Thầy/cô nhắc cả lớp ${selectedClass} nhanh chóng hoàn thành bài tập về nhà và nộp trên ứng dụng trước 21h00 tối nay để thầy cô chấm điểm và xếp hạng thi đua nhé!`,
      dueTime: '21:00 tối nay',
    },
    {
      label: '📝 Lịch kiểm tra 1 tiết sắp tới',
      category: 'exam' as const,
      priority: 'urgent' as const,
      title: `[LỊCH THI] Ngày mai kiểm tra 1 tiết môn ${currentTeacher?.subject || 'Toán'} (Có câu Điểm 10)`,
      body: `Ngày mai lớp ${selectedClass} có bài kiểm tra 1 tiết bám sát cấu trúc đề Bộ GD&ĐT. Các em nhớ mang đủ máy tính, compa, thước kẻ và ôn kỹ các dạng bài bẫy.`,
      dueTime: 'Tiết 2 ngày mai',
    },
    {
      label: '🎯 Ôn luyện Thư viện Đề thi',
      category: 'reminder' as const,
      priority: 'normal' as const,
      title: `[ÔN TẬP] Đề thi thử mới đã được đưa lên Thư viện Đề thi lớp ${selectedClass}`,
      body: `Thầy/cô vừa biên soạn và tải lên bộ đề thi thử khảo sát chất lượng bứt phá Điểm 10 cho lớp ${selectedClass}. Các em hãy vào tab Luyện đề để làm ngay nhé!`,
      dueTime: 'Trước Chủ nhật',
    },
    {
      label: '⚠️ Đôn đốc bạn chưa nộp bài',
      category: 'urgent' as const,
      priority: 'urgent' as const,
      title: `[CẢNH BÁO BÀI TẬP] Còn ${unsubmittedCount} học sinh chưa nộp bài tập về nhà`,
      body: `Hệ thống ghi nhận lớp ${selectedClass} vẫn còn ${unsubmittedCount} bạn chưa nộp bài tập. Yêu cầu các em hoàn thành khẩn trương trong hôm nay để không bị trừ điểm thi đua!`,
      dueTime: 'Hôm nay',
    },
  ];

  const handleApplyTemplate = (tpl: typeof TEMPLATE_PRESETS[0]) => {
    setNotifTitle(tpl.title);
    setNotifBody(tpl.body);
    setNotifCategory(tpl.category);
    setNotifPriority(tpl.priority);
    setNotifDueTime(tpl.dueTime);
    soundEffects.playCorrect();
  };

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPushPermissionStatus(perm);
        if (perm === 'granted') {
          soundEffects.playCorrect();
          setToastMessage('✅ Quyền Push Notification đã được kích hoạt thành công trên thiết bị!');
          setTimeout(() => setToastMessage(null), 3000);
        }
      } catch (e) {}
    }
  };

  const handleSendPushNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) return;

    // Check & request browser notification permission if not yet decided
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        setPushPermissionStatus(perm);
      } catch (e) {}
    }

    const teacher = HOMEROOM_TEACHERS[selectedClass];
    const newNotif: ClassPushNotification = {
      id: `notif-${Date.now()}`,
      classCode: selectedClass,
      title: notifTitle.trim(),
      body: notifBody.trim(),
      category: notifCategory,
      priority: notifPriority,
      senderTeacherName: teacher ? teacher.name : (currentUser?.name || 'Giáo viên Chủ nhiệm'),
      senderAvatar: teacher ? teacher.avatar : (currentUser?.avatar || '/max10-avatar.jpg'),
      createdAt: 'Vừa xong',
      deliveredCount: totalCount,
      readCount: 0,
      dueTime: notifDueTime.trim() || undefined,
    };

    // Dispatch system & OS push notification
    dispatchClassPushNotification(newNotif);
    soundEffects.playStudyAlert();
    celebrationEngine.launchConfetti(35);

    // Update notifications list
    const updatedNotifs = [newNotif, ...classNotifications];
    setClassNotifications(updatedNotifs);

    // Feedback
    setToastMessage(`📢 Đã gửi thành công thông báo đẩy tới toàn bộ ${totalCount} học sinh lớp ${selectedClass}!`);
    setTimeout(() => setToastMessage(null), 5000);

    // Close modal & reset fields
    setShowBroadcastModal(false);
    setNotifTitle('');
    setNotifBody('');
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa bản ghi thông báo này?')) {
      const updated = classNotifications.filter((n) => n.id !== id);
      setClassNotifications(updated);
      saveClassPushNotifications(selectedClass, updated);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-[999999] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-xs shadow-2xl border border-white/20">
              <Sparkles className="w-4 h-4 fill-current text-amber-300 animate-spin" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* HEADER HERO BANNER */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 overflow-hidden border shadow-xl transition-all ${
            isDark
              ? 'bg-gradient-to-br from-[#131929] via-[#0f1522] to-[#1a233a] border-white/10 text-white'
              : 'bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/40 border-slate-200/90 text-slate-900 shadow-slate-200/60'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Cổng Quản Lý Lớp Học Dành Cho Giáo Viên</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Quản Lý Lớp Học &amp; Tiến Độ Bài Tập
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
                Theo dõi toàn diện học sinh lớp mình đã làm bài tập chưa, kiểm tra số bài tập và tiến độ ôn luyện thi của từng học sinh trong 24 lớp (6A1 - 9D6). Kích học sinh lạ, bắn thông báo đẩy (Push) và xuất báo cáo PDF chuẩn mực!
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(true)}
                className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                title={`Gửi thông báo đẩy hệ thống (Push notification) tới toàn bộ ${totalCount} học sinh lớp ${selectedClass}`}
              >
                <Radio className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Gửi Thông Báo Hệ Thống (Push)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-black">
                  {totalCount} HS
                </span>
              </button>

              <button
                type="button"
                onClick={handleGoToClassGroup}
                className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                title="Đi tới tin nhắn trao đổi của lớp học này"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Tin Nhắn Lớp {selectedClass}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                title="Tải về bảng tổng hợp điểm số và tiến độ ôn luyện của lớp dạng PDF"
              >
                <Download className="w-4 h-4" />
                <span>Xuất Báo Cáo PDF</span>
              </button>
            </div>
          </div>

          {/* 24 CLASSES SELECTOR BAR */}
          <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-white/10">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Chọn Lớp Giảng Dạy &amp; Chủ Nhiệm (24 Lớp 6A1 - 9D6):
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                Đang xem: Lớp {selectedClass}
              </span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2">
              {ALL_CLASSES_LIST.map((cls) => {
                const isSelected = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => handleSelectClass(cls)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105 ring-2 ring-purple-400'
                        : isDark
                        ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* HOMEROOM TEACHER INFO & CLASS METRICS CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Teacher Info Card */}
          <div
            className={`p-5 rounded-3xl border transition-all flex items-start gap-4 ${
              isDark
                ? 'bg-[#101625] border-purple-500/30 text-white'
                : 'bg-white border-purple-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="relative shrink-0">
              <img
                src={currentTeacher.avatar}
                alt={currentTeacher.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500 shadow-md"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] font-black rounded-md uppercase">
                GV Thật
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  GVCN {selectedClass}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ Người thật (Không AI)
                </span>
              </div>
              <h3 className="font-black text-sm truncate">{currentTeacher.name}</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">{currentTeacher.title}</p>
              <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-zinc-300">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-purple-500" /> {currentTeacher.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-blue-500" /> {currentTeacher.email}
                </span>
              </div>
              <p className="text-[11px] italic text-slate-500 dark:text-zinc-400 pt-1 line-clamp-2">
                &ldquo;{currentTeacher.message}&rdquo;
              </p>
            </div>
          </div>

          {/* Quick Class Metrics */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setFilterStatus('all')}
              className={`p-4 rounded-3xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${
                filterStatus === 'all'
                  ? 'border-purple-500 bg-purple-500/10'
                  : isDark
                  ? 'bg-zinc-900/60 border-white/5'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Sĩ số lớp</span>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {totalCount} <span className="text-xs font-normal opacity-80">học sinh</span>
              </p>
              <span className="text-[10px] text-slate-400 mt-1">100% học sinh thật</span>
            </div>

            <div
              onClick={() => setFilterStatus('submitted')}
              className={`p-4 rounded-3xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${
                filterStatus === 'submitted'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : isDark
                  ? 'bg-zinc-900/60 border-white/5'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Đã nộp bài</span>
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {submittedCount}{' '}
                <span className="text-xs font-normal opacity-80">({submittedPercent}%)</span>
              </p>
              <span className="text-[10px] text-emerald-500 mt-1">Đạt chỉ tiêu tuần</span>
            </div>

            <div
              onClick={() => setFilterStatus('unsubmitted')}
              className={`p-4 rounded-3xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${
                filterStatus === 'unsubmitted'
                  ? 'border-rose-500 bg-rose-500/10'
                  : isDark
                  ? 'bg-zinc-900/60 border-white/5'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Chưa nộp bài</span>
              </span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {unsubmittedCount} <span className="text-xs font-normal opacity-80">học sinh</span>
              </p>
              <span className="text-[10px] text-rose-500 mt-1">Cần nhắc nhở gấp</span>
            </div>

            <div
              onClick={() => setFilterStatus('practicing')}
              className={`p-4 rounded-3xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${
                filterStatus === 'practicing'
                  ? 'border-amber-500 bg-amber-500/10'
                  : isDark
                  ? 'bg-zinc-900/60 border-white/5'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Đang ôn luyện</span>
              </span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {practicingCount} <span className="text-xs font-normal opacity-80">học sinh</span>
              </p>
              <span className="text-[10px] text-amber-500 mt-1">Điểm TB: {avgClassScore}/10</span>
            </div>
          </div>
        </div>

        {/* RECENT PUSH BROADCAST BANNER */}
        {classNotifications.length > 0 && (
          <div
            className={`p-4 sm:p-5 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
              isDark
                ? 'bg-gradient-to-r from-purple-950/40 via-zinc-900/80 to-indigo-950/30 border-purple-500/30'
                : 'bg-gradient-to-r from-purple-50/90 via-white to-indigo-50/80 border-purple-200 shadow-2xs'
            }`}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 border border-purple-500/30">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-black text-[10px] uppercase">
                    Thông báo gần nhất
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {classNotifications[0].title}
                  </span>
                  {classNotifications[0].dueTime && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold">
                      ⏰ {classNotifications[0].dueTime}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 line-clamp-1">
                  {classNotifications[0].body}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                  Đã phát tới {classNotifications[0].deliveredCount}/{totalCount} học sinh lớp {selectedClass} · {classNotifications[0].createdAt} bởi {classNotifications[0].senderTeacherName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(true)}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Bắn thông báo mới</span>
              </button>
            </div>
          </div>
        )}

        {/* FILTER & SEARCH CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('submitted')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'submitted'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ✅ Đã nộp bài tập ({submittedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('unsubmitted')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'unsubmitted'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ⚠️ Chưa nộp bài ({unsubmittedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('practicing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'practicing'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🔥 Đang ôn luyện ({practicingCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên hoặc mã học sinh..."
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-purple-500'
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500'
              }`}
            />
          </div>
        </div>

        {/* STUDENT ROSTER TABLE */}
        <div
          className={`rounded-3xl border overflow-hidden ${
            isDark ? 'bg-[#0f1420] border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider ${
                  isDark ? 'bg-zinc-900/60 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Học Sinh</th>
                  <th className="py-3 px-4">Ngày Sinh</th>
                  <th className="py-3 px-4">Trạng Thái Bài Tập</th>
                  <th className="py-3 px-4">Bài Hoàn Thành</th>
                  <th className="py-3 px-4">Tiến Độ Ôn Luyện</th>
                  <th className="py-3 px-4">Điểm TB</th>
                  <th className="py-3 px-4 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      Không tìm thấy học sinh nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const isSubmitted = student.homeworkStatus === 'submitted';
                    const isUnsubmitted = student.homeworkStatus === 'unsubmitted';

                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* STT */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Student Name & Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-9 h-9 rounded-xl object-cover border border-purple-400"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white">
                                {student.name}
                              </p>
                              <span className="text-[10px] font-mono text-slate-400">
                                {student.studentCode}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* DOB */}
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-zinc-400">
                          {student.dob}
                        </td>

                        {/* Homework Status */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleHomeworkStatus(student.id)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                              isSubmitted
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : isUnsubmitted
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                            title="Bấm để đổi trạng thái nộp bài"
                          >
                            {isSubmitted ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Đã nộp bài</span>
                              </>
                            ) : isUnsubmitted ? (
                              <>
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                <span>Chưa nộp bài</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Đang ôn luyện</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Homework Completed Count */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 dark:text-zinc-200">
                            {student.homeworkDoneCount}/{student.totalHomework} bài
                          </span>
                        </td>

                        {/* Exam Practice Progress */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-blue-600 dark:text-blue-400">
                              {student.examPracticeCount} đề thi đã luyện
                            </span>
                            <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {student.teacherRemark}
                            </p>
                          </div>
                        </td>

                        {/* Average Score */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                              student.avgScore >= 8.5
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : student.avgScore >= 7.0
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {student.avgScore}
                          </span>
                        </td>

                        {/* Action Buttons: Message & Kick out of class */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateToTab) onNavigateToTab('group');
                                if (onOpenConversation) onOpenConversation('direct', student.id);
                              }}
                              className="p-1.5 rounded-xl hover:bg-blue-500/15 text-blue-500 transition-colors cursor-pointer"
                              title={`Nhắn tin riêng với học sinh ${student.name}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* User Requirement: "khi vào lớp mà giáo viên thấy không phải học sinh lớp mình thì có thể kích luôn" */}
                            <button
                              type="button"
                              onClick={() => setStudentToKick(student)}
                              className="py-1 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer active:scale-95 border border-rose-500/20"
                              title="Kích học sinh ra khỏi lớp nếu không phải học sinh lớp này"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Kích khỏi lớp</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: KICK CONFIRMATION */}
        {studentToKick && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
            <div
              className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
                isDark ? 'bg-[#0f1420] text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <UserX className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-center">
                Xác Nhận Kích Khỏi Lớp {selectedClass}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 text-center mt-1">
                Bạn có chắc chắn muốn kích học sinh{' '}
                <strong className="text-rose-500">{studentToKick.name}</strong> ({studentToKick.studentCode}) ra khỏi danh sách và nhóm trao đổi lớp {selectedClass} vì không thuộc lớp này không?
              </p>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStudentToKick(null)}
                  className="flex-1 py-2.5 rounded-2xl border text-xs font-bold text-slate-600 dark:text-zinc-400 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmKick}
                  className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Xác Nhận Kích Ngay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EXPORT PDF REPORT */}
        {showPdfModal && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div
              className={`w-full max-w-4xl rounded-3xl p-6 sm:p-8 shadow-2xl border max-h-[92vh] overflow-y-auto ${
                isDark ? 'bg-[#0f1420] text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 print:hidden">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-purple-500" />
                  <h3 className="font-black text-base">Báo Cáo Tổng Hợp Điểm Số &amp; Tiến Độ - Lớp {selectedClass}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In / Lưu PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPdfModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable PDF Content */}
              <div className="mt-6 space-y-6 text-slate-900 dark:text-slate-100 print:text-black">
                {/* Official School Header */}
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider">
                      BỘ GIÁO DỤC VÀ ĐÀO TẠO
                    </p>
                    <p className="text-xs font-black uppercase text-purple-700">
                      TRƯỜNG THCS CHẤT LƯỢNG CAO MAX10
                    </p>
                    <p className="text-[10px] text-slate-500">Số: 2026/BC-THCS-MAX10</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black uppercase">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>
                    <p className="text-[10px] italic">Độc lập - Tự do - Hạnh phúc</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                    </p>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-lg font-black uppercase tracking-wide">
                    BÁO CÁO TỔNG HỢP TIẾN ĐỘ BÀI TẬP VÀ ÔN LUYỆN ĐỀ THI
                  </h2>
                  <p className="text-xs font-bold text-purple-600">
                    LỚP: {selectedClass} · NĂM HỌC 2026 - 2027
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Giáo viên chủ nhiệm: <strong>{currentTeacher.name}</strong> · Sĩ số: <strong>{totalCount} học sinh</strong>
                  </p>
                </div>

                {/* Summary Statistics Box */}
                <div className="grid grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">TỔNG SỐ BÀI TẬP</span>
                    <strong className="text-sm font-black">12 bài</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ĐÃ NỘP BÀI</span>
                    <strong className="text-sm font-black text-emerald-600">{submittedCount}/{totalCount} ({submittedPercent}%)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CHƯA NỘP BÀI</span>
                    <strong className="text-sm font-black text-rose-600">{unsubmittedCount} học sinh</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ĐIỂM TRUNG BÌNH</span>
                    <strong className="text-sm font-black text-purple-600">{avgClassScore}/10</strong>
                  </div>
                </div>

                {/* Full Student Table */}
                <table className="w-full text-left text-xs border border-slate-300 dark:border-zinc-700">
                  <thead className="bg-slate-100 dark:bg-zinc-800 font-bold border-b">
                    <tr>
                      <th className="p-2 border">STT</th>
                      <th className="p-2 border">Mã HS</th>
                      <th className="p-2 border">Họ và Tên</th>
                      <th className="p-2 border">Ngày Sinh</th>
                      <th className="p-2 border">Trạng Thái Bài Tập</th>
                      <th className="p-2 border">Số Bài Hoàn Thành</th>
                      <th className="p-2 border">Số Đề Đã Luyện</th>
                      <th className="p-2 border">Điểm TB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((std, i) => (
                      <tr key={std.id} className="border-b">
                        <td className="p-2 border text-center font-bold">{i + 1}</td>
                        <td className="p-2 border font-mono">{std.studentCode}</td>
                        <td className="p-2 border font-bold">{std.name}</td>
                        <td className="p-2 border font-mono">{std.dob}</td>
                        <td className="p-2 border">
                          {std.homeworkStatus === 'submitted'
                            ? '✓ Đã nộp đủ'
                            : std.homeworkStatus === 'practicing'
                            ? '⏳ Đang ôn luyện'
                            : '✗ Chưa nộp bài'}
                        </td>
                        <td className="p-2 border text-center font-bold">
                          {std.homeworkDoneCount}/{std.totalHomework}
                        </td>
                        <td className="p-2 border text-center font-bold text-blue-600">
                          {std.examPracticeCount} đề
                        </td>
                        <td className="p-2 border text-center font-black">
                          {std.avgScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signature Block */}
                <div className="pt-8 grid grid-cols-2 text-center text-xs">
                  <div>
                    <p className="font-bold uppercase">NGƯỜI LẬP BÁO CÁO</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16" />
                    <p className="font-black">{currentTeacher.name}</p>
                    <p className="text-[10px] text-slate-500">Giáo viên chủ nhiệm lớp {selectedClass}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase">HIỆU TRƯỞNG PHÊ DUYỆT</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">(Ký, đóng dấu điện tử)</p>
                    <div className="h-16 flex items-center justify-center">
                      <span className="px-3 py-1 rounded border-2 border-rose-600 text-rose-600 font-black text-[10px] uppercase rotate-[-6deg]">
                        ĐÃ XÁC NHẬN CHÍNH THỨC
                      </span>
                    </div>
                    <p className="font-black">PGS. TS. Mạc Khánh Duy</p>
                    <p className="text-[10px] text-slate-500">Chủ tịch Hội đồng Giáo dục THCS Max10</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: GỬI THÔNG BÁO HỆ THỐNG (PUSH NOTIFICATION) LỚP     */}
        {/* ======================================================== */}
        {showBroadcastModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden relative ${
                isDark ? 'bg-[#0f1422] border-purple-500/30 text-white' : 'bg-white border-purple-200 text-slate-900'
              }`}
            >
              {/* Modal Top Header */}
              <div className="p-4 sm:p-6 pb-3 flex items-start justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-500 text-white shadow-md shadow-purple-500/20 shrink-0">
                    <Radio className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black tracking-tight">
                        Gửi Thông Báo Hệ Thống (Push) Lớp {selectedClass}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] border border-purple-500/30">
                        {totalCount} Học sinh nhận
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Phát thông báo đẩy tức thì tới thiết bị của toàn bộ học sinh lớp {selectedClass} để nhắc nhở bài tập và lịch thi.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
                {/* Browser Permission Banner */}
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    pushPermissionStatus === 'granted'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {pushPermissionStatus === 'granted' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <BellRing className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
                    )}
                    <span className="font-bold truncate">
                      {pushPermissionStatus === 'granted'
                        ? 'Quyền thông báo đẩy (Push Notification) đã sẵn sàng hoạt động.'
                        : 'Chưa cấp quyền Push thông báo trên trình duyệt/máy tính.'}
                    </span>
                  </div>

                  {pushPermissionStatus !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestPushPermission}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shadow-sm transition-all whitespace-nowrap cursor-pointer shrink-0"
                    >
                      Bật quyền Push ngay
                    </button>
                  )}
                </div>

                {/* Quick Templates Chips */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-1.5">
                    Mẫu thông báo gợi ý (1-chạm tự động điền):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TEMPLATE_PRESETS.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          notifTitle === tpl.title
                            ? 'border-purple-500 bg-purple-500/15 ring-1 ring-purple-500 font-bold'
                            : isDark
                            ? 'bg-zinc-800/60 border-white/5 hover:border-purple-500/50'
                            : 'bg-slate-50 border-slate-200 hover:border-purple-400'
                        }`}
                      >
                        <span className="truncate">{tpl.label}</span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-black shrink-0">
                          Áp dụng
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Form Fields */}
                <form id="broadcast-push-form" onSubmit={handleSendPushNotification} className="space-y-4">
                  {/* Category & Priority Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        Loại thông báo:
                      </label>
                      <select
                        value={notifCategory}
                        onChange={(e) => setNotifCategory(e.target.value as any)}
                        className={`w-full px-3.5 py-2 rounded-xl border outline-none font-bold cursor-pointer ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value="homework">📝 Nhắc nộp bài tập về nhà</option>
                        <option value="exam">📅 Lịch kiểm tra &amp; Thi học kỳ</option>
                        <option value="reminder">🎯 Dặn dò ôn luyện Điểm 10</option>
                        <option value="urgent">🚨 Thông báo khẩn từ GVCN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        Mức độ ưu tiên:
                      </label>
                      <select
                        value={notifPriority}
                        onChange={(e) => setNotifPriority(e.target.value as any)}
                        className={`w-full px-3.5 py-2 rounded-xl border outline-none font-bold cursor-pointer ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value="normal">🔵 Bình thường (Tiêu chuẩn)</option>
                        <option value="high">🟠 Quan trọng (Nhắc nhở gấp)</option>
                        <option value="urgent">🔴 Khẩn cấp (Báo động đỏ)</option>
                      </select>
                    </div>
                  </div>

                  {/* Title & Due Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        Tiêu đề thông báo:
                      </label>
                      <input
                        type="text"
                        required
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        placeholder="VD: [GẤP] Hạn nộp bài tập Toán về nhà trước 21h00 tối nay"
                        className={`w-full px-3.5 py-2 rounded-xl border outline-none font-bold ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        Hạn chót / Giờ thi:
                      </label>
                      <input
                        type="text"
                        value={notifDueTime}
                        onChange={(e) => setNotifDueTime(e.target.value)}
                        placeholder="VD: 21:00 tối nay"
                        className={`w-full px-3.5 py-2 rounded-xl border outline-none font-bold ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Body Textarea */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Nội dung thông báo chi tiết gửi tới toàn thể học sinh:
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={notifBody}
                      onChange={(e) => setNotifBody(e.target.value)}
                      placeholder="Nhập nội dung dặn dò học sinh lớp..."
                      className={`w-full px-3.5 py-2 rounded-xl border outline-none leading-relaxed ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                </form>

                {/* LIVE PUSH NOTIFICATION DEVICE PREVIEW */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                      <span>Xem trước giao diện Push Notification trên thiết bị học sinh:</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      🔔 Kèm chuông báo âm thanh Điểm 10
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-3xl border shadow-lg relative overflow-hidden transition-all ${
                      isDark
                        ? 'bg-gradient-to-r from-[#172033] to-[#121927] border-purple-500/40 text-white'
                        : 'bg-gradient-to-r from-purple-50/90 to-white border-purple-300 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-purple-600 to-rose-500 shrink-0 shadow-md">
                        <img
                          src={currentTeacher.avatar}
                          alt={currentTeacher.name}
                          className="w-full h-full object-cover rounded-[14px]"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wide text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <span>Max10 AI · Lớp {selectedClass}</span>
                            <span className="text-slate-400 font-normal">· Vừa xong</span>
                          </span>
                          {notifDueTime && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              ⏰ {notifDueTime}
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-xs sm:text-sm mt-0.5 text-slate-900 dark:text-white">
                          {notifTitle || `[THÔNG BÁO LỚP ${selectedClass}] Tiêu đề nhắc nhở bài tập...`}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 leading-relaxed">
                          {notifBody || `Thầy/cô nhắc cả lớp ${selectedClass} hoàn thành bài tập về nhà đúng hạn...`}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <span>GVCN: {currentTeacher.name}</span>
                          </span>
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            Bấm để mở Max10 AI &amp; nộp bài ngay →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sent History Drawer for this class */}
                {classNotifications.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-2">
                      Lịch sử thông báo đã phát cho lớp {selectedClass} ({classNotifications.length}):
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {classNotifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                            isDark ? 'bg-zinc-900/60 border-white/5' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                                  n.priority === 'urgent'
                                    ? 'bg-rose-500/20 text-rose-600'
                                    : n.priority === 'high'
                                    ? 'bg-amber-500/20 text-amber-600'
                                    : 'bg-blue-500/20 text-blue-600'
                                }`}
                              >
                                {n.priority === 'urgent' ? 'Khẩn cấp' : n.priority === 'high' ? 'Quan trọng' : 'Tiêu chuẩn'}
                              </span>
                              <span className="font-black text-slate-900 dark:text-white truncate">
                                {n.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                              {n.body}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {n.createdAt} · Đã gửi tới {n.deliveredCount} học sinh · {n.dueTime ? 'Hạn: ' + n.dueTime : ''}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteNotification(n.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                            title="Xóa thông báo này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  form="broadcast-push-form"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Bắn Thông Báo Đẩy Tới {totalCount} Học Sinh Ngay</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
