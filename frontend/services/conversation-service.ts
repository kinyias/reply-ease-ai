import apiClient from "@/lib/api-client";
import {
  ChatMessageItem,
  ConversationListResponse,
  ConversationTab,
  MarkSeenResponse,
  ToggleRealtimeResponse,
} from "@/types/conversation";

export const conversationService = {
  /**
   * Fetch conversations list for a domain or across all user's domains.
   */
  async getConversations(
    domainId?: string | null,
    tab: ConversationTab = "all",
    search?: string
  ): Promise<ConversationListResponse> {
    const url = domainId && domainId !== "all"
      ? `/conversations/domains/${domainId}`
      : "/conversations";

    const params: Record<string, string> = { tab };
    if (search && search.trim()) {
      params.search = search.trim();
    }

    const response = await apiClient.get<ConversationListResponse>(url, { params });
    return response.data;
  },

  /**
   * Fetch complete message history for an authorized chatroom.
   */
  async getMessages(roomId: string): Promise<ChatMessageItem[]> {
    const response = await apiClient.get<ChatMessageItem[]>(
      `/conversations/rooms/${roomId}/messages`
    );
    return response.data;
  },

  /**
   * Mark all unread user messages in the room as seen.
   */
  async markSeen(roomId: string): Promise<MarkSeenResponse> {
    const response = await apiClient.put<MarkSeenResponse>(
      `/conversations/rooms/${roomId}/seen`
    );
    return response.data;
  },

  /**
   * Toggle live human-in-the-loop takeover mode for a chatroom.
   */
  async toggleRealtime(
    roomId: string,
    live: boolean
  ): Promise<ToggleRealtimeResponse> {
    const response = await apiClient.put<ToggleRealtimeResponse>(
      `/conversations/rooms/${roomId}/toggle-realtime`,
      { live }
    );
    return response.data;
  },

  /**
   * Send assistant/owner message directly to the customer in the room.
   */
  async sendMessage(
    roomId: string,
    message: string
  ): Promise<ChatMessageItem> {
    const response = await apiClient.post<ChatMessageItem>(
      `/conversations/rooms/${roomId}/messages`,
      { message }
    );
    return response.data;
  },
};

export default conversationService;
