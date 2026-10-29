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
import { useI18n } from "@/context/i18n-context";

interface DomainGeneralSettingsProps {
  domain: Domain;
}

const PRESET_ICONS = [
  {
    label: "Retail Store",
    url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&auto=format&fit=crop&q=80",
  },
  {
    label: "Technology",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&auto=format&fit=crop&q=80",
  },
  {
    label: "Fashion",
    url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=100&auto=format&fit=crop&q=80",
  },
  {
    label: "Services",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=80",
  },
];

export function DomainGeneralSettings({ domain }: DomainGeneralSettingsProps) {
  const { t } = useI18n();
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
      toast.success(t("settingsGeneral.saveSuccess", "Domain updated successfully!"));
      if (updated.name !== domain.name) {
        router.push(`/settings/${updated.name}`);
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(t("settingsGeneral.saveError", "Could not update domain"), {
        description: err.response?.data?.detail || t("common.errorTryAgain", "An error occurred, please try again."),
      });
    },
  });

  // Mutation to delete domain
  const deleteMutation = useMutation({
    mutationFn: () => domainService.deleteDomain(domain.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      queryClient.invalidateQueries({ queryKey: ["domains", "quota"] });
      toast.success(t("settingsGeneral.deleteSuccess", "Domain deleted successfully"));
      setIsDeleteDialogOpen(false);
      router.push("/dashboard");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(t("settingsGeneral.deleteError", "Could not delete domain"), {
        description: err.response?.data?.detail || t("common.errorTryAgain", "An error occurred, please try again."),
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
            {t("settings.general.infoTitle", "Domain Identification")}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("settings.general.infoSubtitle", "Update domain name and display icon for this website.")}
          </p>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Domain Name */}
            <div className="space-y-1.5 max-w-md">
              <Label htmlFor="domain-name" className="text-xs font-medium">
                {t("settingsGeneral.domainNameLabel", "Domain Name")}
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
                label={t("settingsGeneral.iconLabel", "Website Icon")}
                description={t("settingsGeneral.iconDesc", "Instant preview, uploads to Cloudinary upon saving")}
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
                    ? t("settingsGeneral.saving", "Saving & uploading...")
                    : t("common.save", "Save Changes")}
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
          <h3 className="text-base font-semibold">{t("settings.general.dangerZone", "Danger Zone")}</h3>
        </div>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              {t("settings.general.deleteDomainTitle", "Permanently Delete This Domain")}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              {t("settingsGeneral.deleteDomainDesc", "Permanently delete this domain along with its chatbot, FAQ training, products, and conversations. This action cannot be undone.")}
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
            <span>{t("settings.general.deleteDomainBtn", "Delete Domain Permanently")}</span>
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
                {t("settingsGeneral.deleteModalTitle", { domain: domain.name }, `Confirm Delete Domain "${domain.name}"`)}
              </DialogTitle>
            </div>
            <DialogDescription>
              {t("settingsGeneral.deleteWarningConfirm", "This action CANNOT BE UNDONE. To confirm, please retype the exact domain name below:")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-2.5 rounded-lg bg-muted text-xs font-mono text-center font-semibold select-all">
              {domain.name}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-domain-name" className="text-xs font-medium">
                {t("settingsGeneral.retypeDomainLabel", "Retype domain name:")}
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
              {t("common.cancel", "Cancel")}
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
              {t("settingsGeneral.deleteBtn", "Delete Domain")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
