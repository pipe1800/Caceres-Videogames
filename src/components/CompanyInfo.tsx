
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
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#d93d34]" />
                  <span>ClickBox Santa Elena</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#d93d34]" />
                  <span>ClickBox Plaza Mundo Soyapango</span>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyInfo;
