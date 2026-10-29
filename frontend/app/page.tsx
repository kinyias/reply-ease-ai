"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { LandingHeader } from "@/components/layout/landing-header";
import { useI18n } from "@/context/i18n-context";
import Link from "next/link";
import {
  Bot,
  Check,
  CheckCircle2,
  CornerDownRight,
  QrCode,
  Sliders,
  ArrowUpRight,
  Database,
  CreditCard,
  Code2,
  Sparkles,
  Zap,
} from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  category: string;
  customerQuery: string;
  time: string;
  ragMatches: string;
  confidence: string;
  inventoryStatus: string;
  botReply: string;
  orderNumber: string;
  amount: string;
  account: string;
  bank: string;
  productName: string;
  latencyMs: number;
}

const getScenarios = (isVi: boolean): Scenario[] => [
  {
    id: "blazer",
    name: isVi ? "Tư vấn kích cỡ & Kiểm tra tồn kho" : "Size Consultation & Stock Check",
    category: isVi ? "Thời trang Nữ" : "Women's Apparel",
    customerQuery: isVi
      ? "Shop ơi áo blazer dạ màu be size L còn không? Giao hỏa tốc nội thành mất bao lâu?"
      : "Hi! Do you have the beige wool blazer in size L? How long does express delivery take within the city?",
    time: "02:14:18",
    ragMatches: isVi ? "catalog-thu-dong-2026.pdf (Trang 14)" : "autumn-winter-catalog-2026.pdf (Page 14)",
    confidence: "99.4%",
    inventoryStatus: isVi ? "Size L: Còn 2 chiếc tại Kho Tổng" : "Size L: 2 items in stock, Central Warehouse",
    botReply: isVi
      ? "Dạ còn ạ! Bên em hiện còn đúng 2 chiếc áo blazer dạ màu be size L tại Kho Tổng. Giao hỏa tốc nội thành trong 2 giờ. Em gửi mã VietQR bên dưới để mình giữ hàng ngay nhé!"
      : "Yes! We currently have exactly 2 beige wool blazers in size L at our Central Warehouse. Express city delivery arrives within 2 hours. I have generated a VietQR code below so you can reserve yours right away!",
    orderNumber: "RE-8841",
    amount: "650,000",
    account: "RE8841",
    bank: "MBBank",
    productName: isVi ? "Áo Blazer Dạ Phối Nút Màu Be - Size L" : "Wool Blend Blazer Beige - Size L",
    latencyMs: 240,
  },
  {
    id: "serum",
    name: isVi ? "Hỏi thành phần & Ưu đãi hôm nay" : "Ingredients & Promo Inquiry",
    category: isVi ? "Mỹ phẩm & Chăm sóc da" : "Cosmetics & Skincare",
    customerQuery: isVi
      ? "Serum B5 da dầu mụn dùng có bị bí không shop? Hôm nay có mã giảm giá nào không?"
      : "Is the B5 serum greasy for acne-prone oily skin? Are there any active discount codes?",
    time: "23:45:02",
    ragMatches: isVi ? "huong-dan-b5.pdf & khuyen-mai-thang-10.docx" : "b5-product-guide.pdf & october-promotions.docx",
    confidence: "98.9%",
    inventoryStatus: isVi ? "Còn hàng (54 chai), tặng kèm toner pad" : "In Stock (54 units), includes complimentary toner pad",
    botReply: isVi
      ? "Serum Phục hồi B5 có kết cấu dạng gel nước thấm nhanh sau 30 giây, không gây bí tắc lỗ chân lông. Đơn hàng hôm nay được áp mã SAVE50K và tặng kèm hộp Toner Pad 30 miếng trị giá 120.000đ ạ!"
      : "The B5 Recovery Serum features a lightweight watery-gel texture that absorbs in 30 seconds without clogging pores. Today's orders qualify for promo code SAVE50K plus a free 30-sheet Toner Pad valued at 120,000 VND!",
    orderNumber: "RE-8842",
    amount: "420,000",
    account: "RE8842",
    bank: "Techcombank",
    productName: isVi ? "Serum Phục Hồi B5 50ml + Quà Tặng" : "B5 Recovery Serum 50ml + Toner Pad",
    latencyMs: 228,
  },
  {
    id: "camera",
    name: isVi ? "Thông số kỹ thuật & Xuất hóa đơn VAT" : "Technical Specs & VAT Invoice",
    category: isVi ? "Công nghệ & Phần cứng" : "Tech & Hardware",
    customerQuery: isVi
      ? "Camera ngoài trời này có kèm thẻ nhớ không shop? Công ty mình cần xuất hóa đơn VAT điện tử."
      : "Does this outdoor camera include a memory card? My company needs an electronic VAT invoice.",
    time: "01:28:44",
    ragMatches: isVi ? "chinh-sach-vat.pdf & thong-so-camera-pro.pdf" : "vat-invoice-policy.pdf & specs-camera-pro.pdf",
    confidence: "99.7%",
    inventoryStatus: isVi ? "Còn hàng (18 bộ), hỗ trợ xuất hóa đơn e-VAT" : "In Stock (18 units), e-VAT supported",
    botReply: isVi
      ? "Camera AI Pro Ngoài Trời kèm thẻ SanDisk 64GB bảo hành 24 tháng chính hãng. Bên em tự động xuất hóa đơn VAT điện tử gửi về email công ty ngay sau khi đối soát thanh toán thành công ạ."
      : "The AI Pro Outdoor Camera includes a SanDisk 64GB card with a 24-month warranty. We automatically issue e-VAT invoices to your company email right after payment reconciliation.",
    orderNumber: "RE-8843",
    amount: "1,290,000",
    account: "RE8843",
    bank: "Vietcombank",
    productName: isVi ? "Camera AI Smart ngoài trời 2K + Thẻ 64GB" : "Camera AI Smart outdoor 2K + 64GB",
    latencyMs: 252,
  },
  {
    id: "warranty",
    name: isVi ? "Chính sách đổi trả & Bảo hành" : "Exchange & Warranty Policy",
    category: isVi ? "Hỗ trợ khách hàng" : "Customer Support",
    customerQuery: isVi
      ? "Nếu mua về mặc không vừa size thì quy trình đổi trả như thế nào?"
      : "If I ordered the wrong size, what is your exchange procedure?",
    time: "03:10:12",
    ragMatches: isVi ? "chinh-sach-doi-tra.pdf (Điều 3)" : "return-exchange-policy.pdf (Clause 3)",
    confidence: "99.1%",
    inventoryStatus: isVi ? "Đổi size miễn phí tận nhà trong 7 ngày" : "Free size exchange within 7 days",
    botReply: isVi
      ? "Dạ bên em hỗ trợ đổi size miễn phí tận nơi trong 7 ngày kể từ khi nhận hàng. Shipper sẽ mang size mới đến và thu hồi lại sản phẩm cũ cùng lúc tại nhà mình, mình không cần phải mang ra bưu cục đâu ạ."
      : "We offer 100% free doorstep size exchanges within 7 days of delivery. The courier will bring the new size and collect the original item at your door simultaneously—no post office visit required.",
    orderNumber: "RE-8844",
    amount: "0",
    account: "SUPPORT-RE",
    bank: "MBBank",
    productName: isVi ? "Dịch vụ Đổi Size Tận Nhà" : "Doorstep Exchange Service",
    latencyMs: 215,
  },
];

export default function HomePage() {
  const { t, locale } = useI18n();
  const isVi = locale === "vi";
  const scenarios = getScenarios(isVi);

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("blazer");
  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [inputEmail, setInputEmail] = useState<string>("");
  const [ctaSubmitted, setCtaSubmitted] = useState<boolean>(false);

  useEffect(() => {
    // Choreographed entrance and scroll motion
    const animateAll = () => {
      const items = document.querySelectorAll<HTMLElement>(".motion-target");
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.95) {
          // Trigger style mutation for inspector
          item.style.transform = "translateY(0px)";
          item.style.opacity = "1";
        }
      });
    };

    // Run on mount with slight stagger and on scroll
    const timer = setTimeout(animateAll, 50);
    window.addEventListener("scroll", animateAll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", animateAll);
    };
  }, []);

  const handleSelectScenario = (sc: Scenario) => {
    setSelectedScenarioId(sc.id);
    setIsPaid(false);
  };

  const handleSimulatePayment = () => {
    setIsPaid(true);
  };

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputEmail.trim()) {
      setCtaSubmitted(true);
    }
  };

  return (
    <div className="min-h-[100svh] bg-[#ffffff] text-[#0f172a] selection:bg-[#c2410c] selection:text-white overflow-x-clip">
      {/* 1. Header / Navigation */}
      <LandingHeader />

      <main>
        {/* 2. Hero Section: Sentence split by frame */}
        <section className="relative pt-10 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-[#ffffff]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* First Half */}
              <div className="lg:col-span-4 text-left motion-target">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#0f172a] leading-[1.12]">
                  {t("landing.headline1", "Smart conversations,")}
                </h1>
                <p className="mt-5 text-lg text-[#475569] leading-relaxed max-w-[50ch]">
                  {t("landing.description", "ReplyEase AI is an autonomous conversational sales agent for e-commerce, reconciling live inventory and triggering instant VietQR checkouts 24/7 without overnight staff.")}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/auth/sign-up"
                    className="inline-flex h-12 items-center justify-center rounded-md bg-[#c2410c] px-6 text-base font-medium text-white hover:bg-[#9a3412] active:scale-[0.98] transition-colors"
                  >
                    {t("landing.startTrial", "Start 14-day free trial")}
                  </Link>
                  <a
                    href="#showcase"
                    className="inline-flex h-12 items-center justify-center rounded-md bg-[#f1f5f9] px-6 text-base font-medium text-[#0f172a] hover:bg-[#e2e8f0] transition-colors"
                  >
                    {t("landing.hero.exploreSimulation", "Explore live simulation")}
                  </a>
                </div>
              </div>

              {/* Center Performing Frame: Live Interface Reel */}
              <div className="lg:col-span-5 flex justify-center motion-target">
                <div
                  data-ui
                  className="w-full max-w-[440px] rounded-xl bg-[#f8f9fb] p-6"
                >
                  {/* Fragment Header */}
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#15803d]" />
                      <span className="text-sm font-medium text-[#0f172a]">
                        tracy-boutique.com
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[#166534] bg-[#dcfce7] px-2.5 py-0.5 rounded">
                      {t("landing.hero.online240ms", "Online, 240ms")}
                    </span>
                  </div>

                  {/* Customer Question */}
                  <div className="mt-2 p-4 rounded-lg bg-[#ffffff]">
                    <div className="flex items-center justify-between text-sm text-[#64748b] mb-1">
                      <span>{t("landing.hero.customerTitle", { id: "3928" }, "Customer #3928")}</span>
                      <span>02:14:10</span>
                    </div>
                    <p className="text-sm text-[#1e293b] leading-relaxed">
                      &ldquo;{t("landing.hero.heroDemoQuery", "Hi! Do you have the beige wool blazer in size L? How long does express delivery take?")}&rdquo;
                    </p>
                  </div>

                  {/* RAG pipeline trace */}
                  <div className="mt-4 p-3.5 rounded-lg bg-[#f1f5f9] text-sm text-[#475569] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#166534]">
                      <Check className="size-3.5 text-[#166534]" />
                      <span>{t("landing.hero.ragTrace", "RAG: Matched 2 passages in catalog-2026.pdf (0.94)")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#0f172a] font-medium">
                      <CornerDownRight className="size-3.5 text-[#c2410c]" />
                      <span>{t("landing.hero.inventoryTrace", "Inventory: 2 remaining, generated SePay VietQR 650,000 VND")}</span>
                    </div>
                  </div>

                  {/* Bot Reply */}
                  <div className="mt-4 p-4 rounded-lg bg-[#ffffff]">
                    <div className="flex items-center justify-between text-sm text-[#64748b] mb-1">
                      <span className="font-semibold text-[#c2410c]">{t("landing.hero.botTitle", "ReplyEase Assistant")}</span>
                      <span>02:14:11</span>
                    </div>
                    <p className="text-sm text-[#334155] leading-relaxed">
                      {t("landing.hero.heroDemoReply", "Yes! We currently have exactly 2 beige wool blazers in size L at our Central Warehouse. Express city delivery arrives within 2 hours. Here is your VietQR code to reserve yours right away:")}
                    </p>

                    {/* Dynamic VietQR Badge */}
                    <div className="mt-3 p-3.5 rounded-md bg-[#f1f5f9] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <QrCode className="size-4 text-[#c2410c]" />
                        <div className="text-left">
                          <div className="text-sm font-semibold text-[#0f172a]">
                            {t("landing.hero.vietqrBadge", "VietQR 650,000 VND")}
                          </div>
                          <div className="text-[13px] text-[#475569]">
                            {t("landing.hero.bankMemo", "MBBank, Memo: RE8841")}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-[#166534] bg-[#dcfce7] px-2.5 py-0.5 rounded">
                        {t("landing.hero.autoReconciled", "Auto-reconciled")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Half */}
              <div className="lg:col-span-3 text-left lg:text-right motion-target">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#0f172a] leading-[1.12]">
                  {t("landing.headline2", "instant checkouts.")}
                </h2>
                <div className="mt-5 space-y-3.5 text-base text-[#475569] lg:text-right">
                  <div className="flex items-center lg:justify-end gap-2 text-[#0f172a] font-medium">
                    <CheckCircle2 className="size-4 text-[#15803d]" />
                    <span>{t("landing.hero.benefit1", "0 abandoned orders at 2:00 AM")}</span>
                  </div>
                  <div className="flex items-center lg:justify-end gap-2 text-[#0f172a] font-medium">
                    <CheckCircle2 className="size-4 text-[#15803d]" />
                    <span>{t("landing.hero.benefit2", "Under 300 millisecond response")}</span>
                  </div>
                  <div className="flex items-center lg:justify-end gap-2 text-[#0f172a] font-medium">
                    <CheckCircle2 className="size-4 text-[#15803d]" />
                    <span>{t("landing.hero.benefit3", "5-minute SePay integration")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Showcase Section: Live Simulator with Controls (The One Live Thing) */}
        <section id="showcase" className="py-20 md:py-28 bg-[#f8f9fb]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mb-12 motion-target">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0f172a]">
                {t("landing.showcase.title", "Live Verification")}
              </h2>
              <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                {t("landing.showcase.subtitle", "Test real-time 240ms response latency and dynamic VietQR payment generation across actual retail customer scenarios.")}
              </p>
            </div>

            {/* Split Panel: 62% Simulation Output / 38% Interactive Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Area (62%): Live simulation chat viewport */}
              <div className="lg:col-span-7 motion-target">
                <div
                  data-ui
                  className="rounded-xl bg-[#ffffff] p-7"
                >
                  {/* Console Header */}
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded bg-[#f1f5f9] text-[#c2410c]">
                        <Bot className="size-4" />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-[#0f172a]">
                          {t("landing.showcase.runtimeTitle", "ReplyEase Agent Runtime")}
                        </div>
                        <div className="text-sm text-[#64748b]">
                          {t("landing.showcase.sessionLabel", { category: activeScenario.category, id: activeScenario.orderNumber }, `${activeScenario.category}, Session #${activeScenario.orderNumber}`)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#15803d]" />
                      <span className="text-sm font-medium text-[#15803d]">
                        {activeScenario.latencyMs}ms
                      </span>
                    </div>
                  </div>

                  {/* Dialogue Container */}
                  <div className="py-5 space-y-4">
                    {/* Customer Message */}
                    <div className="rounded-lg bg-[#f8fafc] p-4">
                      <div className="flex items-center justify-between text-sm text-[#64748b] mb-1.5">
                        <span className="font-medium text-[#0f172a]">{t("landing.showcase.visitor", "Website Visitor")}</span>
                        <span>{activeScenario.time}</span>
                      </div>
                      <p className="text-sm text-[#1e293b] leading-relaxed">
                        &ldquo;{activeScenario.customerQuery}&rdquo;
                      </p>
                    </div>

                    {/* RAG Knowledge Matching Engine Trace */}
                    <div className="p-3.5 rounded-lg bg-[#f1f5f9] text-sm space-y-1.5">
                      <div className="flex items-center justify-between text-[#475569]">
                        <span className="font-medium">{t("landing.showcase.ragSource", "RAG Matching Source:")}</span>
                        <span className="text-[#15803d] font-medium">{t("landing.showcase.confidence", { rate: activeScenario.confidence }, `Confidence ${activeScenario.confidence}`)}</span>
                      </div>
                      <div className="text-[#334155]">
                        {activeScenario.ragMatches}
                      </div>
                      <div className="text-sm text-[#0f172a] font-medium pt-1">
                        {t("landing.showcase.inventory", { status: activeScenario.inventoryStatus }, `Inventory: ${activeScenario.inventoryStatus}`)}
                      </div>
                    </div>

                    {/* AI Agent Response */}
                    <div className="rounded-lg bg-[#ffffff] p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-[#64748b]">
                        <span className="font-semibold text-[#c2410c]">{t("landing.hero.botTitle", "ReplyEase Assistant")}</span>
                        <span>{t("landing.showcase.delivered", { latency: activeScenario.latencyMs }, `Delivered (${activeScenario.latencyMs}ms)`)}</span>
                      </div>
                      <p className="text-sm text-[#1e293b] leading-relaxed">
                        {activeScenario.botReply}
                      </p>

                      {/* Payment Card / VietQR */}
                      {activeScenario.amount !== "0" && (
                        <div className="p-4 rounded-lg bg-[#f8fafc]">
                          <div className="flex items-center justify-between pb-3">
                            <div className="flex items-center gap-2">
                              <QrCode className="size-4 text-[#c2410c]" />
                              <span className="text-sm font-semibold text-[#0f172a]">
                                {t("landing.showcase.vietqrPayment", "VietQR SePay Payment")}
                              </span>
                            </div>
                            <span
                              className={`text-sm font-medium px-2.5 py-0.5 rounded ${
                                isPaid
                                  ? "bg-[#dcfce7] text-[#166534]"
                                  : "bg-[#fef3c7] text-[#b45309]"
                              }`}
                            >
                              {isPaid
                                ? t("landing.showcase.autoReconciledSePay", "Auto-Reconciled via SePay")
                                : t("landing.showcase.awaitingTransfer", "Awaiting Transfer")}
                            </span>
                          </div>

                          <div className="pt-3 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-[#64748b]">{t("landing.showcase.colProduct", "Product")}</div>
                              <div className="font-medium text-[#0f172a] truncate">
                                {activeScenario.productName}
                              </div>
                            </div>
                            <div>
                              <div className="text-[#64748b]">{t("landing.showcase.colAmount", "Transfer Amount")}</div>
                              <div className="font-semibold text-[#c2410c]">
                                {activeScenario.amount} VND
                              </div>
                            </div>
                            <div>
                              <div className="text-[#64748b]">{t("landing.showcase.colBank", "Bank")}</div>
                              <div className="font-medium text-[#0f172a]">
                                {activeScenario.bank}
                              </div>
                            </div>
                            <div>
                              <div className="text-[#64748b]">{t("landing.showcase.colMemo", "Transfer Memo")}</div>
                              <div className="font-medium text-[#0f172a]">
                                {activeScenario.account}
                              </div>
                            </div>
                          </div>

                          {/* Simulation Trigger inside the Card */}
                          <div className="mt-4 pt-3 flex items-center justify-between">
                            <span className="text-sm text-[#64748b]">
                              {t("landing.showcase.webhookSimulation", "Bank Webhook Simulation:")}
                            </span>
                            <button
                              type="button"
                              onClick={handleSimulatePayment}
                              disabled={isPaid}
                              className={`text-sm font-medium px-4 py-1.5 rounded transition-colors ${
                                isPaid
                                  ? "bg-[#dcfce7] text-[#166534] cursor-default"
                                  : "bg-[#0f172a] text-white hover:bg-[#334155] active:scale-[0.98]"
                              }`}
                            >
                              {isPaid
                                ? t("landing.showcase.simulatingSuccess", "Ding ding! Payment received")
                                : t("landing.showcase.simulateBtn", "Simulate 2s Payment")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 text-sm text-[#64748b]">
                    {t("landing.showcase.widgetScript", "Embedded widget script:")} <code className="bg-[#f1f5f9] px-2 py-0.5 rounded text-[#0f172a]">replyease.embed(&apos;{activeScenario.id}&apos;)</code>
                  </div>
                </div>
              </div>

              {/* Right Area (38%): Interactive Scenario Switchers */}
              <div className="lg:col-span-5 space-y-4 motion-target">
                <div className="text-base font-semibold text-[#0f172a] mb-2">
                  {t("landing.showcase.selectScenario", "Select interactive scenario:")}
                </div>

                {scenarios.map((sc) => {
                  const isSelected = activeScenario.id === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => handleSelectScenario(sc)}
                      className={`w-full text-left p-5 rounded-xl transition-colors motion-target ${
                        isSelected
                          ? "bg-[#f1f5f9] border-l-4 border-[#c2410c]"
                          : "bg-[#ffffff] hover:bg-[#f8f9fb]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#c2410c]">
                          {sc.category}
                        </span>
                        <span className="text-sm font-medium text-[#475569]">
                          {sc.latencyMs}ms
                        </span>
                      </div>
                      <div className="mt-1 text-base font-semibold text-[#0f172a]">
                        {sc.name}
                      </div>
                      <div className="mt-2 text-sm text-[#475569] line-clamp-2">
                        {sc.customerQuery}
                      </div>
                    </button>
                  );
                })}

                <div className="p-5 rounded-xl bg-[#ffffff] text-sm text-[#475569] leading-relaxed motion-target">
                  <div className="font-semibold text-[#0f172a] mb-1">
                    {t("landing.showcase.webhookTitle", "How SePay Webhook Operates")}
                  </div>
                  <p className="max-w-[55ch]">
                    {t("landing.showcase.webhookDesc", "When a shopper scans the VietQR, SePay detects balance fluctuations immediately and triggers a webhook to ReplyEase AI within 2 seconds to confirm the order directly in the chat window.")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. How It Works: Four Diverse Flow Stages */}
        <section id="how-it-works" className="py-20 md:py-28 bg-[#ffffff]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mb-14 motion-target">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0f172a]">
                {t("landing.process.title", "4-Step Activation Workflow")}
              </h2>
              <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                {t("landing.process.subtitle", "Launch an AI assistant that deeply understands your catalog and settles orders on your website in under 10 minutes.")}
              </p>
            </div>

            {/* Unified Workbench Card: how-it-works-one-card-four-fields */}
            <div className="rounded-xl bg-[#f8f9fb] p-6 lg:p-8 motion-target">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Field 1: Document indexing */}
                <div className="flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="text-base font-semibold text-[#0f172a] mb-2">
                      {t("landing.process.step1Title", "RAG Knowledge Base")}
                    </div>
                    <div className="space-y-2 text-sm text-[#475569]">
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#475569]">{t("landing.process.step1Ingested", "Ingested Catalog")}</div>
                        <div className="font-medium text-[#0f172a]">price-list-2026.xlsx</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#475569]">{t("landing.process.step1Status", "Status")}</div>
                        <div className="font-medium text-[#166534]">{t("landing.process.step1Vectors", "1,420 vectors indexed")}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-[#c2410c] mb-1">
                      {t("landing.process.step1Label", "Step one")}
                    </div>
                    <div className="text-base font-semibold text-[#0f172a] leading-snug">
                      {t("landing.process.step1Desc", "First, ingest catalog data into your private knowledge base.")}
                    </div>
                  </div>
                </div>

                {/* Field 2: Bank connection */}
                <div className="flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="text-base font-semibold text-[#0f172a] mb-2">
                      {t("landing.process.step2Title", "SePay Reconciliation Gateway")}
                    </div>
                    <div className="space-y-2 text-sm text-[#475569]">
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#475569]">{t("landing.process.step2Bank", "Receiving Bank")}</div>
                        <div className="font-medium text-[#0f172a]">MBBank (0988291001)</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#475569]">{t("landing.process.step2Webhook", "Webhook URL")}</div>
                        <code className="text-[#166534] text-sm">/api/v1/sepay/listen</code>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-[#c2410c] mb-1">
                      {t("landing.process.step2Label", "Step two")}
                    </div>
                    <div className="text-base font-semibold text-[#0f172a] leading-snug">
                      {t("landing.process.step2Desc", "Then connect your bank account and SePay gateway in 2 minutes.")}
                    </div>
                  </div>
                </div>

                {/* Field 3: Script embedding */}
                <div className="flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="text-base font-semibold text-[#0f172a] mb-2">
                      {t("landing.process.step3Title", "Embed Widget to Website")}
                    </div>
                    <div className="space-y-2 text-sm text-[#475569]">
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#475569]">{t("landing.process.step3Time", "Setup Time")}</div>
                        <div className="font-medium text-[#0f172a]">{t("landing.process.step3Speed", "30 seconds complete")}</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#0f172a] text-[#f8fafc] text-sm overflow-x-auto">
                        <code>&lt;script src=&quot;widget.js&quot;&gt;&lt;/script&gt;</code>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-[#c2410c] mb-1">
                      {t("landing.process.step3Label", "Step three")}
                    </div>
                    <div className="text-base font-semibold text-[#0f172a] leading-snug">
                      {t("landing.process.step3Desc", "Next, paste a single line of widget script into your website.")}
                    </div>
                  </div>
                </div>

                {/* Field 4: Order closed */}
                <div className="flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="text-base font-semibold text-[#0f172a] mb-2">
                      {t("landing.process.step4Title", "Autonomous Order Settle")}
                    </div>
                    <div className="space-y-2 text-sm text-[#475569]">
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#166534]">{t("landing.process.step4Status", "Status")}</div>
                        <div className="font-medium text-[#166534]">{t("landing.process.step4Received", "Received 650,000 VND via VietQR")}</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#475569]">{t("landing.process.step4Logistics", "Logistics")}</div>
                        <div className="font-medium text-[#0f172a]">{t("landing.process.step4Dispatched", "Dispatched to morning fulfillment shift")}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-[#c2410c] mb-1">
                      {t("landing.process.step4Label", "Step four")}
                    </div>
                    <div className="text-base font-semibold text-[#0f172a] leading-snug">
                      {t("landing.process.step4Desc", "Finally, your AI agent operates 24/7 and closes midnight orders.")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Authentic Commerce Photography Context */}
        <section className="py-20 md:py-24 bg-[#f8f9fb]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mb-12 motion-target">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0f172a]">
                {t("landing.operations.title", "Real-World Operations Across Brands")}
              </h2>
              <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                {t("landing.operations.subtitle", "ReplyEase AI powers retail stores and D2C brands from real-time customer consultation to warehouse packing stations.")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Photo 1: Saigon Boutique Store Interior */}
              <div className="space-y-3.5 motion-target">
                <div className="overflow-hidden rounded-xl bg-white">
                  <Image
                    src="/images/store-boutique.jpg"
                    alt="Minimalist designer fashion boutique showroom interior in Ho Chi Minh City"
                    width={1920}
                    height={1080}
                    className="w-full h-[320px] object-cover"
                  />
                </div>
                <div className="text-base font-medium text-[#0f172a]">
                  {t("landing.operations.photo1Title", "Fashion Boutique & Concept Store")}
                </div>
                <p className="text-sm text-[#64748b] leading-relaxed max-w-[50ch]">
                  {t("landing.operations.photo1Desc", "The AI assistant checks physical stock, recommends sizing based on height and weight, and generates instant VietQR payment codes throughout the night.")}
                </p>
              </div>

              {/* Photo 2: Night Dispatch & Fulfillment Table */}
              <div className="space-y-3.5 motion-target">
                <div className="overflow-hidden rounded-xl bg-white">
                  <Image
                    src="/images/fulfillment-station.jpg"
                    alt="Night shift e-commerce retail package dispatch and fulfillment table"
                    width={1920}
                    height={1080}
                    className="w-full h-[320px] object-cover"
                  />
                </div>
                <div className="text-base font-medium text-[#0f172a]">
                  {t("landing.operations.photo2Title", "Night Shift Packaging & Dispatch Station")}
                </div>
                <p className="text-sm text-[#64748b] leading-relaxed max-w-[50ch]">
                  {t("landing.operations.photo2Desc", "Orders placed between 11:00 PM and 5:00 AM are verified via SePay and auto-synced to logistics couriers for immediate morning dispatch.")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Features Section: Panel with Margin Notes */}
        <section id="features" className="py-20 md:py-28 bg-[#ffffff]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mb-16 motion-target">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0f172a]">
                {t("landing.architecture.title", "Deep Architecture")}
              </h2>
              <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                {t("landing.architecture.subtitle", "Engineered specifically for conversational commerce, nuanced Vietnamese phrasing, and domestic instant bank payments.")}
              </p>
            </div>

            {/* 3 Columns: Left 3 Notes | Center Panel | Right 3 Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Notes */}
              <div className="lg:col-span-3 space-y-8 motion-target">
                <div>
                  <div className="text-base font-semibold text-[#0f172a]">
                    {t("landing.architecture.f1Title", "Multi-Layer Retail RAG")}
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed max-w-[36ch]">
                    {t("landing.architecture.f1Desc", "Accurately understands Vietnamese regional phrasing, shorthand, and product variants with 99.8% precision.")}
                  </p>
                </div>
                <div>
                  <div className="text-base font-semibold text-[#0f172a]">
                    {t("landing.architecture.f2Title", "Instant SePay Reconciliation")}
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed max-w-[36ch]">
                    {t("landing.architecture.f2Desc", "Automatically parses transfer memos and delivers real-time confirmation notifications to customers within 2 seconds.")}
                  </p>
                </div>
                <div>
                  <div className="text-base font-semibold text-[#0f172a]">
                    {t("landing.architecture.f3Title", "Real-Time Inventory Audit")}
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed max-w-[36ch]">
                    {t("landing.architecture.f3Desc", "Directly syncs with live stock databases, eliminating out-of-stock misguidance.")}
                  </p>
                </div>
              </div>

              {/* Center Panel (data-ui) */}
              <div className="lg:col-span-6 motion-target">
                <div
                  data-ui
                  className="rounded-xl bg-[#f8f9fb] p-7"
                >
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-2">
                      <Sliders className="size-4 text-[#c2410c]" />
                      <span className="text-base font-semibold text-[#0f172a]">
                        {t("landing.architecture.panelTitle", "Agent Central Control Panel")}
                      </span>
                    </div>
                    <span className="text-sm bg-[#ffffff] px-2.5 py-1 rounded text-[#475569]">
                      v2.4-stable
                    </span>
                  </div>

                  <div className="py-4 space-y-4 text-sm">
                    <div className="p-4 rounded-lg bg-[#ffffff]">
                      <div className="text-sm font-semibold text-[#64748b] mb-1">
                        {t("landing.architecture.modelState", "Model State & System Prompt")}
                      </div>
                      <div className="text-[#0f172a] font-medium">
                        {t("landing.architecture.modelPrompt", "Retail Conversational RAG · Professional, courteous tone")}
                      </div>
                      <div className="text-sm text-[#64748b] mt-1">
                        {t("landing.architecture.modelTemp", "Temperature: 0.2 · Speculative answers strictly blocked")}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#ffffff]">
                      <div className="text-sm font-semibold text-[#64748b] mb-1">
                        {t("landing.architecture.bankingGateway", "Banking Gateway & SePay Webhook")}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#0f172a] font-medium">{t("landing.architecture.bankAccount", "MBBank (Account: 0988291001)")}</span>
                        <span className="text-sm font-medium text-[#166534] bg-[#dcfce7] px-2.5 py-0.5 rounded">
                          {t("landing.architecture.connected", "Connected")}
                        </span>
                      </div>
                      <div className="text-sm text-[#64748b] mt-1">
                        {t("landing.architecture.qrDesc", "Auto-generates dynamic Napas 247 QR codes per order")}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#ffffff]">
                      <div className="text-sm font-semibold text-[#64748b] mb-1">
                        {t("landing.architecture.escalation", "Emergency Staff Escalation")}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#0f172a] font-medium">{t("landing.architecture.escalationDesc", "Triggers when customer explicitly requests hotline assistance")}</span>
                        <span className="text-sm font-medium text-[#9a3412] bg-[#ffedd5] px-2.5 py-0.5 rounded">
                          {t("landing.architecture.handover", "1-Click Handover")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between text-sm text-[#64748b]">
                    <span>{t("landing.architecture.uptime", "Operational Uptime: 99.98%")}</span>
                    <span>{t("landing.architecture.avgLatency", "Average Latency: 240ms")}</span>
                  </div>
                </div>
              </div>

              {/* Right Notes */}
              <div className="lg:col-span-3 space-y-8 motion-target">
                <div>
                  <div className="text-base font-semibold text-[#0f172a]">
                    {t("landing.architecture.f4Title", "1-Touch Staff Handover")}
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed max-w-[36ch]">
                    {t("landing.architecture.f4Desc", "Detects complex disputes or custom inquiries and routes the full transcript to human agents within seconds.")}
                  </p>
                </div>
                <div>
                  <div className="text-base font-semibold text-[#0f172a]">
                    {t("landing.architecture.f5Title", "Zero-Data-Leak Privacy")}
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed max-w-[36ch]">
                    {t("landing.architecture.f5Desc", "Proprietary product data and customer records are isolated and never used for public model training.")}
                  </p>
                </div>
                <div>
                  <div className="text-base font-semibold text-[#0f172a]">
                    {t("landing.architecture.f6Title", "Conversion Intelligence")}
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed max-w-[36ch]">
                    {t("landing.architecture.f6Desc", "Tracks off-hour revenue volume, payment settlement speed, and customer satisfaction metrics.")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Stats Section: HTML Bar Chart & Metrics */}
        <section id="stats" className="py-20 md:py-28 bg-[#f8f9fb]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14 motion-target">
              <div className="lg:col-span-7">
                <div className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#0f172a]">
                  240ms
                </div>
                <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-[#0f172a]">
                  {t("landing.stats.avgLatencyTitle", "Average Latency per RAG Query")}
                </h2>
                <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                  {t("landing.stats.avgLatencyDesc", "Shoppers never wait for answers. The chart below illustrates automated order processing distributed across 24 hours.")}
                </p>
              </div>

              {/* Typographic Numbers Row without boxed card repetition */}
              <div className="lg:col-span-5 grid grid-cols-3 gap-6 text-left">
                <div className="motion-target">
                  <div className="text-3xl font-bold text-[#c2410c]">+38%</div>
                  <div className="text-sm text-[#64748b] mt-1">{t("landing.stats.nightOrders", "Nighttime orders")}</div>
                </div>
                <div className="motion-target">
                  <div className="text-3xl font-bold text-[#166534]">0</div>
                  <div className="text-sm text-[#64748b] mt-1">{t("landing.stats.zeroLostOrders", "Lost orders at 2:00 AM")}</div>
                </div>
                <div className="motion-target">
                  <div className="text-3xl font-bold text-[#0f172a]">99.8%</div>
                  <div className="text-sm text-[#64748b] mt-1">{t("landing.stats.sepayMatchRate", "SePay match rate")}</div>
                </div>
              </div>
            </div>

            {/* Interactive HTML Bar Chart (data-ui) */}
            <div
              data-ui
              className="p-7 rounded-xl bg-white motion-target"
            >
              <div className="flex items-center justify-between mb-6 text-sm text-[#64748b]">
                <span className="font-semibold text-[#0f172a]">
                  {t("landing.stats.chartTitle", "Hourly Consultation & Order Volume (00:00 - 23:00)")}
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded bg-[#c2410c]" />
                  <span className="font-semibold text-[#c2410c]">{t("landing.stats.chartLegendNight", "Night Shift Window (00:00 - 06:00: 100% Autonomous AI)")}</span>
                </span>
              </div>

              {/* 12 Bars representing hours */}
              <div className="grid grid-cols-12 gap-2 sm:gap-3 items-end h-52 pt-6 pb-2">
                {[
                  { hour: "00h", height: "48%", night: true, num: 142 },
                  { hour: "02h", height: "58%", night: true, num: 168 },
                  { hour: "04h", height: "42%", night: true, num: 115 },
                  { hour: "06h", height: "30%", night: false, num: 89 },
                  { hour: "08h", height: "65%", night: false, num: 210 },
                  { hour: "10h", height: "82%", night: false, num: 295 },
                  { hour: "12h", height: "92%", night: false, num: 340 },
                  { hour: "14h", height: "85%", night: false, num: 310 },
                  { hour: "16h", height: "78%", night: false, num: 275 },
                  { hour: "18h", height: "68%", night: false, num: 230 },
                  { hour: "20h", height: "95%", night: false, num: 360 },
                  { hour: "22h", height: "88%", night: false, num: 325 },
                ].map((bar, idx) => (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-[#0f172a] mb-1 whitespace-nowrap">
                      {t("landing.stats.ordersUnit", { count: bar.num }, `${bar.num} orders`)}
                    </div>
                    <div
                      style={{ height: bar.height }}
                      className={`w-full rounded-t transition-colors ${
                        bar.night
                          ? "bg-[#c2410c] hover:bg-[#9a3412]"
                          : "bg-[#e2e8f0] hover:bg-[#cbd5e1]"
                      }`}
                    />
                    <div className="text-sm font-medium text-[#64748b] mt-2">
                      {bar.hour}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 8. Pricing Section: Large Typographic Table */}
        <section id="pricing" className="py-20 md:py-28 bg-[#ffffff]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mb-14 motion-target">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-semibold text-[#c2410c] mb-3">
                <Sparkles className="size-3.5" />
                <span>{t("billing.title", "Plans & Pricing")}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0f172a]">
                {t("landing.pricing.title", "Transparent Pricing")}
              </h2>
              <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[55ch]">
                {t("billing.subtitle", "Choose the plan that fits your business scale. Instant SePay VietQR checkout, autonomous AI bots, and RAG search.")}
              </p>
            </div>

            {/* Desktop Table Comparison */}
            <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200/80 motion-target shadow-xs">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#f8f9fb] border-b border-slate-200/80">
                    <th className="p-6 text-base font-semibold text-[#0f172a] w-1/4 align-bottom">
                      {t("billing.featureComparison", "Feature Comparison")}
                    </th>
                    <th className="p-6 w-1/4 align-top">
                      <div className="text-lg font-bold text-[#0f172a]">Standard</div>
                      <div className="text-xs text-[#64748b] mt-0.5 min-h-[32px]">
                        {t("billing.plans.standard.tagline", "For individuals testing autonomous AI chatbots.")}
                      </div>
                      <div className="text-2xl font-extrabold text-[#0f172a] mt-2">0 VND</div>
                      <div className="text-xs text-[#64748b] font-medium">{t("billing.freeForever", "Free forever")}</div>
                    </th>
                    <th className="p-6 w-1/4 bg-[#f1f5f9] border-x border-slate-200/80 relative align-top">
                      <div className="absolute top-3 right-5">
                        <span className="inline-flex items-center gap-1 rounded bg-[#ffedd5] px-2.5 py-0.5 text-[11px] font-bold text-[#c2410c]">
                          <Sparkles className="size-3" />
                          {t("billing.plans.pro.badge", "Most Popular")}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-[#0f172a]">Pro</div>
                      <div className="text-xs text-[#64748b] mt-0.5 min-h-[32px]">
                        {t("billing.plans.pro.tagline", "Best choice for small & medium businesses automating sales.")}
                      </div>
                      <div className="text-2xl font-extrabold text-[#c2410c] mt-2">350.000 VND</div>
                      <div className="text-xs text-[#64748b] font-medium">{t("billing.periodMonth", "VND / month")}</div>
                    </th>
                    <th className="p-6 w-1/4 align-top">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-[#0f172a]">Ultimate</div>
                        <span className="inline-flex items-center gap-1 rounded bg-[#e2e8f0] px-2 py-0.5 text-[11px] font-bold text-[#334155]">
                          {t("billing.plans.ultimate.badge", "Enterprise Tier")}
                        </span>
                      </div>
                      <div className="text-xs text-[#64748b] mt-0.5 min-h-[32px]">
                        {t("billing.plans.ultimate.tagline", "For high-volume retail stores and e-commerce enterprises.")}
                      </div>
                      <div className="text-2xl font-extrabold text-[#0f172a] mt-2">850.000 VND</div>
                      <div className="text-xs text-[#64748b] font-medium">{t("billing.periodMonth", "VND / month")}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-200/70">
                  <tr>
                    <td className="p-5 font-semibold text-[#0f172a]">{t("dashboard.domainQuota", "Connected Domains Quota")}</td>
                    <td className="p-5 text-[#475569]">
                      <span className="font-semibold text-[#0f172a]">{t("landing.pricing.domainsCount", { count: 1 }, "1 Website")}</span>
                    </td>
                    <td className="p-5 bg-[#f1f5f9]/70 border-x border-slate-200/80">
                      <span className="font-bold text-[#0f172a]">{t("landing.pricing.domainsCount", { count: 5 }, "5 Websites")}</span>
                    </td>
                    <td className="p-5 text-[#475569]">
                      <span className="font-bold text-[#0f172a]">{t("landing.pricing.domainsCount", { count: 10 }, "10 Websites")}</span>
                    </td>
                  </tr>
                  <tr className="bg-[#f8f9fb]/60">
                    <td className="p-5 font-semibold text-[#0f172a]">{t("billing.creditsUnit", "AI Chat Credits")}</td>
                    <td className="p-5 text-[#475569]">
                      <span className="font-semibold text-[#0f172a]">{t("landing.pricing.creditsCount", { count: "100" }, "100 credits")}</span>
                    </td>
                    <td className="p-5 bg-[#f1f5f9]/70 border-x border-slate-200/80">
                      <span className="font-bold text-[#c2410c]">{t("landing.pricing.creditsCount", { count: "500" }, "500 credits")}</span>
                    </td>
                    <td className="p-5 text-[#475569]">
                      <span className="font-bold text-[#0f172a]">{t("landing.pricing.creditsCount", { count: "5,000" }, "5,000 credits")}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-semibold text-[#0f172a]">{t("settings.tabs.training", "AI Knowledge Training")}</td>
                    <td className="p-5 text-[#475569]">{t("billing.plans.standard.f3", "Automated AI Bot responses")}</td>
                    <td className="p-5 font-medium text-[#0f172a] bg-[#f1f5f9]/70 border-x border-slate-200/80">
                      {t("billing.plans.pro.f3", "AI Sales Bot + Pinecone Vector RAG")}
                    </td>
                    <td className="p-5 text-[#475569]">
                      {t("billing.plans.ultimate.f3", "Pinecone RAG Hybrid Search with maximum accuracy")}
                    </td>
                  </tr>
                  <tr className="bg-[#f8f9fb]/60">
                    <td className="p-5 font-semibold text-[#0f172a]">SePay VietQR</td>
                    <td className="p-5 text-[#475569]">{t("billing.plans.standard.f6", "Automated order VietQR creation")}</td>
                    <td className="p-5 font-medium text-[#0f172a] bg-[#f1f5f9]/70 border-x border-slate-200/80">
                      {t("billing.plans.pro.f6", "Automated SePay VietQR payment gateway")}
                    </td>
                    <td className="p-5 text-[#475569]">
                      {t("billing.plans.ultimate.f6", "Dedicated SePay Gateway with high-speed Webhook")}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-semibold text-[#0f172a]">{t("billing.liveMessenger", "Live Messenger & Human Takeover")}</td>
                    <td className="p-5 text-[#475569]">{t("billing.plans.standard.f4", "Capture lead emails")}</td>
                    <td className="p-5 font-medium text-[#0f172a] bg-[#f1f5f9]/70 border-x border-slate-200/80">
                      {t("billing.plans.pro.f5", "Instant Live Messenger & Human Takeover")}
                    </td>
                    <td className="p-5 text-[#475569]">
                      {t("billing.plans.ultimate.f5", "Multi-agent real-time human chat queue")}
                    </td>
                  </tr>
                  <tr className="bg-[#f8f9fb]/60">
                    <td className="p-5 font-semibold text-[#0f172a]">{t("marketing.title", "Email Marketing & Leads")}</td>
                    <td className="p-5 text-[#475569]">{t("billing.plans.standard.f4", "Capture lead emails")}</td>
                    <td className="p-5 font-medium text-[#0f172a] bg-[#f1f5f9]/70 border-x border-slate-200/80">
                      {t("billing.plans.pro.f7", "Order Management & Appointment Booking")}
                    </td>
                    <td className="p-5 text-[#475569]">
                      {t("billing.plans.ultimate.f7", "Real-time revenue analytics & CSV export")}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-semibold text-[#0f172a]">{t("billing.supportIntegration", "Support & Integration")}</td>
                    <td className="p-5 text-[#475569]">{t("billing.plans.standard.f8", "Community support")}</td>
                    <td className="p-5 font-medium text-[#0f172a] bg-[#f1f5f9]/70 border-x border-slate-200/80">
                      {t("billing.plans.pro.f8", "Priority technical support via email")}
                    </td>
                    <td className="p-5 text-[#475569]">
                      {t("billing.plans.ultimate.f8", "24/7 dedicated support via hotline & Telegram")}
                    </td>
                  </tr>
                  <tr className="bg-[#f8f9fb] border-t border-slate-200/80">
                    <td className="p-6"></td>
                    <td className="p-6">
                      <Link
                        href="/auth/sign-up"
                        className="inline-flex w-full h-11 items-center justify-center rounded-md bg-[#0f172a] text-white text-sm font-medium hover:bg-[#334155] transition-colors"
                      >
                        {t("landing.startTrial", "Start 14-day free trial")}
                      </Link>
                    </td>
                    <td className="p-6 bg-[#f1f5f9] border-x border-slate-200/80">
                      <Link
                        href="/auth/sign-up"
                        className="inline-flex w-full h-11 items-center justify-center gap-1.5 rounded-md bg-[#c2410c] text-white text-sm font-semibold hover:bg-[#9a3412] transition-colors shadow-sm"
                      >
                        <Zap className="size-4 fill-current" />
                        <span>{t("billing.plans.upgradeBtn", { plan: "Pro" }, "Upgrade to Pro")}</span>
                      </Link>
                    </td>
                    <td className="p-6">
                      <Link
                        href="/auth/sign-up"
                        className="inline-flex w-full h-11 items-center justify-center rounded-md bg-[#0f172a] text-white text-sm font-medium hover:bg-[#334155] transition-colors"
                      >
                        {t("billing.plans.upgradeBtn", { plan: "Ultimate" }, "Upgrade to Ultimate")}
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Stack */}
            <div className="lg:hidden space-y-6 motion-target">
              {[
                {
                  id: "STANDARD",
                  name: "Standard",
                  tagline: t("billing.plans.standard.tagline", "For individuals testing autonomous AI chatbots."),
                  price: "0 VND",
                  period: t("billing.freeForever", "Free forever"),
                  domains: t("landing.pricing.domainsCount", { count: 1 }, "1 Website / Domain"),
                  credits: t("landing.pricing.creditsCount", { count: "100" }, "100 AI Chat Credits"),
                  features: [
                    t("billing.plans.standard.f1", "1 Connected Website / Domain"),
                    t("billing.plans.standard.f2", "100 Initial AI Chat Credits"),
                    t("billing.plans.standard.f3", "Automated AI Bot responses"),
                    t("billing.plans.standard.f4", "Capture lead emails"),
                    t("billing.plans.standard.f6", "Automated order VietQR creation"),
                    t("billing.plans.standard.f7", "Manual payment reconciliation"),
                    t("billing.plans.standard.f5", "Simple iframe widget embed"),
                    t("billing.plans.standard.f8", "Community support"),
                  ],
                  cta: t("landing.startTrial", "Start 14-day free trial"),
                  recommended: false,
                },
                {
                  id: "PRO",
                  name: "Pro",
                  badge: t("billing.plans.pro.badge", "Most Popular"),
                  tagline: t("billing.plans.pro.tagline", "Best choice for small & medium businesses automating sales."),
                  price: "350,000 VND",
                  period: t("billing.periodMonth", "VND / month"),
                  domains: t("landing.pricing.domainsCount", { count: 5 }, "5 Websites / Domains"),
                  credits: t("landing.pricing.creditsCount", { count: "500" }, "500 AI Chat Credits"),
                  features: [
                    t("billing.plans.pro.f1", "5 Connected Websites / Domains"),
                    t("billing.plans.pro.f2", "500 AI Chat Credits monthly"),
                    t("billing.plans.pro.f3", "AI Sales Bot + Pinecone Vector RAG"),
                    t("billing.plans.pro.f4", "Advanced HelpDesk FAQ training"),
                    t("billing.plans.pro.f6", "Automated SePay VietQR payment gateway"),
                    t("billing.plans.pro.f5", "Instant Live Messenger & Human Takeover"),
                    t("billing.plans.pro.f7", "Order Management & Appointment Booking"),
                    t("billing.plans.pro.f8", "Priority technical support via email"),
                  ],
                  cta: t("billing.plans.upgradeBtn", { plan: "Pro" }, "Upgrade to Pro"),
                  recommended: true,
                },
                {
                  id: "ULTIMATE",
                  name: "Ultimate",
                  badge: t("billing.plans.ultimate.badge", "Enterprise Tier"),
                  tagline: t("billing.plans.ultimate.tagline", "For high-volume retail stores and e-commerce enterprises."),
                  price: "850,000 VND",
                  period: t("billing.periodMonth", "VND / month"),
                  domains: t("landing.pricing.domainsCount", { count: 10 }, "10 Websites / Domains"),
                  credits: t("landing.pricing.creditsCount", { count: "5,000" }, "5,000 AI Chat Credits"),
                  features: [
                    t("billing.plans.ultimate.f1", "10 Connected Websites / Domains"),
                    t("billing.plans.ultimate.f2", "5,000 AI Chat Credits monthly"),
                    t("billing.plans.ultimate.f3", "Pinecone RAG Hybrid Search with maximum accuracy"),
                    t("billing.plans.ultimate.f4", "Unlimited FAQ & Lead qualifier questions"),
                    t("billing.plans.ultimate.f6", "Dedicated SePay Gateway with high-speed Webhook"),
                    t("billing.plans.ultimate.f5", "Multi-agent real-time human chat queue"),
                    t("billing.plans.ultimate.f7", "Real-time revenue analytics & CSV export"),
                    t("billing.plans.ultimate.f8", "24/7 dedicated support via hotline & Telegram"),
                  ],
                  cta: t("billing.plans.upgradeBtn", { plan: "Ultimate" }, "Upgrade to Ultimate"),
                  recommended: false,
                },
              ].map((tier, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-xl border transition-all ${
                    tier.recommended
                      ? "bg-[#f8fafc] border-[#c2410c] shadow-md relative"
                      : "bg-[#f8f9fb] border-slate-200/80"
                  }`}
                >
                  {tier.badge && (
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1 rounded bg-[#ffedd5] px-2.5 py-0.5 text-xs font-bold text-[#c2410c]">
                        <Sparkles className="size-3" />
                        {tier.badge}
                      </span>
                    </div>
                  )}
                  <div className="text-xl font-bold text-[#0f172a]">{tier.name}</div>
                  <p className="text-xs text-[#64748b] mt-1">{tier.tagline}</p>

                  <div className="mt-4 pb-4 border-b border-slate-200/80">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-[#0f172a]">
                        {tier.price}
                      </span>
                      <span className="text-xs text-[#64748b] font-medium">
                        / {tier.period}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-[#475569] flex flex-wrap gap-x-3 gap-y-1">
                      <span>{t("common.limit", "Limit")}: <strong className="text-[#0f172a]">{tier.domains}</strong></span>
                      <span>•</span>
                      <span>{t("billing.currentCredits", "Credits")}: <strong className="text-[#0f172a]">{tier.credits}</strong></span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <div className="text-xs font-semibold text-[#0f172a] uppercase tracking-wider">
                      {t("billing.plans.featuresIncluded", "Features included:")}
                    </div>
                    <ul className="space-y-2 text-xs text-[#475569]">
                      {tier.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <Check className="size-4 text-[#15803d] shrink-0 mt-0.5" />
                          <span className="leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/auth/sign-up"
                    className={`mt-6 inline-flex w-full h-11 items-center justify-center gap-1.5 rounded-md text-sm font-semibold transition-colors ${
                      tier.recommended
                        ? "bg-[#c2410c] text-white hover:bg-[#9a3412] shadow-sm"
                        : "bg-[#0f172a] text-white hover:bg-[#334155]"
                    }`}
                  >
                    {tier.recommended && <Zap className="size-3.5 fill-current" />}
                    <span>{tier.cta}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. FAQ Section: Accordion of Filled Tiles */}
        <section id="faq" className="py-20 md:py-28 bg-[#f8f9fb]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Sticky Heading */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 motion-target">
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0f172a]">
                  {t("landing.faq.title", "Frequently Asked Questions")}
                </h2>
                <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                  {t("landing.faq.subtitle", "Clear answers regarding RAG architecture, SePay payment integration, and data confidentiality.")}
                </p>
              </div>

              {/* Accordion Tiles */}
              <div className="lg:col-span-8 space-y-3.5 motion-target">
                {[
                  {
                    q: t("landing.faq.q1", "How does ReplyEase AI differ from traditional rule-based chatbots?"),
                    a: t("landing.faq.a1", "Traditional chatbots rely on rigid decision trees and fail when a customer phrases something unexpectedly. ReplyEase AI leverages large language models augmented with RAG to deeply understand product literature, converse naturally, and compute dynamic VietQR payment codes tailored to each order."),
                  },
                  {
                    q: t("landing.faq.q2", "Is SePay VietQR integration secure, and does it require bank credentials?"),
                    a: t("landing.faq.a2", "Completely secure. ReplyEase AI and SePay only monitor incoming balance fluctuation webhooks (read-only transaction alerts). We have zero access to initiate transactions or transfer funds from your account. You maintain full ownership and control of your banking."),
                  },
                  {
                    q: t("landing.faq.q3", "What data should I prepare to train my AI assistant?"),
                    a: t("landing.faq.a3", "Simply upload existing store materials: Excel price lists, product PDFs, shipping and return policies, or your public website URL. The system automatically chunks and indexes your documents in under 3 minutes."),
                  },
                  {
                    q: t("landing.faq.q4", "When does a human sales representative need to step in?"),
                    a: t("landing.faq.a4", "When the AI identifies strong customer frustration, questions outside the uploaded knowledge base, or an explicit request to speak with staff, ReplyEase AI automatically triggers an urgent handover alert via Telegram, Zalo, or Email with the full conversation history."),
                  },
                  {
                    q: t("landing.faq.q5", "Can I test the platform for free before committing to a paid plan?"),
                    a: t("landing.faq.a5", "Yes. You can start immediately with our Standard Free plan (1 website, 100 AI Chat credits) with no credit card required. When your sales scale up, upgrade anytime to Pro (350,000 VND/mo for 5 domains & 500 credits) or Ultimate (850,000 VND/mo for 10 domains & 5,000 credits)."),
                  },
                  {
                    q: t("landing.faq.q6", "How long does it take to embed ReplyEase AI into an active website?"),
                    a: t("landing.faq.a6", "Approximately 5 minutes. Simply copy a single JavaScript widget snippet from your dashboard and paste it before the closing body tag. It works directly with WordPress, Shopify, Haravan, Sapo, Next.js, and custom web stacks."),
                  },
                ].map((item, idx) => (
                  <details
                    key={idx}
                    name="faq"
                    className="group rounded-xl bg-white p-6 open:bg-[#ffffff] transition-colors motion-target"
                  >
                    <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-[#0f172a] list-none">
                      <span>{item.q}</span>
                      <span className="ml-4 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] group-open:rotate-45 transition-transform text-sm font-bold">
                        +
                      </span>
                    </summary>
                    <div className="mt-4 text-base text-[#475569] leading-relaxed pr-6 pt-3 max-w-[65ch]">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 10. CTA Section: Balanced Grid Closing Form */}
        <section className="py-24 md:py-32 bg-[#ffffff]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Form & Heading */}
              <div className="lg:col-span-7 motion-target">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#0f172a] leading-snug">
                  {t("landing.cta.title", "Automate Conversational Sales with ReplyEase AI")}
                </h2>
                <p className="mt-4 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                  {t("landing.cta.subtitle", "Start your 14-day free trial. Ensure your customers are guided and checked out even while you sleep.")}
                </p>

                {/* Inline form */}
                <form onSubmit={handleCtaSubmit} className="mt-8">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="email"
                      required
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      placeholder={t("landing.cta.emailPlaceholder", "Enter your business email...")}
                      className="h-13 px-5 rounded-md bg-[#f8fafc] text-base text-[#0f172a] placeholder-[#94a3b8] focus:outline-none w-full sm:w-[360px]"
                    />
                    <button
                      type="submit"
                      className="h-13 px-7 rounded-md bg-[#c2410c] text-white text-base font-medium hover:bg-[#9a3412] active:scale-[0.98] transition-colors shrink-0"
                    >
                      {t("landing.cta.submitBtn", "Start 14-day free trial")}
                    </button>
                  </div>
                  {ctaSubmitted && (
                    <p className="mt-3 text-sm text-[#166534] font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="size-4" />
                      {t("landing.cta.successMsg", { email: inputEmail }, `Thank you! The ReplyEase team will deliver your trial workspace to ${inputEmail} shortly.`)}
                    </p>
                  )}
                </form>

                <p className="mt-4 text-sm text-[#64748b]">
                  {t("landing.cta.footnote", "No credit card required. Live in 5 minutes with dedicated technical onboarding.")}
                </p>
              </div>

              {/* Right Column: Balancing Service Guarantees Card (Closes the Void) */}
              <div className="lg:col-span-5 motion-target">
                <div
                  data-ui
                  className="p-8 rounded-xl bg-[#f8f9fb] space-y-6"
                >
                  <div className="text-base font-semibold text-[#0f172a]">
                    {t("landing.cta.guaranteesTitle", "Enterprise-Grade Commitments")}
                  </div>
                  <div className="space-y-4 text-sm text-[#475569]">
                    <div className="space-y-1">
                      <div className="font-medium text-[#0f172a]">{t("landing.cta.g1Title", "RAG Data Confidentiality")}</div>
                      <div className="text-sm text-[#64748b]">{t("landing.cta.g1Desc", "Strict isolation of internal product databases and customer transaction records")}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-[#0f172a]">{t("landing.cta.g2Title", "High-Speed Infrastructure")}</div>
                      <div className="text-sm text-[#64748b]">{t("landing.cta.g2Desc", "240ms benchmark latency hosted in domestic tier-3 clusters with zero packet loss")}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-[#0f172a]">{t("landing.cta.g3Title", "1-on-1 Technical Onboarding")}</div>
                      <div className="text-sm text-[#64748b]">{t("landing.cta.g3Desc", "Dedicated engineers to connect your SePay webhook and embed the widget script")}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 11. Footer: Row of Tiles */}
      <footer className="bg-[#f8f9fb] pt-14 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="sr-only">Contact information and legal copyright</h2>

          {/* Upper Section: Editorial Navigation & Operations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-10 motion-target">
            {/* Mission */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-base font-semibold text-[#0f172a]">
                ReplyEase AI
              </div>
              <p className="text-sm text-[#475569] leading-relaxed max-w-[45ch]">
                {t("landing.footer.desc", "ReplyEase AI is the premier conversational customer support and automated SePay VietQR checkout platform for modern e-commerce brands.")}
              </p>
              <div className="text-sm text-[#64748b]">
                {t("landing.footer.copyright", "© 2026 ReplyEase AI. All rights reserved.")}
              </div>
            </div>

            {/* Nav */}
            <div className="lg:col-span-2 space-y-2 text-sm">
              <div className="font-semibold text-[#0f172a] mb-3">{t("landing.footer.navTitle", "Navigation")}</div>
              <div><a href="#showcase" className="text-[#475569] hover:text-[#c2410c] transition-colors">{t("landing.nav.experience", "Experience")}</a></div>
              <div><a href="#how-it-works" className="text-[#475569] hover:text-[#c2410c] transition-colors">{t("landing.nav.process", "Process")}</a></div>
              <div><a href="#pricing" className="text-[#475569] hover:text-[#c2410c] transition-colors">{t("landing.nav.pricing", "Pricing")}</a></div>
              <div><a href="#faq" className="text-[#475569] hover:text-[#c2410c] transition-colors">{t("landing.nav.faq", "FAQ")}</a></div>
            </div>

            {/* Operations */}
            <div className="lg:col-span-3 space-y-2 text-sm">
              <div className="font-semibold text-[#0f172a] mb-3">{t("landing.footer.officesTitle", "Offices & Operating Hours")}</div>
              <div className="text-[#0f172a] font-medium">{t("landing.footer.cities", "Hanoi & Ho Chi Minh City")}</div>
              <div className="text-[#64748b]">{t("landing.footer.timezone", "Indochina Time (GMT+7)")}</div>
              <div className="text-[#166534] font-medium flex items-center gap-2 pt-1">
                <span className="size-2 rounded-full bg-[#15803d]" />
                {t("landing.footer.uptimeBadge", "Systems operating 24/7/365")}
              </div>
            </div>

            {/* Support */}
            <div className="lg:col-span-3 space-y-2 text-sm">
              <div className="font-semibold text-[#0f172a] mb-3">{t("landing.footer.supportTitle", "Support & Integrations")}</div>
              <div className="font-medium text-[#0f172a]">support@replyease.ai</div>
              <div className="text-[#475569]">{t("landing.footer.supportHotline", "1900 8899 (24/7 Support)")}</div>
              <div className="text-[#64748b] text-[13px] pt-1">{t("landing.footer.supportAdvisory", "Custom API and webhook advisory")}</div>
            </div>
          </div>

          {/* Lower Row: Wordmark Tile + Accent Action Tile */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Wordmark Tile (col 1–8) */}
            <div className="lg:col-span-8 p-8 rounded-xl bg-[#0f172a] text-white flex flex-col justify-between min-h-[160px] motion-target">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md overflow-hidden bg-white/10 shrink-0">
                  <Image
                    src="/icons/logo.png"
                    alt="ReplyEase AI"
                    width={28}
                    height={28}
                    className="size-full object-contain"
                  />
                </div>
                <span className="text-sm font-semibold text-[#94a3b8]">
                  {t("landing.footer.enterpriseTitle", "ReplyEase AI Enterprise")}
                </span>
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white mt-4">
                ReplyEase AI
              </div>
            </div>

            {/* Accent Action Tile (col 9–12) */}
            <Link
              href="/auth/sign-up"
              className="lg:col-span-4 p-8 rounded-xl bg-[#c2410c] text-white flex flex-col justify-between min-h-[160px] hover:bg-[#9a3412] transition-colors group motion-target"
            >
              <div className="text-lg font-semibold leading-snug">
                {t("landing.footer.startTrial", "Start your 14-day free trial")}
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-white/90">
                  {t("landing.footer.live5Min", "Live in 5 minutes")}
                </span>
                <ArrowUpRight className="size-6 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
