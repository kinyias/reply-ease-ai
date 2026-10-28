"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/auth/use-user";
import { authKeys } from "@/hooks/auth/query-keys";
import { paymentService } from "@/services/payment-service";
import { PaymentPlan, PaymentResponse, PaymentStatus } from "@/types/payment";

export function useBilling() {
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  // Modal & Active checkout state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<PaymentResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");

  // Transactions query
  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["billing-transactions"],
    queryFn: () => paymentService.getTransactions(20, 0),
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (plan: PaymentPlan) =>
      paymentService.createPayment({
        payment_type: "SUBSCRIPTION",
        plan,
      }),
    onSuccess: (data) => {
      setActivePayment(data);
      setPaymentStatus("PENDING");
      setIsModalOpen(true);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "Không thể tạo giao dịch thanh toán.";
      toast.error(msg);
    },
  });

  // Simulate payment mutation
  const simulatePaymentMutation = useMutation({
    mutationFn: (orderCode: string) => paymentService.simulatePayment(orderCode),
    onSuccess: () => {
      setPaymentStatus("SUCCESS");
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      queryClient.invalidateQueries({ queryKey: ["billing-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      toast.success("Giả lập thanh toán thành công! Gói cước đã được kích hoạt.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Không thể giả lập thanh toán.");
    },
  });

  // Polling transaction status when modal is open and pending
  useEffect(() => {
    if (!isModalOpen || !activePayment?.order_code || paymentStatus === "SUCCESS") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await paymentService.checkStatus(activePayment.order_code);
        if (res.status === "SUCCESS") {
          setPaymentStatus("SUCCESS");
          queryClient.invalidateQueries({ queryKey: authKeys.me() });
          queryClient.invalidateQueries({ queryKey: ["billing-transactions"] });
          queryClient.invalidateQueries({ queryKey: ["domains"] });
          toast.success("Thanh toán thành công! Gói cước đã được cập nhật.");
          clearInterval(interval);
        } else if (res.status === "FAILED") {
          setPaymentStatus("FAILED");
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Polling payment error:", e);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isModalOpen, activePayment, paymentStatus, queryClient]);

  // Check URL query parameters upon redirect return from SePay Checkout
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const returnStatus = params.get("status");

    if (returnStatus) {
      if (returnStatus === "success") {
        queryClient.invalidateQueries({ queryKey: authKeys.me() });
        queryClient.invalidateQueries({ queryKey: ["billing-transactions"] });
        queryClient.invalidateQueries({ queryKey: ["domains"] });
        toast.success("Thanh toán thành công qua SePay Gateway! Gói cước đã được kích hoạt.");
      } else if (returnStatus === "cancel") {
        toast.info("Đơn hàng thanh toán SePay đã được hủy.");
      } else if (returnStatus === "error") {
        toast.error("Thanh toán SePay không thành công hoặc xảy ra lỗi.");
      }

      // Clean up URL query parameters without reloading
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [queryClient]);

  // Cancel payment mutation (CANCLEORDER.md)
  const cancelPaymentMutation = useMutation({
    mutationFn: (orderCode: string) => paymentService.cancelOrder(orderCode),
    onSuccess: (data) => {
      setPaymentStatus("FAILED");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["billing-transactions"] });
      toast.info(data.message || "Đã hủy đơn hàng thành công.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "Không thể hủy đơn hàng.";
      toast.error(msg);
      setIsModalOpen(false);
    },
  });

  const handleUpgrade = (plan: PaymentPlan) => {
    if (plan === "STANDARD") return;
    createPaymentMutation.mutate(plan);
  };

  const handleSimulatePayment = () => {
    if (!activePayment?.order_code) return;
    simulatePaymentMutation.mutate(activePayment.order_code);
  };

  const handleCancelPayment = () => {
    if (!activePayment?.order_code) {
      setIsModalOpen(false);
      return;
    }
    cancelPaymentMutation.mutate(activePayment.order_code);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return {
    user,
    isUserLoading,
    currentPlan: (user?.subscription?.plan as PaymentPlan) || "STANDARD",
    currentCredits: user?.subscription?.credits || 0,
    transactions: transactionsData?.transactions || [],
    totalTransactions: transactionsData?.total || 0,
    isTransactionsLoading,
    refetchTransactions,
    isModalOpen,
    activePayment,
    paymentStatus,
    isCreatingPayment: createPaymentMutation.isPending,
    isSimulatingPayment: simulatePaymentMutation.isPending,
    isCancellingPayment: cancelPaymentMutation.isPending,
    upgradeToPlan: handleUpgrade,
    simulatePayment: handleSimulatePayment,
    cancelPayment: handleCancelPayment,
    closeModal: handleCloseModal,
  };
}
