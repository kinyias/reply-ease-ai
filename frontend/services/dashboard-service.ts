import apiClient from "@/lib/api-client";
import {
  AppointmentsResponse,
  DashboardMetrics,
  DashboardTransactionsResponse,
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
   * Fetch all scheduled customer appointments
   */
  async getAppointments(): Promise<AppointmentsResponse> {
    const res = await apiClient.get<AppointmentsResponse>("/dashboard/appointments");
    return res.data;
  },
};

export default dashboardService;
