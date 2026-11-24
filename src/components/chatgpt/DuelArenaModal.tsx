import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Swords,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  Users,
  Sparkles,
  Bot,
  Award,
  Loader2,
} from 'lucide-react';
import { DuelChallenge, GradeLevel, PublicMemberProfile } from '../../types';
import {
  buildDuelQuestions,
  DUEL_SUBJECT_OPTIONS,
  DuelSubjectOption,
} from '../../data/duelQuestionBank';
import { UserAvatarWithStatus } from './UserAvatarWithStatus';
import { safeFetchJson } from '../../utils/safeFetchJson';
import {
  loadStudentAchievements,
  saveStudentAchievements,
} from '../../data/initialAchievements';
import { calculateLevel } from '../../types/achievements';
import { celebrateMilestone, launchGoldenStarBurst } from '../../utils/confettiFireworks';
import { soundEffects } from '../../utils/soundEffects';
import { CountryCode, getCountryCulture } from '../../data/countryCultures';
import { recordAttemptResult } from '../../utils/knowledgeGapTracker';

const STORAGE_KEY_LOCAL_CHALLENGES = 'max10_local_challenges_v1';

export function loadLocalChallenges(): DuelChallenge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_CHALLENGES);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalChallenge(challenge: DuelChallenge) {
  try {
    const list = loadLocalChallenges();
    const idx = list.findIndex((c) => c.id === challenge.id);
    if (idx >= 0) {
      list[idx] = challenge;
    } else {
      list.unshift(challenge);
    }
    localStorage.setItem(STORAGE_KEY_LOCAL_CHALLENGES, JSON.stringify(list.slice(0, 60)));
    window.dispatchEvent(new CustomEvent('max10_challenges_updated'));
  } catch {}
}

interface DuelArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  contextType: 'community' | 'group' | 'direct';
  contextId: string;
  contextName: string;
  currentGrade: GradeLevel;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  targetMember?: PublicMemberProfile | null;
  existingChallenge?: DuelChallenge | null;
  countryCode?: CountryCode;
  initialTab?: 'duel' | 'leaderboard';
  onChallengeUpdated: (challenge: DuelChallenge, mode: 'created' | 'completed') => void;
}

interface LeaderboardPlayer {
  userId: string;
  name: string;
  avatar: string;
  wins: number;
  draws: number;
  losses: number;
  played: number;
  totalCorrect: number;
  winRate: number;
  points: number;
}

const QUESTION_TIME_LIMIT_SEC = 20;

export const DuelArenaModal: React.FC<DuelArenaModalProps> = ({
  isOpen,
  onClose,
  isDark,
  contextType,
  contextId,
  contextName,
  currentGrade,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  targetMember,
  existingChallenge,
  countryCode = 'VN',
  initialTab = 'duel',
  onChallengeUpdated,
}) => {
  const activeCountry = getCountryCulture(countryCode);
  const [modalTab, setModalTab] = useState<'duel' | 'leaderboard'>(initialTab);
  const [selectedSubject, setSelectedSubject] = useState<DuelSubjectOption>('Tổng hợp THCS');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(currentGrade);
  const [useAiReferee, setUseAiReferee] = useState<boolean>(true);
  const [generatingAiQuestions, setGeneratingAiQuestions] = useState<boolean>(false);
  const [aiRefereeNote, setAiRefereeNote] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);
  const [activeChallenge, setActiveChallenge] = useState<DuelChallenge | null>(null);
  const [stage, setStage] = useState<'setup' | 'playing' | 'summary'>('setup');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT_SEC);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const matchStartMsRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const loadLeaderboardData = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await safeFetchJson<{ success?: boolean; leaderboard?: LeaderboardPlayer[] }>(
        '/api/challenges/leaderboard'
      );
      const serverList = Array.isArray(res?.leaderboard) ? res.leaderboard : [];
      if (serverList.length > 0) {
        setLeaderboard(serverList);
      } else {
        // Fallback compute from localStorage challenges
        const local = loadLocalChallenges();
        const map = new Map<string, LeaderboardPlayer>();
        local.forEach((c) => {
          if (c.status === 'completed' && c.challengerId && c.opponentId) {
            const ensure = (id: string, name: string, avatar?: string): LeaderboardPlayer => {
              let item = map.get(id);
              if (!item) {
                item = {
                  userId: id,
                  name,
                  avatar: avatar || '',
                  wins: 0,
                  draws: 0,
                  losses: 0,
                  played: 0,
                  totalCorrect: 0,
                  winRate: 0,
                  points: 0,
                };
                map.set(id, item);
              }
              return item;
            };
            const cE = ensure(c.challengerId, c.challengerName, c.challengerAvatar);
            const oE = ensure(c.opponentId, c.opponentName || 'Đối thủ', c.opponentAvatar);
            const cS = Number(c.challengerScore || 0);
            const oS = Number(c.opponentScore || 0);
            cE.played += 1;
            oE.played += 1;
            cE.totalCorrect += cS;
            oE.totalCorrect += oS;
            if (c.winnerId === c.challengerId) {
              cE.wins += 1;
              cE.points += 100 + cS * 10;
              oE.losses += 1;
              oE.points += 20 + oS * 10;
            } else if (c.winnerId === c.opponentId) {
              oE.wins += 1;
              oE.points += 100 + oS * 10;
              cE.losses += 1;
              cE.points += 20 + cS * 10;
            } else {
              cE.draws += 1;
              oE.draws += 1;
              cE.points += 50 + cS * 10;
              oE.points += 50 + oS * 10;
            }
          }
        });
        const computed = Array.from(map.values())
          .map((e) => ({ ...e, winRate: e.played > 0 ? Math.round((e.wins / e.played) * 100) : 0 }))
          .sort((a, b) => b.points - a.points || b.wins - a.wins);
        setLeaderboard(computed);
      }
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      clearTimer();
      return;
    }
    setModalTab(initialTab);
    setSelectedGrade(currentGrade);
    setSelectedOption(null);
    setQuestionIdx(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(QUESTION_TIME_LIMIT_SEC);
    setXpAwarded(0);
    setAiRefereeNote('');
    loadLeaderboardData();

    if (existingChallenge) {
      setActiveChallenge(existingChallenge);
      setStage('playing');
      matchStartMsRef.current = Date.now();
    } else {
      setActiveChallenge(null);
      setStage('setup');
    }

    return () => clearTimer();
  }, [isOpen, existingChallenge, currentGrade, initialTab]);

  // Question countdown timer while playing and no option selected yet
  useEffect(() => {
    clearTimer();
    if (!isOpen || modalTab !== 'duel' || stage !== 'playing' || selectedOption !== null) return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setSelectedOption(-1); // Timeout sentinel
          setStreak(0);
          setAiRefereeNote('⏱️ Hết giờ rồi! Trọng tài AI nhắc bạn giữ tốc độ nhé.');
          if (currentQuestion) {
            recordAttemptResult({
              subject: currentQuestion.subject || selectedSubject,
              topic: `Đấu trường 1v1 · ${currentQuestion.subject || selectedSubject}`,
              question: currentQuestion.question,
              userAnswer: 'Hết thời gian (0 điểm)',
              correctAnswer: currentQuestion.options[currentQuestion.correctIndex],
              explanation: currentQuestion.explanation,
              isCorrect: false,
              source: 'duel',
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimer();
  }, [isOpen, modalTab, stage, questionIdx, selectedOption]);

  const currentQuestion = useMemo(() => {
    if (!activeChallenge) return null;
    return activeChallenge.questions[questionIdx] || null;
  }, [activeChallenge, questionIdx]);

  if (!isOpen) return null;

  const isTargetSelf = !targetMember || targetMember.id === currentUserId;

  const handleStartNewChallenge = async () => {
    setAiRefereeNote('');
    let questions = buildDuelQuestions(selectedSubject, selectedGrade, 5);

    if (useAiReferee) {
      setGeneratingAiQuestions(true);
      try {
        const res = await safeFetchJson<{
          success?: boolean;
          questions?: typeof questions;
        }>('/api/duel/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: selectedSubject,
            grade: selectedGrade,
            countryCode,
            count: 5,
          }),
        });
        if (res?.success && Array.isArray(res.questions) && res.questions.length >= 3) {
          questions = res.questions;
        }
      } catch {
        // Silent graceful fallback to instant offline question bank
      } finally {
        setGeneratingAiQuestions(false);
      }
    }

    const created: DuelChallenge = {
      id: `duel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      contextType,
      contextId,
      contextName,
      subject: selectedSubject,
      grade: selectedGrade,
      challengerId: currentUserId,
      challengerName: currentUserName,
      challengerAvatar: currentUserAvatar || '',
      opponentId: !isTargetSelf ? targetMember?.id : undefined,
      opponentName: !isTargetSelf ? targetMember?.name : undefined,
      opponentAvatar: !isTargetSelf ? targetMember?.avatar : undefined,
      questions,
      status: 'pending',
      createdAt: Date.now(),
    };
    setActiveChallenge(created);
    setQuestionIdx(0);
    setSelectedOption(null);
    setScore(0);
    setStreak(0);
    setTimeLeft(QUESTION_TIME_LIMIT_SEC);
    matchStartMsRef.current = Date.now();
    setStage('playing');
    soundEffects.playCorrect();
  };

  const handleChooseOption = (idx: number) => {
    if (selectedOption !== null || !currentQuestion) return;
    clearTimer();
    setSelectedOption(idx);
    const isCorrect = idx === currentQuestion.correctIndex;
    recordAttemptResult({
      subject: currentQuestion.subject || selectedSubject,
      topic: `Đấu trường 1v1 · ${currentQuestion.subject || selectedSubject}`,
      question: currentQuestion.question,
      userAnswer: currentQuestion.options[idx],
      correctAnswer: currentQuestion.options[currentQuestion.correctIndex],
      explanation: currentQuestion.explanation,
      isCorrect,
      source: 'duel',
    });

    if (isCorrect) {
      const nextStreak = streak + 1;
      setScore((s) => s + 1);
      setStreak(nextStreak);
      setAiRefereeNote(
        nextStreak >= 2
          ? `🤖 Trọng tài AI (${activeCountry.flag}): Quá đỉnh! Chuỗi ${nextStreak} câu đúng liên tiếp — giữ vững tốc độ nhé!`
          : `🤖 Trọng tài AI (${activeCountry.flag}): Chính xác tuyệt đối! Còn dư ${timeLeft}s trên đồng hồ.`
      );
      soundEffects.playCorrect();
    } else {
      setStreak(0);
      setAiRefereeNote(
        `🤖 Trọng tài AI (${activeCountry.flag}): Suýt trúng rồi! Đừng lo, câu này đã được lưu vào Sổ tay Ôn bù Lỗ hổng AI để bạn xem lại.`
      );
      soundEffects.playClick();
    }
  };

  const finalizeDuel = async (finalScore: number) => {
    if (!activeChallenge) return;
    setSubmitting(true);
    const elapsedMs = Math.max(1000, Date.now() - matchStartMsRef.current);

    let finalChallenge: DuelChallenge = { ...activeChallenge };
    const isCreatingNew = !existingChallenge;

    if (isCreatingNew) {
      finalChallenge.challengerScore = finalScore;
      finalChallenge.challengerTimeMs = elapsedMs;
      try {
        const res = await safeFetchJson<{ success?: boolean; challenge?: DuelChallenge }>(
          '/api/challenges',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalChallenge),
          }
        );
        if (res?.success && res.challenge) {
          finalChallenge = res.challenge;
        }
      } catch {}
      saveLocalChallenge(finalChallenge);

      // Award participation XP immediately
      const baseXp = 50 + finalScore * 15;
      const stats = loadStudentAchievements();
      const nextXp = stats.totalXp + baseXp;
      const lv = calculateLevel(nextXp);
      saveStudentAchievements({
        ...stats,
        totalXp: nextXp,
        level: lv.level,
        levelTitle: lv.title,
        nextLevelXp: lv.nextLevelXp,
      });
      setXpAwarded(baseXp);
      setActiveChallenge(finalChallenge);
      setStage('summary');
      setSubmitting(false);
      onChallengeUpdated(finalChallenge, 'created');
    } else {
      // Submitting opponent score
      const cScore = finalChallenge.challengerScore ?? 0;
      const cTime = finalChallenge.challengerTimeMs ?? Number.MAX_SAFE_INTEGER;
      finalChallenge.opponentId = currentUserId;
      finalChallenge.opponentName = currentUserName;
      finalChallenge.opponentAvatar = currentUserAvatar || '';
      finalChallenge.opponentScore = finalScore;
      finalChallenge.opponentTimeMs = elapsedMs;
      finalChallenge.status = 'completed';
      finalChallenge.completedAt = Date.now();

      if (finalScore > cScore || (finalScore === cScore && elapsedMs < cTime)) {
        finalChallenge.winnerId = currentUserId;
        finalChallenge.winnerName = currentUserName;
      } else if (cScore > finalScore || (cScore === finalScore && cTime < elapsedMs)) {
        finalChallenge.winnerId = finalChallenge.challengerId;
        finalChallenge.winnerName = finalChallenge.challengerName;
      } else {
        finalChallenge.winnerId = 'draw';
        finalChallenge.winnerName = 'Hòa nhau';
      }

      try {
        const res = await safeFetchJson<{ success?: boolean; challenge?: DuelChallenge }>(
          `/api/challenges/${encodeURIComponent(finalChallenge.id)}/submit`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerId: currentUserId,
              playerName: currentUserName,
              playerAvatar: currentUserAvatar || '',
              score: finalScore,
              timeMs: elapsedMs,
            }),
          }
        );
        if (res?.success && res.challenge) {
          finalChallenge = res.challenge;
        }
      } catch {}

      saveLocalChallenge(finalChallenge);

      const didWin = finalChallenge.winnerId === currentUserId;
      const isDraw = finalChallenge.winnerId === 'draw';
      const bonusXp = didWin ? 150 + finalScore * 15 : isDraw ? 80 + finalScore * 10 : 50 + finalScore * 10;

      const stats = loadStudentAchievements();
      const nextXp = stats.totalXp + bonusXp;
      const lv = calculateLevel(nextXp);
      saveStudentAchievements({
        ...stats,
        totalXp: nextXp,
        level: lv.level,
        levelTitle: lv.title,
        nextLevelXp: lv.nextLevelXp,
      });

      if (didWin) {
        celebrateMilestone();
        launchGoldenStarBurst();
        soundEffects.playBadgeUnlocked();
      } else {
        soundEffects.playCheckInReward();
      }

      setXpAwarded(bonusXp);
      setActiveChallenge(finalChallenge);
      setStage('summary');
      setSubmitting(false);
      onChallengeUpdated(finalChallenge, 'completed');
    }
  };

  const handleNextQuestion = () => {
    if (!activeChallenge) return;
    const isLast = questionIdx + 1 >= activeChallenge.questions.length;
    if (isLast) {
      finalizeDuel(score);
    } else {
      setQuestionIdx((i) => i + 1);
      setSelectedOption(null);
      setTimeLeft(QUESTION_TIME_LIMIT_SEC);
    }
  };

  const contextTitle =
    contextType === 'community'
      ? `Cộng đồng: ${contextName}`
      : contextType === 'group'
      ? `Nhóm: ${contextName}`
      : `Bạn bè 1-1: ${contextName}`;

  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto select-none">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-auto ${
          isDark
            ? 'bg-[#0e1422] border-white/15 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-black/25 hover:bg-black/45 text-white transition-colors cursor-pointer"
            aria-label="Đóng đấu trường"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-200 pr-10">
            <Swords className="w-4 h-4 text-amber-300" />
            <span>Đấu Trường Tri Thức Max10</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{contextTitle}</span>
          </div>
          <h2 className="text-lg font-black tracking-tight mt-0.5 pr-8">
            {existingChallenge
              ? `Nhận Kèo Thi Đấu vs ${existingChallenge.challengerName}`
              : !isTargetSelf && targetMember
              ? `Thách Đấu Trực Tiếp ${targetMember.name}`
              : 'Mở Kèo Thi Đấu & Vinh Danh Bảng Xếp Hạng'}
          </h2>

          {/* Top Navigation Tabs: Thi đấu 1v1 | Bảng xếp hạng */}
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => setModalTab('duel')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors ${
                modalTab === 'duel'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Thi đấu 1v1</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setModalTab('leaderboard');
                loadLeaderboardData();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors ${
                modalTab === 'leaderboard'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Bảng Xếp Hạng ({leaderboard.length})</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {modalTab === 'leaderboard' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-extrabold text-amber-500">
                  <Award className="w-4 h-4" />
                  <span>Top Cao Thủ Đấu Trường Điểm 10</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Thắng +100đ · Hòa +50đ · +10đ/câu đúng
                </span>
              </div>

              {loadingLeaderboard ? (
                <div className="py-10 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tổng hợp bảng xếp hạng...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div
                  className={`rounded-2xl p-8 text-center border border-dashed ${
                    isDark ? 'border-white/10 text-zinc-400' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  <Trophy className="w-10 h-10 mx-auto text-amber-500/70 mb-2" />
                  <div className="text-sm font-black">Chưa có trận đấu hoàn tất nào!</div>
                  <p className="text-xs mt-1">
                    Hãy chuyển sang tab Thi đấu 1v1 để mở kèo thách đấu đầu tiên trong cộng đồng!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {leaderboard.map((p, idx) => {
                    const isMe = p.userId === currentUserId;
                    const rankBadge =
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-900'
                        : idx === 2
                        ? 'bg-orange-400 text-slate-950'
                        : 'bg-slate-500/15 text-slate-500 dark:text-zinc-300';

                    return (
                      <div
                        key={p.userId}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                          isMe
                            ? 'bg-emerald-500/12 border-emerald-500/40'
                            : isDark
                            ? 'bg-white/[0.02] border-white/10'
                            : 'bg-slate-50/80 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${rankBadge}`}
                          >
                            #{idx + 1}
                          </span>
                          <UserAvatarWithStatus name={p.name} src={p.avatar} size="sm" />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-black truncate flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isMe && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                              {p.wins} Thắng · {p.draws} Hòa · {p.played} Trận ({p.winRate}% thắng)
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-black text-amber-500 tabular-nums">
                            {p.points} đ
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                            {p.totalCorrect} câu đúng
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {stage === 'setup' && (
            <div className="space-y-4">
              {/* Versus Preview Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <UserAvatarWithStatus name={currentUserName} src={currentUserAvatar} size="md" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                      Người thách đấu
                    </div>
                    <div className="text-xs sm:text-sm font-black truncate">{currentUserName}</div>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-500 font-black text-xs flex items-center justify-center shrink-0">
                  VS
                </div>

                <div className="flex items-center justify-end gap-2.5 min-w-0 flex-1 text-right">
                  {!isTargetSelf && targetMember ? (
                    <>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                          Đối thủ
                        </div>
                        <div className="text-xs sm:text-sm font-black truncate">{targetMember.name}</div>
                      </div>
                      <UserAvatarWithStatus
                        name={targetMember.name}
                        src={targetMember.avatar}
                        presenceStatus={targetMember.presenceStatus}
                        size="md"
                      />
                    </>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase text-teal-600 dark:text-teal-400">
                          Đấu trường mở
                        </div>
                        <div className="text-xs sm:text-sm font-black truncate">
                          Thành viên trong phòng
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Subject & Grade Pickers */}
              <div className="space-y-2.5">
                <label className="block text-xs font-extrabold text-slate-600 dark:text-zinc-300">
                  Chọn môn thi đấu (5 câu trắc nghiệm nhanh · 20s/câu):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DUEL_SUBJECT_OPTIONS.map((subj) => {
                    const active = selectedSubject === subj;
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setSelectedSubject(subj)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer text-left ${
                          active
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                            : isDark
                            ? 'bg-white/[0.03] border-white/[0.08] text-zinc-200 hover:bg-white/[0.08]'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {subj}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Khối lớp:</span>
                  {(['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'] as GradeLevel[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGrade(g)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                        selectedGrade === g
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                          : isDark
                          ? 'border-white/10 text-zinc-400'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Referee Toggle */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-emerald-950/25 border-emerald-500/25' : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold">
                      Trọng tài Gia sư AI {activeCountry.flag} ({activeCountry.name})
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Tự động soạn 5 câu hỏi tốc độ mới nhất và chấm điểm trực tiếp
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUseAiReferee((v) => !v)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer shrink-0 transition-colors ${
                    useAiReferee
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  {useAiReferee ? 'BẬT' : 'TẮT'}
                </button>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <strong>Cách thi đấu:</strong> Bạn làm trước 5 câu → hệ thống gửi <strong>Thẻ Thách Đấu</strong> vào đoạn chat để đối thủ hoặc thành viên khác nhấn <strong>Nhận kèo</strong> làm đúng bộ câu hỏi đó và phân thắng bại (+150 XP cho người thắng)!
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={generatingAiQuestions}
                  onClick={handleStartNewChallenge}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 disabled:opacity-60 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  {generatingAiQuestions ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gia sư AI đang ra đề...</span>
                    </>
                  ) : (
                    <>
                      <Swords className="w-4 h-4" />
                      <span>Bắt đầu Thi Đấu Ngay!</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {stage === 'playing' && activeChallenge && currentQuestion && (
            <div className="space-y-4">
              {/* HUD: Progress, Score, Streak, Timer */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-black">
                    Câu {questionIdx + 1}/{activeChallenge.questions.length}
                  </span>
                  <span className="text-slate-500 dark:text-zinc-400">
                    {currentQuestion.subject}
                  </span>
                </div>

                <div className="flex items-center gap-3 tabular-nums">
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                    Điểm: {score}/{activeChallenge.questions.length}
                  </span>
                  {streak >= 2 && (
                    <span className="text-amber-500 font-black">🔥 Chuỗi {streak}</span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black ${
                      timeLeft <= 5
                        ? 'bg-rose-500/15 text-rose-500'
                        : 'bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-zinc-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeLeft}s</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{
                    width: `${Math.round(((questionIdx + 1) / activeChallenge.questions.length) * 100)}%`,
                  }}
                />
              </div>

              {/* Question Card */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h3 className="text-sm sm:text-base font-extrabold leading-relaxed">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQuestion.options.map((opt, idx) => {
                  const answered = selectedOption !== null;
                  const isCorrect = idx === currentQuestion.correctIndex;
                  const isChosen = idx === selectedOption;

                  let btnClass = isDark
                    ? 'bg-white/[0.03] border-white/[0.08] hover:border-emerald-500/60 hover:bg-emerald-500/10'
                    : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50';

                  if (answered) {
                    if (isCorrect) {
                      btnClass =
                        'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                    } else if (isChosen && !isCorrect) {
                      btnClass =
                        'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-300';
                    } else {
                      btnClass = isDark
                        ? 'bg-white/[0.02] border-white/[0.05] opacity-60'
                        : 'bg-slate-50 border-slate-200 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={answered}
                      onClick={() => handleChooseOption(idx)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-2 cursor-pointer disabled:cursor-default ${btnClass}`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-200/70 dark:bg-white/10 text-[11px] font-black flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </span>
                      {answered && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      {answered && isChosen && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* AI Referee Remark + Explanation & Next */}
              {selectedOption !== null && (
                <div className="space-y-3 pt-1">
                  {aiRefereeNote && (
                    <div
                      className={`px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2 ${
                        selectedOption === currentQuestion.correctIndex
                          ? 'bg-emerald-600/12 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
                          : 'bg-indigo-500/12 border-indigo-500/35 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      <span>{aiRefereeNote}</span>
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      selectedOption === currentQuestion.correctIndex
                        ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/35 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    <strong>Giải thích: </strong>
                    {currentQuestion.explanation}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleNextQuestion}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>
                        {questionIdx + 1 >= activeChallenge.questions.length
                          ? submitting
                            ? 'Đang lưu kết quả...'
                            : 'Hoàn tất & Gửi lên phòng'
                          : 'Câu tiếp theo'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === 'summary' && activeChallenge && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-amber-400 text-white flex items-center justify-center mx-auto shadow-lg">
                {activeChallenge.status === 'completed' ? (
                  <Trophy className="w-8 h-8" />
                ) : (
                  <Swords className="w-8 h-8" />
                )}
              </div>

              {activeChallenge.status === 'completed' ? (
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-xs font-black">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {activeChallenge.winnerId === currentUserId
                        ? 'BẠN ĐÃ CHIẾN THẮNG!'
                        : activeChallenge.winnerId === 'draw'
                        ? 'TRẬN ĐẤU HÒA NHAU!'
                        : `${activeChallenge.winnerName} GIÀNH CHIẾN THẮNG!`}
                    </span>
                  </div>
                  <h3 className="text-lg font-black pt-1">
                    Tỷ số: {activeChallenge.challengerName} ({activeChallenge.challengerScore}/5) vs{' '}
                    {activeChallenge.opponentName} ({activeChallenge.opponentScore}/5)
                  </h3>
                </div>
              ) : (
                <div className="space-y-1">
                  <h3 className="text-lg font-black">
                    Đã gửi kèo thách đấu! Bạn đạt {activeChallenge.challengerScore ?? score}/
                    {activeChallenge.questions.length} câu đúng
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                    Thẻ thách đấu đã được đăng thẳng vào <strong>{contextName}</strong> để{' '}
                    {activeChallenge.opponentName || 'các thành viên khác'} nhấn{' '}
                    <strong>Nhận lời thi đấu</strong> và so điểm!
                  </p>
                </div>
              )}

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 text-xs font-black tabular-nums">
                <Zap className="w-4 h-4 fill-current" />
                <span>Đã cộng +{xpAwarded} XP vào cấp độ của bạn!</span>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loadLeaderboardData();
                    setModalTab('leaderboard');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Xem Bảng Xếp Hạng</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs sm:text-sm cursor-pointer"
                >
                  Quay lại cuộc trò chuyện
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
