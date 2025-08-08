export interface WompiPaymentRequest {
  amount_in_cents: number;
  currency: string;
  reference: string;
  customer_email: string;
  customer_name: string;
  redirect_url: string;
  public_key?: string;
  single_use?: boolean;
  expiration_time?: number;
  shipping_address?: {
    address_line_1: string;
    address_line_2?: string;
    country: string;
    region: string;
    city: string;
    postal_code?: string;
    phone_number?: string;
  };
}

export interface WompiPaymentResponse {
  data: {
    id: string;
    payment_link_url: string;
    checkout_url: string;
    payment_link_id: string;
    reference: string;
    status: string;
    amount_in_cents: number;
    currency: string;
    customer_email: string;
    customer_name: string;
    created_at: string;
    expires_at: string;
  };
}

export interface WompiTransactionResponse {
  data: {
    id: string;
    reference: string;
    status: string;
    amount_in_cents: number;
    currency: string;
    customer_email: string;
    customer_name: string;
    payment_method: {
      type: string;
      extra: any;
    };
    created_at: string;
    finalized_at?: string;
    payment_link_id?: string;
  };
}

export interface PaymentData {
  amount: number;
  currency: string;
  reference: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress?: {
    address: string;
    city: string;
    region: string;
    country: string;
  };
}
