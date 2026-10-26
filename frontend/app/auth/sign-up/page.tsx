import { Metadata } from "next"
import { SignUpForm } from "@/components/auth/sign-up-form"

export const metadata: Metadata = {
  title: "Đăng ký tài khoản — ReplyEase AI",
  description: "Tạo tài khoản ReplyEase AI miễn phí, kích hoạt chatbot và nhận ngay 10 credits dùng thử.",
}

export default function SignUpPage() {
  return <SignUpForm />
}
