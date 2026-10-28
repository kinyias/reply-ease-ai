import apiClient from "@/lib/api-client";
import {
  CancelOrderResponse,
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
   * Cancel an unpaid or pending order via SePay Payment Gateway API (CANCLEORDER.md)
   */
  async cancelOrder(orderInvoiceNumber: string): Promise<CancelOrderResponse> {
    const res = await apiClient.post<CancelOrderResponse>(
      "/payments/sepay/cancel-order",
      { order_invoice_number: orderInvoiceNumber }
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
   * Launch SePay Payment Gateway Hosted Checkout (PAYMENT.md)
   * If directCheckoutUrl is available, navigates directly to SePay checkout page.
   * Otherwise builds an HTML form with strict field order:
   * order_amount -> merchant -> currency -> operation -> order_description ->
   * order_invoice_number -> customer_id -> payment_method -> success_url ->
   * error_url -> cancel_url -> signature.
   */
  launchSepayGatewayCheckout(
    checkoutUrl: string,
    paymentFields: Record<string, any>,
    directCheckoutUrl?: string,
    target = "_blank"
  ): void {
    if (typeof window === "undefined") return;

    // If direct checkout link was pre-resolved from SePay init (302 Location), open directly!
    if (directCheckoutUrl && directCheckoutUrl.startsWith("http")) {
      window.open(directCheckoutUrl, target);
      return;
    }

    // Otherwise create HTML form strictly respecting PAYMENT.md input ordering:
    const FORM_INPUT_ORDER = [
      "order_amount",
      "merchant",
      "currency",
      "operation",
      "order_description",
      "order_invoice_number",
      "customer_id",
      "payment_method",
      "success_url",
      "error_url",
      "cancel_url",
      "signature",
    ];

    const form = document.createElement("form");
    form.method = "POST";
    form.action = checkoutUrl;
    form.target = target;

    // Append fields in exact order
    FORM_INPUT_ORDER.forEach((key) => {
      const value = paymentFields[key];
      if (value !== undefined && value !== null && String(value) !== "") {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      }
    });

    // Also append any remaining fields if present
    Object.entries(paymentFields).forEach(([key, value]) => {
      if (!FORM_INPUT_ORDER.includes(key) && value !== undefined && value !== null) {
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
      if (document.body.contains(form)) {
        document.body.removeChild(form);
      }
    }, 1000);
  },
};
