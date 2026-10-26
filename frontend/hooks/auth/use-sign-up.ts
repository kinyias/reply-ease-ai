"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authService } from "@/services/auth-service"
import {
  GenerateOtpRequest,
  GenerateOtpResponse,
  RegisterSuccessResponse,
  VerifyOtpRequest,
} from "@/types/auth"
import { setAuthCookies } from "@/lib/cookies"
import { authKeys } from "./query-keys"

interface UseGenerateOtpOptions {
  onSuccess?: (data: GenerateOtpResponse) => void
  onError?: (error: unknown) => void
}

export function useGenerateOtp(options?: UseGenerateOtpOptions) {
  return useMutation({
    mutationFn: (payload: GenerateOtpRequest) =>
      authService.generateOtp(payload),
    onSuccess: (data) => {
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}

interface UseVerifyAndRegisterOptions {
  onSuccess?: (data: RegisterSuccessResponse) => void
  onError?: (error: unknown) => void
}

export function useVerifyAndRegister(options?: UseVerifyAndRegisterOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: VerifyOtpRequest) =>
      authService.verifyAndRegister(payload),
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
