"use client"

import * as React from "react"
import { QueryProvider } from "./query-provider"
import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryProvider>
  )
}
