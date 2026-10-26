"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Globe, Loader2 } from "lucide-react";

import domainService from "@/services/domain-service";
import { ChatbotCustomizer } from "@/components/settings/chatbot-customizer";
import { BotTraining } from "@/components/settings/bot-training";
import { Button } from "@/components/ui/button";

interface DomainSettingsViewProps {
  domainIdentifier: string;
}

export function DomainSettingsView({
  domainIdentifier,
}: DomainSettingsViewProps) {
  // Try fetching domains list to find matching domain by ID or Name
  const {
    data: domains,
    isLoading,
  } = useQuery({
    queryKey: ["domains"],
    queryFn: () => domainService.getDomains(),
  });

  const currentDomain = domains?.find(
    (d) =>
      d.id === domainIdentifier ||
      d.name.toLowerCase() === domainIdentifier.toLowerCase()
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="size-8 animate-spin text-brand-accent" />
        <p className="text-sm text-muted-foreground">
          Đang tải cấu hình domain & chatbot...
        </p>
      </div>
    );
  }

  // If domains exist but specific one not found, fallback to first domain or the identifier
  const domain = currentDomain || domains?.[0];
  const targetId = domain?.id || domainIdentifier;
  const targetName = domain?.name || domainIdentifier;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="size-3.5" />
              <span>Quay lại Dashboard</span>
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="size-3.5" />
            <span className="font-semibold text-foreground">{targetName}</span>
          </div>
        </div>
      </div>

      {/* Chatbot Customizer component */}
      <ChatbotCustomizer
        domainId={targetId}
        domainName={targetName}
        initialData={domain?.chat_bot}
      />

      {/* Bot Training & Knowledge Base (HelpDesk FAQ & Filter Questions) */}
      <div className="pt-6">
        <BotTraining domainId={targetId} />
      </div>
    </div>
  );
}

export default DomainSettingsView;
