"use client"

import { useQuery } from "@tanstack/react-query"
import { authService } from "@/services/auth-service"
import { COOKIE_KEYS, getCookie } from "@/lib/cookies"
import { authKeys } from "./query-keys"

export function useCurrentUser() {
  const hasToken =
    typeof window !== "undefined"
      ? Boolean(getCookie(COOKIE_KEYS.ACCESS_TOKEN))
      : false

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authService.getMe(),
    enabled: hasToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}
