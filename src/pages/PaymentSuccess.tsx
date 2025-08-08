import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10;
  const retryDelay = 2000;

  useEffect(() => {
    // Log all URL parameters to understand what WOMPI sends
    console.log('Full URL:', window.location.href);
    console.log('Search params:', window.location.search);
    console.log('All search params:', Object.fromEntries(searchParams.entries()));
    
    checkPaymentStatus();
  }, [searchParams]);

  const checkPaymentStatus = async () => {
    try {
      // Try different parameter names that WOMPI might use
      const transactionId = searchParams.get('id') || 
                           searchParams.get('transaction_id') || 
                           searchParams.get('transactionId');
      
      const reference = searchParams.get('reference') || 
                       searchParams.get('ref') || 
                       searchParams.get('payment_reference') ||
                       searchParams.get('orderReference');
      
      // Also check for wompi specific parameters
      const wompiId = searchParams.get('wompi_id');
      const wompiReference = searchParams.get('wompi_reference');
      
      console.log('Extracted parameters:', {
        transactionId,
        reference,
        wompiId,
        wompiReference,
        allParams: Object.fromEntries(searchParams.entries())
      });
      
      // Try to get the reference from localStorage as a fallback
      const storedReference = localStorage.getItem('currentOrderReference');
      console.log('Stored reference from localStorage:', storedReference);
      
      const finalReference = reference || wompiReference || storedReference;
      
      if (!transactionId && !finalReference) {
        // If we have no parameters, try to find the most recent order for this session
        const { data: recentOrder, error: recentOrderError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (recentOrder && !recentOrderError) {
          console.log('Found recent order:', recentOrder);
          
          // Check if this order was created recently (within last 5 minutes)
          const orderTime = new Date(recentOrder.created_at).getTime();
          const now = new Date().getTime();
          const fiveMinutes = 5 * 60 * 1000;
          
          if (now - orderTime < fiveMinutes) {
            setOrderDetails(recentOrder);
            
            // Check payment status
            if (recentOrder.payment_status === 'completed') {
              setStatus('success');
              localStorage.removeItem('currentOrderReference');
              return;
            } else if (recentOrder.payment_status === 'failed') {
              setErrorMessage('El pago fue rechazado. Por favor, intenta nuevamente.');
              setStatus('error');
              return;
            }
            
            // If still pending/processing, retry
            if (retryCount < maxRetries) {
              setRetryCount(prev => prev + 1);
              setTimeout(() => checkPaymentStatus(), retryDelay);
              return;
            }
          }
        }
        
        setErrorMessage('No se encontró información de la transacción. Si realizaste un pago, por favor contacta soporte.');
        setStatus('error');
        return;
      }

      // Try to find the order using any available reference
      let orderQuery = supabase.from('orders').select('*');
      
      if (finalReference) {
        orderQuery = orderQuery.or(`wompi_reference.eq.${finalReference}`);
      }
      
      if (transactionId) {
        if (finalReference) {
          orderQuery = orderQuery.or(`wompi_transaction_id.eq.${transactionId}`);
        } else {
          orderQuery = orderQuery.eq('wompi_transaction_id', transactionId);
        }
      }

      const { data: orders, error: orderError } = await orderQuery.single();

      if (orderError || !orders) {
        console.log('Order not found, retrying...', { retryCount, maxRetries });
        
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => checkPaymentStatus(), retryDelay);
          return;
        }
        
        console.error('Order lookup error:', orderError);
        setErrorMessage('No se encontró la orden asociada a esta transacción. Por favor, verifica tu email para confirmación o contacta soporte.');
        setStatus('error');
        return;
      }

      console.log('Order found:', orders);
      setOrderDetails(orders);

      // Check payment status
      if (orders.payment_status === 'completed') {
        setStatus('success');
        localStorage.removeItem('currentOrderReference');
        return;
      }

      if (orders.payment_status === 'failed') {
        setErrorMessage('El pago fue rechazado. Por favor, intenta nuevamente.');
        setStatus('error');
        return;
      }

      // If still pending/processing, retry
      if (orders.payment_status === 'pending' || orders.payment_status === 'processing') {
        console.log('Payment still processing, retrying...');
        
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => checkPaymentStatus(), retryDelay);
          return;
        }
        
        setErrorMessage('Tu pago está siendo procesado. Recibirás una confirmación por email en breve.');
        setStatus('error');
        return;
      }

      // Default to success if we have an order
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
            Tu orden #{orderDetails?.id?.slice(0, 8) || 'XXXXX'} ha sido confirmada. Recibirás un email con los detalles.
          </p>
          
          {orderDetails && (
            <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-[#091024] mb-2">Detalles de la orden:</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-600">Cliente:</span> {orderDetails.customer_name}</p>
                <p><span className="text-gray-600">Email:</span> {orderDetails.customer_email}</p>
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