"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircleIcon,
  GlobeIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDomainManagement } from "@/hooks/sidebar/use-domain-management";
import { createDomainSchema, CreateDomainFormValues } from "@/schemas/domain";
import { ImageUploader } from "@/components/ui/image-uploader";
import uploadService from "@/services/upload-service";

interface AddDomainModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newDomainName: string) => void;
}

const PRESET_ICONS = [
  {
    label: "Cửa hàng",
    url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&auto=format&fit=crop&q=80",
  },
  {
    label: "Công nghệ",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&auto=format&fit=crop&q=80",
  },
  {
    label: "Thời trang",
    url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=100&auto=format&fit=crop&q=80",
  },
  {
    label: "Dịch vụ",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=80",
  },
];

export function AddDomainModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: AddDomainModalProps) {
  const router = useRouter();
  const { quota, createDomain, isCreating } = useDomainManagement();
  const [selectedIconFile, setSelectedIconFile] = React.useState<File | null>(null);
  const [isUploadingIcon, setIsUploadingIcon] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateDomainFormValues>({
    resolver: zodResolver(createDomainSchema),
    defaultValues: {
      name: "",
      icon: PRESET_ICONS[0].url,
    },
  });

  const watchedIcon = watch("icon");
  const canCreate = quota ? quota.can_create_domain : true;

  const onSubmit = async (values: CreateDomainFormValues) => {
    try {
      let iconUrl = values.icon;
      if (selectedIconFile) {
        setIsUploadingIcon(true);
        const res = await uploadService.uploadImage(selectedIconFile);
        iconUrl = res.url;
      }

      const created = await createDomain({ ...values, icon: iconUrl });
      setSelectedIconFile(null);
      reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(created.name);
      } else {
        router.push(`/settings/${created.name}`);
      }
    } catch {
      // Error handled by hook toast
    } finally {
      setIsUploadingIcon(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <GlobeIcon className="size-4" />
            </div>
            <DialogTitle>Thêm Domain Mới</DialogTitle>
          </div>
          <DialogDescription>
            Kết nối tên miền website của bạn để tạo chatbot AI bán hàng riêng biệt.
          </DialogDescription>
        </DialogHeader>

        {/* Quota status card */}
        {quota && (
          <div className="p-3 rounded-xl border border-border/80 bg-muted/30 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Gói cước:</span>
              <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary font-semibold">
                {quota.plan}
              </span>
            </div>
            <div className="text-muted-foreground">
              Đã dùng:{" "}
              <span className="font-semibold text-foreground">
                {quota.used_domains}
              </span>{" "}
              / {quota.max_domains} domains
            </div>
          </div>
        )}

        {/* Quota reached warning */}
        {!canCreate && (
          <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircleIcon className="size-4" />
              <span>Đã đạt giới hạn số lượng domain</span>
            </div>
            <p className="leading-relaxed opacity-90">
              Gói {quota?.plan} chỉ cho phép tối đa {quota?.max_domains} domain. Vui lòng nâng cấp lên gói Pro hoặc Ultimate để thêm website mới.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                router.push("/billing");
              }}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs h-8"
            >
              <SparklesIcon className="size-3.5 mr-1.5" />
              Nâng cấp gói cước ngay
            </Button>
          </div>
        )}

        {canCreate && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            {/* Domain name */}
            <div className="space-y-1.5">
              <Label htmlFor="domain-name" className="text-xs font-medium">
                Tên miền / Website <span className="text-destructive">*</span>
              </Label>
              <Input
                id="domain-name"
                placeholder="VD: mystore.vn hoặc mybrand.com"
                {...register("name")}
              />
              <p className="text-[11px] text-muted-foreground">
                Nhập tên miền không cần http:// (ví dụ: store.vn)
              </p>
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Icon picker with Cloudinary upload */}
            <div className="space-y-1.5">
              <ImageUploader
                value={watchedIcon}
                onChange={(url) => setValue("icon", url, { shouldValidate: true })}
                onFileSelect={setSelectedIconFile}
                isSaving={isCreating || isUploadingIcon}
                label="Icon đại diện website"
                description="Xem trước tức thì và tải lên Cloudinary khi Lưu"
                aspectRatio="square"
                previewHeight="h-28"
                presets={PRESET_ICONS}
                placeholder="https://cuahang.vn/logo.png"
              />
              {errors.icon && (
                <p className="text-xs text-destructive">{errors.icon.message}</p>
              )}
            </div>

            <DialogFooter className="mt-6 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating || isUploadingIcon}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUploadingIcon}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-28"
              >
                {(isCreating || isUploadingIcon) ? (
                  <Loader2Icon className="size-4 animate-spin mr-1.5" />
                ) : null}
                {isUploadingIcon ? "Đang tải ảnh..." : "Khởi tạo Domain"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
