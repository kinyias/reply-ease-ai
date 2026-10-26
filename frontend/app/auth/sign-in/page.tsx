import { Metadata } from "next"
import { SignInForm } from "@/components/auth/sign-in-form"

export const metadata: Metadata = {
  title: "Sign In — ReplyEase AI",
  description: "Sign in to manage your AI customer support agents and view real-time conversation analytics.",
}

export default function SignInPage() {
  return <SignInForm />
}
