'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WIDE_BANNER_PLACEHOLDER } from '@/lib/placeholders';

interface LogoConfig {
  emoji: string;
  text: string;
  image: string;
  textColor: string;
  neonIntensity: number;
}

type BannerSlotKey = 'hero' | 'middle' | 'footer';

interface BannerSlotConfig {
  title?: string;
  text?: string;
  image?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  emphasize?: boolean;
  height?: 'short' | 'medium' | 'tall';
  linkType?: 'url' | 'category';
  categoryId?: string;
  textColor?: string;
}

interface BannerConfig {
  active: boolean;
  slots: Record<BannerSlotKey, BannerSlotConfig>;
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
  ctaLabel?: string;
}

interface MainBannerConfig {
  active: boolean;
  slides: MainBannerSlide[];
}

const DEFAULT_LOGO: LogoConfig = {
  emoji: '🎴',
  text: 'HunterCard TCG',
  image: '',
  textColor: '#ffffff',
  neonIntensity: 0.75,
};

const SLOT_DEFAULT_HEIGHT: Record<BannerSlotKey, 'short' | 'medium' | 'tall'> = {
  hero: 'tall',
  middle: 'tall',
  footer: 'medium',
};

const SLOT_DEFAULT_EMPHASIS: Record<BannerSlotKey, boolean> = {
  hero: false,
  middle: true,
  footer: false,
};

const DEFAULT_SLOT: BannerSlotConfig = {
  title: 'Campaña destacada',
  text: 'Personaliza este banner desde el panel de administración',
  image: WIDE_BANNER_PLACEHOLDER,
  ctaUrl: '/productos',
  ctaLabel: 'Ver más',
  height: 'medium',
  emphasize: false,
  linkType: 'url',
  categoryId: '',
  textColor: '#ffffff',
};

const DEFAULT_BANNER: BannerConfig = {
  active: true,
  slots: {
    hero: { ...DEFAULT_SLOT, height: SLOT_DEFAULT_HEIGHT.hero, emphasize: SLOT_DEFAULT_EMPHASIS.hero },
    middle: { ...DEFAULT_SLOT, height: SLOT_DEFAULT_HEIGHT.middle, emphasize: SLOT_DEFAULT_EMPHASIS.middle },
    footer: { ...DEFAULT_SLOT, height: SLOT_DEFAULT_HEIGHT.footer, emphasize: SLOT_DEFAULT_EMPHASIS.footer },
  },
};

const DEFAULT_MAIN_BANNER: MainBannerConfig = {
  active: true,
  slides: [],
};

type ConfigCachePayload = {
  logo: LogoConfig;
  banner: BannerConfig;
  mainBanner: MainBannerConfig;
};

const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const configCache: { payload?: ConfigCachePayload; timestamp: number } = {
  timestamp: 0,
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
      ctaLabel: typeof slide.ctaLabel === 'string' ? slide.ctaLabel : undefined,
      linkType: isMainBannerLinkType(linkTypeValue) ? linkTypeValue : undefined,
    } satisfies MainBannerSlide;
  });
};

const sanitizeLogoConfig = (raw: Record<string, unknown> | undefined): LogoConfig => ({
  emoji: typeof raw?.emoji === 'string' && raw.emoji.trim() ? raw.emoji : DEFAULT_LOGO.emoji,
  text: typeof raw?.text === 'string' && raw.text.trim() ? raw.text : DEFAULT_LOGO.text,
  image: typeof raw?.image === 'string' ? raw.image : '',
  textColor: typeof raw?.textColor === 'string' && raw.textColor.trim()
    ? raw.textColor
    : DEFAULT_LOGO.textColor,
  neonIntensity: typeof raw?.neonIntensity === 'number'
    ? Math.min(Math.max(raw.neonIntensity, 0.1), 1)
    : DEFAULT_LOGO.neonIntensity,
});

const sanitizeSlot = (slot: Record<string, unknown> | undefined): BannerSlotConfig => ({
  title: typeof slot?.title === 'string' && slot.title.trim() ? slot.title : undefined,
  text: typeof slot?.text === 'string' && slot.text.trim() ? slot.text : undefined,
  image: typeof slot?.image === 'string' && slot.image.trim() ? slot.image : undefined,
  ctaUrl: typeof slot?.ctaUrl === 'string' && slot.ctaUrl.trim() ? slot.ctaUrl : undefined,
  ctaLabel: typeof slot?.ctaLabel === 'string' && slot.ctaLabel.trim() ? slot.ctaLabel : undefined,
  emphasize: typeof slot?.emphasize === 'boolean' ? slot.emphasize : undefined,
  height: typeof slot?.height === 'string' && ['short', 'medium', 'tall'].includes(slot.height)
    ? (slot.height as 'short' | 'medium' | 'tall')
    : undefined,
  linkType: slot?.linkType === 'category' ? 'category' : 'url',
  categoryId: typeof slot?.categoryId === 'string' && slot.categoryId.trim() ? slot.categoryId : undefined,
  textColor: typeof slot?.textColor === 'string' && slot.textColor.trim() ? slot.textColor : undefined,
});

const sanitizeBannerConfig = (raw: Record<string, unknown> | undefined): BannerConfig => {
  const buildSlot = (slotKey: BannerSlotKey, fallback?: BannerSlotConfig): BannerSlotConfig => {
    const slotData = rawSlots?.[slotKey];
    const sanitized = sanitizeSlot(slotData);
    const defaultHeight = SLOT_DEFAULT_HEIGHT[slotKey] ?? DEFAULT_SLOT.height ?? 'medium';
    const defaultEmphasis = SLOT_DEFAULT_EMPHASIS[slotKey] ?? DEFAULT_SLOT.emphasize ?? false;

    return {
      title: sanitized.title ?? fallback?.title ?? DEFAULT_SLOT.title,
      text: sanitized.text ?? fallback?.text ?? DEFAULT_SLOT.text,
      image: sanitized.image ?? fallback?.image ?? DEFAULT_SLOT.image,
      ctaUrl: sanitized.ctaUrl ?? fallback?.ctaUrl ?? DEFAULT_SLOT.ctaUrl,
      ctaLabel: sanitized.ctaLabel ?? fallback?.ctaLabel ?? DEFAULT_SLOT.ctaLabel,
      height: sanitized.height ?? fallback?.height ?? defaultHeight,
      emphasize: sanitized.emphasize ?? fallback?.emphasize ?? defaultEmphasis,
      linkType: sanitized.linkType ?? fallback?.linkType ?? DEFAULT_SLOT.linkType,
      categoryId: sanitized.categoryId ?? fallback?.categoryId ?? DEFAULT_SLOT.categoryId,
      textColor: sanitized.textColor ?? fallback?.textColor ?? DEFAULT_SLOT.textColor,
    };
  };

  const rawSlots = (raw?.slots && typeof raw.slots === 'object') ? raw.slots as Record<BannerSlotKey, Record<string, unknown>> : undefined;

  if (rawSlots) {
    return {
      active: raw?.active !== false,
      slots: {
        hero: buildSlot('hero'),
        middle: buildSlot('middle'),
        footer: buildSlot('footer'),
      },
    };
  }

  const legacyImages = Array.isArray(raw?.images)
    ? raw!.images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0)
    : [];

  const fallbackSlotFromLegacy = (index: number): BannerSlotConfig => {
    const slotKeys: BannerSlotKey[] = ['hero', 'middle', 'footer'];
    const slotKey = slotKeys[index] ?? 'middle';

    return {
      title: typeof raw?.title === 'string' && raw.title.trim() ? raw.title : DEFAULT_SLOT.title,
      text: typeof raw?.text === 'string' && raw.text.trim() ? raw.text : DEFAULT_SLOT.text,
      image: legacyImages[index] || DEFAULT_SLOT.image,
      ctaUrl: typeof raw?.ctaUrl === 'string' && raw.ctaUrl.trim() ? raw.ctaUrl : DEFAULT_SLOT.ctaUrl,
      ctaLabel: typeof raw?.ctaLabel === 'string' && raw.ctaLabel.trim() ? raw.ctaLabel : DEFAULT_SLOT.ctaLabel,
      linkType: DEFAULT_SLOT.linkType,
      categoryId: DEFAULT_SLOT.categoryId,
      textColor: DEFAULT_SLOT.textColor,
      height: SLOT_DEFAULT_HEIGHT[slotKey] ?? DEFAULT_SLOT.height,
      emphasize: SLOT_DEFAULT_EMPHASIS[slotKey] ?? DEFAULT_SLOT.emphasize,
    };
  };

  return {
    active: raw?.active !== false,
    slots: {
      hero: fallbackSlotFromLegacy(0),
      middle: fallbackSlotFromLegacy(1),
      footer: fallbackSlotFromLegacy(2),
    },
  };
};

export function useConfig() {
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(DEFAULT_LOGO);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(DEFAULT_BANNER);
  const [mainBannerConfig, setMainBannerConfig] = useState<MainBannerConfig>(DEFAULT_MAIN_BANNER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const applyPayload = (payload: ConfigCachePayload) => {
      if (!isMounted) return;
      setLogoConfig(payload.logo);
      setBannerConfig(payload.banner);
      setMainBannerConfig(payload.mainBanner);
    };

    const maybeUseCache = () => {
      const cached = configCache.payload;
      const cacheIsFresh = cached && Date.now() - configCache.timestamp < CONFIG_CACHE_TTL;
      if (reloadKey === 0 && cacheIsFresh && cached) {
        applyPayload(cached);
        setLoading(false);
        return true;
      }
      return false;
    };

    if (maybeUseCache()) {
      return () => {
        isMounted = false;
      };
    }

    const fetchConfig = async () => {
      setLoading(true);
      setError(null);

      try {
        const [logoSnap, bannerSnap, mainBannerSnap] = await Promise.all([
          getDoc(doc(db, 'config', 'logo')),
          getDoc(doc(db, 'config', 'banner')),
          getDoc(doc(db, 'config', 'main-banner')),
        ]);

        if (!isMounted) {
          return;
        }

        const mainBannerData = mainBannerSnap.exists()
          ? (mainBannerSnap.data() as Record<string, unknown>)
          : null;

        const payload: ConfigCachePayload = {
          logo: logoSnap.exists() ? sanitizeLogoConfig(logoSnap.data()) : DEFAULT_LOGO,
          banner: bannerSnap.exists() ? sanitizeBannerConfig(bannerSnap.data()) : DEFAULT_BANNER,
          mainBanner: mainBannerData
            ? {
                active: mainBannerData.active !== false,
                slides: sanitizeMainBannerSlides(mainBannerData.slides),
              }
            : DEFAULT_MAIN_BANNER,
        };

        configCache.payload = payload;
        configCache.timestamp = Date.now();
        applyPayload(payload);
      } catch (fetchError) {
        console.error('Error cargando configuración:', fetchError);
        if (!isMounted) return;
        setError('No se pudo cargar la configuración, usando valores por defecto.');
        applyPayload({
          logo: DEFAULT_LOGO,
          banner: DEFAULT_BANNER,
          mainBanner: DEFAULT_MAIN_BANNER,
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchConfig();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const refetch = useCallback(() => {
    configCache.timestamp = 0;
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
