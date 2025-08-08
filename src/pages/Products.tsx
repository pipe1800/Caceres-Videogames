
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  original_price?: number;
  image_urls: string[];
  console: string;
  category: string;
  is_new: boolean;
  is_on_sale: boolean;
  rating: number;
  review_count: number;
  in_stock: boolean;
  stock_count: number;
}

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryFilter = searchParams.get('category');

  useEffect(() => {
    fetchProducts();
    
    // Load cart count from localStorage
    const savedCartCount = localStorage.getItem('cartItemsCount');
    if (savedCartCount) {
      setCartItemsCount(parseInt(savedCartCount));
    }
  }, [categoryFilter]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*');
      // Remove the .eq('in_stock', true) filter to show all products

      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
        setSelectedCategory(categoryFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCartClick = () => {
    console.log('Cart clicked');
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    // Update URL with category filter
    const url = new URL(window.location.href);
    url.searchParams.set('category', category);
    window.history.pushState({}, '', url.toString());
    fetchProducts();
  };

  const handleAddToCart = (productId: string) => {
    // Find the product to get its details for the toast
    const product = products.find(p => p.id === productId);
    
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-900">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header 
        cartItemsCount={cartItemsCount} 
        onCartClick={handleCartClick}
      />
      <Navigation 
        onCategorySelect={handleCategorySelect}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {categoryFilter ? `Productos de ${categoryFilter}` : 'Todos los Productos'}
          </h1>
          <p className="text-xl text-gray-600">
            Descubre nuestra colección completa de videojuegos
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No se encontraron productos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                productId={product.id}
                name={product.name}
                price={product.price}
                originalPrice={product.original_price}
                image={product.image_urls[0] || 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop'}
                console={product.console}
                isNew={product.is_new}
                isOnSale={product.is_on_sale}
                inStock={product.in_stock}
                stockCount={product.stock_count}
                onAddToCart={() => handleAddToCart(product.id)}
              />
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Products;
