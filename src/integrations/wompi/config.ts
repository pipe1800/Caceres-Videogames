export const WOMPI_CONFIG = {
  appId: import.meta.env.VITE_WOMPI_APP_ID || 'dd599b63-81e6-48e3-9631-0ba9be8084ac',
  apiSecret: import.meta.env.VITE_WOMPI_API_SECRET || 'ae36f414-c099-453b-8c20-5e6d714a2c14',
  apiUrl: import.meta.env.VITE_WOMPI_API_URL || 'https://api.wompi.sv/v1',
  // For testing/sandbox use: https://api-sandbox.wompi.sv/v1
};

export const WOMPI_PAYMENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type WompiPaymentStatus = typeof WOMPI_PAYMENT_STATUS[keyof typeof WOMPI_PAYMENT_STATUS];
