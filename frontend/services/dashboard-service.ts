import apiClient from "@/lib/api-client";
import {
  AppointmentsResponse,
  DashboardMetrics,
  DashboardTransactionsResponse,
  MonthlyAnalyticsResponse,
  PlanUsage,
} from "@/types/dashboard";

export const dashboardService = {
  /**
   * Fetch aggregate KPI metrics: potential clients, pipeline value, appointments, total sales
   */
  async getMetrics(): Promise<DashboardMetrics> {
    const res = await apiClient.get<DashboardMetrics>("/dashboard/metrics");
    return res.data;
  },

  /**
   * Fetch subscription plan usage and credits
   */
  async getPlanUsage(): Promise<PlanUsage> {
    const res = await apiClient.get<PlanUsage>("/dashboard/plan-usage");
    return res.data;
  },

  /**
   * Fetch recent SePay financial transactions
   */
  async getTransactions(limit = 10): Promise<DashboardTransactionsResponse> {
    const res = await apiClient.get<DashboardTransactionsResponse>(
      "/dashboard/transactions",
      { params: { limit } }
    );
    return res.data;
  },

  /**
   * Fetch scheduled customer appointments with optional search, domain filter, and pagination
   */
  async getAppointments(params?: {
    search?: string;
    domain_id?: string;
    page?: number;
    page_size?: number;
  }): Promise<AppointmentsResponse> {
    const query: Record<string, string | number> = {};
    if (params?.search && params.search.trim()) {
      query.search = params.search.trim();
    }
    if (params?.domain_id && params.domain_id !== "ALL") {
      query.domain_id = params.domain_id;
    }
    if (params?.page !== undefined) {
      query.page = params.page;
    }
    if (params?.page_size !== undefined) {
      query.page_size = params.page_size;
    }

    const res = await apiClient.get<AppointmentsResponse>("/dashboard/appointments", {
      params: Object.keys(query).length > 0 ? query : undefined,
    });
    return res.data;
  },

  /**
   * Fetch monthly analytics for potential clients and total sales
   */
  async getMonthlyAnalytics(year?: number): Promise<MonthlyAnalyticsResponse> {
    const res = await apiClient.get<MonthlyAnalyticsResponse>(
      "/dashboard/monthly-analytics",
      {
        params: year ? { year } : undefined,
      }
    );
    return res.data;
  },
};


export default dashboardService;
