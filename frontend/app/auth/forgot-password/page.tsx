import { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot Password — ReplyEase AI",
  description: "Reset your password with OTP verification to regain access to your ReplyEase AI account.",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}

