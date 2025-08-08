import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
    const WOMPI_APP_ID = Deno.env.get('WOMPI_APP_ID')!
    const WOMPI_API_SECRET = Deno.env.get('WOMPI_API_SECRET')!
    const WOMPI_API_URL = Deno.env.get('WOMPI_API_URL') || 'https://api.wompi.sv'

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

    const requestBody = {
      identificadorEnlaceComercio: reference,
      monto: amount,
      nombreProducto: `Pago de ${customerName}`,
      formaPago: {
        permitirTarjetaCreditoDebido: true,
        permitirPagoConPuntoAgricola: false,
        permitirPagoEnCuotasAgricola: false
      },
      configuracion: {
        urlRedirect: redirectUrl,
        urlRetorno: redirectUrl,
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
      
      throw new Error(`WOMPI API Error (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`)
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
        error: error.message,
        details: error.stack || 'No stack trace available'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
