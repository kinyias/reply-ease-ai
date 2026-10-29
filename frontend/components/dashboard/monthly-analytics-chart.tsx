"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CalendarIcon, TrendingUpIcon, UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatVND } from "@/lib/utils";
import { useI18n } from "@/context/i18n-context";
import { useMonthlyAnalytics } from "@/hooks/dashboard/use-dashboard";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
  }>;
  label?: number;
  year: number;
}

function formatVNDCompact(amount: number): string {
  if (amount === 0) return "0 ₫";
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} tỷ ₫`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")} tr ₫`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k ₫`;
  }
  return `${amount} ₫`;
}

export function MonthlyAnalyticsChart() {
  const { t, locale } = useI18n();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showClients, setShowClients] = useState(true);
  const [showSales, setShowSales] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: analytics, isLoading } = useMonthlyAnalytics(selectedYear);

  // Available years from server or fallback to current year
  const availableYears = useMemo(() => {
    if (analytics?.available_years && analytics.available_years.length > 0) {
      return analytics.available_years;
    }
    return [currentYear, currentYear - 1];
  }, [analytics, currentYear]);

  // Format month name based on locale
  const chartData = useMemo(() => {
    const rawMonths = analytics?.months || [];
    return rawMonths.map((item) => {
      const monthKey = String(item.month);
      const translatedMonth = t(`dashboard.monthlyAnalytics.months.${monthKey}`, item.month_name);
      return {
        ...item,
        displayMonth: translatedMonth,
      };
    });
  }, [analytics, t]);

  // Year aggregates
  const yearTotals = useMemo(() => {
    if (!analytics?.months) return { clients: 0, sales: 0 };
    return analytics.months.reduce(
      (acc, item) => ({
        clients: acc.clients + item.potential_clients,
        sales: acc.sales + item.total_sales,
      }),
      { clients: 0, sales: 0 }
    );
  }, [analytics]);

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    const monthKey = String(label);
    const monthName = t(`dashboard.monthlyAnalytics.months.${monthKey}`, `Tháng ${label}`);

    return (
      <div className="rounded-xl border border-border/80 bg-background/95 backdrop-blur-md p-3.5 shadow-xl text-xs space-y-2 min-w-[210px]">
        <div className="font-semibold text-foreground border-b border-border/60 pb-1.5 flex items-center justify-between">
          <span>{monthName} {selectedYear}</span>
          <span className="text-[10px] text-muted-foreground font-normal">
            {locale === "vi" ? "Chi tiết tháng" : "Monthly Breakdown"}
          </span>
        </div>
        <div className="space-y-1.5 pt-0.5">
          {payload.map((entry) => {
            const isClients = entry.dataKey === "potential_clients";
            return (
              <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}:</span>
                </div>
                <span className="font-semibold text-foreground">
                  {isClients
                    ? `${entry.value.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} ${t("dashboard.monthlyAnalytics.clientsUnit", "leads")}`
                    : formatVND(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUpIcon className="size-4" />
            </div>
            <CardTitle className="text-base font-semibold text-foreground">
              {t("dashboard.monthlyAnalytics.title", "Monthly Performance Trends")}
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {t(
              "dashboard.monthlyAnalytics.subtitle",
              "Track monthly Potential Clients (Leads) and Total Sales revenue on the same timeline"
            )}
          </CardDescription>
        </div>

        {/* Year Selector & Summary Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year selector */}
          <div className="flex items-center gap-1.5 bg-muted/60 border border-border/80 rounded-lg px-2.5 py-1 text-xs text-foreground">
            <CalendarIcon className="size-3.5 text-muted-foreground" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label={t("dashboard.monthlyAnalytics.yearLabel", "Year:")}
              className="bg-transparent border-none text-xs font-medium focus:outline-none cursor-pointer text-foreground"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-card text-foreground">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Aggregates Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg px-2.5 py-1 text-xs">
              <UsersIcon className="size-3 shrink-0" />
              <span className="font-semibold">
                {yearTotals.clients.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
              </span>
              <span className="text-[10px] opacity-80">
                {t("dashboard.monthlyAnalytics.clientsUnit", "leads")}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg px-2.5 py-1 text-xs">
              <span className="font-semibold">
                {formatVNDCompact(yearTotals.sales)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Toggle filters */}
        <div className="flex items-center justify-end gap-3 pb-3 text-xs">
          <button
            type="button"
            onClick={() => setShowClients(!showClients)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              showClients
                ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                : "bg-muted/40 border-border/60 text-muted-foreground line-through opacity-60"
            }`}
          >
            <span className="size-2 rounded-full bg-blue-500" />
            <span>{t("dashboard.monthlyAnalytics.clientsLegend", "Potential Clients")}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSales(!showSales)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              showSales
                ? "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400"
                : "bg-muted/40 border-border/60 text-muted-foreground line-through opacity-60"
            }`}
          >
            <span className="size-2 rounded-full bg-orange-500" />
            <span>{t("dashboard.monthlyAnalytics.salesLegend", "Total Sales")}</span>
          </button>
        </div>

        {/* Chart View */}
        {isLoading || !isMounted ? (
          <div className="h-[340px] w-full flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        ) : (
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/50"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayMonth"
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)", strokeWidth: 1 }}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  dy={6}
                />

                {/* Left Y-axis: Potential Clients */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)", strokeWidth: 1 }}
                  tick={{ fontSize: 11, fill: "#3b82f6" }}
                  dx={-4}
                />

                {/* Right Y-axis: Total Sales */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)", strokeWidth: 1 }}
                  tick={{ fontSize: 11, fill: "#ea580c" }}
                  tickFormatter={formatVNDCompact}
                  dx={4}
                />

                <Tooltip content={<CustomTooltip year={selectedYear} />} />

                {/* Potential Clients Line */}
                {showClients && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="potential_clients"
                    name={t("dashboard.monthlyAnalytics.clientsLegend", "Potential Clients")}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#3b82f6", strokeWidth: 1.5, stroke: "#ffffff" }}
                    activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#ffffff" }}
                  />
                )}

                {/* Total Sales Line */}
                {showSales && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="total_sales"
                    name={t("dashboard.monthlyAnalytics.salesLegend", "Total Sales")}
                    stroke="#ea580c"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#ea580c", strokeWidth: 1.5, stroke: "#ffffff" }}
                    activeDot={{ r: 6, fill: "#ea580c", strokeWidth: 2, stroke: "#ffffff" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

