// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getEnv = (key: string, fallback?: string) => {
  const value = Deno.env.get(key)
  return value ?? fallback
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
  const { amount, currency, reference, customerEmail, customerName, redirectUrl } = await req.json()

    // Log incoming data for debugging
    console.log('Incoming payment data:', { amount, currency, reference, customerEmail, customerName, redirectUrl })

    // Validate required fields
    if (!amount || !currency || !reference || !customerEmail || !customerName || !redirectUrl) {
      throw new Error('Missing required fields: amount, currency, reference, customerEmail, customerName, redirectUrl')
    }

    // Get WOMPI credentials from environment
  // TODO: Replace hardcoded fallbacks with environment variables before committing to production.
  const WOMPI_APP_ID = getEnv('WOMPI_APP_ID', 'dd599b63-81e6-48e3-9631-0ba9be8084ac')
  const WOMPI_API_SECRET = getEnv('WOMPI_API_SECRET', 'ae36f414-c099-453b-8c20-5e6d714a2c14')
  const WOMPI_API_URL = getEnv('WOMPI_API_URL', 'https://api.wompi.sv/v1')
    const WOMPI_REDIRECT_URL = getEnv('WOMPI_REDIRECT_URL')
    const WOMPI_RETURN_URL = getEnv('WOMPI_RETURN_URL')

    if (!WOMPI_APP_ID || !WOMPI_API_SECRET) {
      throw new Error('WOMPI credentials not configured')
    }

    console.log('Using WOMPI API URL:', WOMPI_API_URL)

    // First, get OAuth access token
    const tokenResponse = await fetch('https://id.wompi.sv/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: WOMPI_APP_ID,
        client_secret: WOMPI_API_SECRET,
        audience: 'wompi_api'
      })
    })

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text()
      console.error('OAuth token error:', tokenError)
      throw new Error(`Failed to get WOMPI access token: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    console.log('Successfully obtained WOMPI access token')

    const normalizedAmount = Number(Number(amount).toFixed(2))
    const resolvedRedirectUrl = WOMPI_REDIRECT_URL ?? redirectUrl
    const resolvedReturnUrl = WOMPI_RETURN_URL ?? redirectUrl

    if (!resolvedRedirectUrl || !resolvedReturnUrl) {
      throw new Error('Missing redirect URL. Provide redirectUrl in request body or configure WOMPI_REDIRECT_URL/WOMPI_RETURN_URL environment variables.')
    }

    const requestBody = {
      identificadorEnlaceComercio: reference,
      monto: normalizedAmount,
      moneda: currency,
      nombreProducto: `Pago de ${customerName}`,
      formaPago: {
        permitirTarjetaCreditoDebido: true,
        permitirPagoConPuntoAgricola: false,
        permitirPagoEnCuotasAgricola: false
      },
      configuracion: {
        urlRedirect: resolvedRedirectUrl,
        urlRetorno: resolvedReturnUrl,
        esMontoEditable: false,
        esCantidadEditable: false,
        notificarTransaccionCliente: true,
        emailsNotificacion: customerEmail
      }
    }

    console.log('WOMPI request body:', requestBody)

    // Create payment link with WOMPI
    const response = await fetch(`${WOMPI_API_URL}/EnlacePago`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('WOMPI response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('WOMPI API error response:', errorText)

      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: 'WOMPI API responded with an error',
          status: response.status,
          wompiError: errorData,
          requestBody,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        }
      )
    }

    const data = await response.json()
    console.log('WOMPI success response:', data)

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
