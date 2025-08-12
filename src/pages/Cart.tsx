import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  console: string;
  quantity: number;
  stockCount?: number; // Add stock information
}

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [stockData, setStockData] = useState<{[key: string]: number}>({});
  const [isRefreshingStock, setIsRefreshingStock] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load cart items from localStorage
    const savedCart = localStorage.getItem('cartItems');
    const savedCount = localStorage.getItem('cartItemsCount');
    
    if (savedCart) {
      const items = JSON.parse(savedCart);
      setCartItems(items);
      // Fetch current stock for all cart items
      fetchStockData(items);
    }
    if (savedCount) {
      setCartItemsCount(parseInt(savedCount));
    }
  }, []);

  const fetchStockData = async (items: CartItem[]) => {
    try {
      setIsRefreshingStock(true);
      const productIds = items.map(item => item.id);
      const { data, error } = await supabase
        .from('products')
        .select('id, stock_count, in_stock')
        .in('id', productIds);

      if (error) throw error;

      const stockMap: {[key: string]: number} = {};
      data?.forEach(product => {
        stockMap[product.id] = product.stock_count || 0;
      });
      setStockData(stockMap);

      // Auto-adjust quantities that exceed stock
      const adjustedItems = items.map(item => {
        const availableStock = stockMap[item.id] || 0;
        if (item.quantity > availableStock) {
          toast({
            title: "Cantidad ajustada",
            description: `La cantidad de "${item.name}" se ajustó a ${availableStock} por stock limitado.`,
          });
          return { ...item, quantity: Math.max(0, availableStock) };
        }
        return item;
      }).filter(item => item.quantity > 0); // Remove items with 0 quantity

      if (adjustedItems.length !== items.length || 
          adjustedItems.some((item, index) => item.quantity !== items[index]?.quantity)) {
        setCartItems(adjustedItems);
        localStorage.setItem('cartItems', JSON.stringify(adjustedItems));
        
        const totalCount = adjustedItems.reduce((sum, item) => sum + item.quantity, 0);
        setCartItemsCount(totalCount);
        localStorage.setItem('cartItemsCount', totalCount.toString());
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setIsRefreshingStock(false);
    }
  };

  const refreshStock = () => {
    if (cartItems.length > 0) {
      fetchStockData(cartItems);
      toast({
        title: "Stock actualizado",
        description: "La información de stock ha sido actualizada.",
      });
    }
  };

  const updateCart = (newCartItems: CartItem[]) => {
    setCartItems(newCartItems);
    localStorage.setItem('cartItems', JSON.stringify(newCartItems));
    
    const totalCount = newCartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartItemsCount(totalCount);
    localStorage.setItem('cartItemsCount', totalCount.toString());
  };

  const removeItem = (id: string) => {
    const newCartItems = cartItems.filter(item => item.id !== id);
    updateCart(newCartItems);
    
    toast({
      title: "Producto eliminado",
      description: "El producto ha sido eliminado del carrito.",
    });
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }

    // Check stock limit
    const availableStock = stockData[id] || 0;
    if (newQuantity > availableStock) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${availableStock} unidades disponibles de este producto.`,
        variant: "destructive"
      });
      return;
    }

    const newCartItems = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    updateCart(newCartItems);
  };

  const clearCart = () => {
    setCartItems([]);
    setCartItemsCount(0);
    localStorage.removeItem('cartItems');
    localStorage.removeItem('cartItemsCount');
    
    toast({
      title: "Carrito vaciado",
      description: "Todos los productos han sido eliminados del carrito.",
    });
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito antes de proceder al checkout.",
        variant: "destructive",
      });
      return;
    }

    // Check stock availability for all items
    const outOfStockItems = cartItems.filter(item => {
      const availableStock = stockData[item.id] || 0;
      return item.quantity > availableStock || availableStock === 0;
    });

    if (outOfStockItems.length > 0) {
      toast({
        title: "Problemas de stock",
        description: `Algunos productos en tu carrito no tienen suficiente stock disponible. Por favor, ajusta las cantidades.`,
        variant: "destructive",
      });
      return;
    }

    // Navigate to checkout page with cart data
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#091024] via-slate-800 to-white">
      <Header cartItemsCount={cartItemsCount} onCartClick={() => {}} />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white hover:text-[#3bc8da] mb-8 transition-colors bg-[#091024]/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-xl border border-[#3bc8da]/30"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Volver</span>
        </button>

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 sm:mb-4 flex items-center justify-center gap-3">
            <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-[#3bc8da]" />
            Mi Carrito
          </h1>
          <p className="text-gray-300 text-base sm:text-lg mb-4">
            {cartItems.length === 0 ? 'Tu carrito está vacío' : `${cartItems.length} producto${cartItems.length > 1 ? 's' : ''} en tu carrito`}
          </p>
          
          {/* Refresh Stock Button */}
          {cartItems.length > 0 && (
            <button
              onClick={refreshStock}
              disabled={isRefreshingStock}
              className="bg-[#3bc8da]/20 hover:bg-[#3bc8da]/30 text-white px-4 py-2 rounded-full transition-colors flex items-center gap-2 mx-auto border border-[#3bc8da]/50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingStock ? 'animate-spin' : ''}`} />
              {isRefreshingStock ? 'Actualizando...' : 'Actualizar Stock'}
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-[#3bc8da]/20">
              <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-[#091024] mb-4">Tu carrito está vacío</h2>
              <p className="text-gray-600 mb-6">¡Explora nuestros productos y encuentra algo increíble!</p>
              <button
                onClick={() => navigate('/products')}
                className="w-full bg-gradient-to-r from-[#3bc8da] to-[#3fdb70] hover:from-[#3fdb70] hover:to-[#3bc8da] text-white py-3 px-6 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Ver Productos
              </button>
            </div>
          </div>
        ) : (
          /* Cart with Items */
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
              
              {/* Cart Items - Full width on mobile */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border-2 border-[#3bc8da]/20">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Product Image */}
                      <div className="w-full sm:w-20 h-40 sm:h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="font-bold text-[#091024] text-base sm:text-lg mb-1">{item.name}</h3>
                        <p className="text-[#3bc8da] text-xs sm:text-sm font-medium mb-2">{item.console}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <span className="text-[#3fdb70] font-bold text-lg sm:text-xl">${item.price.toFixed(2)}</span>
                          {stockData[item.id] !== undefined && (
                            <div className={`flex items-center gap-1 text-xs sm:text-sm ${stockData[item.id] > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stockData[item.id] > 0 ? (
                                <>✓ {stockData[item.id]} disponibles</>
                              ) : (
                                <>✗ Sin stock</>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls and Remove - Mobile optimized */}
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="bg-gray-200 hover:bg-gray-300 text-[#091024] w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <span className="font-bold text-[#091024] w-6 sm:w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= (stockData[item.id] || 0)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors ${
                              item.quantity >= (stockData[item.id] || 0)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-[#3bc8da] hover:bg-[#3fdb70] text-white'
                            }`}
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="bg-[#d93d34] hover:bg-[#d93d34]/80 text-white p-1.5 sm:p-2 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 text-right">
                      <span className="text-gray-600 text-sm">Subtotal: </span>
                      <span className="font-bold text-[#091024] text-base sm:text-lg">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                {/* Clear Cart Button */}
                <button
                  onClick={clearCart}
                  className="w-full bg-[#d93d34]/10 hover:bg-[#d93d34]/20 text-[#d93d34] py-3 px-6 rounded-xl font-medium transition-colors border border-[#d93d34]/30"
                >
                  Vaciar Carrito
                </button>
              </div>

              {/* Order Summary - Sticky on desktop */}
              <div className="lg:col-span-1">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-[#3bc8da]/20 lg:sticky lg:top-8">
                  <h2 className="text-lg sm:text-xl font-bold text-[#091024] mb-4 sm:mb-6">Resumen del Pedido</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Productos ({cartItemsCount})</span>
                      <span className="font-medium text-[#091024]">${getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Envío</span>
                      <span className="font-medium text-[#3fdb70]">Gratis</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-xl font-bold">
                        <span className="text-[#091024]">Total</span>
                        <span className="text-[#3fdb70]">${getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-[#3bc8da] to-[#3fdb70] hover:from-[#3fdb70] hover:to-[#3bc8da] text-white py-3 sm:py-4 px-6 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Hacer Pedido
                  </button>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Envío gratis en puntos de entrega en todo El Salvador
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Cart;
