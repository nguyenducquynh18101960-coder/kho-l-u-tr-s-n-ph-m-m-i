import React, { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';
import {
  Compass,
  Code2,
  Copy,
  Check,
  Download,
  Loader2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { GradeLevel } from '../types';

interface DiagramCodeStudioProps {
  currentGrade: GradeLevel;
  isDark?: boolean;
}

interface GeneratedDiagramResult {
  title: string;
  subject: string;
  primaryFormat: 'svg' | 'mermaid';
  svgCode: string;
  mermaidCode: string;
  explanation: string;
  keyFormulas: string[];
}

export const DiagramCodeStudio: React.FC<DiagramCodeStudioProps> = ({
  currentGrade,
  isDark = false,
}) => {
  const mermaidContainerId = useId().replace(/:/g, '_');
  const [subject, setSubject] = useState<string>('Toán Hình Học');
  const [preferredFormat, setPreferredFormat] = useState<'auto' | 'svg' | 'mermaid'>('auto');
  const [prompt, setPrompt] = useState<string>(
    'Tam giác nhọn ABC nội tiếp đường tròn (O), đường cao AH và tiếp tuyến Ax tại A'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagram, setDiagram] = useState<GeneratedDiagramResult | null>(null);
  const [viewMode, setViewMode] = useState<'svg' | 'mermaid'>('svg');
  const [mermaidSvgHtml, setMermaidSvgHtml] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const subjects = [
    'Toán Hình Học',
    'Đồ Thị Hàm Số',
    'Vật Lý (Mạch Điện & Quang)',
    'Hóa Học (Nguyên Tử & Phản Ứng)',
    'Sơ Đồ Quy Trình (Mermaid)',
  ];

  const presets = [
    {
      subject: 'Toán Hình Học',
      format: 'svg' as const,
      prompt: 'Tam giác nhọn ABC nội tiếp đường tròn (O), vẽ ba đường cao AD, BE, CF cắt nhau tại trực tâm H',
    },
    {
      subject: 'Đồ Thị Hàm Số',
      format: 'svg' as const,
      prompt: 'Hệ trục tọa độ Oxy vẽ đồ thị Parabol (P): y = x² và đường thẳng (d): y = x + 2 cắt nhau tại hai điểm A, B',
    },
    {
      subject: 'Vật Lý (Mạch Điện & Quang)',
      format: 'svg' as const,
      prompt: 'Sơ đồ mạch điện gồm nguồn pin, khóa K đóng, Ampe kế nối tiếp hai điện trở R1 và R2 mắc song song kèm Vôn kế',
    },
    {
      subject: 'Hóa Học (Nguyên Tử & Phản Ứng)',
      format: 'svg' as const,
      prompt: 'Mô hình cấu tạo nguyên tử Carbon (Z=6, 2 lớp electron) và phân tử Methane CH4',
    },
    {
      subject: 'Sơ Đồ Quy Trình (Mermaid)',
      format: 'mermaid' as const,
      prompt: 'Sơ đồ thuật toán giải phương trình bậc hai ax² + bx + c = 0 bằng biệt thức Delta',
    },
  ];

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'strict',
    });
  }, []);

  useEffect(() => {
    let active = true;
    const renderMermaid = async () => {
      if (!diagram?.mermaidCode || viewMode !== 'mermaid') {
        setMermaidSvgHtml('');
        return;
      }
      try {
        const { svg } = await mermaid.render(`mmd_${mermaidContainerId}_${Date.now()}`, diagram.mermaidCode);
        if (active) setMermaidSvgHtml(svg);
      } catch (e) {
        console.warn('Mermaid render fallback to SVG:', e);
        if (active && diagram.svgCode) {
          setViewMode('svg');
        }
      }
    };
    renderMermaid();
    return () => {
      active = false;
    };
  }, [diagram, viewMode, mermaidContainerId]);

  const handleGenerate = async (overridePrompt?: string, overrideSubject?: string, overrideFormat?: 'auto' | 'svg' | 'mermaid') => {
    const p = (overridePrompt ?? prompt).trim();
    if (!p || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: p,
          subject: overrideSubject ?? subject,
          preferredFormat: overrideFormat ?? preferredFormat,
          grade: currentGrade,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.diagram) {
        setError(data.error || 'Không thể sinh mã hình vẽ.');
        return;
      }
      setDiagram(data.diagram);
      setViewMode(data.diagram.primaryFormat === 'mermaid' && data.diagram.mermaidCode ? 'mermaid' : 'svg');
      setZoom(1);
    } catch (e: any) {
      setError(e?.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const activeSvgMarkup = viewMode === 'mermaid' && mermaidSvgHtml ? mermaidSvgHtml : diagram?.svgCode || '';

  const handleDownloadSvg = () => {
    if (!activeSvgMarkup) return;
    const blob = new Blob([activeSvgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `max10-diagram-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!activeSvgMarkup) return;
    const svgBlob = new Blob([activeSvgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `max10-hinh-chuan-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleCopyCode = () => {
    const codeToCopy = viewMode === 'mermaid' ? diagram?.mermaidCode || '' : diagram?.svgCode || '';
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Controls */}
      <div className="lg:col-span-5 space-y-4">
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Dựng bằng mã SVG & Mermaid.js — Chính xác 100%, không dùng AI vẽ ảnh mờ</span>
          </div>

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Chọn môn học / Loại hình vẽ
          </label>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {subjects.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubject(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  subject === sub
                    ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                    : isDark
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Mô tả hình học, đồ thị, mạch điện hoặc quy trình ({currentGrade})
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Ví dụ: Vẽ hình thang cân ABCD (AB // CD), hai đường chéo AC và BD cắt nhau tại O..."
            className={`w-full p-3 rounded-xl text-sm border resize-none focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
              isDark
                ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Định dạng ưu tiên:</span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-black/5 dark:bg-white/5">
              {(['auto', 'svg', 'mermaid'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setPreferredFormat(fmt)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                    preferredFormat === fmt
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {fmt === 'auto' ? 'Tự động' : fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={!prompt.trim() || loading}
            className={`mt-4 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !prompt.trim() || loading
                ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md'
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
            <span>{loading ? 'Đang lập trình hình vẽ vector chính xác...' : 'Dựng Hình Vector Chuẩn 100%'}</span>
          </button>
        </div>

        {/* Presets */}
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Mẫu bài Toán / Lý / Hóa chuẩn xác</span>
          </div>
          <div className="space-y-1.5">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSubject(preset.subject);
                  setPreferredFormat(preset.format);
                  setPrompt(preset.prompt);
                  handleGenerate(preset.prompt, preset.subject, preset.format);
                }}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800/70 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-sky-600 dark:text-sky-400 text-[11px]">{preset.subject}</div>
                <div className="line-clamp-1 mt-0.5">{preset.prompt}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Vector Stage */}
      <div className="lg:col-span-7 space-y-4">
        <div
          className={`p-4 md:p-5 rounded-2xl border min-h-[460px] flex flex-col justify-between ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold mb-3">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 space-y-3">
              <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
              <div className="font-bold text-sm">Đang tính toán tọa độ & viết mã SVG / Mermaid.js...</div>
              <p className="text-xs text-slate-400 max-w-xs">
                Đảm bảo góc vuông, điểm tiếp tuyến, trục số và ký hiệu hóa học sắc nét tuyệt đối.
              </p>
            </div>
          ) : diagram ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base">{diagram.title}</h3>
                  <div className="text-xs text-slate-400">
                    {diagram.subject} · Chuẩn vector sắc nét vô hạn
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {diagram.svgCode && diagram.mermaidCode && (
                    <div className="flex items-center p-1 rounded-lg bg-black/5 dark:bg-white/5 mr-1">
                      <button
                        type="button"
                        onClick={() => setViewMode('svg')}
                        className={`px-2 py-1 rounded text-xs font-bold cursor-pointer ${
                          viewMode === 'svg' ? 'bg-sky-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        SVG
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('mermaid')}
                        className={`px-2 py-1 rounded text-xs font-bold cursor-pointer ${
                          viewMode === 'mermaid' ? 'bg-sky-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        Mermaid
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
                    className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Thu nhỏ"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Đặt lại tỷ lệ"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)))}
                    className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Phóng to"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Vector Render Box */}
              <div className="rounded-2xl overflow-auto border border-slate-700/60 bg-[#0f172a] p-4 flex items-center justify-center min-h-[320px] max-h-[460px]">
                <div
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                  className="transition-transform duration-150 w-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: activeSvgMarkup }}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>{showCode ? 'Ẩn mã nguồn' : 'Xem mã SVG / Mermaid'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Đã sao chép mã' : 'Sao chép mã'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSvg}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải SVG</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải PNG nét cao</span>
                  </button>
                </div>
              </div>

              {showCode && (
                <pre className="p-3 rounded-xl bg-slate-950 text-sky-300 text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                  {viewMode === 'mermaid' ? diagram.mermaidCode : diagram.svgCode}
                </pre>
              )}

              {/* Explanation & Key Formulas */}
              {(diagram.explanation || diagram.keyFormulas.length > 0) && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    isDark ? 'bg-zinc-850/60 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {diagram.explanation && <p className="leading-relaxed">{diagram.explanation}</p>}
                  {diagram.keyFormulas.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {diagram.keyFormulas.map((f, i) => (
                        <span key={i} className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
                          • {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-slate-400">
              <Compass className="w-12 h-12 text-sky-500/70 mb-3" />
              <div className="font-bold text-sm text-slate-700 dark:text-zinc-200">
                Xưởng Hình Học & Sơ Đồ Chuẩn Xác 100%
              </div>
              <p className="text-xs max-w-sm mt-1">
                Chọn mẫu bên trái hoặc nhập bài toán Hình học, Đồ thị hàm số, Mạch điện Vật lý, Cấu tạo Hóa học để AI xuất mã SVG/Mermaid sắc nét.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
