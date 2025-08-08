import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the webhook data from WOMPI
    const webhookData = await req.json()
    
    console.log('Received WOMPI webhook:', webhookData)

    // Verify that this is a valid WOMPI webhook
    // You should implement signature verification here for security
    // const signature = req.headers.get('x-wompi-signature')
    // if (!verifyWompiSignature(signature, webhookData)) {
    //   throw new Error('Invalid webhook signature')
    // }

    const { data: transactionData } = webhookData
    
    if (!transactionData || !transactionData.reference) {
      throw new Error('Invalid webhook data: missing transaction reference')
    }

    // Find the order by payment reference
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', transactionData.reference)
      .single()

    if (orderError || !orders) {
      console.error('Order not found for reference:', transactionData.reference)
      throw new Error(`Order not found for reference: ${transactionData.reference}`)
    }

    // Update the order payment status
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        payment_status: transactionData.status.toLowerCase(),
        wompi_transaction_id: transactionData.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orders.id)

    if (orderUpdateError) {
      console.error('Error updating order:', orderUpdateError)
      throw orderUpdateError
    }

    // If payment is approved, update order status to confirmed
    // This will trigger stock reduction for card payments
    if (transactionData.status === 'APPROVED') {
      const { error: statusUpdateError } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', orders.id)

      if (statusUpdateError) {
        console.error('Error updating order status:', statusUpdateError)
      } else {
        console.log(`Payment approved for order ${orders.id}, stock has been reduced via database trigger`)
      }

      // Here you could add additional logic like:
      // - Send confirmation email to customer
      // - Notify admin about new confirmed order
      // - Trigger fulfillment process
    }

    // Update or create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .upsert({
        order_id: orders.id,
        payment_method: 'card',
        payment_status: transactionData.status.toLowerCase(),
        payment_reference: transactionData.reference,
        wompi_transaction_id: transactionData.id,
        amount_cents: transactionData.amount_in_cents,
        currency: transactionData.currency,
        webhook_data: webhookData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'order_id,payment_reference'
      })

    if (paymentError) {
      console.error('Error updating payment:', paymentError)
      throw paymentError
    }

    console.log(`Successfully processed webhook for order ${orders.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        orderId: orders.id 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      }
    )
  }
})
