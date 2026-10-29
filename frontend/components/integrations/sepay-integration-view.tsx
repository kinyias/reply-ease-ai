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
import { useI18n } from "@/context/i18n-context";
import { paymentService } from "@/services/payment-service";
import { UpdateSepayMerchantPayload } from "@/types/payment";

export function SepayIntegrationView() {
  const { t } = useI18n();
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
      toast.success(t("integrations.savedSuccess", "SePay Merchant settings saved successfully!"));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || t("integrations.saveError", "Failed to save SePay configuration."));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId.trim()) {
      toast.error(t("integrations.reqMerchant", "Please enter SePay Merchant ID."));
      return;
    }
    if (!secretKey.trim() && !config?.is_configured) {
      toast.error(t("integrations.reqSecret", "Please enter SePay Secret Key."));
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
      toast.success(t("integrations.copiedWebhook", "Copied Webhook URL!"));
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">{t("integrations.loading", "Loading SePay Connect configuration...")}</p>
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
              {t("integrations.title", "SePay Connect Integration")}
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Custom Merchant Onboarding
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("integrations.desc", "Connect your own SePay merchant account to receive product payments directly to your personal bank account.")}
          </p>
        </div>

        {/* Live Status Badge */}
        <div>
          {isConfigured ? (
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium px-3 py-1 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 " />
              <span>{t("integrations.active", "Active")}</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border/80 font-medium px-3 py-1 flex items-center gap-1.5">
              <UnplugIcon className="size-3" />
              <span>{t("integrations.notConnected", "Not Connected")}</span>
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
                ? t("integrations.readyToReceive", "SePay account is ready to receive funds")
                : t("integrations.needConnection", "SePay account not connected yet")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {isConfigured ? (
                <>
                  {t("integrations.connectedDetails", { id: config?.sepay_merchant_id || "" }, `System is connected with Merchant ID: ${config?.sepay_merchant_id}. Customer checkout payments will automatically transfer directly to your bank account.`)}
                </>
              ) : (
                t("integrations.unconnectedDetails", "When connecting SePay, customer order payments on ChatBot will be transferred straight to your bank account without transaction fees.")
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Main Settings Form (2 cols) */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 ">
          <h2 className="text-base font-semibold text-foreground mb-1">
            {t("integrations.formTitle", "SePay Connection Credentials")}
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            {t("integrations.formSubtitle", "Retrieve your Merchant ID and Secret Key at SePay Admin (my.sepay.vn).")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Merchant ID */}
            <div className="space-y-1.5">
              <Label htmlFor="merchantId" className="text-xs font-medium">
                {t("integrations.merchantIdLabel", "SePay Merchant ID")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="merchantId"
                placeholder="SP-MERCHANT-12345"
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
                  {t("integrations.secretKeyLabel", "SePay Secret Key")}{" "}
                  {!isConfigured && <span className="text-destructive">*</span>}
                </Label>
                {config?.sepay_secret_key_masked && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {t("integrations.currentKeyMasked", { key: config.sepay_secret_key_masked }, `Current: ${config.sepay_secret_key_masked}`)}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecretKey ? "text" : "password"}
                  placeholder={
                    isConfigured
                      ? t("integrations.secretKeyPlaceholder", "Enter new secret key to change...")
                      : t("integrations.secretKeyExample", "e.g.: sec_live_abcdef123456...")
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
                  {t("integrations.bankLabel", "Receiving Bank")}
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
                  {t("integrations.accountNumberLabel", "Receiving Account Number")}
                </Label>
                <Input
                  id="bankAccount"
                  placeholder="0333888999"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bankHolder" className="text-xs font-medium">
                {t("integrations.accountHolderLabel", "Account Holder Name (Uppercase without accents)")}
              </Label>
              <Input
                id="bankHolder"
                placeholder="NGUYEN VAN A"
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
                    <span>{t("integrations.saving", "Saving...")}</span>
                  </>
                ) : (
                  <>
                    <SaveIcon className="size-3.5" />
                    <span>{t("integrations.saveConfig", "Save SePay Configuration")}</span>
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
              {t("integrations.webhookHelp", "Configure this URL in the Webhooks section at SePay so the system receives balance updates in real-time:")}
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
                  <span className="text-emerald-500">{t("integrations.copied", "Copied")}</span>
                </>
              ) : (
                <>
                  <CopyIcon className="size-3" />
                  <span>{t("integrations.copyWebhook", "Copy Webhook URL")}</span>
                </>
              )}
            </Button>
          </div>

          {/* Quick Guide */}
          <div className="rounded-2xl border border-border bg-card p-5  text-xs space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircleIcon className="size-4 text-primary shrink-0" />
              <h3 className="font-semibold text-foreground">{t("integrations.guideTitle", "Integration Guide")}</h3>
            </div>
            <ol className="space-y-2 text-[11px] text-muted-foreground list-decimal list-inside leading-relaxed">
              <li>{t("integrations.step1", "Register an account at my.sepay.vn")}</li>
              <li>{t("integrations.step2", "Add your bank account and enable transaction notifications.")}</li>
              <li>{t("integrations.step3", "Go to Web & API Integration to copy your Merchant ID and Secret Key.")}</li>
              <li>{t("integrations.step4", "Paste into this form and save to activate VietQR checkout on Chatbot.")}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
