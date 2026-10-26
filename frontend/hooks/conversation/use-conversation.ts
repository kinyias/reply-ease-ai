"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { conversationService } from "@/services/conversation-service";
import { ConversationRoomSummary, ConversationTab } from "@/types/conversation";
import { useDomainManagement } from "@/hooks/sidebar/use-domain-management";

export function useConversation() {
  const queryClient = useQueryClient();
  const { domains } = useDomainManagement();

  const [selectedDomainId, setSelectedDomainId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<ConversationTab>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Query conversation rooms
  const {
    data: conversationData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["conversations", selectedDomainId, activeTab, debouncedSearch],
    queryFn: () =>
      conversationService.getConversations(
        selectedDomainId === "all" ? null : selectedDomainId,
        activeTab,
        debouncedSearch
      ),
    refetchInterval: 15000, // Background polling fallback every 15s
  });

  const rooms: ConversationRoomSummary[] = conversationData?.rooms || [];

  // Automatically select the first room if none is selected and rooms exist
  useEffect(() => {
    if (!activeRoomId && rooms.length > 0) {
      setActiveRoomId(rooms[0].id);
    } else if (activeRoomId && rooms.length > 0) {
      // If activeRoomId is not found in the current rooms list, select the first one
      const exists = rooms.some((r) => r.id === activeRoomId);
      if (!exists && activeTab === "all" && !debouncedSearch) {
        setActiveRoomId(rooms[0].id);
      }
    }
  }, [rooms, activeRoomId, activeTab, debouncedSearch]);

  const activeRoom = useMemo(() => {
    if (!activeRoomId) return null;
    return rooms.find((r) => r.id === activeRoomId) || null;
  }, [rooms, activeRoomId]);

  const selectRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
  }, []);

  const refreshConversations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [queryClient]);

  return {
    domains,
    selectedDomainId,
    setSelectedDomainId,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    rooms,
    activeRoomId,
    activeRoom,
    selectRoom,
    isLoading,
    isRefetching,
    refetch,
    refreshConversations,
    counts: {
      total: conversationData?.total ?? 0,
      unread: conversationData?.unread_total ?? 0,
      live: conversationData?.live_total ?? 0,
      urgent: conversationData?.urgent_total ?? 0,
    },
  };
}
