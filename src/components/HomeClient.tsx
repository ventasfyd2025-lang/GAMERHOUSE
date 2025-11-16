'use client';

import { Suspense, lazy, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import MasonryProductGrid from '@/components/MasonryProductGrid';
import MainBanner from '@/components/home/MainBanner';
import { useProducts } from '@/hooks/useProducts';
import { useConfig } from '@/hooks/useConfig';
import { useCategories } from '@/hooks/useCategories';
import { useLayoutPatterns } from '@/hooks/useLayoutPatterns';
import { useSearchParams } from 'next/navigation';
import { formatCategoryLabel, normalizeCategoryValue, getProductCategoryCandidates } from '@/utils/category';
import { ShieldCheck, Sparkles, Gamepad2, Truck, BadgeDollarSign, Cable, HandHeart, Trophy } from 'lucide-react';

export default function HomeClient() {
  const searchParams = useSearchParams();
  const perks = [
    {
      title: 'Despachos express',
      description: 'Regiones V, VI y RM con entrega dentro de 24 horas.',
      icon: Truck,
      accent: 'from-sky-200 to-cyan-100',
    },
    {
      title: 'Kits gamer',
      description: 'Combos pastel con sleeves, tapetes y boosters.',
      icon: Gamepad2,
      accent: 'from-indigo-200 to-violet-100',
    },
    {
      title: 'Pago protegido',
      description: 'Mercado Pago, transferencia o retiro presencial.',
      icon: ShieldCheck,
      accent: 'from-emerald-200 to-teal-100',
    },
    {
      title: 'Rewards & drops',
      description: 'Puntos por compra y drops sorpresa cada semana.',
      icon: Sparkles,
      accent: 'from-amber-200 to-orange-100',
    },
  ];

  const heroStats = [
    { label: 'Lanzamientos mensuales', value: '+45', detail: 'Nuevos productos TCG', icon: Trophy },
    { label: 'Comunidades activas', value: '8K+', detail: 'Jugadores y coleccionistas', icon: HandHeart },
    { label: 'Eventos y torneos', value: '12', detail: 'Durante esta temporada', icon: Cable },
    { label: 'Ofertas dinámicas', value: '24/7', detail: 'Bots cazan precios bajos', icon: BadgeDollarSign },
  ];
  
  // PRIORIDAD 1: Banner primero - config de banner con carga inmediata
  const { mainBannerConfig } = useConfig();
  
  // PRIORIDAD 2: Productos después - cargar en segundo plano
  const { loading, error, filterProducts, getProductsByFilter, products } = useProducts();
  
  // PRIORIDAD 3: Otros datos al final
  const { categories } = useCategories();
  const { patterns: layoutPatternsConfig } = useLayoutPatterns();
  
  
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const subcategoryParam = searchParams.get('subcategory') || '';
  const priceRange = searchParams.get('price') || '';
  const sortBy = searchParams.get('sort') || '';
  const filter = searchParams.get('filter') || '';

  const findCategoryByValue = (rawValue: string) => {
    if (!rawValue) return undefined;
    const normalizedValue = normalizeCategoryValue(rawValue);
    const match = categories.find(cat => (
      normalizeCategoryValue(cat.id) === normalizedValue ||
      normalizeCategoryValue(cat.name || '') === normalizedValue
    ));

    if (match) return match;

    if (rawValue.includes('-')) {
      const firstPart = rawValue.split('-')[0];
      if (firstPart && firstPart !== rawValue) {
        return findCategoryByValue(firstPart);
      }
    }
    return undefined;
  };

  const resolvedCategory = useMemo(() => {
    if (!categoryParam) {
      return {
        filterValue: '',
        displayName: '',
        category: undefined as ReturnType<typeof findCategoryByValue> | undefined,
      };
    }

    if (categoryParam === 'all') {
      return {
        filterValue: 'all',
        displayName: 'Todos los productos',
        category: undefined,
      };
    }

    const match = findCategoryByValue(categoryParam);
    const filterValue = match?.id ?? categoryParam;
    const displayName = match?.name ?? formatCategoryLabel(categoryParam);
    return {
      filterValue,
      displayName,
      category: match,
    };
  }, [categoryParam, categories]);

  const findSubcategoryByValue = (rawValue: string) => {
    if (!rawValue) return undefined;
    const normalizedValue = normalizeCategoryValue(rawValue);

    const searchIn = resolvedCategory.category?.subcategorias ?? [];
    const fromCurrent = searchIn.find(sub => (
      normalizeCategoryValue(sub.id) === normalizedValue ||
      normalizeCategoryValue(sub.nombre || '') === normalizedValue
    ));
    if (fromCurrent) return { ...fromCurrent, parent: resolvedCategory.category };

    for (const cat of categories) {
      const found = (cat.subcategorias ?? []).find(sub => (
        normalizeCategoryValue(sub.id) === normalizedValue ||
        normalizeCategoryValue(sub.nombre || '') === normalizedValue
      ));
      if (found) {
        return { ...found, parent: cat };
      }
    }

    if (rawValue.includes('-')) {
      const parts = rawValue.split('-');
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart !== rawValue) {
        return findSubcategoryByValue(lastPart);
      }
    }

    return undefined;
  };

  const resolvedSubcategory = useMemo(() => {
    if (!subcategoryParam) {
      return {
        filterValue: '',
        displayName: '',
      };
    }

    const match = findSubcategoryByValue(subcategoryParam);
    const filterValue = match?.id ?? subcategoryParam;
    const displayName = match?.nombre ?? formatCategoryLabel(subcategoryParam);
    return {
      filterValue,
      displayName,
    };
  }, [subcategoryParam, categories, resolvedCategory.category]);

  const effectiveCategory = resolvedCategory.filterValue;
  const effectiveSubcategory = resolvedSubcategory.filterValue;

  // Memoizar displayProducts para evitar recalcular en cada render
  const displayProducts = useMemo(() => {
    if (filter) {
      return getProductsByFilter(filter);
    }
    return filterProducts(searchQuery, effectiveCategory, priceRange, sortBy, effectiveSubcategory);
  }, [filter, getProductsByFilter, filterProducts, searchQuery, effectiveCategory, priceRange, sortBy, effectiveSubcategory]);

  const categoryGroups = useMemo(() => {
    const grouped = new Map<string, { displayName: string; icon?: string; products: typeof displayProducts }>();

    const attachProductToGroup = (key: string, product: (typeof displayProducts)[number], displayName?: string, icon?: string) => {
      const existing = grouped.get(key) ?? { displayName: displayName ?? 'Sin categoría', icon, products: [] };
      if (!grouped.has(key)) {
        grouped.set(key, existing);
      }
      existing.products.push(product);
    };

    displayProducts.forEach((product) => {
      const candidates = getProductCategoryCandidates(product);
      const primaryCandidate = candidates[0] ?? (product.categoria as string) ?? 'Sin categoría';

      const matchedCategory = findCategoryByValue(primaryCandidate);
      const key = matchedCategory?.id ?? primaryCandidate;
      const displayName = matchedCategory?.name ?? formatCategoryLabel(primaryCandidate);
      const icon = matchedCategory?.icon;
      attachProductToGroup(key, product, displayName, icon);
    });

    return Array.from(grouped.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [displayProducts, categories]);

  const getPageTitle = () => {
    if (searchQuery) return `Resultados para "${searchQuery}"`;
    if (effectiveCategory && effectiveCategory !== 'all') {
      const categoryName = resolvedCategory.displayName || formatCategoryLabel(effectiveCategory);
      if (effectiveSubcategory) {
        const subcategoryName = resolvedSubcategory.displayName || formatCategoryLabel(effectiveSubcategory);
        return `${categoryName} - ${subcategoryName}`;
      }
      return `Categoría: ${categoryName}`;
    }
    if (effectiveCategory === 'all') {
      return 'Todos los productos';
    }
    if (filter === 'ofertas') return 'Ofertas Especiales';
    if (filter === 'nuevos') return 'Productos Nuevos';
    if (filter === 'popular') return 'Más Vendidos';
    return 'Nuestros Productos';
  };

  const noCategoryFilter = !effectiveCategory || effectiveCategory === 'all';
  const noSubcategoryFilter = !effectiveSubcategory;
  const noActiveFilters = !searchQuery && !filter && noCategoryFilter && !priceRange && !sortBy && noSubcategoryFilter;
  const shouldShowBanner = noActiveFilters;

  const handleResetFilters = () => {
    if (typeof window === 'undefined') return;
    const basePath = window.location.pathname;
    window.history.pushState(null, '', basePath);
    window.location.reload();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-white to-slate-800 py-16">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-xl shadow-red-600/30 p-12 border border-slate-700 text-center">
            <div className="text-pink text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-2">Error al cargar productos</h2>
            <p className="text-yellow-300 text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* PRIORIDAD 1: Banner aparece INMEDIATAMENTE - como PC Factory */}
      {shouldShowBanner && (
        <div className="space-y-8">
          <MainBanner
            config={mainBannerConfig ?? {}}
            onResetFilters={handleResetFilters}
          />
          <section className="relative border border-slate-100 rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-white px-4 py-6 sm:px-8">
            <div className="max-w-6xl mx-auto grid gap-4 md:grid-cols-4">
              {heroStats.map(({ label, value, detail, icon: Icon }) => (
                <div key={label} className="bg-white/90 rounded-2xl border border-white shadow-[0_30px_80px_-60px_rgba(15,81,148,0.6)] p-4 flex flex-col gap-2">
                  <div className="inline-flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                    <Icon className="h-4 w-4 text-sky-500" />
                    {label}
                  </div>
                  <p className="text-3xl font-black text-slate-900">{value}</p>
                  <p className="text-sm text-slate-500">{detail}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {perks.map(({ title, description, icon: Icon, accent }) => (
                <div key={title} className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_30px_60px_-50px_rgba(14,65,114,0.8)]">
                  <div className={`absolute inset-0 opacity-70 bg-gradient-to-br ${accent}`} />
                  <div className="relative p-5 space-y-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-slate-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* PRIORIDAD 1.5: Layouts Pinterest de categorías promocionales - solo en página principal */}
      {shouldShowBanner && (
        <section className="py-10 sm:py-14 lg:py-16 bg-gradient-to-b from-white via-sky-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-black text-slate-900">✨ Colecciones destacadas</h2>
                <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
                  Curadas por el equipo Gamerhouse para que armes tu setup con tonos claros, celestes y rosas.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 grid-flow-dense">
                
                {/* Promoción grande - Electrónicos */}
                <Link href="/?category=tecnologia" className="col-span-2 md:col-span-2 md:row-span-2 group">
                  <div className="relative rounded-3xl border border-slate-100 overflow-hidden bg-white shadow-[0_40px_80px_-60px_rgba(15,81,148,0.8)] hover:-translate-y-2 transition-transform">
                    <Image
                      src="https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&h=600&fit=crop&crop=center"
                      alt="Electrónicos y Tecnología"
                      width={800}
                      height={600}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-semibold text-slate-700">
                      <Sparkles className="h-4 w-4 text-pink" />HASTA 50% OFF
                    </div>
                    <div className="absolute bottom-6 left-6 text-white">
                      <h3 className="text-3xl font-bold mb-1">Electrónicos</h3>
                      <p className="text-sm text-white/80">Periféricos RGB, consolas y más.</p>
                    </div>
                  </div>
                </Link>

                {/* Promoción alta - Moda */}
                <Link href="/?category=moda" className="col-span-2 sm:col-span-1 md:row-span-2 group">
                  <div className="relative rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-[0_30px_60px_-45px_rgba(193,80,146,0.8)] hover:-translate-y-1 transition-transform">
                    <Image
                      src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&h=700&fit=crop&crop=center"
                      alt="Moda y Ropa"
                      width={500}
                      height={700}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-700">
                      <Sparkles className="h-3.5 w-3.5 text-pink" />Nueva colección
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-2xl font-bold mb-1">Moda Geek</h3>
                      <p className="text-sm text-white/80">Ropa y accesorios oficiales.</p>
                    </div>
                  </div>
                </Link>

                {/* Promociones normales */}
                <Link href="/?category=electrohogar" className="group">
                  <div className="relative h-32 rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-[0_25px_40px_-35px_rgba(28,66,106,0.8)] hover:-translate-y-1 transition-transform">
                    <Image
                      src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center"
                      alt="Electrohogar"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="text-lg font-bold">Electrohogar</h3>
                    </div>
                  </div>
                </Link>

                <Link href="/?category=calzado" className="group">
                  <div className="relative h-32 rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-[0_25px_40px_-35px_rgba(28,66,106,0.8)] hover:-translate-y-1 transition-transform">
                    <Image
                      src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop&crop=center"
                      alt="Calzado"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="text-lg font-bold">Calzado</h3>
                    </div>
                  </div>
                </Link>

                <Link href="/?category=fitness" className="group">
                  <div className="relative h-32 rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-[0_25px_40px_-35px_rgba(28,66,106,0.8)] hover:-translate-y-1 transition-transform">
                    <Image
                      src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center"
                      alt="Fitness"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="text-lg font-bold">Fitness</h3>
                    </div>
                  </div>
                </Link>

                <Link href="/?filter=ofertas" className="group">
                  <div className="relative h-32 rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-[0_25px_40px_-35px_rgba(28,66,106,0.8)] hover:-translate-y-1 transition-transform">
                    <Image
                      src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&h=300&fit=crop&crop=center"
                      alt="Ofertas"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="text-lg font-bold">Ofertas activas</h3>
                    </div>
                  </div>
                </Link>

                <Link href="/?filter=nuevos" className="group">
                  <div className="relative h-32 rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-[0_25px_40px_-35px_rgba(28,66,106,0.8)] hover:-translate-y-1 transition-transform">
                    <Image
                      src="https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=400&h=300&fit=crop&crop=center"
                      alt="Nuevos"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="text-lg font-bold">Nuevos ingresos</h3>
                    </div>
                  </div>
                </Link>

              </div>
            </div>
          </div>
        </section>
      )}

      {/* PRIORIDAD 2: Productos cargan después en segundo plano */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-slate-800 via-white to-slate-800">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header - Modern Admin Style */}
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-xl shadow-red-600/30 p-6 border border-yellow-300 mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/15" style={{ backgroundColor: 'var(--primary)' }}>
                  <span className="text-white text-lg">🛍️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {getPageTitle()}
                  </h2>
                  <p className="text-yellow-300 text-sm">Descubre nuestros productos</p>
                </div>
              </div>

              {/* Filter Controls - Modern Style */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <select
                  className="px-4 py-2.5 border-2 border-yellow-300/30 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-yellow-300500 bg-slate-900/80 hover:border-yellow-300-300 transition-all shadow-sm"
                  value={sortBy}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (e.target.value) {
                      params.set('sort', e.target.value);
                    } else {
                      params.delete('sort');
                    }
                    window.history.pushState(null, '', `?${params.toString()}`);
                    window.location.reload();
                  }}
                >
                  <option value="">📊 Ordenar por</option>
                  <option value="name">🔤 Nombre</option>
                  <option value="price-low">💰 Precio: menor a mayor</option>
                  <option value="price-high">💎 Precio: mayor a menor</option>
                  <option value="newest">✨ Más nuevos</option>
                </select>

                <select
                  className="px-4 py-2.5 border-2 border-yellow-300/30 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-yellow-300500 bg-slate-900/80 hover:border-yellow-300-300 transition-all shadow-sm"
                  value={priceRange}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (e.target.value) {
                      params.set('price', e.target.value);
                    } else {
                      params.delete('price');
                    }
                    window.history.pushState(null, '', `?${params.toString()}`);
                    window.location.reload();
                  }}
                >
                  <option value="">💵 Todos los precios</option>
                  <option value="0-50000">$0 - $50.000</option>
                  <option value="50000-100000">$50.000 - $100.000</option>
                  <option value="100000-200000">$100.000 - $200.000</option>
                  <option value="200000-+">$200.000+</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid organized by categories */}
          {loading ? (
            /* Skeleton elegante estilo PC Factory mientras cargan productos - Responsive */
            <div className="space-y-8 sm:space-y-12">
              <div className="animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8">
                  <div className="h-6 sm:h-8 bg-gray-300 rounded w-32 sm:w-48 mb-2 sm:mb-0"></div>
                  <div className="h-5 sm:h-6 bg-gray-300 rounded w-16 sm:w-20"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-slate-900/80 rounded-lg shadow-md p-3 sm:p-4">
                      <div className="h-32 sm:h-40 lg:h-48 bg-gray-300 rounded mb-3 sm:mb-4"></div>
                      <div className="h-3 sm:h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 sm:h-6 bg-gray-300 rounded w-16 sm:w-24"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : displayProducts.length > 0 ? (
            <>
              {/* Show products organized by category only on main page without filters */}
              {noActiveFilters ? (
                <>
                  {categoryGroups.map(group => (
                    <MasonryProductGrid
                      key={group.key}
                      products={group.products}
                      layoutConfig={layoutPatternsConfig}
                    />
                  ))}
                </>
              ) : (
                /* Masonry grid for filtered results */
                <>
                  <MasonryProductGrid products={displayProducts} layoutConfig={layoutPatternsConfig} />
                  
                  <div className="text-center mt-8 text-yellow-300">
                    Mostrando {displayProducts.length} productos
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-xl shadow-red-600/30 p-12 border border-yellow-300 text-center">
              <div className="text-yellow-300400 text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                No se encontraron productos
              </h3>
              <p className="text-yellow-300 text-lg">
                Intenta ajustar los filtros o buscar otro término
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
