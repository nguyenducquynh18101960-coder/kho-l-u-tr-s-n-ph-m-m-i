import React, { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Trash2,
  Clock,
  Target,
  BarChart3,
  BookOpen,
  Bot,
  TrendingUp,
} from 'lucide-react';
import {
  loadAllAttempts,
  loadKnowledgeGaps,
  markGapMastered,
  clearKnowledgeGaps,
  getSubjectMasteryStats,
  getDailyRemediationPlan,
  KnowledgeAttemptEntry,
} from '../../utils/knowledgeGapTracker';

interface KnowledgeGapTrackerProps {
  isDark: boolean;
  onPracticeTopic: (subject: string, tutorPrompt: string) => void;
}

const SOURCE_LABELS: Record<KnowledgeAttemptEntry['source'], string> = {
  exam: 'Luyện đề',
  minigame: 'Mini game',
  duel: 'Đấu trường 1v1',
  ai_quiz: 'Hỏi bài 3D',
};

export const KnowledgeGapTracker: React.FC<KnowledgeGapTrackerProps> = ({
  isDark,
  onPracticeTopic,
}) => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const onUpdate = () => setRefreshTick((t) => t + 1);
    window.addEventListener('max10_knowledge_gaps_updated', onUpdate);
    return () => window.removeEventListener('max10_knowledge_gaps_updated', onUpdate);
  }, []);

  const allAttempts = useMemo(() => loadAllAttempts(), [refreshTick]);
  const unmasteredGaps = useMemo(() => loadKnowledgeGaps(false), [refreshTick]);
  const subjectStats = useMemo(() => getSubjectMasteryStats(), [refreshTick]);
  const dailyPlan = useMemo(() => getDailyRemediationPlan(), [refreshTick]);

  const totalAnswered = allAttempts.length;
  const totalCorrect = allAttempts.filter((a) => a.isCorrect).length;
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const filteredGaps = useMemo(() => {
    if (selectedSubjectFilter === 'ALL') return unmasteredGaps;
    return unmasteredGaps.filter((g) => g.subject === selectedSubjectFilter);
  }, [unmasteredGaps, selectedSubjectFilter]);

  const activeSubjectsCount = subjectStats.filter((s) => s.total > 0).length;

  return (
    <div
      className={`h-full w-full overflow-y-auto px-4 sm:px-6 py-5 ${
        isDark ? 'bg-[#0b101b] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div
          className={`rounded-3xl p-5 border flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
            isDark
              ? 'bg-gradient-to-br from-slate-900 via-[#10192b] to-emerald-950/35 border-white/10'
              : 'bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/50 border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight">
                  Phân tích Lỗ hổng Kiến thức AI (Smart Tracker)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                  Tự động đồng bộ
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                Tự động ghi nhận mọi câu làm sai từ Luyện đề, Mini game, Đấu trường 1v1 và Gia sư 3D để lập lộ trình ôn bù mỗi ngày.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                onPracticeTopic(
                  dailyPlan[0]?.subject || 'Toán học',
                  dailyPlan[0]?.tutorPrompt ||
                    'Hãy kiểm tra giúp mình 5 câu hỏi ôn tập các phần kiến thức hay sai nhé!'
                )
              }
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Ôn bù ngay cùng Gia sư 3D</span>
            </button>

            {allAttempts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (!confirmClear) {
                    setConfirmClear(true);
                    setTimeout(() => setConfirmClear(false), 3000);
                  } else {
                    clearKnowledgeGaps();
                    setConfirmClear(false);
                  }
                }}
                className={`px-3 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                  confirmClear
                    ? 'bg-rose-600 text-white border-rose-600'
                    : isDark
                    ? 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmClear ? 'Bấm lần nữa để xóa' : 'Làm mới lịch sử'}</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            className={`rounded-2xl p-4 border ${
              isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-bold">
              <span>Tổng câu đã luyện</span>
              <BookOpen className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-black mt-1.5">{totalAnswered}</div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Trên {activeSubjectsCount} môn học
            </div>
          </div>

          <div
            className={`rounded-2xl p-4 border ${
              isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-bold">
              <span>Độ chính xác chung</span>
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black mt-1.5 text-emerald-600 dark:text-emerald-400">
              {totalAnswered > 0 ? `${overallAccuracy}%` : '--'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {totalCorrect} câu trả lời đúng
            </div>
          </div>

          <div
            className={`rounded-2xl p-4 border ${
              isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-bold">
              <span>Lỗ hổng cần bù</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black mt-1.5 text-amber-600 dark:text-amber-400">
              {unmasteredGaps.length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Câu sai chưa đánh dấu thuộc
            </div>
          </div>

          <div
            className={`rounded-2xl p-4 border ${
              isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-bold">
              <span>Mục tiêu hôm nay</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black mt-1.5 text-indigo-600 dark:text-indigo-400">
              {dailyPlan.reduce((sum, p) => sum + p.durationMinutes, 0)} phút
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {dailyPlan.length} chuyên đề ưu tiên
            </div>
          </div>
        </div>

        {/* Main 2-column Grid: Subject Mastery Chart + Daily Remediation Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Subject Mastery Chart */}
          <div
            className={`lg:col-span-7 rounded-3xl p-4 sm:p-5 border ${
              isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-black">Biểu đồ Năng lực Theo Môn học</h2>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">
                Cập nhật theo thời gian thực
              </span>
            </div>

            <div className="space-y-3">
              {subjectStats.map((stat) => {
                const barColor =
                  stat.status === 'strong'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : stat.status === 'average'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : stat.status === 'weak'
                    ? 'bg-gradient-to-r from-rose-500 to-red-500'
                    : 'bg-slate-300 dark:bg-zinc-700';

                const badgeText =
                  stat.status === 'strong'
                    ? 'Vững vàng'
                    : stat.status === 'average'
                    ? 'Cần củng cố'
                    : stat.status === 'weak'
                    ? 'Ưu tiên ôn bù'
                    : 'Chưa có dữ liệu';

                const badgeCls =
                  stat.status === 'strong'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                    : stat.status === 'average'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                    : stat.status === 'weak'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                    : 'bg-slate-500/10 text-slate-500 dark:text-zinc-400';

                return (
                  <div
                    key={stat.subject}
                    className={`p-3 rounded-2xl border ${
                      isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50/70 border-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                      <div className="flex items-center gap-2 font-extrabold">
                        <span>{stat.subject}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeCls}`}>
                          {badgeText}
                        </span>
                      </div>
                      <div className="font-bold text-slate-600 dark:text-zinc-300">
                        {stat.total > 0 ? `${stat.accuracy}% (${stat.correct}/${stat.total})` : '0 câu'}
                      </div>
                    </div>

                    <div
                      className={`h-2.5 w-full rounded-full overflow-hidden ${
                        isDark ? 'bg-white/[0.06]' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${stat.total > 0 ? Math.max(6, stat.accuracy) : 0}%` }}
                      />
                    </div>

                    {stat.weakTopics.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-bold text-rose-500">Hay nhầm:</span>
                        {stat.weakTopics.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-300 font-semibold"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Remediation Plan */}
          <div
            className={`lg:col-span-5 rounded-3xl p-4 sm:p-5 border flex flex-col ${
              isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black">Lộ trình Bù Lỗ Hổng Hôm Nay</h2>
            </div>

            <div className="space-y-2.5 flex-1">
              {dailyPlan.map((item) => {
                const prioCls =
                  item.priority === 'high'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
                    : item.priority === 'medium'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30';
                const prioLabel =
                  item.priority === 'high' ? 'Ưu tiên cao' : item.priority === 'medium' ? 'Trung bình' : 'Củng cố';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border space-y-2 ${
                      isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${prioCls}`}>
                        {prioLabel}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                        ⏱️ {item.durationMinutes} phút
                      </span>
                    </div>
                    <div className="text-xs font-extrabold">{item.actionTitle}</div>
                    <button
                      type="button"
                      onClick={() => onPracticeTopic(item.subject, item.tutorPrompt)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span>Mở Gia sư 3D ôn phần này</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Wrong Questions Notebook */}
        <div
          className={`rounded-3xl p-4 sm:p-5 border ${
            isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black">
                Sổ Tay Câu Hay Làm Sai ({filteredGaps.length})
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedSubjectFilter('ALL')}
                className={`px-2.5 py-1 rounded-xl font-bold border cursor-pointer ${
                  selectedSubjectFilter === 'ALL'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : isDark
                    ? 'bg-white/[0.04] border-white/10 text-zinc-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Tất cả
              </button>
              {subjectStats
                .filter((s) => s.unmasteredWrong > 0)
                .map((s) => (
                  <button
                    key={s.subject}
                    type="button"
                    onClick={() => setSelectedSubjectFilter(s.subject)}
                    className={`px-2.5 py-1 rounded-xl font-bold border cursor-pointer ${
                      selectedSubjectFilter === s.subject
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : isDark
                        ? 'bg-white/[0.04] border-white/10 text-zinc-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {s.subject} ({s.unmasteredWrong})
                  </button>
                ))}
            </div>
          </div>

          {filteredGaps.length === 0 ? (
            <div
              className={`rounded-2xl p-8 text-center border border-dashed ${
                isDark ? 'border-white/10 text-zinc-400' : 'border-slate-200 text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <div className="text-sm font-extrabold text-slate-700 dark:text-zinc-200">
                Chưa có câu sai nào chưa khắc phục!
              </div>
              <p className="text-xs mt-1 max-w-md mx-auto">
                Khi bạn làm Luyện đề, chơi Mini game, thi Đấu trường 1v1 hoặc Hỏi bài 3D, mọi câu sai sẽ tự động được lưu vào đây để AI phân tích.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGaps.slice(0, 30).map((gap) => (
                <div
                  key={gap.id}
                  className={`p-3.5 rounded-2xl border space-y-2 ${
                    isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-extrabold">
                        {gap.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-bold">
                        {SOURCE_LABELS[gap.source]}
                      </span>
                      <span className="text-slate-500 dark:text-zinc-400 font-semibold">
                        {new Date(gap.timestamp).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onPracticeTopic(
                            gap.subject,
                            `Mình từng làm sai câu này ở môn ${gap.subject}: "${gap.question}".${
                              gap.correctAnswer ? ` Đáp án đúng là: "${gap.correctAnswer}".` : ''
                            } Hãy giảng lại thật ngắn gọn điểm mấu chốt lên bảng trắng và cho mình 1 câu tương tự để luyện lại nhé!`
                          )
                        }
                        className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center gap-1"
                      >
                        <Bot className="w-3 h-3" />
                        <span>Hỏi lại Gia sư 3D</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => markGapMastered(gap.id)}
                        className={`px-2.5 py-1 rounded-xl font-bold border cursor-pointer flex items-center gap-1 ${
                          isDark
                            ? 'bg-white/[0.04] border-white/15 text-emerald-300 hover:bg-emerald-500/15'
                            : 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Đã hiểu bài</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm font-bold leading-relaxed">{gap.question}</div>

                  {(gap.userAnswer || gap.correctAnswer || gap.explanation) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      {gap.userAnswer && (
                        <div className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                          <span className="font-extrabold">Bạn chọn: </span>
                          <span>{gap.userAnswer}</span>
                        </div>
                      )}
                      {gap.correctAnswer && (
                        <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          <span className="font-extrabold">Đáp án đúng: </span>
                          <span>{gap.correctAnswer}</span>
                        </div>
                      )}
                      {gap.explanation && (
                        <div className="sm:col-span-2 px-2.5 py-1.5 rounded-xl bg-slate-500/10 text-slate-700 dark:text-zinc-300 border border-slate-500/15">
                          <span className="font-extrabold">Giải thích nhanh: </span>
                          <span>{gap.explanation}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
