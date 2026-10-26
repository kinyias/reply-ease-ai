import apiClient from "@/lib/api-client";
import {
  ChatSessionHistoryResponse,
  ChatbotConfig,
  ChatbotMessageResponse,
} from "@/types/chatbot";

export const chatbotService = {
  /**
   * Retrieve public chatbot configuration and branding for a domain.
   */
  async getConfig(domainId: string): Promise<ChatbotConfig> {
    const response = await apiClient.get<ChatbotConfig>(
      `/chatbot/${domainId}/config`
    );
    return response.data;
  },

  /**
   * Send a chat message to the AI Sales Bot.
   */
  async sendMessage(
    domainId: string,
    payload: {
      message: string;
      chat_history?: { role: string; content?: string; message?: string }[];
      customer_email?: string | null;
      chatroom_id?: string | null;
    }
  ): Promise<ChatbotMessageResponse> {
    const response = await apiClient.post<ChatbotMessageResponse>(
      `/chatbot/${domainId}/message`,
      payload
    );
    return response.data;
  },

  /**
   * Retrieve historical messages for a chat session.
   */
  async getSessionHistory(
    domainId: string,
    chatroomId: string
  ): Promise<ChatSessionHistoryResponse> {
    const response = await apiClient.get<ChatSessionHistoryResponse>(
      `/chatbot/${domainId}/history/${chatroomId}`
    );
    return response.data;
  },
};

export default chatbotService;
