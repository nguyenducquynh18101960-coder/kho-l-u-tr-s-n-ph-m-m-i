import React, { useState, useEffect } from 'react';
import { GradeLevel, SubjectInfo, TipsData } from '../types';
import Markdown from 'react-markdown';
import {
  BookMarked,
  ShieldAlert,
  Zap,
  Lightbulb,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Calculator,
} from 'lucide-react';

interface FormulaGuideProps {
  currentGrade: GradeLevel;
  currentSubject: SubjectInfo;
}

export const FormulaGuide: React.FC<FormulaGuideProps> = ({
  currentGrade,
  currentSubject,
}) => {
  const topics = currentSubject.topics[currentGrade] || [];
  const [selectedTopic, setSelectedTopic] = useState<string>(topics[0] || 'Kiến thức trọng tâm');
  const [loading, setLoading] = useState<boolean>(false);
  const [tipsData, setTipsData] = useState<TipsData | null>(null);

  useEffect(() => {
    if (topics.length > 0) {
      setSelectedTopic(topics[0]);
    }
  }, [currentGrade, currentSubject.id]);

  const fetchTips = async (topicToFetch: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/tips/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: currentGrade,
          subject: currentSubject.name,
          topic: topicToFetch,
        }),
      });

      const data = await res.json();
      if (data.success && data.tips) {
        setTipsData(data.tips);
      } else {
        throw new Error(data.error || 'Không tải được bí kíp');
      }
    } catch (err: any) {
      alert(`⚠️ Lỗi: ${err.message || 'Không thể tải bí kíp lúc này.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTopic) {
      fetchTips(selectedTopic);
    }
  }, [selectedTopic, currentGrade, currentSubject.id]);

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-6 px-4">
      {/* Header & Topic Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Cẩm Nang Công Thức Vàng & Bẫy Đề Thi
              </h2>
              <p className="text-sm text-slate-500">
                Tra cứu nhanh các công thức cốt lõi, bẫy mất điểm và kỹ thuật câu vận dụng cao điểm 10.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
            {currentSubject.name} - {currentGrade}
          </span>
        </div>

        {/* Topic Horizontal Scroll / Select */}
        <div className="mt-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Chọn chuyên đề tra cứu:
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {topics.map((t, idx) => {
              const isSelected = selectedTopic === t;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedTopic(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">
            AI đang trích xuất công thức vàng & phân tích các bẫy đề thi điểm 10...
          </p>
        </div>
      )}

      {/* Guide Content */}
      {!loading && tipsData && (
        <div className="space-y-6">
          {/* Core Formulas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              <Zap className="w-5 h-5 text-amber-500" />
              Công Thức & Định Lý Cốt Lõi Cần Nhớ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tipsData.coreFormulas.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 hover:border-amber-300 transition-colors"
                >
                  <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wide">
                    {item.name}
                  </h4>
                  <div className="text-sm sm:text-base font-mono font-bold text-indigo-700 bg-white p-2 rounded-lg border border-slate-200">
                    {item.formula}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    💡 <span className="font-semibold">Lưu ý áp dụng:</span> {item.applicationNote}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Traps to Avoid */}
          <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs">
            <h3 className="flex items-center gap-2 text-base font-bold text-rose-900 mb-4 pb-2 border-b border-rose-100">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Top Các Bẫy Đề Thi Khiến Học Sinh Mất 0.5 - 1.0 Điểm
            </h3>
            <div className="space-y-3">
              {tipsData.topTrapsToAvoid.map((trap, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 space-y-1.5"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold text-sm shrink-0 mt-0.5">⚠️ Bẫy {idx + 1}:</span>
                    <span className="text-xs sm:text-sm font-semibold text-rose-950">
                      {trap.trapDescription}
                    </span>
                  </div>
                  <div className="ml-5 text-xs text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-rose-200/60">
                    <strong className="text-emerald-700">Cách phòng ngừa để bảo toàn điểm 10:</strong>{' '}
                    {trap.howToPrevent}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score 10 Strategies */}
          <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-xs">
            <h3 className="flex items-center gap-2 text-base font-bold text-indigo-900 mb-4 pb-2 border-b border-indigo-100">
              <Lightbulb className="w-5 h-5 text-indigo-600" />
              Chiến Thuật Bứt Phá Lấy Điểm 10 Vận Dụng Cao
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tipsData.score10Strategies.map((strat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5 text-xs sm:text-sm text-indigo-950 font-medium"
                >
                  <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{strat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mastery Example */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">
                Ví Dụ Điển Hình & Phân Tích Lời Giải Chuẩn Điểm 10
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Đề bài:</span>
                <Markdown>{tipsData.masteryExample.problem}</Markdown>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs sm:text-sm text-emerald-950 leading-relaxed font-mono sm:font-sans">
                <span className="text-xs text-emerald-700 font-bold uppercase block mb-1">
                  Lời giải chi tiết chuẩn barem:
                </span>
                <div className="markdown-body">
                  <Markdown>{tipsData.masteryExample.standardSolution}</Markdown>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block mb-1">🔍 Phân tích vì sao bài giải này đạt điểm 10:</span>
                {tipsData.masteryExample.score10Analysis}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
