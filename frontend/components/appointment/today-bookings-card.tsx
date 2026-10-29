"use client";

import React from "react";
import { CalendarIcon, ClockIcon, GlobeIcon, MailIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Appointment } from "@/types/dashboard";
import { formatDateOnly } from "@/lib/utils";
import { useI18n } from "@/context/i18n-context";

interface TodayBookingsCardProps {
  todayBookings: Appointment[];
  isLoading?: boolean;
}

export function TodayBookingsCard({
  todayBookings = [],
  isLoading,
}: TodayBookingsCardProps) {
  const { t, locale } = useI18n();

  const todayFormatted = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <Card className="border border-border/80 bg-card shadow-none">
      <CardHeader className="pb-3 border-b border-border/60 bg-amber-500/5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500" />
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                {t("appointment.todayTitle", "Bookings For Today")}
              </CardTitle>
            </div>
            <p className="text-[11px] text-muted-foreground capitalize">
              {todayFormatted}
            </p>
          </div>

          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-xs tabular-nums"
          >
            {t("appointment.todayBadge", { count: todayBookings.length })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-2 py-4">
            <div className="h-16 rounded-lg bg-muted/60" />
            <div className="h-16 rounded-lg bg-muted/60" />
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-2">
            <div className="size-9 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-1">
              <CalendarIcon className="size-4" />
            </div>
            <p className="text-xs font-medium text-foreground">
              {t("appointment.noToday", "No appointments scheduled for today")}
            </p>
            <p className="text-[11px] text-muted-foreground max-w-[220px] mx-auto">
              {t("appointment.noTodayDesc")}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayBookings.map((b) => {
              const initial = b.email ? b.email[0].toUpperCase() : "U";
              return (
                <div
                  key={b.id}
                  className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Time slot with peach / amber tag */}
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-200">
                      <ClockIcon className="size-3" />
                      <span className="tabular-nums">{b.slot}</span>
                    </div>

                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {formatDateOnly(b.date)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-foreground block truncate">
                          {b.email}
                        </span>
                        {b.domain_name && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                            <GlobeIcon className="size-2.5" />
                            <span>{b.domain_name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <a href={`mailto:${b.email}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground shrink-0"
                        title={t("appointment.sendEmail", { email: b.email })}
                      >
                        <MailIcon className="size-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TodayBookingsCard;
