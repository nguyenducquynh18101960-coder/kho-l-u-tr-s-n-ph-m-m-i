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
  X,
  Send,
  Clock,
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
  targetId?: string;
  callerId?: string;
  callId?: string;
  role?: 'caller' | 'callee';
  participants?: CallParticipant[];
  userName: string;
  userAvatar?: string;
  userBadge?: string;
  isDark?: boolean;
}

const RING_DURATION_SECONDS = 15;

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const VideoAudioCallModal: React.FC<VideoAudioCallModalProps> = ({
  isOpen,
  onClose,
  callType = 'video',
  roomType = 'direct',
  targetName,
  targetAvatar,
  targetBadge,
  targetSubject,
  targetId,
  callerId,
  callId: initialCallId,
  role = 'caller',
  participants = [],
  userName = 'Bạn học',
  userAvatar,
  isDark = true,
}) => {
  // Call status: 'ringing' -> 'connected' -> 'declined' | 'timeout' | 'ended'
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'declined' | 'timeout' | 'ended'>(
    role === 'callee' ? 'connected' : 'ringing'
  );
  const [statusReasonText, setStatusReasonText] = useState<string>('');
  const [ringRemainingSec, setRingRemainingSec] = useState<number>(RING_DURATION_SECONDS);
  const [totalRingSeconds, setTotalRingSeconds] = useState<number>(RING_DURATION_SECONDS);
  const [isBusyWaiting, setIsBusyWaiting] = useState<boolean>(false);
  const [isExtendingWait, setIsExtendingWait] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);

  // Audio & Video controls
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(callType === 'voice');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [isSharingScreen, setIsSharingScreen] = useState<boolean>(false);
  const [showWhiteboard, setShowWhiteboard] = useState<boolean>(false);
  const [showInCallChat, setShowInCallChat] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Remote peer media state & live stream status
  const [remoteMediaState, setRemoteMediaState] = useState<{ isMuted: boolean; isVideoOff: boolean }>({
    isMuted: false,
    isVideoOff: callType === 'voice',
  });
  const [hasRemoteVideoTrack, setHasRemoteVideoTrack] = useState<boolean>(false);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState<number>(0);

  // In-call chat messages
  const [inCallMessages, setInCallMessages] = useState<Array<{ id?: string; sender: string; text: string; time: string }>>([]);
  const [chatInput, setChatInput] = useState<string>('');

  // Hardware & WebRTC refs
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeCallIdRef = useRef<string | undefined>(initialCallId);
  const expiresAtRef = useRef<number>(Date.now() + RING_DURATION_SECONDS * 1000);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const offerSentRef = useRef<boolean>(false);
  const answerSentRef = useRef<boolean>(false);
  const appliedRemoteOfferRef = useRef<boolean>(false);
  const appliedRemoteAnswerRef = useRef<boolean>(false);
  const addedCandidateCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const animFrameRef = useRef<number | null>(null);

  // Audio Context & Ringtone
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringtoneTimerRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [userAudioLevel, setUserAudioLevel] = useState<number>(0);

  // Whiteboard Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawColor, setDrawColor] = useState<string>('#3b82f6');
  const [brushSize, setBrushSize] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const isRealSignaledCall = Boolean(
    roomType !== 'teacher' && (initialCallId || (targetId && callerId))
  );

  // Active group participants fallback for UI display
  const activeParticipants: CallParticipant[] = React.useMemo(() => {
    if (roomType === 'group') {
      return participants && participants.length > 0 ? participants : [];
    }
    return [];
  }, [roomType, participants]);

  // Web Audio Ringtone Synth
  const stopRingtone = () => {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
  };

  const playRingtone = () => {
    stopRingtone();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioCtxRef.current && audioCtxRef.current.state !== 'closed' ? audioCtxRef.current : new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const triggerBeep = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.1);
        osc2.stop(now + 1.1);
      };

      triggerBeep();
      ringtoneTimerRef.current = setInterval(triggerBeep, 2400);
    } catch {}
  };

  const playConnectedChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioCtxRef.current && audioCtxRef.current.state !== 'closed' ? audioCtxRef.current : new AudioCtx();
      audioCtxRef.current = ctx;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.05, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch {}
  };

  const syncLocalVideoElement = () => {
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localVideoRef.current.play().catch(() => {});
    }
  };

  const syncRemoteMediaElements = () => {
    if (remoteAudioRef.current && remoteStreamRef.current) {
      if (remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
      }
      remoteAudioRef.current.muted = isSpeakerMuted;
      remoteAudioRef.current.play().catch(() => {});
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      remoteVideoRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    syncLocalVideoElement();
  }, [isVideoOff, hasCameraPermission, showWhiteboard, callStatus]);

  useEffect(() => {
    syncRemoteMediaElements();
  }, [isSpeakerMuted, hasRemoteVideoTrack, remoteMediaState.isVideoOff, callStatus, showWhiteboard]);

  const cleanupAllMedia = () => {
    stopRingtone();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  const sendSignal = async (payload: {
    offer?: any;
    answer?: any;
    candidate?: any;
    mediaState?: { isMuted: boolean; isVideoOff: boolean };
    chatMessage?: { id: string; senderId: string; senderName: string; text: string; time: string };
  }) => {
    const cid = activeCallIdRef.current;
    if (!cid) return;
    try {
      await fetch(`/api/calls/${encodeURIComponent(cid)}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, ...payload }),
      });
    } catch {}
  };

  const setupPeerConnection = () => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ candidate: event.candidate.toJSON() });
      }
    };

    pc.ontrack = (event) => {
      const tracks = event.streams?.[0]?.getTracks() || [event.track];
      tracks.forEach((track) => {
        if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
          remoteStream.addTrack(track);
        }
        if (track.kind === 'video') {
          setHasRemoteVideoTrack(true);
        }
      });
      syncRemoteMediaElements();

      // Remote speaking visualiser from real remote audio
      try {
        const remoteAudioTracks = remoteStream.getAudioTracks();
        if (remoteAudioTracks.length > 0 && window.AudioContext) {
          const rCtx = new AudioContext();
          const rSrc = rCtx.createMediaStreamSource(new MediaStream([remoteAudioTracks[0]]));
          const rAnalyser = rCtx.createAnalyser();
          rAnalyser.fftSize = 32;
          rSrc.connect(rAnalyser);
          const buf = new Uint8Array(rAnalyser.frequencyBinCount);
          const tick = () => {
            if (!isMountedRef.current || rCtx.state === 'closed') return;
            rAnalyser.getByteFrequencyData(buf);
            const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
            setRemoteAudioLevel(avg);
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      } catch {}
    };

    return pc;
  };

  // Main Call Lifecycle & Real Media Setup
  useEffect(() => {
    if (!isOpen) return;
    isMountedRef.current = true;

    activeCallIdRef.current = initialCallId;
    expiresAtRef.current = Date.now() + RING_DURATION_SECONDS * 1000;
    offerSentRef.current = false;
    answerSentRef.current = false;
    appliedRemoteOfferRef.current = false;
    appliedRemoteAnswerRef.current = false;
    addedCandidateCountRef.current = 0;

    setDuration(0);
    setHasRemoteVideoTrack(false);
    setCameraError(null);
    setStatusReasonText('');
    setIsMuted(false);
    setIsVideoOff(callType === 'voice');
    setRemoteMediaState({ isMuted: false, isVideoOff: callType === 'voice' });
    setRingRemainingSec(RING_DURATION_SECONDS);
    setTotalRingSeconds(RING_DURATION_SECONDS);
    setIsBusyWaiting(false);
    setCallStatus(role === 'callee' ? 'connected' : 'ringing');
    setInCallMessages(
      roomType === 'teacher'
        ? [
            {
              sender: targetName,
              text: `Chào em ${userName}! Em hãy bật mic và camera lên để Thầy/Cô hướng dẫn trực tiếp nhé!`,
              time: 'Vừa xong',
            },
          ]
        : []
    );

    if (role === 'caller') {
      playRingtone();
    } else {
      playConnectedChime();
    }

    let statusPollTimer: any = null;
    let countdownTimer: any = null;
    let teacherConnectTimer: any = null;

    async function initMediaAndSignaling() {
      // 1. Capture real front-facing camera (facingMode: 'user') & microphone immediately
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video:
              callType === 'video'
                ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
                : false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

          if (!isMountedRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          localStreamRef.current = stream;
          setHasCameraPermission(true);
          syncLocalVideoElement();

          // Local Mic speaking level visualiser
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx && stream.getAudioTracks().length > 0) {
              const actx = new AudioCtx();
              const src = actx.createMediaStreamSource(stream);
              const analyser = actx.createAnalyser();
              analyser.fftSize = 64;
              src.connect(analyser);
              analyserRef.current = analyser;

              const checkAudio = () => {
                if (!isMountedRef.current) return;
                if (analyserRef.current) {
                  const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                  analyserRef.current.getByteFrequencyData(dataArray);
                  let sum = 0;
                  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                  setUserAudioLevel(sum / dataArray.length);
                }
                animFrameRef.current = requestAnimationFrame(checkAudio);
              };
              animFrameRef.current = requestAnimationFrame(checkAudio);
            }
          } catch {}
        } else {
          setHasCameraPermission(false);
          setCameraError('Trình duyệt không hỗ trợ Camera/Micro.');
        }
      } catch {
        if (isMountedRef.current) {
          setHasCameraPermission(false);
          setCameraError('Chưa cấp quyền Camera/Micro — hãy cho phép quyền trình duyệt để nói & thấy hình.');
        }
      }

      if (!isMountedRef.current) return;

      // 2. Teacher room fallback (no remote human peer — show brief waiting ring before connecting)
      if (!isRealSignaledCall) {
        teacherConnectTimer = setTimeout(() => {
          if (!isMountedRef.current) return;
          stopRingtone();
          playConnectedChime();
          setCallStatus('connected');
          if (roomType === 'teacher') {
            aiVoice
              .speak(`Thầy cô ${targetName} đã kết nối cuộc gọi. Em hãy bật mic và camera để hỏi bài nhé!`)
              .catch(() => {});
          }
        }, 2800);
        return;
      }

      // 3. Real peer-to-peer signaled call flow
      if (role === 'caller' && !activeCallIdRef.current) {
        try {
          const res = await fetch('/api/calls/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callerId: callerId || 'user-local',
              callerName: userName,
              callerAvatar: userAvatar || '',
              calleeId: targetId,
              calleeName: targetName,
              calleeAvatar: targetAvatar || '',
              roomType: roomType === 'group' ? 'group' : 'direct',
              callType,
              callerMedia: { isMuted: false, isVideoOff: callType === 'voice' },
            }),
          });
          const data = await res.json();
          if (data?.success && data.call) {
            activeCallIdRef.current = data.call.callId;
            expiresAtRef.current = data.call.expiresAt || Date.now() + RING_DURATION_SECONDS * 1000;
            setIsBusyWaiting(Boolean(data.call.isBusyWaiting));
          }
        } catch {}
      }

      // 15-second (extendable) waiting/ringing countdown timer for Caller
      if (role === 'caller') {
        countdownTimer = setInterval(async () => {
          if (!isMountedRef.current) return;
          const remainingMs = Math.max(0, expiresAtRef.current - Date.now());
          const sec = Math.ceil(remainingMs / 1000);
          setRingRemainingSec(sec);

          if (remainingMs <= 0) {
            clearInterval(countdownTimer);
            setCallStatus((prev) => {
              if (prev !== 'ringing') return prev;
              stopRingtone();
              setStatusReasonText('Hết thời gian chờ không có phản hồi — Đã tự động hủy cuộc gọi.');
              if (activeCallIdRef.current) {
                fetch(`/api/calls/${encodeURIComponent(activeCallIdRef.current)}/end`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reason: 'timeout' }),
                }).catch(() => {});
              }
              setTimeout(() => {
                if (isMountedRef.current) {
                  cleanupAllMedia();
                  onClose();
                }
              }, 1800);
              return 'timeout';
            });
          }
        }, 250);
      }

      // Signaling & Status poll every 650ms
      const pollSignaling = async () => {
        const cid = activeCallIdRef.current;
        if (!cid || !isMountedRef.current) return;
        try {
          const res = await fetch(`/api/calls/${encodeURIComponent(cid)}/status?role=${role}`);
          if (!res.ok) return;
          const data = await res.json();
          const call = data?.call;
          if (!call || !isMountedRef.current) return;

          setIsBusyWaiting(Boolean(call.isBusyWaiting));
          if (call.status === 'ringing' && call.expiresAt && call.expiresAt > expiresAtRef.current) {
            expiresAtRef.current = call.expiresAt;
            setRingRemainingSec(Math.ceil((call.expiresAt - Date.now()) / 1000));
          }

          // Update remote media state (avatar vs video, mic indicator)
          const remoteMedia = role === 'caller' ? call.calleeMedia : call.callerMedia;
          if (remoteMedia) {
            setRemoteMediaState({
              isMuted: !!remoteMedia.isMuted,
              isVideoOff: !!remoteMedia.isVideoOff,
            });
          }

          // Sync in-call messages from remote side
          if (Array.isArray(call.chatMessages) && call.chatMessages.length > 0) {
            setInCallMessages((prev) => {
              const seen = new Set(prev.map((m) => m.id || `${m.sender}-${m.text}-${m.time}`));
              const additions = call.chatMessages
                .filter((m: any) => !seen.has(m.id))
                .map((m: any) => ({
                  id: m.id,
                  sender: m.senderName,
                  text: m.text,
                  time: m.time,
                }));
              return additions.length > 0 ? [...prev, ...additions] : prev;
            });
          }

          if (call.status === 'declined') {
            stopRingtone();
            setCallStatus('declined');
            setStatusReasonText(`${targetName} đã từ chối cuộc gọi.`);
            setTimeout(() => {
              if (isMountedRef.current) {
                cleanupAllMedia();
                onClose();
              }
            }, 1500);
            return;
          }

          if (call.status === 'timeout') {
            stopRingtone();
            setCallStatus('timeout');
            setStatusReasonText('Hết 15 giây không có phản hồi — Đã tự động hủy cuộc gọi.');
            setTimeout(() => {
              if (isMountedRef.current) {
                cleanupAllMedia();
                onClose();
              }
            }, 1800);
            return;
          }

          if (call.status === 'ended' || call.status === 'cancelled') {
            stopRingtone();
            setCallStatus('ended');
            setStatusReasonText('Cuộc gọi đã kết thúc.');
            setTimeout(() => {
              if (isMountedRef.current) {
                cleanupAllMedia();
                onClose();
              }
            }, 900);
            return;
          }

          if (call.status === 'accepted') {
            setCallStatus((prev) => {
              if (prev === 'ringing') {
                stopRingtone();
                playConnectedChime();
                return 'connected';
              }
              return prev;
            });

            const pc = setupPeerConnection();

            // Caller creates & sends SDP Offer once accepted
            if (role === 'caller' && !offerSentRef.current) {
              offerSentRef.current = true;
              try {
                const offer = await pc.createOffer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: true,
                });
                await pc.setLocalDescription(offer);
                await sendSignal({
                  offer,
                  mediaState: { isMuted, isVideoOff },
                });
              } catch {}
            }

            // Caller receives Callee's SDP Answer
            if (role === 'caller' && call.answer && !appliedRemoteAnswerRef.current) {
              appliedRemoteAnswerRef.current = true;
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(call.answer));
              } catch {}
            }

            // Callee receives Caller's SDP Offer and sends Answer
            if (role === 'callee' && call.offer && !appliedRemoteOfferRef.current) {
              appliedRemoteOfferRef.current = true;
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
                if (!answerSentRef.current) {
                  answerSentRef.current = true;
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  await sendSignal({
                    answer,
                    mediaState: { isMuted, isVideoOff },
                  });
                }
              } catch {}
            }

            // Apply remote ICE candidates
            const remoteCandidates = role === 'caller' ? call.calleeCandidates : call.callerCandidates;
            if (Array.isArray(remoteCandidates) && pc.remoteDescription) {
              while (addedCandidateCountRef.current < remoteCandidates.length) {
                const cand = remoteCandidates[addedCandidateCountRef.current];
                addedCandidateCountRef.current += 1;
                if (cand) {
                  pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                }
              }
            }
          }
        } catch {}
      };

      pollSignaling();
      statusPollTimer = setInterval(pollSignaling, 650);
    }

    initMediaAndSignaling();

    const onExternalEndCall = (ev: Event) => {
      const detail = (ev as CustomEvent<{ keepCallId?: string }>).detail;
      if (detail?.keepCallId && detail.keepCallId === activeCallIdRef.current) return;
      if (activeCallIdRef.current) {
        fetch(`/api/calls/${encodeURIComponent(activeCallIdRef.current)}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'ended' }),
        }).catch(() => {});
      }
      cleanupAllMedia();
      onClose();
    };
    window.addEventListener('max10:end-active-call', onExternalEndCall);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('max10:end-active-call', onExternalEndCall);
      clearInterval(statusPollTimer);
      clearInterval(countdownTimer);
      clearTimeout(teacherConnectTimer);
      cleanupAllMedia();
    };
  }, [isOpen, callType, roomType, targetName, targetId, initialCallId, role]);

  // Duration Timer when connected
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  // Toggle Mute Mic (Audio continues independently of camera)
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
    }
    sendSignal({ mediaState: { isMuted: next, isVideoOff } });
  };

  // Toggle Camera (When off -> show Avatar while mic & remote audio stay active!)
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
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: !localStreamRef.current || localStreamRef.current.getAudioTracks().length === 0,
        });
        if (!localStreamRef.current) {
          localStreamRef.current = videoStream;
        } else {
          videoStream.getVideoTracks().forEach((vt) => {
            localStreamRef.current!.addTrack(vt);
            if (pcRef.current) {
              const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
              if (sender) {
                sender.replaceTrack(vt).catch(() => {});
              } else {
                pcRef.current.addTrack(vt, localStreamRef.current!);
              }
            }
          });
        }
        setHasCameraPermission(true);
        setCameraError(null);
        syncLocalVideoElement();
      } catch {
        setCameraError('Không thể bật camera. Hãy kiểm tra quyền truy cập camera.');
      }
    }

    sendSignal({ mediaState: { isMuted, isVideoOff: next } });
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
    const msgId = 'cmsg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const text = chatInput.trim();
    const newMsg = {
      id: msgId,
      sender: userName,
      text,
      time: timeStr,
    };
    setInCallMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    if (activeCallIdRef.current) {
      sendSignal({
        chatMessage: {
          id: msgId,
          senderId: callerId || 'user-local',
          senderName: userName,
          text,
          time: timeStr,
        },
      });
    } else if (roomType === 'teacher') {
      setTimeout(() => {
        setInCallMessages((prev) => [
          ...prev,
          {
            sender: targetName,
            text: `Thầy/Cô đã nhận câu hỏi "${text.slice(0, 35)}..." và đang giải đáp trực tiếp cho em.`,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 1200);
    }
  };

  // Extend Waiting Time (+15s) while calling
  const handleExtendWaiting = async () => {
    if (callStatus !== 'ringing' || isExtendingWait) return;
    setIsExtendingWait(true);
    const nextExpires = Math.max(expiresAtRef.current, Date.now()) + RING_DURATION_SECONDS * 1000;
    expiresAtRef.current = nextExpires;
    const nextSec = Math.ceil((nextExpires - Date.now()) / 1000);
    setRingRemainingSec(nextSec);
    setTotalRingSeconds((prev) => Math.max(prev, nextSec));

    if (activeCallIdRef.current) {
      try {
        const res = await fetch(`/api/calls/${encodeURIComponent(activeCallIdRef.current)}/extend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ extraSeconds: RING_DURATION_SECONDS }),
        });
        const data = await res.json();
        if (data?.success && data.call?.expiresAt) {
          expiresAtRef.current = data.call.expiresAt;
          const updatedSec = Math.ceil((data.call.expiresAt - Date.now()) / 1000);
          setRingRemainingSec(updatedSec);
          setTotalRingSeconds((prev) => Math.max(prev, updatedSec));
        }
      } catch {}
    }
    setIsExtendingWait(false);
  };

  // End Call
  const handleEndCall = async () => {
    const reason = callStatus === 'ringing' && role === 'caller' ? 'cancelled' : 'ended';
    setCallStatus('ended');
    if (activeCallIdRef.current) {
      fetch(`/api/calls/${encodeURIComponent(activeCallIdRef.current)}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }).catch(() => {});
    }
    cleanupAllMedia();
    setTimeout(() => {
      onClose();
    }, 250);
  };

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const showRemoteVideoFeed =
    callStatus === 'connected' && hasRemoteVideoTrack && !remoteMediaState.isVideoOff;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200 ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      {/* Hidden persistent remote <audio> so two-way voice keeps playing even when camera is off */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

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
                  {roomType === 'teacher' ? 'GV' : roomType === 'group' ? '👥' : targetName.slice(0, 2).toUpperCase()}
                </div>
              )}
              {callStatus === 'connected' && (
                <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-900 absolute -bottom-0.5 -right-0.5" />
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
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>
                      {isBusyWaiting
                        ? `${targetName} đang trong cuộc gọi khác · Đang chờ máy (${ringRemainingSec}s)`
                        : `Đang gọi chờ ${targetName}... (tự hủy sau ${ringRemainingSec}s)`}
                    </span>
                  </span>
                ) : callStatus === 'declined' || callStatus === 'timeout' || callStatus === 'ended' ? (
                  <span className="text-rose-400 font-bold">{statusReasonText || 'Cuộc gọi đã kết thúc'}</span>
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
              onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
              className={`p-2 rounded-2xl transition-all cursor-pointer ${
                isSpeakerMuted ? 'bg-rose-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isSpeakerMuted ? 'Bật loa nghe' : 'Tắt loa'}
            >
              {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

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
              title="Kết thúc cuộc gọi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Waiting / Ringing Progress Bar */}
        {callStatus === 'ringing' && isRealSignaledCall && (
          <div className="w-full h-1 bg-white/10 shrink-0">
            <div
              className={`h-full transition-all duration-300 ${isBusyWaiting ? 'bg-orange-400' : 'bg-amber-400'}`}
              style={{ width: `${Math.max(0, Math.min(100, (ringRemainingSec / Math.max(1, totalRingSeconds)) * 100))}%` }}
            />
          </div>
        )}

        {/* Main Stage Grid */}
        <div className="flex-1 min-h-0 relative flex overflow-hidden">
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
              /* Group Study Call Video Grid */
              <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto">
                {/* 1. Self Front Camera Cell or User Avatar */}
                <div className="rounded-3xl bg-zinc-900 border border-white/10 relative overflow-hidden flex items-center justify-center min-h-[190px] shadow-lg">
                  {!isVideoOff && hasCameraPermission ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4">
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={userName}
                          className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/60 shadow-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-2xl shadow-md">
                          {userName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs text-slate-300 font-semibold">
                        Camera đang tắt · Micro {isMuted ? 'đã tắt' : 'đang bật'}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-black/65 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1.5">
                    <span>{userName} (Bạn)</span>
                    {isMuted ? (
                      <MicOff className="w-3 h-3 text-rose-400" />
                    ) : (
                      <Mic className={`w-3 h-3 ${userAudioLevel > 12 ? 'text-emerald-300' : 'text-emerald-400'}`} />
                    )}
                  </div>
                </div>

                {/* 2. Remote Live Video / Avatar Cell in Group Call */}
                <div className="rounded-3xl bg-zinc-900 border border-white/10 relative overflow-hidden flex items-center justify-center min-h-[190px] shadow-lg">
                  {showRemoteVideoFeed ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      {targetAvatar ? (
                        <img
                          src={targetAvatar}
                          alt={targetName}
                          className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/50 shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-2xl">
                          👥
                        </div>
                      )}
                      <span className="text-xs font-bold text-white">{targetName}</span>
                      <span className="text-[11px] text-amber-300 font-semibold">
                        {callStatus === 'ringing'
                          ? `Đang gọi chờ... (${ringRemainingSec}s)`
                          : 'Đang kết nối âm thanh trực tiếp'}
                      </span>
                      {callStatus === 'ringing' && isRealSignaledCall && role === 'caller' && (
                        <button
                          type="button"
                          disabled={isExtendingWait}
                          onClick={handleExtendWaiting}
                          className="mt-1 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[11px] font-bold cursor-pointer"
                        >
                          ⏱️ Chờ thêm +15s
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Other Group Members */}
                {activeParticipants
                  .filter((p) => p.id !== callerId)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="rounded-3xl bg-zinc-900 border border-white/10 relative overflow-hidden flex items-center justify-center min-h-[190px] shadow-lg"
                    >
                      <div className="flex flex-col items-center gap-2 p-4">
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.isMuted ? (
                          <MicOff className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Mic className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              /* 1-on-1 Direct Friend or Teacher Call Stage */
              <div className="w-full h-full rounded-3xl bg-zinc-900 border border-white/10 relative overflow-hidden flex items-center justify-center shadow-2xl">
                {/* Remote Video Stream when remote camera is ON */}
                {showRemoteVideoFeed ? (
                  <div className="w-full h-full relative bg-black">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-2xl bg-black/65 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-2">
                      <span>{targetName}</span>
                      {remoteMediaState.isMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                  </div>
                ) : (
                  /* Remote Avatar View (shown during Ringing, Voice Calls, or when Remote turns Camera OFF — Audio stays LIVE) */
                  <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-[#141923] via-[#0f131a] to-[#0a0d12] p-6">
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="relative mb-5">
                        {callStatus === 'ringing' && (
                          <>
                            <span className="absolute -inset-4 rounded-full border-2 border-amber-400/45 animate-ping pointer-events-none" />
                            <span className="absolute -inset-2 rounded-full border border-emerald-400/40 animate-pulse pointer-events-none" />
                          </>
                        )}
                        {targetAvatar ? (
                          <img
                            src={targetAvatar}
                            alt={targetName}
                            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-emerald-500/50 shadow-2xl relative z-10"
                          />
                        ) : (
                          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-4xl sm:text-5xl shadow-2xl relative z-10">
                            {roomType === 'teacher' ? 'GV' : targetName.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        {callStatus === 'connected' && remoteAudioLevel > 12 && !remoteMediaState.isMuted && (
                          <span className="absolute -inset-3 rounded-full border-2 border-emerald-400/80 animate-ping pointer-events-none" />
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-white">{targetName}</h3>

                      {callStatus === 'ringing' ? (
                        <div className="mt-3 flex flex-col items-center gap-2.5">
                          <span
                            className={`px-4 py-1.5 rounded-2xl border text-xs sm:text-sm font-extrabold flex items-center gap-2 ${
                              isBusyWaiting
                                ? 'bg-orange-500/15 border-orange-400/45 text-orange-300'
                                : 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                            }`}
                          >
                            <Clock className="w-4 h-4 animate-pulse shrink-0" />
                            <span>
                              {isBusyWaiting
                                ? `${targetName} đang có cuộc gọi khác · Đang chờ máy (${ringRemainingSec}s)`
                                : `Đang gọi chờ phản hồi... Còn ${ringRemainingSec} giây`}
                            </span>
                          </span>
                          <p className="text-xs text-slate-400 max-w-sm">
                            {isBusyWaiting
                              ? 'Cuộc gọi đang hiển thị ở chế độ Cuộc gọi chờ bên phía người nhận.'
                              : 'Đang đổ chuông chờ người nhận nghe máy. Hết giờ sẽ tự động hủy.'}
                          </p>
                          {isRealSignaledCall && role === 'caller' && (
                            <button
                              type="button"
                              disabled={isExtendingWait}
                              onClick={handleExtendWaiting}
                              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-amber-200 text-xs font-extrabold transition-colors cursor-pointer"
                            >
                              ⏱️ Đợi thêm +15 giây
                            </button>
                          )}
                        </div>
                      ) : callStatus === 'declined' || callStatus === 'timeout' || callStatus === 'ended' ? (
                        <div className="mt-3 px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs sm:text-sm font-bold">
                          {statusReasonText || 'Cuộc gọi đã kết thúc'}
                        </div>
                      ) : (
                        <>
                          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-md px-4">
                            {remoteMediaState.isVideoOff
                              ? `${targetName} đang tắt camera (vẫn đang nói và nghe bình thường)`
                              : roomType === 'teacher'
                              ? 'Thầy Cô đang trực tiếp hỗ trợ giải bài tập'
                              : 'Đang kết nối âm thanh trực tiếp 2 chiều'}
                          </p>

                          {/* Live Voice Status Badge */}
                          <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/[0.06] border border-white/10 text-xs">
                            {remoteMediaState.isMuted ? (
                              <>
                                <MicOff className="w-3.5 h-3.5 text-rose-400" />
                                <span className="text-rose-300 font-semibold">Đối phương đang tắt mic</span>
                              </>
                            ) : (
                              <>
                                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300 font-semibold">Micro &amp; Loa đang hoạt động</span>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Self Front Camera PIP (Shows real face or User Avatar when Cam Off) */}
                <div className="absolute top-4 right-4 w-36 sm:w-52 h-28 sm:h-40 rounded-2xl bg-zinc-900 border-2 border-white/25 shadow-2xl overflow-hidden z-20 flex items-center justify-center">
                  {!isVideoOff && hasCameraPermission ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 bg-gradient-to-b from-zinc-800 to-zinc-900">
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={userName}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-emerald-400/70 shadow-md mb-1.5"
                        />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-lg mb-1.5">
                          {userName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-slate-300 leading-tight">
                        {isVideoOff ? 'Cam tắt · Mic vẫn bật' : 'Chưa có camera'}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold flex items-center gap-1">
                    <span>Bạn</span>
                    {isMuted ? (
                      <MicOff className="w-2.5 h-2.5 text-rose-400" />
                    ) : (
                      <Mic className="w-2.5 h-2.5 text-emerald-400" />
                    )}
                    {!isMuted && userAudioLevel > 15 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute bottom-4 left-4 right-4 sm:right-auto max-w-md px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-semibold z-20">
                    {cameraError}
                  </div>
                )}
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

              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                {inCallMessages.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Chưa có tin nhắn nào trong cuộc gọi</p>
                ) : (
                  inCallMessages.map((m, idx) => {
                    const isMe = m.sender === userName;
                    return (
                      <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
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
                  })
                )}
              </div>

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
            <span>{isVideoOff ? 'Camera tắt (hiện ảnh đại diện) · Mic bật' : 'Camera trước & Mic thật'}</span>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-1 sm:flex-initial">
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

            <button
              type="button"
              onClick={handleToggleCamera}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                isVideoOff ? 'bg-rose-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isVideoOff ? 'Bật Camera' : 'Tắt Camera (hiện ảnh đại diện)'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

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

            <button
              type="button"
              onClick={handleEndCall}
              className="w-14 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-95 ml-2"
              title="Kết thúc / Hủy cuộc gọi"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              {callStatus === 'ringing' ? `${ringRemainingSec}s` : formatTimer(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
