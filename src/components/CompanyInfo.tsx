import React from 'react';
import { MapPin, Phone, Facebook, MessageCircle } from 'lucide-react';

const CompanyInfo = () => {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#091024] text-center mb-12">
            Sobre Cáceres Videogames
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-[#3bc8da]">
              <h3 className="text-xl font-semibold text-[#091024] mb-4">Presencia Física</h3>
              <p className="text-gray-600 mb-4">
                Cáceres Videogames tiene presencia física en alianza con:
              </p>
              <div className="space-y-2">
                {/* Actualizado: nombre y enlaces a Google Maps */}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#d93d34]" />
                  <a
                    href="https://maps.app.goo.gl/LtssiKDYEX3v9QiMA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#091024] hover:text-[#3bc8da] transition-colors underline decoration-dotted"
                  >
                    ClickBox Plaza Mia Santa Elena
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#d93d34]" />
                  <a
                    href="https://maps.app.goo.gl/rd56Tn7obbbkKrtq8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#091024] hover:text-[#3bc8da] transition-colors underline decoration-dotted"
                  >
                    ClickBox Plaza Mundo Soyapango
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#d93d34]" />
                  <span>ClickBox Metrocentro San Salvador 11va Etapa (próximamente)</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-[#f3cb49]">
              <h3 className="text-xl font-semibold text-[#091024] mb-4">Canales de Venta</h3>
              <p className="text-gray-600 mb-4">
                Además de esta página web, también nos puedes encontrar en:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#3fdb70]" />
                  <a 
                    href="https://wa.me/50379866174" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#091024] hover:text-[#3fdb70] transition-colors"
                  >
                    WhatsApp Business
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-[#3bc8da]" />
                  <a 
                    href="https://www.facebook.com/share/1L2HRXV8s1/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#091024] hover:text-[#3bc8da] transition-colors"
                  >
                    Facebook Marketplace
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#f3cb49] w-4 h-4 inline-flex" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2C4.239 2 2 4.239 2 7v10c0 2.761 2.239 5 5 5h10c2.761 0 5-2.239 5-5V7c0-2.761-2.239-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm6.5-.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z"/></svg>
                  </span>
                  <a
                    href="https://www.instagram.com/caceres.videogames?igsh=ejZsN2Vsb2syZGhv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#091024] hover:text-[#f3cb49] transition-colors"
                  >
                    Instagram
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyInfo;
