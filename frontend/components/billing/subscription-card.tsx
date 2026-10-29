"use client";

import React from "react";
import { CheckIcon, SparklesIcon, ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentPlan } from "@/types/payment";
import { useI18n } from "@/context/i18n-context";

interface PlanTier {
  id: PaymentPlan;
  name: string;
  tagline: string;
  price: string;
  period: string;
  badge?: string;
  isPopular?: boolean;
  domains: number;
  credits: number;
  features: string[];
}

const getPlans = (t: (key: string, paramsOrFallback?: any, fallback?: string) => string): PlanTier[] => [
  {
    id: "STANDARD",
    name: "Standard",
    tagline: t("billing.plans.standard.tagline", "For individuals testing autonomous AI chatbots."),
    price: "0",
    period: t("billing.plans.standard.period", "Free forever"),
    domains: 1,
    credits: 100,
    features: [
      t("billing.plans.standard.f1", "1 Connected Website / Domain"),
      t("billing.plans.standard.f2", "100 Initial AI Chat Credits"),
      t("billing.plans.standard.f3", "Automated AI Bot responses"),
      t("billing.plans.standard.f4", "Capture lead emails"),
      t("billing.plans.standard.f5", "Simple iframe widget embed"),
      t("billing.plans.standard.f6", "Automated order VietQR creation"),
      t("billing.plans.standard.f7", "Manual payment reconciliation"),
      t("billing.plans.standard.f8", "Community support"),
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    tagline: t("billing.plans.pro.tagline", "Best choice for small & medium businesses automating sales."),
    price: "350,000",
    period: t("billing.plans.pro.period", "VND / month"),
    badge: t("billing.plans.pro.badge", "Most Popular"),
    isPopular: true,
    domains: 5,
    credits: 500,
    features: [
      t("billing.plans.pro.f1", "5 Connected Websites / Domains"),
      t("billing.plans.pro.f2", "500 AI Chat Credits monthly"),
      t("billing.plans.pro.f3", "AI Sales Bot + Pinecone Vector RAG"),
      t("billing.plans.pro.f4", "Advanced HelpDesk FAQ training"),
      t("billing.plans.pro.f5", "Instant Live Messenger & Human Takeover"),
      t("billing.plans.pro.f6", "Automated SePay VietQR payment gateway"),
      t("billing.plans.pro.f7", "Order Management & Appointment Booking"),
      t("billing.plans.pro.f8", "Priority technical support via email"),
    ],
  },
  {
    id: "ULTIMATE",
    name: "Ultimate",
    tagline: t("billing.plans.ultimate.tagline", "For high-volume retail stores and e-commerce enterprises."),
    price: "850,000",
    period: t("billing.plans.ultimate.period", "VND / month"),
    badge: t("billing.plans.ultimate.badge", "Enterprise Tier"),
    domains: 10,
    credits: 5000,
    features: [
      t("billing.plans.ultimate.f1", "10 Connected Websites / Domains"),
      t("billing.plans.ultimate.f2", "5,000 AI Chat Credits monthly"),
      t("billing.plans.ultimate.f3", "Pinecone RAG Hybrid Search with maximum accuracy"),
      t("billing.plans.ultimate.f4", "Unlimited FAQ & Lead qualifier questions"),
      t("billing.plans.ultimate.f5", "Multi-agent real-time human chat queue"),
      t("billing.plans.ultimate.f6", "Dedicated SePay Gateway with high-speed Webhook"),
      t("billing.plans.ultimate.f7", "Real-time revenue analytics & CSV export"),
      t("billing.plans.ultimate.f8", "24/7 dedicated support via hotline & Telegram"),
    ],
  },
];

interface SubscriptionCardProps {
  currentPlan: PaymentPlan;
  onUpgrade: (plan: PaymentPlan) => void;
  isLoading?: boolean;
}

export function SubscriptionCard({
  currentPlan = "STANDARD",
  onUpgrade,
  isLoading = false,
}: SubscriptionCardProps) {
  const { t, locale } = useI18n();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {getPlans(t).map((plan) => {
        const isCurrent = currentPlan === plan.id;
        const isUpgradeAvailable =
          (currentPlan === "STANDARD" && (plan.id === "PRO" || plan.id === "ULTIMATE")) ||
          (currentPlan === "PRO" && plan.id === "ULTIMATE");

        return (
          <div
            key={plan.id}
            className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-card p-6 ${
              plan.isPopular
                ? "border-primary"
                : "border-border/70 hover:border-border"
            }`}
          >
            {/* Header Badge */}
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#c2410c] hover:bg-[#9a3412] text-white font-semibold px-3 py-0.5 text-xs flex items-center gap-1">
                  <SparklesIcon className="size-3" />
                  <span>{plan.badge}</span>
                </Badge>
              </div>
            )}

            <div>
              {/* Plan Title & Tagline */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {plan.name}
                </h3>
                {isCurrent && (
                  <Badge variant="outline" className="text-xs border-primary/50 text-primary bg-primary/5">
                    {t("billing.plans.currentBadge", "Current Plan")}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground min-h-[36px]">
                {plan.tagline}
              </p>

              {/* Price */}
              <div className="mt-5 mb-6 pb-6 border-b border-border/60">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {plan.period}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3">
                  <span>{t("common.limit", "Limit")}: <strong className="text-foreground">{plan.domains} Websites</strong></span>
                  <span>•</span>
                  <span>Credits: <strong className="text-foreground">{plan.credits}</strong></span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-semibold text-foreground">
                  {t("billing.plans.featuresIncluded", "Features included:")}
                </p>
                <ul className="space-y-2.5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <CheckIcon className="size-4 text-primary shrink-0 mt-0.5" />
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="pt-4 border-t border-border/40">
              {isCurrent ? (
                <Button
                  disabled
                  variant="outline"
                  className="w-full text-xs font-medium cursor-not-allowed bg-muted/40"
                >
                  {t("billing.plans.currentBadge", "Current Plan")}
                </Button>
              ) : isUpgradeAvailable ? (
                <Button
                  onClick={() => onUpgrade(plan.id)}
                  disabled={isLoading}
                  className={`w-full text-xs font-semibold gap-1.5 ${
                    plan.isPopular
                      ? "bg-[#c2410c] hover:bg-[#9a3412] text-white"
                      : "bg-foreground hover:bg-foreground/90 text-background"
                  }`}
                >
                  <ZapIcon className="size-3.5 fill-current" />
                  <span>{t("billing.plans.upgradeBtn", { plan: plan.name })}</span>
                </Button>
              ) : (
                <Button
                  onClick={() => onUpgrade(plan.id)}
                  variant="outline"
                  disabled={isLoading}
                  className="w-full text-xs font-medium"
                >
                  {t("billing.plans.downgradeBtn", { plan: plan.name })}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
