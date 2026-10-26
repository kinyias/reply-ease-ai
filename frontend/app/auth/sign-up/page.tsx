import { Metadata } from "next"
import { SignUpForm } from "@/components/auth/sign-up-form"

export const metadata: Metadata = {
  title: "Sign Up — ReplyEase AI",
  description: "Create your free ReplyEase AI account, deploy customer agents, and get 10 free trial credits.",
}

export default function SignUpPage() {
  return <SignUpForm />
}
