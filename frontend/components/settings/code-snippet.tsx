"use client";

import * as React from "react";
import {
  CheckIcon,
  Code2Icon,
  CopyIcon,
  ExternalLinkIcon,
  LayersIcon,
  TerminalIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/context/i18n-context";

interface CodeSnippetProps {
  domainId: string;
  domainName: string;
}

export function CodeSnippet({ domainId, domainName }: CodeSnippetProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = React.useState<"script" | "iframe">("script");
  const [copied, setCopied] = React.useState(false);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const scriptCode = `<!-- ReplyEase AI Chatbot Widget -->
<script
  src="${baseUrl}/widget.js"
  data-domain-id="${domainId}"
  defer
></script>`;

  const iframeCode = `<!-- ReplyEase AI Direct Iframe -->
<iframe
  src="${baseUrl}/chatbot?domain_id=${domainId}"
  width="450"
  height="670"
  frameborder="0"
  style="border: none; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.15);"
  title="Chatbot ${domainName}"
></iframe>`;

  const currentCode = activeTab === "script" ? scriptCode : iframeCode;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      toast.success(t("settingsEmbed.copied", "Copied to clipboard!"), {
        description: t("settingsEmbed.snippetDesc", "Paste this code snippet into your website before the closing </body> tag."),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("settingsEmbed.copyFail", "Could not copy automatically, please copy manually."));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {t("settingsEmbed.title", "Widget Embed Code")}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              Domain: {domainName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("settingsEmbed.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`${baseUrl}/chatbot?domain_id=${domainId}`, "_blank")}
            className="text-xs h-9 gap-1.5"
          >
            <ExternalLinkIcon className="size-3.5" />
            {t("settingsEmbed.testWidget", "Preview Widget")}
          </Button>

          <Button
            size="sm"
            onClick={handleCopy}
            className="text-xs h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
          >
            {copied ? (
              <>
                <CheckIcon className="size-3.5 text-emerald-400" />
                {t("settingsEmbed.copied", "Copied!")}
              </>
            ) : (
              <>
                <CopyIcon className="size-3.5" />
                {t("settingsEmbed.copyCode", "Copy Code")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-xl border border-border/60 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("script")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "script"
              ? "bg-background text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code2Icon className="size-3.5" />
          {t("settingsEmbed.scriptTab", "Floating Chat Bubble (Script)")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("iframe")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "iframe"
              ? "bg-background text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayersIcon className="size-3.5" />
          {t("settingsEmbed.iframeTab", "Direct Iframe Embed")}
        </button>
      </div>

      {/* Code Editor block */}
      <Card className="overflow-hidden border border-border/80 bg-zinc-950 dark:bg-zinc-950 text-zinc-100 shadow-md">
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400">
          <div className="flex items-center gap-2 font-mono">
            <TerminalIcon className="size-3.5 text-primary" />
            <span>{activeTab === "script" ? "widget-snippet.html" : "iframe-embed.html"}</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {copied ? (
              <CheckIcon className="size-3.5 text-emerald-400" />
            ) : (
              <CopyIcon className="size-3.5" />
            )}
            <span>{copied ? t("common.copied", "Copied") : t("common.copy", "Copy")}</span>
          </button>
        </div>

        <CardContent className="p-4 font-mono text-xs leading-relaxed overflow-x-auto text-emerald-300">
          <pre>{currentCode}</pre>
        </CardContent>
      </Card>

      {/* Deployment Step Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
          <div className="size-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
            1
          </div>
          <h4 className="text-xs font-semibold text-foreground">{t("settingsEmbed.copyCode", "Copy Code")} nhúng</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Click vào nút &quot;{t("settingsEmbed.copyCode", "Copy Code")}&quot; ở trên để lưu đoạn mã có sẵn mã định danh `domain_id` của bạn.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
          <div className="size-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
            2
          </div>
          <h4 className="text-xs font-semibold text-foreground">{t("settingsEmbed.pasteNotice", "Paste into Website")}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("settingsEmbed.step2Desc", "Open your website HTML and paste the snippet right before the closing </body> tag.")}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
          <div className="size-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
            3
          </div>
          <h4 className="text-xs font-semibold text-foreground">{t("settingsEmbed.step3Title", "Activate & Test")}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("settingsEmbed.step3Desc", "Save changes and reload your website. The AI assistant will appear at the bottom right corner.")}
          </p>
        </div>
      </div>
    </div>
  );
}
