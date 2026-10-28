"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DomainSwitcher } from "@/components/sidebar/domain-switcher";

export function MobileHeader({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <header className="sm:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="size-7 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 shadow-xs shrink-0">
          <Image
            src="/icons/logo.png"
            alt="ReplyEase AI Logo"
            width={28}
            height={28}
            className="size-full object-contain"
          />
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          ReplyEase <span className="text-primary font-bold">AI</span>
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <div className="w-36">
          <DomainSwitcher />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="size-8 text-sidebar-foreground"
          aria-label={isOpen ? "Đóng menu" : "Mở menu"}
        >
          {isOpen ? <XIcon className="size-4" /> : <MenuIcon className="size-4" />}
        </Button>
      </div>
    </header>
  );
}
