"use client";

import { useI18n } from "@/context/i18n-context";

import { useState } from "react";
import {
  CheckCircle2Icon,
  CopyIcon,
  ExternalLinkIcon,
  PackageCheckIcon,
  ReceiptIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { OrderResponse, PortalProductItem } from "@/types/portal";

interface OrderSuccessProps {
  order: OrderResponse;
  domainName: string;
  products: PortalProductItem[];
  selectedProductIds: string[];
}

export function OrderSuccess({
  order,
  domainName,
  products,
  selectedProductIds,
}: OrderSuccessProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  const selectedItems = products.filter((p) =>
    selectedProductIds.includes(p.id)
  );

  const handleCopyOrder = () => {
    navigator.clipboard.writeText(order.order_code);
    setCopied(true);
    toast.success(t("portal.copiedOrderId", "Copied order code!"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Success Hero Header */}
      <div className="text-center space-y-2">
        <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
          <CheckCircle2Icon className="size-8 stroke-[2.2]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {t("portal.orderSuccessTitle", "Order Completed Successfully!")}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
          {t("portal.orderSuccessDesc", "Transaction has been verified and recorded by the system.")}
        </p>
      </div>

      {/* Invoice Receipt Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        {/* Top Header */}
        <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptIcon className="size-4" />
            <span className="font-semibold text-sm tracking-wide">
              {t("portal.orderReceiptBadge", "ORDER RECEIPT")}
            </span>
          </div>
          <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
            {t("portal.paidBadge", "PAID")}
          </span>
        </div>

        {/* Order Details Body */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                {t("portal.orderCode", "Order Code")}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {order.order_code}
                </p>
                <button
                  type="button"
                  onClick={handleCopyOrder}
                  className="text-zinc-400 hover:text-zinc-600"
                  aria-label={t("portal.copiedOrderId", "Copied order code!")}
                >
                  <CopyIcon className="size-3.5" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                {t("portal.seller", "Seller")}
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {domainName}
              </p>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              {t("portal.itemsPurchased", { count: selectedItems.length }, `Purchased Items (${selectedItems.length})`)}
            </span>
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs sm:text-sm"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {item.name}
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatVND(item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {t("portal.totalPaid", "Total Amount Paid")}
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatVND(order.amount)}
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-zinc-50/70 dark:bg-zinc-800/30 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
          <p className="text-xs text-zinc-500 text-center">
            {t("portal.emailConfirmationNotice", "An order confirmation receipt has been sent to your email inbox.")}
          </p>
        </div>
      </div>
    </div>
  );
}
