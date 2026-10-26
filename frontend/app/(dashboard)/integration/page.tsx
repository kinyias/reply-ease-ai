import React from "react";
import type { Metadata } from "next";
import { SepayIntegrationView } from "@/components/integrations/sepay-integration-view";

export const metadata: Metadata = {
  title: "Tích hợp SePay Connect | ReplyEase AI",
  description:
    "Cấu hình tài khoản SePay Merchant của riêng bạn để nhận tiền bán sản phẩm và thanh toán đơn hàng qua VietQR trực tiếp về ngân hàng.",
};

export default function IntegrationPage() {
  return <SepayIntegrationView />;
}
