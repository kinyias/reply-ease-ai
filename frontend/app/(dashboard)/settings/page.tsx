"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { GlobeIcon, Loader2Icon, PlusIcon } from "lucide-react";
import domainService from "@/services/domain-service";
import { Button } from "@/components/ui/button";
import { AddDomainModal } from "@/components/sidebar/add-domain-modal";
import { useI18n } from "@/context/i18n-context";

export default function SettingsIndexPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ["domains"],
    queryFn: () => domainService.getDomains(),
  });

  // Redirect to first domain if exists
  useEffect(() => {
    if (!isLoading && domains.length > 0) {
      router.replace(`/settings/${domains[0].name}`);
    }
  }, [isLoading, domains, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("settingsPage.loading", "Loading domain settings...")}</p>
      </div>
    );
  }

  // If no domains exist yet
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
        <GlobeIcon className="size-8 stroke-[1.5]" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        {t("settingsPage.noDomainsTitle", "No Websites / Domains Yet")}
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 mb-6">
        {t("settingsPage.noDomainsDesc", "You have not connected any domain to ReplyEase AI. Add your first domain to start creating autonomous AI ChatBots.")}
      </p>
      <Button
        onClick={() => setIsAddModalOpen(true)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-medium"
      >
        <PlusIcon className="size-4" />
        <span>{t("settingsPage.addFirst", "Add First Domain")}</span>
      </Button>

      <AddDomainModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={(name) => {
          router.push(`/settings/${name}`);
        }}
      />
    </div>
  );
}
