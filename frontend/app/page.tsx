"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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

const SCENARIOS: Scenario[] = [
  {
    id: "blazer",
    name: "Size Consultation & Stock Check",
    category: "Women's Apparel",
    customerQuery: "Hi! Do you have the beige wool blazer in size L? How long does express delivery take within the city?",
    time: "02:14:18",
    ragMatches: "autumn-winter-catalog-2026.pdf (Page 14)",
    confidence: "99.4%",
    inventoryStatus: "Size L: 2 items in stock, Central Warehouse",
    botReply: "Yes! We currently have exactly 2 beige wool blazers in size L at our Central Warehouse. Express city delivery arrives within 2 hours. I have generated a VietQR code below so you can reserve yours right away!",
    orderNumber: "RE-8841",
    amount: "650,000",
    account: "RE8841",
    bank: "MBBank",
    productName: "Wool Blend Blazer Beige - Size L",
    latencyMs: 240,
  },
  {
    id: "serum",
    name: "Ingredients & Promo Inquiry",
    category: "Cosmetics & Skincare",
    customerQuery: "Is the B5 serum greasy for acne-prone oily skin? Are there any active discount codes?",
    time: "23:45:02",
    ragMatches: "b5-product-guide.pdf & october-promotions.docx",
    confidence: "98.9%",
    inventoryStatus: "In Stock (54 units), includes complimentary toner pad",
    botReply: "The B5 Recovery Serum features a lightweight watery-gel texture that absorbs in 30 seconds without clogging pores. Today's orders qualify for promo code SAVE50K plus a free 30-sheet Toner Pad valued at 120,000 VND!",
    orderNumber: "RE-8842",
    amount: "420,000",
    account: "RE8842",
    bank: "Techcombank",
    productName: "B5 Recovery Serum 50ml + Toner Pad",
    latencyMs: 228,
  },
  {
    id: "camera",
    name: "Technical Specs & VAT Invoice",
    category: "Tech & Hardware",
    customerQuery: "Does this outdoor camera include a memory card? My company needs an electronic VAT invoice.",
    time: "01:28:44",
    ragMatches: "vat-invoice-policy.pdf & specs-camera-pro.pdf",
    confidence: "99.7%",
    inventoryStatus: "In Stock (18 units), e-VAT supported",
    botReply: "The AI Pro Outdoor Camera includes a SanDisk 64GB card with a 24-month warranty. We automatically issue e-VAT invoices to your company email right after payment reconciliation.",
    orderNumber: "RE-8843",
    amount: "1,290,000",
    account: "RE8843",
    bank: "Vietcombank",
    productName: "Camera AI Smart outdoor 2K + 64GB",
    latencyMs: 252,
  },
  {
    id: "warranty",
    name: "Exchange & Warranty Policy",
    category: "Customer Support",
    customerQuery: "If I ordered the wrong size, what is your exchange procedure?",
    time: "03:10:12",
    ragMatches: "return-exchange-policy.pdf (Clause 3)",
    confidence: "99.1%",
    inventoryStatus: "Free size exchange within 7 days",
    botReply: "We offer 100% free doorstep size exchanges within 7 days of delivery. The courier will bring the new size and collect the original item at your door simultaneously—no post office visit required.",
    orderNumber: "RE-8844",
    amount: "0",
    account: "SUPPORT-RE",
    bank: "MBBank",
    productName: "Doorstep Exchange Service",
    latencyMs: 215,
  },
];

export default function HomePage() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [inputEmail, setInputEmail] = useState<string>("");
  const [ctaSubmitted, setCtaSubmitted] = useState<boolean>(false);

  useEffect(() => {
    // Choreographed entrance and scroll motion
    const animateAll = () => {
      const items = document.querySelectorAll<HTMLElement>(".motion-target");
      items.forEach((item, idx) => {
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
    setActiveScenario(sc);
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
      <header className="sticky top-0 z-50 bg-[#ffffff] overflow-x-clip">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between motion-target">
          {/* Wordmark */}
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#c2410c] text-white">
              <Bot className="size-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xl tracking-tight text-[#0f172a]">
                ReplyEase
              </span>
              <span className="rounded bg-[#f1f5f9] px-2 py-0.5 text-sm font-semibold text-[#c2410c]">
                AI
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-base font-medium text-[#475569]">
            <a href="#showcase" className="hover:text-[#0f172a] transition-colors">
              Experience
            </a>
            <a href="#how-it-works" className="hover:text-[#0f172a] transition-colors">
              Process
            </a>
            <a href="#features" className="hover:text-[#0f172a] transition-colors">
              Architecture
            </a>
            <a href="#stats" className="hover:text-[#0f172a] transition-colors">
              Performance
            </a>
            <a href="#pricing" className="hover:text-[#0f172a] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#0f172a] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Primary Action */}
          <div className="flex items-center gap-4 sm:gap-5">
            <Link
              href="/auth/sign-in"
              className="text-sm font-medium text-[#475569] hover:text-[#0f172a] hidden sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#c2410c] px-5 text-sm font-medium text-white hover:bg-[#9a3412] active:scale-[0.98] transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 2. Hero Section: Sentence split by frame */}
        <section className="relative pt-10 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-[#ffffff]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* First Half */}
              <div className="lg:col-span-4 text-left motion-target">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#0f172a] leading-[1.12]">
                  Smart conversations,
                </h1>
                <p className="mt-5 text-lg text-[#475569] leading-relaxed max-w-[50ch]">
                  ReplyEase AI is an autonomous conversational sales agent for e-commerce, reconciling live inventory and triggering instant VietQR checkouts 24/7 without overnight staff.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/auth/sign-up"
                    className="inline-flex h-12 items-center justify-center rounded-md bg-[#c2410c] px-6 text-base font-medium text-white hover:bg-[#9a3412] active:scale-[0.98] transition-colors"
                  >
                    Start 14-day free trial
                  </Link>
                  <a
                    href="#showcase"
                    className="inline-flex h-12 items-center justify-center rounded-md bg-[#f1f5f9] px-6 text-base font-medium text-[#0f172a] hover:bg-[#e2e8f0] transition-colors"
                  >
                    Explore live simulation
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
                      Online, 240ms
                    </span>
                  </div>

                  {/* Customer Question */}
                  <div className="mt-2 p-4 rounded-lg bg-[#ffffff]">
                    <div className="flex items-center justify-between text-sm text-[#64748b] mb-1">
                      <span>Customer #3928</span>
                      <span>02:14:10</span>
                    </div>
                    <p className="text-sm text-[#1e293b] leading-relaxed">
                      &ldquo;Hi! Do you have the beige wool blazer in size L? How long does express delivery take?&rdquo;
                    </p>
                  </div>

                  {/* RAG pipeline trace */}
                  <div className="mt-4 p-3.5 rounded-lg bg-[#f1f5f9] text-sm text-[#475569] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#166534]">
                      <Check className="size-3.5 text-[#166534]" />
                      <span>RAG: Matched 2 passages in catalog-2026.pdf (0.94)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#0f172a] font-medium">
                      <CornerDownRight className="size-3.5 text-[#c2410c]" />
                      <span>Inventory: 2 remaining, generated SePay VietQR 650,000 VND</span>
                    </div>
                  </div>

                  {/* Bot Reply */}
                  <div className="mt-4 p-4 rounded-lg bg-[#ffffff]">
                    <div className="flex items-center justify-between text-sm text-[#64748b] mb-1">
                      <span className="font-semibold text-[#c2410c]">ReplyEase Assistant</span>
                      <span>02:14:11</span>
                    </div>
                    <p className="text-sm text-[#334155] leading-relaxed">
                      Yes! We currently have exactly 2 beige wool blazers in size L at our Central Warehouse. Express city delivery arrives within 2 hours. Here is your VietQR code to reserve yours right away:
                    </p>

                    {/* Dynamic VietQR Badge */}
                    <div className="mt-3 p-3.5 rounded-md bg-[#f1f5f9] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <QrCode className="size-4 text-[#c2410c]" />
                        <div className="text-left">
                          <div className="text-sm font-semibold text-[#0f172a]">
                            VietQR 650,000 VND
                          </div>
                          <div className="text-[13px] text-[#475569]">
                            MBBank, Memo: RE8841
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-[#166534] bg-[#dcfce7] px-2.5 py-0.5 rounded">
                        Auto-reconciled
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Half */}
              <div className="lg:col-span-3 text-left lg:text-right motion-target">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#0f172a] leading-[1.12]">
                  instant checkout.
                </h2>
                <div className="mt-5 space-y-3.5 text-base text-[#475569] lg:text-right">
                  <div className="flex items-center lg:justify-end gap-2 text-[#0f172a] font-medium">
                    <CheckCircle2 className="size-4 text-[#15803d]" />
                    <span>0 abandoned orders at 2:00 AM</span>
                  </div>
                  <div className="flex items-center lg:justify-end gap-2 text-[#0f172a] font-medium">
                    <CheckCircle2 className="size-4 text-[#15803d]" />
                    <span>Under 300 millisecond response</span>
                  </div>
                  <div className="flex items-center lg:justify-end gap-2 text-[#0f172a] font-medium">
                    <CheckCircle2 className="size-4 text-[#15803d]" />
                    <span>5-minute SePay integration</span>
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
                Live Verification
              </h2>
              <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                Test real-time 240ms response latency and dynamic VietQR payment generation across actual retail customer scenarios.
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
                          ReplyEase Agent Runtime
                        </div>
                        <div className="text-sm text-[#64748b]">
                          {activeScenario.category}, Session #{activeScenario.orderNumber}
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
                        <span className="font-medium text-[#0f172a]">Website Visitor</span>
                        <span>{activeScenario.time}</span>
                      </div>
                      <p className="text-sm text-[#1e293b] leading-relaxed">
                        &ldquo;{activeScenario.customerQuery}&rdquo;
                      </p>
                    </div>

                    {/* RAG Knowledge Matching Engine Trace */}
                    <div className="p-3.5 rounded-lg bg-[#f1f5f9] text-sm space-y-1.5">
                      <div className="flex items-center justify-between text-[#475569]">
                        <span className="font-medium">RAG Matching Source:</span>
                        <span className="text-[#15803d] font-medium">Confidence {activeScenario.confidence}</span>
                      </div>
                      <div className="text-[#334155]">
                        {activeScenario.ragMatches}
                      </div>
                      <div className="text-sm text-[#0f172a] font-medium pt-1">
                        Inventory: {activeScenario.inventoryStatus}
                      </div>
                    </div>

                    {/* AI Agent Response */}
                    <div className="rounded-lg bg-[#ffffff] p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-[#64748b]">
                        <span className="font-semibold text-[#c2410c]">ReplyEase Assistant</span>
                        <span>Delivered ({activeScenario.latencyMs}ms)</span>
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
                                VietQR SePay Payment
                              </span>
                            </div>
                            <span
                              className={`text-sm font-medium px-2.5 py-0.5 rounded ${
                                isPaid
                                  ? "bg-[#dcfce7] text-[#166534]"
                                  : "bg-[#fef3c7] text-[#b45309]"
                              }`}
                            >
                              {isPaid ? "Auto-Reconciled via SePay" : "Awaiting Transfer"}
                            </span>
                          </div>

                          <div className="pt-3 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-[#64748b]">Product</div>
                              <div className="font-medium text-[#0f172a] truncate">
                                {activeScenario.productName}
                              </div>
                            </div>
                            <div>
                              <div className="text-[#64748b]">Transfer Amount</div>
                              <div className="font-semibold text-[#c2410c]">
                                {activeScenario.amount} VND
                              </div>
                            </div>
                            <div>
                              <div className="text-[#64748b]">Bank</div>
                              <div className="font-medium text-[#0f172a]">
                                {activeScenario.bank}
                              </div>
                            </div>
                            <div>
                              <div className="text-[#64748b]">Transfer Memo</div>
                              <div className="font-medium text-[#0f172a]">
                                {activeScenario.account}
                              </div>
                            </div>
                          </div>

                          {/* Simulation Trigger inside the Card */}
                          <div className="mt-4 pt-3 flex items-center justify-between">
                            <span className="text-sm text-[#64748b]">
                              Bank Webhook Simulation:
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
                              {isPaid ? "Ding ding! Payment received" : "Simulate 2s Payment"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 text-sm text-[#64748b]">
                    Embedded widget script: <code className="bg-[#f1f5f9] px-2 py-0.5 rounded text-[#0f172a]">replyease.embed(&apos;{activeScenario.id}&apos;)</code>
                  </div>
                </div>
              </div>

              {/* Right Area (38%): Interactive Scenario Switchers */}
              <div className="lg:col-span-5 space-y-4 motion-target">
                <div className="text-base font-semibold text-[#0f172a] mb-2">
                  Select interactive scenario:
                </div>

                {SCENARIOS.map((sc) => {
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
                    How SePay Webhook Operates
                  </div>
                  <p className="max-w-[55ch]">
                    When a shopper scans the VietQR, SePay detects balance fluctuations immediately and triggers a webhook to ReplyEase AI within 2 seconds to confirm the order directly in the chat window.
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
                4-Step Activation Workflow
              </h2>
              <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                Launch an AI assistant that deeply understands your catalog and settles orders on your website in under 10 minutes.
              </p>
            </div>

            {/* Unified Workbench Card: how-it-works-one-card-four-fields */}
            <div className="rounded-xl bg-[#f8f9fb] p-6 lg:p-8 motion-target">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Field 1: Document indexing */}
                <div className="flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="text-base font-semibold text-[#0f172a] mb-2">
                      RAG Knowledge Base
                    </div>
                    <div className="space-y-2 text-sm text-[#475569]">
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#475569]">Ingested Catalog</div>
                        <div className="font-medium text-[#0f172a]">price-list-2026.xlsx</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#475569]">Status</div>
                        <div className="font-medium text-[#166534]">1,420 vectors indexed</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-[#c2410c] mb-1">
                      Step one
                    </div>
                    <div className="text-base font-semibold text-[#0f172a] leading-snug">
                      First, ingest catalog data into your private knowledge base.
                    </div>
                  </div>
                </div>

                {/* Field 2: Bank connection */}
                <div className="flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="text-base font-semibold text-[#0f172a] mb-2">
                      SePay Reconciliation Gateway
                    </div>
                    <div className="space-y-2 text-sm text-[#475569]">
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#475569]">Receiving Bank</div>
                        <div className="font-medium text-[#0f172a]">MBBank (0988291001)</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#475569]">Webhook URL</div>
                        <code className="text-[#166534] text-sm">/api/v1/sepay/listen</code>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-[#c2410c] mb-1">
                      Step two
                    </div>
                    <div className="text-base font-semibold text-[#0f172a] leading-snug">
                      Then connect your bank account and SePay gateway in 2 minutes.
                    </div>
                  </div>
                </div>

                {/* Field 3: Script embedding */}
                <div className="flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="text-base font-semibold text-[#0f172a] mb-2">
                      Embed Widget to Website
                    </div>
                    <div className="space-y-2 text-sm text-[#475569]">
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#475569]">Setup Time</div>
                        <div className="font-medium text-[#0f172a]">30 seconds complete</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#0f172a] text-[#f8fafc] text-sm overflow-x-auto">
                        <code>&lt;script src=&quot;widget.js&quot;&gt;&lt;/script&gt;</code>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-[#c2410c] mb-1">
                      Step three
                    </div>
                    <div className="text-base font-semibold text-[#0f172a] leading-snug">
                      Next, paste a single line of widget script into your website.
                    </div>
                  </div>
                </div>

                {/* Field 4: Order closed */}
                <div className="flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="text-base font-semibold text-[#0f172a] mb-2">
                      Autonomous Order Settle
                    </div>
                    <div className="space-y-2 text-sm text-[#475569]">
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#166534]">Status</div>
                        <div className="font-medium text-[#166534]">Received 650,000 VND via VietQR</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#ffffff]">
                        <div className="text-[13px] text-[#475569]">Logistics</div>
                        <div className="font-medium text-[#0f172a]">Dispatched to morning fulfillment shift</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-[#c2410c] mb-1">
                      Step four
                    </div>
                    <div className="text-base font-semibold text-[#0f172a] leading-snug">
                      Finally, your AI agent operates 24/7 and closes midnight orders.
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
                Real-World Operations Across Brands
              </h2>
              <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                ReplyEase AI powers retail stores and D2C brands from real-time customer consultation to warehouse packing stations.
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
                  Fashion Boutique & Concept Store
                </div>
                <p className="text-sm text-[#64748b] leading-relaxed max-w-[50ch]">
                  The AI assistant checks physical stock, recommends sizing based on height and weight, and generates instant VietQR payment codes throughout the night.
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
                  Night Shift Packaging & Dispatch Station
                </div>
                <p className="text-sm text-[#64748b] leading-relaxed max-w-[50ch]">
                  Orders placed between 11:00 PM and 5:00 AM are verified via SePay and auto-synced to logistics couriers for immediate morning dispatch.
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
                Deep Architecture
              </h2>
              <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                Engineered specifically for conversational commerce, nuanced Vietnamese phrasing, and domestic instant bank payments.
              </p>
            </div>

            {/* 3 Columns: Left 3 Notes | Center Panel | Right 3 Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Notes */}
              <div className="lg:col-span-3 space-y-8 motion-target">
                <div>
                  <div className="text-base font-semibold text-[#0f172a]">
                    Multi-Layer Retail RAG
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed max-w-[36ch]">
                    Accurately understands Vietnamese regional phrasing, shorthand, and product variants with 99.8% precision.
                  </p>
                </div>
                <div>
                  <div className="text-base font-semibold text-[#0f172a]">
                    Instant SePay Reconciliation
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed max-w-[36ch]">
                    Automatically parses transfer memos and delivers real-time confirmation notifications to customers within 2 seconds.
                  </p>
                </div>
                <div>
                  <div className="text-base font-semibold text-[#0f172a]">
                    Real-Time Inventory Audit
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed max-w-[36ch]">
                    Directly syncs with live stock databases, eliminating out-of-stock misguidance.
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
                        Agent Central Control Panel
                      </span>
                    </div>
                    <span className="text-sm bg-[#ffffff] px-2.5 py-1 rounded text-[#475569]">
                      v2.4-stable
                    </span>
                  </div>

                  <div className="py-4 space-y-4 text-sm">
                    <div className="p-4 rounded-lg bg-[#ffffff]">
                      <div className="text-sm font-semibold text-[#64748b] mb-1">
                        Model State & System Prompt
                      </div>
                      <div className="text-[#0f172a] font-medium">
                        Retail Conversational RAG · Professional, courteous tone
                      </div>
                      <div className="text-sm text-[#64748b] mt-1">
                        Temperature: 0.2 · Speculative answers strictly blocked
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#ffffff]">
                      <div className="text-sm font-semibold text-[#64748b] mb-1">
                        Banking Gateway & SePay Webhook
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#0f172a] font-medium">MBBank (Account: 0988291001)</span>
                        <span className="text-sm font-medium text-[#166534] bg-[#dcfce7] px-2.5 py-0.5 rounded">
                          Connected
                        </span>
                      </div>
                      <div className="text-sm text-[#64748b] mt-1">
                        Auto-generates dynamic Napas 247 QR codes per order
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#ffffff]">
                      <div className="text-sm font-semibold text-[#64748b] mb-1">
                        Emergency Staff Escalation
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#0f172a] font-medium">Triggers when customer explicitly requests hotline assistance</span>
                        <span className="text-sm font-medium text-[#9a3412] bg-[#ffedd5] px-2.5 py-0.5 rounded">
                          1-Click Handover
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between text-sm text-[#64748b]">
                    <span>Operational Uptime: 99.98%</span>
                    <span>Average Latency: 240ms</span>
                  </div>
                </div>
              </div>

              {/* Right Notes */}
              <div className="lg:col-span-3 space-y-8 motion-target">
                <div>
                  <div className="text-base font-semibold text-[#0f172a]">
                    1-Touch Staff Handover
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed max-w-[36ch]">
                    Detects complex disputes or custom inquiries and routes the full transcript to human agents within seconds.
                  </p>
                </div>
                <div>
                  <div className="text-base font-semibold text-[#0f172a]">
                    Zero-Data-Leak Privacy
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed max-w-[36ch]">
                    Proprietary product data and customer records are isolated and never used for public model training.
                  </p>
                </div>
                <div>
                  <div className="text-base font-semibold text-[#0f172a]">
                    Conversion Intelligence
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed max-w-[36ch]">
                    Tracks off-hour revenue volume, payment settlement speed, and customer satisfaction metrics.
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
                  Average Latency per RAG Query
                </h2>
                <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                  Shoppers never wait for answers. The chart below illustrates automated order processing distributed across 24 hours.
                </p>
              </div>

              {/* Typographic Numbers Row without boxed card repetition */}
              <div className="lg:col-span-5 grid grid-cols-3 gap-6 text-left">
                <div className="motion-target">
                  <div className="text-3xl font-bold text-[#c2410c]">+38%</div>
                  <div className="text-sm text-[#64748b] mt-1">Nighttime orders</div>
                </div>
                <div className="motion-target">
                  <div className="text-3xl font-bold text-[#166534]">0</div>
                  <div className="text-sm text-[#64748b] mt-1">Lost orders at 2:00 AM</div>
                </div>
                <div className="motion-target">
                  <div className="text-3xl font-bold text-[#0f172a]">99.8%</div>
                  <div className="text-sm text-[#64748b] mt-1">SePay match rate</div>
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
                  Hourly Consultation & Order Volume (00:00 - 23:00)
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded bg-[#c2410c]" />
                  <span className="font-semibold text-[#c2410c]">Night Shift Window (00:00 - 06:00: 100% Autonomous AI)</span>
                </span>
              </div>

              {/* 12 Bars representing hours */}
              <div className="grid grid-cols-12 gap-2 sm:gap-3 items-end h-52 pt-6 pb-2">
                {[
                  { hour: "00h", height: "48%", night: true, count: "142 orders" },
                  { hour: "02h", height: "58%", night: true, count: "168 orders" },
                  { hour: "04h", height: "42%", night: true, count: "115 orders" },
                  { hour: "06h", height: "30%", night: false, count: "89 orders" },
                  { hour: "08h", height: "65%", night: false, count: "210 orders" },
                  { hour: "10h", height: "82%", night: false, count: "295 orders" },
                  { hour: "12h", height: "92%", night: false, count: "340 orders" },
                  { hour: "14h", height: "85%", night: false, count: "310 orders" },
                  { hour: "16h", height: "78%", night: false, count: "275 orders" },
                  { hour: "18h", height: "68%", night: false, count: "230 orders" },
                  { hour: "20h", height: "95%", night: false, count: "360 orders" },
                  { hour: "22h", height: "88%", night: false, count: "325 orders" },
                ].map((bar, idx) => (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-[#0f172a] mb-1 whitespace-nowrap">
                      {bar.count}
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
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0f172a]">
                Transparent Pricing
              </h2>
              <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                Invest flexibly according to your scale and order volume. No hidden fees; upgrade or cancel anytime.
              </p>
            </div>

            {/* Desktop Table Comparison */}
            <div className="hidden lg:block overflow-hidden rounded-xl motion-target">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#f8f9fb]">
                    <th className="p-6 text-base font-semibold text-[#0f172a] w-1/4">
                      Comparison Features
                    </th>
                    <th className="p-6 w-1/4">
                      <div className="text-lg font-semibold text-[#0f172a]">Starter</div>
                      <div className="text-2xl font-bold text-[#0f172a] mt-1">490,000 VND</div>
                      <div className="text-sm text-[#64748b]">per month</div>
                    </th>
                    <th className="p-6 w-1/4 bg-[#f1f5f9]">
                      <div className="text-lg font-semibold text-[#0f172a]">
                        Growth (Recommended)
                      </div>
                      <div className="text-2xl font-bold text-[#c2410c] mt-1">1,490,000 VND</div>
                      <div className="text-sm text-[#64748b]">per month</div>
                    </th>
                    <th className="p-6 w-1/4">
                      <div className="text-lg font-semibold text-[#0f172a]">Enterprise</div>
                      <div className="text-2xl font-bold text-[#0f172a] mt-1">3,990,000 VND</div>
                      <div className="text-sm text-[#64748b]">per month</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-base">
                  <tr>
                    <td className="p-5 font-medium text-[#0f172a]">Monthly AI Conversations</td>
                    <td className="p-5 text-[#475569]">1,000 sessions</td>
                    <td className="p-5 font-semibold text-[#0f172a] bg-[#f1f5f9]/60">
                      5,000 sessions
                    </td>
                    <td className="p-5 text-[#475569]">Unlimited</td>
                  </tr>
                  <tr className="bg-[#f8f9fb]">
                    <td className="p-5 font-medium text-[#0f172a]">SePay VietQR Integration</td>
                    <td className="p-5 text-[#475569]">1 bank account</td>
                    <td className="p-5 font-semibold text-[#0f172a] bg-[#f1f5f9]/60">
                      3 bank accounts
                    </td>
                    <td className="p-5 text-[#475569]">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-5 font-medium text-[#0f172a]">RAG Knowledge Documents</td>
                    <td className="p-5 text-[#475569]">Up to 10 documents</td>
                    <td className="p-5 font-semibold text-[#0f172a] bg-[#f1f5f9]/60">
                      Up to 50 documents & URLs
                    </td>
                    <td className="p-5 text-[#475569]">Full organization repository</td>
                  </tr>
                  <tr className="bg-[#f8f9fb]">
                    <td className="p-5 font-medium text-[#0f172a]">1-Touch Staff Handover</td>
                    <td className="p-5 text-[#475569]">Basic notifications</td>
                    <td className="p-5 font-semibold text-[#0f172a] bg-[#f1f5f9]/60">
                      Full via Telegram/Zalo
                    </td>
                    <td className="p-5 text-[#475569]">Advanced custom webhooks</td>
                  </tr>
                  <tr>
                    <td className="p-5 font-medium text-[#0f172a]">Technical Support SLA</td>
                    <td className="p-5 text-[#475569]">Within 24 hours</td>
                    <td className="p-5 font-semibold text-[#0f172a] bg-[#f1f5f9]/60">
                      Priority within 2 hours
                    </td>
                    <td className="p-5 text-[#475569]">Dedicated 24/7 technical manager</td>
                  </tr>
                  <tr className="bg-[#f8f9fb]">
                    <td className="p-6"></td>
                    <td className="p-6">
                      <Link
                        href="/auth/sign-up"
                        className="inline-flex w-full h-11 items-center justify-center rounded-md bg-[#0f172a] text-white text-sm font-medium hover:bg-[#334155] transition-colors"
                      >
                        Choose Starter
                      </Link>
                    </td>
                    <td className="p-6 bg-[#f1f5f9]">
                      <Link
                        href="/auth/sign-up"
                        className="inline-flex w-full h-11 items-center justify-center rounded-md bg-[#c2410c] text-white text-sm font-medium hover:bg-[#9a3412] transition-colors"
                      >
                        Start Pro Trial
                      </Link>
                    </td>
                    <td className="p-6">
                      <Link
                        href="/auth/sign-up"
                        className="inline-flex w-full h-11 items-center justify-center rounded-md bg-[#0f172a] text-white text-sm font-medium hover:bg-[#334155] transition-colors"
                      >
                        Contact Enterprise
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Stack without check icon tell */}
            <div className="lg:hidden space-y-6 motion-target">
              {[
                {
                  name: "Starter",
                  price: "490,000 VND",
                  period: "month",
                  conversations: "1,000 sessions per month",
                  bank: "1 bank account",
                  rag: "Up to 10 documents",
                  recommended: false,
                },
                {
                  name: "Growth (Recommended)",
                  price: "1,490,000 VND",
                  period: "month",
                  conversations: "5,000 sessions per month",
                  bank: "3 bank accounts",
                  rag: "Up to 50 documents & URLs",
                  recommended: true,
                },
                {
                  name: "Enterprise",
                  price: "3,990,000 VND",
                  period: "month",
                  conversations: "Unlimited sessions",
                  bank: "Unlimited bank accounts",
                  rag: "Full organization repository",
                  recommended: false,
                },
              ].map((tier, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-xl ${
                    tier.recommended
                      ? "bg-[#f1f5f9]"
                      : "bg-[#f8f9fb]"
                  }`}
                >
                  <div className="text-lg font-semibold text-[#0f172a]">{tier.name}</div>
                  <div className="text-2xl font-bold text-[#0f172a] mt-1">
                    {tier.price}{" "}
                    <span className="text-sm font-normal text-[#64748b]">/ {tier.period}</span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-[#475569]">
                    <div>{tier.conversations}</div>
                    <div>{tier.bank}</div>
                    <div>{tier.rag}</div>
                  </div>
                  <Link
                    href="/auth/sign-up"
                    className={`mt-6 inline-flex w-full h-11 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      tier.recommended
                        ? "bg-[#c2410c] text-white hover:bg-[#9a3412]"
                        : "bg-[#0f172a] text-white hover:bg-[#334155]"
                    }`}
                  >
                    Choose {tier.name}
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
                  Frequently Asked Questions
                </h2>
                <p className="mt-3 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                  Clear answers regarding RAG architecture, SePay payment integration, and data confidentiality.
                </p>
              </div>

              {/* Accordion Tiles */}
              <div className="lg:col-span-8 space-y-3.5 motion-target">
                {[
                  {
                    q: "How does ReplyEase AI differ from traditional rule-based chatbots?",
                    a: "Traditional chatbots rely on rigid decision trees and fail when a customer phrases something unexpectedly. ReplyEase AI leverages large language models augmented with RAG to deeply understand product literature, converse naturally, and compute dynamic VietQR payment codes tailored to each order.",
                  },
                  {
                    q: "Is SePay VietQR integration secure, and does it require bank credentials?",
                    a: "Completely secure. ReplyEase AI and SePay only monitor incoming balance fluctuation webhooks (read-only transaction alerts). We have zero access to initiate transactions or transfer funds from your account. You maintain full ownership and control of your banking.",
                  },
                  {
                    q: "What data should I prepare to train my AI assistant?",
                    a: "Simply upload existing store materials: Excel price lists, product PDFs, shipping and return policies, or your public website URL. The system automatically chunks and indexes your documents in under 3 minutes.",
                  },
                  {
                    q: "When does a human sales representative need to step in?",
                    a: "When the AI identifies strong customer frustration, questions outside the uploaded knowledge base, or an explicit request to speak with staff, ReplyEase AI automatically triggers an urgent handover alert via Telegram, Zalo, or Email with the full conversation history.",
                  },
                  {
                    q: "Can I test the platform for free before committing to a paid plan?",
                    a: "Yes. We provide a full-featured 14-day free trial with no credit card required. After the trial, you can select the plan that fits your volume or discontinue at any time.",
                  },
                  {
                    q: "How long does it take to embed ReplyEase AI into an active website?",
                    a: "Approximately 5 minutes. Simply copy a single JavaScript widget snippet from your dashboard and paste it before the closing body tag. It works directly with WordPress, Shopify, Haravan, Sapo, Next.js, and custom web stacks.",
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
                  Automate Conversational Sales with ReplyEase AI
                </h2>
                <p className="mt-4 text-base text-[#475569] leading-relaxed max-w-[50ch]">
                  Start your 14-day free trial. Ensure your customers are guided and checked out even while you sleep.
                </p>

                {/* Inline form */}
                <form onSubmit={handleCtaSubmit} className="mt-8">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="email"
                      required
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      placeholder="Enter your business email..."
                      className="h-13 px-5 rounded-md bg-[#f8fafc] text-base text-[#0f172a] placeholder-[#94a3b8] focus:outline-none w-full sm:w-[360px]"
                    />
                    <button
                      type="submit"
                      className="h-13 px-7 rounded-md bg-[#c2410c] text-white text-base font-medium hover:bg-[#9a3412] active:scale-[0.98] transition-colors shrink-0"
                    >
                      Start 14-day free trial
                    </button>
                  </div>
                  {ctaSubmitted && (
                    <p className="mt-3 text-sm text-[#166534] font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="size-4" />
                      Thank you! The ReplyEase team will deliver your trial workspace to {inputEmail} shortly.
                    </p>
                  )}
                </form>

                <p className="mt-4 text-sm text-[#64748b]">
                  No credit card required. Live in 5 minutes with dedicated technical onboarding.
                </p>
              </div>

              {/* Right Column: Balancing Service Guarantees Card (Closes the Void) */}
              <div className="lg:col-span-5 motion-target">
                <div
                  data-ui
                  className="p-8 rounded-xl bg-[#f8f9fb] space-y-6"
                >
                  <div className="text-base font-semibold text-[#0f172a]">
                    Enterprise-Grade Commitments
                  </div>
                  <div className="space-y-4 text-sm text-[#475569]">
                    <div className="space-y-1">
                      <div className="font-medium text-[#0f172a]">RAG Data Confidentiality</div>
                      <div className="text-sm text-[#64748b]">Strict isolation of internal product databases and customer transaction records</div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-[#0f172a]">High-Speed Infrastructure</div>
                      <div className="text-sm text-[#64748b]">240ms benchmark latency hosted in domestic tier-3 clusters with zero packet loss</div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-[#0f172a]">1-on-1 Technical Onboarding</div>
                      <div className="text-sm text-[#64748b]">Dedicated engineers to connect your SePay webhook and embed the widget script</div>
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
                ReplyEase AI is the premier conversational customer support and automated SePay VietQR checkout platform for modern e-commerce brands.
              </p>
              <div className="text-sm text-[#64748b]">
                © 2026 ReplyEase AI. All rights reserved.
              </div>
            </div>

            {/* Nav */}
            <div className="lg:col-span-2 space-y-2 text-sm">
              <div className="font-semibold text-[#0f172a] mb-3">Navigation</div>
              <div><a href="#showcase" className="text-[#475569] hover:text-[#c2410c] transition-colors">Experience</a></div>
              <div><a href="#how-it-works" className="text-[#475569] hover:text-[#c2410c] transition-colors">Process</a></div>
              <div><a href="#pricing" className="text-[#475569] hover:text-[#c2410c] transition-colors">Pricing</a></div>
              <div><a href="#faq" className="text-[#475569] hover:text-[#c2410c] transition-colors">FAQ</a></div>
            </div>

            {/* Operations */}
            <div className="lg:col-span-3 space-y-2 text-sm">
              <div className="font-semibold text-[#0f172a] mb-3">Offices & Operating Hours</div>
              <div className="text-[#0f172a] font-medium">Hanoi & Ho Chi Minh City</div>
              <div className="text-[#64748b]">Indochina Time (GMT+7)</div>
              <div className="text-[#166534] font-medium flex items-center gap-2 pt-1">
                <span className="size-2 rounded-full bg-[#15803d]" />
                Systems operating 24/7/365
              </div>
            </div>

            {/* Support */}
            <div className="lg:col-span-3 space-y-2 text-sm">
              <div className="font-semibold text-[#0f172a] mb-3">Support & Integrations</div>
              <div className="font-medium text-[#0f172a]">support@replyease.ai</div>
              <div className="text-[#475569]">1900 8899 (24/7 Support)</div>
              <div className="text-[#64748b] text-[13px] pt-1">Custom API and webhook advisory</div>
            </div>
          </div>

          {/* Lower Row: Wordmark Tile + Accent Action Tile */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Wordmark Tile (col 1–8) */}
            <div className="lg:col-span-8 p-8 rounded-xl bg-[#0f172a] text-white flex flex-col justify-between min-h-[160px] motion-target">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded bg-[#c2410c] text-white">
                  <Bot className="size-4" />
                </div>
                <span className="text-sm font-semibold text-[#94a3b8]">
                  ReplyEase AI Enterprise
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
                Start your 14-day free trial
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-white/90">
                  Live in 5 minutes
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
