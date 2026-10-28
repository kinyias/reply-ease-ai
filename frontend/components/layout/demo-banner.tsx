"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Clock, Sparkles, RefreshCw, AlertTriangle, ArrowRight, X } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useDemoSession } from "@/hooks/auth/use-demo-session"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function DemoBanner() {
  const router = useRouter()
  const { user, login } = useAuth()
  const [dismissed, setDismissed] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Detect whether current session is a demo
  const isDemo = Boolean(
    user &&
    (
      user.type === "demo" ||
      user.is_demo === true ||
      user.email?.toLowerCase().startsWith("demo_") ||
      user.email?.toLowerCase() === "demo@gmail.com" ||
      user.fullname?.toLowerCase().includes("demo")
    )
  )

  const [timeLeft, setTimeLeft] = React.useState<number>(1800) // Default 30 mins (1800s)

  const demoSessionMutation = useDemoSession({
    onSuccess: (data) => {
      login(data.tokens, data.user)
      if (typeof window !== "undefined" && data.user?.id) {
        const newExpiry = Date.now() + 30 * 60 * 1000
        sessionStorage.setItem(`replyease_demo_expiry_${data.user.id}`, String(newExpiry))
        setTimeLeft(1800)
      }
      toast.success("Đã làm mới phiên trải nghiệm 30 phút!", {
        description: "Bạn có thêm 30 phút dùng thử với đầy đủ dữ liệu mẫu.",
      })
      router.refresh()
    },
    onError: () => {
      toast.error("Không thể làm mới phiên. Vui lòng thử lại sau.")
    },
  })

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!isDemo || !mounted) return

    const getExpiryTimestamp = (): number => {
      const storageKey = `replyease_demo_expiry_${user?.id || "demo"}`

      // 1. Check if backend gave a valid demo_expires_at in the future
      if (user?.demo_expires_at) {
        const t = new Date(user.demo_expires_at).getTime()
        if (!isNaN(t) && t > Date.now()) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(storageKey, String(t))
          }
          return t
        }
      }

      // 2. Check sessionStorage
      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem(storageKey)
        if (stored) {
          const num = Number(stored)
          if (!isNaN(num) && num > Date.now()) {
            return num
          }
        }

        // 3. If neither or expired, initialize a fresh 30-minute timer for this session
        const newExpiry = Date.now() + 30 * 60 * 1000
        sessionStorage.setItem(storageKey, String(newExpiry))
        return newExpiry
      }

      return Date.now() + 30 * 60 * 1000
    }

    const expiryTime = getExpiryTimestamp()

    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000))
      setTimeLeft(remaining)
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [isDemo, mounted, user?.id, user?.demo_expires_at])

  if (!mounted || !isDemo || dismissed) return null

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remainder = secs % 60
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`
  }

  const isUrgent = timeLeft <= 300 // <= 5 mins
  const isExpired = timeLeft === 0

  return (
    <div
      role="banner"
      aria-label="Thông báo phiên dùng thử 30 phút"
      className={`relative z-50 w-full border-b px-4 py-2 transition-all shadow-xs ${
        isExpired
          ? "bg-red-600 text-white border-red-700"
          : isUrgent
          ? "bg-amber-500 text-amber-950 border-amber-600"
          : "bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white border-orange-700"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm">
        {/* Left: Badge & Description */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
            <Sparkles className="size-3 text-amber-200" />
            Sandbox Demo 30 Phút
          </span>
          <span className="font-medium text-white/95 hidden md:inline">
            Bạn đang trong phiên trải nghiệm dùng thử độc lập. Thoải mái thêm/sửa/xóa sản phẩm và test chatbot.
          </span>
        </div>

        {/* Right: Countdown Clock Display & Action */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Live 30m Countdown Display */}
          <div
            className={`flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold px-2.5 py-1 rounded bg-black/30 text-white border border-white/25 shadow-xs ${
              isExpired ? "bg-black/50 text-amber-300" : ""
            }`}
            title="Thời gian dùng thử còn lại"
          >
            {isExpired ? (
              <AlertTriangle className="size-3.5 text-amber-300 animate-bounce" />
            ) : (
              <Clock className="size-3.5 text-amber-200 animate-pulse" />
            )}
            <span className="tracking-wider">{formatTime(timeLeft)}</span>
          </div>

          {/* Reset / Làm mới 30p */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => demoSessionMutation.mutate()}
            disabled={demoSessionMutation.isPending}
            className="h-7 text-xs px-2.5 text-white bg-white/15 hover:bg-white/25 border border-white/20"
            title="Đặt lại phiên và gia hạn thêm 30 phút"
          >
            <RefreshCw className={`size-3 mr-1 ${demoSessionMutation.isPending ? "animate-spin" : ""}`} />
            {isExpired ? "Làm mới phiên" : "Reset 30p"}
          </Button>

          {/* Register Real Account Link */}
          <Link href="/auth/sign-up">
            <Button
              size="sm"
              className="h-7 text-xs px-2.5 bg-white text-orange-700 hover:bg-white/90 font-semibold shadow-xs"
            >
              <span>Đăng ký thật</span>
              <ArrowRight className="size-3 ml-1" />
            </Button>
          </Link>

          {/* Close / Dismiss Banner */}
          {!isExpired && (
            <button
              onClick={() => setDismissed(true)}
              className="text-white/70 hover:text-white p-1 rounded transition-colors ml-1"
              title="Đóng thông báo"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
