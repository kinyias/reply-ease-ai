"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Clock, Sparkles, ArrowRight, X, LogOut } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { authService } from "@/services/auth-service"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export function DemoBanner() {
  const router = useRouter()
  const { user, logout } = useAuth()
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

  const handleExit = () => {
    if (typeof window !== "undefined" && user?.id) {
      sessionStorage.removeItem(`replyease_demo_expiry_${user.id}`)
    }
    authService.logout()
    logout()
    toast.info("Đã thoát phiên dùng thử.")
    router.push("/auth/sign-in")
  }

  const handleRegister = () => {
    if (typeof window !== "undefined" && user?.id) {
      sessionStorage.removeItem(`replyease_demo_expiry_${user.id}`)
    }
    authService.logout()
    logout()
    router.push("/auth/sign-up")
  }

  if (!mounted || !isDemo || (dismissed && timeLeft > 0)) return null

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remainder = secs % 60
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`
  }

  const isUrgent = timeLeft <= 300 // <= 5 mins
  const isExpired = timeLeft === 0

  return (
    <>
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
              Bạn đang trong phiên trải nghiệm dùng thử độc lập. Thoải mái kiểm tra các tính năng AI bán hàng & CSKH.
            </span>
          </div>

          {/* Right: Countdown Clock Display & Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Live 30m Countdown Display */}
            <div
              className={`flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold px-2.5 py-1 rounded bg-black/30 text-white border border-white/25 shadow-xs ${
                isExpired ? "bg-black/50 text-amber-300" : ""
              }`}
              title="Thời gian dùng thử còn lại"
            >
              <Clock className={`size-3.5 ${isExpired ? "text-red-300" : "text-amber-200 animate-pulse"}`} />
              <span className="tracking-wider">{formatTime(timeLeft)}</span>
            </div>

            {/* Register Real Account Button */}
            <Button
              size="sm"
              onClick={handleRegister}
              className="h-7 text-xs px-2.5 bg-white text-orange-700 hover:bg-white/90 font-semibold shadow-xs"
            >
              <span>Đăng ký thật</span>
              <ArrowRight className="size-3 ml-1" />
            </Button>

            {/* Exit Demo Session Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExit}
              className="h-7 text-xs px-2 text-white bg-black/20 hover:bg-black/35 border border-white/20"
              title="Thoát phiên dùng thử"
            >
              <LogOut className="size-3 mr-1" />
              <span>Thoát</span>
            </Button>

            {/* Close / Dismiss Banner if not expired */}
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

      {/* Blocking Modal when 30-Minute Trial Session Expires */}
      <Dialog open={isExpired}>
        <DialogContent
          className="max-w-md p-6 text-center [&_[aria-label=Đóng]]:hidden [&_button[aria-label=Đóng]]:hidden shadow-2xl border-orange-200 dark:border-orange-950/50"
        >
          <DialogHeader className="items-center text-center space-y-3 mb-2">
            <div className="size-14 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="size-7 animate-pulse" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground text-center">
              Phiên Dùng Thử 30 Phút Đã Kết Thúc
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed text-center px-2">
              Cảm ơn bạn đã trải nghiệm ReplyEase AI! Thời gian dùng thử 30 phút đã kết thúc. Vui lòng đăng ký tài khoản chính thức để tiếp tục xây dựng chatbot AI bán hàng và CSKH không giới hạn.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex flex-col gap-2.5 sm:flex-col border-t-0 pt-0">
            {/* Primary Action: Đăng ký tài khoản chính thức */}
            <Button
              size="lg"
              onClick={handleRegister}
              className="w-full h-10 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <span>Đăng ký tài khoản chính thức</span>
              <ArrowRight className="size-4" />
            </Button>

            {/* Secondary Action: Thoát */}
            <Button
              variant="outline"
              size="default"
              onClick={handleExit}
              className="w-full text-muted-foreground hover:text-foreground hover:bg-muted font-medium flex items-center justify-center gap-2 text-xs"
            >
              <LogOut className="size-3.5" />
              <span>Thoát</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
