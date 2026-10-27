"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/auth/use-user";
import { authKeys } from "@/hooks/auth/query-keys";
import { marketingService } from "@/services/marketing-service";
import {
  Campaign,
  CreateCampaignPayload,
  CustomerLead,
} from "@/types/marketing";

export function useMarketing() {
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  // Active campaign selection
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  // Filters for Leads table
  const [selectedDomainId, setSelectedDomainId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selected lead emails for assigning or sending
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Lead modal inspection
  const [inspectingLead, setInspectingLead] = useState<CustomerLead | null>(null);

  // User's available credits from subscription
  const currentCredits = user?.subscription?.credits ?? 0;

  // 1. Fetch campaigns
  const {
    data: campaignsData,
    isLoading: isCampaignsLoading,
    refetch: refetchCampaigns,
  } = useQuery({
    queryKey: ["marketing-campaigns"],
    queryFn: () => marketingService.getCampaigns(),
  });

  const campaigns = useMemo(() => campaignsData?.campaigns || [], [campaignsData]);

  // Set default active campaign if none selected
  useEffect(() => {
    if (campaigns.length > 0 && !activeCampaignId) {
      setActiveCampaignId(campaigns[0].id);
    }
  }, [campaigns, activeCampaignId]);

  const activeCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === activeCampaignId) || null;
  }, [campaigns, activeCampaignId]);

  // Sync selected emails when active campaign changes if user chooses to load campaign's recipients
  const loadCampaignRecipients = (campaign: Campaign) => {
    setSelectedEmails(campaign.customers || []);
    toast.info(`Đã nạp ${campaign.customers.length} email từ chiến dịch "${campaign.name}"`);
  };

  // 2. Fetch Customer Leads
  const {
    data: leadsData,
    isLoading: isLeadsLoading,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["marketing-leads", selectedDomainId, searchQuery],
    queryFn: () =>
      marketingService.getCustomerLeads({
        domain_id: selectedDomainId === "all" ? undefined : selectedDomainId,
        search: searchQuery || undefined,
        only_with_email: true,
      }),
  });

  const leads = useMemo(() => leadsData?.customers || [], [leadsData]);

  // Checkbox helpers
  const toggleSelectEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const toggleSelectAll = (allEmails: string[]) => {
    const validEmails = allEmails.filter(Boolean);
    const areAllSelected = validEmails.every((e) => selectedEmails.includes(e));

    if (areAllSelected) {
      // Unselect all current table emails
      setSelectedEmails((prev) => prev.filter((e) => !validEmails.includes(e)));
    } else {
      // Add all missing table emails
      setSelectedEmails((prev) => Array.from(new Set([...prev, ...validEmails])));
    }
  };

  const clearSelection = () => {
    setSelectedEmails([]);
  };

  // 3. Mutations
  const createCampaignMutation = useMutation({
    mutationFn: (payload: CreateCampaignPayload) => marketingService.createCampaign(payload),
    onSuccess: (newCampaign) => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      setActiveCampaignId(newCampaign.id);
      toast.success(`Đã tạo chiến dịch "${newCampaign.name}" thành công!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Không thể tạo chiến dịch.");
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ campaignId, template }: { campaignId: string; template: string }) =>
      marketingService.updateTemplate(campaignId, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      toast.success("Đã lưu mẫu email template thành công!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Không thể lưu template.");
    },
  });

  const assignCustomersMutation = useMutation({
    mutationFn: ({ campaignId, customers }: { campaignId: string; customers: string[] }) =>
      marketingService.assignCustomers(campaignId, customers),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      toast.success(`Đã gán ${vars.customers.length} khách hàng vào chiến dịch.`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Không thể gán khách hàng.");
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => marketingService.deleteCampaign(campaignId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      if (activeCampaignId === deletedId) {
        const remaining = campaigns.filter((c) => c.id !== deletedId);
        setActiveCampaignId(remaining[0]?.id || null);
      }
      toast.success("Đã xóa chiến dịch thành công.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Không thể xóa chiến dịch.");
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: ({ campaignId, emails }: { campaignId: string; emails?: string[] }) =>
      marketingService.sendCampaign(campaignId, emails),
    onSuccess: (data) => {
      // Invalidate campaigns & user profile to refresh credits
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      toast.success(data.message || "Chiến dịch đã được lên lịch gửi thành công!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Gửi chiến dịch thất bại.");
    },
  });

  return {
    user,
    isUserLoading,
    currentCredits,

    // Campaigns
    campaigns,
    isCampaignsLoading,
    activeCampaign,
    activeCampaignId,
    setActiveCampaignId,
    refetchCampaigns,
    loadCampaignRecipients,

    // Leads & Filters
    leads,
    isLeadsLoading,
    selectedDomainId,
    setSelectedDomainId,
    searchQuery,
    setSearchQuery,
    refetchLeads,

    // Selection
    selectedEmails,
    toggleSelectEmail,
    toggleSelectAll,
    clearSelection,
    setSelectedEmails,

    // Lead Modal Inspection
    inspectingLead,
    setInspectingLead,

    // Actions
    createCampaign: createCampaignMutation.mutateAsync,
    isCreatingCampaign: createCampaignMutation.isPending,

    updateTemplate: updateTemplateMutation.mutateAsync,
    isUpdatingTemplate: updateTemplateMutation.isPending,

    assignCustomers: assignCustomersMutation.mutateAsync,
    isAssigningCustomers: assignCustomersMutation.isPending,

    deleteCampaign: deleteCampaignMutation.mutateAsync,
    isDeletingCampaign: deleteCampaignMutation.isPending,

    sendCampaign: sendCampaignMutation.mutateAsync,
    isSendingCampaign: sendCampaignMutation.isPending,
  };
}
