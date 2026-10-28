"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CoinsIcon,
  CreditCardIcon,
  FlameIcon,
  GlobeIcon,
  HelpCircleIcon,
  PlusIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionCard } from "@/components/billing/subscription-card";
import { BillingSkeleton } from "@/components/billing/billing-skeleton";
import { CreditPackagesCard } from "@/components/billing/credit-packages-card";
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
    creditPackages,
    isCreditPackagesLoading,
    isModalOpen,
    activePayment,
    paymentStatus,
    isCreatingPayment,
    isPurchasingCredits,
    isSimulatingPayment,
    isCancellingPayment,
    upgradeToPlan,
    purchaseCredits,
    simulatePayment,
    cancelPayment,
    closeModal,
  } = useBilling();

  const { domains } = useDomainManagement();

  // Prevent SSR/CSR hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  // Active pricing tab: SUBSCRIPTION (default) or CREDITS
  const [activeTab, setActiveTab] = useState<"CREDITS" | "SUBSCRIPTION">("SUBSCRIPTION");

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "credits") {
        setActiveTab("CREDITS");
      } else if (tabParam === "subscription" || tabParam === "plans") {
        setActiveTab("SUBSCRIPTION");
      }
    }
  }, []);

  const scrollToPricing = (tab: "CREDITS" | "SUBSCRIPTION") => {
    setActiveTab(tab);
    const el = document.getElementById("billing-pricing-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Calculate plan quotas
  const maxDomains =
    currentPlan === "ULTIMATE" ? 10 : currentPlan === "PRO" ? 5 : 1;
  const maxCredits =
    currentPlan === "ULTIMATE" ? 5000 : currentPlan === "PRO" ? 500 : 100;
  const domainUsagePercent = Math.min(100, Math.round((domains.length / maxDomains) * 100));
  const creditUsagePercent = Math.min(100, Math.round((currentCredits / maxCredits) * 100));

  if (!isMounted || isUserLoading) {
    return <BillingSkeleton />;
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Gói cước & Nạp Credits SePay
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              VietQR Gateway
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Quản lý gói tài khoản, nạp thêm AI Chat & Email marketing credits và theo dõi lịch sử thanh toán qua SePay VietQR.
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
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Gói tài khoản hiện tại</span>
            <ZapIcon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  {currentPlan}
                </h3>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Đang kích hoạt
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollToPricing("SUBSCRIPTION")}
                className="text-xs text-primary hover:text-primary/90 h-7 px-2 -mr-2"
              >
                Nâng cấp
              </Button>
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
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">AI Chat & Email Credits</span>
            <CoinsIcon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-1">
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  {currentCredits.toLocaleString("vi-VN")}
                </h3>
                <span className="text-xs text-muted-foreground">credits</span>
              </div>
              <Button
                size="sm"
                onClick={() => scrollToPricing("CREDITS")}
                className="text-xs h-7 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground gap-1 shadow-2xs"
              >
                <PlusIcon className="size-3" />
                <span>Nạp thêm</span>
              </Button>
            </div>
            <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, creditUsagePercent))}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 flex justify-between">
              <span>Hạn mức theo gói: {maxCredits.toLocaleString("vi-VN")}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Vĩnh viễn</span>
            </p>
          </div>
        </div>

        {/* Card 3: Domain Quota */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between">
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

      {/* Pricing & Top-up Section with Tabs */}
      <div id="billing-pricing-section" className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Bảng giá dịch vụ ReplyEase AI
            </h2>
            <p className="text-xs text-muted-foreground">
              Thanh toán tức thời qua mã VietQR SePay, hệ thống tự động đối soát và kích hoạt trong 3 - 5 giây.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="inline-flex items-center p-1 bg-muted/80 rounded-xl border border-border/60 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("SUBSCRIPTION")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "SUBSCRIPTION"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ZapIcon className="size-3.5 text-amber-500" />
              <span>Gói cước tài khoản</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("CREDITS")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "CREDITS"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CoinsIcon className="size-3.5 text-primary" />
              <span>Nạp thêm Credits</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold ml-0.5">
                Bonus tới 50%
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content 1: Subscription Plans (Default) */}
        {activeTab === "SUBSCRIPTION" && (
          <SubscriptionCard
            currentPlan={currentPlan}
            onUpgrade={upgradeToPlan}
            isLoading={isCreatingPayment}
          />
        )}

        {/* Tab Content 2: Credit Packages */}
        {activeTab === "CREDITS" && (
          <CreditPackagesCard
            packages={creditPackages}
            onSelectPackage={purchaseCredits}
            isLoading={isPurchasingCredits}
          />
        )}
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
