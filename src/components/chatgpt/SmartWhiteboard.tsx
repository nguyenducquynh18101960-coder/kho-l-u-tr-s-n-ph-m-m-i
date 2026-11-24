import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Presentation,
  Sparkles,
  GitFork,
  PenTool,
  Trash2,
  Highlighter,
  Sigma,
} from 'lucide-react';
import { formatDolaMath } from '../../utils/dolaMathFormatter';

interface SmartWhiteboardProps {
  latestAiText: string;
  subjectLabel: string;
  countryFlag?: string;
  countryName?: string;
  isDark: boolean;
  compact?: boolean;
}

interface ParsedBoardData {
  formulas: string[];
  keywords: string[];
  keySteps: string[];
  branches: Array<{ title: string; detail: string; color: string }>;
}

const BRANCH_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#a855f7'];

function parseLessonToWhiteboard(rawText: string, subjectLabel: string): ParsedBoardData {
  const formatted = formatDolaMath(rawText || '');
  const lines = formatted
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const formulaSet = new Set<string>();
  // 1. Extract LaTeX-like blocks or inline math formulas
  const blockMatches: string[] = Array.from(formatted.match(/\$\$([^$]+)\$\$|\$([^$]+)\$/g) || []);
  blockMatches.forEach((m) => {
    const clean = m.replace(/^\$+|\$+$/g, '').trim();
    if (clean.length >= 2 && clean.length <= 120) formulaSet.add(clean);
  });

  // 2. Extract equation lines & scientific notations (x², √, =, →, Δ, H₂O...)
  lines.forEach((line) => {
    const stripped = line.replace(/^[-•*\d.)#\s]+/, '').trim();
    if (
      stripped.length >= 3 &&
      stripped.length <= 110 &&
      (/[=≠≤≥√Δπ²³→⇄]/.test(stripped) || /\b(sin|cos|tan|log|lim|v =|s =|F =|P =|U =|I =|R =|Q =|H₂O|CO₂)\b/i.test(stripped))
    ) {
      formulaSet.add(stripped.replace(/\*\*/g, ''));
    }
  });

  // 3. Extract highlighted bold keywords (**term**)
  const keywordSet = new Set<string>();
  const boldMatches: string[] = Array.from(formatted.match(/\*\*([^*]{2,48})\*\*/g) || []);
  boldMatches.forEach((b) => {
    const clean = b.replace(/\*\*/g, '').replace(/:$/, '').trim();
    if (
      clean &&
      !clean.toLowerCase().includes('max10') &&
      !clean.toLowerCase().includes('chào')
    ) {
      keywordSet.add(clean);
    }
  });

  // 4. Key takeaway lines (first 4 informative non-greeting sentences)
  const keySteps: string[] = [];
  for (const line of lines) {
    const clean = line.replace(/^[-•*#\s]+/, '').replace(/\*\*/g, '').trim();
    if (clean.length > 10 && clean.length < 180) {
      keySteps.push(clean);
    }
    if (keySteps.length >= 4) break;
  }

  const keywords = Array.from(keywordSet).slice(0, 8);
  const formulas = Array.from(formulaSet).slice(0, 5);

  // Build 4 mind-map branches
  const branches: Array<{ title: string; detail: string; color: string }> = [
    {
      title: keywords[0] || `Trọng tâm ${subjectLabel}`,
      detail: formulas[0] || keySteps[0] || 'Khái niệm & định nghĩa cốt lõi',
      color: BRANCH_COLORS[0],
    },
    {
      title: keywords[1] || 'Công thức / Quy tắc',
      detail: formulas[1] || keySteps[1] || 'Biến đổi & điều kiện áp dụng',
      color: BRANCH_COLORS[1],
    },
    {
      title: keywords[2] || 'Phương pháp nhanh',
      detail: keySteps[2] || keywords[3] || 'Từng bước kiểm tra kết quả',
      color: BRANCH_COLORS[2],
    },
    {
      title: 'Lưu ý tránh bẫy',
      detail: keySteps[3] || 'Kiểm tra điều kiện & đơn vị đo',
      color: BRANCH_COLORS[3],
    },
  ];

  return { formulas, keywords, keySteps, branches };
}

export const SmartWhiteboard: React.FC<SmartWhiteboardProps> = ({
  latestAiText,
  subjectLabel,
  countryFlag = '🇻🇳',
  countryName = 'Việt Nam',
  isDark,
  compact = false,
}) => {
  const [activeBoardTab, setActiveBoardTab] = useState<'notes' | 'mindmap' | 'sketch'>('notes');
  const [penColor, setPenColor] = useState<string>('#10b981');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  const parsed = useMemo(
    () => parseLessonToWhiteboard(latestAiText, subjectLabel),
    [latestAiText, subjectLabel]
  );

  // Initialize sketch canvas crisp dimensions when switching to sketch tab
  useEffect(() => {
    if (activeBoardTab !== 'sketch' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && canvas.width !== Math.floor(rect.width)) {
      canvas.width = Math.floor(rect.width);
      canvas.height = compact ? 155 : 205;
    }
  }, [activeBoardTab, compact]);

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawingRef.current = true;
    const { x, y } = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const hasContent = Boolean(latestAiText && latestAiText.trim().length > 0);

  return (
    <div
      className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all ${
        compact ? 'h-[230px]' : 'h-[290px]'
      } ${
        isDark
          ? 'bg-[#0b1320] border-emerald-500/25 text-zinc-100'
          : 'bg-white border-emerald-200/90 text-slate-900 shadow-xs'
      }`}
    >
      {/* Smart Whiteboard Header */}
      <div
        className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          isDark
            ? 'bg-[#0f1a2b] border-white/[0.08]'
            : 'bg-emerald-50/80 border-emerald-200/80'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Presentation className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black truncate flex items-center gap-1.5">
              <span>Bảng Trắng Thông Minh AI</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                {countryFlag} {subjectLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Whiteboard Mode Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/5 dark:bg-white/[0.05]">
          {[
            { id: 'notes' as const, label: 'Công thức', icon: Sigma },
            { id: 'mindmap' as const, label: 'Sơ đồ', icon: GitFork },
            { id: 'sketch' as const, label: 'Viết nháp', icon: PenTool },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeBoardTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveBoardTab(tab.id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Whiteboard Canvas Body */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto p-3 relative ${
          isDark
            ? 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]'
            : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]'
        }`}
      >
        {activeBoardTab === 'notes' && (
          <>
            {!hasContent ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 gap-2">
                <Sparkles className="w-6 h-6 text-emerald-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                  Bảng trắng sẵn sàng ghi chép cùng Gia sư 3D ({countryName})
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-md">
                  Khi Gia sư 3D đặt câu hỏi hoặc giải bài Toán, Lý, Hóa, Ngữ pháp — công thức, từ khóa highlight và sơ đồ tư duy sẽ tự động hiển thị tại đây!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {parsed.formulas.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Sigma className="w-3 h-3" />
                      <span>Công thức &amp; Biểu thức trọng tâm</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {parsed.formulas.map((f, idx) => (
                        <div
                          key={idx}
                          className={`px-2.5 py-1.5 rounded-xl border font-mono text-xs font-bold break-words ${
                            isDark
                              ? 'bg-[#101c2e]/95 border-emerald-500/30 text-emerald-300'
                              : 'bg-emerald-50/95 border-emerald-300 text-emerald-900'
                          }`}
                        >
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsed.keywords.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Highlighter className="w-3 h-3" />
                      <span>Từ khóa Highlight</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.keywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold border ${
                            isDark
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              : 'bg-amber-100/90 border-amber-300 text-amber-900'
                          }`}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    Ghi chú nhanh trên bảng
                  </div>
                  <ul className="space-y-1">
                    {parsed.keySteps.map((step, idx) => (
                      <li
                        key={idx}
                        className={`text-[11px] px-2.5 py-1.5 rounded-xl border leading-snug ${
                          isDark
                            ? 'bg-white/[0.04] border-white/[0.08] text-zinc-200'
                            : 'bg-white/95 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className="font-black text-emerald-500 mr-1.5">{idx + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}

        {activeBoardTab === 'mindmap' && (
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 640 230" className="w-full h-full max-h-[210px]">
              {/* Connectors from Center Node */}
              <path d="M 320 115 C 240 115, 210 50, 175 50" stroke="#10b981" strokeWidth="2.5" fill="none" />
              <path d="M 320 115 C 240 115, 210 180, 175 180" stroke="#0ea5e9" strokeWidth="2.5" fill="none" />
              <path d="M 320 115 C 400 115, 430 50, 465 50" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
              <path d="M 320 115 C 400 115, 430 180, 465 180" stroke="#a855f7" strokeWidth="2.5" fill="none" />

              {/* Center Node */}
              <rect x="242" y="86" width="156" height="58" rx="14" fill="#059669" stroke="#ffffff" strokeWidth="2" />
              <text x="320" y="111" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800">
                {subjectLabel.slice(0, 18)}
              </text>
              <text x="320" y="130" textAnchor="middle" fill="#d1fae5" fontSize="10" fontWeight="700">
                {countryFlag} Sơ đồ tư duy
              </text>

              {/* 4 Branch Cards */}
              {[
                { x: 12, y: 18, b: parsed.branches[0] },
                { x: 12, y: 146, b: parsed.branches[1] },
                { x: 462, y: 18, b: parsed.branches[2] },
                { x: 462, y: 146, b: parsed.branches[3] },
              ].map((item, idx) => (
                <g key={idx} transform={`translate(${item.x}, ${item.y})`}>
                  <rect
                    width="166"
                    height="64"
                    rx="12"
                    fill={isDark ? '#111a2c' : '#ffffff'}
                    stroke={item.b.color}
                    strokeWidth="2"
                  />
                  <rect width="166" height="22" rx="10" fill={item.b.color} />
                  <text x="10" y="15" fill="#ffffff" fontSize="10" fontWeight="800">
                    {item.b.title.slice(0, 22)}
                  </text>
                  <text
                    x="10"
                    y="40"
                    fill={isDark ? '#e2e8f0' : '#1e293b'}
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {item.b.detail.slice(0, 25)}
                  </text>
                  {item.b.detail.length > 25 && (
                    <text
                      x="10"
                      y="54"
                      fill={isDark ? '#94a3b8' : '#475569'}
                      fontSize="9"
                    >
                      {item.b.detail.slice(25, 50)}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
        )}

        {activeBoardTab === 'sketch' && (
          <div className="h-full flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                {['#10b981', '#0ea5e9', '#f59e0b', '#f43f5e'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setPenColor(color)}
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer ${
                      penColor === color ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Chọn bút màu ${color}`}
                  />
                ))}
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 ml-1">
                  Viết nháp công thức trực tiếp
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearCanvas}
                className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa bảng</span>
              </button>
            </div>
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className={`w-full flex-1 rounded-xl border touch-none cursor-crosshair ${
                isDark ? 'bg-[#070d18] border-white/10' : 'bg-white border-slate-200'
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
