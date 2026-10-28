"use client";

import React from "react";
import Link from "next/link";
import {
  CoinsIcon,
  CreditCardIcon,
  GlobeIcon,
  HelpCircleIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionCard } from "@/components/billing/subscription-card";
import { SepayQrModal } from "@/components/billing/sepay-qr-modal";
import { TransactionHistoryTable } from "@/components/billing/transaction-history-table";
import { useBilling } from "@/hooks/billing/use-billing";
import { useDomainManagement } from "@/hooks/sidebar/use-domain-management";

export function BillingView() {
  const {
    user,
    isUserLoading,
    currentPlan,
    currentCredits,
    transactions,
    isTransactionsLoading,
    refetchTransactions,
    isModalOpen,
    activePayment,
    paymentStatus,
    isCreatingPayment,
    isSimulatingPayment,
    isCancellingPayment,
    upgradeToPlan,
    simulatePayment,
    cancelPayment,
    closeModal,
  } = useBilling();

  const { domains } = useDomainManagement();

  // Calculate plan quotas
  const maxDomains =
    currentPlan === "ULTIMATE" ? 10 : currentPlan === "PRO" ? 5 : 1;
  const maxCredits =
    currentPlan === "ULTIMATE" ? 5000 : currentPlan === "PRO" ? 500 : 100;
  const domainUsagePercent = Math.min(100, Math.round((domains.length / maxDomains) * 100));
  const creditUsagePercent = Math.min(100, Math.round((currentCredits / maxCredits) * 100));

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Gói cước & Thanh toán SePay
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              VietQR Gateway
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Quản lý gói tài khoản, nâng cấp dung lượng AI Chat credits và theo dõi lịch sử thanh toán qua SePay VietQR.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/integration">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-border">
              <ShieldCheckIcon className="size-3.5 text-primary" />
              <span>Tích hợp SePay Shop</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchTransactions()}
            className="text-xs gap-1.5 border-border"
            title="Làm mới dữ liệu"
          >
            <RotateCcwIcon className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Current Plan */}
        <div className="rounded-2xl border border-border bg-card p-5  flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Gói tài khoản hiện tại</span>
            <ZapIcon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {currentPlan}
              </h3>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Đang kích hoạt
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {currentPlan === "STANDARD"
                ? "Gói miễn phí cơ bản với 1 website."
                : currentPlan === "PRO"
                ? "Gói Pro chuyên nghiệp với 5 website & Pinecone RAG."
                : "Gói Ultimate cao cấp với 10 website & SePay Connect."}
            </p>
          </div>
        </div>

        {/* Card 2: AI Credits */}
        <div className="rounded-2xl border border-border bg-card p-5  flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">AI Chat Credits khả dụng</span>
            <CoinsIcon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {currentCredits}
              </h3>
              <span className="text-xs text-muted-foreground">/ {maxCredits} credits</span>
            </div>
            <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${creditUsagePercent}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 flex justify-between">
              <span>Được làm mới khi nâng cấp gói</span>
              <span>{creditUsagePercent}%</span>
            </p>
          </div>
        </div>

        {/* Card 3: Domain Quota */}
        <div className="rounded-2xl border border-border bg-card p-5  flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Hạn mức Websites kết nối</span>
            <GlobeIcon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {domains.length}
              </h3>
              <span className="text-xs text-muted-foreground">/ {maxDomains} domain tối đa</span>
            </div>
            <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${domainUsagePercent}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 flex justify-between">
              <span>{maxDomains - domains.length} slot khả dụng còn lại</span>
              <span>{domainUsagePercent}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Pricing Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Bảng giá & Nâng cấp gói cước
            </h2>
            <p className="text-xs text-muted-foreground">
              Thanh toán tức thời qua mã VietQR SePay, hệ thống tự động đối soát và kích hoạt trong vài giây.
            </p>
          </div>
        </div>

        <SubscriptionCard
          currentPlan={currentPlan}
          onUpgrade={upgradeToPlan}
          isLoading={isCreatingPayment}
        />
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Lịch sử giao dịch & Hóa đơn
            </h2>
            <p className="text-xs text-muted-foreground">
              Xem lại toàn bộ các thanh toán chuyển khoản SePay VietQR đã thực hiện.
            </p>
          </div>
        </div>

        <TransactionHistoryTable
          transactions={transactions}
          isLoading={isTransactionsLoading}
        />
      </div>

      {/* Sepay VietQR & Gateway Modal */}
      <SepayQrModal
        isOpen={isModalOpen}
        onClose={closeModal}
        payment={activePayment}
        status={paymentStatus}
        onSimulateSuccess={simulatePayment}
        isSimulating={isSimulatingPayment}
        onCancelOrder={cancelPayment}
        isCancelling={isCancellingPayment}
      />
    </div>
  );
}
