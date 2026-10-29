"use client";

import React, { useState } from "react";
import {
  CoinsIcon,
  FlameIcon,
  GiftIcon,
  HelpCircleIcon,
  Loader2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditPackageItem } from "@/types/payment";
import { useI18n } from "@/context/i18n-context";

interface CreditPackagesCardProps {
  packages: CreditPackageItem[];
  onSelectPackage: (packageId: string) => void;
  isLoading?: boolean;
}

export function CreditPackagesCard({
  packages,
  onSelectPackage,
  isLoading = false,
}: CreditPackagesCardProps) {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "STARTER" | "BUSINESS">("ALL");
  const [loadingPkgId, setLoadingPkgId] = useState<string | null>(null);

  const handleSelect = (pkgId: string) => {
    setLoadingPkgId(pkgId);
    onSelectPackage(pkgId);
  };

  const filteredPackages = packages.filter((pkg) => {
    if (selectedCategory === "STARTER") {
      return pkg.credits <= 1000;
    }
    if (selectedCategory === "BUSINESS") {
      return pkg.credits >= 2000;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Category Filter Pills & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-foreground">
              {t("billing.creditPackages.title", "Prepaid Credits")}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("billing.creditPackages.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/40 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedCategory === "ALL"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("billing.creditPackages.filterAll", "All Packages")} ({packages.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("STARTER")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedCategory === "STARTER"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("billing.creditPackages.filterStarter", "Starter (< 1k)")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("BUSINESS")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedCategory === "BUSINESS"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("billing.creditPackages.filterBusiness", "Business (> 2k)")}
          </button>
        </div>
      </div>

      {/* Grid of Credit Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {filteredPackages.map((pkg) => {
          const isItemLoading = isLoading && loadingPkgId === pkg.id;
          const priceFormatted = `${pkg.price.toLocaleString("vi-VN")} ${t("billing.creditPackages.priceUnit", "VND")}`;
          const unitPrice = Math.round(pkg.price / pkg.total_credits);

          return (
            <div
              key={pkg.id}
              className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 bg-card hover:shadow-md ${
                pkg.popular
                  ? "border-primary/80 ring-1 ring-primary/40 shadow-xs"
                  : pkg.best_value
                  ? "border-amber-500/80 ring-1 ring-amber-500/30"
                  : "border-border hover:border-border/80"
              }`}
            >
              {/* Badges on Top */}
              <div className="flex items-center justify-between mb-3 min-h-[22px]">
                {pkg.popular ? (
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold gap-1 px-2 py-0.5 shadow-2xs">
                    <FlameIcon className="size-3" />
                    {t("billing.creditPackages.popular", "Popular")}
                  </Badge>
                ) : pkg.best_value ? (
                  <Badge className="bg-amber-600 text-white text-[10px] font-semibold gap-1 px-2 py-0.5 shadow-2xs">
                    <SparklesIcon className="size-3" />
                    {t("billing.creditPackages.bestValue", "Best Value")}
                  </Badge>
                ) : (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {t("billing.creditPackages.popular", "Popular")}
                  </span>
                )}

                {pkg.bonus_credits > 0 ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                  >
                    +{pkg.bonus_percentage}% Bonus
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground">{t("billing.creditPackages.filterStarter", "Starter")}</span>
                )}
              </div>

              {/* Credits Numbers */}
              <div className="space-y-1 mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-foreground tracking-tight">
                    {pkg.total_credits.toLocaleString("vi-VN")}
                  </span>
                  <span className="text-xs font-semibold text-primary">Credits</span>
                </div>

                {pkg.bonus_credits > 0 ? (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <GiftIcon className="size-3 shrink-0" />
                    <span>
                      {pkg.credits.toLocaleString("vi-VN")} +{" "}
                      <strong>{pkg.bonus_credits.toLocaleString("vi-VN")} bonus</strong>
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground">
                    {t("billing.creditPackages.filterStarter", "Starter")}
                  </div>
                )}
              </div>

              {/* Price & Unit Price */}
              <div className="pt-3 border-t border-border/60 mb-4 space-y-0.5">
                <div className="text-lg font-bold text-foreground">
                  {priceFormatted}
                </div>
                <div className="text-[10px] text-muted-foreground flex justify-between">
                  <span>{t("billing.creditPackages.costPerCredit", { cost: unitPrice }, `~${unitPrice} VND / credit`)}</span>
                  
                </div>
              </div>

              {/* Action Button */}
              <Button
                type="button"
                onClick={() => handleSelect(pkg.id)}
                disabled={isLoading}
                className={`w-full text-xs font-semibold h-9 rounded-xl transition-all ${
                  pkg.popular
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                    : pkg.best_value
                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40"
                }`}
              >
                {isItemLoading ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                    <span>{t("billing.creditPackages.processing", "Initiating payment...")}</span>
                  </>
                ) : (
                  <>
                    <CoinsIcon className="size-3.5 mr-1.5" />
                    <span>{t("billing.creditPackages.buyBtn", "Top-up Now")}</span>
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Value Proposition Note */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground">
          <ZapIcon className="size-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground block mb-0.5">{t("billing.creditPackages.f1Title", "Instant Activation")}</strong>
            {t("billing.creditPackages.f1Desc", "SePay VietQR automatically verifies and credits your account in 3-5 seconds.")}
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground">
          <CoinsIcon className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground block mb-0.5">{t("billing.creditPackages.f2Title", "Never Expires")}</strong>
            {t("billing.creditPackages.f2Desc", "Credits never expire and roll over permanently in your account.")}
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground">
          <ShieldCheckIcon className="size-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground block mb-0.5">{t("billing.creditPackages.f3Title", "Multi-purpose Use")}</strong>
            {t("billing.creditPackages.f3Desc", "1 credit = 1 intelligent AI Chat message or 1 Marketing campaign email sent.")}
          </div>
        </div>
      </div>
    </div>
  );
}
