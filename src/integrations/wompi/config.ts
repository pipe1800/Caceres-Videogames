export const WOMPI_CONFIG = {
  appId: import.meta.env.VITE_WOMPI_APP_ID,
  apiSecret: import.meta.env.VITE_WOMPI_API_SECRET,
  apiUrl: import.meta.env.VITE_WOMPI_API_URL || 'https://api-sandbox.wompi.sv/v1',
};

if (!WOMPI_CONFIG.appId || !WOMPI_CONFIG.apiSecret) {
  console.warn('WOMPI credentials not configured. Payment processing will not work.');
}

export const WOMPI_PAYMENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type WompiPaymentStatus = typeof WOMPI_PAYMENT_STATUS[keyof typeof WOMPI_PAYMENT_STATUS];
