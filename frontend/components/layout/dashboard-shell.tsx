"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { MobileHeader } from "@/components/sidebar/mobile-header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground flex-col sm:flex-row">
      {/* Mobile Top Header */}
      <MobileHeader
        isOpen={mobileOpen}
        onToggle={() => setMobileOpen(!mobileOpen)}
      />

      {/* Navigation Sidebar */}
      <AppSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-w-0 bg-background/50">
        {children}
      </main>
    </div>
  );
}
