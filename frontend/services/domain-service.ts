import apiClient from "@/lib/api-client";
import {
  ChatBot,
  CreateDomainInput,
  Domain,
  DomainQuota,
  UpdateChatBotInput,
  UpdateDomainInput,
} from "@/types/domain";

export const domainService = {
  /**
   * Retrieve domain quota and usage for the current user's subscription plan.
   */
  async getQuota(): Promise<DomainQuota> {
    const response = await apiClient.get<DomainQuota>("/domains/quota");
    return response.data;
  },

  /**
   * Retrieve all domains owned by the current user.
   */
  async getDomains(): Promise<Domain[]> {
    const response = await apiClient.get<Domain[]>("/domains");
    return response.data;
  },

  /**
   * Retrieve a single domain by its UUID.
   */
  async getDomain(domainId: string): Promise<Domain> {
    const response = await apiClient.get<Domain>(`/domains/${domainId}`);
    return response.data;
  },

  /**
   * Create a new domain with quota limit enforcement.
   */
  async createDomain(payload: CreateDomainInput): Promise<Domain> {
    const response = await apiClient.post<Domain>("/domains", payload);
    return response.data;
  },

  /**
   * Update an existing domain's name or icon.
   */
  async updateDomain(
    domainId: string,
    payload: UpdateDomainInput
  ): Promise<Domain> {
    const response = await apiClient.put<Domain>(
      `/domains/${domainId}`,
      payload
    );
    return response.data;
  },

  /**
   * Delete a domain and cascade-delete all its child resources.
   */
  async deleteDomain(
    domainId: string
  ): Promise<{ message: string; domain_id: string }> {
    const response = await apiClient.delete<{
      message: string;
      domain_id: string;
    }>(`/domains/${domainId}`);
    return response.data;
  },

  /**
   * Retrieve chatbot customization settings for a domain.
   */
  async getChatBot(domainId: string): Promise<ChatBot> {
    const response = await apiClient.get<ChatBot>(
      `/domains/${domainId}/chatbot`
    );
    return response.data;
  },

  /**
   * Update chatbot customization settings (welcome message, avatar, colors, helpdesk).
   */
  async updateChatBot(
    domainId: string,
    payload: UpdateChatBotInput
  ): Promise<ChatBot> {
    const response = await apiClient.put<ChatBot>(
      `/domains/${domainId}/chatbot`,
      payload
    );
    return response.data;
  },
};

export default domainService;
