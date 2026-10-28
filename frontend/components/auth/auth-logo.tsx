import Link from "next/link"
import Image from "next/image"

interface AuthLogoProps {
  className?: string
}

export function AuthLogo({ className = "" }: AuthLogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 transition-opacity hover:opacity-90 ${className}`}
    >
      <div className="flex size-9 items-center justify-center rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xs">
        <Image
          src="/icons/logo.png"
          alt="ReplyEase AI Logo"
          width={36}
          height={36}
          className="size-full object-contain"
          priority
        />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-semibold text-lg tracking-tight text-[#0f172a]">
            ReplyEase
          </span>
          <span className="rounded border border-[#e2e8f0] bg-[#f8fafc] px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-[#f25f22]">
            AI
          </span>
        </div>
        <span className="text-[11px] text-[#64748b]">
          Customer Agent & Checkout
        </span>
      </div>
    </Link>
  )
}
