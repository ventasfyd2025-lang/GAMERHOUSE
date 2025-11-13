'use client';

import Link from 'next/link';
import { Facebook, Instagram, Mail, MessageCircle, MapPin, Phone } from 'lucide-react';

export default function AppFooterLight() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gamerhouse-navy to-blue-950 text-white border-t border-blue-800/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gamerhouse-red to-red-500 bg-clip-text text-transparent">
                GAMER HOUSE
              </h2>
              <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                Tu tienda especializada en Trading Card Games. Siempre los mejores precios en TCG de Chile.
              </p>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-200 border-b border-blue-800/30 pb-3">📂 Categorías</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/categoria/pokemon-tcg" className="text-gray-300 hover:text-gamerhouse-red hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <span className="w-1 h-1 bg-gamerhouse-red rounded-full"></span>
                  Pokémon TCG
                </Link>
              </li>
              <li>
                <Link href="/categoria/one-piece-tcg" className="text-gray-300 hover:text-gamerhouse-red hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <span className="w-1 h-1 bg-gamerhouse-red rounded-full"></span>
                  One Piece TCG
                </Link>
              </li>
              <li>
                <Link href="/categoria/yu-gi-oh" className="text-gray-300 hover:text-gamerhouse-red hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <span className="w-1 h-1 bg-gamerhouse-red rounded-full"></span>
                  Yu-Gi-Oh!
                </Link>
              </li>
              <li>
                <Link href="/productos" className="text-gray-300 hover:text-gamerhouse-red hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <span className="w-1 h-1 bg-gamerhouse-red rounded-full"></span>
                  Todos los Productos
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-200 border-b border-blue-800/30 pb-3">🏢 Compañía</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/contacto" className="text-gray-300 hover:text-gamerhouse-red hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <span className="w-1 h-1 bg-gamerhouse-red rounded-full"></span>
                  Contáctanos
                </Link>
              </li>
              <li>
                <Link href="/legal/privacidad" className="text-gray-300 hover:text-gamerhouse-red hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <span className="w-1 h-1 bg-gamerhouse-red rounded-full"></span>
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/terminos" className="text-gray-300 hover:text-gamerhouse-red hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2">
                  <span className="w-1 h-1 bg-gamerhouse-red rounded-full"></span>
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-200 border-b border-blue-800/30 pb-3">📞 Contacto</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 group">
                <Mail className="h-5 w-5 text-gamerhouse-red flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a href="mailto:contacto@gamerhouse.cl" className="text-gray-300 hover:text-gamerhouse-red transition-colors duration-200">
                  contacto@gamerhouse.cl
                </a>
              </div>
              <div className="flex items-center gap-3 group">
                <Phone className="h-5 w-5 text-gamerhouse-red flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a href="tel:+56920265061" className="text-gray-300 hover:text-gamerhouse-red transition-colors duration-200">
                  +56 9 2026 5061
                </a>
              </div>
              <div className="flex items-start gap-3 group">
                <MapPin className="h-5 w-5 text-gamerhouse-red flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-gray-300">Santiago Centro & Las Condes, Chile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social & Bottom */}
        <div className="border-t border-blue-800/30 pt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Social Links */}
            <div>
              <h4 className="text-sm font-bold text-gray-200 mb-4 uppercase tracking-widest">Síguenos en Redes</h4>
              <div className="flex gap-4">
                <a
                  href="https://www.instagram.com/gamerhouse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-gradient-to-br from-gamerhouse-red/20 to-red-600/20 hover:from-gamerhouse-red hover:to-red-600 text-gamerhouse-red hover:text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.facebook.com/gamerhouse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-gradient-to-br from-gamerhouse-red/20 to-red-600/20 hover:from-gamerhouse-red hover:to-red-600 text-gamerhouse-red hover:text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  title="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://wa.me/56920265061"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-gradient-to-br from-gamerhouse-red/20 to-red-600/20 hover:from-gamerhouse-red hover:to-red-600 text-gamerhouse-red hover:text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h4 className="text-sm font-bold text-gray-200 mb-4 uppercase tracking-widest">Métodos de Pago</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-blue-800/30 text-gray-300 text-xs rounded-lg border border-blue-700/30">💳 Mercado Pago</span>
                <span className="px-3 py-1.5 bg-blue-800/30 text-gray-300 text-xs rounded-lg border border-blue-700/30">🏦 Transferencia</span>
                <span className="px-3 py-1.5 bg-blue-800/30 text-gray-300 text-xs rounded-lg border border-blue-700/30">💵 Efectivo</span>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-blue-800/30 pt-8 text-center space-y-2">
            <p className="text-xs text-gray-400 font-medium">
              © {currentYear} GAMER HOUSE. Todos los derechos reservados.
            </p>
            <p className="text-xs text-gray-500">
              Dirección: Santiago Centro y Las Condes, Santiago, Chile
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
