import { Metadata } from "next";
import { BillingView } from "@/components/billing/billing-view";

export const metadata: Metadata = {
  title: "Plans and Billing | ReplyEase AI",
  description:
    "Manage subscription plans, top-up AI credits, and reconcile automated SePay VietQR payments.",
};

export default function BillingPage() {
  return <BillingView />;
}
