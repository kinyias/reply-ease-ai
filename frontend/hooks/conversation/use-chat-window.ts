"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { conversationService } from "@/services/conversation-service";
import { ChatMessageItem, WebSocketMessagePayload } from "@/types/conversation";

function getWebSocketUrl(roomId: string): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return `${process.env.NEXT_PUBLIC_WS_URL}/ws/chat/${roomId}`;
  }

  if (typeof window !== "undefined") {
    const isHttps = window.location.protocol === "https:";
    const wsProto = isHttps ? "wss:" : "ws:";
    // Default to port 8000 backend
    const host = window.location.hostname || "localhost";
    return `${wsProto}//${host}:8000/ws/chat/${roomId}`;
  }

  return `ws://localhost:8000/ws/chat/${roomId}`;
}

export function useChatWindow(roomId: string | null, initialLiveState: boolean = false) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(initialLiveState);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("disconnected");

  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeRoomIdRef = useRef<string | null>(roomId);

  activeRoomIdRef.current = roomId;

  // Sync initialLiveState when room changes
  useEffect(() => {
    setIsLive(initialLiveState);
  }, [roomId, initialLiveState]);

  // 1. Fetch message history & mark room as seen
  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);

    conversationService
      .getMessages(roomId)
      .then((history) => {
        if (!isMounted) return;
        setMessages(history);
        // Automatically mark unread messages as seen
        conversationService.markSeen(roomId).catch(() => {});
      })
      .catch((err) => {
        if (!isMounted) return;
        toast.error("Không thể tải tin nhắn phòng chat", {
          description: err.response?.data?.detail || "Đã xảy ra lỗi kết nối.",
        });
      })
      .finally(() => {
        if (isMounted) setIsLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // 2. Manage WebSocket Connection
  useEffect(() => {
    if (!roomId) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");
    const wsUrl = getWebSocketUrl(roomId);
    let socket: WebSocket;

    try {
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;
    } catch (e) {
      setConnectionStatus("disconnected");
      return;
    }

    socket.onopen = () => {
      if (activeRoomIdRef.current === roomId) {
        setConnectionStatus("connected");
      }

      // Start ping heartbeat every 25 seconds
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    socket.onmessage = (event) => {
      try {
        const payload: WebSocketMessagePayload = JSON.parse(event.data);

        if (payload.type === "new_message" && payload.message) {
          const newMsg = payload.message;
          setMessages((prev) => {
            // Avoid duplicate message by ID
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
        } else if (payload.type === "live_mode_toggled" && typeof payload.live === "boolean") {
          setIsLive(payload.live);
        } else if (payload.type === "messages_seen") {
          setMessages((prev) =>
            prev.map((m) => (m.seen ? m : { ...m, seen: true }))
          );
        }
      } catch {
        // Ignore unparseable raw frame
      }
    };

    socket.onerror = () => {
      setConnectionStatus("disconnected");
    };

    socket.onclose = () => {
      if (activeRoomIdRef.current === roomId) {
        setConnectionStatus("disconnected");
      }
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      socket.close();
      socketRef.current = null;
    };
  }, [roomId]);

  // 3. Send message handler
  const sendMessage = useCallback(
    async (text: string) => {
      if (!roomId || !text.trim() || isSending) return;

      const cleanText = text.trim();
      setIsSending(true);

      // Create optimistic message
      const tempId = `temp_${Date.now()}`;
      const optimisticMsg: ChatMessageItem = {
        id: tempId,
        message: cleanText,
        role: "assistant",
        seen: true,
        chat_room_id: roomId,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const savedMsg = await conversationService.sendMessage(roomId, cleanText);
        // Replace temp optimistic message with persisted message
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? savedMsg : m))
        );
      } catch (err: any) {
        // Revert optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error("Không thể gửi tin nhắn", {
          description: err.response?.data?.detail || "Vui lòng thử lại sau.",
        });
      } finally {
        setIsSending(false);
      }
    },
    [roomId, isSending]
  );

  // 4. Toggle Live Mode handler
  const toggleLiveMode = useCallback(
    async (targetLiveState?: boolean) => {
      if (!roomId) return;
      const nextState = typeof targetLiveState === "boolean" ? targetLiveState : !isLive;
      const prevState = isLive;
      setIsLive(nextState);

      try {
        await conversationService.toggleRealtime(roomId, nextState);
        toast.success(
          nextState
            ? "Đã bật chế độ tư vấn trực tiếp (Live Mode)"
            : "Đã chuyển về chế độ Trợ lý AI tự động"
        );
      } catch (err: any) {
        setIsLive(prevState);
        toast.error("Không thể thay đổi chế độ Live", {
          description: err.response?.data?.detail || "Đã xảy ra lỗi vui lòng thử lại.",
        });
      }
    },
    [roomId, isLive]
  );

  return {
    messages,
    isLoadingMessages,
    isSending,
    isLive,
    connectionStatus,
    sendMessage,
    toggleLiveMode,
  };
}
