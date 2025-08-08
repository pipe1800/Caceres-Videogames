import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, Zap, Crown, Heart, Shield, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image_urls: string[];
  console: string;
  category: string;
  is_new: boolean;
  is_on_sale: boolean;
  rating: number;
  review_count: number;
  features: string[];
  in_stock: boolean;
  stock_count: number;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      fetchProduct();
    }
    // Load cart count from localStorage
    const savedCartCount = localStorage.getItem('cartItemsCount');
    if (savedCartCount) {
      setCartItemsCount(parseInt(savedCartCount));
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } else {
        setProduct(data);
        fetchSimilarProducts(data.category);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSimilarProducts = async (category: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .neq('id', id)
        .limit(5);

      if (error) {
        console.error('Error fetching similar products:', error);
      } else {
        setSimilarProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching similar products:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#091024] via-slate-700 to-white flex items-center justify-center">
        <div className="text-xl text-white font-bold animate-pulse">Cargando producto...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#091024] via-slate-700 to-white text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Producto no encontrado</h1>
          <button 
            onClick={() => navigate('/products')}
            className="bg-[#3bc8da] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#3fdb70] transition-colors"
          >
            Ver todos los productos
          </button>
        </div>
      </div>
    );
  };

  const handleAddToCart = () => {
    if (product.in_stock) {
      const newCount = cartItemsCount + 1;
      setCartItemsCount(newCount);
      
      // Save to localStorage
      localStorage.setItem('cartItemsCount', newCount.toString());
      
      // Get existing cart items
      const existingCart = localStorage.getItem('cartItems');
      const cartItems = existingCart ? JSON.parse(existingCart) : [];
      
      // Check if product already exists in cart
      const existingItemIndex = cartItems.findIndex((item: any) => item.id === product.id);
      
      if (existingItemIndex > -1) {
        // Increase quantity
        cartItems[existingItemIndex].quantity += 1;
      } else {
        // Add new item
        cartItems.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image_urls[0],
          console: product.console,
          quantity: 1
        });
      }
      
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      
      toast({
        title: "Producto agregado al carrito",
        description: `${product.name} ha sido agregado a tu carrito.`,
      });
      
      console.log('Added to cart:', product.id);
    }
  };

  const handleImageClick = () => {
    setShowImageModal(true);
  };

  const handlePrevImage = () => {
    if (product && product.image_urls.length > 1) {
      setSelectedImage(prev => prev === 0 ? product.image_urls.length - 1 : prev - 1);
    }
  };

  const handleNextImage = () => {
    if (product && product.image_urls.length > 1) {
      setSelectedImage(prev => prev === product.image_urls.length - 1 ? 0 : prev + 1);
    }
  };

  const handlePrevThumbnail = () => {
    if (product && product.image_urls.length > 1) {
      const newIndex = selectedImage === 0 ? product.image_urls.length - 1 : selectedImage - 1;
      setSelectedImage(newIndex);
    }
  };

  const handleNextThumbnail = () => {
    if (product && product.image_urls.length > 1) {
      const newIndex = selectedImage === product.image_urls.length - 1 ? 0 : selectedImage + 1;
      setSelectedImage(newIndex);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#091024] via-slate-800 to-white">
      <Header cartItemsCount={cartItemsCount} onCartClick={() => console.log('Cart clicked')} />
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

        {/* Main Product Layout - Images take 2/3, Content takes 1/3 */}
        <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
          
          {/* Left Column - Product Info (1/3 width) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Product Header Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-[#3bc8da]/20">
              
              {/* Console Badge */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#091024] to-[#3bc8da] text-white px-6 py-3 rounded-full w-fit mb-6 shadow-lg">
                <Crown className="w-5 h-5 text-[#f3cb49]" />
                <span className="font-bold">{product.console}</span>
              </div>

              {/* Product Title */}
              <h1 className="text-3xl lg:text-4xl font-black text-[#091024] mb-6 leading-tight">{product.name}</h1>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <p className="text-gray-700 text-lg leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Price Section */}
              <div className="mb-6">
                {/* Old Price and Discount - Above new price */}
                {product.original_price && product.original_price > product.price && (
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-xl text-gray-400 line-through">${product.original_price.toFixed(2)}</span>
                    <span className="text-sm text-[#d93d34] font-bold bg-[#d93d34]/10 px-3 py-1 rounded-full">
                      -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                    </span>
                  </div>
                )}
                {/* New Price */}
                <span className="text-4xl lg:text-5xl font-black text-[#3fdb70]">${product.price.toFixed(2)}</span>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-4 h-4 rounded-full ${product.in_stock ? 'bg-[#3fdb70]' : 'bg-[#d93d34]'} animate-pulse`}></div>
                <span className={`font-bold text-lg ${product.in_stock ? 'text-[#3fdb70]' : 'text-[#d93d34]'}`}>
                  {product.in_stock ? `En stock (${product.stock_count} disponibles)` : 'Agotado'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.in_stock}
                className="flex-1 bg-gradient-to-r from-[#3bc8da] to-[#3fdb70] hover:from-[#3fdb70] hover:to-[#3bc8da] text-white py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <ShoppingCart className="w-6 h-6" />
                {product.in_stock ? 'Agregar al Carrito' : 'Agotado'}
              </button>
              <button className="bg-white border-2 border-[#3bc8da] text-[#3bc8da] hover:bg-[#3bc8da] hover:text-white p-4 rounded-2xl transition-all duration-300 shadow-lg transform hover:scale-105">
                <Heart className="w-6 h-6" />
              </button>
            </div>

            {/* Features Section - Mobile Only */}
            {product.features && product.features.length > 0 && (
              <div className="lg:hidden bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border-2 border-[#3bc8da]/20">
                <h2 className="text-xl font-bold text-[#091024] mb-4 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#3bc8da]" />
                  Características
                </h2>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700">
                      <div className="w-2 h-2 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] rounded-full flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Images (2/3 width) */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {/* Main Image with floating badges */}
            <div className="relative group">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border-2 border-[#3bc8da]/20 overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden cursor-pointer" onClick={handleImageClick}>
                  <img
                    src={product.image_urls[selectedImage] || 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&h=400&fit=crop'}
                    alt={product.name}
                    className="w-full h-[500px] object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Floating badges */}
                  {product.is_new && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg animate-bounce">
                      <Zap className="w-4 h-4" />
                      NUEVO
                    </div>
                  )}
                  {product.is_on_sale && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-[#d93d34] to-[#f3cb49] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                      OFERTA
                    </div>
                  )}

                  {/* Navigation arrows for main image */}
                  {product.image_urls.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevImage();
                        }}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextImage();
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Thumbnail Gallery with navigation */}
            {product.image_urls.length > 1 && (
              <div className="relative flex items-center gap-3 justify-center">
                <button
                  onClick={handlePrevThumbnail}
                  className="bg-white/90 hover:bg-white border-2 border-[#3bc8da]/30 hover:border-[#3bc8da] p-2 rounded-full transition-all shadow-lg"
                >
                  <ChevronLeft className="w-4 h-4 text-[#3bc8da]" />
                </button>
                
                <div className="flex gap-3">
                  {product.image_urls.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all transform hover:scale-110 ${
                        selectedImage === index 
                          ? 'border-[#3bc8da] shadow-lg shadow-[#3bc8da]/30' 
                          : 'border-white/50 hover:border-[#3bc8da]/70'
                      }`}
                    >
                      <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNextThumbnail}
                  className="bg-white/90 hover:bg-white border-2 border-[#3bc8da]/30 hover:border-[#3bc8da] p-2 rounded-full transition-all shadow-lg"
                >
                  <ChevronRight className="w-4 h-4 text-[#3bc8da]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Combined Features and Specifications Section with reduced height */}
        <div className="mt-8 bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border-2 border-[#3bc8da]/20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Features Section - Left Column */}
            {product.features && product.features.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#091024] mb-4 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#3bc8da]" />
                  Características
                </h2>
                <div className="space-y-2">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-gray-700 bg-gradient-to-br from-[#091024]/5 to-[#3bc8da]/5 rounded-xl p-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] rounded-full flex-shrink-0"></div>
                      <span className="font-medium text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications Section - Right Column */}
            <div>
              <h2 className="text-xl font-bold text-[#091024] mb-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#3bc8da]" />
                Información técnica
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-gray-700 bg-gradient-to-br from-[#091024]/5 to-[#3bc8da]/5 rounded-xl p-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] rounded-full flex-shrink-0"></div>
                  <span className="font-medium text-sm">SKU: {product.sku}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 bg-gradient-to-br from-[#091024]/5 to-[#3bc8da]/5 rounded-xl p-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] rounded-full flex-shrink-0"></div>
                  <span className="font-medium text-sm">Consola: {product.console}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 bg-gradient-to-br from-[#091024]/5 to-[#3bc8da]/5 rounded-xl p-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] rounded-full flex-shrink-0"></div>
                  <span className="font-medium text-sm">Categoría: {product.category}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 bg-gradient-to-br from-[#091024]/5 to-[#3bc8da]/5 rounded-xl p-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] rounded-full flex-shrink-0"></div>
                  <span className="font-medium text-sm">Precio: ${product.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-12 max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-4">Productos Similares</h2>
              <p className="text-gray-300 text-lg">Otros productos de la categoría {product.category}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {similarProducts.map((similarProduct) => (
                <ProductCard
                  key={similarProduct.id}
                  name={similarProduct.name}
                  price={similarProduct.price}
                  originalPrice={similarProduct.original_price}
                  image={similarProduct.image_urls[0] || 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop'}
                  console={similarProduct.console}
                  isNew={similarProduct.is_new}
                  isOnSale={similarProduct.is_on_sale}
                  onAddToCart={() => console.log('Added to cart:', similarProduct.id)}
                  productId={similarProduct.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95">
          <div className="relative">
            <DialogClose className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all">
              <X className="w-5 h-5" />
            </DialogClose>
            
            <div className="relative">
              <img
                src={product?.image_urls[selectedImage]}
                alt={product?.name}
                className="w-full max-h-[80vh] object-contain"
              />
              
              {/* Navigation arrows in modal */}
              {product && product.image_urls.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            
            {/* Image counter */}
            {product && product.image_urls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                {selectedImage + 1} / {product.image_urls.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProductDetail;
