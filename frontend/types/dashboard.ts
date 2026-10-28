export interface DashboardMetrics {
  potential_clients: number;
  pipeline_value: number;
  appointments: number;
  total_sales: number;
}

export interface PlanUsage {
  plan: "STANDARD" | "PRO" | "ULTIMATE" | string;
  credits: number;
  domains_used: number;
  max_domains: number;
  clients_count: number;
}

export interface DashboardTransaction {
  id: string;
  order_code: string;
  amount: number;
  payment_type: "SUBSCRIPTION" | "PRODUCT_CHECKOUT" | string;
  status: "PENDING" | "SUCCESS" | "FAILED" | string;
  content: string;
  sepay_transaction_id?: string | null;
  created_at: string;
  domain_name?: string | null;
  customer_email?: string | null;
}

export interface DashboardTransactionsResponse {
  transactions: DashboardTransaction[];
  total: number;
}

export interface Appointment {
  id: string;
  date: string;
  slot: string;
  email: string;
  domain_id?: string | null;
  domain_name?: string | null;
  customer_id?: string | null;
  created_at: string;
}

export interface AppointmentsResponse {
  appointments: Appointment[];
  total: number;
  today_count: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
}

export interface GetAppointmentsParams {
  search?: string;
  domain_id?: string;
  page?: number;
  page_size?: number;
}

