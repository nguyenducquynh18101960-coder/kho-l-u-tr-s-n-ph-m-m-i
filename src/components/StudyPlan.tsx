import React, { useState } from 'react';
import { GradeLevel, StudyPlanData } from '../types';
import Markdown from 'react-markdown';
import {
  CalendarCheck2,
  Target,
  Clock,
  Sparkles,
  BookOpen,
  RefreshCw,
  CheckCircle2,
  Flame,
  Award,
  ListTodo,
} from 'lucide-react';

interface StudyPlanProps {
  currentGrade: GradeLevel;
}

export const StudyPlan: React.FC<StudyPlanProps> = ({ currentGrade }) => {
  const [targetGoal, setTargetGoal] = useState<string>('Điểm 10 tất cả các môn cả năm học');
  const [currentLevel, setCurrentLevel] = useState<string>('8.0 - 8.5 (Học sinh Khá Giỏi)');
  const [dailyHours, setDailyHours] = useState<number>(2.5);
  const [loading, setLoading] = useState<boolean>(false);
  const [planData, setPlanData] = useState<StudyPlanData | null>(null);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: currentGrade,
          targetGoal,
          currentLevel,
          prioritySubjects: ['Toán học', 'Ngữ Văn', 'Tiếng Anh', 'Khoa học tự nhiên'],
          availableHoursPerDay: dailyHours,
        }),
      });

      const data = await res.json();
      if (data.success && data.plan) {
        setPlanData(data.plan);
      } else {
        throw new Error(data.error || 'Không thể tạo lộ trình');
      }
    } catch (err: any) {
      alert(`⚠️ Lỗi: ${err.message || 'Không thể tạo kế hoạch lúc này.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-6 px-4">
      {/* Config Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Chiến Lược & Lộ Trình Săn Điểm 10 Cả Năm
            </h2>
            <p className="text-sm text-slate-500">
              Phân bổ thời gian thông minh, áp dụng Active Recall và Spaced Repetition cho học sinh {currentGrade}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Target */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Mục tiêu học tập
            </label>
            <select
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Điểm 10 tất cả các môn cả năm học">
                🌟 Điểm 10 tất cả các môn cả năm (Toàn diện)
              </option>
              <option value="Điểm 10 Toán, Văn, Anh (Top đầu khối)">
                🎯 Điểm 10 bộ ba Toán - Văn - Anh
              </option>
              <option value="Đậu trường Chuyên / Lớp Chọn vào 10">
                🏆 Ôn thi Học sinh giỏi & Đậu trường Chuyên
              </option>
            </select>
          </div>

          {/* Current Level */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Mức điểm trung bình hiện tại
            </label>
            <select
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="7.0 - 7.9 (Khá)">7.0 - 7.9 (Học sinh Khá - Muốn bứt phá)</option>
              <option value="8.0 - 8.9 (Giỏi)">8.0 - 8.9 (Học sinh Giỏi - Cần chinh phục điểm 10)</option>
              <option value="9.0+ (Xuất sắc)">9.0+ (Xuất sắc - Duy trì phong độ cả năm)</option>
            </select>
          </div>

          {/* Daily hours */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Thời gian tự học mỗi ngày
            </label>
            <div className="flex gap-2">
              {[1.5, 2.5, 3.5].map((hr) => (
                <button
                  key={hr}
                  type="button"
                  onClick={() => setDailyHours(hr)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    dailyHours === hr
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {hr} tiếng
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Chuyên gia AI đang thiết kế lộ trình bứt phá điểm 10...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Thiết kế thời khóa biểu & Lộ trình điểm 10</span>
            </>
          )}
        </button>
      </div>

      {/* Plan Display */}
      {planData && (
        <div className="space-y-6">
          {/* Motto Header */}
          <div className="bg-gradient-to-r from-indigo-700 to-blue-600 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
                Lộ trình học tập cá nhân hóa
              </div>
              <h3 className="text-xl sm:text-2xl font-black">{planData.planName}</h3>
              <p className="text-sm text-indigo-100 italic mt-1 font-medium">
                "{planData.overviewMotto}"
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xs text-xs font-bold text-white border border-white/20 whitespace-nowrap">
              Mục tiêu: Điểm 10 trọn năm {currentGrade}
            </div>
          </div>

          {/* Weekly Schedule Days */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h4 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              <CalendarCheck2 className="w-5 h-5 text-indigo-600" />
              Thời Khóa Biểu Tự Học Hàng Tuần (Chuẩn Khoa Học)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planData.weeklyRoutine.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                      {item.day}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      ⏱️ {item.timeAllocation}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-900">
                    Môn trọng tâm: <span className="text-indigo-900">{item.mainFocusSubject}</span>
                  </div>

                  <div className="space-y-1">
                    {item.learningTasks.map((task, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-1.5 text-xs text-slate-700">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-xs text-amber-900 bg-amber-50/60 p-2 rounded-lg font-medium">
                    ✨ <strong className="font-bold">Thói quen điểm 10:</strong> {item.score10Habit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Golden Rules and Exam Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Golden Rules */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h4 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                <Award className="w-5 h-5 text-amber-500" />
                Nguyên Tắc Vàng Để Giữ Vững Điểm 10
              </h4>
              <ul className="space-y-3">
                {planData.topGoldenRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                    <span className="h-5 w-5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Exam Prep Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h4 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                <ListTodo className="w-5 h-5 text-emerald-600" />
                Checklist Ôn Thi 1 Tiết & Thi Học Kỳ
              </h4>
              <ul className="space-y-3">
                {planData.examPrepChecklist.map((check, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
