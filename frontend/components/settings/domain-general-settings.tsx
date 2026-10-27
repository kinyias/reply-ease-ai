"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  GlobeIcon,
  Loader2Icon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import domainService from "@/services/domain-service";
import { updateDomainSchema, UpdateDomainFormValues } from "@/schemas/domain";
import { Domain } from "@/types/domain";
import { ImageUploader } from "@/components/ui/image-uploader";
import uploadService from "@/services/upload-service";

interface DomainGeneralSettingsProps {
  domain: Domain;
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

export function DomainGeneralSettings({ domain }: DomainGeneralSettingsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [confirmNameInput, setConfirmNameInput] = React.useState("");
  const [selectedIconFile, setSelectedIconFile] = React.useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateDomainFormValues>({
    resolver: zodResolver(updateDomainSchema),
    defaultValues: {
      name: domain.name,
      icon: domain.icon,
    },
  });

  const watchedIcon = watch("icon");

  // Mutation to update domain
  const updateMutation = useMutation({
    mutationFn: async (values: UpdateDomainFormValues) => {
      let iconUrl = values.icon;
      if (selectedIconFile) {
        const uploadRes = await uploadService.uploadImage(selectedIconFile);
        iconUrl = uploadRes.url;
      }
      return domainService.updateDomain(domain.id, { ...values, icon: iconUrl });
    },
    onSuccess: (updated) => {
      setSelectedIconFile(null);
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      queryClient.invalidateQueries({ queryKey: ["domains", domain.id] });
      toast.success("Cập nhật thông tin Domain thành công!");
      if (updated.name !== domain.name) {
        router.push(`/settings/${updated.name}`);
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error("Không thể cập nhật domain", {
        description: err.response?.data?.detail || "Đã xảy ra lỗi vui lòng thử lại.",
      });
    },
  });

  // Mutation to delete domain
  const deleteMutation = useMutation({
    mutationFn: () => domainService.deleteDomain(domain.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      queryClient.invalidateQueries({ queryKey: ["domains", "quota"] });
      toast.success("Đã xóa Domain thành công");
      setIsDeleteDialogOpen(false);
      router.push("/dashboard");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error("Không thể xóa domain", {
        description: err.response?.data?.detail || "Đã xảy ra lỗi vui lòng thử lại.",
      });
    },
  });

  const onSubmit = (values: UpdateDomainFormValues) => {
    updateMutation.mutate(values);
  };

  const isDeleteConfirmed = confirmNameInput.trim().toLowerCase() === domain.name.toLowerCase();

  return (
    <div className="space-y-8">
      {/* General Information Card */}
      <Card className="border border-border/80 shadow-xs">
        <div className="px-6 py-4 border-b border-border/60">
          <h3 className="text-base font-semibold text-foreground">
            Thông tin định danh Domain
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cập nhật tên miền và biểu tượng hiển thị của website này.
          </p>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Domain Name */}
            <div className="space-y-1.5 max-w-md">
              <Label htmlFor="domain-name" className="text-xs font-medium">
                Tên miền / Website
              </Label>
              <div className="relative">
                <GlobeIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="domain-name"
                  className="pl-9"
                  placeholder="VD: mystore.vn"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Icon picker with Cloudinary upload */}
            <div className="space-y-1.5 max-w-md">
              <ImageUploader
                value={watchedIcon}
                onChange={(url) => setValue("icon", url, { shouldDirty: true, shouldValidate: true })}
                onFileSelect={setSelectedIconFile}
                isSaving={updateMutation.isPending}
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

            {/* Submit */}
            <div className="pt-3">
              <Button
                type="submit"
                disabled={(!isDirty && !selectedIconFile) || updateMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs font-medium"
              >
                {updateMutation.isPending ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <SaveIcon className="size-3.5" />
                )}
                <span>
                  {updateMutation.isPending
                    ? "Đang lưu & tải ảnh lên Cloudinary..."
                    : "Lưu thay đổi Domain"}
                </span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone: Delete Domain */}
      <Card className="border border-destructive/30 bg-destructive/5 shadow-xs">
        <div className="px-6 py-4 border-b border-destructive/20 flex items-center gap-2 text-destructive">
          <AlertTriangleIcon className="size-4" />
          <h3 className="text-base font-semibold">Khu vực nguy hiểm (Danger Zone)</h3>
        </div>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              Xóa hoàn toàn Domain này
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              Khi bạn xóa domain <strong className="text-foreground">{domain.name}</strong>, toàn bộ cấu hình ChatBot, cơ sở tri thức HelpDesk FAQs, chuỗi câu hỏi lọc lead, danh mục sản phẩm và lịch sử hội thoại của khách hàng sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setConfirmNameInput("");
              setIsDeleteDialogOpen(true);
            }}
            className="text-xs gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium shadow-xs"
          >
            <Trash2Icon className="size-3.5" />
            <span>Xóa Domain vĩnh viễn</span>
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangleIcon className="size-5" />
              <DialogTitle className="text-destructive">
                Xác nhận xóa vĩnh viễn Domain
              </DialogTitle>
            </div>
            <DialogDescription>
              Hành động này <strong className="text-foreground">KHÔNG THỂ HOÀN TÁC</strong>. Để xác nhận, vui lòng nhập chính xác tên domain bên dưới:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-2.5 rounded-lg bg-muted text-xs font-mono text-center font-semibold select-all">
              {domain.name}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-domain-name" className="text-xs font-medium">
                Nhập lại tên domain:
              </Label>
              <Input
                id="confirm-domain-name"
                value={confirmNameInput}
                onChange={(e) => setConfirmNameInput(e.target.value)}
                placeholder={domain.name}
                className="font-mono text-xs"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={!isDeleteConfirmed || deleteMutation.isPending}
              className="min-w-28"
            >
              {deleteMutation.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
              ) : null}
              Xóa Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
