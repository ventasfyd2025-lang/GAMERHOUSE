export const buildPlaceholderUrl = (width: number, height: number, text: string) => {
  const params = new URLSearchParams({
    width: width.toString(),
    height: height.toString(),
    text,
  });
  return `/api/placeholder?${params.toString()}`;
};

export const HERO_BANNER_PLACEHOLDER = buildPlaceholderUrl(1600, 700, 'Destacado Gamerhouse');
export const WIDE_BANNER_PLACEHOLDER = buildPlaceholderUrl(1400, 560, 'Campaña Gamerhouse');
export const PRODUCT_PLACEHOLDER = buildPlaceholderUrl(640, 640, 'Imagen no disponible');
