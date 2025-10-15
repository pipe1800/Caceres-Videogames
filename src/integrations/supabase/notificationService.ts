import { supabase } from './supabaseClient';

export type OrderNotificationItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  orderId?: string;
  console?: string;
};

export type OrderNotificationCustomer = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  deliveryType?: 'pickup' | 'delivery';
  deliveryPointName?: string;
  deliveryDepartment?: string;
  deliveryMunicipality?: string;
  pickupDetails?: string;
};

export type OrderNotificationSummary = {
  orderId?: string;
  orderReference?: string;
  paymentMethod: string;
  paymentStatus?: string;
  totalAmount: number;
  currency?: string;
  placedAt?: string;
  subtotal?: number;
  shippingAmount?: number;
};

export type OrderNotificationRequest = {
  summary: OrderNotificationSummary;
  customer: OrderNotificationCustomer;
  items: OrderNotificationItem[];
  notes?: string;
};

class NotificationService {
  async sendOrderNotification(payload: OrderNotificationRequest) {
    const response = await supabase.functions.invoke('notify-order', {
      body: payload,
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to send order notification');
    }

    return response.data;
  }
}

export const notificationService = new NotificationService();
