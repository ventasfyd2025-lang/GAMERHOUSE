'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_BANNER_PLACEHOLDER } from '@/lib/placeholders';

interface SlideConfig {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  linkType?: 'product' | 'category' | 'url';
  productId?: string;
  categoryId?: string;
  customUrl?: string;
  ctaLabel?: string;
}

interface MainBannerProps {
  config: {
    active?: boolean;
    slides?: SlideConfig[];
  };
  onResetFilters: () => void;
}

export default function MainBanner({ config, onResetFilters }: MainBannerProps) {
  const preparedSlides = useMemo(() => {
    return (config?.slides || [])
      .filter((slide): slide is SlideConfig => Boolean(slide))
      .map((slide) => ({
        ...slide,
        title: slide.title?.trim() || undefined,
        subtitle: slide.subtitle?.trim() || undefined,
        imageUrl: slide.imageUrl?.trim() || undefined,
      }))
      .filter((slide) => slide.title || slide.subtitle || slide.imageUrl);
  }, [config?.slides]);

  const fallbackSlide: SlideConfig = {
    title: 'Siempre los mejores precios en TCG',
    subtitle: 'La mejor y más confiable tienda de Trading Card Games en Chile. Pokémon, One Piece, Yu-Gi-Oh! y más.',
    imageUrl: HERO_BANNER_PLACEHOLDER,
    linkType: 'product',
    productId: undefined,
  };

  const slides = preparedSlides;
  const bannerManaged = slides.length > 0;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!bannerManaged) {
      return;
    }
    setCurrentIndex(0);
  }, [slides.length, bannerManaged]);

  useEffect(() => {
    if (!bannerManaged || slides.length <= 1) {
      return;
    }
    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => {
      window.clearInterval(interval);
    };
  }, [slides.length, bannerManaged]);

  const slide = slides[currentIndex];

  const primaryLink = useMemo(() => {
    if (!slide) {
      return { href: '/productos', label: 'Explorar catálogo', external: false };
    }

    const linkType = slide.linkType || 'product';
    if (linkType === 'product' && slide.productId) {
      return {
        href: `/producto/${slide.productId}`,
        label: slide.ctaLabel || 'Ver producto destacado',
        external: false,
      };
    }
    if (linkType === 'category' && slide.categoryId) {
      return {
        href: `/categoria/${slide.categoryId}`,
        label: slide.ctaLabel || 'Ver categoría destacada',
        external: false,
      };
    }
    if (linkType === 'url' && slide.customUrl) {
      return {
        href: slide.customUrl,
        label: slide.ctaLabel || 'Ver más detalles',
        external: slide.customUrl.startsWith('http'),
      };
    }

    return { href: '/productos', label: slide.ctaLabel || 'Explorar catálogo', external: false };
  }, [slide]);

  if (!bannerManaged || !slide) {
    return null;
  }

  const imageUrl = slide.imageUrl || fallbackSlide.imageUrl!;
  const title = slide.title || fallbackSlide.title!;
  const subtitle = slide.subtitle || fallbackSlide.subtitle!;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-lg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_45%,rgba(85,201,231,0.2),transparent_55%),radial-gradient(circle_at_90%_5%,rgba(174,226,246,0.3),transparent_55%)] opacity-80" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
        <div className="flex-1 space-y-6 p-10 sm:p-12">
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
          </div>
        </div>

        <div className="relative hidden lg:flex flex-1 overflow-hidden min-h-[360px]">
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

        {slides.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-6 sm:px-10">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-slate-700 shadow-lg transition hover:scale-105"
              onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
              aria-label="Slide anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={`dot-${idx}`}
                  type="button"
                  aria-label={`Ir al slide ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    currentIndex === idx ? 'w-6 bg-sky-500' : 'w-2.5 bg-white/60'
                  }`}
                  onClick={() => setCurrentIndex(idx)}
                />
              ))}
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-slate-700 shadow-lg transition hover:scale-105"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
              aria-label="Siguiente slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
