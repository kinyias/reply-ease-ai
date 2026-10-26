import apiClient from "@/lib/api-client";
import {
  CreateFilterQuestionInput,
  CreateHelpDeskInput,
  FilterQuestionItem,
  HelpDeskItem,
  UpdateFilterQuestionInput,
  UpdateHelpDeskInput,
} from "@/types/training";

export const trainingService = {
  // ==========================================
  // HelpDesk FAQ API Calls
  // ==========================================

  async getHelpDesk(domainId: string): Promise<HelpDeskItem[]> {
    const response = await apiClient.get<HelpDeskItem[]>(
      `/domains/${domainId}/helpdesk`
    );
    return response.data;
  },

  async createHelpDesk(
    domainId: string,
    payload: CreateHelpDeskInput
  ): Promise<HelpDeskItem> {
    const response = await apiClient.post<HelpDeskItem>(
      `/domains/${domainId}/helpdesk`,
      payload
    );
    return response.data;
  },

  async updateHelpDesk(
    domainId: string,
    faqId: string,
    payload: UpdateHelpDeskInput
  ): Promise<HelpDeskItem> {
    const response = await apiClient.put<HelpDeskItem>(
      `/domains/${domainId}/helpdesk/${faqId}`,
      payload
    );
    return response.data;
  },

  async deleteHelpDesk(
    domainId: string,
    faqId: string
  ): Promise<{ message: string; faq_id: string }> {
    const response = await apiClient.delete<{
      message: string;
      faq_id: string;
    }>(`/domains/${domainId}/helpdesk/${faqId}`);
    return response.data;
  },

  // ==========================================
  // Filter Questions API Calls
  // ==========================================

  async getFilterQuestions(domainId: string): Promise<FilterQuestionItem[]> {
    const response = await apiClient.get<FilterQuestionItem[]>(
      `/domains/${domainId}/filter-questions`
    );
    return response.data;
  },

  async createFilterQuestion(
    domainId: string,
    payload: CreateFilterQuestionInput
  ): Promise<FilterQuestionItem> {
    const response = await apiClient.post<FilterQuestionItem>(
      `/domains/${domainId}/filter-questions`,
      payload
    );
    return response.data;
  },

  async updateFilterQuestion(
    domainId: string,
    questionId: string,
    payload: UpdateFilterQuestionInput
  ): Promise<FilterQuestionItem> {
    const response = await apiClient.put<FilterQuestionItem>(
      `/domains/${domainId}/filter-questions/${questionId}`,
      payload
    );
    return response.data;
  },

  async deleteFilterQuestion(
    domainId: string,
    questionId: string
  ): Promise<{ message: string; question_id: string }> {
    const response = await apiClient.delete<{
      message: string;
      question_id: string;
    }>(`/domains/${domainId}/filter-questions/${questionId}`);
    return response.data;
  },
};

export default trainingService;
