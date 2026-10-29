import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    redirect("/auth/sign-in");
  }

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
