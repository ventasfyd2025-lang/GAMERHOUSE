'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useConfig } from '@/hooks/useConfig';

export default function DynamicLogo() {
  const { logoConfig } = useConfig();

  // Si no hay config, usar default
  const logo = logoConfig || { text: 'GAMER\nHOUSE', image: '', emoji: '' };

  return (
    <Link href="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
      {logo.image ? (
        <div className="relative w-10 h-10">
          <Image
            src={logo.image}
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>
      ) : null}

      <div className="flex flex-col leading-none">
        {logo.text && (
          <>
            {logo.text.includes('\n') ? (
              // Si el texto tiene saltos de línea (para formato multi-línea)
              logo.text.split('\n').map((line, idx) => (
                <span key={idx} className="text-sm font-bold text-gamerhouse-red">
                  {line}
                </span>
              ))
            ) : (
              // Formato de una sola línea
              <span className="text-xl font-bold bg-gradient-to-r from-gamerhouse-red to-gamerhouse-navy bg-clip-text text-transparent">
                {logo.text}
              </span>
            )}
          </>
        )}
      </div>
    </Link>
  );
}
