'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useConfig } from '@/hooks/useConfig';
import { useState } from 'react';

export default function DynamicBanner() {
  const { bannerConfig } = useConfig();
  const [imageError, setImageError] = useState(false);
  const heroSlot = bannerConfig?.slots?.hero;

  // Fallback image if the configured one fails or is missing
  const fallbackImage = '/banner-placeholder.jpg'; // Ensure this exists or use a solid color div

  if (!bannerConfig?.active || !heroSlot) {
    return null;
  }

  const imageUrl = imageError ? fallbackImage : (heroSlot.image || fallbackImage);
  const ctaHref = heroSlot.ctaUrl || '/productos';
  const ctaLabel = heroSlot.ctaLabel || 'Ver más';
  const title = heroSlot.title || 'Campaña destacada';
  const text = heroSlot.text;

  return (
    <section className="w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <article className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] min-h-[200px] sm:min-h-[300px] lg:min-h-[400px] group">
          {/* Background Image */}
          <div className="absolute inset-0 bg-gray-900">
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
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col justify-center gap-3 sm:gap-5 p-6 sm:p-10 lg:p-16 text-white max-w-2xl h-full min-h-[200px] sm:min-h-[300px] lg:min-h-[400px]">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-400 text-[10px] sm:text-xs font-bold tracking-widest uppercase border border-yellow-400/20 backdrop-blur-sm">
                Destacado
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black leading-tight uppercase italic tracking-tighter">
                {title}
              </h2>
            </div>

            {text && (
              <p className="text-sm sm:text-lg text-gray-300 max-w-lg leading-relaxed">
                {text}
              </p>
            )}

            <div className="pt-2 sm:pt-4">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-yellow-400 text-black font-black uppercase tracking-wider text-xs sm:text-sm hover:bg-yellow-300 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,222,0,0.4)]"
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
