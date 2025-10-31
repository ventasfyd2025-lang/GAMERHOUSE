'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-slate-950/80 text-white/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-300/15 text-xl">
                🎮
              </span>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Store</span>
                <span className="text-lg font-semibold gradient-text-primary">Gamerhouse</span>
              </div>
            </div>
            <p className="text-sm text-white/60">
              Hardware, cartas coleccionables y accesorios seleccionados para potenciar tu setup gamer.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">Productos</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/productos" className="transition-colors hover:text-yellow-200">
                  Catálogo completo
                </Link>
              </li>
              <li>
                <Link href="/?category=consolas" className="transition-colors hover:text-yellow-200">
                  Consolas y portátiles
                </Link>
              </li>
              <li>
                <Link href="/?category=pokemon" className="transition-colors hover:text-yellow-200">
                  Pokémon TCG
                </Link>
              </li>
              <li>
                <Link href="/?category=accesorios" className="transition-colors hover:text-yellow-200">
                  Accesorios gamer
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
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">Contacto</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Mail className="h-4 w-4 text-yellow-300" />
                </span>
                <a href="mailto:info@gamerhouse.cl" className="transition-colors hover:text-yellow-200">
                  info@gamerhouse.cl
                </a>
              </li>
              <li>
                <div className="flex items-center gap-3">
                  <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-yellow-300/40 hover:text-yellow-200">
                    <Facebook className="h-4 w-4" />
                  </a>
                  <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-yellow-300/40 hover:text-yellow-200">
                    <Instagram className="h-4 w-4" />
                  </a>
                  <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-yellow-300/40 hover:text-yellow-200">
                    <Twitter className="h-4 w-4" />
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {currentYear} Gamerhouse. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
