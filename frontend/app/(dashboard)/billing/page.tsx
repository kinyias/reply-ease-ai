import React from "react";
import type { Metadata } from "next";
import { BillingView } from "@/components/billing/billing-view";

export const metadata: Metadata = {
  title: "Gói cước & Thanh toán SePay | ReplyEase AI",
  description:
    "Nâng cấp gói Pro / Ultimate, nạp thêm AI Credits và đối soát giao dịch tự động qua SePay VietQR.",
};

export default function BillingPage() {
  return <BillingView />;
}
