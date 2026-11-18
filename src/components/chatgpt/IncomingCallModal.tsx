import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, Clock } from 'lucide-react';
import { VideoAudioCallModal } from './VideoAudioCallModal';

interface IncomingCallData {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  calleeId: string;
  calleeName: string;
  roomType: 'direct' | 'group';
  callType: 'video' | 'voice';
  expiresAt: number;
}

interface IncomingCallModalProps {
  activeUserId: string;
  activeUserName: string;
  activeUserAvatar?: string;
  isDark?: boolean;
  disabled?: boolean;
}

const STORAGE_KEY_GROUPS = 'max10_real_groups_v15';

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  activeUserId,
  activeUserName,
  activeUserAvatar,
  isDark = true,
  disabled = false,
}) => {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [remainingSec, setRemainingSec] = useState<number>(15);
  const [acceptedCall, setAcceptedCall] = useState<IncomingCallData | null>(null);
  const [responding, setResponding] = useState<boolean>(false);
  const declinedIdsRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringTimerRef = useRef<any>(null);

  const stopRingtone = () => {
    if (ringTimerRef.current) {
      clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  const startIncomingRingtone = () => {
    stopRingtone();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const beep = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(880, now + 0.18);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      };
      beep();
      ringTimerRef.current = setInterval(beep, 1800);
    } catch {}
  };

  // Poll server for incoming ringing calls (supports Call Waiting even when already in a call)
  useEffect(() => {
    if (disabled || !activeUserId) {
      return;
    }

    let isMounted = true;
    const checkIncoming = async () => {
      try {
        let groupIds = '';
        try {
          const raw = localStorage.getItem(STORAGE_KEY_GROUPS);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              groupIds = parsed.map((g: any) => g.id).filter(Boolean).join(',');
            }
          }
        } catch {}

        const excludeParam = acceptedCall?.callId ? `&excludeCallId=${encodeURIComponent(acceptedCall.callId)}` : '';
        const res = await fetch(
          `/api/calls/incoming?userId=${encodeURIComponent(activeUserId)}&userName=${encodeURIComponent(
            activeUserName
          )}&groupIds=${encodeURIComponent(groupIds)}${excludeParam}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        const call: IncomingCallData | null = data?.call || null;
        if (call && !declinedIdsRef.current.has(call.callId)) {
          setIncomingCall((prev) => {
            if (!prev || prev.callId !== call.callId) {
              startIncomingRingtone();
            }
            return call;
          });
          setRemainingSec(Math.max(1, Math.ceil((data.remainingMs || 0) / 1000)));
        } else {
          setIncomingCall((prev) => {
            if (prev) stopRingtone();
            return null;
          });
        }
      } catch {}
    };

    checkIncoming();
    const poll = setInterval(checkIncoming, 1000);
    return () => {
      isMounted = false;
      clearInterval(poll);
      stopRingtone();
    };
  }, [activeUserId, activeUserName, acceptedCall?.callId, disabled]);

  // Live 1s countdown while incoming call modal is open
  useEffect(() => {
    if (!incomingCall) return;
    const timer = setInterval(() => {
      const sec = Math.max(0, Math.ceil((incomingCall.expiresAt - Date.now()) / 1000));
      setRemainingSec(sec);
      if (sec <= 0) {
        stopRingtone();
        setIncomingCall(null);
      }
    }, 300);
    return () => clearInterval(timer);
  }, [incomingCall]);

  const handleDecline = async () => {
    if (!incomingCall || responding) return;
    setResponding(true);
    const targetCall = incomingCall;
    declinedIdsRef.current.add(targetCall.callId);
    stopRingtone();
    setIncomingCall(null);
    try {
      await fetch(`/api/calls/${encodeURIComponent(targetCall.callId)}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUserId, action: 'decline' }),
      });
    } catch {}
    setResponding(false);
  };

  const handleAccept = async () => {
    if (!incomingCall || responding) return;
    setResponding(true);
    const targetCall = incomingCall;
    stopRingtone();

    // If switching from an existing call, end the previous call cleanly first
    if (acceptedCall) {
      try {
        await fetch(`/api/calls/${encodeURIComponent(acceptedCall.callId)}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'ended' }),
        });
      } catch {}
      setAcceptedCall(null);
    }
    window.dispatchEvent(new CustomEvent('max10:end-active-call', { detail: { keepCallId: targetCall.callId } }));

    try {
      const res = await fetch(`/api/calls/${encodeURIComponent(targetCall.callId)}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          action: 'accept',
          calleeName: activeUserName,
          calleeAvatar: activeUserAvatar || '',
          calleeMedia: {
            isMuted: false,
            isVideoOff: targetCall.callType === 'voice',
          },
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setIncomingCall(null);
        setAcceptedCall(targetCall);
      } else {
        setIncomingCall(null);
      }
    } catch {
      setIncomingCall(null);
    } finally {
      setResponding(false);
    }
  };

  return (
    <>
      {/* Call Waiting Floating Banner when already on another call */}
      {incomingCall && acceptedCall && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1200] w-[94vw] max-w-md rounded-2xl border border-amber-400/50 bg-[#121722]/95 text-white p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            {incomingCall.callerAvatar ? (
              <img
                src={incomingCall.callerAvatar}
                alt={incomingCall.callerName}
                className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                {incomingCall.callerName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Clock className="w-3 h-3 animate-pulse" />
                <span>Cuộc gọi chờ · Còn {remainingSec}s</span>
              </div>
              <p className="text-sm font-black truncate">{incomingCall.callerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={responding}
              onClick={handleDecline}
              className="px-2.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold cursor-pointer"
              title="Báo bận & Từ chối"
            >
              Từ chối
            </button>
            <button
              type="button"
              disabled={responding}
              onClick={handleAccept}
              className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer"
              title="Kết thúc cuộc cũ và nghe cuộc gọi chờ"
            >
              Nghe máy
            </button>
          </div>
        </div>
      )}

      {/* Incoming Call Prompt with Accept / Decline */}
      {incomingCall && !acceptedCall && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl text-center space-y-5 ${
              isDark
                ? 'bg-[#121722] border-emerald-500/40 text-white'
                : 'bg-white border-emerald-500/40 text-slate-900'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                {incomingCall.callerAvatar ? (
                  <img
                    src={incomingCall.callerAvatar}
                    alt={incomingCall.callerName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-3xl shadow-lg">
                    {incomingCall.callerName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center absolute -bottom-1 -right-1 border-2 border-white dark:border-[#121722] shadow-md">
                  {incomingCall.callType === 'video' ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <Phone className="w-4 h-4" />
                  )}
                </span>
              </div>

              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 mb-2">
                {incomingCall.callType === 'video' ? 'Cuộc gọi Video đến' : 'Cuộc gọi Thoại đến'}
              </span>

              <h3 className="text-lg font-black truncate max-w-full">{incomingCall.callerName}</h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Tự hủy sau {remainingSec} giây nếu không nghe máy</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={responding}
                onClick={handleDecline}
                className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Từ chối cuộc gọi</span>
              </button>

              <button
                type="button"
                disabled={responding}
                onClick={handleAccept}
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
              >
                {incomingCall.callType === 'video' ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
                <span>Đồng ý</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accepted Call Active Stage (Front Camera + Mic + WebRTC) */}
      {acceptedCall && (
        <VideoAudioCallModal
          isOpen={true}
          onClose={() => setAcceptedCall(null)}
          callType={acceptedCall.callType}
          roomType={acceptedCall.roomType}
          targetName={acceptedCall.callerName}
          targetAvatar={acceptedCall.callerAvatar}
          targetId={acceptedCall.callerId}
          callerId={activeUserId}
          callId={acceptedCall.callId}
          role="callee"
          userName={activeUserName}
          userAvatar={activeUserAvatar}
          isDark={isDark}
        />
      )}
    </>
  );
};
