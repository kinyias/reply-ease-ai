import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function MarketingSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in-50 duration-300">
      {/* Page Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-64 sm:w-80" />
            <Skeleton className="h-5 w-18 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-80 sm:w-96 max-w-full" />
        </div>

        {/* Credits Card Skeleton */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 shadow-2xs self-start md:self-auto w-56">
          <Skeleton className="size-10 rounded-lg shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg shrink-0" />
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Campaign List & Template Editor (5/12 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Campaign List Card Skeleton */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4.5 rounded" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>

            {/* Campaign items */}
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Skeleton className="size-8 rounded-lg shrink-0" />
                    <div className="space-y-1.5 min-w-0">
                      <Skeleton className="h-3.5 w-32" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-2.5 w-16" />
                        <Skeleton className="h-2.5 w-12" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="size-7 rounded-md shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Template Editor Card Skeleton */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4.5 rounded" />
                <Skeleton className="h-5 w-40" />
              </div>
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>

            {/* Presets Pills */}
            <div className="flex gap-2 overflow-hidden">
              <Skeleton className="h-6 w-28 rounded-md shrink-0" />
              <Skeleton className="h-6 w-32 rounded-md shrink-0" />
              <Skeleton className="h-6 w-24 rounded-md shrink-0" />
            </div>

            {/* Editor Body */}
            <Skeleton className="h-44 w-full rounded-xl" />

            {/* Save Buttons */}
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Right Column: Customer Leads Filtering Table (7/12 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
            {/* Table Header */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4.5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>

              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Skeleton className="h-8.5 w-full sm:w-44 rounded-lg shrink-0" />
                <Skeleton className="h-8.5 flex-1 rounded-lg" />
                <Skeleton className="h-8.5 w-24 rounded-lg shrink-0 hidden sm:block" />
              </div>
            </div>

            {/* Table Body Rows */}
            <div className="divide-y divide-border/60">
              {/* Column labels */}
              <div className="grid grid-cols-12 gap-3 p-3 bg-muted/40 items-center">
                <div className="col-span-1 flex justify-center">
                  <Skeleton className="size-3.5 rounded" />
                </div>
                <div className="col-span-4">
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="col-span-3">
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>

              {/* Data row skeletons */}
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <div key={row} className="grid grid-cols-12 gap-3 p-3 items-center">
                  <div className="col-span-1 flex justify-center">
                    <Skeleton className="size-3.5 rounded" />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                  <div className="col-span-3">
                    <Skeleton className="h-4.5 w-20 rounded-full" />
                  </div>
                  <div className="col-span-2">
                    <Skeleton className="h-3.5 w-12" />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Skeleton className="h-6 w-14 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar Skeleton */}
      <div className="rounded-xl border border-border/80 bg-background/95 backdrop-blur-md p-4 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
    </div>
  );
}
