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
  title: "Instant Product Checkout | ReplyEase AI Portal",
  description: "Online product checkout supporting instant VietQR SePay and Stripe Elements cards.",
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
