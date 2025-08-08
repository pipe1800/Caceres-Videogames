# Supabase CLI Deployment Commands

## Prerequisites
First, install the Supabase CLI and login:
```bash
npm install -g supabase
npx supabase login
```

## Link to your project
```bash
npx supabase link --project-ref wzwnqtxajmknnnovjtme
```

## Set environment variables for Edge Functions
```bash
npx supabase secrets set WOMPI_APP_ID=dd599b63-81e6-48e3-9631-0ba9be8084ac
npx supabase secrets set WOMPI_API_SECRET=ae36f414-c099-453b-8c20-5e6d714a2c14
npx supabase secrets set WOMPI_API_URL=https://api-sandbox.wompi.sv/v1
```

## Deploy the Edge Functions
```bash
npx supabase functions deploy create-payment-link
npx supabase functions deploy check-payment-status
npx supabase functions deploy wompi-webhook
```

## Verify deployment
After deployment, you can test the functions at:
- https://wzwnqtxajmknnnovjtme.supabase.co/functions/v1/create-payment-link
- https://wzwnqtxajmknnnovjtme.supabase.co/functions/v1/check-payment-status
- https://wzwnqtxajmknnnovjtme.supabase.co/functions/v1/wompi-webhook

## For Production
When ready for production, update the WOMPI_API_URL:
```bash
npx supabase secrets set WOMPI_API_URL=https://api.wompi.sv/v1
```
