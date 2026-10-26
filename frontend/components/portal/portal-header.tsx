"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react";

interface PortalHeaderProps {
  domainName: string;
  domainIcon?: string | null;
  subtitle: string;
  badgeText?: string;
}

export function PortalHeader({
  domainName,
  domainIcon,
  subtitle,
  badgeText = "Bảo mật SSL 256-bit",
}: PortalHeaderProps) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Domain Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
            {domainIcon ? (
              <Image
                src={domainIcon}
                alt={domainName}
                width={36}
                height={36}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span>{domainName ? domainName.charAt(0).toUpperCase() : "R"}</span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm tracking-tight truncate max-w-[200px] sm:max-w-xs">
                {domainName}
              </span>
              <CheckCircle2Icon className="size-3.5 text-emerald-500 shrink-0" />
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
              {subtitle}
            </span>
          </div>
        </div>

        {/* Right: Security Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs font-medium border border-zinc-200/80 dark:border-zinc-800">
          <ShieldCheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">{badgeText}</span>
          <span className="sm:hidden">Bảo mật</span>
        </div>
      </div>
    </header>
  );
}
