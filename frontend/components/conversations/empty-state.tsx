"use client";

import * as React from "react";
import { MessageSquareIcon, RadioIcon, SparklesIcon } from "lucide-react";

export function EmptyConversationState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center bg-background">
      <div className="max-w-md w-full space-y-4">
        <div className="flex items-center justify-center mx-auto text-muted-foreground/60 mb-2">
          <MessageSquareIcon className="size-10 stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Chọn một cuộc hội thoại để bắt đầu
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Theo dõi tin nhắn khách hàng trong thời gian thực, can thiệp tư vấn trực tiếp (Human-In-The-Loop) hoặc để Trợ lý AI tự động phản hồi.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-4 text-left w-full">
          <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <RadioIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Chế độ Live Mode</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bật tắt tức thời. Khi bật, bot dừng tự động để bạn trực tiếp trò chuyện với khách hàng.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <SparklesIcon className="size-3.5 text-primary shrink-0" />
              <span>Đồng bộ 2 chiều WebSocket</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tin nhắn gửi từ Dashboard sẽ tức thời hiển thị trên Widget ngoài website của khách.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
