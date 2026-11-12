import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface ChatGPTCodeBlockProps {
  language?: string;
  code: string;
}

export const ChatGPTCodeBlock: React.FC<ChatGPTCodeBlockProps> = ({
  language = 'code',
  code,
}) => {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || 'code').toLowerCase().trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-black/10 dark:border-zinc-800 shadow-md bg-[#0d0d0d] text-zinc-100 font-mono text-xs select-text">
      {/* ChatGPT-style Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#212121] dark:bg-[#18181b] border-b border-white/5 text-zinc-300">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-xs lowercase text-zinc-300 tracking-wide">
            {cleanLang}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/10 active:bg-white/15 text-zinc-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
          title="Sao chép toàn bộ mã"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Đã chép!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Sao chép mã</span>
            </>
          )}
        </button>
      </div>

      {/* Code body with horizontal scroll */}
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed text-zinc-200">
        <pre className="font-mono">{code}</pre>
      </div>
    </div>
  );
};
