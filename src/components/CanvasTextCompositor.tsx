import React, { useEffect, useRef, useState } from 'react';
import { Download, Eye, EyeOff, Type as TypeIcon, UserCheck, Sparkles, Check } from 'lucide-react';

export type CompositorMode =
  | 'flashcard'
  | 'literature'
  | 'mindmap_infographic'
  | 'avatar'
  | 'poster'
  | 'free_image';

export interface CanvasOverlayData {
  title: string;
  subtitle?: string;
  word?: string;
  phonetic?: string;
  partOfSpeech?: string;
  vietnameseMeaning?: string;
  exampleEn?: string;
  exampleVi?: string;
  eraOrWork?: string;
  quoteOrCaption?: string;
  branches?: Array<{ heading: string; detail: string }>;
  keyTip?: string;
  badgeLabel?: string;
}

interface CanvasTextCompositorProps {
  baseImageUrl: string;
  mode: CompositorMode;
  aspectRatio: string;
  overlay: CanvasOverlayData;
  isDark?: boolean;
  onApplyAsAvatar?: (dataUrl: string) => void;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 3
): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  if (lines.length === maxLines && words.length > 0) {
    const last = lines[maxLines - 1];
    if (ctx.measureText(last).width > maxWidth) {
      lines[maxLines - 1] = last.slice(0, Math.max(0, last.length - 3)) + '...';
    }
  }
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export const CanvasTextCompositor: React.FC<CanvasTextCompositorProps> = ({
  baseImageUrl,
  mode,
  aspectRatio,
  overlay: initialOverlay,
  isDark = false,
  onApplyAsAvatar,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [overlay, setOverlay] = useState<CanvasOverlayData>(initialOverlay);
  const [showTextLayer, setShowTextLayer] = useState<boolean>(mode !== 'free_image');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [avatarApplied, setAvatarApplied] = useState(false);

  useEffect(() => {
    setOverlay(initialOverlay);
    setShowTextLayer(mode !== 'free_image');
    setAvatarApplied(false);
  }, [baseImageUrl, mode, initialOverlay]);

  // Target canvas resolution
  const canvasWidth = aspectRatio === '16:9' ? 1280 : aspectRatio === '9:16' ? 720 : 1024;
  const canvasHeight =
    aspectRatio === '16:9' ? 720 : aspectRatio === '9:16' ? 1280 : aspectRatio === '4:3' ? 768 : 1024;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImageUrl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    setRenderError(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // 1. Draw base text-free AI illustration (cover-fit)
      const imgRatio = img.width / img.height;
      const targetRatio = canvasWidth / canvasHeight;
      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;
      if (imgRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasWidth, canvasHeight);

      if (!showTextLayer) return;

      // 2. Render crisp Vietnamese typography overlay cleanly separated from AI raster
      if (mode === 'flashcard') {
        // Top minimal word tag + bottom crisp flashcard glass panel
        const topGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight * 0.28);
        topGrad.addColorStop(0, 'rgba(15, 23, 42, 0.72)');
        topGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight * 0.28);

        const bottomPanelH = Math.round(canvasHeight * 0.34);
        const panelY = canvasHeight - bottomPanelH - 28;
        const panelX = 28;
        const panelW = canvasWidth - 56;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        drawRoundedRect(ctx, panelX, panelY, panelW, bottomPanelH, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Badge kicker
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 20px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
        const posLabel = overlay.partOfSpeech ? `FLASHCARD TỪ VỰNG · ${overlay.partOfSpeech.toUpperCase()}` : 'FLASHCARD TỪ VỰNG MAX10';
        ctx.fillText(posLabel, panelX + 32, panelY + 42);

        // Main word + Phonetic
        const mainWord = overlay.word || overlay.title || '';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 44px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(mainWord, panelX + 32, panelY + 96);

        if (overlay.phonetic) {
          const wordWidth = ctx.measureText(mainWord).width;
          ctx.fillStyle = '#38bdf8';
          ctx.font = '600 26px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(overlay.phonetic, panelX + 48 + Math.min(wordWidth, panelW * 0.5), panelY + 94);
        }

        // Vietnamese meaning (100% accurate diacritics!)
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 30px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
        const meaningLines = wrapCanvasText(ctx, `Nghĩa: ${overlay.vietnameseMeaning || overlay.subtitle || ''}`, panelW - 64, 2);
        meaningLines.forEach((line, i) => {
          ctx.fillText(line, panelX + 32, panelY + 146 + i * 38);
        });

        // Example sentence
        if (overlay.exampleEn || overlay.exampleVi) {
          const exText = [overlay.exampleEn, overlay.exampleVi].filter(Boolean).join(' — ');
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '500 20px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
          const exLines = wrapCanvasText(ctx, exText, panelW - 64, 2);
          const exStartY = panelY + bottomPanelH - (exLines.length * 26) - 14;
          exLines.forEach((line, i) => {
            ctx.fillText(line, panelX + 32, exStartY + i * 26);
          });
        }
      } else if (mode === 'literature' || mode === 'poster') {
        const panelH = Math.round(canvasHeight * 0.28);
        const grad = ctx.createLinearGradient(0, canvasHeight - panelH - 80, 0, canvasHeight);
        grad.addColorStop(0, 'rgba(15, 23, 42, 0)');
        grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.85)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.96)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, canvasHeight - panelH - 80, canvasWidth, panelH + 80);

        const padX = 40;
        let curY = canvasHeight - panelH + 16;

        if (overlay.eraOrWork) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 20px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(overlay.eraOrWork.toUpperCase(), padX, curY);
          curY += 42;
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
        const titleLines = wrapCanvasText(ctx, overlay.title || '', canvasWidth - padX * 2, 2);
        titleLines.forEach((line) => {
          ctx.fillText(line, padX, curY);
          curY += 44;
        });

        const quote = overlay.quoteOrCaption || overlay.subtitle || '';
        if (quote) {
          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'italic 22px Georgia, serif';
          const qLines = wrapCanvasText(ctx, `“${quote}”`, canvasWidth - padX * 2, 3);
          qLines.forEach((line) => {
            ctx.fillText(line, padX, curY + 6);
            curY += 30;
          });
        }
      } else if (mode === 'mindmap_infographic') {
        // Semi-transparent dark backdrop so structured infographic text is crystal clear
        ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Top Header Bar
        ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
        drawRoundedRect(ctx, 32, 28, canvasWidth - 64, 118, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
        ctx.fillText('INFOGRAPHIC TÓM TẮT KIẾN THỨC CHUẨN VIỆT', 56, 62);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 32px system-ui, -apple-system, sans-serif';
        const hLines = wrapCanvasText(ctx, overlay.title || '', canvasWidth - 112, 1);
        ctx.fillText(hLines[0] || '', 56, 102);

        if (overlay.subtitle) {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '500 18px system-ui, -apple-system, sans-serif';
          const subLines = wrapCanvasText(ctx, overlay.subtitle, canvasWidth - 112, 1);
          ctx.fillText(subLines[0] || '', 56, 130);
        }

        // Branch Cards Grid (2x2)
        const branches = (overlay.branches && overlay.branches.length > 0)
          ? overlay.branches.slice(0, 4)
          : [{ heading: 'Nội dung trọng tâm', detail: overlay.subtitle || overlay.title }];

        const cols = branches.length <= 2 ? 1 : 2;
        const rows = Math.ceil(branches.length / cols);
        const gridTop = 172;
        const gridBottom = canvasHeight - 108;
        const gap = 20;
        const cardW = (canvasWidth - 64 - gap * (cols - 1)) / cols;
        const cardH = Math.min(260, (gridBottom - gridTop - gap * (rows - 1)) / rows);

        const accentColors = ['#38bdf8', '#34d399', '#c084fc', '#fbbf24'];

        branches.forEach((b, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const cx = 32 + col * (cardW + gap);
          const cy = gridTop + row * (cardH + gap);
          const accent = accentColors[idx % accentColors.length];

          ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
          drawRoundedRect(ctx, cx, cy, cardW, cardH, 18);
          ctx.fill();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = accent;
          ctx.font = '800 22px system-ui, -apple-system, sans-serif';
          const bHead = wrapCanvasText(ctx, `${idx + 1}. ${b.heading}`, cardW - 36, 2);
          bHead.forEach((l, li) => ctx.fillText(l, cx + 18, cy + 36 + li * 26));

          ctx.fillStyle = '#f1f5f9';
          ctx.font = '500 19px system-ui, -apple-system, sans-serif';
          const bodyStart = cy + 36 + bHead.length * 26 + 10;
          const bBody = wrapCanvasText(ctx, b.detail, cardW - 36, 5);
          bBody.forEach((l, li) => ctx.fillText(l, cx + 18, bodyStart + li * 26));
        });

        // Bottom Key Tip
        if (overlay.keyTip) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
          drawRoundedRect(ctx, 32, canvasHeight - 88, canvasWidth - 64, 60, 14);
          ctx.fill();
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
          ctx.stroke();

          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
          const tipLines = wrapCanvasText(ctx, `Mẹo ghi nhớ: ${overlay.keyTip}`, canvasWidth - 100, 1);
          ctx.fillText(tipLines[0] || '', 52, canvasHeight - 52);
        }
      } else if (mode === 'avatar') {
        // Golden/Emerald Badge Ring & Ribbon
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 14;
        ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);

        const ribbonH = 88;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        drawRoundedRect(ctx, 48, canvasHeight - ribbonH - 28, canvasWidth - 96, ribbonH, 44);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 28px system-ui, -apple-system, sans-serif';
        ctx.fillText(
          (overlay.badgeLabel || overlay.title || 'CHIẾN THẦN ĐIỂM 10').toUpperCase(),
          canvasWidth / 2,
          canvasHeight - ribbonH + 22
        );
        if (overlay.subtitle) {
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '600 18px system-ui, -apple-system, sans-serif';
          ctx.fillText(overlay.subtitle, canvasWidth / 2, canvasHeight - ribbonH + 52);
        }
        ctx.textAlign = 'left';
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        setRenderError('Đang tải ảnh nền vào trình ghép chữ Canvas...');
      }
    };

    img.src = baseImageUrl;
    return () => {
      cancelled = true;
    };
  }, [baseImageUrl, mode, canvasWidth, canvasHeight, overlay, showTextLayer]);

  const handleDownloadComposite = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      const slug = (overlay.word || overlay.title || 'max10-visual')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 32);
      a.download = `${slug || 'max10-visual'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      // Fallback if external URL wasn't cached locally
      window.open(baseImageUrl, '_blank');
    }
  };

  const handleSetProfileAvatar = () => {
    if (!onApplyAsAvatar) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        onApplyAsAvatar(dataUrl);
        setAvatarApplied(true);
        setTimeout(() => setAvatarApplied(false), 3000);
        return;
      } catch {
        // Fallback to raw image URL
      }
    }
    onApplyAsAvatar(baseImageUrl);
    setAvatarApplied(true);
    setTimeout(() => setAvatarApplied(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Live Canvas Stage */}
      <div className="relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-lg bg-slate-950 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full max-h-[480px] object-contain block"
        />
        {renderError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-xs text-slate-300 p-4 text-center">
            {renderError}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowTextLayer(!showTextLayer)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
            isDark
              ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {showTextLayer ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{showTextLayer ? 'Đang bật lớp chữ Canvas chuẩn Việt' : 'Đang xem nền không chữ gốc'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {mode === 'avatar' && onApplyAsAvatar && (
            <button
              type="button"
              onClick={handleSetProfileAvatar}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-colors cursor-pointer"
            >
              {avatarApplied ? <Check className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              <span>{avatarApplied ? 'Đã cập nhật Avatar hồ sơ!' : 'Đặt làm Avatar hồ sơ'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadComposite}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải ảnh có chữ chuẩn Việt (PNG)</span>
          </button>
        </div>
      </div>

      {/* Live Text Customizer (Separate Text & Image Architecture) */}
      {showTextLayer && mode !== 'free_image' && (
        <div
          className={`p-3.5 rounded-xl border space-y-2.5 ${
            isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <TypeIcon className="w-3.5 h-3.5" />
            <span>Chỉnh sửa lớp chữ Tiếng Việt trên Canvas (Không làm méo nét ảnh AI)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {mode === 'flashcard' ? (
              <>
                <input
                  type="text"
                  value={overlay.word || ''}
                  onChange={(e) => setOverlay({ ...overlay, word: e.target.value })}
                  placeholder="Từ vựng / Khái niệm"
                  className={`px-3 py-1.5 rounded-lg text-xs border ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
                <input
                  type="text"
                  value={overlay.phonetic || ''}
                  onChange={(e) => setOverlay({ ...overlay, phonetic: e.target.value })}
                  placeholder="Phiên âm IPA (vd: /ˌfəʊtəʊˈsɪnθəsɪs/)"
                  className={`px-3 py-1.5 rounded-lg text-xs border ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
                <input
                  type="text"
                  value={overlay.vietnameseMeaning || ''}
                  onChange={(e) => setOverlay({ ...overlay, vietnameseMeaning: e.target.value })}
                  placeholder="Nghĩa Tiếng Việt chuẩn dấu"
                  className={`sm:col-span-2 px-3 py-1.5 rounded-lg text-xs border ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </>
            ) : mode === 'avatar' ? (
              <>
                <input
                  type="text"
                  value={overlay.badgeLabel || ''}
                  onChange={(e) => setOverlay({ ...overlay, badgeLabel: e.target.value })}
                  placeholder="Danh hiệu huy hiệu (vd: NHÀ KHOA HỌC NHÍ)"
                  className={`px-3 py-1.5 rounded-lg text-xs border ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
                <input
                  type="text"
                  value={overlay.subtitle || ''}
                  onChange={(e) => setOverlay({ ...overlay, subtitle: e.target.value })}
                  placeholder="Dòng phụ (vd: Max10 Scholar)"
                  className={`px-3 py-1.5 rounded-lg text-xs border ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={overlay.title || ''}
                  onChange={(e) => setOverlay({ ...overlay, title: e.target.value })}
                  placeholder="Tiêu đề Tiếng Việt"
                  className={`sm:col-span-2 px-3 py-1.5 rounded-lg text-xs border ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
                {mode === 'literature' && (
                  <input
                    type="text"
                    value={overlay.quoteOrCaption || ''}
                    onChange={(e) => setOverlay({ ...overlay, quoteOrCaption: e.target.value })}
                    placeholder="Câu thơ / Lời bình / Sự kiện"
                    className={`sm:col-span-2 px-3 py-1.5 rounded-lg text-xs border ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
