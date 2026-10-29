"use client";

import * as React from "react";
import { GlobeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/i18n-context";

interface LanguageToggleProps {
  className?: string;
  showText?: boolean;
}

export function LanguageToggle({ className = "", showText = false }: LanguageToggleProps) {
  const { locale, toggleLocale, labels } = useI18n();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`size-7 text-muted-foreground hover:text-sidebar-foreground ${className}`}
        title="Language (English / Tiếng Việt)"
        aria-label="Language switch"
      >
        <GlobeIcon className="size-3.5" />
      </Button>
    );
  }

  const current = labels[locale];
  const targetLocale = locale === "en" ? "vi" : "en";
  const target = labels[targetLocale];

  return (
    <Button
      variant="ghost"
      size={showText ? "default" : "icon"}
      onClick={toggleLocale}
      className={`h-7 px-1.5 text-muted-foreground hover:text-foreground text-xs font-semibold gap-1 transition-colors ${className}`}
      title={`Current: ${current.label} (${current.short}) — Click to switch to ${target.label}`}
      aria-label={`Switch language to ${target.label}`}
    >
      <GlobeIcon className="size-3.5 text-primary shrink-0" />
      <span className="text-[11px] font-bold tracking-tight uppercase">
        {current.short}
      </span>
      {showText && (
        <span className="text-xs font-normal text-muted-foreground ml-1">
          {current.label}
        </span>
      )}
    </Button>
  );
}

