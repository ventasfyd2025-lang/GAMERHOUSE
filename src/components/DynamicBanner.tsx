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

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-xl overflow-hidden shadow-lg h-64 md:h-80">
          <Image
            src={imageUrl}
            alt={bannerConfig.title || 'Banner'}
            fill
            className="object-cover"
          />
          {/* Overlay con contenido */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center p-6 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {bannerConfig.title}
            </h2>
            <p className="text-white text-lg mb-6 max-w-2xl">
              {bannerConfig.text}
            </p>
            <div>
              <button className="inline-flex items-center gap-2 bg-gamerhouse-red text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                Ver más
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
