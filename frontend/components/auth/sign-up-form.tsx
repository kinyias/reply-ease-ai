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
  Briefcase,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RotateCw,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  SignUpStep1FormValues,
  signUpStep1Schema,
  UserTypeValue,
  VerifyOtpFormValues,
  verifyOtpSchema,
} from "@/schemas/auth"
import { useGenerateOtp, useVerifyAndRegister } from "@/hooks/auth/use-sign-up"
import { useAuth } from "@/context/auth-context"
import { getApiErrorMessage } from "@/lib/api-error"

export function SignUpForm() {
  const router = useRouter()
  const { login } = useAuth()

  // 3-step wizard: 1 = Type selection, 2 = Account details, 3 = OTP Verification
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [selectedType, setSelectedType] = React.useState<UserTypeValue>("owner")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  // Countdown timer for OTP resend (in seconds)
  const [resendCountdown, setResendCountdown] = React.useState<number>(0)

  // Saved credentials from Step 2 for Step 3 verification
  const [stepData, setStepData] = React.useState<SignUpStep1FormValues | null>(null)

  // Account details Form (Step 2)
  const {
    register: registerStep,
    handleSubmit: handleSubmitStep,
    setValue: setValueStep,
    control: controlStep,
    formState: { errors: errorsStep },
  } = useForm<SignUpStep1FormValues>({
    resolver: zodResolver(signUpStep1Schema),
    defaultValues: {
      type: "owner",
      fullname: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  })

  // OTP Form (Step 3)
  const {
    handleSubmit: handleSubmitOtp,
    setValue: setValueOtp,
    control: controlOtp,
    formState: { errors: errorsOtp },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: "",
    },
  })

  const agreeToTerms = useWatch({
    control: controlStep,
    name: "agreeToTerms",
    defaultValue: false,
  })
  const passwordValue =
    useWatch({
      control: controlStep,
      name: "password",
      defaultValue: "",
    }) || ""
  const otpValue =
    useWatch({
      control: controlOtp,
      name: "otp",
      defaultValue: "",
    }) || ""

  // Countdown timer effect
  React.useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  // React Query Mutations
  const generateOtpMutation = useGenerateOtp({
    onSuccess: (data) => {
      toast.success("Mã OTP đã được gửi!", {
        description: data.message || "Vui lòng kiểm tra hộp thư đến của bạn.",
      })
      setStep(3)
      setResendCountdown(60)
    },
  })

  const verifyAndRegisterMutation = useVerifyAndRegister({
    onSuccess: (data) => {
      login(data.tokens, data.user)
      toast.success("Đăng ký thành công!", {
        description: `Chào mừng ${data.user.fullname} (${data.user.type}) đến với ReplyEase AI.`,
      })
      router.push("/dashboard")
    },
  })

  // Handle Step 1 -> Step 2
  const handleProceedFromType = () => {
    setValueStep("type", selectedType)
    setStep(2)
  }

  // Submit Step 2: Send OTP
  const onStep2Submit = (values: SignUpStep1FormValues) => {
    setStepData({ ...values, type: selectedType })
    generateOtpMutation.mutate({
      email: values.email,
      password: values.password,
    })
  }

  // Submit Step 3: Verify OTP & finalize registration
  const onStep3Submit = (values: VerifyOtpFormValues) => {
    if (!stepData) {
      toast.error("Thiếu thông tin đăng ký. Vui lòng nhập lại.")
      setStep(2)
      return
    }

    verifyAndRegisterMutation.mutate({
      email: stepData.email,
      otp: values.otp,
      fullname: stepData.fullname,
      password: stepData.password,
      type: stepData.type || selectedType,
    })
  }

  // Handle Resend OTP in Step 3
  const handleResendOtp = () => {
    if (resendCountdown > 0 || !stepData || generateOtpMutation.isPending) return

    generateOtpMutation.mutate(
      {
        email: stepData.email,
        password: stepData.password,
      },
      {
        onSuccess: () => {
          setResendCountdown(60)
          toast.success("Đã gửi lại mã OTP", {
            description: `Mã xác thực mới đã được gửi tới ${stepData.email}`,
          })
        },
      }
    )
  }

  const errorMessage =
    step === 2 && generateOtpMutation.isError
      ? getApiErrorMessage(generateOtpMutation.error, "Không thể gửi mã OTP. Vui lòng thử lại.")
      : step === 3 && verifyAndRegisterMutation.isError
      ? getApiErrorMessage(
          verifyAndRegisterMutation.error,
          "Mã OTP không chính xác hoặc đã hết hạn."
        )
      : null

  return (
    <div className="space-y-6">
      {/* 3-Step Progress Stepper */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-medium">
          {/* Step 1 Item */}
          <div className="flex items-center gap-1.5">
            <span
              className={`flex size-6 items-center justify-center rounded-full text-[11px] font-mono transition-colors ${
                step === 1
                  ? "bg-[#f25f22] text-white font-bold"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {step > 1 ? <Check className="size-3.5" /> : "1"}
            </span>
            <span className={step === 1 ? "text-[#0f172a] font-semibold" : "text-[#64748b]"}>
              Vai trò
            </span>
          </div>

          <div className="h-px flex-1 mx-2 bg-[#e2e8f0]" />

          {/* Step 2 Item */}
          <div className="flex items-center gap-1.5">
            <span
              className={`flex size-6 items-center justify-center rounded-full text-[11px] font-mono transition-colors ${
                step === 2
                  ? "bg-[#f25f22] text-white font-bold"
                  : step > 2
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-[#f1f5f9] text-[#94a3b8]"
              }`}
            >
              {step > 2 ? <Check className="size-3.5" /> : "2"}
            </span>
            <span className={step === 2 ? "text-[#0f172a] font-semibold" : "text-[#64748b]"}>
              Tài khoản
            </span>
          </div>

          <div className="h-px flex-1 mx-2 bg-[#e2e8f0]" />

          {/* Step 3 Item */}
          <div className="flex items-center gap-1.5">
            <span
              className={`flex size-6 items-center justify-center rounded-full text-[11px] font-mono transition-colors ${
                step === 3
                  ? "bg-[#f25f22] text-white font-bold"
                  : "bg-[#f1f5f9] text-[#94a3b8]"
              }`}
            >
              3
            </span>
            <span className={step === 3 ? "text-[#0f172a] font-semibold" : "text-[#64748b]"}>
              Xác thực
            </span>
          </div>
        </div>
      </div>

      {/* Header Info */}
      <div className="space-y-1.5 text-left">
        <h1 className="font-semibold text-2xl tracking-tight text-[#0f172a]">
          {step === 1
            ? "Bạn sử dụng ReplyEase AI với vai trò nào?"
            : step === 2
            ? "Thông tin tài khoản"
            : "Xác thực email đăng ký"}
        </h1>
        <p className="text-sm text-[#64748b]">
          {step === 1
            ? "Chọn vai trò phù hợp để chúng tôi cá nhân hóa cấu hình và tính năng hỗ trợ tốt nhất."
            : step === 2
            ? "Khởi tạo thông tin đăng nhập và nhận ngay 10 credits AI dùng thử gói Standard."
            : `Nhập mã xác thực 6 chữ số vừa được gửi đến ${stepData?.email || "email của bạn"}.`}
        </p>
      </div>

      {/* Error Alert Display */}
      {errorMessage && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700">
          <AlertCircle className="size-4 shrink-0 text-red-600" />
          <AlertDescription className="text-xs font-medium">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* ================= STEP 1: USER TYPE SELECTION ================= */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-3">
            {/* Option 1: Owner */}
            <div
              onClick={() => setSelectedType("owner")}
              className={`relative flex items-start gap-3.5 rounded-xl border p-4 cursor-pointer transition-all ${
                selectedType === "owner"
                  ? "border-[#f25f22] bg-[#fffaf8] shadow-xs ring-1 ring-[#f25f22]/30"
                  : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-[#fafafa]"
              }`}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  selectedType === "owner"
                    ? "bg-[#f25f22]/15 text-[#ea580c]"
                    : "bg-[#f1f5f9] text-[#64748b]"
                }`}
              >
                <Briefcase className="size-5" />
              </div>

              <div className="space-y-1 flex-1 pr-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[#0f172a]">
                    Chủ doanh nghiệp / Bán hàng
                  </span>
                  <span className="rounded bg-[#f25f22]/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#c2410c]">
                    owner
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#64748b]">
                  Cài đặt chatbot CSKH tự động, chốt đơn hàng và gửi link thanh toán VietQR SePay trên website.
                </p>
              </div>

              {/* Radio Indicator */}
              <div className="absolute right-4 top-4">
                <div
                  className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                    selectedType === "owner"
                      ? "border-[#f25f22] bg-[#f25f22]"
                      : "border-[#cbd5e1] bg-white"
                  }`}
                >
                  {selectedType === "owner" && (
                    <div className="size-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>

            {/* Option 2: Student */}
            <div
              onClick={() => setSelectedType("student")}
              className={`relative flex items-start gap-3.5 rounded-xl border p-4 cursor-pointer transition-all ${
                selectedType === "student"
                  ? "border-[#f25f22] bg-[#fffaf8] shadow-xs ring-1 ring-[#f25f22]/30"
                  : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-[#fafafa]"
              }`}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  selectedType === "student"
                    ? "bg-[#f25f22]/15 text-[#ea580c]"
                    : "bg-[#f1f5f9] text-[#64748b]"
                }`}
              >
                <GraduationCap className="size-5" />
              </div>

              <div className="space-y-1 flex-1 pr-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[#0f172a]">
                    Học sinh / Sinh viên / Nghiên cứu
                  </span>
                  <span className="rounded bg-[#f1f5f9] border border-[#e2e8f0] px-1.5 py-0.5 font-mono text-[9px] font-medium text-[#64748b]">
                    student
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#64748b]">
                  Tìm hiểu công nghệ AI Agent, thử nghiệm RAG trên tài liệu PDF/Docs và học cách nhúng chatbot.
                </p>
              </div>

              {/* Radio Indicator */}
              <div className="absolute right-4 top-4">
                <div
                  className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                    selectedType === "student"
                      ? "border-[#f25f22] bg-[#f25f22]"
                      : "border-[#cbd5e1] bg-white"
                  }`}
                >
                  {selectedType === "student" && (
                    <div className="size-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleProceedFromType}
            className="w-full h-10 mt-2 font-medium bg-[#f25f22] hover:bg-[#dc4f14] text-white transition-all cursor-pointer shadow-xs active:translate-y-px"
          >
            <span>Tiếp tục điền thông tin</span>
            <ArrowRight className="size-4 ml-1.5" />
          </Button>
        </div>
      )}

      {/* ================= STEP 2: ACCOUNT DETAILS ================= */}
      {step === 2 && (
        <form onSubmit={handleSubmitStep(onStep2Submit)} className="space-y-4" noValidate>
          {/* Selected Role Badge */}
          <div className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#64748b]">Vai trò:</span>
              <span className="font-semibold text-[#0f172a] capitalize">
                {selectedType === "owner" ? "Chủ doanh nghiệp / Bán hàng" : "Học sinh / Sinh viên"}
              </span>
              <span className="rounded bg-[#f25f22]/10 px-1.5 py-0.5 font-mono text-[10px] text-[#c2410c]">
                {selectedType}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-medium text-[#f25f22] hover:underline cursor-pointer"
            >
              Đổi vai trò
            </button>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullname" className="text-xs font-medium text-[#334155]">
              Họ và tên
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
              <Input
                id="fullname"
                type="text"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                className={`pl-9 h-10 bg-white border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8] focus-visible:border-[#f25f22] focus-visible:ring-2 focus-visible:ring-[#f25f22]/20 shadow-2xs ${
                  errorsStep.fullname ? "border-red-500 focus-visible:ring-red-500/20" : ""
                }`}
                disabled={generateOtpMutation.isPending}
                {...registerStep("fullname")}
              />
            </div>
            {errorsStep.fullname && (
              <p className="text-xs text-red-600">{errorsStep.fullname.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-[#334155]">
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className={`pl-9 h-10 bg-white border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8] focus-visible:border-[#f25f22] focus-visible:ring-2 focus-visible:ring-[#f25f22]/20 shadow-2xs ${
                  errorsStep.email ? "border-red-500 focus-visible:ring-red-500/20" : ""
                }`}
                disabled={generateOtpMutation.isPending}
                {...registerStep("email")}
              />
            </div>
            {errorsStep.email && (
              <p className="text-xs text-red-600">{errorsStep.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-[#334155]">
              Mật khẩu (8 - 64 ký tự)
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
                className={`pl-9 pr-10 h-10 bg-white border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8] focus-visible:border-[#f25f22] focus-visible:ring-2 focus-visible:ring-[#f25f22]/20 shadow-2xs ${
                  errorsStep.password ? "border-red-500 focus-visible:ring-red-500/20" : ""
                }`}
                disabled={generateOtpMutation.isPending}
                {...registerStep("password")}
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
            {errorsStep.password && (
              <p className="text-xs text-red-600">{errorsStep.password.message}</p>
            )}

            <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-[#64748b]">
              <CheckCircle2
                className={`size-3 transition-colors ${
                  passwordValue.length >= 8
                    ? "text-[#059669]"
                    : "text-[#cbd5e1]"
                }`}
              />
              <span>Tối thiểu 8 ký tự an toàn</span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-medium text-[#334155]">
              Xác nhận mật khẩu
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu phía trên"
                className={`pl-9 pr-10 h-10 bg-white border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8] focus-visible:border-[#f25f22] focus-visible:ring-2 focus-visible:ring-[#f25f22]/20 shadow-2xs ${
                  errorsStep.confirmPassword ? "border-red-500 focus-visible:ring-red-500/20" : ""
                }`}
                disabled={generateOtpMutation.isPending}
                {...registerStep("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a] transition-colors focus:outline-none cursor-pointer"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errorsStep.confirmPassword && (
              <p className="text-xs text-red-600">{errorsStep.confirmPassword.message}</p>
            )}
          </div>

          {/* Agree to Terms Checkbox */}
          <div className="space-y-1 pt-1">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToTerms"
                checked={Boolean(agreeToTerms)}
                onCheckedChange={(checked) =>
                  setValueStep("agreeToTerms", Boolean(checked), {
                    shouldValidate: true,
                  })
                }
                disabled={generateOtpMutation.isPending}
                className="mt-0.5 border-[#cbd5e1] data-checked:bg-[#f25f22] data-checked:border-[#f25f22]"
              />
              <Label
                htmlFor="agreeToTerms"
                className="text-xs font-normal text-[#64748b] leading-normal cursor-pointer select-none"
              >
                Tôi đồng ý với{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-medium text-[#0f172a] hover:underline"
                >
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-medium text-[#0f172a] hover:underline"
                >
                  Chính sách bảo mật
                </Link>
                .
              </Label>
            </div>
            {errorsStep.agreeToTerms && (
              <p className="text-xs text-red-600">
                {errorsStep.agreeToTerms.message}
              </p>
            )}
          </div>

          {/* Step 2 Actions */}
          <div className="space-y-2">
            <Button
              type="submit"
              disabled={generateOtpMutation.isPending}
              className="w-full h-10 mt-2 font-medium bg-[#f25f22] hover:bg-[#dc4f14] text-white transition-all cursor-pointer shadow-xs active:translate-y-px"
            >
              {generateOtpMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  <span>Đang gửi mã xác thực...</span>
                </>
              ) : (
                <>
                  <span>Tiếp tục xác thực email</span>
                  <ArrowRight className="size-4 ml-1.5" />
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              disabled={generateOtpMutation.isPending}
              className="w-full h-9 text-xs text-[#64748b] hover:text-[#0f172a]"
            >
              <ArrowLeft className="size-3.5 mr-1" />
              <span>Quay lại chọn vai trò</span>
            </Button>
          </div>
        </form>
      )}

      {/* ================= STEP 3: OTP VERIFICATION ================= */}
      {step === 3 && (
        <form onSubmit={handleSubmitOtp(onStep3Submit)} className="space-y-6" noValidate>
          {/* Email badge with Change button */}
          <div className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 text-xs">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-[#ea580c]" />
              <div>
                <span className="text-[#64748b]">Gửi đến: </span>
                <span className="font-semibold text-[#0f172a] font-mono">
                  {stepData?.email}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#64748b] hover:text-[#0f172a] transition-colors underline-offset-4 hover:underline cursor-pointer"
            >
              <ArrowLeft className="size-3" />
              <span>Đổi email</span>
            </button>
          </div>

          {/* 6-Digit OTP Input */}
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-xs font-medium text-[#334155]">
              Mã xác thực 6 chữ số
            </Label>
            <div className="flex justify-center py-2">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={(val) =>
                  setValueOtp("otp", val, { shouldValidate: true })
                }
                disabled={verifyAndRegisterMutation.isPending}
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="size-11 sm:size-12 rounded-lg border border-[#cbd5e1] bg-white text-base font-mono font-semibold text-[#0f172a] shadow-2xs data-[active=true]:border-[#f25f22] data-[active=true]:ring-2 data-[active=true]:ring-[#f25f22]/20" />
                  <InputOTPSlot index={1} className="size-11 sm:size-12 rounded-lg border border-[#cbd5e1] bg-white text-base font-mono font-semibold text-[#0f172a] shadow-2xs data-[active=true]:border-[#f25f22] data-[active=true]:ring-2 data-[active=true]:ring-[#f25f22]/20" />
                  <InputOTPSlot index={2} className="size-11 sm:size-12 rounded-lg border border-[#cbd5e1] bg-white text-base font-mono font-semibold text-[#0f172a] shadow-2xs data-[active=true]:border-[#f25f22] data-[active=true]:ring-2 data-[active=true]:ring-[#f25f22]/20" />
                  <InputOTPSlot index={3} className="size-11 sm:size-12 rounded-lg border border-[#cbd5e1] bg-white text-base font-mono font-semibold text-[#0f172a] shadow-2xs data-[active=true]:border-[#f25f22] data-[active=true]:ring-2 data-[active=true]:ring-[#f25f22]/20" />
                  <InputOTPSlot index={4} className="size-11 sm:size-12 rounded-lg border border-[#cbd5e1] bg-white text-base font-mono font-semibold text-[#0f172a] shadow-2xs data-[active=true]:border-[#f25f22] data-[active=true]:ring-2 data-[active=true]:ring-[#f25f22]/20" />
                  <InputOTPSlot index={5} className="size-11 sm:size-12 rounded-lg border border-[#cbd5e1] bg-white text-base font-mono font-semibold text-[#0f172a] shadow-2xs data-[active=true]:border-[#f25f22] data-[active=true]:ring-2 data-[active=true]:ring-[#f25f22]/20" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {errorsOtp.otp && (
              <p className="text-xs text-center text-red-600">
                {errorsOtp.otp.message}
              </p>
            )}
          </div>

          {/* Resend OTP Section */}
          <div className="flex items-center justify-between text-xs text-[#64748b] border-y border-[#e2e8f0] py-3">
            <span>Không nhận được mã?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCountdown > 0 || generateOtpMutation.isPending}
              className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
                resendCountdown > 0 || generateOtpMutation.isPending
                  ? "text-[#94a3b8] cursor-not-allowed"
                  : "text-[#f25f22] hover:text-[#dc4f14] cursor-pointer"
              }`}
            >
              {generateOtpMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Đang gửi lại...</span>
                </>
              ) : resendCountdown > 0 ? (
                <span>Gửi lại sau ({resendCountdown}s)</span>
              ) : (
                <>
                  <RotateCw className="size-3.5" />
                  <span>Gửi lại mã OTP</span>
                </>
              )}
            </button>
          </div>

          {/* Verification Actions */}
          <div className="space-y-2">
            <Button
              type="submit"
              disabled={
                verifyAndRegisterMutation.isPending || otpValue.length !== 6
              }
              className="w-full h-10 font-medium bg-[#f25f22] hover:bg-[#dc4f14] text-white transition-all cursor-pointer shadow-xs active:translate-y-px"
            >
              {verifyAndRegisterMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  <span>Đang kích hoạt tài khoản...</span>
                </>
              ) : (
                <>
                  <KeyRound className="size-4 mr-1.5" />
                  <span>Xác thực & Hoàn tất</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(2)}
              disabled={verifyAndRegisterMutation.isPending}
              className="w-full h-9 text-xs text-[#64748b] hover:text-[#0f172a]"
            >
              Quay lại chỉnh sửa thông tin
            </Button>
          </div>
        </form>
      )}

      {/* Switch to Sign In */}
      <div className="border-t border-[#f1f5f9] pt-4 text-center">
        <p className="text-xs text-[#64748b]">
          Đã có tài khoản ReplyEase AI?{" "}
          <Link
            href="/auth/sign-in"
            className="font-medium text-[#f25f22] hover:text-[#dc4f14] transition-colors underline-offset-4 hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
