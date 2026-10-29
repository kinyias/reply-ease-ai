"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRightIcon, GlobeIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanUsage } from "@/types/dashboard";
import { useI18n } from "@/context/i18n-context";

interface PlanUsageCardProps {
  planUsage?: PlanUsage;
  isLoading?: boolean;
}

export function PlanUsageCard({ planUsage, isLoading }: PlanUsageCardProps) {
  const { t } = useI18n();
  if (isLoading) {
    return (
      <Card className="border border-border/80 bg-card shadow-none">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const domainsUsed = planUsage?.domains_used ?? 0;
  const maxDomains = Math.max(planUsage?.max_domains ?? 1, 1);
  const percentage = Math.min(Math.round((domainsUsed / maxDomains) * 100), 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = domainsUsed >= maxDomains;

  const planName = planUsage?.plan || "STANDARD";
  const credits = planUsage?.credits ?? 0;
  const clientsCount = planUsage?.clients_count ?? 0;

  return (
    <Card className="border border-border/80 bg-card shadow-none">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              {t("dashboard.planUsage.title", "Plan Quota & Resources")}
            </CardTitle>
            <Badge
              variant="outline"
              className="text-[11px] font-medium border-border/80 uppercase px-2 py-0.5"
            >
              {t("dashboard.planUsage.planBadge", { plan: planName })}
            </Badge>
          </div>

          <Link href="/billing">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-primary hover:text-primary/90 font-medium hover:bg-primary/5 gap-1 self-start sm:self-auto"
            >
              <span>{t("dashboard.planUsage.manageUpgrade", "Manage Plan & Upgrade")}</span>
              <ArrowUpRightIcon className="size-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Domain Quota Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <GlobeIcon className="size-3.5 text-muted-foreground" />
              <span>{t("dashboard.planUsage.connectedDomains", "Connected Domains")}</span>
            </span>
            <span className="tabular-nums text-muted-foreground font-medium">
              {t("dashboard.planUsage.quotaCount", { used: domainsUsed, max: maxDomains, percent: percentage })}
            </span>
          </div>

          {/* Clean Segmented/Solid Track */}
          <div className="w-full bg-muted/80 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                isAtLimit
                  ? "bg-amber-600 dark:bg-amber-500"
                  : "bg-primary"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {isAtLimit && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              {t("dashboard.planUsage.limitReached", { plan: planName })}
            </p>
          )}
        </div>

        {/* Resources Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/50">
          <div className="flex items-center justify-between p-3 rounded border border-border/60 bg-muted/20">
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <SparklesIcon className="size-3.5 text-muted-foreground" />
                <span>{t("dashboard.planUsage.creditsTitle", "AI & Email Credits")}</span>
              </span>
              <p className="text-[11px] text-muted-foreground">
                {t("dashboard.planUsage.creditsDesc")}
              </p>
            </div>
            <div className="text-xl font-semibold tabular-nums text-foreground">
              {credits}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded border border-border/60 bg-muted/20">
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <UsersIcon className="size-3.5 text-muted-foreground" />
                <span>{t("dashboard.planUsage.leadsTitle", "Accumulated Leads")}</span>
              </span>
              <p className="text-[11px] text-muted-foreground">
                {t("dashboard.planUsage.leadsDesc")}
              </p>
            </div>
            <div className="text-xl font-semibold tabular-nums text-foreground">
              {clientsCount}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PlanUsageCard;
