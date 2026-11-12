import React from 'react';
import { GradeLevel, SubjectInfo } from '../types';
import { GRADES, SUBJECTS } from '../data/subjects';
import { 
  Sparkles, 
  GraduationCap, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  BookMarked, 
  CalendarCheck2 
} from 'lucide-react';

interface HeaderProps {
  currentGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  currentSubject?: SubjectInfo;
  onSelectSubject?: (subject: SubjectInfo) => void;
  activeTab: 'chat' | 'exam' | 'grade' | 'tips' | 'plan';
  onSelectTab: (tab: 'chat' | 'exam' | 'grade' | 'tips' | 'plan') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentGrade,
  onSelectGrade,
  activeTab,
  onSelectTab,
}) => {
  const [copiedLink, setCopiedLink] = React.useState(false);
  const appUrl = "https://ais-pre-vnf6pultt3mbsewyewcrws-816343972167.asia-east1.run.app";

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner: Brand and Author & Grade Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-md border border-indigo-200 shrink-0">
              <img
                src="/max10-avatar.jpg"
                alt="Max10 Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Max10
                  </span>
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-500 fill-emerald-400" />
                  Tự động giải mọi môn học
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Tác giả: <strong>Duy 9D4 (học sinh Cô Thủy)</strong>
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
                Chỉ cần gõ câu lệnh hoặc bài tập bất kỳ (Toán, Văn, Anh, KHTN, Lý, Hóa, Sinh, Sử, Địa...), AI sẽ tự động giải chi tiết từng bước!
              </p>
            </div>
          </div>

          {/* Link Test & Grade Selector */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all"
              title="Bấm để sao chép link website"
            >
              <span>🔗 Link web thử nghiệm:</span>
              <span className="font-mono underline">{copiedLink ? 'Đã sao chép! ✓' : 'Sao chép link'}</span>
            </button>

            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              <span className="text-xs font-medium text-slate-500 px-2 hidden sm:inline">Khối lớp:</span>
              {GRADES.map((grade) => {
                const isSelected = currentGrade === grade;
                return (
                  <button
                    key={grade}
                    onClick={() => onSelectGrade(grade)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom: Main Feature Navigation Tabs (Subject bar removed) */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => onSelectTab('chat')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'chat'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Gia Sư Giải Bài Điểm 10</span>
          </button>

          <button
            onClick={() => onSelectTab('exam')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'exam'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Luyện Đề Săn Điểm 10</span>
          </button>

          <button
            onClick={() => onSelectTab('grade')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'grade'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Sửa Bài & Nâng Cấp Điểm</span>
          </button>

          <button
            onClick={() => onSelectTab('tips')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'tips'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Cẩm Nang & Bẫy Đề Thi</span>
          </button>

          <button
            onClick={() => onSelectTab('plan')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'plan'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Lộ Trình Cả Năm</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
