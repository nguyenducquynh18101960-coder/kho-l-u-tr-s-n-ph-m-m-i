import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Users, X, ArrowRight, Bell } from 'lucide-react';

export interface RecentNotification {
  id: string;
  type: 'direct' | 'group';
  groupId?: string;
  groupName?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  createdAt: number;
}

interface MessageNotificationBannerProps {
  currentUserId: string;
  currentUserName: string;
  activeTab: string;
  onOpenConversation?: (type: 'direct' | 'group', targetId: string) => void;
  onUnreadCountChange?: (count: number) => void;
  isDark?: boolean;
}

// Gentle pleasant notification chime synthesized with Web Audio API (cross-platform, zero dependencies)
function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First note: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Second note: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (e) {
    // Audio autoplay might be suspended until first click, ignore silently
  }
}

export const MessageNotificationBanner: React.FC<MessageNotificationBannerProps> = ({
  currentUserId,
  currentUserName,
  activeTab,
  onOpenConversation,
  onUnreadCountChange,
  isDark = true,
}) => {
  const [activeNotifications, setActiveNotifications] = useState<RecentNotification[]>([]);
  const seenMessageIds = useRef<Set<string>>(new Set());
  const lastCheckTime = useRef<number>(Date.now());
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Request native browser notification permission once gracefully
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const handler = () => {
          Notification.requestPermission().catch(() => {});
          window.removeEventListener('click', handler);
        };
        window.addEventListener('click', handler, { once: true });
      }
    }
  }, []);

  // Sync unreadCount with parent & update document.title
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
    const baseTitle = 'Max10 AI - Gia sư điểm 10 THCS';
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) 💬 Có tin nhắn mới - ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [unreadCount, onUnreadCountChange]);

  // If user opens group/chat tab, reset unread counter
  useEffect(() => {
    if (activeTab === 'group') {
      setUnreadCount(0);
    }
  }, [activeTab]);

  // Listen for broadcast push notifications from teachers
  useEffect(() => {
    const handleBroadcast = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      const notif = customEvent.detail;
      if (!notif) return;

      const formatted: RecentNotification = {
        id: notif.id || `broadcast-${Date.now()}`,
        type: 'group',
        groupId: `class-group-${(notif.classCode || '9d1').toLowerCase()}`,
        groupName: `Lớp ${notif.classCode || '9D1'} · ${notif.title}`,
        senderId: 'teacher-broadcast',
        senderName: `${notif.senderTeacherName} (GVCN Lớp ${notif.classCode})`,
        senderAvatar: notif.senderAvatar,
        content: `${notif.body} ${notif.dueTime ? '⏰ Hạn: ' + notif.dueTime : ''}`,
        timestamp: 'Vừa xong',
        createdAt: Date.now(),
      };

      playChime();
      setActiveNotifications((prev) => [formatted, ...prev].slice(0, 3));
      setUnreadCount((c) => c + 1);
    };

    window.addEventListener('max10_class_push_notification_dispatched', handleBroadcast);
    return () => {
      window.removeEventListener('max10_class_push_notification_dispatched', handleBroadcast);
    };
  }, []);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!currentUserId) return;

    const checkNewMessages = async () => {
      try {
        const sinceParam = lastCheckTime.current;
        const res = await fetch(
          `/api/messages/recent-notifications?userId=${encodeURIComponent(currentUserId)}&since=${sinceParam}`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (data && data.success && Array.isArray(data.notifications)) {
          const freshNotifications: RecentNotification[] = [];

          data.notifications.forEach((item: RecentNotification) => {
            if (!item || !item.id) return;
            if (seenMessageIds.current.has(item.id)) return;
            // Don't notify if sent by current user
            if (item.senderId === currentUserId) return;

            seenMessageIds.current.add(item.id);
            freshNotifications.push(item);
          });

          if (freshNotifications.length > 0) {
            // Update last check time
            lastCheckTime.current = Date.now();

            // Play notification sound
            playChime();

            // Push to browser notification if permitted
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              freshNotifications.forEach((n) => {
                try {
                  const title = n.type === 'group'
                    ? `💬 [${n.groupName || 'Nhóm học tập'}] ${n.senderName}`
                    : `💬 [Bạn bè] ${n.senderName}`;
                  new Notification(title, {
                    body: n.content.length > 80 ? n.content.substring(0, 80) + '...' : n.content,
                    icon: '/max10-avatar.jpg',
                  });
                } catch (e) {}
              });
            }

            // Update in-app floating banner state
            setActiveNotifications((prev) => {
              const combined = [...freshNotifications, ...prev].slice(0, 3);
              return combined;
            });

            // Increment unread count if not currently in group tab
            if (activeTab !== 'group') {
              setUnreadCount((c) => c + freshNotifications.length);
            }
          }
        }
      } catch (err) {
        // network or server temporary lag, retry next cycle
      }
    };

    // First check after 1.5s
    const firstTimer = setTimeout(checkNewMessages, 1500);
    // Recurring polling every 3s
    const interval = setInterval(checkNewMessages, 3000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [currentUserId, activeTab]);

  // Auto-dismiss top notification after 6 seconds
  useEffect(() => {
    if (activeNotifications.length === 0) return;
    const timer = setTimeout(() => {
      setActiveNotifications((prev) => prev.slice(0, -1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeNotifications]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClickNotification = (n: RecentNotification) => {
    setActiveNotifications((prev) => prev.filter((item) => item.id !== n.id));
    if (onOpenConversation) {
      if (n.type === 'group' && n.groupId) {
        onOpenConversation('group', n.groupId);
      } else {
        onOpenConversation('direct', n.senderId);
      }
    }
  };

  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999999] flex flex-col items-center gap-2 max-w-md w-[92vw] pointer-events-none">
      {activeNotifications.map((notif) => (
        <div
          key={notif.id}
          onClick={() => handleClickNotification(notif)}
          className={`pointer-events-auto w-full p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md cursor-pointer transition-all duration-200 hover:scale-[1.02] animate-in slide-in-from-top-3 flex items-start gap-3 ${
            isDark
              ? 'bg-[#181b24]/95 border-blue-500/40 text-white shadow-blue-950/50'
              : 'bg-white/95 border-blue-300 text-slate-900 shadow-slate-300/60'
          }`}
        >
          {/* Sender Avatar / Icon */}
          <div className="relative shrink-0">
            {notif.senderAvatar ? (
              <img
                src={notif.senderAvatar}
                alt={notif.senderName}
                className="w-10 h-10 rounded-full object-cover border border-blue-400 shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {notif.senderName ? notif.senderName.slice(0, 2).toUpperCase() : 'MB'}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] shadow-xs">
              {notif.type === 'group' ? <Users className="w-2.5 h-2.5" /> : <MessageSquare className="w-2.5 h-2.5" />}
            </span>
          </div>

          {/* Notification Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[11px] font-bold text-blue-500 dark:text-blue-400 flex items-center gap-1 truncate">
                <Bell className="w-3 h-3 shrink-0" />
                {notif.type === 'group' ? `Nhóm: ${notif.groupName || 'Học tập'}` : 'Tin nhắn bạn bè'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                {notif.timestamp || 'Vừa xong'}
              </span>
            </div>

            <p className="text-xs font-extrabold truncate">
              {notif.senderName}:
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 leading-tight mt-0.5">
              {notif.content}
            </p>

            <div className="flex items-center gap-2 mt-2 pt-1 border-t border-black/5 dark:border-white/5">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                <span>Xem tin nhắn ngay</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={(e) => handleDismiss(notif.id, e)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors shrink-0"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
