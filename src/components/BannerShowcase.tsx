'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { useConfig } from '@/hooks/useConfig';

type BannerSlotKey = 'hero' | 'middle' | 'footer';

interface BannerShowcaseProps {
  className?: string;
  slots?: BannerSlotKey[];
}

interface BannerCard {
  id: string;
  title: string;
  text: string;
  image?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  emphasize?: boolean;
  height?: 'short' | 'medium' | 'tall';
}

export default function BannerShowcase({ className, slots }: BannerShowcaseProps) {
  const { bannerConfig } = useConfig();
  const slotOrder: BannerSlotKey[] = slots && slots.length > 0 ? slots : ['middle', 'footer'];
  const heightClasses: Record<NonNullable<BannerCard['height']>, string> = {
    short: 'min-h-[260px] sm:min-h-[320px] lg:min-h-[380px]',
    medium: 'min-h-[320px] sm:min-h-[380px] lg:min-h-[460px]',
    tall: 'min-h-[400px] sm:min-h-[460px] lg:min-h-[540px]'
  };

  const cards = useMemo((): BannerCard[] => {
    if (!bannerConfig?.slots) {
      return [];
    }

    return slotOrder.reduce<BannerCard[]>((acc, slotKey) => {
      const slot = bannerConfig.slots?.[slotKey];
      if (!slot) {
        return acc;
      }

      const hasContent = slot.title || slot.text || slot.image || slot.ctaLabel;
      if (!hasContent) {
        return acc;
      }

      acc.push({
        id: slotKey,
        title: slot.title || 'Campaña destacada',
        text: slot.text || 'Personaliza este banner desde el panel de administración.',
        image: slot.image,
        ctaLabel: slot.ctaLabel || 'Ver más',
        ctaUrl: slot.ctaUrl || '/productos',
        emphasize: slot.emphasize ?? false,
        height: slot.height || 'medium',
      });

      return acc;
    }, []);
  }, [bannerConfig.slots, slotOrder]);

  if (cards.length === 0 || bannerConfig.active === false) {
    return null;
  }

  return (
    <section className={`w-full ${className ?? ''}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 gap-6 ${cards.length > 1 ? 'lg:grid-cols-2' : ''} ${cards.length > 2 ? 'xl:grid-cols-3' : ''}`}>
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.ctaUrl || '/productos'}
              className={`group relative overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-lg transition-transform duration-500 ${card.emphasize ? 'lg:col-span-2 xl:col-span-3' : ''}`}
            >
              <div className="absolute inset-0">
                {card.image ? (
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02] group-hover:brightness-110 group-hover:contrast-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-200 to-cyan-100" />
                )}
                <div className="absolute inset-0 bg-black/35 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              </div>
              <div className={`relative flex flex-col justify-between gap-4 p-6 text-white drop-shadow-[0_10px_28px_rgba(0,0,0,0.65)] ${heightClasses[card.height ?? 'medium']}`}>
                <div className="space-y-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/85">
                    Banner destacado
                  </p>
                  <h3
                    className="text-2xl font-black leading-tight text-balance"
                    style={{ textShadow: '0 4px 18px rgba(0,0,0,0.8)' }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="text-base text-white/95"
                    style={{ textShadow: '0 4px 12px rgba(0,0,0,0.65)' }}
                  >
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
