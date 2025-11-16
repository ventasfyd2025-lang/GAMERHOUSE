'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useConfig } from '@/hooks/useConfig';

export default function DynamicBanner() {
  const { bannerConfig } = useConfig();

  if (!bannerConfig?.active || !bannerConfig?.images?.length) {
    return null;
  }

  const imageUrl = bannerConfig.images[0];

  const ctaHref = bannerConfig.ctaUrl || '/productos';
  const ctaLabel = bannerConfig.ctaLabel || 'Ver más';

  return (
    <section className="w-full px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <article className="glass-panel relative overflow-hidden h-64 md:h-80">
          <Image
            src={imageUrl}
            alt={bannerConfig.title || 'Banner'}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-center gap-4 p-6 md:p-12 text-white">
            <p className="uppercase tracking-[0.3em] text-xs text-white/70">Destacado</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              {bannerConfig.title}
            </h2>
            <p className="text-base md:text-lg text-white/85 max-w-2xl">
              {bannerConfig.text}
            </p>
            <div>
              <Link
                href={ctaHref}
                className="btn-solid"
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
