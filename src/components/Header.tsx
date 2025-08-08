
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Phone, MapPin } from 'lucide-react';

interface HeaderProps {
  cartItemsCount?: number;
  onCartClick?: () => void;
}

const Header = ({ cartItemsCount = 0, onCartClick }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    }
    navigate('/cart');
  };

  return (
    <header className="bg-[#091024] text-white shadow-lg">
      {/* Top bar with contact info */}
      <div className="bg-[#d93d34] py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <a 
                href="https://wa.me/50379866174" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#f3cb49] transition-colors"
              >
                WhatsApp Business
              </a>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>Puntos de entrega en todo El Salvador</span>
            </div>
          </div>
          <div className="text-sm font-medium">
            🚚 Envío gratis en puntos de entrega
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Now clickable */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/lovable-uploads/6a8f9e46-cf47-49c9-b982-fc84228181bf.png" 
              alt="Cáceres Videogames Control" 
              className="w-12 h-12"
            />
            <img 
              src="/lovable-uploads/738b26e7-e66e-49ac-9cde-fc416ecf361e.png" 
              alt="Cáceres Videogames" 
              className="h-8"
            />
          </button>

          {/* Cart */}
          <button
            onClick={handleCartClick}
            className="relative bg-[#3fdb70] hover:bg-[#3fdb70]/90 text-[#091024] px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Carrito</span>
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#d93d34] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
