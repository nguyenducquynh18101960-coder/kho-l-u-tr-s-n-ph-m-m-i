import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Film,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { GeneratedVideoInfo } from '../../types';

interface ChatGPTVideoPlayerProps {
  video: GeneratedVideoInfo;
  isDark: boolean;
  onOpenVideoStudio?: () => void;
}

export const ChatGPTVideoPlayer: React.FC<ChatGPTVideoPlayerProps> = ({
  video,
  isDark,
  onOpenVideoStudio,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  const duration = video.duration || 60;
  const timerRef = useRef<any>(null);
  const mouthTimerRef = useRef<any>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop playback when unmounting
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const stopPlayback = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mouthTimerRef.current) clearInterval(mouthTimerRef.current);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setMouthOpen(false);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const startPlayback = () => {
    setIsPlaying(true);

    // 1. Play real speech via Web Speech API in Vietnamese
    if ('speechSynthesis' in window && !isMuted) {
      window.speechSynthesis.cancel();
      const textToRead = video.script || video.title || 'Xin chào các bạn học sinh!';
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.startsWith('vi') || v.name.includes('Vietnamese'));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      utterance.onend = () => {
        stopPlayback();
        setProgress(100);
        setCurrentTime(duration);
      };

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }

    // 2. Animate mouth lip-sync
    mouthTimerRef.current = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 180);

    // 3. Update progress bar
    const startTime = Date.now() - currentTime * 1000;
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= duration) {
        stopPlayback();
        setProgress(100);
        setCurrentTime(duration);
      } else {
        setCurrentTime(Math.floor(elapsed));
        setProgress((elapsed / duration) * 100);
      }
    }, 200);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownloadVideoScript = () => {
    const content = `🎬 MAX10 AI - VIDEO BÀI GIẢNG\nChủ đề: ${video.topic || video.title}\nThời lượng: ${duration}s\n\n--- KỊCH BẢN THUYẾT MINH ---\n${video.script || 'Không có kịch bản'}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-max10-${(video.topic || 'bai-giang').replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-3.5 rounded-2xl overflow-hidden border border-black/10 dark:border-zinc-800 shadow-lg bg-black text-white max-w-md w-full transition-all select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <Film className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="font-bold text-[11px] truncate text-zinc-200">
            {video.title || 'Video Thuyết Trình AI'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border border-rose-500/30">
            HD 1080p
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Video Screen with Presenter Avatar & Lip-Sync Animation */}
      <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden group">
        {video.presenterAvatar || video.url ? (
          <img
            src={video.presenterAvatar || video.url}
            alt={video.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isPlaying ? 'scale-[1.02]' : 'group-hover:scale-105'
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-zinc-900 via-rose-950/40 to-zinc-900 flex items-center justify-center">
            <Film className="w-12 h-12 text-zinc-700" />
          </div>
        )}

        {/* Ambient Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Animated Lip-Sync Mouth Indicator */}
        {isPlaying && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
            <div
              className={`w-4 bg-rose-500/80 rounded-full transition-all duration-150 border border-white/40 shadow-lg ${
                mouthOpen ? 'h-3 scale-110' : 'h-1.5 scale-90'
              }`}
            />
            {/* Audio Waveform Bars */}
            <div className="flex items-end gap-1 mt-2">
              <span className="w-1 bg-emerald-400 h-3 animate-pulse rounded-full" />
              <span className="w-1 bg-emerald-400 h-5 animate-pulse rounded-full" style={{ animationDelay: '0.15s' }} />
              <span className="w-1 bg-teal-300 h-2 animate-pulse rounded-full" style={{ animationDelay: '0.3s' }} />
              <span className="w-1 bg-emerald-400 h-4 animate-pulse rounded-full" style={{ animationDelay: '0.45s' }} />
              <span className="w-1 bg-emerald-400 h-3 animate-pulse rounded-full" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}

        {/* Center Play Button Overlay */}
        <button
          type="button"
          onClick={handleTogglePlay}
          className={`absolute p-4 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white transition-all transform hover:scale-110 active:scale-95 shadow-xl cursor-pointer ${
            isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-95'
          }`}
          title={isPlaying ? 'Tạm dừng video' : 'Phát video người AI thuyết trình'}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 fill-white" />
          ) : (
            <Play className="w-7 h-7 fill-white translate-x-0.5" />
          )}
        </button>

        {/* Top Floating Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] text-zinc-300 border border-white/10">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Người AI Diễn Thuyết</span>
        </div>
      </div>

      {/* Progress Scrub Bar */}
      <div className="h-1 bg-zinc-800 relative cursor-pointer group">
        <div
          className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls Footer */}
      <div className="p-3 bg-zinc-900/95 flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
          </button>

          <span className="text-[11px] font-mono text-zinc-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          {video.script && (
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] cursor-pointer ${
                showTranscript
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'hover:bg-white/10 text-zinc-400 hover:text-white'
              }`}
              title="Xem kịch bản lời nói"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kịch bản</span>
              {showTranscript ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadVideoScript}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Tải kịch bản thuyết trình"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onOpenVideoStudio && (
            <button
              type="button"
              onClick={onOpenVideoStudio}
              className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Mở toàn bộ Xưởng Làm Video Người AI Nói"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mở Studio</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Transcript Box */}
      {showTranscript && video.script && (
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-[11px] text-zinc-300 leading-relaxed text-left animate-in slide-in-from-top-2 duration-200">
          <div className="font-bold text-zinc-400 mb-1 flex items-center gap-1 text-[10px] uppercase">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Kịch bản Người AI Diễn Thuyết:</span>
          </div>
          <p className="italic bg-zinc-900/60 p-2 rounded-xl border border-white/5">
            &ldquo;{video.script}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
};
