"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { authService } from "@/services/auth-service"
import { LoginSuccessResponse } from "@/types/auth"
import { clearAuthCookies, setAuthCookies } from "@/lib/cookies"
import { authKeys } from "./query-keys"

interface UseDemoSessionOptions {
  onSuccess?: (data: LoginSuccessResponse) => void
  onError?: (error: unknown) => void
}

export function useDemoSession(options?: UseDemoSessionOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authService.createDemoSession(),
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

interface UseTerminateDemoSessionOptions {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export function useTerminateDemoSession(options?: UseTerminateDemoSessionOptions) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => authService.terminateDemoSession(),
    onSuccess: (data) => {
      clearAuthCookies()
      queryClient.removeQueries({ queryKey: authKeys.all })
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("replyease_demo_expiry")
      }
      toast.success("Đã hủy phiên dùng thử thành công!", {
        description: data.message || "Toàn bộ dữ liệu tạm thời đã được xóa sạch.",
      })
      options?.onSuccess?.()
      router.push("/auth/sign-in")
    },
    onError: (error: unknown) => {
      clearAuthCookies()
      queryClient.removeQueries({ queryKey: authKeys.all })
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("replyease_demo_expiry")
      }
      toast.info("Đã kết thúc phiên trải nghiệm.")
      options?.onError?.(error)
      router.push("/auth/sign-in")
    },
  })
}
