"use client";

import * as React from "react";
import { FlameIcon, RadioIcon, SparklesIcon } from "lucide-react";
import { ConversationRoomSummary } from "@/types/conversation";
import { Badge } from "@/components/ui/badge";

// Deterministic pastel color palette for avatars (house style: calm, non-garish)
const AVATAR_PALETTE = [
  { bg: "bg-sky-100 dark:bg-sky-950/60", text: "text-sky-700 dark:text-sky-300" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-orange-100 dark:bg-orange-950/60", text: "text-orange-700 dark:text-orange-300" },
  { bg: "bg-rose-100 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300" },
  { bg: "bg-slate-200 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300" },
  { bg: "bg-teal-100 dark:bg-teal-950/60", text: "text-teal-700 dark:text-teal-300" },
];

function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

function formatChatTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    if (isToday) {
      return `${hours}:${minutes}`;
    }
    if (isYesterday) {
      return "Hôm qua";
    }
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  } catch {
    return "";
  }
}

interface ChatCardProps {
  room: ConversationRoomSummary;
  isActive: boolean;
  onSelect: (roomId: string) => void;
}

export function ChatCard({ room, isActive, onSelect }: ChatCardProps) {
  const customerEmail = room.customer?.email;
  const displayName = customerEmail
    ? customerEmail.split("@")[0]
    : `Khách #${room.id.slice(0, 4)}`;

  const fullIdentity = customerEmail || `Khách truy cập #${room.id.slice(0, 6)}`;
  const initial = displayName.charAt(0).toUpperCase() || "K";
  const avatarStyle = getAvatarColor(customerEmail || room.id);

  const lastMsg = room.last_message;
  const timeDisplay = lastMsg?.created_at
    ? formatChatTime(lastMsg.created_at)
    : formatChatTime(room.updated_at);

  const senderPrefix = lastMsg
    ? lastMsg.role === "user"
      ? "Khách: "
      : "Bạn: "
    : "";

  return (
    <button
      type="button"
      onClick={() => onSelect(room.id)}
      className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 flex items-start gap-3 relative select-none ${
        isActive
          ? "bg-sidebar-accent border-primary/40 text-foreground shadow-2xs"
          : "bg-card hover:bg-muted/50 border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {/* Avatar with deterministic hue */}
      <div
        className={`size-10 rounded-full flex items-center justify-center font-medium text-sm shrink-0 border border-black/5 dark:border-white/10 ${avatarStyle.bg} ${avatarStyle.text}`}
      >
        {initial}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`font-medium text-sm truncate ${
                isActive ? "text-foreground font-semibold" : "text-foreground"
              }`}
            >
              {fullIdentity}
            </span>
            {room.live && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20 shrink-0"
                title="Đang trong chế độ Live nhân viên hỗ trợ"
              >
                <span className="size-1.5 rounded-full bg-emerald-500 " />
                Live
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
            {timeDisplay}
          </span>
        </div>

        {/* Message snippet preview */}
        <p className="text-xs text-muted-foreground line-clamp-1 break-all mb-1.5 leading-relaxed">
          <span className="font-medium text-foreground/80">{senderPrefix}</span>
          {lastMsg ? lastMsg.message : "Chưa có tin nhắn nào"}
        </p>

        {/* Meta tags: Domain badge, urgent tag, unread counter */}
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded truncate max-w-[120px]">
              {room.domain_name}
            </span>

            {room.is_urgent && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                <FlameIcon className="size-2.5 text-amber-500" />
                Gấp
              </span>
            )}

            {room.customer && room.customer.total_questions_count > 0 && (
              <span className="text-[10px] text-muted-foreground/75 truncate">
                {room.customer.answered_questions_count}/
                {room.customer.total_questions_count} câu hỏi
              </span>
            )}
          </div>

          {room.unread_count > 0 && (
            <span className="size-5 rounded-full bg-primary text-primary-foreground font-semibold text-[10px] flex items-center justify-center tabular-nums shrink-0 shadow-xs">
              {room.unread_count > 9 ? "9+" : room.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
