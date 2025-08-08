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

    // Find the order by wompi reference (using the correct field from schema)
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('wompi_reference', transactionData.reference)
      .single()

    if (orderError || !orders) {
      console.error('Order not found for reference:', transactionData.reference)
      throw new Error(`Order not found for reference: ${transactionData.reference}`)
    }

    // Update the order payment status
    let paymentStatus = 'pending';
    if (transactionData.status === 'APPROVED') {
      paymentStatus = 'completed';
    } else if (transactionData.status === 'DECLINED' || transactionData.status === 'VOIDED') {
      paymentStatus = 'failed';
    } else if (transactionData.status === 'PENDING') {
      paymentStatus = 'processing';
    }

    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        wompi_transaction_id: transactionData.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orders.id)

    if (orderUpdateError) {
      console.error('Error updating order:', orderUpdateError)
      throw orderUpdateError
    }

    // If payment is approved, update order status to completed
    // This will trigger stock reduction for card payments
    if (transactionData.status === 'APPROVED') {
      const { error: statusUpdateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          payment_status: 'completed',
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

    // Update or create payment record using correct schema fields
    const paymentStatusForPaymentsTable = transactionData.status === 'APPROVED' ? 'approved' : 
                                         transactionData.status === 'DECLINED' ? 'declined' :
                                         transactionData.status === 'VOIDED' ? 'voided' :
                                         transactionData.status === 'PENDING' ? 'processing' : 'pending';

    const { error: paymentError } = await supabase
      .from('payments')
      .upsert({
        order_id: orders.id,
        amount: transactionData.amount_in_cents / 100, // Convert cents to dollars
        payment_method: 'credit-debit',
        processor_transaction_id: transactionData.id,
        processor_reference: transactionData.reference,
        processor_response: webhookData,
        status: paymentStatusForPaymentsTable,
        currency: transactionData.currency || 'USD',
        processor: 'wompi',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'order_id'
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
