export interface CustomerResponseItem {
  id: string;
  question: string;
  answered: string | null;
}

export interface BookedSlotItem {
  id: string;
  date: string;
  slot: string;
  email: string;
}

export interface PortalAppointmentData {
  domain_id: string;
  domain_name: string;
  domain_icon: string | null;
  customer_id: string;
  email: string | null;
  questions: CustomerResponseItem[];
  booked_slots: BookedSlotItem[];
}

export interface AnswerInputItem {
  id: string;
  question?: string;
  answered: string;
}

export interface BookAppointmentInput {
  date: string; // ISO string
  slot: string;
  email: string;
  answers?: AnswerInputItem[];
}

export interface BookingResponse {
  id: string;
  date: string;
  slot: string;
  email: string;
  customer_id?: string;
  domain_id?: string;
  domain_name?: string;
  message: string;
}

export interface PortalProductItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface PortalPaymentData {
  domain_id: string;
  domain_name: string;
  domain_icon: string | null;
  customer_id: string;
  email: string | null;
  products: PortalProductItem[];
  total_amount: number;
  questions: CustomerResponseItem[];
  sepay_configured: boolean;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
}

export interface CreateOrderInput {
  product_ids?: string[];
  email?: string;
  payment_method: "vietqr" | "stripe";
}

export interface OrderResponse {
  order_code: string;
  amount: number;
  payment_method: string;
  qr_url?: string;
  bank?: string;
  account_number?: string;
  account_name?: string;
  content?: string;
  client_secret?: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  created_at: string;
}

export interface OrderStatusResponse {
  order_code: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  amount: number;
  payment_type: string;
  created_at: string;
}
