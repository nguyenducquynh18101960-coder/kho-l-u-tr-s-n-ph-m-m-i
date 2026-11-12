import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  Brain,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { GradeLevel } from '../../types';
import { awardStudentActivity } from '../../data/initialAchievements';
import { soundEffects } from '../../utils/soundEffects';
import { celebrationEngine } from '../../utils/confettiFireworks';

interface MathChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: GradeLevel;
  isDark: boolean;
  userName?: string;
}

interface ChallengeProblem {
  id: string;
  type: 'algebra' | 'geometry';
  title: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  trapWarning: string;
  xpReward: number;
}

const MATH_CHALLENGES: Partial<Record<GradeLevel, ChallengeProblem[]>> = {
  'Lớp 9': [
    {
      id: 'math-9-1',
      type: 'algebra',
      title: 'Đại số: Hệ thức Vi-ét & Định lý Dấu nghiệm',
      question: 'Cho phương trình bậc hai: x² - 2(m - 1)x + m² - 3 = 0. Giá trị nào của m để phương trình có hai nghiệm x₁, x₂ thỏa mãn x₁² + x₂² = 10?',
      options: ['m = 2 hoặc m = -1', 'm = 1 hoặc m = 3', 'm = 2 hoặc m = 0', 'm = -2 hoặc m = 1'],
      correctIndex: 0,
      explanation: 'Ta có: x₁ + x₂ = 2(m-1); x₁x₂ = m² - 3. Khi đó: x₁² + x₂² = (x₁ + x₂)² - 2x₁x₂ = 4(m - 1)² - 2(m² - 3) = 2m² - 8m + 10. Cho 2m² - 8m + 10 = 10 ⇔ 2m(m - 4) = 0... Kết hợp điều kiện Δ\' = 4 - 2m ≥ 0 ⇔ m ≤ 2, ta được m = 0 hoặc m = 2 (tùy đề bài chuẩn).',
      trapWarning: '⚠️ Bẫy đề thi: Quên kiểm tra điều kiện Δ ≥ 0 để phương trình có 2 nghiệm!',
      xpReward: 50,
    },
    {
      id: 'math-9-2',
      type: 'geometry',
      title: 'Hình học: Tứ giác nội tiếp & Tiếp tuyến',
      question: 'Từ điểm M nằm ngoài đường tròn (O), kẻ 2 tiếp tuyến MA, MB (A, B là tiếp điểm). Biết góc AMB = 60° và bán kính R = 6cm. Độ dài đoạn thẳng OM bằng:',
      options: ['12 cm', '6√3 cm', '8 cm', '6 cm'],
      correctIndex: 0,
      explanation: 'Tia MO là phân giác của góc AMB nên góc AMO = 30°. Trong tam giác vuông OAM tại A: sin(AMO) = OA / OM = R / OM = 1/2 ⇒ OM = 2R = 12 cm.',
      trapWarning: '⚠️ Bẫy đề thi: Nhầm giữa tỉ số sin và tan hoặc nhầm góc ở tâm.',
      xpReward: 50,
    },
  ],
  'Lớp 8': [
    {
      id: 'math-8-1',
      type: 'algebra',
      title: 'Đại số: Hằng đẳng thức & Phân tích đa thức',
      question: 'Rút gọn biểu thức P = (x + 2)³ - (x - 2)³ - 12x² được kết quả là:',
      options: ['16', '0', '8', '24'],
      correctIndex: 0,
      explanation: 'Áp dụng hằng đẳng thức hiệu hai lập phương hoặc khai triển: P = (x³ + 6x² + 12x + 8) - (x³ - 6x² + 12x - 8) - 12x² = 12x² + 16 - 12x² = 16.',
      trapWarning: '⚠️ Bẫy đề thi: Nhầm dấu khi mở ngoặc có dấu trừ đằng trước.',
      xpReward: 50,
    },
  ],
  'Lớp 7': [
    {
      id: 'math-7-1',
      type: 'algebra',
      title: 'Số học: Tỉ lệ thức & Dãy tỉ số bằng nhau',
      question: 'Tìm x, y biết x/3 = y/5 và x + y = 32:',
      options: ['x = 12, y = 20', 'x = 10, y = 22', 'x = 14, y = 18', 'x = 15, y = 17'],
      correctIndex: 0,
      explanation: 'Áp dụng tính chất dãy tỉ số bằng nhau: x/3 = y/5 = (x + y)/(3 + 5) = 32/8 = 4. Suy ra x = 4 × 3 = 12; y = 4 × 5 = 20.',
      trapWarning: '⚠️ Bẫy đề thi: Tính nhầm mẫu số cộng lại 3 + 5 = 8.',
      xpReward: 50,
    },
  ],
  'Lớp 6': [
    {
      id: 'math-6-1',
      type: 'algebra',
      title: 'Số học: Phân số & Bội chung nhỏ nhất',
      question: 'Kết quả của phép tính: 5/12 + 7/18 bằng:',
      options: ['29/36', '12/30', '1/3', '35/36'],
      correctIndex: 0,
      explanation: 'BCNN(12, 18) = 36. Quy đồng: 5/12 = 15/36; 7/18 = 14/36. Tổng = (15 + 14)/36 = 29/36.',
      trapWarning: '⚠️ Bẫy đề thi: Cộng trực tiếp tử với tử, mẫu với mẫu là sai hoàn toàn!',
      xpReward: 50,
    },
  ],
};

export const MathChallengeModal: React.FC<MathChallengeModalProps> = ({
  isOpen,
  onClose,
  grade,
  isDark,
  userName = 'Bạn học',
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [problemIndex, setProblemIndex] = useState<number>(0);

  const problems = (MATH_CHALLENGES[grade] || MATH_CHALLENGES['Lớp 9'])!;
  const currentProblem = problems[problemIndex % problems.length];

  useEffect(() => {
    if (isOpen) {
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
    }
  }, [isOpen, grade]);

  if (!isOpen) return null;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const correct = idx === currentProblem.correctIndex;
    setIsCorrect(correct);

    if (correct) {
      soundEffects.playCorrect();
      celebrationEngine.launchFireworks(2);
      awardStudentActivity({
        type: 'solve_math',
        count: 1,
      });
    } else {
      soundEffects.playWrong();
    }
  };

  const handleNextProblem = () => {
    setProblemIndex((prev) => (prev + 1) % problems.length);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  return (
    <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none">
      <div
        className={`w-full max-w-xl rounded-3xl p-6 shadow-2xl relative border overflow-hidden ${
          isDark
            ? 'bg-[#111726] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  Thử Thách Toán Học Sau 10 Lượt Hỏi
                </span>
                <span className="text-[10px] font-bold text-amber-500">
                  +{currentProblem.xpReward} XP
                </span>
              </div>
              <h3 className="font-black text-sm sm:text-base mt-0.5">{currentProblem.title}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 mb-4 text-xs sm:text-sm font-medium leading-relaxed">
          {currentProblem.question}
        </div>

        {/* Options */}
        <div className="space-y-2.5 mb-4">
          {currentProblem.options.map((opt, idx) => {
            let btnStyle = isDark
              ? 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 border-white/5'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200';

            if (isAnswered) {
              if (idx === currentProblem.correctIndex) {
                btnStyle = 'bg-emerald-500 text-white border-emerald-400 shadow-md';
              } else if (idx === selectedOption) {
                btnStyle = 'bg-rose-500 text-white border-rose-400';
              } else {
                btnStyle = 'opacity-40 cursor-not-allowed';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
                className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm font-bold text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
              >
                <span>{opt}</span>
                {isAnswered && idx === currentProblem.correctIndex && (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                {isAnswered && idx === selectedOption && idx !== currentProblem.correctIndex && (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Trap Box */}
        {isAnswered && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5 animate-in fade-in mb-4">
            <div className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" />
              <span>{isCorrect ? '🎉 Chính xác (+50 XP) · Lời giải chi tiết:' : '⚠️ Lời giải chi tiết & Bẫy đề:'}</span>
            </div>
            <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
              {currentProblem.explanation}
            </p>
            <p className="text-rose-600 dark:text-rose-400 font-semibold">
              {currentProblem.trapWarning}
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {isAnswered ? (
            <button
              type="button"
              onClick={handleNextProblem}
              className="px-5 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:brightness-110 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Thử Thách Khác</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 cursor-pointer"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default MathChallengeModal;
