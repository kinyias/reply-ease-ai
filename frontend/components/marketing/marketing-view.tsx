"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  CoinsIcon,
  CreditCardIcon,
  HelpCircleIcon,
  MailIcon,
  SendIcon,
  SparklesIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CampaignList } from "@/components/marketing/campaign-list";
import { TemplateEditor } from "@/components/marketing/template-editor";
import { CustomerLeadsTable } from "@/components/marketing/customer-leads-table";
import { LeadAnswersModal } from "@/components/marketing/lead-answers-modal";
import { MarketingSkeleton } from "@/components/marketing/marketing-skeleton";
import { useMarketing } from "@/hooks/marketing/use-marketing";
import { useDomainManagement } from "@/hooks/sidebar/use-domain-management";

export function MarketingView() {
  const {
    isUserLoading,
    currentCredits,
    campaigns,
    isCampaignsLoading,
    activeCampaign,
    activeCampaignId,
    setActiveCampaignId,
    createCampaign,
    isCreatingCampaign,
    updateTemplate,
    isUpdatingTemplate,
    assignCustomers,
    isAssigningCustomers,
    deleteCampaign,
    isDeletingCampaign,
    sendCampaign,
    isSendingCampaign,
    leads,
    isLeadsLoading,
    selectedDomainId,
    setSelectedDomainId,
    searchQuery,
    setSearchQuery,
    selectedEmails,
    toggleSelectEmail,
    toggleSelectAll,
    clearSelection,
    inspectingLead,
    setInspectingLead,
  } = useMarketing();

  const { domains } = useDomainManagement();

  // Prevent SSR/CSR hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Send confirmation modal
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);

  // Recipient list logic:
  // If user selected checkboxes in the leads table, use selectedEmails.
  // Otherwise, fallback to activeCampaign.customers.
  const targetRecipients =
    selectedEmails.length > 0
      ? selectedEmails
      : (activeCampaign?.customers || []);

  const totalRecipientsCount = targetRecipients.length;
  const hasEnoughCredits = currentCredits >= totalRecipientsCount;
  const creditsAfterSend = Math.max(0, currentCredits - totalRecipientsCount);

  const handleOpenSendModal = () => {
    if (!activeCampaign) {
      toast.error("Vui lòng chọn hoặc tạo một chiến dịch trước.");
      return;
    }
    if (!activeCampaign.template || !activeCampaign.template.trim()) {
      toast.error("Chiến dịch chưa có nội dung email template. Vui lòng soạn thảo và lưu trước khi gửi.");
      return;
    }
    if (totalRecipientsCount === 0) {
      toast.error("Vui lòng chọn ít nhất 1 khách hàng từ bảng bên phải để gửi chiến dịch.");
      return;
    }
    setIsSendConfirmOpen(true);
  };

  const handleExecuteSend = async () => {
    if (!activeCampaign) return;
    try {
      await sendCampaign({
        campaignId: activeCampaign.id,
        emails: selectedEmails.length > 0 ? selectedEmails : undefined,
      });
      setIsSendConfirmOpen(false);
      clearSelection();
    } catch {
      // Error is handled in hook mutation toast
    }
  };

  if (!isMounted || (isCampaignsLoading && campaigns.length === 0)) {
    return <MarketingSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Email Marketing & Quản lý Leads
            </h1>
            <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30">
              Phase 8
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sàng lọc câu trả lời của khách hàng tiềm năng, soạn thảo mẫu thư và gửi email hàng loạt trừ credits tự động.
          </p>
        </div>

        {/* Credits Status & Top-up Card */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 shadow-2xs self-start md:self-auto">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <CoinsIcon className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted-foreground">
              AI Credits khả dụng
            </div>
            <div className="text-lg font-bold text-foreground flex items-center gap-1.5">
              <span>{currentCredits}</span>
              <span className="text-xs font-normal text-muted-foreground">credits</span>
            </div>
          </div>
          <Link
            href="/billing?tab=credits"
            className="inline-flex items-center justify-center h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-medium hover:bg-muted text-foreground transition-colors ml-2"
          >
            <CreditCardIcon className="size-3.5 mr-1 text-primary" />
            Nạp thêm
          </Link>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Campaign List & Template Editor (5/12 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <CampaignList
            campaigns={campaigns}
            activeCampaignId={activeCampaignId}
            onSelectCampaign={setActiveCampaignId}
            onCreateCampaign={createCampaign}
            onDeleteCampaign={deleteCampaign}
            isCreating={isCreatingCampaign}
            isDeleting={isDeletingCampaign}
          />

          <TemplateEditor
            activeCampaign={activeCampaign}
            onSaveTemplate={(template) =>
              activeCampaign
                ? updateTemplate({ campaignId: activeCampaign.id, template })
                : Promise.resolve()
            }
            onAssignCustomers={(customers) =>
              activeCampaign
                ? assignCustomers({ campaignId: activeCampaign.id, customers })
                : Promise.resolve()
            }
            selectedEmailsCount={selectedEmails.length}
            selectedEmails={selectedEmails}
            isSaving={isUpdatingTemplate || isAssigningCustomers}
          />
        </div>

        {/* Right Column: Customer Leads Filtering Table (7/12 cols) */}
        <div className="lg:col-span-7">
          <CustomerLeadsTable
            leads={leads}
            isLoading={isLeadsLoading}
            domains={domains}
            selectedDomainId={selectedDomainId}
            onSelectDomain={setSelectedDomainId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedEmails={selectedEmails}
            onToggleSelectEmail={toggleSelectEmail}
            onToggleSelectAll={toggleSelectAll}
            onClearSelection={clearSelection}
            onInspectLead={(lead) => setInspectingLead(lead)}
          />
        </div>
      </div>

      {/* Bottom Sticky Action Bar: Dispatch Campaign */}
      <div className="sticky bottom-4 z-30 rounded-xl border border-border/80 bg-background/95 backdrop-blur-md p-4 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <SendIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground truncate">
                Chiến dịch:{" "}
                <span className="text-primary font-bold">
                  {activeCampaign?.name || "Chưa chọn"}
                </span>
              </span>
              <Badge variant="outline" className="text-[10px]">
                {totalRecipientsCount} người nhận
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Chi phí dự kiến: <strong className="text-foreground">{totalRecipientsCount} credits</strong>{" "}
              (Còn lại: {currentCredits} credits)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!hasEnoughCredits && totalRecipientsCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-destructive font-medium flex items-center gap-1">
                <AlertCircleIcon className="size-3.5" />
                Không đủ credits
              </span>
              <Link
                href="/billing?tab=credits"
                className="text-[11px] underline font-semibold text-primary hover:text-primary/80"
              >
                Nạp ngay
              </Link>
            </div>
          )}

          <Button
            size="sm"
            onClick={handleOpenSendModal}
            disabled={!activeCampaign || totalRecipientsCount === 0 || !hasEnoughCredits || isSendingCampaign}
            className="h-9 px-4 text-xs font-semibold shadow-xs"
          >
            <SendIcon className="size-3.5 mr-1.5" />
            {isSendingCampaign ? "Đang gửi..." : "Gửi chiến dịch ngay"}
          </Button>
        </div>
      </div>

      {/* Lead Answers Inspection Modal */}
      <LeadAnswersModal
        lead={inspectingLead}
        isOpen={!!inspectingLead}
        onClose={() => setInspectingLead(null)}
        isSelected={inspectingLead?.email ? selectedEmails.includes(inspectingLead.email) : false}
        onToggleSelectEmail={toggleSelectEmail}
      />

      {/* Send Campaign Confirmation Dialog */}
      <Dialog open={isSendConfirmOpen} onOpenChange={setIsSendConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <MailIcon className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Xác nhận gửi chiến dịch Email Marketing
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Bạn đang chuẩn bị phát động chiến dịch &quot;
              <strong className="text-foreground">{activeCampaign?.name}</strong>&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3 text-xs">
            <div className="rounded-lg border border-border/70 p-3 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số lượng người nhận:</span>
                <span className="font-semibold text-foreground">
                  {totalRecipientsCount} khách hàng
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Credits cần trừ:</span>
                <span className="font-semibold text-destructive">
                  -{totalRecipientsCount} credits
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/50 pt-1.5">
                <span className="text-muted-foreground">Credits còn lại sau khi gửi:</span>
                <span className="font-bold text-foreground">
                  {creditsAfterSend} credits
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              * Tác vụ gửi thư sẽ được thực thi ngầm qua FastAPI <code>BackgroundTasks</code>.
              Hệ thống sẽ đảm bảo không làm nghẽn tiến trình và gửi email lần lượt đến từng khách hàng.
            </p>
          </div>

          <DialogFooter className="pt-2 border-t border-border/80 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSendConfirmOpen(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteSend}
              disabled={isSendingCampaign}
              className="text-xs font-semibold"
            >
              <ZapIcon className="size-3.5 mr-1" />
              {isSendingCampaign ? "Đang phát động..." : "Xác nhận gửi ngay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
