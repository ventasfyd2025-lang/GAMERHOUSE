'use client';

import React, { useContext } from 'react';
import { useI18n } from '@/context/I18nContext';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-brand-neutral-dark/80/15 px-3 py-1 text-sm font-semibold text-white transition hover:bg-brand-neutral-dark/80/30 focus:outline-none focus:ring-2 focus:ring-white"
      aria-label={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-neutral-dark/80 text-xs font-bold text-[var(--primary)]">
        {language === 'es' ? 'ES' : 'EN'}
      </span>
      <span className="hidden sm:inline">
        {language === 'es' ? 'English' : 'Español'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;