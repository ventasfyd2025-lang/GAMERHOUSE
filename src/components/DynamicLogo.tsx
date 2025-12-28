'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useConfig } from '@/hooks/useConfig';

const FALLBACK_LOGO = { text: 'GAMER HOUSE', image: '', emoji: '🎮' };

export default function DynamicLogo() {
  const { logoConfig } = useConfig();
  const textValue = logoConfig?.text?.trim() || FALLBACK_LOGO.text;
  const lines = textValue.split('\n').map((line) => line.trim()).filter(Boolean);
  const imageUrl = logoConfig?.image || FALLBACK_LOGO.image;
  const emoji = logoConfig?.emoji || FALLBACK_LOGO.emoji;

  return (
    <Link href="/" className="flex items-center gap-4 flex-shrink-0 hover:opacity-85 transition-opacity">
      {imageUrl ? (
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/95 shadow-lg border border-white/70 overflow-hidden">
          <Image
            src={imageUrl}
            alt="Logo"
            fill
            className="object-contain scale-[1.08]"
          />
        </div>
      ) : (
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-red-50 text-3xl shadow-lg">
          {emoji}
        </div>
      )}

      <div className="leading-tight font-bold text-slate-900 whitespace-pre-line">
        {lines.length > 0 ? (
          lines.map((line, idx) => (
            <span key={idx} className="block text-lg sm:text-xl tracking-tight">
              {line}
            </span>
          ))
        ) : (
          <span className="text-lg sm:text-xl">{FALLBACK_LOGO.text}</span>
        )}
      </div>
    </Link>
  );
}
