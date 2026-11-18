import { useState, useEffect, useRef } from 'react';
import { formatAccurateTime } from '../utils/timeFormat';

export interface SystemStatus {
  isUpdating: boolean;
  version: string;
  publishedUrl: string;
  message: string;
  estimatedMinutes?: number;
  estimatedSeconds?: number;
  updatedAt?: number;
  lastPublishedAt?: number;
  serverTime?: number;
}

export function useAutoUpdate() {
  const [status, setStatus] = useState<SystemStatus>({
    isUpdating: false,
    version: '2026.10.11.2',
    publishedUrl: 'https://max-ai-gia-s-i-m-10-thcs.ai.studio',
    message: 'Max10 AI đã cập nhật! Chỉ cần xuất bản là cập nhật ngay chỉ sau 60 giây (không phải chờ 1 tiếng hay quay lại ngày hôm sau).',
    estimatedMinutes: 1,
  });

  const initialVersionRef = useRef<string | null>(null);
  const secondsUntilRefreshRef = useRef<number | null>(null);
  const [autoUpdateNotice, setAutoUpdateNotice] = useState<string>('');
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system/status?t=' + Date.now());
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (res.ok && ct.includes('application/json')) {
        const data: SystemStatus = await res.json();
        if (data && typeof data.isUpdating === 'boolean') {
          setStatus(data);

          // Check for new version publish
          if (!initialVersionRef.current) {
            initialVersionRef.current = data.version;
          } else if (data.version && data.version !== initialVersionRef.current) {
            initialVersionRef.current = data.version;
            // New version detected! Use the exact publish timestamp from server
            const publishTime =
              typeof data.lastPublishedAt === 'number' && data.lastPublishedAt > 0
                ? data.lastPublishedAt
                : typeof data.updatedAt === 'number' && data.updatedAt > 0
                ? data.updatedAt
                : Date.now();
            const exactTimeStr = formatAccurateTime(publishTime, formatAccurateTime(Date.now()));

            if (secondsUntilRefreshRef.current === null) {
              secondsUntilRefreshRef.current = 60;
              setSecondsUntilRefresh(60); // Đếm ngược chính xác 60 giây tự động tải lại
              setAutoUpdateNotice(
                `🚀 Bản cập nhật mới đã được xuất bản lúc ${exactTimeStr}! Hệ thống tự động cập nhật chỉ sau 60 giây...`
              );

              // 1. Play audio chime if possible
              try {
                const AudioContextClass =
                  window.AudioContext ||
                  (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (AudioContextClass) {
                  const ctx = new AudioContextClass();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.type = 'triangle';
                  osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                  osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.35);
                  gain.gain.setValueAtTime(0.2, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.start(ctx.currentTime);
                  osc.stop(ctx.currentTime + 0.52);
                }
              } catch (e) {}

              // 2. Browser push notification with exact publish time
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification(`📢 Max10 AI vừa cập nhật lúc ${exactTimeStr}!`, {
                    body: 'Quản trị viên Mạc Khánh Duy vừa phát hành bản cập nhật mới. Đã có tin nhắn thông báo tự động trong hộp thư của bạn!',
                    icon: '/max10-avatar.jpg',
                  });
                } catch (e) {}
              }

              // 3. Save admin update message directly into active localStorage direct messages with exact publishTime
              try {
                const STORAGE_KEY_DIRECT_MSGS = 'max10_real_direct_chat_messages_v15';
                const saved = localStorage.getItem(STORAGE_KEY_DIRECT_MSGS);
                const dms = saved ? JSON.parse(saved) : {};
                const updateMsg = {
                  id: 'dm-admin-update-' + publishTime,
                  senderId: 'admin-mac-khanh-duy',
                  senderName: 'Mạc Khánh Duy (Quản trị viên)',
                  senderAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=MacKhanhDuy',
                  recipientId: 'all_broadcast',
                  content:
                    '📢 [CẬP NHẬT MỚI TỪ MAX10 AI - PHIÊN BẢN STUDY HUB]\n🚀 Max10 AI vừa nâng cấp toàn diện giao diện & tính năng học tập thông minh:\n✨ Không gian Study Hub 3 vùng gọn gàng: Gia sư AI, Cộng đồng & Chat, Kho Luyện Tập (hỗ trợ làm đề Offline), Công cụ AI & Lịch học.\n🎥 Gọi Video & Thoại dùng Camera & Micro thật, tự động hiện ảnh đại diện khi tắt cam và hộp thoại nhận/từ chối cuộc gọi tức thì.\n💬 Nhắn tin, trả lời trích dẫn và gọi @Max10 AI giải bài ngay trong nhóm lẫn chat 1-1.\nChúc các bạn học tập hiệu quả và chinh phục Điểm 10!',
                  timestamp: exactTimeStr,
                  createdAt: publishTime,
                  isAdminUpdate: true,
                };

                ['all_broadcast', 'admin-mac-khanh-duy'].forEach((channelKey) => {
                  if (!Array.isArray(dms[channelKey])) dms[channelKey] = [];
                  const alreadyExists = dms[channelKey].some(
                    (m: any) => m && (m.id === updateMsg.id || m.createdAt === publishTime)
                  );
                  if (!alreadyExists) {
                    dms[channelKey].push(updateMsg);
                  }
                });

                localStorage.setItem(STORAGE_KEY_DIRECT_MSGS, JSON.stringify(dms));

                // Dispatch custom event for real-time listener
                window.dispatchEvent(
                  new CustomEvent('max10:admin-message', {
                    detail: updateMsg,
                  })
                );
              } catch (e) {}
            }
          }
        }
      }
    } catch (e) {
      // offline fallback
    }
  };

  // Poll server every 20 seconds without restarting on countdown ticks
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  // Handle countdown refresh
  useEffect(() => {
    if (secondsUntilRefresh !== null && secondsUntilRefresh > 0) {
      countdownIntervalRef.current = setTimeout(() => {
        const next = secondsUntilRefresh - 1;
        secondsUntilRefreshRef.current = next;
        setSecondsUntilRefresh(next);
      }, 1000);
    } else if (secondsUntilRefresh === 0) {
      // Refresh page to load new version, preserving same link
      window.location.reload();
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearTimeout(countdownIntervalRef.current);
      }
    };
  }, [secondsUntilRefresh]);

  const toggleMaintenance = async (isUpdating: boolean, message?: string, estimatedMinutes?: number) => {
    try {
      const res = await fetch('/api/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUpdating, message, estimatedMinutes }),
      });
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data && data.status) {
          setStatus(data.status);
        }
      }
    } catch (e) {
      console.warn('Lỗi đổi trạng thái cập nhật:', e);
    }
  };

  return {
    status,
    autoUpdateNotice,
    secondsUntilRefresh,
    toggleMaintenance,
    refetchStatus: fetchStatus,
  };
}
