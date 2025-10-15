// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  orderId?: string;
  console?: string;
};

type CustomerInfo = {
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

type OrderSummary = {
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

type NotificationPayload = {
  summary: OrderSummary;
  customer: CustomerInfo;
  items: OrderItem[];
  notes?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const requiredEnv = [
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'ADMIN_NOTIFICATION_EMAIL',
] as const;

type RequiredEnv = (typeof requiredEnv)[number];

const getEnv = (key: RequiredEnv) => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const buildItemsHtml = (items: OrderItem[]) => {
  if (!items.length) {
    return '<p>No se recibieron productos en el pedido.</p>';
  }

  const rows = items.map((item) => {
    const subtotal = item.price * item.quantity;
    return `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.id || ''}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.orderId || ''}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.console || ''}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${subtotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 8px 12px; text-align: left;">Producto</th>
          <th style="padding: 8px 12px; text-align: left;">SKU</th>
          <th style="padding: 8px 12px; text-align: left;">ID Pedido</th>
          <th style="padding: 8px 12px; text-align: left;">Consola</th>
          <th style="padding: 8px 12px; text-align: center;">Cantidad</th>
          <th style="padding: 8px 12px; text-align: right;">Precio</th>
          <th style="padding: 8px 12px; text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

const buildCustomerHtml = (customer: CustomerInfo) => {
  const lines: string[] = [];
  lines.push(`<strong>Nombre:</strong> ${customer.name}`);
  lines.push(`<strong>Email:</strong> ${customer.email}`);
  if (customer.phone) lines.push(`<strong>Teléfono:</strong> ${customer.phone}`);
  if (customer.address) lines.push(`<strong>Dirección:</strong> ${customer.address}`);
  if (customer.deliveryType) lines.push(`<strong>Tipo de entrega:</strong> ${customer.deliveryType === 'delivery' ? 'Envío a domicilio' : 'Punto de entrega'}`);
  if (customer.deliveryPointName) lines.push(`<strong>Punto de entrega:</strong> ${customer.deliveryPointName}`);
  if (customer.deliveryDepartment) lines.push(`<strong>Departamento:</strong> ${customer.deliveryDepartment}`);
  if (customer.deliveryMunicipality) lines.push(`<strong>Municipio:</strong> ${customer.deliveryMunicipality}`);
  if (customer.pickupDetails) lines.push(`<strong>Detalles de recogida:</strong> ${customer.pickupDetails}`);

  return `<p style="line-height: 1.6; margin: 0;">${lines.join('<br />')}</p>`;
};

const buildSummaryHtml = (summary: OrderSummary) => {
  const lines: string[] = [];
  if (summary.orderId) lines.push(`<strong>ID de pedido:</strong> ${summary.orderId}`);
  if (summary.orderReference) lines.push(`<strong>Referencia:</strong> ${summary.orderReference}`);
  if (summary.paymentMethod) lines.push(`<strong>Método de pago:</strong> ${summary.paymentMethod}`);
  if (summary.paymentStatus) lines.push(`<strong>Estado del pago:</strong> ${summary.paymentStatus}`);
  const currency = summary.currency || 'USD';
  if (typeof summary.subtotal === 'number') {
    lines.push(`<strong>Subtotal:</strong> ${currency} $${summary.subtotal.toFixed(2)}`);
  }
  if (typeof summary.shippingAmount === 'number') {
    lines.push(`<strong>Envío:</strong> ${currency} $${summary.shippingAmount.toFixed(2)}`);
  }
  lines.push(`<strong>Total:</strong> ${currency} $${summary.totalAmount.toFixed(2)}`);
  if (summary.placedAt) lines.push(`<strong>Fecha:</strong> ${summary.placedAt}`);

  return `<p style="line-height: 1.6; margin: 0;">${lines.join('<br />')}</p>`;
};

const buildEmailHtml = (payload: NotificationPayload) => {
  const customerSection = buildCustomerHtml(payload.customer);
  const summarySection = buildSummaryHtml(payload.summary);
  const itemsSection = buildItemsHtml(payload.items);
  const notesSection = payload.notes
    ? `<p style="margin-top: 16px;"><strong>Notas:</strong><br />${payload.notes.replace(/\n/g, '<br />')}</p>`
    : '';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #111827; background: #f9fafb; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 20px 25px -15px rgba(15, 23, 42, 0.25); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 24px; color: white;">
          <h1 style="margin: 0; font-size: 20px;">Nuevo pedido recibido</h1>
          <p style="margin: 8px 0 0; opacity: 0.85;">Revisa los detalles a continuación.</p>
        </div>
        <div style="padding: 24px;">
          <h2 style="margin-top: 0; font-size: 18px;">Cliente</h2>
          ${customerSection}

          <h2 style="margin-top: 24px; font-size: 18px;">Resumen del pedido</h2>
          ${summarySection}

          <h2 style="margin-top: 24px; font-size: 18px;">Productos</h2>
          ${itemsSection}

          ${notesSection}
        </div>
      </div>
    </div>
  `;
};

const buildEmailText = (payload: NotificationPayload) => {
  const lines: string[] = [];
  lines.push('Nuevo pedido recibido.');
  lines.push('');
  lines.push('Cliente:');
  lines.push(`  Nombre: ${payload.customer.name}`);
  lines.push(`  Email: ${payload.customer.email}`);
  if (payload.customer.phone) lines.push(`  Teléfono: ${payload.customer.phone}`);
  if (payload.customer.address) lines.push(`  Dirección: ${payload.customer.address}`);
  if (payload.customer.deliveryType) lines.push(`  Tipo de entrega: ${payload.customer.deliveryType}`);
  if (payload.customer.deliveryPointName) lines.push(`  Punto de entrega: ${payload.customer.deliveryPointName}`);
  if (payload.customer.deliveryDepartment) lines.push(`  Departamento: ${payload.customer.deliveryDepartment}`);
  if (payload.customer.deliveryMunicipality) lines.push(`  Municipio: ${payload.customer.deliveryMunicipality}`);
  if (payload.customer.pickupDetails) lines.push(`  Detalles de recogida: ${payload.customer.pickupDetails}`);

  lines.push('');
  lines.push('Resumen del pedido:');
  if (payload.summary.orderId) lines.push(`  ID del pedido: ${payload.summary.orderId}`);
  if (payload.summary.orderReference) lines.push(`  Referencia: ${payload.summary.orderReference}`);
  lines.push(`  Método de pago: ${payload.summary.paymentMethod}`);
  if (payload.summary.paymentStatus) lines.push(`  Estado de pago: ${payload.summary.paymentStatus}`);
  if (typeof payload.summary.subtotal === 'number') {
    lines.push(`  Subtotal: ${payload.summary.currency || 'USD'} $${payload.summary.subtotal.toFixed(2)}`);
  }
  if (typeof payload.summary.shippingAmount === 'number') {
    lines.push(`  Envío: ${payload.summary.currency || 'USD'} $${payload.summary.shippingAmount.toFixed(2)}`);
  }
  lines.push(`  Total: ${payload.summary.currency || 'USD'} $${payload.summary.totalAmount.toFixed(2)}`);
  if (payload.summary.placedAt) lines.push(`  Fecha: ${payload.summary.placedAt}`);

  lines.push('');
  lines.push('Productos:');
  if (!payload.items.length) {
    lines.push('  (sin productos)');
  } else {
    payload.items.forEach((item) => {
      const parts = [
        `${item.name} x${item.quantity} ($${item.price.toFixed(2)} c/u)`,
      ];
      if (item.id) parts.push(`SKU: ${item.id}`);
      if (item.orderId) parts.push(`Orden: ${item.orderId}`);
      if (item.console) parts.push(`Consola: ${item.console}`);
      lines.push(`  - ${parts.join(' | ')}`);
    });
  }

  if (payload.notes) {
    lines.push('');
    lines.push('Notas:');
    payload.notes.split('\n').forEach((noteLine) => {
      lines.push(`  ${noteLine}`);
    });
  }

  return lines.join('\n');
};

const validatePayload = (payload: unknown): NotificationPayload => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload: expected JSON object');
  }

  const { summary, customer, items, notes } = payload as NotificationPayload;

  if (!summary || typeof summary !== 'object') {
    throw new Error('Invalid payload: missing summary');
  }
  if (!customer || typeof customer !== 'object') {
    throw new Error('Invalid payload: missing customer');
  }
  if (!items || !Array.isArray(items)) {
    throw new Error('Invalid payload: missing items array');
  }
  if (typeof summary.totalAmount !== 'number' || Number.isNaN(summary.totalAmount)) {
    throw new Error('Invalid payload: summary.totalAmount must be a number');
  }
  if (!summary.paymentMethod) {
    throw new Error('Invalid payload: summary.paymentMethod is required');
  }
  if (!customer.name || !customer.email) {
    throw new Error('Invalid payload: customer name and email are required');
  }

  return {
    summary: {
      orderId: summary.orderId,
      orderReference: summary.orderReference,
      paymentMethod: summary.paymentMethod,
      paymentStatus: summary.paymentStatus,
      totalAmount: summary.totalAmount,
      currency: summary.currency || 'USD',
      placedAt: summary.placedAt || new Date().toISOString(),
      subtotal: summary.subtotal,
      shippingAmount: summary.shippingAmount,
    },
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      deliveryType: customer.deliveryType,
      deliveryPointName: customer.deliveryPointName,
      deliveryDepartment: customer.deliveryDepartment,
      deliveryMunicipality: customer.deliveryMunicipality,
      pickupDetails: customer.pickupDetails,
    },
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      orderId: item.orderId,
      console: item.console,
    })),
    notes,
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
  requiredEnv.forEach(getEnv);

  const body = await req.json();
  const payload = validatePayload(body);

  const apiKey = getEnv('RESEND_API_KEY');
  const from = getEnv('EMAIL_FROM');
  const to = getEnv('ADMIN_NOTIFICATION_EMAIL');

    const subjectReference = payload.summary.orderReference || payload.summary.orderId || 'sin-referencia';
    const subject = `Nuevo pedido recibido - ${subjectReference}`;

    const html = buildEmailHtml(payload);
    const text = buildEmailText(payload);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} ${errorText}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('notify-order error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
