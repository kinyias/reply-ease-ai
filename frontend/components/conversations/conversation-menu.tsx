"use client";

import * as React from "react";
import {
  GlobeIcon,
  InboxIcon,
  RotateCwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatCard } from "@/components/conversations/chat-card";
import { ConversationTabs } from "@/components/conversations/conversation-tabs";
import { ConversationRoomSummary, ConversationTab } from "@/types/conversation";
import { Domain } from "@/types/domain";

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
}: ConversationMenuProps) {
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
              Hội thoại Live
            </h1>
            {counts.unread > 0 && (
              <span className="text-[10px] bg-primary text-primary-foreground font-semibold px-2 py-0.5 rounded-full tabular-nums">
                {counts.unread} mới
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefetching || isLoading}
            className="size-8 text-muted-foreground hover:text-foreground"
            title="Làm mới danh sách"
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
              <option value="all">Tất cả các Domain ({domains.length})</option>
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
            placeholder="Tìm theo email, nội dung tin nhắn... (/)"
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
          <div className="py-12 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-lg border border-border/40 bg-muted/20 animate-pulse flex items-start gap-3"
              >
                <div className="size-10 rounded-full bg-muted/60 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted/60 rounded w-2/3" />
                  <div className="h-3 bg-muted/40 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-16 text-center px-4 space-y-3">
            <InboxIcon className="size-8 mx-auto text-muted-foreground/50 stroke-[1.5]" />
            <p className="text-sm font-semibold text-foreground">
              Không có cuộc hội thoại nào
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {searchQuery
                ? "Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm của bạn."
                : activeTab === "unread"
                ? "Tuyệt vời! Bạn không còn tin nhắn chưa đọc nào."
                : activeTab === "urgent"
                ? "Không có cuộc hội thoại khẩn cấp nào cần xử lý ngay."
                : activeTab === "live"
                ? "Chưa có phòng chat nào đang kích hoạt chế độ Live."
                : "Khi khách truy cập gửi tin nhắn qua Chatbot Widget, hội thoại sẽ hiển thị tại đây."}
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
    </aside>
  );
}
