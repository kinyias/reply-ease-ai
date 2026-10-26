"use client";

import * as React from "react";
import { MessageSquareIcon, RadioIcon, SparklesIcon, ShieldCheckIcon } from "lucide-react";

export function EmptyConversationState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/50">
      <div className="max-w-md space-y-4">
        <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
          <MessageSquareIcon className="size-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Chọn một cuộc hội thoại để bắt đầu
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Theo dõi tin nhắn khách hàng trong thời gian thực, can thiệp tư vấn trực tiếp (Human-In-The-Loop) hoặc để Trợ lý AI tự động phản hồi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 text-left">
          <div className="p-3 rounded-lg border border-border/60 bg-card/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <RadioIcon className="size-3.5 text-emerald-500" />
              <span>Chế độ Live Mode</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Bật tắt tức thời. Khi bật, bot dừng tự động để bạn trực tiếp trò chuyện với khách hàng.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-card/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <SparklesIcon className="size-3.5 text-amber-500" />
              <span>Đồng bộ 2 chiều WebSocket</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Tin nhắn gửi từ Dashboard sẽ tức thời hiển thị trên Widget ngoài website của khách.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
