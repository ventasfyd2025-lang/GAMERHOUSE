'use client';

import Link from 'next/link';
import { Facebook, Instagram, Mail, MessageCircle } from 'lucide-react';

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-yellow-300/20 bg-slate-950/85 text-white/70 backdrop-blur-xl shadow-[0_-18px_60px_-42px_rgba(255,232,141,0.6)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-300/15 text-xl">
                🎴
              </span>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">TCG Store</span>
                <span className="text-lg font-semibold gradient-text-primary">HunterCard TCG</span>
              </div>
            </div>
            <p className="text-sm text-white/60">
              La mejor tienda de Trading Card Games en Chile. Pokémon, One Piece, Yu-Gi-Oh! y más con los mejores precios.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">Juegos TCG</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/productos" className="transition-colors hover:text-yellow-200">
                  Catálogo completo
                </Link>
              </li>
              <li>
                <Link href="/categoria/pokemon-tcg" className="transition-colors hover:text-yellow-200">
                  Pokémon TCG
                </Link>
              </li>
              <li>
                <Link href="/categoria/one-piece-tcg" className="transition-colors hover:text-yellow-200">
                  One Piece TCG
                </Link>
              </li>
              <li>
                <Link href="/categoria/yu-gi-oh" className="transition-colors hover:text-yellow-200">
                  Yu-Gi-Oh!
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">Compañía</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/contacto" className="transition-colors hover:text-yellow-200">
                  Contáctanos
                </Link>
              </li>
              <li>
                <Link href="/legal/privacidad" className="transition-colors hover:text-yellow-200">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/terminos" className="transition-colors hover:text-yellow-200">
                  Términos y condiciones
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">Síguenos</h3>
            <div className="space-y-3 text-sm">
              <a href="mailto:contacto@huntercardtcg.com" className="flex items-center gap-3 transition-colors hover:text-yellow-200">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Mail className="h-4 w-4 text-yellow-300" />
                </span>
                contacto@huntercardtcg.com
              </a>
              <div className="flex items-center gap-2 pt-2">
                <a href="https://www.instagram.com/huntercardtcg" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-yellow-300/40 hover:text-yellow-200" title="Instagram">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="https://www.facebook.com/HunterCardTCG" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-yellow-300/40 hover:text-yellow-200" title="Facebook">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="https://wa.me/56920265061" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-yellow-300/40 hover:text-yellow-200" title="WhatsApp">
                  <MessageCircle className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
            <div className="text-xs text-white/50">
              <p className="font-semibold text-white/70 mb-2">Métodos de Pago</p>
              <p>Mercado Pago • Transferencia Bancaria</p>
            </div>
            <div className="text-xs text-white/50">
              <p className="font-semibold text-white/70 mb-2">Políticas</p>
              <p>
                <Link href="/legal/privacidad" className="hover:text-yellow-200 transition-colors">Privacidad</Link>
                {' • '}
                <Link href="/legal/terminos" className="hover:text-yellow-200 transition-colors">Términos</Link>
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-white/50">
            © {currentYear} HunterCard TCG. Todos los derechos reservados. Santiago, Chile.
          </div>
        </div>
      </div>
    </footer>
  );
}
