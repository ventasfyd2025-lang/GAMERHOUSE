'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Home,
  Package,
  Sparkles,
  Ship,
  Swords,
  Flame,
  Gamepad2,
  Shield,
  Joystick,
  Bot,
  Palette,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import DynamicLogo from './DynamicLogo';

const gamerPalette = ['from-sky-400/70 to-cyan-300/70', 'from-indigo-400/70 to-sky-300/70', 'from-fuchsia-400/60 to-pink-300/60', 'from-emerald-400/60 to-teal-300/60'];

const quickLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Ofertas', href: '/productos?filter=ofertas' },
  { label: 'Nuevos', href: '/productos?filter=nuevos' },
  { label: 'Preventa', href: '/productos?filter=preventa' },
];

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  'pokemon-tcg': Sparkles,
  'one-piece-tcg': Ship,
  'star-wars-unlimited': Swords,
  'yu-gi-oh': Shield,
  'dragon-ball': Flame,
  tecnologia: Bot,
  accesorios: Palette,
  consolas: Joystick,
};

export default function AppHeaderLight() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [megaCategoryId, setMegaCategoryId] = useState<string | null>(null);
  const megaMenuTimeoutRef = useRef<number | NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { getTotalItems } = useCart();
  const { categories } = useCategories();

  const activeCategories = useMemo(
    () => categories.filter(cat => cat.active !== false),
    [categories]
  );

  useEffect(() => {
    if (activeCategories.length > 0 && !megaCategoryId) {
      setMegaCategoryId(activeCategories[0].id);
    }
  }, [activeCategories, megaCategoryId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/categoria/${categoryId}`);
    setIsMobileMenuOpen(false);
  };

  const handleMegaNavigate = (href: string) => {
    setIsMegaMenuOpen(false);
    router.push(href);
  };

  const openMegaMenu = (categoryId?: string) => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
      megaMenuTimeoutRef.current = null;
    }
    if (categoryId) {
      setMegaCategoryId(categoryId);
    }
    setIsMegaMenuOpen(true);
  };

  const closeMegaMenu = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    megaMenuTimeoutRef.current = window.setTimeout(() => {
      setIsMegaMenuOpen(false);
      megaMenuTimeoutRef.current = null;
    }, 120);
  };

  const getCategoryIcon = (categoryId: string): LucideIcon => CATEGORY_ICON_MAP[categoryId] || Gamepad2;

  const getCategorySubcategories = (category: (typeof categories)[number]) => {
    if (!category?.subcategorias) {
      return [] as Array<{ value: string; label: string }>;
    }
    return category.subcategorias
      .filter((sub) => sub.activa !== false)
      .map((sub, index) => ({
        value: (sub.nombre || sub.id || `sub-${index}`).toLowerCase(),
        label: sub.nombre || sub.id || `Subcategoría ${index + 1}`,
      }));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-sky-100 bg-white/90 shadow-[0_40px_120px_-60px_rgba(56,182,255,0.4)] backdrop-blur-xl">
      <div className="px-4 sm:px-6 lg:px-8 py-4 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_top,rgba(99,179,237,0.15),transparent_55%)]" />
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4 lg:flex-nowrap relative">
          <DynamicLogo />

          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-auto">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-sky-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar productos o sagas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-12"
              />
            </div>
          </form>

          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:flex items-center gap-3">
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

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 text-slate-600 hover:text-sky-600 hover:border-sky-200 transition-all md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <form onSubmit={handleSearch} className="lg:hidden w-full">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-sky-500 transition-colors" />
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
      </div>

      <nav className="bg-gradient-to-r from-[#f1fbff] via-[#e4f2ff] to-white border-t border-white/70 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 h-full">
              <div
                className="hidden lg:block relative"
                onMouseEnter={() => openMegaMenu()}
                onMouseLeave={closeMegaMenu}
              >
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:border-sky-200 hover:bg-white shadow-sm"
                >
                  <Gamepad2 className="h-4 w-4 text-sky-500" />
                  Explorar catálogo
                  <ChevronDown className={`h-4 w-4 transition-transform ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMegaMenuOpen && activeCategories.length > 0 && (
                  <div
                    className="absolute left-0 top-full mt-3 w-[560px] rounded-3xl border border-sky-100 bg-white p-6 shadow-[0_40px_100px_-60px_rgba(15,102,160,0.8)]"
                    onMouseEnter={() => openMegaMenu()}
                    onMouseLeave={closeMegaMenu}
                  >
                    <div className="grid grid-cols-[210px_1fr] gap-6">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          className="flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-semibold text-slate-600 transition-all hover:border-slate-200"
                          onClick={() => handleMegaNavigate('/')}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-white">
                              <Home className="h-4 w-4 text-slate-700" />
                            </span>
                            Inicio
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </button>
                        {activeCategories.map((category, index) => {
                          const IconComponent = getCategoryIcon(category.id);
                          const isActive = megaCategoryId === category.id;
                          return (
                            <button
                              key={category.id}
                              type="button"
                              className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-semibold transition-all ${
                                isActive ? 'border-sky-200 bg-sky-50 text-slate-900 shadow-sm' : 'border-slate-100 text-slate-500 hover:border-slate-200'
                              }`}
                              onMouseEnter={() => openMegaMenu(category.id)}
                              onClick={() => handleMegaNavigate(`/categoria/${category.id}`)}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${gamerPalette[index % gamerPalette.length]}`}>
                                  <IconComponent className="h-4 w-4 text-slate-900/80" />
                                </span>
                                {category.name || category.id}
                              </span>
                              <ChevronRight className={`h-4 w-4 ${isActive ? 'text-sky-500' : 'text-slate-300'}`} />
                            </button>
                          );
                        })}
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                        {(() => {
                          const activeCategory = activeCategories.find((cat) => cat.id === (megaCategoryId || activeCategories[0]?.id));
                          if (!activeCategory) {
                            return <p className="text-sm text-slate-500">Selecciona una categoría para ver sus subcategorías.</p>;
                          }
                          const subcategories = getCategorySubcategories(activeCategory);
                          if (subcategories.length === 0) {
                            return (
                              <div className="text-sm text-slate-500">
                                No hay subcategorías configuradas para {activeCategory.name || activeCategory.id}.
                              </div>
                            );
                          }
                          return (
                            <div className="grid grid-cols-2 gap-3">
                              {subcategories.map((sub, index) => (
                                <button
                                  key={sub.value}
                                  type="button"
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 text-left transition hover:border-sky-200 hover:text-slate-900"
                                  onClick={() => handleMegaNavigate(`/categoria/${activeCategory.id}?subcategory=${encodeURIComponent(sub.value)}`)}
                                >
                                  <span className="block">{sub.label}</span>
                                  <span className="text-xs text-slate-400 font-normal">#{index + 1} en {activeCategory.name || activeCategory.id}</span>
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden md:flex items-center gap-1 h-full">
                {activeCategories.slice(0, 5).map((category, index) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className="group relative h-full px-4 text-sm font-semibold text-slate-600 hover:text-sky-700 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      {React.createElement(getCategoryIcon(category.id), { className: 'h-4 w-4 text-slate-400' })}
                      {category.name || category.id}
                    </span>
                    <span className={`absolute bottom-2 left-4 right-4 h-[3px] scale-x-0 rounded-full bg-gradient-to-r ${gamerPalette[index % gamerPalette.length]} transition-transform duration-200 origin-center group-hover:scale-x-100`} />
                  </button>
                ))}
                {activeCategories.length > 5 && (
                  <Link
                    href="/productos"
                    className="h-full px-4 text-sm font-semibold flex items-center gap-1 text-slate-600 hover:text-sky-700 transition-colors"
                  >
                    Ver todo
                  </Link>
                )}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              {quickLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => {
                    setIsMegaMenuOpen(false);
                    router.push(link.href);
                  }}
                  className="text-sm font-semibold text-slate-500 hover:text-sky-700 transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="md:hidden">
              <span className="text-sm font-bold tracking-wider text-slate-600">CATEGORÍAS</span>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-5 space-y-2">
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
                {activeCategories.map((category) => {
                  const subcategories = getCategorySubcategories(category);
                  const hasSubcategories = subcategories.length > 0;
                  const isExpanded = expandedMobileCategory === category.id;
                  return (
                    <div key={category.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCategoryClick(category.id)}
                          className="flex-1 text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 rounded-lg transition-all duration-200 font-medium"
                        >
                          {category.name || category.id}
                        </button>
                        {hasSubcategories && (
                          <button
                            type="button"
                            className="p-2 text-slate-500"
                            onClick={(event) => {
                              event.stopPropagation();
                              setExpandedMobileCategory(isExpanded ? null : category.id);
                            }}
                            aria-label="Mostrar subcategorías"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                      {hasSubcategories && isExpanded && (
                        <div className="ml-4 border-l border-slate-100 pl-4 space-y-1">
                          {subcategories.map((sub) => (
                            <button
                              key={`${category.id}-${sub.value}`}
                              onClick={() => handleMegaNavigate(`/categoria/${category.id}?subcategory=${encodeURIComponent(sub.value)}`)}
                              className="block w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-sky-50 rounded-md"
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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
