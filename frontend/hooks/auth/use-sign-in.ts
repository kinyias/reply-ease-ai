"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authService } from "@/services/auth-service"
import { LoginRequest, LoginSuccessResponse } from "@/types/auth"
import { setAuthCookies } from "@/lib/cookies"
import { authKeys } from "./query-keys"

interface UseSignInOptions {
  onSuccess?: (data: LoginSuccessResponse) => void
  onError?: (error: unknown) => void
}

export function useSignIn(options?: UseSignInOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (data) => {
      setAuthCookies(data.tokens)
      queryClient.setQueryData(authKeys.me(), data.user)
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}
