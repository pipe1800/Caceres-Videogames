import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10; // Maximum number of retries
  const retryDelay = 2000; // 2 seconds between retries

  useEffect(() => {
    checkPaymentStatus();
  }, [searchParams]);

  const checkPaymentStatus = async () => {
    try {
      // WOMPI sends the transaction ID and reference in the URL parameters
      const transactionId = searchParams.get('id');
      const reference = searchParams.get('reference');
      
      console.log('Payment success page - Transaction ID:', transactionId);
      console.log('Payment success page - Reference:', reference);
      
      if (!transactionId && !reference) {
        setErrorMessage('No se encontró información de la transacción');
        setStatus('error');
        return;
      }

      // Try to find the order by reference or transaction ID using the correct schema fields
      let { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .or(reference ? `wompi_reference.eq.${reference}` : `wompi_transaction_id.eq.${transactionId}`)
        .single();

      if (orderError || !orders) {
        console.log('Order not found, retrying...', { retryCount, maxRetries, reference, transactionId });
        
        // If order not found and we haven't exceeded max retries, try again
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            checkPaymentStatus();
          }, retryDelay);
          return;
        }
        
        console.error('Order lookup error:', orderError);
        setErrorMessage('No se encontró la orden asociada a esta transacción. Por favor, contacta soporte.');
        setStatus('error');
        return;
      }

      console.log('Order found:', orders);
      setOrderDetails(orders);

      // Check if payment is already confirmed
      if (orders.payment_status === 'completed') {
        setStatus('success');
        return;
      }

      // If we have a transaction ID, let's check the payment status with WOMPI
      if (transactionId && (orders.payment_status === 'pending' || orders.payment_status === 'processing')) {
        console.log('Checking payment status with WOMPI...');
        
        try {
          // Call the edge function to check payment status
          const { data: paymentCheck, error: paymentError } = await supabase.functions.invoke('check-payment-status', {
            body: { transactionId }
          });

          if (paymentError) {
            console.error('Error checking payment with WOMPI:', paymentError);
          } else if (paymentCheck && paymentCheck.data) {
            const wompiStatus = paymentCheck.data.status;
            console.log('WOMPI payment status:', wompiStatus);
            
            // Update order status based on WOMPI response
            if (wompiStatus === 'APPROVED') {
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  payment_status: 'completed',
                  status: 'completed',
                  wompi_transaction_id: paymentCheck.data.id,
                  updated_at: new Date().toISOString()
                })
                .eq('id', orders.id);
                
              if (!updateError) {
                setOrderDetails({ ...orders, payment_status: 'completed', status: 'completed' });
                setStatus('success');
                return;
              }
            } else if (wompiStatus === 'DECLINED' || wompiStatus === 'VOIDED') {
              setErrorMessage('El pago fue rechazado por el procesador. Por favor, intenta nuevamente.');
              setStatus('error');
              return;
            }
          }
        } catch (error) {
          console.error('Error calling check-payment-status:', error);
        }
      }

      // If payment status is still pending/processing after checking WOMPI, retry
      if (orders.payment_status === 'pending' || orders.payment_status === 'processing') {
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            checkPaymentStatus();
          }, retryDelay);
          return;
        }
        
        // After max retries, show a message that payment is being processed
        setErrorMessage('Tu pago está siendo procesado. Recibirás una confirmación por email en breve.');
        setStatus('error');
        return;
      }

      // If payment was declined or failed
      if (orders.payment_status === 'failed' || orders.payment_status === 'refunded') {
        setErrorMessage('El pago no pudo ser procesado. Por favor, intenta nuevamente.');
        setStatus('error');
        return;
      }

      // Default case - payment successful
      setStatus('success');

    } catch (error) {
      console.error('Error checking payment status:', error);
      setErrorMessage('Error al verificar el estado del pago. Por favor, contacta soporte.');
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#091024] via-slate-800 to-white flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="w-16 h-16 text-[#3bc8da] animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-[#091024] mb-2">Verificando tu pago...</h2>
            <p className="text-gray-600">Por favor espera mientras confirmamos tu transacción</p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-2">Intento {retryCount} de {maxRetries}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#091024] via-slate-800 to-white flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4">
          <div className="flex flex-col items-center text-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-[#091024] mb-2">Hubo un problema</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="space-y-3 w-full">
              <Button
                onClick={() => navigate('/checkout')}
                className="w-full bg-gradient-to-r from-[#3bc8da] to-[#3fdb70] hover:from-[#3fdb70] hover:to-[#3bc8da] text-white"
              >
                Intentar nuevamente
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Volver al inicio
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#091024] via-slate-800 to-white flex items-center justify-center">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="flex flex-col items-center text-center">
          <CheckCircle className="w-16 h-16 text-[#3fdb70] mb-4" />
          <h2 className="text-2xl font-bold text-[#091024] mb-2">¡Pago Exitoso!</h2>
          <p className="text-gray-600 mb-6">
            Tu orden #{orderDetails?.id || 'XXXXX'} ha sido confirmada. Recibirás un email con los detalles.
          </p>
          
          {orderDetails && (
            <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-[#091024] mb-2">Detalles de la orden:</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-600">Cliente:</span> {orderDetails.customer_name}</p>
                <p><span className="text-gray-600">Total:</span> ${orderDetails.total_amount?.toFixed(2)}</p>
                <p><span className="text-gray-600">Estado:</span> Confirmado</p>
              </div>
            </div>
          )}
          
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-[#3bc8da] to-[#3fdb70] hover:from-[#3fdb70] hover:to-[#3bc8da] text-white flex items-center justify-center gap-2"
          >
            Continuar comprando
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;