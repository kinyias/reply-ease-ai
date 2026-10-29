"use client";

import * as React from "react";
import { HelpCircleIcon, MessageSquareIcon, ShoppingBagIcon } from "lucide-react";
import { BubbleLauncher } from "./bubble-launcher";
import { ChatbotHeader } from "./chatbot-header";
import { ChatTab } from "./chat-tab";
import { FAQTab } from "./faq-tab";
import { ProductsTab } from "./products-tab";
import { useChatbot } from "@/hooks/chatbot/use-chatbot";
import { useI18n } from "@/context/i18n-context";

interface ChatbotWindowProps {
  initialDomainId?: string;
}

export function ChatbotWindow({ initialDomainId }: ChatbotWindowProps) {
  const { t } = useI18n();
  const {
    domainId,
    setDomainId,
    isEmbedded,
    isOpen,
    toggleOpen,
    activeTab,
    setActiveTab,
    config,
    isLoadingConfig,
    configError,
    messages,
    isTyping,
    isLive,
    sendMessage,
    resetChat,
  } = useChatbot();

  React.useEffect(() => {
    if (initialDomainId && !domainId) {
      setDomainId(initialDomainId);
    }
  }, [initialDomainId, domainId, setDomainId]);

  const botName = config?.domain_name || t("chatbot.defaultBotName", "AI Assistant");
  const themeColor = config?.background || "#ff7a00";
  const textColor = config?.text_color || "#ffffff";
  const botIcon = config?.icon || null;

  // If in embedded iframe mode and widget is closed: render floating bubble only
  if (isEmbedded && !isOpen) {
    return (
      <div className="fixed inset-0 pointer-events-none flex items-end justify-end p-2 sm:p-4">
        <div className="pointer-events-auto">
          <BubbleLauncher
            isOpen={false}
            onToggle={() => toggleOpen(true)}
            botIcon={botIcon}
            botName={botName}
            themeColor={themeColor}
          />
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingConfig && !config) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <div
            style={{ borderColor: themeColor, borderTopColor: "transparent" }}
            className="size-8 rounded-full border-2 animate-spin"
          />
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t("chatbot.loadingAssistant", "Loading AI Assistant...")}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (configError && !config) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="max-w-sm w-full p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 shadow-md text-center space-y-3">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            {t("chatbot.notFoundTitle", "Chatbot Not Found")}
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {configError}
          </p>
          <p className="text-[11px] text-zinc-400">
            {t("chatbot.notFoundHelp", "Please verify the domain_id parameter in your URL.")}
          </p>
        </div>
      </div>
    );
  }

  const hasHelpDesk = Boolean(config?.helpdesk_enabled && config.faqs.length > 0);
  const hasProducts = Boolean(config?.products && config.products.length > 0);

  return (
    <div
      className={`fixed inset-0 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden ${
        isEmbedded
          ? "rounded-none sm:rounded-2xl border-0 sm:border border-zinc-200/80 dark:border-zinc-800 shadow-2xl"
          : "max-w-md mx-auto my-auto h-[95vh] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl"
      }`}
    >
      {/* 1. Header */}
      <ChatbotHeader
        domainName={botName}
        botIcon={botIcon}
        isLive={isLive}
        themeColor={themeColor}
        textColor={textColor}
        onReset={resetChat}
        onClose={() => toggleOpen(false)}
      />

      {/* 2. Navigation Tabs (Chat / FAQ / Sản phẩm) */}
      {(hasHelpDesk || hasProducts) && (
        <div className="flex items-center border-b border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            style={
              activeTab === "chat"
                ? { borderColor: themeColor, color: themeColor }
                : undefined
            }
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "chat"
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <MessageSquareIcon className="size-3.5" />
            <span>{t("chatbot.tabChat", "Chat")}</span>
          </button>

          {hasHelpDesk && (
            <button
              type="button"
              onClick={() => setActiveTab("faq")}
              style={
                activeTab === "faq"
                  ? { borderColor: themeColor, color: themeColor }
                  : undefined
              }
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === "faq"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <HelpCircleIcon className="size-3.5" />
              <span>{t("chatbot.tabFaq", { count: config?.faqs.length || 0 })}</span>
            </button>
          )}

          {hasProducts && (
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              style={
                activeTab === "products"
                  ? { borderColor: themeColor, color: themeColor }
                  : undefined
              }
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === "products"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <ShoppingBagIcon className="size-3.5" />
              <span>{t("chatbot.tabProducts", { count: config?.products.length || 0 })}</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Main Body */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "chat" && (
          <ChatTab
            messages={messages}
            isTyping={isTyping}
            isLive={isLive}
            botIcon={botIcon}
            botName={botName}
            themeColor={themeColor}
            onSendMessage={sendMessage}
          />
        )}

        {activeTab === "faq" && config && (
          <FAQTab
            faqs={config.faqs}
            themeColor={themeColor}
            onAskFAQ={(question) => {
              setActiveTab("chat");
              sendMessage(t("chatbot.askFaqPrefix", { question }));
            }}
          />
        )}

        {activeTab === "products" && config && (
          <ProductsTab
            products={config.products}
            themeColor={themeColor}
            onInquireProduct={(prompt) => {
              setActiveTab("chat");
              sendMessage(prompt);
            }}
          />
        )}
      </div>
    </div>
  );
}
