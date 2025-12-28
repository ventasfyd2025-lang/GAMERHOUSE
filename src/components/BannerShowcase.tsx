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
  const PLACEHOLDER_TEXT = 'Personaliza este banner desde el panel de administración.';
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

      const normalizedText = slot.text && slot.text.trim() === PLACEHOLDER_TEXT ? '' : (slot.text?.trim() ?? '');

      acc.push({
        id: slotKey,
        title: slot.title || 'Campaña destacada',
        text: normalizedText,
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

  const responsiveSizes = cards.length > 1
    ? '(max-width: 1024px) 100vw, (max-width: 1536px) 50vw, 33vw'
    : '100vw';

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
                    sizes={responsiveSizes}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02] group-hover:brightness-110 group-hover:contrast-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-200 to-cyan-100" />
                )}
              </div>
              <div className={`relative flex flex-col justify-between gap-4 p-6 text-white drop-shadow-[0_12px_28px_rgba(0,0,0,0.75)] ${heightClasses[card.height ?? 'medium']}`}>
                <div className="space-y-3">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white text-[10px] sm:text-xs font-bold tracking-[0.35em] uppercase border border-white/30">
                    Destacado
                  </span>
                  <h3
                    className={`banner-neon-text font-black leading-tight text-balance ${card.id === 'middle' || card.id === 'footer' ? 'text-4xl sm:text-5xl' : 'text-2xl'}`}
                  >
                    {card.title}
                  </h3>
                  {card.text && (
                    <p
                      className={`banner-neon-text--secondary ${card.id === 'middle' || card.id === 'footer' ? 'text-xl sm:text-2xl leading-snug' : 'text-base'}`}
                      style={{ textShadow: '0 6px 16px rgba(0,0,0,0.65)' }}
                    >
                      {card.text}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-6 py-2.5 sm:px-7 sm:py-3 rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-pink-500 text-white font-semibold uppercase tracking-wider text-xs sm:text-sm shadow-[0_10px_30px_rgba(249,115,22,0.35)]"
                >
                  {card.ctaLabel || 'Ver más'}
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
