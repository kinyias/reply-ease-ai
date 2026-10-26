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
  SparklesIcon,
  ZapIcon,
} from "lucide-react";

import domainService from "@/services/domain-service";
import { useCurrentUser } from "@/hooks/auth/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddDomainModal } from "@/components/sidebar/add-domain-modal";

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: domains = [], isLoading: isLoadingDomains } = useQuery({
    queryKey: ["domains"],
    queryFn: () => domainService.getDomains(),
  });

  const { data: quota, isLoading: isLoadingQuota } = useQuery({
    queryKey: ["domains", "quota"],
    queryFn: () => domainService.getQuota(),
  });

  const isLoading = isLoadingDomains || isLoadingQuota;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Xin chào, {user?.fullname || "Chủ doanh nghiệp"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Trung tâm quản lý trợ lý ảo bán hàng AI, cấu hình domain và cơ sở tri thức cho website.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-[#9a3412] text-primary-foreground text-xs font-semibold h-9 px-4 gap-1.5 shrink-0"
        >
          <PlusIcon className="size-4" />
          <span>Thêm Domain mới</span>
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Domain Quota Card */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Hạn mức Domain</span>
              <GlobeIcon className="size-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {domains.length}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                / {quota?.max_domains || 1} domains
              </span>
            </div>

            {quota && (
              <div className="space-y-1 pt-1">
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${Math.min(
                        (domains.length / Math.max(quota.max_domains, 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Gói {quota.plan}</span>
                  <Link href="/billing" className="text-primary hover:underline font-medium">
                    Nâng cấp
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Credits Card */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Credits Email & AI</span>
              <SparklesIcon className="size-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {quota?.credits ?? 0}
              </span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-2">
              Sử dụng cho chiến dịch Email Marketing và phản hồi AI tự động.
            </p>
          </CardContent>
        </Card>

        {/* System Status Card */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>RAG Engine Status</span>
              <ZapIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold text-foreground">
                Gemini + Pinecone Online
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-3">
              Chỉ mục vector hóa tự động đồng bộ khi cập nhật câu hỏi FAQ và sản phẩm.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Domain List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Danh sách Website & ChatBot AI
            </h2>
            <p className="text-xs text-muted-foreground">
              Chọn domain để cấu hình câu chào, huấn luyện tri thức hoặc lấy mã nhúng widget.
            </p>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin text-primary" />
            <span className="text-xs">Đang tải danh sách domains...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && domains.length === 0 && (
          <Card className="border border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="size-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
                <GlobeIcon className="size-7 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Chưa có website nào được kết nối
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1.5 mb-6">
                Thêm domain đầu tiên để bắt đầu tạo Trợ lý bán hàng tự động và tùy biến giao diện widget nhúng.
              </p>
              <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 text-xs font-medium bg-primary hover:bg-[#9a3412] text-primary-foreground">
                <PlusIcon className="size-4" />
                <span>Thêm Domain đầu tiên</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Domain Cards Grid */}
        {!isLoading && domains.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {domains.map((dom) => (
              <Card
                key={dom.id}
                className="overflow-hidden border border-border bg-card hover:border-primary/50 transition-colors flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative size-11 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
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
                            <GlobeIcon className="size-5" />
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
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-muted/40 border border-border/60 text-center text-xs">
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
                <div className="px-5 py-3 bg-muted/20 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BotIcon className="size-3.5 text-primary" />
                    <span>Chatbot sẵn sàng</span>
                  </div>

                  <Link href={`/settings/${dom.name}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1 text-primary hover:text-[#9a3412] hover:bg-primary/10">
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
