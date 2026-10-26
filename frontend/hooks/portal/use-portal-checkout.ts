"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { portalService } from "@/services/portal-service";
import {
  AnswerInputItem,
  OrderResponse,
  PortalPaymentData,
  PortalProductItem,
} from "@/types/portal";

export type CheckoutStep = "qualify" | "payment" | "success";
export type PaymentMethod = "vietqr" | "stripe";

export function usePortalCheckout(domainId: string, customerId: string) {
  const [data, setData] = useState<PortalPaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("payment");

  // State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vietqr");
  const [activeOrder, setActiveOrder] = useState<OrderResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [email, setEmail] = useState<string>("");

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load payment portal data
  useEffect(() => {
    let isMounted = true;
    async function loadPaymentData() {
      setIsLoading(true);
      try {
        const payData = await portalService.getPaymentData(domainId, customerId);
        if (!isMounted) return;

        setData(payData);
        if (payData.email) {
          setEmail(payData.email);
        }

        // Default: select all products in the domain
        setSelectedProductIds(payData.products.map((p) => p.id));

        // Initialize question answers
        const initialAnswers: Record<string, string> = {};
        let hasUnanswered = false;
        payData.questions.forEach((q) => {
          if (q.answered) {
            initialAnswers[q.id] = q.answered;
          } else {
            initialAnswers[q.id] = "";
            hasUnanswered = true;
          }
        });
        setAnswers(initialAnswers);

        // If unanswered questions exist, start with qualify step
        if (payData.questions.length > 0 && hasUnanswered) {
          setCurrentStep("qualify");
        } else {
          setCurrentStep("payment");
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } }; message?: string };
        toast.error(
          error.response?.data?.detail || "Không thể tải dữ liệu thanh toán."
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (domainId && customerId) {
      loadPaymentData();
    }

    return () => {
      isMounted = false;
    };
  }, [domainId, customerId]);

  // Calculate order total
  const calculatedTotal = useMemo(() => {
    if (!data?.products) return 0;
    return data.products
      .filter((p) => selectedProductIds.includes(p.id))
      .reduce((sum, p) => sum + p.price, 0);
  }, [data?.products, selectedProductIds]);

  // Toggle product selection
  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        if (prev.length === 1) {
          toast.info("Đơn hàng cần có ít nhất 1 sản phẩm.");
          return prev;
        }
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Select all or deselect all
  const selectAllProducts = () => {
    if (!data?.products) return;
    setSelectedProductIds(data.products.map((p) => p.id));
  };

  // Update question answer
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Submit qualification questions
  const handleSaveAnswers = async () => {
    const formattedAnswers: AnswerInputItem[] = Object.entries(answers).map(
      ([id, val]) => ({
        id,
        answered: val.trim(),
      })
    );

    setIsSubmitting(true);
    try {
      if (formattedAnswers.length > 0) {
        await portalService.submitAnswers(customerId, formattedAnswers);
        toast.success("Thông tin khảo sát đã được lưu.");
      }
      setCurrentStep("payment");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(
        error.response?.data?.detail || "Lỗi cập nhật thông tin khảo sát."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Order / Generate VietQR Code
  const handleCreateOrder = async (method: PaymentMethod = paymentMethod) => {
    if (selectedProductIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán.");
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await portalService.createOrder(domainId, customerId, {
        product_ids: selectedProductIds,
        email: email ? email.trim().toLowerCase() : undefined,
        payment_method: method,
      });

      setActiveOrder(order);
      setPaymentMethod(method);

      if (method === "vietqr") {
        startPolling(order.order_code);
      }
      return order;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(
        error.response?.data?.detail || "Không thể khởi tạo mã đơn hàng thanh toán."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start polling order status
  const startPolling = (orderCode: string) => {
    stopPolling();
    setIsPolling(true);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusData = await portalService.checkOrderStatus(orderCode);
        if (statusData.status === "SUCCESS") {
          stopPolling();
          setCurrentStep("success");
          toast.success("Giao dịch thanh toán thành công! Cảm ơn bạn.");
        } else if (statusData.status === "FAILED") {
          stopPolling();
          toast.error("Giao dịch bị từ chối hoặc thất bại.");
        }
      } catch {
        // Continue polling silently
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Demo simulate instant payment
  const handleSimulatePayment = async () => {
    if (!activeOrder) return;
    setIsSubmitting(true);
    try {
      await portalService.simulateConfirmPayment(activeOrder.order_code);
      stopPolling();
      setCurrentStep("success");
      toast.success("Thanh toán giả lập thành công!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(
        error.response?.data?.detail || "Không thể thực hiện giả lập thanh toán."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stripe card payment submission simulation
  const handleStripePaymentSuccess = () => {
    stopPolling();
    setCurrentStep("success");
    toast.success("Thanh toán thẻ quốc tế thành công!");
  };

  return {
    data,
    isLoading,
    isSubmitting,
    currentStep,
    setCurrentStep,
    answers,
    handleAnswerChange,
    handleSaveAnswers,
    selectedProductIds,
    toggleProduct,
    selectAllProducts,
    calculatedTotal,
    paymentMethod,
    setPaymentMethod,
    activeOrder,
    handleCreateOrder,
    isPolling,
    handleSimulatePayment,
    handleStripePaymentSuccess,
    email,
    setEmail,
  };
}
