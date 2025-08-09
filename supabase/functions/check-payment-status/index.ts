import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { transactionId } = await req.json()

    if (!transactionId) {
      throw new Error('Transaction ID is required')
    }

    console.log('Checking payment status for transaction:', transactionId)

    // Get WOMPI credentials
    const WOMPI_APP_ID = Deno.env.get('WOMPI_APP_ID')
    const WOMPI_API_SECRET = Deno.env.get('WOMPI_API_SECRET')
    const WOMPI_API_URL = Deno.env.get('WOMPI_API_URL') || 'https://api.wompi.sv'

    if (!WOMPI_APP_ID || !WOMPI_API_SECRET) {
      console.error('Missing WOMPI credentials')
      throw new Error('Payment service configuration error')
    }

    // Get OAuth token
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
      const errorText = await tokenResponse.text()
      console.error('Token error:', errorText)
      throw new Error('Failed to get WOMPI access token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Check transaction status with WOMPI
    const response = await fetch(`${WOMPI_API_URL}/TransaccionCompra/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('WOMPI API error:', errorText)
      throw new Error(`Failed to check payment status: ${response.status}`)
    }

    const data = await response.json()
    console.log('WOMPI transaction status:', data)

    // Check if payment is approved using the correct field names
    const isApproved = data.esAprobada === true || 
                       data.resultadoTransaccion === 'ExitosaAprobada' ||
                       data.estadoTransaccion === 'Aprobada' || 
                       data.estadoTransaccion === 'APPROVED'

    // Update order in database if payment is approved
    if (isApproved) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Get the reference from the transaction data
      const reference = data.identificadorEnlaceComercio || data.idExterno

      if (reference) {
        // Update both columns for compatibility
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'completed',
            payment_status: 'completed',
            wompi_transaction_id: transactionId,
            payment_transaction_id: transactionId
          })
          .or(`wompi_reference.eq.${reference},payment_reference.eq.${reference}`)

        if (error) {
          console.error('Error updating order:', error)
        }
      }
    }

    // Return normalized status for frontend
    let normalizedStatus = 'PENDING'
    if (isApproved) {
      normalizedStatus = 'APPROVED'
    } else if (data.resultadoTransaccion?.includes('Rechazada') || 
               data.resultadoTransaccion?.includes('Fallida')) {
      normalizedStatus = 'DECLINED'
    }

    return new Response(
      JSON.stringify({ 
        status: normalizedStatus,
        data: data,
        isApproved: isApproved,
        transactionId: data.idTransaccion,
        authorizationCode: data.codigoAutorizacion,
        message: data.mensaje
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error checking payment status:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})