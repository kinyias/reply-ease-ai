"use client";

import React, { useEffect, useState } from "react";
import {
  CodeIcon,
  EyeIcon,
  FileTextIcon,
  SaveIcon,
  SparklesIcon,
  TagIcon,
  UsersIcon,
  Wand2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Campaign } from "@/types/marketing";

interface TemplateEditorProps {
  activeCampaign: Campaign | null;
  onSaveTemplate: (template: string) => Promise<any>;
  onAssignCustomers?: (customers: string[]) => Promise<any>;
  selectedEmailsCount?: number;
  selectedEmails?: string[];
  isSaving?: boolean;
}

const TEMPLATE_PRESETS = [
  {
    name: "Ưu đãi Khuyến mãi",
    template: `Xin chào {{email}},

ReplyEase AI xin gửi tặng bạn voucher ưu đãi độc quyền giảm 20% cho tất cả các gói dịch vụ và sản phẩm trong tháng này!

Mã ưu đãi: REPLYEASE20
Hạn sử dụng: Đến hết ngày 30 hàng tháng.

Để nhận tư vấn chi tiết hoặc đặt lịch hẹn trải nghiệm trực tiếp, bạn có thể phản hồi lại email này bất kỳ lúc nào.

Trân trọng,
Đội ngũ CSKH ReplyEase AI`,
  },
  {
    name: "Mời Đặt lịch Tư vấn",
    template: `Chào bạn {{email}},

Cảm ơn bạn đã để lại thông tin liên hệ và trao đổi với Trợ lý AI trên website của chúng tôi.

Chúng tôi rất hân hạnh được đồng hành cùng bạn để giải quyết các thắc mắc chuyên sâu. Bạn có thể chọn khung giờ rảnh phù hợp nhất để trao đổi trực tiếp cùng chuyên viên tư vấn.

Vui lòng bấm vào liên kết dưới đây để chọn ngày và giờ hẹn:
https://replyease.ai/portal

Hẹn gặp bạn trong buổi trò chuyện sắp tới!

Thân mến,
Ban Chăm Sóc Khách Hàng`,
  },
  {
    name: "Khảo sát & Tri ân",
    template: `Kính gửi {{email}},

Ý kiến đóng góp của bạn là động lực to lớn giúp chúng tôi không ngừng hoàn thiện chất lượng dịch vụ.

Bạn có thể dành ra 1 phút để chia sẻ cảm nhận về trải nghiệm tương tác vừa qua không? Chúng tôi luôn sẵn sàng lắng nghe mọi góp ý của bạn.

Chúc bạn một tuần làm việc hiệu quả và tràn đầy năng lượng!

Đội ngũ ReplyEase AI`,
  },
];

export function TemplateEditor({
  activeCampaign,
  onSaveTemplate,
  onAssignCustomers,
  selectedEmailsCount = 0,
  selectedEmails = [],
  isSaving = false,
}: TemplateEditorProps) {
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    if (activeCampaign) {
      setContent(activeCampaign.template || "");
    } else {
      setContent("");
    }
  }, [activeCampaign]);

  if (!activeCampaign) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 p-8 text-center bg-card/40 space-y-3">
        <FileTextIcon className="size-8 text-muted-foreground mx-auto" />
        <h3 className="text-sm font-semibold text-foreground">
          Chưa chọn chiến dịch
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Vui lòng chọn một chiến dịch từ danh sách bên trên hoặc tạo mới để bắt đầu soạn thảo nội dung email marketing.
        </p>
      </div>
    );
  }

  const insertVariable = (tag: string) => {
    setContent((prev) => prev + tag);
  };

  const handleApplyPreset = (presetTemplate: string) => {
    setContent(presetTemplate);
  };

  const handleSave = () => {
    onSaveTemplate(content);
  };

  const handleSyncSelectedEmails = () => {
    if (onAssignCustomers && selectedEmails.length > 0) {
      onAssignCustomers(selectedEmails);
    }
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4 shadow-2xs">
      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Mẫu Email
            </span>
            <Badge variant="outline" className="text-[10px] font-medium">
              ID: {activeCampaign.id.slice(0, 8)}
            </Badge>
          </div>
          <h2 className="text-base font-bold text-foreground truncate mt-0.5">
            {activeCampaign.name}
          </h2>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="inline-flex rounded-lg border border-border/70 p-0.5 bg-muted/30">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === "edit"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CodeIcon className="size-3.5" />
              Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === "preview"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <EyeIcon className="size-3.5" />
              Xem trước
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 px-3 text-xs font-medium"
          >
            <SaveIcon className="size-3.5 mr-1.5" />
            {isSaving ? "Đang lưu..." : "Lưu template"}
          </Button>
        </div>
      </div>

      {/* Quick Helper Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Placeholder tags */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <TagIcon className="size-3" /> Chèn biến:
          </span>
          <button
            type="button"
            onClick={() => insertVariable("{{email}}")}
            className="px-2 py-0.5 rounded border border-border/70 bg-muted/40 text-[11px] font-mono hover:bg-muted text-foreground transition-colors"
            title="Chèn email của người nhận"
          >
            {"{{email}}"}
          </button>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Wand2Icon className="size-3 text-primary" /> Mẫu mẫu:
          </span>
          {TEMPLATE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset.template)}
              className="text-[11px] text-primary hover:underline font-medium"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor or Preview Pane */}
      {viewMode === "edit" ? (
        <div className="space-y-1.5">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung thư gửi khách hàng... Hỗ trợ text hoặc mã HTML đầy đủ."
            className="min-h-[220px] font-sans text-xs leading-relaxed resize-y"
          />
          <p className="text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Tiêu đề gửi đi sẽ là tên chiến dịch: &quot;{activeCampaign.name}&quot;</span>
            <span>{content.length} ký tự</span>
          </p>
        </div>
      ) : (
        /* Preview Frame */
        <div className="rounded-lg border border-border/70 overflow-hidden bg-background">
          <div className="border-b border-border/60 bg-muted/40 px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Tiêu đề: <strong className="text-foreground">{activeCampaign.name}</strong></span>
            <span>Người nhận mô phỏng: <strong className="text-foreground">khachhang@example.com</strong></span>
          </div>
          <div className="p-4 text-xs text-foreground min-h-[200px] whitespace-pre-wrap leading-relaxed">
            {content ? (
              content.replace(/{{email}}/g, "khachhang@example.com")
            ) : (
              <span className="text-muted-foreground italic">
                Chưa có nội dung. Chuyển sang tab &quot;Soạn thảo&quot; để viết email.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Campaign Recipients Summary & Sync Button */}
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <UsersIcon className="size-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            Đã gán trong chiến dịch:{" "}
            <strong className="text-foreground">
              {activeCampaign.customers?.length || 0} email
            </strong>
          </span>
        </div>

        {selectedEmailsCount > 0 && onAssignCustomers && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncSelectedEmails}
            className="h-7 text-xs"
          >
            <SparklesIcon className="size-3 mr-1 text-primary" />
            Lưu {selectedEmailsCount} khách đang chọn vào chiến dịch
          </Button>
        )}
      </div>
    </div>
  );
}
