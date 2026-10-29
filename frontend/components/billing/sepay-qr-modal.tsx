"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { paymentService } from "@/services/payment-service";
import { useI18n } from "@/context/i18n-context";
import { PaymentResponse, PaymentStatus } from "@/types/payment";

interface SepayQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentResponse | null;
  status: PaymentStatus;
  onSimulateSuccess?: () => void;
  isSimulating?: boolean;
  onCancelOrder?: () => void;
  isCancelling?: boolean;
}

export function SepayQrModal({
  isOpen,
  onClose,
  payment,
  status,
  onSimulateSuccess,
  isSimulating = false,
  onCancelOrder,
  isCancelling = false,
}: SepayQrModalProps) {
  const { t } = useI18n();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!payment) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(`${t("billing.sepayModal.copied", "Copied!")} (${label})`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleLaunchGateway = () => {
    if (payment.checkout_url && payment.payment_fields) {
      paymentService.launchSepayGatewayCheckout(
        payment.checkout_url,
        payment.payment_fields,
        payment.direct_checkout_url,
        "_blank"
      );
      toast.info(t("billing.sepayModal.gatewayRedirect", "Redirecting to SePay Payment Gateway..."));
    }
  };

  const formattedAmount = payment.amount
    ? `${payment.amount.toLocaleString("vi-VN")} VNĐ`
    : "0 VND";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border border-border/80 bg-background sm:rounded-2xl shadow-lg">
        {status === "SUCCESS" ? (
          /* ================= SUCCESS STATE ================= */
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="size-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-in zoom-in-75 duration-300">
              <CheckCircle2Icon className="size-12 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/5 mb-1 text-xs">
                {t("billing.sepayModal.confirmed", "Payment confirmed successfully!")}
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {t("billing.sepayModal.confirmed")}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {payment.payment_type === "CREDIT_PURCHASE" ? (
                  <>
                    {t("billing.sepayModal.creditSuccessNotice", "Your account has been credited with ")}
                    <strong className="text-foreground">
                      {payment.credits_added?.toLocaleString("vi-VN") || ""} AI Credits
                    </strong>{" "}
                     {t("billing.sepayModal.readyNotice", "successfully. Credits are ready for AI chats and email campaigns.")}
                  </>
                ) : (
                  <>
                    {t("billing.sepayModal.upgradeSuccessNotice", "Your account has been upgraded to ")}
                    <strong className="text-foreground">{payment.plan || "PRO"}</strong>{" "}
                     {t("billing.sepayModal.readyNotice", "successfully. Your privileges and credits are ready instantly.")}
                  </>
                )}
              </p>
            </div>

            <div className="w-full max-w-sm rounded-xl border border-border/60 bg-muted/30 p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("billingHistory.colOrderId", "Order ID")}:</span>
                <span className="font-mono font-medium text-foreground">{payment.order_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("billing.serviceLabel", "Service")}:</span>
                <span className="font-semibold text-foreground">
                  {payment.payment_type === "CREDIT_PURCHASE"
                    ? `Nạp +${payment.credits_added?.toLocaleString("vi-VN") || ""} Credits`
                    : `${t("billing.planLabel", "Plan")} ${payment.plan || "PRO"}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("billing.sepayModal.amount", "Amount")}:</span>
                <span className="font-semibold text-foreground">{formattedAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("billing.paymentMethodLabel", "Method")}:</span>
                <span className="text-foreground">{t("billing.vietqrMethod", "VietQR Transfer (SePay)")}</span>
              </div>
            </div>

            <Button
              onClick={onClose}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 mt-2"
            >
              {t("common.close", "Close")}
            </Button>
          </div>
        ) : (
          /* ================= PENDING / PAYMENT MODAL ================= */
          <div>
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-border/60 bg-card/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <QrCodeIcon className="size-4.5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      {t("billing.sepayModal.title", "Scan VietQR to Pay via SePay")}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {payment.payment_type === "CREDIT_PURCHASE" ? (
                        <>
                          {t("billing.buyCredits", "Top-up")}{" "}
                          <span className="font-semibold text-primary">
                            {payment.credits_added?.toLocaleString("vi-VN") || ""} AI Credits
                          </span>{" "}
                          • {t("billing.sepayModal.autoVerify", "Auto-verifies in 3 - 5 seconds")}
                        </>
                      ) : (
                        <>
                          {t("billing.upgrade", "Upgrade")}{" "}
                          <span className="font-semibold text-primary">{payment.plan}</span> •{" "}
                          {t("billing.sepayModal.autoVerify", "Auto-verifies in 3 - 5 seconds")}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30 font-medium">
                  {t("billingHistory.statusPending", "Pending")}
                </Badge>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left Column: VietQR Code */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/70 bg-white shadow-xs text-center">
                <div className="relative size-60 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={payment.qr_url}
                    alt={`VietQR code for order ${payment.order_code}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                  </span>
                  <span>{t("billing.sepayModal.waiting", "Listening for SePay confirmation...")}</span>
                </div>
              </div>

              {/* Right Column: Transfer Info */}
              <div className="space-y-4">
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3 text-xs">
                  {/* Bank */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("billing.sepayModal.bank", "Bank")}:</span>
                    <span className="font-semibold text-foreground">{payment.bank_name}</span>
                  </div>

                  {/* Account Number */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("billing.sepayModal.account", "Beneficiary Account")}:</span>
                    <div className="flex items-center gap-1.5 font-mono font-semibold text-foreground">
                      <span>{payment.bank_account}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(payment.bank_account, t("billing.sepayModal.account", "Beneficiary Account"))}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                        title={t("billing.sepayModal.copy", "Copy")}
                      >
                        {copiedKey === t("billing.sepayModal.account", "Beneficiary Account") ? (
                          <CheckIcon className="size-3.5 text-emerald-500" />
                        ) : (
                          <CopyIcon className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Account Holder */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("integrations.accountHolderLabel", "Account Holder")}:</span>
                    <span className="font-semibold text-foreground">{payment.account_name}</span>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">{t("billing.sepayModal.amount", "Amount")}:</span>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-primary">
                      <span>{formattedAmount}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(payment.amount), t("billing.sepayModal.amount", "Amount"))}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                        title={t("billing.sepayModal.copy", "Copy")}
                      >
                        {copiedKey === t("billing.sepayModal.amount", "Amount") ? (
                          <CheckIcon className="size-3.5 text-emerald-500" />
                        ) : (
                          <CopyIcon className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Transfer Memo */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-foreground">
                        {t("billing.sepayModal.content", "Transfer Content")} ({t("common.required", "required")}):
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono font-bold tracking-wider text-sm">
                      <span>{payment.content}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(payment.content, t("billing.sepayModal.content", "Transfer Content"))}
                        className="p-1 rounded bg-background/80 hover:bg-background text-foreground transition-colors flex items-center gap-1 text-xs font-normal"
                      >
                        {copiedKey === t("billing.sepayModal.content", "Transfer Content") ? (
                          <>
                            <CheckIcon className="size-3 text-emerald-500" />
                            <span className="text-emerald-500 text-[10px]">{t("billing.sepayModal.copied", "Copied!")}</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="size-3" />
                            <span className="text-[10px]">{t("billing.sepayModal.copy", "Copy")}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground leading-tight">
                      {t("billing.sepayModal.contentNote", "Note: Please keep transfer content exact for automated real-time verification.")}
                    </p>
                  </div>
                </div>

                {/* Additional Actions */}
                <div className="space-y-2.5">
                  <Button
                    type="button"
                    onClick={handleLaunchGateway}
                    className="w-full text-xs font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs h-9.5"
                  >
                    <ExternalLinkIcon className="size-4" />
                    <span>{t("billing.sepayModal.openGateway", "Open SePay Payment Gateway")}</span>
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground">
                    {t("billing.sepayModal.gatewayHelp", "SePay gateway supports automatic Banking App opening, VietQR, and cards.")}
                  </p>

                  {/* Simulate instant confirmation for Testing/Demo */}
                  {onSimulateSuccess && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onSimulateSuccess}
                      disabled={isSimulating}
                      className="w-full text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 border-dashed"
                    >
                      {isSimulating ? (
                        <>
                          <Loader2Icon className="size-3 animate-spin" />
                          <span>{t("billing.sepayModal.simulating", "Simulating payment...")}</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="size-3 text-primary" />
                          <span>{t("billing.sepayModal.simulate", "Test Payment Simulation")}</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-muted/20 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheckIcon className="size-4 text-emerald-500" />
                <span>{t("billing.sepayModal.secureNotice", "Secured by SePay Payment Gateway")}</span>
              </div>
              <div className="flex items-center gap-2">
                {onCancelOrder && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isCancelling}
                    onClick={onCancelOrder}
                    className="text-xs h-8 px-3"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2Icon className="size-3 animate-spin mr-1" />
                        <span>{t("common.cancelling", "Cancelling...")}</span>
                      </>
                    ) : (
                      <span>{t("billing.sepayModal.cancel", "Cancel Payment")}</span>
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-xs h-8"
                >
                  {t("common.close", "Close")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
