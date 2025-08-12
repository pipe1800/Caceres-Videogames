import React from 'react';
import { MapPin, CreditCard, Truck, Shield, Gamepad2, Star, Zap, Search } from 'lucide-react';

type HeroProps = {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
};

const Hero = ({ searchQuery = '', onSearchChange, onSearchSubmit }: HeroProps) => {
  return (
    <section className="relative bg-[#091024] text-white py-16 sm:py-20 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-[#3bc8da]/30 rounded-lg rotate-12 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 border-2 border-[#f3cb49]/30 rounded-full animate-bounce"></div>
        <div className="absolute bottom-20 left-32 w-12 h-12 bg-[#d93d34]/20 rounded-lg rotate-45 animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-8 h-8 bg-[#3fdb70]/30 rounded-full animate-bounce"></div>
        
        {/* Gaming Pattern */}
        <div className="absolute top-20 right-1/4 opacity-10">
          <Gamepad2 className="w-32 h-32 text-[#3bc8da] rotate-12" />
        </div>
        <div className="absolute bottom-16 left-1/4 opacity-10">
          <Gamepad2 className="w-24 h-24 text-[#f3cb49] -rotate-12" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Heading with Gaming Aesthetic */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-1 w-16 bg-gradient-to-r from-[#3bc8da] to-[#f3cb49] rounded"></div>
              <Star className="w-6 h-6 text-[#f3cb49] animate-pulse" />
              <div className="h-1 w-16 bg-gradient-to-r from-[#f3cb49] to-[#3bc8da] rounded"></div>
            </div>
            
            <h2 className="text-6xl font-black mb-6 leading-tight">
              <span className="text-white">Tu </span>
              <span className="bg-gradient-to-r from-[#3bc8da] to-[#f3cb49] bg-clip-text text-transparent">
                gaming store
              </span>
              <span className="text-white"> de confianza</span>
            </h2>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-xl text-gray-300">en</span>
              <span className="text-2xl font-bold text-[#f3cb49] border-2 border-[#f3cb49] px-4 py-1 rounded-lg">
                El Salvador
              </span>
              <Zap className="w-6 h-6 text-[#3fdb70] animate-pulse" />
            </div>

            {/* Search bar under title */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit?.();
              }}
              className="mx-auto max-w-xl w-full px-0"
              role="search"
              aria-label="Buscar productos"
            >
              <div className="flex items-stretch gap-2 bg-white/10 rounded-xl p-1 backdrop-blur-sm border border-white/10">
                <div className="flex items-center px-3 text-white/80">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="search"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="flex-1 bg-transparent placeholder-white/60 text-white focus:outline-none py-2 px-1 text-base sm:text-lg"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] hover:from-[#3bc8da] hover:to-[#3fdb70] text-[#091024] font-bold px-4 sm:px-6 py-2 rounded-lg"
                >
                  Buscar
                </button>
              </div>
            </form>
          </div>

          <p className="text-xl mb-12 text-gray-300 max-w-3xl mx-auto leading-relaxed">
            <span className="font-semibold text-[#3bc8da]">+14 categorías</span> de productos gaming. 
            Desde <span className="text-[#3fdb70]">Nintendo Switch</span> hasta 
            <span className="text-[#f3cb49]"> PlayStation</span> y 
            <span className="text-[#d93d34]"> Xbox</span>.
          </p>

          {/* Gaming Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16">
            <div className="group relative h-full">
              <div className="h-full bg-gradient-to-br from-[#3fdb70]/20 to-[#3fdb70]/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#3fdb70]/30 hover:border-[#3fdb70]/60 transition-all duration-300 hover:scale-105 flex flex-col items-center text-center">
                <div className="bg-[#3fdb70] p-2.5 sm:p-3 rounded-full w-fit mx-auto mb-3 sm:mb-4 group-hover:animate-bounce">
                  <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-[#091024]" />
                </div>
                <h3 className="font-bold text-sm sm:text-lg mb-1.5 sm:mb-2 text-[#3fdb70]">Envío Gratis</h3>
                <p className="text-xs sm:text-sm text-gray-300">En puntos de entrega</p>
              </div>
            </div>

            <div className="group relative h-full">
              <div className="h-full bg-gradient-to-br from-[#f3cb49]/20 to-[#f3cb49]/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#f3cb49]/30 hover:border-[#f3cb49]/60 transition-all duration-300 hover:scale-105 flex flex-col items-center text-center">
                <div className="bg-[#f3cb49] p-2.5 sm:p-3 rounded-full w-fit mx-auto mb-3 sm:mb-4 group-hover:animate-bounce">
                  <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-[#091024]" />
                </div>
                <h3 className="font-bold text-sm sm:text-lg mb-1.5 sm:mb-2 text-[#f3cb49]">Múltiples Pagos</h3>
                <p className="text-xs sm:text-sm text-gray-300">Efectivo, tarjetas, PayPal</p>
              </div>
            </div>

            <div className="group relative h-full">
              <div className="h-full bg-gradient-to-br from-[#3bc8da]/20 to-[#3bc8da]/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#3bc8da]/30 hover:border-[#3bc8da]/60 transition-all duration-300 hover:scale-105 flex flex-col items-center text-center">
                <div className="bg-[#3bc8da] p-2.5 sm:p-3 rounded-full w-fit mx-auto mb-3 sm:mb-4 group-hover:animate-bounce">
                  <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-[#091024]" />
                </div>
                <h3 className="font-bold text-sm sm:text-lg mb-1.5 sm:mb-2 text-[#3bc8da]">Todo El Salvador</h3>
                <p className="text-xs sm:text-sm text-gray-300">Envíos nacionales $4</p>
              </div>
            </div>

            <div className="group relative h-full">
              <div className="h-full bg-gradient-to-br from-[#d93d34]/20 to-[#d93d34]/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#d93d34]/30 hover:border-[#d93d34]/60 transition-all duration-300 hover:scale-105 flex flex-col items-center text-center">
                <div className="bg-[#d93d34] p-2.5 sm:p-3 rounded-full w-fit mx-auto mb-3 sm:mb-4 group-hover:animate-bounce">
                  <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="font-bold text-sm sm:text-lg mb-1.5 sm:mb-2 text-[#d93d34]">100% Originales</h3>
                <p className="text-xs sm:text-sm text-gray-300">Productos auténticos</p>
              </div>
            </div>
          </div>

          {/* CTA with Gaming Style */}
          <div className="mt-16">
            <button className="group relative bg-gradient-to-r from-[#3fdb70] to-[#3bc8da] hover:from-[#3bc8da] hover:to-[#3fdb70] text-[#091024] px-12 py-4 rounded-2xl text-lg font-black transition-all duration-300 transform hover:scale-105 shadow-2xl">
              <span className="relative z-10 flex items-center gap-3">
                <Gamepad2 className="w-6 h-6 group-hover:animate-pulse" />
                Ver Catálogo Completo
                <Star className="w-5 h-5 group-hover:animate-spin" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
