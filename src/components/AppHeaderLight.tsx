'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { Search, ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react';

export default function AppHeaderLight() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const router = useRouter();
  const { getTotalItems } = useCart();
  const { categories } = useCategories();

  const activeCategories = useMemo(
    () => categories.filter(cat => cat.active !== false),
    [categories]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/categoria/${categoryId}`);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-gamerhouse-navy shadow-md">
      {/* Top Bar - Logo and Cart */}
      <div className="bg-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-bold text-gamerhouse-red">GAMER</span>
              <span className="text-2xl font-bold text-gamerhouse-navy">HOUSE</span>
            </div>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gamerhouse-red focus:border-transparent"
              />
            </div>
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {/* Desktop Links */}
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/perfil" className="text-gray-700 hover:text-gamerhouse-red transition-colors">
                <User className="h-5 w-5" />
              </Link>
              <Link href="/carrito" className="relative text-gray-700 hover:text-gamerhouse-red transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gamerhouse-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-gamerhouse-red transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gamerhouse-red"
            />
          </div>
        </form>
      </div>

      {/* Navigation Bar - Categories */}
      <nav className="bg-gamerhouse-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Desktop Categories */}
            <div className="hidden md:flex items-center gap-6 h-full">
              {activeCategories.slice(0, 6).map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="h-full px-3 text-sm font-semibold hover:bg-gamerhouse-red transition-colors whitespace-nowrap"
                >
                  {category.name || category.id}
                </button>
              ))}
              {activeCategories.length > 6 && (
                <div className="relative group h-full">
                  <button className="h-full px-3 text-sm font-semibold hover:bg-gamerhouse-red transition-colors flex items-center gap-1 whitespace-nowrap">
                    Más <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="absolute left-0 mt-0 w-48 bg-white text-gray-800 shadow-lg hidden group-hover:block">
                    {activeCategories.slice(6).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className="block w-full text-left px-4 py-2 hover:bg-gamerhouse-red hover:text-white transition-colors text-sm"
                      >
                        {category.name || category.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Categories Button */}
            <div className="md:hidden">
              <span className="text-sm font-semibold">CATEGORÍAS</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-50 border-t border-gray-200">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                router.push('/');
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gamerhouse-red hover:text-white rounded transition-colors"
            >
              Inicio
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                router.push('/productos');
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gamerhouse-red hover:text-white rounded transition-colors"
            >
              Todos los Productos
            </button>

            {activeCategories.length > 0 && (
              <div className="border-t border-gray-300 pt-3">
                <p className="px-4 text-xs font-bold uppercase text-gray-500 mb-2">Categorías</p>
                {activeCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gamerhouse-red hover:text-white rounded transition-colors"
                  >
                    {category.name || category.id}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-gray-300 pt-3 flex gap-3">
              <Link
                href="/perfil"
                className="flex-1 text-center px-4 py-2 bg-gamerhouse-navy text-white rounded hover:bg-gamerhouse-red transition-colors text-sm font-semibold"
              >
                Mi Cuenta
              </Link>
              <Link
                href="/carrito"
                className="flex-1 text-center px-4 py-2 bg-gamerhouse-red text-white rounded hover:bg-gamerhouse-navy transition-colors text-sm font-semibold relative"
              >
                Carrito
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gamerhouse-navy text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
