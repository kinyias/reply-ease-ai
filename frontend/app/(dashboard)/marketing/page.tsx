import { Metadata } from "next";
import { MarketingView } from "@/components/marketing/marketing-view";

export const metadata: Metadata = {
  title: "Email Marketing and Leads | ReplyEase AI",
  description:
    "Manage email marketing campaigns, filter customer qualification answers, and broadcast personalized emails using AI credits.",
};

export default function MarketingPage() {
  return <MarketingView />;
}
