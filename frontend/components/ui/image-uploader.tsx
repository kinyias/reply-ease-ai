"use client";

import * as React from "react";
import Image from "next/image";
import {
  UploadCloudIcon,
  Loader2Icon,
  Trash2Icon,
  LinkIcon,
  RefreshCwIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface PresetImage {
  label: string;
  url: string;
}

export interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onFileSelect?: (file: File | null) => void;
  isSaving?: boolean;
  label?: string;
  description?: string;
  aspectRatio?: "square" | "video" | "wide" | "auto";
  previewHeight?: string;
  className?: string;
  disabled?: boolean;
  presets?: PresetImage[];
  placeholder?: string;
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "image/gif",
];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export function ImageUploader({
  value,
  onChange,
  onFileSelect,
  isSaving = false,
  label = "Hình ảnh",
  description = "Hỗ trợ PNG, JPG, JPEG, WEBP tối đa 2MB",
  aspectRatio = "video",
  previewHeight = "h-36",
  className = "",
  disabled = false,
  presets = [],
  placeholder = "https://example.com/image.png",
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"upload" | "url">("upload");
  const [inputUrl, setInputUrl] = React.useState(value || "");

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync internal input URL if value changes externally
  React.useEffect(() => {
    setInputUrl(value || "");
  }, [value]);

  // Clean up object URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (value?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(value);
        } catch {
          // ignore
        }
      }
    };
  }, [value]);

  const handleFileProcess = (file: File) => {
    if (disabled || isSaving) return;

    // 1. Client-side format validation
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      toast.error("Định dạng file không được hỗ trợ", {
        description: "Vui lòng chọn ảnh PNG, JPG, JPEG, WEBP hoặc GIF.",
      });
      return;
    }

    // 2. Client-side size validation (max 2MB)
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error("Kích thước file vượt quá 2MB", {
        description: `File hiện tại ${sizeMB}MB. Vui lòng chọn ảnh dưới 2MB.`,
      });
      return;
    }

    // 3. Revoke previous blob if any
    if (value?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(value);
      } catch {
        // ignore
      }
    }

    // 4. Create local blob URL for instant zero-latency preview
    const blobUrl = URL.createObjectURL(file);
    onChange(blobUrl);
    setInputUrl(blobUrl);
    onFileSelect?.(file);

    toast.info("Đã chọn ảnh xem trước", {
      description: "Ảnh sẽ được tự động tải lên Cloudinary khi bạn bấm Lưu.",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isSaving) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isSaving) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClear = () => {
    if (value?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(value);
      } catch {
        // ignore
      }
    }
    onChange("");
    setInputUrl("");
    onFileSelect?.(null);
  };

  const handleApplyUrl = () => {
    if (inputUrl.trim()) {
      if (value?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(value);
        } catch {
          // ignore
        }
      }
      onChange(inputUrl.trim());
      onFileSelect?.(null);
      toast.success("Đã áp dụng URL ảnh");
    }
  };

  const isBlob = value?.startsWith("blob:");
  const isCloudinary = value?.includes("cloudinary.com");

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "wide"
      ? "aspect-[21/9]"
      : aspectRatio === "video"
      ? "aspect-video"
      : "";

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header with Mode Switching */}
      <div className="flex items-center justify-between">
        <div>
          {label && (
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>{label}</span>
              {isBlob ? (
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"
                >
                  <SparklesIcon className="size-2.5" />
                  Chờ lưu Cloudinary
                </Badge>
              ) : isCloudinary ? (
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                >
                  Cloudinary
                </Badge>
              ) : null}
            </Label>
          )}
          {description && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        {/* Tab switch */}
        <div className="inline-flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              activeTab === "upload"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Chọn file
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              activeTab === "url"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Nhập URL
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled || isSaving}
      />

      {/* Main Container */}
      {value ? (
        /* Image Preview Box with Blob Indicator and Saving State */
        <div
          className={`relative w-48 h-48 sm:w-52 sm:h-52 max-w-full rounded-xl border border-border/80 bg-muted/20 overflow-hidden group transition-all ${aspectClass} ${
            isSaving ? "ring-2 ring-primary/60 border-primary" : ""
          }`}
        >
          <Image
            src={value}
            alt={label || "Uploaded preview"}
            fill
            unoptimized
            className={`object-cover transition-transform duration-300 ${
              isSaving ? "scale-105 filter blur-xs" : "group-hover:scale-[1.02]"
            }`}
          />

          {/* Saving / Uploading Progress Overlay */}
          {isSaving ? (
            <div className="absolute inset-0 bg-background/85 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-20 animate-in fade-in duration-200">
              <div className="relative size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <span className="absolute inset-0 rounded-full bg-primary/25 animate-ping opacity-75" />
                <Loader2Icon className="size-5.5 animate-spin" />
              </div>
              <p className="text-xs font-semibold text-foreground mb-0.5">
                Đang tải ảnh lên Cloudinary...
              </p>
              <p className="text-[10px] text-muted-foreground">Vui lòng chờ trong giây lát</p>
            </div>
          ) : (
            /* Action Overlay on Hover */
            <div className="absolute inset-0 bg-background/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 text-xs font-medium shadow-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isSaving}
              >
                <RefreshCwIcon className="size-3.5 mr-1.5" />
                Đổi ảnh
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-8 text-xs font-medium shadow-xs"
                onClick={handleClear}
                disabled={disabled || isSaving}
              >
                <Trash2Icon className="size-3.5 mr-1.5" />
                Xóa
              </Button>
            </div>
          )}
        </div>
      ) : activeTab === "upload" ? (
        /* Drag and Drop Select Area */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isSaving && !disabled && fileInputRef.current?.click()}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all overflow-hidden ${
            isSaving
              ? "border-primary bg-primary/5 cursor-wait"
              : isDragOver
              ? "border-primary bg-primary/10 scale-[0.99]"
              : "border-border/80 hover:border-primary/60 hover:bg-muted/30"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${previewHeight}`}
        >
          <div className="flex flex-col items-center justify-center space-y-2 py-1">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-0.5 transition-transform duration-200 group-hover:scale-105">
              <UploadCloudIcon className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground">
                Kéo thả ảnh vào đây hoặc{" "}
                <span className="text-primary underline font-semibold">chọn từ máy</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Xem trước tức thì (ảnh sẽ lưu lên Cloudinary khi gửi form)
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Direct URL Input Mode */
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder={placeholder}
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyUrl();
                  }
                }}
                className="pl-8 text-xs h-9"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyUrl}
              className="h-9 px-3 text-xs"
            >
              Áp dụng
            </Button>
          </div>
        </div>
      )}

      {/* Presets if provided */}
      {presets.length > 0 && !value && !isSaving && (
        <div className="pt-1">
          <span className="text-[11px] text-muted-foreground block mb-1">
            Gợi ý ảnh mẫu nhanh:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  setInputUrl(preset.url);
                  onFileSelect?.(null);
                }}
                className="px-2 py-0.5 text-xs rounded-md border border-border/80 bg-muted/40 hover:bg-muted text-foreground transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
