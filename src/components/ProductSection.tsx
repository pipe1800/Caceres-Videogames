import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import { Sparkles, Flame, Star, TrendingUp } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  console?: string;
  isNew?: boolean;
  isOnSale?: boolean;
}

interface ProductSectionProps {
  title: string;
  products: Product[];
  onAddToCart?: (productId: string) => void;
}

const ProductSection = ({ title, products, onAddToCart }: ProductSectionProps) => {
  const navigate = useNavigate();
  const isNewSection = title.includes('Nuevos');
  const isOfferSection = title.includes('Ofertas');

  const getSectionIcon = () => {
    if (isNewSection) return <Sparkles className="w-8 h-8 text-[#3fdb70]" />;
    if (isOfferSection) return <Flame className="w-8 h-8 text-[#d93d34]" />;
    return <Star className="w-8 h-8 text-[#f3cb49]" />;
  };

  const getSectionColor = () => {
    if (isNewSection) return '#3fdb70';
    if (isOfferSection) return '#d93d34';
    return '#f3cb49';
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-[#091024] rounded-lg rotate-12"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 border-4 border-[#3bc8da] rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#f3cb49] rounded-lg rotate-45"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header with Gaming Style */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className={`h-1 w-20 bg-gradient-to-r from-[${getSectionColor()}] to-[#3bc8da] rounded`}></div>
            {getSectionIcon()}
            <div className={`h-1 w-20 bg-gradient-to-r from-[#3bc8da] to-[${getSectionColor()}] rounded`}></div>
          </div>
          
          <h2 className="text-4xl font-black text-[#091024] mb-4">
            {title}
          </h2>
          
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className={`w-5 h-5 text-[${getSectionColor()}]`} />
            <p className="text-gray-600 text-lg">
              {isNewSection && "Los últimos lanzamientos que no puedes perderte"}
              {isOfferSection && "Precios increíbles por tiempo limitado"}
            </p>
          </div>
        </div>
        
        {/* Products Grid with Enhanced Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <div 
              key={product.id}
              className="transform hover:scale-105 transition-all duration-300"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <ProductCard
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                image={product.image}
                console={product.console}
                isNew={product.isNew}
                isOnSale={product.isOnSale}
                onAddToCart={() => onAddToCart?.(product.id)}
                productId={product.id}
              />
            </div>
          ))}
        </div>

        {/* Enhanced CTA Button */}
        <div className="text-center mt-12">
          <button 
            onClick={() => navigate('/products')}
            className="group relative bg-gradient-to-r from-[#091024] to-[#3bc8da] hover:from-[#3bc8da] hover:to-[#091024] text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <Star className="w-6 h-6 group-hover:animate-spin" />
              Ver Más Productos
              <TrendingUp className="w-5 h-5 group-hover:animate-bounce" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#3fdb70]/20 to-[#f3cb49]/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
