"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GlobeIcon,
  InboxIcon,
  RotateCwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatCard } from "@/components/conversations/chat-card";
import { ConversationTabs } from "@/components/conversations/conversation-tabs";
import { ConversationRoomSummary, ConversationTab } from "@/types/conversation";
import { Domain } from "@/types/domain";
import { useI18n } from "@/context/i18n-context";

interface ConversationMenuProps {
  domains: Domain[];
  selectedDomainId: string;
  onSelectDomain: (domainId: string) => void;
  activeTab: ConversationTab;
  onTabChange: (tab: ConversationTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  rooms: ConversationRoomSummary[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  isLoading: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
  counts: {
    total: number;
    unread: number;
    live: number;
    urgent: number;
  };
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function ConversationMenu({
  domains,
  selectedDomainId,
  onSelectDomain,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  rooms,
  activeRoomId,
  onSelectRoom,
  isLoading,
  isRefetching,
  onRefresh,
  counts,
  page = 1,
  totalPages = 1,
  onPageChange,
}: ConversationMenuProps) {
  const { t } = useI18n();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search input
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <aside className="w-full md:w-80 lg:w-96 border-r border-border bg-sidebar/60 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-base text-foreground tracking-tight">
              {t("conversations.title", "Live Conversations")}
            </h1>
            {counts.unread > 0 && (
              <span className="text-[10px] bg-primary text-primary-foreground font-semibold px-2 py-0.5 rounded-full tabular-nums">
                {t("conversations.newBadge", { count: counts.unread })}
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefetching || isLoading}
            className="size-8 text-muted-foreground hover:text-foreground"
            title={t("conversations.refresh", "Refresh list")}
          >
            <RotateCwIcon
              className={`size-4 ${isRefetching ? "animate-spin text-primary" : ""}`}
            />
          </Button>
        </div>

        {/* Domain Filter Selector */}
        {domains.length > 0 && (
          <div className="relative">
            <select
              value={selectedDomainId}
              onChange={(e) => onSelectDomain(e.target.value)}
              className="w-full h-8.5 text-xs bg-background/80 border border-border/70 rounded-md px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-8 truncate font-medium"
            >
              <option value="all">{t("conversations.allDomains", { count: domains.length })}</option>
              {domains.map((dom) => (
                <option key={dom.id} value={dom.id}>
                  {dom.name}
                </option>
              ))}
            </select>
            <GlobeIcon className="size-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* Search input with shortcut hint */}
        <div className="relative">
          <SearchIcon className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={t("conversations.searchPlaceholder", "Search by email, message content... (/)")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8.5 pl-8 pr-7 text-xs bg-background/70 border-border/70"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <ConversationTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          counts={counts}
        />
      </div>

      {/* Room list content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y-0">
        {isLoading ? (
          <div className="space-y-2 py-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-border/40 bg-card/40 flex items-start gap-3"
              >
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-10 shrink-0" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                  <div className="flex items-center gap-2 pt-0.5">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-3 w-14 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-16 text-center px-4 space-y-3">
            <InboxIcon className="size-8 mx-auto text-muted-foreground/50 stroke-[1.5]" />
            <p className="text-sm font-semibold text-foreground">
              {t("conversations.noConversations", "No conversations yet")}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {searchQuery
                ? t("conversations.noResults", "No results match your search keywords.")
                : activeTab === "unread"
                ? t("conversations.noUnread", "Great job! You have no unread messages.")
                : activeTab === "urgent"
                ? t("conversations.noUrgent", "No urgent conversations requiring immediate action.")
                : activeTab === "live"
                ? t("conversations.noLive", "No chat rooms currently in Live mode.")
                : t("conversations.noConversationsHint", "When visitors message through the Chatbot Widget, conversations will appear here.")}
            </p>
          </div>
        ) : (
          rooms.map((room) => (
            <ChatCard
              key={room.id}
              room={room}
              isActive={activeRoomId === room.id}
              onSelect={onSelectRoom}
            />
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="p-2.5 border-t border-border bg-sidebar/80 flex items-center justify-between text-xs shrink-0">
          <span className="text-muted-foreground font-medium">
            {t("conversations.page", { page, total: totalPages })}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeftIcon className="size-3.5 mr-0.5" />
              {t("conversations.prev", "Previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || isLoading}
            >
              {t("conversations.next", "Next")}
              <ChevronRightIcon className="size-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
