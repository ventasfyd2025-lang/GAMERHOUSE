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
    <section className="w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-10">
      <div className="max-w-6xl mx-auto">
        <article className="glass-panel relative overflow-hidden min-h-[200px] sm:min-h-[260px] lg:min-h-[320px]">
          <Image
            src={imageUrl}
            alt={bannerConfig.title || 'Banner principal'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#032031]/90 via-[#0b3f53]/55 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-center gap-2.5 sm:gap-4 p-5 sm:p-8 lg:p-10 text-white max-w-2xl">
            <p className="uppercase tracking-[0.35em] text-[10px] sm:text-xs text-white/65">Destacado</p>
            <h2 className="text-xl sm:text-3xl lg:text-[2.5rem] font-bold leading-tight">
              {bannerConfig.title}
            </h2>
            {bannerConfig.text && (
              <p className="text-sm sm:text-base lg:text-lg text-white/80">
                {bannerConfig.text}
              </p>
            )}
            <div>
              <Link
                href={ctaHref}
                className="btn-solid w-full sm:w-auto justify-center text-xs sm:text-sm"
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
