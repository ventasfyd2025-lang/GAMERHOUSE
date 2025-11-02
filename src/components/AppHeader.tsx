'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { Search, ShoppingCart, User, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';

export default function AppHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { getTotalItems } = useCart();
  const { categories } = useCategories();

  const isCategoryActive = (category: (typeof categories)[number]) => {
    const spanishFlag = (category as { activa?: boolean }).activa;
    if (typeof spanishFlag === 'boolean') {
      return spanishFlag;
    }
    return category.active !== false;
  };

  const activeCategories = useMemo(
    () => categories.filter(isCategoryActive),
    [categories],
  );

  const hoveredCategoryData = useMemo(
    () => activeCategories.find((category) => category.id === hoveredCategory),
    [activeCategories, hoveredCategory],
  );

  const hoveredSubcategories = useMemo(
    () => hoveredCategoryData?.subcategorias?.filter((sub) => sub.activa !== false) ?? [],
    [hoveredCategoryData],
  );

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
          {/* Logo + Categorías */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 rounded-full px-2 py-1 transition-colors hover:bg-yellow-300/5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-yellow-300/20 text-lg shadow-[0_0_18px_rgba(255,232,141,0.45)]">
                🎮
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Store</span>
                <span className="text-lg font-semibold gradient-text-primary">Gamerhouse</span>
              </div>
            </Link>

            {/* Desktop Category Menu */}
            <div
              className="relative hidden lg:block"
              onMouseEnter={() => {
                setIsCategoryMenuOpen(true);
                if (!hoveredCategory && activeCategories.length > 0) {
                  setHoveredCategory(activeCategories[0].id);
                }
              }}
              onMouseLeave={() => {
                setIsCategoryMenuOpen(false);
                setHoveredCategory(null);
              }}
            >
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white/80 backdrop-blur-md transition-all duration-300 hover:border-yellow-300/40 hover:text-white"
                onFocus={() => {
                  setIsCategoryMenuOpen(true);
                  if (!hoveredCategory && activeCategories.length > 0) {
                    setHoveredCategory(activeCategories[0].id);
                  }
                }}
              >
                <span>Categorías</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryMenuOpen && activeCategories.length > 0 && (
                <div className="absolute left-0 top-full mt-3 flex min-w-[320px] gap-4 rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-[0_30px_80px_-40px_rgba(255,232,141,0.8)] backdrop-blur-2xl">
                  <div className="flex-1">
                    <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">Categorías</p>
                    <ul className="mt-2 space-y-1">
                      {activeCategories.map((category) => (
                        <li key={category.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setHoveredCategory(category.id)}
                            onFocus={() => setHoveredCategory(category.id)}
                            onClick={() => {
                              setIsCategoryMenuOpen(false);
                              setHoveredCategory(null);
                              router.push(`/?category=${encodeURIComponent(category.id)}`);
                            }}
                            className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm font-semibold transition-colors ${hoveredCategory === category.id ? 'bg-yellow-300/15 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                          >
                            <span>{category.name}</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex-1 border-l border-white/10 pl-4">
                    <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">Subcategorías</p>
                    <ul className="mt-2 space-y-1">
                      {hoveredSubcategories.length > 0 ? (
                        hoveredSubcategories.map((subcategory) => (
                          <li key={subcategory.id}>
                            <Link
                              href={`/?category=${encodeURIComponent(hoveredCategory ?? '')}&subcategory=${encodeURIComponent(subcategory.id)}`}
                              className="block rounded-2xl px-3 py-2 text-sm text-white/70 transition-colors hover:bg-yellow-300/10 hover:text-white"
                              onClick={() => {
                                setIsCategoryMenuOpen(false);
                                setHoveredCategory(null);
                              }}
                            >
                              {subcategory.nombre}
                            </Link>
                          </li>
                        ))
                      ) : (
                        <li className="rounded-2xl px-3 py-4 text-center text-sm text-white/40">
                          Selecciona una categoría
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

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
            {activeCategories.length > 0 && (
              <div className="space-y-2 border-t border-white/10 pt-3">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">Categorías</p>
                <div className="grid grid-cols-1 gap-1">
                  {activeCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/?category=${encodeURIComponent(category.id)}`}
                      className="rounded-lg px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
