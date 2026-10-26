"use client";

import * as React from "react";
import Link from "next/link";
import { MenuIcon, SparklesIcon, XIcon } from "lucide-react";
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
    <header className="sm:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="size-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
          <SparklesIcon className="size-3.5" />
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground">
          ReplyEase <span className="text-primary font-normal">AI</span>
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
          className="size-8 text-foreground"
          aria-label={isOpen ? "Đóng menu" : "Mở menu"}
        >
          {isOpen ? <XIcon className="size-4" /> : <MenuIcon className="size-4" />}
        </Button>
      </div>
    </header>
  );
}
