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
    : (() => {
        if (slotCandidate?.linkType === 'category' && slotCandidate.categoryId) {
          return {
            href: `/categoria/${slotCandidate.categoryId}`,
            label: slotCandidate.ctaLabel || 'Ver categoría',
          };
        }
        return {
          href: slotCandidate?.ctaUrl || '/productos',
          label: slotCandidate?.ctaLabel || 'Ver más',
        };
      })();

  const title = sourceType === 'slide'
    ? slideCandidate?.title || slotCandidate?.title || 'Campaña destacada'
    : slotCandidate?.title || slideCandidate?.title || 'Campaña destacada';
  const text = sourceType === 'slide'
    ? slideCandidate?.subtitle || slotCandidate?.text
    : slotCandidate?.text || slideCandidate?.subtitle;

  const contentTextColor = sourceType === 'slot' && slotCandidate?.textColor
    ? slotCandidate.textColor
    : '#ffffff';
  const contentShadow = '0 12px 35px rgba(0,0,0,0.65)';

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
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
                onError={() => setImageError(true)}
              />
            )}
          </div>

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col justify-center gap-4 sm:gap-6 p-6 sm:p-10 lg:p-16 max-w-2xl min-h-[220px] sm:min-h-[320px] lg:min-h-[420px] m-4 sm:m-8">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white text-[10px] sm:text-xs font-bold tracking-[0.45em] uppercase border border-white/40">
                Destacado
              </span>
              <h2
                className="banner-elegant-glow text-3xl sm:text-4xl lg:text-6xl font-black leading-tight uppercase tracking-tight"
                style={{ color: contentTextColor, textShadow: contentShadow }}
              >
                {title}
              </h2>
            </div>

            {text && (
              <p
                className="banner-elegant-glow text-sm sm:text-lg max-w-lg leading-relaxed"
                style={{ color: contentTextColor, textShadow: contentShadow, opacity: 0.9 }}
              >
                {text}
              </p>
            )}

            <div className="pt-2 sm:pt-4">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-gradient-to-r from-amber-400 via-rose-400 to-pink-500 text-white font-semibold uppercase tracking-wider text-xs sm:text-sm shadow-[0_15px_40px_rgba(249,115,22,0.35)] hover:scale-105 transition-transform"
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
