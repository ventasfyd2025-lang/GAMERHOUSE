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
    <Link href="/" className="flex items-center gap-3 flex-shrink-0 hover:opacity-85 transition-opacity">
      {imageUrl ? (
        <div className="relative w-10 h-10 rounded-xl bg-white shadow-inner border border-slate-200">
          <Image
            src={imageUrl}
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-2xl">
          {emoji}
        </div>
      )}

      <div className="leading-tight font-bold text-slate-900 whitespace-pre-line">
        {lines.length > 0 ? (
          lines.map((line, idx) => (
            <span key={idx} className="block text-base">
              {line}
            </span>
          ))
        ) : (
          <span className="text-base">{FALLBACK_LOGO.text}</span>
        )}
      </div>
    </Link>
  );
}
