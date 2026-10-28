"use client";

import * as React from "react";
import { ConversationMenu } from "@/components/conversations/conversation-menu";
import { EmptyConversationState } from "@/components/conversations/empty-state";
import { Messenger } from "@/components/conversations/messenger";
import { MessengerSkeleton } from "@/components/conversations/message-skeleton";
import { useConversation } from "@/hooks/conversation/use-conversation";

export default function ConversationsPage() {
  const {
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
    counts,
    page,
    setPage,
    totalPages,
  } = useConversation();

  return (
    <div className="flex-1 flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden bg-background">
      {/* Left Column: Conversation Sidebar Menu */}
      <ConversationMenu
        domains={domains}
        selectedDomainId={selectedDomainId}
        onSelectDomain={setSelectedDomainId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={selectRoom}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onRefresh={refetch}
        counts={counts}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Right Column: Live Messenger Window or Empty State */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {activeRoom ? (
          <Messenger
            key={activeRoom.id}
            room={activeRoom}
            onRoomUpdated={refreshConversations}
          />
        ) : isLoading ? (
          <MessengerSkeleton />
        ) : (
          <EmptyConversationState />
        )}
      </main>
    </div>
  );
}
