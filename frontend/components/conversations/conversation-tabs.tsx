"use client";

import * as React from "react";
import { ConversationTab } from "@/types/conversation";
import { useI18n } from "@/context/i18n-context";

interface ConversationTabsProps {
  activeTab: ConversationTab;
  onTabChange: (tab: ConversationTab) => void;
  counts: {
    total: number;
    unread: number;
    live: number;
    urgent: number;
  };
}

export function ConversationTabs({
  activeTab,
  onTabChange,
  counts,
}: ConversationTabsProps) {
  const { t } = useI18n();

  const tabs: { key: ConversationTab; label: string; count?: number }[] = [
    { key: "all", label: t("conversations.tabs.all", "All"), count: counts.total },
    { key: "unread", label: t("conversations.tabs.unread", "Unread"), count: counts.unread },
    { key: "urgent", label: t("conversations.tabs.urgent", "Urgent"), count: counts.urgent },
    { key: "live", label: t("conversations.tabs.live", "Live Mode"), count: counts.live },
    { key: "expired", label: t("conversations.tabs.expired", "Expired") },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg border border-border/50 text-xs overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors shrink-0 ${
              isActive
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && tab.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-semibold ${
                  isActive
                    ? tab.key === "unread" || tab.key === "urgent"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
