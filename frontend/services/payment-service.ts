import apiClient from "@/lib/api-client";
import {
  CreatePaymentPayload,
  PaymentResponse,
  PaymentStatusResponse,
  SepayMerchantConfig,
  TransactionListResponse,
  UpdateSepayMerchantPayload,
} from "@/types/payment";

export const paymentService = {
  /**
   * Create a new payment transaction (Subscription Upgrade or Product Checkout)
   * Generates VietQR code and signed SePay Payment Gateway fields
   */
  async createPayment(payload: CreatePaymentPayload): Promise<PaymentResponse> {
    const res = await apiClient.post<PaymentResponse>(
      "/payments/sepay/create-payment",
      payload
    );
    return res.data;
  },

  /**
   * Check transaction payment status (Used for realtime Polling every 2.5s)
   */
  async checkStatus(orderCode: string): Promise<PaymentStatusResponse> {
    const res = await apiClient.get<PaymentStatusResponse>(
      `/payments/check-status/${orderCode}`
    );
    return res.data;
  },

  /**
   * Get past transactions of current authenticated user
   */
  async getTransactions(limit = 20, offset = 0): Promise<TransactionListResponse> {
    const res = await apiClient.get<TransactionListResponse>(
      "/payments/transactions",
      { params: { limit, offset } }
    );
    return res.data;
  },

  /**
   * Get user custom SePay merchant configuration
   */
  async getSepayConfig(): Promise<SepayMerchantConfig> {
    const res = await apiClient.get<SepayMerchantConfig>(
      "/payments/sepay/config"
    );
    return res.data;
  },

  /**
   * Update user custom SePay merchant configuration
   */
  async updateSepayConfig(
    payload: UpdateSepayMerchantPayload
  ): Promise<SepayMerchantConfig> {
    const res = await apiClient.put<SepayMerchantConfig>(
      "/payments/sepay/config",
      payload
    );
    return res.data;
  },

  /**
   * Simulate instant payment confirmation (Demo / QA testing)
   */
  async simulatePayment(orderCode: string): Promise<{ success: boolean; status: string }> {
    const res = await apiClient.post<{ success: boolean; status: string }>(
      "/payments/sepay/simulate-payment",
      { order_code: orderCode }
    );
    return res.data;
  },

  /**
   * Launch SePay Payment Gateway Hosted Checkout (via standard POST form submission)
   */
  launchSepayGatewayCheckout(
    checkoutUrl: string,
    paymentFields: Record<string, any>,
    target = "_blank"
  ): void {
    if (typeof window === "undefined") return;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = checkoutUrl;
    form.target = target;

    Object.entries(paymentFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      }
    });

    document.body.appendChild(form);
    form.submit();
    setTimeout(() => {
      document.body.removeChild(form);
    }, 1000);
  },
};
