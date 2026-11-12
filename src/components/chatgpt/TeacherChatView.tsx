import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  MessageSquare,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Send,
  RefreshCw,
  CheckCircle2,
  HeartHandshake,
  BookOpen,
  Award,
  AlertCircle,
  HelpCircle,
  Clock,
  User,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  LogIn,
  LogOut,
  PlusCircle,
  Search,
  MessageCircle,
  FileText,
  ThumbsUp,
  School,
  Lock,
  Phone,
  Video,
  Mail,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Users,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { formatDolaMath } from '../../utils/dolaMathFormatter';
import { GradeLevel } from '../../types';
import { aiVoice } from '../../utils/aiVoiceEngine';
import { TeacherColleagueLounge } from './TeacherColleagueLounge';
import { TeacherAiMaterialStudio } from './TeacherAiMaterialStudio';
import { VideoAudioCallModal } from './VideoAudioCallModal';

export interface TeacherAccountInfo {
  id: string;
  name: string;
  school: string;
  department: string;
  subject: string;
  title: string;
  bio: string;
  avatarText: string;
  badgeColor: string;
  createdAt: string;
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string;
  teacherId: string;
  studentName: string;
  sender: 'student' | 'teacher';
  senderName: string;
  content: string;
  subject?: string;
  grade?: string;
  attachmentUrl?: string;
  timestamp: string;
  read?: boolean;
}

export interface TeacherLectureItem {
  id: string;
  teacherId: string;
  teacherName: string;
  school: string;
  subject: string;
  grade: string;
  title: string;
  summary: string;
  content: string;
  exercise?: string;
  tips?: string;
  createdAt: string;
  likes: number;
}

interface TeacherChatViewProps {
  currentGrade: GradeLevel;
  userName?: string;
  isDark: boolean;
  onOpenTeacherPortal?: () => void;
}

const STORAGE_KEY_LOGGED_TEACHER = 'max10_logged_in_teacher';

export const TeacherChatView: React.FC<TeacherChatViewProps> = ({
  currentGrade,
  userName = 'Bạn học',
  isDark,
  onOpenTeacherPortal,
}) => {
  // Main view tabs: 'chat' (1-1 messaging) | 'colleagues' (Phòng giáo viên) | 'ai_materials' (AI Soạn tài liệu) | 'lectures' (Giảng bài)
  const [activeTab, setActiveTab] = useState<'chat' | 'colleagues' | 'ai_materials' | 'lectures'>('chat');

  // Teachers list
  const [teachers, setTeachers] = useState<TeacherAccountInfo[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('gv-thuy');
  const [searchTeacher, setSearchTeacher] = useState<string>('');

  // Logged-in teacher (if user is logged in as a real teacher)
  const [loggedInTeacher, setLoggedInTeacher] = useState<TeacherAccountInfo | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGGED_TEACHER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modals for Teacher Register & Login
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showNewLectureModal, setShowNewLectureModal] = useState<boolean>(false);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regSchool, setRegSchool] = useState('THCS Nguyễn Du');
  const [regDepartment, setRegDepartment] = useState('Tổ Khoa học Tự nhiên');
  const [regSubject, setRegSubject] = useState('Khoa học Tự nhiên');
  const [regContact, setRegContact] = useState('');
  const [regPassword, setRegPassword] = useState('123');
  const [regBio, setRegBio] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);

  // Login form state
  const [loginContact, setLoginContact] = useState('');
  const [loginPassword, setLoginPassword] = useState('123');

  // New Lecture Form state
  const [lecTitle, setLecTitle] = useState('');
  const [lecGrade, setLecGrade] = useState<GradeLevel>(currentGrade);
  const [lecSubject, setLecSubject] = useState('Khoa học Tự nhiên');
  const [lecSummary, setLecSummary] = useState('');
  const [lecContent, setLecContent] = useState('');
  const [lecExercise, setLecExercise] = useState('');
  const [lecTips, setLecTips] = useState('');

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // Zalo-style Typing Indicator State
  const [isOtherTyping, setIsOtherTyping] = useState<boolean>(false);
  const [otherTypingName, setOtherTypingName] = useState<string>('');
  const typingTimerRef = useRef<any>(null);

  // Subject filter for teachers
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Teacher inbox state (when logged in as Teacher)
  const [teacherInbox, setTeacherInbox] = useState<
    {
      studentName: string;
      lastMessage: string;
      lastTimestamp: string;
      unreadCount: number;
      totalMessages: number;
    }[]
  >([]);
  const [selectedStudentName, setSelectedStudentName] = useState<string>(userName);

  // Published Lectures state
  const [lectures, setLectures] = useState<TeacherLectureItem[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<TeacherLectureItem | null>(null);

  // Live Video & Voice Call State for Teacher Consultation
  const [teacherCallModal, setTeacherCallModal] = useState<{
    active: boolean;
    type: 'video' | 'voice';
    targetName: string;
    targetAvatar?: string;
    targetBadge?: string;
    targetSubject?: string;
  } | null>(null);

  // TTS & Copy state
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // If user is within 80px from bottom, keep auto-scrolling. If user scrolled up, DO NOT drag them down!
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight <= 80;
  };

  const scrollToBottom = (force = false) => {
    if (!chatContainerRef.current) return;
    if (force || isNearBottomRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: force ? 'auto' : 'smooth',
      });
    }
  };

  // Typing indicator notification
  const notifyTyping = (typing: boolean) => {
    const tId = loggedInTeacher ? loggedInTeacher.id : selectedTeacherId;
    const sName = loggedInTeacher ? selectedStudentName : userName;
    if (!tId || !sName) return;

    fetch('/api/teachers/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacherId: tId,
        studentName: sName,
        sender: loggedInTeacher ? 'teacher' : 'student',
        senderName: loggedInTeacher ? loggedInTeacher.name : userName,
        isTyping: typing,
      }),
    }).catch(() => {});

    if (typing) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        notifyTyping(false);
      }, 2500);
    }
  };

  // Check if other party is typing
  const checkTyping = async (tId: string, sName: string) => {
    if (!tId || !sName) return;
    try {
      const res = await fetch(
        `/api/teachers/typing?teacherId=${encodeURIComponent(tId)}&studentName=${encodeURIComponent(sName)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (loggedInTeacher) {
          setIsOtherTyping(Boolean(data.studentTyping));
          setOtherTypingName(data.studentName || selectedStudentName || 'Học sinh');
        } else {
          setIsOtherTyping(Boolean(data.teacherTyping));
          setOtherTypingName(data.teacherName || currentTeacher?.name || 'Thầy/Cô');
        }
      }
    } catch {}
  };

  // Fetch teachers from backend
  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const res = await fetch('/api/teachers');
      if (res.ok) {
        const data = await res.json();
        if (data.teachers && Array.isArray(data.teachers)) {
          setTeachers(data.teachers);
          if (data.teachers.length > 0) {
            setSelectedTeacherId((prev) => {
              if (data.teachers.find((t: any) => t.id === prev)) return prev;
              return data.teachers[0].id;
            });
          } else {
            setSelectedTeacherId('');
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch teachers:', err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Fetch lectures from backend
  const fetchLectures = async () => {
    try {
      const res = await fetch('/api/teachers/lectures');
      if (res.ok) {
        const data = await res.json();
        if (data.lectures && Array.isArray(data.lectures)) {
          setLectures(data.lectures);
        }
      }
    } catch (err) {
      console.warn('Could not fetch lectures:', err);
    }
  };

  // Fetch messages between selectedTeacher and current student
  const fetchMessages = async (tId: string, sName: string) => {
    if (!tId || !sName) return;
    try {
      const query = new URLSearchParams({
        teacherId: tId,
        studentName: sName,
      });
      const res = await fetch(`/api/teachers/messages?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages((prev) => {
            // Prevent re-render and scroll pull-down if messages haven't changed!
            if (
              prev.length === data.messages.length &&
              (prev.length === 0 ||
                prev[prev.length - 1]?.id === data.messages[data.messages.length - 1]?.id)
            ) {
              return prev;
            }
            return data.messages;
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch messages:', err);
    }
  };

  // Fetch inbox when logged in as teacher
  const fetchTeacherInbox = async (tId: string) => {
    try {
      const res = await fetch(`/api/teachers/inbox?teacherId=${encodeURIComponent(tId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.inbox)) {
          setTeacherInbox(data.inbox);
          if (data.inbox.length > 0 && (!selectedStudentName || !data.inbox.find((i: any) => i.studentName === selectedStudentName))) {
            setSelectedStudentName(data.inbox[0].studentName);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch teacher inbox:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTeachers();
    fetchLectures();
  }, []);

  // Sync active teacher if logged in
  useEffect(() => {
    if (loggedInTeacher) {
      fetchTeacherInbox(loggedInTeacher.id);
      setSelectedTeacherId(loggedInTeacher.id);
    }
  }, [loggedInTeacher]);

  // Polling for new messages and typing indicator every 2.5 seconds
  useEffect(() => {
    const activeTId = loggedInTeacher ? loggedInTeacher.id : selectedTeacherId;
    const activeSName = loggedInTeacher ? selectedStudentName : userName;

    if (!activeTId) return;

    fetchMessages(activeTId, activeSName);
    checkTyping(activeTId, activeSName);

    const interval = setInterval(() => {
      fetchMessages(activeTId, activeSName);
      checkTyping(activeTId, activeSName);
      if (loggedInTeacher) {
        fetchTeacherInbox(loggedInTeacher.id);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedTeacherId, selectedStudentName, loggedInTeacher, userName]);

  // Scroll to bottom only on switching chat or if user is already at the bottom
  useEffect(() => {
    isNearBottomRef.current = true;
    scrollToBottom(true);
  }, [selectedTeacherId, selectedStudentName]);

  // Only auto-scroll on new message if user is currently near the bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(false);
    }
  }, [messages.length]);

  // Sync TTS
  useEffect(() => {
    const unsub = aiVoice.subscribe((st) => {
      setSpeakingId(st.isPlaying ? st.activeMessageId : null);
    });
    return unsub;
  }, []);

  // Send message handler (works for both Student and Teacher)
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sendingMessage) return;

    const currentTId = loggedInTeacher ? loggedInTeacher.id : selectedTeacherId;
    const currentSName = loggedInTeacher ? selectedStudentName : userName;
    const isTeacher = Boolean(loggedInTeacher);

    if (!currentTId) return;

    setSendingMessage(true);
    notifyTyping(false);

    try {
      const response = await fetch('/api/teachers/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: currentTId,
          studentName: currentSName,
          sender: isTeacher ? 'teacher' : 'student',
          senderName: isTeacher ? loggedInTeacher!.name : currentSName,
          content: text,
          subject: loggedInTeacher?.subject,
          grade: currentGrade,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          isNearBottomRef.current = true;
          setMessages((prev) => [...prev, data.message]);
          setInputMessage('');
          setTimeout(() => {
            scrollToBottom(true);
          }, 60);
        }
      }
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Teacher Registration
  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthSubmitting(true);

    try {
      const res = await fetch('/api/teachers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          school: regSchool,
          department: regDepartment,
          subject: regSubject,
          emailOrPhone: regContact,
          password: regPassword,
          bio: regBio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đăng ký không thành công');
      }

      setAuthSuccess(data.message);
      setLoggedInTeacher(data.teacher);
      localStorage.setItem(STORAGE_KEY_LOGGED_TEACHER, JSON.stringify(data.teacher));
      await fetchTeachers();

      setTimeout(() => {
        setShowRegisterModal(false);
        setAuthSuccess(null);
      }, 1200);
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi lập tài khoản');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Teacher Login
  const handleLoginTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthSubmitting(true);

    try {
      const res = await fetch('/api/teachers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: loginContact,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đăng nhập không thành công');
      }

      setAuthSuccess(data.message);
      setLoggedInTeacher(data.teacher);
      localStorage.setItem(STORAGE_KEY_LOGGED_TEACHER, JSON.stringify(data.teacher));

      setTimeout(() => {
        setShowLoginModal(false);
        setAuthSuccess(null);
      }, 1000);
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi đăng nhập tài khoản');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogoutTeacher = () => {
    if (confirm('Thầy/Cô có muốn đăng xuất khỏi tài khoản Giáo viên?')) {
      setLoggedInTeacher(null);
      localStorage.removeItem(STORAGE_KEY_LOGGED_TEACHER);
    }
  };

  // Publish new lecture
  const handlePublishLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInTeacher) return;
    if (!lecTitle.trim() || !lecContent.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung bài giảng.');
      return;
    }

    try {
      const res = await fetch('/api/teachers/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: loggedInTeacher.id,
          teacherName: loggedInTeacher.name,
          school: loggedInTeacher.school,
          subject: lecSubject,
          grade: lecGrade,
          title: lecTitle,
          summary: lecSummary || lecTitle,
          content: lecContent,
          exercise: lecExercise,
          tips: lecTips,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Bài giảng đã được đăng thành công!');
        setShowNewLectureModal(false);
        setLecTitle('');
        setLecSummary('');
        setLecContent('');
        setLecExercise('');
        setLecTips('');
        fetchLectures();
      }
    } catch (err) {
      console.error('Lỗi đăng bài giảng:', err);
    }
  };

  const currentTeacher =
    teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  const uniqueSubjects = Array.from(
    new Set(teachers.map((t) => t.subject).filter(Boolean))
  );

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTeacher.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTeacher.toLowerCase()) ||
      t.school.toLowerCase().includes(searchTeacher.toLowerCase());
    const matchesSubject =
      selectedSubjectFilter === 'all' || t.subject === selectedSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div
      className={`rounded-3xl border ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
      } shadow-sm overflow-hidden flex flex-col min-h-[750px] lg:h-[840px]`}
    >
      {/* 1. Header & Identity Bar - COMPACT FOR BOTH TEACHER & STUDENT */}
      {loggedInTeacher ? (
        // TEACHER WORKSPACE COMPACT HEADER (Gọn gàng, tinh tế, tiết kiệm không gian)
        <div className="py-2.5 px-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-amber-300 flex items-center justify-center shadow-xs shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-300">Không Gian Sư Phạm:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-100 font-bold border border-indigo-400/30">
                <span className="w-4 h-4 rounded-sm bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                  {loggedInTeacher.avatarText}
                </span>
                <span className="text-white text-xs">{loggedInTeacher.name}</span>
                <span className="text-amber-300 text-[11px] font-extrabold">• Môn: {loggedInTeacher.subject}</span>
              </span>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                {loggedInTeacher.school}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Trực tuyến
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onOpenTeacherPortal && (
              <button
                onClick={onOpenTeacherPortal}
                className="px-2.5 py-1 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Cổng Giáo Án"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Cổng Giáo Án</span>
              </button>
            )}
            <button
              onClick={handleLogoutTeacher}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              title="Đăng xuất tài khoản Giáo viên"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      ) : (
        // STUDENT INTERFACE COMPACT HEADER
        <div className="py-2.5 px-4 border-b border-slate-200 dark:border-zinc-800 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-indigo-600/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-zinc-100">
                  Góc Học Sinh Hỏi Bài Thầy Cô Bộ Môn (Trực Tuyến 1-1)
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Thầy Cô Thực Tế
                </span>
              </div>
            </div>
          </div>

          {/* Student Actions / Teacher Auth */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                setAuthError(null);
                setShowLoginModal(true);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-500" />
              <span>Thầy Cô Đăng Nhập</span>
            </button>

            <button
              onClick={() => {
                setAuthError(null);
                setShowRegisterModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Lập Tài Khoản</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Navigation Tabs */}
      <div
        className={`px-3 sm:px-4 pt-2 border-b flex items-center justify-between gap-2 overflow-x-auto ${
          loggedInTeacher
            ? isDark
              ? 'bg-zinc-950/60 border-zinc-800'
              : 'bg-indigo-50/60 border-indigo-100'
            : isDark
            ? 'bg-zinc-950/40 border-zinc-800'
            : 'bg-slate-50/80 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* TAB 1: Chat 1-1 */}
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-t-xl font-bold text-xs transition-all border-t-2 cursor-pointer ${
              activeTab === 'chat'
                ? loggedInTeacher
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 shadow-xs'
                  : 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900 shadow-xs'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>
              {loggedInTeacher ? 'Học Sinh Hỏi Bài (1-1)' : 'Nhắn Tin & Hỏi Bài Thầy Cô'}
            </span>
            {loggedInTeacher && teacherInbox.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-bold">
                {teacherInbox.reduce((acc, curr) => acc + curr.unreadCount, 0)} mới
              </span>
            )}
          </button>

          {/* TAB 2: Teacher-to-Teacher Lounge (Thầy Cô Trò Chuyện Với Nhau) */}
          <button
            onClick={() => setActiveTab('colleagues')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-t-xl font-bold text-xs transition-all border-t-2 cursor-pointer ${
              activeTab === 'colleagues'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 shadow-xs'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Hội Đồng Giáo Viên (Trò Chuyện)</span>
          </button>

          {/* TAB 3: AI Helps Make Teaching Materials (AI Giúp Làm Tài Liệu Dạy Học) */}
          <button
            onClick={() => setActiveTab('ai_materials')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-t-xl font-bold text-xs transition-all border-t-2 cursor-pointer ${
              activeTab === 'ai_materials'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 shadow-xs'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-extrabold text-amber-600 dark:text-amber-400">
              AI Soạn Tài Liệu Dạy Học
            </span>
          </button>

          {/* TAB 4: Lectures Library */}
          <button
            onClick={() => setActiveTab('lectures')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-t-xl font-bold text-xs transition-all border-t-2 cursor-pointer ${
              activeTab === 'lectures'
                ? loggedInTeacher
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 shadow-xs'
                  : 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900 shadow-xs'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Thư Viện Bài Giảng</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
              {lectures.length}
            </span>
          </button>
        </div>

        {activeTab === 'lectures' && loggedInTeacher && (
          <button
            onClick={() => setShowNewLectureModal(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer shrink-0 mb-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng Bài Giảng Mới</span>
          </button>
        )}
      </div>

      {/* 3. TAB 1: 1-to-1 REAL HUMAN CHAT */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-zinc-800 min-h-0">
          {/* A. If Student AND No Teachers Registered Yet -> Prominent Callout */}
          {!loggedInTeacher && teachers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center my-auto space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner border border-emerald-500/20">
                <GraduationCap className="w-10 h-10" />
              </div>
              <div className="space-y-2 max-w-lg">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100">
                  Chưa có Thầy Cô nào đăng ký tài khoản trên hệ thống
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Hệ thống đã được làm mới để Thầy Cô vào đăng ký tài khoản thật. Khi các Thầy Cô bấm <strong>"Thầy Cô Lập Tài Khoản"</strong> và chọn bộ môn giảng dạy (Toán học, Khoa học Tự nhiên, Ngữ văn, Ngoại ngữ...), danh sách Thầy Cô kèm môn học sẽ xuất hiện ngay tại đây để các em gửi bài tập và câu hỏi trực tiếp!
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setAuthError(null);
                    setShowRegisterModal(true);
                  }}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Dành cho Thầy/Cô: Bấm để Lập Tài Khoản Giáo Viên</span>
                </button>

                <button
                  onClick={() => {
                    setAuthError(null);
                    setShowLoginModal(true);
                  }}
                  className="px-5 py-3 rounded-2xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-emerald-500 inline mr-1.5" />
                  <span>Thầy Cô Đã Có Tài Khoản: Đăng Nhập</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* B. Left Column: Teacher Selector (for Student) OR Student Inbox (for Teacher) */}
              <div
                className={`w-full md:w-72 lg:w-80 flex flex-col shrink-0 min-h-0 ${
                  loggedInTeacher
                    ? isDark
                      ? 'bg-zinc-950/30'
                      : 'bg-indigo-50/30'
                    : isDark
                    ? 'bg-zinc-950/20'
                    : 'bg-slate-50/50'
                }`}
              >
                {loggedInTeacher ? (
                  // TEACHER INBOX: List of students asking questions
                  <div className="flex flex-col h-full min-h-0">
                    <div className="p-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-300 tracking-wider">
                          Học sinh hỏi bài ({teacherInbox.length})
                        </span>
                      </div>
                      <button
                        onClick={() => fetchTeacherInbox(loggedInTeacher.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer"
                        title="Cập nhật tin nhắn học sinh"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-0">
                      {teacherInbox.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500 space-y-2">
                          <MessageCircle className="w-8 h-8 mx-auto opacity-40 text-indigo-500" />
                          <p>Chưa có học sinh nào gửi câu hỏi cho Thầy/Cô.</p>
                          <p className="text-[11px] opacity-75">Khi học sinh gửi bài tập, danh sách sẽ hiện ở đây để Thầy/Cô giải đáp!</p>
                        </div>
                      ) : (
                        teacherInbox.map((item) => {
                          const isSelected = selectedStudentName === item.studentName;
                          return (
                            <button
                              key={item.studentName}
                              onClick={() => setSelectedStudentName(item.studentName)}
                              className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 shadow-xs ring-2 ring-indigo-500/20'
                                  : isDark
                                  ? 'border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300'
                                  : 'border-slate-200 bg-white hover:bg-slate-100/80 text-slate-700 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                                    {item.studentName.slice(0, 1).toUpperCase()}
                                  </div>
                                  <span className="font-extrabold text-xs">{item.studentName}</span>
                                </div>
                                <span className="text-[10px] text-slate-400">{item.lastTimestamp}</span>
                              </div>
                              <p className="text-[11px] opacity-80 line-clamp-1 pl-7">{item.lastMessage}</p>
                              {item.unreadCount > 0 && (
                                <div className="mt-1 pl-7">
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold">
                                    {item.unreadCount} câu hỏi mới
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  // STUDENT VIEW: Select Teacher to consult & Filter by Subject
                  <div className="flex flex-col h-full min-h-0">
                    <div className="p-3 border-b border-slate-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider">
                          Thầy Cô Bộ Môn ({filteredTeachers.length})
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold">
                          {uniqueSubjects.length} môn học đã có
                        </span>
                      </div>

                      {/* Search box */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchTeacher}
                          onChange={(e) => setSearchTeacher(e.target.value)}
                          placeholder="Tìm theo tên hoặc môn học..."
                          className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-hidden ${
                            isDark
                              ? 'bg-zinc-850 border-zinc-700 text-white placeholder-zinc-500'
                              : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                        />
                      </div>

                      {/* Subject Filter Pills */}
                      {uniqueSubjects.length > 0 && (
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                          <button
                            onClick={() => setSelectedSubjectFilter('all')}
                            className={`px-2 py-0.5 rounded-lg font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                              selectedSubjectFilter === 'all'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : isDark
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Tất cả môn
                          </button>
                          {uniqueSubjects.map((subj) => (
                            <button
                              key={subj}
                              onClick={() => setSelectedSubjectFilter(subj)}
                              className={`px-2 py-0.5 rounded-lg font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                                selectedSubjectFilter === subj
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : isDark
                                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {subj}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
                      {loadingTeachers ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Đang tải danh sách Thầy Cô...
                        </div>
                      ) : filteredTeachers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                          <p>Không tìm thấy giáo viên môn này.</p>
                          <button
                            onClick={() => setSelectedSubjectFilter('all')}
                            className="text-emerald-600 underline text-[11px]"
                          >
                            Xem tất cả các môn
                          </button>
                        </div>
                      ) : (
                        filteredTeachers.map((teacher) => {
                          const isSelected = selectedTeacherId === teacher.id;
                          return (
                            <button
                              key={teacher.id}
                              onClick={() => setSelectedTeacherId(teacher.id)}
                              className={`w-full p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-xs ring-2 ring-emerald-500/20'
                                  : isDark
                                  ? 'border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300'
                                  : 'border-slate-200 bg-white hover:bg-slate-100/80 text-slate-700 shadow-2xs'
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${teacher.badgeColor} text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0`}
                              >
                                {teacher.avatarText}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-xs truncate">{teacher.name}</span>
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Đang trực tuyến" />
                                </div>
                                <div className="mt-0.5">
                                  <span className="inline-block px-2 py-0.2 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                                    📚 Môn: {teacher.subject}
                                  </span>
                                </div>
                                <div className="text-[9px] text-slate-400 truncate mt-0.5">{teacher.school}</div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* C. Right Column: Active 1-to-1 Chat Conversation (Expanded & Spacious) */}
              <div className="flex-1 flex flex-col min-h-0 bg-transparent h-full">
                {/* Conversation Header (Compact) */}
                <div
                  className={`py-2 px-3.5 border-b flex items-center justify-between gap-2.5 shrink-0 ${
                    loggedInTeacher
                      ? isDark
                        ? 'bg-zinc-900/95 border-zinc-800'
                        : 'bg-indigo-50/50 border-indigo-100'
                      : isDark
                      ? 'bg-zinc-900/90 border-zinc-800'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${
                        loggedInTeacher
                          ? 'from-indigo-600 to-blue-700'
                          : currentTeacher?.badgeColor || 'from-emerald-500 to-teal-600'
                      } text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0`}
                    >
                      {loggedInTeacher ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        currentTeacher?.avatarText || 'TC'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 truncate">
                          {loggedInTeacher
                            ? `Hướng dẫn em: ${selectedStudentName}`
                            : currentTeacher?.name}
                        </span>
                        {!loggedInTeacher && currentTeacher && (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-500/20">
                            Môn: {currentTeacher.subject}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Trực tuyến
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Call & Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        const targetName = loggedInTeacher
                          ? `Em ${selectedStudentName}`
                          : (currentTeacher?.name || 'Thầy/Cô');
                        const targetSub = loggedInTeacher
                          ? `Lớp ${currentGrade}`
                          : currentTeacher?.subject;
                        const targetBadge = loggedInTeacher ? 'Học sinh' : 'Giáo viên';
                        setTeacherCallModal({
                          active: true,
                          type: 'voice',
                          targetName,
                          targetBadge,
                          targetSubject: targetSub,
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs flex items-center gap-1.5 font-bold cursor-pointer transition-all border border-emerald-500/20 active:scale-95 shadow-2xs"
                      title={
                        loggedInTeacher
                          ? `Gọi thoại trao đổi với em ${selectedStudentName}`
                          : `Gọi thoại hỏi bài ${currentTeacher?.name || 'Thầy/Cô'}`
                      }
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[11px] hidden md:inline">Gọi thoại</span>
                    </button>

                    <button
                      onClick={() => {
                        const targetName = loggedInTeacher
                          ? `Em ${selectedStudentName}`
                          : (currentTeacher?.name || 'Thầy/Cô');
                        const targetSub = loggedInTeacher
                          ? `Lớp ${currentGrade}`
                          : currentTeacher?.subject;
                        const targetBadge = loggedInTeacher ? 'Học sinh' : 'Giáo viên';
                        setTeacherCallModal({
                          active: true,
                          type: 'video',
                          targetName,
                          targetBadge,
                          targetSubject: targetSub,
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-white bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-2xs active:scale-95"
                      title={
                        loggedInTeacher
                          ? `Gọi video hướng dẫn em ${selectedStudentName}`
                          : `Gọi video hỏi bài ${currentTeacher?.name || 'Thầy/Cô'}`
                      }
                    >
                      <Video className="w-3.5 h-3.5 text-white" />
                      <span className="text-[11px] hidden sm:inline">Gọi video</span>
                    </button>

                    <button
                      onClick={() =>
                        fetchMessages(
                          loggedInTeacher ? loggedInTeacher.id : selectedTeacherId,
                          loggedInTeacher ? selectedStudentName : userName
                        )
                      }
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs flex items-center gap-1 font-semibold cursor-pointer shrink-0"
                      title="Làm mới tin nhắn"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="text-[11px] hidden lg:inline">Cập nhật</span>
                    </button>
                  </div>
                </div>

                {/* Teacher Pedagogical Action Toolbar (Khi là Thầy Cô giáo) */}
                {loggedInTeacher && (
                  <div
                    className={`px-4 py-2 border-b overflow-x-auto flex items-center gap-2 text-xs scrollbar-none shrink-0 ${
                      isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-indigo-50/40 border-indigo-100'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Mẫu gợi ý sư phạm:
                    </span>
                    {[
                      {
                        label: '💡 Gợi ý bước giải',
                        text: `Thầy/Cô gợi ý cho em: Bước 1 em hãy xác định dữ kiện đã cho, sau đó áp dụng công thức...`,
                      },
                      {
                        label: '⚠️ Chỉ bẫy sai hay gặp',
                        text: `Lưu ý em nhé: Ở bài toán này học sinh rất hay nhầm lẫn giữa đơn vị...`,
                      },
                      {
                        label: '👏 Lời khen khích lệ',
                        text: `Thầy/Cô khen ngợi em đã chủ động làm bài! Cách tư duy của em rất tốt, chỉ cần hoàn thiện thêm...`,
                      },
                      {
                        label: '📐 Nhắc lại công thức',
                        text: `Công thức và định lý cần dùng cho dạng bài này là: `,
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputMessage(item.text);
                          notifyTyping(true);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border cursor-pointer transition-all ${
                          isDark
                            ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-indigo-200'
                            : 'bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-800 shadow-2xs'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Conversation Stream - FULL REMAINING HEIGHT, ROOMY & NO OVERLAP */}
                <div
                  ref={chatContainerRef}
                  onScroll={handleChatScroll}
                  className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-4 pb-8"
                >
                  {messages.length === 0 ? (
                    <div className="p-10 text-center space-y-3 my-auto">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                        <MessageCircle className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="font-extrabold text-base text-slate-800 dark:text-zinc-200">
                          {loggedInTeacher
                            ? `Chưa có câu hỏi nào từ em ${selectedStudentName}`
                            : `Bắt đầu gửi câu hỏi bài tập cho ${currentTeacher?.name || 'Thầy/Cô'}`}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                          {loggedInTeacher
                            ? 'Khi học sinh gửi câu hỏi cần giải đáp, Thầy/Cô sẽ đọc và trực tiếp hướng dẫn phương pháp giải tại đây.'
                            : `Thầy Cô bộ môn ${currentTeacher?.subject || ''} là người thật 100%. Em hãy nhập đề bài tập cần giải, chỗ chưa hiểu hoặc thắc mắc để Thầy/Cô giảng giải chi tiết.`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isTeacherMsg = msg.sender === 'teacher';
                      const isMyMessage = loggedInTeacher ? isTeacherMsg : !isTeacherMsg;

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2.5 ${
                            isMyMessage ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {!isMyMessage && isTeacherMsg && (
                            <div
                              className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${
                                currentTeacher?.badgeColor || 'from-emerald-500 to-teal-600'
                              } text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5`}
                            >
                              {currentTeacher?.avatarText || 'TC'}
                            </div>
                          )}

                          {!isMyMessage && !isTeacherMsg && (
                            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              <User className="w-4 h-4" />
                            </div>
                          )}

                          <div
                            className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm space-y-2 shadow-xs ${
                              isMyMessage
                                ? loggedInTeacher
                                  ? 'bg-indigo-600 text-white rounded-tr-xs'
                                  : 'bg-emerald-600 text-white rounded-tr-xs'
                                : isDark
                                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-tl-xs'
                                : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[10px] pb-1.5 border-b border-black/5 dark:border-white/10 opacity-85 font-bold">
                              <span>
                                {isTeacherMsg
                                  ? `${msg.senderName} (Thầy/Cô Giáo)`
                                  : `${msg.senderName} (Học sinh)`}
                              </span>
                              <span>{msg.timestamp}</span>
                            </div>

                            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                              <Markdown>{formatDolaMath(msg.content)}</Markdown>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 pt-1 text-[10px]">
                              <button
                                onClick={() => {
                                  if (speakingId === msg.id) {
                                    aiVoice.stop();
                                  } else {
                                    aiVoice.speak(msg.content, msg.id);
                                  }
                                }}
                                className="p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                                title="Nghe đọc nội dung"
                              >
                                {speakingId === msg.id ? (
                                  <VolumeX className="w-3.5 h-3.5 text-amber-300" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.content);
                                  setCopiedId(msg.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                                title="Sao chép"
                              >
                                {copiedId === msg.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* ZALO-STYLE TYPING INDICATOR (Hiện lên khi đối phương đang soạn tin nhắn) */}
                  {isOtherTyping && (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-200/90 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 w-fit text-xs animate-pulse shadow-xs border border-slate-300/50 dark:border-zinc-700">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                      <span className="font-bold text-[11px] italic">
                        {otherTypingName} đang soạn tin nhắn...
                      </span>
                    </div>
                  )}

                  {/* Spacer so bottom message is never obscured */}
                  <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* Quick Prompt Suggestions (for students only) */}
                {!loggedInTeacher && (
                  <div
                    className={`px-4 py-2 border-t border-b overflow-x-auto flex items-center gap-2 text-xs scrollbar-none shrink-0 ${
                      isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 whitespace-nowrap flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Mẫu hỏi bài:
                    </span>
                    {[
                      `Thầy/Cô hướng dẫn em phương pháp giải bài tập này với ạ!`,
                      `Thầy/Cô cho em hỏi bài này em hay làm sai ở bước nào ạ?`,
                      `Xin Thầy/Cô dặn dò kinh nghiệm săn điểm 10 môn ${currentTeacher?.subject || ''} ạ!`,
                    ].map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        disabled={sendingMessage}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border cursor-pointer transition-all ${
                          isDark
                            ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
                            : 'bg-white hover:bg-emerald-50 border-slate-200 text-slate-700 shadow-2xs'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Message Input Box - CLEAN, ROOMY, ATTACHED AT BOTTOM WITHOUT OVERLAPPING MESSAGES */}
                <div
                  className={`p-3.5 sm:p-4 border-t shrink-0 ${
                    loggedInTeacher
                      ? isDark
                        ? 'bg-zinc-900 border-zinc-800'
                        : 'bg-indigo-50/30 border-indigo-100'
                      : isDark
                      ? 'bg-zinc-900 border-zinc-800'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2.5"
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => {
                        setInputMessage(e.target.value);
                        notifyTyping(true);
                      }}
                      disabled={sendingMessage}
                      placeholder={
                        loggedInTeacher
                          ? `Thầy/Cô nhập lời giảng giải, hướng dẫn giải bài cho em ${selectedStudentName}...`
                          : `Em nhập đề bài tập hoặc câu hỏi muốn Thầy/Cô ${currentTeacher?.name || ''} giải đáp...`
                      }
                      className={`flex-1 px-4 py-3 rounded-2xl text-xs sm:text-sm border outline-hidden transition-all ${
                        loggedInTeacher
                          ? isDark
                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-indigo-500'
                            : 'bg-white border-indigo-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
                          : isDark
                          ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || sendingMessage}
                      className={`px-5 py-3 rounded-2xl disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-sm flex items-center gap-2 cursor-pointer transition-all ${
                        loggedInTeacher
                          ? 'bg-indigo-600 hover:bg-indigo-500'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>{loggedInTeacher ? 'Gửi lời giảng' : 'Gửi câu hỏi'}</span>
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: TEACHER-TO-TEACHER LOUNGE (Thầy Cô Trò Chuyện Với Nhau) */}
      {activeTab === 'colleagues' && (
        <TeacherColleagueLounge
          loggedInTeacher={loggedInTeacher}
          isDark={isDark}
          onOpenLoginModal={() => {
            setAuthError(null);
            setShowLoginModal(true);
          }}
          onOpenRegisterModal={() => {
            setAuthError(null);
            setShowRegisterModal(true);
          }}
        />
      )}

      {/* TAB: AI TEACHING MATERIAL GENERATOR (AI Giúp Làm Tài Liệu Dạy Học) */}
      {activeTab === 'ai_materials' && (
        <TeacherAiMaterialStudio
          loggedInTeacher={loggedInTeacher}
          currentGrade={currentGrade}
          isDark={isDark}
          onPublishToLectures={async (lecData) => {
            try {
              const res = await fetch('/api/teachers/lectures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  teacherId: loggedInTeacher?.id || 'gv-ai',
                  teacherName: loggedInTeacher?.name || 'Thầy/Cô giáo',
                  school: loggedInTeacher?.school || 'THCS Nguyễn Du',
                  subject: lecData.subject,
                  grade: lecData.grade,
                  title: lecData.title,
                  summary: lecData.summary,
                  content: lecData.content,
                  exercise: 'Bài tập vận dụng nâng cao tích hợp trong bài giảng.',
                  tips: 'Ghi nhớ trọng tâm lý thuyết và phương pháp suy luận chuẩn sư phạm.',
                }),
              });
              if (res.ok) {
                fetchLectures();
                setActiveTab('lectures');
              }
            } catch (err) {
              console.error('Lỗi khi đăng bài giảng từ AI:', err);
            }
          }}
        />
      )}

      {/* 4. TAB: TEACHER LECTURES & ESSENTIAL TOPICS */}
      {activeTab === 'lectures' && (
        <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Chuyên Đề Giảng Bài & Hướng Dẫn Săn Điểm 10
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Các bài giảng chuyên môn do Thầy Cô trường THCS Nguyễn Du trực tiếp biên soạn và giảng giải chi tiết.
              </p>
            </div>

            {loggedInTeacher && (
              <button
                onClick={() => setShowNewLectureModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs self-start cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Thầy Cô Soạn Bài Giảng Mới</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lectures.map((lec) => (
              <div
                key={lec.id}
                className={`p-5 rounded-3xl border ${
                  isDark ? 'bg-zinc-850/70 border-zinc-800' : 'bg-white border-slate-200'
                } shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-all`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {lec.subject} • {lec.grade}
                    </span>
                    <span className="text-[10px] text-slate-400">{lec.createdAt}</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-zinc-100 leading-snug">
                    {lec.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {lec.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {lec.teacherName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                        {lec.teacherName}
                      </div>
                      <div className="text-[10px] text-slate-400">{lec.school}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedLecture(lec)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Đọc bài giảng
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. MODAL: TEACHER REGISTER (Thầy Cô Lập Tài Khoản) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base">Lập Tài Khoản Giáo Viên (Người Thật)</h3>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                {authSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterTeacher} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Họ và Tên Thầy/Cô *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ví dụ: Cô Phạm Thị Bích Thủy"
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Trường học *</label>
                  <input
                    type="text"
                    required
                    value={regSchool}
                    onChange={(e) => setRegSchool(e.target.value)}
                    placeholder="THCS Nguyễn Du"
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Tổ chuyên môn *</label>
                  <input
                    type="text"
                    required
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    placeholder="Tổ Khoa học Tự nhiên"
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Bộ môn giảng dạy chính *</label>
                  <input
                    type="text"
                    required
                    value={regSubject}
                    onChange={(e) => setRegSubject(e.target.value)}
                    placeholder="Khoa học Tự nhiên / Toán / Văn..."
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      'Khoa học Tự nhiên',
                      'Toán học',
                      'Ngữ văn',
                      'Tiếng Anh',
                      'Lịch sử & Địa lý',
                      'Tin học',
                      'Công nghệ',
                      'GDCD',
                    ].map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setRegSubject(subj)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          regSubject === subj
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isDark
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                            : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-bold block mb-1">Mật khẩu đăng nhập *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (mặc định: 123)"
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Email hoặc Số điện thoại *</label>
                <input
                  type="text"
                  required
                  value={regContact}
                  onChange={(e) => setRegContact(e.target.value)}
                  placeholder="Để học sinh nhận diện và đăng nhập"
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Giới thiệu sư phạm / Kinh nghiệm giảng dạy</label>
                <textarea
                  rows={3}
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  placeholder="Kinh nghiệm bồi dưỡng HSG, ôn thi vào 10, lời dặn dò tới các em học sinh..."
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl border font-bold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  {authSubmitting ? 'Đang tạo...' : 'Hoàn Tất Lập Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: TEACHER LOGIN (Thầy Cô Đăng Nhập) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 space-y-4 ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base">Đăng Nhập Tài Khoản Thầy Cô</h3>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                {authSuccess}
              </div>
            )}

            <form onSubmit={handleLoginTeacher} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Email hoặc SĐT hoặc Mã Thầy/Cô *</label>
                <input
                  type="text"
                  required
                  value={loginContact}
                  onChange={(e) => setLoginContact(e.target.value)}
                  placeholder="Ví dụ: bichthuy.thcsnguyendu@gmail.com hoặc gv-thuy"
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Mật khẩu (mặc định: 123)"
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }}
                  className="text-emerald-600 hover:underline font-bold text-xs"
                >
                  Chưa có tài khoản? Lập tài khoản mới
                </button>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  {authSubmitting ? 'Đang vào...' : 'Đăng Nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: PUBLISH LECTURE (Soạn & Đăng Bài Giảng) */}
      {showNewLectureModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-3xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base">Soạn & Đăng Bài Giảng Của Thầy Cô</h3>
              </div>
              <button
                onClick={() => setShowNewLectureModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishLecture} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Tiêu đề bài giảng / Chuyên đề *</label>
                <input
                  type="text"
                  required
                  value={lecTitle}
                  onChange={(e) => setLecTitle(e.target.value)}
                  placeholder="Ví dụ: Bí quyết cân bằng phương trình Hóa học và giải bài toán Mol"
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Bộ môn *</label>
                  <input
                    type="text"
                    required
                    value={lecSubject}
                    onChange={(e) => setLecSubject(e.target.value)}
                    placeholder="Khoa học Tự nhiên / Toán / Ngữ văn..."
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Khối lớp *</label>
                  <select
                    value={lecGrade}
                    onChange={(e) => setLecGrade(e.target.value as GradeLevel)}
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Lớp 6">Lớp 6</option>
                    <option value="Lớp 7">Lớp 7</option>
                    <option value="Lớp 8">Lớp 8</option>
                    <option value="Lớp 9">Lớp 9</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Tóm tắt ngắn (1-2 câu)</label>
                <input
                  type="text"
                  value={lecSummary}
                  onChange={(e) => setLecSummary(e.target.value)}
                  placeholder="Tóm tắt nội dung để học sinh dễ nắm bắt..."
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Nội dung giảng giải chi tiết (Hỗ trợ Markdown) *</label>
                <textarea
                  rows={6}
                  required
                  value={lecContent}
                  onChange={(e) => setLecContent(e.target.value)}
                  placeholder="Thầy/Cô nhập nội dung bài giảng, các bước tư duy, công thức và phương pháp giải..."
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden font-mono text-xs ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Bài tập mẫu tự luyện (Ví dụ minh họa)</label>
                <textarea
                  rows={2}
                  value={lecExercise}
                  onChange={(e) => setLecExercise(e.target.value)}
                  placeholder="Đề bài tập tự luyện để các em làm thử..."
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Mẹo giải & Lời dặn dò của Thầy/Cô</label>
                <input
                  type="text"
                  value={lecTips}
                  onChange={(e) => setLecTips(e.target.value)}
                  placeholder="Mẹo làm bài nhanh, bẫy điểm 10 cần chú ý..."
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewLectureModal(false)}
                  className="px-4 py-2 rounded-xl border font-bold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Đăng Tải Bài Giảng Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: VIEW FULL LECTURE DETAILS */}
      {selectedLecture && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-3xl rounded-3xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                  {selectedLecture.subject} • {selectedLecture.grade}
                </span>
                <span className="text-xs text-slate-400">{selectedLecture.createdAt}</span>
              </div>
              <button
                onClick={() => setSelectedLecture(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-zinc-100">
                {selectedLecture.title}
              </h2>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-zinc-400">
                <span className="font-bold text-emerald-600">{selectedLecture.teacherName}</span>
                <span>•</span>
                <span>{selectedLecture.school}</span>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-800">
              <Markdown>{formatDolaMath(selectedLecture.content)}</Markdown>
            </div>

            {selectedLecture.exercise && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <div className="font-extrabold text-amber-700 dark:text-amber-300">
                  Bài tập tự luyện Thầy/Cô giao:
                </div>
                <p className="text-slate-700 dark:text-zinc-300">{selectedLecture.exercise}</p>
              </div>
            )}

            {selectedLecture.tips && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <div className="font-extrabold text-emerald-700 dark:text-emerald-300">
                  Lời dặn dò & Bí quyết của Thầy/Cô:
                </div>
                <p className="text-slate-700 dark:text-zinc-300">{selectedLecture.tips}</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedLecture(null);
                  setSelectedTeacherId(selectedLecture.teacherId);
                  setActiveTab('chat');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Nhắn tin hỏi Thầy/Cô về bài giảng này</span>
              </button>

              <button
                onClick={() => setSelectedLecture(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Video & Voice Call Modal for Teacher Consultation & Student Q&A */}
      {teacherCallModal && teacherCallModal.active && (
        <VideoAudioCallModal
          isOpen={teacherCallModal.active}
          onClose={() => setTeacherCallModal(null)}
          callType={teacherCallModal.type}
          roomType="teacher"
          targetName={teacherCallModal.targetName}
          targetAvatar={teacherCallModal.targetAvatar}
          targetBadge={teacherCallModal.targetBadge}
          targetSubject={teacherCallModal.targetSubject}
          userName={loggedInTeacher ? loggedInTeacher.name : userName}
          userBadge={loggedInTeacher ? 'Giáo viên' : 'Học sinh'}
          isDark={isDark}
        />
      )}
    </div>
  );
};
