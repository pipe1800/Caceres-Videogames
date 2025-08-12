import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import ProductSection from '@/components/ProductSection';
import CompanyInfo from '@/components/CompanyInfo';
import Footer from '@/components/Footer';
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image_urls: string[];
  console: string;
  is_new: boolean;
  is_on_sale: boolean;
  in_stock: boolean;
  stock_count: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
    
    // Load cart count from localStorage
    const savedCartCount = localStorage.getItem('cartItemsCount');
    if (savedCartCount) {
      setCartItemsCount(parseInt(savedCartCount));
    }
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch new products (including out of stock)
      const { data: newData } = await supabase
        .from('products')
        .select('*')
        .eq('is_new', true)
        // Remove .eq('in_stock', true) to show all products
        .limit(4);

      // Fetch sale products (including out of stock)
      const { data: saleData } = await supabase
        .from('products')
        .select('*')
        .eq('is_on_sale', true)
        // Remove .eq('in_stock', true) to show all products
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
    // Find the product to get its details for the toast
    const allProducts = [...newProducts, ...saleProducts];
    const product = allProducts.find(p => p.id === productId);
    
    // Check if product is in stock
    if (!product?.in_stock || product?.stock_count === 0) {
      toast({
        title: "Producto agotado",
        description: "Este producto está fuera de stock.",
        variant: "destructive"
      });
      return;
    }
    
    // Get existing cart items
    const existingCart = localStorage.getItem('cartItems');
    const cartItems = existingCart ? JSON.parse(existingCart) : [];
    
    // Check if product already exists in cart
    const existingItemIndex = cartItems.findIndex((item: any) => item.id === productId);
    
    // Check if adding one more would exceed stock
    const currentQuantityInCart = existingItemIndex > -1 ? cartItems[existingItemIndex].quantity : 0;
    if (currentQuantityInCart >= product.stock_count) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${product.stock_count} unidades disponibles.`,
        variant: "destructive"
      });
      return;
    }
    
    setCartItemsCount(prev => prev + 1);
    
    if (existingItemIndex > -1) {
      // Increase quantity
      cartItems[existingItemIndex].quantity += 1;
    } else {
      // Add new item
      cartItems.push({
        id: productId,
        name: product?.name || 'Producto',
        price: product?.price || 0,
        image: product?.image_urls[0] || '',
        console: product?.console || '',
        quantity: 1
      });
    }
    
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    localStorage.setItem('cartItemsCount', (cartItemsCount + 1).toString());
    
    toast({
      title: "Producto agregado al carrito",
      description: `${product?.name || 'El producto'} ha sido agregado a tu carrito.`,
    });
    
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
      isOnSale: product.is_on_sale,
      inStock: product.in_stock,
      stockCount: product.stock_count
    }));
  };

  // Optionally filter in-page sections by search query
  const filteredNew = newProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredSale = saleProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length === 0) return;
    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
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
      <Hero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />
      
      {/* Product Sections with alternating backgrounds */}
      <div className="bg-white/95 backdrop-blur-sm">
        {newProducts.length > 0 && (
          <ProductSection 
            title="🆕 Productos Nuevos"
            products={transformProducts(filteredNew)}
            onAddToCart={handleAddToCart}
          />
        )}
      </div>
      
      <div className="bg-[#091024]/10">
        {saleProducts.length > 0 && (
          <ProductSection 
            title="🔥 Ofertas Especiales"
            products={transformProducts(filteredSale)}
            onAddToCart={handleAddToCart}
          />
        )}
      </div>

      {/* Lo más vendido - placeholder */}
      <section className="bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[#091024]">Lo más vendido</h2>
            <p className="text-gray-600">Próximamente</p>
          </div>
          {/* Intentionally left empty for now */}
        </div>
      </section>
      
      <div className="bg-white/95 backdrop-blur-sm">
        <CompanyInfo />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
