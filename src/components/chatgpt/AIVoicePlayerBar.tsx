import React, { useEffect, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { aiVoice, VoicePlaybackState } from '../../utils/aiVoiceEngine';

interface AIVoicePlayerBarProps {
  onOpenVoiceModal: () => void;
  isDark?: boolean;
}

export const AIVoicePlayerBar: React.FC<AIVoicePlayerBarProps> = ({
  onOpenVoiceModal,
  isDark = false,
}) => {
  const [state, setState] = useState<VoicePlaybackState>(() => aiVoice.getState());

  useEffect(() => {
    const unsub = aiVoice.subscribe((st) => setState(st));
    return unsub;
  }, []);

  if (!state.isPlaying && !state.isPaused && !state.isLoading) {
    return null;
  }

  const handleTogglePlayPause = () => {
    if (state.isPaused) {
      aiVoice.resume();
    } else {
      aiVoice.pause();
    }
  };

  const handleCycleSpeed = () => {
    const current = state.speed || 1.0;
    let next = 1.0;
    if (current === 1.0) next = 1.25;
    else if (current === 1.25) next = 0.8;
    else next = 1.0;
    aiVoice.setSpeed(next);
  };

  return (
    <div className="fixed bottom-18 sm:bottom-22 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md animate-in slide-in-from-bottom-3 duration-200">
      <div
        className={`px-3 py-2 rounded-2xl shadow-xl border backdrop-blur-md flex items-center justify-between gap-2.5 ${
          isDark
            ? 'bg-zinc-900/95 border-zinc-700/80 text-zinc-100 shadow-black/40'
            : 'bg-white/95 border-emerald-500/20 text-slate-900 shadow-emerald-900/10'
        }`}
      >
        {/* Voice Persona & Status */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center text-sm shadow-xs">
              <span>{state.activePersona.avatar}</span>
            </div>
            {state.isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900 animate-ping" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-bold truncate">
                {state.activePersona.name}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                {state.isLoading
                  ? 'Đang tải...'
                  : state.engineUsed === 'gemini'
                  ? 'Gemini'
                  : 'AI Voice'}
              </span>
            </div>

            {/* Visual soundwave animation */}
            <div className="flex items-center gap-1 mt-0.5">
              {state.isLoading ? (
                <span className="text-[10px] text-slate-400 animate-pulse">
                  Đang chuẩn bị âm thanh...
                </span>
              ) : (
                <div className="flex items-center gap-0.5 h-2.5">
                  {[4, 10, 6, 12, 7, 11].map((h, i) => (
                    <span
                      key={i}
                      className={`w-0.5 rounded-full transition-all duration-150 ${
                        state.isPlaying
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-slate-300 dark:bg-zinc-700'
                      }`}
                      style={{
                        height: state.isPlaying ? `${Math.max(3, (h * (i % 2 + 1)) % 10)}px` : '2px',
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Speed Toggle */}
          <button
            type="button"
            onClick={handleCycleSpeed}
            className="px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Đổi tốc độ đọc"
          >
            {state.speed}x
          </button>

          {/* Play/Pause */}
          <button
            type="button"
            onClick={handleTogglePlayPause}
            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xs transition-colors"
            title={state.isPaused ? 'Tiếp tục đọc' : 'Tạm dừng'}
          >
            {state.isPaused ? (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            ) : (
              <Pause className="w-3.5 h-3.5 fill-current" />
            )}
          </button>

          {/* Stop */}
          <button
            type="button"
            onClick={() => aiVoice.stop()}
            className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors text-slate-400"
            title="Dừng đọc"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400"
            title="Cài đặt giọng nói AI"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
