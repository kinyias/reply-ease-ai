"use client";

import React, { useState } from "react";
import {
  CalendarIcon,
  CheckCircleIcon,
  MailIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Campaign, CreateCampaignPayload } from "@/types/marketing";

interface CampaignListProps {
  campaigns: Campaign[];
  activeCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
  onCreateCampaign: (payload: CreateCampaignPayload) => Promise<any>;
  onDeleteCampaign: (id: string) => Promise<any>;
  isCreating?: boolean;
  isDeleting?: boolean;
}

export function CampaignList({
  campaigns,
  activeCampaignId,
  onSelectCampaign,
  onCreateCampaign,
  onDeleteCampaign,
  isCreating = false,
  isDeleting = false,
}: CampaignListProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    await onCreateCampaign({
      name: newCampaignName.trim(),
      template:
        "Xin chào {{email}},\n\nCảm ơn bạn đã quan tâm đến dịch vụ của chúng tôi! Chúng tôi xin gửi tới bạn thông tin cập nhật mới nhất...\n\nTrân trọng,\nĐội ngũ CSKH ReplyEase AI",
      customers: [],
    });

    setNewCampaignName("");
    setIsCreateModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!campaignToDelete) return;
    await onDeleteCampaign(campaignToDelete.id);
    setCampaignToDelete(null);
  };

  return (
    <div className="space-y-3">
      {/* List Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/70">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
            <MailIcon className="size-4 text-primary" />
            Chiến dịch Email
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {campaigns.length} chiến dịch đã tạo
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-8 px-2.5 text-xs font-medium"
        >
          <PlusIcon className="size-3.5 mr-1" />
          Tạo chiến dịch
        </Button>
      </div>

      {/* Campaigns Scroll Area */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {campaigns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/80 p-6 text-center space-y-2 bg-muted/10">
            <MailIcon className="size-6 text-muted-foreground mx-auto" />
            <p className="text-xs font-medium text-foreground">
              Chưa có chiến dịch nào
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Nhấn &quot;Tạo chiến dịch&quot; để bắt đầu xây dựng chiến dịch email marketing đầu tiên.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs h-7 mt-1"
            >
              <PlusIcon className="size-3 mr-1" />
              Tạo mới ngay
            </Button>
          </div>
        ) : (
          campaigns.map((c) => {
            const isActive = c.id === activeCampaignId;
            const recipientCount = c.customers?.length || 0;
            const dateStr = new Date(c.created_at).toLocaleDateString("vi-VN", {
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={c.id}
                onClick={() => onSelectCampaign(c.id)}
                className={`group relative rounded-lg border p-3 cursor-pointer transition-all ${
                  isActive
                    ? "border-primary/60 bg-primary/5 shadow-2xs"
                    : "border-border/70 bg-card hover:border-border hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold truncate ${
                          isActive ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {c.name}
                      </span>
                      {isActive && (
                        <CheckCircleIcon className="size-3 text-primary shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 mt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UsersIcon className="size-3 text-muted-foreground" />
                        {recipientCount} người nhận
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="size-3 text-muted-foreground" />
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  {/* Delete Campaign Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCampaignToDelete(c);
                    }}
                    className="size-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity"
                    title="Xóa chiến dịch"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Campaign */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Tạo chiến dịch Email mới
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Đặt tên cho chiến dịch để dễ dàng quản lý và theo dõi hiệu quả gửi thư.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <label className="text-xs font-medium text-foreground block">
                Tên chiến dịch <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="VD: Khuyến mãi Black Friday 2026..."
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                autoFocus
                required
                className="text-xs h-9"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-border/80 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newCampaignName.trim() || isCreating}
                className="text-xs"
              >
                {isCreating ? "Đang tạo..." : "Xác nhận tạo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirm Delete */}
      <Dialog
        open={!!campaignToDelete}
        onOpenChange={(open) => !open && setCampaignToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive">
              Xác nhận xóa chiến dịch
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Bạn có chắc chắn muốn xóa chiến dịch &quot;
              <strong className="text-foreground">{campaignToDelete?.name}</strong>
              &quot;? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCampaignToDelete(null)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="text-xs"
            >
              {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
