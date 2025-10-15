import { WOMPI_CONFIG } from './config';
import type { PaymentData, PaymentLinkResponse, PaymentStatusResponse } from './types';
import { supabase } from '../supabase/client';

export class WompiService {
  async createPaymentLink(paymentData: PaymentData): Promise<PaymentLinkResponse> {
    try {
      console.log('Creating payment link with data:', paymentData);
      
      // Use Supabase Edge Function instead of direct API call
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: {
          amount: paymentData.amount,
          currency: paymentData.currency,
          reference: paymentData.reference,
          customerEmail: paymentData.customerEmail,
          customerName: paymentData.customerName,
          redirectUrl: paymentData.redirectUrl,
        },
      });

      if (error) {
        console.error('Edge Function Error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Failed to create payment link');
      }

      if (!data) {
        throw new Error('No data returned from Edge Function');
      }

      console.log('Payment link created successfully:', data);
      
      // Transform WOMPI response to match expected interface
      const normalizedResponse = {
        data: {
          id: data.idEnlace.toString(),
          payment_link_url: data.urlEnlace,
          checkout_url: data.urlEnlaceLargo || data.urlEnlace,
          payment_link_id: data.idEnlace.toString(),
          reference: paymentData.reference,
          status: 'pending',
          amount_in_cents: paymentData.amount * 100,
          currency: paymentData.currency,
          customer_email: paymentData.customerEmail,
          customer_name: paymentData.customerName,
          created_at: new Date().toISOString(),
          expires_at: '', // WOMPI doesn't provide expiration in basic response
        }
      };
      
      return normalizedResponse;
    } catch (error) {
      console.error('Error creating WOMPI payment link:', error);
      throw error;
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    try {
      // Use Supabase Edge Function instead of direct API call
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { transactionId },
      });

      if (error) {
        throw new Error(error.message || 'Failed to check payment status');
      }

      return data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }

  async getPaymentByReference(reference: string): Promise<PaymentStatusResponse | null> {
    try {
      // For now, we'll use the checkPaymentStatus method
      // In a real implementation, you might want to create a separate Edge Function
      // or modify the existing one to support reference-based queries
      console.warn('getPaymentByReference not implemented with Edge Functions yet');
      return null;
    } catch (error) {
      console.error('Error getting WOMPI payment by reference:', error);
      throw error;
    }
  }
}

export const wompiService = new WompiService();
