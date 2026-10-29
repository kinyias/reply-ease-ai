import { Metadata } from "next";
import { SepayIntegrationView } from "@/components/integrations/sepay-integration-view";

export const metadata: Metadata = {
  title: "SePay Connect Integration | ReplyEase AI",
  description:
    "Configure your personal SePay Merchant account to receive customer product checkout payments directly into your bank account.",
};

export default function IntegrationPage() {
  return <SepayIntegrationView />;
}
