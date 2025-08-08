import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { wompiService, WOMPI_PAYMENT_STATUS } from '@/integrations/wompi';
import { orderService } from '@/integrations/supabase/orderService';
import type { WompiPaymentStatus } from '@/integrations/wompi';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<WompiPaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionData, setTransactionData] = useState<any>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const transactionId = searchParams.get('id');
        const reference = searchParams.get('reference');

        if (!transactionId && !reference) {
          setPaymentStatus(WOMPI_PAYMENT_STATUS.DECLINED);
          setLoading(false);
          return;
        }

        let response;
        if (transactionId) {
          response = await wompiService.checkPaymentStatus(transactionId);
        } else if (reference) {
          response = await wompiService.getPaymentByReference(reference);
        }

        if (response && response.data) {
          setTransactionData(response.data);
          setPaymentStatus(response.data.status as WompiPaymentStatus);

          // Update order status in database
          if (reference) {
            try {
              const order = await orderService.getOrderByReference(reference);
              if (order) {
                await orderService.updateOrderPayment(order.id, {
                  payment_status: response.data.status.toLowerCase(),
                  wompi_transaction_id: response.data.id,
                });
              }
            } catch (dbError) {
              console.error('Error updating order status:', dbError);
            }
          }
        } else {
          setPaymentStatus(WOMPI_PAYMENT_STATUS.DECLINED);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setPaymentStatus(WOMPI_PAYMENT_STATUS.DECLINED);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case WOMPI_PAYMENT_STATUS.APPROVED:
        return <CheckCircle className="w-20 h-20 text-green-500" />;
      case WOMPI_PAYMENT_STATUS.DECLINED:
        return <XCircle className="w-20 h-20 text-red-500" />;
      case WOMPI_PAYMENT_STATUS.PENDING:
        return <Clock className="w-20 h-20 text-yellow-500" />;
      case WOMPI_PAYMENT_STATUS.EXPIRED:
      case WOMPI_PAYMENT_STATUS.CANCELLED:
        return <AlertCircle className="w-20 h-20 text-orange-500" />;
      default:
        return <AlertCircle className="w-20 h-20 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case WOMPI_PAYMENT_STATUS.APPROVED:
        return {
          title: '¡Pago Exitoso!',
          description: 'Tu pago ha sido procesado correctamente. Te contactaremos pronto para coordinar la entrega.',
          color: 'text-green-600'
        };
      case WOMPI_PAYMENT_STATUS.DECLINED:
        return {
          title: 'Pago Rechazado',
          description: 'Tu pago no pudo ser procesado. Por favor intenta nuevamente o contacta a tu banco.',
          color: 'text-red-600'
        };
      case WOMPI_PAYMENT_STATUS.PENDING:
        return {
          title: 'Pago Pendiente',
          description: 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
          color: 'text-yellow-600'
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
          description: 'El pago fue cancelado. Puedes intentar nuevamente si lo deseas.',
          color: 'text-orange-600'
        };
      default:
        return {
          title: 'Error de Pago',
          description: 'Hubo un problema al procesar tu pago. Por favor contacta a soporte.',
          color: 'text-gray-600'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#091024] via-slate-800 to-white">
        <Header cartItemsCount={0} onCartClick={() => navigate('/cart')} />
        <Navigation />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border-2 border-[#3bc8da]/20">
              <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-[#3bc8da] mx-auto mb-6"></div>
              <h1 className="text-2xl font-bold text-[#091024] mb-4">
                Verificando el estado del pago...
              </h1>
              <p className="text-gray-600">
                Por favor espera mientras confirmamos tu transacción.
              </p>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#091024] via-slate-800 to-white">
      <Header cartItemsCount={0} onCartClick={() => navigate('/cart')} />
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border-2 border-[#3bc8da]/20">
            <div className="flex justify-center mb-8">
              {getStatusIcon()}
            </div>
            
            <h1 className={`text-3xl font-bold mb-4 ${statusInfo.color}`}>
              {statusInfo.title}
            </h1>
            
            <p className="text-gray-600 text-lg mb-8">
              {statusInfo.description}
            </p>

            {transactionData && (
              <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-bold text-[#091024] mb-4">Detalles de la Transacción</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Referencia:</span>
                    <span className="font-medium">{transactionData.reference}</span>
                  </div>
                  {transactionData.amount_in_cents && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto:</span>
                      <span className="font-medium">${(transactionData.amount_in_cents / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {transactionData.created_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-medium">
                        {new Date(transactionData.created_at).toLocaleString('es-SV')}
                      </span>
                    </div>
                  )}
                  {transactionData.id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID Transacción:</span>
                      <span className="font-medium font-mono text-xs">{transactionData.id}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-[#3bc8da] to-[#3fdb70] hover:from-[#3fdb70] hover:to-[#3bc8da] text-white px-8 py-3 rounded-xl font-bold transition-all duration-300"
              >
                Volver al Inicio
              </Button>
              
              {paymentStatus === WOMPI_PAYMENT_STATUS.DECLINED || 
               paymentStatus === WOMPI_PAYMENT_STATUS.EXPIRED || 
               paymentStatus === WOMPI_PAYMENT_STATUS.CANCELLED ? (
                <Button
                  onClick={() => navigate('/products')}
                  variant="outline"
                  className="border-[#3bc8da] text-[#3bc8da] hover:bg-[#3bc8da] hover:text-white px-8 py-3 rounded-xl font-bold transition-all duration-300"
                >
                  Intentar de Nuevo
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
