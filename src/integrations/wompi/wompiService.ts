import { WOMPI_CONFIG } from './config';
import type { PaymentData, PaymentLinkResponse, PaymentStatusResponse } from './types';

export class WompiService {
  private getAuthHeaders() {
    // WOMPI uses Bearer token authentication with the API secret
    return {
      'Authorization': `Bearer ${WOMPI_CONFIG.apiSecret}`,
      'Content-Type': 'application/json',
    };
  }

  async createPaymentLink(paymentData: PaymentData): Promise<PaymentLinkResponse> {
    try {
      const response = await fetch(`${WOMPI_CONFIG.apiUrl}/payment_links`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          amount_in_cents: Math.round(paymentData.amount * 100), // Convert to cents
          currency: paymentData.currency,
          reference: paymentData.reference,
          customer_email: paymentData.customerEmail,
          name: `Pago de ${paymentData.customerName}`,
          redirect_url: paymentData.redirectUrl,
          single_use: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WOMPI API Error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to create payment link');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating WOMPI payment link:', error);
      throw error;
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${WOMPI_CONFIG.apiUrl}/transactions/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${WOMPI_CONFIG.appId}`, // Use app ID for status checks
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }

  async getPaymentByReference(reference: string): Promise<PaymentStatusResponse | null> {
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
