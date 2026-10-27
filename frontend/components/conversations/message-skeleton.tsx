import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function MessageSkeleton() {
  return (
    <div className="space-y-6 py-2 px-1 animate-in fade-in-50 duration-300">
      {/* Centered Date Separator Skeleton */}
      <div className="flex items-center justify-center my-2">
        <Skeleton className="h-5 w-24 rounded-full bg-muted/60" />
      </div>

      {/* 1. User Message (Left) */}
      <div className="flex items-start gap-2.5 justify-start">
        <Skeleton className="size-8 rounded-full shrink-0 mt-1" />
        <div className="max-w-[75%] sm:max-w-[65%] space-y-1.5">
          <div className="p-3.5 rounded-2xl rounded-tl-xs bg-muted/70 border border-border/40 space-y-2">
            <Skeleton className="h-3.5 w-44 sm:w-56" />
            <Skeleton className="h-3.5 w-32 sm:w-40" />
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <Skeleton className="h-2.5 w-10" />
          </div>
        </div>
      </div>

      {/* 2. Assistant Message (Right) */}
      <div className="flex items-start gap-2.5 justify-end">
        <div className="max-w-[75%] sm:max-w-[65%] space-y-1.5 flex flex-col items-end">
          <div className="p-3.5 rounded-2xl rounded-tr-xs bg-primary/10 border border-primary/20 space-y-2 text-left w-full sm:w-80">
            <Skeleton className="h-3.5 w-full bg-primary/20" />
            <Skeleton className="h-3.5 w-4/5 bg-primary/20" />
            <Skeleton className="h-3.5 w-3/5 bg-primary/20" />
          </div>
          <div className="flex items-center gap-1.5 pr-1">
            <Skeleton className="h-2.5 w-14" />
          </div>
        </div>
      </div>

      {/* 3. User Message - Short (Left) */}
      <div className="flex items-start gap-2.5 justify-start">
        <Skeleton className="size-8 rounded-full shrink-0 mt-1" />
        <div className="max-w-[75%] sm:max-w-[65%] space-y-1.5">
          <div className="p-3.5 rounded-2xl rounded-tl-xs bg-muted/70 border border-border/40 space-y-2">
            <Skeleton className="h-3.5 w-36 sm:w-48" />
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <Skeleton className="h-2.5 w-10" />
          </div>
        </div>
      </div>

      {/* 4. Assistant Message - With Action Link placeholder (Right) */}
      <div className="flex items-start gap-2.5 justify-end">
        <div className="max-w-[75%] sm:max-w-[65%] space-y-1.5 flex flex-col items-end">
          <div className="p-3.5 rounded-2xl rounded-tr-xs bg-primary/10 border border-primary/20 space-y-2 text-left w-full sm:w-96">
            <Skeleton className="h-3.5 w-full bg-primary/20" />
            <Skeleton className="h-3.5 w-5/6 bg-primary/20" />
            <div className="pt-2 border-t border-primary/15 mt-2">
              <Skeleton className="h-4 w-40 bg-primary/25 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 pr-1">
            <Skeleton className="h-2.5 w-14" />
          </div>
        </div>
      </div>

      {/* 5. User Message (Left) */}
      <div className="flex items-start gap-2.5 justify-start">
        <Skeleton className="size-8 rounded-full shrink-0 mt-1" />
        <div className="max-w-[75%] sm:max-w-[65%] space-y-1.5">
          <div className="p-3.5 rounded-2xl rounded-tl-xs bg-muted/70 border border-border/40 space-y-2">
            <Skeleton className="h-3.5 w-40 sm:w-52" />
            <Skeleton className="h-3.5 w-28 sm:w-36" />
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <Skeleton className="h-2.5 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full Messenger Skeleton containing header, chat area, and input composer.
 * Displayed when the conversations view is loading initial room data.
 */
export function MessengerSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden animate-in fade-in-50 duration-300">
      {/* 1. Header Skeleton */}
      <header className="px-5 py-3.5 border-b border-border/60 bg-card/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="size-10 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-36 sm:w-48" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-28 sm:w-40" />
          </div>
        </div>

        {/* Live mode toggle skeleton */}
        <div className="flex items-center gap-3 bg-background/80 border border-border/70 px-3 py-1.5 rounded-lg">
          <div className="space-y-1 text-right">
            <Skeleton className="h-3 w-20 ml-auto" />
            <Skeleton className="h-2 w-28 ml-auto" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      </header>

      {/* 2. Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <MessageSkeleton />
      </div>

      {/* 3. Composer / Input Area Skeleton */}
      <footer className="p-4 border-t border-border/60 bg-card/30 space-y-3 shrink-0">
        {/* Quick replies skeleton pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Skeleton className="h-6 w-28 rounded-full shrink-0" />
          <Skeleton className="h-6 w-36 rounded-full shrink-0" />
          <Skeleton className="h-6 w-32 rounded-full shrink-0" />
          <Skeleton className="h-6 w-40 rounded-full shrink-0 hidden sm:block" />
        </div>

        {/* Input box skeleton */}
        <div className="relative border border-border/70 rounded-xl p-2 bg-background/70 space-y-2">
          <Skeleton className="h-10 w-full rounded-md bg-muted/40" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
      </footer>
    </div>
  );
}
