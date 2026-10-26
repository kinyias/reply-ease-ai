"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import chatbotService from "@/services/chatbot-service";
import { ChatbotConfig, MessageItem } from "@/types/chatbot";

export function useChatbot() {
  const searchParams = useSearchParams();
  const urlDomainId = searchParams.get("domain_id") || "";
  const isEmbedded = searchParams.get("embedded") === "true";

  const [domainId, setDomainId] = useState<string>(urlDomainId);
  const [isOpen, setIsOpen] = useState<boolean>(!isEmbedded);
  const [activeTab, setActiveTab] = useState<"chat" | "faq" | "products">("chat");

  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(false);

  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [chatroomId, setChatroomId] = useState<string | null>(null);

  const isInitializedRef = useRef<boolean>(false);

  // 1. Listen for postMessage from parent host window (widget loader)
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "REPLYEASE_INIT" && event.data.domainId) {
        setDomainId(event.data.domainId);
      }
    }

    window.addEventListener("message", handleMessage);

    // Request config from parent if embedded
    if (isEmbedded && typeof window !== "undefined" && window.parent) {
      window.parent.postMessage({ type: "REPLYEASE_GET_CONFIG" }, "*");
    }

    return () => window.removeEventListener("message", handleMessage);
  }, [isEmbedded]);

  // Sync open state with parent window via postMessage
  const toggleOpen = useCallback(
    (targetState?: boolean) => {
      setIsOpen((prev) => {
        const nextState = typeof targetState === "boolean" ? targetState : !prev;
        if (typeof window !== "undefined" && window.parent && isEmbedded) {
          window.parent.postMessage(
            { type: "REPLYEASE_RESIZE", open: nextState },
            "*"
          );
        }
        return nextState;
      });
    },
    [isEmbedded]
  );

  // 2. Load Chatbot Configuration when domainId is available
  useEffect(() => {
    if (!domainId) return;

    let isMounted = true;
    setIsLoadingConfig(true);
    setConfigError(null);

    chatbotService
      .getConfig(domainId)
      .then((cfg) => {
        if (!isMounted) return;
        setConfig(cfg);

        // Check if there's an existing session in localStorage
        const sessionKey = `replyease_session_${domainId}`;
        const savedSession = localStorage.getItem(sessionKey);

        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed.chatroomId) {
              setChatroomId(parsed.chatroomId);
              setCustomerEmail(parsed.customerEmail || null);

              // Restore history
              chatbotService
                .getSessionHistory(domainId, parsed.chatroomId)
                .then((history) => {
                  if (!isMounted) return;
                  if (history && history.messages.length > 0) {
                    setMessages(
                      history.messages.map((m) => ({
                        id: m.id,
                        role: m.role === "assistant" ? "assistant" : "user",
                        message: m.message,
                        created_at: m.created_at,
                      }))
                    );
                    setIsLive(history.live);
                    return;
                  }
                  // Fallback to welcome message
                  setDefaultWelcomeMessage(cfg);
                })
                .catch(() => {
                  setDefaultWelcomeMessage(cfg);
                });
              return;
            }
          } catch {
            // ignore JSON error
          }
        }

        setDefaultWelcomeMessage(cfg);
      })
      .catch((err) => {
        if (!isMounted) return;
        setConfigError(
          err.response?.data?.detail || "Không thể tải cấu hình Chatbot."
        );
      })
      .finally(() => {
        if (isMounted) setIsLoadingConfig(false);
      });

    return () => {
      isMounted = false;
    };
  }, [domainId]);

  const setDefaultWelcomeMessage = (cfg: ChatbotConfig) => {
    setMessages([
      {
        id: "msg_welcome",
        role: "assistant",
        message: cfg.welcome_message || "Xin chào! Em có thể giúp gì cho mình ạ?",
        created_at: new Date().toISOString(),
      },
    ]);
  };

  // 3. Send message handler
  const sendMessage = useCallback(
    async (text: string) => {
      const cleanText = text.trim();
      if (!cleanText || !domainId || isTyping) return;

      const userMsgId = `user_${Date.now()}`;
      const newUserMsg: MessageItem = {
        id: userMsgId,
        role: "user",
        message: cleanText,
        created_at: new Date().toISOString(),
      };

      // Optimistically append user message
      setMessages((prev) => [...prev, newUserMsg]);
      setIsTyping(true);

      // Build chat history for context
      const chatHistory = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6)
        .map((m) => ({
          role: m.role,
          message: m.raw_message || m.message,
        }));

      try {
        const response = await chatbotService.sendMessage(domainId, {
          message: cleanText,
          chat_history: chatHistory,
          customer_email: customerEmail,
          chatroom_id: chatroomId,
        });

        // Save session state
        if (response.chatroom_id) {
          setChatroomId(response.chatroom_id);
        }
        if (response.live) {
          setIsLive(true);
        }

        const sessionKey = `replyease_session_${domainId}`;
        localStorage.setItem(
          sessionKey,
          JSON.stringify({
            chatroomId: response.chatroom_id || chatroomId,
            customerEmail: customerEmail,
          })
        );

        // Append assistant response
        const assistantMsg: MessageItem = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          message: response.message,
          raw_message: response.raw_message,
          created_at: response.created_at || new Date().toISOString(),
          link: response.link,
          isLivePrompt: response.live,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        const errorMsg: MessageItem = {
          id: `error_${Date.now()}`,
          role: "assistant",
          message:
            "Xin lỗi, hiện tại em đang gặp chút trục trặc kết nối. Mình vui lòng thử lại sau ít giây nhé ạ!",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [domainId, isTyping, messages, customerEmail, chatroomId]
  );

  // 4. Reset chat conversation
  const resetChat = useCallback(() => {
    if (!domainId) return;
    const sessionKey = `replyease_session_${domainId}`;
    localStorage.removeItem(sessionKey);
    setChatroomId(null);
    setCustomerEmail(null);
    setIsLive(false);

    if (config) {
      setDefaultWelcomeMessage(config);
    }
  }, [domainId, config]);

  return {
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
  };
}
