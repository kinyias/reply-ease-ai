"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import domainService from "@/services/domain-service";
import { CreateDomainInput } from "@/types/domain";

export function useDomainManagement() {
  const queryClient = useQueryClient();

  const {
    data: domains = [],
    isLoading: isLoadingDomains,
    refetch: refetchDomains,
  } = useQuery({
    queryKey: ["domains"],
    queryFn: () => domainService.getDomains(),
  });

  const {
    data: quota,
    isLoading: isLoadingQuota,
    refetch: refetchQuota,
  } = useQuery({
    queryKey: ["domains", "quota"],
    queryFn: () => domainService.getQuota(),
  });

  const createDomainMutation = useMutation({
    mutationFn: (payload: CreateDomainInput) => domainService.createDomain(payload),
    onSuccess: (newDomain) => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      queryClient.invalidateQueries({ queryKey: ["domains", "quota"] });
      toast.success("Tạo domain thành công!", {
        description: `Domain "${newDomain.name}" đã được khởi tạo cùng ChatBot mặc định.`,
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error("Không thể tạo domain", {
        description:
          err.response?.data?.detail || "Đã xảy ra lỗi vui lòng thử lại.",
      });
    },
  });

  return {
    domains,
    quota,
    isLoading: isLoadingDomains || isLoadingQuota,
    createDomain: createDomainMutation.mutateAsync,
    isCreating: createDomainMutation.isPending,
    refetch: () => {
      refetchDomains();
      refetchQuota();
    },
  };
}
