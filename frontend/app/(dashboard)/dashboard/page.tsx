"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  BotIcon,
  GlobeIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";

import domainService from "@/services/domain-service";
import { useCurrentUser } from "@/hooks/auth/use-user";
import {
  useDashboardMetrics,
  useDashboardTransactions,
  usePlanUsage,
} from "@/hooks/dashboard/use-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddDomainModal } from "@/components/sidebar/add-domain-modal";
import { DashboardMetricsCards } from "@/components/dashboard/dashboard-metrics-cards";
import { PlanUsageCard } from "@/components/dashboard/plan-usage-card";
import { RecentTransactionsTable } from "@/components/dashboard/recent-transactions-table";

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Queries for Dashboard data
  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = useDashboardMetrics();

  const {
    data: planUsage,
    isLoading: isLoadingPlanUsage,
    refetch: refetchPlanUsage,
  } = usePlanUsage();

  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
  } = useDashboardTransactions(10);

  // Domains list query
  const {
    data: domains = [],
    isLoading: isLoadingDomains,
    refetch: refetchDomains,
  } = useQuery({
    queryKey: ["domains"],
    queryFn: () => domainService.getDomains(),
  });

  const handleRefreshAll = () => {
    refetchMetrics();
    refetchPlanUsage();
    refetchTransactions();
    refetchDomains();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header / Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Tổng quan Dashboard
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshAll}
              className="size-8 text-muted-foreground hover:text-foreground"
              title="Làm mới toàn bộ chỉ số"
            >
              <RefreshCwIcon className="size-3.5" />
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Xin chào {user?.fullname || "Chủ doanh nghiệp"} — Giám sát hiệu quả bán hàng AI, chỉ số tăng trưởng và giao dịch SePay.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary hover:bg-[#9a3412] text-primary-foreground text-xs font-semibold h-9 px-4 gap-1.5 shrink-0"
          >
            <PlusIcon className="size-4" />
            <span>Thêm Domain mới</span>
          </Button>
        </div>
      </div>

      {/* 2. Step 9.2: 4 Core KPI Metrics Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Chỉ số hiệu quả kinh doanh
          </h2>
        </div>
        <DashboardMetricsCards
          metrics={metrics}
          isLoading={isLoadingMetrics}
        />
      </div>

      {/* 3. Step 9.2: Plan Usage Progress & Resource Quota */}
      <PlanUsageCard
        planUsage={planUsage}
        isLoading={isLoadingPlanUsage}
      />

      {/* 4. Step 9.2: Recent Transactions Table from SePay */}
      <RecentTransactionsTable
        transactions={transactionsData?.transactions}
        isLoading={isLoadingTransactions}
        onRefresh={() => refetchTransactions()}
      />

      {/* 5. Domain List & Status Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Danh sách Website & ChatBot AI ({domains.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Quản lý cài đặt giao diện, đào tạo tri thức RAG và lấy mã nhúng script cho từng trang web.
            </p>
          </div>

          {domains.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs h-8 gap-1.5 hidden sm:flex"
            >
              <PlusIcon className="size-3.5" />
              <span>Thêm domain</span>
            </Button>
          )}
        </div>

        {/* Loading state */}
        {isLoadingDomains && (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin text-primary" />
            <span className="text-xs">Đang tải danh sách domains...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoadingDomains && domains.length === 0 && (
          <Card className="border border-dashed border-border/80 bg-card shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center px-4">
              <div className="size-12 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                <GlobeIcon className="size-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Chưa có website nào được kết nối
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
                Thêm domain đầu tiên để bắt đầu tạo Trợ lý bán hàng tự động và tùy biến giao diện widget nhúng.
              </p>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="gap-1.5 text-xs font-semibold bg-primary hover:bg-[#9a3412] text-primary-foreground h-9"
              >
                <PlusIcon className="size-4" />
                <span>Thêm Domain đầu tiên</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Domain Cards Grid */}
        {!isLoadingDomains && domains.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((dom) => (
              <Card
                key={dom.id}
                className="overflow-hidden border border-border/80 bg-card shadow-none hover:border-primary/50 transition-colors flex flex-col justify-between"
              >
                <div className="p-4 space-y-3.5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative size-10 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                        {dom.icon ? (
                          <Image
                            src={dom.icon}
                            alt={dom.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <GlobeIcon className="size-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {dom.name}
                        </h3>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          Tạo ngày {new Date(dom.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Active
                    </span>
                  </div>

                  {/* Micro stats */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded bg-muted/30 border border-border/50 text-center text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Sản phẩm</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {dom.products?.length ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">FAQ</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {dom.helpdesk?.length ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Câu lọc</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {dom.filter_questions?.length ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-4 py-2.5 bg-muted/20 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BotIcon className="size-3.5 text-primary" />
                    <span>Chatbot sẵn sàng</span>
                  </div>

                  <Link href={`/settings/${dom.name}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs font-semibold gap-1 text-primary hover:text-[#9a3412] hover:bg-primary/10"
                    >
                      <span>Cài đặt</span>
                      <ArrowRightIcon className="size-3" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddDomainModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}
