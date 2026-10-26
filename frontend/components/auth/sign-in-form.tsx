"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoginFormValues, loginSchema } from "@/schemas/auth"
import { useSignIn } from "@/hooks/auth/use-sign-in"
import { useAuth } from "@/context/auth-context"
import { getApiErrorMessage } from "@/lib/api-error"

export function SignInForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const rememberMe = useWatch({
    control,
    name: "rememberMe",
    defaultValue: false,
  })

  const signInMutation = useSignIn({
    onSuccess: (data) => {
      login(data.tokens, data.user)
      toast.success("Đăng nhập thành công!", {
        description: `Chào mừng ${data.user.fullname || "bạn"} trở lại với ReplyEase AI.`,
      })
      router.push("/dashboard")
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    signInMutation.mutate({
      email: values.email,
      password: values.password,
    })
  }

  const errorMessage = signInMutation.isError
    ? getApiErrorMessage(signInMutation.error, "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.")
    : null

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-left">
        <h1 className="font-semibold text-2xl tracking-tight text-[#0f172a]">
          Đăng nhập vào ReplyEase AI
        </h1>
        <p className="text-sm text-[#64748b]">
          Quản lý chatbot, kiểm tra tin nhắn và xem báo cáo tương tác thời gian thực.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700">
          <AlertCircle className="size-4 shrink-0 text-red-600" />
          <AlertDescription className="text-xs font-medium">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-[#334155]">
            Email tài khoản
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              className={`pl-9 h-10 bg-white border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8] focus-visible:border-[#f25f22] focus-visible:ring-2 focus-visible:ring-[#f25f22]/20 shadow-2xs ${
                errors.email ? "border-red-500 focus-visible:ring-red-500/20" : ""
              }`}
              disabled={signInMutation.isPending}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-[#334155]">
              Mật khẩu
            </Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-[#64748b] hover:text-[#0f172a] transition-colors underline-offset-4 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`pl-9 pr-10 h-10 bg-white border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8] focus-visible:border-[#f25f22] focus-visible:ring-2 focus-visible:ring-[#f25f22]/20 shadow-2xs ${
                errors.password ? "border-red-500 focus-visible:ring-red-500/20" : ""
              }`}
              disabled={signInMutation.isPending}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a] transition-colors focus:outline-none cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center space-x-2 pt-1">
          <Checkbox
            id="rememberMe"
            checked={Boolean(rememberMe)}
            onCheckedChange={(checked) => setValue("rememberMe", Boolean(checked))}
            disabled={signInMutation.isPending}
            className="border-[#cbd5e1] data-checked:bg-[#f25f22] data-checked:border-[#f25f22]"
          />
          <Label
            htmlFor="rememberMe"
            className="text-xs font-normal text-[#64748b] cursor-pointer select-none"
          >
            Duy trì đăng nhập trên thiết bị này
          </Label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={signInMutation.isPending}
          className="w-full h-10 mt-2 font-medium bg-[#f25f22] hover:bg-[#dc4f14] text-white transition-all cursor-pointer shadow-xs active:translate-y-px"
        >
          {signInMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              <span>Đang kiểm tra thông tin...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="size-4 ml-1.5" />
            </>
          )}
        </Button>
      </form>

      {/* Switch to Sign Up */}
      <div className="border-t border-[#f1f5f9] pt-4 text-center">
        <p className="text-xs text-[#64748b]">
          Chưa có tài khoản ReplyEase AI?{" "}
          <Link
            href="/auth/sign-up"
            className="font-medium text-[#f25f22] hover:text-[#dc4f14] transition-colors underline-offset-4 hover:underline"
          >
            Tạo tài khoản mới miễn phí
          </Link>
        </p>
      </div>
    </div>
  )
}
