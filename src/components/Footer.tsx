import React from 'react';
import { MessageCircle, Facebook, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#091024] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold text-[#3bc8da] mb-4">
              Cáceres Videogames
            </h3>
            <p className="text-gray-300 mb-4">
              Tu tienda de videojuegos de confianza en El Salvador. 
              Productos originales y los mejores precios.
            </p>
            <div className="flex gap-4">
              <a href="https://wa.me/50379866174" target="_blank" rel="noopener noreferrer" className="text-[#3fdb70] hover:text-[#3fdb70]/80">
                <MessageCircle className="w-6 h-6" />
              </a>
              <a href="https://www.facebook.com/share/1L2HRXV8s1/" target="_blank" rel="noopener noreferrer" className="text-[#3bc8da] hover:text-[#3bc8da]/80">
                <Facebook className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <a 
                  href="https://wa.me/50379866174" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#3fdb70] transition-colors"
                >
                  WhatsApp Business
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Todo El Salvador</span>
              </div>
            </div>
            <div className="mt-4">
              <h5 className="font-medium mb-2">Puntos de Entrega:</h5>
              <p className="text-sm text-gray-400">
                Metrocentro • Galerías • Torre Futura • Escalón • Santa Tecla • 
                Santa Elena • La Gran Vía • Antiguo Cuscatlán • 75 Av. Norte • 
                La Bernal • y más...
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Cáceres Videogames. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
