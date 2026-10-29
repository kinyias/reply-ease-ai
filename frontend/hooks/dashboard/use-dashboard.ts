import { useQuery } from "@tanstack/react-query";
import dashboardService from "@/services/dashboard-service";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: () => dashboardService.getMetrics(),
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function usePlanUsage() {
  return useQuery({
    queryKey: ["dashboard", "plan-usage"],
    queryFn: () => dashboardService.getPlanUsage(),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useDashboardTransactions(limit = 10) {
  return useQuery({
    queryKey: ["dashboard", "transactions", limit],
    queryFn: () => dashboardService.getTransactions(limit),
    staleTime: 1000 * 30,
  });
}

import { GetAppointmentsParams } from "@/types/dashboard";

export function useAppointments(params?: GetAppointmentsParams) {
  const queryKey = [
    "dashboard",
    "appointments",
    params?.domain_id || "ALL",
    params?.search?.trim() || "",
    params?.page || 1,
    params?.page_size || 10,
  ];

  return useQuery({
    queryKey,
    queryFn: () => dashboardService.getAppointments(params),
    staleTime: 1000 * 30,
  });
}

export function useMonthlyAnalytics(year?: number) {
  return useQuery({
    queryKey: ["dashboard", "monthly-analytics", year],
    queryFn: () => dashboardService.getMonthlyAnalytics(year),
    staleTime: 1000 * 60, // 1 minute
  });
}


