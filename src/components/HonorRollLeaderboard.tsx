import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Crown,
  Medal,
  Star,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  School,
  BookOpen,
  ArrowRight,
  Flame,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { HonorRollEntry } from '../types';
import { UserAccount, ADMIN_NAME, ADMIN_EMAIL, ADMIN_DEFAULT_PIN } from '../types/auth';

interface HonorRollLeaderboardProps {
  isAdmin?: boolean;
  currentUser?: UserAccount | null;
  userName?: string;
  isDark?: boolean;
  onTakeExamClick?: () => void;
}

export const HonorRollLeaderboard: React.FC<HonorRollLeaderboardProps> = ({
  isAdmin = false,
  currentUser,
  userName = 'Bạn học',
  isDark = false,
  onTakeExamClick,
}) => {
  const [list, setList] = useState<HonorRollEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<HonorRollEntry | null>(null);

  // Form states for Admin Add/Edit
  const [formName, setFormName] = useState<string>('');
  const [formSchool, setFormSchool] = useState<string>('THCS');
  const [formGrade, setFormGrade] = useState<string>('Lớp 9');
  const [formSubject, setFormSubject] = useState<string>('Toán học');
  const [formScore, setFormScore] = useState<number>(10.0);
  const [formTotal, setFormTotal] = useState<number>(15);
  const [formCorrect, setFormCorrect] = useState<number>(15);
  const [formExamType, setFormExamType] = useState<string>('Khảo sát vào 10');
  const [formBadge, setFormBadge] = useState<'gold' | 'silver' | 'bronze' | 'top'>('gold');
  const [formNote, setFormNote] = useState<string>('Thủ Khoa Điểm 10 Tuyệt Đối');
  const [formPin, setFormPin] = useState<string>('');

  const fetchHonorRoll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exam/honor-roll');
      const data = await res.json();
      if (data.success && Array.isArray(data.list)) {
        setList(data.list);
      }
    } catch (e) {
      console.error('Lỗi tải bảng vàng:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHonorRoll();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Admin Add / Edit submission
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Vui lòng nhập tên học sinh');
      return;
    }

    try {
      const payload: any = {
        action: editingEntry ? 'edit' : 'add',
        entry: {
          id: editingEntry ? editingEntry.id : undefined,
          studentName: formName.trim(),
          school: formSchool.trim(),
          grade: formGrade,
          subject: formSubject,
          score: Number(formScore),
          totalQuestions: Number(formTotal),
          correctCount: Number(formCorrect),
          examType: formExamType,
          badge: formBadge,
          note: formNote.trim(),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formName.trim())}`,
          date: new Date().toLocaleDateString('vi-VN'),
        },
        adminSecret: 'mackhanhduy',
        pin: formPin || ADMIN_DEFAULT_PIN,
        userId: currentUser?.id || 'admin-mac-khanh-duy',
        userEmail: currentUser?.email || ADMIN_EMAIL,
        role: 'admin',
      };

      const res = await fetch('/api/exam/honor-roll/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingEntry ? 'Đã cập nhật học sinh thành công!' : 'Đã thêm học sinh vào Bảng Vàng!');
        setShowAddModal(false);
        setEditingEntry(null);
        resetForm();
        fetchHonorRoll();
      } else {
        showToast(data.error || 'Có lỗi xảy ra!');
      }
    } catch (err: any) {
      showToast('Lỗi gửi yêu cầu: ' + err.message);
    }
  };

  // Admin Delete
  const handleDeleteEntry = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa học sinh "${name}" khỏi Bảng Vàng Danh Dự?`)) return;

    try {
      const res = await fetch('/api/exam/honor-roll/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id,
          adminSecret: 'mackhanhduy',
          pin: ADMIN_DEFAULT_PIN,
          userId: currentUser?.id || 'admin-mac-khanh-duy',
          userEmail: currentUser?.email || ADMIN_EMAIL,
          role: 'admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa "${name}" khỏi Bảng Vàng!`);
        fetchHonorRoll();
      } else {
        showToast(data.error || 'Không thể xóa');
      }
    } catch (err: any) {
      showToast('Lỗi xóa: ' + err.message);
    }
  };

  // Admin Reset Bảng Vàng
  const handleResetHonorRoll = async () => {
    try {
      const res = await fetch('/api/exam/honor-roll/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminSecret: 'mackhanhduy',
          pin: ADMIN_DEFAULT_PIN,
          userId: currentUser?.id || 'admin-mac-khanh-duy',
          userEmail: currentUser?.email || ADMIN_EMAIL,
          role: 'admin',
          mode: 'benchmark',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('🎉 Quản trị viên Mạc Khánh Duy đã đặt lại Bảng Vàng Danh Dự!');
        setShowResetConfirm(false);
        fetchHonorRoll();
      } else {
        showToast(data.error || 'Không thể reset');
      }
    } catch (err: any) {
      showToast('Lỗi reset: ' + err.message);
    }
  };

  const openEditModal = (entry: HonorRollEntry) => {
    setEditingEntry(entry);
    setFormName(entry.studentName);
    setFormSchool(entry.school || 'THCS');
    setFormGrade(entry.grade || 'Lớp 9');
    setFormSubject(entry.subject || 'Toán học');
    setFormScore(entry.score);
    setFormTotal(entry.totalQuestions || 15);
    setFormCorrect(entry.correctCount || 15);
    setFormExamType(entry.examType || 'Khảo sát vào 10');
    setFormBadge(entry.badge || 'gold');
    setFormNote(entry.note || '');
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormSchool('THCS');
    setFormGrade('Lớp 9');
    setFormSubject('Toán học');
    setFormScore(10.0);
    setFormTotal(15);
    setFormCorrect(15);
    setFormExamType('Khảo sát vào 10');
    setFormBadge('gold');
    setFormNote('Thủ Khoa Điểm 10 Tuyệt Đối');
    setEditingEntry(null);
  };

  // Filter list
  const filteredList = list.filter((item) => {
    const matchSubject =
      selectedSubject === 'all' ||
      item.subject.toLowerCase().includes(selectedSubject.toLowerCase());
    const matchQuery =
      !searchQuery.trim() ||
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.school && item.school.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSubject && matchQuery;
  });

  const top1 = filteredList[0];
  const top2 = filteredList[1];
  const top3 = filteredList[2];
  const restList = filteredList.slice(3);

  const getSubjectBadgeColor = (sub: string) => {
    const s = sub.toLowerCase();
    if (s.includes('toán')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    if (s.includes('văn')) return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
    if (s.includes('anh')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
    if (s.includes('khtn') || s.includes('lý') || s.includes('hóa')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20 animate-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner Bảng Vàng */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-6 sm:p-8 text-slate-950 shadow-xl border border-yellow-300/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/20 text-slate-950 text-xs font-extrabold uppercase tracking-wider backdrop-blur-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-950" />
              <span>Vinh Danh Thủ Khoa & Điểm 10 Tuyệt Đối</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              🏆 BẢNG VÀNG DANH DỰ MAX10 AI
            </h2>
            <p className="text-sm font-semibold text-slate-900/90 max-w-xl leading-relaxed">
              Tuyên dương các bạn học sinh xuất sắc đạt điểm cao nhất trong các bài kiểm tra trắc nghiệm vào 10 toàn quốc. Làm đề thi để ghi tên mình lên bảng vàng ngay hôm nay!
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-950 bg-white/60 px-3 py-1 rounded-xl shadow-2xs">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>Tổng số vinh danh: {list.length} học sinh</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-950 bg-emerald-100/90 px-3 py-1 rounded-xl shadow-2xs">
                <Star className="w-4 h-4 text-emerald-700 fill-emerald-600" />
                <span>Điểm 10 tuyệt đối: {list.filter((x) => x.score >= 10).length} bạn</span>
              </span>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
            {onTakeExamClick && (
              <button
                onClick={onTakeExamClick}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-950 text-amber-300 hover:bg-slate-900 font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <BookOpen className="w-4 h-4" />
                <span>📝 Làm đề để săn Điểm 10</span>
              </button>
            )}

            {/* Admin Management Buttons (Chỉ Quản trị viên Mạc Khánh Duy mới có) */}
            {isAdmin && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-3 rounded-2xl bg-white/90 hover:bg-white text-slate-900 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Thêm thủ khoa mới vào bảng vàng (Quyền Admin)"
                >
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>➕ Thêm vinh danh</span>
                </button>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                  title="Đặt lại / Reset Bảng Vàng Danh Dự (Chỉ Quản trị viên)"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Notice Bar */}
      {isAdmin ? (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              🛡️ <strong>Chế độ Quản trị viên ({ADMIN_NAME}):</strong> Bạn có toàn quyền cập nhật, thêm mới, sửa điểm và reset Bảng Vàng Danh Dự theo yêu cầu hệ thống.
            </span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100">
            Toàn quyền Quản Trị
          </span>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            🔒 Bảng Vàng Danh Dự được điều hành và chứng thực bởi <strong>Quản trị viên {ADMIN_NAME}</strong>. Khi hoàn thành bài kiểm tra trắc nghiệm với điểm số cao, điểm của bạn sẽ được tự động vinh danh tại đây!
          </span>
        </div>
      )}

      {/* Top 3 Podium (Bục Vinh Quang 1, 2, 3) */}
      {filteredList.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Top 2: Huy chương Bạc */}
          {top2 && (
            <div className="relative order-2 md:order-1 rounded-3xl p-5 border-2 border-slate-300 dark:border-zinc-700 bg-gradient-to-b from-slate-100 via-white to-slate-50 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-950 shadow-md flex flex-col items-center text-center space-y-3">
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-black flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-slate-500" />
                <span>#2 Á KHOA</span>
              </div>
              {isAdmin && (
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(top2)}
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(top2.id, top2.studentName)}
                    className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="relative mt-4">
                <img
                  src={top2.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top2.studentName}`}
                  alt={top2.studentName}
                  className="w-18 h-18 rounded-full border-4 border-slate-300 dark:border-zinc-600 object-cover shadow-md bg-white"
                />
                <span className="absolute -bottom-1 -right-1 text-2xl">🥈</span>
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {top2.studentName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                  <School className="w-3 h-3" />
                  <span>{top2.school} • {top2.grade}</span>
                </p>
              </div>
              <div className="w-full pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-lg font-bold text-[11px] ${getSubjectBadgeColor(top2.subject)}`}>
                  {top2.subject}
                </span>
                <span className="font-black text-lg text-slate-800 dark:text-zinc-100">
                  {top2.score.toFixed(1)} <span className="text-xs font-semibold text-slate-400">/ 10</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                "{top2.note || 'Á Khoa Xuất Sắc'}"
              </p>
            </div>
          )}

          {/* Top 1: THỦ KHOA - Huy chương Vàng (Chính giữa, cao hơn, nổi bật) */}
          {top1 && (
            <div className="relative order-1 md:order-2 rounded-3xl p-6 border-3 border-amber-400 dark:border-amber-500 bg-gradient-to-b from-amber-100/90 via-yellow-50 to-white dark:from-amber-950/60 dark:via-zinc-900 dark:to-zinc-950 shadow-xl flex flex-col items-center text-center space-y-3.5 md:-translate-y-2">
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black flex items-center gap-1 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-950" />
                <span>#1 THỦ KHOA TOÀN QUỐC</span>
              </div>
              {isAdmin && (
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(top1)}
                    className="p-1.5 rounded-lg bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 text-amber-950 dark:text-amber-100 cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(top1.id, top1.studentName)}
                    className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="relative mt-4">
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full blur-md opacity-70 animate-pulse" />
                <img
                  src={top1.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top1.studentName}`}
                  alt={top1.studentName}
                  className="relative w-22 h-22 rounded-full border-4 border-amber-400 object-cover shadow-lg bg-white"
                />
                <span className="absolute -bottom-1 -right-1 text-3xl animate-bounce">🥇</span>
              </div>
              <div>
                <h4 className="font-black text-lg text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                  <span>{top1.studentName}</span>
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                </h4>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                  <School className="w-3.5 h-3.5" />
                  <span>{top1.school} • {top1.grade}</span>
                </p>
              </div>
              <div className="w-full pt-2.5 border-t border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between text-xs">
                <span className={`px-2.5 py-1 rounded-xl font-black text-xs ${getSubjectBadgeColor(top1.subject)}`}>
                  {top1.subject}
                </span>
                <span className="font-black text-2xl text-amber-600 dark:text-amber-400">
                  {top1.score.toFixed(1)} <span className="text-xs font-bold text-slate-400">/ 10</span>
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-[11px] font-bold text-amber-950 dark:text-amber-200">
                ✨ {top1.note || 'Thủ Khoa Điểm 10 Tuyệt Đối'}
              </div>
            </div>
          )}

          {/* Top 3: Huy chương Đồng */}
          {top3 && (
            <div className="relative order-3 md:order-3 rounded-3xl p-5 border-2 border-amber-600/40 dark:border-amber-800/50 bg-gradient-to-b from-amber-50/60 via-white to-slate-50 dark:from-amber-950/30 dark:via-zinc-900 dark:to-zinc-950 shadow-md flex flex-col items-center text-center space-y-3">
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-black flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-amber-700" />
                <span>#3 TOP 3</span>
              </div>
              {isAdmin && (
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(top3)}
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(top3.id, top3.studentName)}
                    className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="relative mt-4">
                <img
                  src={top3.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3.studentName}`}
                  alt={top3.studentName}
                  className="w-18 h-18 rounded-full border-4 border-amber-600/50 object-cover shadow-md bg-white"
                />
                <span className="absolute -bottom-1 -right-1 text-2xl">🥉</span>
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {top3.studentName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                  <School className="w-3 h-3" />
                  <span>{top3.school} • {top3.grade}</span>
                </p>
              </div>
              <div className="w-full pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-lg font-bold text-[11px] ${getSubjectBadgeColor(top3.subject)}`}>
                  {top3.subject}
                </span>
                <span className="font-black text-lg text-amber-700 dark:text-amber-400">
                  {top3.score.toFixed(1)} <span className="text-xs font-semibold text-slate-400">/ 10</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                "{top3.note || 'Bảng Vàng Vinh Danh'}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Môn:</span>
          </span>
          {['all', 'Toán', 'Tiếng Anh', 'KHTN', 'Văn', 'Sử'].map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'
              }`}
            >
              {sub === 'all' ? 'Tất cả môn' : sub}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên học sinh, trường..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Full Leaderboard Table / Cards */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Danh Sách Học Sinh Vinh Danh ({filteredList.length})
            </h3>
          </div>
          <button
            onClick={fetchHonorRoll}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span>Đang tải bảng vàng danh dự...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-500 dark:text-zinc-400 text-sm space-y-3 max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Trophy className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-base text-slate-900 dark:text-white">
                Bảng Vàng Danh Dự Hiện Đang Trống
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Toàn bộ dữ liệu AI ảo đã được <strong>xóa sạch 100%</strong>. Bảng Vàng chỉ vinh danh học sinh thật! Hãy hoàn thành Mini Game hoặc Đề thi THCS để trở thành <strong>Thủ Khoa Top 1 Toàn Quốc</strong> đầu tiên và nhận ngay <strong>+100 XP vinh dự</strong>!
              </p>
            </div>
            {onTakeExamClick && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onTakeExamClick}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs shadow-md hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-amber-950" />
                  <span>Làm Bài Thi / Mini Game Lên Top 1 Ngay</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {filteredList.map((entry, idx) => {
              const rank = idx + 1;
              const isTopRank = rank <= 3;
              const medalIcon =
                rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

              return (
                <div
                  key={entry.id}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                    rank === 1
                      ? 'bg-amber-50/40 dark:bg-amber-950/10'
                      : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                        rank === 1
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : rank === 2
                          ? 'bg-slate-300 dark:bg-zinc-600 text-slate-900 dark:text-white'
                          : rank === 3
                          ? 'bg-amber-700/80 text-white'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {medalIcon}
                    </div>

                    {/* Avatar */}
                    <img
                      src={entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.studentName}`}
                      alt={entry.studentName}
                      className="w-11 h-11 rounded-full border-2 border-slate-200 dark:border-zinc-700 object-cover shrink-0 bg-white"
                    />

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {entry.studentName}
                        </span>
                        {entry.score >= 10 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            ⭐ Điểm 10
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{entry.school}</span>
                        <span>•</span>
                        <span>{entry.grade}</span>
                        <span>•</span>
                        <span className="text-[11px] text-slate-400">{entry.date}</span>
                      </div>
                      {entry.note && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 italic mt-0.5 truncate">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Score & Exam details */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${getSubjectBadgeColor(entry.subject)}`}>
                          {entry.subject}
                        </span>
                        <span className="font-black text-base sm:text-xl text-amber-600 dark:text-amber-400">
                          {entry.score.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Đúng {entry.correctCount}/{entry.totalQuestions} câu • {entry.examType}
                      </div>
                    </div>

                    {/* Admin Actions (Sửa / Xóa) */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-zinc-700">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id, entry.studentName)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 cursor-pointer"
                          title="Xóa khỏi bảng vàng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Admin Add / Edit Honor Roll Entry */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {editingEntry ? 'Chỉnh Sửa Học Sinh Vinh Danh' : 'Thêm Thủ Khoa Vào Bảng Vàng'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                    Họ và Tên học sinh *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="vd: Nguyễn Trần Bảo Nam"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                    Trường THCS
                  </label>
                  <input
                    type="text"
                    value={formSchool}
                    onChange={(e) => setFormSchool(e.target.value)}
                    placeholder="vd: THCS Trưng Vương"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                    Khối lớp
                  </label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Lớp 6">Lớp 6</option>
                    <option value="Lớp 7">Lớp 7</option>
                    <option value="Lớp 8">Lớp 8</option>
                    <option value="Lớp 9">Lớp 9</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                    Môn học
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Toán học">Toán học</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="KHTN (Lý/Hóa/Sinh)">KHTN (Lý/Hóa/Sinh)</option>
                    <option value="Ngữ Văn">Ngữ Văn</option>
                    <option value="Lịch Sử & Địa Lý">Lịch Sử & Địa Lý</option>
                    <option value="Tin Học">Tin Học</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                    Điểm số (/10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formScore}
                    onChange={(e) => setFormScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-bold text-amber-600 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                    Loại bài thi
                  </label>
                  <input
                    type="text"
                    value={formExamType}
                    onChange={(e) => setFormExamType(e.target.value)}
                    placeholder="vd: Khảo sát vào 10 Chuyên"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                    Huy chương
                  </label>
                  <select
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="gold">🥇 Huy chương Vàng (Thủ khoa)</option>
                    <option value="silver">🥈 Huy chương Bạc (Á khoa)</option>
                    <option value="bronze">🥉 Huy chương Đồng</option>
                    <option value="top">⭐ Top Bảng Vàng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                  Lời khen / Vinh danh đặc biệt
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="vd: Thủ Khoa Điểm 10 Tuyệt Đối - Giải xuất sắc mọi câu phân loại"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingEntry ? 'Lưu thay đổi' : 'Vinh danh học sinh'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Confirmation (Chỉ Quản trị viên Mạc Khánh Duy) */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              Xác Nhận Đặt Lại Bảng Vàng Danh Dự?
            </h3>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Thao tác này chỉ dành riêng cho <strong>Quản trị viên ({ADMIN_NAME})</strong>. Hệ thống sẽ khôi phục lại bảng danh dự tiêu chuẩn cho các kỳ thi mới.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResetHonorRoll}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Xác nhận Đặt lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
