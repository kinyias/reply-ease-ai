"use client";

import { useI18n } from "@/context/i18n-context";

import Image from "next/image";
import { CheckIcon, CreditCardIcon, QrCodeIcon, ShoppingBagIcon } from "lucide-react";
import { PaymentMethod } from "@/hooks/portal/use-portal-checkout";
import { PortalProductItem } from "@/types/portal";

interface ProductCartProps {
  products: PortalProductItem[];
  selectedProductIds: string[];
  onToggleProduct: (id: string) => void;
  calculatedTotal: number;
  paymentMethod: PaymentMethod;
  onChangePaymentMethod: (method: PaymentMethod) => void;
}

export function ProductCart({
  products,
  selectedProductIds,
  onToggleProduct,
  calculatedTotal,
  paymentMethod,
  onChangePaymentMethod,
}: ProductCartProps) {
  const { t } = useI18n();
  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Product List Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBagIcon className="size-4 text-orange-600" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
              {t("portal.productListTitle", "Products & Services")}
            </h3>
          </div>
          <span className="text-xs text-zinc-500">
            {t("portal.selectedCount", { selected: selectedProductIds.length, total: products.length }, `${selectedProductIds.length}/${products.length} selected`)}
          </span>
        </div>

        {/* Products list */}
        <div className="space-y-3">
          {products.map((p) => {
            const isSelected = selectedProductIds.includes(p.id);

            return (
              <div
                key={p.id}
                onClick={() => onToggleProduct(p.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-orange-50/40 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800/60"
                    : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 opacity-70"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`size-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      isSelected
                        ? "bg-orange-600 border-orange-600 text-white"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    }`}
                  >
                    {isSelected && <CheckIcon className="size-3.5 stroke-[2.5]" />}
                  </div>

                  {/* Thumbnail */}
                  <div className="size-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200/60 dark:border-zinc-700">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                        SP
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-medium text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {p.name}
                    </h4>
                    <span className="text-xs text-zinc-500">
                      {t("portal.standardTx", "Standard checkout")}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                    {formatVND(p.price)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method Switcher Tabs */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
          {t("portal.paymentMethod", "Payment Method")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* VietQR SePay */}
          <button
            type="button"
            onClick={() => onChangePaymentMethod("vietqr")}
            className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              paymentMethod === "vietqr"
                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
            }`}
          >
            <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
              <QrCodeIcon className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                  {t("portal.vietqrTitle", "VietQR Bank Transfer")}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  {t("portal.popular", "Popular")}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t("portal.vietqrDesc", "Scan SePay QR code, automated verification in 3 seconds.")}
              </p>
            </div>
          </button>

          {/* Stripe Card Elements */}
          <button
            type="button"
            onClick={() => onChangePaymentMethod("stripe")}
            className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              paymentMethod === "stripe"
                ? "bg-primary/5 border-primary ring-2 ring-primary/20"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
            }`}
          >
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CreditCardIcon className="size-4" />
            </div>
            <div>
              <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                {t("portal.stripeTitle", "International Card (Stripe)")}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t("portal.cardSub", "Secure payment via Visa, Mastercard, and international cards.")}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Order Total Summary */}
      <div className="bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500">
          <span>{t("portal.subtotal", "Subtotal")}</span>
          <span>{formatVND(calculatedTotal)}</span>
        </div>
        <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500">
          <span>{t("portal.gatewayFee", "Payment gateway fee")}</span>
          <span className="text-emerald-600 font-medium">{t("portal.free", "Free")}</span>
        </div>
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
            {t("portal.totalPay", "Total Amount")}
          </span>
          <span className="font-bold text-lg sm:text-xl text-orange-600 dark:text-orange-400">
            {formatVND(calculatedTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
