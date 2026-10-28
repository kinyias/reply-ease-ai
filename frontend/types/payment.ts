export type PaymentPlan = "STANDARD" | "PRO" | "ULTIMATE";

export type PaymentType = "SUBSCRIPTION" | "PRODUCT_CHECKOUT" | "CREDIT_PURCHASE";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface CreditPackageItem {
  id: string;
  name: string;
  credits: number;
  bonus_credits: number;
  total_credits: number;
  price: number;
  bonus_percentage: number;
  popular: boolean;
  best_value: boolean;
  description?: string;
}

export interface CreditPackagesResponse {
  packages: CreditPackageItem[];
}

export interface CreatePaymentPayload {
  payment_type: PaymentType;
  plan?: PaymentPlan;
  package_id?: string;
  amount?: number;
  domain_id?: string;
  product_ids?: string[];
  description?: string;
}

export interface PaymentResponse {
  order_code: string;
  amount: number;
  payment_type: PaymentType;
  qr_url: string;
  bank_name: string;
  bank_account: string;
  account_name: string;
  content: string;
  checkout_url: string;
  direct_checkout_url?: string;
  payment_fields: Record<string, any>;
  plan?: PaymentPlan;
  credits_added?: number;
  created_at: string;
}

export interface CancelOrderResponse {
  success: boolean;
  message: string;
  order_invoice_number: string;
  status?: string;
}

export interface PaymentStatusResponse {
  order_code: string;
  status: PaymentStatus;
  amount: number;
  payment_type: PaymentType;
  sepay_transaction_id?: string;
  content?: string;
  plan?: PaymentPlan;
  credits_added?: number;
  created_at: string;
  updated_at?: string;
}

export interface PaymentTransactionItem {
  id: string;
  order_code: string;
  amount: number;
  payment_type: PaymentType;
  status: PaymentStatus;
  content: string;
  sepay_transaction_id?: string;
  created_at: string;
}

export interface TransactionListResponse {
  transactions: PaymentTransactionItem[];
  total: number;
}

export interface SepayMerchantConfig {
  is_configured: boolean;
  sepay_merchant_id?: string;
  sepay_secret_key_masked?: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  webhook_url: string;
}

export interface UpdateSepayMerchantPayload {
  sepay_merchant_id: string;
  sepay_secret_key: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
}
