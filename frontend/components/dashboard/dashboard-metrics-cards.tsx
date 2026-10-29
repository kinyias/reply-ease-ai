"use client";

import React from "react";
import {
  CalendarIcon,
  CreditCardIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardMetrics } from "@/types/dashboard";
import { formatVND } from "@/lib/utils";
import { useI18n } from "@/context/i18n-context";

interface DashboardMetricsCardsProps {
  metrics?: DashboardMetrics;
  isLoading?: boolean;
}

export function DashboardMetricsCards({
  metrics,
  isLoading,
}: DashboardMetricsCardsProps) {
  const { t, locale } = useI18n();
  const numLocale = locale === "vi" ? "vi-VN" : "en-US";

  const cards = [
    {
      id: "potential_clients",
      label: t("dashboard.metrics.potentialClients", "Potential Clients"),
      subLabel: t("dashboard.metrics.potentialClientsSub", "Captured Leads"),
      value: metrics ? metrics.potential_clients.toLocaleString(numLocale) : "0",
      description: t("dashboard.metrics.potentialClientsDesc", "Leads collected from Chatbot & Widget"),
      icon: UsersIcon,
      unit: t("dashboard.metrics.clientsUnit", "clients"),
    },
    {
      id: "pipeline_value",
      label: t("dashboard.metrics.pipelineValue", "Pipeline Value"),
      subLabel: t("dashboard.metrics.pipelineValueSub", "Opportunity Value"),
      value: metrics ? formatVND(metrics.pipeline_value) : "0 ₫",
      description: t("dashboard.metrics.pipelineValueDesc", "Total product value x total captured leads"),
      icon: TrendingUpIcon,
      unit: "VND",
    },
    {
      id: "appointments",
      label: t("dashboard.metrics.appointments", "Appointments"),
      subLabel: t("dashboard.metrics.appointmentsSub", "Consultation Bookings"),
      value: metrics ? metrics.appointments.toLocaleString(numLocale) : "0",
      description: t("dashboard.metrics.appointmentsDesc", "Confirmed consultation slots booked by clients"),
      icon: CalendarIcon,
      unit: t("dashboard.metrics.appointmentsUnit", "bookings"),
    },
    {
      id: "total_sales",
      label: t("dashboard.metrics.totalSales", "Total Sales"),
      subLabel: t("dashboard.metrics.totalSalesSub", "Gross Revenue"),
      value: metrics ? formatVND(metrics.total_sales) : "0 ₫",
      description: t("dashboard.metrics.totalSalesDesc", "Revenue received via SePay VietQR payments"),
      icon: CreditCardIcon,
      unit: "VND",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-border/70 bg-card shadow-none">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="size-4 rounded" />
              </div>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.id}
            className="border border-border/80 bg-card shadow-none hover:border-border transition-colors duration-150"
          >
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </span>
                <Icon className="size-4 text-muted-foreground/70" />
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                  {card.value}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default DashboardMetricsCards;
