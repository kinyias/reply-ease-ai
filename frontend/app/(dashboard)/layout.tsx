import React, { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background animate-pulse" />
      }
    >
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
