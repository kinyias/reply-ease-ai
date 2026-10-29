"use client";

import { useI18n } from "@/context/i18n-context";

import { useState } from "react";
import Image from "next/image";
import {
  CheckIcon,
  CopyIcon,
  HelpCircleIcon,
  Loader2Icon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { OrderResponse } from "@/types/portal";

interface VietQRPaymentCardProps {
  order: OrderResponse;
  domainName: string;
  isPolling: boolean;
  onSimulatePayment: () => void;
  isSimulating: boolean;
}

export function VietQRPaymentCard({
  order,
  domainName,
  isPolling,
  onSimulatePayment,
  isSimulating,
}: VietQRPaymentCardProps) {
  const { t } = useI18n();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${t("billing.sepayModal.copied", "Copied!")} (${fieldName})`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs space-y-6 p-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <QrCodeIcon className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
              {t("portal.scanVietqrTitle", "Scan SePay VietQR")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("portal.scanVietqrDesc", "Open any banking app to scan and transfer immediately")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t("portal.autoReconcile", "Auto Reconciliation")}</span>
        </div>
      </div>

      {/* Main Grid: QR Code Left + Bank Info Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: QR Code Display */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 relative">
          <div className="size-56 sm:size-64 relative bg-white p-2 rounded-xl shadow-xs border border-zinc-200">
            {order.qr_url ? (
              <Image
                src={order.qr_url}
                alt="VietQR Code"
                width={256}
                height={256}
                className="w-full h-full object-contain"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                {t("portal.qrError", "Unable to load QR Code")}
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-center text-zinc-500 dark:text-zinc-400 font-medium">
            {t("portal.scanHelp", "Scan via VNPAY, MoMo, or any banking app")}
          </p>
        </div>

        {/* Right: Transfer Information Fields */}
        <div className="space-y-3.5">
          {/* Bank */}
          <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                {t("portal.beneficiaryBank", "Beneficiary Bank")}
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {order.bank || "MBBank"}
              </p>
            </div>
            <span className="text-xs font-medium text-zinc-500">
              MBBank
            </span>
          </div>

          {/* Account Number */}
          <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                {t("billing.sepayModal.account", "Account Number")}
              </span>
              <p className="text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                {order.account_number || "0333888999"}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  order.account_number || "0333888999",
                  t("billing.sepayModal.account", "Account Number")
                )
              }
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-white text-zinc-600 dark:text-zinc-300 text-xs transition-colors flex items-center gap-1"
            >
              {copiedField === t("billing.sepayModal.account", "Account Number") ? (
                <CheckIcon className="size-3.5 text-emerald-600" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
              <span>{t("billing.sepayModal.copy", "Copy")}</span>
            </button>
          </div>

          {/* Account Name */}
          <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                {t("portal.accountHolder", "Account Holder")}
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase">
                {order.account_name || "REPLY EASE STORE"}
              </p>
            </div>
          </div>

          {/* Amount */}
          <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                {t("portal.amountToPay", "Amount to Pay")}
              </span>
              <p className="text-base font-bold text-orange-600 dark:text-orange-400">
                {formatVND(order.amount)}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(order.amount.toString(), t("billing.sepayModal.amount", "Amount"))
              }
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-white text-zinc-600 dark:text-zinc-300 text-xs transition-colors flex items-center gap-1"
            >
              {copiedField === t("billing.sepayModal.amount", "Amount") ? (
                <CheckIcon className="size-3.5 text-emerald-600" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
              <span>{t("billing.sepayModal.copy", "Copy")}</span>
            </button>
          </div>

          {/* Transfer Content */}
          <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                {t("portal.transferContentExact", "Transfer Content (Exact Match Required)")}
              </span>
              <p className="text-sm font-mono font-bold text-orange-900 dark:text-orange-200">
                {order.content || order.order_code}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  order.content || order.order_code,
                  t("billing.sepayModal.content", "Transfer Content")
                )
              }
              className="p-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-xs transition-colors flex items-center gap-1 font-medium shadow-2xs"
            >
              {copiedField === t("billing.sepayModal.content", "Transfer Content") ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
              <span>{t("billing.sepayModal.copy", "Copy")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Polling Radar & Simulation Footer */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Loader2Icon className="size-4 animate-spin text-orange-600 shrink-0" />
          <span>
            {t("portal.listeningSePay", "System is automatically listening for SePay balance update...")}
          </span>
        </div>

        {/* Demo Helper Button */}
        <button
          type="button"
          disabled={isSimulating}
          onClick={onSimulatePayment}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-dashed border-emerald-500 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-semibold transition-colors"
        >
          <SparklesIcon className="size-3.5" />
          <span>
            {isSimulating ? t("portal.processing", "Processing...") : t("portal.simulateCheckout", "Simulate Payment Now (Demo / QA)")}
          </span>
        </button>
      </div>
    </div>
  );
}
