export interface PaymentData {
  amount: number;
  currency: string;
  reference: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  redirectUrl: string;
}

export interface PaymentLinkResponse {
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

export interface PaymentStatusResponse {
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
