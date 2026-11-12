import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Edit3,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  MessageSquare,
  Users,
  Sparkles,
  Camera,
  X,
  RotateCcw,
  Check,
  Award,
  BookOpen,
  Send,
  Zap,
} from 'lucide-react';
import { aiVoice } from '../../utils/aiVoiceEngine';

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isSpeaking?: boolean;
}

export interface VideoAudioCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'video' | 'voice';
  roomType: 'group' | 'direct' | 'teacher';
  targetName: string;
  targetAvatar?: string;
  targetBadge?: string;
  targetSubject?: string;
  participants?: CallParticipant[];
  userName: string;
  userAvatar?: string;
  userBadge?: string;
  isDark?: boolean;
}

export const VideoAudioCallModal: React.FC<VideoAudioCallModalProps> = ({
  isOpen,
  onClose,
  callType = 'video',
  roomType = 'direct',
  targetName,
  targetAvatar,
  targetBadge,
  targetSubject,
  participants = [],
  userName = 'Bạn học',
  userAvatar,
  userBadge,
  isDark = true,
}) => {
  // Call status: 'ringing' -> 'connected' -> 'ended'
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [duration, setDuration] = useState<number>(0);

  // Audio & Video controls
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(callType === 'voice');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [isSharingScreen, setIsSharingScreen] = useState<boolean>(false);
  const [showWhiteboard, setShowWhiteboard] = useState<boolean>(false);
  const [showInCallChat, setShowInCallChat] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // In-call chat messages
  const [inCallMessages, setInCallMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: targetName,
      text: roomType === 'teacher'
        ? `Chào em ${userName}! Em có câu hỏi hoặc bài tập nào cần Thầy/Cô giải đáp trực tiếp không? Bật mic và camera lên nhé!`
        : `Chào ${userName}! Mình cùng bật camera và mic trao đổi bài tập nhé!`,
      time: 'Vừa xong',
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // Hardware streams
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Audio Context & Ringtone
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringtoneTimerRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [userAudioLevel, setUserAudioLevel] = useState<number>(0);
  const [remoteSpeaking, setRemoteSpeaking] = useState<boolean>(false);

  // Whiteboard Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawColor, setDrawColor] = useState<string>('#3b82f6');
  const [brushSize, setBrushSize] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Mock group participants if not provided
  const activeParticipants: CallParticipant[] = React.useMemo(() => {
    if (roomType === 'group') {
      if (participants && participants.length > 0) return participants;
      return [
        { id: 'p1', name: 'Nguyễn Hoàng Nam', role: 'Lớp 9A1', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80', isMuted: false, isVideoOff: false },
        { id: 'p2', name: 'Trần Bảo Ngọc', role: 'Lớp 9A2', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', isMuted: false, isVideoOff: false },
        { id: 'p3', name: 'Lê Minh Khôi', role: 'Lớp 9A1', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', isMuted: true, isVideoOff: false },
      ];
    }
    return [];
  }, [roomType, participants]);

  // Web Audio Ringtone Synth
  const playRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const triggerBeep = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      };

      triggerBeep();
      ringtoneTimerRef.current = setInterval(triggerBeep, 2600);
    } catch {
      // Audio autoplay restrictions
    }
  };

  const stopRingtone = () => {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
  };

  const playConnectedChime = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.06, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } catch {}
  };

  // Start real user media (Camera + Mic)
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setCallStatus('ringing');
    setDuration(0);
    playRingtone();

    // Auto connect after brief realistic ringing (1.8s)
    const connectTimer = setTimeout(() => {
      if (!mounted) return;
      stopRingtone();
      playConnectedChime();
      setCallStatus('connected');

      // Voice greeting for Teacher or Friend
      if (roomType === 'teacher') {
        const teacherGreeting = `Thầy cô ${targetName} đã kết nối cuộc gọi. Em hãy bật mic và camera để hỏi bài nhé!`;
        aiVoice.speak(teacherGreeting).catch(() => {});
      }
    }, 1800);

    // Request actual camera & mic access
    async function initMedia() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCameraPermission(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setHasCameraPermission(true);

        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        // Setup Audio Analyser for visual speaking indicator
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const actx = new AudioCtx();
            const src = actx.createMediaStreamSource(stream);
            const analyser = actx.createAnalyser();
            analyser.fftSize = 64;
            src.connect(analyser);
            analyserRef.current = analyser;

            const checkAudio = () => {
              if (!mounted) return;
              if (analyserRef.current) {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;
                setUserAudioLevel(avg);
              }
              requestAnimationFrame(checkAudio);
            };
            requestAnimationFrame(checkAudio);
          }
        } catch {}
      } catch (err: any) {
        if (mounted) {
          setHasCameraPermission(false);
          setCameraError('Chưa cấp quyền camera/micro, bạn có thể bấm cấp quyền hoặc trò chuyện bình thường.');
        }
      }
    }

    initMedia();

    return () => {
      mounted = false;
      clearTimeout(connectTimer);
      stopRingtone();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    };
  }, [isOpen, callType, roomType, targetName]);

  // Duration Timer
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  // Simulated Remote Speaking pulse for dynamic realism
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const interval = setInterval(() => {
      setRemoteSpeaking((prev) => !prev);
    }, 3200);
    return () => clearInterval(interval);
  }, [callStatus]);

  // Toggle Mute Mic
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
    }
  };

  // Toggle Camera
  const handleToggleCamera = async () => {
    const next = !isVideoOff;
    setIsVideoOff(next);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !next;
      });
    }

    if (!next && (!localStreamRef.current || localStreamRef.current.getVideoTracks().length === 0)) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch {}
    }
  };

  // Screen Share
  const handleToggleScreenShare = async () => {
    if (isSharingScreen) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsSharingScreen(false);
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return;
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
        }
        setIsSharingScreen(true);

        screenStream.getVideoTracks()[0].onended = () => {
          setIsSharingScreen(false);
          screenStreamRef.current = null;
        };
      } catch {
        setIsSharingScreen(false);
      }
    }
  };

  // Whiteboard drawing handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = drawColor;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Send In-Call Chat Message
  const handleSendInCallMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      sender: userName,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setInCallMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    // Teacher auto response simulation in call
    if (roomType === 'teacher') {
      setTimeout(() => {
        setInCallMessages((prev) => [
          ...prev,
          {
            sender: targetName,
            text: `Cô đã nhận được câu hỏi "${newMsg.text.slice(0, 30)}...". Cô đang giảng trực tiếp qua camera & bảng viết, em chú ý lắng nghe nhé!`,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 1500);
    }
  };

  // End Call
  const handleEndCall = () => {
    setCallStatus('ended');
    stopRingtone();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setTimeout(() => {
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200 ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`w-full h-full max-w-6xl rounded-3xl overflow-hidden flex flex-col shadow-2xl border transition-all ${
          isDark ? 'bg-[#0f1218] border-white/10 text-white' : 'bg-[#151922] border-slate-700 text-white'
        }`}
      >
        {/* Top Header Bar */}
        <div className="py-3 px-4 sm:px-6 border-b border-white/10 bg-black/40 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              {targetAvatar ? (
                <img
                  src={targetAvatar}
                  alt={targetName}
                  className="w-10 h-10 rounded-2xl object-cover border border-white/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-sm shadow-md">
                  {roomType === 'teacher' ? 'GV' : roomType === 'group' ? '👥' : '👤'}
                </div>
              )}
              {callStatus === 'connected' && (
                <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-900 absolute -bottom-0.5 -right-0.5 animate-pulse" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-sm sm:text-base text-white truncate">{targetName}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-emerald-400 border border-emerald-500/30">
                  {roomType === 'teacher' ? 'Hỏi Bài Thầy Cô' : roomType === 'group' ? 'Nhóm Học Tập' : 'Gọi 1-1'}
                </span>
                {targetSubject && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                    📚 Môn: {targetSubject}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                {callStatus === 'ringing' ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Đang đổ chuông kết nối...
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {formatTimer(duration)} · {callType === 'video' ? 'Cuộc gọi Video HD' : 'Cuộc gọi Thoại'}
                  </span>
                )}
                {targetBadge && <span className="opacity-70 hidden sm:inline">• {targetBadge}</span>}
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowInCallChat(!showInCallChat)}
              className={`p-2 rounded-2xl transition-all cursor-pointer ${
                showInCallChat ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title="Mở tin nhắn nhanh trong cuộc gọi"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer hidden sm:block"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleEndCall}
              className="p-2 rounded-2xl bg-rose-600/80 hover:bg-rose-600 text-white transition-all cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Stage Grid */}
        <div className="flex-1 min-h-0 relative flex overflow-hidden">
          {/* Main Video View Area */}
          <div className="flex-1 h-full relative flex flex-col p-3 sm:p-4 overflow-hidden">
            {/* Screen Share Overlay if active */}
            {isSharingScreen && (
              <div className="w-full h-full mb-3 rounded-2xl overflow-hidden bg-black border border-blue-500/40 relative shadow-2xl">
                <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-blue-600/90 text-white text-xs font-bold flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  <span>Đang chia sẻ màn hình bài tập</span>
                </div>
              </div>
            )}

            {/* Interactive Whiteboard Canvas Overlay */}
            {showWhiteboard ? (
              <div className="w-full h-full rounded-2xl bg-slate-900 border border-white/20 flex flex-col relative overflow-hidden shadow-2xl">
                {/* Whiteboard Toolbar */}
                <div className="py-2 px-3 bg-zinc-800/90 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-400 flex items-center gap-1">
                      <Edit3 className="w-4 h-4" /> Bảng Viết Giải Bài &amp; Vẽ Hình
                    </span>
                    <div className="flex items-center gap-1.5 ml-2">
                      {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ffffff'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setDrawColor(color)}
                          className={`w-5 h-5 rounded-full border transition-transform ${
                            drawColor === color ? 'scale-125 border-white ring-2 ring-white/50' : 'border-black/40'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <select
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="bg-zinc-700 text-white rounded-lg px-2 py-0.5 text-xs outline-none"
                    >
                      <option value={2}>Nét mảnh (2px)</option>
                      <option value={4}>Nét vừa (4px)</option>
                      <option value={8}>Nét đậm (8px)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearWhiteboard}
                      className="px-2.5 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold transition-all"
                    >
                      Xóa bảng
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWhiteboard(false)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
                    >
                      Trở lại Video
                    </button>
                  </div>
                </div>

                {/* Whiteboard Canvas */}
                <canvas
                  ref={canvasRef}
                  width={960}
                  height={540}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className="flex-1 w-full h-full bg-[#1e2330] cursor-crosshair touch-none"
                />
              </div>
            ) : roomType === 'group' ? (
              /* Group Study Call Video Grid (Multi-participant) */
              <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto">
                {/* 1. Self Camera Cell */}
                <div className="rounded-3xl bg-zinc-900 border border-white/10 relative overflow-hidden flex items-center justify-center min-h-[160px] shadow-lg group">
                  {!isVideoOff && hasCameraPermission ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-xl shadow-md">
                        {userName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-400">Camera đang tắt</span>
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1.5">
                    <span>{userName} (Bạn)</span>
                    {isMuted ? <MicOff className="w-3 h-3 text-rose-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                  </div>
                </div>

                {/* 2. Other Group Participants */}
                {activeParticipants.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`rounded-3xl bg-zinc-900 border relative overflow-hidden flex items-center justify-center min-h-[160px] shadow-lg transition-all ${
                      remoteSpeaking && idx === 0 ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-white/10'
                    }`}
                  >
                    {/* Simulated live video / avatar feed */}
                    <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-zinc-850 to-zinc-900">
                      {p.avatar ? (
                        <div className="relative">
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-md"
                          />
                          {remoteSpeaking && idx === 0 && (
                            <span className="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping pointer-events-none" />
                          )}
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1.5">
                      <span>{p.name}</span>
                      <span className="opacity-70 text-[10px]">({p.role || 'Học sinh'})</span>
                      {p.isMuted ? <MicOff className="w-3 h-3 text-rose-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* 1-on-1 Direct Friend or Teacher Call Stage */
              <div className="w-full h-full rounded-3xl bg-zinc-900 border border-white/10 relative overflow-hidden flex items-center justify-center shadow-2xl">
                {/* Remote Participant Stage */}
                <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-[#141923] via-[#0f131a] to-[#0a0d12]">
                  {/* Subtle video background animation */}
                  <div className="absolute inset-0 bg-radial from-emerald-500/5 via-transparent to-transparent opacity-60" />

                  {/* Remote Avatar / Video Representation */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-4">
                      {targetAvatar ? (
                        <img
                          src={targetAvatar}
                          alt={targetName}
                          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-emerald-500/40 shadow-2xl"
                        />
                      ) : (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-4xl sm:text-5xl shadow-2xl">
                          {roomType === 'teacher' ? 'GV' : targetName.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      {/* Speaking Pulse Ring */}
                      {callStatus === 'connected' && remoteSpeaking && (
                        <span className="absolute -inset-3 rounded-full border-2 border-emerald-400/80 animate-ping pointer-events-none" />
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white">{targetName}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md text-center px-4">
                      {roomType === 'teacher'
                        ? 'Thầy Cô đang trực tiếp hỗ trợ giải bài tập và hướng dẫn phương pháp săn điểm 10'
                        : 'Bạn học đang cùng kết nối thảo luận và làm bài'}
                    </p>

                    {/* Audio Waveform visualization */}
                    {callStatus === 'connected' && (
                      <div className="flex items-center gap-1.5 mt-5">
                        {[40, 70, 95, 60, 85, 45, 90, 65, 35].map((height, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full bg-emerald-400 transition-all duration-300 ${
                              remoteSpeaking ? 'animate-pulse' : 'opacity-40'
                            }`}
                            style={{
                              height: remoteSpeaking ? `${height * 0.4}px` : '8px',
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Self Camera PIP (Picture-In-Picture) */}
                <div className="absolute top-4 right-4 w-32 sm:w-48 h-24 sm:h-36 rounded-2xl bg-black border-2 border-white/20 shadow-2xl overflow-hidden z-20">
                  {!isVideoOff && hasCameraPermission ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 bg-zinc-800">
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-400">Cam tắt</span>
                    </div>
                  )}

                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold flex items-center gap-1">
                    <span>Bạn</span>
                    {isMuted && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
                    {userAudioLevel > 15 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right In-Call Quick Chat Drawer */}
          {showInCallChat && (
            <div className="w-72 sm:w-80 border-l border-white/10 bg-black/60 backdrop-blur-md flex flex-col shrink-0">
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  Tin nhắn trong cuộc gọi
                </span>
                <button
                  type="button"
                  onClick={() => setShowInCallChat(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                {inCallMessages.map((m, idx) => {
                  const isMe = m.sender === userName;
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-400 mb-0.5 px-1">{m.sender}</span>
                      <div
                        className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                          isMe ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-100 border border-white/10'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-0.5 px-1">{m.time}</span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendInCallMessage} className="p-2 border-t border-white/10 flex gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Gửi công thức, câu hỏi..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 outline-none"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Control Toolbar */}
        <div className="py-4 px-4 sm:px-8 border-t border-white/10 bg-black/60 flex items-center justify-between gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Âm thanh &amp; Hình ảnh chuẩn HD</span>
          </div>

          {/* Central Button Cluster */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-1 sm:flex-initial">
            {/* 1. Mute / Unmute Mic */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                isMuted ? 'bg-rose-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isMuted ? 'Bật Mic' : 'Tắt Mic'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* 2. Video On / Off */}
            <button
              type="button"
              onClick={handleToggleCamera}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                isVideoOff ? 'bg-rose-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isVideoOff ? 'Bật Camera' : 'Tắt Camera'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* 3. Screen Share */}
            <button
              type="button"
              onClick={handleToggleScreenShare}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                isSharingScreen ? 'bg-blue-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isSharingScreen ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình bài tập'}
            >
              {isSharingScreen ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </button>

            {/* 4. Whiteboard */}
            <button
              type="button"
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                showWhiteboard ? 'bg-amber-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title="Bảng trắng viết bài & vẽ hình học"
            >
              <Edit3 className="w-5 h-5" />
            </button>

            {/* 5. End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="w-14 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-95 ml-2"
              title="Kết thúc cuộc gọi"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">{formatTimer(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
