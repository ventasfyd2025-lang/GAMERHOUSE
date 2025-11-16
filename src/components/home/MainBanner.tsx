'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

interface SlideConfig {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  linkType?: 'product' | 'category' | 'url';
  productId?: string;
  categoryId?: string;
  customUrl?: string;
}

interface MainBannerProps {
  config: {
    active?: boolean;
    slides?: SlideConfig[];
  };
  onResetFilters: () => void;
}

function resolveSlide(config: MainBannerProps['config']): SlideConfig | undefined {
  if (!config?.active) {
    return undefined;
  }
  return config.slides?.find((slide) => (slide?.imageUrl || '').trim());
}

export default function MainBanner({ config, onResetFilters }: MainBannerProps) {
  const slide = resolveSlide(config);

  const imageUrl = slide?.imageUrl || '/banner-hero-gamerhouse.jpg';
  const title = slide?.title || 'Siempre los mejores precios en TCG';
  const subtitle = slide?.subtitle || 'La mejor y más confiable tienda de Trading Card Games en Chile. Pokémon, One Piece, Yu-Gi-Oh! y más.';

  const primaryLink = useMemo(() => {
    if (!slide) {
      return { href: '/productos', label: 'Explorar catálogo', external: false };
    }

    const linkType = slide.linkType || 'product';
    if (linkType === 'product' && slide.productId) {
      return { href: `/producto/${slide.productId}`, label: 'Ver producto destacado', external: false };
    }
    if (linkType === 'category' && slide.categoryId) {
      return { href: `/categoria/${slide.categoryId}`, label: 'Ver categoría destacada', external: false };
    }
    if (linkType === 'url' && slide.customUrl) {
      return { href: slide.customUrl, label: 'Ver más detalles', external: slide.customUrl.startsWith('http') };
    }

    return { href: '/productos', label: 'Explorar catálogo', external: false };
  }, [slide]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-lg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_45%,rgba(85,201,231,0.2),transparent_55%),radial-gradient(circle_at_90%_5%,rgba(174,226,246,0.3),transparent_55%)] opacity-80" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6 p-10 sm:p-12">
          <span className="inline-block px-4 py-1 bg-sky-50 text-sky-700 text-sm font-semibold rounded-full border border-sky-100">
            {slide ? 'Banner destacado' : 'Configura este banner desde Admin → Banners'}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-slate-900">
            {title}
          </h1>
          <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
            {subtitle}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href={primaryLink.href}
              target={primaryLink.external ? '_blank' : undefined}
              rel={primaryLink.external ? 'noopener noreferrer' : undefined}
              className="btn-solid w-full sm:w-auto justify-center text-sm sm:text-base"
            >
              {primaryLink.label}
            </Link>
            <button
              type="button"
              onClick={onResetFilters}
              className="btn-soft w-full sm:w-auto justify-center text-sm sm:text-base"
            >
              Ver catálogo completo
            </button>
          </div>
        </div>

        <div className="relative hidden lg:flex w-full max-w-xl overflow-hidden">
          <Link
            href={primaryLink.href}
            target={primaryLink.external ? '_blank' : undefined}
            rel={primaryLink.external ? 'noopener noreferrer' : undefined}
            className="relative h-full w-full"
          >
            <Image
              src={imageUrl}
              alt={slide?.title || 'Destacados Gamerhouse'}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[#041321]/80 via-transparent to-transparent" />
          </Link>
        </div>
      </div>
    </section>
  );
}
