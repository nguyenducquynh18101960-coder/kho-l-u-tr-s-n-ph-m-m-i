import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  School,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import Markdown from 'react-markdown';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName: string;
  subject: string;
  grade: string;
  department?: string;
  topicTitle: string;
  contentMarkdown: string;
  isDark: boolean;
  onConfirmSubjectAndGrade?: (subject: string, grade: string) => void;
  isCustomTeacher?: boolean;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  teacherName,
  subject: initialSubject,
  grade: initialGrade,
  department = 'Tổ Khoa học Tự nhiên',
  topicTitle,
  contentMarkdown,
  isDark,
  onConfirmSubjectAndGrade,
  isCustomTeacher = false,
}) => {
  const [subject, setSubject] = useState<string>(initialSubject || 'Toán học');
  const [grade, setGrade] = useState<string>(initialGrade || 'Lớp 9');
  const [confirmed, setConfirmed] = useState<boolean>(!isCustomTeacher || (Boolean(initialSubject) && Boolean(initialGrade)));
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDoc = () => {
    const header = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${topicTitle}</title>
<style>
  body { font-family: 'Times New Roman', serif; line-height: 1.5; padding: 20px; }
  h1, h2, h3 { color: #111; }
  .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .header-table td { vertical-align: top; font-size: 13pt; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
</style>
</head>
<body>
<table class="header-table">
  <tr>
    <td class="center" style="width: 45%;">
      <b>SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI</b><br>
      <b>TRƯỜNG THCS NGUYỄN DU</b><br>
      <i>${department}</i>
    </td>
    <td class="center" style="width: 55%;">
      <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br>
      <b>Độc lập - Tự do - Hạnh phúc</b><br>
      ---------------------
    </td>
  </tr>
</table>

<h2 class="center bold" style="margin-top: 15px; margin-bottom: 5px;">KẾ HOẠCH BÀI DẠY (GIÁO ÁN CHUẨN CV 5512)</h2>
<p class="center" style="margin-top: 0;"><b>Môn học:</b> ${subject} | <b>Khối lớp:</b> ${grade}<br><b>Giáo viên thực hiện:</b> ${teacherName}</p>
<hr>
<div>
  ${contentMarkdown.replace(/\n/g, '<br>')}
</div>
<br><br>
<table style="width: 100%;">
  <tr>
    <td class="center" style="width: 50%;">
      <b>TỔ TRƯỞNG CHUYÊN MÔN</b><br>
      <i>(Ký và ghi rõ họ tên)</i>
    </td>
    <td class="center" style="width: 50%;">
      <b>GIÁO VIÊN BIÊN SOẠN</b><br>
      <i>(Ký và ghi rõ họ tên)</i><br><br><br><br>
      <b>${teacherName}</b>
    </td>
  </tr>
</table>
</body>
</html>`;

    const blob = new Blob([header], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PDF_GiaoAn_THCS_NguyenDu_${subject}_${grade}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      {/* Inject specialized print styles so only the official document is printed */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #official-moet-document, #official-moet-document * {
            visibility: visible;
          }
          #official-moet-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm;
            background: white !important;
            color: black !important;
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 13pt !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-slate-100 border-slate-300 text-slate-900'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              PDF
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
                <span>Xuất Bản File PDF Chuẩn Bộ GD&ĐT</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold">
                  THCS Nguyễn Du
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Định dạng chuẩn A4 • Công văn 5512/BGDĐT • Kèm chữ ký & Quốc hiệu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              title="Mở hộp thoại In / Lưu thành file PDF của trình duyệt"
            >
              <Printer className="w-4 h-4" />
              <span>In / Lưu PDF (Ctrl+P)</span>
            </button>

            <button
              onClick={handleDownloadDoc}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 text-xs font-semibold shadow-2xs cursor-pointer transition-all"
              title="Tải văn bản đính kèm Word (.doc)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Word</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step to ask custom teacher for Subject and Grade if not yet confirmed */}
        {!confirmed && (
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-xs font-medium">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="font-bold text-amber-700 dark:text-amber-300">
                  Thầy/Cô vui lòng chọn môn dạy và lớp dạy:
                </strong>{' '}
                Để lập tiêu đề và thể thức chuẩn văn bản Bộ GD&ĐT cho file PDF.
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-zinc-800 border-amber-300 dark:border-amber-700"
              >
                <option value="Khoa học Tự nhiên">Khoa học Tự nhiên</option>
                <option value="Tin học và Công nghệ">Tin học và Công nghệ</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Toán học">Toán học</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
                <option value="Giáo dục công dân">Giáo dục công dân</option>
                <option value="Nghệ thuật (Âm nhạc - Mỹ thuật)">Nghệ thuật (Âm nhạc - Mỹ thuật)</option>
              </select>

              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-zinc-800 border-amber-300 dark:border-amber-700"
              >
                <option value="Lớp 6">Lớp 6</option>
                <option value="Lớp 7">Lớp 7</option>
                <option value="Lớp 8">Lớp 8</option>
                <option value="Lớp 9">Lớp 9</option>
              </select>

              <button
                onClick={() => {
                  setConfirmed(true);
                  if (onConfirmSubjectAndGrade) {
                    onConfirmSubjectAndGrade(subject, grade);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs cursor-pointer whitespace-nowrap"
              >
                Xác nhận
              </button>
            </div>
          </div>
        )}

        {/* Document Printable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/60 dark:bg-zinc-950 flex justify-center">
          <div
            id="official-moet-document"
            ref={printRef}
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-14 shadow-xl border border-slate-300 rounded-lg text-[13pt] font-serif leading-relaxed"
          >
            {/* Header Quốc hiệu & Đơn vị Trường */}
            <div className="grid grid-cols-2 gap-4 pb-4 mb-6 border-b border-slate-300">
              <div className="text-center font-serif">
                <p className="font-bold text-xs uppercase tracking-wide text-slate-800">
                  SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI
                </p>
                <p className="font-black text-sm uppercase text-slate-900">
                  TRƯỜNG THCS NGUYỄN DU
                </p>
                <p className="text-xs italic text-slate-600">{department}</p>
                <div className="w-16 h-0.5 bg-slate-400 mx-auto my-1.5" />
                <p className="text-xs text-slate-600">
                  Số: ..... /KHBD-THCSND
                </p>
              </div>

              <div className="text-center font-serif">
                <p className="font-black text-xs uppercase text-slate-900 tracking-wide">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="font-bold text-xs text-slate-800">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <div className="w-24 h-0.5 bg-slate-400 mx-auto my-1.5" />
                <p className="text-xs italic text-slate-600">
                  Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center mb-6">
              <h1 className="text-lg sm:text-xl font-black uppercase text-slate-950 tracking-tight">
                KẾ HOẠCH BÀI DẠY (GIÁO ÁN ĐIỆN TỬ)
              </h1>
              <p className="text-xs italic text-slate-700 mt-1 font-serif">
                (Thực hiện theo Công văn số 5512/BGDĐT-GDTrH của Bộ GD&ĐT)
              </p>
              <div className="mt-3 inline-block px-4 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800">
                <span>Môn: <strong>{subject}</strong></span>
                <span className="mx-2">•</span>
                <span>Khối: <strong>{grade}</strong></span>
                <span className="mx-2">•</span>
                <span>Giáo viên: <strong>{teacherName}</strong></span>
              </div>
            </div>

            {/* Markdown Content */}
            <div className="prose max-w-none text-slate-900 text-xs sm:text-[11.5pt] leading-relaxed font-serif space-y-3">
              <Markdown>{contentMarkdown}</Markdown>
            </div>

            {/* Signatures Section */}
            <div className="grid grid-cols-2 gap-8 pt-10 mt-12 border-t border-slate-300 font-serif">
              <div className="text-center">
                <p className="font-bold text-xs uppercase text-slate-800">
                  TỔ TRƯỞNG CHUYÊN MÔN
                </p>
                <p className="text-[11px] italic text-slate-500 mb-16">
                  (Ký, phê duyệt và ghi rõ họ tên)
                </p>
                <div className="h-8" />
                <p className="font-semibold text-xs text-slate-600">
                  ................................................
                </p>
              </div>

              <div className="text-center">
                <p className="font-bold text-xs uppercase text-slate-800">
                  GIÁO VIÊN THỰC HIỆN
                </p>
                <p className="text-[11px] italic text-slate-500 mb-16">
                  (Ký và ghi rõ họ tên)
                </p>
                <div className="h-8" />
                <p className="font-black text-sm text-slate-900">
                  {teacherName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
