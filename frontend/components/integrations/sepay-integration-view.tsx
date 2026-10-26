"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  HelpCircleIcon,
  KeyIcon,
  Loader2Icon,
  RadioIcon,
  SaveIcon,
  ShieldCheckIcon,
  UnplugIcon,
  ZapIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paymentService } from "@/services/payment-service";
import { UpdateSepayMerchantPayload } from "@/types/payment";

export function SepayIntegrationView() {
  const queryClient = useQueryClient();

  // Form state
  const [merchantId, setMerchantId] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [bankName, setBankName] = useState("MBBank");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Fetch current merchant config
  const { data: config, isLoading } = useQuery({
    queryKey: ["sepay-merchant-config"],
    queryFn: () => paymentService.getSepayConfig(),
  });

  // Populate form when data loads
  useEffect(() => {
    if (config) {
      if (config.sepay_merchant_id) setMerchantId(config.sepay_merchant_id);
      if (config.bank_name) setBankName(config.bank_name);
      if (config.bank_account) setBankAccount(config.bank_account);
      if (config.bank_holder) setBankHolder(config.bank_holder);
    }
  }, [config]);

  // Mutation to save merchant config
  const saveMutation = useMutation({
    mutationFn: (payload: UpdateSepayMerchantPayload) =>
      paymentService.updateSepayConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sepay-merchant-config"] });
      setSecretKey("");
      toast.success("Đã lưu cấu hình SePay Merchant thành công!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Không thể lưu cấu hình SePay.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId.trim()) {
      toast.error("Vui lòng nhập SePay Merchant ID.");
      return;
    }
    if (!secretKey.trim() && !config?.is_configured) {
      toast.error("Vui lòng nhập SePay Secret Key.");
      return;
    }

    saveMutation.mutate({
      sepay_merchant_id: merchantId.trim(),
      sepay_secret_key: secretKey.trim(),
      bank_name: bankName.trim(),
      bank_account: bankAccount.trim(),
      bank_holder: bankHolder.trim(),
    });
  };

  const handleCopyWebhook = () => {
    if (config?.webhook_url) {
      navigator.clipboard.writeText(config.webhook_url);
      setCopiedWebhook(true);
      toast.success("Đã sao chép Webhook URL!");
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Đang tải cấu hình SePay Connect...</p>
      </div>
    );
  }

  const isConfigured = config?.is_configured || false;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Tích hợp SePay Connect
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Custom Merchant Onboarding
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Kết nối tài khoản SePay của riêng bạn để nhận tiền bán sản phẩm trực tiếp từ khách hàng về tài khoản ngân hàng của bạn.
          </p>
        </div>

        {/* Live Status Badge */}
        <div>
          {isConfigured ? (
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium px-3 py-1 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 " />
              <span>Đang hoạt động</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border/80 font-medium px-3 py-1 flex items-center gap-1.5">
              <UnplugIcon className="size-3" />
              <span>Chưa kết nối</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Overview Status Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isConfigured
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border bg-card"
      }`}>
        <div className="flex items-start gap-3.5">
          <ShieldCheckIcon className={`size-5 shrink-0 ${
            isConfigured ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
          }`} />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isConfigured
                ? "Tài khoản SePay đã sẵn sàng nhận tiền"
                : "Chưa kết nối tài khoản SePay"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {isConfigured ? (
                <>
                  Hệ thống đã liên kết với Merchant ID:{" "}
                  <code className="font-mono font-medium text-foreground px-1 py-0.5 rounded bg-muted">
                    {config?.sepay_merchant_id}
                  </code>
                  . Khách hàng khi mua hàng qua Portal Checkout sẽ quét mã VietQR tự động chuyển tiền trực tiếp vào tài khoản ngân hàng của bạn.
                </>
              ) : (
                "Khi kết nối SePay, tiền thanh toán đơn hàng từ khách mua hàng trên ChatBot sẽ chuyển thẳng vào số tài khoản ngân hàng của bạn, không cần thông qua trung gian."
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Main Settings Form (2 cols) */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 ">
          <h2 className="text-base font-semibold text-foreground mb-1">
            Thông tin kết nối SePay
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Lấy Merchant ID và Secret Key tại trang quản trị SePay (my.sepay.vn).
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Merchant ID */}
            <div className="space-y-1.5">
              <Label htmlFor="merchantId" className="text-xs font-medium">
                SePay Merchant ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="merchantId"
                placeholder="Ví dụ: SP-MERCHANT-12345"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>

            {/* Secret Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="secretKey" className="text-xs font-medium">
                  SePay Secret Key{" "}
                  {!isConfigured && <span className="text-destructive">*</span>}
                </Label>
                {config?.sepay_secret_key_masked && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Hiện tại: {config.sepay_secret_key_masked}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecretKey ? "text" : "password"}
                  placeholder={
                    isConfigured
                      ? "Nhập khóa bí mật mới để thay đổi..."
                      : "Ví dụ: sec_live_abcdef123456..."
                  }
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="text-xs font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                >
                  {showSecretKey ? (
                    <EyeOffIcon className="size-3.5" />
                  ) : (
                    <EyeIcon className="size-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Bank details for Customer VietQR */}
            <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bankName" className="text-xs font-medium">
                  Ngân hàng nhận tiền
                </Label>
                <Input
                  id="bankName"
                  placeholder="MBBank, Vietcombank, ACB..."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bankAccount" className="text-xs font-medium">
                  Số tài khoản nhận tiền
                </Label>
                <Input
                  id="bankAccount"
                  placeholder="Ví dụ: 0333888999"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bankHolder" className="text-xs font-medium">
                Tên chủ tài khoản (In hoa không dấu)
              </Label>
              <Input
                id="bankHolder"
                placeholder="Ví dụ: NGUYEN VAN A"
                value={bankHolder}
                onChange={(e) => setBankHolder(e.target.value)}
                className="text-xs uppercase"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-border/50 flex justify-end">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <SaveIcon className="size-3.5" />
                    <span>Lưu cấu hình SePay</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Webhook & Guide Side Cards (1 col) */}
        <div className="space-y-4">
          {/* Webhook URL Box */}
          <div className="rounded-2xl border border-border bg-card p-5  text-xs space-y-3">
            <div className="flex items-center gap-2">
              <RadioIcon className="size-4 text-primary shrink-0" />
              <h3 className="font-semibold text-foreground">Webhook URL</h3>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Cài đặt URL này vào mục <strong>Webhooks</strong> tại SePay để hệ thống tự động nhận biến động số dư:
            </p>
            <div className="p-2 rounded-lg bg-muted/60 border border-border font-mono text-[11px] break-all select-all text-foreground">
              {config?.webhook_url || "http://localhost:8000/api/v1/payments/sepay/webhook"}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyWebhook}
              className="w-full text-xs font-medium gap-1.5 h-8 border-border"
            >
              {copiedWebhook ? (
                <>
                  <CheckIcon className="size-3 text-emerald-500" />
                  <span className="text-emerald-500">Đã sao chép</span>
                </>
              ) : (
                <>
                  <CopyIcon className="size-3" />
                  <span>Sao chép Webhook URL</span>
                </>
              )}
            </Button>
          </div>

          {/* Quick Guide */}
          <div className="rounded-2xl border border-border bg-card p-5  text-xs space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircleIcon className="size-4 text-primary shrink-0" />
              <h3 className="font-semibold text-foreground">Hướng dẫn tích hợp</h3>
            </div>
            <ol className="space-y-2 text-[11px] text-muted-foreground list-decimal list-inside leading-relaxed">
              <li>Đăng ký tài khoản tại <a href="https://my.sepay.vn" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">my.sepay.vn</a>.</li>
              <li>Thêm tài khoản ngân hàng và kích hoạt quét biến động số dư.</li>
              <li>Vào mục <strong>Tích hợp Web & API</strong> để copy Merchant ID và Secret Key.</li>
              <li>Dán vào form bên cạnh và lưu để kích hoạt thanh toán VietQR cho Chatbot.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
