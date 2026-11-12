import { ChatGroup, GroupChatMessage, FriendItem, DirectChatMessage } from '../types';

/**
 * Danh sách bạn bè và nhóm ban đầu hoàn toàn sạch sẽ (không có tin nhắn giả hay người lạ tạo sẵn).
 * Người dùng tự kết bạn hoặc tạo nhóm thực tế để bắt đầu trò chuyện.
 */
export const DEFAULT_STUDENT_FRIENDS: FriendItem[] = [];

export const DEFAULT_DIRECT_MESSAGES: Record<string, DirectChatMessage[]> = {};

export const INITIAL_GROUPS: ChatGroup[] = [];

export const INITIAL_GROUP_MESSAGES: Record<string, GroupChatMessage[]> = {};
