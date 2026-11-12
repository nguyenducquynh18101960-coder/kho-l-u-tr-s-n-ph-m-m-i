import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Check,
  Settings,
  X,
  Radio,
  Sliders,
  Zap,
} from 'lucide-react';
import {
  AI_VOICE_PERSONAS,
  AIVoicePersona,
  AIVoiceSettings,
} from '../../types/voice';
import { aiVoice, VoicePlaybackState } from '../../utils/aiVoiceEngine';

interface AIVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const AIVoiceModal: React.FC<AIVoiceModalProps> = ({
  isOpen,
  onClose,
  isDark = false,
}) => {
  const [settings, setSettings] = useState<AIVoiceSettings>(() => aiVoice.getSettings());
  const [voiceState, setVoiceState] = useState<VoicePlaybackState>(() => aiVoice.getState());
  const [testingPersonaId, setTestingPersonaId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = aiVoice.subscribe((st) => {
      setVoiceState(st);
      if (!st.isPlaying) {
        setTestingPersonaId(null);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSettings(aiVoice.getSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPersona = (persona: AIVoicePersona) => {
    const next = { ...settings, personaId: persona.id };
    setSettings(next);
    aiVoice.saveSettings(next);
  };

  const handleTestVoice = (persona: AIVoicePersona, e: React.MouseEvent) => {
    e.stopPropagation();
    if (voiceState.isPlaying && testingPersonaId === persona.id) {
      aiVoice.stop();
      setTestingPersonaId(null);
      return;
    }
    setTestingPersonaId(persona.id);
    aiVoice.speak(persona.sampleText, 'test-preview', persona);
  };

  const handleSpeedChange = (speed: number) => {
    const next = { ...settings, speed };
    setSettings(next);
    aiVoice.saveSettings(next);
  };

  const handleToggleAutoRead = () => {
    const next = { ...settings, autoReadResponse: !settings.autoReadResponse };
    setSettings(next);
    aiVoice.saveSettings(next);
  };

  const handleToggleGeminiTTS = () => {
    const next = { ...settings, preferGeminiTTS: !settings.preferGeminiTTS };
    setSettings(next);
    aiVoice.saveSettings(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b ${
            isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Volume2 className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-bold">Giọng Nói Max10</h2>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Gemini TTS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Lựa chọn nhân vật AI đọc lời giải và hướng dẫn học tập bằng giọng nói
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Persona Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Chọn Nhân Vật Giọng Nói AI
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {AI_VOICE_PERSONAS.length} Giọng truyền cảm
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AI_VOICE_PERSONAS.map((persona) => {
                const isSelected = settings.personaId === persona.id;
                const isTesting =
                  voiceState.isPlaying && testingPersonaId === persona.id;

                return (
                  <div
                    key={persona.id}
                    onClick={() => handleSelectPersona(persona)}
                    className={`relative p-3 rounded-xl border transition-all cursor-pointer select-none group flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/8 ring-2 ring-emerald-500/20 shadow-xs'
                        : isDark
                        ? 'border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800 hover:border-zinc-700'
                        : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl" role="img" aria-label="avatar">
                            {persona.avatar}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs sm:text-sm">{persona.name}</span>
                              {isSelected && (
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                  <Check className="w-2 h-2" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {persona.title}
                            </span>
                          </div>
                        </div>

                        {/* Test speech button */}
                        <button
                          type="button"
                          onClick={(e) => handleTestVoice(persona, e)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors ${
                            isTesting
                              ? 'bg-rose-500 text-white animate-pulse'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title="Nghe thử giọng"
                        >
                          {isTesting ? (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>Dừng</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Nghe thử</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="mt-2 text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {persona.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] sm:text-[11px]">
                      <span className="text-slate-400">{persona.accent}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        Model: {persona.geminiVoice}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Speed Control */}
          <div
            className={`p-3 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-zinc-800/30 border-zinc-800' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Tốc Độ Đọc
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {settings.speed}x{' '}
                {settings.speed === 0.8
                  ? '(Chậm rãi)'
                  : settings.speed === 1.0
                  ? '(Tiêu chuẩn)'
                  : '(Nhanh)'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { val: 0.8, label: '0.8x - Chậm & Kỹ' },
                { val: 1.0, label: '1.0x - Tiêu Chuẩn' },
                { val: 1.25, label: '1.25x - Nhanh Gọn' },
              ].map((sp) => (
                <button
                  key={sp.val}
                  type="button"
                  onClick={() => handleSpeedChange(sp.val)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    settings.speed === sp.val
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isDark
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Toggles */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Tùy Chọn Thông Minh
            </span>

            {/* Auto Read Toggle */}
            <div
              onClick={handleToggleAutoRead}
              className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                settings.autoReadResponse
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : isDark
                  ? 'border-zinc-800 bg-zinc-800/30'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    settings.autoReadResponse
                      ? 'bg-emerald-500 text-white'
                      : isDark
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold block">
                    Tự động đọc bài giải khi AI trả lời
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Học tập rảnh tay: nghe bài giảng tức thì mà không cần bấm nút Đọc
                  </span>
                </div>
              </div>
              <div
                className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${
                  settings.autoReadResponse ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.autoReadResponse ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            {/* Gemini TTS Engine Toggle */}
            <div
              onClick={handleToggleGeminiTTS}
              className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                settings.preferGeminiTTS
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : isDark
                  ? 'border-zinc-800 bg-zinc-800/30'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    settings.preferGeminiTTS
                      ? 'bg-emerald-500 text-white'
                      : isDark
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-semibold block">
                      Ưu tiên Giọng AI Gemini 3.1 Flash TTS
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                      Chuẩn
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Sử dụng mô hình AI giọng nói thông minh mới nhất của Google DeepMind
                  </span>
                </div>
              </div>
              <div
                className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${
                  settings.preferGeminiTTS ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.preferGeminiTTS ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between ${
            isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>⚡ Đồng hành cùng</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              học sinh THCS săn điểm 10
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all"
          >
            Áp dụng & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
