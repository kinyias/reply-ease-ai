export type RoleType = "user" | "assistant";

export interface ChatMessageItem {
  id: string;
  message: string;
  role: RoleType;
  seen: boolean;
  chat_room_id: string;
  created_at: string;
  updated_at?: string | null;
  link?: string | null;
}

export interface CustomerBrief {
  id: string;
  email: string | null;
  created_at: string;
  answered_questions_count: number;
  total_questions_count: number;
}

export interface ConversationRoomSummary {
  id: string;
  domain_id: string;
  domain_name: string;
  live: boolean;
  mailed: boolean;
  customer?: CustomerBrief | null;
  last_message?: ChatMessageItem | null;
  unread_count: number;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationListResponse {
  rooms: ConversationRoomSummary[];
  total: number;
  unread_total: number;
  live_total: number;
  urgent_total: number;
}

export type ConversationTab = "all" | "unread" | "urgent" | "live" | "expired";

export interface ToggleRealtimeResponse {
  room_id: string;
  live: boolean;
  message: string;
}

export interface MarkSeenResponse {
  room_id: string;
  seen_count: number;
  message: string;
}

export interface WebSocketMessagePayload {
  type: "new_message" | "live_mode_toggled" | "messages_seen" | "typing_start" | "typing_stop" | "connected" | "pong";
  room_id?: string;
  message?: ChatMessageItem;
  live?: boolean;
  role?: string;
  timestamp?: string;
  data?: any;
}
