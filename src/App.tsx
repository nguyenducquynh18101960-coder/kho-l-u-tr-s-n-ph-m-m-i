import React, { useState, useEffect, useMemo } from 'react';
import { GradeLevel, ChatSession, ChatMessage, SubjectInfo, UserPresenceStatus } from './types';
import { BackgroundTheme, PRESET_THEMES, STORAGE_KEY_BG_THEME, STORAGE_KEY_VOICE_CALL } from './types/theme';
import { UserAccount, STORAGE_KEY_AUTH_USER, isUserAdmin, STORAGE_KEY_USER_GENDER, saveAccountToHistory, MASTER_SECURITY_CODE } from './types/auth';
import { GenderType, STORAGE_KEY_USER_AVATAR } from './data/presetAvatars';
import { SUBJECTS } from './data/subjects';
import { useAutoUpdate } from './hooks/useAutoUpdate';
import { CountryCode, QuizRole, QuizTopicId } from './data/countryCultures';

// Study Hub UI Components
import { Header } from './components/chatgpt/Header';
import { Sidebar, HubSpaceId, MainTabId, getSpaceFromTab } from './components/chatgpt/Sidebar';
import { ContextPanel } from './components/chatgpt/ContextPanel';
import { HistoryDrawer } from './components/chatgpt/HistoryDrawer';
import { ChatView } from './components/chatgpt/ChatView';
import { GroupChatStudio } from './components/chatgpt/GroupChatStudio';
import { TeacherLounge } from './components/chatgpt/TeacherLounge';
import { VideoStudio } from './components/chatgpt/VideoStudio';
import { Max10ControlCenter } from './components/chatgpt/Max10ControlCenter';
import { AdminUpdateBar } from './components/chatgpt/AdminUpdateBar';
import { UpdatingScreen } from './components/chatgpt/UpdatingScreen';
import { PermanentlyBannedScreen } from './components/chatgpt/PermanentlyBannedScreen';
import { OfflineIndicator } from './components/chatgpt/OfflineIndicator';
import { AIVoicePlayerBar } from './components/chatgpt/AIVoicePlayerBar';
import { MessageNotificationBanner } from './components/chatgpt/MessageNotificationBanner';
import { LevelUpCelebrationOverlay } from './components/chatgpt/LevelUpCelebrationOverlay';
import { IncomingCallModal } from './components/chatgpt/IncomingCallModal';

// Modals & Device Helper
import { getOrCreateDeviceId } from './components/chatgpt/Max10SecurityVerification';
import { Max10IntroSplash } from './components/chatgpt/Max10IntroSplash';
import { ThemeBackgroundModal } from './components/chatgpt/ThemeBackgroundModal';
import { AIVoiceModal } from './components/chatgpt/AIVoiceModal';
import { UserNameModal } from './components/chatgpt/UserNameModal';
import { AvatarModal } from './components/chatgpt/AvatarModal';
import { AuthModal } from './components/chatgpt/AuthModal';
import { StorePublishModal } from './components/chatgpt/StorePublishModal';
import { PricingUpgradeModal, SubscriptionPlan } from './components/chatgpt/PricingUpgradeModal';

// Feature Views
import { ExamPractice } from './components/ExamPractice';
import { EssayGrader } from './components/EssayGrader';
import { FormulaGuide } from './components/FormulaGuide';
import { StudyPlan } from './components/StudyPlan';
import { MindMapStudio } from './components/MindMapStudio';
import { ImageGenerator } from './components/ImageGenerator';
import { Achievements } from './components/Achievements';
import { AchievementsModal } from './components/chatgpt/AchievementsModal';
import { PersonalSchedule } from './components/PersonalSchedule';
import { ClassManagement } from './components/chatgpt/ClassManagement';
import { BirthdaySurpriseModal } from './components/chatgpt/BirthdaySurpriseModal';
import { HolidayGiftAnimationModal, detectActiveHoliday, getVisibleHolidays, HolidayId } from './components/chatgpt/HolidayGiftAnimationModal';
import { XpSpinModal } from './components/chatgpt/XpSpinModal';
import { XpSpinScreen } from './components/chatgpt/XpSpinScreen';
import { STORAGE_KEY_USER_DOB } from './types/auth';
import { loadStudentAchievements, saveStudentAchievements } from './data/initialAchievements';
import { calculateLevel } from './types/achievements';
import { celebrateMilestone } from './utils/confettiFireworks';
import { soundEffects } from './utils/soundEffects';
import { getDailyQuestionQuota, MAX_DAILY_QUESTIONS } from './data/questionQuota';
import { purgeUnrelatedLegacyClassGroups } from './data/classSystemData';
import { isSearchEngineBot, syncHomepageSeoMeta } from './utils/seoBot';
import { KnowledgeGapTracker } from './components/chatgpt/KnowledgeGapTracker';
import {
  addVipUnlockedDecorations,
  AvatarFrameId,
  loadLocalDecorations,
  NameplateId,
  saveLocalDecorations,
} from './data/profileDecorations';

const STORAGE_KEY_SESSIONS = 'max10_chat_sessions_v3';
const STORAGE_KEY_SELECTED_GRADE = 'max10_selected_grade_v1';
const STORAGE_KEY_USER_NAME = 'max10_user_name_v1';
const STORAGE_KEY_THEME_MODE = 'max10_theme_mode_v1';
const STORAGE_KEY_COUNTRY_CODE = 'max10_country_culture_v1';
const STORAGE_KEY_BILINGUAL_MODE = 'max10_bilingual_mode_v1';
const STORAGE_KEY_QUIZ_SUBJECT = 'max10_quiz_subject_v1';
const STORAGE_KEY_QUIZ_ROLE = 'max10_quiz_role_v1';

export function App() {
  // Theme & Dark mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_THEME_MODE);
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Background Theme
  const [activeTheme, setActiveTheme] = useState<BackgroundTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BG_THEME);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return PRESET_THEMES[0];
  });

  const [voiceThemeEnabled, setVoiceThemeEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOICE_CALL);
      return saved !== 'false';
    } catch (e) {}
    return true;
  });

  // User & Profile
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [userName, setUserName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_NAME);
      if (saved && saved.trim()) return saved;
      if (currentUser?.name) return currentUser.name;
    } catch (e) {}
    return 'Bạn học';
  });

  const [userAvatar, setUserAvatar] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_AVATAR);
      if (saved) return saved;
      if (currentUser?.avatar) return currentUser.avatar;
    } catch (e) {}
    return '';
  });

  const [userGender, setUserGender] = useState<GenderType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_GENDER);
      if (saved === 'male' || saved === 'female' || saved === 'other') return saved as GenderType;
      if (currentUser?.gender) return currentUser.gender as GenderType;
    } catch (e) {}
    return 'male';
  });

  const [userDob, setUserDob] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_DOB);
      if (saved) return saved;
      if (currentUser?.dob) return currentUser.dob;
    } catch (e) {}
    return '2010-09-15';
  });

  const [showBirthdayModal, setShowBirthdayModal] = useState<boolean>(false);

  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>(() => {
    return (currentUser?.plan as SubscriptionPlan) || 'free';
  });

  // Grade level
  const [grade, setGrade] = useState<GradeLevel>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED_GRADE);
      if (saved) return saved as GradeLevel;
    } catch (e) {}
    return 'Lớp 9';
  });

  // Selected Subject for Exam & Tool views
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState<number>(0);
  const currentSubject: SubjectInfo = SUBJECTS[currentSubjectIndex] || SUBJECTS[0];

  // Country & Language Culture + Interactive Quiz & Voice Tutor Mode
  const [countryCode, setCountryCode] = useState<CountryCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COUNTRY_CODE);
      if (saved && ['VN', 'US', 'GB', 'JP', 'KR', 'CN', 'DE', 'FR'].includes(saved)) {
        return saved as CountryCode;
      }
    } catch {}
    return 'VN';
  });

  const [bilingualMode, setBilingualMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BILINGUAL_MODE);
      return saved !== 'false';
    } catch {}
    return true;
  });

  const [quizVoiceMode, setQuizVoiceMode] = useState<boolean>(false);

  const [quizSubject, setQuizSubject] = useState<QuizTopicId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUIZ_SUBJECT);
      if (saved && ['Toán', 'Văn', 'Anh', 'Lịch sử', 'Giao tiếp', 'KHTN', 'Địa lý'].includes(saved)) {
        return saved as QuizTopicId;
      }
    } catch {}
    return 'Toán';
  });

  const [quizRole, setQuizRole] = useState<QuizRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUIZ_ROLE);
      if (saved === 'deskmate') return 'deskmate';
    } catch {}
    return 'tutor';
  });

  const handleSelectCountry = (code: CountryCode) => {
    setCountryCode(code);
    try {
      localStorage.setItem(STORAGE_KEY_COUNTRY_CODE, code);
    } catch {}
  };

  const handleToggleBilingualMode = () => {
    setBilingualMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_BILINGUAL_MODE, next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  const handleSelectQuizSubject = (topic: QuizTopicId) => {
    setQuizSubject(topic);
    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SUBJECT, topic);
    } catch {}
  };

  const handleSelectQuizRole = (role: QuizRole) => {
    setQuizRole(role);
    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_ROLE, role);
    } catch {}
  };

  const handleToggleQuizVoiceMode = () => {
    setQuizVoiceMode((prev) => {
      const next = !prev;
      if (next) {
        setActiveTabState('chat');
        setActiveSpace('ai');
      }
      return next;
    });
  };

  // Navigation tab & Study Hub 4 spaces
  const [activeTab, setActiveTabState] = useState<MainTabId>('chat');
  const [activeSpace, setActiveSpace] = useState<HubSpaceId>('ai');
  const [contextPanelOpen, setContextPanelOpen] = useState<boolean>(true);

  const setActiveTab = (tab: MainTabId) => {
    setActiveTabState(tab);
    setActiveSpace(getSpaceFromTab(tab));
  };

  const handleSelectSpace = (space: HubSpaceId) => {
    setActiveSpace(space);
    setContextPanelOpen(true);
    if (getSpaceFromTab(activeTab) !== space) {
      if (space === 'ai') setActiveTabState('chat');
      else if (space === 'community') setActiveTabState('group');
      else if (space === 'practice') setActiveTabState('exam');
      else setActiveTabState('schedule');
    }
  };

  // Mobile nav drawer & History drawer toggles
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState<boolean>(false);

  // Chat Sessions
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const defaultSession: ChatSession = {
      id: 'session-default',
      title: 'Chinh phục Điểm 10 Lớp 9',
      createdAt: Date.now(),
      grade: 'Lớp 9',
      messages: [],
    };
    return [defaultSession];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'session-default';
  });

  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Auto-Update hook
  const { status: autoUpdateStatus, autoUpdateNotice, secondsUntilRefresh } = useAutoUpdate();

  // Search engine crawler detection (Googlebot / Bingbot / Social scrapers)
  const isBotCrawler = useMemo(() => isSearchEngineBot(), []);

  // Modals
  // Show intro splash for human visitors; hide for search engine bots so Googlebot indexes homepage directly
  const [showIntroSplash, setShowIntroSplash] = useState<boolean>(() => !isSearchEngineBot());

  useEffect(() => {
    syncHomepageSeoMeta();
  }, []);

  // User Requirement: "với lại khi phóng to thì ẩn cả chỗ đặt câu hỏi mới từ chô Max10 AI-Gia Sư điểm 10 THCS ấn luôn"
  const [isChatFullscreen, setIsChatFullscreen] = useState<boolean>(false);
  const [unreadGroupMessagesCount, setUnreadGroupMessagesCount] = useState<number>(0);
  const [latestIncomingNotifId, setLatestIncomingNotifId] = useState<string>('');
  const [seenNotificationSignature, setSeenNotificationSignature] = useState<string>(() => {
    try {
      return localStorage.getItem('max10_seen_notification_signature_v1') || '';
    } catch {
      return '';
    }
  });

  const currentNotificationSignature = useMemo(() => {
    const monthKey = new Date().getMonth() + 1;
    const holidayIds = getVisibleHolidays()
      .map((h) => h.id)
      .join(',');
    const statusVersion = autoUpdateStatus?.version || 'init';
    const publishedAt = autoUpdateStatus?.lastPublishedAt || 0;
    const noticeFlag = autoUpdateNotice ? '1' : '0';
    return `${statusVersion}|${publishedAt}|m${monthKey}:${holidayIds}|n${noticeFlag}|${latestIncomingNotifId}`;
  }, [
    autoUpdateStatus?.version,
    autoUpdateStatus?.lastPublishedAt,
    autoUpdateNotice,
    latestIncomingNotifId,
  ]);

  const hasUnreadAdminNotifications = useMemo(() => {
    if (unreadGroupMessagesCount > 0) return true;
    return Boolean(
      currentNotificationSignature &&
        currentNotificationSignature !== seenNotificationSignature
    );
  }, [
    unreadGroupMessagesCount,
    currentNotificationSignature,
    seenNotificationSignature,
  ]);

  const markNotificationsAsSeen = () => {
    setSeenNotificationSignature(currentNotificationSignature);
    setUnreadGroupMessagesCount(0);
    try {
      localStorage.setItem(
        'max10_seen_notification_signature_v1',
        currentNotificationSignature
      );
    } catch {}
  };

  useEffect(() => {
    const onNewAdminMsg = (e: Event) => {
      const detail = (e as CustomEvent<{ id?: string }>).detail;
      if (detail?.id) {
        setLatestIncomingNotifId(detail.id);
      }
    };
    const onNotifViewed = () => {
      markNotificationsAsSeen();
    };
    const onOpenHolidayEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ holidayId?: HolidayId }>).detail;
      if (detail?.holidayId) setHolidayGiftInitialId(detail.holidayId);
      setIsExactHolidayToday(false);
      setShowHolidayGiftModal(true);
    };
    window.addEventListener('max10:admin-message', onNewAdminMsg);
    window.addEventListener('max10_notifications_viewed', onNotifViewed);
    window.addEventListener('max10_open_notifications_in_chat', onNotifViewed);
    window.addEventListener('max10_open_holiday_gift', onOpenHolidayEvent);
    return () => {
      window.removeEventListener('max10:admin-message', onNewAdminMsg);
      window.removeEventListener('max10_notifications_viewed', onNotifViewed);
      window.removeEventListener('max10_open_notifications_in_chat', onNotifViewed);
      window.removeEventListener('max10_open_holiday_gift', onOpenHolidayEvent);
    };
  }, [currentNotificationSignature]);

  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showStoreModal, setShowStoreModal] = useState<boolean>(false);
  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);
  const [showHolidayGiftModal, setShowHolidayGiftModal] = useState<boolean>(false);
  const [holidayGiftInitialId, setHolidayGiftInitialId] = useState<HolidayId | undefined>(undefined);
  const [isExactHolidayToday, setIsExactHolidayToday] = useState<boolean>(false);
  const [showXpSpinModal, setShowXpSpinModal] = useState<boolean>(false);
  const [pricingInitialState, setPricingInitialState] = useState<{
    initialPlan?: 'plus' | 'premium';
    initialStep?: 'plans' | 'checkout';
  }>({});

  // Sync dark class on document html
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME_MODE, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME_MODE, 'light');
    }
  }, [isDark]);

  // Purge legacy auto-created class groups ("Nhóm Học Tập Chính Thức") & sync registered teacher classes from backend
  useEffect(() => {
    purgeUnrelatedLegacyClassGroups();
    fetch('/api/classes/registered')
      .then((r) =>
        r.ok && (r.headers.get('content-type') || '').includes('application/json') ? r.json() : null
      )
      .then((data) => {
        if (data?.success && Array.isArray(data.classes) && data.classes.length > 0) {
          try {
            const raw = localStorage.getItem('max10_registered_classes_v2');
            const existing = raw ? JSON.parse(raw) : [];
            const map = new Map<string, any>();
            [...data.classes, ...(Array.isArray(existing) ? existing : [])].forEach((c: any) => {
              if (c && c.id) map.set(c.id, c);
            });
            localStorage.setItem('max10_registered_classes_v2', JSON.stringify(Array.from(map.values())));
            window.dispatchEvent(new CustomEvent('max10_classes_updated'));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Save Sessions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {}
  }, [sessions]);

  // Active chat session
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === currentSessionId) || sessions[0];
  }, [sessions, currentSessionId]);

  // Update messages in active session
  const updateActiveSessionMessages = (newMessages: ChatMessage[]) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          let updatedTitle = s.title;
          if (s.messages.length === 0 && newMessages.length > 0) {
            const firstUser = newMessages.find((m) => m.role === 'user');
            if (firstUser) {
              updatedTitle = firstUser.content.slice(0, 32).trim() + (firstUser.content.length > 32 ? '...' : '');
            }
          }
          return { ...s, messages: newMessages, title: updatedTitle };
        }
        return s;
      })
    );
  };

  // Create new chat
  const handleNewChat = () => {
    const newId = 'session-' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'Cuộc trò chuyện mới',
      createdAt: Date.now(),
      grade,
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setActiveTab('chat');
  };

  // Delete chat session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fallback: ChatSession = {
          id: 'session-' + Date.now(),
          title: 'Cuộc trò chuyện mới',
          createdAt: Date.now(),
          grade,
          messages: [],
        };
        setCurrentSessionId(fallback.id);
        return [fallback];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Send message directly to Max10 AI without any blocking security verification step
  const handleSendMessage = async (
    text: string,
    image?: { data: string; mimeType: string; previewUrl: string } | null,
    isThinking?: boolean,
    mode?: 'tutor' | 'grade_10_secret' | 'mindmap' | 'trap_detector' | 'all_in_one',
    quizOverrides?: { interactiveQuizMode?: boolean; quizSubject?: QuizTopicId; quizRole?: QuizRole }
  ) => {
    if ((!text || !text.trim()) && !image) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      imagePreview: image?.previewUrl,
    };

    const currentMsgs = activeSession ? [...activeSession.messages, userMsg] : [userMsg];
    updateActiveSessionMessages(currentMsgs);
    setChatLoading(true);

    const effectiveQuizMode =
      quizOverrides?.interactiveQuizMode !== undefined ? quizOverrides.interactiveQuizMode : quizVoiceMode;
    const effectiveQuizSubject = quizOverrides?.quizSubject || quizSubject;
    const effectiveQuizRole = quizOverrides?.quizRole || quizRole;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          subject: effectiveQuizMode ? effectiveQuizSubject : currentSubject.name,
          mode: mode || (isThinking ? 'grade_10_secret' : 'tutor'),
          messages: currentMsgs.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          message: text,
          image: image ? { mimeType: image.mimeType, data: image.data } : null,
          userName,
          isThinking,
          countryCode,
          bilingualMode,
          interactiveQuizMode: effectiveQuizMode,
          quizSubject: effectiveQuizSubject,
          quizRole: effectiveQuizRole,
        }),
      });

      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('application/json')) {
        throw new Error(`Máy chủ API chưa sẵn sàng (HTTP ${res.status}).`);
      }
      const data = await res.json();
      if (data.reply || data.success) {
        const aiMsg: ChatMessage = {
          id: 'msg-ai-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          role: 'assistant',
          content: data.reply || data.message || 'Max10 AI đã hoàn tất bài giảng cho bạn!',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          generatedImage: data.generatedImage,
          generatedVideo: data.generatedVideo,
          deepThinkingContent: data.thinking || data.deepThinkingContent,
        };
        updateActiveSessionMessages([...currentMsgs, aiMsg]);

        // Auto-trigger fireworks & confetti celebration when user completes 10 daily interactions!
        const currentQuota = getDailyQuestionQuota(isAdmin);
        if (!isAdmin && currentQuota.used >= MAX_DAILY_QUESTIONS) {
          celebrateMilestone();
          soundEffects.playMissionComplete();
        }
      } else {
        throw new Error(data.error || 'Máy chủ không phản hồi câu trả lời hợp lệ.');
      }
    } catch (err: any) {
      const errReply: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: `⚠️ Có lỗi kết nối: ${err.message || 'Không thể liên lạc với máy chủ Max10 AI. Bạn vui lòng thử lại sau.'}`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      updateActiveSessionMessages([...currentMsgs, errReply]);
    } finally {
      setChatLoading(false);
    }
  };

  // Regenerate last message
  const handleRegenerate = () => {
    if (!activeSession || activeSession.messages.length === 0) return;
    const lastUser = [...activeSession.messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      handleSendMessage(lastUser.content);
    }
  };

  // Save selected grade
  const handleSelectGrade = (newGrade: GradeLevel) => {
    setGrade(newGrade);
    localStorage.setItem(STORAGE_KEY_SELECTED_GRADE, newGrade);
  };

  // Save user name
  const handleSaveUserName = (newName: string) => {
    setUserName(newName);
    localStorage.setItem(STORAGE_KEY_USER_NAME, newName);
    if (currentUser) {
      const updated = { ...currentUser, name: newName };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
    }
  };

  // Save avatar
  const handleSaveAvatar = (newAvatarUrl: string) => {
    setUserAvatar(newAvatarUrl);
    localStorage.setItem(STORAGE_KEY_USER_AVATAR, newAvatarUrl);
    if (currentUser) {
      const updated = { ...currentUser, avatar: newAvatarUrl };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
    }
  };

  // Save gender
  const handleSaveGender = (newGender: GenderType) => {
    setUserGender(newGender);
    localStorage.setItem(STORAGE_KEY_USER_GENDER, newGender);
    if (currentUser) {
      const updated = { ...currentUser, gender: newGender };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
    }
  };

  // Save Date of Birth (ngày tháng năm sinh)
  const handleSaveDob = (newDob: string) => {
    setUserDob(newDob);
    localStorage.setItem(STORAGE_KEY_USER_DOB, newDob);
    if (currentUser) {
      const updated = { ...currentUser, dob: newDob };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
    }
  };

  // Claim birthday surprise reward (+500 XP)
  const handleClaimBirthdayReward = () => {
    try {
      const currentStats = loadStudentAchievements();
      const newTotal = currentStats.totalXp + 500;
      const levelData = calculateLevel(newTotal);
      const updated = {
        ...currentStats,
        totalXp: newTotal,
        level: levelData.level,
        levelTitle: levelData.title,
        nextLevelXp: levelData.nextLevelXp,
      };
      saveStudentAchievements(updated);
      window.dispatchEvent(new CustomEvent('max10_achievements_updated', { detail: updated }));
    } catch (e) {}
  };

  // Check if today matches user birthday to trigger surprise
  useEffect(() => {
    if (!userDob) return;
    try {
      const today = new Date();
      const currMonth = String(today.getMonth() + 1).padStart(2, '0');
      const currDay = String(today.getDate()).padStart(2, '0');
      const parts = userDob.split('-');
      if (parts.length === 3) {
        const birthMonth = parts[1];
        const birthDay = parts[2];
        if (currMonth === birthMonth && currDay === birthDay) {
          const sessionKey = `max10_birthday_shown_${today.getFullYear()}_${currMonth}_${currDay}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, 'true');
            setShowBirthdayModal(true);
          }
        }
      }
    } catch (e) {}
  }, [userDob]);

  // Auto-detect seasonal holidays (Tết, 8/3, 20/10, Halloween, 20/11, Noel) & hide after they pass
  useEffect(() => {
    const checkHoliday = () => {
      const today = new Date();
      const visible = getVisibleHolidays(today);
      if (visible.length === 0) {
        setShowHolidayGiftModal(false);
        return;
      }
      const activeHoliday = detectActiveHoliday(today);
      if (activeHoliday) {
        setIsExactHolidayToday(true);
        setHolidayGiftInitialId(activeHoliday.id);
        const key = `max10_holiday_gift_shown_${today.getFullYear()}_${activeHoliday.id}`;
        try {
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, 'true');
            setShowHolidayGiftModal(true);
          }
        } catch {}
      }
    };
    checkHoliday();
    const timer = setInterval(checkHoliday, 60000);

    const handleOpenHolidayEvent = (e: Event) => {
      const today = new Date();
      const visible = getVisibleHolidays(today);
      if (visible.length === 0) return;
      const custom = e as CustomEvent<{ holidayId?: HolidayId }>;
      if (custom.detail?.holidayId) {
        setHolidayGiftInitialId(custom.detail.holidayId);
      } else {
        setHolidayGiftInitialId(visible[0].id);
      }
      setIsExactHolidayToday(Boolean(detectActiveHoliday(today)));
      setShowHolidayGiftModal(true);
    };
    const handleOpenXpSpin = () => {
      setShowXpSpinModal(true);
    };
    window.addEventListener('max10_open_holiday_gift', handleOpenHolidayEvent);
    window.addEventListener('max10_open_xp_spin', handleOpenXpSpin);
    return () => {
      clearInterval(timer);
      window.removeEventListener('max10_open_holiday_gift', handleOpenHolidayEvent);
      window.removeEventListener('max10_open_xp_spin', handleOpenXpSpin);
    };
  }, []);

  // Select background theme
  const handleSelectTheme = (theme: BackgroundTheme) => {
    setActiveTheme(theme);
    localStorage.setItem(STORAGE_KEY_BG_THEME, JSON.stringify(theme));
  };

  const handleToggleVoiceTheme = () => {
    const next = !voiceThemeEnabled;
    setVoiceThemeEnabled(next);
    localStorage.setItem(STORAGE_KEY_VOICE_CALL, next ? 'true' : 'false');
  };

  // Auth & Roles
  // User requirement: "khi đăng xuất thì phải hiện ra chỗ đăng nhập khách thành học sinh và thầy cô"
  const handleLogout = () => {
    if (currentUser) {
      saveAccountToHistory(currentUser);
    }
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    setCurrentUser(null);
    setActiveTab('chat');
    setShowAuthModal(true);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    saveAccountToHistory(user);
    if (user.name) {
      setUserName(user.name);
      localStorage.setItem(STORAGE_KEY_USER_NAME, user.name);
    }
    if (user.avatar) {
      setUserAvatar(user.avatar);
      localStorage.setItem(STORAGE_KEY_USER_AVATAR, user.avatar);
    }
    if (user.gender) {
      setUserGender(user.gender);
      localStorage.setItem(STORAGE_KEY_USER_GENDER, user.gender);
    }
    if (user.dob) {
      setUserDob(user.dob);
      localStorage.setItem(STORAGE_KEY_USER_DOB, user.dob);
    }
    if (user.studentClass) {
      const m = user.studentClass.match(/^([6-9])/);
      if (m) {
        const g = `Lớp ${m[1]}` as GradeLevel;
        setGrade(g);
        localStorage.setItem(STORAGE_KEY_SELECTED_GRADE, g);
      }
    }
    setSubscriptionPlan((user.plan as SubscriptionPlan) || 'free');
    if (user.role === 'admin' || isUserAdmin(user)) {
      sessionStorage.setItem('max10_master_security_verified', 'true');
      setActiveTab('control');
    }
    sessionStartedAtRef.current = Date.now();
    setShowAuthModal(false);
  };

  const sessionStartedAtRef = React.useRef<number>(Date.now());
  const [pinnedSystemBanner, setPinnedSystemBanner] = useState<{
    id: string;
    title: string;
    content: string;
    severity: 'info' | 'warning' | 'celebrate';
    updatedAt: number;
    author: string;
  } | null>(null);
  const [dismissedPinId, setDismissedPinId] = useState<string | null>(null);
  const [godModeNotice, setGodModeNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isUserAdmin(currentUser)) {
      sessionStorage.setItem('max10_master_security_verified', 'true');
    }
  }, [currentUser]);

  useEffect(() => {
    if (isBotCrawler) return;
    let active = true;

    const runSessionCheck = async () => {
      try {
        const uid = currentUser?.id || '';
        const url = `/api/users/session-check?userId=${encodeURIComponent(
          uid
        )}&sessionStartedAt=${sessionStartedAtRef.current}`;
        const res = await fetch(url);
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (!res.ok || !ct.includes('application/json')) return;
        const data = await res.json();
        if (!active || !data?.success) return;

        if ('pinnedBanner' in data) {
          setPinnedSystemBanner(data.pinnedBanner || null);
        }

        const isCurrentAdmin = isUserAdmin(currentUser);
        if ((data.forceLogout || data.locked) && uid && !isCurrentAdmin) {
          setGodModeNotice(
            data.locked
              ? '🔒 Tài khoản của bạn đã bị Quản trị viên tạm khóa.'
              : '🚪 Quản trị viên đã yêu cầu đăng xuất phiên làm việc này.'
          );
          setTimeout(() => setGodModeNotice(null), 5000);
          handleLogout();
          return;
        }

        if (data.vipGift && uid) {
          const gift = data.vipGift;
          if (Number(gift.xpBonus) > 0) {
            const st = loadStudentAchievements();
            const nextXp = st.totalXp + Number(gift.xpBonus);
            const lv = calculateLevel(nextXp);
            saveStudentAchievements({
              ...st,
              totalXp: nextXp,
              level: lv.level,
              levelTitle: lv.title,
              nextLevelXp: lv.nextLevelXp,
            });
          }

          const nps = Array.isArray(gift.unlockedNameplates) ? gift.unlockedNameplates : [];
          const frs = Array.isArray(gift.unlockedFrames) ? gift.unlockedFrames : [];
          if (nps.length > 0 || frs.length > 0) {
            addVipUnlockedDecorations(nps, frs);
          }
          if (gift.equippedNameplateId || gift.equippedFrameId) {
            const curDec = loadLocalDecorations(isCurrentAdmin);
            saveLocalDecorations({
              ...curDec,
              ...(gift.equippedNameplateId
                ? { nameplateId: gift.equippedNameplateId as NameplateId }
                : {}),
              ...(gift.equippedFrameId ? { frameId: gift.equippedFrameId as AvatarFrameId } : {}),
            });
          }

          soundEffects.playBadgeUnlocked();
          celebrateMilestone();
          setGodModeNotice(
            `🎁 Quà tặng VIP từ Quản trị viên: +${Number(gift.xpBonus || 0)} XP${
              gift.equippedNameplateId ? ' & Nameplate VIP' : ''
            }!`
          );
          setTimeout(() => setGodModeNotice(null), 6000);

          fetch('/api/users/vip-gifts/ack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: uid, giftId: gift.id }),
          }).catch(() => {});
        }
      } catch {}
    };

    runSessionCheck();
    const timer = window.setInterval(runSessionCheck, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [currentUser?.id, currentUser?.email]);

  const handleOpenPricingModal = (initialPlan?: 'plus' | 'premium', initialStep?: 'plans' | 'checkout') => {
    setPricingInitialState({ initialPlan, initialStep });
    setShowPricingModal(true);
  };

  const [isPermanentlyBanned, setIsPermanentlyBanned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('max10_permanently_banned') === 'true';
    } catch {
      return false;
    }
  });
  const [banReason, setBanReason] = useState<string>(() => {
    try {
      return localStorage.getItem('max10_ban_reason') || 'Phát hiện hành vi hack / can thiệp hệ thống trái phép!';
    } catch {
      return 'Phát hiện hành vi hack / can thiệp hệ thống trái phép!';
    }
  });

  // Real Server-Side Security Firewall Enforcement & Fetch Interceptor
  useEffect(() => {
    const deviceId = getOrCreateDeviceId();

    const triggerRealBan = (reasonText: string) => {
      try {
        localStorage.setItem('max10_permanently_banned', 'true');
        localStorage.setItem('max10_ban_reason', reasonText);
        localStorage.removeItem(STORAGE_KEY_AUTH_USER);
      } catch {}
      setBanReason(reasonText);
      setIsPermanentlyBanned(true);
    };

    // Check real server ban list on boot (skip for search crawlers)
    if (!isBotCrawler) {
      const q = new URLSearchParams({
        deviceId,
        userId: currentUser?.id || '',
        email: currentUser?.email || '',
      });
      fetch(`/api/security/status?${q.toString()}`, {
        headers: { 'x-max10-device-id': deviceId },
      })
        .then((r) =>
          r.ok && (r.headers.get('content-type') || '').includes('application/json') ? r.json() : null
        )
        .then((data) => {
          if (data?.isClientBanned) {
            triggerRealBan(data.banReason || 'Thiết bị hoặc tài khoản đã bị tường lửa Max10 AI chặn vĩnh viễn.');
          }
        })
        .catch(() => {});
    }

    // Attach device/user headers and intercept real 403 firewall bans across all /api/* requests
    const w = window as any;
    if (!w.__max10SecurityFetchPatched && typeof window.fetch === 'function') {
      const origFetch = window.fetch.bind(window);
      const patchedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        let nextInit = init;
        if (typeof urlStr === 'string' && urlStr.startsWith('/api')) {
          const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
          headers.set('x-max10-device-id', getOrCreateDeviceId());
          try {
            const authRaw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
            if (authRaw) {
              const parsed = JSON.parse(authRaw);
              if (parsed?.id) headers.set('x-max10-user-id', parsed.id);
            }
            if (sessionStorage.getItem('max10_master_security_verified') === 'true') {
              headers.set('x-max10-master-code', MASTER_SECURITY_CODE);
            }
          } catch {}
          nextInit = { ...init, headers };
        }
        const response = await origFetch(input, nextInit);
        if (typeof urlStr === 'string' && urlStr.startsWith('/api') && response.status === 403) {
          try {
            const ct = (response.headers.get('content-type') || '').toLowerCase();
            if (ct.includes('application/json')) {
              const cloned = response.clone();
              const body = await cloned.json();
              if (body?.banned) {
                window.dispatchEvent(
                  new CustomEvent('max10_server_banned', {
                    detail: { reason: body.reason || body.error || 'Tường lửa phát hiện hành vi tấn công và đã chặn vĩnh viễn.' },
                  })
                );
              }
            }
          } catch {}
        }
        return response;
      };

      try {
        const ownDesc = Object.getOwnPropertyDescriptor(window, 'fetch');
        if (!ownDesc || ownDesc.configurable) {
          Object.defineProperty(window, 'fetch', {
            value: patchedFetch,
            writable: true,
            enumerable: true,
            configurable: true,
          });
          w.__max10SecurityFetchPatched = true;
        } else if (ownDesc.writable) {
          window.fetch = patchedFetch;
          w.__max10SecurityFetchPatched = true;
        }
      } catch {
        // Ignore if environment enforces a non-configurable getter-only window.fetch
      }
    }

    const onServerBanned = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      triggerRealBan(detail?.reason || 'Tường lửa Max10 AI đã chặn vĩnh viễn!');
    };
    window.addEventListener('max10_server_banned', onServerBanned);
    return () => window.removeEventListener('max10_server_banned', onServerBanned);
  }, [currentUser?.id, currentUser?.email]);

  // Check anti-hack permanent ban
  if (isPermanentlyBanned) {
    return (
      <PermanentlyBannedScreen
        reason={banReason}
        onUnbanSuccess={() => setIsPermanentlyBanned(false)}
        isDark={isDark}
      />
    );
  }

  // Check admin rights & master security bypass
  const isAdmin = isUserAdmin(currentUser);
  const isMasterBypass =
    typeof window !== 'undefined' &&
    (sessionStorage.getItem('max10_bypass_update') === 'true' ||
      sessionStorage.getItem('max10_master_security_verified') === 'true' ||
      localStorage.getItem('max10_is_owner_access') === 'true');

  const canBypassMaintenance = isAdmin || isMasterBypass;

  // If system is currently updating via /api/system/maintenance:
  // User Requirement: "admin không bị chờ khi bật bảo trì" -> Admin enters directly without waiting!
  if (autoUpdateStatus.isUpdating && !canBypassMaintenance) {
    return (
      <UpdatingScreen
        message={autoUpdateStatus.message}
        publishedUrl={autoUpdateStatus.publishedUrl}
        isDark={isDark}
        onAdminBypass={() => window.location.reload()}
      />
    );
  }

  return (
    <div
      className={`relative flex h-screen w-screen overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-[#12151c] text-zinc-100' : 'bg-[#eef2f7] text-slate-800'
      }`}
      style={{
        background:
          activeTheme.type === 'color'
            ? activeTheme.value
            : activeTheme.type === 'gradient'
            ? activeTheme.value
            : undefined,
        backgroundImage: activeTheme.type === 'image' ? `url(${activeTheme.value})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background Soft Overlay for contrast */}
      {activeTheme.overlayOpacity && activeTheme.overlayOpacity > 0 ? (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)',
            backdropFilter: activeTheme.blur ? `blur(${activeTheme.blur}px)` : undefined,
          }}
        />
      ) : null}

      {/* Offline Alert Indicator */}
      <OfflineIndicator />

      {/* AIVoice Floating Player Bar */}
      <AIVoicePlayerBar onOpenVoiceModal={() => setShowVoiceModal(true)} isDark={isDark} />

      {/* Real-time Message Notification Banner for groups, community, friends */}
      <MessageNotificationBanner
        currentUserId={
          currentUser?.id ||
          'user-local-' + (userName || 'Bạn học').toLowerCase().replace(/\s+/g, '-')
        }
        currentUserName={currentUser?.name || userName || 'Bạn học'}
        activeTab={activeTab}
        onOpenConversation={(type, targetId) => {
          setActiveTab('group');
          try {
            localStorage.setItem('max10_target_chat_open', JSON.stringify({ type, targetId, timestamp: Date.now() }));
          } catch (e) {}
        }}
        onUnreadCountChange={setUnreadGroupMessagesCount}
        isDark={isDark}
      />

      {/* Zone 1 (68px Nav Rail) & Zone 2 (240px Context Panel) - Hidden when in Fullscreen */}
      {!isChatFullscreen && (
        <>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isFullscreen={isChatFullscreen}
            unreadGroupMessagesCount={unreadGroupMessagesCount}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={(id) => {
              setCurrentSessionId(id);
              setActiveTab('chat');
            }}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            selectedGrade={grade}
            onSelectGrade={handleSelectGrade}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeSpace={activeSpace}
            onSelectSpace={handleSelectSpace}
            isDark={isDark}
            onToggleTheme={() => setIsDark((prev) => !prev)}
            onOpenIntroModal={() => setShowIntroSplash(true)}
            activeTheme={activeTheme}
            onOpenThemeModal={() => setShowThemeModal(true)}
            onOpenVoiceModal={() => setShowVoiceModal(true)}
            userName={userName}
            onOpenNameModal={() => setShowNameModal(true)}
            currentUser={currentUser}
            onOpenAuthModal={() => setShowAuthModal(true)}
            userAvatar={userAvatar}
            onOpenAvatarModal={() => setShowAvatarModal(true)}
            onOpenStoreModal={() => setShowStoreModal(true)}
            subscriptionPlan={subscriptionPlan}
            onOpenPricingModal={handleOpenPricingModal}
            isAdmin={isAdmin}
            onOpenAchievementsModal={() => setShowAchievementsModal(true)}
            onOpenAdminNotifications={() => {
              markNotificationsAsSeen();
              setActiveSpace('community');
              setActiveTab('group');
              try {
                localStorage.setItem(
                  'max10_target_chat_open',
                  JSON.stringify({ type: 'direct', targetId: 'all_broadcast', timestamp: Date.now() })
                );
              } catch {}
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent('max10_open_notifications_in_chat')
                );
              }, 30);
            }}
            hasAdminNotificationDot={hasUnreadAdminNotifications}
            onLogout={handleLogout}
          />

          <ContextPanel
            isOpen={contextPanelOpen && activeTab !== 'group'}
            onClose={() => setContextPanelOpen(false)}
            activeTab={activeTab}
            activeSpace={activeSpace}
            setActiveTab={setActiveTab}
            isDark={isDark}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={(id) => {
              setCurrentSessionId(id);
              setActiveTab('chat');
            }}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            currentUser={currentUser}
            isAdmin={isAdmin}
            subscriptionPlan={subscriptionPlan}
            onOpenStoreModal={() => setShowStoreModal(true)}
            onOpenPricingModal={handleOpenPricingModal}
            onOpenAchievementsModal={() => setShowAchievementsModal(true)}
          />
        </>
      )}

      {/* Zone 3: Main Workspace Column */}
      <div className={`relative flex flex-col flex-1 h-full min-w-0 overflow-hidden ${isChatFullscreen ? 'z-50' : 'z-10'}`}>
        {/* Top Header - Hidden in Fullscreen */}
        {!isChatFullscreen && (
          <Header
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onToggleContextPanel={() => setContextPanelOpen((prev) => !prev)}
            isContextPanelOpen={contextPanelOpen}
            onNewChat={handleNewChat}
            selectedGrade={grade}
            onSelectGrade={handleSelectGrade}
            isDark={isDark}
            onToggleTheme={() => setIsDark((prev) => !prev)}
            activeTab={activeTab}
            activeSpace={activeSpace}
            onSelectTab={setActiveTab}
            onOpenIntroModal={() => setShowIntroSplash(true)}
            activeTheme={activeTheme}
            onOpenThemeModal={() => setShowThemeModal(true)}
            onOpenVoiceModal={() => setShowVoiceModal(true)}
            userName={userName}
            onOpenNameModal={() => setShowNameModal(true)}
            currentUser={currentUser}
            onOpenAuthModal={() => setShowAuthModal(true)}
            userAvatar={userAvatar}
            onOpenAvatarModal={() => setShowAvatarModal(true)}
            onOpenStoreModal={() => setShowStoreModal(true)}
            subscriptionPlan={subscriptionPlan}
            onOpenPricingModal={handleOpenPricingModal}
            onOpenAchievementsModal={() => setShowAchievementsModal(true)}
            onOpenHistoryDrawer={() => setHistoryDrawerOpen(true)}
            onOpenAdminNotifications={() => {
              markNotificationsAsSeen();
              setActiveSpace('community');
              setActiveTab('group');
              try {
                localStorage.setItem(
                  'max10_target_chat_open',
                  JSON.stringify({ type: 'direct', targetId: 'all_broadcast', timestamp: Date.now() })
                );
              } catch {}
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent('max10_open_notifications_in_chat')
                );
              }, 30);
            }}
            hasUnreadNotifications={hasUnreadAdminNotifications}
            historyCount={sessions.length}
            onLogout={handleLogout}
            countryCode={countryCode}
            onSelectCountry={handleSelectCountry}
            bilingualMode={bilingualMode}
            onToggleBilingualMode={handleToggleBilingualMode}
            quizVoiceMode={quizVoiceMode}
            onToggleQuizVoiceMode={handleToggleQuizVoiceMode}
          />
        )}

        {/* Admin Update Bar: Visible ONLY for verified owner Mạc Khánh Duy (Hidden in Fullscreen) */}
        {!isChatFullscreen && isAdmin && (
          <AdminUpdateBar
            isDark={isDark}
            isOwner={isAdmin}
            onRefreshSystem={() => window.location.reload()}
            onOpenControlCenter={() => setActiveTab('control')}
          />
        )}

        {/* Live Auto-Update Notification Banner with Exact Publish Time */}
        {!isChatFullscreen && autoUpdateNotice && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-md z-20">
            <span>{autoUpdateNotice}</span>
            <div className="flex items-center gap-2">
              {secondsUntilRefresh !== null && (
                <span className="px-2 py-0.5 rounded-lg bg-black/25 font-mono text-[11px]">
                  Làm mới sau {secondsUntilRefresh}s
                </span>
              )}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3 py-1 rounded-lg bg-white text-emerald-700 font-black text-[11px] hover:bg-emerald-50 cursor-pointer"
              >
                Cập nhật ngay
              </button>
            </div>
          </div>
        )}

        {/* Admin Maintenance Indicator: Admin does NOT have to wait when maintenance is enabled */}
        {!isChatFullscreen && autoUpdateStatus.isUpdating && canBypassMaintenance && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex flex-wrap items-center justify-between gap-2 shadow-md z-20">
            <div className="flex items-center gap-2">
              <span className="text-sm">🛡️</span>
              <span>
                HỆ THỐNG ĐANG BẬT BẢO TRÌ — Bạn là Quản trị viên Mạc Khánh Duy: Truy cập đặc quyền không bị chờ!
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch('/api/system/maintenance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isUpdating: false, message: 'Hệ thống đã hoạt động bình thường!' }),
                  });
                  window.location.reload();
                } catch (e) {
                  window.location.reload();
                }
              }}
              className="px-3 py-1 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition-colors text-[11px] font-bold cursor-pointer shrink-0"
            >
              Tắt Bảo Trì Ngay
            </button>
          </div>
        )}

        {/* Global Pinned Announcement Banner published from Admin God-Mode */}
        {!isChatFullscreen &&
          pinnedSystemBanner &&
          dismissedPinId !== pinnedSystemBanner.id && (
            <div
              className={`px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-sm z-20 ${
                pinnedSystemBanner.severity === 'warning'
                  ? 'bg-rose-600 text-white'
                  : pinnedSystemBanner.severity === 'celebrate'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white'
                  : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-black uppercase shrink-0">
                  📌 {pinnedSystemBanner.title}
                </span>
                <span className="truncate sm:whitespace-normal">{pinnedSystemBanner.content}</span>
              </div>
              <button
                type="button"
                onClick={() => setDismissedPinId(pinnedSystemBanner.id)}
                className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/35 text-white text-[11px] font-bold cursor-pointer shrink-0"
              >
                Ẩn
              </button>
            </div>
          )}

        {/* Non-blocking God-Mode Notification Toast (VIP Gifts / Force Logout) */}
        {godModeNotice && (
          <div className="fixed bottom-5 right-5 z-[10070] px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-amber-400/50 text-xs font-extrabold flex items-center gap-2 max-w-md">
            <span>{godModeNotice}</span>
          </div>
        )}

        {/* Dynamic Main Workspace depending on activeTab */}
        <main className="relative flex-1 min-h-0 overflow-hidden">
          {activeTab === 'chat' && (
            <ChatView
              grade={grade}
              messages={activeSession ? activeSession.messages : []}
              loading={chatLoading}
              onSendMessage={handleSendMessage}
              onRegenerate={handleRegenerate}
              isDark={isDark}
              onOpenImageStudio={() => setActiveTab('image')}
              onOpenMindMap={() => setActiveTab('mindmap')}
              onOpenVideoStudio={() => setActiveTab('video')}
              onOpenControlCenter={isAdmin ? () => setActiveTab('control') : undefined}
              onSelectTab={setActiveTab}
              onOpenAchievementsModal={() => setShowAchievementsModal(true)}
              activeTheme={activeTheme}
              onSelectTheme={handleSelectTheme}
              onOpenThemeModal={() => setShowThemeModal(true)}
              voiceThemeEnabled={voiceThemeEnabled}
              onOpenVoiceModal={() => setShowVoiceModal(true)}
              userName={userName}
              userAvatar={userAvatar}
              currentUser={currentUser}
              onOpenNameModal={() => setShowNameModal(true)}
              onOpenIntroModal={() => setShowIntroSplash(true)}
              onOpenStoreModal={() => setShowStoreModal(true)}
              subscriptionPlan={subscriptionPlan}
              onOpenPricingModal={handleOpenPricingModal}
              isAdmin={isAdmin}
              isFullscreen={isChatFullscreen}
              onToggleFullscreen={(val?: boolean) => {
                const nextVal = typeof val === 'boolean' ? val : !isChatFullscreen;
                setIsChatFullscreen(nextVal);
                if (nextVal) {
                  setSidebarOpen(false);
                  setHistoryDrawerOpen(false);
                }
              }}
              countryCode={countryCode}
              bilingualMode={bilingualMode}
              quizVoiceMode={quizVoiceMode}
              onToggleQuizVoiceMode={handleToggleQuizVoiceMode}
              quizSubject={quizSubject}
              onSelectQuizSubject={handleSelectQuizSubject}
              quizRole={quizRole}
              onSelectQuizRole={handleSelectQuizRole}
            />
          )}

          {activeTab === 'group' && (
            <GroupChatStudio
              currentGrade={grade}
              userName={userName}
              currentUser={currentUser}
              isDark={isDark}
              onOpenAuthModal={() => setShowAuthModal(true)}
              userAvatar={userAvatar}
              onOpenAvatarModal={() => setShowAvatarModal(true)}
              onPresenceStatusChange={(status: UserPresenceStatus) => {
                if (currentUser) {
                  const updated = { ...currentUser, presenceStatus: status };
                  setCurrentUser(updated);
                  localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
                }
              }}
              onOpenMindMap={() => setActiveTab('mindmap')}
              onOpenImageStudio={() => setActiveTab('image')}
              onOpenVideoStudio={() => setActiveTab('video')}
              onSwitchToChat={() => {
                setIsChatFullscreen(false);
                setActiveTab('chat');
              }}
              isFullscreen={isChatFullscreen}
              hideInnerSidebar={false}
              onToggleFullscreen={(val?: boolean) => {
                const nextVal = typeof val === 'boolean' ? val : !isChatFullscreen;
                setIsChatFullscreen(nextVal);
                if (nextVal) {
                  setSidebarOpen(false);
                }
              }}
              onExitFullscreen={() => {
                setIsChatFullscreen(false);
              }}
              autoUpdateNotice={autoUpdateNotice}
              onOpenStoreModal={() => setShowStoreModal(true)}
              onOpenPricingModal={() => handleOpenPricingModal()}
              onOpenIntroModal={() => setShowIntroSplash(true)}
              countryCode={countryCode}
              bilingualMode={bilingualMode}
            />
          )}

          {activeTab === 'image' && (
            <div className="h-full w-full overflow-y-auto">
              <ImageGenerator
                currentGrade={grade}
                isDark={isDark}
                currentUser={currentUser}
                subscriptionPlan={subscriptionPlan}
                onUpdateAvatar={handleSaveAvatar}
                onOpenPricing={() => setShowPricingModal(true)}
                onSendToChat={(text) => {
                  setActiveTab('chat');
                  handleSendMessage(text);
                }}
              />
            </div>
          )}

          {activeTab === 'video' && (
            <div className="h-full w-full overflow-y-auto">
              <VideoStudio
                currentGrade={grade}
                currentSubject={currentSubject}
                isDark={isDark}
                onSendToChat={(text) => {
                  setActiveTab('chat');
                  handleSendMessage(text);
                }}
              />
            </div>
          )}

          {activeTab === 'exam' && (
            <div className="h-full w-full overflow-y-auto">
              <ExamPractice
                currentGrade={grade}
                currentSubject={currentSubject}
                isAdmin={isAdmin}
                currentUser={currentUser}
                userName={userName}
                isDark={isDark}
              />
            </div>
          )}

          {activeTab === 'grade' && (
            <div className="h-full w-full overflow-y-auto">
              <EssayGrader currentGrade={grade} currentSubject={currentSubject} />
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="h-full w-full overflow-y-auto">
              <FormulaGuide currentGrade={grade} currentSubject={currentSubject} />
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="h-full w-full overflow-y-auto">
              <StudyPlan currentGrade={grade} />
            </div>
          )}

          {activeTab === 'mindmap' && (
            <div className="h-full w-full overflow-y-auto">
              <MindMapStudio
                currentGrade={grade}
                isDark={isDark}
                onSendToChat={(text) => {
                  setActiveTab('chat');
                  handleSendMessage(text);
                }}
              />
            </div>
          )}

          {activeTab === 'teacher' && (
            <div className="h-full w-full overflow-y-auto">
              <TeacherLounge
                currentGrade={grade}
                userName={userName}
                isDark={isDark}
                onSendToChat={(text) => {
                  setActiveTab('chat');
                  handleSendMessage(text);
                }}
                onOpenVideoStudio={() => setActiveTab('video')}
              />
            </div>
          )}

          {activeTab === 'control' && isAdmin && (
            <div className="h-full w-full overflow-y-auto">
              <Max10ControlCenter
                isDark={isDark}
                isOpen={true}
                onClose={() => setActiveTab('chat')}
                isOwner={isAdmin}
                currentUser={currentUser}
              />
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="h-full w-full overflow-y-auto">
              <Achievements
                isDark={isDark}
                userName={userName}
                userAvatar={userAvatar}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="h-full w-full overflow-y-auto">
              <PersonalSchedule
                currentGrade={grade}
                isDark={isDark}
                onSendToChat={(text) => {
                  setActiveTab('chat');
                  handleSendMessage(text);
                }}
              />
            </div>
          )}

          {activeTab === 'class_management' && (
            <div className="h-full w-full overflow-y-auto">
              <ClassManagement
                isDark={isDark}
                currentUser={currentUser}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenAuthModal={() => setShowAuthModal(true)}
                onLogout={handleLogout}
                onOpenConversation={(type, targetId) => {
                  try {
                    localStorage.setItem(
                      'max10_target_chat_open',
                      JSON.stringify({ type, targetId, timestamp: Date.now() })
                    );
                  } catch (e) {}
                  setActiveTab('group');
                }}
              />
            </div>
          )}
          {activeTab === 'spin' && (
            <div className="h-full w-full overflow-y-auto">
              <XpSpinScreen
                variant="page"
                isDark={isDark}
                userName={currentUser?.name || userName}
                onNavigateToTab={setActiveTab}
              />
            </div>
          )}

          {activeTab === 'tracker' && (
            <KnowledgeGapTracker
              isDark={isDark}
              onPracticeTopic={(_subject, tutorPrompt) => {
                setQuizVoiceMode(true);
                setActiveTab('chat');
                setTimeout(() => {
                  handleSendMessage(tutorPrompt, null, false, 'tutor', {
                    interactiveQuizMode: true,
                    quizRole: 'tutor',
                  });
                }, 90);
              }}
            />
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      {/* 1. Max10 Intro Splash (hidden for search engine crawlers so homepage indexes directly) */}
      <Max10IntroSplash
        isOpen={!isBotCrawler && showIntroSplash}
        onClose={() => setShowIntroSplash(false)}
        isDark={isDark}
        userName={userName}
        onSelectPrompt={(prompt) => {
          setShowIntroSplash(false);
          setActiveTab('chat');
          handleSendMessage(prompt);
        }}
      />

      {/* 2. Theme Background Modal */}
      <ThemeBackgroundModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        activeTheme={activeTheme}
        onSelectTheme={handleSelectTheme}
        voiceEnabled={voiceThemeEnabled}
        onToggleVoice={handleToggleVoiceTheme}
        isDark={isDark}
      />

      {/* 4. AI Voice Modal */}
      <AIVoiceModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        isDark={isDark}
      />

      {/* 5. User Name & Grade Modal */}
      <UserNameModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        currentName={userName}
        onSaveName={handleSaveUserName}
        currentGrade={grade}
        onSelectGrade={handleSelectGrade}
        currentGender={userGender}
        onSaveGender={handleSaveGender}
        currentAvatar={userAvatar}
        onSaveAvatar={handleSaveAvatar}
        currentDob={userDob}
        onSaveDob={handleSaveDob}
        onOpenBirthdaySurprise={() => setShowBirthdayModal(true)}
        onOpenAchievements={() => setShowAchievementsModal(true)}
        isDark={isDark}
      />

      {/* 6. Avatar Modal */}
      <AvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        currentAvatar={userAvatar}
        onSaveAvatar={handleSaveAvatar}
        currentGender={userGender}
        onSaveGender={handleSaveGender}
        userName={userName}
        isDark={isDark}
      />

      {/* 7. Auth Modal: Student vs Teacher Guest Login or Admin Portal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        isDark={isDark}
        onOpenAvatarModal={() => setShowAvatarModal(true)}
      />

      {/* 8. Store & PWA Install Modal */}
      <StorePublishModal
        isOpen={showStoreModal}
        onClose={() => setShowStoreModal(false)}
        isDark={isDark}
        isOwner={isAdmin}
      />

      {/* 9. Pricing Modal (100% Free Access Guaranteed) */}
      <PricingUpgradeModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        isDark={isDark}
        currentPlan={subscriptionPlan}
        onSelectPlan={(newPlan) => {
          setSubscriptionPlan(newPlan);
          if (currentUser) {
            const updated = { ...currentUser, plan: newPlan };
            setCurrentUser(updated);
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
          }
        }}
        userName={userName}
        initialPlan={pricingInitialState.initialPlan}
        initialStep={pricingInitialState.initialStep}
      />

      {/* 10. Student Achievements & Badges Modal */}
      <AchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
        isDark={isDark}
        userName={userName}
        userAvatar={userAvatar}
        onNavigateToTab={(tab) => setActiveTab(tab)}
      />

      {/* 11. Birthday Surprise Modal (Bất ngờ sinh nhật cho bạn học & giáo viên) */}
      <BirthdaySurpriseModal
        isOpen={showBirthdayModal}
        onClose={() => setShowBirthdayModal(false)}
        userName={userName}
        userAvatar={userAvatar}
        userDob={userDob}
        isTeacher={currentUser?.role === 'teacher'}
        isDark={isDark}
        onClaimBirthdayReward={handleClaimBirthdayReward}
      />

      {/* 12. Holiday Flower & Random Gift Spin Modal (8/3, 20/10, 20/11) */}
      <HolidayGiftAnimationModal
        isOpen={!isBotCrawler && showHolidayGiftModal}
        onClose={() => setShowHolidayGiftModal(false)}
        userName={currentUser?.name || userName}
        isTeacher={currentUser?.role === 'teacher'}
        userGender={userGender}
        teacherTitle={currentUser?.teacherTitle}
        isDark={isDark}
        initialHolidayId={holidayGiftInitialId}
        isExactHolidayToday={isExactHolidayToday}
      />

      {/* 12b. Anytime XP Level-Up Spin & Ronaldo SIUUUU Modal */}
      <XpSpinModal
        isOpen={!isBotCrawler && showXpSpinModal}
        onClose={() => setShowXpSpinModal(false)}
        isDark={isDark}
        userName={currentUser?.name || userName}
      />

      {/* 13. XP Milestone & Level 2412 (MAX) Fireworks + Halo Celebration */}
      <LevelUpCelebrationOverlay
        userName={currentUser?.name || userName}
        isDark={isDark}
        enabled={!isBotCrawler}
      />

      {/* 14. Slide-out Question History Drawer */}
      {!isChatFullscreen && (
        <HistoryDrawer
          isOpen={historyDrawerOpen}
          onClose={() => setHistoryDrawerOpen(false)}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => {
            setCurrentSessionId(id);
            setActiveTab('chat');
          }}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          isDark={isDark}
        />
      )}

      {/* 15. Global Real-Time Incoming Call Overlay (Accept / Decline + Camera/Mic) */}
      <IncomingCallModal
        activeUserId={
          currentUser
            ? currentUser.id
            : 'user-local-' + (userName || 'Bạn học').toLowerCase().replace(/\s+/g, '-')
        }
        activeUserName={currentUser ? currentUser.name : userName || 'Bạn học'}
        activeUserAvatar={currentUser?.avatar || userAvatar}
        isDark={isDark}
        disabled={isBotCrawler}
      />
    </div>
  );
}

export default App;
