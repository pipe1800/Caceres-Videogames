import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface OrderData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  product_ids: string[];
  quantities: number[];
  total_amount: number;
  payment_method: 'cash' | 'card';
  payment_reference?: string;
  delivery_type: 'pickup' | 'delivery';
  delivery_point?: string;
  delivery_department?: string;
  delivery_municipality?: string;
  delivery_address?: string;
  delivery_reference_point?: string;
  delivery_map_location?: string;
  status?: string;
}

export interface PaymentData {
  order_id: string;
  payment_method: 'cash' | 'card';
  payment_reference?: string;
  wompi_payment_link_id?: string;
  amount_cents: number;
  currency: string;
  payment_data?: any;
}

export class OrderService {
  async createOrder(orderData: OrderData): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          customer_address: orderData.customer_address,
          // For now, we'll use the first product ID and total quantity
          // In a real app, you might want to create a separate order_items table
          product_id: orderData.product_ids[0], // This assumes single product orders
          quantity: orderData.quantities.reduce((a, b) => a + b, 0),
          total_amount: orderData.total_amount,
          payment_method: orderData.payment_method,
          payment_reference: orderData.payment_reference,
          delivery_type: orderData.delivery_type,
          delivery_point: orderData.delivery_point,
          delivery_department: orderData.delivery_department,
          delivery_municipality: orderData.delivery_municipality,
          delivery_address: orderData.delivery_address,
          delivery_reference_point: orderData.delivery_reference_point,
          delivery_map_location: orderData.delivery_map_location,
          status: orderData.status || 'pending',
        }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating order:', error);
      return { data: null, error };
    }
  }

  async createPayment(paymentData: PaymentData): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          order_id: paymentData.order_id,
          payment_method: paymentData.payment_method,
          payment_reference: paymentData.payment_reference,
          wompi_payment_link_id: paymentData.wompi_payment_link_id,
          amount_cents: paymentData.amount_cents,
          currency: paymentData.currency,
          payment_data: paymentData.payment_data,
        }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating payment:', error);
      return { data: null, error };
    }
  }

  async updateOrderPaymentStatus(
    orderId: string, 
    paymentStatus: string, 
    transactionId?: string
  ): Promise<{ data: any; error: any }> {
    try {
      const updateData: any = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      };

      if (transactionId) {
        updateData.payment_transaction_id = transactionId;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating order payment status:', error);
      return { data: null, error };
    }
  }

  async getOrderByReference(reference: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_reference', reference)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error getting order by reference:', error);
      return { data: null, error };
    }
  }
}

export const orderService = new OrderService();
