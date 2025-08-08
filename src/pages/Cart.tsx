import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  console: string;
  quantity: number;
}

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const { toast } = useToast();

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
  }, []);

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
          <h1 className="text-4xl font-black text-white mb-4 flex items-center justify-center gap-3">
            <ShoppingBag className="w-10 h-10 text-[#3bc8da]" />
            Mi Carrito
          </h1>
          <p className="text-gray-300 text-lg">
            {cartItems.length === 0 ? 'Tu carrito está vacío' : `${cartItems.length} producto${cartItems.length > 1 ? 's' : ''} en tu carrito`}
          </p>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-[#3bc8da]/20">
                    <div className="flex items-center gap-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="font-bold text-[#091024] text-lg mb-1">{item.name}</h3>
                        <p className="text-[#3bc8da] text-sm font-medium mb-2">{item.console}</p>
                        <p className="text-2xl font-black text-[#3fdb70]">${item.price.toFixed(2)}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="bg-gray-200 hover:bg-gray-300 text-[#091024] w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-[#091024] w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="bg-[#3bc8da] hover:bg-[#3fdb70] text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="bg-[#d93d34] hover:bg-[#d93d34]/80 text-white p-2 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="mt-4 pt-4 border-t border-gray-200 text-right">
                      <span className="text-gray-600">Subtotal: </span>
                      <span className="font-bold text-[#091024] text-lg">${(item.price * item.quantity).toFixed(2)}</span>
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

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border-2 border-[#3bc8da]/20 sticky top-8">
                  <h2 className="text-xl font-bold text-[#091024] mb-6">Resumen del Pedido</h2>
                  
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
                    className="w-full bg-gradient-to-r from-[#3bc8da] to-[#3fdb70] hover:from-[#3fdb70] hover:to-[#3bc8da] text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
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
};

export default Cart;
