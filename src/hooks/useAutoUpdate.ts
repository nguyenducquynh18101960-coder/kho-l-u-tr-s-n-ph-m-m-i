import React, { useState, useEffect, useRef } from 'react';

export interface SystemStatus {
  isUpdating: boolean;
  version: string;
  publishedUrl: string;
  message: string;
  estimatedMinutes?: number;
  updatedAt?: number;
}

export function useAutoUpdate() {
  const [status, setStatus] = useState<SystemStatus>({
    isUpdating: false,
    version: '2026.10.11.2',
    publishedUrl: 'https://max-ai-gia-s-i-m-10-thcs.ai.studio',
    message: 'Max10 AI đã cập nhật! Chỉ cần xuất bản là cập nhật ngay chỉ sau 60 giây (không phải chờ 1 tiếng hay quay lại ngày hôm sau).',
    estimatedMinutes: 1,
  });

  const [initialVersion, setInitialVersion] = useState<string | null>(null);
  const [autoUpdateNotice, setAutoUpdateNotice] = useState<string>('');
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number | null>(null);
  const countdownIntervalRef = useRef<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system/status?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.isUpdating === 'boolean') {
          setStatus(data);

          // Check for new version publish
          if (!initialVersion) {
            setInitialVersion(data.version);
          } else if (data.version && data.version !== initialVersion) {
            // New version detected! User requested: "Tự động nhắn tin khi cập nhật ứng dụng"
            if (secondsUntilRefresh === null) {
              setSecondsUntilRefresh(60); // Đếm ngược chính xác 60 giây tự động tải lại
              setAutoUpdateNotice(
                '🚀 Bản cập nhật mới đã được xuất bản! Hệ thống tự động cập nhật chỉ sau 60 giây (không phải chờ 1 tiếng hay ngày hôm sau)...'
              );

              // 1. Play audio chime if possible
              try {
                const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

              // 2. Browser push notification
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification('📢 Max10 AI vừa cập nhật phiên bản mới!', {
                    body: 'Quản trị viên Mạc Khánh Duy vừa phát hành bản cập nhật mới. Đã có tin nhắn thông báo tự động trong hộp thư của bạn!',
                    icon: '/max10-avatar.jpg',
                  });
                } catch (e) {}
              }

              // 3. Save admin update message directly into localStorage direct messages
              try {
                const STORAGE_KEY_DIRECT_MSGS = 'max10_direct_messages_v1';
                const saved = localStorage.getItem(STORAGE_KEY_DIRECT_MSGS);
                const dms = saved ? JSON.parse(saved) : {};
                if (!dms['admin-mac-khanh-duy']) dms['admin-mac-khanh-duy'] = [];
                const updateMsg = {
                  id: 'dm-auto-update-' + Date.now(),
                  senderId: 'admin-mac-khanh-duy',
                  senderName: 'Mạc Khánh Duy (Quản trị viên)',
                  senderAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=MacKhanhDuyAdmin',
                  content:
                    '📢 [THÔNG BÁO TỰ ĐỘNG - CẬP NHẬT ỨNG DỤNG]\nQuản trị viên Mạc Khánh Duy vừa phát hành bản cập nhật mới nhất cho hệ thống Max10 AI!\n✨ Tính năng mới: "Thông báo học tập" - Gửi thông báo đẩy và nhắc nhở trong ứng dụng 30 phút trước lịch kiểm tra hoặc hạn nộp bài tập đã lưu.\n📅 Tab "Lịch học cá nhân" & 🏆 "Bảng xếp hạng lớp học" trong tab Thành tích giúp bạn thi đua cùng bạn bè.\nChúc bạn học tập đạt trọn vẹn Điểm 10!',
                  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                  createdAt: Date.now(),
                  isAdminUpdate: true,
                };
                dms['admin-mac-khanh-duy'].push(updateMsg);
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

  // Poll server every 20 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, [initialVersion, secondsUntilRefresh]);

  // Handle countdown refresh
  useEffect(() => {
    if (secondsUntilRefresh !== null && secondsUntilRefresh > 0) {
      countdownIntervalRef.current = setTimeout(() => {
        setSecondsUntilRefresh(secondsUntilRefresh - 1);
      }, 1000);
    } else if (secondsUntilRefresh === 0) {
      // Refresh page to load new version, preserving same link
      window.location.reload();
    }
    return () => clearTimeout(countdownIntervalRef.current);
  }, [secondsUntilRefresh]);

  const toggleMaintenance = async (isUpdating: boolean, message?: string, estimatedMinutes?: number) => {
    try {
      const res = await fetch('/api/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUpdating, message, estimatedMinutes }),
      });
      if (res.ok) {
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
