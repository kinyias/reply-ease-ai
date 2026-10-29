"use client";

import * as React from "react";
import Image from "next/image";
import { ExternalLinkIcon, ImageIcon, Maximize2Icon, XIcon } from "lucide-react";
import { useI18n } from "@/context/i18n-context";

export interface MessageSegment {
  type: "text" | "image";
  value: string;
}

/**
 * Normalizes relative image URLs to backend absolute URLs if needed.
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return "";
  const cleanUrl = url.trim().replace(/^["']|["']$/g, "");
  if (cleanUrl.startsWith("/")) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${apiBase.replace(/\/$/, "")}${cleanUrl}`;
  }
  return cleanUrl;
}

/**
 * Parses message string containing <Image>URL</Image> or <Image src="URL" /> into segments.
 */
export function parseMessageSegments(content: string): MessageSegment[] {
  if (!content) return [];

  // Match:
  // 1. <Image>...</Image> or <Image src="...">...</Image>
  // 2. <Image src="..." ... />
  const regex =
    /<Image\b(?:\s+src=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/Image>|<Image\b\s+src=["']([^"']+)["'][^>]*\/?>/gi;

  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const matchStart = match.index;
    const matchEnd = regex.lastIndex;

    // Text chunk before the image tag
    if (matchStart > lastIndex) {
      const textBefore = content.slice(lastIndex, matchStart);
      if (textBefore) {
        segments.push({ type: "text", value: textBefore });
      }
    }

    // Extract image URL from either group:
    // match[1] = src attribute inside <Image src="...">...</Image>
    // match[2] = inner text inside <Image>...</Image>
    // match[3] = src attribute inside self-closing <Image src="..." />
    let rawUrl = "";
    if (match[2] && match[2].trim()) {
      rawUrl = match[2].trim();
    } else if (match[1] && match[1].trim()) {
      rawUrl = match[1].trim();
    } else if (match[3] && match[3].trim()) {
      rawUrl = match[3].trim();
    }

    const cleanUrl = normalizeImageUrl(rawUrl);
    if (cleanUrl) {
      segments.push({ type: "image", value: cleanUrl });
    }

    lastIndex = matchEnd;
  }

  // Trailing text chunk
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText) {
      segments.push({ type: "text", value: remainingText });
    }
  }

  return segments;
}

/**
 * Strips <Image> tags for single-line message snippet previews (e.g. chat card lists).
 */
export function stripImageTagsForPreview(content: string): string {
  if (!content) return "";
  const cleaned = content
    .replace(
      /<Image\b(?:\s+src=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/Image>|<Image\b\s+src=["']([^"']+)["'][^>]*\/?>/gi,
      "[Image]"
    )
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "[Image]";
}

interface ProductImageBubbleProps {
  src: string;
  alt?: string;
  isUser?: boolean;
}

function ProductImageBubble({ src, alt, isUser }: ProductImageBubbleProps) {
  const { t } = useI18n();
  const imageAlt = alt || t("chatbot.imagePreviewAlt", "Product Image");
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  // Close lightbox on Escape
  React.useEffect(() => {
    if (!isPreviewOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPreviewOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewOpen]);

  if (hasError) {
    return (
      <div
        className={`my-2 p-3 rounded-xl border text-xs flex items-center gap-2 ${
          isUser
            ? "bg-white/10 border-white/20 text-white"
            : "bg-zinc-100 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
        }`}
      >
        <ImageIcon className="size-4 shrink-0 opacity-60" />
        <span className="truncate flex-1">{t("chatbot.productImage", "Product Image")}: {src}</span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium hover:opacity-80 shrink-0 inline-flex items-center gap-1"
        >
          <span>{t("common.open", "Open")}</span>
          <ExternalLinkIcon className="size-3" />
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="my-2 group relative max-w-[280px] sm:max-w-[320px] w-full rounded-xl overflow-hidden border border-zinc-200/90 dark:border-zinc-700/80 bg-zinc-100 dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md">
        {/* Loading shimmer */}
        {isLoading && (
          <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 animate-pulse flex items-center justify-center">
            <ImageIcon className="size-6 text-zinc-400 dark:text-zinc-500 animate-pulse" />
          </div>
        )}

        {/* Main Image */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsPreviewOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsPreviewOpen(true);
            }
          }}
          className="relative w-full aspect-4/3 cursor-pointer overflow-hidden bg-zinc-100 dark:bg-zinc-900"
          title={t("chatbot.clickToZoom", "Click to zoom")}
        >
          <Image
            src={src}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 280px, 320px"
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            unoptimized
          />

          {/* Hover overlay hint */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
              <Maximize2Icon className="size-3" />
              <span>{t("chatbot.zoom", "Zoom")}</span>
            </span>
          </div>
        </div>

        {/* Bottom bar with open link button */}
        <div className="px-2.5 py-1.5 bg-white/95 dark:bg-zinc-900/95 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1 truncate font-medium">
            <ImageIcon className="size-3 text-orange-500 shrink-0" />
            <span className="truncate">{t("chatbot.imagePreviewAlt", "Product Image")}</span>
          </span>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isPreviewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-white text-xs">
              <span className="font-medium truncate">{alt}</span>
              <div className="flex items-center gap-2">
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 inline-flex items-center gap-1 text-[11px] transition-colors"
                >
                  <span>{t("chatbot.openNewTab", "Open in new tab")}</span>
                  <ExternalLinkIcon className="size-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                  aria-label={t("chatbot.closePreview", "Close preview")}
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            </div>

            {/* Lightbox Image View */}
            <div className="relative w-full h-[60vh] max-h-[600px] bg-black flex items-center justify-center p-2">
              <Image
                src={src}
                alt={imageAlt}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ChatMessageContentProps {
  content: string;
  isUser?: boolean;
  className?: string;
}

export function ChatMessageContent({
  content,
  isUser = false,
  className = "",
}: ChatMessageContentProps) {
  const segments = React.useMemo(() => parseMessageSegments(content), [content]);

  if (!segments || segments.length === 0) {
    return <span className={className}>&nbsp;</span>;
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {segments.map((segment, idx) => {
        if (segment.type === "image") {
          return (
            <ProductImageBubble
              key={`img_${idx}_${segment.value.slice(-16)}`}
              src={segment.value}
              isUser={isUser}
            />
          );
        }

        return (
          <p
            key={`txt_${idx}`}
            className="whitespace-pre-wrap leading-relaxed m-0"
          >
            {segment.value}
          </p>
        );
      })}
    </div>
  );
}

export default ChatMessageContent;
