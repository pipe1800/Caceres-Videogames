import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Loader2, Home, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { wompiService, WOMPI_PAYMENT_STATUS } from '@/integrations/wompi';
import { orderService } from '@/integrations/supabase/orderService';
import { toast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const transactionId = searchParams.get('id');
        const reference = searchParams.get('reference');
        
        if (!transactionId && !reference) {
          setError('No se encontró información de la transacción');
          setIsLoading(false);
          return;
        }

        // Check payment status with WOMPI
        if (transactionId) {
          try {
            const response = await wompiService.checkPaymentStatus(transactionId);
            console.log('Payment status response:', response);
            
            if (response && response.data) {
              setPaymentStatus(response.data.status);
              
              // Update order status in database
              if (reference) {
                try {
                  const order = await orderService.getOrderByReference(reference);
                  if (order) {
                    const updateData: any = {
                      payment_status: response.data.status.toLowerCase(),
                      wompi_transaction_id: response.data.id,
                    };
                    
                    // If payment is approved, update order status to 'confirmed'
                    // This will trigger stock reduction via database trigger
                    if (response.data.status === WOMPI_PAYMENT_STATUS.APPROVED) {
                      updateData.status = 'confirmed';
                      updateData.payment_status = 'approved';
                      
                      toast({
                        title: "¡Pago Confirmado!",
                        description: "Tu pago ha sido procesado exitosamente y el stock ha sido actualizado.",
                      });
                    } else if (response.data.status === WOMPI_PAYMENT_STATUS.DECLINED) {
                      updateData.payment_status = 'declined';
                      
                      toast({
                        title: "Pago Rechazado",
                        description: "Tu pago no pudo ser procesado. Por favor intenta nuevamente.",
                        variant: "destructive"
                      });
                    } else if (response.data.status === WOMPI_PAYMENT_STATUS.PENDING) {
                      updateData.payment_status = 'processing';
                      
                      toast({
                        title: "Pago en Proceso",
                        description: "Tu pago está siendo procesado. Te notificaremos cuando se complete.",
                      });
                    }
                    
                    await orderService.updateOrderPayment(order.id, updateData);
                    setOrderDetails(order);
                    
                    // Log stock reduction for approved payments
                    if (response.data.status === WOMPI_PAYMENT_STATUS.APPROVED) {
                      console.log('Payment approved - stock has been reduced for order:', order.id);
                    }
                  }
                } catch (dbError) {
                  console.error('Error updating order status:', dbError);
                  // Don't show error to user, payment was successful
                }
              }
            }
          } catch (error) {
            console.error('Error checking payment status:', error);
            setError('Error al verificar el estado del pago');
          }
        } else if (reference) {
          // Fallback: try to get order by reference
          try {
            const order = await orderService.getOrderByReference(reference);
            if (order) {
              setOrderDetails(order);
              setPaymentStatus(order.payment_status?.toUpperCase() || 'PENDING');
            }
          } catch (error) {
            console.error('Error fetching order:', error);
          }
        }
      } catch (error) {
        console.error('Error in payment confirmation:', error);
        setError('Ocurrió un error al procesar tu pago');
      } finally {
        setIsLoading(false);
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case WOMPI_PAYMENT_STATUS.APPROVED:
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case WOMPI_PAYMENT_STATUS.DECLINED:
      case WOMPI_PAYMENT_STATUS.EXPIRED:
      case WOMPI_PAYMENT_STATUS.CANCELLED:
        return <XCircle className="w-16 h-16 text-red-500" />;
      case WOMPI_PAYMENT_STATUS.PENDING:
      default:
        return <Clock className="w-16 h-16 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case WOMPI_PAYMENT_STATUS.APPROVED:
        return {
          title: '¡Pago Exitoso!',
          description: 'Tu pago ha sido procesado correctamente. El stock ha sido actualizado y recibirás un correo de confirmación.',
          color: 'text-green-600'
        };
      case WOMPI_PAYMENT_STATUS.DECLINED:
        return {
          title: 'Pago Rechazado',
          description: 'Tu pago no pudo ser procesado. Por favor verifica tu información e intenta nuevamente.',
          color: 'text-red-600'
        };
      case WOMPI_PAYMENT_STATUS.EXPIRED:
        return {
          title: 'Pago Expirado',
          description: 'El tiempo para completar el pago ha expirado. Por favor realiza un nuevo pedido.',
          color: 'text-orange-600'
        };
      case WOMPI_PAYMENT_STATUS.CANCELLED:
        return {
          title: 'Pago Cancelado',
          description: 'Has cancelado el proceso de pago. Tu pedido no ha sido procesado.',
          color: 'text-gray-600'
        };
      case WOMPI_PAYMENT_STATUS.PENDING:
      default:
        return {
          title: 'Pago en Proceso',
          description: 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
          color: 'text-yellow-600'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
            <p className="text-white text-lg">Verificando tu pago...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
            <p className="text-gray-300 text-center mb-6">{error}</p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-600 hover:to-green-600"
            >
              <Home className="mr-2" />
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className={`text-2xl font-bold ${statusInfo.color}`}>
            {statusInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-300 mt-2">
            {statusInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {orderDetails && (
            <div className="bg-gray-700 rounded-lg p-4 space-y-2">
              <h3 className="text-white font-semibold mb-2">Detalles del Pedido</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p><span className="font-medium">Referencia:</span> {searchParams.get('reference') || orderDetails.wompi_reference}</p>
                <p><span className="font-medium">Cliente:</span> {orderDetails.customer_name}</p>
                <p><span className="font-medium">Total:</span> ${orderDetails.total_amount}</p>
                <p><span className="font-medium">Estado:</span> {
                  paymentStatus === WOMPI_PAYMENT_STATUS.APPROVED 
                    ? 'Confirmado - Stock Actualizado'
                    : paymentStatus === WOMPI_PAYMENT_STATUS.PENDING
                    ? 'Procesando'
                    : 'No Completado'
                }</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {paymentStatus === WOMPI_PAYMENT_STATUS.APPROVED && (
              <Button 
                onClick={() => navigate('/products')}
                className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-600 hover:to-green-600"
              >
                <ShoppingBag className="mr-2" />
                Seguir Comprando
              </Button>
            )}
            
            {(paymentStatus === WOMPI_PAYMENT_STATUS.DECLINED ||
              paymentStatus === WOMPI_PAYMENT_STATUS.EXPIRED ||
              paymentStatus === WOMPI_PAYMENT_STATUS.CANCELLED) && (
              <Button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-600 hover:to-green-600"
              >
                Intentar Nuevamente
              </Button>
            )}
            
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Home className="mr-2" />
              Volver al Inicio
            </Button>
          </div>
          
          {paymentStatus === WOMPI_PAYMENT_STATUS.APPROVED && (
            <p className="text-xs text-gray-400 text-center mt-4">
              Recibirás un correo de confirmación con los detalles de tu pedido.
              El stock de los productos ha sido actualizado automáticamente.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;