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
    <section className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <article className="glass-panel relative overflow-hidden min-h-[260px] sm:min-h-[320px] lg:min-h-[360px]">
          <Image
            src={imageUrl}
            alt={bannerConfig.title || 'Banner principal'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#032031]/85 via-[#0b3f53]/50 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-center gap-3 sm:gap-4 p-6 sm:p-10 text-white">
            <p className="uppercase tracking-[0.35em] text-[10px] sm:text-xs text-white/70">Destacado</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              {bannerConfig.title}
            </h2>
            {bannerConfig.text && (
              <p className="text-sm sm:text-base lg:text-lg text-white/85 max-w-2xl">
                {bannerConfig.text}
              </p>
            )}
            <div>
              <Link
                href={ctaHref}
                className="btn-solid w-full sm:w-auto justify-center text-sm sm:text-base"
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
