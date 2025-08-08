
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import ProductSection from '@/components/ProductSection';
import CompanyInfo from '@/components/CompanyInfo';
import Footer from '@/components/Footer';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image_urls: string[];
  console: string;
  is_new: boolean;
  is_on_sale: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch new products
      const { data: newData } = await supabase
        .from('products')
        .select('*')
        .eq('is_new', true)
        .eq('in_stock', true)
        .limit(4);

      // Fetch sale products
      const { data: saleData } = await supabase
        .from('products')
        .select('*')
        .eq('is_on_sale', true)
        .eq('in_stock', true)
        .limit(4);

      setNewProducts(newData || []);
      setSaleProducts(saleData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCartClick = () => {
    console.log('Cart clicked');
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    console.log('Selected category:', category);
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  const handleAddToCart = (productId: string) => {
    setCartItemsCount(prev => prev + 1);
    console.log('Added product to cart:', productId);
  };

  // Transform products to match ProductSection interface
  const transformProducts = (products: Product[]) => {
    return products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.original_price,
      image: product.image_urls[0] || 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop',
      console: product.console,
      isNew: product.is_new,
      isOnSale: product.is_on_sale
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#091024] via-slate-800 to-white">
      <Header 
        cartItemsCount={cartItemsCount} 
        onCartClick={handleCartClick}
      />
      <Navigation 
        onCategorySelect={handleCategorySelect}
      />
      <Hero />
      
      {/* Product Sections with alternating backgrounds */}
      <div className="bg-white/95 backdrop-blur-sm">
        {newProducts.length > 0 && (
          <ProductSection 
            title="🆕 Productos Nuevos"
            products={transformProducts(newProducts)}
            onAddToCart={handleAddToCart}
          />
        )}
      </div>
      
      <div className="bg-[#091024]/10">
        {saleProducts.length > 0 && (
          <ProductSection 
            title="🔥 Ofertas Especiales"
            products={transformProducts(saleProducts)}
            onAddToCart={handleAddToCart}
          />
        )}
      </div>
      
      <div className="bg-white/95 backdrop-blur-sm">
        <CompanyInfo />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
