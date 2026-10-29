"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  X,
  Sparkles,
  Bot,
  Zap,
  Sliders,
  BarChart3,
  CreditCard,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/context/i18n-context";

export function LandingHeader() {
  const { t } = useI18n();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Monitor scroll for subtle elevated backdrop
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll and handle ESC key when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    {
      href: "#showcase",
      label: t("landing.nav.experience", "Experience"),
      icon: Bot,
    },
    {
      href: "#how-it-works",
      label: t("landing.nav.process", "Process"),
      icon: Zap,
    },
    {
      href: "#features",
      label: t("landing.nav.architecture", "Architecture"),
      icon: Sliders,
    },
    {
      href: "#stats",
      label: t("landing.nav.performance", "Performance"),
      icon: BarChart3,
    },
    {
      href: "#pricing",
      label: t("landing.nav.pricing", "Pricing"),
      icon: CreditCard,
    },
    {
      href: "#faq",
      label: t("landing.nav.faq", "FAQ"),
      icon: HelpCircle,
    },
  ];

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs"
            : "bg-white/80 backdrop-blur-xs border-b border-slate-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          {/* Wordmark / Brand Logo */}
          <Link
            href="/"
            onClick={handleNavClick}
            className="inline-flex items-center gap-2.5 shrink-0"
          >
            <div className="flex size-8 sm:size-9 items-center justify-center rounded-lg overflow-hidden bg-slate-100 border border-slate-200/60 shadow-2xs shrink-0">
              <Image
                src="/icons/logo.png"
                alt="ReplyEase AI"
                width={36}
                height={36}
                className="size-full object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-[#0f172a]">
                ReplyEase
              </span>
              <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-xs font-bold text-[#c2410c]">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-[#475569]">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-[#c2410c] transition-colors py-1"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switcher */}
            <LanguageToggle />

            {/* Demo Button: visible on xl+ to prevent horizontal crowding on laptops */}
            <Link
              href="/auth/sign-in"
              className="hidden xl:inline-flex h-9 items-center justify-center rounded-lg border border-orange-200 bg-orange-50/80 px-3 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors shadow-2xs"
            >
              <Sparkles className="size-3 mr-1.5 text-orange-600" />
              <span>{t("landing.demoSession", "Try 30m Demo")}</span>
            </Link>

            {/* Sign In Link: hidden on small mobile, visible on sm+ */}
            <Link
              href="/auth/sign-in"
              className="hidden sm:inline-flex text-xs sm:text-sm font-medium text-[#475569] hover:text-[#0f172a] px-2 py-1.5 transition-colors"
            >
              {t("landing.signIn", "Sign In")}
            </Link>

            {/* Primary Action CTA */}
            <Link
              href="/auth/sign-up"
              className="inline-flex h-9 sm:h-9.5 items-center justify-center rounded-lg bg-[#c2410c] px-3.5 sm:px-4.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#9a3412] active:scale-[0.98] transition-colors shadow-xs"
            >
              <span>{t("landing.startTrial", "Start Free Trial")}</span>
            </Link>

            {/* Mobile / Tablet Menu Button (visible on < lg) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100 active:scale-95 transition-colors"
              aria-label={
                isMobileMenuOpen
                  ? t("common.closeMenu", "Close menu")
                  : t("common.openMenu", "Open menu")
              }
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="size-4.5" />
              ) : (
                <Menu className="size-4.5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer / Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <div className="fixed top-16 sm:top-18 inset-x-0 bg-white border-b border-slate-200/90 shadow-2xl p-5 sm:p-6 max-h-[calc(100vh-4.5rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            {/* Navigation links grid */}
            <div className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className="flex items-center justify-between p-3 rounded-lg text-sm font-medium text-slate-700 hover:text-[#c2410c] hover:bg-orange-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                        <Icon className="size-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="size-4 text-slate-400" />
                  </a>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-slate-100" />

            {/* Mobile Actions Stack */}
            <div className="space-y-2.5">
              <Link
                href="/auth/sign-in"
                onClick={handleNavClick}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm font-semibold hover:bg-orange-100 transition-colors"
              >
                <Sparkles className="size-3.5 text-orange-600" />
                <span>{t("landing.demoSession", "Try 30m Demo")}</span>
              </Link>

              <Link
                href="/auth/sign-up"
                onClick={handleNavClick}
                className="flex items-center justify-center w-full py-2.5 px-4 rounded-lg bg-[#c2410c] text-white text-sm font-semibold hover:bg-[#9a3412] transition-colors shadow-xs"
              >
                {t("landing.startTrial", "Start 14-day free trial")}
              </Link>

              <Link
                href="/auth/sign-in"
                onClick={handleNavClick}
                className="flex items-center justify-center w-full py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {t("landing.signIn", "Sign In")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

