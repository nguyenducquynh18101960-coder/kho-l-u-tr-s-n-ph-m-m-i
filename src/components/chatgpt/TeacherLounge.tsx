import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  FileText,
  Gamepad2,
  Award,
  CheckCircle2,
  Copy,
  Download,
  Send,
  MessageSquare,
  ShieldCheck,
  School,
  UserCheck,
  ChevronRight,
  HeartHandshake,
  Check,
  AlertCircle,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  Video,
  Printer,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { GradeLevel } from '../../types';
import { PdfExportModal } from './PdfExportModal';
import { TeacherChatView } from './TeacherChatView';

interface TeacherProfile {
  id: string;
  name: string;
  department: string;
  defaultSubject: string;
  avatarText: string;
  badgeColor: string;
  title: string;
}

const HONORED_TEACHERS: TeacherProfile[] = [
  {
    id: 'co-thuy',
    name: 'Cô Phạm Thị Bích Thủy',
    department: 'Tổ Khoa học Tự nhiên',
    defaultSubject: 'Khoa học Tự nhiên',
    avatarText: 'PT',
    badgeColor: 'from-emerald-500 to-teal-600',
    title: 'Giáo viên Trường THCS Nguyễn Du',
  },
  {
    id: 'co-duong',
    name: 'Cô Vũ Thùy Dương',
    department: 'Tổ Tin học và Công nghệ',
    defaultSubject: 'Tin học và Công nghệ',
    avatarText: 'VD',
    badgeColor: 'from-blue-600 to-indigo-600',
    title: 'Giáo viên Trường THCS Nguyễn Du',
  },
  {
    id: 'co-lien',
    name: 'Cô Nguyễn Thị Liên',
    department: 'Tổ Ngữ văn',
    defaultSubject: 'Ngữ văn',
    avatarText: 'NL',
    badgeColor: 'from-purple-600 to-pink-600',
    title: 'Giáo viên Trường THCS Nguyễn Du',
  },
];

const STORAGE_KEY_TEACHER = 'max10_teacher_verified_profile_v1';
const STORAGE_KEY_TEACHER_NOTES = 'max10_teacher_school_announcements_v1';

interface TeacherLoungeProps {
  currentGrade: GradeLevel;
  userName?: string;
  onSendToChat?: (text: string) => void;
  onOpenVideoStudio?: () => void;
  isDark: boolean;
}

export const TeacherLounge: React.FC<TeacherLoungeProps> = ({
  currentGrade,
  userName,
  onSendToChat,
  onOpenVideoStudio,
  isDark,
}) => {
  // Mode: 'chat' (Student & Parent consultation chat) | 'portal' (Teacher pedagogical suite)
  const [loungeMode, setLoungeMode] = useState<'chat' | 'portal'>('chat');

  // Teacher authentication state
  const [currentTeacher, setCurrentTeacher] = useState<TeacherProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEACHER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Lỗi đọc giáo viên', e);
    }
    return null;
  });

  // Selected teacher in login gate
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('co-thuy');
  const [customTeacherName, setCustomTeacherName] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('Khoa học Tự nhiên');
  const [customGrade, setCustomGrade] = useState<string>('Lớp 9');
  const [customDepartment, setCustomDepartment] = useState<string>('Tổ Khoa học Tự nhiên');
  const [passcode, setPasscode] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  // Active Tool in Teacher Lounge
  const [activeTool, setActiveTool] = useState<
    'lesson_plan' | 'exam_matrix' | 'game' | 'comment' | 'announcement'
  >('lesson_plan');

  // Tool Form inputs
  const [subject, setSubject] = useState<string>('Khoa học Tự nhiên');
  const [grade, setGrade] = useState<string>(currentGrade.includes('Lớp') ? currentGrade : 'Lớp 9');
  const [bookSeries, setBookSeries] = useState<string>('Kết nối tri thức với cuộc sống');
  const [topic, setTopic] = useState<string>('Phương trình bậc hai một ẩn và Hệ thức Vi-ét');
  const [customDetails, setCustomDetails] = useState<string>('');

  // Generation result state
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Teacher notes / announcements for students
  const [teacherNotes, setTeacherNotes] = useState<
    Array<{ id: string; teacherName: string; content: string; date: string; grade: string }>
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEACHER_NOTES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Lỗi đọc dặn dò giáo viên', e);
    }
    return [
      {
        id: 'note-1',
        teacherName: 'Cô Phạm Thị Bích Thủy',
        content:
          'Các em Lớp 9 chú ý ôn thật kỹ dạng bài Hệ thức Vi-ét và điều kiện có nghiệm phân biệt. Nhớ kiểm tra lại điều kiện Delta trước khi áp dụng định lý nhé!',
        date: 'Hôm nay',
        grade: 'Lớp 9',
      },
      {
        id: 'note-2',
        teacherName: 'Cô Vũ Thùy Dương',
        content:
          'Khi làm bài văn nghị luận xã hội, các em hãy nhớ trích dẫn ít nhất 1 câu danh ngôn và 1 tấm gương thực tế để bài viết thêm chiều sâu và thuyết phục nhé!',
        date: 'Hôm nay',
        grade: 'Lớp 8, 9',
      },
      {
        id: 'note-3',
        teacherName: 'Cô Nguyễn Thị Liên',
        content:
          'Tuần này chúng ta kiểm tra từ vựng Unit 8 và cấu trúc câu điều kiện loại 1 & 2. Các em nhớ luyện phát âm và làm bài tập trắc nghiệm trên Max10 để lấy điểm 10!',
        date: 'Hôm nay',
        grade: 'Lớp 7, 8, 9',
      },
    ];
  });

  const [newAnnouncement, setNewAnnouncement] = useState<string>('');

  // Update default subject when teacher changes
  useEffect(() => {
    if (currentTeacher) {
      setSubject(currentTeacher.defaultSubject);
    }
  }, [currentTeacher]);

  const handleVerifyTeacher = () => {
    setAuthError('');
    if (selectedTeacherId === 'custom') {
      if (!customTeacherName.trim()) {
        setAuthError('Thầy/Cô vui lòng nhập họ và tên của mình.');
        return;
      }
      if (!customSubject.trim()) {
        setAuthError('Thầy/Cô vui lòng chọn môn giảng dạy để thiết lập tài liệu & xuất file PDF.');
        return;
      }
      if (!customGrade.trim()) {
        setAuthError('Thầy/Cô vui lòng chọn khối lớp giảng dạy.');
        return;
      }
      const newProf: TeacherProfile = {
        id: 'custom-' + Date.now(),
        name: customTeacherName.trim(),
        department: customDepartment.trim() || `Tổ Chuyên môn (${customSubject})`,
        defaultSubject: customSubject.trim(),
        avatarText: customTeacherName.trim().slice(0, 2).toUpperCase(),
        badgeColor: 'from-amber-500 to-emerald-600',
        title: 'Giáo viên Trường THCS Nguyễn Du',
      };
      setCurrentTeacher(newProf);
      setSubject(customSubject.trim());
      setGrade(customGrade.trim());
      localStorage.setItem(STORAGE_KEY_TEACHER, JSON.stringify(newProf));
      return;
    }

    const matched = HONORED_TEACHERS.find((t) => t.id === selectedTeacherId);
    if (matched) {
      setCurrentTeacher(matched);
      localStorage.setItem(STORAGE_KEY_TEACHER, JSON.stringify(matched));
    }
  };

  const handleLogout = () => {
    setCurrentTeacher(null);
    localStorage.removeItem(STORAGE_KEY_TEACHER);
    setGeneratedMarkdown('');
  };

  const handleGenerate = async (type: 'lesson_plan' | 'exam_matrix' | 'game' | 'comment') => {
    setLoading(true);
    setGeneratedMarkdown('');

    try {
      const res = await fetch('/api/teacher/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          teacherName: currentTeacher?.name || 'Cô Phạm Thị Bích Thủy',
          subject,
          grade,
          bookSeries,
          topic,
          customDetails,
        }),
      });

      const data = await res.json();
      if (data.success && data.markdown) {
        setGeneratedMarkdown(data.markdown);
      } else {
        throw new Error(data.error || 'Không nhận được kết quả từ máy chủ');
      }
    } catch (err: any) {
      // Graceful fallback for offline / server issues
      const fallback = `### KẾ HOẠCH BÀI DẠY (CHUYÊN MÔN THCS NGUYỄN DU)\n**Giáo viên:** ${
        currentTeacher?.name || 'Cô Phạm Thị Bích Thủy'
      }\n**Môn:** ${subject} - ${grade} | **Bộ sách:** ${bookSeries}\n**Chủ đề:** ${topic}\n\n#### I. MỤC TIÊU\n- **Kiến thức:** Nắm vững định nghĩa, công thức và phương pháp giải dạng bài trọng tâm của ${topic}.\n- **Năng lực:** Phát triển năng lực tự chủ, tự học, tư duy logic và giải quyết vấn đề.\n- **Phẩm chất:** Rèn tính cẩn thận, kiên trì săn điểm 10.\n\n#### II. TIẾN TRÌNH DẠY HỌC 4 BƯỚC\n1. **Khởi động (5-7 phút):** Hoạt động thử thách nhanh kích thích tư duy.\n2. **Hình thành kiến thức mới (15-20 phút):** Giao nhiệm vụ cho học sinh, thảo luận nhóm.\n3. **Luyện tập (12-15 phút):** Bài tập phân hóa từ cơ bản đến nâng cao có bẫy điểm 10.\n4. **Vận dụng & Mở rộng (5 phút):** Bài toán liên hệ đời sống thực tế.\n\n*(Thầy/Cô có thể chỉnh sửa trực tiếp hoặc xuất file Word bên dưới)*`;
      setGeneratedMarkdown(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedMarkdown) return;
    navigator.clipboard.writeText(generatedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!generatedMarkdown) return;
    const blob = new Blob([generatedMarkdown], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Giao_An_${subject}_${grade}_${topic.slice(0, 20)}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim() || !currentTeacher) return;

    const newNote = {
      id: 'note-' + Date.now(),
      teacherName: currentTeacher.name,
      content: newAnnouncement.trim(),
      date: 'Vừa xong',
      grade: grade,
    };

    const updated = [newNote, ...teacherNotes];
    setTeacherNotes(updated);
    localStorage.setItem(STORAGE_KEY_TEACHER_NOTES, JSON.stringify(updated));
    setNewAnnouncement('');
  };

  // If in 'chat' mode: render the Interactive Teacher-Student Consultation Room
  if (loungeMode === 'chat') {
    return (
      <div className="space-y-6">
        <TeacherChatView
          currentGrade={currentGrade}
          userName={userName}
          isDark={isDark}
          onOpenTeacherPortal={() => setLoungeMode('portal')}
        />

        {/* Display public Teacher Announcements from THCS Nguyễn Du */}
        <div
          className={`p-4 sm:p-6 rounded-3xl border ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
          } shadow-sm space-y-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-emerald-600" />
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-zinc-100">
                Bảng Tin Lời Dặn Dò Sư Phạm - Trường THCS Nguyễn Du
              </h2>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              {teacherNotes.length} dặn dò
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {teacherNotes.map((note) => (
              <div
                key={note.id}
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-zinc-850/60 border-zinc-800' : 'bg-slate-50/70 border-slate-200/80'
                } shadow-xs space-y-2 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {note.teacherName}
                    </span>
                    <span className="text-[10px] text-slate-400">{note.date}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 italic leading-relaxed">
                    "{note.content}"
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                  <span>Khối: {note.grade}</span>
                  <span className="font-semibold text-emerald-600">THCS Nguyễn Du</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If teacher is NOT verified yet, render the authentication and welcome gate
  if (!currentTeacher) {
    return (
      <div className={`p-4 sm:p-8 rounded-3xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} shadow-sm`}>
        {/* Back to Chat button */}
        <div className="mb-6 flex justify-start">
          <button
            onClick={() => setLoungeMode('chat')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isDark
                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>← Quay lại Trò Chuyện & Hỏi Bài Thầy Cô</span>
          </button>
        </div>

        {/* School Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <School className="w-4 h-4" />
            <span>Trường THCS Nguyễn Du</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100 mb-2">
            Cổng Dành Riêng Cho Giáo Viên
          </h1>

          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            Khu vực chuyên môn sư phạm và công cụ AI hỗ trợ giảng dạy dành riêng cho{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              Cô Phạm Thị Bích Thủy, Cô Vũ Thùy Dương, Cô Nguyễn Thị Liên
            </strong>{' '}
            và các thầy cô giáo trong trường THCS Nguyễn Du.
          </p>
        </div>

        {/* Verification Form */}
        <div className="max-w-xl mx-auto space-y-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 px-1">
            Chọn danh tính Giáo viên THCS Nguyễn Du:
          </div>

          <div className="grid grid-cols-1 gap-3">
            {HONORED_TEACHERS.map((t) => {
              const isSelected = selectedTeacherId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTeacherId(t.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                      : isDark
                      ? 'border-zinc-800 bg-zinc-850/60 hover:border-zinc-700'
                      : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${t.badgeColor} text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0`}
                    >
                      {t.avatarText}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-zinc-100">
                          {t.name}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Chính thức
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">{t.department}</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 dark:border-zinc-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}

            {/* Option for other teachers of THCS Nguyen Du */}
            <div
              onClick={() => setSelectedTeacherId('custom')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedTeacherId === 'custom'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                  : isDark
                  ? 'border-zinc-800 bg-zinc-850/60 hover:border-zinc-700'
                  : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                      Thầy / Cô giáo khác thuộc THCS Nguyễn Du
                    </span>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Chuyển các môn (chọn môn dạy và lớp để làm file PDF)
                    </p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedTeacherId === 'custom'
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 dark:border-zinc-600'
                  }`}
                >
                  {selectedTeacherId === 'custom' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              {selectedTeacherId === 'custom' && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                      Họ và tên Giáo viên:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Thầy Hoàng Văn Nam / Cô Trần Thị Mai"
                      value={customTeacherName}
                      onChange={(e) => setCustomTeacherName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-hidden ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                        Thầy/Cô dạy môn gì? <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <select
                        value={customSubject}
                        onChange={(e) => {
                          setCustomSubject(e.target.value);
                          if (!customDepartment || customDepartment.includes('Tổ')) {
                            setCustomDepartment(`Tổ Chuyên môn ${e.target.value}`);
                          }
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs border outline-hidden ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="Khoa học Tự nhiên">Khoa học Tự nhiên</option>
                        <option value="Tin học và Công nghệ">Tin học và Công nghệ</option>
                        <option value="Ngữ văn">Ngữ văn</option>
                        <option value="Toán học">Toán học</option>
                        <option value="Tiếng Anh">Tiếng Anh</option>
                        <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
                        <option value="Giáo dục công dân">Giáo dục công dân</option>
                        <option value="Nghệ thuật (Âm nhạc - Mỹ thuật)">Nghệ thuật (Âm nhạc - Mỹ thuật)</option>
                        <option value="Hoạt động trải nghiệm">Hoạt động trải nghiệm</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                        Dạy lớp mấy? <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <select
                        value={customGrade}
                        onChange={(e) => setCustomGrade(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs border outline-hidden ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
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
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                      Tổ chuyên môn:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tổ Khoa học Tự nhiên / Tổ Tin học"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-hidden ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {authError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Verification Button */}
          <button
            onClick={handleVerifyTeacher}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Xác thực & Vào Cổng Giáo Viên THCS Nguyễn Du</span>
          </button>
        </div>
      </div>
    );
  }

  // If verified, render the full Teacher Suite
  return (
    <div className={`p-4 sm:p-6 rounded-3xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
      {/* Teacher Profile Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-blue-600/10 border border-emerald-500/20">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-13 h-13 rounded-2xl bg-gradient-to-tr ${currentTeacher.badgeColor} text-white flex items-center justify-center font-black text-base shadow-md shrink-0`}
          >
            {currentTeacher.avatarText}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-zinc-100">
                {currentTeacher.name}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Giáo viên THCS Nguyễn Du
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium mt-0.5">
              {currentTeacher.department} • Trường THCS Nguyễn Du
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={() => setLoungeMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isDark
                ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
            }`}
            title="Trò chuyện và xem học sinh hỏi bài"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>Phòng Trò Chuyện Thầy Cô</span>
          </button>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              isDark
                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Đổi giáo viên hoặc đăng xuất"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đổi Giáo Viên</span>
          </button>
        </div>
      </div>

      {/* Nav Tabs for Pedagogical Tools */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-zinc-800 text-xs">
        <button
          onClick={() => setActiveTool('lesson_plan')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTool === 'lesson_plan'
              ? 'bg-emerald-600 text-white shadow-xs'
              : isDark
              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Soạn Giáo Án 5512</span>
        </button>

        <button
          onClick={() => setActiveTool('exam_matrix')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTool === 'exam_matrix'
              ? 'bg-emerald-600 text-white shadow-xs'
              : isDark
              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Ma Trận & Đặc Tả Đề Thi (TT 22)</span>
        </button>

        <button
          onClick={() => setActiveTool('game')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTool === 'game'
              ? 'bg-emerald-600 text-white shadow-xs'
              : isDark
              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Trò Chơi Khởi Động (5 Phút)</span>
        </button>

        <button
          onClick={() => setActiveTool('comment')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTool === 'comment'
              ? 'bg-emerald-600 text-white shadow-xs'
              : isDark
              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Nhận Xét Học Bạ (TT 22)</span>
        </button>

        <button
          onClick={() => setActiveTool('announcement')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTool === 'announcement'
              ? 'bg-emerald-600 text-white shadow-xs'
              : isDark
              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Dặn Dò Học Trò Nguyễn Du</span>
        </button>

        {onOpenVideoStudio && (
          <button
            onClick={onOpenVideoStudio}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white"
          >
            <Video className="w-4 h-4" />
            <span>Làm Video Bài Giảng 60s</span>
          </button>
        )}
      </div>

      {/* Tool 1, 2, 3, 4: Generator Forms */}
      {activeTool !== 'announcement' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Subject Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Môn học:
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-hidden ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="Toán học">Toán học</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Khoa học Tự nhiên">Khoa học Tự nhiên (KHTN)</option>
                <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
                <option value="Giáo dục công dân">Giáo dục công dân</option>
                <option value="Tin học">Tin học</option>
                <option value="Công nghệ">Công nghệ</option>
              </select>
            </div>

            {/* Grade Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Khối lớp:
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-hidden ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="Lớp 6">Lớp 6</option>
                <option value="Lớp 7">Lớp 7</option>
                <option value="Lớp 8">Lớp 8</option>
                <option value="Lớp 9">Lớp 9</option>
              </select>
            </div>

            {/* Book Series Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Bộ sách giáo khoa:
              </label>
              <select
                value={bookSeries}
                onChange={(e) => setBookSeries(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-hidden ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức với cuộc sống</option>
                <option value="Cánh diều">Cánh diều</option>
                <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
              </select>
            </div>

            {/* Action Button */}
            <div className="flex items-end">
              <button
                onClick={() => handleGenerate(activeTool)}
                disabled={loading}
                className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang soạn...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>
                      {activeTool === 'lesson_plan'
                        ? 'Tạo Giáo Án 5512'
                        : activeTool === 'exam_matrix'
                        ? 'Tạo Ma Trận Đề'
                        : activeTool === 'game'
                        ? 'Tạo Trò Chơi'
                        : 'Tạo Lời Nhận Xét'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Topic & Custom Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Tên bài học / Tiết dạy / Chủ đề:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Định lý Vi-ét, Bài thơ Ánh trăng, Thì Quá khứ hoàn thành..."
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-hidden ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Ghi chú riêng của Thầy/Cô (tùy chọn):
              </label>
              <input
                type="text"
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                placeholder="Ví dụ: Tập trung bẫy thi vào 10, phân hóa học sinh giỏi, liên hệ thực tế..."
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-hidden ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Result Box */}
          {generatedMarkdown && (
            <div className={`mt-4 rounded-2xl border ${isDark ? 'bg-zinc-850/80 border-zinc-750' : 'bg-slate-50 border-slate-200'} p-4 sm:p-6 space-y-4`}>
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200 dark:border-zinc-750">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                    Bản thảo sư phạm đã sẵn sàng:
                  </span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">
                    ({subject} - {grade})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      copied
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>

                  <button
                    onClick={handleDownloadTxt}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
                    }`}
                    title="Tải về file văn bản"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải file Word</span>
                  </button>

                  <button
                    onClick={() => setShowPdfModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    title="Xuất file PDF chuẩn Bộ Giáo dục & Đào tạo (A4, có Quốc hiệu và chữ ký duyệt)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Xuất file PDF</span>
                  </button>

                  {onSendToChat && (
                    <button
                      onClick={() =>
                        onSendToChat(
                          `Thầy/Cô hãy phân tích và phát triển thêm các câu hỏi bẫy tư duy phân hóa cho bài dạy: ${topic}`
                        )
                      }
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
                      title="Chuyển vào Max10 để thảo luận tiếp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Hỏi thêm Max10</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Markdown Render Area */}
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed overflow-x-auto">
                <Markdown>{generatedMarkdown}</Markdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool 5: Announcements & Words of Wisdom for Students of THCS Nguyen Du */}
      {activeTool === 'announcement' && (
        <div className="space-y-5">
          {/* Post an announcement */}
          <form onSubmit={handleAddAnnouncement} className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-850/80 border-zinc-750' : 'bg-slate-50 border-slate-200'} space-y-3`}>
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-zinc-200">
              <HeartHandshake className="w-4 h-4 text-emerald-500" />
              <span>Gửi lời dặn dò, bí kíp săn điểm 10 tới học sinh THCS Nguyễn Du:</span>
            </div>

            <textarea
              rows={3}
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              placeholder={`Kính gửi các bạn học sinh... (${currentTeacher.name} dặn dò ôn thi, bài tập tuần...)`}
              className={`w-full p-3 rounded-xl text-xs border outline-hidden resize-none ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newAnnouncement.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Đăng lời dặn dò</span>
              </button>
            </div>
          </form>

          {/* List of announcements */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Bảng Tin Sư Phạm THCS Nguyễn Du</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                {teacherNotes.length} lời nhắn
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teacherNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-zinc-850/60 border-zinc-800' : 'bg-white border-slate-200'
                  } shadow-xs space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        {note.teacherName.slice(0, 2)}
                      </div>
                      <span className="font-bold text-xs text-slate-900 dark:text-zinc-100">
                        {note.teacherName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">{note.date}</span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed italic">
                    "{note.content}"
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800 text-[10px] text-slate-400">
                    <span>Áp dụng: {note.grade}</span>
                    <span className="text-emerald-600 font-semibold">Trường THCS Nguyễn Du</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal conforming to MOET Công văn 5512 & TT 22 */}
      {showPdfModal && currentTeacher && (
        <PdfExportModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          teacherName={currentTeacher.name}
          subject={subject}
          grade={grade}
          department={currentTeacher.department}
          topicTitle={topic}
          contentMarkdown={generatedMarkdown}
          isDark={isDark}
          isCustomTeacher={currentTeacher.id.startsWith('custom')}
          onConfirmSubjectAndGrade={(newSubject, newGrade) => {
            setSubject(newSubject);
            setGrade(newGrade);
          }}
        />
      )}
    </div>
  );
};
