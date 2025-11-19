'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { useConfig } from '@/hooks/useConfig';

type LinkConfig = {
  href: string;
  label: string;
  external: boolean;
};

const buildLink = (slide: any): LinkConfig => {
  if (!slide) {
    return { href: '/productos', label: 'Ver catálogo', external: false };
  }
  const linkType = slide.linkType || 'product';
  if (linkType === 'product' && slide.productId) {
    return { href: `/producto/${slide.productId}`, label: slide.ctaLabel || 'Ver producto', external: false };
  }
  if (linkType === 'category' && slide.categoryId) {
    return { href: `/categoria/${slide.categoryId}`, label: slide.ctaLabel || 'Ver categoría', external: false };
  }
  if (linkType === 'url' && slide.customUrl) {
    const external = /^https?:/i.test(slide.customUrl);
    return { href: slide.customUrl, label: slide.ctaLabel || 'Ver más', external };
  }
  return { href: '/productos', label: slide.ctaLabel || 'Explorar catálogo', external: false };
};

interface BannerShowcaseProps {
  className?: string;
  startIndex?: number;
  maxItems?: number;
}

export default function BannerShowcase({ className, startIndex = 0, maxItems }: BannerShowcaseProps) {
  const { bannerConfig, mainBannerConfig } = useConfig();

  const cards = useMemo(() => {
    const extraBanners = (bannerConfig?.images || [])
      .slice(1)
      .map((src, index) => ({
        title: bannerConfig?.title || 'Campaña destacada',
        subtitle: bannerConfig?.text || 'Descubre nuevos lanzamientos pastel',
        imageUrl: src,
        link: {
          href: bannerConfig?.ctaUrl || '/productos',
          label: bannerConfig?.ctaLabel || 'Ver más',
          external: false,
        },
        id: `banner-config-${index}`,
      }));

    const slideBanners = (mainBannerConfig?.slides || [])
      .filter((slide) => slide)
      .map((slide, index) => ({
        title: slide?.title?.trim() || 'Destacado Gamer',
        subtitle: slide?.subtitle?.trim() || 'Conoce nuestra selección especial',
        imageUrl: slide?.imageUrl || '/banner-hero-gamerhouse.jpg',
        link: buildLink(slide),
        id: `${slide?.title || 'slide'}-${index}`,
      }));

    const merged = [...extraBanners, ...slideBanners];
    const sliced = merged.slice(startIndex, maxItems ? startIndex + maxItems : undefined);
    return sliced;
  }, [bannerConfig, mainBannerConfig?.slides, startIndex, maxItems]);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className={`w-full ${className ?? ''}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.link.href}
              target={card.link.external ? '_blank' : undefined}
              rel={card.link.external ? 'noopener noreferrer' : undefined}
              className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-lg"
            >
              <div className="absolute inset-0">
                <Image
                  src={card.imageUrl}
                  alt={card.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#031624]/85 via-[#04314a]/50 to-transparent" />
              </div>
              <div className="relative flex min-h-[180px] flex-col justify-between gap-3 p-5 text-white">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-white/70">
                    Banner destacado
                  </p>
                  <h3 className="text-xl font-bold leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-sm text-white/85">
                    {card.subtitle}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-100">
                  {card.link.label}
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
