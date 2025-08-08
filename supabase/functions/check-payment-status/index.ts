import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transactionId } = await req.json()
    
    const WOMPI_APP_ID = Deno.env.get('WOMPI_APP_ID')!
    const WOMPI_API_URL = Deno.env.get('WOMPI_API_URL') || 'https://api-sandbox.wompi.sv/v1'

    const response = await fetch(`${WOMPI_API_URL}/transactions/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${WOMPI_APP_ID}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to check payment status')
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
