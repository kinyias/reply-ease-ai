export interface CustomerQuestionAnswerBrief {
  id: string;
  question: string;
  answered: string | null;
}

export interface CustomerLead {
  id: string;
  email: string | null;
  domain_id: string | null;
  domain_name: string | null;
  created_at: string;
  responses: CustomerQuestionAnswerBrief[];
  answered_count: number;
  total_questions: number;
}

export interface CustomerLeadListResponse {
  customers: CustomerLead[];
  total: number;
}

export interface Campaign {
  id: string;
  name: string;
  customers: string[];
  template: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string | null;
  recipients_count: number;
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  total: number;
}

export interface CreateCampaignPayload {
  name: string;
  template?: string;
  customers?: string[];
}

export interface UpdateCampaignPayload {
  name?: string;
  template?: string;
  customers?: string[];
}

export interface CampaignSendResponse {
  message: string;
  campaign_id: string;
  total_recipients: number;
  credits_deducted: number;
  remaining_credits: number;
}
