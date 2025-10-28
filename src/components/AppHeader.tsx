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
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-950 via-gray-900 to-black border-b border-yellow-400/30 transition-all duration-300">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              🎮
            </div>
            <span className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">
              GAMERHOUSE
            </span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:bg-gray-800 transition-all"
              />
            </div>
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {/* Desktop Links */}
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/perfil" className="text-gray-300 hover:text-yellow-400 transition-colors p-2">
                <User className="h-5 w-5" />
              </Link>
              <Link href="/carrito" className="relative text-gray-300 hover:text-yellow-400 transition-colors p-2">
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-yellow-400 transition-colors p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-all"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            <Link href="/" className="block text-gray-300 hover:text-yellow-400 transition-colors py-2">
              Inicio
            </Link>
            <Link href="/productos" className="block text-gray-300 hover:text-yellow-400 transition-colors py-2">
              Productos
            </Link>
            <div className="border-t border-gray-800 pt-3 flex gap-4">
              <Link href="/perfil" className="flex items-center gap-2 text-gray-300 hover:text-yellow-400 transition-colors py-2">
                <User className="h-5 w-5" />
                Perfil
              </Link>
              <Link href="/carrito" className="flex items-center gap-2 text-gray-300 hover:text-yellow-400 transition-colors py-2 relative">
                <ShoppingCart className="h-5 w-5" />
                Carrito
                {getTotalItems() > 0 && (
                  <span className="bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
