'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { useUserAuth } from '@/hooks/useUserAuth';
import { Search, ShoppingCart, User, Package, Menu, X, ChevronDown } from 'lucide-react';

export default function HitesHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const router = useRouter();
  const { getTotalItems } = useCart();
  const { categories } = useCategories();
  const { currentUser, isGuest } = useUserAuth();
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Close categories dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      {/* Top Header - Blue */}
      <header className="sticky top-0 z-50 bg-brand-primary text-white shadow-lg">
        {/* Main Header */}
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="text-2xl font-bold text-white tracking-wider">
                🎮 GAMERHOUSE
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-4 max-w-2xl">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full px-4 py-2 rounded-lg text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-brand-text"
                >
                  <Search size={20} />
                </button>
              </div>
            </form>

            {/* Right Icons - Desktop */}
            <div className="hidden md:flex items-center gap-6">
              {/* Login */}
              <Link
                href={isGuest ? '/login' : '/account'}
                className="flex items-center gap-2 hover:text-brand-accent transition-colors"
              >
                <User size={20} />
                <span className="text-sm font-medium">{isGuest ? 'Inicia Sesión' : 'Mi Cuenta'}</span>
              </Link>

              {/* Track Order */}
              <Link
                href="/track-order"
                className="flex items-center gap-2 hover:text-brand-accent transition-colors"
              >
                <Package size={20} />
                <span className="text-sm font-medium">Sigue tu Compra</span>
              </Link>

              {/* Cart */}
              <Link href="/cart" className="flex items-center gap-2 hover:text-brand-accent transition-colors relative">
                <ShoppingCart size={20} />
                <span className="text-sm font-medium">Carrito</span>
                {getTotalItems() > 0 && (
                  <span className="absolute top-0 right-0 bg-brand-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Search Bar - Mobile */}
          <form onSubmit={handleSearch} className="md:hidden mt-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-4 py-2 rounded-lg text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-brand-text"
              >
                <Search size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Categories Dropdown - Desktop */}
        <nav className="hidden md:block bg-white text-brand-text border-t border-brand-border">
          <div className="px-4 sm:px-6 lg:px-8 flex items-center gap-2">
            {/* Categories Button */}
            <div ref={categoriesRef} className="relative">
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="flex items-center gap-2 px-4 py-3 text-brand-primary font-semibold hover:text-brand-secondary transition-colors"
              >
                <Menu size={18} />
                Categorías
                <ChevronDown size={18} className={`transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isCategoriesOpen && (
                <div className="absolute top-full left-0 w-64 bg-white shadow-lg border border-brand-border rounded-b-lg z-50">
                  <div className="max-h-96 overflow-y-auto">
                    {categories.slice(0, 1).map((cat) => (
                      <div key={cat.id} className="border-b last:border-b-0">
                        <Link
                          href={`/?category=${cat.id}`}
                          onClick={() => setIsCategoriesOpen(false)}
                          className="block px-4 py-3 hover:bg-brand-surface text-brand-text font-medium transition-colors"
                        >
                          {cat.name}
                        </Link>
                      </div>
                    ))}
                    {categories.slice(1).map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/?category=${cat.id}`}
                        onClick={() => setIsCategoriesOpen(false)}
                        className="block px-4 py-3 hover:bg-brand-surface text-brand-text transition-colors border-b last:border-b-0"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Category Links */}
            <div className="hidden lg:flex items-center gap-4 ml-4 border-l border-brand-border pl-4">
              {categories.slice(0, 4).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/?category=${cat.id}`}
                  className="text-brand-text font-medium hover:text-brand-secondary transition-colors text-sm"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white text-brand-text border-t border-brand-border">
            <div className="px-4 py-4 space-y-3">
              <Link
                href={isGuest ? '/login' : '/account'}
                className="flex items-center gap-2 py-2 text-brand-primary font-semibold hover:text-brand-secondary"
              >
                <User size={18} />
                {isGuest ? 'Inicia Sesión' : 'Mi Cuenta'}
              </Link>
              <Link
                href="/track-order"
                className="flex items-center gap-2 py-2 text-brand-primary font-semibold hover:text-brand-secondary"
              >
                <Package size={18} />
                Sigue tu Compra
              </Link>
              <Link
                href="/cart"
                className="flex items-center gap-2 py-2 text-brand-primary font-semibold hover:text-brand-secondary"
              >
                <ShoppingCart size={18} />
                Carrito ({getTotalItems()})
              </Link>

              {/* Mobile Categories */}
              <div className="border-t border-brand-border pt-3 mt-3">
                <p className="font-semibold text-brand-primary mb-2">Categorías</p>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/?category=${cat.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 pl-2 text-brand-text hover:text-brand-secondary transition-colors text-sm"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
