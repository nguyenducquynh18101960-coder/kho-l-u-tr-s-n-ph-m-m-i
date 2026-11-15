import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Sparkles,
  Search,
  Heart,
  MessageSquare,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  UserX,
  Phone,
  Mail,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Filter,
} from 'lucide-react';
import { StudentAchievementStats } from '../../types/achievements';
import { celebrationEngine } from '../../utils/confettiFireworks';
import { soundEffects } from '../../utils/soundEffects';
import {
  ALL_CLASSES_LIST,
  ClassCode,
  ClassStudent,
  HomeworkStatus,
  getActiveClassCodes,
  getClassHomeroomTeacher,
  loadClassStudents,
  kickStudentFromClass,
  isAiOrFakeStudent,
  loadCollectiveBadges,
  loadClassSeatingPlan,
} from '../../data/classSystemData';
import { STORAGE_KEY_AUTH_USER, UserAccount } from '../../types/auth';

export interface ClassmateRanking {
  id: string;
  name: string;
  avatar: string;
  gender: 'male' | 'female' | 'other';
  className: string;
  score: number; // Điểm số thi đua thực tế
  questionsSolved: number; // Số câu hỏi / bài tập đã giải quyết
  streakDays: number; // Chuỗi ngày học
  badgesCount: number; // Số huy hiệu
  isCurrentUser?: boolean;
  cheerCount: number;
  status: 'online' | 'offline' | 'studying';
  title: string;
  dob: string;
  homeworkStatus: HomeworkStatus;
  examPracticeCount: number;
  avgScore: number;
}

interface ClassroomLeaderboardProps {
  currentStats: StudentAchievementStats;
  userName: string;
  userAvatar?: string;
  isDark: boolean;
  onNavigateToTab?: (tab: 'chat' | 'exam' | 'mindmap' | 'grade' | 'tips' | 'group' | 'schedule' | 'class_management') => void;
  onOpenDirectChat?: (recipientName: string) => void;
}

export const ClassroomLeaderboard: React.FC<ClassroomLeaderboardProps> = ({
  currentStats,
  userName = 'Bạn học',
  userAvatar,
  isDark,
  onNavigateToTab,
  onOpenDirectChat,
}) => {
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    const refresh = () => setReloadKey((prev) => prev + 1);
    window.addEventListener('max10_classes_updated', refresh);
    window.addEventListener('max10_class_students_updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('max10_classes_updated', refresh);
      window.removeEventListener('max10_class_students_updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const currentUser: UserAccount | null = useMemo(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [reloadKey]);

  // Chỉ hiển thị các lớp thực tế đã có Giáo viên thật đăng ký!
  const activeClasses = useMemo(() => getActiveClassCodes(), [reloadKey]);
  const [selectedClass, setSelectedClass] = useState<ClassCode>('9D1');

  useEffect(() => {
    if (activeClasses.length > 0 && !activeClasses.includes(selectedClass)) {
      if (currentUser?.studentClass && activeClasses.includes(currentUser.studentClass as ClassCode)) {
        setSelectedClass(currentUser.studentClass as ClassCode);
      } else {
        setSelectedClass(activeClasses[0]);
      }
    }
  }, [activeClasses, selectedClass, currentUser]);

  const [sortBy, setSortBy] = useState<'score' | 'questions' | 'streak'>('score');
  const [filterHomework, setFilterHomework] = useState<'all' | 'submitted' | 'unsubmitted' | 'practicing'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cheeredIds, setCheeredIds] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [studentToKick, setStudentToKick] = useState<ClassStudent | null>(null);

  // Load 100% học sinh thật trong lớp đang chọn (loại bỏ tuyệt đối AI & học sinh giả)
  const classStudents = useMemo(() => {
    if (activeClasses.length === 0) return [];
    return loadClassStudents(selectedClass).filter((s) => !isAiOrFakeStudent(s) && s.isVerifiedHuman);
  }, [selectedClass, reloadKey, activeClasses]);

  const teacher = useMemo(() => {
    if (activeClasses.length === 0) return null;
    return getClassHomeroomTeacher(selectedClass);
  }, [selectedClass, reloadKey, activeClasses]);

  const collectiveBadges = useMemo(() => {
    if (activeClasses.length === 0) return [];
    return loadCollectiveBadges(selectedClass);
  }, [selectedClass, reloadKey, activeClasses]);

  const submittedCount = useMemo(() => classStudents.filter((s) => s.homeworkStatus === 'submitted').length, [classStudents]);
  const notSubmittedCount = useMemo(() => classStudents.filter((s) => s.homeworkStatus === 'unsubmitted').length, [classStudents]);
  const practicingCount = useMemo(() => classStudents.filter((s) => s.homeworkStatus === 'practicing').length, [classStudents]);

  // Chuyển đổi danh sách học sinh thật sang bảng xếp hạng (loại trừ hoàn toàn AI)
  const classmatesList: ClassmateRanking[] = useMemo(() => {
    const list: ClassmateRanking[] = classStudents.map((s) => {
      const isMe = Boolean(currentUser && (s.id === currentUser.id || (currentUser.role === 'student' && s.name === currentUser.name)));
      const badgesCount = (s.badges?.length || 0) + (isMe ? currentStats.badges.filter((b) => b.isUnlocked).length : 0);
      const xpScore = Math.max(s.xpScore || 0, isMe ? currentStats.totalXp : 0);
      return {
        id: s.id,
        name: isMe ? `${s.name} (Bạn)` : s.name,
        avatar: s.avatar,
        gender: s.gender,
        className: `Lớp ${selectedClass}`,
        score: xpScore + badgesCount * 50,
        questionsSolved: s.homeworkDoneCount * 10 + s.examPracticeCount * 15,
        streakDays: isMe ? Math.max(s.streakDays || 0, currentStats.streak.currentStreak) : (s.streakDays || 0),
        badgesCount,
        isCurrentUser: isMe,
        cheerCount: 0,
        status: s.status || 'online',
        title: s.avgScore >= 9.0 ? 'Thủ Khoa Săn Điểm 10' : s.avgScore >= 8.0 ? 'Chiến Binh Bứt Phá' : 'Học Sinh Đã Xác Thực',
        dob: s.dob,
        homeworkStatus: s.homeworkStatus,
        examPracticeCount: s.examPracticeCount,
        avgScore: s.avgScore,
      };
    });

    // Nếu người dùng hiện tại là học sinh thuộc lớp này nhưng chưa có trong roster
    if (
      currentUser?.role === 'student' &&
      currentUser.studentClass === selectedClass &&
      !list.some((item) => item.isCurrentUser) &&
      !isAiOrFakeStudent({ id: currentUser.id, name: currentUser.name })
    ) {
      const myBadges = currentStats.badges.filter((b) => b.isUnlocked).length;
      list.push({
        id: currentUser.id,
        name: `${currentUser.name || userName} (Bạn)`,
        avatar: currentUser.avatar || userAvatar || '',
        gender: currentUser.gender || 'other',
        className: `Lớp ${selectedClass}`,
        score: currentStats.totalXp + myBadges * 50,
        questionsSolved: currentStats.completedAssignments ? currentStats.completedAssignments * 10 : Math.round(currentStats.totalXp / 20),
        streakDays: currentStats.streak.currentStreak || 0,
        badgesCount: myBadges,
        isCurrentUser: true,
        cheerCount: 0,
        status: 'online',
        title: currentStats.levelTitle || 'Học Sinh Đã Xác Thực',
        dob: currentUser.dob || '2012-09-05',
        homeworkStatus: 'practicing',
        examPracticeCount: currentStats.completedExams || 0,
        avgScore: 0,
      });
    }

    let filtered = list;
    if (filterHomework !== 'all') {
      filtered = filtered.filter((c) => c.homeworkStatus === filterHomework);
    }

    if (sortBy === 'score') {
      filtered.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'questions') {
      filtered.sort((a, b) => b.questionsSolved - a.questionsSolved);
    } else if (sortBy === 'streak') {
      filtered.sort((a, b) => b.streakDays - a.streakDays);
    }

    return filtered;
  }, [classStudents, currentUser, currentStats, userName, userAvatar, filterHomework, sortBy, selectedClass]);

  const userRankIndex = classmatesList.findIndex((c) => c.isCurrentUser);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : 0;
  const personAbove = userRankIndex > 0 ? classmatesList[userRankIndex - 1] : null;
  const currentUserEntry = userRankIndex >= 0 ? classmatesList[userRankIndex] : null;

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return classmatesList;
    const q = searchQuery.toLowerCase().trim();
    return classmatesList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.dob.includes(q)
    );
  }, [classmatesList, searchQuery]);

  const handleCheer = (classmate: ClassmateRanking, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playCheckInReward();
    celebrationEngine.launchConfetti(30);
    setCheeredIds((prev) => ({
      ...prev,
      [classmate.id]: (prev[classmate.id] || 0) + 1,
    }));
    setToastMessage(`❤️ Bạn đã gửi lời cổ vũ đến bạn ${classmate.name}! Hãy cùng nhau săn điểm 10!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmKick = () => {
    if (!studentToKick) return;
    kickStudentFromClass(selectedClass, studentToKick.id);
    soundEffects.playCheckInReward();
    setToastMessage(`🚫 Đã kích học sinh "${studentToKick.name}" khỏi ${selectedClass} vì không thuộc danh sách lớp.`);
    setStudentToKick(null);
    setReloadKey((prev) => prev + 1);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const top3 = classmatesList.slice(0, 3);

  // Nếu chưa có Thầy/Cô nào đăng ký tạo lớp thực tế
  if (activeClasses.length === 0) {
    return (
      <div
        className={`p-8 sm:p-10 rounded-3xl border text-center space-y-4 ${
          isDark
            ? 'bg-[#101624] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h3 className="text-lg sm:text-xl font-black">
          Chưa Có Lớp Học Nào Được Kích Hoạt
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
          Hệ thống Max10 AI đã xóa bỏ toàn bộ giáo viên giả và học sinh giả. Lớp học (6A1 - 9D6) chỉ được khởi tạo khi có <strong>Thầy/Cô giáo thật</strong> đăng ký tài khoản Giáo viên và chọn lớp phụ trách.
        </p>
        {onNavigateToTab && (
          <button
            type="button"
            onClick={() => onNavigateToTab('chat')}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
          >
            Quay lại Hỏi bài &amp; Gia sư AI
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[999999] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs shadow-2xl border border-white/20">
            <Sparkles className="w-4 h-4 fill-current text-white" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Hero Class Banner */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border relative overflow-hidden shadow-xl ${
          isDark
            ? 'bg-gradient-to-br from-[#131a29] via-[#0f1422] to-[#192238] border-amber-500/30 text-white'
            : 'bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-white border-amber-300 text-slate-900 shadow-slate-200/50'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Bảng Xếp Hạng Thời Gian Thực · Chỉ Học Sinh Thật (Loại Trừ AI)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 flex-wrap">
              <span>Bảng Vàng Thi Đua Lớp {selectedClass}</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-extrabold">
                {classStudents.length} học sinh đã xác thực
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
              Xếp hạng theo thời gian thực dựa trên tổng điểm XP và huy hiệu đạt được của học sinh thật (tuyệt đối không có AI hay bot ảo).
            </p>
            {collectiveBadges.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {collectiveBadges.map((cb) => (
                  <span
                    key={cb.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-black"
                  >
                    <span>{cb.icon}</span>
                    <span>{cb.title}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Active Registered Classes selector */}
          <div className="w-full lg:w-auto shrink-0 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/60 dark:border-white/10">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Chọn Lớp Đang Hoạt Động ({activeClasses.length}):
              </span>
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as ClassCode)}
              className={`w-full px-4 py-2 text-xs font-black rounded-xl border outline-none cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-white focus:border-amber-500'
                  : 'bg-white border-amber-300 text-slate-900 focus:border-amber-500'
              }`}
            >
              {activeClasses.map((c) => {
                const t = getClassHomeroomTeacher(c);
                return (
                  <option key={c} value={c}>
                    Lớp {c} {t ? `- GV: ${t.name} (${t.subject})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Real Homeroom Teacher Highlight Card */}
        {teacher && (
          <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-emerald-500/30 backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={teacher.avatar}
                    alt={teacher.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                      {teacher.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Giáo viên Đã Xác Thực
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold">
                      {teacher.subject}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 italic mt-0.5">
                    "{teacher.message}"
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-zinc-400 mt-1 flex-wrap">
                    {teacher.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-500" /> {teacher.phone}
                      </span>
                    )}
                    {teacher.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-blue-500" /> {teacher.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap">
                <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center flex-1 sm:flex-none">
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {submittedCount}/{classStudents.length}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold">Đã nộp bài</p>
                </div>

                <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center flex-1 sm:flex-none">
                  <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                    {notSubmittedCount}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold">Chưa nộp</p>
                </div>

                <div className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center flex-1 sm:flex-none">
                  <p className="text-xs font-black text-blue-600 dark:text-blue-400">
                    {practicingCount}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold">Đang ôn</p>
                </div>

                {onNavigateToTab && loadClassSeatingPlan(selectedClass) && (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.setItem(
                          'max10_target_chat_open',
                          JSON.stringify({
                            type: 'group',
                            targetId: `class-group-${selectedClass.toLowerCase()}`,
                            timestamp: Date.now(),
                          })
                        );
                      } catch {}
                      onNavigateToTab('group');
                    }}
                    className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    title="Nhắn tin trao đổi nhóm lớp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{loadClassSeatingPlan(selectedClass)?.customClassName || `Nhóm Lớp ${selectedClass}`}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Current User Competitive Position */}
        {currentUserEntry && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-md shrink-0">
                #{userRank}
              </div>
              <div>
                <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Vị trí của bạn: Hạng #{userRank} trên {classmatesList.length} bạn học lớp {selectedClass}</span>
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  {personAbove ? (
                    <>
                      🔥 Cần đạt thêm{' '}
                      <strong>
                        {Math.max(10, personAbove.score - currentUserEntry.score + 10)} XP
                      </strong>{' '}
                      nữa để vượt bạn <strong>{personAbove.name}</strong> lên Hạng #{userRank - 1}!
                    </>
                  ) : (
                    <>🥇 Chúc mừng bạn! Bạn đang dẫn đầu vị trí #1 lớp {selectedClass}!</>
                  )}
                </p>
              </div>
            </div>

            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('exam')}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Giải Thêm Bài Tập (+XP)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* TOP 3 PODIUM */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2">
        {/* RANK 2 */}
        {top3[1] && (
          <div
            className={`p-3 sm:p-5 rounded-3xl border text-center transition-all hover:scale-105 relative ${
              isDark ? 'bg-[#101624] border-slate-400/40' : 'bg-white border-slate-300 shadow-md'
            }`}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center mx-auto mb-2 shadow-xs">
              🥈 2
            </div>
            <div className="w-14 h-14 sm:w-18 sm:h-18 mx-auto rounded-2xl overflow-hidden p-0.5 bg-slate-300 shadow-md">
              <img
                src={top3[1].avatar}
                alt={top3[1].name}
                className="w-full h-full object-cover rounded-[14px]"
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm mt-2 truncate text-slate-900 dark:text-white">
              {top3[1].name}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">{top3[1].title}</p>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10 space-y-0.5">
              <p className="text-xs font-black text-blue-600 dark:text-blue-400">
                {top3[1].score.toLocaleString()} Điểm
              </p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                📝 {top3[1].questionsSolved} câu giải · {top3[1].examPracticeCount} đề
              </p>
            </div>
          </div>
        )}

        {/* RANK 1: VÀNG */}
        {top3[0] && (
          <div
            className={`p-4 sm:p-6 rounded-3xl border-2 text-center transition-all hover:scale-105 relative shadow-xl scale-105 ${
              isDark
                ? 'bg-gradient-to-b from-amber-500/20 via-[#131b2c] to-[#0f1422] border-amber-400 shadow-amber-500/20'
                : 'bg-gradient-to-b from-amber-100/80 via-white to-amber-50/50 border-amber-400 shadow-amber-300/40'
            }`}
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase shadow-md flex items-center gap-1">
              <span>👑 QUÁN QUÂN LỚP {selectedClass}</span>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-md">
              🥇 1
            </div>
            <div className="w-16 h-16 sm:w-22 sm:h-22 mx-auto rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-lg">
              <img
                src={top3[0].avatar}
                alt={top3[0].name}
                className="w-full h-full object-cover rounded-[14px]"
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="font-black text-sm sm:text-base mt-2 truncate text-slate-900 dark:text-white">
              {top3[0].name}
            </h4>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold truncate">
              {top3[0].title}
            </p>
            <div className="mt-2.5 pt-2.5 border-t border-amber-400/40 space-y-0.5">
              <p className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
                {top3[0].score.toLocaleString()} Điểm
              </p>
              <p className="text-[11px] font-extrabold text-slate-600 dark:text-zinc-300">
                📝 {top3[0].questionsSolved} câu hỏi · {top3[0].examPracticeCount} đề đã giải
              </p>
            </div>
          </div>
        )}

        {/* RANK 3 */}
        {top3[2] && (
          <div
            className={`p-3 sm:p-5 rounded-3xl border text-center transition-all hover:scale-105 relative ${
              isDark ? 'bg-[#101624] border-orange-500/40' : 'bg-white border-orange-300 shadow-md'
            }`}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-400 text-white font-black text-xs flex items-center justify-center mx-auto mb-2 shadow-xs">
              🥉 3
            </div>
            <div className="w-14 h-14 sm:w-18 sm:h-18 mx-auto rounded-2xl overflow-hidden p-0.5 bg-orange-400 shadow-md">
              <img
                src={top3[2].avatar}
                alt={top3[2].name}
                className="w-full h-full object-cover rounded-[14px]"
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm mt-2 truncate text-slate-900 dark:text-white">
              {top3[2].name}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">{top3[2].title}</p>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10 space-y-0.5">
              <p className="text-xs font-black text-orange-600 dark:text-orange-400">
                {top3[2].score.toLocaleString()} Điểm
              </p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                📝 {top3[2].questionsSolved} câu giải · {top3[2].examPracticeCount} đề
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FILTER & SORT CONTROLS BAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSortBy('score')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              sortBy === 'score'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            💯 Điểm Số Cao Nhất
          </button>
          <button
            type="button"
            onClick={() => setSortBy('questions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              sortBy === 'questions'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📝 Số Câu Giải Nhiều
          </button>
          <button
            type="button"
            onClick={() => setSortBy('streak')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              sortBy === 'streak'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🔥 Chuỗi Ngày Học
          </button>
        </div>

        {/* Homework Filter & Search Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterHomework}
              onChange={(e) => setFilterHomework(e.target.value as any)}
              className={`px-3 py-1.5 text-xs rounded-xl border outline-none cursor-pointer ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="all">Tất cả bài tập</option>
              <option value="submitted">✓ Đã nộp bài ({submittedCount})</option>
              <option value="unsubmitted">⚠️ Chưa nộp bài ({notSubmittedCount})</option>
              <option value="practicing">⏳ Đang ôn luyện ({practicingCount})</option>
            </select>
          </div>

          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bạn học, ngày sinh..."
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500'
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-amber-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* FULL CLASSMATES LEADERBOARD LIST WITH KICK & HOMEWORK STATUS */}
      <div
        className={`rounded-3xl border overflow-hidden ${
          isDark ? 'bg-[#0f1420] border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-sm font-black text-slate-700 dark:text-zinc-200">
                Chưa có học sinh thật nào trong danh sách lớp {selectedClass}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Học sinh khi đăng ký tài khoản chọn Lớp {selectedClass} hoặc được Giáo viên thêm vào lớp sẽ xuất hiện tại đây theo thời gian thực (không có bot hay AI).
              </p>
            </div>
          ) : (
            filteredList.map((classmate, index) => {
            const rank = index + 1;
            const isCurrentUser = classmate.isCurrentUser;
            const extraCheers = cheeredIds[classmate.id] || 0;
            const totalCheers = classmate.cheerCount + extraCheers;

            return (
              <div
                key={classmate.id}
                className={`p-3.5 sm:p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrentUser
                    ? isDark
                      ? 'bg-amber-500/15 border-l-4 border-amber-500'
                      : 'bg-amber-50/80 border-l-4 border-amber-500'
                    : isDark
                    ? 'hover:bg-zinc-800/40'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Left: Rank & Avatar & Details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {/* Rank Badge */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                    {rank === 1 ? (
                      <span className="text-lg">🥇</span>
                    ) : rank === 2 ? (
                      <span className="text-lg">🥈</span>
                    ) : rank === 3 ? (
                      <span className="text-lg">🥉</span>
                    ) : (
                      <span className="text-slate-500 dark:text-zinc-400 font-black">#{rank}</span>
                    )}
                  </div>

                  {/* Avatar with Status indicator */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-amber-400 to-emerald-500">
                      {classmate.avatar ? (
                        <img
                          src={classmate.avatar}
                          alt={classmate.name}
                          className="w-full h-full object-cover rounded-[14px]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full rounded-[14px] bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                          {classmate.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Status Dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                        classmate.status === 'studying'
                          ? 'bg-amber-500 animate-pulse'
                          : classmate.status === 'online'
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                      }`}
                      title={classmate.status === 'studying' ? 'Đang giải bài' : classmate.status === 'online' ? 'Đang online' : 'Ngoại tuyến'}
                    />
                  </div>

                  {/* Name, DOB & Academic Title */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`font-black text-xs sm:text-sm truncate ${
                          isCurrentUser
                            ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {classmate.name}
                      </h4>
                      {isCurrentUser && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 font-black uppercase shrink-0">
                          Bạn
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-300 font-semibold">
                        🎂 {classmate.dob}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      <span>{classmate.title}</span>
                      <span>·</span>
                      <span>{classmate.className}</span>
                      <span>·</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        ĐTB: {classmate.avgScore}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle & Right: Status, Metrics & Actions */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-white/5">
                  {/* Homework Status Tag */}
                  <div>
                    {classmate.homeworkStatus === 'submitted' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-black">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Đã nộp bài
                      </span>
                    ) : classmate.homeworkStatus === 'practicing' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[11px] font-black">
                        <BookOpen className="w-3 h-3 text-blue-500" />
                        Đang ôn luyện
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-black">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        Chưa nộp bài
                      </span>
                    )}
                  </div>

                  {/* Solved Questions */}
                  <div className="text-right min-w-[55px] hidden sm:block">
                    <p className="text-xs font-black text-slate-800 dark:text-zinc-200">
                      {classmate.questionsSolved} câu
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">{classmate.examPracticeCount} đề thi</p>
                  </div>

                  {/* Streak */}
                  <div className="hidden md:flex items-center gap-1 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{classmate.streakDays} ngày</span>
                  </div>

                  {/* Score */}
                  <div className="min-w-[65px] text-right">
                    <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {classmate.score.toLocaleString()} XP
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">Điểm thi đua</p>
                  </div>

                  {/* Cheer Button */}
                  <button
                    type="button"
                    onClick={(e) => handleCheer(classmate, e)}
                    className="p-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-90"
                    title={`Thả tim cổ vũ ${classmate.name}`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current text-rose-500" />
                    <span className="text-[10px] font-black">{totalCheers}</span>
                  </button>

                  {/* User Requirement: "khi vào lớp mà giáo viên/học sinh thấy không phải học sinh lớp mình thì có thể kích luôn" */}
                  {!isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => {
                        const raw = classStudents.find((s) => s.id === classmate.id);
                        if (raw) setStudentToKick(raw);
                      }}
                      className="p-1.5 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shrink-0"
                      title={`Kích học sinh ${classmate.name} khỏi lớp ${selectedClass} nếu không phải người trong lớp`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>

      {/* MODAL: XÁC NHẬN KÍCH HỌC SINH KHỎI LỚP */}
      {studentToKick && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl relative ${
              isDark ? 'bg-zinc-900 border-rose-500/40 text-white' : 'bg-white border-rose-300 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Xác nhận kích khỏi lớp {selectedClass}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Kiểm tra danh sách học sinh</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
              Bạn có chắc chắn học sinh <strong>"{studentToKick.name}"</strong> (Mã: {studentToKick.studentCode}, Ngày sinh: {studentToKick.dob}) không thuộc sĩ số lớp <strong>{selectedClass}</strong> không?
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 font-medium">
              ⚠️ Thao tác này sẽ gỡ bỏ bạn học này khỏi bảng xếp hạng lớp và danh sách phòng học lớp {selectedClass} ngay lập tức.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setStudentToKick(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmKick}
                className="px-4 py-2 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserX className="w-4 h-4" />
                <span>Kích khỏi lớp ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
