"use client";

import * as React from "react";
import {
  BotIcon,
  CheckCheckIcon,
  CheckIcon,
  ExternalLinkIcon,
  GlobeIcon,
  Loader2Icon,
  RadioIcon,
  SendIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useChatWindow } from "@/hooks/conversation/use-chat-window";
import { ConversationRoomSummary } from "@/types/conversation";

interface MessengerProps {
  room: ConversationRoomSummary;
  onRoomUpdated?: () => void;
}

const QUICK_RESPONSES = [
  "Chào bạn, mình có thể hỗ trợ gì cho bạn ạ?",
  "Dạ bên mình đang kiểm tra thông tin và sẽ phản hồi ngay nhé!",
  "Bạn vui lòng để lại số điện thoại để chuyên viên tư vấn chi tiết hơn nhé ạ.",
  "Dạ hiện tại bên em đang có chương trình ưu đãi đặc biệt hôm nay ạ!",
];

function formatMessageTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "";
  }
}

export function Messenger({ room, onRoomUpdated }: MessengerProps) {
  const {
    messages,
    isLoadingMessages,
    isSending,
    isLive,
    connectionStatus,
    sendMessage,
    toggleLiveMode,
  } = useChatWindow(room.id, room.live);

  const [inputText, setInputText] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText;
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessage(textToSend);
    if (onRoomUpdated) onRoomUpdated();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  const handleQuickResponse = (text: string) => {
    setInputText(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const customerEmail = room.customer?.email;
  const customerIdentity = customerEmail || `Khách truy cập #${room.id.slice(0, 8)}`;

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* 1. Header */}
      <header className="px-5 py-3.5 border-b border-border/60 bg-card/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-semibold text-sm shrink-0">
            {customerEmail ? customerEmail.charAt(0).toUpperCase() : "K"}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-foreground truncate">
                {customerIdentity}
              </h2>
              {/* WebSocket Connection Pill */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border shrink-0 ${
                  connectionStatus === "connected"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : connectionStatus === "connecting"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : "bg-muted text-muted-foreground border-border/50"
                }`}
                title={`WebSocket: ${connectionStatus}`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-emerald-500"
                      : connectionStatus === "connecting"
                      ? "bg-amber-500 animate-ping"
                      : "bg-muted-foreground"
                  }`}
                />
                {connectionStatus === "connected"
                  ? "Trực tuyến"
                  : connectionStatus === "connecting"
                  ? "Đang nối..."
                  : "Ngoại tuyến"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <GlobeIcon className="size-3" />
                {room.domain_name}
              </span>
              {room.customer && room.customer.total_questions_count > 0 && (
                <>
                  <span>•</span>
                  <span>
                    Đã trả lời {room.customer.answered_questions_count}/
                    {room.customer.total_questions_count} câu hỏi lọc
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Mode Toggle Switch */}
        <div className="flex items-center gap-3 bg-background/80 border border-border/70 px-3 py-1.5 rounded-lg shadow-xs">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span
                className={`text-xs font-semibold ${
                  isLive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                }`}
              >
                {isLive ? "Live: Nhân viên trực tiếp" : "AI Tự động"}
              </span>
              {isLive && <RadioIcon className="size-3 text-emerald-500 animate-pulse" />}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isLive ? "Bot tạm dừng để bạn chat" : "Bot AI đang tự xử lý"}
            </p>
          </div>
          <Switch
            checked={isLive}
            onCheckedChange={(checked) => toggleLiveMode(checked)}
            aria-label="Chuyển chế độ can thiệp người thật"
          />
        </div>
      </header>

      {/* 2. Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {isLoadingMessages ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Loader2Icon className="size-6 animate-spin text-primary" />
            <span className="text-xs">Đang tải lịch sử tin nhắn...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center space-y-1 text-muted-foreground">
            <p className="text-sm font-medium">Chưa có tin nhắn trong phòng này</p>
            <p className="text-xs">Hãy gửi tin nhắn đầu tiên để chào đón khách hàng.</p>
          </div>
        ) : (
          messages.map((item) => {
            const isUser = item.role === "user";
            const timeStr = formatMessageTime(item.created_at);

            return (
              <div
                key={item.id}
                className={`flex items-start gap-2.5 ${
                  isUser ? "justify-start" : "justify-end"
                }`}
              >
                {/* User avatar on left */}
                {isUser && (
                  <div className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 text-xs font-medium border border-border/40 mt-1">
                    <UserIcon className="size-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] sm:max-w-[70%] space-y-1.5 ${
                    isUser ? "items-start" : "items-end text-right"
                  }`}
                >
                  {/* Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed text-left whitespace-pre-wrap break-words ${
                      isUser
                        ? "bg-muted/90 text-foreground rounded-tl-sm border border-border/50"
                        : "bg-primary text-primary-foreground rounded-tr-sm shadow-xs"
                    }`}
                  >
                    {item.message}

                    {/* Action link if bot sent portal link */}
                    {item.link && (
                      <div className="mt-2.5 pt-2 border-t border-primary-foreground/20">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs underline font-medium text-primary-foreground hover:opacity-90"
                        >
                          <ExternalLinkIcon className="size-3.5" />
                          <span>Mở trang thao tác (Portal)</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Timestamp & read receipts */}
                  <div
                    className={`flex items-center gap-1 text-[11px] text-muted-foreground px-1 ${
                      isUser ? "justify-start" : "justify-end"
                    }`}
                  >
                    <span>{timeStr}</span>
                    {!isUser && (
                      <span title={item.seen ? "Đã đọc" : "Đã gửi"}>
                        {item.seen ? (
                          <CheckCheckIcon className="size-3 text-sky-500 inline" />
                        ) : (
                          <CheckIcon className="size-3 text-muted-foreground inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Assistant avatar on right */}
                {!isUser && (
                  <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-medium border border-primary/30 mt-1">
                    <BotIcon className="size-4" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Footer & Input Section */}
      <div className="p-4 border-t border-border bg-card space-y-3 shrink-0">
        {/* Quick reply suggestion chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[11px] text-muted-foreground shrink-0 font-medium mr-1 flex items-center gap-1">
            <SparklesIcon className="size-3 text-primary" /> Gợi ý:
          </span>
          {QUICK_RESPONSES.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickResponse(chip)}
              className="text-xs bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground px-2.5 py-1 rounded-full border border-border/50 shrink-0 transition-colors whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="space-y-2">
          <div className="relative rounded-lg border border-border/70 bg-background focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={
                isLive
                  ? "Nhập tin nhắn phản hồi trực tiếp cho khách hàng (Enter để gửi)..."
                  : "Chế độ AI đang bật. Bạn có thể gửi tin nhắn để trả lời thay AI bất cứ lúc nào..."
              }
              className="w-full resize-none bg-transparent p-3 text-xs md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-32 min-h-[44px]"
            />

            <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-border/30">
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                Enter để gửi • Shift + Enter xuống dòng
              </span>

              <Button
                type="submit"
                size="sm"
                disabled={!inputText.trim() || isSending}
                className="h-8 px-3.5 gap-1.5 text-xs font-semibold ml-auto"
              >
                {isSending ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Gửi</span>
                    <SendIcon className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
