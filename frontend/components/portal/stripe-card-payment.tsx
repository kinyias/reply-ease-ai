"use client";

import { useState } from "react";
import {
  CreditCardIcon,
  LockIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

interface StripeCardPaymentProps {
  amount: number;
  domainName: string;
  onSuccess: () => void;
}

export function StripeCardPayment({
  amount,
  domainName,
  onSuccess,
}: StripeCardPaymentProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  // Format card number with spaces (e.g. 4242 4242 4242 4242)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
    setCardNumber(formatted);
  };

  // Format expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setExpiry(raw);
  };

  // Format CVC
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvc(raw);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cardNumber.replace(/\s/g, "").length < 15) {
      toast.error("Vui lòng nhập số thẻ thanh toán hợp lệ.");
      return;
    }
    if (expiry.length < 5) {
      toast.error("Vui lòng nhập ngày hết hạn thẻ (MM/YY).");
      return;
    }
    if (cvc.length < 3) {
      toast.error("Vui lòng nhập mã bảo mật CVC hợp lệ.");
      return;
    }
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên in trên thẻ.");
      return;
    }

    setIsProcessing(true);
    // Simulate secure Stripe card confirmation
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 1800);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <CreditCardIcon className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
              Thẻ Quốc Tế (Stripe Elements)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Hỗ trợ Visa, MasterCard, JCB, American Express
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
          <ShieldCheckIcon className="size-3.5 text-emerald-500" />
          <span>Stripe Secure</span>
        </div>
      </div>

      {/* Card Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div className="space-y-1.5">
          <label
            htmlFor="card-number"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider"
          >
            Số thẻ
          </label>
          <div className="relative">
            <input
              id="card-number"
              type="text"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={handleCardNumberChange}
              required
              className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-zinc-400"
            />
            <CreditCardIcon className="size-4 text-zinc-400 absolute left-3.5 top-3" />
          </div>
        </div>

        {/* Expiry and CVC Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="card-expiry"
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider"
            >
              Hết hạn (MM/YY)
            </label>
            <input
              id="card-expiry"
              type="text"
              inputMode="numeric"
              placeholder="MM/YY"
              value={expiry}
              onChange={handleExpiryChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="card-cvc"
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider"
            >
              CVC / CVV
            </label>
            <div className="relative">
              <input
                id="card-cvc"
                type="password"
                inputMode="numeric"
                placeholder="123"
                value={cvc}
                onChange={handleCvcChange}
                required
                className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-zinc-400"
              />
              <LockIcon className="size-3.5 text-zinc-400 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>

        {/* Name on Card */}
        <div className="space-y-1.5">
          <label
            htmlFor="card-name"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider"
          >
            Tên in trên thẻ
          </label>
          <input
            id="card-name"
            type="text"
            placeholder="NGUYEN VAN A"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs sm:text-sm uppercase text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-zinc-400"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full mt-2 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isProcessing ? (
            <>
              <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang kết nối Stripe xác thực giao dịch...</span>
            </>
          ) : (
            <span>Thanh toán ngay {formatVND(amount)}</span>
          )}
        </button>
      </form>
    </div>
  );
}
