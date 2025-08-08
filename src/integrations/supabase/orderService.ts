import { supabase } from './supabaseClient';

export interface OrderData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  payment_method: string;
  wompi_reference?: string;
}

export class OrderService {
  async createOrder(orderData: OrderData) {
    // Only include fields that exist in the orders table
    const orderPayload = {
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      customer_phone: orderData.customer_phone || null,
      customer_address: orderData.customer_address || null,
      product_id: orderData.product_id,
      quantity: orderData.quantity,
      total_amount: orderData.total_amount,
      payment_method: orderData.payment_method,
      wompi_reference: orderData.wompi_reference || null,
      status: 'pending',
      payment_status: 'pending'
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      throw error;
    }

    return data;
  }

  async updateOrderPayment(orderId: string, paymentData: {
    payment_status: string;
    wompi_transaction_id?: string;
    wompi_payment_link_id?: string;
  }) {
    const { data, error } = await supabase
      .from('orders')
      .update(paymentData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order payment:', error);
      throw error;
    }

    return data;
  }

  async createPaymentRecord(paymentData: {
    order_id: string;
    amount: number;
    payment_method: string;
    processor_reference?: string;
    processor_payment_link?: string;
  }) {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }

    return data;
  }

  async getOrderByReference(reference: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('wompi_reference', reference)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      throw error;
    }

    return data;
  }
}

export const orderService = new OrderService();
