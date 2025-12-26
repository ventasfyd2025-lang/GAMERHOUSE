'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useConfig } from '@/hooks/useConfig';
import { useEffect, useMemo, useState } from 'react';
import { WIDE_BANNER_PLACEHOLDER } from '@/lib/placeholders';

type ManagedSlide = {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  linkType?: 'product' | 'category' | 'url';
  productId?: string;
  categoryId?: string;
  customUrl?: string;
  ctaLabel?: string;
};

const resolveSlideLink = (slide?: ManagedSlide) => {
  if (!slide) {
    return { href: '/productos', label: 'Ver más' };
  }

  const label = slide.ctaLabel?.trim() || 'Ver más';
  switch (slide.linkType) {
    case 'product':
      return slide.productId
        ? { href: `/producto/${slide.productId}`, label }
        : { href: '/productos', label };
    case 'category':
      return slide.categoryId
        ? { href: `/categoria/${slide.categoryId}`, label }
        : { href: '/productos', label };
    case 'url':
      return slide.customUrl
        ? { href: slide.customUrl, label }
        : { href: '/productos', label };
    default:
      return { href: '/productos', label };
  }
};

export default function DynamicBanner() {
  const { bannerConfig, mainBannerConfig } = useConfig();
  const [imageError, setImageError] = useState(false);

  const heroSlot = bannerConfig?.slots?.hero;
  const heroSlide = useMemo(() => {
    if (!mainBannerConfig?.slides || mainBannerConfig.slides.length === 0) {
      return undefined;
    }
    const validSlides = mainBannerConfig.slides.filter((slide): slide is ManagedSlide => Boolean(slide));
    return validSlides.find((slide) => slide.imageUrl?.trim()) || validSlides[0];
  }, [mainBannerConfig?.slides]);

  const slotCandidate = bannerConfig?.active !== false && heroSlot && (
    heroSlot.image?.trim() || heroSlot.title?.trim() || heroSlot.text?.trim()
  )
    ? heroSlot
    : undefined;

  const slideCandidate = !slotCandidate && mainBannerConfig?.active !== false && heroSlide
    ? heroSlide
    : undefined;

  const sourceType = slotCandidate ? 'slot' : slideCandidate ? 'slide' : null;
  const sourceData = slotCandidate || slideCandidate;

  useEffect(() => {
    const img = sourceType === 'slot' ? slotCandidate?.image : slideCandidate?.imageUrl;
    setImageError(false);
  }, [sourceType, slotCandidate?.image, slideCandidate?.imageUrl]);

  if (!sourceType || !sourceData) {
    return null;
  }

  const fallbackImage = WIDE_BANNER_PLACEHOLDER;
  const chosenImage = (sourceType === 'slot'
    ? slotCandidate?.image
    : slideCandidate?.imageUrl) || fallbackImage;
  const imageUrl = imageError ? fallbackImage : chosenImage;

  const { href: ctaHref, label: ctaLabel } = sourceType === 'slide'
    ? resolveSlideLink(slideCandidate)
    : {
        href: slotCandidate?.ctaUrl || '/productos',
        label: slotCandidate?.ctaLabel || 'Ver más',
      };

  const title = sourceType === 'slide'
    ? slideCandidate?.title || slotCandidate?.title || 'Campaña destacada'
    : slotCandidate?.title || slideCandidate?.title || 'Campaña destacada';
  const text = sourceType === 'slide'
    ? slideCandidate?.subtitle || slotCandidate?.text
    : slotCandidate?.text || slideCandidate?.subtitle;

  return (
    <section className="w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <article className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-[0_40px_90px_-50px_rgba(15,23,42,0.45)] min-h-[220px] sm:min-h-[320px] lg:min-h-[420px] group bg-white">
          {/* Background Image */}
          <div className="absolute inset-0">
            {!imageError && (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
                onError={() => setImageError(true)}
              />
            )}
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/30 to-transparent" />

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col justify-center gap-3 sm:gap-5 p-6 sm:p-10 lg:p-16 text-slate-900 max-w-2xl min-h-[220px] sm:min-h-[320px] lg:min-h-[420px]">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-600 text-[10px] sm:text-xs font-bold tracking-widest uppercase border border-amber-200">
                Destacado
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black leading-tight uppercase tracking-tight">
                {title}
              </h2>
            </div>

            {text && (
              <p className="text-sm sm:text-lg text-slate-600 max-w-lg leading-relaxed">
                {text}
              </p>
            )}

            <div className="pt-2 sm:pt-4">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-gradient-to-r from-amber-400 to-rose-400 text-white font-semibold uppercase tracking-wider text-xs sm:text-sm hover:from-amber-300 hover:to-rose-300 hover:shadow-lg transition-all"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
