"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoginFormValues, loginSchema } from "@/schemas/auth"
import { useSignIn } from "@/hooks/auth/use-sign-in"
import { useDemoSession } from "@/hooks/auth/use-demo-session"
import { useAuth } from "@/context/auth-context"
import { useI18n } from "@/context/i18n-context"
import { getApiErrorMessage } from "@/lib/api-error"

export function SignInForm() {
  const router = useRouter()
  const { login } = useAuth()
  const { t } = useI18n()
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
      toast.success("Signed in successfully!", {
        description: `Welcome back, ${data.user.fullname || "there"} to ReplyEase AI.`,
      })
      router.push("/dashboard")
    },
  })

  const demoSessionMutation = useDemoSession({
    onSuccess: (data) => {
      login(data.tokens, data.user)
      toast.success(t("auth.demoSuccess", "Started 30-minute Demo session!"), {
        description: t("auth.demoSuccessDesc", "Welcome to the ReplyEase AI trial environment."),
      })
      router.push("/dashboard")
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, t("auth.demoError", "Could not start Demo session. Please try again.")))
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    signInMutation.mutate({
      email: values.email,
      password: values.password,
    })
  }

  const errorMessage = signInMutation.isError
    ? getApiErrorMessage(signInMutation.error, "Sign in failed. Please verify your credentials.")
    : null

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-left">
        <h1 className="font-semibold text-2xl tracking-tight text-[#0f172a]">
          {t("auth.signInTitle", "Sign in to ReplyEase AI")}
        </h1>
        <p className="text-sm text-[#64748b]">
          Manage your chatbots, track orders, and view real-time conversation analytics.
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
            {t("auth.email", "Account email")}
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder", "name@company.com")}
              className={`pl-9 h-10 bg-white border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8] focus-visible:border-[#c2410c] focus-visible:ring-2 focus-visible:ring-[#c2410c]/20 shadow-2xs ${
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
              {t("auth.password", "Password")}
            </Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-[#64748b] hover:text-[#0f172a] transition-colors underline-offset-4 hover:underline"
            >
              {t("auth.forgotPassword", "Forgot password?")}
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`pl-9 pr-10 h-10 bg-white border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8] focus-visible:border-[#c2410c] focus-visible:ring-2 focus-visible:ring-[#c2410c]/20 shadow-2xs ${
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
              aria-label={showPassword ? "Hide password" : "Show password"}
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
            className="border-[#cbd5e1] data-checked:bg-[#c2410c] data-checked:border-[#c2410c]"
          />
          <Label
            htmlFor="rememberMe"
            className="text-xs font-normal text-[#64748b] cursor-pointer select-none"
          >
            {t("auth.rememberMe", "Remember me on this device")}
          </Label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={signInMutation.isPending || demoSessionMutation.isPending}
          className="w-full h-10 mt-2 font-medium bg-[#c2410c] hover:bg-[#9a3412] text-white transition-all cursor-pointer shadow-xs active:translate-y-px"
        >
          {signInMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>{t("auth.signIn", "Sign In")}</span>
              <ArrowRight className="size-4 ml-1.5" />
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#e2e8f0] dark:border-slate-800" />
          </div>
          <span className="relative bg-white dark:bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-[#94a3b8]">
            {t("common.or", "or explore immediately")}
          </span>
        </div>

        {/* Demo 30-min Sandbox Button */}
        <Button
          type="button"
          variant="outline"
          disabled={signInMutation.isPending || demoSessionMutation.isPending}
          onClick={() => demoSessionMutation.mutate()}
          className="w-full h-10 font-medium border-orange-200 dark:border-orange-800/60 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-orange-950/20 hover:from-orange-100 hover:to-amber-100 text-orange-800 dark:text-orange-200 transition-all cursor-pointer shadow-xs active:translate-y-px"
        >
          {demoSessionMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2 text-orange-600" />
              <span>{t("auth.startingDemo", "Starting 30m sandbox...")}</span>
            </>
          ) : (
            <>
              <Sparkles className="size-4 mr-2 text-orange-600 animate-pulse" />
              <span>{t("auth.demoBtn", "Try 30-Minute Demo (No Sign Up Required)")}</span>
            </>
          )}
        </Button>
      </form>

      {/* Switch to Sign Up */}
      <div className="border-t border-[#f1f5f9] pt-4 text-center">
        <p className="text-xs text-[#64748b]">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/auth/sign-up"
            className="font-medium text-[#c2410c] hover:text-[#9a3412] transition-colors underline-offset-4 hover:underline"
          >
            {t("auth.signUp", "Create an account")} for free
          </Link>
        </p>
      </div>
    </div>
  )
}
