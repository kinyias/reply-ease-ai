"use client";

import React from "react";
import {
  Bot,
  Check,
  HelpCircle,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";

import {
  CHATBOT_AVATAR_PRESETS,
  CHATBOT_COLOR_PRESETS,
  WELCOME_MESSAGE_PRESETS,
  useChatbot,
} from "@/hooks/settings/use-chatbot";
import { ChatBot } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ChatbotPreview } from "./chatbot-preview";
import { ImageUploader } from "@/components/ui/image-uploader";

interface ChatbotCustomizerProps {
  domainId: string;
  domainName?: string;
  initialData?: ChatBot | null;
}

export function ChatbotCustomizer({
  domainId,
  domainName = "yourstore.vn",
  initialData,
}: ChatbotCustomizerProps) {
  const {
    form,
    isSaving,
    isLoading,
    livePreview,
    onSubmit,
    selectedAvatarFile,
    setSelectedAvatarFile,
    setPresetWelcome,
    setPresetColor,
    setPresetAvatar,
    resetForm,
  } = useChatbot({ domainId, initialData });

  const {
    register,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = form;

  const currentBg = watch("background") || "#c2410c";
  const currentAvatar = watch("icon") || CHATBOT_AVATAR_PRESETS[0].url;
  const currentHelpdesk = watch("helpdesk") ?? false;
  const currentTextColor = watch("text_color") || "#ffffff";
  const welcomeMessageValue = watch("welcome_message") || "";

  return (
    <div className="w-full space-y-6">
      {/* Title & Scope header */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Chatbot Customizer
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3" />
            AI Widget
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your autonomous chatbot’s avatar, welcome greeting, brand
          palette, and self-service HelpDesk FAQ.
        </p>
      </div>

      {/* Main 2-column layout: Form (left) + Live Widget Preview (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Form */}
        <form
          onSubmit={onSubmit}
          className="lg:col-span-7 space-y-6 bg-card border border-border rounded-xl p-6 shadow-2xs"
        >
          {/* 1. Welcome Greeting Message */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="welcome_message"
                className="text-sm font-semibold flex items-center gap-1.5"
              >
                <Bot className="size-4 text-primary" />
                <span>Lời chào mở đầu (Welcome Greeting)</span>
              </Label>
              <span className="text-xs text-muted-foreground font-mono">
                {welcomeMessageValue.length}/1000
              </span>
            </div>

            <Textarea
              id="welcome_message"
              rows={3}
              placeholder="Nhập câu chào khi khách mở widget..."
              className="resize-none leading-relaxed text-sm"
              {...register("welcome_message")}
            />
            {errors.welcome_message && (
              <p className="text-xs text-destructive">
                {errors.welcome_message.message}
              </p>
            )}

            {/* Presets for Welcome Message */}
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">
                Gợi ý kịch bản mở đầu:
              </span>
              <div className="flex flex-wrap gap-2">
                {WELCOME_MESSAGE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPresetWelcome(preset.text)}
                    className="text-xs bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md border border-border/80 transition-colors text-left"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-5 space-y-3">
            {/* 2. Bot Avatar & Identity */}
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <span>Avatar & Hình đại diện Bot</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Chọn ảnh đại diện có sẵn hoặc dán URL hình ảnh logo thương hiệu của
              bạn.
            </p>

            <div className="flex items-center gap-3">
              {CHATBOT_AVATAR_PRESETS.map((avatar, idx) => {
                const isSelected = currentAvatar === avatar.url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPresetAvatar(avatar.url)}
                    className={`relative size-12 rounded-full overflow-hidden border-2 transition-all p-0.5 ${
                      isSelected
                        ? "border-brand-accent ring-2 ring-brand-accent/30 scale-105"
                        : "border-border hover:border-foreground/50 opacity-80 hover:opacity-100"
                    }`}
                    title={avatar.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="size-full object-cover rounded-full"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                        <Check className="size-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <ImageUploader
                value={currentAvatar}
                onChange={(url) =>
                  form.setValue("icon", url, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                onFileSelect={setSelectedAvatarFile}
                isSaving={isSaving}
                label="Avatar nhận diện Chatbot:"
                description="Xem trước tức thì và tải lên Cloudinary khi Lưu"
                aspectRatio="square"
                previewHeight="h-28"
                placeholder="https://cuahang.vn/bot-avatar.png"
              />
              {errors.icon && (
                <p className="text-xs text-destructive mt-1">
                  {errors.icon.message}
                </p>
              )}
            </div>
          </div>

          {/* 3. Theme Colors */}
          <div className="border-t border-border pt-5 space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Palette className="size-4 text-primary" />
              <span>Bảng màu giao diện (Header Background)</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Màu thanh tiêu đề và điểm nhấn chính của chatbot widget.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              {CHATBOT_COLOR_PRESETS.map((color, idx) => {
                const isSelected = currentBg.toLowerCase() === color.hex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPresetColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    className={`size-7 rounded-full border border-black/10 flex items-center justify-center transition-transform shadow-2xs ${
                      isSelected
                        ? "scale-115 ring-2 ring-offset-2 ring-brand-accent"
                        : "hover:scale-105 opacity-90 hover:opacity-100"
                    }`}
                    title={color.name}
                  >
                    {isSelected && (
                      <Check className="size-3.5 text-white stroke-3" />
                    )}
                  </button>
                );
              })}

              {/* Custom HEX Picker */}
              <div className="flex items-center gap-2 pl-2">
                <input
                  type="color"
                  value={currentBg}
                  onChange={(e) => setPresetColor(e.target.value)}
                  className="size-7 rounded-lg cursor-pointer border border-input p-0 bg-transparent"
                  title="Pick custom color"
                />
                <Input
                  type="text"
                  value={currentBg}
                  onChange={(e) => setPresetColor(e.target.value)}
                  className="w-24 h-7 text-xs font-mono uppercase"
                  placeholder="#F25F22"
                />
              </div>
            </div>

            {/* Text Color Option */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Màu chữ Header</Label>
                <p className="text-xs text-muted-foreground">
                  Điều chỉnh tương phản sáng/tối cho chữ trên thanh tiêu đề.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setValue("text_color", "#ffffff")}
                  className={`px-3 py-1 text-xs rounded-md border font-medium transition-colors ${
                    currentTextColor === "#ffffff"
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  Sáng (Trắng)
                </button>
                <button
                  type="button"
                  onClick={() => setValue("text_color", "#0f172a")}
                  className={`px-3 py-1 text-xs rounded-md border font-medium transition-colors ${
                    currentTextColor === "#0f172a"
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  Tối (Đen)
                </button>
              </div>
            </div>
          </div>

          {/* 4. Self-Service HelpDesk FAQ Switch */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="size-4 text-primary" />
                  <Label
                    htmlFor="helpdesk-switch"
                    className="text-sm font-semibold cursor-pointer"
                  >
                    Hiển thị HelpDesk FAQ trong Chat
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Khách hàng có thể bấm xem trực tiếp các câu hỏi thường gặp
                  ngay trong widget để tự giải đáp trước khi chat.
                </p>
              </div>
              <Switch
                id="helpdesk-switch"
                checked={currentHelpdesk}
                onCheckedChange={(checked) =>
                  setValue("helpdesk", checked, { shouldDirty: true })
                }
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-border pt-5 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || isSaving || isLoading}
              onClick={resetForm}
              className="h-9 px-4 text-xs gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              <span>Hủy thay đổi</span>
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isLoading}
              className="h-9 px-5 text-xs font-semibold bg-primary hover:bg-[#9a3412] text-primary-foreground gap-1.5 shadow-xs"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Lưu cấu hình Chatbot</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Live Widget Preview (Right Sticky Column) */}
        <div className="lg:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-foreground">
              Xem trước thực tế (Real-time Preview)
            </h3>
            <span className="text-xs text-muted-foreground">
              Mọi thay đổi cập nhật tức thì
            </span>
          </div>

          <ChatbotPreview preview={livePreview} domainName={domainName} />
        </div>
      </div>
    </div>
  );
}

export default ChatbotCustomizer;
