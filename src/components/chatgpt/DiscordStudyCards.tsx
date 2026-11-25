import React, { useState } from 'react';
import {
  UserPlus,
  MessageCircle,
  Globe2,
  Award,
  BookOpen,
  Sparkles,
  Check,
  Users,
  Terminal,
  Compass,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  DiscordStudyEmbedData,
  VirtualStudyBuddy,
  StudyPresenceStatus,
  StudyLanguageMode,
  CURRICULUM_STANDARDS,
} from '../../data/globalStudySystem';
import { CountryCode, COUNTRY_CULTURES, QuizTopicId, QUIZ_TOPICS } from '../../data/countryCultures';

interface DiscordStudyCardsProps {
  embed: DiscordStudyEmbedData;
  isDark: boolean;
  friendIds: string[];
  onExecuteCommand: (command: string) => void;
  onAddFriend: (buddy: VirtualStudyBuddy) => void;
  onStartBuddyChat: (buddy: VirtualStudyBuddy) => void;
  onCycleStatus?: (nextStatus: StudyPresenceStatus) => void;
  onApplyCurriculum?: (config: {
    countryCode: CountryCode;
    gradeLabel: string;
    subject: QuizTopicId;
    languageMode: StudyLanguageMode;
    startQuiz: boolean;
  }) => void;
}

function getStatusDotClass(status: StudyPresenceStatus): string {
  if (status === 'Online') return 'bg-emerald-500';
  if (status === 'Đang ôn bài') return 'bg-amber-500';
  return 'bg-rose-500';
}

function getStatusTextClass(status: StudyPresenceStatus, isDark: boolean): string {
  if (status === 'Online') return isDark ? 'text-emerald-400' : 'text-emerald-700';
  if (status === 'Đang ôn bài') return isDark ? 'text-amber-400' : 'text-amber-700';
  return isDark ? 'text-rose-400' : 'text-rose-700';
}

const GRADE_OPTIONS = [
  'Lớp 1–5 (Tiểu học)',
  'Lớp 6',
  'Lớp 7',
  'Lớp 8',
  'Lớp 9',
  'Lớp 10',
  'Lớp 11',
  'Lớp 12',
];

export const DiscordStudyCards: React.FC<DiscordStudyCardsProps> = ({
  embed,
  isDark,
  friendIds,
  onExecuteCommand,
  onAddFriend,
  onStartBuddyChat,
  onCycleStatus,
  onApplyCurriculum,
}) => {
  // Local state for interactive curriculum_prompt card
  const initialCountry =
    embed.kind === 'curriculum_prompt' ? embed.currentCountryCode : 'VN';
  const initialGrade = embed.kind === 'curriculum_prompt' ? embed.currentGrade : 'Lớp 9';
  const initialSubject =
    embed.kind === 'curriculum_prompt' ? embed.currentSubject : 'Toán';
  const initialLangMode =
    embed.kind === 'curriculum_prompt' ? embed.currentLanguageMode : 'bilingual';

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(initialCountry);
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGrade);
  const [selectedSubject, setSelectedSubject] = useState<QuizTopicId>(initialSubject);
  const [selectedLangMode, setSelectedLangMode] =
    useState<StudyLanguageMode>(initialLangMode);

  const cardSurface = isDark
    ? 'bg-[#2b2d31] border-white/10 text-zinc-100'
    : 'bg-[#f6f7f9] border-slate-200 text-slate-900';

  const innerSurface = isDark
    ? 'bg-[#1e1f22] border-white/[0.08]'
    : 'bg-white border-slate-200/90';

  const mutedText = isDark ? 'text-zinc-400' : 'text-slate-500';

  const renderProfileCardBody = (
    name: string,
    tag: string,
    flag: string,
    countryName: string,
    languageLabel: string,
    gradeLabel: string,
    subjectLabel: string,
    status: StudyPresenceStatus,
    badges: string[],
    avatarEmoji?: string,
    subtitle?: string,
    isSelf?: boolean,
    buddy?: VirtualStudyBuddy
  ) => {
    const isAlreadyFriend = buddy ? friendIds.includes(buddy.id) : false;
    const nextStatusMap: Record<StudyPresenceStatus, StudyPresenceStatus> = {
      Online: 'Đang ôn bài',
      'Đang ôn bài': 'Cần giúp đỡ',
      'Cần giúp đỡ': 'Online',
    };

    return (
      <div className={`rounded-2xl border p-4 ${innerSurface}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 h-12 rounded-2xl bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center text-2xl shrink-0">
              <span>{avatarEmoji || flag}</span>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                  isDark ? 'border-[#1e1f22]' : 'border-white'
                } ${getStatusDotClass(status)}`}
                title={status}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base font-extrabold tracking-tight truncate">
                  {name}
                </span>
                <span className={`text-xs font-mono font-bold ${mutedText}`}>
                  #{tag}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-0.5">
                <span className={`font-bold ${getStatusTextClass(status, isDark)}`}>
                  ● {status}
                </span>
                <span className={mutedText}>·</span>
                <span className="font-semibold">
                  {flag} {countryName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {isSelf && onCycleStatus && (
              <button
                type="button"
                onClick={() => onCycleStatus(nextStatusMap[status])}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.05] border-white/10 hover:bg-white/10 text-zinc-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="Đổi trạng thái học tập"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đổi trạng thái</span>
              </button>
            )}

            {buddy && (
              <>
                <button
                  type="button"
                  onClick={() => onAddFriend(buddy)}
                  disabled={isAlreadyFriend}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isAlreadyFriend
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 cursor-default'
                      : 'bg-[#5865F2] hover:bg-[#4752C4] text-white'
                  }`}
                >
                  {isAlreadyFriend ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã kết bạn</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Kết bạn</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onStartBuddyChat(buddy)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat ngay</span>
                </button>
              </>
            )}
          </div>
        </div>

        {subtitle && (
          <p className={`text-xs mt-2.5 leading-relaxed ${mutedText}`}>{subtitle}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 text-xs">
          <div className={`p-2.5 rounded-xl border ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-100 bg-slate-50/70'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
              Ngôn ngữ sử dụng
            </div>
            <div className="font-bold mt-0.5 truncate">{languageLabel}</div>
          </div>

          <div className={`p-2.5 rounded-xl border ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-100 bg-slate-50/70'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
              Cấp học hiện tại
            </div>
            <div className="font-bold mt-0.5 truncate">{gradeLabel}</div>
          </div>

          <div className={`p-2.5 rounded-xl border ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-100 bg-slate-50/70'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
              Môn thế mạnh
            </div>
            <div className="font-bold mt-0.5 truncate">{subjectLabel}</div>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className={`font-bold flex items-center gap-1 mr-1 ${mutedText}`}>
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Huy hiệu:
            </span>
            {badges.map((b) => (
              <span
                key={b}
                className={`px-2 py-0.5 rounded-md font-semibold border ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (embed.kind === 'welcome_activation') {
    const p = embed.profile;
    return (
      <div className={`rounded-2xl border border-l-4 border-l-[#5865F2] p-4 shadow-sm ${cardSurface}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#5865F2]">
              <ShieldCheck className="w-4 h-4" />
              <span>Hệ thống Gia sư Toàn cầu &amp; Cộng đồng Discord đã kích hoạt</span>
            </div>
            <p className="text-xs sm:text-sm mt-1 leading-relaxed">
              Sẵn sàng dạy theo chuẩn chương trình mọi quốc gia, chuyển đổi ngôn ngữ tức thì và kết nối bạn học quốc tế. Dưới đây là <strong>Thẻ Hồ sơ Discord mặc định</strong> của bạn:
            </p>
          </div>
        </div>

        {renderProfileCardBody(
          p.displayName,
          p.tag,
          p.flag,
          p.countryName,
          p.activeLanguageLabel,
          p.gradeLabel,
          p.subjectLabel,
          p.status,
          p.badges,
          undefined,
          `Đã kết bạn với ${p.friendIds.length} bạn học quốc tế · Dùng /listban để xem danh sách.`,
          true
        )}

        <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
          <div className={`text-[11px] font-bold mb-2 flex items-center gap-1.5 ${mutedText}`}>
            <Terminal className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>Thử ngay lệnh điều khiển đầu tiên (bấm để chạy hoặc gõ dấu /):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {embed.suggestedCommands.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => onExecuteCommand(cmd)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#1e1f22] border-white/10 hover:border-[#5865F2] text-indigo-300'
                    : 'bg-white border-slate-200 hover:border-[#5865F2] text-[#4752C4]'
                }`}
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (embed.kind === 'profile') {
    const p = embed.profile;
    return (
      <div className={`rounded-2xl border border-l-4 border-l-[#5865F2] p-4 shadow-sm ${cardSurface}`}>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#5865F2]">
            {embed.isSelf ? '🪪 Hồ sơ Discord của bạn' : '🪪 Hồ sơ Bạn học Quốc tế'}
          </span>
          <button
            type="button"
            onClick={() => onExecuteCommand('/listban')}
            className={`text-xs font-bold hover:underline cursor-pointer ${mutedText}`}
          >
            Xem danh sách bạn (/listban)
          </button>
        </div>
        {renderProfileCardBody(
          p.displayName,
          p.tag,
          p.flag,
          p.countryName,
          p.activeLanguageLabel,
          p.gradeLabel,
          p.subjectLabel,
          p.status,
          p.badges,
          embed.buddy?.avatarEmoji,
          embed.buddy
            ? `${embed.buddy.personality} · Lời chào: "${embed.buddy.nativeGreeting}"`
            : `Đang kết nối ${p.friendIds.length} bạn học toàn cầu.`,
          embed.isSelf,
          embed.buddy
        )}
      </div>
    );
  }

  if (embed.kind === 'buddy_search') {
    return (
      <div className={`rounded-2xl border border-l-4 border-l-emerald-500 p-4 shadow-sm ${cardSurface}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Gợi ý 3 bạn học quốc tế ({embed.queryLabel})</span>
            </div>
            <p className={`text-xs mt-0.5 ${mutedText}`}>
              Bấm <strong>Kết bạn</strong> để lưu vào danh sách hoặc <strong>Chat ngay</strong> để trò chuyện song ngữ bản địa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onExecuteCommand(`/timban ${embed.queryLabel === 'Toàn cầu' ? '' : embed.queryLabel}`.trim())}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer shrink-0 ${
              isDark
                ? 'bg-white/[0.04] border-white/10 hover:bg-white/10'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            🎲 Đổi gợi ý
          </button>
        </div>

        <div className="space-y-2.5">
          {embed.buddies.map((b) => {
            const isFriend = friendIds.includes(b.id);
            return (
              <div key={b.id} className={`rounded-xl border p-3 ${innerSurface}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="relative w-10 h-10 rounded-xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center text-xl shrink-0">
                      <span>{b.avatarEmoji}</span>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                          isDark ? 'border-[#1e1f22]' : 'border-white'
                        } ${getStatusDotClass(b.status)}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap text-sm font-extrabold">
                        <span>{b.flag}</span>
                        <span>{b.name}</span>
                        <span className={`text-xs font-mono font-semibold ${mutedText}`}>
                          #{b.tag}
                        </span>
                        <span className={`text-[11px] font-bold ${getStatusTextClass(b.status, isDark)}`}>
                          · {b.status}
                        </span>
                      </div>
                      <div className={`text-xs mt-0.5 ${mutedText}`}>
                        {b.grade} · Thế mạnh: <strong className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{b.strongSubject}</strong> · {b.nativeLanguage}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onExecuteCommand(`/xem ${b.name}`)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                        isDark
                          ? 'bg-white/[0.04] border-white/10 hover:bg-white/10'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddFriend(b)}
                      disabled={isFriend}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1 ${
                        isFriend
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 cursor-default'
                          : 'bg-[#5865F2] hover:bg-[#4752C4] text-white'
                      }`}
                    >
                      {isFriend ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      <span>{isFriend ? 'Bạn bè' : 'Kết bạn'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartBuddyChat(b)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat ngay</span>
                    </button>
                  </div>
                </div>

                <div className={`mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-xs space-y-0.5`}>
                  <div className="font-semibold">“{b.nativeGreeting}”</div>
                  <div className={mutedText}>🇻🇳 Dịch nghĩa: {b.viTranslation}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (embed.kind === 'friends_list') {
    return (
      <div className={`rounded-2xl border border-l-4 border-l-[#5865F2] p-4 shadow-sm ${cardSurface}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#5865F2] flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Danh sách bạn bè học tập ({embed.friends.length})</span>
          </div>
          <button
            type="button"
            onClick={() => onExecuteCommand('/timban')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer"
          >
            + Tìm thêm bạn
          </button>
        </div>

        {embed.friends.length === 0 ? (
          <p className={`text-xs ${mutedText}`}>
            Bạn chưa kết bạn với ai. Hãy dùng lệnh <code>/timban Hàn Quốc</code> để tìm bạn nhé!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {embed.friends.map((b) => (
              <div
                key={b.id}
                className={`rounded-xl border p-3 flex items-center justify-between gap-2 ${innerSurface}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative text-xl shrink-0">
                    <span>{b.avatarEmoji}</span>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border ${
                        isDark ? 'border-[#1e1f22]' : 'border-white'
                      } ${getStatusDotClass(b.status)}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold truncate">
                      {b.flag} {b.name} <span className={`font-mono ${mutedText}`}>#{b.tag}</span>
                    </div>
                    <div className={`text-[11px] truncate ${mutedText}`}>
                      <span className={getStatusTextClass(b.status, isDark)}>● {b.status}</span> · {b.strongSubject}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onExecuteCommand(`/xem ${b.name}`)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      isDark
                        ? 'border-white/10 hover:bg-white/10'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Hồ sơ
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartBuddyChat(b)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                  >
                    Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (embed.kind === 'buddy_added') {
    const b = embed.buddy;
    return (
      <div className={`rounded-2xl border border-l-4 border-l-emerald-500 p-4 shadow-sm ${cardSurface}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
              {embed.alreadyFriend ? '✅ Đã có trong danh sách bạn bè' : '🤝 Kết bạn thành công!'}
            </div>
            <div className="text-sm font-bold mt-1">
              {b.flag} {b.name} <span className={`font-mono text-xs ${mutedText}`}>#{b.tag}</span> ({b.nativeLanguage})
            </div>
            <p className={`text-xs mt-0.5 ${mutedText}`}>
              Tổng số bạn học hiện tại: {embed.totalFriends} · Bấm Chat ngay để luyện song ngữ!
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onStartBuddyChat(b)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
            >
              💬 Chat với {b.name}
            </button>
            <button
              type="button"
              onClick={() => onExecuteCommand('/listban')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                isDark ? 'border-white/10 hover:bg-white/10' : 'border-slate-200 hover:bg-white'
              }`}
            >
              Xem /listban
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (embed.kind === 'language_updated') {
    const std = CURRICULUM_STANDARDS[embed.countryCode];
    return (
      <div className={`rounded-2xl border border-l-4 border-l-sky-500 p-4 shadow-sm ${cardSurface}`}>
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky-500">
          <Globe2 className="w-4 h-4" />
          <span>Đã cập nhật Ngôn ngữ &amp; Chuẩn Quốc gia</span>
        </div>
        <div className="mt-2 text-sm font-bold">
          {embed.flag} {embed.countryName} · Chế độ ngôn ngữ: {embed.languageLabel}
        </div>
        <div className={`mt-1 text-xs space-y-0.5 ${mutedText}`}>
          <div>📘 Chuẩn kiến thức: {std.standardName}</div>
          <div>📏 Đơn vị đo lường: {std.unitSystem}</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onExecuteCommand(`/hoibai ${embed.countryName} Toán`)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
          >
            🎯 Hỏi bài chuẩn {embed.countryName} ngay
          </button>
          <button
            type="button"
            onClick={() => onExecuteCommand(`/timban ${embed.countryName}`)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer"
          >
            👥 Tìm bạn học ở {embed.countryName}
          </button>
        </div>
      </div>
    );
  }

  if (embed.kind === 'curriculum_prompt') {
    const std = CURRICULUM_STANDARDS[selectedCountry];
    return (
      <div className={`rounded-2xl border border-l-4 border-l-amber-500 p-4 shadow-sm ${cardSurface}`}>
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-500">
          <Compass className="w-4 h-4" />
          <span>{embed.title}</span>
        </div>
        <p className="text-xs sm:text-sm mt-1 leading-relaxed">{embed.subtitle}</p>

        <div className={`mt-3 p-3 rounded-xl border space-y-3 ${innerSurface}`}>
          <div>
            <div className={`text-[11px] font-bold mb-1.5 ${mutedText}`}>1. Chọn Chương trình Quốc gia:</div>
            <div className="flex flex-wrap gap-1.5">
              {COUNTRY_CULTURES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCountry(c.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                    selectedCountry === c.code
                      ? 'bg-[#5865F2] text-white border-[#5865F2]'
                      : isDark
                      ? 'bg-white/[0.04] border-white/10 hover:bg-white/10'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.flag} {c.shortName}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className={`text-[11px] font-bold mb-1.5 ${mutedText}`}>2. Cấp học:</div>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border outline-none ${
                  isDark
                    ? 'bg-[#2b2d31] border-white/10 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className={`text-[11px] font-bold mb-1.5 ${mutedText}`}>3. Ngôn ngữ AI:</div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'vi' as StudyLanguageMode, label: '🇻🇳 Việt' },
                  { id: 'bilingual' as StudyLanguageMode, label: '🌐 Song ngữ' },
                  { id: 'native' as StudyLanguageMode, label: '🗣️ Bản ngữ' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedLangMode(opt.id)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      selectedLangMode === opt.id
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : isDark
                        ? 'bg-white/[0.04] border-white/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className={`text-[11px] font-bold mb-1.5 ${mutedText}`}>4. Môn học muốn dò bài:</div>
            <div className="flex flex-wrap gap-1.5">
              {QUIZ_TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedSubject(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    selectedSubject === t.id
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : isDark
                      ? 'bg-white/[0.04] border-white/10 hover:bg-white/10'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`text-[11px] p-2 rounded-lg border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200/70'} ${mutedText}`}>
            <div><strong>Chuẩn áp dụng:</strong> {std.standardName}</div>
            <div><strong>Hệ đơn vị &amp; Cấp học:</strong> {std.unitSystem} · {std.gradeSystem}</div>
          </div>

          {onApplyCurriculum && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  onApplyCurriculum({
                    countryCode: selectedCountry,
                    gradeLabel: selectedGrade,
                    subject: selectedSubject,
                    languageMode: selectedLangMode,
                    startQuiz: true,
                  })
                }
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lưu &amp; Bắt đầu dò bài từng câu</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onApplyCurriculum({
                    countryCode: selectedCountry,
                    gradeLabel: selectedGrade,
                    subject: selectedSubject,
                    languageMode: selectedLangMode,
                    startQuiz: false,
                  })
                }
                className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  isDark ? 'border-white/10 hover:bg-white/10' : 'border-slate-200 hover:bg-slate-100'
                }`}
              >
                Chỉ lưu cấu hình học
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Help embed
  return (
    <div className={`rounded-2xl border border-l-4 border-l-[#5865F2] p-4 shadow-sm ${cardSurface}`}>
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#5865F2] mb-2">
        <BookOpen className="w-4 h-4" />
        <span>Danh sách Slash Commands (Hệ thống Học tập Toàn cầu)</span>
      </div>
      <div className="space-y-1.5">
        {embed.commands.map((item) => (
          <div
            key={item.command}
            className={`rounded-xl border p-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${innerSurface}`}
          >
            <div className="min-w-0">
              <div className="font-mono text-xs font-bold text-[#5865F2]">{item.syntax}</div>
              <div className={`text-xs mt-0.5 ${mutedText}`}>{item.description}</div>
            </div>
            <button
              type="button"
              onClick={() => onExecuteCommand(item.example)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border shrink-0 cursor-pointer ${
                isDark ? 'border-white/10 hover:bg-white/10' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              Thử: {item.example}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
