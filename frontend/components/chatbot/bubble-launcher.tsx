"use client";

import * as React from "react";
import Image from "next/image";
import { MessageSquareIcon, SparklesIcon, XIcon } from "lucide-react";
import { useI18n } from "@/context/i18n-context";

interface BubbleLauncherProps {
  isOpen: boolean;
  onToggle: () => void;
  botIcon?: string | null;
  botName?: string;
  themeColor?: string | null;
}

export function BubbleLauncher({
  isOpen,
  onToggle,
  botIcon,
  botName: propBotName,
  themeColor,
}: BubbleLauncherProps) {
  const { t } = useI18n();
  const botName = propBotName || t("chatbot.defaultBotName", "AI Assistant");
  const [showTooltip, setShowTooltip] = React.useState(true);

  // Auto-hide tooltip after 8 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const bgColor = themeColor || "#ff7a00";

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 flex flex-col items-end gap-2 select-none">
      {/* Greeting Bubble Tooltip */}
      {!isOpen && showTooltip && (
        <div
          onClick={onToggle}
          className="cursor-pointer group flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-950/10 transition-all hover:scale-102 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div className="size-2 rounded-full bg-emerald-500 " />
          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {t("chatbot.bubbleGreeting", "Hello! How can I assist you today?")}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded-full"
            aria-label={t("chatbot.bubbleClose", "Dismiss tooltip")}
          >
            <XIcon className="size-3" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? t("chatbot.bubbleCloseWindow", "Close chat window") : t("chatbot.bubbleOpen", "Open chat window")}
        style={{ backgroundColor: bgColor }}
        className="relative size-14 sm:size-15 rounded-full flex items-center justify-center text-white shadow-md shadow-orange-950/20 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
      >
        {/* Subtle Ping Animation when closed */}
        {!isOpen && (
          <span
            style={{ backgroundColor: bgColor }}
            className="absolute -inset-1 rounded-full opacity-35  -z-10 pointer-events-none"
          />
        )}

        {isOpen ? (
          <XIcon className="size-6 transition-transform duration-200 rotate-0 hover:rotate-90" />
        ) : botIcon ? (
          <div className="relative size-10 rounded-full overflow-hidden border border-white/30">
            <Image
              src={botIcon}
              alt={botName}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageSquareIcon className="size-6" />
            <SparklesIcon className="size-3 absolute -top-1.5 -right-1.5 text-amber-200" />
          </div>
        )}
      </button>
    </div>
  );
}
