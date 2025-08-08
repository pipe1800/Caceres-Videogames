# WOMPI Payment Integration

This document describes the WOMPI payment integration for Caceres Videogames.

## Overview

WOMPI is integrated as the payment processor for credit/debit card payments. When customers select "Tarjeta de Débito/Crédito" as their payment method, they will be redirected to WOMPI's secure checkout page.

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_WOMPI_APP_ID=dd599b63-81e6-48e3-9631-0ba9be8084ac
VITE_WOMPI_API_SECRET=ae36f414-c099-453b-8c20-5e6d714a2c14
VITE_WOMPI_API_URL=https://api.wompi.sv/v1
```

For testing/sandbox environment:
```env
VITE_WOMPI_API_URL=https://api-sandbox.wompi.sv/v1
```

### Supabase Configuration

Make sure your Supabase environment variables are also configured:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How It Works

### 1. Order Creation Flow

1. Customer fills out checkout form
2. Selects "Tarjeta de Débito/Crédito" as payment method
3. Order is created in Supabase database with `payment_status: 'pending'`
4. Payment link is created with WOMPI
5. Customer is redirected to WOMPI checkout
6. Cart is cleared from localStorage

### 2. Payment Processing

1. Customer completes payment on WOMPI
2. WOMPI redirects customer to `/payment/success?id=transaction_id`
3. PaymentSuccess page checks payment status with WOMPI API
4. Payment status is displayed to customer

### 3. Webhook Handling (Optional)

A Supabase Edge Function is available at `supabase/functions/wompi-webhook/` to handle WOMPI webhooks:

1. WOMPI sends webhook to your endpoint
2. Webhook updates order and payment status in database
3. Can trigger additional business logic (emails, notifications, etc.)

## Database Schema

### Orders Table Updates

The following columns were added to the `orders` table:

- `payment_method`: 'cash' | 'card'
- `payment_status`: 'pending' | 'approved' | 'declined' | 'expired' | 'cancelled'
- `payment_reference`: Unique order reference
- `payment_transaction_id`: WOMPI transaction ID
- `wompi_payment_link_id`: WOMPI payment link ID
- `delivery_type`: 'pickup' | 'delivery'
- `delivery_point`: Pickup location
- `delivery_department`: Department for delivery
- `delivery_municipality`: Municipality for delivery
- `delivery_address`: Full delivery address
- `delivery_reference_point`: Reference point for delivery
- `delivery_map_location`: Map coordinates

### Payments Table

A new `payments` table tracks detailed payment information:

- `id`: Primary key
- `order_id`: Foreign key to orders table
- `payment_method`: Payment method used
- `payment_status`: Current payment status
- `payment_reference`: Order reference
- `wompi_transaction_id`: WOMPI transaction ID
- `wompi_payment_link_id`: WOMPI payment link ID
- `amount_cents`: Amount in cents
- `currency`: Currency (USD)
- `payment_data`: Additional payment data (JSON)
- `webhook_data`: Webhook data from WOMPI (JSON)

## File Structure

```
src/integrations/wompi/
├── config.ts          # WOMPI configuration
├── types.ts           # TypeScript types
├── wompiService.ts    # WOMPI API service
└── index.ts           # Exports

src/integrations/supabase/
└── orderService.ts    # Order and payment database operations

src/pages/
├── Checkout.tsx       # Updated with WOMPI integration
└── PaymentSuccess.tsx # Payment result page

supabase/
├── migrations/
│   └── 20250808000000-add-payment-integration.sql
└── functions/
    └── wompi-webhook/
        └── index.ts   # Webhook handler
```

## Testing

### Development Testing

1. Use WOMPI sandbox environment by setting:
   ```env
   VITE_WOMPI_API_URL=https://api-sandbox.wompi.sv/v1
   ```

2. Use test card numbers provided by WOMPI documentation

### Production Testing

1. Use small amounts for initial tests
2. Monitor webhook delivery in WOMPI dashboard
3. Verify order status updates in Supabase

## Security Considerations

1. **API Keys**: Keep WOMPI API secret secure and never expose in client-side code
2. **Webhook Verification**: Implement signature verification for webhooks in production
3. **HTTPS**: Always use HTTPS in production for webhook endpoints
4. **Input Validation**: Validate all payment data before processing

## Error Handling

The integration includes comprehensive error handling:

- Payment link creation failures
- Network errors
- Database operation errors
- User-friendly error messages
- Fallback to cash payment option

## Monitoring

Monitor the following:

1. Payment success/failure rates
2. Webhook delivery status
3. Order completion rates
4. Customer support tickets related to payments

## Support

For WOMPI-specific issues:
- Documentation: https://docs.wompi.sv/
- Support: Contact WOMPI support team

For integration issues:
- Check browser console for errors
- Review Supabase logs
- Monitor webhook delivery in WOMPI dashboard
