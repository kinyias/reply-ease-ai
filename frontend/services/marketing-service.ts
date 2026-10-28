import apiClient from "@/lib/api-client";
import {
  Campaign,
  CampaignListResponse,
  CampaignSendResponse,
  CreateCampaignPayload,
  CustomerLeadListResponse,
  UpdateCampaignPayload,
} from "@/types/marketing";

export const marketingService = {
  /**
   * Lấy danh sách chiến dịch marketing của user kèm tìm kiếm và phân trang
   */
  async getCampaigns(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<CampaignListResponse> {
    const query: Record<string, string | number> = {};
    if (params?.search && params.search.trim()) {
      query.search = params.search.trim();
    }
    if (params?.page !== undefined) query.page = params.page;
    if (params?.page_size !== undefined) query.page_size = params.page_size;

    const response = await apiClient.get<CampaignListResponse>("/marketing/campaigns", {
      params: Object.keys(query).length > 0 ? query : undefined,
    });
    return response.data;
  },

  /**
   * Tạo một chiến dịch email marketing mới
   */
  async createCampaign(payload: CreateCampaignPayload): Promise<Campaign> {
    const response = await apiClient.post<Campaign>("/marketing/campaigns", payload);
    return response.data;
  },

  /**
   * Lấy chi tiết chiến dịch
   */
  async getCampaign(campaignId: string): Promise<Campaign> {
    const response = await apiClient.get<Campaign>(`/marketing/campaigns/${campaignId}`);
    return response.data;
  },

  /**
   * Cập nhật thông tin chiến dịch
   */
  async updateCampaign(campaignId: string, payload: UpdateCampaignPayload): Promise<Campaign> {
    const response = await apiClient.put<Campaign>(`/marketing/campaigns/${campaignId}`, payload);
    return response.data;
  },

  /**
   * Xóa chiến dịch
   */
  async deleteCampaign(campaignId: string): Promise<{ message: string; id: string }> {
    const response = await apiClient.delete<{ message: string; id: string }>(
      `/marketing/campaigns/${campaignId}`
    );
    return response.data;
  },

  /**
   * Cập nhật mẫu email template cho chiến dịch
   */
  async updateTemplate(campaignId: string, template: string): Promise<Campaign> {
    const response = await apiClient.put<Campaign>(
      `/marketing/campaigns/${campaignId}/template`,
      { template }
    );
    return response.data;
  },

  /**
   * Gán danh sách email khách hàng vào chiến dịch
   */
  async assignCustomers(campaignId: string, customers: string[]): Promise<Campaign> {
    const response = await apiClient.put<Campaign>(
      `/marketing/campaigns/${campaignId}/customers`,
      { customers }
    );
    return response.data;
  },

  /**
   * Lấy danh sách khách hàng tiềm năng kèm câu trả lời câu hỏi lọc (Lead qualification)
   */
  async getCustomerLeads(params?: {
    domain_id?: string;
    search?: string;
    only_with_email?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<CustomerLeadListResponse> {
    const query: Record<string, string | number | boolean> = {
      only_with_email: params?.only_with_email ?? true,
    };
    if (params?.domain_id && params.domain_id !== "all") {
      query.domain_id = params.domain_id;
    }
    if (params?.search && params.search.trim()) {
      query.search = params.search.trim();
    }
    if (params?.page !== undefined) query.page = params.page;
    if (params?.page_size !== undefined) query.page_size = params.page_size;

    const response = await apiClient.get<CustomerLeadListResponse>("/marketing/customers", {
      params: query,
    });
    return response.data;
  },


  /**
   * Gửi chiến dịch hàng loạt qua background tasks & trừ credits
   */
  async sendCampaign(campaignId: string, emails?: string[]): Promise<CampaignSendResponse> {
    const response = await apiClient.post<CampaignSendResponse>(
      `/marketing/campaigns/${campaignId}/send`,
      emails ? { emails } : {}
    );
    return response.data;
  },
};
