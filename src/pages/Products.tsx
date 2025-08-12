import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, Zap, Crown, Shield, ChevronLeft, ChevronRight, X, Heart } from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

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
  description?: string;
  features?: string[];
}

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [highlightProduct, setHighlightProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const productId = searchParams.get('productId');
  const categoryFilter = searchParams.get('category');

  useEffect(() => {
    const savedCartCount = localStorage.getItem('cartItemsCount');
    if (savedCartCount) setCartItemsCount(parseInt(savedCartCount));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, search]);

  useEffect(() => {
    if (productId) {
      fetchHighlightProduct(productId);
    } else {
      setHighlightProduct(null);
      setSimilarProducts([]);
    }
  }, [productId]);

  useEffect(() => {
    // keep local state in sync if URL changes externally
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      let query = supabase.from('products').select('*');
      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
        setSelectedCategory(categoryFilter);
      }
      if (search && search.trim().length > 0) {
        // Simple case-insensitive search on name using ilike
        query = query.ilike('name', `%${search.trim()}%`);
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

  const fetchHighlightProduct = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setHighlightProduct(data);
      setSelectedImage(0);
      fetchSimilarProducts(data.category, id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error fetching product:', error);
      setHighlightProduct(null);
    }
  };

  const fetchSimilarProducts = async (category: string, excludeId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .neq('id', excludeId)
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      setSimilarProducts(data || []);
    } catch (error) {
      console.error('Error fetching similar products:', error);
    }
  };

  const handleCartClick = () => {
    console.log('Cart clicked');
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const url = new URL(window.location.href);
    url.searchParams.set('category', category);
    url.searchParams.delete('productId');
    if (search) url.searchParams.set('search', search);
    window.history.pushState({}, '', url.toString());
    fetchProducts();
  };

  const addToCartWithChecks = (p: Product) => {
    if (!p.in_stock || p.stock_count === 0) {
      toast({ title: 'Producto agotado', description: 'Este producto está fuera de stock.', variant: 'destructive' });
      return;
    }
    const existingCart = localStorage.getItem('cartItems');
    const cartItems = existingCart ? JSON.parse(existingCart) : [];
    const existingItemIndex = cartItems.findIndex((item: any) => item.id === p.id);
    const currentQuantityInCart = existingItemIndex > -1 ? cartItems[existingItemIndex].quantity : 0;
    if (currentQuantityInCart >= p.stock_count) {
      toast({ title: 'Stock insuficiente', description: `Solo hay ${p.stock_count} unidades disponibles.`, variant: 'destructive' });
      return;
    }
    if (existingItemIndex > -1) {
      cartItems[existingItemIndex].quantity += 1;
    } else {
      cartItems.push({ id: p.id, name: p.name, price: p.price, image: p.image_urls[0], console: p.console, quantity: 1 });
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    const newCount = (parseInt(localStorage.getItem('cartItemsCount') || '0') + 1);
    localStorage.setItem('cartItemsCount', newCount.toString());
    setCartItemsCount(newCount);
    toast({ title: 'Producto agregado al carrito', description: `${p.name} ha sido agregado a tu carrito.` });
  };

  const handlePrevImage = () => {
    if (highlightProduct && highlightProduct.image_urls.length > 1) {
      setSelectedImage(prev => prev === 0 ? highlightProduct.image_urls.length - 1 : prev - 1);
    }
  };

  const handleNextImage = () => {
    if (highlightProduct && highlightProduct.image_urls.length > 1) {
      setSelectedImage(prev => prev === highlightProduct.image_urls.length - 1 ? 0 : prev + 1);
    }
  };

  const handlePrevThumbnail = () => {
    if (highlightProduct && highlightProduct.image_urls.length > 1) {
      const newIndex = selectedImage === 0 ? highlightProduct.image_urls.length - 1 : selectedImage - 1;
      setSelectedImage(newIndex);
    }
  };

  const handleNextThumbnail = () => {
    if (highlightProduct && highlightProduct.image_urls.length > 1) {
      const newIndex = selectedImage === highlightProduct.image_urls.length - 1 ? 0 : selectedImage + 1;
      setSelectedImage(newIndex);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    if (search.trim().length > 0) {
      url.searchParams.set('search', search.trim());
    } else {
      url.searchParams.delete('search');
    }
    url.searchParams.delete('productId');
    window.history.pushState({}, '', url.toString());
    fetchProducts();
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Search at top when not viewing a product */}
        {!highlightProduct && (
          <form onSubmit={handleSearchSubmit} className="mb-8">
            <div className="flex items-stretch gap-2 bg-white rounded-xl p-1 border border-gray-200 max-w-2xl mx-auto">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="flex-1 bg-transparent text-[#091024] placeholder-gray-500 focus:outline-none py-2 px-3 text-base"
              />
              <button type="submit" className="bg-[#3bc8da] hover:bg-[#3fdb70] text-white font-bold px-4 py-2 rounded-lg">
                Buscar
              </button>
            </div>
          </form>
        )}

        {/* Highlighted product details (from ProductDetail) when productId present */}
        {highlightProduct && (
          <div className="mb-12">
            <button
              onClick={() => {
                setSearchParams(prev => { prev.delete('productId'); return prev; });
                setHighlightProduct(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 text-[#091024] hover:text-[#3bc8da] mb-6 transition-colors bg-gray-100 px-4 py-2 rounded-full border border-[#3bc8da]/30 w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la lista
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
              {/* Left column: info */}
              <div className="col-span-1 lg:col-span-4 order-2 lg:order-1 space-y-6">
                <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-200">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-[#091024] to-[#3bc8da] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full w-fit mb-4 sm:mb-6 shadow-lg">
                    <Crown className="w-5 h-5 text-[#f3cb49]" />
                    <span className="font-bold text-sm sm:text-base">{highlightProduct.console}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#091024] mb-4 sm:mb-6 leading-tight">{highlightProduct.name}</h1>
                  {highlightProduct.description && (
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">{highlightProduct.description}</p>
                  )}
                  <div className="mb-4 sm:mb-6">
                    {highlightProduct.original_price && highlightProduct.original_price > highlightProduct.price && (
                      <div className="flex items-center gap-3 sm:gap-4 mb-2">
                        <span className="text-base sm:text-xl text-gray-400 line-through">${highlightProduct.original_price.toFixed(2)}</span>
                        <span className="text-xs sm:text-sm text-[#d93d34] font-bold bg-[#d93d34]/10 px-2 sm:px-3 py-1 rounded-full">
                          -{Math.round(((highlightProduct.original_price - highlightProduct.price) / highlightProduct.original_price) * 100)}% OFF
                        </span>
                      </div>
                    )}
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3fdb70]">${highlightProduct.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${highlightProduct.in_stock ? 'bg-[#3fdb70]' : 'bg-[#d93d34]'} animate-pulse`}></div>
                    <span className={`font-bold text-base sm:text-lg ${highlightProduct.in_stock ? 'text-[#3fdb70]' : 'text-[#d93d34]'}`}>
                      {highlightProduct.in_stock ? `En stock (${highlightProduct.stock_count} disponibles)` : 'Agotado'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => addToCartWithChecks(highlightProduct)}
                    disabled={!highlightProduct.in_stock}
                    className="flex-1 bg-gradient-to-r from-[#3bc8da] to-[#3fdb70] hover:from-[#3fdb70] hover:to-[#3bc8da] text-white py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                    {highlightProduct.in_stock ? 'Agregar al Carrito' : 'Agotado'}
                  </button>
                  <button className="bg-white border-2 border-[#3bc8da] text-[#3bc8da] hover:bg-[#3bc8da] hover:text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg transform hover:scale-105">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {highlightProduct.features && highlightProduct.features.length > 0 && (
                  <div className="lg:hidden bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
                    <h2 className="text-lg sm:text-xl font-bold text-[#091024] mb-3 sm:mb-4 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-[#3bc8da]" />
                      Características
                    </h2>
                    <ul className="space-y-2">
                      {highlightProduct.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3 text-gray-700">
                          <div className="w-2 h-2 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] rounded-full flex-shrink-0"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right column: images */}
              <div className="col-span-1 lg:col-span-8 order-1 lg:order-2 space-y-4">
                <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-200 overflow-hidden">
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={highlightProduct.image_urls[selectedImage] || ''}
                      alt={highlightProduct.name}
                      className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
                    />
                    {highlightProduct.is_new && (
                      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg">
                        <Zap className="w-4 h-4" />
                        NUEVO
                      </div>
                    )}
                  </div>
                </div>

                {highlightProduct.image_urls.length > 1 && (
                  <div className="relative flex items-center gap-2 sm:gap-3 justify-center px-8 sm:px-0">
                    <button onClick={handlePrevThumbnail} className="absolute left-0 sm:relative bg-white/90 hover:bg-white border p-1 sm:p-2 rounded-full transition-all shadow-lg z-10">
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 text-[#3bc8da]" />
                    </button>
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto max-w-[220px] sm:max-w-none">
                      {highlightProduct.image_urls.map((image, index) => (
                        <button key={index} onClick={() => setSelectedImage(index)} className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all transform hover:scale-110 flex-shrink-0 ${selectedImage === index ? 'border-[#3bc8da] shadow-lg shadow-[#3bc8da]/30' : 'border-white/50 hover:border-[#3bc8da]/70'}`}>
                          <img src={image} alt={`${highlightProduct.name} ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <button onClick={handleNextThumbnail} className="absolute right-0 sm:relative bg-white/90 hover:bg-white border p-1 sm:p-2 rounded-full transition-all shadow-lg">
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#3bc8da]" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Features + Specs combined card */}
            <div className="mt-8 bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {highlightProduct.features && highlightProduct.features.length > 0 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#091024] mb-3 sm:mb-4 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-[#3bc8da]" />
                      Características
                    </h2>
                    <div className="space-y-2">
                      {highlightProduct.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 text-gray-700 bg-gray-50 rounded-xl p-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] rounded-full flex-shrink-0"></div>
                          <span className="font-medium text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#091024] mb-3 sm:mb-4 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-[#3bc8da]" />
                    Información técnica
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-gray-700 bg-gray-50 rounded-xl p-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] rounded-full flex-shrink-0"></div>
                      <span className="font-medium text-sm">SKU: {highlightProduct.sku}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 bg-gray-50 rounded-xl p-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] rounded-full flex-shrink-0"></div>
                      <span className="font-medium text-sm">Consola: {highlightProduct.console}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 bg-gray-50 rounded-xl p-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] rounded-full flex-shrink-0"></div>
                      <span className="font-medium text-sm">Categoría: {highlightProduct.category}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 bg-gray-50 rounded-xl p-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] rounded-full flex-shrink-0"></div>
                      <span className="font-medium text-sm">Precio: ${highlightProduct.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Similar products */}
            {similarProducts.length > 0 && (
              <div className="mt-12">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-gray-900 mb-4">Productos Similares</h2>
                  <p className="text-gray-600 text-lg">Otros productos de la categoría {highlightProduct.category}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-stretch">
                  {similarProducts.map((sp) => (
                    <div key={sp.id} className="h-full">
                      <ProductCard
                        productId={sp.id}
                        name={sp.name}
                        price={sp.price}
                        originalPrice={sp.original_price}
                        image={sp.image_urls[0] || ''}
                        console={sp.console}
                        isNew={sp.is_new}
                        isOnSale={sp.is_on_sale}
                        inStock={sp.in_stock}
                        stockCount={sp.stock_count}
                        onAddToCart={() => addToCartWithChecks(sp)}
                      />
                    </div>
                  ))}
                </div>
                <div className="text-center mt-10">
                  <button
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('category', highlightProduct.category);
                      url.searchParams.delete('productId');
                      window.history.pushState({}, '', url.toString());
                      setHighlightProduct(null);
                      fetchProducts();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 bg-white text-[#091024] hover:bg-[#3bc8da] hover:text-white px-6 py-3 rounded-xl font-bold transition-colors border border-[#3bc8da]/30"
                  >
                    Ver más de {highlightProduct.category}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Catalog grid */}
        {!highlightProduct && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {selectedCategory ? `Productos de ${selectedCategory}` : 'Todos los Productos'}
              </h1>
              <p className="text-xl text-gray-600">Descubre nuestra colección completa de videojuegos</p>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">No se encontraron productos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-stretch">
                {products.map((p) => (
                  <div key={p.id} className="h-full">
                    <ProductCard
                      productId={p.id}
                      name={p.name}
                      price={p.price}
                      originalPrice={p.original_price}
                      image={p.image_urls[0] || ''}
                      console={p.console}
                      isNew={p.is_new}
                      isOnSale={p.is_on_sale}
                      inStock={p.in_stock}
                      stockCount={p.stock_count}
                      onAddToCart={() => addToCartWithChecks(p)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Image modal for highlight product */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95">
          <div className="relative">
            <DialogClose className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all">
              <X className="w-5 h-5" />
            </DialogClose>
            <div className="relative">
              <img src={highlightProduct?.image_urls[selectedImage]} alt={highlightProduct?.name} className="w-full max-h-[80vh] object-contain" />
              {highlightProduct && highlightProduct.image_urls.length > 1 && (
                <>
                  <button onClick={handlePrevImage} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={handleNextImage} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            {highlightProduct && highlightProduct.image_urls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                {selectedImage + 1} / {highlightProduct.image_urls.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Products;
