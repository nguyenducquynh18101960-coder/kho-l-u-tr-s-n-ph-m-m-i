import React from 'react';
import { X, Trophy, Flame } from 'lucide-react';
import { Achievements } from '../Achievements';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  userName?: string;
  userAvatar?: string;
  onNavigateToTab?: (tab: 'chat' | 'exam' | 'mindmap' | 'grade' | 'tips' | 'group') => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  isDark,
  userName = 'Bạn học',
  userAvatar,
  onNavigateToTab,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className={`w-full max-w-5xl h-[92vh] max-h-[850px] rounded-3xl shadow-2xl flex flex-col relative border overflow-hidden ${
          isDark
            ? 'bg-[#0c1018] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Top Header */}
        <div className="h-14 px-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>Thành Tích &amp; Huy Hiệu Học Sinh</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Max10 Honor
                </span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-hidden">
          <Achievements
            isDark={isDark}
            userName={userName}
            userAvatar={userAvatar}
            onNavigateToTab={(tab) => {
              onClose();
              if (onNavigateToTab) onNavigateToTab(tab);
            }}
            onClose={onClose}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
};
export default AchievementsModal;
