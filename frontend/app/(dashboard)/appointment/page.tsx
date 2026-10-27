"use client";

import React, { useMemo } from "react";
import { CalendarIcon, RefreshCwIcon } from "lucide-react";
import { useAppointments } from "@/hooks/dashboard/use-dashboard";
import { Button } from "@/components/ui/button";
import { AppointmentList } from "@/components/appointment/appointment-list";
import { TodayBookingsCard } from "@/components/appointment/today-bookings-card";

export default function AppointmentPage() {
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useAppointments();

  const appointments = data?.appointments ?? [];

  // Filter appointments scheduled for today
  const todayBookings = useMemo(() => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    return appointments.filter((b) => {
      try {
        const d = new Date(b.date);
        return (
          d.getFullYear() === todayYear &&
          d.getMonth() === todayMonth &&
          d.getDate() === todayDay
        );
      } catch {
        return false;
      }
    });
  }, [appointments]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <CalendarIcon className="size-6 text-primary" />
              <span>Quản lý Lịch hẹn & Cuộc gọi Tư vấn</span>
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="size-8 text-muted-foreground hover:text-foreground"
              title="Làm mới lịch hẹn"
            >
              <RefreshCwIcon
                className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Theo dõi danh sách các cuộc hẹn được khách hàng đặt trước thông qua trợ lý ảo AI và Customer Portal.
          </p>
        </div>
      </div>

      {/* 2-column layout: Main Table (2/3) + Today's Bookings Box (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <AppointmentList
            appointments={appointments}
            isLoading={isLoading}
          />
        </div>

        {/* Sidebar Column (1/3): Bookings For Today */}
        <div className="space-y-6">
          <TodayBookingsCard
            todayBookings={todayBookings}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
