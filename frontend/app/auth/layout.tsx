import * as React from "react"
import Link from "next/link"
import { AuthLogo } from "@/components/auth/auth-logo"
import { AuthShowcase } from "@/components/auth/auth-showcase"
import { LanguageToggle } from "@/components/language-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full bg-white text-[#0f172a]">
      {/* Left Showcase (Desktop) - 50% Full-bleed background */}
      <AuthShowcase />

      {/* Right Content / Form Container - 50% Full-bleed background */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-white min-h-screen w-full">
        {/* Top Navbar */}
        <div className="flex items-center justify-between w-full max-w-xl mx-auto">
          <AuthLogo />
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              href="/"
              className="text-xs text-[#64748b] hover:text-[#0f172a] transition-colors underline-offset-4 hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Center Auth Form - Direct on full-width canvas */}
        <main className="my-auto mx-auto w-full max-w-[480px] py-8">
          {children}
        </main>

        {/* Bottom Legal / Help Footer */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#475569] border-t border-[#f1f5f9] pt-6 w-full max-w-xl mx-auto">
          <span>ReplyEase AI · Autonomous Customer Support & Instant Checkout</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[#475569] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#475569] transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-[#475569] transition-colors">
              Support
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
