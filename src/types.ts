export type GradeLevel =
  | 'Lớp 1'
  | 'Lớp 2'
  | 'Lớp 3'
  | 'Lớp 4'
  | 'Lớp 5'
  | 'Lớp 6'
  | 'Lớp 7'
  | 'Lớp 8'
  | 'Lớp 9'
  | 'Lớp 10'
  | 'Lớp 11'
  | 'Lớp 12';

export type SubjectId =
  | 'toan'
  | 'van'
  | 'anh'
  | 'khtn'
  | 'su_dia'
  | 'tin_hoc'
  | 'gdcd';

export interface SubjectInfo {
  id: SubjectId;
  name: string;
  iconName: string;
  badge: string;
  color: string;
  topics: Record<string, string[]>;
}

export type TutorMode =
  | 'tutor'
  | 'grade_10_secret'
  | 'mindmap'
  | 'trap_detector';

export interface GeneratedImageInfo {
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  seed?: number;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '3:4';
  style?: string;
}

export interface GeneratedVideoInfo {
  url?: string;
  title: string;
  topic: string;
  presenterAvatar?: string;
  script?: string;
  duration?: number;
  audioUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imagePreview?: string;
  generatedImage?: GeneratedImageInfo;
  generatedVideo?: GeneratedVideoInfo;
  deepThinkingContent?: string;
  meta?: {
    grade?: GradeLevel;
    subject?: string;
    mode?: TutorMode;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  grade: GradeLevel;
  isPinned?: boolean;
}

export interface ExamQuestion {
  id: number;
  questionText: string;
  type: 'multiple_choice' | 'essay';
  options?: string[];
  correctAnswer: string;
  difficulty: string;
  stepByStepSolution: string;
  score10Secret: string;
}

export interface ExamData {
  title: string;
  durationMinutes: number;
  instructions: string;
  questions: ExamQuestion[];
}

export interface HonorRollEntry {
  id: string;
  studentName: string;
  avatar?: string;
  school?: string;
  grade?: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  timeSpentSeconds?: number;
  examType: string;
  date: string;
  badge?: 'gold' | 'silver' | 'bronze' | 'top';
  note?: string;
}

export interface GradeResult {
  score: number;
  rating: string;
  strengths: string[];
  weaknessesAndTraps: string[];
  score10UpgradeSteps: string[];
  perfectSampleModel: string;
  encouragement: string;
}

export interface FormulaItem {
  name: string;
  formula: string;
  applicationNote: string;
}

export interface TrapItem {
  trapDescription: string;
  howToPrevent: string;
}

export interface TipsData {
  topicTitle: string;
  coreFormulas: FormulaItem[];
  topTrapsToAvoid: TrapItem[];
  score10Strategies: string[];
  masteryExample: {
    problem: string;
    standardSolution: string;
    score10Analysis: string;
  };
}

export interface StudyPlanDay {
  day: string;
  mainFocusSubject: string;
  timeAllocation: string;
  learningTasks: string[];
  score10Habit: string;
}

export interface StudyPlanData {
  planName: string;
  overviewMotto: string;
  weeklyRoutine: StudyPlanDay[];
  topGoldenRules: string[];
  examPrepChecklist: string[];
}

export interface MindMapNode {
  id: string;
  title: string;
  description?: string;
  keyPoint?: string;
  trapToAvoid?: string;
  color?: string;
  icon?: string;
  children?: MindMapNode[];
}

export interface MindMapData {
  id: string;
  topic: string;
  grade: GradeLevel;
  subject: string;
  centralTheme: string;
  summary: string;
  root: MindMapNode;
  keyTakeaways: string[];
  examScore10Tips: string[];
}

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member' | 'ai_tutor' | 'deputy';
  isAi?: boolean;
  school?: string;
  presenceStatus?: UserPresenceStatus;
}

export interface GroupChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: 'admin' | 'member' | 'ai_tutor' | 'system' | 'deputy';
  isAi?: boolean;
  content: string;
  timestamp: string;
  isSystemNotice?: boolean;
  isWarning?: boolean;
  isMuteNotice?: boolean;
  muteDurationMinutes?: number;
  unmuteTime?: number;
  detectedBadWords?: string[];
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
    timestamp?: string;
  };
  reaction?: string;
  status?: 'sent' | 'delivered' | 'read';
  attachment?: {
    type: 'image' | 'file';
    url: string;
    name?: string;
    size?: string;
  };
}

export interface UserMuteRecord {
  userId: string;
  userName: string;
  mutedUntil: number; // timestamp in ms
  muteDurationMinutes: number; // 5, 15, 30, 60
  violationCount: number;
  reason: string;
  mutedAt: number;
}

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  grade: GradeLevel;
  subject?: string;
  createdAt: number;
  avatarIcon?: string;
  members: GroupMember[];
  mutedUsers: Record<string, UserMuteRecord>;
  createdBy: string;
  code?: string; // Group code like Zalo (e.g. ZL-8392)
  onlyAdminCanAdd?: boolean; // When true: only group creator / admin can add members (User requested: "nhóm khi tạo chỉ bạn và bạn mới có thể thêm người vào")
  isPublic?: boolean;
  pinnedNotice?: string;
}

export type UserPresenceStatus = 'online' | 'dnd' | 'gaming' | 'offline';

export interface FriendItem {
  id: string;
  name: string;
  avatar?: string;
  school?: string;
  status: 'friend' | 'pending';
  presenceStatus?: UserPresenceStatus;
  addedAt: string;
  isBlocked?: boolean;
}

export interface BlockedUserItem {
  userId: string;
  name: string;
  avatar?: string;
  blockedAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  toUserId: string;
  toUserName: string;
  toUserAvatar?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface DirectChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  content: string;
  timestamp: string;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
    timestamp?: string;
  };
  reaction?: string;
  status?: 'sent' | 'delivered' | 'read';
  attachment?: {
    type: 'image' | 'file';
    url: string;
    name?: string;
    size?: string;
  };
}

