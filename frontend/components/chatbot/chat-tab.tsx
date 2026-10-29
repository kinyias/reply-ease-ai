"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowRightIcon,
  BotIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  RadioIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";
import { MessageItem } from "@/types/chatbot";
import { ChatMessageContent } from "./chat-message-content";
import { useI18n } from "@/context/i18n-context";

interface ChatTabProps {
  messages: MessageItem[];
  isTyping: boolean;
  isLive: boolean;
  botIcon?: string | null;
  botName?: string;
  themeColor?: string | null;
  onSendMessage: (text: string) => void;
}

const getQuickSuggestions = (t: (key: string, paramsOrFallback?: any, fallback?: string) => string) => [
  t("chatbot.quickProduct", "Product & service consultation"),
  t("chatbot.quickQuote", "Pricing & quote inquiry"),
  t("chatbot.quickBooking", "Book a consultation call"),
  t("chatbot.quickHuman", "Talk to a live specialist"),
];

export function ChatTab({
  messages,
  isTyping,
  isLive,
  botIcon,
  botName: propBotName,
  themeColor,
  onSendMessage,
}: ChatTabProps) {
  const { t } = useI18n();
  const botName = propBotName || t("chatbot.defaultBotName", "AI Assistant");
  const [inputValue, setInputValue] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom whenever messages or typing state changes
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    onSendMessage(inputValue);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  const accentColor = themeColor || "#ff7a00";

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 text-foreground overflow-hidden">
      {/* Live Notice Banner */}
      {isLive && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3.5 py-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
          <RadioIcon className="size-3.5 shrink-0 animate-pulse text-red-500" />
          <span>
            {t("chatbot.liveBanner")}
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((item) => {
          const isUser = item.role === "user";

          return (
            <div
              key={item.id}
              className={`flex items-start gap-2.5 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {/* Bot Avatar */}
              {!isUser && (
                <div className="relative size-7 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 mt-0.5 border border-zinc-200 dark:border-zinc-700">
                  {botIcon ? (
                    <Image
                      src={botIcon}
                      alt={botName}
                      fill
                      className="object-cover"
                      sizes="28px"
                    />
                  ) : (
                    <div
                      style={{ backgroundColor: accentColor }}
                      className="size-full flex items-center justify-center text-white"
                    >
                      <BotIcon className="size-4" />
                    </div>
                  )}
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className={`flex flex-col gap-1.5 max-w-[82%] sm:max-w-[78%] ${
                  isUser ? "items-end" : "items-start"
                }`}
              >
                <div
                  style={
                    isUser
                      ? { backgroundColor: accentColor, color: "#ffffff" }
                      : undefined
                  }
                  className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs break-words ${
                    isUser
                      ? "rounded-tr-xs shadow-zinc-900/10"
                      : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 rounded-tl-xs border border-zinc-200/80 dark:border-zinc-800"
                  }`}
                >
                  <ChatMessageContent content={item.message} isUser={isUser} />

                  {/* Render Portal or Custom Action Links if present */}
                  {item.link && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                      {item.link.includes("/appointment/") ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs transition-colors shadow-xs"
                        >
                          <CalendarDaysIcon className="size-3.5" />
                          <span>{t("chatbot.openBookingPortal", "Open Consultation Booking")}</span>
                          <ArrowRightIcon className="size-3" />
                        </a>
                      ) : item.link.includes("/payment/") ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-xs"
                        >
                          <CreditCardIcon className="size-3.5" />
                          <span>{t("chatbot.payOrderVietqr", "Pay Order via VietQR")}</span>
                          <ArrowRightIcon className="size-3" />
                        </a>
                      ) : (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-900 text-white font-medium text-xs transition-colors shadow-xs"
                        >
                          <ExternalLinkIcon className="size-3.5" />
                          <span>{t("chatbot.viewLink", "View Link")}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Subtle Timestamp */}
                {item.created_at && (
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 px-1">
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2.5">
            <div className="relative size-7 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
              <SparklesIcon
                className="size-3.5 animate-spin"
                style={{ color: accentColor }}
              />
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-xs bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-1.5 shadow-xs">
              <span
                style={{ backgroundColor: accentColor }}
                className="size-1.5 rounded-full animate-bounce [animation-delay:-0.3s]"
              />
              <span
                style={{ backgroundColor: accentColor }}
                className="size-1.5 rounded-full animate-bounce [animation-delay:-0.15s]"
              />
              <span
                style={{ backgroundColor: accentColor }}
                className="size-1.5 rounded-full animate-bounce"
              />
            </div>
          </div>
        )}

        {/* Quick Suggestion Chips (Shown when messages <= 3) */}
        {messages.length <= 3 && !isTyping && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-2 px-1">
              {t("chatbot.quickSuggestionsLabel", "Quick suggestions:")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {getQuickSuggestions(t).map((suggestion: string) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onSendMessage(suggestion)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-orange-400/50 hover:bg-orange-50/50 dark:hover:bg-zinc-800 transition-all text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="relative flex-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 focus-within:border-orange-500/80 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={t("chatbot.inputPlaceholder", "Type your message... (Press Enter to send)")}
              disabled={isTyping}
              className="w-full resize-none bg-transparent px-3.5 py-2.5 text-xs sm:text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-hidden max-h-[120px] leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            style={{ backgroundColor: accentColor }}
            className="size-9 rounded-xl text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all shadow-xs"
            aria-label={t("chatbot.sendMessage", "Send message")}
          >
            <SendIcon className="size-4" />
          </button>
        </form>

        {/* Footer Credit */}
        <div className="text-center mt-2">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            Powered by{" "}
            <a
              href="https://replyease.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
              style={{ color: accentColor }}
            >
              ReplyEase AI
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
