"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Bot,
  ChevronDown,
  HelpCircle,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { UpdateChatBotInput } from "@/types/domain";
import { ChatMessageContent } from "@/components/chatbot/chat-message-content";

interface ChatbotPreviewProps {
  preview: UpdateChatBotInput;
  domainName?: string;
}

interface TestMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

export function ChatbotPreview({
  preview,
  domainName = "store.vn",
}: ChatbotPreviewProps) {
  const [testInput, setTestInput] = useState("");
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);

  const headerBg = preview.background || "#f25f22";
  const headerText = preview.text_color || "#ffffff";
  const avatarUrl =
    preview.icon ||
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80";
  const welcomeText =
    preview.welcome_message || "Hey there, have a question? Text us here";
  const showHelpdesk = Boolean(preview.helpdesk);

  const sampleFaqs = [
    {
      id: 1,
      q: "Chính sách đổi trả & hoàn tiền?",
      a: "Hỗ trợ 1 đổi 1 trong vòng 7 ngày cho mọi sản phẩm có lỗi từ nhà sản xuất.",
    },
    {
      id: 2,
      q: "Thời gian giao hàng dự kiến?",
      a: "Nội thành nhận hàng trong 24h, các tỉnh thành khác từ 2-3 ngày làm việc.",
    },
    {
      id: 3,
      q: "Phương thức thanh toán hỗ trợ?",
      a: "Thanh toán tự động qua SePay VietQR quét mã hoặc chuyển khoản ngân hàng.",
    },
  ];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = testInput.trim();
    if (!trimmed) return;

    const newMsg: TestMessage = {
      id: String(Date.now()),
      sender: "user",
      text: trimmed,
      time: "Vừa xong",
    };

    setTestMessages((prev) => [...prev, newMsg]);
    setTestInput("");

    // Simulate instant autonomous bot response
    setTimeout(() => {
      const lower = trimmed.toLowerCase();
      let replyText = `Cảm ơn bạn! Em đã ghi nhận câu hỏi "${trimmed}". Em có thể hỗ trợ kiểm tra đơn hàng hoặc tư vấn thêm cho bạn ngay ạ!`;
      
      if (
        lower.includes("sản phẩm") ||
        lower.includes("áo") ||
        lower.includes("giá") ||
        lower.includes("ảnh") ||
        lower.includes("hình") ||
        lower.includes("product")
      ) {
        replyText = `Dạ bên em xin gửi bạn thông tin sản phẩm Áo thun Oversize cao cấp với giá 250.000 đ ạ:\n<Image>https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80</Image>\nBạn có muốn đặt mua mẫu này không ạ?`;
      }

      const botReply: TestMessage = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: replyText,
        time: "Vừa xong",
      };
      setTestMessages((prev) => [...prev, botReply]);
    }, 600);
  };

  const handleResetChat = () => {
    setTestMessages([]);
    setOpenFaqId(null);
  };

  return (
    <div
      data-ui="chatbot-widget"
      className="w-full max-w-[390px] mx-auto rounded-2xl border border-border bg-card shadow-lg overflow-hidden flex flex-col font-sans transition-all duration-200"
    >
      {/* Live Preview Label Bar */}
      <div className="bg-muted/80 px-4 py-2 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Interactive Live Widget Preview</span>
        </div>
        <button
          type="button"
          onClick={handleResetChat}
          title="Reset test preview chat"
          className="hover:text-foreground transition-colors p-1 rounded-md"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      {/* Widget Header */}
      <div
        className="px-4 py-3.5 flex items-center justify-between transition-colors duration-200"
        style={{ backgroundColor: headerBg, color: headerText }}
      >
        <div className="flex items-center gap-3">
          <div className="relative size-10 rounded-full overflow-hidden border-2 border-white/30 bg-black/10 shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Chatbot Avatar"
                fill
                sizes="40px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Bot className="size-5" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 border-2 border-card" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-semibold text-sm leading-tight">
                ReplyEase AI
              </h4>
              <Sparkles className="size-3.5 opacity-80" />
            </div>
            <p className="text-xs opacity-85 leading-tight mt-0.5">
              {domainName} • Trực tuyến 24/7
            </p>
          </div>
        </div>
      </div>

      {/* Widget Chat Stream */}
      <div className="flex-1 min-h-[360px] max-h-[420px] overflow-y-auto p-4 space-y-3 bg-muted/20 text-xs">
        {/* Welcome Message from Bot */}
        <div className="flex items-start gap-2 max-w-[88%]">
          <div className="relative size-6 rounded-full overflow-hidden shrink-0 mt-0.5 border border-border">
            <Image
              src={avatarUrl}
              alt="Bot"
              fill
              sizes="24px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="space-y-1">
            <div className="bg-card text-card-foreground p-3 rounded-2xl rounded-tl-xs border border-border shadow-2xs leading-relaxed text-[13px] whitespace-pre-wrap">
              {welcomeText}
            </div>
            <span className="text-[10px] text-muted-foreground px-1">
              Hôm nay • ReplyEase AI
            </span>
          </div>
        </div>

        {/* Optional HelpDesk FAQ Tab inside Chat */}
        {showHelpdesk && (
          <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-2 my-2 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <HelpCircle className="size-3.5 text-brand-accent" />
              <span>Câu hỏi thường gặp (FAQ)</span>
            </div>
            <div className="divide-y divide-border/60 text-xs">
              {sampleFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id} className="py-1.5 first:pt-1 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between text-left py-1 text-muted-foreground hover:text-foreground font-medium transition-colors"
                    >
                      <span className="pr-2">{faq.q}</span>
                      <ChevronDown
                        className={`size-3.5 shrink-0 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="text-[11px] text-foreground/80 pt-1 pb-1.5 pl-1 leading-relaxed bg-muted/40 rounded px-2 mt-1">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User Simulated Interaction Messages */}
        {testMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-[13px] shadow-2xs ${
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-xs"
                  : "bg-card text-card-foreground border border-border rounded-tl-xs"
              }`}
            >
              <ChatMessageContent content={msg.text} isUser={msg.sender === "user"} />
            </div>
          </div>
        ))}
      </div>

      {/* Widget Test Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 border-t border-border bg-card flex items-center gap-2"
      >
        <input
          type="text"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="Thử gõ tin nhắn để test bot..."
          className="flex-1 text-xs bg-muted/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-ring border border-input transition-colors text-foreground placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!testInput.trim()}
          className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
          title="Send test message"
        >
          <Send className="size-3.5" />
        </button>
      </form>
    </div>
  );
}

export default ChatbotPreview;
