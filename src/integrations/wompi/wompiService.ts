import { WOMPI_CONFIG } from './config';
import type { PaymentData, WompiPaymentRequest, WompiPaymentResponse, WompiTransactionResponse } from './types';

export class WompiService {
  private getAuthHeaders() {
    return {
      'Authorization': `Bearer ${WOMPI_CONFIG.apiSecret}`,
      'Content-Type': 'application/json',
    };
  }

  async createPaymentLink(paymentData: PaymentData): Promise<WompiPaymentResponse> {
    const requestData: WompiPaymentRequest = {
      amount_in_cents: Math.round(paymentData.amount * 100), // Convert to cents
      currency: paymentData.currency || 'USD',
      reference: paymentData.reference,
      customer_email: paymentData.customerEmail,
      customer_name: paymentData.customerName,
      redirect_url: `${window.location.origin}/payment/success`,
      public_key: WOMPI_CONFIG.appId,
      single_use: true,
      expiration_time: 3600, // 1 hour expiration
    };

    // Add shipping address if provided
    if (paymentData.shippingAddress) {
      requestData.shipping_address = {
        address_line_1: paymentData.shippingAddress.address,
        country: paymentData.shippingAddress.country || 'SV',
        region: paymentData.shippingAddress.region,
        city: paymentData.shippingAddress.city,
        phone_number: paymentData.customerPhone,
      };
    }

    try {
      const response = await fetch(`${WOMPI_CONFIG.apiUrl}/payment_links`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create payment link: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating WOMPI payment link:', error);
      throw error;
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<WompiTransactionResponse> {
    try {
      const response = await fetch(`${WOMPI_CONFIG.apiUrl}/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${WOMPI_CONFIG.appId}`, // Use app ID for reading transactions
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to check payment status: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking WOMPI payment status:', error);
      throw error;
    }
  }

  async getPaymentByReference(reference: string): Promise<WompiTransactionResponse | null> {
    try {
      const response = await fetch(`${WOMPI_CONFIG.apiUrl}/transactions?reference=${reference}`, {
        headers: {
          'Authorization': `Bearer ${WOMPI_CONFIG.appId}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to get payment by reference: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return result.data && result.data.length > 0 ? { data: result.data[0] } : null;
    } catch (error) {
      console.error('Error getting WOMPI payment by reference:', error);
      throw error;
    }
  }
}

export const wompiService = new WompiService();
