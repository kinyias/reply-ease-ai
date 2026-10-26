import { Metadata } from "next"
import { SignInForm } from "@/components/auth/sign-in-form"

export const metadata: Metadata = {
  title: "Đăng nhập — ReplyEase AI",
  description: "Đăng nhập vào bảng điều khiển trợ lý AI của doanh nghiệp bạn trên ReplyEase AI.",
}

export default function SignInPage() {
  return <SignInForm />
}
