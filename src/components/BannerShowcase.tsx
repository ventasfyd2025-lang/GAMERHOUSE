'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { useConfig } from '@/hooks/useConfig';

interface BannerShowcaseProps {
  className?: string;
  slots?: Array<'middle' | 'footer'>;
}

export default function BannerShowcase({ className, slots }: BannerShowcaseProps) {
  const { bannerConfig } = useConfig();
  const slotOrder = slots && slots.length > 0 ? slots : ['middle', 'footer'];

  const cards = useMemo(() => {
    if (!bannerConfig?.slots) {
      return [] as Array<{ id: string; title: string; text: string; image?: string; ctaLabel?: string; ctaUrl?: string }>;
    }

    return slotOrder
      .map((slotKey) => {
        const slot = bannerConfig.slots?.[slotKey];
        if (!slot) {
          return null;
        }
        const hasContent = slot.title || slot.text || slot.image || slot.ctaLabel;
        if (!hasContent) {
          return null;
        }
        return {
          id: slotKey,
          title: slot.title || 'Campaña destacada',
          text: slot.text || 'Personaliza este banner desde el panel de administración.',
          image: slot.image,
          ctaLabel: slot.ctaLabel || 'Ver más',
          ctaUrl: slot.ctaUrl || '/productos',
        };
      })
      .filter(Boolean) as Array<{ id: string; title: string; text: string; image?: string; ctaLabel?: string; ctaUrl?: string }>;
  }, [bannerConfig.slots, slotOrder]);

  if (cards.length === 0 || bannerConfig.active === false) {
    return null;
  }

  return (
    <section className={`w-full ${className ?? ''}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 gap-4 ${cards.length > 1 ? 'sm:grid-cols-2' : ''} ${cards.length > 2 ? 'lg:grid-cols-3' : ''}`}>
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.ctaUrl || '/productos'}
              className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-lg"
            >
              <div className="absolute inset-0">
                {card.image ? (
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-200 to-cyan-100" />
                )}
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
                    {card.text}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-100">
                  {card.ctaLabel || 'Ver más'}
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
