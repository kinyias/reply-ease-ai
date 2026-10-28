"use client";

import * as React from "react";
import Image from "next/image";
import { BotIcon, MinusIcon, RotateCcwIcon, RadioIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatbotHeaderProps {
  domainName: string;
  botIcon?: string | null;
  isLive: boolean;
  themeColor?: string | null;
  textColor?: string | null;
  onReset: () => void;
  onClose: () => void;
}

export function ChatbotHeader({
  domainName,
  botIcon,
  isLive,
  themeColor,
  textColor,
  onReset,
  onClose,
}: ChatbotHeaderProps) {
  const bgStyle = themeColor ? { backgroundColor: themeColor } : undefined;
  const fgColor = textColor || "#ffffff";

  return (
    <div
      style={bgStyle}
      className={`px-4 py-3.5 flex items-center justify-between border-b border-white/10 select-none ${
        !themeColor ? "bg-primary text-primary-foreground" : ""
      }`}
    >
      {/* Bot & Status Info */}
      <div className="flex items-center gap-3">
        <div className="relative size-10 rounded-full overflow-hidden bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-xs">
          {botIcon ? (
            <Image
              src={botIcon}
              alt={domainName}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <Image
              src="/icons/logo.png"
              alt={domainName || "ReplyEase AI"}
              fill
              className="object-contain p-1"
              sizes="40px"
            />
          )}
          {/* Active Status Pulse */}
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 border-2 border-white" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1
              style={{ color: fgColor }}
              className="text-sm font-semibold tracking-tight truncate max-w-[180px] sm:max-w-[220px]"
            >
              {domainName}
            </h1>
            {isLive && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-500/90 text-white animate-pulse">
                <RadioIcon className="size-2.5" />
                LIVE
              </span>
            )}
          </div>

          <p
            style={{ color: fgColor, opacity: 0.85 }}
            className="text-[11px] font-medium flex items-center gap-1"
          >
            {isLive ? (
              <span className="text-red-200">Đang nối máy nhân viên</span>
            ) : (
              <span>Trợ lý Bán hàng AI &bull; Sẵn sàng 24/7</span>
            )}
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          title="Làm mới cuộc trò chuyện"
          style={{ color: fgColor }}
          className="size-8 rounded-full hover:bg-white/20 transition-colors"
        >
          <RotateCcwIcon className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          title="Thu nhỏ cửa sổ"
          style={{ color: fgColor }}
          className="size-8 rounded-full hover:bg-white/20 transition-colors"
        >
          <MinusIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
