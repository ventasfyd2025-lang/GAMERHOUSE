'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, Shield, Headphones, RotateCcw } from 'lucide-react';

export default function HitesFooter() {
  return (
    <footer className="bg-white text-brand-text border-t border-brand-border">
      {/* Service Features */}
      <div className="bg-brand-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Shipping */}
            <div className="flex items-center gap-4">
              <Truck className="text-brand-secondary flex-shrink-0" size={32} />
              <div>
                <h3 className="font-semibold text-brand-text">Envío Rápido</h3>
                <p className="text-sm text-brand-text-secondary">En toda Chile</p>
              </div>
            </div>

            {/* Secure Payment */}
            <div className="flex items-center gap-4">
              <Shield className="text-brand-secondary flex-shrink-0" size={32} />
              <div>
                <h3 className="font-semibold text-brand-text">Compra Segura</h3>
                <p className="text-sm text-brand-text-secondary">Pago protegido</p>
              </div>
            </div>

            {/* Customer Service */}
            <div className="flex items-center gap-4">
              <Headphones className="text-brand-secondary flex-shrink-0" size={32} />
              <div>
                <h3 className="font-semibold text-brand-text">Soporte 24/7</h3>
                <p className="text-sm text-brand-text-secondary">Siempre disponible</p>
              </div>
            </div>

            {/* Easy Returns */}
            <div className="flex items-center gap-4">
              <RotateCcw className="text-brand-secondary flex-shrink-0" size={32} />
              <div>
                <h3 className="font-semibold text-brand-text">Devoluciones Fáciles</h3>
                <p className="text-sm text-brand-text-secondary">30 días</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* About */}
          <div>
            <h3 className="font-bold text-brand-primary text-lg mb-4">🎮 GAMERHOUSE</h3>
            <p className="text-sm text-brand-text-secondary mb-4">
              Tu tienda de confianza para videojuegos, consolas y accesorios gaming.
            </p>
            <p className="text-xs text-brand-text-secondary">
              © 2025 GAMERHOUSE. Todos los derechos reservados.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-brand-primary mb-4">Categorías</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/?category=consolas" className="text-brand-text-secondary hover:text-brand-secondary transition-colors">
                  Consolas
                </Link>
              </li>
              <li>
                <Link href="/?category=juegos" className="text-brand-text-secondary hover:text-brand-secondary transition-colors">
                  Juegos
                </Link>
              </li>
              <li>
                <Link href="/?category=accesorios" className="text-brand-text-secondary hover:text-brand-secondary transition-colors">
                  Accesorios
                </Link>
              </li>
              <li>
                <Link href="/?category=pokemon" className="text-brand-text-secondary hover:text-brand-secondary transition-colors">
                  Pokémon
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-brand-primary mb-4">Servicio al Cliente</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-brand-text-secondary hover:text-brand-secondary transition-colors">
                  Contáctanos
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-brand-text-secondary hover:text-brand-secondary transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="text-brand-text-secondary hover:text-brand-secondary transition-colors">
                  Rastrear Pedido
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-brand-text-secondary hover:text-brand-secondary transition-colors">
                  Devoluciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-brand-primary mb-4">Información Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-brand-text-secondary hover:text-brand-secondary transition-colors">
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-brand-text-secondary hover:text-brand-secondary transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-brand-text-secondary hover:text-brand-secondary transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-brand-border pt-8 text-center text-sm text-brand-text-secondary">
          <p>GAMERHOUSE © 2025 - Tienda Gaming Oficial de Chile</p>
        </div>
      </div>
    </footer>
  );
}
