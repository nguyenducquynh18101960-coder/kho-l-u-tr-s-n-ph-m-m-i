import React, { useState, useRef } from 'react';
import { GradeLevel, SubjectInfo, GradeResult } from '../types';
import Markdown from 'react-markdown';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  BookOpen,
  Image as ImageIcon,
  X,
  RefreshCw,
  Copy,
  Check,
  Award,
} from 'lucide-react';

interface EssayGraderProps {
  currentGrade: GradeLevel;
  currentSubject: SubjectInfo;
}

export const EssayGrader: React.FC<EssayGraderProps> = ({
  currentGrade,
  currentSubject,
}) => {
  const [promptText, setPromptText] = useState('');
  const [studentWork, setStudentWork] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [copiedModel, setCopiedModel] = useState(false);

  const [attachedImage, setAttachedImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setAttachedImage({
        data: res.split(',')[1],
        mimeType: file.type,
        previewUrl: res,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGrade = async () => {
    if (!studentWork.trim() && !attachedImage) {
      alert('Em hãy nhập bài làm hoặc tải ảnh bài viết/bài giải lên nhé!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/grade/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: currentGrade,
          subject: currentSubject.name,
          promptText,
          studentWork,
          image: attachedImage
            ? { data: attachedImage.data, mimeType: attachedImage.mimeType }
            : null,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setResult(data.result);
      } else {
        throw new Error(data.error || 'Không thể chấm bài');
      }
    } catch (err: any) {
      alert(`⚠️ Lỗi chấm bài: ${err.message || 'Vui lòng thử lại.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyModel = () => {
    if (!result?.perfectSampleModel) return;
    navigator.clipboard.writeText(result.perfectSampleModel);
    setCopiedModel(true);
    setTimeout(() => setCopiedModel(false), 2000);
  };

  // Sample templates for quick testing
  const loadSample = () => {
    if (currentSubject.id === 'van') {
      setPromptText('Viết đoạn văn khoảng 200 chữ trình bày suy nghĩ của em về ý chí vượt khó của tuổi trẻ.');
      setStudentWork(`Trong cuộc sống, ý chí vượt khó là phẩm chất rất quan trọng đối với mỗi người học sinh. Người có ý chí sẽ không sợ gian nan thử thách, luôn cố gắng học tập tốt để có tương lai sáng lạn. Ví dụ như thầy giáo Nguyễn Ngọc Ký dù bị liệt hai tay vẫn kiên trì tập viết bằng chân và trở thành người có ích cho xã hội. Ngược lại, nếu không có ý chí, chúng ta sẽ dễ dàng gục ngã trước khó khăn. Tóm lại, tuổi trẻ cần phải rèn luyện ý chí ngay từ trên ghế nhà trường.`);
    } else if (currentSubject.id === 'toan') {
      setPromptText('Giải phương trình: x² - 5x + 6 = 0 và tìm m để phương trình x² - 2mx + m² - 1 = 0 có hai nghiệm phân biệt x1, x2 thỏa mãn x1² + x2² = 10.');
      setStudentWork(`Câu 1: x² - 5x + 6 = 0 <=> (x - 2)(x - 3) = 0 => x = 2 hoặc x = 3.
Câu 2: Phương trình x² - 2mx + m² - 1 = 0.
Delta' = m² - (m² - 1) = 1 > 0 với mọi m. Nên pt luôn có 2 nghiệm phân biệt.
Theo Vi-et: x1 + x2 = 2m; x1*x2 = m² - 1.
x1² + x2² = (x1+x2)² - 2x1x2 = 4m² - 2(m²-1) = 2m² + 2.
Theo đề bài: 2m² + 2 = 10 => 2m² = 8 => m² = 4 => m = 2 hoặc m = -2.`);
    } else {
      setPromptText('Write a short paragraph (80-100 words) about how to protect the environment at school.');
      setStudentWork('We need to protect the environment at school because it is very dirty. We should plant more trees and flowers in the school garden. Students should not litter on the playground and put trash in the bins. We can turn off the lights and fans when leaving the classroom to save energy. In conclusion, protecting the school environment is good.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-6 px-4">
      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Sửa Bài & Nâng Cấp Điểm 10 Tuyệt Đối
              </h2>
              <p className="text-sm text-slate-500">
                Chấm điểm theo barem Bộ GD&ĐT, chỉ rõ từng điểm trừ nhỏ và cung cấp bài mẫu 10/10 xuất sắc.
              </p>
            </div>
          </div>

          <button
            onClick={loadSample}
            type="button"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors self-start sm:self-auto"
          >
            📋 Điền bài mẫu thử nghiệm
          </button>
        </div>

        {/* Input fields */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Đề bài / Câu hỏi (Tùy chọn nếu đã có trong bài làm/ảnh):
            </label>
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Ví dụ: Đề bài kiểm tra 1 tiết, đề thi thử, đề viết văn..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Bài làm của em (Lời giải toán / Đoạn văn / Bài tập):
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Tải ảnh vở / bài viết
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            {attachedImage && (
              <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between max-w-md">
                <div className="flex items-center gap-2">
                  <img
                    src={attachedImage.previewUrl}
                    alt="Ảnh bài làm"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-700">Đã đính kèm ảnh bài giải</span>
                </div>
                <button
                  onClick={() => setAttachedImage(null)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <textarea
              value={studentWork}
              onChange={(e) => setStudentWork(e.target.value)}
              placeholder="Dán hoặc gõ nội dung bài làm của em vào đây..."
              rows={6}
              className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono sm:font-sans leading-relaxed"
            />
          </div>

          <button
            onClick={handleGrade}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Giám khảo AI đang chấm từng chi tiết...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Chấm Điểm & Chỉ Cách Lấy Điểm 10</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Section */}
      {result && (
        <div className="space-y-6">
          {/* Score Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-white shadow-md text-2xl font-extrabold">
                {result.score}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Điểm ước tính theo barem
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {result.rating}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thang điểm 10 chuẩn Bộ GD&ĐT ({currentSubject.name} - {currentGrade})
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 max-w-sm">
              <span className="font-bold block mb-0.5">Lời nhắn từ giám khảo:</span>
              {result.encouragement}
            </div>
          </div>

          {/* Strengths & Traps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-xs">
              <h4 className="flex items-center gap-2 font-bold text-sm text-emerald-800 uppercase tracking-wider mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ưu Điểm Nổi Bật
              </h4>
              <ul className="space-y-2">
                {result.strengths.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Flaws and Lost Points Traps */}
            <div className="bg-white rounded-2xl border border-rose-200/80 p-5 shadow-xs">
              <h4 className="flex items-center gap-2 font-bold text-sm text-rose-800 uppercase tracking-wider mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Lỗi Khiến Mất Điểm 10
              </h4>
              <ul className="space-y-2">
                {result.weaknessesAndTraps.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Upgrade Steps */}
          <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-xs">
            <h4 className="flex items-center gap-2 font-bold text-base text-indigo-900 mb-3">
              <ArrowUpRight className="w-5 h-5 text-indigo-600" />
              Các Bước Nâng Cấp Lên Điểm 10 Tuyệt Đối
            </h4>
            <div className="space-y-2.5">
              {result.score10UpgradeSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-3 text-xs sm:text-sm text-indigo-950 font-medium"
                >
                  <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* The Exemplar 10/10 Model */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-base text-slate-900">
                  Bài Làm Mẫu Chuẩn Điểm 10 Hoàn Hảo (Để Học Tập)
                </h4>
              </div>

              <button
                onClick={handleCopyModel}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {copiedModel ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép bài mẫu</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm sm:text-base leading-relaxed font-serif whitespace-pre-line">
              <div className="markdown-body">
                <Markdown>{result.perfectSampleModel}</Markdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
