export interface HelpDeskItem {
  id: string;
  question: string;
  answer: string;
  domain_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateHelpDeskInput {
  question: string;
  answer: string;
}

export interface UpdateHelpDeskInput {
  question?: string;
  answer?: string;
}

export interface FilterQuestionItem {
  id: string;
  question: string;
  answered?: string | null;
  domain_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFilterQuestionInput {
  question: string;
}

export interface UpdateFilterQuestionInput {
  question?: string;
  answered?: string | null;
}
