export interface ChatbotFAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ChatbotProductItem {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface ChatbotConfig {
  domain_id: string;
  domain_name: string;
  welcome_message: string;
  icon?: string | null;
  background?: string | null;
  text_color?: string | null;
  helpdesk_enabled: boolean;
  faqs: ChatbotFAQItem[];
  products: ChatbotProductItem[];
}

export interface MessageItem {
  id: string;
  role: "user" | "assistant" | "system";
  message: string;
  raw_message?: string;
  created_at?: string;
  link?: string | null;
  isLivePrompt?: boolean;
}

export interface ChatbotMessageResponse {
  role: "assistant";
  message: string;
  raw_message?: string;
  live: boolean;
  customer_id?: string | null;
  chatroom_id?: string | null;
  link?: string | null;
  has_complete: boolean;
  has_realtime: boolean;
  created_at: string;
}

export interface ChatSessionHistoryResponse {
  chatroom_id: string;
  live: boolean;
  messages: {
    id: string;
    role: string;
    message: string;
    seen: boolean;
    created_at: string;
  }[];
}
