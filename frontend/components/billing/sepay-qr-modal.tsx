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
import { PaymentResponse, PaymentStatus } from "@/types/payment";

interface SepayQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentResponse | null;
  status: PaymentStatus;
  onSimulateSuccess?: () => void;
  isSimulating?: boolean;
}

export function SepayQrModal({
  isOpen,
  onClose,
  payment,
  status,
  onSimulateSuccess,
  isSimulating = false,
}: SepayQrModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!payment) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(`Đã sao chép ${label}!`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleLaunchGateway = () => {
    if (payment.checkout_url && payment.payment_fields) {
      paymentService.launchSepayGatewayCheckout(
        payment.checkout_url,
        payment.payment_fields,
        "_blank"
      );
      toast.info("Đã mở cổng thanh toán SePay Payment Gateway trong tab mới.");
    }
  };

  const formattedAmount = payment.amount
    ? `${payment.amount.toLocaleString("vi-VN")} VNĐ`
    : "0 VNĐ";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border border-border/80 bg-background sm:rounded-2xl shadow-2xl">
        {status === "SUCCESS" ? (
          /* ================= SUCCESS STATE ================= */
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="size-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-in zoom-in-75 duration-300">
              <CheckCircle2Icon className="size-12 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/5 mb-1 text-xs">
                Giao dịch hoàn tất
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Thanh toán thành công!
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Tài khoản của bạn đã được nâng cấp lên gói{" "}
                <strong className="text-foreground">{payment.plan || "PRO"}</strong>{" "}
                thành công. Các đặc quyền và AI Credits đã được kích hoạt ngay lập tức.
              </p>
            </div>

            <div className="w-full max-w-sm rounded-xl border border-border/60 bg-muted/30 p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã đơn hàng:</span>
                <span className="font-mono font-medium text-foreground">{payment.order_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số tiền:</span>
                <span className="font-semibold text-foreground">{formattedAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hình thức:</span>
                <span className="text-foreground">Chuyển khoản VietQR (SePay)</span>
              </div>
            </div>

            <Button
              onClick={onClose}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 mt-2"
            >
              Hoàn tất & Quay lại
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
                      Thanh toán SePay VietQR
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Nâng cấp gói{" "}
                      <span className="font-semibold text-primary">{payment.plan}</span> •{" "}
                      Tự động kích hoạt sau 3 - 5 giây
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30 font-medium">
                  Chờ thanh toán
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
                  <span>Đang chờ giao dịch từ ngân hàng...</span>
                </div>
              </div>

              {/* Right Column: Transfer Info */}
              <div className="space-y-4">
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3 text-xs">
                  {/* Bank */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ngân hàng:</span>
                    <span className="font-semibold text-foreground">{payment.bank_name}</span>
                  </div>

                  {/* Account Number */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5 font-mono font-semibold text-foreground">
                      <span>{payment.bank_account}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(payment.bank_account, "Số tài khoản")}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                        title="Sao chép số tài khoản"
                      >
                        {copiedKey === "Số tài khoản" ? (
                          <CheckIcon className="size-3.5 text-emerald-500" />
                        ) : (
                          <CopyIcon className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Account Holder */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Chủ tài khoản:</span>
                    <span className="font-semibold text-foreground">{payment.account_name}</span>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Số tiền:</span>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-primary">
                      <span>{formattedAmount}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(payment.amount), "Số tiền")}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                        title="Sao chép số tiền"
                      >
                        {copiedKey === "Số tiền" ? (
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
                        Nội dung chuyển khoản (bắt buộc):
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono font-bold tracking-wider text-sm">
                      <span>{payment.content}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(payment.content, "Nội dung chuyển khoản")}
                        className="p-1 rounded bg-background/80 hover:bg-background text-foreground transition-colors flex items-center gap-1 text-xs font-normal"
                      >
                        {copiedKey === "Nội dung chuyển khoản" ? (
                          <>
                            <CheckIcon className="size-3 text-emerald-500" />
                            <span className="text-emerald-500 text-[10px]">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="size-3" />
                            <span className="text-[10px]">Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground leading-tight">
                      ⚠️ Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống đối soát và nâng cấp tài khoản tự động.
                    </p>
                  </div>
                </div>

                {/* Additional Actions */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLaunchGateway}
                    className="w-full text-xs font-medium gap-1.5 border-border/70"
                  >
                    <ExternalLinkIcon className="size-3.5" />
                    <span>Mở cổng SePay Payment Gateway</span>
                  </Button>

                  {/* Simulate instant confirmation for Testing/Demo */}
                  {onSimulateSuccess && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onSimulateSuccess}
                      disabled={isSimulating}
                      className="w-full text-xs text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      {isSimulating ? (
                        <>
                          <Loader2Icon className="size-3 animate-spin" />
                          <span>Đang giả lập thanh toán...</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="size-3 text-primary" />
                          <span>Giả lập thanh toán thành công (Demo)</span>
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
                <span>Bảo mật giao dịch bởi SePay Payment Gateway</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs h-8"
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
