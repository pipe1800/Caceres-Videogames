
import React from 'react';
import { MapPin, CreditCard, Truck, Shield, Gamepad2, Star, Zap } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative bg-[#091024] text-white py-20 overflow-hidden">
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
          </div>

          <p className="text-xl mb-12 text-gray-300 max-w-3xl mx-auto leading-relaxed">
            <span className="font-semibold text-[#3bc8da]">+14 categorías</span> de productos gaming. 
            Desde <span className="text-[#3fdb70]">Nintendo Switch</span> hasta 
            <span className="text-[#f3cb49]"> PlayStation</span> y 
            <span className="text-[#d93d34]"> Xbox</span>.
          </p>

          {/* Gaming Features Grid */}
          <div className="grid md:grid-cols-4 gap-6 mt-16">
            <div className="group relative">
              <div className="bg-gradient-to-br from-[#3fdb70]/20 to-[#3fdb70]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#3fdb70]/30 hover:border-[#3fdb70]/60 transition-all duration-300 hover:scale-105">
                <div className="bg-[#3fdb70] p-3 rounded-full w-fit mx-auto mb-4 group-hover:animate-bounce">
                  <Truck className="w-8 h-8 text-[#091024]" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-[#3fdb70]">Envío Gratis</h3>
                <p className="text-sm text-gray-300">En puntos de entrega</p>
              </div>
            </div>

            <div className="group relative">
              <div className="bg-gradient-to-br from-[#f3cb49]/20 to-[#f3cb49]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f3cb49]/30 hover:border-[#f3cb49]/60 transition-all duration-300 hover:scale-105">
                <div className="bg-[#f3cb49] p-3 rounded-full w-fit mx-auto mb-4 group-hover:animate-bounce">
                  <CreditCard className="w-8 h-8 text-[#091024]" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-[#f3cb49]">Múltiples Pagos</h3>
                <p className="text-sm text-gray-300">Efectivo, tarjetas, PayPal</p>
              </div>
            </div>

            <div className="group relative">
              <div className="bg-gradient-to-br from-[#3bc8da]/20 to-[#3bc8da]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#3bc8da]/30 hover:border-[#3bc8da]/60 transition-all duration-300 hover:scale-105">
                <div className="bg-[#3bc8da] p-3 rounded-full w-fit mx-auto mb-4 group-hover:animate-bounce">
                  <MapPin className="w-8 h-8 text-[#091024]" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-[#3bc8da]">Todo El Salvador</h3>
                <p className="text-sm text-gray-300">Envíos nacionales $4</p>
              </div>
            </div>

            <div className="group relative">
              <div className="bg-gradient-to-br from-[#d93d34]/20 to-[#d93d34]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#d93d34]/30 hover:border-[#d93d34]/60 transition-all duration-300 hover:scale-105">
                <div className="bg-[#d93d34] p-3 rounded-full w-fit mx-auto mb-4 group-hover:animate-bounce">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-[#d93d34]">100% Originales</h3>
                <p className="text-sm text-gray-300">Productos auténticos</p>
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
