"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RotateCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  ForgotPasswordFormValues,
  forgotPasswordSchema,
  ResetPasswordFormValues,
  resetPasswordSchema,
} from "@/schemas/auth"
import {
  useForgotPassword,
  useResetPassword,
} from "@/hooks/auth/use-forgot-password"
import { useI18n } from "@/context/i18n-context"
import { getApiErrorMessage } from "@/lib/api-error"

export function ForgotPasswordForm() {
  const router = useRouter()
  const { t } = useI18n()

  // 1 = Enter email, 2 = Enter OTP & new password, 3 = Success confirmation
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [submittedEmail, setSubmittedEmail] = React.useState<string>("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [resendCountdown, setResendCountdown] = React.useState<number>(0)

  // Step 1: Email Form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  // Step 2: Reset Form (OTP + New Password)
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    setValue: setValueReset,
    control: controlReset,
    formState: { errors: errorsReset },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const otpValue =
    useWatch({
      control: controlReset,
      name: "otp",
      defaultValue: "",
    }) || ""

  // Countdown timer for resend
  React.useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  // Mutations
  const forgotPasswordMutation = useForgotPassword({
    onSuccess: (data) => {
      toast.success(t("auth.resetOtpSent", "Reset code sent!"), {
        description:
          data.message ||
          t(
            "auth.resetOtpSentDesc",
            "Please check your inbox or spam folder for the 6-digit code."
          ),
      })
      setStep(2)
      setResendCountdown(60)
    },
  })

  const resetPasswordMutation = useResetPassword({
    onSuccess: (data) => {
      toast.success(
        t("auth.resetSuccessTitle", "Password reset successfully!"),
        {
          description:
            data.message ||
            t(
              "auth.resetSuccessSubtitle",
              "Your password has been securely updated. You can now sign in with your new credentials."
            ),
        }
      )
      setStep(3)
    },
  })

  // Handle Step 1 submit
  const onEmailSubmit = (values: ForgotPasswordFormValues) => {
    setSubmittedEmail(values.email)
    forgotPasswordMutation.mutate({ email: values.email })
  }

  // Handle Step 2 submit
  const onResetSubmit = (values: ResetPasswordFormValues) => {
    if (!submittedEmail) {
      setStep(1)
      return
    }

    resetPasswordMutation.mutate({
      email: submittedEmail,
      otp: values.otp,
      new_password: values.newPassword,
    })
  }

  // Handle Resend OTP
  const handleResendOtp = () => {
    if (resendCountdown > 0 || !submittedEmail || forgotPasswordMutation.isPending)
      return

    forgotPasswordMutation.mutate(
      { email: submittedEmail },
      {
        onSuccess: () => {
          setResendCountdown(60)
          toast.success(t("auth.resetOtpSent", "Reset code sent!"), {
            description: `${t("auth.step3Subtitle", "We sent a 6-digit OTP code to {email}").replace(
              "{email}",
              submittedEmail
            )}`,
          })
        },
      }
    )
  }

  const errorMessage =
    step === 1 && forgotPasswordMutation.isError
      ? getApiErrorMessage(
          forgotPasswordMutation.error,
          "Could not send reset code. Please check your email."
        )
      : step === 2 && resetPasswordMutation.isError
      ? getApiErrorMessage(
          resetPasswordMutation.error,
          "Failed to reset password. Please verify your OTP code."
        )
      : null

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      {step < 3 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[11px] font-mono transition-colors ${
                  step === 1
                    ? "bg-[#c2410c] text-white font-bold"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {step > 1 ? <Check className="size-3.5" /> : "1"}
              </span>
              <span
                className={
                  step === 1 ? "text-[#0f172a] font-semibold" : "text-[#64748b]"
                }
              >
                {t("auth.email", "Email")}
              </span>
            </div>

            <div className="h-px flex-1 mx-2 bg-[#e2e8f0]" />

            <div className="flex items-center gap-1.5">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[11px] font-mono transition-colors ${
                  step === 2
                    ? "bg-[#c2410c] text-white font-bold"
                    : "bg-[#f1f5f9] text-[#94a3b8]"
                }`}
              >
                2
              </span>
              <span
                className={
                  step === 2 ? "text-[#0f172a] font-semibold" : "text-[#64748b]"
                }
              >
                {t("auth.resetPasswordTitle", "Reset Password")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <Alert
          variant="destructive"
          className="border-red-200 bg-red-50 text-red-700"
        >
          <AlertCircle className="size-4 shrink-0 text-red-600" />
          <AlertDescription className="text-xs font-medium">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* ================= STEP 1: ENTER EMAIL ================= */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1.5 text-left">
            <h1 className="font-semibold text-2xl tracking-tight text-[#0f172a]">
              {t("auth.forgotPasswordTitle", "Forgot your password?")}
            </h1>
            <p className="text-sm text-[#64748b]">
              {t(
                "auth.forgotPasswordSubtitle",
                "Enter your registered email address and we'll send you a 6-digit OTP code to reset your password."
              )}
            </p>
          </div>

          <form
            onSubmit={handleSubmitEmail(onEmailSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="forgot-email"
                className="text-xs font-medium text-[#334155]"
              >
                {t("auth.email", "Account email")}
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("auth.emailPlaceholder", "name@company.com")}
                  className={`pl-9 h-10 bg-white border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8] focus-visible:border-[#c2410c] focus-visible:ring-2 focus-visible:ring-[#c2410c]/20 shadow-2xs ${
                    errorsEmail.email
                      ? "border-red-500 focus-visible:ring-red-500/20"
                      : ""
                  }`}
                  disabled={forgotPasswordMutation.isPending}
                  {...registerEmail("email")}
                />
              </div>
              {errorsEmail.email && (
                <p className="text-xs text-red-600">
                  {errorsEmail.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-10 font-semibold bg-[#ff7a00] hover:bg-[#ea580c] text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t("auth.sendingResetOtp", "Sending code...")}</span>
                </>
              ) : (
                <>
                  <span>
                    {t("auth.sendResetOtp", "Send Verification Code")}
                  </span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center gap-1.5 text-xs text-[#64748b] hover:text-[#0f172a] transition-colors underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              <span>{t("auth.backToSignIn", "Back to Sign In")}</span>
            </Link>
          </div>
        </div>
      )}

      {/* ================= STEP 2: ENTER OTP & NEW PASSWORD ================= */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1.5 text-left">
            <h1 className="font-semibold text-2xl tracking-tight text-[#0f172a]">
              {t("auth.resetPasswordTitle", "Reset your password")}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-[#64748b]">
              <span>
                {t(
                  "auth.resetPasswordSubtitle",
                  "Enter the 6-digit code sent to {email} and choose a new password."
                ).replace("{email}", submittedEmail)}
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-[#c2410c] hover:underline cursor-pointer"
              >
                ({t("auth.changeEmail", "Change email")})
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmitReset(onResetSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* OTP Input Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-[#334155]">
                  {t("auth.otpLabel", "Enter 6-digit OTP")}
                </Label>
                <span className="text-[11px] text-[#94a3b8]">
                  {t("auth.otpExpiresIn", "Valid for 10 minutes")}
                </span>
              </div>

              <div className="flex justify-center py-1">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={(val) =>
                    setValueReset("otp", val, { shouldValidate: true })
                  }
                  disabled={resetPasswordMutation.isPending}
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="size-11 text-base font-bold text-[#0f172a] border-[#cbd5e1] rounded-lg shadow-2xs focus:border-[#c2410c]" />
                    <InputOTPSlot index={1} className="size-11 text-base font-bold text-[#0f172a] border-[#cbd5e1] rounded-lg shadow-2xs focus:border-[#c2410c]" />
                    <InputOTPSlot index={2} className="size-11 text-base font-bold text-[#0f172a] border-[#cbd5e1] rounded-lg shadow-2xs focus:border-[#c2410c]" />
                    <InputOTPSlot index={3} className="size-11 text-base font-bold text-[#0f172a] border-[#cbd5e1] rounded-lg shadow-2xs focus:border-[#c2410c]" />
                    <InputOTPSlot index={4} className="size-11 text-base font-bold text-[#0f172a] border-[#cbd5e1] rounded-lg shadow-2xs focus:border-[#c2410c]" />
                    <InputOTPSlot index={5} className="size-11 text-base font-bold text-[#0f172a] border-[#cbd5e1] rounded-lg shadow-2xs focus:border-[#c2410c]" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {errorsReset.otp && (
                <p className="text-center text-xs text-red-600">
                  {errorsReset.otp.message}
                </p>
              )}

              {/* Resend OTP button */}
              <div className="flex justify-center pt-1">
                {resendCountdown > 0 ? (
                  <p className="text-xs text-[#94a3b8]">
                    {t(
                      "auth.resendIn",
                      "Resend code in {seconds}s"
                    ).replace("{seconds}", resendCountdown.toString())}
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResendOtp}
                    disabled={forgotPasswordMutation.isPending}
                    className="h-7 text-xs text-[#c2410c] hover:text-[#9a3412] hover:bg-orange-50 font-medium cursor-pointer"
                  >
                    {forgotPasswordMutation.isPending ? (
                      <Loader2 className="mr-1.5 size-3 animate-spin" />
                    ) : (
                      <RotateCw className="mr-1.5 size-3" />
                    )}
                    {t("auth.resendNow", "Resend Code")}
                  </Button>
                )}
              </div>
            </div>

            {/* New Password Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="new-password"
                className="text-xs font-medium text-[#334155]"
              >
                {t("auth.newPassword", "New password")}
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t(
                    "auth.newPasswordPlaceholder",
                    "At least 8 characters"
                  )}
                  className={`pl-9 pr-10 h-10 bg-white border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8] focus-visible:border-[#c2410c] focus-visible:ring-2 focus-visible:ring-[#c2410c]/20 shadow-2xs ${
                    errorsReset.newPassword
                      ? "border-red-500 focus-visible:ring-red-500/20"
                      : ""
                  }`}
                  disabled={resetPasswordMutation.isPending}
                  {...registerReset("newPassword")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errorsReset.newPassword && (
                <p className="text-xs text-red-600">
                  {errorsReset.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirm-password"
                className="text-xs font-medium text-[#334155]"
              >
                {t("auth.confirmNewPassword", "Confirm new password")}
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t(
                    "auth.confirmNewPasswordPlaceholder",
                    "Re-enter new password"
                  )}
                  className={`pl-9 pr-10 h-10 bg-white border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8] focus-visible:border-[#c2410c] focus-visible:ring-2 focus-visible:ring-[#c2410c]/20 shadow-2xs ${
                    errorsReset.confirmPassword
                      ? "border-red-500 focus-visible:ring-red-500/20"
                      : ""
                  }`}
                  disabled={resetPasswordMutation.isPending}
                  {...registerReset("confirmPassword")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] transition-colors focus:outline-none"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errorsReset.confirmPassword && (
                <p className="text-xs text-red-600">
                  {errorsReset.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-10 font-semibold bg-[#ff7a00] hover:bg-[#ea580c] text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>
                    {t("auth.resettingPassword", "Resetting password...")}
                  </span>
                </>
              ) : (
                <>
                  <KeyRound className="size-4" />
                  <span>
                    {t("auth.resetPasswordSubmit", "Reset Password")}
                  </span>
                </>
              )}
            </Button>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center gap-1.5 text-xs text-[#64748b] hover:text-[#0f172a] transition-colors underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              <span>{t("auth.backToSignIn", "Back to Sign In")}</span>
            </Link>
          </div>
        </div>
      )}

      {/* ================= STEP 3: SUCCESS STATE ================= */}
      {step === 3 && (
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
            <CheckCircle2 className="size-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-semibold text-2xl tracking-tight text-[#0f172a]">
              {t("auth.resetSuccessTitle", "Password reset successfully!")}
            </h1>
            <p className="text-sm text-[#64748b] max-w-sm mx-auto">
              {t(
                "auth.resetSuccessSubtitle",
                "Your password has been securely updated. You can now sign in with your new credentials."
              )}
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={() => router.push("/auth/sign-in")}
              className="w-full h-10 font-semibold bg-[#ff7a00] hover:bg-[#ea580c] text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t("auth.signInNow", "Sign In Now")}</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
