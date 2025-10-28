'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 border-t border-yellow-300/30 text-gray-300 transition-all duration-300">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎮</span>
              <span className="font-bold text-white text-lg">GAMERHOUSE</span>
            </div>
            <p className="text-sm text-gray-400">
              La tienda definitiva para gamers y coleccionistas de cartas.
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold mb-4">Productos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/productos" className="text-sm hover:text-yellow-400 transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/?category=consolas" className="text-sm hover:text-yellow-400 transition-colors">
                  Consolas
                </Link>
              </li>
              <li>
                <Link href="/?category=pokemon" className="text-sm hover:text-yellow-400 transition-colors">
                  Pokemon TCG
                </Link>
              </li>
              <li>
                <Link href="/?category=accesorios" className="text-sm hover:text-yellow-400 transition-colors">
                  Accesorios
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contacto" className="text-sm hover:text-yellow-400 transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/legal/privacidad" className="text-sm hover:text-yellow-400 transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/terminos" className="text-sm hover:text-yellow-400 transition-colors">
                  Términos
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-yellow-400" />
                <a href="mailto:info@gamerhouse.cl" className="text-sm hover:text-yellow-400 transition-colors">
                  info@gamerhouse.cl
                </a>
              </li>
              <li className="flex gap-3 mt-4">
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-sm text-gray-500">
            © {currentYear} GAMERHOUSE. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
