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

export interface KnowledgeDocumentItem {
  id: string;
  domain_id: string;
  file_name: string;
  file_type: "pdf" | "excel" | "txt";
  file_size: number;
  status: "completed" | "processing" | "failed";
  num_chunks: number;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeChunkItem {
  id: string;
  document_id: string;
  domain_id: string;
  chunk_index: number;
  title?: string | null;
  content: string;
  created_at?: string;
}
