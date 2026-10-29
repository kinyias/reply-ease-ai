"use client"

import { useMutation } from "@tanstack/react-query"
import { authService } from "@/services/auth-service"
import {
  AuthActionResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyResetOtpRequest,
} from "@/types/auth"

interface UseForgotPasswordOptions {
  onSuccess?: (data: AuthActionResponse) => void
  onError?: (error: unknown) => void
}

export function useForgotPassword(options?: UseForgotPasswordOptions) {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) =>
      authService.forgotPassword(payload),
    onSuccess: (data) => {
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}

interface UseVerifyResetOtpOptions {
  onSuccess?: (data: AuthActionResponse) => void
  onError?: (error: unknown) => void
}

export function useVerifyResetOtp(options?: UseVerifyResetOtpOptions) {
  return useMutation({
    mutationFn: (payload: VerifyResetOtpRequest) =>
      authService.verifyResetOtp(payload),
    onSuccess: (data) => {
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}

interface UseResetPasswordOptions {
  onSuccess?: (data: AuthActionResponse) => void
  onError?: (error: unknown) => void
}

export function useResetPassword(options?: UseResetPasswordOptions) {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) =>
      authService.resetPassword(payload),
    onSuccess: (data) => {
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      options?.onError?.(error)
    },
  })
}

