import React, { useState, useRef, useEffect } from 'react';
import { GradeLevel, SubjectInfo, TutorMode, ChatMessage } from '../types';
import Markdown from 'react-markdown';
import { formatDolaMath } from '../utils/dolaMathFormatter';
import {
  Send,
  Image as ImageIcon,
  X,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Workflow,
  ShieldAlert,
  Copy,
  Check,
  HelpCircle,
  BrainCircuit,
} from 'lucide-react';

interface TutorChatProps {
  currentGrade: GradeLevel;
  currentSubject: SubjectInfo;
}

export const TutorChat: React.FC<TutorChatProps> = ({
  currentGrade,
  currentSubject,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<TutorMode>('tutor');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Attached image state
  const [attachedImage, setAttachedImage] = useState<{
    data: string; // base64 without prefix
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initial welcome message per grade
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome-' + currentGrade,
      role: 'assistant',
      content: `Chào bạn! Mình là **Max10** - Gia Sư Điểm 10!

🎯 **Tự động giải mọi môn học:**
Bạn **không cần phải chọn môn học**. Chỉ cần **gõ câu lệnh hoặc gửi bài tập của bất kỳ môn nào** (Toán, Ngữ Văn, Tiếng Anh, KHTN / Vật Lý / Hóa Học / Sinh Học, Lịch Sử & Địa Lý, GDCD, Tin Học...), Max10 sẽ tự động nhận diện môn và giải chi tiết từng bước kèm đáp án chuẩn điểm 10 ngay cho bạn!

Bạn có thể:
- Gõ đề bài tập hoặc câu hỏi bất kỳ môn nào vào khung bên dưới.
- Hỏi: *"Ai là người tạo ra bạn?"*
- 📷 Nhấn vào biểu tượng ảnh để gửi ảnh đề bài trong sách/vở kiểm tra.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([welcomeMsg]);
  }, [currentGrade]);

  // Suggested prompt questions
  const getSuggestedPrompts = () => {
    return [
      'Ai là người tạo ra bạn?',
      'Giải bài toán: Cho tam giác ABC vuông tại A, tính BC nếu AB = 3, AC = 4',
      'Lập dàn ý bài văn nghị luận xã hội về lòng biết ơn',
      'Phân biệt thì Hiện tại hoàn thành và Quá khứ đơn',
      'Cân bằng phương trình hóa học: Fe + O2 -> Fe3O4',
      'Các bẫy đề thi thường khiến học sinh bị trừ điểm oan',
    ];
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setAttachedImage({
        data: base64Data,
        mimeType: file.type,
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend && !attachedImage) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      imagePreview: attachedImage?.previewUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      meta: {
        grade: currentGrade,
        subject: currentSubject.name,
        mode,
      },
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    // Instant answer if asked about creator
    const lower = textToSend.toLowerCase();
    if (
      lower.includes('ai tạo') ||
      lower.includes('ai làm') ||
      lower.includes('ai lập trình') ||
      lower.includes('tác giả') ||
      lower.includes('người tạo') ||
      lower.includes('ai phát triển') ||
      lower.includes('duy 9d4') ||
      lower.includes('cô thủy')
    ) {
      setTimeout(() => {
        const authorReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Max10 rất vui được đồng hành cùng bạn! 🎉\n\nMình là trợ lý gia sư đồng hành giúp tất cả các bạn học sinh học tập thật tốt và tự tin chinh phục điểm 10 trọn năm học.\n\nBạn chỉ cần **gõ câu lệnh hoặc gửi bài tập bất kỳ môn nào** (Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa...), mình sẽ tự động nhận diện môn và giải từng bước chi tiết ngay cho bạn nhé! 🚀`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, authorReply]);
      }, 400);
      return;
    }

    const imagePayload = attachedImage
      ? { data: attachedImage.data, mimeType: attachedImage.mimeType }
      : null;
    setAttachedImage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: currentGrade,
          subject: currentSubject.name,
          mode,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          image: imagePayload,
        }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra khi kết nối tới AI Gia Sư');
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Rất tiếc:** ${err.message || 'Không thể phản hồi ngay lúc này. Em vui lòng kiểm tra kết nối và thử lại nhé!'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const modesConfig = [
    {
      id: 'tutor' as TutorMode,
      label: 'Giải Chuẩn Điểm 10',
      desc: 'Từng bước tỉ mỉ, bản chất',
      icon: Workflow,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'grade_10_secret' as TutorMode,
      label: 'Bí Kíp Vận Dụng Cao',
      desc: 'Câu phân loại điểm 10',
      icon: Lightbulb,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'trap_detector' as TutorMode,
      label: 'Bắt Bẫy Trừ Điểm Oan',
      desc: 'Tránh mất 0.25 - 0.5 điểm',
      icon: ShieldAlert,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      id: 'mindmap' as TutorMode,
      label: 'Sơ Đồ Tư Duy 5 Phút',
      desc: 'Ghi nhớ cốt lõi siêu tốc',
      icon: BrainCircuit,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-160px)] min-h-[580px] bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden my-4">
      {/* Top Header Mode Selector */}
      <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chế độ giảng bài:
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
              {currentSubject.name} - {currentGrade}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5">
            {modesConfig.map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    active
                      ? `${item.color} shadow-xs font-bold ring-1 ring-offset-1 ring-slate-300`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={item.desc}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50/40 to-white">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 transition-all ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                }`}
              >
                {/* Meta info / Badge */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {isUser ? (
                      <span>Em (Học sinh {msg.meta?.grade || currentGrade})</span>
                    ) : (
                      <span className="flex items-center gap-1 text-indigo-600 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Gia Sư AI Điểm 10
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
                        title="Sao chép câu trả lời"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Attached user image if any */}
                {msg.imagePreview && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-white/20 max-w-sm">
                    <img
                      src={msg.imagePreview}
                      alt="Ảnh đề bài gửi kèm"
                      className="max-h-60 object-contain w-full bg-slate-900/10"
                    />
                  </div>
                )}

                {/* Content */}
                <div
                  className={`text-sm sm:text-[15px] leading-relaxed break-words prose prose-slate max-w-none ${
                    isUser
                      ? 'text-white prose-invert prose-p:my-1 prose-pre:bg-indigo-700'
                      : 'prose-headings:text-slate-900 prose-headings:font-bold prose-headings:my-2 prose-p:my-1.5 prose-strong:text-indigo-950 prose-li:my-0.5'
                  }`}
                >
                  <div className="markdown-body">
                    <Markdown>{formatDolaMath(msg.content)}</Markdown>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-xs max-w-[80%] flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-indigo-700">AI Gia Sư</span> đang phân tích bản chất & chuẩn bị lời giải chuẩn Điểm 10...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 bg-slate-50/90 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3" /> Gợi ý hỏi:
        </span>
        {getSuggestedPrompts().map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="text-xs bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 hover:border-indigo-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-all shadow-2xs shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form & Image Attachment Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        {/* Attached image preview banner */}
        {attachedImage && (
          <div className="mb-2 p-2 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between max-w-sm">
            <div className="flex items-center gap-2">
              <img
                src={attachedImage.previewUrl}
                alt="Đã đính kèm ảnh đề bài"
                className="w-12 h-12 object-cover rounded-lg border border-indigo-200"
              />
              <div>
                <p className="text-xs font-bold text-indigo-900">Đã đính kèm ảnh bài tập</p>
                <p className="text-[11px] text-indigo-600">AI sẽ tự động đọc & giải chi tiết</p>
              </div>
            </div>
            <button
              onClick={() => setAttachedImage(null)}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
              title="Xóa ảnh"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Photo attach button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors shrink-0"
            title="Tải ảnh đề bài hoặc bài giải cần kiểm tra"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Text input area */}
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Gõ đề bài tập bất kỳ môn nào (Toán, Văn, Anh, KHTN, Lý, Hóa, Sinh, Sử, Địa...) hoặc hỏi bất kỳ câu nào..."
              rows={1}
              className="w-full resize-none rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm sm:text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 max-h-32 text-slate-800 placeholder:text-slate-400"
              style={{ minHeight: '44px' }}
            />
          </div>

          {/* Send button */}
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={loading || (!input.trim() && !attachedImage)}
            className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs shrink-0"
            title="Gửi câu hỏi"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>Nhấn Enter để gửi, Shift + Enter để xuống dòng</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <Sparkles className="w-3 h-3" />
            Phương pháp học hiểu sâu - Tránh học vẹt
          </span>
        </div>
      </div>
    </div>
  );
};
