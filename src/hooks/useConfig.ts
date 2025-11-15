'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LogoConfig {
  emoji: string;
  text: string;
  image: string;
}

interface BannerConfig {
  title: string;
  text: string;
  active: boolean;
  images: string[];
}

type MainBannerLinkType = 'product' | 'category' | 'url';

const isMainBannerLinkType = (value: unknown): value is MainBannerLinkType => (
  value === 'product' || value === 'category' || value === 'url'
);

interface MainBannerSlide {
  linkType?: MainBannerLinkType;
  productId?: string;
  categoryId?: string;
  customUrl?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
}

interface MainBannerConfig {
  active: boolean;
  slides: MainBannerSlide[];
}

const DEFAULT_LOGO: LogoConfig = {
  emoji: '🎴',
  text: 'HunterCard TCG',
  image: '',
};

const DEFAULT_BANNER: BannerConfig = {
  title: '¡Ofertas Especiales!',
  text: 'Hasta 50% de descuento en productos seleccionados',
  active: false,
  images: [],
};

const DEFAULT_MAIN_BANNER: MainBannerConfig = {
  active: false,
  slides: [],
};

const sanitizeMainBannerSlides = (input: unknown): MainBannerSlide[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((rawSlide) => {
    const slide = (rawSlide && typeof rawSlide === 'object') ? rawSlide as Record<string, unknown> : {};

    const linkTypeValue = slide.linkType;

    return {
      title: typeof slide.title === 'string' ? slide.title : undefined,
      subtitle: typeof slide.subtitle === 'string' ? slide.subtitle : undefined,
      imageUrl: typeof slide.imageUrl === 'string' ? slide.imageUrl : undefined,
      productId: typeof slide.productId === 'string' ? slide.productId : undefined,
      categoryId: typeof slide.categoryId === 'string' ? slide.categoryId : undefined,
      customUrl: typeof slide.customUrl === 'string' ? slide.customUrl : undefined,
      linkType: isMainBannerLinkType(linkTypeValue) ? linkTypeValue : undefined,
    } satisfies MainBannerSlide;
  });
};

const sanitizeLogoConfig = (raw: Record<string, unknown> | undefined): LogoConfig => ({
  emoji: typeof raw?.emoji === 'string' && raw.emoji.trim() ? raw.emoji : DEFAULT_LOGO.emoji,
  text: typeof raw?.text === 'string' && raw.text.trim() ? raw.text : DEFAULT_LOGO.text,
  image: typeof raw?.image === 'string' ? raw.image : '',
});

const sanitizeBannerConfig = (raw: Record<string, unknown> | undefined): BannerConfig => ({
  title: typeof raw?.title === 'string' && raw.title.trim() ? raw.title : DEFAULT_BANNER.title,
  text: typeof raw?.text === 'string' && raw.text.trim() ? raw.text : DEFAULT_BANNER.text,
  active: raw?.active !== false,
  images: Array.isArray(raw?.images)
    ? raw!.images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0)
    : [],
});

export function useConfig() {
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(DEFAULT_LOGO);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(DEFAULT_BANNER);
  const [mainBannerConfig, setMainBannerConfig] = useState<MainBannerConfig>(DEFAULT_MAIN_BANNER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let loadedSegments = 0;
    const markLoaded = () => {
      loadedSegments += 1;
      if (loadedSegments >= 3) {
        setLoading(false);
      }
    };

    const unsubLogo = onSnapshot(
      doc(db, 'config', 'logo'),
      (snapshot) => {
        setLogoConfig(snapshot.exists() ? sanitizeLogoConfig(snapshot.data()) : DEFAULT_LOGO);
        markLoaded();
      },
      (err) => {
        console.error('Error cargando logo:', err);
        setLogoConfig(DEFAULT_LOGO);
        setError('No se pudo cargar el logo, usando valores por defecto.');
        markLoaded();
      }
    );

    const unsubBanner = onSnapshot(
      doc(db, 'config', 'banner'),
      (snapshot) => {
        setBannerConfig(snapshot.exists() ? sanitizeBannerConfig(snapshot.data()) : DEFAULT_BANNER);
        markLoaded();
      },
      (err) => {
        console.error('Error cargando banner:', err);
        setBannerConfig(DEFAULT_BANNER);
        setError('No se pudo cargar el banner, usando valores por defecto.');
        markLoaded();
      }
    );

    const unsubMainBanner = onSnapshot(
      doc(db, 'config', 'main-banner'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Record<string, unknown>;
          setMainBannerConfig({
            active: Boolean(data.active),
            slides: sanitizeMainBannerSlides(data.slides),
          });
        } else {
          setMainBannerConfig(DEFAULT_MAIN_BANNER);
        }
        markLoaded();
      },
      (err) => {
        console.error('Error cargando main-banner:', err);
        setMainBannerConfig(DEFAULT_MAIN_BANNER);
        setError('No se pudo cargar el banner principal, usando valores por defecto.');
        markLoaded();
      }
    );

    return () => {
      unsubLogo();
      unsubBanner();
      unsubMainBanner();
    };
  }, [reloadKey]);

  const refetch = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  return {
    logoConfig,
    bannerConfig,
    mainBannerConfig,
    loading,
    error,
    refetch,
  };
}

export default useConfig;
