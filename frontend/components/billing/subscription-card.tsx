"use client";

import React from "react";
import { CheckIcon, SparklesIcon, ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentPlan } from "@/types/payment";

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

const PLANS: PlanTier[] = [
  {
    id: "STANDARD",
    name: "Standard",
    tagline: "Dành cho cá nhân trải nghiệm và thử nghiệm AI Chatbot.",
    price: "0",
    period: "Miễn phí trọn đời",
    domains: 1,
    credits: 10,
    features: [
      "1 Website / Domain kết nối",
      "10 AI Chat Credits khởi đầu",
      "Chatbot AI trả lời tự động",
      "Thu thập email khách hàng tiềm năng",
      "Mã nhúng iframe widget đơn giản",
      "Hỗ trợ qua cộng đồng",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    tagline: "Lựa chọn tốt nhất cho doanh nghiệp vừa và nhỏ bán hàng tự động.",
    price: "350.000",
    period: "VNĐ / tháng",
    badge: "Phổ biến nhất",
    isPopular: true,
    domains: 5,
    credits: 50,
    features: [
      "5 Websites / Domains kết nối",
      "50 AI Chat Credits hàng tháng",
      "AI Sales Bot + Pinecone Vector RAG",
      "Huấn luyện FAQ HelpDesk chuyên sâu",
      "Live Messenger & Human takeover tức thì",
      "Cổng thanh toán SePay VietQR tự động",
      "Quản lý đơn hàng & Đặt lịch hẹn",
      "Hỗ trợ kỹ thuật ưu tiên qua email",
    ],
  },
  {
    id: "ULTIMATE",
    name: "Ultimate",
    tagline: "Dành cho các doanh nghiệp lớn cần tự động hoá tối đa quy mô.",
    price: "850.000",
    period: "VNĐ / tháng",
    badge: "Tối ưu nhất",
    domains: 10,
    credits: 500,
    features: [
      "10 Websites / Domains kết nối",
      "500 AI Chat Credits dung lượng lớn",
      "Pinecone Vector RAG không giới hạn tài liệu",
      "Tích hợp SePay Connect tài khoản riêng của Shop",
      "Nhận tiền bán hàng trực tiếp về tài khoản ngân hàng",
      "Email Marketing hàng loạt tới Lead",
      "Báo cáo thống kê tài chính và Pipeline",
      "Hỗ trợ 24/7 & Hỗ trợ kỹ thuật trực tiếp",
    ],
  },
];

interface SubscriptionCardProps {
  currentPlan: PaymentPlan;
  onUpgrade: (plan: PaymentPlan) => void;
  isLoading?: boolean;
}

export function SubscriptionCard({
  currentPlan,
  onUpgrade,
  isLoading = false,
}: SubscriptionCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.id;
        const isUpgradeAvailable =
          (currentPlan === "STANDARD" && (plan.id === "PRO" || plan.id === "ULTIMATE")) ||
          (currentPlan === "PRO" && plan.id === "ULTIMATE");

        return (
          <div
            key={plan.id}
            className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-card p-6 ${
              plan.isPopular
                ? "border-primary/80 shadow-md ring-1 ring-primary/30"
                : "border-border/70 hover:border-border"
            }`}
          >
            {/* Header Badge */}
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary hover:bg-primary text-primary-foreground font-medium px-3 py-0.5 text-xs shadow-sm flex items-center gap-1">
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
                    Gói hiện tại
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
                  <span>Hạn mức: <strong className="text-foreground">{plan.domains} Website</strong></span>
                  <span>•</span>
                  <span>Credits: <strong className="text-foreground">{plan.credits} lượt</strong></span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-semibold text-foreground tracking-wide uppercase">
                  Tính năng bao gồm:
                </p>
                <ul className="space-y-2.5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <div className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <CheckIcon className="size-2.5 stroke-[3]" />
                      </div>
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
                  Đang sử dụng gói này
                </Button>
              ) : isUpgradeAvailable ? (
                <Button
                  onClick={() => onUpgrade(plan.id)}
                  disabled={isLoading}
                  className={`w-full text-xs font-semibold gap-1.5 ${
                    plan.isPopular
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                      : "bg-foreground hover:bg-foreground/90 text-background"
                  }`}
                >
                  <ZapIcon className="size-3.5 fill-current" />
                  <span>Nâng cấp lên {plan.name}</span>
                </Button>
              ) : (
                <Button
                  onClick={() => onUpgrade(plan.id)}
                  variant="outline"
                  disabled={isLoading}
                  className="w-full text-xs font-medium"
                >
                  Đổi sang {plan.name}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
