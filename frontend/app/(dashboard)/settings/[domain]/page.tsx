import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { DomainSettingsView } from "@/components/settings/domain-settings-view";

export const metadata: Metadata = {
  title: "Cấu hình Chatbot & Domain | ReplyEase AI",
  description:
    "Tùy biến lời chào, avatar, màu sắc theme và FAQ HelpDesk cho Chatbot của bạn.",
};

interface PageProps {
  params: Promise<{ domain: string }>;
}

async function SettingsContent({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  return <DomainSettingsView domainIdentifier={domain} />;
}

export default function DomainSettingsPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-brand-accent" />
        </div>
      }
    >
      <SettingsContent params={params} />
    </Suspense>
  );
}
