export type PlanType = "STANDARD" | "PRO" | "ULTIMATE";

export interface ChatBot {
  id: string;
  welcome_message: string | null;
  icon: string | null;
  background: string | null;
  text_color: string | null;
  helpdesk: boolean;
  domain_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProductBrief {
  id: string;
  name: string;
  price: number;
  image: string;
  created_at?: string;
}

export interface HelpDeskBrief {
  id: string;
  question: string;
  answer: string;
  created_at?: string;
}

export interface FilterQuestionBrief {
  id: string;
  question: string;
  answered?: string | null;
  created_at?: string;
}

export interface Domain {
  id: string;
  name: string;
  icon: string;
  user_id?: string | null;
  campaign_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  chat_bot?: ChatBot | null;
  products?: ProductBrief[];
  helpdesk?: HelpDeskBrief[];
  filter_questions?: FilterQuestionBrief[];
  customer_count?: number;
}

export interface DomainQuota {
  plan: PlanType;
  max_domains: number;
  used_domains: number;
  remaining_domains: number;
  can_create_domain: boolean;
  credits: number;
}

export interface CreateDomainInput {
  name: string;
  icon: string;
}

export interface UpdateDomainInput {
  name?: string;
  icon?: string;
}

export interface UpdateChatBotInput {
  welcome_message?: string;
  icon?: string;
  background?: string;
  text_color?: string;
  helpdesk?: boolean;
}
