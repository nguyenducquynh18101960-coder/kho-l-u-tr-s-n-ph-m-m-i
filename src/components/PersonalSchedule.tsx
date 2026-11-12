import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  AlertTriangle,
  BookOpen,
  FileCheck2,
  Sparkles,
  Trash2,
  Edit2,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Flame,
  Tag,
  Share2,
  GraduationCap,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Smartphone,
  ShieldCheck,
  Sliders,
  HelpCircle,
  X,
  Check,
} from 'lucide-react';
import { GradeLevel } from '../types';
import { celebrationEngine } from '../utils/confettiFireworks';
import { soundEffects } from '../utils/soundEffects';

export type ScheduleCategory = 'exam' | 'homework' | 'event';
export type SchedulePriority = 'urgent' | 'high' | 'normal' | 'low';

export interface ScheduleEvent {
  id: string;
  title: string;
  category: ScheduleCategory; // 'exam': Lịch kiểm tra, 'homework': Hạn nộp bài tập, 'event': Sự kiện quan trọng
  subject: string;
  date: string; // 'YYYY-MM-DD'
  time?: string; // 'HH:mm'
  priority: SchedulePriority;
  notes?: string;
  syllabus?: string; // Nội dung ôn tập
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface StudyAlertSettings {
  enablePushNotifications: boolean; // Gửi thông báo đẩy (push notification) trên thiết bị
  enableInAppAlerts: boolean; // Nhắc nhở nổi trong ứng dụng
  leadMinutes: number; // 30 phút trước lịch kiểm tra hoặc hạn nộp bài tập đã lưu
  notifyExams: boolean; // Nhắc lịch kiểm tra
  notifyHomework: boolean; // Nhắc hạn nộp bài tập
  notifyEvents: boolean; // Nhắc sự kiện học kỳ
  soundEnabled: boolean; // Chuông nhắc nhở âm thanh
}

const STORAGE_KEY_SCHEDULE = 'max10_personal_schedule_events_v1';
const STORAGE_KEY_ALERT_SETTINGS = 'max10_study_alerts_config_v1';
const STORAGE_KEY_FIRED_ALERTS = 'max10_study_alerts_fired_v1';

const INITIAL_SCHEDULE_EVENTS: ScheduleEvent[] = [
  {
    id: 'evt-1',
    title: 'Kiểm tra giữa học kỳ I môn Toán',
    category: 'exam',
    subject: 'Toán học',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '08:00',
    priority: 'urgent',
    syllabus: 'Căn bậc hai, hàm số bậc nhất y = ax + b, hệ thức lượng trong tam giác vuông',
    notes: 'Mang theo máy tính Casio FX-580VNX, thước kẻ, compa. Mục tiêu: 10 điểm!',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-2',
    title: 'Hạn nộp bài viết Tập làm văn số 2',
    category: 'homework',
    subject: 'Ngữ văn',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '23:59',
    priority: 'high',
    syllabus: 'Nghị luận về một hiện tượng đời sống hoặc vấn đề tư tưởng đạo lý',
    notes: 'Viết tay trên giấy kiểm tra, tối thiểu 2 trang đôi, chú ý mở bài gián tiếp và dẫn chứng thực tế.',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-3',
    title: 'Kiểm tra 15 phút Tiếng Anh (Unit 4 - Learning a foreign language)',
    category: 'exam',
    subject: 'Tiếng Anh',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '14:30',
    priority: 'normal',
    syllabus: 'Modal verbs with IF, reported speech, từ vựng chủ đề giáo dục và ngôn ngữ',
    notes: 'Ôn tập kỹ phần câu gián tiếp câu hỏi Yes/No và Wh-questions.',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-4',
    title: 'Hạn nộp báo cáo thí nghiệm Vật lý: Định luật Ôm',
    category: 'homework',
    subject: 'Vật lý / KHTN',
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '17:00',
    priority: 'normal',
    syllabus: 'Đo cường độ dòng điện và hiệu điện thế trong đoạn mạch nối tiếp và song song',
    notes: 'Kẻ bảng số liệu chuẩn xác, vẽ đồ thị quan hệ I-U.',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-5',
    title: 'Họp Phụ Huynh & Sơ Kết Giữa Học Kỳ',
    category: 'event',
    subject: 'Chung',
    date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '08:30',
    priority: 'high',
    syllabus: 'Báo cáo kết quả rèn luyện và học tập giữa kỳ',
    notes: 'Nhắc bố mẹ tham dự đúng giờ tại phòng học 9A1.',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
];

const SUBJECT_OPTIONS = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lý / KHTN',
  'Hóa học',
  'Sinh học',
  'Lịch sử & Địa lý',
  'Tin học',
  'GDCD',
  'Chung / Trường lớp',
];

interface PersonalScheduleProps {
  currentGrade: GradeLevel;
  isDark: boolean;
  onSendToChat?: (prompt: string) => void;
}

export const PersonalSchedule: React.FC<PersonalScheduleProps> = ({
  currentGrade,
  isDark,
  onSendToChat,
}) => {
  const [events, setEvents] = useState<ScheduleEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_SCHEDULE_EVENTS;
  });

  const [activeTab, setActiveTab] = useState<'timeline' | 'calendar'>('timeline');
  const [filterCategory, setFilterCategory] = useState<ScheduleCategory | 'all'>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add / Edit Modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ScheduleCategory>('exam');
  const [formSubject, setFormSubject] = useState('Toán học');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('08:00');
  const [formPriority, setFormPriority] = useState<SchedulePriority>('high');
  const [formSyllabus, setFormSyllabus] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Calendar View month/year state
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Study Alert Settings (User Request: "Thông báo học tập gửi thông báo đẩy (push notification) hoặc nhắc nhở trong ứng dụng 30 phút trước khi có lịch kiểm tra hoặc hạn nộp bài tập đã lưu")
  const [alertSettings, setAlertSettings] = useState<StudyAlertSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ALERT_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enablePushNotifications: true,
      enableInAppAlerts: true,
      leadMinutes: 30, // Mặc định 30 phút trước lịch kiểm tra hoặc hạn nộp bài tập
      notifyExams: true,
      notifyHomework: true,
      notifyEvents: true,
      soundEnabled: true,
    };
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [showAlertSettingsModal, setShowAlertSettingsModal] = useState<boolean>(false);
  const [activeStudyAlert, setActiveStudyAlert] = useState<{
    event: ScheduleEvent;
    diffMinutes: number;
    isTest?: boolean;
    firedAt: number;
  } | null>(null);
  const [alertToastMsg, setAlertToastMsg] = useState<string>('');

  // Persist alert settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ALERT_SETTINGS, JSON.stringify(alertSettings));
    } catch (e) {}
  }, [alertSettings]);

  // Request browser push notification permission
  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          setAlertToastMsg('✅ Đã bật thông báo đẩy (Push Notification) thành công!');
          soundEffects.playBadgeUnlocked();
          try {
            new Notification('🔔 [MAX10 AI] Thông Báo Học Tập Đã Sẵn Sàng!', {
              body: 'Hệ thống sẽ gửi thông báo đẩy 30 phút trước khi có lịch kiểm tra hoặc hạn nộp bài tập đã lưu!',
              icon: '/max10-avatar.jpg',
            });
          } catch (e) {}
        } else if (perm === 'denied') {
          setAlertToastMsg('⚠️ Trình duyệt đang từ chối quyền. Bạn có thể bật lại trong cài đặt trang web.');
        }
      } catch (e) {
        setAlertToastMsg('⚠️ Không thể yêu cầu quyền thông báo đẩy trên trình duyệt này.');
      }
    } else {
      setAlertToastMsg('⚠️ Trình duyệt này không hỗ trợ Notification API.');
    }
    setTimeout(() => setAlertToastMsg(''), 4500);
  };

  // Immediate Test 30-minute alert trigger
  const handleTriggerTestAlert = () => {
    if (alertSettings.soundEnabled) {
      soundEffects.playStudyAlert();
    }
    celebrationEngine.launchConfetti(35);

    const testEvt: ScheduleEvent = {
      id: 'test-evt-' + Date.now(),
      title: 'Kiểm tra 1 tiết môn Toán (Đại số & Hình học)',
      category: 'exam',
      subject: 'Toán học',
      date: new Date().toISOString().split('T')[0],
      time: new Date(Date.now() + 30 * 60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      priority: 'urgent',
      syllabus: 'Căn thức bậc hai, hàm số bậc nhất, hệ phương trình, tam giác đồng dạng',
      notes: 'Mang theo máy tính Casio FX-580VNX, thước kẻ, compa. Tự tin 10 điểm!',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    setActiveStudyAlert({
      event: testEvt,
      diffMinutes: alertSettings.leadMinutes || 30,
      isTest: true,
      firedAt: Date.now(),
    });

    if (
      alertSettings.enablePushNotifications &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(`🔔 [LỊCH HỌC MAX10] Sắp đến giờ kiểm tra môn ${testEvt.subject}!`, {
          body: `Còn ${alertSettings.leadMinutes || 30} phút nữa: "${testEvt.title}". Chúc bạn làm bài đạt Điểm 10!`,
          icon: '/max10-avatar.jpg',
        });
      } catch (e) {}
    }

    setAlertToastMsg('🔔 Đã kích hoạt thử nghiệm thông báo đẩy 30 phút thành công!');
    setTimeout(() => setAlertToastMsg(''), 4500);
  };

  // Background 30-minute study alert scheduler
  useEffect(() => {
    const checkStudyAlerts = () => {
      if (!alertSettings.enableInAppAlerts && !alertSettings.enablePushNotifications) return;

      let firedKeys: Set<string> = new Set();
      try {
        const saved = localStorage.getItem(STORAGE_KEY_FIRED_ALERTS);
        if (saved) firedKeys = new Set(JSON.parse(saved));
      } catch (e) {}

      const now = Date.now();
      const leadMs = (alertSettings.leadMinutes || 30) * 60000;

      for (const evt of events) {
        if (evt.isCompleted) continue;
        if (evt.category === 'exam' && !alertSettings.notifyExams) continue;
        if (evt.category === 'homework' && !alertSettings.notifyHomework) continue;
        if (evt.category === 'event' && !alertSettings.notifyEvents) continue;

        try {
          const [yearStr, monthStr, dayStr] = evt.date.split('-');
          const timeParts = (evt.time || '08:00').split(':');
          const hour = parseInt(timeParts[0] || '8', 10);
          const minute = parseInt(timeParts[1] || '0', 10);

          const eventTargetTime = new Date(
            parseInt(yearStr, 10),
            parseInt(monthStr, 10) - 1,
            parseInt(dayStr, 10),
            hour,
            minute,
            0
          ).getTime();

          const diffMs = eventTargetTime - now;
          const diffMinutes = Math.round(diffMs / 60000);

          // Check if now is within the window (from 0 to leadMinutes before)
          if (diffMs >= -5 * 60000 && diffMs <= leadMs) {
            const alertKey = `${evt.id}_${evt.date}_${evt.time || '08:00'}_${alertSettings.leadMinutes}m`;
            if (!firedKeys.has(alertKey)) {
              firedKeys.add(alertKey);
              try {
                localStorage.setItem(STORAGE_KEY_FIRED_ALERTS, JSON.stringify(Array.from(firedKeys)));
              } catch (e) {}

              // Play study alert sound
              if (alertSettings.soundEnabled) {
                soundEffects.playStudyAlert();
              }

              // Set in-app alert
              if (alertSettings.enableInAppAlerts) {
                setActiveStudyAlert({
                  event: evt,
                  diffMinutes: Math.max(0, diffMinutes),
                  firedAt: Date.now(),
                });
              }

              // Native browser Push Notification
              if (
                alertSettings.enablePushNotifications &&
                typeof window !== 'undefined' &&
                'Notification' in window &&
                Notification.permission === 'granted'
              ) {
                const label = evt.category === 'exam' ? '📝 Bài kiểm tra' : evt.category === 'homework' ? '⏳ Hạn nộp bài tập' : '🎯 Sự kiện';
                new Notification(`🔔 [LỊCH HỌC MAX10] Còn ${Math.max(0, diffMinutes)} phút nữa!`, {
                  body: `${label}: "${evt.title}" môn ${evt.subject}. Hãy chuẩn bị sẵn sàng nhé!`,
                  icon: '/max10-avatar.jpg',
                });
              }
              break;
            }
          }
        } catch (err) {}
      }
    };

    checkStudyAlerts();
    const interval = setInterval(checkStudyAlerts, 20000);
    return () => clearInterval(interval);
  }, [events, alertSettings]);

  const openAddModal = (category: ScheduleCategory = 'exam') => {
    setEditingEvent(null);
    setFormTitle('');
    setFormCategory(category);
    setFormSubject('Toán học');
    setFormDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setFormTime('08:00');
    setFormPriority('high');
    setFormSyllabus('');
    setFormNotes('');
    setShowAddModal(true);
  };

  const openEditModal = (evt: ScheduleEvent) => {
    setEditingEvent(evt);
    setFormTitle(evt.title);
    setFormCategory(evt.category);
    setFormSubject(evt.subject);
    setFormDate(evt.date);
    setFormTime(evt.time || '08:00');
    setFormPriority(evt.priority);
    setFormSyllabus(evt.syllabus || '');
    setFormNotes(evt.notes || '');
    setShowAddModal(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingEvent) {
      // Update existing
      setEvents((prev) =>
        prev.map((item) =>
          item.id === editingEvent.id
            ? {
                ...item,
                title: formTitle.trim(),
                category: formCategory,
                subject: formSubject,
                date: formDate,
                time: formTime,
                priority: formPriority,
                syllabus: formSyllabus.trim(),
                notes: formNotes.trim(),
              }
            : item
        )
      );
    } else {
      // Create new
      const newEvt: ScheduleEvent = {
        id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        title: formTitle.trim(),
        category: formCategory,
        subject: formSubject,
        date: formDate,
        time: formTime,
        priority: formPriority,
        syllabus: formSyllabus.trim(),
        notes: formNotes.trim(),
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      setEvents((prev) => [newEvt, ...prev]);
      soundEffects.playMissionComplete();
      celebrationEngine.launchConfetti(40);
    }

    setShowAddModal(false);
  };

  const handleToggleComplete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEvents((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.isCompleted;
          if (nextState) {
            soundEffects.playBadgeUnlocked();
            celebrationEngine.launchConfetti(50);
          }
          return {
            ...item,
            isCompleted: nextState,
            completedAt: nextState ? new Date().toISOString() : undefined,
          };
        }
        return item;
      })
    );
  };

  const handleDeleteEvent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa mục lịch học này không?')) {
      setEvents((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Helper to format countdown status
  const getCountdownLabel = (dateStr: string, isCompleted: boolean) => {
    if (isCompleted) {
      return { text: '✓ Đã hoàn thành', colorClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    }
    const today = new Date().toISOString().split('T')[0];
    const targetDate = new Date(dateStr + 'T00:00:00');
    const currDate = new Date(today + 'T00:00:00');
    const diffTime = targetDate.getTime() - currDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return { text: `Quá hạn ${Math.abs(diffDays)} ngày`, colorClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-black' };
    }
    if (diffDays === 0) {
      return { text: '🔥 Hôm nay', colorClass: 'bg-rose-500 text-white font-black animate-pulse' };
    }
    if (diffDays === 1) {
      return { text: '⚡ Ngày mai', colorClass: 'bg-amber-500 text-slate-950 font-black' };
    }
    if (diffDays <= 3) {
      return { text: `Còn ${diffDays} ngày`, colorClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold' };
    }
    return { text: `Còn ${diffDays} ngày`, colorClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-medium' };
  };

  // Filtered & Sorted events
  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        if (filterCategory !== 'all' && evt.category !== filterCategory) return false;
        if (filterSubject !== 'all' && evt.subject !== filterSubject) return false;
        if (filterStatus === 'pending' && evt.isCompleted) return false;
        if (filterStatus === 'completed' && !evt.isCompleted) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = evt.title.toLowerCase().includes(q);
          const matchSubject = evt.subject.toLowerCase().includes(q);
          const matchSyllabus = (evt.syllabus || '').toLowerCase().includes(q);
          const matchNotes = (evt.notes || '').toLowerCase().includes(q);
          if (!matchTitle && !matchSubject && !matchSyllabus && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Incomplete first, then by date ascending
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        return a.date.localeCompare(b.date);
      });
  }, [events, filterCategory, filterSubject, filterStatus, searchQuery]);

  // Statistics
  const examCount = events.filter((e) => e.category === 'exam' && !e.isCompleted).length;
  const homeworkCount = events.filter((e) => e.category === 'homework' && !e.isCompleted).length;
  const eventCount = events.filter((e) => e.category === 'event' && !e.isCompleted).length;
  const completedCount = events.filter((e) => e.isCompleted).length;

  // Ask AI Study Plan for an event
  const handleAskAiForEvent = (evt: ScheduleEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSendToChat) return;
    const prompt =
      evt.category === 'exam'
        ? `Gia sư Max10 AI hãy lập kế hoạch ôn tập chi tiết 3 ngày để em đạt Điểm 10 môn ${evt.subject} cho bài kiểm tra "${evt.title}". Nội dung ôn tập gồm: ${evt.syllabus || 'kiến thức trọng tâm'}. Hãy chỉ ra các lỗi sai bẫy thường gặp và bài tập trọng điểm!`
        : `Gia sư Max10 AI hãy hướng dẫn em các bước hoàn thành bài tập "${evt.title}" môn ${evt.subject}. Yêu cầu: ${evt.syllabus || 'chuẩn chỉnh'}. Lưu ý: ${evt.notes || 'đầy đủ chi tiết'}.`;
    onSendToChat(prompt);
  };

  // Calendar math
  const calendarYear = currentCalendarDate.getFullYear();
  const calendarMonth = currentCalendarDate.getMonth();
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  // Radar for events within next 24 hours & within 30 minutes
  const upcomingNearEvents = useMemo(() => {
    const now = Date.now();
    const next24h = now + 24 * 3600 * 1000;
    return events
      .filter((evt) => !evt.isCompleted)
      .map((evt) => {
        try {
          const [yearStr, monthStr, dayStr] = evt.date.split('-');
          const timeParts = (evt.time || '08:00').split(':');
          const hour = parseInt(timeParts[0] || '8', 10);
          const minute = parseInt(timeParts[1] || '0', 10);
          const targetTime = new Date(
            parseInt(yearStr, 10),
            parseInt(monthStr, 10) - 1,
            parseInt(dayStr, 10),
            hour,
            minute,
            0
          ).getTime();
          const diffMs = targetTime - now;
          const diffMinutes = Math.round(diffMs / 60000);
          return {
            event: evt,
            targetTime,
            diffMinutes,
            isWithin30Min: diffMinutes >= 0 && diffMinutes <= 30,
            isDueSoon: diffMs > 0 && targetTime <= next24h,
            isOverdue: diffMs < 0,
          };
        } catch {
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && (item.isDueSoon || item.isOverdue))
      .sort((a, b) => a.targetTime - b.targetTime);
  }, [events]);

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Banner */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 overflow-hidden border shadow-xl transition-all ${
            isDark
              ? 'bg-gradient-to-br from-[#121824] via-[#0f1420] to-[#181f30] border-white/10 text-white'
              : 'bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/40 border-slate-200/90 text-slate-900 shadow-slate-200/60'
          }`}
        >
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Kế hoạch Học Kỳ &amp; Săn Điểm 10 · {currentGrade}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Lịch Học Cá Nhân
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
                Quản lý lịch kiểm tra 15 phút, 1 tiết, thi giữa kỳ &amp; cuối kỳ, theo dõi hạn nộp bài tập và các sự kiện quan trọng trong học kỳ. Tự động nhắc nhở và lập kế hoạch ôn thi với AI!
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => openAddModal('exam')}
                className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Thêm Lịch Mới</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAlertSettingsModal(true)}
                className={`py-2.5 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  alertSettings.enablePushNotifications && notificationPermission === 'granted'
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                }`}
                title="Cài đặt thông báo học tập 30 phút"
              >
                <BellRing className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>Thông Báo Học Tập ({alertSettings.leadMinutes}p)</span>
              </button>

              {onSendToChat && (
                <button
                  type="button"
                  onClick={() =>
                    onSendToChat(
                      `Gia sư Max10 AI ơi, hãy giúp em tổng hợp một thời gian biểu ôn thi chuẩn Điểm 10 cho học kỳ này (${currentGrade}) để em không bị trùng lịch và học nhẹ nhàng nhưng hiệu quả cao nhất!`
                    )
                  }
                  className="py-2.5 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>AI Gợi Ý Ôn Thi</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Counter Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200/60 dark:border-white/10">
            <div
              onClick={() => {
                setFilterCategory('exam');
                setFilterStatus('pending');
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${
                filterCategory === 'exam'
                  ? 'border-rose-500 bg-rose-500/10'
                  : isDark
                  ? 'bg-zinc-900/60 border-white/5'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">📝 Lịch kiểm tra</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {examCount} <span className="text-xs font-normal opacity-80">bài sắp tới</span>
              </p>
            </div>

            <div
              onClick={() => {
                setFilterCategory('homework');
                setFilterStatus('pending');
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${
                filterCategory === 'homework'
                  ? 'border-amber-500 bg-amber-500/10'
                  : isDark
                  ? 'bg-zinc-900/60 border-white/5'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">⏳ Hạn nộp bài tập</span>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {homeworkCount} <span className="text-xs font-normal opacity-80">bài tập</span>
              </p>
            </div>

            <div
              onClick={() => {
                setFilterCategory('event');
                setFilterStatus('pending');
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${
                filterCategory === 'event'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : isDark
                  ? 'bg-zinc-900/60 border-white/5'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">🎯 Sự kiện học kỳ</span>
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {eventCount} <span className="text-xs font-normal opacity-80">sự kiện</span>
              </p>
            </div>

            <div
              onClick={() => {
                setFilterCategory('all');
                setFilterStatus('completed');
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${
                filterStatus === 'completed'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : isDark
                  ? 'bg-zinc-900/60 border-white/5'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">✅ Đã hoàn thành</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {completedCount} <span className="text-xs font-normal opacity-80">nhiệm vụ</span>
              </p>
            </div>
          </div>
        </div>

        {/* Toast feedback */}
        {alertToastMsg && (
          <div className="p-3 rounded-2xl bg-blue-600 text-white font-bold text-xs flex items-center justify-between shadow-xl animate-in fade-in">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>{alertToastMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertToastMsg('')}
              className="p-1 hover:bg-white/20 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ACTIVE STUDY ALERT FLOATING / EMBEDDED BANNER */}
        {activeStudyAlert && (
          <div
            className={`p-5 sm:p-6 rounded-3xl border-2 shadow-2xl relative overflow-hidden transition-all animate-in slide-in-from-top-4 ${
              activeStudyAlert.event.category === 'exam'
                ? 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/70 border-rose-500 text-white shadow-rose-950/50'
                : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/70 border-amber-500 text-white shadow-amber-950/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                    activeStudyAlert.event.category === 'exam'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-amber-500 text-slate-950 animate-bounce'
                  }`}
                >
                  <BellRing className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/20 text-white border border-white/30">
                      {activeStudyAlert.isTest ? '🧪 THỬ NGHIỆM' : '🔔 NHẮC NHỞ HỌC TẬP'}
                    </span>
                    <span className="text-[11px] font-black text-amber-300">
                      🔥 CÒN {activeStudyAlert.diffMinutes} PHÚT NỮA ĐẾN GIỜ!
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                      {activeStudyAlert.event.subject}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {activeStudyAlert.event.title}
                  </h3>
                  <p className="text-xs text-zinc-300">
                    {activeStudyAlert.event.category === 'exam' ? '📝 Lịch kiểm tra' : '⏳ Hạn nộp bài tập'}:{' '}
                    <strong className="text-white font-mono">{activeStudyAlert.event.time || '08:00'} ngày {activeStudyAlert.event.date}</strong>.
                    {activeStudyAlert.event.syllabus && ` Nội dung: ${activeStudyAlert.event.syllabus}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                {onSendToChat && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleAskAiForEvent(activeStudyAlert.event, e);
                      setActiveStudyAlert(null);
                    }}
                    className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI Ôn Nhanh</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleToggleComplete(activeStudyAlert.event.id);
                    setActiveStudyAlert(null);
                  }}
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Đã Hoàn Thành</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStudyAlert(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white cursor-pointer"
                  title="Đóng thông báo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DEDICATED STUDY ALERT CARD & 24H RADAR */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border transition-all ${
            isDark
              ? 'bg-[#0f1422] border-blue-500/20 text-white'
              : 'bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white border-blue-200/80 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold tracking-tight">
                    Thông Báo Học Tập
                  </h2>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Nhắc trước {alertSettings.leadMinutes} phút
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Tự động gửi thông báo đẩy (push notification) và nhắc nhở nổi 30 phút trước lịch kiểm tra hoặc hạn nộp bài tập đã lưu
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestPushPermission}
                  className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Bật Thông Báo Đẩy</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleTriggerTestAlert}
                className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer transition-all active:scale-95"
                title="Bấm để thử nghiệm xem âm thanh và thông báo 30 phút"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>🔔 Thử nghiệm thông báo 30 phút ngay</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAlertSettingsModal(true)}
                className="p-2 rounded-xl neu-btn text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title="Tùy chỉnh thông báo học tập"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Status Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
            <div className="p-2.5 rounded-2xl bg-white/50 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                <span>Thông báo đẩy thiết bị:</span>
              </span>
              <span
                className={`font-black text-[11px] px-2 py-0.5 rounded-full ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : notificationPermission === 'denied'
                    ? 'bg-rose-500/15 text-rose-600'
                    : 'bg-amber-500/15 text-amber-600'
                }`}
              >
                {notificationPermission === 'granted' ? '✅ Đã Bật' : notificationPermission === 'denied' ? '⚠️ Đang Khóa' : '🔔 Chưa Cấp Quyền'}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/50 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Chuông âm thanh nhắc nhở:</span>
              </span>
              <span className="font-black text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                {alertSettings.soundEnabled ? '✅ Đang Hoạt Động' : 'Tắt'}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/50 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Thời gian gửi nhắc nhở:</span>
              </span>
              <span className="font-black text-[11px] text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">
                {alertSettings.leadMinutes} phút trước giờ
              </span>
            </div>
          </div>

          {/* Upcoming 24h & 30-minute radar */}
          {upcomingNearEvents.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-black/5 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>Radar Lịch Thi &amp; Hạn Nộp Sắp Tới ({upcomingNearEvents.length} mục trong 24h):</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Tự động kích hoạt thông báo khi còn 30 phút</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {upcomingNearEvents.slice(0, 4).map(({ event: evt, diffMinutes, isWithin30Min, isOverdue }) => (
                  <div
                    key={evt.id}
                    onClick={() => openEditModal(evt)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isWithin30Min
                        ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/30'
                        : isDark
                        ? 'bg-zinc-900/70 border-white/5 hover:border-white/20'
                        : 'bg-white border-slate-200 hover:border-blue-400 shadow-2xs'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            evt.category === 'exam'
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {evt.category === 'exam' ? '📝 Kiểm tra' : '⏳ Bài tập'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 truncate">
                          {evt.subject}
                        </span>
                      </div>
                      <p className="text-xs font-black truncate text-slate-900 dark:text-white">
                        {evt.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Lúc {evt.time || '08:00'} ngày {evt.date}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${
                          isWithin30Min
                            ? 'bg-rose-500 text-white animate-pulse'
                            : isOverdue
                            ? 'bg-rose-500/20 text-rose-600'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {isWithin30Min
                          ? `🔥 Còn ${diffMinutes} phút`
                          : isOverdue
                          ? 'Đã đến giờ'
                          : diffMinutes > 60
                          ? `Còn ~${Math.round(diffMinutes / 60)}h`
                          : `Còn ${diffMinutes} phút`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Switcher & Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* View Tab Switcher: Timeline vs Calendar */}
          <div className="flex items-center p-1 rounded-2xl neu-pressed max-w-xs">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>📋 Danh sách &amp; Hạn chót</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Lịch tháng</span>
            </button>
          </div>

          {/* Search & Category Pills */}
          <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
            {/* Search Input */}
            <div className="relative min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài kiểm tra, bài tập..."
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none ${
                  isDark
                    ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500'
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border outline-none cursor-pointer ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <option value="all">Tất cả danh mục</option>
              <option value="exam">📝 Lịch kiểm tra</option>
              <option value="homework">⏳ Hạn nộp bài tập</option>
              <option value="event">🎯 Sự kiện quan trọng</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border outline-none cursor-pointer ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">⏳ Đang chờ làm</option>
              <option value="completed">✅ Đã hoàn thành</option>
            </select>
          </div>
        </div>

        {/* VIEW 1: TIMELINE / LIST VIEW */}
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div
                className={`p-10 rounded-3xl border text-center ${
                  isDark ? 'bg-[#0f1420] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center mb-3">
                  <CalendarIcon className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Chưa có mục lịch học nào phù hợp bộ lọc
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                  Hãy thêm bài kiểm tra 15 phút, 1 tiết, hạn nộp bài tập hoặc sự kiện học kỳ mới để Max10 AI đồng hành nhắc nhở bạn nhé!
                </p>
                <button
                  type="button"
                  onClick={() => openAddModal()}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Lịch Ngay</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredEvents.map((evt) => {
                  const countdown = getCountdownLabel(evt.date, evt.isCompleted);
                  const isExam = evt.category === 'exam';
                  const isHomework = evt.category === 'homework';

                  return (
                    <div
                      key={evt.id}
                      onClick={() => openEditModal(evt)}
                      className={`group p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                        evt.isCompleted
                          ? isDark
                            ? 'bg-zinc-900/40 border-white/5 opacity-65'
                            : 'bg-slate-50/80 border-slate-200 opacity-70'
                          : isDark
                          ? 'bg-[#111724] border-white/10 hover:border-blue-500/50 shadow-md'
                          : 'bg-white border-slate-200/90 hover:border-blue-400 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Completion Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleComplete(evt.id, e)}
                          className="mt-0.5 shrink-0 transition-transform hover:scale-110 cursor-pointer"
                          title={evt.isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'}
                        >
                          {evt.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400 hover:text-emerald-500" />
                          )}
                        </button>

                        {/* Main Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            {/* Category Badge */}
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                isExam
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                  : isHomework
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                  : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30'
                              }`}
                            >
                              {isExam ? '📝 Kiểm tra' : isHomework ? '⏳ Bài tập' : '🎯 Sự kiện'}
                            </span>

                            {/* Subject */}
                            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                              {evt.subject}
                            </span>

                            {/* Countdown Badge */}
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${countdown.colorClass}`}
                            >
                              {countdown.text}
                            </span>

                            {/* Priority */}
                            {evt.priority === 'urgent' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500 text-white font-black animate-pulse">
                                🔥 Khẩn cấp
                              </span>
                            )}
                          </div>

                          <h3
                            className={`font-black text-sm sm:text-base leading-snug ${
                              evt.isCompleted ? 'line-through text-slate-400 dark:text-zinc-500' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {evt.title}
                          </h3>

                          {/* Syllabus / Review Notes */}
                          {evt.syllabus && (
                            <div className="mt-2 text-xs text-slate-600 dark:text-zinc-300 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 leading-relaxed">
                              <span className="font-bold text-blue-600 dark:text-blue-400">📚 Nội dung trọng tâm: </span>
                              <span>{evt.syllabus}</span>
                            </div>
                          )}

                          {/* Extra Notes */}
                          {evt.notes && (
                            <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 italic">
                              💡 Ghi chú: {evt.notes}
                            </p>
                          )}

                          {/* Date and Time Details */}
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-white/5 text-xs">
                            <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-400 font-medium">
                              <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-zinc-300">
                                <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                                {(() => {
                                  try {
                                    const p = evt.date.split('-');
                                    return `${p[2]}/${p[1]}/${p[0]}`;
                                  } catch {
                                    return evt.date;
                                  }
                                })()}
                              </span>
                              {evt.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                                  {evt.time}
                                </span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              {onSendToChat && !evt.isCompleted && (
                                <button
                                  type="button"
                                  onClick={(e) => handleAskAiForEvent(evt, e)}
                                  className="px-2.5 py-1 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 font-extrabold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Gia sư Max10 AI lên kế hoạch ôn thi ngay"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  <span>AI Lên Kế Hoạch Ôn</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(evt);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
                                title="Sửa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleDeleteEvent(evt.id, e)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: INTERACTIVE CALENDAR MONTH VIEW */}
        {activeTab === 'calendar' && (
          <div
            className={`p-5 sm:p-6 rounded-3xl border ${
              isDark ? 'bg-[#0f1420] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            {/* Month Header Controller */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-black">
                  Tháng {calendarMonth + 1} / {calendarYear}
                </h2>
                <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">
                  ({events.length} lịch học trong hệ thống)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl neu-btn text-slate-600 dark:text-zinc-300"
                  title="Tháng trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentCalendarDate(new Date())}
                  className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-blue-600 dark:text-blue-400"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl neu-btn text-slate-600 dark:text-zinc-300"
                  title="Tháng sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Labels (CN, T2, T3, T4, T5, T6, T7) */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-black text-slate-400 dark:text-zinc-500 mb-2">
              <span className="text-rose-500">CN</span>
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span className="text-blue-500">T7</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Empty leading padding slots */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-16 sm:h-24 rounded-2xl bg-black/5 dark:bg-white/[0.02]" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const formattedDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = events.filter((e) => e.date === formattedDate);
                const isToday = formattedDate === new Date().toISOString().split('T')[0];
                const isSelected = selectedCalendarDay === formattedDate;

                return (
                  <div
                    key={formattedDate}
                    onClick={() => setSelectedCalendarDay(formattedDate)}
                    className={`h-16 sm:h-24 p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group overflow-hidden ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/10'
                        : isToday
                        ? 'border-amber-400 bg-amber-500/10'
                        : isDark
                        ? 'border-white/5 bg-zinc-900/60 hover:border-white/20'
                        : 'border-slate-100 bg-slate-50/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full font-black bg-blue-600 text-white shrink-0">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Mini event tags */}
                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((evt) => (
                        <div
                          key={evt.id}
                          className={`text-[9px] font-bold px-1 py-0.2 rounded truncate leading-tight ${
                            evt.category === 'exam'
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                              : evt.category === 'homework'
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] text-slate-400 font-bold leading-none">
                          +{dayEvents.length - 2} mục nữa
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Day Event Drawer */}
            {selectedCalendarDay && (
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-500" />
                    <span>Lịch trong ngày {selectedCalendarDay}:</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setFormDate(selectedCalendarDay);
                      openAddModal('exam');
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm lịch cho ngày này
                  </button>
                </div>

                {events.filter((e) => e.date === selectedCalendarDay).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Không có bài kiểm tra hay bài tập nào trong ngày này.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {events
                      .filter((e) => e.date === selectedCalendarDay)
                      .map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => openEditModal(evt)}
                          className={`p-3 rounded-2xl border cursor-pointer ${
                            isDark ? 'bg-zinc-800/80 border-white/10' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500">
                              {evt.subject}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{evt.time || '08:00'}</span>
                          </div>
                          <p className="font-bold text-xs truncate text-slate-900 dark:text-white">{evt.title}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD / EDIT SCHEDULE ITEM */}
        {showAddModal && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border max-h-[92vh] overflow-y-auto ${
                isDark ? 'bg-[#0f1420] text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-200/60 dark:border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    {editingEvent ? 'Chỉnh Sửa Mục Lịch Học' : 'Thêm Lịch Kiểm Tra / Hạn Nộp Bài Tập'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Ghi lại chính xác để Max10 AI nhắc nhở và đồng hành cùng bạn
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4 text-left">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                    Phân loại:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormCategory('exam')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formCategory === 'exam'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                          : isDark
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      📝 Lịch Kiểm Tra
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormCategory('homework')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formCategory === 'homework'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                          : isDark
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      ⏳ Hạn Bài Tập
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormCategory('event')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formCategory === 'event'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : isDark
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      🎯 Sự Kiện Học Kỳ
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                    Tiêu đề (Tên bài kiểm tra / Tên bài tập):
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={
                      formCategory === 'exam'
                        ? 'Ví dụ: Kiểm tra 1 tiết Toán Hình, Kiểm tra giữa kỳ I Văn...'
                        : formCategory === 'homework'
                        ? 'Ví dụ: Hạn nộp bài tập hình học số 3, Bài viết số 2...'
                        : 'Ví dụ: Họp phụ huynh, Thi học sinh giỏi cấp trường...'
                    }
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold border outline-none transition-all ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>

                {/* Subject & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                      Môn học:
                    </label>
                    <select
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      {SUBJECT_OPTIONS.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                      Mức độ ưu tiên:
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="urgent">🔥 Khẩn cấp (Sắp diễn ra)</option>
                      <option value="high">⚡ Quan trọng</option>
                      <option value="normal">📘 Bình thường</option>
                      <option value="low">☕ Nhẹ nhàng</option>
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                      Ngày diễn ra / Hạn nộp:
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                      Giờ:
                    </label>
                    <input
                      type="time"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Syllabus / Focus areas */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                    Nội dung ôn tập trọng tâm (để AI hỗ trợ tốt nhất):
                  </label>
                  <input
                    type="text"
                    value={formSyllabus}
                    onChange={(e) => setFormSyllabus(e.target.value)}
                    placeholder="Ví dụ: Ôn từ bài 1 đến bài 7, dạng bài tìm cực trị và vẽ đồ thị..."
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-zinc-300">
                    Ghi chú / Dặn dò của thầy cô:
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Ví dụ: Cần mang theo thước eke, máy tính Casio, nộp bài trước tiết 3..."
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none resize-none ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Submit button */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`w-1/3 py-2.5 rounded-2xl text-xs font-semibold border cursor-pointer ${
                      isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{editingEvent ? 'Lưu Thay Đổi' : 'Lưu Vào Lịch Học'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ALERT SETTINGS MODAL */}
        {showAlertSettingsModal && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border max-h-[92vh] overflow-y-auto ${
                isDark ? 'bg-[#0f1420] text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowAlertSettingsModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-200/60 dark:border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    Cài Đặt Thông Báo Học Tập
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Gửi thông báo đẩy và nhắc nhở 30 phút trước lịch kiểm tra hoặc hạn nộp bài tập
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* 1. Push Notification Permission */}
                <div className="p-3.5 rounded-2xl border border-black/5 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-200">
                      <Smartphone className="w-4 h-4 text-blue-500" />
                      <span>Thông Báo Đẩy Trình Duyệt (Push Notification)</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        notificationPermission === 'granted'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : notificationPermission === 'denied'
                          ? 'bg-rose-500/20 text-rose-600'
                          : 'bg-amber-500/20 text-amber-600'
                      }`}
                    >
                      {notificationPermission === 'granted' ? '✅ Đã Cấp Quyền' : notificationPermission === 'denied' ? '⚠️ Đã Chặn' : 'Chưa Cấp Quyền'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Nhận thông báo đẩy trực tiếp trên thiết bị (kể cả khi bạn đang mở tab khác hoặc màn hình khóa).
                  </p>
                  {notificationPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestPushPermission}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Bấm Cho Phép Nhận Thông Báo Đẩy</span>
                    </button>
                  )}
                </div>

                {/* 2. In-App Notification & Sound */}
                <div className="p-3.5 rounded-2xl border border-black/5 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-zinc-200">
                        Nhắc nhở nổi trong ứng dụng
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Hiển thị biểu ngữ nhắc nhở nổi bật kèm nút AI lên kế hoạch ôn thi
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertSettings.enableInAppAlerts}
                      onChange={(e) => setAlertSettings((prev) => ({ ...prev, enableInAppAlerts: e.target.checked }))}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-zinc-200">
                          Chuông âm thanh khi đến giờ
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Phát âm thanh chuông melodic du dương đánh thức sự tập trung
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertSettings.soundEnabled}
                      onChange={(e) => setAlertSettings((prev) => ({ ...prev, soundEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 3. Lead Time (Default 30 mins) */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                    ⏰ Thời gian gửi nhắc nhở trước khi diễn ra:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { min: 15, label: '15 phút trước' },
                      { min: 30, label: '30 phút trước (Chuẩn)' },
                      { min: 60, label: '1 giờ trước' },
                      { min: 120, label: '2 giờ trước' },
                      { min: 1440, label: '1 ngày trước' },
                    ].map((opt) => (
                      <button
                        key={opt.min}
                        type="button"
                        onClick={() => setAlertSettings((prev) => ({ ...prev, leadMinutes: opt.min }))}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          alertSettings.leadMinutes === opt.min
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : isDark
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Target Categories to Notify */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-zinc-300">
                    📋 Các loại thông báo muốn nhận:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2 rounded-xl border border-black/5 dark:border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertSettings.notifyExams}
                        onChange={(e) => setAlertSettings((prev) => ({ ...prev, notifyExams: e.target.checked }))}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        📝 Nhắc lịch kiểm tra (15 phút, 1 tiết, thi giữa kỳ &amp; cuối kỳ)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl border border-black/5 dark:border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertSettings.notifyHomework}
                        onChange={(e) => setAlertSettings((prev) => ({ ...prev, notifyHomework: e.target.checked }))}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        ⏳ Nhắc hạn nộp bài tập về nhà &amp; báo cáo thí nghiệm
                      </span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl border border-black/5 dark:border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertSettings.notifyEvents}
                        onChange={(e) => setAlertSettings((prev) => ({ ...prev, notifyEvents: e.target.checked }))}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        🎯 Nhắc sự kiện học kỳ quan trọng (Họp phụ huynh, lễ khai bế giảng)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Test button & close */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerTestAlert}
                    className="flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>🔔 Thử nghiệm thông báo 30 phút ngay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAlertSettingsModal(false)}
                    className="py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md cursor-pointer"
                  >
                    Đã Xong
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
