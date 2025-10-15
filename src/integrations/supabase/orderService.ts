import { supabase } from './client';

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
  cart_items?: Array<{
    id: string;
    quantity: number;
    price: number;
  }>;
}

export class OrderService {
  async createOrder(orderData: OrderData) {
    // Check stock availability first
    if (orderData.cart_items && orderData.cart_items.length > 0) {
      for (const item of orderData.cart_items) {
        const { data: product, error } = await supabase
          .from('products')
          .select('stock_count, in_stock')
          .eq('id', item.id)
          .single();
        
        if (error || !product) {
          throw new Error(`Product not found: ${item.id}`);
        }
        
        if (!product.in_stock || product.stock_count < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.id}. Available: ${product.stock_count}, Requested: ${item.quantity}`);
        }
      }
      
      // Create orders for each cart item
      const orders = [];
      for (const item of orderData.cart_items) {
        const orderPayload = {
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone || null,
          customer_address: orderData.customer_address || null,
          product_id: item.id,
          quantity: item.quantity,
          total_amount: item.price * item.quantity,
          payment_method: orderData.payment_method,
          wompi_reference: orderData.wompi_reference || null,
          status: 'pendiente', // match DB constraint
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
        
        orders.push(data);
      }
      
      return orders[0]; // Return first order for backward compatibility
    } else {
      // Fallback to single product order (existing code)
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_count, in_stock')
        .eq('id', orderData.product_id)
        .single();
      
      if (productError || !product) {
        throw new Error('Product not found');
      }
      
      if (!product.in_stock || product.stock_count < orderData.quantity) {
        throw new Error(`Insufficient stock. Available: ${product.stock_count}, Requested: ${orderData.quantity}`);
      }
      
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
        status: 'pendiente', // match DB constraint
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
  }

  async updateOrderPayment(orderId: string, paymentData: {
    payment_status?: string;
    wompi_transaction_id?: string;
    wompi_payment_link_id?: string;
    status?: string; // Add support for order status
  }) {
    const { data, error } = await supabase
      .from('orders')
      .update({
        ...paymentData,
        updated_at: new Date().toISOString()
      })
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

  async listOrdersByReference(reference: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('wompi_reference', reference);

    if (error) {
      console.error('Error listing orders:', error);
      throw error;
    }

    return data ?? [];
  }
}

export const orderService = new OrderService();
