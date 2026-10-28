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

interface DashboardMetricsCardsProps {
  metrics?: DashboardMetrics;
  isLoading?: boolean;
}

export function DashboardMetricsCards({
  metrics,
  isLoading,
}: DashboardMetricsCardsProps) {
  const cards = [
    {
      id: "potential_clients",
      label: "Potential Clients",
      subLabel: "Khách hàng tiềm năng",
      value: metrics ? metrics.potential_clients.toLocaleString("vi-VN") : "0",
      description: "Leads thu thập từ Chatbot & Widget",
      icon: UsersIcon,
      unit: "khách hàng",
    },
    {
      id: "pipeline_value",
      label: "Pipeline Value",
      subLabel: "Giá trị cơ hội",
      value: metrics ? formatVND(metrics.pipeline_value) : "0 ₫",
      description: "Tổng giá trị sản phẩm x số lead",
      icon: TrendingUpIcon,
      unit: "VND",
    },
    {
      id: "appointments",
      label: "Appointments",
      subLabel: "Lịch hẹn tư vấn",
      value: metrics ? metrics.appointments.toLocaleString("vi-VN") : "0",
      description: "Cuộc hẹn đã được khách xác nhận",
      icon: CalendarIcon,
      unit: "cuộc hẹn",
    },
    {
      id: "total_sales",
      label: "Total Sales",
      subLabel: "Doanh thu thực tế",
      value: metrics ? formatVND(metrics.total_sales) : "0 ₫",
      description: "Doanh thu từ đơn hàng qua SePay",
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
