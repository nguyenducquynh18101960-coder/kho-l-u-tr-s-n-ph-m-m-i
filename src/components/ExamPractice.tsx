import React, { useState, useEffect } from 'react';
import { GradeLevel, SubjectInfo, ExamData } from '../types';
import { UserAccount } from '../types/auth';
import Markdown from 'react-markdown';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  RefreshCw,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Trophy,
  Crown,
  BookOpen,
  Plus,
  UploadCloud,
  GraduationCap,
  Filter,
  Trash2,
  Users,
  BarChart3,
} from 'lucide-react';
import { HonorRollLeaderboard } from './HonorRollLeaderboard';
import { awardStudentActivity } from '../data/initialAchievements';
import {
  ALL_CLASSES_LIST,
  ClassCode,
  ClassMockExam,
  loadMockExams,
  saveMockExams,
  HOMEROOM_TEACHERS,
} from '../data/classSystemData';

interface ExamPracticeProps {
  currentGrade: GradeLevel;
  currentSubject: SubjectInfo;
  isAdmin?: boolean;
  currentUser?: UserAccount | null;
  userName?: string;
  isDark?: boolean;
}

export const ExamPractice: React.FC<ExamPracticeProps> = ({
  currentGrade,
  currentSubject,
  isAdmin = false,
  currentUser,
  userName = 'Bạn học',
  isDark = false,
}) => {
  const [subTab, setSubTab] = useState<'practice' | 'honor_roll' | 'exam_library'>('practice');
  const [libraryClassFilter, setLibraryClassFilter] = useState<string>('all');
  const [librarySubjectFilter, setLibrarySubjectFilter] = useState<string>('all');
  const [mockExamsList, setMockExamsList] = useState<ClassMockExam[]>(() => loadMockExams());
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [newExamTitle, setNewExamTitle] = useState<string>('');
  const [newExamClass, setNewExamClass] = useState<ClassCode>('9D1');
  const [newExamSubject, setNewExamSubject] = useState<string>('Toán Học');
  const [newExamDuration, setNewExamDuration] = useState<number>(45);
  const [newExamQuestionsCount, setNewExamQuestionsCount] = useState<number>(20);
  const [newExamInstructions, setNewExamInstructions] = useState<string>('Đề thi thử chính thức có câu phân hóa Điểm 10');
  const [submittedToHonorRoll, setSubmittedToHonorRoll] = useState<boolean>(false);
  const [honorRollSubmitting, setHonorRollSubmitting] = useState<boolean>(false);
  const [examType, setExamType] = useState<'15_phut' | 'giua_ky' | 'cuoi_ky' | 'hsg_chuyen'>('giua_ky');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(5);

  const [loading, setLoading] = useState<boolean>(false);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);

  const availableTopics = currentSubject.topics[currentGrade] || [];

  useEffect(() => {
    if (availableTopics.length > 0) {
      setSelectedTopic(availableTopics[0]);
    } else {
      setSelectedTopic('Kiến thức trọng tâm');
    }
  }, [currentGrade, currentSubject.id]);

  // Countdown timer when taking exam
  useEffect(() => {
    if (!examData || isSubmitted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examData, isSubmitted, timeRemaining]);

  const handleGenerateExam = async () => {
    setLoading(true);
    setIsSubmitted(false);
    setUserAnswers({});
    setActiveQuestionIdx(0);

    try {
      const res = await fetch('/api/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: currentGrade,
          subject: currentSubject.name,
          examType,
          topic: selectedTopic,
          numQuestions,
        }),
      });

      const data = await res.json();
      if (data.success && data.exam) {
        setExamData(data.exam);
        setTimeRemaining((data.exam.durationMinutes || 15) * 60);
      } else {
        throw new Error(data.error || 'Không thể tạo đề thi');
      }
    } catch (err: any) {
      alert(`⚠️ Lỗi: ${err.message || 'Có sự cố khi tạo đề thi, vui lòng thử lại.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: number, answerValue: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerValue,
    }));
  };

  // Calculate score out of 10
  const calculateScore = () => {
    if (!examData) return { score: 0, correctCount: 0, total: 0 };
    const total = examData.questions.length;
    let correctCount = 0;

    examData.questions.forEach((q) => {
      const userAns = (userAnswers[q.id] || '').trim().toUpperCase();
      const correctAns = (q.correctAnswer || '').trim().toUpperCase();
      // Match letter or text
      if (userAns && (userAns === correctAns || userAns.startsWith(correctAns) || correctAns.startsWith(userAns))) {
        correctCount += 1;
      }
    });

    const score = Number(((correctCount / total) * 10).toFixed(1));
    return { score, correctCount, total };
  };

  const handleSubmitExam = () => {
    setIsSubmitted(true);
    const { score, correctCount } = calculateScore();
    if (currentSubject.id === 'toan') {
      awardStudentActivity({ type: 'solve_algebra', count: Math.max(1, correctCount), score });
    } else {
      awardStudentActivity({ type: 'complete_exam', score });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const { score, correctCount, total } = isSubmitted ? calculateScore() : { score: 0, correctCount: 0, total: 0 };

  const handleSubmitToHonorRoll = async () => {
    if (submittedToHonorRoll || honorRollSubmitting) return;
    setHonorRollSubmitting(true);
    try {
      const studentDisplayName = currentUser?.name || userName || 'Học sinh Max10';
      const studentAvatar = currentUser?.avatar || '';
      const timeSpent = (examData?.durationMinutes || 15) * 60 - timeRemaining;

      const res = await fetch('/api/exam/honor-roll/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentDisplayName,
          avatar: studentAvatar,
          school: 'THCS',
          grade: currentGrade,
          subject: currentSubject.name,
          score,
          totalQuestions: total,
          correctCount,
          timeSpentSeconds: timeSpent > 0 ? timeSpent : 300,
          examType:
            examType === '15_phut'
              ? 'Kiểm tra 15 phút'
              : examType === 'giua_ky'
              ? 'Khảo sát Giữa kỳ'
              : examType === 'cuoi_ky'
              ? 'Thi Học kỳ'
              : 'Thi HSG & Vào 10 Chuyên',
          note:
            score === 10
              ? 'Thủ Khoa Điểm 10 Tuyệt Đối'
              : score >= 9
              ? 'Á Khoa Xuất Sắc'
              : 'Bảng Vàng Danh Dự',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedToHonorRoll(true);
        setTimeout(() => {
          setSubTab('honor_roll');
        }, 500);
      }
    } catch (e) {
      console.error('Lỗi gửi kết quả lên bảng vàng:', e);
    } finally {
      setHonorRollSubmitting(false);
    }
  };

  // Handlers for Exam Library (6A1 - 9D6)
  const handleUploadExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) return;

    const teacher = HOMEROOM_TEACHERS[newExamClass];
    const newExam: ClassMockExam = {
      id: `exam-${Date.now()}`,
      title: newExamTitle.trim(),
      className: newExamClass,
      subject: newExamSubject,
      durationMinutes: newExamDuration,
      totalQuestions: newExamQuestionsCount,
      totalStudents: 35,
      completedStudentCount: 0,
      avgClassScore: 0,
      creatorTeacherName: teacher ? teacher.name : (currentUser?.name || 'Giáo viên bộ môn'),
      createdAt: 'Vừa xong',
      difficulty: 'hard',
    };

    const updated = [newExam, ...mockExamsList];
    setMockExamsList(updated);
    saveMockExams(updated);
    setShowUploadModal(false);
    setNewExamTitle('');
  };

  const handleDeleteMockExam = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa bộ đề thi này khỏi thư viện?')) {
      const updated = mockExamsList.filter((m) => m.id !== id);
      setMockExamsList(updated);
      saveMockExams(updated);
    }
  };

  const handleStartLibraryExam = (exam: ClassMockExam) => {
    const generatedQuestions = Array.from({ length: Math.min(exam.totalQuestions, 10) }, (_, i) => ({
      id: i + 1,
      questionText: `Câu ${i + 1} (${exam.subject} - Lớp ${exam.className}): ${exam.title} - Vận dụng kiến thức trọng tâm giải quyết bài toán thi thử điểm 10.`,
      type: 'multiple_choice' as const,
      options: [
        `A. Phương án chuẩn theo phương pháp giải mẫu`,
        `B. Phương án bẫy thường gặp trong đề thi`,
        `C. Phương án nâng cấp bứt phá Điểm 10 (Chuẩn)`,
        `D. Phương án bổ trợ kiến thức cơ bản`,
      ],
      correctAnswer: 'C',
      difficulty: exam.difficulty,
      stepByStepSolution: `Lời giải chi tiết từng bước theo chuẩn cấu trúc chấm của Sở GD&ĐT. Luôn kiểm tra điều kiện xác định, lập luận chặt chẽ và kết luận nghiệm.`,
      score10Secret: `Bí kíp Điểm 10: Trình bày mạch lạc, không đốt cháy giai đoạn để đảm bảo đạt trọn vẹn điểm số tuyệt đối.`,
    }));

    setExamData({
      title: `${exam.title} - Lớp ${exam.className}`,
      durationMinutes: exam.durationMinutes,
      instructions: `Bộ đề thi thử chính thức lớp ${exam.className} do ${exam.creatorTeacherName} biên soạn.`,
      questions: generatedQuestions,
    });
    setTimeRemaining(exam.durationMinutes * 60);
    setUserAnswers({});
    setIsSubmitted(false);
    setActiveQuestionIdx(0);
    setSubTab('practice');
  };

  const filteredLibraryExams = mockExamsList.filter((exam) => {
    const matchClass = libraryClassFilter === 'all' || exam.className === libraryClassFilter;
    const matchSubject =
      librarySubjectFilter === 'all' ||
      exam.subject.toLowerCase().includes(librarySubjectFilter.toLowerCase());
    return matchClass && matchSubject;
  });

  const isTeacher = currentUser?.role === 'teacher' || isAdmin;

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-6 px-4 space-y-5">
      {/* Top Sub-navigation: Phòng Luyện Đề vs Bảng Vàng Danh Dự vs Thư viện Đề thi */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 w-full flex-wrap sm:inline-flex">
        <button
          onClick={() => setSubTab('practice')}
          className={`flex-1 sm:flex-none py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            subTab === 'practice'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>📝 Luyện Đề Thi Vào 10</span>
        </button>
        <button
          onClick={() => setSubTab('exam_library')}
          className={`flex-1 sm:flex-none py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            subTab === 'exam_library'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
              : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>📚 Thư viện Đề thi (6A1 - 9D6)</span>
        </button>
        <button
          onClick={() => setSubTab('honor_roll')}
          className={`flex-1 sm:flex-none py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            subTab === 'honor_roll'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-sm'
              : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>🏆 Bảng Vàng Danh Dự</span>
        </button>
      </div>

      {subTab === 'honor_roll' ? (
        <HonorRollLeaderboard
          isAdmin={isAdmin}
          currentUser={currentUser}
          userName={userName}
          isDark={isDark}
          onTakeExamClick={() => setSubTab('practice')}
        />
      ) : subTab === 'exam_library' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div
            className={`p-6 sm:p-7 rounded-3xl border shadow-xl relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-[#101726] via-[#0d1322] to-[#151e33] border-emerald-500/30 text-white'
                : 'bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border-emerald-300 text-slate-900 shadow-slate-200/50'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Thư Viện Đề Thi & Khảo Sát Chính Thức (6A1 - 9D6)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Kho Đề Thi Thử Các Lớp Chuẩn THCS
                </h2>
                <p className="text-xs text-slate-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
                  Tổng hợp các bộ đề thi thử được biên soạn và tải lên bởi Thầy Cô giáo chủ nhiệm 24 lớp. Theo dõi trực tiếp số học sinh đã hoàn thành và điểm số trung bình của từng đề.
                </p>
              </div>

              {/* Upload Button for Teachers & Admins */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>➕ Tải Lên / Tạo Đề Thi Mới</span>
                </button>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Class Filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-500 dark:text-zinc-400">Lớp:</span>
                  <select
                    value={libraryClassFilter}
                    onChange={(e) => setLibraryClassFilter(e.target.value)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border outline-none cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-white'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="all">Tất cả 24 lớp (6A1 - 9D6)</option>
                    <optgroup label="Khối 6">
                      {ALL_CLASSES_LIST.filter((c) => c.startsWith('6')).map((c) => (
                        <option key={c} value={c}>
                          Lớp {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Khối 7">
                      {ALL_CLASSES_LIST.filter((c) => c.startsWith('7')).map((c) => (
                        <option key={c} value={c}>
                          Lớp {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Khối 8">
                      {ALL_CLASSES_LIST.filter((c) => c.startsWith('8')).map((c) => (
                        <option key={c} value={c}>
                          Lớp {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Khối 9">
                      {ALL_CLASSES_LIST.filter((c) => c.startsWith('9')).map((c) => (
                        <option key={c} value={c}>
                          Lớp {c}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Subject Filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-500 dark:text-zinc-400">Môn:</span>
                  <select
                    value={librarySubjectFilter}
                    onChange={(e) => setLibrarySubjectFilter(e.target.value)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border outline-none cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-white'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="all">Tất cả môn học</option>
                    <option value="Toán">Toán Học</option>
                    <option value="Ngữ Văn">Ngữ Văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Khoa Học">Khoa Học Tự Nhiên</option>
                    <option value="Lịch Sử">Lịch Sử & Địa Lí</option>
                    <option value="Tin Học">Tin Học</option>
                    <option value="GDCD">GDCD</option>
                  </select>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-zinc-400 font-bold">
                Tìm thấy <strong>{filteredLibraryExams.length}</strong> bộ đề thi phù hợp
              </div>
            </div>
          </div>

          {/* Grid of Mock Exams */}
          {filteredLibraryExams.length === 0 ? (
            <div
              className={`p-10 text-center rounded-3xl border ${
                isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-black text-slate-800 dark:text-zinc-200">
                Chưa có bộ đề thi nào cho bộ lọc này
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Thầy cô có thể ấn nút "➕ Tải Lên / Tạo Đề Thi Mới" ở trên để đưa đề vào thư viện lớp.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLibraryExams.map((exam) => {
                const percentDone = Math.round(
                  (exam.completedStudentCount / exam.totalStudents) * 100
                );

                return (
                  <div
                    key={exam.id}
                    className={`p-5 rounded-3xl border transition-all hover:shadow-xl relative flex flex-col justify-between ${
                      isDark
                        ? 'bg-[#121827] border-white/10 hover:border-emerald-500/50'
                        : 'bg-white border-slate-200/90 hover:border-emerald-400 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black text-[11px] border border-emerald-500/30">
                            Lớp {exam.className}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-extrabold text-[11px]">
                            {exam.subject}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                            {exam.difficulty === 'hard' ? 'Nâng cao Điểm 10' : exam.difficulty === 'medium' ? 'Thông hiểu' : 'Cơ bản'}
                          </span>
                        </div>

                        {/* Delete for Teachers */}
                        {isTeacher && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMockExam(exam.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                            title="Xóa đề thi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Exam Title */}
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                        {exam.title}
                      </h3>

                      {/* Details row */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-600 dark:text-zinc-300 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          {exam.durationMinutes} phút
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          {exam.totalQuestions} câu hỏi
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                          {exam.creatorTeacherName}
                        </span>
                      </div>

                      {/* Student Completion Progress Bar */}
                      <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                            Tiến độ hoàn thành của học sinh:
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">
                            {exam.completedStudentCount}/{exam.totalStudents} em ({percentDone}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            style={{ width: `${percentDone}%` }}
                          />
                        </div>

                        {exam.avgClassScore > 0 && (
                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                            <span>Điểm thi trung bình:</span>
                            <span className="font-black text-amber-600 dark:text-amber-400">
                              ⭐ {exam.avgClassScore} / 10
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-400">{exam.createdAt}</span>
                      <button
                        type="button"
                        onClick={() => handleStartLibraryExam(exam)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>Bắt Đầu Làm Đề Thi Này</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal: Tải Lên / Tạo Đề Thi Thử Mới Cho Giáo Viên */}
          {showUploadModal && (
            <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div
                className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl relative ${
                  isDark ? 'bg-zinc-900 border-emerald-500/40 text-white' : 'bg-white border-emerald-300 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 mb-5 text-emerald-600 dark:text-emerald-400">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">Tải Lên / Tổ Chức Bộ Đề Thi Thử</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Dành cho Giáo viên & Quản trị viên</p>
                  </div>
                </div>

                <form onSubmit={handleUploadExam} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-zinc-300">
                      Tên bộ đề thi thử:
                    </label>
                    <input
                      type="text"
                      required
                      value={newExamTitle}
                      onChange={(e) => setNewExamTitle(e.target.value)}
                      placeholder="VD: Đề Khảo Sát Giữa Kỳ II - Toán 9 (Có câu phân loại Điểm 10)"
                      className={`w-full px-3.5 py-2 rounded-xl border outline-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-zinc-300">
                        Chọn Lớp (6A1 - 9D6):
                      </label>
                      <select
                        value={newExamClass}
                        onChange={(e) => setNewExamClass(e.target.value as ClassCode)}
                        className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        {ALL_CLASSES_LIST.map((c) => (
                          <option key={c} value={c}>
                            Lớp {c} (GVCN: {HOMEROOM_TEACHERS[c].name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-zinc-300">
                        Môn học:
                      </label>
                      <select
                        value={newExamSubject}
                        onChange={(e) => setNewExamSubject(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value="Toán Học">Toán Học</option>
                        <option value="Ngữ Văn">Ngữ Văn</option>
                        <option value="Tiếng Anh">Tiếng Anh</option>
                        <option value="Khoa Học Tự Nhiên">Khoa Học Tự Nhiên</option>
                        <option value="Lịch Sử & Địa Lí">Lịch Sử & Địa Lí</option>
                        <option value="Tin Học">Tin Học</option>
                        <option value="GDCD">GDCD</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-zinc-300">
                        Thời gian làm bài:
                      </label>
                      <select
                        value={newExamDuration}
                        onChange={(e) => setNewExamDuration(Number(e.target.value))}
                        className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value={15}>15 phút</option>
                        <option value={45}>45 phút (1 tiết)</option>
                        <option value={60}>60 phút</option>
                        <option value={90}>90 phút (Thi học kỳ)</option>
                        <option value={120}>120 phút (Thi vào 10)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-zinc-300">
                        Số câu hỏi:
                      </label>
                      <select
                        value={newExamQuestionsCount}
                        onChange={(e) => setNewExamQuestionsCount(Number(e.target.value))}
                        className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value={10}>10 câu</option>
                        <option value={15}>15 câu</option>
                        <option value={20}>20 câu</option>
                        <option value={25}>25 câu</option>
                        <option value={40}>40 câu trắc nghiệm</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-zinc-300">
                      Hướng dẫn & dặn dò học sinh:
                    </label>
                    <textarea
                      rows={2}
                      value={newExamInstructions}
                      onChange={(e) => setNewExamInstructions(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border outline-none ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Lưu & Xuất Bản Lên Thư Viện</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* View 1: Configuration & Exam Creator */}
          {!examData && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Phòng Luyện Đề Săn Điểm 10
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">
                    Tạo đề thi bám sát cấu trúc Bộ GD&ĐT cho {currentSubject.name} - {currentGrade} với các câu hỏi phân hóa điểm 10.
                  </p>
                </div>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Exam Type Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Loại bài kiểm tra
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: '15_phut', title: '15 Phút', desc: 'Kiểm tra miệng & 15p' },
                  { id: 'giua_ky', title: 'Giữa Kỳ', desc: 'Kiểm tra 1 tiết (45p)' },
                  { id: 'cuoi_ky', title: 'Học Kỳ', desc: 'Thi học kỳ I / II' },
                  { id: 'hsg_chuyen', title: 'HSG & Vào 10', desc: 'Câu phân loại điểm 10' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setExamType(type.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      examType === type.id
                        ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900 font-bold ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                    }`}
                  >
                    <div className="text-sm font-bold">{type.title}</div>
                    <div className="text-xs text-slate-500">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic / Chapter Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Chủ đề / Chuyên đề ôn tập
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {availableTopics.map((topic, i) => (
                  <option key={i} value={topic}>
                    {topic}
                  </option>
                ))}
                <option value="Tổng hợp toàn bộ kiến thức kỳ này">
                  ✨ Đề thi tổng hợp toàn diện (Chuẩn đề thi thật)
                </option>
              </select>

              {/* Number of questions */}
              <div className="mt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Số lượng câu hỏi
                </label>
                <div className="flex gap-3">
                  {[3, 5, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumQuestions(num)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        numQuestions === num
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {num} câu
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6 flex items-start gap-3 text-xs text-amber-800">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Tiêu chí Đề Săn Điểm 10:</strong> Đề thi bao gồm các câu hỏi từ căn bản đến nâng cao, đặc biệt có câu hỏi vận dụng cao để rèn phản xạ tư duy và mục "Bí kíp tránh bẫy" giải thích chi tiết sau khi nộp bài.
            </div>
          </div>

          <button
            onClick={handleGenerateExam}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>AI đang biên soạn đề thi chuẩn điểm 10...</span>
              </>
            ) : (
              <>
                <span>Bắt đầu làm bài thi</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* View 2: Active Exam Taking or Review */}
      {examData && (
        <div className="space-y-6">
          {/* Top Bar: Exam Title, Timer, Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-[135px] z-30">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {currentSubject.name} - {currentGrade}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {examData.questions.length} câu hỏi
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {examData.title}
              </h3>
            </div>

            <div className="flex items-center gap-4">
              {/* Countdown Timer */}
              <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-sm font-bold ${
                isSubmitted
                  ? 'bg-slate-100 border-slate-200 text-slate-500'
                  : timeRemaining < 120
                  ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{isSubmitted ? 'Đã hoàn thành' : formatTime(timeRemaining)}</span>
              </div>

              {!isSubmitted ? (
                <button
                  onClick={handleSubmitExam}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
                >
                  Nộp bài chấm điểm
                </button>
              ) : (
                <button
                  onClick={() => setExamData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
                >
                  Luyện đề mới
                </button>
              )}
            </div>
          </div>

          {/* Score Result Card (when submitted) */}
          {isSubmitted && (
            <div className="space-y-4">
              <div className={`p-6 rounded-2xl border text-center shadow-xs transition-all ${
                score >= 9
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 text-emerald-950'
                  : score >= 7
                  ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 text-indigo-950'
                  : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-amber-950'
              }`}>
                <div className="inline-flex p-3 rounded-full bg-white shadow-xs mb-3">
                  <Award className="w-8 h-8 text-amber-500" />
                </div>
                <h4 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Kết quả: {score} / 10 Điểm
                </h4>
                <p className="text-sm font-medium mt-1">
                  Đúng {correctCount} / {total} câu
                  {score === 10 && ' — 🌟 TUYỆT VỜI! Em đã đạt Điểm 10 tuyệt đối!'}
                  {score >= 8 && score < 10 && ' — Rất xuất sắc! Hãy xem các bẫy câu sai dưới đây để lấy trọn vẹn điểm 10.'}
                  {score < 8 && ' — Cần củng cố thêm phần lý thuyết và đọc kỹ bẫy đề thi bên dưới!'}
                </p>
              </div>

              {/* Bảng Vàng Danh Dự submission banner for high scorers (>= 8.0) */}
              {score >= 8 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-300 flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                      🏆
                    </div>
                    <div>
                      <h5 className="font-black text-slate-950 text-sm sm:text-base flex items-center gap-1.5">
                        <span>Chúc mừng {currentUser?.name || userName}! Đạt {score}/10 Điểm</span>
                        <Sparkles className="w-4 h-4 text-slate-950" />
                      </h5>
                      <p className="text-xs text-slate-900/90 font-medium">
                        Điểm số này đủ điều kiện ghi danh lên <strong>Bảng Vàng Danh Dự Toàn Quốc</strong>!
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={submittedToHonorRoll || honorRollSubmitting}
                    onClick={handleSubmitToHonorRoll}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>
                      {submittedToHonorRoll
                        ? '✓ Đã ghi danh Bảng Vàng!'
                        : honorRollSubmitting
                        ? 'Đang gửi...'
                        : 'Lưu danh vào Bảng Vàng →'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Question Navigator Dots */}
          <div className="flex items-center gap-2 overflow-x-auto p-2 bg-white rounded-xl border border-slate-200">
            {examData.questions.map((q, idx) => {
              const hasAnswer = !!userAnswers[q.id];
              const isCorrect = isSubmitted && (userAnswers[q.id] || '').trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIdx(idx)}
                  className={`w-9 h-9 rounded-lg font-bold text-xs shrink-0 transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                      : activeQuestionIdx === idx
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                      : hasAnswer
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question Display */}
          {examData.questions[activeQuestionIdx] && (() => {
            const q = examData.questions[activeQuestionIdx];
            const currentSelected = userAnswers[q.id] || '';
            const isCorrect = isSubmitted && currentSelected.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();

            return (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                      Câu {activeQuestionIdx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Mức độ: {q.difficulty}
                    </span>
                  </div>

                  {isSubmitted && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                      isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {isCorrect ? 'Đúng (+ điểm)' : 'Chưa đúng'}
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                  <Markdown>{q.questionText}</Markdown>
                </div>

                {/* Multiple Choice Options or Essay Input */}
                {q.options && q.options.length > 0 ? (
                  <div className="space-y-2.5">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx); // 'A', 'B', 'C', 'D'
                      const isOptionSelected = currentSelected === letter || currentSelected === opt;
                      const isThisCorrect = isSubmitted && (letter === q.correctAnswer || opt === q.correctAnswer);

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleSelectAnswer(q.id, letter)}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                            isSubmitted
                              ? isThisCorrect
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                                : isOptionSelected
                                ? 'bg-rose-50 border-rose-400 text-rose-950 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                              : isOptionSelected
                              ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600 font-semibold'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <span className={`h-6 w-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                            isSubmitted
                              ? isThisCorrect
                                ? 'bg-emerald-600 text-white'
                                : isOptionSelected
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                              : isOptionSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {letter}
                          </span>
                          <span className="text-sm sm:text-base leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Câu trả lời của em:
                    </label>
                    <textarea
                      value={currentSelected}
                      disabled={isSubmitted}
                      onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                      placeholder="Gõ đáp án hoặc các bước giải tóm tắt..."
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                    />
                  </div>
                )}

                {/* Explanation & Score 10 Secret (Visible after submit) */}
                {isSubmitted && (
                  <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Đáp án chuẩn: <span className="text-indigo-600 font-extrabold text-sm">{q.correctAnswer}</span>
                      </h5>
                      <div className="text-sm text-slate-700 leading-relaxed">
                        <strong className="block font-bold text-slate-900 mb-1">Lời giải chi tiết từng bước:</strong>
                        <div className="markdown-body">
                          <Markdown>{q.stepByStepSolution}</Markdown>
                        </div>
                      </div>
                    </div>

                    {/* The Score 10 Secret / Trap Note */}
                    <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 mb-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Bí Kíp Điểm 10 & Cảnh Báo Bẫy Đề Thi:</span>
                      </div>
                      <p className="text-sm leading-relaxed text-amber-900">
                        {q.score10Secret}
                      </p>
                    </div>
                  </div>
                )}

                {/* Prev / Next navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    disabled={activeQuestionIdx === 0}
                    onClick={() => setActiveQuestionIdx((prev) => prev - 1)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    ← Câu trước
                  </button>
                  <span className="text-xs text-slate-500">
                    {activeQuestionIdx + 1} / {examData.questions.length}
                  </span>
                  <button
                    disabled={activeQuestionIdx === examData.questions.length - 1}
                    onClick={() => setActiveQuestionIdx((prev) => prev + 1)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    Câu tiếp theo →
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
        </>
      )}
    </div>
  );
};
