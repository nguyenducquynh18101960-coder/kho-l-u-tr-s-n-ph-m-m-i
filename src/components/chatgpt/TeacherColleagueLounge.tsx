import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Send,
  MessageCircle,
  Sparkles,
  School,
  Clock,
  RefreshCw,
  Award,
  BookOpen,
  Filter,
  CheckCircle2,
  Lock,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { TeacherAccountInfo } from './TeacherChatView';

export interface ColleagueMessage {
  id: string;
  senderTeacherId: string;
  senderTeacherName: string;
  senderSubject: string;
  senderSchool: string;
  senderAvatarText: string;
  senderBadgeColor: string;
  content: string;
  timestamp: string;
  topic?: string;
}

interface TeacherColleagueLoungeProps {
  loggedInTeacher: TeacherAccountInfo | null;
  isDark: boolean;
  onOpenLoginModal: () => void;
  onOpenRegisterModal: () => void;
}

const TOPICS = [
  'Tất cả',
  'Trao đổi chuyên môn',
  'Sinh hoạt tổ bộ môn',
  'Đề kiểm tra & Ma trận',
  'Kinh nghiệm ôn thi HSG',
  'Giao lưu sư phạm',
];

const SUGGESTIONS = [
  'Thảo luận ma trận đề kiểm tra giữa kỳ 2 theo chuẩn GDPT 2026',
  'Chia sẻ phương pháp gỡ bẫy sai cho học sinh khi giải bài tập',
  'Kinh nghiệm tổ chức hoạt động Khởi động tạo hứng thú 5 phút đầu giờ',
  'Xin ý kiến các Thầy/Cô về tài liệu bồi dưỡng học sinh giỏi săn điểm 10',
];

export const TeacherColleagueLounge: React.FC<TeacherColleagueLoungeProps> = ({
  loggedInTeacher,
  isDark,
  onOpenLoginModal,
  onOpenRegisterModal,
}) => {
  const [messages, setMessages] = useState<ColleagueMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('Trao đổi chuyên môn');
  const [filterTopic, setFilterTopic] = useState<string>('Tất cả');
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchColleagueMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/teachers/colleagues/messages');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.warn('Could not fetch colleague messages:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleagueMessages();
    const interval = setInterval(() => {
      fetchColleagueMessages(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;

    if (!loggedInTeacher) {
      onOpenLoginModal();
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/teachers/colleagues/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: loggedInTeacher.id,
          content: text,
          topic: selectedTopic,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.message) {
          setMessages((prev) => [...prev, data.message]);
          setInputText('');
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: 'smooth',
              });
            }
          }, 100);
        }
      }
    } catch (err) {
      console.error('Error sending colleague message:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (filterTopic === 'Tất cả') return true;
    return m.topic === filterTopic;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent h-full">
      {/* 1. Lounge Sub-Header & Topic Filter Bar */}
      <div
        className={`px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-indigo-50/40 border-indigo-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-zinc-100">
                Phòng Hội Đồng Sư Phạm (Trò Chuyện Giữa Các Thầy Cô)
              </h2>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-500/20">
                Nội bộ giáo viên
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Nơi Thầy Cô trao đổi nghiệp vụ, chia sẻ giáo án, ma trận đề thi và thảo luận chuyên môn.
            </p>
          </div>
        </div>

        {/* Right side: Reload button & Status */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => fetchColleagueMessages()}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs flex items-center gap-1 font-semibold cursor-pointer"
            title="Làm mới cuộc trò chuyện"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-[11px] hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Topic Filter Tabs */}
      <div
        className={`px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 ${
          isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/70 border-slate-200'
        }`}
      >
        <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mr-1 flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3" /> Chủ đề:
        </span>
        {TOPICS.map((tpc) => (
          <button
            key={tpc}
            onClick={() => setFilterTopic(tpc)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterTopic === tpc
                ? 'bg-indigo-600 text-white shadow-2xs'
                : isDark
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tpc}
          </button>
        ))}
      </div>

      {/* 3. Messages Stream */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0"
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MessageCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                Chưa có trao đổi nào trong mục này
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Thầy/Cô hãy là người đầu tiên gửi tin nhắn, chia sẻ câu hỏi hoặc tài liệu chuyên môn với các đồng nghiệp nhé!
              </p>
            </div>
            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5 justify-center max-w-lg mt-2">
              {SUGGESTIONS.slice(0, 2).map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(sug)}
                  className={`text-[11px] px-3 py-1.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                    isDark
                      ? 'bg-zinc-850 border-zinc-700 text-zinc-300 hover:border-indigo-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 shadow-2xs'
                  }`}
                >
                  💬 {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = loggedInTeacher && loggedInTeacher.id === msg.senderTeacherId;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${
                    msg.senderBadgeColor || 'from-indigo-600 to-blue-700'
                  } text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0`}
                >
                  {msg.senderAvatarText || 'GV'}
                </div>

                {/* Bubble */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div
                    className={`flex items-center gap-2 flex-wrap text-[11px] ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span className="font-extrabold text-slate-900 dark:text-zinc-100">
                      {msg.senderTeacherName}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] border border-indigo-500/20">
                      Môn: {msg.senderSubject}
                    </span>
                    {msg.topic && (
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        • #{msg.topic}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-wrap ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-xs font-medium'
                        : isDark
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 rounded-tl-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Bottom Input Bar */}
      <div
        className={`p-3 sm:p-4 border-t shrink-0 ${
          isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white border-slate-200'
        }`}
      >
        {loggedInTeacher ? (
          <div className="space-y-2">
            {/* Quick suggestions */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-400 shrink-0 font-bold">Gợi ý chủ đề:</span>
              {SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(sug)}
                  className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Topic Selector */}
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className={`px-2.5 py-2.5 rounded-xl border text-xs font-bold outline-hidden cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {TOPICS.filter((t) => t !== 'Tất cả').map((tpc) => (
                  <option key={tpc} value={tpc}>
                    #{tpc}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Thầy/Cô ${loggedInTeacher.name} gửi lời trao đổi tới các đồng nghiệp...`}
                className={`flex-1 px-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-hidden ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />

              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gửi trao đổi</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
                Phòng Hội Đồng Sư Phạm dành riêng cho Thầy/Cô. Vui lòng đăng nhập để cùng trao đổi với các đồng nghiệp.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenLoginModal}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer"
              >
                Thầy Cô Đăng Nhập
              </button>
              <button
                onClick={onOpenRegisterModal}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 cursor-pointer"
              >
                Lập Tài Khoản
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
