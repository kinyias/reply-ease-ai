import { Metadata } from "next";
import { DomainSettingsView } from "@/components/settings/domain-settings-view";

export const metadata: Metadata = {
  title: "Chatbot and Domain Settings | ReplyEase AI",
  description:
    "Customize welcome messages, bot avatar, theme colors, and FAQ HelpDesk knowledge for your AI Chatbot.",
};

interface DomainSettingsPageProps {
  params: Promise<{
    domain: string;
  }>;
}

export default async function DomainSettingsPage({
  params,
}: DomainSettingsPageProps) {
  const { domain } = await params;
  return <DomainSettingsView domainIdentifier={domain} />;
}
