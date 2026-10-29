"use client";

import * as React from "react";
import { MessageSquareIcon, RadioIcon, SparklesIcon } from "lucide-react";
import { useI18n } from "@/context/i18n-context";

export function EmptyConversationState() {
  const { t } = useI18n();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center bg-background">
      <div className="max-w-md w-full space-y-4">
        <div className="flex items-center justify-center mx-auto text-muted-foreground/60 mb-2">
          <MessageSquareIcon className="size-10 stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            {t("conversations.emptyState.selectConversation", "Select a conversation to start")}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("conversations.emptyState.description")}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-4 text-left w-full">
          <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <RadioIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t("conversations.emptyState.liveModeTitle", "Live Mode Control")}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("conversations.emptyState.liveModeDesc")}
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <SparklesIcon className="size-3.5 text-primary shrink-0" />
              <span>{t("conversations.emptyState.syncTitle", "2-Way WebSocket Sync")}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("conversations.emptyState.syncDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
