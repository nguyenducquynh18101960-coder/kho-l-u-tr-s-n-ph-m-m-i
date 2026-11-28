import React, { useState } from 'react';
import {
  X,
  Plus,
  Search,
  Pin,
  MessageSquare,
  Trash2,
  Edit2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ChatSession } from '../../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  isDark: boolean;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  isDark,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startRename = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
  };

  const commitRename = (id: string) => {
    if (onRenameSession && editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const recentSessions = filteredSessions.filter((s) => !s.isPinned);

  const formatSessionTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity"
      />

      {/* Slide-out Right Panel */}
      <aside
        className={`relative z-10 w-full max-w-[360px] h-full flex flex-col border-l shadow-2xl transition-transform duration-200 ${
          isDark
            ? 'bg-[#0c1018]/98 border-white/[0.08] text-slate-100'
            : 'bg-white/98 border-slate-200/90 text-slate-800'
        }`}
      >
        {/* Drawer Header */}
        <div
          className={`px-4 py-3.5 border-b flex items-center justify-between gap-2 shrink-0 ${
            isDark ? 'border-white/[0.08]' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                Bài hỏi gần đây
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
                {sessions.length} cuộc trò chuyện đã lưu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
            title="Đóng ngăn kéo lịch sử"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Question CTA & Search */}
        <div className="p-3.5 space-y-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm shadow-emerald-600/25 transition-all cursor-pointer active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Đặt câu hỏi mới</span>
            </span>
            <Sparkles className="w-3.5 h-3.5 opacity-90" />
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài đã hỏi..."
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none transition-colors ${
                isDark
                  ? 'bg-zinc-900/80 border-zinc-800 text-white placeholder-zinc-500 focus:border-emerald-500/60'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3.5 pb-6 space-y-4 text-xs">
          {/* Pinned */}
          {pinnedSessions.length > 0 && (
            <div>
              <div className="px-1.5 pb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                <Pin className="w-3 h-3 text-amber-500" />
                <span>Bài ghim quan trọng</span>
              </div>
              <div className="space-y-1.5">
                {pinnedSessions.map((s) => {
                  const isActive = currentSessionId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSelectSession(s.id);
                        onClose();
                      }}
                      className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border cursor-pointer transition-all ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold'
                          : isDark
                          ? 'bg-zinc-900/50 border-white/[0.06] hover:bg-zinc-800/80 text-zinc-200'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        {editingId === s.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => commitRename(s.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename(s.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className={`w-full px-2 py-1 rounded-lg text-xs border outline-none ${
                              isDark
                                ? 'bg-zinc-900 border-emerald-500 text-white'
                                : 'bg-white border-emerald-500 text-slate-900'
                            }`}
                            autoFocus
                          />
                        ) : (
                          <>
                            <div className="truncate">{s.title}</div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 flex items-center gap-2 tabular-nums">
                              <span>{s.grade}</span>
                              <span>·</span>
                              <span>{s.messages.length} tin nhắn</span>
                            </div>
                          </>
                        )}
                      </div>
                      {editingId !== s.id && (
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0">
                          {onRenameSession && (
                            <button
                              type="button"
                              onClick={(e) => startRename(s.id, s.title, e)}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors cursor-pointer"
                              title="Đổi tên đoạn chat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => onDeleteSession(s.id, e)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Xóa đoạn chat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent */}
          <div>
            <div className="px-1.5 pb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              <MessageSquare className="w-3 h-3 text-emerald-500" />
              <span>Bài hỏi gần đây</span>
            </div>
            {recentSessions.length === 0 ? (
              <div
                className={`p-5 rounded-2xl border text-center ${
                  isDark
                    ? 'bg-zinc-900/40 border-white/[0.06] text-zinc-400'
                    : 'bg-slate-50 border-slate-200/70 text-slate-500'
                }`}
              >
                <p className="font-semibold text-xs mb-1">
                  {searchQuery ? 'Không tìm thấy bài hỏi phù hợp' : 'Chưa có bài hỏi nào'}
                </p>
                <p className="text-[11px] opacity-80">
                  Đặt câu hỏi hoặc chụp ảnh đề bài để Max10 AI lưu lại tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentSessions.map((s) => {
                  const isActive = currentSessionId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSelectSession(s.id);
                        onClose();
                      }}
                      className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border cursor-pointer transition-all ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold'
                          : isDark
                          ? 'bg-zinc-900/50 border-white/[0.06] hover:bg-zinc-800/80 text-zinc-200'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        {editingId === s.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => commitRename(s.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename(s.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className={`w-full px-2 py-1 rounded-lg text-xs border outline-none ${
                              isDark
                                ? 'bg-zinc-900 border-emerald-500 text-white'
                                : 'bg-white border-emerald-500 text-slate-900'
                            }`}
                            autoFocus
                          />
                        ) : (
                          <>
                            <div className="truncate">{s.title}</div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 flex items-center gap-2 tabular-nums">
                              <span>{s.grade}</span>
                              <span>·</span>
                              <span>{s.messages.length} tin nhắn</span>
                              {s.createdAt ? (
                                <>
                                  <span>·</span>
                                  <span>{formatSessionTime(s.createdAt)}</span>
                                </>
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>
                      {editingId !== s.id && (
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0">
                          {onRenameSession && (
                            <button
                              type="button"
                              onClick={(e) => startRename(s.id, s.title, e)}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors cursor-pointer"
                              title="Đổi tên bài hỏi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => onDeleteSession(s.id, e)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Xóa bài hỏi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
