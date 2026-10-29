"use client";

import { useI18n } from "@/context/i18n-context";

import React from "react";
import {
  CheckCircle2Icon,
  CircleDashedIcon,
  CopyIcon,
  GlobeIcon,
  MailIcon,
  UserCheckIcon,
  UserMinusIcon,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerLead } from "@/types/marketing";

interface LeadAnswersModalProps {
  lead: CustomerLead | null;
  isOpen: boolean;
  onClose: () => void;
  isSelected?: boolean;
  onToggleSelectEmail?: (email: string) => void;
}

export function LeadAnswersModal({
  lead,
  isOpen,
  onClose,
  isSelected = false,
  onToggleSelectEmail,
}: LeadAnswersModalProps) {
  const { t } = useI18n();
  if (!lead) return null;

  const copyEmail = () => {
    if (lead.email) {
      navigator.clipboard.writeText(lead.email);
      toast.success(t("marketing.copiedEmail", "Copied email address!"));
    }
  };

  const formattedDate = new Date(lead.created_at).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="pb-3 border-b border-border/80">
          <div className="flex items-center gap-2 mb-1">
            <span className="size-2 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {t("marketing.qualifierModalTitle", "Lead Qualifier Survey")}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center justify-between">
            <span className="truncate">{lead.email || t("marketing.anonymousCustomer", "Anonymous Customer")}</span>
            {lead.email && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyEmail}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                title={t("marketing.copyEmail", "Copy email")}
              >
                <CopyIcon className="size-3.5 mr-1" />
                {t("common.copy", "Copy")}
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <GlobeIcon className="size-3.5 text-primary" />
              {lead.domain_name || t("marketing.defaultDomain", "Default")}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="size-3.5" />
              {formattedDate}
            </span>
            <span>&bull;</span>
            <Badge variant="outline" className="text-[11px] font-medium">
              {t("marketing.answersCount", { answered: lead.answered_count, total: lead.total_questions }, `${lead.answered_count}/${lead.total_questions} questions`)}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {/* Question Answers List */}
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {lead.responses && lead.responses.length > 0 ? (
            lead.responses.map((resp, idx) => {
              const isAnswered = !!(resp.answered && resp.answered.trim());
              return (
                <div
                  key={resp.id || idx}
                  className="rounded-lg border border-border/70 p-3.5 bg-muted/20 space-y-2 transition-colors hover:border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground leading-snug">
                      <span className="text-muted-foreground mr-1.5 font-normal">
                        {t("marketing.questionNum", { num: idx + 1 }, `Question ${idx + 1}:`)}
                      </span>
                      {resp.question}
                    </span>
                    {isAnswered ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] shrink-0 font-medium">
                        <CheckCircle2Icon className="size-3 mr-1" />
                        {t("marketing.answeredStatus", "Answered")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] shrink-0 text-muted-foreground">
                        <CircleDashedIcon className="size-3 mr-1" />
                        {t("marketing.unansweredStatus", "Unanswered")}
                      </Badge>
                    )}
                  </div>

                  <div className="rounded-md bg-background/80 border border-border/50 p-2.5 text-xs">
                    {isAnswered ? (
                      <p className="text-foreground font-medium whitespace-pre-wrap">
                        {resp.answered}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        {t("marketing.noAnswerProvided", "Customer has not provided an answer for this question.")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-muted-foreground text-xs">
              <p>{t("marketing.noQualifiersForDomain", "No qualification questions configured for this domain.")}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="pt-3 border-t border-border/80 flex sm:justify-between items-center gap-2">
          {lead.email && onToggleSelectEmail ? (
            <Button
              variant={isSelected ? "outline" : "default"}
              size="sm"
              onClick={() => onToggleSelectEmail(lead.email!)}
              className="text-xs"
            >
              {isSelected ? (
                <>
                  <UserMinusIcon className="size-3.5 mr-1.5 text-destructive" />
                  {t("marketing.removeFromCampaign", "Remove email from list")}
                </>
              ) : (
                <>
                  <UserCheckIcon className="size-3.5 mr-1.5" />
                  {t("marketing.addToCampaign", "Add to send list")}
                </>
              )}
            </Button>
          ) : (
            <div />
          )}

          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            {t("common.close", "Close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
