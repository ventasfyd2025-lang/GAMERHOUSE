'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { Search, ShoppingCart, User, Menu, X, ChevronDown, Sun, Moon, Home, Package } from 'lucide-react';
import DynamicLogo from './DynamicLogo';
import { useTheme } from '@/context/ThemeContext';

export default function AppHeaderLight() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { getTotalItems } = useCart();
  const { categories } = useCategories();
  const { theme, setTheme } = useTheme();

  const activeCategories = useMemo(
    () => categories.filter(cat => cat.active !== false),
    [categories]
  );

  const isDark = theme === 'dark';
  const handleToggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

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
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/85 dark:bg-slate-950/70 shadow-[0_30px_80px_-50px_rgba(8,40,70,0.5)] backdrop-blur-xl">
      {/* Top Bar - Logo and Actions */}
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4 lg:flex-nowrap">
          {/* Logo - Dinámico */}
          <DynamicLogo />

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-auto">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-12"
              />
            </div>
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={handleToggleTheme}
              className="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 bg-white/60 text-slate-600 transition-all hover:border-red-200 hover:text-red-500 dark:bg-slate-900/60 dark:text-white/70"
              aria-label="Cambiar tema"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="hidden sm:flex items-center gap-4">
              <Link href="/perfil" className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-all duration-200">
                <User className="h-5 w-5" />
              </Link>
              <Link href="/carrito" className="relative p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-all duration-200">
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-sky-400 to-cyan-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 text-slate-600 hover:text-red-500 hover:border-red-200 transition-all"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="lg:hidden mt-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-red-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input w-full pl-12 pr-4"
            />
          </div>
        </form>
      </div>

      {/* Navigation Bar - Categories */}
      <nav className="bg-gradient-to-r from-[#f0fbff] via-[#e8f5ff] to-[#fefefe] dark:bg-slate-950/60 border-t border-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Desktop Categories */}
            <div className="hidden md:flex items-center gap-1 h-full">
              {activeCategories.slice(0, 6).map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="group relative h-full px-4 text-sm font-semibold text-slate-600 hover:text-gamerhouse-red transition-colors"
                >
                  {category.name || category.id}
                  <span className="absolute bottom-2 left-4 right-4 h-[2px] scale-x-0 bg-gradient-to-r from-yellow-400 to-red-500 transition-transform duration-200 origin-center group-hover:scale-x-100" />
                </button>
              ))}
              {activeCategories.length > 6 && (
                <div className="relative group h-full">
                  <button className="h-full px-4 text-sm font-semibold flex items-center gap-1 text-slate-600 hover:text-gamerhouse-red transition-colors">
                    Más <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform" />
                  </button>
                  <div className="absolute left-0 mt-0 w-56 bg-white text-gray-800 shadow-xl rounded-2xl overflow-hidden hidden group-hover:block border border-gray-100">
                    {activeCategories.slice(6).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className="block w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-gamerhouse-red hover:to-red-600 hover:text-white transition-all duration-200 text-sm font-medium"
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
              <span className="text-sm font-bold tracking-wider text-slate-600">CATEGORÍAS</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-5 space-y-2">
            <button
              onClick={handleToggleTheme}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
            >
              Tema {isDark ? 'oscuro' : 'claro'}
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {[
              { label: 'Inicio', href: '/', icon: Home },
              { label: 'Todos los productos', href: '/productos', icon: Package }
            ].map(({ label, href, icon: Icon }) => (
              <button
                key={href}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push(href);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-all duration-200 font-medium"
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}

            {activeCategories.length > 0 && (
              <div className="border-t border-gray-200 pt-3 mt-3">
                <p className="px-4 text-xs font-bold uppercase text-gray-500 mb-3 tracking-wide">Categorías</p>
                {activeCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-gamerhouse-red rounded-lg transition-all duration-200 font-medium"
                  >
                    {category.name || category.id}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 pt-3 mt-3 flex gap-2">
              <Link
                href="/perfil"
                className="flex-1 text-center px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-semibold"
              >
                Mi Cuenta
              </Link>
              <Link
                href="/carrito"
                className="flex-1 text-center px-4 py-3 bg-gradient-to-r from-sky-400 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-semibold relative"
              >
                Carrito
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-sky-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
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
