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
  const textColor = logoConfig?.textColor || '#ffffff';
  const clampNeon = (value: number) => Math.min(Math.max(value, 0.1), 1);
  const neonIntensity = clampNeon(logoConfig?.neonIntensity ?? 0.75);
  const neonShadow = `0 0 ${6 + neonIntensity * 6}px ${textColor}, 0 0 ${14 + neonIntensity * 14}px ${textColor}, 0 0 ${26 + neonIntensity * 22}px ${textColor}`;

  return (
    <Link
      href="/"
      className="flex items-center gap-4 sm:gap-5 flex-shrink-0 hover:opacity-95 transition-all duration-200"
    >
      {imageUrl ? (
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[1.4rem] bg-gradient-to-br from-white via-yellow-50 to-amber-100 shadow-[0_12px_30px_rgba(0,0,0,0.2)] ring-2 ring-white/70 ring-offset-2 ring-offset-[#030711] overflow-hidden">
          <Image
            src={imageUrl}
            alt="Logo"
            fill
            className="object-contain scale-[1.15]"
          />
        </div>
      ) : (
        <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 text-4xl shadow-2xl ring-2 ring-white/40 ring-offset-2 ring-offset-[#030711]">
          {emoji}
        </div>
      )}

      <div className="leading-tight font-black" style={{ color: textColor, textShadow: neonShadow }}>
        {lines.length > 0 ? (
          lines.map((line, idx) => (
            <span
              key={idx}
              className={`block uppercase ${idx === 0 ? 'text-xl sm:text-2xl lg:text-[1.75rem] tracking-[0.2em]' : 'text-lg sm:text-xl lg:text-2xl tracking-[0.08em]'}`}
              style={idx === 0
                ? { color: textColor, textShadow: neonShadow }
                : { color: textColor, textShadow: neonShadow, opacity: 0.85 }}
            >
              {line}
            </span>
          ))
        ) : (
          <span
            className="text-xl sm:text-2xl lg:text-[1.75rem] uppercase tracking-[0.2em]"
            style={{ color: textColor, textShadow: neonShadow }}
          >
            {FALLBACK_LOGO.text}
          </span>
        )}
      </div>
    </Link>
  );
}
