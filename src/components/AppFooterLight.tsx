'use client';

import Link from 'next/link';
import { Facebook, Instagram, Mail, MessageCircle, MapPin, Phone } from 'lucide-react';

export default function AppFooterLight() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gamerhouse-navy text-white border-t-4 border-gamerhouse-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">
                <span className="text-gamerhouse-gold">GAMER</span>
                <span className="text-white"> HOUSE</span>
              </h2>
              <p className="text-sm text-gray-300 mt-2">
                Tu tienda especializada en Trading Card Games. Siempre los mejores precios en TCG.
              </p>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-wider text-gamerhouse-gold">Categorías</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/categoria/pokemon-tcg" className="hover:text-gamerhouse-gold transition-colors">
                  Pokémon TCG
                </Link>
              </li>
              <li>
                <Link href="/categoria/one-piece-tcg" className="hover:text-gamerhouse-gold transition-colors">
                  One Piece TCG
                </Link>
              </li>
              <li>
                <Link href="/categoria/yu-gi-oh" className="hover:text-gamerhouse-gold transition-colors">
                  Yu-Gi-Oh!
                </Link>
              </li>
              <li>
                <Link href="/productos" className="hover:text-gamerhouse-gold transition-colors">
                  Todos los Productos
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-wider text-gamerhouse-gold">Compañía</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contacto" className="hover:text-gamerhouse-gold transition-colors">
                  Contáctanos
                </Link>
              </li>
              <li>
                <Link href="/legal/privacidad" className="hover:text-gamerhouse-gold transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/terminos" className="hover:text-gamerhouse-gold transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-wider text-gamerhouse-gold">Contacto</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gamerhouse-gold" />
                <a href="mailto:contacto@gamerhouse.cl" className="hover:text-gamerhouse-gold transition-colors">
                  contacto@gamerhouse.cl
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gamerhouse-gold" />
                <a href="tel:+56920265061" className="hover:text-gamerhouse-gold transition-colors">
                  +56 9 2026 5061
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gamerhouse-gold flex-shrink-0 mt-0.5" />
                <span>Santiago Centro & Las Condes, Chile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social & Bottom */}
        <div className="border-t border-gray-700 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Social Links */}
            <div>
              <h4 className="text-sm font-bold text-gamerhouse-gold mb-3 uppercase">Síguenos</h4>
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/gamerhouse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gamerhouse-gold/20 hover:bg-gamerhouse-gold hover:text-gamerhouse-navy rounded-full flex items-center justify-center transition-colors"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.facebook.com/gamerhouse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gamerhouse-gold/20 hover:bg-gamerhouse-gold hover:text-gamerhouse-navy rounded-full flex items-center justify-center transition-colors"
                  title="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://wa.me/56920265061"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gamerhouse-gold/20 hover:bg-gamerhouse-gold hover:text-gamerhouse-navy rounded-full flex items-center justify-center transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h4 className="text-sm font-bold text-gamerhouse-gold mb-3 uppercase">Métodos de Pago</h4>
              <p className="text-sm text-gray-300">
                Mercado Pago • Transferencia Bancaria • Efectivo en tienda
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 pt-6 text-center text-xs text-gray-400">
            <p>
              © {currentYear} GAMER HOUSE. Todos los derechos reservados.
            </p>
            <p className="mt-2">
              Dirección: Santiago Centro y Las Condes, Santiago, Chile
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
