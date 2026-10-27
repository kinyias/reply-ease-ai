import React from "react";
import type { Metadata } from "next";
import { MarketingView } from "@/components/marketing/marketing-view";

export const metadata: Metadata = {
  title: "Email Marketing & Quản lý Leads | ReplyEase AI",
  description:
    "Quản lý chiến dịch email marketing, sàng lọc câu trả lời của leads tiềm năng và gửi email hàng loạt.",
};

export default function EmailMarketingPage() {
  return <MarketingView />;
}
