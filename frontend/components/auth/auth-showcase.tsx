import { Bot, Check, CheckCircle2, CornerDownRight, Globe, Shield, Zap } from "lucide-react"

export function AuthShowcase() {
  return (
    <div className="relative hidden w-full flex-col justify-between overflow-hidden border-r border-[#e2e8f0] bg-[#f8f9fb] p-10 text-[#0f172a] lg:flex lg:w-1/2 xl:p-14 min-h-screen">
      {/* Top Telemetry Bar */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-5 w-full max-w-xl xl:max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-md border border-[#e2e8f0] bg-white px-2.5 py-1 text-xs shadow-xs">
          <span className="size-2 rounded-full bg-[#047857]" />
          <span className="font-mono text-[11px] text-[#475569]">
            agent.cluster-vn.replyease.ai
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#64748b]">
          <span className="font-mono font-medium text-[#0f172a]">240ms</span>
          <span className="text-[#475569]">latency</span>
          <span className="text-[#cbd5e1]">·</span>
          <span className="font-mono font-medium text-[#047857]">99.8%</span>
          <span className="text-[#475569]">uptime</span>
        </div>
      </div>

      {/* Main Feature Engine */}
      <div className="my-auto w-full max-w-xl xl:max-w-2xl mx-auto space-y-7 py-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f25f22]/20 bg-[#f25f22]/10 px-3 py-1 text-[11px] font-medium text-[#c2410c]">
            <Zap className="size-3" />
            <span>End-to-End Automation: Consultation & Instant VietQR Checkout</span>
          </div>
          <h2 className="font-semibold text-3xl tracking-tight text-[#0f172a] sm:text-4xl leading-tight">
            Catalog consultation and autonomous VietQR settlement.
          </h2>
          <p className="text-sm leading-relaxed text-[#64748b]">
            Never miss midnight buyers again. ReplyEase AI indexes your company documents and triggers automated SePay VietQR orders instantly.
          </p>
        </div>

        {/* Live Execution Inspector / Real UI Fragment */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 text-xs shadow-xs w-full">
          {/* Header of Inspector */}
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded bg-[#f1f5f9] text-[#64748b]">
                <Globe className="size-3.5" />
              </div>
              <span className="font-medium text-[#0f172a]">tracy-store.com</span>
              <span className="rounded bg-[#f8fafc] border border-[#e2e8f0] px-1.5 py-0.5 font-mono text-xs text-[#64748b]">
                Widget ID #8841
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#047857] font-medium flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[#047857]" />
              Live Session
            </span>
          </div>

          {/* Conversation & Decision Trace */}
          <div className="space-y-3.5 py-4">
            {/* Customer Message */}
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <div className="flex items-center justify-between text-[11px] text-[#64748b] mb-1">
                <span>Customer (Visitor #492)</span>
                <span className="font-mono text-xs text-[#475569]">14:22:04</span>
              </div>
              <p className="text-[#1e293b] text-[13px]">
                &ldquo;Hi! Do you have the beige wool blazer in size L? How fast can it be delivered within the city?&rdquo;
              </p>
            </div>

            {/* AI Decision Pipeline Trace */}
            <div className="space-y-1.5 pl-2.5 border-l-2 border-[#cbd5e1] text-[11px] font-mono text-[#475569]">
              <div className="flex items-center gap-1.5 text-[#059669]">
                <Check className="size-3" />
                <span>RAG search: Matched 3 items in autumn-winter-catalog.pdf (0.94)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#c2410c]">
                <CornerDownRight className="size-3" />
                <span>Inventory checked: 2 left in size L · Generated SePay VietQR 650,000 VND</span>
              </div>
            </div>

            {/* Bot Outbound Reply */}
            <div className="rounded-lg border border-[#e2e8f0] bg-white p-3 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                <div className="flex items-center gap-1.5 text-[#c2410c] font-medium">
                  <Bot className="size-3.5" />
                  <span>ReplyEase AI Assistant</span>
                </div>
                <span className="font-mono text-xs text-[#475569]">14:22:05 (240ms)</span>
              </div>
              <p className="text-[#334155] text-[13px] leading-relaxed">
                Yes! We currently have exactly 2 <strong className="text-[#0f172a]">beige wool blazers in size L</strong> in stock. Express city delivery arrives within 2 hours. I have generated a VietQR code below so you can secure your reservation right away!
              </p>

              {/* VietQR SePay Snippet */}
              <div className="flex items-center justify-between rounded-md border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex size-5 items-center justify-center rounded bg-[#047857]/15 text-[#047857]">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <span className="text-[#9a3412] font-medium">Automated SePay VietQR</span>
                </div>
                <span className="font-mono text-[#c2410c] font-semibold">650,000 VND</span>
              </div>
            </div>
          </div>

          {/* Footer of Inspector */}
          <div className="flex items-center justify-between border-t border-[#f1f5f9] pt-2.5 text-[11px] text-[#64748b]">
            <span>Order automatically synced to CRM & inventory deducted</span>
            <span className="font-mono text-[#0f172a] font-medium">Zero human overhead</span>
          </div>
        </div>

        {/* 3 Hard Metrics (Substance over claims) */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-xs">
            <div className="font-semibold text-lg text-[#0f172a] font-mono">10 Credits</div>
            <div className="text-[11px] text-[#64748b]">Included on activation</div>
          </div>
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-xs">
            <div className="font-semibold text-lg text-[#0f172a] font-mono">1 Code Line</div>
            <div className="text-[11px] text-[#64748b]">Embed in 2 minutes</div>
          </div>
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-xs">
            <div className="font-semibold text-lg text-[#059669] font-mono">+38%</div>
            <div className="text-[11px] text-[#64748b]">Midnight conversion lift</div>
          </div>
        </div>
      </div>

      {/* Bottom Credibility Anchor */}
      <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-5 text-xs text-[#64748b] w-full max-w-xl xl:max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-[#047857]" />
          <span>Bank-grade encryption · Two-factor OTP authentication</span>
        </div>
        <span className="font-mono text-[#475569]">ReplyEase v1.0</span>
      </div>
    </div>
  )
}
