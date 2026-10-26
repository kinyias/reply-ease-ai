import { Suspense } from "react";
import { Metadata } from "next";
import { Loader2Icon } from "lucide-react";
import PaymentClient from "./payment-client";

interface PaymentPortalPageProps {
  params: Promise<{
    domainid: string;
    customerid: string;
  }>;
}

export const metadata: Metadata = {
  title: "Thanh toán đơn hàng | Reply Ease AI Portal",
  description: "Cổng thanh toán đơn hàng trực tuyến hỗ trợ VietQR SePay và Thẻ quốc tế Stripe Elements.",
};

export default function PaymentPortalPage({
  params,
}: PaymentPortalPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2Icon className="size-8 text-orange-600 animate-spin" />
        </div>
      }
    >
      <PaymentClient params={params} />
    </Suspense>
  );
}
