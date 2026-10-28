import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function BillingSkeleton() {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in-50 duration-300">
      {/* Page Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-64 sm:w-72" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-80 sm:w-96 max-w-full" />
        </div>

        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg hidden sm:block" />
        </div>
      </div>

      {/* Top Stat Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Gói cước */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="size-4 rounded" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
        </div>

        {/* Card 2: AI Credits */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="size-4 rounded" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="flex justify-between pt-0.5">
              <Skeleton className="h-2.5 w-32" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          </div>
        </div>

        {/* Card 3: Domains */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="size-4 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="flex justify-between pt-0.5">
              <Skeleton className="h-2.5 w-32" />
              <Skeleton className="h-2.5 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Top-up Section Skeleton */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-3.5 w-80 max-w-full" />
          </div>

          {/* Tab Navigation Skeleton */}
          <div className="flex items-center gap-2 p-1 bg-muted/80 rounded-xl border border-border/60">
            <Skeleton className="h-8 w-36 rounded-lg" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
        </div>

        {/* Subscription Plan Cards Skeleton (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border bg-card space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-28" />
                  {i === 2 && <Skeleton className="h-4 w-20 rounded" />}
                </div>
                <Skeleton className="h-3.5 w-full" />
                <div className="pt-2">
                  <Skeleton className="h-8 w-36 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="space-y-2.5 pt-4 border-t border-border/50">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-5/6" />
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-xl mt-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History Section Skeleton */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="space-y-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3.5 w-72" />
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-4 gap-4 pb-3 border-b border-border/60">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-24 ml-auto" />
          </div>
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="grid grid-cols-4 gap-4 py-2.5 items-center">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-18 rounded-full" />
              <Skeleton className="h-3.5 w-24 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
