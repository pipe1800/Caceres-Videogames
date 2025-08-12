import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Zap, Crown, Eye, X } from 'lucide-react';

interface ProductCardProps {
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  console?: string;
  isNew?: boolean;
  isOnSale?: boolean;
  onAddToCart?: () => void;
  productId?: string;
  viewMode?: 'grid' | 'list';
  inStock?: boolean;
  stockCount?: number;
}

const ProductCard = ({ 
  name, 
  price, 
  originalPrice, 
  image, 
  console: gameConsole, 
  isNew, 
  isOnSale,
  onAddToCart,
  productId,
  viewMode = 'grid',
  inStock = true,
  stockCount = 0
}: ProductCardProps) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (productId) {
      navigate(`/products?productId=${productId}`);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-[#3bc8da]/50 flex">
        {/* Image */}
        <div className="relative w-48 h-32 overflow-hidden">
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isNew && (
              <div className="flex items-center gap-1 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                <Zap className="w-3 h-3" />
                NUEVO
              </div>
            )}
            {isOnSale && (
              <div className="flex items-center gap-1 bg-gradient-to-r from-[#d93d34] to-[#f3cb49] text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                <Star className="w-3 h-3" />
                OFERTA
              </div>
            )}
          </div>
        </div>

        {/* Content - stack with CTA at bottom */}
        <div className="flex-1 p-4 flex flex-col">
          <h3 className="text-[#091024] font-bold text-lg mb-1 group-hover:text-[#3bc8da] transition-colors cursor-pointer" onClick={handleViewDetails}>
            {name}
          </h3>
          {gameConsole && (
            <div className="flex items-center gap-1 mb-2">
              <Crown className="w-4 h-4 text-[#f3cb49]" />
              <p className="text-sm text-[#3bc8da] font-bold">{gameConsole}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-[#091024] group-hover:text-[#3bc8da] transition-colors">
              ${price.toFixed(2)}
            </span>
            {originalPrice && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
                <span className="text-xs text-[#d93d34] font-bold">
                  -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Low stock indicator above button */}
          {stockCount !== undefined && stockCount > 0 && stockCount <= 5 && inStock && (
            <p className="text-xs text-orange-500 font-semibold mt-2">
              ¡Solo quedan {stockCount} unidades!
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Add to Cart Button - last element */}
          <button
            onClick={onAddToCart}
            disabled={!inStock || stockCount === 0}
            className={`${
              !inStock || stockCount === 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#3bc8da] to-[#3fdb70] hover:from-[#3fdb70] hover:to-[#3bc8da]'
            } text-white py-3 px-6 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${
              inStock && stockCount > 0 ? 'transform hover:scale-105' : ''
            } shadow-lg self-start sm:self-end`}
          >
            {!inStock || stockCount === 0 ? (
              <>
                <X className="w-5 h-5" />
                <span>Agotado</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-[#3bc8da]/50 h-full flex flex-col">
      {/* Image Container with Overlay Effects */}
      <div className="relative overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-36 sm:h-48 object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
          onClick={handleViewDetails}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {/* View Details Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleViewDetails}
            className="bg-white/90 text-[#091024] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold transform scale-75 group-hover:scale-100 transition-transform duration-300 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Detalles
          </button>
        </div>
        {/* Enhanced Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {isNew && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] text-white px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
              <Zap className="w-3 h-3" />
              NUEVO
            </div>
          )}
          {isOnSale && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-[#d93d34] to-[#f3cb49] text-white px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg animate-pulse">
              <Star className="w-3 h-3" />
              OFERTA
            </div>
          )}
        </div>
        {/* Removed top-right console badge */}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5 flex flex-col gap-3 flex-1">
        <h3 className="text-[#091024] font-bold text-sm sm:text-base line-clamp-2 min-h-[2.25rem] sm:min-h-[3rem] group-hover:text-[#3bc8da] transition-colors cursor-pointer" onClick={handleViewDetails}>
          {name}
        </h3>
        {gameConsole && (
          <p className="text-xs sm:text-sm text-[#3bc8da] font-semibold -mt-2">{gameConsole}</p>
        )}
        {/* Price Section compact */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-[#091024] group-hover:text-[#3bc8da] transition-colors">
              ${price.toFixed(2)}
            </span>
            {originalPrice && (
              <div className="flex flex-col leading-tight">
                <span className="text-xs sm:text-sm text-gray-500 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-[#d93d34] font-bold">
                  -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stock indicator above button */}
        {stockCount !== undefined && stockCount > 0 && stockCount <= 5 && inStock && (
          <p className="text-[11px] sm:text-xs text-orange-500 mt-1.5 text-center font-semibold">
            ¡Solo quedan {stockCount} unidades!
          </p>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Add to Cart Button - last element */}
        <button
          onClick={onAddToCart}
          disabled={!inStock || stockCount === 0}
          className={`w-full ${
            !inStock || stockCount === 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-[#3bc8da] to-[#3fdb70] hover:from-[#3fdb70] hover:to-[#3bc8da]'
          } text-white py-2 sm:py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 transform ${
            inStock && stockCount > 0 ? 'hover:scale-105' : ''
          } shadow-lg group-hover:shadow-xl`}
        >
          {!inStock || stockCount === 0 ? (
            <>
              <X className="w-5 h-5" />
              <span>Agotado</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              <span>Agregar</span>
            </>
          )}
        </button>
      </div>

      {/* Corner Accent */}
      <div className="absolute top-0 right-0 w-0 h-0 border-l-[16px] sm:border-l-[20px] border-l-transparent border-t-[16px] sm:border-t-[20px] border-t-[#f3cb49] opacity-60"></div>
    </div>
  );
};

export default ProductCard;
