import apiClient from "@/lib/api-client";
import {
  AnswerInputItem,
  BookAppointmentInput,
  BookingResponse,
  CreateOrderInput,
  CustomerResponseItem,
  OrderResponse,
  OrderStatusResponse,
  PortalAppointmentData,
  PortalPaymentData,
} from "@/types/portal";

export const portalService = {
  /**
   * Fetch appointment booking data (questions, customer, booked slots)
   */
  async getAppointmentData(
    domainId: string,
    customerId: string
  ): Promise<PortalAppointmentData> {
    const res = await apiClient.get<PortalAppointmentData>(
      `/portal/${domainId}/appointment/${customerId}`
    );
    return res.data;
  },

  /**
   * Submit appointment booking
   */
  async bookAppointment(
    domainId: string,
    customerId: string,
    payload: BookAppointmentInput
  ): Promise<BookingResponse> {
    const res = await apiClient.post<BookingResponse>(
      `/portal/${domainId}/appointment/${customerId}`,
      payload
    );
    return res.data;
  },

  /**
   * Submit or update customer qualifier answers
   */
  async submitAnswers(
    customerId: string,
    answers: AnswerInputItem[]
  ): Promise<CustomerResponseItem[]> {
    const res = await apiClient.post<CustomerResponseItem[]>(
      `/portal/answers/${customerId}`,
      { answers }
    );
    return res.data;
  },

  /**
   * Fetch checkout portal data (products, prices, customer questions)
   */
  async getPaymentData(
    domainId: string,
    customerId: string
  ): Promise<PortalPaymentData> {
    const res = await apiClient.get<PortalPaymentData>(
      `/portal/${domainId}/payment/${customerId}`
    );
    return res.data;
  },

  /**
   * Create checkout order with VietQR or Stripe Elements
   */
  async createOrder(
    domainId: string,
    customerId: string,
    payload: CreateOrderInput
  ): Promise<OrderResponse> {
    const res = await apiClient.post<OrderResponse>(
      `/portal/${domainId}/payment/${customerId}/create-order`,
      payload
    );
    return res.data;
  },

  /**
   * Check order payment status (Polling)
   */
  async checkOrderStatus(orderCode: string): Promise<OrderStatusResponse> {
    const res = await apiClient.get<OrderStatusResponse>(
      `/portal/payment/status/${orderCode}`
    );
    return res.data;
  },

  /**
   * Simulate instant payment confirmation (Demo / QA)
   */
  async simulateConfirmPayment(
    orderCode: string
  ): Promise<{ success: boolean; status: string; order_code: string }> {
    const res = await apiClient.post<{
      success: boolean;
      status: string;
      order_code: string;
    }>("/portal/payment/simulate-confirm", { order_code: orderCode });
    return res.data;
  },
};
