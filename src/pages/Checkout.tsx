import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Truck, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LocationSelector from '@/components/LocationSelector';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { elSalvadorDepartments, Department, Municipality } from '@/data/elSalvadorData';
import { wompiService } from '@/integrations/wompi';
import { orderService } from '@/integrations/supabase/orderService';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  console: string;
  quantity: number;
}

interface DeliveryPoint {
  id: string;
  name: string;
  address: string;
}

const deliveryPoints: DeliveryPoint[] = [
  { id: 'metrocentro', name: 'Metrocentro', address: 'Boulevard de los Héroes, San Salvador' },
  { id: 'galerias', name: 'Galerías', address: 'Boulevard del Hipódromo, San Salvador' },
  { id: 'torre-futura', name: 'Torre Futura', address: 'Alameda Roosevelt, San Salvador' },
  { id: 'escalon', name: 'Escalón', address: 'Colonia Escalón, San Salvador' },
  { id: 'santa-tecla', name: 'Santa Tecla', address: 'Santa Tecla, La Libertad' },
  { id: 'santa-elena', name: 'Santa Elena', address: 'Santa Elena, Antiguo Cuscatlán' },
  { id: 'gran-via', name: 'La Gran Vía', address: 'Antiguo Cuscatlán, La Libertad' },
  { id: 'antiguo-cuscatlan', name: 'Antiguo Cuscatlán', address: 'Antiguo Cuscatlán, La Libertad' },
  { id: '75-av-norte', name: '75 Av. Norte', address: '75 Avenida Norte, San Salvador' },
  { id: 'la-bernal', name: 'La Bernal', address: 'La Bernal, San Salvador' },
];

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const { toast } = useToast();

  // Form states
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [selectedDeliveryPoint, setSelectedDeliveryPoint] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [availableMunicipalities, setAvailableMunicipalities] = useState<Municipality[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    detailedAddress: '',
    referencePoint: '',
    mapLocation: '',
    mapUrl: '',
  });

  useEffect(() => {
    // Load cart items from localStorage
    const savedCart = localStorage.getItem('cartItems');
    const savedCount = localStorage.getItem('cartItemsCount');
    
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    if (savedCount) {
      setCartItemsCount(parseInt(savedCount));
    }

    // If cart is empty, redirect to products
    if (!savedCart || JSON.parse(savedCart).length === 0) {
      navigate('/products');
    }
  }, [navigate]);

  const getTotalPrice = () => {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingCost = deliveryType === 'delivery' ? 4 : 0;
    return subtotal + shippingCost;
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Update municipalities when department changes
  useEffect(() => {
    if (selectedDepartment) {
      const department = elSalvadorDepartments.find(dept => dept.id === selectedDepartment);
      if (department) {
        setAvailableMunicipalities(department.municipalities);
        setSelectedMunicipality(''); // Reset municipality selection
      }
    } else {
      setAvailableMunicipalities([]);
      setSelectedMunicipality('');
    }
  }, [selectedDepartment]);

  const handleInputChange = (field: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address: string; mapUrl: string }) => {
    setCustomerData(prev => ({
      ...prev,
      mapLocation: location.address,
      mapUrl: location.mapUrl
    }));
  };

  const validateForm = () => {
    const { firstName, lastName, email, phone } = customerData;
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      toast({
        title: "Datos requeridos",
        description: "Por favor completa nombre, apellido, email y teléfono.",
        variant: "destructive",
      });
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido.",
        variant: "destructive",
      });
      return false;
    }

    if (deliveryType === 'pickup' && !selectedDeliveryPoint) {
      toast({
        title: "Punto de entrega requerido",
        description: "Por favor selecciona un punto de entrega.",
        variant: "destructive",
      });
      return false;
    }

    if (deliveryType === 'delivery') {
      const { detailedAddress, referencePoint, mapLocation } = customerData;
      if (!selectedDepartment || !selectedMunicipality || !detailedAddress.trim() || !referencePoint.trim()) {
        toast({
          title: "Datos de entrega requeridos",
          description: "Por favor completa todos los datos de entrega obligatorios.",
          variant: "destructive",
        });
        return false;
      }

      // Validate that map location is selected for home delivery
      if (!mapLocation.trim()) {
        toast({
          title: "Ubicación en mapa requerida",
          description: "Por favor selecciona la ubicación exacta de entrega en el mapa.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setIsProcessingPayment(true);

    try {
      const orderReference = `ORDER-${Date.now()}`;
      
      // Store reference in localStorage for fallback
      localStorage.setItem('currentOrderReference', orderReference);
      
      // Prepare customer address for delivery
      const customerAddress = deliveryType === 'delivery' 
        ? customerData.detailedAddress
        : undefined;

      // Create order in database with cart items
      const orderData = {
        customer_name: `${customerData.firstName} ${customerData.lastName}`,
        customer_email: customerData.email,
        customer_phone: customerData.phone || '',
        customer_address: customerAddress || '',
        product_id: cartItems[0]?.id, // Keep for backward compatibility
        quantity: cartItems.reduce((total, item) => total + item.quantity, 0),
        total_amount: getTotalPrice(),
        payment_method: paymentMethod === 'card' ? 'credit-debit' : 'cash',
        wompi_reference: paymentMethod === 'card' ? orderReference : undefined,
        cart_items: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const order = await orderService.createOrder(orderData);

      if (paymentMethod === 'card') {
        // Process WOMPI payment
        const paymentData = {
          amount: getTotalPrice(),
          currency: 'USD',
          reference: orderReference,
          customerEmail: orderData.customer_email,
          customerName: orderData.customer_name,
          customerPhone: customerData.phone || undefined,
          redirectUrl: `${window.location.origin}/payment/success`,
        };

        const paymentResponse = await wompiService.createPaymentLink(paymentData);
        
        // Update order with WOMPI payment link info
        await orderService.updateOrderPayment(order.id, {
          payment_status: 'processing',
          wompi_payment_link_id: paymentResponse.data.id,
        });

        // Create payment record
        await orderService.createPaymentRecord({
          order_id: order.id,
          amount: getTotalPrice(),
          payment_method: 'credit-debit',
          processor_reference: orderReference,
          processor_payment_link: paymentResponse.data.payment_link_url,
        });

        // Clear cart before redirecting
        localStorage.removeItem('cartItems');
        localStorage.removeItem('cartItemsCount');

        // Redirect to WOMPI checkout
        window.location.href = paymentResponse.data.payment_link_url;
      } else {
        // Handle cash payment
        await orderService.updateOrderPayment(order.id, {
          payment_status: 'pending',
        });

        // Create payment record for cash
        await orderService.createPaymentRecord({
          order_id: order.id,
          amount: getTotalPrice(),
          payment_method: 'cash',
        });

        toast({
          title: "¡Pedido realizado!",
          description: "Tu pedido ha sido enviado correctamente. Te contactaremos pronto.",
        });
        
        // Clear cart and redirect
        localStorage.removeItem('cartItems');
        localStorage.removeItem('cartItemsCount');
        navigate('/');
      }
    } catch (err) {
      console.error('Error processing order:', err);
      toast({
        title: "Error en el pedido",
        description: err instanceof Error ? err.message : 'Error al procesar el pedido',
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#091024] via-slate-800 to-white">
      <Header cartItemsCount={cartItemsCount} onCartClick={() => navigate('/cart')} />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-white hover:text-[#3bc8da] mb-8 transition-colors bg-[#091024]/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-xl border border-[#3bc8da]/30"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Volver al Carrito</span>
        </button>

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-4 flex items-center justify-center gap-3">
            <CheckCircle className="w-10 h-10 text-[#3bc8da]" />
            Hacer Pedido
          </h1>
          <p className="text-gray-300 text-lg">Completa tu información para finalizar el pedido</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Information */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-[#3bc8da]/20">
              <h2 className="text-2xl font-bold text-[#091024] mb-6 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#3bc8da]" />
                Información Personal
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={customerData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Tu nombre"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    value={customerData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Tu apellido"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="tu@email.com"
                    className="mt-2"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="phone">Teléfono Celular *</Label>
                  <Input
                    id="phone"
                    value={customerData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Ej: 7123-4567"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Type */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-[#3bc8da]/20">
              <h2 className="text-2xl font-bold text-[#091024] mb-6 flex items-center gap-3">
                <Truck className="w-6 h-6 text-[#3bc8da]" />
                Tipo de Entrega
              </h2>
              
              <RadioGroup value={deliveryType} onValueChange={(value: 'pickup' | 'delivery') => setDeliveryType(value)}>
                <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-gray-200 hover:border-[#3bc8da] transition-colors">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <div className="flex-1">
                    <Label htmlFor="pickup" className="font-medium text-lg cursor-pointer">
                      Punto de Entrega Gratuito
                    </Label>
                    <p className="text-gray-600 text-sm">Retira tu pedido en uno de nuestros puntos de entrega</p>
                  </div>
                  <MapPin className="w-6 h-6 text-[#3fdb70]" />
                </div>
                
                <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-gray-200 hover:border-[#3bc8da] transition-colors">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <div className="flex-1">
                    <Label htmlFor="delivery" className="font-medium text-lg cursor-pointer">
                      Envío a Domicilio (+$4.00)
                    </Label>
                    <p className="text-gray-600 text-sm">Enviamos a todo El Salvador</p>
                  </div>
                  <Truck className="w-6 h-6 text-[#3bc8da]" />
                </div>
              </RadioGroup>

              {/* Delivery Point Selection */}
              {deliveryType === 'pickup' && (
                <div className="mt-6">
                  <Label>Selecciona tu punto de entrega *</Label>
                  <Select value={selectedDeliveryPoint} onValueChange={setSelectedDeliveryPoint}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Elige un punto de entrega" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {deliveryPoints.map((point) => (
                        <SelectItem key={point.id} value={point.id}>
                          <div>
                            <div className="font-medium">{point.name}</div>
                            <div className="text-sm text-gray-600">{point.address}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Delivery Address */}
              {deliveryType === 'delivery' && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Departamento *</Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecciona tu departamento" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {elSalvadorDepartments.map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="municipality">Municipio *</Label>
                      <Select 
                        value={selectedMunicipality} 
                        onValueChange={setSelectedMunicipality}
                        disabled={!selectedDepartment}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={selectedDepartment ? "Selecciona tu municipio" : "Primero selecciona un departamento"} />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {availableMunicipalities.map((municipality) => (
                            <SelectItem key={municipality.id} value={municipality.id}>
                              {municipality.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="detailedAddress">Dirección Detallada *</Label>
                    <Textarea
                      id="detailedAddress"
                      value={customerData.detailedAddress}
                      onChange={(e) => handleInputChange('detailedAddress', e.target.value)}
                      placeholder="Calle, número de casa, colonia, etc."
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="referencePoint">Punto de Referencia *</Label>
                    <Input
                      id="referencePoint"
                      value={customerData.referencePoint}
                      onChange={(e) => handleInputChange('referencePoint', e.target.value)}
                      placeholder="Ej: Casa verde, frente al parque"
                      className="mt-2"
                    />
                  </div>
                  
                  <LocationSelector
                    onLocationSelect={handleLocationSelect}
                    currentLocation={customerData.mapLocation}
                    isRequired={true}
                  />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-[#3bc8da]/20">
              <h2 className="text-2xl font-bold text-[#091024] mb-6 flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-[#3bc8da]" />
                Método de Pago
              </h2>
              
              <RadioGroup value={paymentMethod} onValueChange={(value: 'cash' | 'card') => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-gray-200 hover:border-[#3bc8da] transition-colors">
                  <RadioGroupItem value="cash" id="cash" />
                  <div className="flex-1">
                    <Label htmlFor="cash" className="font-medium text-lg cursor-pointer">
                      Contra Entrega
                    </Label>
                    <p className="text-gray-600 text-sm">Paga cuando recibas tu pedido</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-gray-200 hover:border-[#3bc8da] transition-colors">
                  <RadioGroupItem value="card" id="card" />
                  <div className="flex-1">
                    <Label htmlFor="card" className="font-medium text-lg cursor-pointer">
                      Tarjeta de Débito/Crédito
                    </Label>
                    <p className="text-gray-600 text-sm">Pago seguro en línea</p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border-2 border-[#3bc8da]/20 sticky top-8">
              <h2 className="text-xl font-bold text-[#091024] mb-6">Resumen del Pedido</h2>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-[#091024]">{item.name}</h4>
                      <p className="text-xs text-gray-600">{item.console}</p>
                      <p className="text-sm font-bold text-[#3fdb70]">
                        ${item.price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pricing */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-[#091024]">${getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span className="font-medium text-[#091024]">
                    {deliveryType === 'delivery' ? '$4.00' : 'Gratis'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-[#091024]">Total</span>
                    <span className="text-[#3fdb70]">${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={isProcessingPayment}
                className="w-full bg-gradient-to-r from-[#3bc8da] to-[#3fdb70] hover:from-[#3fdb70] hover:to-[#3bc8da] text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg h-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isProcessingPayment ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {paymentMethod === 'card' ? 'Procesando Pago...' : 'Creando Pedido...'}
                  </div>
                ) : (
                  'Confirmar Pedido'
                )}
              </Button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Al confirmar tu pedido, aceptas nuestros términos y condiciones
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
