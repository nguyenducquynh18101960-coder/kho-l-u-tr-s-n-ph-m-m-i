import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  BookOpen,
  ScrollText,
  Network,
  UserCircle2,
  Compass,
  Loader2,
  Zap,
  ShieldCheck,
  MessageSquare,
  RotateCcw,
  Crown,
  Coins,
  Database,
  Clock,
  CheckCircle2,
  AlertCircle,
  Palette,
  Layers,
} from 'lucide-react';
import { GradeLevel } from '../types';
import { UserAccount, isUserAdmin } from '../types/auth';
import { SubscriptionPlan } from './chatgpt/PricingUpgradeModal';
import { CanvasTextCompositor, CanvasOverlayData, CompositorMode } from './CanvasTextCompositor';
import { DiagramCodeStudio } from './DiagramCodeStudio';
import {
  AVATAR_XP_COST,
  DailyImageQuotaStatus,
  fetchServerImageQuota,
  getAvatarXpBalance,
  getPlanDailyImageLimit,
  spendXpForCustomAvatar,
} from '../data/imageQuota';

interface ImageGeneratorProps {
  currentGrade: GradeLevel;
  onSendToChat?: (text: string, imageUrl?: string) => void;
  isDark?: boolean;
  currentUser?: UserAccount | null;
  subscriptionPlan?: SubscriptionPlan;
  onUpdateAvatar?: (avatarUrl: string) => void;
  onOpenPricing?: () => void;
}

type StudioTab =
  | 'flashcard'
  | 'literature'
  | 'mindmap_infographic'
  | 'avatar'
  | 'stem_diagram';

interface GeneratedVisualItem {
  id: string;
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  mode: CompositorMode;
  style: string;
  aspectRatio: string;
  provider?: string;
  cached?: boolean;
  canonicalKeyword?: string;
  overlay: CanvasOverlayData;
  createdAt: number;
}

interface ActiveQueueJob {
  jobId: string;
  prompt: string;
  mode: CompositorMode;
  status: 'queued' | 'enhancing_prompt' | 'generating_image' | 'caching_asset' | 'completed' | 'failed';
  progress: number;
  stageLabel: string;
  position: number;
  error?: string;
}

interface CachedKeywordPreview {
  cacheKey: string;
  canonicalKeyword: string;
  originalPrompt: string;
  mode: CompositorMode;
  imageUrl: string;
  hitCount: number;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  currentGrade,
  onSendToChat,
  isDark = false,
  currentUser = null,
  subscriptionPlan = 'free',
  onUpdateAvatar,
  onOpenPricing,
}) => {
  const userId = currentUser?.id || 'guest-student';
  const userRole = currentUser?.role || 'student';
  const isAdmin = isUserAdmin(currentUser);

  const [activeTab, setActiveTab] = useState<StudioTab>('flashcard');
  const [prompt, setPrompt] = useState<string>('photosynthesis');
  const [style, setStyle] = useState<string>('chatgpt');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [avatarArchetype, setAvatarArchetype] = useState<
    'cartoon_3d' | 'superhero' | 'scientist' | 'scholar'
  >('cartoon_3d');

  const [currentItem, setCurrentItem] = useState<GeneratedVisualItem | null>({
    id: 'featured-20-10',
    url: '/assets/aistudio/a-heartwarming-photo-of-a-graceful-vietnamese-woman-wearing-an-elegant-silk-o-di-smiling-joyfully_6ce349b7.jpg',
    prompt: 'Poster Chào Mừng Ngày Phụ Nữ Việt Nam 20/10',
    enhancedPrompt: 'Graceful Vietnamese woman in pink silk ao dai holding roses, warm golden studio lighting',
    mode: 'poster',
    style: 'chatgpt',
    aspectRatio: '1:1',
    provider: 'Bộ sưu tập có sẵn Max10',
    cached: true,
    overlay: {
      title: 'Chào Mừng Ngày Phụ Nữ Việt Nam 20/10',
      eraOrWork: 'MAX10 EDU STUDIO',
      quoteOrCaption: 'Tôn vinh vẻ đẹp trí tuệ và yêu thương của cô giáo & nữ sinh Việt Nam.',
    },
    createdAt: Date.now(),
  });

  const [history, setHistory] = useState<GeneratedVisualItem[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveQueueJob[]>([]);
  const [cachedKeywords, setCachedKeywords] = useState<CachedKeywordPreview[]>([]);
  const [quota, setQuota] = useState<DailyImageQuotaStatus>(() => {
    const limit = getPlanDailyImageLimit(subscriptionPlan, userRole, isAdmin);
    return {
      used: 0,
      limit,
      remaining: limit,
      isUnlimited: limit >= 100,
      date: new Date().toISOString().split('T')[0],
      plan: subscriptionPlan,
      role: userRole,
    };
  });
  const [xpBalance, setXpBalance] = useState<number>(() => getAvatarXpBalance());
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const pollTimersRef = useRef<Record<string, number>>({});

  // Sync quota & popular cached keywords on mount and user/plan changes
  useEffect(() => {
    fetchServerImageQuota({
      userId,
      plan: subscriptionPlan,
      role: userRole,
      isAdmin,
    }).then((q) => {
      if (q) setQuota(q);
    });

    fetch('/api/image-cache-list')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setCachedKeywords(data.items);
        }
      })
      .catch(() => {});
  }, [userId, subscriptionPlan, userRole, isAdmin]);

  // Listen for XP changes across the app
  useEffect(() => {
    const onAchUpdate = () => setXpBalance(getAvatarXpBalance());
    window.addEventListener('max10_achievements_updated', onAchUpdate);
    return () => window.removeEventListener('max10_achievements_updated', onAchUpdate);
  }, []);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(pollTimersRef.current).forEach((t) => window.clearInterval(t));
    };
  }, []);

  // Update sensible defaults when switching studio tabs
  const handleSelectTab = (tab: StudioTab) => {
    setActiveTab(tab);
    setErrorBanner(null);
    if (tab === 'flashcard') {
      setPrompt('photosynthesis');
      setStyle('3d_cartoon');
      setAspectRatio('1:1');
    } else if (tab === 'literature') {
      setPrompt('Cảnh Thúy Kiều buồn nhớ quê hương bên lầu Ngưng Bích dưới ánh trăng tà');
      setStyle('literature_art');
      setAspectRatio('16:9');
    } else if (tab === 'mindmap_infographic') {
      setPrompt(
        'Quá trình quang hợp ở cây xanh: Cây hấp thụ khí CO2 qua khí khổng và nước từ rễ dưới tác dụng của ánh sáng mặt trời và diệp lục để tạo ra chất hữu cơ (Glucozo) và giải phóng khí Oxy.'
      );
      setStyle('diagram');
      setAspectRatio('1:1');
    } else if (tab === 'avatar') {
      setPrompt('Học sinh thông minh chinh phục điểm 10');
      setStyle('3d_cartoon');
      setAspectRatio('1:1');
    }
  };

  const tabDefinitions: Array<{
    id: StudioTab;
    label: string;
    icon: React.ReactNode;
    desc: string;
  }> = [
    {
      id: 'flashcard',
      label: 'Flashcard Từ Vựng',
      icon: <BookOpen className="w-4 h-4" />,
      desc: 'Từ vựng Tiếng Anh & khái niệm mới kèm phiên âm IPA, nghĩa Việt',
    },
    {
      id: 'literature',
      label: 'Minh Họa Văn & Sử',
      icon: <ScrollText className="w-4 h-4" />,
      desc: 'Tái hiện nhân vật lịch sử, sự kiện, bối cảnh tác phẩm văn học',
    },
    {
      id: 'mindmap_infographic',
      label: 'Mindmap & Infographic',
      icon: <Network className="w-4 h-4" />,
      desc: 'Tóm tắt lý thuyết dài thành thẻ nhánh Infographic rõ ràng',
    },
    {
      id: 'avatar',
      label: 'Avatar & Huy Hiệu (XP)',
      icon: <UserCircle2 className="w-4 h-4" />,
      desc: 'Dùng điểm thưởng học tập tạo Avatar hoạt hình, siêu anh hùng, khoa học',
    },
    {
      id: 'stem_diagram',
      label: 'Hình Học & Biểu Đồ (SVG)',
      icon: <Compass className="w-4 h-4" />,
      desc: 'Toán, Lý, Hóa dựng bằng mã SVG / Mermaid.js chuẩn xác 100%',
    },
  ];

  const modeSuggestions: Record<Exclude<StudioTab, 'stem_diagram'>, string[]> = {
    flashcard: ['photosynthesis', 'evaporation', 'ecosystem', 'gravity', 'metamorphosis'],
    literature: [
      'Cảnh Thúy Kiều ở lầu Ngưng Bích nhìn thuyền buồm xa khơi lúc hoàng hôn',
      'Chiến thắng Bạch Đằng năm 938 của Ngô Quyền với bãi cọc gỗ trên sông',
      'Hình ảnh người chiến sĩ hành quân qua dãy Trường Sơn trong ánh trăng',
      'Poster Chào mừng Ngày Phụ Nữ Việt Nam 20/10',
    ],
    mindmap_infographic: [
      'Định luật bảo toàn khối lượng và cân bằng phương trình hóa học: Tổng khối lượng các chất sản phẩm bằng tổng khối lượng các chất tham gia phản ứng.',
      'Hệ tuần hoàn máu ở người gồm vòng tuần hoàn nhỏ qua phổi và vòng tuần hoàn lớn nuôi tế bào cơ thể.',
      'Các biện pháp tu từ trong Ngữ văn THCS: So sánh, Nhân hóa, Ẩn dụ, Hoán dụ và Điệp ngữ.',
    ],
    avatar: [
      'Nam sinh thông minh đeo kính trí tuệ nhân tạo chinh phục Toán học',
      'Nữ sinh năng động yêu thích thí nghiệm Hóa học và Thiên văn',
      'Thủ khoa lịch sử cầm ngọn đuốc tri thức vàng rực rỡ',
    ],
  };

  const avatarArchetypes = [
    { id: 'cartoon_3d' as const, label: 'Hoạt hình 3D', note: 'Pixar sinh động' },
    { id: 'superhero' as const, label: 'Siêu anh hùng', note: 'Năng lượng điểm 10' },
    { id: 'scientist' as const, label: 'Nhà khoa học', note: 'Phòng thí nghiệm' },
    { id: 'scholar' as const, label: 'Huy hiệu Thủ khoa', note: 'Vòng nguyệt quế' },
  ];

  const handleEnqueueGeneration = async (overridePrompt?: string) => {
    if (activeTab === 'stem_diagram') return;
    const textToUse = (overridePrompt ?? prompt).trim();
    if (!textToUse) return;
    setErrorBanner(null);

    // Preserve fast path for 20/10 featured poster
    if (textToUse.toLowerCase().includes('20/10') || textToUse.toLowerCase().includes('phụ nữ việt nam')) {
      setCurrentItem({
        id: 'featured-20-10-' + Date.now(),
        url: '/assets/aistudio/a-heartwarming-photo-of-a-graceful-vietnamese-woman-wearing-an-elegant-silk-o-di-smiling-joyfully_6ce349b7.jpg',
        prompt: textToUse,
        enhancedPrompt: 'Graceful Vietnamese woman in pink silk ao dai holding roses',
        mode: 'poster',
        style: 'chatgpt',
        aspectRatio: '1:1',
        provider: 'Bộ nhớ đệm Max10 (Instant)',
        cached: true,
        overlay: {
          title: 'Chào Mừng Ngày Phụ Nữ Việt Nam 20/10',
          eraOrWork: 'MAX10 EDU STUDIO',
          quoteOrCaption: 'Kính chúc cô giáo và các bạn nữ sinh luôn rạng rỡ và gặt hái thật nhiều điểm 10!',
        },
        createdAt: Date.now(),
      });
      return;
    }

    // Check XP deduction if Avatar mode & student wants to use XP
    let xpDeducted = false;
    if (activeTab === 'avatar' && userRole === 'student' && !isAdmin && subscriptionPlan === 'free') {
      if (xpBalance >= AVATAR_XP_COST) {
        const spent = spendXpForCustomAvatar(AVATAR_XP_COST);
        if (spent.success) {
          setXpBalance(spent.remainingXp);
          xpDeducted = true;
        }
      }
    }

    try {
      const res = await fetch('/api/image-jobs/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToUse,
          mode: activeTab,
          style,
          aspectRatio,
          avatarArchetype: activeTab === 'avatar' ? avatarArchetype : undefined,
          userId,
          plan: subscriptionPlan,
          role: userRole,
          isAdmin,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorBanner(data.error || 'Không thể xếp hàng tạo ảnh.');
        if (data.quota) setQuota(data.quota);
        return;
      }

      const job = data.job;
      if (job.status === 'completed' && job.result) {
        // Instant Cache Hit!
        const resultItem: GeneratedVisualItem = {
          id: job.jobId,
          url: job.result.imageUrl,
          prompt: job.result.prompt,
          enhancedPrompt: job.result.enhancedPrompt,
          mode: job.result.mode,
          style: job.result.style,
          aspectRatio: job.result.aspectRatio,
          provider: job.result.provider,
          cached: true,
          canonicalKeyword: job.result.canonicalKeyword,
          overlay: job.result.overlay,
          createdAt: Date.now(),
        };
        setCurrentItem(resultItem);
        setHistory((prev) => [resultItem, ...prev.filter((h) => h.id !== resultItem.id)].slice(0, 8));
        if (job.result.quota) setQuota(job.result.quota);
        return;
      }

      // Add to async queue list & start polling
      const queuedEntry: ActiveQueueJob = {
        jobId: job.jobId,
        prompt: textToUse,
        mode: activeTab,
        status: job.status,
        progress: job.progress || 12,
        stageLabel: job.stageLabel || 'Đang xếp hàng...',
        position: job.position || 1,
      };
      setActiveJobs((prev) => [queuedEntry, ...prev].slice(0, 5));

      const timer = window.setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/image-jobs/${job.jobId}`);
          const pollData = await pollRes.json();
          if (!pollData.success || !pollData.job) {
            window.clearInterval(timer);
            delete pollTimersRef.current[job.jobId];
            return;
          }

          const latest = pollData.job;
          setActiveJobs((prev) =>
            prev.map((j) =>
              j.jobId === job.jobId
                ? {
                    ...j,
                    status: latest.status,
                    progress: latest.progress,
                    stageLabel: latest.stageLabel,
                    position: latest.position,
                    error: latest.error,
                  }
                : j
            )
          );

          if (latest.status === 'completed' && latest.result) {
            window.clearInterval(timer);
            delete pollTimersRef.current[job.jobId];

            const doneItem: GeneratedVisualItem = {
              id: latest.jobId,
              url: latest.result.imageUrl,
              prompt: latest.result.prompt,
              enhancedPrompt: latest.result.enhancedPrompt,
              mode: latest.result.mode,
              style: latest.result.style,
              aspectRatio: latest.result.aspectRatio,
              provider: latest.result.provider,
              cached: latest.result.cached,
              canonicalKeyword: latest.result.canonicalKeyword,
              overlay: latest.result.overlay,
              createdAt: Date.now(),
            };
            setCurrentItem(doneItem);
            setHistory((prev) => [doneItem, ...prev.filter((h) => h.id !== doneItem.id)].slice(0, 8));
            if (latest.result.quota) setQuota(latest.result.quota);

            // Refresh popular cached keywords list
            fetch('/api/image-cache-list')
              .then((r) => r.json())
              .then((cacheData) => {
                if (cacheData.success && Array.isArray(cacheData.items)) {
                  setCachedKeywords(cacheData.items);
                }
              })
              .catch(() => {});

            // Auto-remove completed indicator after 4s
            setTimeout(() => {
              setActiveJobs((prev) => prev.filter((j) => j.jobId !== job.jobId));
            }, 4000);
          } else if (latest.status === 'failed') {
            window.clearInterval(timer);
            delete pollTimersRef.current[job.jobId];
            setErrorBanner(latest.error || 'Tiến trình tạo ảnh thất bại.');
            if (xpDeducted) {
              setXpBalance(getAvatarXpBalance());
            }
          }
        } catch {
          // Keep polling on transient network blip
        }
      }, 850);

      pollTimersRef.current[job.jobId] = timer;
    } catch (err: any) {
      setErrorBanner(err?.message || 'Lỗi kết nối hàng đợi xử lý.');
    }
  };

  const hasRunningJobs = activeJobs.some(
    (j) => j.status !== 'completed' && j.status !== 'failed'
  );

  return (
    <div
      className={`w-full min-h-full p-4 md:p-8 pb-36 transition-colors ${
        isDark ? 'bg-[#18181b] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Studio Header & Daily Quota Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b pb-5 border-slate-200 dark:border-zinc-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mb-1">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">MAX10 VISUAL STUDIO (FREE TIER)</span>
              <span aria-hidden="true">·</span>
              <span>Minh họa Vector SVG (Gemini 2.5 Flash)</span>
              <span aria-hidden="true">·</span>
              <span>Tách chữ Việt trên Canvas & Cache từ khóa</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Studio Trực Quan Học Tập & Vẽ Hình Chuẩn Xác
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-2xl">
              Dùng hoàn toàn miễn phí (GEMINI_API_KEY Free Tier): tạo Flashcard từ vựng, minh họa Văn & Sử, Infographic tóm tắt, Avatar điểm thưởng và hình vẽ Toán/Lý/Hóa chính xác bằng mã SVG & Mermaid.js.
            </p>
          </div>

          {/* Daily Quota & XP Wallet Summary */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div
              className={`px-3.5 py-2 rounded-xl border text-xs flex items-center gap-3 ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div>
                <div className="text-[11px] text-slate-400 font-semibold">Lượt tạo ảnh mới hôm nay</div>
                <div className="font-black text-sm flex items-center gap-1.5">
                  <span className={quota.remaining === 0 ? 'text-rose-500' : 'text-emerald-500'}>
                    {quota.remaining}/{quota.limit} lượt
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    ({subscriptionPlan === 'free' && userRole === 'student' && !isAdmin ? 'Gói Thường' : 'Mở rộng VIP'})
                  </span>
                </div>
              </div>
              {subscriptionPlan === 'free' && userRole === 'student' && !isAdmin && onOpenPricing && (
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Mở rộng VIP</span>
                </button>
              )}
            </div>

            <div
              className={`px-3.5 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-[11px] text-slate-400 font-semibold">Điểm thưởng XP</div>
                <div className="font-black text-sm text-amber-500">{xpBalance} XP</div>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Mode Interactive Segmented Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {tabDefinitions.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </div>
                <div className={`text-[11px] line-clamp-2 ${active ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {tab.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Mode 5: Exact STEM Code Diagrams (SVG / Mermaid.js) */}
        {activeTab === 'stem_diagram' ? (
          <DiagramCodeStudio currentGrade={currentGrade} isDark={isDark} />
        ) : (
          /* Modes 1-4: Commercial Image + Async Queue + Keyword Cache + HTML5 Canvas Text Compositor */
          <div className="space-y-5">
            {/* Async Queue Live Progress Panel */}
            {activeJobs.length > 0 && (
              <div
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Clock className="w-4 h-4" />
                    <span>Hàng đợi xử lý bất đồng bộ ({activeJobs.length} tác vụ)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Không chặn giao diện · Bạn có thể gửi thêm yêu cầu song song
                  </span>
                </div>
                <div className="space-y-2">
                  {activeJobs.map((job) => (
                    <div
                      key={job.jobId}
                      className={`p-2.5 rounded-xl border text-xs ${
                        isDark ? 'bg-zinc-800/70 border-zinc-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold truncate">{job.prompt}</span>
                        <span className="flex items-center gap-1 shrink-0 font-semibold text-[11px]">
                          {job.status === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : job.status === 'failed' ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
                          )}
                          <span>{job.progress}%</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            job.status === 'failed'
                              ? 'bg-rose-500'
                              : job.status === 'completed'
                              ? 'bg-emerald-500'
                              : 'bg-sky-500'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{job.error || job.stageLabel}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorBanner && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center justify-between gap-3">
                <span>{errorBanner}</span>
                {quota.remaining === 0 && onOpenPricing && (
                  <button
                    type="button"
                    onClick={onOpenPricing}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0 cursor-pointer"
                  >
                    Nâng cấp VIP
                  </button>
                )}
              </div>
            )}

            {/* Main Studio 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Controls (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div
                  className={`p-4 md:p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {activeTab === 'flashcard'
                        ? '1. Nhập từ vựng hoặc khái niệm'
                        : activeTab === 'literature'
                        ? '1. Mô tả bối cảnh Văn học / Lịch sử'
                        : activeTab === 'mindmap_infographic'
                        ? '1. Dán đoạn lý thuyết cần tóm tắt'
                        : '1. Mô tả nhân vật & phong cách Avatar'}
                    </label>
                    <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Tách chữ Việt chuẩn</span>
                    </span>
                  </div>

                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={activeTab === 'mindmap_infographic' ? 4 : 3}
                    placeholder={
                      activeTab === 'flashcard'
                        ? 'Ví dụ: photosynthesis, quang hợp, evaporation, gravity...'
                        : activeTab === 'literature'
                        ? 'Ví dụ: Cảnh Ngô Quyền chỉ huy trận Bạch Đằng năm 938...'
                        : activeTab === 'mindmap_infographic'
                        ? 'Dán đoạn lý thuyết dài để AI tách thành các nhánh tóm tắt trực quan...'
                        : 'Ví dụ: Học sinh giỏi toán đeo kính thông minh, nền vũ trụ...'
                    }
                    className={`w-full p-3 rounded-xl text-sm border resize-none focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />

                  {/* Mode-Specific Quick Suggestions */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 mb-1.5">
                      Gợi ý nhanh (bấm để tạo ngay):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {modeSuggestions[activeTab].map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPrompt(s);
                            handleEnqueueGeneration(s);
                          }}
                          className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors line-clamp-1 cursor-pointer ${
                            isDark
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                          }`}
                          title={s}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Avatar Archetype Selector OR Style Selector */}
                  {activeTab === 'avatar' ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold uppercase tracking-wider text-slate-400">
                          2. Chọn phong cách Avatar & Huy hiệu
                        </span>
                        <span className="text-amber-500 font-bold text-[11px]">
                          {xpBalance >= AVATAR_XP_COST
                            ? `Đổi ${AVATAR_XP_COST} XP / lần`
                            : 'Đang hỗ trợ lượt trải nghiệm'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {avatarArchetypes.map((arch) => (
                          <button
                            key={arch.id}
                            type="button"
                            onClick={() => setAvatarArchetype(arch.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              avatarArchetype === arch.id
                                ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                                : isDark
                                ? 'border-zinc-800 bg-zinc-850 hover:bg-zinc-800'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="text-xs font-bold">{arch.label}</div>
                            <div className="text-[11px] text-slate-400">{arch.note}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-emerald-500" />
                        <span>2. Phong cách hình nền minh họa (Không chữ)</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'chatgpt', name: 'Đồ họa Sắc nét', desc: 'Rõ ràng, cân đối' },
                          { id: '3d_cartoon', name: '3D Hoạt hình', desc: 'Thân thiện, dễ nhớ' },
                          { id: 'literature_art', name: 'Sơn dầu / Văn học', desc: 'Chiều sâu cảm xúc' },
                          { id: 'anime', name: 'Anime Ghibli', desc: 'Cảnh sắc nên thơ' },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setStyle(st.id)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              style === st.id
                                ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                                : isDark
                                ? 'border-zinc-800 bg-zinc-850 hover:bg-zinc-800'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="text-xs font-bold">{st.name}</div>
                            <div className="text-[11px] text-slate-400">{st.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aspect Ratio */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-500" />
                      <span>3. Tỷ lệ khung hình</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['1:1', '16:9', '4:3', '9:16'] as const).map((ar) => (
                        <button
                          key={ar}
                          type="button"
                          onClick={() => setAspectRatio(ar)}
                          className={`py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                            aspectRatio === ar
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                              : isDark
                              ? 'border-zinc-800 bg-zinc-850 text-zinc-300'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                          }`}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit to Async Queue */}
                  <button
                    type="button"
                    onClick={() => handleEnqueueGeneration()}
                    disabled={!prompt.trim()}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                      !prompt.trim()
                        ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                    }`}
                  >
                    {hasRunningJobs ? (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Thêm vào hàng đợi xử lý song song</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {activeTab === 'avatar'
                            ? 'Tạo Avatar & Huy Hiệu Cá Nhân'
                            : activeTab === 'flashcard'
                            ? 'Tạo Flashcard Từ Vựng Trực Quan'
                            : activeTab === 'mindmap_infographic'
                            ? 'Tạo Infographic Tóm Tắt Lý Thuyết'
                            : 'Vẽ Minh Họa Văn Học / Lịch Sử'}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Popular Keyword Cache Shelf */}
                {cachedKeywords.length > 0 && (
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-sky-500" />
                        <span>Bộ nhớ đệm từ khóa (0 lượt tốn · Tức thì)</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cachedKeywords.slice(0, 8).map((item) => (
                        <button
                          key={item.cacheKey}
                          type="button"
                          onClick={() => {
                            setPrompt(item.originalPrompt);
                            handleEnqueueGeneration(item.originalPrompt);
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                            isDark
                              ? 'bg-sky-950/30 border-sky-800/50 text-sky-300 hover:bg-sky-900/40'
                              : 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100'
                          }`}
                        >
                          ⚡ {item.originalPrompt} ({item.hitCount})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Canvas Output & History (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div
                  className={`p-4 md:p-5 rounded-2xl border ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  {currentItem ? (
                    <div className="space-y-4">
                      {/* Metadata Header (Zero-Pill clean inline typography) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-zinc-800">
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {currentItem.overlay.title || currentItem.prompt}
                          </div>
                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span>{currentItem.provider || 'Commercial Image API'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{currentItem.aspectRatio}</span>
                            {currentItem.cached && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-500 font-semibold">
                                  ⚡ Lấy từ Bộ nhớ đệm (Không tốn lượt)
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEnqueueGeneration(currentItem.prompt)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                              isDark
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750'
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                            <span>Tạo lại</span>
                          </button>

                          {onSendToChat && (
                            <button
                              type="button"
                              onClick={() =>
                                onSendToChat(
                                  `Hãy giải thích sâu hơn về hình minh họa chủ đề "${currentItem.prompt}" giúp em nhé!`,
                                  currentItem.url
                                )
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                                isDark
                                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750'
                                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Hỏi AI Chat</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* HTML5 Canvas Text + Image Compositor */}
                      <CanvasTextCompositor
                        baseImageUrl={currentItem.url}
                        mode={currentItem.mode}
                        aspectRatio={currentItem.aspectRatio}
                        overlay={currentItem.overlay}
                        isDark={isDark}
                        onApplyAsAvatar={onUpdateAvatar}
                      />
                    </div>
                  ) : null}
                </div>

                {/* Recent Session History */}
                {history.length > 0 && (
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Lịch sử tạo gần đây ({history.length})
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {history.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCurrentItem(item)}
                          className={`relative rounded-xl overflow-hidden aspect-square border cursor-pointer transition-all ${
                            currentItem?.id === item.id
                              ? 'ring-2 ring-emerald-500 border-emerald-500'
                              : 'border-slate-200 dark:border-zinc-700 hover:opacity-85'
                          }`}
                          title={item.prompt}
                        >
                          <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
