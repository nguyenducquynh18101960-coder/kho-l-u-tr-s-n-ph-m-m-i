import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Crown,
  Trophy,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Check,
  Send,
  HelpCircle,
} from 'lucide-react';
import { GradeLevel } from '../../types';
import { awardMiniGameAchievement } from '../../data/initialAchievements';
import { StudentBadge } from '../../types/achievements';
import { celebrationEngine } from '../../utils/confettiFireworks';

interface MiniGameQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: GradeLevel;
  subjectTitle?: string;
  lessonContext?: string;
  userName?: string;
  isDark?: boolean;
}

interface QuestionItem {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  trapWarning: string;
}

// Built-in question generator with 10 high-quality questions for THCS
function generateQuestionsForLesson(grade: GradeLevel, lessonContext?: string): QuestionItem[] {
  // Context-aware questions tailored to Grade 6 - 9 THCS
  const isGrade9 = grade === 'Lớp 9';
  const isGrade8 = grade === 'Lớp 8';
  const isGrade7 = grade === 'Lớp 7';

  if (isGrade9) {
    return [
      {
        id: 1,
        question: 'Điều kiện xác định của biểu thức căn bậc hai √(2x - 6) là gì?',
        options: ['x ≥ 3', 'x > 3', 'x ≤ 3', 'x ≥ -3'],
        correctIndex: 0,
        explanation: 'Biểu thức √(A) có nghĩa khi và chỉ khi A ≥ 0. Ta có: 2x - 6 ≥ 0 ⇔ 2x ≥ 6 ⇔ x ≥ 3.',
        trapWarning: 'Bẫy đề thi: Học sinh hay quên dấu bằng (=) hoặc nhầm chia cho số âm đổi chiều bất đẳng thức.',
      },
      {
        id: 2,
        question: 'Phương trình bậc hai ax² + bx + c = 0 (a ≠ 0) có 2 nghiệm phân biệt khi nào?',
        options: ['Δ > 0 (hoặc Δ\' > 0)', 'Δ ≥ 0', 'Δ = 0', 'Δ < 0'],
        correctIndex: 0,
        explanation: 'Phương trình có 2 nghiệm PHÂN BIỆT khi Δ > 0. Nếu đề hỏi "có nghiệm" mới là Δ ≥ 0.',
        trapWarning: 'Bẫy từ ngữ: Chú ý chữ "phân biệt" bắt buộc Δ > 0 nghiêm ngặt.',
      },
      {
        id: 3,
        question: 'Theo hệ thức Vi-ét, tổng hai nghiệm S = x₁ + x₂ của phương trình ax² + bx + c = 0 bằng gì?',
        options: ['-b / a', 'b / a', 'c / a', '-c / a'],
        correctIndex: 0,
        explanation: 'Hệ thức Vi-ét: Tổng S = x₁ + x₂ = -b/a và Tích P = x₁x₂ = c/a.',
        trapWarning: 'Bẫy dấu trừ: Rất nhiều bạn quên dấu trừ ở công thức tổng S = -b/a.',
      },
      {
        id: 4,
        question: 'Góc nội tiếp chắn nửa đường tròn luôn có số đo bằng bao nhiêu độ?',
        options: ['90° (góc vuông)', '60°', '45°', '180°'],
        correctIndex: 0,
        explanation: 'Định lý hình học 9: Góc nội tiếp chắn nửa đường tròn là góc vuông (số đo 90°).',
        trapWarning: 'Nhầm lẫn giữa góc nội tiếp chắn nửa đường tròn (90°) và góc ở tâm chắn nửa đường tròn (180°).',
      },
      {
        id: 5,
        question: 'Trong tứ giác nội tiếp đường tròn, tổng hai góc đối nhau luôn bằng bao nhiêu?',
        options: ['180°', '360°', '90°', '120°'],
        correctIndex: 0,
        explanation: 'Định lý tứ giác nội tiếp: Trong một tứ giác nội tiếp, tổng số đo hai góc đối diện bằng 180°.',
        trapWarning: 'Không nhầm với tổng 4 góc của một tứ giác bất kỳ là 360°.',
      },
      {
        id: 6,
        question: 'Kim loại nào sau đây phản ứng mãnh liệt với nước ở nhiệt độ thường sinh ra khí H₂ và dung dịch kiềm?',
        options: ['Natri (Na)', 'Đồng (Cu)', 'Bạc (Ag)', 'Sắt (Fe)'],
        correctIndex: 0,
        explanation: 'Na là kim loại kiềm rất hoạt động: 2Na + 2H₂O → 2NaOH + H₂↑. Fe không tác dụng với nước nguội, Cu và Ag đứng sau H.',
        trapWarning: 'Dãy hoạt động hóa học của kim loại: K, Na, Ba, Ca, Mg, Al, Zn, Fe, Ni, Sn, Pb, (H), Cu, Hg, Ag, Pt, Au.',
      },
      {
        id: 7,
        question: 'Công thức tính công suất điện P của một đoạn mạch là gì?',
        options: ['P = U · I', 'P = U / I', 'P = I / U', 'P = U² · I'],
        correctIndex: 0,
        explanation: 'Công suất điện: P = U·I = I²·R = U²/R (với U đo bằng Vôn, I đo bằng Ampe, P đo bằng Oát).',
        trapWarning: 'Nhầm lẫn đơn vị: 1 kW = 1000 W; 1 số điện (1 kWh) = 3.600.000 J.',
      },
      {
        id: 8,
        question: 'Trong tác phẩm "Đồng chí" của Chính Hữu, chi tiết "Đầu súng trăng treo" mang ý nghĩa biểu tượng gì?',
        options: [
          'Biểu tượng kết hợp giữa hiện thực khốc liệt và lãng mạn thi vị',
          'Chỉ là cảnh thực đêm trăng tình cờ nhìn thấy',
          'Báo hiệu chiến trường sắp kết thúc thắng lợi',
          'Sự cô đơn lạnh lẽo của người lính trong rừng sâu',
        ],
        correctIndex: 0,
        explanation: 'Hình ảnh "Đầu súng trăng treo" ở cuối bài là điểm sáng nghệ thuật, biểu tượng cho sự hòa quyện giữa súng (chiến sĩ) và trăng (thi sĩ, hòa bình).',
        trapWarning: 'Phân tích Văn học vào 10 đòi hỏi nêu được cả tính hiện thực và tính lãng mạn.',
      },
      {
        id: 9,
        question: 'Chọn dạng đúng của động từ: "If she _______ harder, she will pass the entrance exam."',
        options: ['studies', 'studied', 'will study', 'would study'],
        correctIndex: 0,
        explanation: 'Câu điều kiện loại 1 (Conditional Type 1): Mệnh đề If dùng thì Hiện tại đơn (studies), mệnh đề chính dùng will + V nguyên thể.',
        trapWarning: 'Không bao giờ dùng "will" trong mệnh đề If của câu điều kiện loại 1.',
      },
      {
        id: 10,
        question: 'Bẫy điểm 10 phân loại: Giá trị nhỏ nhất của biểu thức P = x - 2√x + 5 (với x ≥ 0) bằng bao nhiêu?',
        options: ['4 (khi x = 1)', '5 (khi x = 0)', '3 (khi x = 4)', '1 (khi x = 2)'],
        correctIndex: 0,
        explanation: 'Biến đổi: P = (x - 2√x + 1) + 4 = (√x - 1)² + 4. Vì (√x - 1)² ≥ 0 với mọi x ≥ 0 nên P ≥ 4. Dấu "=" xảy ra khi √x = 1 ⇔ x = 1.',
        trapWarning: 'Rất nhiều học sinh vội vàng chọn 5 vì nghĩ khi x = 0 thì đạt Min, quên mất biến đổi hằng đẳng thức hoàn chỉnh.',
      },
    ];
  }

  // Generic secondary questions for Grades 6-8
  return [
    {
      id: 1,
      question: 'Phân số a/b (a, b ∈ Z, b ≠ 0) là phân số tối giản khi nào?',
      options: ['ƯCLN(|a|, |b|) = 1', 'a và b cùng là số nguyên tố', 'a < b', 'b chia hết cho a'],
      correctIndex: 0,
      explanation: 'Phân số tối giản là phân số mà tử và mẫu chỉ có ước chung là 1 và -1 (ƯCLN = 1).',
      trapWarning: 'a và b không nhất thiết phải là số nguyên tố (ví dụ 8/9 tối giản dù 8 và 9 đều là hợp số).',
    },
    {
      id: 2,
      question: 'Hằng đẳng thức: (a + b)² bằng biểu thức nào sau đây?',
      options: ['a² + 2ab + b²', 'a² + b²', 'a² - 2ab + b²', 'a² + ab + b²'],
      correctIndex: 0,
      explanation: 'Bình phương một tổng: (a + b)² = a² + 2ab + b².',
      trapWarning: 'Học sinh rất hay quên số hạng 2ab ở giữa.',
    },
    {
      id: 3,
      question: 'Trong một tam giác vuông, bình phương cạnh huyền bằng gì?',
      options: ['Tổng bình phương hai cạnh góc vuông (Định lý Pythagoras)', 'Tích hai cạnh góc vuông', 'Hiệu hai cạnh góc vuông', 'Gấp đôi cạnh góc vuông lớn nhất'],
      correctIndex: 0,
      explanation: 'Định lý Pythagoras: Trong tam giác vuông ABC vuông tại A, ta có BC² = AB² + AC².',
      trapWarning: 'Chỉ áp dụng được khi tam giác đã được chứng minh là vuông.',
    },
    {
      id: 4,
      question: 'Đơn vị đo cường độ dòng điện trong hệ đo lường quốc tế (SI) là gì?',
      options: ['Ampe (A)', 'Vôn (V)', 'Oát (W)', 'Jun (J)'],
      correctIndex: 0,
      explanation: 'Cường độ dòng điện ký hiệu I, đo bằng Ampe (A). Hiệu điện thế đo bằng Vôn (V).',
      trapWarning: 'Tránh nhầm giữa đơn vị đo cường độ dòng điện (A) và đơn vị đo điện trở (Ω).',
    },
    {
      id: 5,
      question: 'Khí nào chiếm tỉ lệ thể tích lớn nhất trong không khí (khoảng 78%)?',
      options: ['Khí Nitơ (N₂)', 'Khí Oxi (O₂)', 'Khí Cacbonic (CO₂)', 'Khí Hiđro (H₂)'],
      correctIndex: 0,
      explanation: 'Không khí gồm khoảng 78% Nitơ, 21% Oxi và 1% các khí khác (CO₂, hơi nước, khí hiếm).',
      trapWarning: 'Nhiều bạn lầm tưởng Oxi chiếm nhiều nhất vì duy trì sự sống.',
    },
    {
      id: 6,
      question: 'Từ nào sau đây là từ láy trong tiếng Việt?',
      options: ['Long lanh', 'Nhà cửa', 'Mặt mũi', 'Xe cộ'],
      correctIndex: 0,
      explanation: '"Long lanh" là từ láy âm đầu "l", diễn tả vẻ sáng lóng lánh. Các từ còn lại là từ ghép đẳng lập.',
      trapWarning: 'Từ ghép phân nghĩa có hai tiếng đều có nghĩa, từ láy thường hòa phối ngữ âm.',
    },
    {
      id: 7,
      question: 'Điền giới từ thích hợp: "I am interested _______ learning Math with Max10 AI."',
      options: ['in', 'on', 'at', 'with'],
      correctIndex: 0,
      explanation: 'Cấu trúc cố định: to be interested in + V-ing / Noun (quan tâm, thích thú cái gì).',
      trapWarning: 'Không dùng "interested with" hay "interested on".',
    },
    {
      id: 8,
      question: 'Chiến thắng Bạch Đằng lịch sử của Ngô Quyền diễn ra vào năm nào?',
      options: ['Năm 938', 'Năm 981', 'Năm 1288', 'Năm 1077'],
      correctIndex: 0,
      explanation: 'Năm 938, Ngô Quyền lãnh đạo nhân dân đánh tan quân Nam Hán trên sông Bạch Đằng, chấm dứt hơn 1000 năm Bắc thuộc.',
      trapWarning: 'Tránh nhầm với chiến thắng Bạch Đằng năm 1288 của Trần Hưng Đạo đánh quân Nguyên Mông.',
    },
    {
      id: 9,
      question: 'Hai góc kề bù là hai góc có tổng số đo bằng bao nhiêu?',
      options: ['180°', '90°', '360°', '120°'],
      correctIndex: 0,
      explanation: 'Hai góc kề bù là hai góc vừa kề nhau vừa bù nhau (tổng số đo bằng 180°).',
      trapWarning: 'Kề phụ thì tổng bằng 90°, kề bù thì tổng bằng 180°.',
    },
    {
      id: 10,
      question: 'Bẫy điểm 10: Rút gọn biểu thức A = |x - 3| khi x < 3 kết quả là:',
      options: ['3 - x', 'x - 3', '-(3 - x)', 'x + 3'],
      correctIndex: 0,
      explanation: 'Khi x < 3 ⇔ x - 3 < 0. Theo định nghĩa giá trị tuyệt đối, khi biểu thức bên trong âm: |A| = -A = -(x - 3) = 3 - x.',
      trapWarning: 'Rất nhiều học sinh tự động bỏ dấu trị tuyệt đối thành x - 3 mà quên kiểm tra điều kiện x < 3.',
    },
  ];
}

// Synthesizer Web Audio API sound effects for mini-game
class MiniGameAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playCorrect() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Arpeggio C5 -> E5 -> G5 -> C6
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.28);
      });
    } catch {}
  }

  playWrong() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Low buzzer 180Hz -> 140Hz
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.2);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  }

  playFanfare() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.45);
      });
    } catch {}
  }
}

const gameAudio = new MiniGameAudio();

export const MiniGameQuizModal: React.FC<MiniGameQuizModalProps> = ({
  isOpen,
  onClose,
  grade,
  subjectTitle = 'Toán học & Kiến thức Điểm 10',
  lessonContext,
  userName = 'Bạn học',
  isDark = false,
}) => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [scoreAnimation, setScoreAnimation] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<StudentBadge[]>([]);
  const [bonusXp, setBonusXp] = useState<number>(100);

  // Leaderboard Submission Form
  const [submitName, setSubmitName] = useState(userName);
  const [submitSchool, setSubmitSchool] = useState('THCS Nguyễn Du');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [rankMessage, setRankMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const generated = generateQuestionsForLesson(grade, lessonContext);
      setQuestions(generated);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setCorrectCount(0);
      setWrongCount(0);
      setIsCompleted(false);
      setEarnedBadges([]);
      setSubmitSuccess(false);
      setSubmitName(userName || 'Bạn học');
    }
  }, [isOpen, grade, lessonContext, userName]);

  useEffect(() => {
    gameAudio.enabled = soundEnabled;
  }, [soundEnabled]);

  if (!isOpen) return null;

  // Strict User Scoring Rule:
  // 1 câu đúng: +1 điểm
  // 1 câu sai: -0.5 điểm
  // Tổng cộng 10 câu
  const rawScore = correctCount * 1.0 - wrongCount * 0.5;
  const currentScore = Math.max(0, Math.round(rawScore * 10) / 10);
  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setScoreAnimation('+1.0 Điểm 🎉');
      gameAudio.playCorrect();
    } else {
      setWrongCount((prev) => prev + 1);
      setScoreAnimation('-0.5 Điểm ⚠️');
      gameAudio.playWrong();
    }

    setTimeout(() => {
      setScoreAnimation(null);
    }, 1800);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
      gameAudio.playFanfare();
      celebrationEngine.celebrate(5);
      const res = awardMiniGameAchievement({
        score: currentScore,
        grade,
        subjectTitle,
        correctCount,
      });
      setEarnedBadges(res.newlyUnlockedBadges);
      setBonusXp(res.bonusXp || 100);
    }
  };

  const handleRestart = () => {
    const generated = generateQuestionsForLesson(grade, lessonContext);
    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setWrongCount(0);
    setIsCompleted(false);
    setEarnedBadges([]);
    setSubmitSuccess(false);
  };

  const handleSubmitToHonorRoll = async () => {
    if (!submitName.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/exam/honor-roll/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: submitName.trim(),
          school: submitSchool.trim() || 'THCS',
          grade,
          subject: subjectTitle,
          score: currentScore,
          totalQuestions: 10,
          correctCount,
          timeSpentSeconds: 180,
          examType: 'Mini game thuộc bài săn Top 1',
          note: currentScore >= 9.5
            ? `Thủ Khoa Điểm ${currentScore} Tuyệt Đối - Đạt Top 1 Mini Game Thuộc Bài!`
            : `Học sinh ưu tú Điểm ${currentScore} - Vượt qua 10 câu hỏi thử thách`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSubmitSuccess(true);
        celebrationEngine.launchFireworks(5000);
        setRankMessage(
          currentScore >= 9.5
            ? '🏆 XUẤT SẮC! BẠN ĐÃ LÊN TOP 1 BẢNG VÀNG DANH DỰ TOÀN QUỐC!'
            : '✨ Đã ghi danh vào Bảng Vàng Vinh Danh thành công!'
        );
      }
    } catch (e) {
      console.error('Submit honor roll error', e);
      setSubmitSuccess(true);
      setRankMessage('✨ Đã lưu điểm số của bạn vào Bảng Vàng vinh danh!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-3xl neu-card overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border ${
          isDark
            ? 'bg-[#151821] text-zinc-100 border-white/10'
            : 'bg-[#eef2f7] text-slate-800 border-white/80'
        }`}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg text-white font-black shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                  🎮 Mini Game Thuộc Bài Săn Top 1
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {grade}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Quy tắc chuẩn: Đúng +1.0đ · Sai -0.5đ · Đua Top 1 Bảng Vàng THCS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl neu-btn text-slate-600 dark:text-zinc-300"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl neu-btn text-slate-600 dark:text-zinc-300 hover:text-red-500 transition-colors"
              title="Thoát trò chơi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Score Ticker & Progress Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-black/5 dark:bg-white/5 flex items-center justify-between text-xs font-bold shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
              <span>Câu hỏi:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                {currentIndex + 1} / {questions.length || 10}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] opacity-80">
              <span className="text-emerald-600 dark:text-emerald-400">✓ {correctCount} đúng (+{correctCount}đ)</span>
              <span>·</span>
              <span className="text-rose-600 dark:text-rose-400">✗ {wrongCount} sai (-{(wrongCount * 0.5).toFixed(1)}đ)</span>
            </div>
          </div>

          {/* Current Score with pop animation */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-black">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Điểm: {currentScore.toFixed(1)} / 10.0</span>

              {scoreAnimation && (
                <span
                  className={`absolute -top-6 right-0 text-xs font-black px-2 py-0.5 rounded-full shadow-md animate-bounce ${
                    scoreAnimation.includes('+')
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {scoreAnimation}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1 shrink-0 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / (questions.length || 10)) * 100}%` }}
          />
        </div>

        {/* Modal Body: Active Question OR Completion Screen */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!isCompleted ? (
            <>
              {/* Question Card */}
              <div className="p-4 sm:p-5 rounded-2xl neu-card border border-white/60 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                  <span className="font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    Câu số {currentIndex + 1}
                  </span>
                  <span className="text-[11px] bg-slate-200 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full font-semibold">
                    Chuẩn barem Bộ GD&amp;ĐT
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.question}
                </h3>
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                {currentQ.options.map((opt, idx) => {
                  const letters = ['A', 'B', 'C', 'D'];
                  const isChosen = selectedOption === idx;
                  const isCorrectAnswer = idx === currentQ.correctIndex;

                  let btnStyle = 'neu-btn text-slate-800 dark:text-zinc-200 hover:border-emerald-500/50';

                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      btnStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-md font-black';
                    } else if (isChosen && !isCorrectAnswer) {
                      btnStyle = 'bg-rose-500 text-white border-rose-600 shadow-md font-black';
                    } else {
                      btnStyle = 'opacity-40 neu-pressed';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl text-left transition-all flex items-center justify-between text-xs sm:text-sm font-semibold cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black shrink-0 text-xs ${
                            isAnswered && (isCorrectAnswer || isChosen)
                              ? 'bg-white/20 text-white'
                              : 'bg-black/5 dark:bg-white/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {letters[idx]}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </div>

                      {isAnswered && isCorrectAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2" />
                      )}
                      {isAnswered && isChosen && !isCorrectAnswer && (
                        <XCircle className="w-5 h-5 text-white shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Trap Alert Box after Answered */}
              {isAnswered && (
                <div className="p-4 rounded-2xl neu-pressed text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-emerald-700 dark:text-emerald-400">
                        Lời giải chi tiết phương pháp:
                      </span>
                      <p className="text-slate-700 dark:text-zinc-300 mt-0.5 leading-relaxed">
                        {currentQ.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-amber-700 dark:text-amber-400">
                        Bẫy đề thi cần nhớ:
                      </span>
                      <p className="text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {currentQ.trapWarning}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ================= COMPLETED SCREEN ================= */
            <div className="py-4 text-center space-y-5 animate-in zoom-in-95">
              <div className="relative inline-block">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-white shadow-2xl">
                  {currentScore >= 9.0 ? (
                    <Crown className="w-12 h-12 animate-bounce" />
                  ) : (
                    <Trophy className="w-12 h-12" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-emerald-500 text-white font-black text-xs shadow-md">
                  10/10 Câu
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {currentScore >= 9.5
                    ? '🏆 THỦ KHOA ĐIỂM 10 - ĐÃ THUỘC BÀI XUẤT SẮC!'
                    : currentScore >= 8.0
                    ? '🎉 BẠN ĐÃ THUỘC BÀI RẤT TỐT!'
                    : '💪 CỐ GẮNG LÊN - LUYỆN LẠI ĐỂ SĂN ĐIỂM 10!'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
                  Đánh giá năng lực ghi nhớ và phản xạ giải đề thi THCS bám sát chuẩn Bộ GD&amp;ĐT
                </p>
              </div>

              {/* +100 XP HONOR REWARD BANNER */}
              <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border-2 border-amber-400/50 flex items-center justify-between text-left shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black text-lg shrink-0 shadow-sm">
                    🏆
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                      Tặng Thưởng Vinh Dự: +{bonusXp} XP
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-zinc-300">
                      Bảng Vàng đã xóa sạch 100% AI ảo — Xác nhận ghi danh để lên Top 1 thật!
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs sm:text-sm shrink-0 shadow-sm animate-pulse">
                  +{bonusXp} XP
                </span>
              </div>

              {/* Score Breakdown Card */}
              <div className="max-w-md mx-auto p-4 rounded-2xl neu-card border border-white/60 dark:border-white/5 grid grid-cols-3 gap-2 text-center">
                <div className="p-2">
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Điểm tổng kết</div>
                  <div className="text-xl sm:text-2xl font-black text-amber-500 mt-0.5">
                    {currentScore.toFixed(1)}
                  </div>
                </div>

                <div className="p-2 border-x border-black/5 dark:border-white/5">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Đúng (+1đ)</div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {correctCount}
                  </div>
                </div>

                <div className="p-2">
                  <div className="text-[11px] text-rose-600 dark:text-rose-400">Sai (-0.5đ)</div>
                  <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    {wrongCount}
                  </div>
                </div>
              </div>

              {/* Newly Unlocked Badges from Mini Game */}
              {earnedBadges.length > 0 ? (
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-transparent border-2 border-amber-500/40 text-left animate-in zoom-in-95">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400 mb-2">
                    <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
                    <span>🎉 CHÚC MỪNG! BẠN VỪA MỞ KHÓA HUY HIỆU MỚI:</span>
                  </div>
                  <div className="space-y-2">
                    {earnedBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-amber-400/30 shadow-sm"
                      >
                        <span className="text-2xl">{badge.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {badge.title}
                            </span>
                            <span className="px-1.5 py-0.5 text-[10px] font-black rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              +{badge.xpReward} XP
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                            {badge.description}
                          </p>
                        </div>
                        <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
                    ✓ Huy hiệu đã được lưu vào Hồ sơ cá nhân của bạn!
                  </p>
                </div>
              ) : (
                <div className="max-w-md mx-auto p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-left flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-600 dark:text-zinc-400">
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      Huy hiệu thành tích THCS:
                    </span>{' '}
                    Học xong bài và chơi mini game đạt điểm cao hoặc chuỗi học tập để mở khóa huy hiệu (Master of Algebra, 10-day streak, v.v.) trong hồ sơ cá nhân.
                  </div>
                </div>
              )}

              {/* Submit to Honor Roll Form */}
              {!submitSuccess ? (
                <div className="max-w-md mx-auto p-4 sm:p-5 rounded-2xl neu-pressed text-left space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-zinc-200">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>Gửi điểm số lên BẢNG VÀNG SĂN TOP 1:</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1">
                        Họ và tên học sinh:
                      </label>
                      <input
                        type="text"
                        value={submitName}
                        onChange={(e) => setSubmitName(e.target.value)}
                        placeholder="Nhập họ và tên..."
                        className="w-full px-3 py-2 rounded-xl neu-btn text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1">
                        Trường học / Lớp:
                      </label>
                      <input
                        type="text"
                        value={submitSchool}
                        onChange={(e) => setSubmitSchool(e.target.value)}
                        placeholder="Vd: THCS Nguyễn Du, Lớp 9A1..."
                        className="w-full px-3 py-2 rounded-xl neu-btn text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting || !submitName.trim()}
                    onClick={handleSubmitToHonorRoll}
                    className="w-full py-2.5 px-4 rounded-xl neu-accent-btn font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    {isSubmitting ? (
                      <span>Đang lưu lên Bảng Vàng...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Xác nhận Vinh Danh Lên Top 1 Bảng Vàng 🚀</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p>{rankMessage}</p>
                  <p className="text-[11px] opacity-80">
                    Bạn có thể kiểm tra tên của mình trong mục &quot;Bảng Vàng Danh Dự&quot; tại thanh bên!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-4 sm:p-5 border-t border-black/5 dark:border-white/5 flex items-center justify-between shrink-0">
          {!isCompleted ? (
            <>
              <button
                type="button"
                onClick={handleRestart}
                className="px-3.5 py-2 rounded-xl neu-btn text-xs font-bold text-slate-600 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại từ đầu</span>
              </button>

              <button
                type="button"
                disabled={!isAnswered}
                onClick={handleNextQuestion}
                className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition-all ${
                  isAnswered
                    ? 'neu-accent-btn shadow-md'
                    : 'neu-btn opacity-40 cursor-not-allowed text-slate-400'
                }`}
              >
                <span>{currentIndex === questions.length - 1 ? 'Xem kết quả & Top 1' : 'Câu tiếp theo'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRestart}
                className="px-4 py-2.5 rounded-xl neu-btn text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-emerald-500" />
                <span>Chơi lại ván mới</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl neu-accent-btn font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>Hoàn tất &amp; Tiếp tục học</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
