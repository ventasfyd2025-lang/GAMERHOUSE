'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { Search, ShoppingCart, User, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';

type NormalizedSubcategory = {
  id: string;
  nombre?: string;
};

export default function AppHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const router = useRouter();
  const { getTotalItems } = useCart();
  const { categories } = useCategories();
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
  }, []);

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

  const formatLabel = (label: string | undefined) => {
    if (!label) return '';
    return label
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\p{L}/gu, (match) => match.toUpperCase());
  };

  const slugify = (value: string, fallback: string) => (
    value?.trim()?.toLowerCase()?.replace(/[^a-z0-9]+/gi, '-')?.replace(/^-+|-+$/g, '') || fallback
  );

  const extractSubcategories = (raw: unknown): NormalizedSubcategory[] => {
    if (!raw) return [];

    const pushIfActive = (
      list: NormalizedSubcategory[],
      candidate: NormalizedSubcategory | null,
      isActive: boolean,
    ) => {
      if (candidate && isActive) {
        list.push({ id: candidate.id, nombre: candidate.nombre || formatLabel(candidate.id) });
      }
      return list;
    };

    if (Array.isArray(raw)) {
      return raw.reduce<NormalizedSubcategory[]>((acc, entry, index) => {
        if (typeof entry === 'string') {
          return pushIfActive(acc, { id: slugify(entry, `sub-${index}`), nombre: entry }, true);
        }

        if (entry && typeof entry === 'object') {
          const typed = entry as { id?: string; nombre?: string; activa?: boolean };
          const candidateId = typed.id || slugify(typed.nombre ?? `sub-${index}`, `sub-${index}`);
          return pushIfActive(
            acc,
            { id: candidateId, nombre: typed.nombre || formatLabel(candidateId) },
            typed.activa !== false,
          );
        }

        return acc;
      }, []);
    }

    if (typeof raw === 'object') {
      return Object.entries(raw as Record<string, unknown>)
        .reduce<NormalizedSubcategory[]>((acc, [key, value]) => {
          const typed = (value ?? {}) as { nombre?: string; activa?: boolean };
          return pushIfActive(
            acc,
            { id: key, nombre: typed.nombre || formatLabel(key) },
            typed.activa !== false,
          );
        }, []);
    }

    return [];
  };

  const hoveredCategoryData = useMemo(
    () => activeCategories.find((category) => category.id === hoveredCategory),
    [activeCategories, hoveredCategory],
  );

  const hoveredSubcategories = useMemo(
    () => extractSubcategories(hoveredCategoryData?.subcategorias),
    [hoveredCategoryData?.subcategorias],
  );

  const openMenu = (categoryId?: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsCategoryMenuOpen(true);
    if (categoryId) {
      setHoveredCategory(categoryId);
    } else if (!hoveredCategory && activeCategories.length > 0) {
      setHoveredCategory(activeCategories[0].id);
    }
  };

  const scheduleCloseMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setIsCategoryMenuOpen(false);
      setHoveredCategory(null);
      closeTimerRef.current = null;
    }, 150);
  };

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
              onMouseEnter={() => openMenu()}
              onFocusCapture={() => openMenu()}
              onMouseLeave={scheduleCloseMenu}
            >
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white/80 backdrop-blur-md transition-all duration-300 hover:border-yellow-300/40 hover:text-white"
                onFocus={() => openMenu()}
              >
                <span>Categorías</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryMenuOpen && activeCategories.length > 0 && (
                <div
                  className="absolute left-0 top-full mt-3 flex min-w-[320px] gap-4 rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-[0_30px_80px_-40px_rgba(255,232,141,0.8)] backdrop-blur-2xl"
                  onMouseEnter={() => openMenu()}
                  onMouseLeave={scheduleCloseMenu}
                >
                  <div className="flex-1 min-w-[180px] max-h-96 overflow-y-auto pr-2">
                    <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">Categorías</p>
                    <ul className="mt-2 space-y-1">
                      {activeCategories.map((category) => (
                        <li key={category.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setHoveredCategory(category.id)}
                            onFocus={() => setHoveredCategory(category.id)}
                            onClick={() => {
                              setHoveredCategory(category.id);
                            }}
                            className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm font-semibold transition-colors ${hoveredCategory === category.id ? 'bg-yellow-300/15 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                          >
                            <span>{category.name || formatLabel(category.id)}</span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${hoveredCategory === category.id ? 'rotate-90' : ''}`} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex-1 border-l border-white/10 pl-4 max-h-96 overflow-y-auto">
                    <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">Subcategorías</p>
                    {hoveredCategory && (
                      <Link
                        href={`/?category=${encodeURIComponent(hoveredCategory)}`}
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/60 transition-colors hover:border-yellow-300/40 hover:text-yellow-100"
                        onClick={() => scheduleCloseMenu()}
                      >
                        Ver todo
                      </Link>
                    )}
                    <ul className="mt-3 space-y-1">
                      {hoveredSubcategories.length > 0 ? (
                        hoveredSubcategories.map((subcategory) => (
                          <li key={subcategory.id}>
                            <Link
                              href={`/?category=${encodeURIComponent(hoveredCategory ?? '')}&subcategory=${encodeURIComponent(subcategory.id)}`}
                              className="block rounded-2xl px-3 py-2 text-sm text-white/70 transition-colors hover:bg-yellow-300/10 hover:text-white"
                              onClick={() => scheduleCloseMenu()}
                            >
                              {subcategory.nombre || formatLabel(subcategory.id)}
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
              onClick={() => {
                setIsMobileMenuOpen((prev) => {
                  if (prev) {
                    setExpandedCategoryId(null);
                  }
                  return !prev;
                });
              }}
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
            <Link
              href="/"
              className="block rounded-lg px-3 py-2 text-white/80 transition-colors hover:bg-white/5 hover:text-white"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setExpandedCategoryId(null);
              }}
            >
              Inicio
            </Link>
            <Link
              href="/productos"
              className="block rounded-lg px-3 py-2 text-white/80 transition-colors hover:bg-white/5 hover:text-white"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setExpandedCategoryId(null);
              }}
            >
              Productos
            </Link>
            {activeCategories.length > 0 && (
              <div className="space-y-2 border-t border-white/10 pt-3">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">Categorías</p>
                <div className="grid grid-cols-1 gap-2">
                  {activeCategories.map((category) => {
                    const isExpanded = expandedCategoryId === category.id;
                    return (
                      <div key={category.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                        <button
                          type="button"
                          onClick={() => setExpandedCategoryId(isExpanded ? null : category.id)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
                        >
                          <span>{category.name || formatLabel(category.id)}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="border-t border-white/10 bg-slate-950/80 px-3 py-2">
                            <div className="flex flex-col gap-1">
                              <Link
                                href={`/?category=${encodeURIComponent(category.id)}`}
                                className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60 transition-colors hover:bg-yellow-300/10 hover:text-white"
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  setExpandedCategoryId(null);
                                }}
                              >
                                Ver todo
                              </Link>
                              {extractSubcategories(category.subcategorias).map((subcategory) => (
                                <Link
                                  key={subcategory.id}
                                  href={`/?category=${encodeURIComponent(category.id)}&subcategory=${encodeURIComponent(subcategory.id)}`}
                                  className="rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-yellow-300/10 hover:text-white"
                                  onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    setExpandedCategoryId(null);
                                  }}
                                >
                                  {subcategory.nombre || formatLabel(subcategory.id)}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="border-t border-white/10 pt-3 flex gap-4">
              <Link
                href="/perfil"
                className="flex items-center gap-2 text-white/80 transition-colors hover:text-white"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setExpandedCategoryId(null);
                }}
              >
                <User className="h-5 w-5" />
                Perfil
              </Link>
              <Link
                href="/carrito"
                className="relative flex items-center gap-2 text-white/80 transition-colors hover:text-white"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setExpandedCategoryId(null);
                }}
              >
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
