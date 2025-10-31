'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';

export default function AppHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { getTotalItems } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-yellow-300/20 bg-slate-950/70 backdrop-blur-2xl transition-colors duration-300 shadow-[0_18px_60px_-42px_rgba(255,232,141,0.75)]">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 rounded-full px-2 py-1 transition-colors hover:bg-yellow-300/5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-yellow-300/20 text-lg shadow-[0_0_18px_rgba(255,232,141,0.45)]">
              🎮
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Store</span>
              <span className="text-lg font-semibold gradient-text-primary">Gamerhouse</span>
            </div>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-web pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {/* Desktop Links */}
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/perfil" className="text-white/70 hover:text-white transition-colors">
                <User className="h-5 w-5" />
              </Link>
              <Link href="/carrito" className="relative text-white/70 hover:text-white transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-300 text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_12px_rgba(255,232,141,0.6)]">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden rounded-full border border-white/10 bg-white/5 p-2 text-white/80 transition-colors hover:text-white"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-web pl-10 pr-4 py-2 text-sm"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            <Link href="/" className="block rounded-lg px-3 py-2 text-white/80 transition-colors hover:bg-white/5 hover:text-white">
              Inicio
            </Link>
            <Link href="/productos" className="block rounded-lg px-3 py-2 text-white/80 transition-colors hover:bg-white/5 hover:text-white">
              Productos
            </Link>
            <div className="border-t border-white/10 pt-3 flex gap-4">
              <Link href="/perfil" className="flex items-center gap-2 text-white/80 transition-colors hover:text-white">
                <User className="h-5 w-5" />
                Perfil
              </Link>
              <Link href="/carrito" className="relative flex items-center gap-2 text-white/80 transition-colors hover:text-white">
                <ShoppingCart className="h-5 w-5" />
                Carrito
                {getTotalItems() > 0 && (
                  <span className="bg-yellow-300 text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_12px_rgba(255,232,141,0.6)]">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
