import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Download,
  BookOpen,
  Award,
  Layers,
  GraduationCap,
  RefreshCw,
  Send,
  Printer,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Zap,
  Crown,
  QrCode,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { GradeLevel } from '../../types';
import { TeacherAccountInfo, TeacherLectureItem } from './TeacherChatView';

interface TeacherAiMaterialStudioProps {
  loggedInTeacher: TeacherAccountInfo | null;
  currentGrade: GradeLevel;
  isDark: boolean;
  subscriptionPlan?: 'free' | 'plus' | 'premium';
  onOpenPricingModal?: (plan?: 'plus' | 'premium', step?: 'plans' | 'checkout') => void;
  onPublishToLectures?: (lecture: {
    title: string;
    subject: string;
    grade: string;
    summary: string;
    content: string;
  }) => void;
}

interface MaterialTypeConfig {
  id: string;
  label: string;
  icon: any;
  desc: string;
  color: string;
}

const MATERIAL_TYPES: MaterialTypeConfig[] = [
  {
    id: 'lesson_plan_5512',
    label: 'Giáo Án Chuẩn Công Văn 5512',
    icon: FileText,
    desc: 'Kế hoạch bài dạy 4 hoạt động: Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng.',
    color: 'from-indigo-600 to-blue-600',
  },
  {
    id: 'exam_matrix',
    label: 'Ma Trận & Đề Thi Kèm Biểu Điểm',
    icon: Layers,
    desc: 'Bảng ma trận đặc tả 4 mức độ tư duy + Đề trắc nghiệm & tự luận + Barem chi tiết.',
    color: 'from-amber-600 to-orange-600',
  },
  {
    id: 'worksheet',
    label: 'Phiếu Bài Tập Phân Hóa 4 Mức Độ',
    icon: BookOpen,
    desc: 'Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao / Săn điểm 10 có lời giải & bẫy sai.',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'teaching_slides',
    label: 'Đề Cương Slide Bài Giảng Tương Tác',
    icon: Sparkles,
    desc: 'Dàn ý slide sinh động, kịch bản thuyết minh, trò chơi tương tác khởi động đầu giờ.',
    color: 'from-purple-600 to-pink-600',
  },
  {
    id: 'remedial_guide',
    label: 'Chuyên Đề Bồi Dưỡng HSG & Phụ Đạo',
    icon: Award,
    desc: 'Gỡ rối cho học sinh yếu kém và kỹ thuật nâng cao dành cho học sinh mũi nhọn điểm 10.',
    color: 'from-rose-600 to-red-600',
  },
];

const SAMPLE_TOPICS = [
  { subject: 'Toán học', grade: 'Lớp 9', topic: 'Hệ thức Vi-ét và các ứng dụng giải bẫy đề thi' },
  { subject: 'Khoa học Tự nhiên', grade: 'Lớp 9', topic: 'Khúc xạ ánh sáng và bài tập thấu kính hội tụ' },
  { subject: 'Ngữ văn', grade: 'Lớp 9', topic: 'Kỹ năng viết đoạn văn nghị luận xã hội về lối sống biết ơn' },
  { subject: 'Tiếng Anh', grade: 'Lớp 9', topic: 'Cấu trúc câu điều kiện loại 1 & 2 và dạng bài tập đảo ngữ' },
];

export const TeacherAiMaterialStudio: React.FC<TeacherAiMaterialStudioProps> = ({
  loggedInTeacher,
  currentGrade,
  isDark,
  onPublishToLectures,
}) => {
  const [selectedType, setSelectedType] = useState<string>('lesson_plan_5512');
  const [subject, setSubject] = useState<string>(loggedInTeacher?.subject || 'Toán học');
  const [grade, setGrade] = useState<string>(currentGrade.includes('Lớp') ? currentGrade : 'Lớp 9');
  const [topic, setTopic] = useState<string>('Hệ thức Vi-ét và các ứng dụng trong phương trình bậc hai');
  const [customReq, setCustomReq] = useState<string>(
    'Thời lượng 2 tiết. Chú trọng phát triển năng lực tự học của học sinh, có bài toán thực tế và chỉ rõ các lỗi sai thường gặp khi đi thi.'
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<{
    title: string;
    content: string;
    materialType: string;
    generatedAt: string;
  } | null>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [published, setPublished] = useState<boolean>(false);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setCopied(false);
    setPublished(false);

    try {
      const res = await fetch('/api/teachers/ai-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialType: selectedType,
          subject,
          grade,
          topic,
          customRequirements: customReq,
          teacherName: loggedInTeacher?.name || 'Thầy/Cô giáo',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGeneratedResult({
            title: data.title,
            content: data.content,
            materialType: data.materialType,
            generatedAt: data.generatedAt,
          });
        }
      }
    } catch (err) {
      console.error('Lỗi khi gọi AI soạn tài liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadDoc = () => {
    if (!generatedResult) return;
    const blob = new Blob([generatedResult.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTopic = topic.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_').slice(0, 30);
    link.download = `Tai_Lieu_${subject}_${grade}_${safeTopic}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePublishAsLecture = () => {
    if (!generatedResult || !onPublishToLectures) return;
    onPublishToLectures({
      title: generatedResult.title,
      subject,
      grade,
      summary: `Tài liệu sư phạm chuyên môn: ${topic} dành cho các em học sinh ôn tập chuẩn điểm 10.`,
      content: generatedResult.content,
    });
    setPublished(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent h-full overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* 1. Header Banner */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border ${
          isDark
            ? 'bg-zinc-900/90 border-zinc-800'
            : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-indigo-100'
        } shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-amber-300 flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
                AI Trợ Lý Soạn Thảo Tài Liệu Dạy Học Cho Giáo Viên
              </h2>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-500/30">
                Chuẩn GDPT 2026 & Công Văn 5512
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
              Tạo ngay Kế hoạch bài dạy (Giáo án 5512), Ma trận đề kiểm tra, Phiếu bài tập phân hóa và Kịch bản slide chỉ trong vài giây.
            </p>
          </div>
        </div>

        {loggedInTeacher && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-800 dark:text-zinc-200">
              {loggedInTeacher.name} ({loggedInTeacher.subject})
            </span>
          </div>
        )}
      </div>

      {/* 2. Choose Material Type (5 Types) */}
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-900 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-600" />
          Bước 1: Chọn loại tài liệu dạy học cần soạn
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MATERIAL_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white shadow-xs ring-2 ring-indigo-500/20'
                    : isDark
                    ? 'border-zinc-800 bg-zinc-850/60 hover:bg-zinc-800 text-zinc-300'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${type.color} text-white flex items-center justify-center shrink-0 shadow-xs`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-xs leading-snug">{type.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                    {type.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Input Parameters Form */}
      <div
        className={`p-5 rounded-3xl border ${
          isDark ? 'bg-zinc-850/70 border-zinc-800' : 'bg-white border-slate-200'
        } shadow-xs space-y-4`}
      >
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-zinc-800">
          <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            Bước 2: Điền thông tin chuyên đề & bài dạy
          </h3>
          <span className="text-[11px] text-slate-400">AI hỗ trợ miễn phí 100% cho Giáo viên</span>
        </div>

        {/* Quick Sample Topics */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">
            Gợi ý chuyên đề hay có sẵn:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_TOPICS.map((samp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSubject(samp.subject);
                  setGrade(samp.grade);
                  setTopic(samp.topic);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                  topic === samp.topic
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                    : isDark
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                📚 {samp.subject} ({samp.grade}): {samp.topic.slice(0, 32)}...
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold block mb-1 text-slate-700 dark:text-zinc-300">
                Môn học giảng dạy *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Toán học / Khoa học Tự nhiên / Ngữ văn..."
                className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-hidden ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1 text-slate-700 dark:text-zinc-300">
                Khối lớp giảng dạy *
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-hidden cursor-pointer ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="Lớp 6">Lớp 6</option>
                <option value="Lớp 7">Lớp 7</option>
                <option value="Lớp 8">Lớp 8</option>
                <option value="Lớp 9">Lớp 9 (Luyện thi vào 10)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1 text-slate-700 dark:text-zinc-300">
              Tên bài học / Chủ đề chuyên môn cần soạn *
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Nhập tên bài học trong SGK hoặc chủ đề chuyên đề nâng cao..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold outline-hidden ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="text-xs font-bold block mb-1 text-slate-700 dark:text-zinc-300">
              Yêu cầu sư phạm bổ sung của Thầy/Cô (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={customReq}
              onChange={(e) => setCustomReq(e.target.value)}
              placeholder="Ví dụ: Thời lượng 2 tiết; Tích hợp STEM; Đưa vào các bẫy sai học sinh hay mất điểm; Rèn luyện năng lực giải quyết vấn đề..."
              className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-hidden leading-relaxed ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Đang Soạn Thảo Tài Liệu Chuẩn Sư Phạm... Xin Chờ Trong Giây Lát...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI Soạn Thảo Tài Liệu Dạy Học Ngay</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 4. Generated Output Preview & Download */}
      {generatedResult && (
        <div
          className={`p-5 sm:p-6 rounded-3xl border ${
            isDark ? 'bg-zinc-850/80 border-zinc-800' : 'bg-white border-slate-200'
          } shadow-sm space-y-4`}
        >
          {/* Header of the document */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {subject} • {grade} • {generatedResult.generatedAt}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100 mt-2">
                {generatedResult.title}
              </h3>
            </div>

            {/* Actions: Copy, Download, Publish */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadDoc}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải File Word (.doc)</span>
              </button>

              {onPublishToLectures && (
                <button
                  type="button"
                  onClick={handlePublishAsLecture}
                  disabled={published}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 text-white shadow-xs cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{published ? 'Đã đăng bài giảng!' : 'Đăng thành Bài Giảng học sinh'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Markdown Content Viewer */}
          <div
            className={`p-4 sm:p-6 rounded-2xl border ${
              isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100' : 'bg-slate-50/60 border-slate-200 text-slate-800'
            } max-h-[600px] overflow-y-auto leading-relaxed text-xs sm:text-sm`}
          >
            <div className="markdown-body prose dark:prose-invert max-w-none">
              <Markdown>{generatedResult.content}</Markdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
