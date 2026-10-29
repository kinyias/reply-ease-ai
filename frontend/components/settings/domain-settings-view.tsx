"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BotIcon,
  Code2Icon,
  Globe,
  GraduationCapIcon,
  Loader2,
  PackageIcon,
  Settings2Icon,
} from "lucide-react";

import domainService from "@/services/domain-service";
import { DomainGeneralSettings } from "@/components/settings/domain-general-settings";
import { ChatbotCustomizer } from "@/components/settings/chatbot-customizer";
import { BotTraining } from "@/components/settings/bot-training";
import { ProductCatalog } from "@/components/settings/product-catalog";
import { CodeSnippet } from "@/components/settings/code-snippet";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/i18n-context";

interface DomainSettingsViewProps {
  domainIdentifier: string;
}

type SettingsTab = "general" | "customizer" | "training" | "products" | "embed";

export function DomainSettingsView({
  domainIdentifier,
}: DomainSettingsViewProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>("customizer");

  // Fetch domains list to find matching domain by ID or Name
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
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {t("settings.loading", "Loading domain & chatbot configuration...")}
        </p>
      </div>
    );
  }

  // Fallback to first domain or identifier if not loaded yet
  const domain = currentDomain || domains?.[0];
  const targetId = domain?.id || domainIdentifier;
  const targetName = domain?.name || domainIdentifier;

  const TABS = [
    {
      id: "customizer" as const,
      label: t("settings.tabs.customizer", "Chatbot Appearance"),
      icon: BotIcon,
      description: t("settings.tabs.customizerDesc", "Welcome message, avatar, colors"),
    },
    {
      id: "training" as const,
      label: t("settings.tabs.training", "AI Knowledge Training"),
      icon: GraduationCapIcon,
      description: t("settings.tabs.trainingDesc", "HelpDesk FAQ & Lead qualification questions"),
    },
    {
      id: "products" as const,
      label: t("settings.tabs.products", "Products & Services"),
      icon: PackageIcon,
      description: t("settings.tabs.productsDesc", "Inventory, pricing & VietQR checkout"),
    },
    {
      id: "embed" as const,
      label: t("settings.tabs.embed", "Widget Embed Code"),
      icon: Code2Icon,
      description: t("settings.tabs.embedDesc", "Iframe & JavaScript website snippet"),
    },
    {
      id: "general" as const,
      label: t("settings.tabs.general", "General Settings"),
      icon: Settings2Icon,
      description: t("settings.tabs.generalDesc", "Rename domain & Delete domain"),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation breadcrumb & domain status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-3.5" />
              <span>Dashboard</span>
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2 text-xs">
            <Globe className="size-3.5 text-primary" />
            <span className="font-semibold text-foreground text-sm">{targetName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("embed")}
            className="text-xs gap-1.5 h-8 font-medium border-border"
          >
            <Code2Icon className="size-3.5 text-primary" />
            <span>{t("settingsEmbed.copyCode", "Get Embed Code")}</span>
          </Button>
        </div>
      </div>

      {/* Tabs navigation pill bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 bg-muted/50 rounded-xl border border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive
                  ? "bg-card text-foreground shadow-xs border border-border font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <div
                className={`p-1.5 rounded-md shrink-0 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="size-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate">{tab.label}</span>
                <span className="text-[10px] text-muted-foreground hidden xl:inline-block truncate">
                  {tab.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "customizer" && (
          <ChatbotCustomizer
            domainId={targetId}
            domainName={targetName}
            initialData={domain?.chat_bot}
          />
        )}

        {activeTab === "training" && (
          <BotTraining domainId={targetId} />
        )}

        {activeTab === "products" && (
          <ProductCatalog domainId={targetId} />
        )}

        {activeTab === "embed" && (
          <CodeSnippet domainId={targetId} domainName={targetName} />
        )}

        {activeTab === "general" && domain && (
          <DomainGeneralSettings domain={domain} />
        )}
      </div>
    </div>
  );
}

export default DomainSettingsView;
