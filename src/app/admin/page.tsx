'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { useFooterConfig } from '@/hooks/useFooterConfig';
import { useBankConfig } from '@/hooks/useBankConfig';
import { useLayoutPatterns, DEFAULT_LAYOUT_PATTERNS } from '@/hooks/useLayoutPatterns';
import { useUserAuth, UserProfile } from '@/hooks/useUserAuth';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useNotification } from '@/context/NotificationContext';
import {
  useProductSections as useHomepageSections,
  defaultProductSections,
  type ProductSection as HomepageProductSection,
} from '@/hooks/useProductSections';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import optimizeImageFile from '@/utils/imageProcessing';
import { normalizeCategoryValue } from '@/utils/category';
import { defaultMiddleBanners } from '@/components/home/bannerData';
import { cleanAllData } from '@/scripts/cleanData';
import AdminChatPopup from '@/components/AdminChatPopup';
import B2BOrderManagement from '@/components/B2BOrderManagement';
import AdminLogoSection from '@/components/admin/AdminLogoSection';
import AdminBannerSection from '@/components/admin/AdminBannerSection';
// import { syncCategoriesToFirebase } from '@/utils/syncCategories'; // Unused import
import type {
  LayoutPatternsConfig,
  LayoutPatternVariant,
  LayoutPatternSpan,
  LayoutPatternRule,
  Product,
  Discount,
  DiscountType,
  Order
} from '@/types';
import { 
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  CreditCardIcon,
  CubeIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const LAYOUT_VARIANT_ORDER: LayoutPatternVariant[] = ['large', 'horizontal', 'vertical', 'small'];

type CategoryOption = {
  id: string;
  name: string;
};

type PopupSize = '1x1' | '2x1' | '2x2' | '3x1' | '3x3' | '6x4' | '6x6';

const POPUP_SIZE_PRESETS: Record<PopupSize, { width: number; height: number; label: string }> = {
  '1x1': { width: 320, height: 320, label: '1x1 · Cuadrado compacto' },
  '2x1': { width: 560, height: 280, label: '2x1 · Banner horizontal' },
  '2x2': { width: 480, height: 480, label: '2x2 · Cuadrado mediano' },
  '3x1': { width: 720, height: 240, label: '3x1 · Súper horizontal' },
  '3x3': { width: 640, height: 640, label: '3x3 · Cuadrado grande' },
  '6x4': { width: 960, height: 640, label: '6x4 · Rectángulo destacado' },
  '6x6': { width: 960, height: 960, label: '6x6 · Hero cuadrado' },
};

const POPUP_LEGACY_SIZE_MAP: Record<string, PopupSize> = {
  small: '1x1',
  medium: '2x2',
  large: '6x6',
};

const isPopupSize = (value: unknown): value is PopupSize =>
  typeof value === 'string' && Object.hasOwn(POPUP_SIZE_PRESETS, value);

const POPUP_PREVIEW_POSITION_CLASSES: Record<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center', string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
};

const LAYOUT_VARIANT_META: Record<LayoutPatternVariant, {
  title: string;
  description: string;
  icon: string;
  spanOptions: Array<{ value: LayoutPatternSpan; label: string }>;
}> = {
  large: {
    title: 'Bloque Hero (2x2)',
    description: 'Destaca productos premium ocupando más espacio en la grilla.',
    icon: '🧱',
    spanOptions: [
      { value: '2x2', label: 'Grande 2x2' },
      { value: '2x1', label: 'Horizontal 2x1' },
    ],
  },
  horizontal: {
    title: 'Banner Horizontal',
    description: 'Ideal para promociones o productos que necesitan más ancho visual.',
    icon: '🪟',
    spanOptions: [
      { value: '2x1', label: 'Horizontal 2x1' },
      { value: '1x1', label: 'Normal 1x1' },
      { value: '2x2', label: 'Hero 2x2' },
    ],
  },
  vertical: {
    title: 'Bloque Vertical',
    description: 'Resalta productos con fotografías verticales o descripciones largas.',
    icon: '📏',
    spanOptions: [
      { value: '1x2', label: 'Vertical 1x2' },
      { value: '1x1', label: 'Normal 1x1' },
      { value: '2x2', label: 'Hero 2x2' },
    ],
  },
  small: {
    title: 'Bloque Compacto',
    description: 'Introduce variedad con bloques más pequeños y ritmo visual.',
    icon: '🔹',
    spanOptions: [
      { value: '1x1', label: 'Normal 1x1' },
      { value: '2x1', label: 'Horizontal 2x1' },
    ],
  },
};

type DiscountFormState = {
  id: string;
  codigo: string;
  descripcion: string;
  descuento: string;
  tipo: DiscountType;
  productosAplicables: string;
  selectedProductIds: string[];
  selectedCategoryIds: string[];
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
};

const createEmptyDiscountForm = (): DiscountFormState => ({
  id: '',
  codigo: '',
  descripcion: '',
  descuento: '',
  tipo: 'porcentaje',
  productosAplicables: '',
  selectedProductIds: [],
  selectedCategoryIds: [],
  fechaInicio: '',
  fechaFin: '',
  activo: true
});

const toIsoString = (value: unknown): string => {
  if (!value) return '';
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? '' : value.toISOString();
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  }
  if (typeof value === 'object' && 'toDate' in (value as Timestamp) && typeof (value as Timestamp).toDate === 'function') {
    const date = (value as Timestamp).toDate();
    return isNaN(date.getTime()) ? '' : date.toISOString();
  }
  return '';
};

const formatDateForInput = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - tzOffset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const parseInputDateValue = (value: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const formatReadableDate = (value: string) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
};

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP'
});

const formatDiscountAmount = (discount: Pick<Discount, 'tipo' | 'descuento'>) =>
  discount.tipo === 'porcentaje'
    ? `${discount.descuento}%`
    : currencyFormatter.format(discount.descuento);

const productMatchesCategory = (product: Product, categoryId: string) => {
  if (!categoryId) return false;
  if (product.categorias && product.categorias.includes(categoryId)) {
    return true;
  }
  if (product.categoria && product.categoria === categoryId) {
    return true;
  }

  const [baseCategory, subCategory] = categoryId.split('-');
  if (subCategory) {
    if (product.subcategoria && product.subcategoria === subCategory) {
      return true;
    }
    if (product.categorias && product.categorias.includes(`${baseCategory}-${subCategory}`)) {
      return true;
    }
  }

  return false;
};

const cloneLayoutPatterns = (config: LayoutPatternsConfig): LayoutPatternsConfig => ({
  rules: LAYOUT_VARIANT_ORDER.map((variant) => {
    const match = config.rules.find((rule) => rule.variant === variant);
    return match ? { ...match } : getDefaultLayoutRule(variant);
  }),
  updatedAt: config.updatedAt,
});

type PromotionalSectionState = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkType: 'category' | 'product' | 'filter' | 'url';
  linkValue: string;
  badgeText: string;
  position: 'large' | 'tall' | 'wide' | 'normal';
  selectedProducts?: string[];
};

type MiddleBannerState = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  linkType?: 'category' | 'product' | 'filter' | 'url' | 'popup-ofertas';
  linkValue?: string;
  badgeText: string;
};

type HomepageContentState = {
  featuredProducts: string[];
  offerProducts: string[];
  promotionalSections: PromotionalSectionState[];
  middleBanners: MiddleBannerState[];
};

type SectionFormState = {
  id: string | null;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  selectedProducts: string[];
  categoryId?: string;
};

const DEFAULT_SECTION_FORM: SectionFormState = {
  id: null,
  name: 'Nueva sección',
  description: 'Descripción breve que aparecerá bajo el título',
  type: 'custom',
  enabled: true,
  selectedProducts: [],
  categoryId: '',
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  custom: '🎯 Selección manual',
  manual: '🎯 Selección manual',
  featured: '⭐ Productos destacados',
  new: '🆕 Nuevos ingresos',
  bestsellers: '🔥 Más vendidos',
  category: '🏷️ Categoría',
};

const clonePromotionalSection = (section: PromotionalSectionState): PromotionalSectionState => ({
  ...section,
  selectedProducts: Array.isArray(section.selectedProducts) ? [...section.selectedProducts] : [],
});

const cloneMiddleBanner = (banner: MiddleBannerState): MiddleBannerState => ({
  ...banner,
});

const DEFAULT_PROMOTIONAL_SECTIONS: PromotionalSectionState[] = [
  {
    id: 'electronics',
    title: 'Electrónicos',
    description: 'Smartphones, laptops y más',
    imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&h=600&fit=crop&crop=center',
    linkType: 'category' as const,
    linkValue: 'tecnologia',
    badgeText: 'HASTA 50% OFF',
    position: 'large' as const,
    selectedProducts: [],
  },
  {
    id: 'fashion',
    title: 'Moda',
    description: 'Ropa y accesorios',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&h=700&fit=crop&crop=center',
    linkType: 'category' as const,
    linkValue: 'moda',
    badgeText: 'NUEVA COLECCIÓN',
    position: 'tall' as const,
    selectedProducts: [],
  },
  {
    id: 'home',
    title: 'Electrohogar',
    description: 'Cocina y limpieza',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=400&fit=crop&crop=center',
    linkType: 'category' as const,
    linkValue: 'electrohogar',
    badgeText: 'OFERTAS',
    position: 'wide' as const,
    selectedProducts: [],
  },
  {
    id: 'sports',
    title: 'Deportes',
    description: 'Equipamiento deportivo',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=400&fit=crop&crop=center',
    linkType: 'category' as const,
    linkValue: 'deportes',
    badgeText: 'FITNESS',
    position: 'normal' as const,
    selectedProducts: [],
  },
].map(clonePromotionalSection);

const DEFAULT_MIDDLE_BANNERS: MiddleBannerState[] = defaultMiddleBanners.map((banner) => cloneMiddleBanner(banner));

const MIDDLE_BANNER_LINK_OPTIONS = [
  { label: 'Inicio', value: '/' },
  { label: 'Productos en oferta', value: '/?filter=ofertas' },
  { label: 'Productos nuevos', value: '/?filter=nuevos' },
  { label: 'Contacto', value: '/contacto' },
  { label: 'Carrito', value: '/carrito' },
];

const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'electronicos', name: 'Electrónicos' },
  { id: 'hogar', name: 'Hogar' },
  { id: 'ropa', name: 'Ropa' },
  { id: 'deportes', name: 'Deportes' },
];

const normalizePromotionalSections = (raw: unknown): PromotionalSectionState[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_PROMOTIONAL_SECTIONS.map(clonePromotionalSection);
  }

  return raw.map((entry, index) => {
    const fallback = DEFAULT_PROMOTIONAL_SECTIONS[index] ?? DEFAULT_PROMOTIONAL_SECTIONS[0];
    const section = (entry && typeof entry === 'object') ? entry as Record<string, unknown> : {};

    const selectedProducts = Array.isArray(section.selectedProducts)
      ? section.selectedProducts.filter((id): id is string => typeof id === 'string')
      : fallback.selectedProducts ?? [];

    const linkType = section.linkType;
    const position = section.position;

    return {
      id: typeof section.id === 'string' && section.id.trim() ? section.id : fallback.id || `section-${index}`,
      title: typeof section.title === 'string' ? section.title : fallback.title,
      description: typeof section.description === 'string' ? section.description : fallback.description,
      imageUrl: typeof section.imageUrl === 'string' && section.imageUrl ? section.imageUrl : fallback.imageUrl,
      linkType:
        linkType === 'product' || linkType === 'filter' || linkType === 'url' || linkType === 'category'
          ? linkType
          : fallback.linkType ?? 'category',
      linkValue: typeof section.linkValue === 'string' ? section.linkValue : fallback.linkValue ?? '',
      badgeText: typeof section.badgeText === 'string' ? section.badgeText : fallback.badgeText ?? '',
      position:
        position === 'large' || position === 'tall' || position === 'wide' || position === 'normal'
          ? position
          : fallback.position ?? 'normal',
      selectedProducts,
    };
  }).map(clonePromotionalSection);
};

const normalizeMiddleBanners = (raw: unknown): MiddleBannerState[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_MIDDLE_BANNERS.map(cloneMiddleBanner);
  }

  return raw.map((entry, index) => {
    const fallback = DEFAULT_MIDDLE_BANNERS[index] ?? DEFAULT_MIDDLE_BANNERS[0];
    const banner = (entry && typeof entry === 'object') ? entry as Record<string, unknown> : {};

    return {
      id: typeof banner.id === 'string' && banner.id.trim() ? banner.id : fallback.id || `middle-${index}`,
      title: typeof banner.title === 'string' ? banner.title : fallback.title,
      subtitle: typeof banner.subtitle === 'string' ? banner.subtitle : fallback.subtitle,
      imageUrl: typeof banner.imageUrl === 'string' && banner.imageUrl ? banner.imageUrl : fallback.imageUrl,
      ctaText: typeof banner.ctaText === 'string' ? banner.ctaText : fallback.ctaText,
      ctaLink: typeof banner.ctaLink === 'string' ? banner.ctaLink : fallback.ctaLink,
      badgeText: typeof banner.badgeText === 'string' ? banner.badgeText : fallback.badgeText,
    };
  }).map(cloneMiddleBanner);
};

const prettifyCategoryName = (value: string): string => {
  const cleaned = value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return value;
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const normalizeCategoryOption = (input: unknown): CategoryOption | null => {
  if (!input) return null;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const id = trimmed.toLowerCase();
    return {
      id,
      name: prettifyCategoryName(trimmed),
    };
  }

  if (typeof input === 'object') {
    const data = input as Record<string, unknown>;
    const rawId = data.id ?? data.slug ?? data.value ?? data.name ?? data.nombre;
    if (typeof rawId !== 'string') return null;
    const id = rawId.trim().toLowerCase();
    if (!id) return null;
    const rawName = data.name ?? data.nombre ?? data.title ?? rawId;
    const name = typeof rawName === 'string' && rawName.trim().length > 0
      ? rawName as string
      : prettifyCategoryName(rawId as string);
    return {
      id,
      name: typeof name === 'string' ? name : prettifyCategoryName(id),
    };
  }

  return null;
};

const mergeCategoryOptions = (
  existing: CategoryOption[],
  incoming: CategoryOption[],
): CategoryOption[] => {
  const map = new Map<string, CategoryOption>();
  const append = (option: CategoryOption) => {
    if (!option.id) return;
    const current = map.get(option.id);
    if (!current || (!current.name && option.name)) {
      map.set(option.id, option);
    } else if (option.name && current.name && option.name.length > current.name.length) {
      map.set(option.id, option);
    }
  };

  existing.forEach(append);
  incoming.forEach(append);

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es-CL'));
};

function getDefaultLayoutRule(variant: LayoutPatternVariant) {
  const match = DEFAULT_LAYOUT_PATTERNS.rules.find((rule) => rule.variant === variant);
  return match ? { ...match } : { variant, enabled: false, interval: 4, span: '1x1' as LayoutPatternSpan };
}

const collectCategoryEntries = (product: Product): string[] => {
  const entries: string[] = [];

  if (typeof product.categoria === 'string' && product.categoria.trim().length > 0) {
    entries.push(product.categoria);
  }

  if (Array.isArray(product.categorias)) {
    product.categorias.forEach((entry) => {
      if (typeof entry === 'string' && entry.trim().length > 0) {
        entries.push(entry);
      }
    });
  }

  return entries;
};

const productHasCategory = (product: Product, categoryId: string): boolean => {
  if (!categoryId || categoryId === 'all') {
    return true;
  }

  const normalizedTarget = normalizeCategoryValue(categoryId);

  return collectCategoryEntries(product).some((entry) => {
    if (entry === categoryId) {
      return true;
    }
    if (entry.startsWith(`${categoryId}-`)) {
      return true;
    }

    const normalizedEntry = normalizeCategoryValue(entry);
    if (!normalizedEntry || !normalizedTarget) {
      return false;
    }

    return (
      normalizedEntry === normalizedTarget ||
      normalizedEntry.startsWith(normalizedTarget)
    );
  });
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, login, logout } = useAuth();
  const { userProfile, isAdmin, loading: userAuthLoading } = useUserAuth();
  const { products, refetch, removeProduct, removeProducts } = useProducts();
  const { footerConfig, updateFooterConfig, loading: footerLoading } = useFooterConfig();
  const { bankConfig, updateBankConfig, loading: bankLoading } = useBankConfig();
  const { notifyOrderStatusChange } = useEmailNotifications();
  const { addNotification } = useNotification();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [cleaningData, setCleaningData] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState<'active' | 'completed'>('active');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [discountsLoading, setDiscountsLoading] = useState(true);
  const [discountForm, setDiscountForm] = useState<DiscountFormState>(() => createEmptyDiscountForm());
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [selectedProductOption, setSelectedProductOption] = useState('');
  const [selectedCategoryOption, setSelectedCategoryOption] = useState('');

  // Users management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showClientes, setShowClientes] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [selectedUserOrders, setSelectedUserOrders] = useState<Order[]>([]);

  
  // Popup management state
  const [popupForm, setPopupForm] = useState({
    title: '¡Oferta Especial!',
    description: 'Descuentos increíbles por tiempo limitado',
    buttonText: 'Ver Ofertas',
    buttonLink: '/popup-ofertas',
    active: false,
    size: '2x2' as PopupSize,
    position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
    mediaUrl: '',
    isVideo: false,
    popupType: 'category' as 'category' | 'information'
  });
  const [updatingPopup, setUpdatingPopup] = useState(false);
  const [popupImageUploading, setPopupImageUploading] = useState(false);
  
  useEffect(() => {
    const discountsRef = collection(db, 'discounts');
    setDiscountsLoading(true);
    const unsubscribe = onSnapshot(discountsRef, snapshot => {
      const mapped: Discount[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const rawProducts = Array.isArray(data.productosAplicables)
          ? data.productosAplicables.filter((id: unknown): id is string => typeof id === 'string')
          : [];

        const safeAmount = typeof data.descuento === 'number'
          ? data.descuento
          : Number(data.descuento) || 0;

        return {
          id: docSnap.id,
          codigo: typeof data.codigo === 'string' ? data.codigo.toUpperCase() : '',
          descripcion: typeof data.descripcion === 'string' ? data.descripcion : undefined,
          descuento: safeAmount,
          tipo: data.tipo === 'fijo' ? 'fijo' : 'porcentaje',
          productosAplicables: rawProducts,
          fechaInicio: toIsoString(data.fechaInicio),
          fechaFin: toIsoString(data.fechaFin),
          activo: Boolean(data.activo),
          createdAt: toIsoString(data.createdAt),
          updatedAt: toIsoString(data.updatedAt)
        };
      });

      setDiscounts(mapped);
      setDiscountsLoading(false);
    }, error => {
      console.error('Error loading discounts:', error);
      setDiscounts([]);
      setDiscountsLoading(false);
      addNotification({
        type: 'error',
        title: 'Error al cargar cupones',
        message: 'No se pudieron recuperar los descuentos de Firebase.'
      });
    });

    return () => unsubscribe();
  }, [addNotification]);

  const handleOpenDiscountForm = () => {
    setDiscountForm(createEmptyDiscountForm());
    setSelectedProductOption('');
    setSelectedCategoryOption('');
    setShowDiscountForm(true);
  };

  const handleCloseDiscountForm = () => {
    setShowDiscountForm(false);
    setDiscountForm(createEmptyDiscountForm());
    setSelectedProductOption('');
    setSelectedCategoryOption('');
  };

  const handleEditDiscount = (discount: Discount) => {
    setDiscountForm({
      id: discount.id,
      codigo: discount.codigo || '',
      descripcion: discount.descripcion || '',
      descuento: discount.descuento.toString(),
      tipo: discount.tipo,
      productosAplicables: discount.productosAplicables?.join(', ') || '',
      selectedProductIds: discount.productosAplicables || [],
      selectedCategoryIds: [],
      fechaInicio: formatDateForInput(discount.fechaInicio),
      fechaFin: formatDateForInput(discount.fechaFin),
      activo: discount.activo
    });
    setSelectedProductOption('');
    setSelectedCategoryOption('');
    setShowDiscountForm(true);
  };

  const handleSaveDiscount = async () => {
    const codigo = discountForm.codigo.trim().toUpperCase();
    const manualProductIds = discountForm.productosAplicables
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);
    const descuentoValue = Number(discountForm.descuento);
    const startDate = parseInputDateValue(discountForm.fechaInicio);
    const endDate = parseInputDateValue(discountForm.fechaFin);

    if (!codigo) {
      addNotification({ type: 'warning', title: 'Código requerido', message: 'Ingresa un código único para el cupón.' });
      return;
    }

    if (!descuentoValue || Number.isNaN(descuentoValue) || descuentoValue <= 0) {
      addNotification({ type: 'warning', title: 'Monto inválido', message: 'Define un valor mayor a 0.' });
      return;
    }

    const productIdsSet = new Set<string>([...manualProductIds, ...discountForm.selectedProductIds]);

    discountForm.selectedCategoryIds.forEach(categoryId => {
      products.forEach(product => {
        if (productMatchesCategory(product, categoryId)) {
          productIdsSet.add(product.id);
        }
      });
    });

    if (productIdsSet.size === 0) {
      addNotification({ type: 'warning', title: 'Productos requeridos', message: 'Selecciona al menos un producto o categoría válida.' });
      return;
    }

    const productosAplicables = Array.from(productIdsSet);

    if (!startDate || !endDate) {
      addNotification({ type: 'warning', title: 'Vigencia incompleta', message: 'Selecciona fecha de inicio y término.' });
      return;
    }

    if (startDate >= endDate) {
      addNotification({ type: 'warning', title: 'Vigencia inválida', message: 'La fecha de término debe ser posterior al inicio.' });
      return;
    }

    const payload = {
      codigo,
      descripcion: discountForm.descripcion.trim(),
      descuento: descuentoValue,
      tipo: discountForm.tipo,
      productosAplicables,
      fechaInicio: Timestamp.fromDate(startDate),
      fechaFin: Timestamp.fromDate(endDate),
      activo: discountForm.activo,
      updatedAt: serverTimestamp()
    };

    try {
      setSavingDiscount(true);
      if (discountForm.id) {
        await setDoc(doc(db, 'discounts', discountForm.id), payload, { merge: true });
        addNotification({ type: 'success', title: 'Cupón actualizado', message: `${codigo} se guardó correctamente.` });
      } else {
        const newDiscountRef = doc(collection(db, 'discounts'));
        await setDoc(newDiscountRef, { ...payload, createdAt: serverTimestamp() });
        addNotification({ type: 'success', title: 'Cupón creado', message: `${codigo} quedó disponible de inmediato.` });
      }
      handleCloseDiscountForm();
    } catch (error) {
      console.error('Error saving discount:', error);
      addNotification({ type: 'error', title: 'Error al guardar', message: 'No se pudo guardar el cupón. Intenta nuevamente.' });
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleDeleteDiscount = async (discount: Discount) => {
    const confirmed = window.confirm(`¿Eliminar el cupón ${discount.codigo}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'discounts', discount.id));
      addNotification({ type: 'info', title: 'Cupón eliminado', message: `${discount.codigo} se eliminó correctamente.` });
    } catch (error) {
      console.error('Error deleting discount:', error);
      addNotification({ type: 'error', title: 'No se pudo eliminar', message: 'Intenta nuevamente en unos segundos.' });
    }
  };

  const handleToggleDiscountStatus = async (discount: Discount) => {
    try {
      await setDoc(
        doc(db, 'discounts', discount.id),
        { activo: !discount.activo, updatedAt: serverTimestamp() },
        { merge: true }
      );
      addNotification({
        type: 'success',
        title: `Cupón ${!discount.activo ? 'activado' : 'desactivado'}`,
        message: `${discount.codigo} ahora está ${!discount.activo ? 'disponible' : 'fuera de circulación'}.`
      });
    } catch (error) {
      console.error('Error toggling discount status:', error);
      addNotification({ type: 'error', title: 'Error al actualizar', message: 'No pudimos cambiar el estado del cupón.' });
    }
  };

  const handleAddProductSelection = () => {
    if (!selectedProductOption) return;
    setDiscountForm(prev => {
      if (prev.selectedProductIds.includes(selectedProductOption)) {
        return prev;
      }
      return {
        ...prev,
        selectedProductIds: [...prev.selectedProductIds, selectedProductOption]
      };
    });
    setSelectedProductOption('');
  };

  const handleAddCategorySelection = () => {
    if (!selectedCategoryOption) return;
    setDiscountForm(prev => {
      if (prev.selectedCategoryIds.includes(selectedCategoryOption)) {
        return prev;
      }
      return {
        ...prev,
        selectedCategoryIds: [...prev.selectedCategoryIds, selectedCategoryOption]
      };
    });
    setSelectedCategoryOption('');
  };

  const handleRemoveProductSelection = (productId: string) => {
    setDiscountForm(prev => ({
      ...prev,
      selectedProductIds: prev.selectedProductIds.filter(id => id !== productId)
    }));
  };

  const handleRemoveCategorySelection = (categoryId: string) => {
    setDiscountForm(prev => ({
      ...prev,
      selectedCategoryIds: prev.selectedCategoryIds.filter(id => id !== categoryId)
    }));
  };

  // Temporary function for products (not used in simplified popup)

  // Main banner management state
  const [mainBannerForm, setMainBannerForm] = useState({
    active: true,
    slides: [
      {
        linkType: "product" as "product" | "category" | "url", // "product", "category" o "url"
        productId: "1",
        categoryId: "",
        customUrl: "",
        title: "¡Oferta Especial!",
        subtitle: "Hasta 50% de descuento",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop"
      },
      {
        linkType: "product" as "product" | "category" | "url",
        productId: "2",
        categoryId: "",
        customUrl: "",
        title: "Nuevos Productos",
        subtitle: "Descubre nuestra nueva colección",
        imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop"
      },
      {
        linkType: "product" as "product" | "category" | "url",
        productId: "3",
        categoryId: "",
        customUrl: "",
        title: "Los Más Vendidos",
        subtitle: "Productos favoritos de nuestros clientes",
        imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&h=400&fit=crop"
      }
    ]
  });
  const [updatingMainBanner, setUpdatingMainBanner] = useState(false);
  const [isAutoSavingBanner, setIsAutoSavingBanner] = useState(false);
  const bannerAutoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstBannerLoadRef = useRef(true);

  // Homepage content management state
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({});
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORY_OPTIONS);
  const [homepageContent, setHomepageContent] = useState<HomepageContentState>({
    featuredProducts: [] as string[], // IDs de productos destacados
    offerProducts: [] as string[], // IDs de productos en ofertas
    promotionalSections: DEFAULT_PROMOTIONAL_SECTIONS.map((section) => ({ ...section })),
    middleBanners: DEFAULT_MIDDLE_BANNERS.map((banner) => ({ ...banner })),
  });
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const [updatingHomepageContent, setUpdatingHomepageContent] = useState(false); // Unused state
  
  
  // Banner product search
  const [bannerSearchTerms, setBannerSearchTerms] = useState<{[key: number]: string}>({});
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Homepage sections synced with Firestore
  const {
    sections: fetchedProductSections,
    loading: productSectionsLoading,
    error: productSectionsError,
    refetch: refetchProductSections,
  } = useHomepageSections();


  // Chat management state
  interface ChatMessage {
    id: string;
    orderId?: string;
    userId: string;
    userEmail: string;
    userName: string;
    message: string;
    isAdmin: boolean;
    timestamp: Date;
    read: boolean;
  }

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // Total unread count for notifications
  const unreadCount = unreadChatCount + newOrdersCount;
  
  // Order selection and deletion states
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [deletingOrders, setDeletingOrders] = useState(false);
  
  // Popup chat states
  const [chatPopupOrder, setChatPopupOrder] = useState<Order | null>(null);
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);
  
  // Logo management state
  const [logoForm, setLogoForm] = useState({
    text: 'GAMERHOUSE',
    emoji: '🏪',
    image: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [updatingLogo, setUpdatingLogo] = useState(false);
  
  // Footer information state - synced with useFooterConfig hook
  const [footerForm, setFooterForm] = useState({
    companyDescription: '',
    phone: '',
    email: '',
    address: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    whatsappUrl: ''
  });
  const [updatingFooter, setUpdatingFooter] = useState(false);

  // Bank details state
  const [bankForm, setBankForm] = useState({
    bankName: 'Banco de Chile',
    accountType: 'Cuenta Corriente',
    accountNumber: '123-456-789-01',
    rut: '12.345.678-9',
    holderName: 'GAMERHOUSE SpA',
    email: 'pagos@importadorafyd.cl'
  });
  const [updatingBank, setUpdatingBank] = useState(false);

  // Sync footer form with hook data
  useEffect(() => {
    if (footerConfig && !footerLoading) {
      setFooterForm({
        companyDescription: footerConfig.description || '',
        phone: footerConfig.contact.phone || '',
        email: footerConfig.contact.email || '',
        address: footerConfig.contact.address || '',
        facebookUrl: footerConfig.socialMedia.facebook || '',
        instagramUrl: footerConfig.socialMedia.instagram || '',
        tiktokUrl: footerConfig.socialMedia.tiktok || '',
        whatsappUrl: footerConfig.socialMedia.whatsapp || ''
      });
    }
  }, [footerConfig, footerLoading]);

  // Sync bank form with hook data
  useEffect(() => {
    if (bankConfig && !bankLoading) {
      setBankForm({
        bankName: bankConfig.bankName || '',
        accountType: bankConfig.accountType || '',
        accountNumber: bankConfig.accountNumber || '',
        rut: bankConfig.rut || '',
        holderName: bankConfig.holderName || '',
        email: bankConfig.email || ''
      });
    }
  }, [bankConfig, bankLoading]);

  // Category management state
  // const [syncingCategories, setSyncingCategories] = useState(false); // Unused state
  const [categories, setCategories] = useState([
    { id: 'electronicos', name: 'Electrónicos', active: true },
    { id: 'hogar', name: 'Hogar', active: true },
    { id: 'ropa', name: 'Ropa', active: true },
    { id: 'deportes', name: 'Deportes', active: true }
  ]);

  // Load categories from Firebase
  const productNameMap = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach(product => {
      map.set(product.id, product.nombre || product.id);
    });
    return map;
  }, [products]);

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    availableCategories.forEach(category => {
      map.set(category.id, category.name);
    });
    return map;
  }, [availableCategories]);

  const loadCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, 'gamerhouse_categorias'));
      if (!categoriesSnapshot.empty) {
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          active: doc.data().active ?? true,
          ...doc.data()
        }));
        setCategories(categoriesData as { id: string; name: string; active: boolean; }[]);
      }
    } catch (error) {
      // Error loading categories
    }
  };

  useEffect(() => {
    if (categories.length === 0) return;

    const categoryOptions: CategoryOption[] = [];

    categories.forEach((category) => {
      // Add main category
      const mainCategoryOption = normalizeCategoryOption(category);
      if (mainCategoryOption) {
        categoryOptions.push(mainCategoryOption);
      }

      // Add subcategories
      const subcategorias = (category as any).subcategorias || [];
      subcategorias.forEach((sub: any) => {
        if (sub.nombre && sub.activa !== false) {
          categoryOptions.push({
            id: `${category.id}-${sub.id}`,
            name: `${category.name} > ${sub.nombre}`
          });
        }
      });
    });

    // Replace with actual categories from database (not merge)
    setAvailableCategories(categoryOptions);
  }, [categories]);

  const loadPopupConfig = async () => {
    try {
      const popupDoc = await getDoc(doc(db, 'config', 'offer-popup'));
      if (popupDoc.exists()) {
        const popupData = popupDoc.data();
        setPopupForm({
          title: popupData.title || '',
          description: popupData.description || '',
          buttonText: popupData.buttonText || 'Ver Ofertas',
          buttonLink: popupData.buttonLink || '/popup-ofertas',
          active: popupData.active || false,
          size: (() => {
            if (isPopupSize(popupData.size)) {
              return popupData.size;
            }
            if (typeof popupData.size === 'string' && POPUP_LEGACY_SIZE_MAP[popupData.size]) {
              return POPUP_LEGACY_SIZE_MAP[popupData.size];
            }
            return '2x2';
          })(),
          position: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(popupData.position)
            ? popupData.position
            : 'bottom-right',
          mediaUrl: typeof popupData.mediaUrl === 'string' ? popupData.mediaUrl : (popupData.imageUrl || ''),
          isVideo: popupData.isVideo || false,
          popupType: ['category', 'information'].includes(popupData.popupType)
            ? popupData.popupType
            : (popupData.popupType === 'promotional' ? 'category' : 'information')
        });
      }
    } catch (error) {
      // Error loading popup config
    }
  };

  const loadMainBannerConfig = async () => {
    try {
      const mainBannerDoc = await getDoc(doc(db, 'config', 'main-banner'));
      if (mainBannerDoc.exists()) {
        const mainBannerData = mainBannerDoc.data();
        const loadedSlides = (mainBannerData.slides || []).map((slide: any) => ({
          linkType: slide.linkType || "product",
          productId: slide.productId || "",
          categoryId: slide.categoryId || "",
          customUrl: slide.customUrl || "",
          title: slide.title || "",
          subtitle: slide.subtitle || "",
          imageUrl: slide.imageUrl || ""
        }));

        // Si no hay slides, usar valores por defecto
        const defaultSlides = [
          {
            linkType: "product" as "product" | "category" | "url",
            productId: "1",
            categoryId: "",
            customUrl: "",
            title: "¡Oferta Especial!",
            subtitle: "Hasta 50% de descuento",
            imageUrl: ""
          },
          {
            linkType: "product" as "product" | "category" | "url",
            productId: "2",
            categoryId: "",
            customUrl: "",
            title: "Nuevos Productos",
            subtitle: "Descubre nuestra nueva colección",
            imageUrl: ""
          }
        ];

        // Marcar que estamos cargando desde Firebase (no auto-guardar)
        isFirstBannerLoadRef.current = true;

        setMainBannerForm({
          active: mainBannerData.active !== undefined ? mainBannerData.active : true,
          slides: loadedSlides.length > 0 ? loadedSlides : defaultSlides
        });
      }
    } catch (error) {
      // Error loading main banner config, keep defaults
    }
  };

  const loadHomepageContent = async () => {
    try {
      const homepageDoc = await getDoc(doc(db, 'config', 'homepage-content'));
      if (homepageDoc.exists()) {
        const homepageData = homepageDoc.data();
        setHomepageContent({
          featuredProducts: homepageData.featuredProducts || [],
          offerProducts: homepageData.offerProducts || [],
          promotionalSections: normalizePromotionalSections(homepageData.promotionalSections),
          middleBanners: normalizeMiddleBanners(homepageData.middleBanners),
        });
      } else {
        // Si no existe configuración, crear una automáticamente
        await setDoc(doc(db, 'config', 'homepage-content'), homepageContent);
      }
    } catch (error) {
      console.error('Error loading homepage content:', error);
    }
  };

  const handleCleanDemoData = async () => {
    if (cleaningData) {
      return;
    }
    const confirmation = typeof window !== 'undefined'
      ? window.confirm('Esta acción eliminará pedidos y mensajes de prueba. ¿Deseas continuar?')
      : false;
    if (!confirmation) {
      return;
    }
    try {
      setCleaningData(true);
      await cleanAllData();
      if (typeof window !== 'undefined') {
        window.alert('Datos de prueba eliminados exitosamente.');
      }
    } catch (error) {
      console.error('Error limpiando datos de prueba:', error);
      if (typeof window !== 'undefined') {
        window.alert('No se pudieron limpiar los datos. Revisa la consola para más detalles.');
      }
    } finally {
      setCleaningData(false);
    }
  };

  const autoSaveHomepageContent = useCallback((content: HomepageContentState) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setIsAutoSaving(true);
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'config', 'homepage-content'), content);      } catch (error) {
        console.error('❌ Error auto-saving:', error);
      } finally {
        setIsAutoSaving(false);
        autoSaveTimeoutRef.current = null;
      }
    }, 800);
  }, []);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save for main banner
  const autoSaveMainBanner = useCallback((bannerConfig: typeof mainBannerForm) => {
    if (bannerAutoSaveTimeoutRef.current) {
      clearTimeout(bannerAutoSaveTimeoutRef.current);
    }

    setIsAutoSavingBanner(true);
    bannerAutoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('💾 GUARDANDO BANNER:', bannerConfig.slides.map(s => ({ title: s.title, subtitle: s.subtitle })));
        await setDoc(doc(db, 'config', 'main-banner'), {
          active: bannerConfig.active,
          slides: bannerConfig.slides,
          updatedAt: new Date().toISOString()
        });
        console.log('✅ BANNER GUARDADO EXITOSAMENTE');
      } catch (error) {
        console.error('❌ Error auto-guardando banner:', error);
      } finally {
        setIsAutoSavingBanner(false);
        bannerAutoSaveTimeoutRef.current = null;
      }
    }, 1000);
  }, []);

  const saveMainBannerNow = useCallback(async () => {
    if (updatingMainBanner) {
      return;
    }
    setUpdatingMainBanner(true);
    try {
      await setDoc(doc(db, 'config', 'main-banner'), {
        active: mainBannerForm.active,
        slides: mainBannerForm.slides,
        updatedAt: new Date().toISOString(),
      });
      if (typeof window !== 'undefined') {
        window.alert('Banner sincronizado correctamente.');
      }
    } catch (error) {
      console.error('Error guardando banner manualmente:', error);
      if (typeof window !== 'undefined') {
        window.alert('Ocurrió un error al guardar el banner.');
      }
    } finally {
      setUpdatingMainBanner(false);
    }
  }, [mainBannerForm, updatingMainBanner]);

  useEffect(() => {
    return () => {
      if (bannerAutoSaveTimeoutRef.current) {
        clearTimeout(bannerAutoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Watch mainBannerForm changes and auto-save
  useEffect(() => {
    // Skip auto-save on initial mount (when loading from Firebase)
    if (isFirstBannerLoadRef.current) {
      isFirstBannerLoadRef.current = false;
      return;
    }

    // Only auto-save when user makes changes
    if (mainBannerForm.slides.length > 0) {
      console.log('🔄 Usuario hizo cambios - ejecutando auto-save');
      autoSaveMainBanner(mainBannerForm);
    }
  }, [mainBannerForm, autoSaveMainBanner]);

  const saveHomepageContent = async (showAlert = true) => {
    try {
      await setDoc(doc(db, 'config', 'homepage-content'), homepageContent);
      if (showAlert) {
        alert('✅ Contenido guardado! Ve a la página principal para ver los cambios.');
      }    } catch (error) {
      console.error('Error saving homepage content:', error);
      if (showAlert) {
        alert('❌ Error al guardar el contenido de la página');
      }
    }
  };

  // Función para guardar automáticamente cuando cambian los datos
  const updateSection = (index: number, updatedSection: PromotionalSectionState) => {
    const normalized = clonePromotionalSection(updatedSection);
    setHomepageContent((prev) => {
      const updatedSections = [...prev.promotionalSections];
      updatedSections[index] = normalized;
      const newContent: HomepageContentState = { ...prev, promotionalSections: updatedSections };
      autoSaveHomepageContent(newContent);
      return newContent;
    });
  };

  const updateMiddleBanner = (index: number, updatedBanner: MiddleBannerState) => {
    const normalized = cloneMiddleBanner(updatedBanner);
    setHomepageContent((prev) => {
      const updatedBanners = [...prev.middleBanners];
      updatedBanners[index] = normalized;
      const newContent: HomepageContentState = { ...prev, middleBanners: updatedBanners };
      autoSaveHomepageContent(newContent);
      return newContent;
    });
  };

  // Función para subir imagen
  const uploadImage = async (
    file: File,
    storageKey: string,
    options?: { folder?: string; stateKey?: string },
  ): Promise<string> => {
    const folder = options?.folder ?? 'homepage-promotions';
    const stateKey = options?.stateKey ?? storageKey;    setUploadingImages((prev) => ({ ...prev, [stateKey]: true }));

    try {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const optimizedFile = await optimizeImageFile(file);
      const timestamp = Date.now();
      const fileName = `${folder}/${storageKey}-${timestamp}-${optimizedFile.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, optimizedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    } finally {
      setUploadingImages((prev) => ({ ...prev, [stateKey]: false }));
    }
  };

  // Función para manejar cambio de archivo
  const handleImageUpload = async (file: File, index: number, section: any) => {
    try {      const imageUrl = await uploadImage(file, section.id, { folder: 'homepage-promotions', stateKey: section.id });      updateSection(index, { ...section, imageUrl });    } catch (error) {
      console.error('❌ Error in handleImageUpload:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error al subir la imagen: ${message}\nVerifica los permisos de Firebase Storage.`);
    }
  };

  const handleMiddleBannerImageUpload = async (file: File, index: number, banner: MiddleBannerState) => {
    try {      const stateKey = `middle-${banner.id}`;
      const imageUrl = await uploadImage(file, banner.id, {
        folder: 'homepage-middle-banners',
        stateKey,
      });      updateMiddleBanner(index, { ...banner, imageUrl });
    } catch (error) {
      console.error('❌ Error uploading middle banner image:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error al subir la imagen del banner: ${message}`);
    }
  };

  // const initializeDefaultContent = ...; // Unused function

  const loadLogoConfig = async () => {
    try {
      const logoDoc = await getDoc(doc(db, 'config', 'logo'));
      if (logoDoc.exists()) {
        const logoData = logoDoc.data();
        setLogoForm({
          text: logoData.text || 'GAMERHOUSE',
          emoji: logoData.emoji || '🏪',
          image: logoData.image || ''
        });
      }
    } catch (error) {
      // Error loading logo config, keep defaults
    }
  };
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', active: true, subcategorias: [] });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [subcategoryForm, setSubcategoryForm] = useState({ id: '', nombre: '', activa: true });
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });

  type OrderStatus = Order['status'];

  interface CustomerOrderGroup {
    customerName: string;
    customerEmail: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: Date;
    lastOrderStatus: OrderStatus;
    lastOrderId: string;
    statusBreakdown: Partial<Record<OrderStatus, number>>;
  }

  const statusLabelMap: Record<OrderStatus, string> = {
    pending: 'Pendiente',
    pending_verification: 'Verificando Pago',
    pending_payment: 'Pendiente de Pago',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    completed: 'Completado',
    cancelled: 'Cancelado'
  };

  const statusClassMap: Record<OrderStatus, string> = {
    pending: 'bg-warning/20 text-yellow-800',
    pending_verification: 'bg-warning/20 text-secondary',
    pending_payment: 'bg-warning/20 text-amber-800',
    confirmed: 'bg-success/20 text-success',
    preparing: 'bg-slate-800 text-secondary',
    processing: 'bg-warning/20 text-secondary',
    shipped: 'bg-warning/20 text-amber-800',
    delivered: 'bg-success/20 text-success',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-slate-800 text-pink'
  };

  const ordersByCustomer = useMemo<CustomerOrderGroup[]>(() => {
    if (!orders || orders.length === 0) return [];

    const groups = new Map<string, CustomerOrderGroup>();

    orders.forEach((order) => {
      const key = order.customerEmail || order.customerName || order.id;
      const createdAt = new Date(order.createdAt || Date.now());
      const total = typeof order.total === 'number' ? order.total : 0;
      const status = (order.status || 'pending') as OrderStatus;

      if (!groups.has(key)) {
        groups.set(key, {
          customerName: order.customerName || 'Cliente sin nombre',
          customerEmail: order.customerEmail || 'Sin correo',
          orderCount: 1,
          totalSpent: total,
          lastOrderDate: createdAt,
          lastOrderStatus: status,
          lastOrderId: order.id,
          statusBreakdown: { [status]: 1 }
        });
        return;
      }

      const group = groups.get(key)!;
      group.orderCount += 1;
      group.totalSpent += total;
      group.statusBreakdown[status] = (group.statusBreakdown[status] || 0) + 1;

      if (createdAt.getTime() > group.lastOrderDate.getTime()) {
        group.lastOrderDate = createdAt;
        group.lastOrderStatus = status;
        group.lastOrderId = order.id;
      }
    });

    return Array.from(groups.values()).sort(
      (a, b) => b.lastOrderDate.getTime() - a.lastOrderDate.getTime()
    );
  }, [orders]);

  // Users management functions
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      console.log('Loading users from Firestore...');
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      console.log('Users snapshot:', snapshot.size, 'documents');

      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('User document:', doc.id, data);
        return {
          ...data,
          uid: doc.id
        };
      }) as UserProfile[];

      console.log('Loaded users:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error cargando usuarios: ' + error);
    } finally {
      setUsersLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'vendedor' | 'cliente') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });

      // Actualizar estado local
      setUsers(prev => prev.map(user =>
        user.uid === userId ? { ...user, role: newRole } : user
      ));

      setEditingUser(null);
      alert('Rol actualizado exitosamente');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error al actualizar rol');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?\n\nSe eliminará de Auth y Firestore.')) {
      return;
    }

    try {
      // Obtener el token del usuario actual
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('Debes estar autenticado para realizar esta acción');
        return;
      }

      const token = await currentUser.getIdToken();

      // Llamar al API para eliminar el usuario
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar usuario');
      }

      // Actualizar la lista local
      setUsers(prev => prev.filter(user => user.uid !== userId));
      alert('Usuario eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Error al eliminar usuario');
    }
  };

  const blockUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres bloquear este usuario? No podrá iniciar sesión hasta que lo desbloquees.')) {
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), {
        blocked: true,
        blockedAt: serverTimestamp()
      });
      // Actualizar estado local
      setUsers(prev => prev.map(user =>
        user.uid === userId ? { ...user, blocked: true } : user
      ));
      alert('Usuario bloqueado exitosamente');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Error al bloquear usuario');
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        blocked: false,
        unblockedAt: serverTimestamp()
      });
      // Actualizar estado local
      setUsers(prev => prev.map(user =>
        user.uid === userId ? { ...user, blocked: false } : user
      ));
      alert('Usuario desbloqueado exitosamente');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Error al desbloquear usuario');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-slate-800 text-pink border-slate-200';
      case 'vendedor': return 'bg-warning/20 text-secondary border-warning';
      case 'cliente': return 'bg-success/20 text-success border-success';
      default: return 'bg-slate-800 text-white border-yellow-300/30';
    }
  };

  // Cargar detalles del usuario y sus pedidos
  const loadUserDetails = async (user: UserProfile) => {
    try {
      setSelectedUserDetails({
        ...user,
        uid: user.uid
      });

      // Cargar pedidos del usuario
      const ordersRef = collection(db, 'gamerhouse_orders');
      const ordersQuery = query(ordersRef, where('userId', '==', user.uid));
      const ordersSnapshot = await getDocs(ordersQuery);

      const userOrders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));

      // Ordenar por fecha más reciente
      userOrders.sort((a, b) => {
        let dateA: Date;
        let dateB: Date;

        if (a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt) {
          dateA = (a.createdAt as any).toDate();
        } else if (a.createdAt) {
          dateA = new Date(a.createdAt as any);
        } else {
          dateA = new Date();
        }

        if (b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt) {
          dateB = (b.createdAt as any).toDate();
        } else if (b.createdAt) {
          dateB = new Date(b.createdAt as any);
        } else {
          dateB = new Date();
        }

        return dateB.getTime() - dateA.getTime();
      });

      setSelectedUserOrders(userOrders);
    } catch (error) {
      console.error('Error loading user details:', error);
      alert('Error al cargar detalles del usuario');
    }
  };

  // Buscar usuario y cargar sus pedidos
  const searchUserByEmail = async (email: string) => {
    if (!email.trim()) {
      setSelectedUserDetails(null);
      setSelectedUserOrders([]);
      return;
    }

    try {
      // Buscar usuario por email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
      const userSnapshot = await getDocs(q);

      if (userSnapshot.empty) {
        alert('No se encontró ningún usuario con ese correo');
        setSelectedUserDetails(null);
        setSelectedUserOrders([]);
        return;
      }

      const userData = userSnapshot.docs[0].data();
      const userId = userSnapshot.docs[0].id;

      const user = {
        ...userData,
        uid: userId
      } as UserProfile;

      loadUserDetails(user);
    } catch (error) {
      console.error('Error searching user:', error);
      alert('Error al buscar usuario');
    }
  };

  // Load users when user management tab is active
  useEffect(() => {
    if (activeTab === 'user-management') {
      loadUsers();
    }
  }, [activeTab]);

  // Product sections state
  const [productSections, setProductSections] = useState<HomepageProductSection[]>(
    defaultProductSections
  );
  const [sectionForm, setSectionForm] = useState<SectionFormState | null>(null);
  const [currentSectionId, setCurrentSectionId] = useState<string>('');
  const [sectionSaveStatus, setSectionSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Estado para la vista del tab Secciones (sin popups)
  const [sectionsView, setSectionsView] = useState<'list' | 'edit' | 'products'>('list');

  // Product selector filters state
  const [productSelectorFilters, setProductSelectorFilters] = useState({
    category: '',
    search: '',
    showOnlySelected: false
  });

  useEffect(() => {
    if (productSectionsLoading) {
      return;
    }

    const sourceSections =
      fetchedProductSections && fetchedProductSections.length > 0
        ? fetchedProductSections
        : defaultProductSections;

    const normalized = sourceSections.map((section) => ({
      ...section,
      selectedProducts: Array.isArray(section.selectedProducts)
        ? [...section.selectedProducts]
        : [],
    }));

    setProductSections((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(normalized)) {
        return prev;
      }
      return normalized as HomepageProductSection[];
    });
  }, [fetchedProductSections, productSectionsLoading]);

  const startSectionEditor = (section?: HomepageProductSection) => {
    if (section) {
      setSectionForm({
        id: section.id,
        name: section.name || '',
        description: section.description || '',
        type: section.type || 'custom',
        enabled: section.enabled !== false,
        selectedProducts: Array.isArray(section.selectedProducts) ? section.selectedProducts : [],
        categoryId: section.categoryId || '',
      });
    } else {
      setSectionForm({ ...DEFAULT_SECTION_FORM });
    }
    setSectionSaveStatus('idle');
    setSectionsView('edit');
  };

  const handleSectionFieldChange = (field: keyof SectionFormState, value: string | boolean) => {
    setSectionForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const persistSections = useCallback(
    async (sectionsToPersist: HomepageProductSection[]) => {
      await setDoc(doc(db, 'config', 'productSections'), {
        sections: sectionsToPersist,
        updatedAt: new Date().toISOString(),
      });
      refetchProductSections();
    },
    [refetchProductSections]
  );

  const handleSectionSave = async () => {
    if (!sectionForm) return;

    setSectionSaveStatus('saving');

    const sectionId = sectionForm.id || `section_${Date.now()}`;
    const normalizedSection: HomepageProductSection = {
      id: sectionId,
      name: sectionForm.name.trim() || 'Sección sin título',
      description: sectionForm.description.trim(),
      type: sectionForm.type,
      enabled: sectionForm.enabled,
      selectedProducts: Array.isArray(sectionForm.selectedProducts)
        ? sectionForm.selectedProducts
        : [],
      categoryId: sectionForm.categoryId,
    };

    const exists = productSections.some((section) => section.id === sectionId);
    const updatedSections = exists
      ? productSections.map((section) =>
          section.id === sectionId ? normalizedSection : section
        )
      : [...productSections, normalizedSection];

    setProductSections(updatedSections);

    try {
      await persistSections(updatedSections);
      setSectionSaveStatus('success');
      setTimeout(() => {
        setSectionForm(null);
        setSectionsView('list');
        setSectionSaveStatus('idle');
      }, 1200);
    } catch (error) {
      console.error('Error saving section:', error);
      setSectionSaveStatus('error');
      setTimeout(() => setSectionSaveStatus('idle'), 2500);
    }
  };

  const previewSectionData = sectionForm?.id
    ? productSections.find((section) => section.id === sectionForm.id)
    : null;
  const previewSelectedProductIds = sectionForm
    ? (previewSectionData?.selectedProducts || sectionForm.selectedProducts || [])
    : [];
  const previewProducts = previewSelectedProductIds
    .map((productId) => products.find((product) => product.id === productId))
    .filter(Boolean) as Product[];
  const currentSection = productSections.find((section) => section.id === currentSectionId);
  const isEditingExistingSection = Boolean(
    sectionForm?.id && productSections.some((section) => section.id === sectionForm.id)
  );

  // Layout patterns state
  const {
    patterns: layoutPatternsFetched,
    loading: layoutPatternsLoading,
    error: layoutPatternsError,
    savePatterns: persistLayoutPatterns,
  } = useLayoutPatterns();

  const [layoutPatterns, setLayoutPatterns] = useState<LayoutPatternsConfig>(cloneLayoutPatterns(DEFAULT_LAYOUT_PATTERNS));
  const [savingLayoutPatterns, setSavingLayoutPatterns] = useState(false);

  useEffect(() => {
    setLayoutPatterns(cloneLayoutPatterns(layoutPatternsFetched));
  }, [layoutPatternsFetched]);

  const orderedLayoutRules = useMemo(
    () =>
      LAYOUT_VARIANT_ORDER.map((variant) => {
        const match = layoutPatterns.rules.find((rule) => rule.variant === variant);
        return match ? { ...match } : getDefaultLayoutRule(variant);
      }),
    [layoutPatterns],
  );

  const updateLayoutRule = useCallback(
    (variant: LayoutPatternVariant, updater: (rule: LayoutPatternRule) => LayoutPatternRule) => {
      setLayoutPatterns((prev) => {
        const currentMap = new Map(prev.rules.map((rule) => [rule.variant, rule]));
        const currentRule = currentMap.get(variant) ?? getDefaultLayoutRule(variant);
        currentMap.set(variant, updater({ ...currentRule }));
        const recalculated = LAYOUT_VARIANT_ORDER.map((variantKey) => {
          const rule = currentMap.get(variantKey) ?? getDefaultLayoutRule(variantKey);
          return { ...rule };
        });
        return {
          ...prev,
          rules: recalculated,
        };
      });
    },
    [],
  );

  const handleSaveLayoutPatterns = useCallback(async () => {
    try {
      setSavingLayoutPatterns(true);
      await persistLayoutPatterns(layoutPatterns);
      alert('Configuración de layout guardada exitosamente');
    } catch (error) {
      console.error('Error saving layout patterns:', error);
      alert('Error al guardar la configuración de layout');
    } finally {
      setSavingLayoutPatterns(false);
    }
  }, [layoutPatterns, persistLayoutPatterns]);

  const handleResetLayoutPatterns = useCallback(() => {
    const shouldReset = window.confirm('¿Restablecer los patrones de layout a los valores predeterminados?');
    if (!shouldReset) return;
    setLayoutPatterns(cloneLayoutPatterns(DEFAULT_LAYOUT_PATTERNS));
  }, []);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: 'admin@importadorafyd.com',
    password: 'admin123'
  });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Product form state
  const [productForm, setProductForm] = useState({
    id: '',
    sku: '',
    nombre: '',
    precio: 0,
    precioOriginal: undefined as number | undefined,
    descripcion: '',
    stock: 0,
    minStock: 5,
    categoria: '',
    categorias: [] as string[],
    subcategoria: '',
    nuevo: false,
    oferta: false,
    imagen: '',
    imagenes: [] as string[]
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showStockAlert, setShowStockAlert] = useState(false);

  // Product search and filters
  const [productSearch, setProductSearch] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [productFilters, setProductFilters] = useState({
    priceRange: { min: '', max: '' },
    stockStatus: 'all', // 'all', 'in_stock', 'low_stock', 'out_of_stock'
    status: 'all', // 'all', 'active', 'inactive'
    tags: [] as string[] // ['nuevo', 'oferta']
  });

  // Protección de ruta: redirigir si no es administrador
  useEffect(() => {
    if (!authLoading && !userAuthLoading) {
      if (!user || !isAdmin) {
        console.warn('⚠️ Acceso denegado: usuario no es administrador');
        router.push('/');
      }
    }
  }, [authLoading, userAuthLoading, user, isAdmin, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      // User is not logged in, show login form
      return;
    }

    if (user && isAdmin) {
      loadCategories();
      loadPopupConfig();
      loadMainBannerConfig();
      loadHomepageContent();
      loadLogoConfig();
      
      // Cargar categorías disponibles desde productos
      const productCategoryOptions = [...new Set(products.map((p) => p.categoria).filter(Boolean))]
        .map((category) => normalizeCategoryOption(category))
        .filter((option): option is CategoryOption => option !== null);

      if (productCategoryOptions.length > 0) {
        setAvailableCategories((prev) => mergeCategoryOptions(prev, productCategoryOptions));
      }
      
      // Load orders with real-time updates
      const unsubscribeOrders = loadOrders();
      
      // Load chat messages with real-time updates
      const unsubscribeChat = loadChatMessages();
      
      return () => {
        if (unsubscribeOrders) unsubscribeOrders();
        if (unsubscribeChat) unsubscribeChat();
      };
    }
  }, [user, authLoading, products]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateStats = useCallback(() => {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;

    setStats({
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders
    });
  }, [orders, products]);

  // Recalculate stats when orders change
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Reset subcategoria when categoria changes
  useEffect(() => {
    if (productForm.categoria) {
      setProductForm(prev => ({ ...prev, subcategoria: '' }));
    }
  }, [productForm.categoria]);

  // Orders functions
  const loadOrders = () => {
    const ordersQuery = query(
      collection(db, 'gamerhouse_orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData: Order[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Order);
      });

      // Count new orders (pending or pending_verification)
      const newOrders = ordersData.filter(order =>
        order.status === 'pending' || order.status === 'pending_verification'
      ).length;

      setOrders(ordersData);
      setNewOrdersCount(newOrders);
    });

    return unsubscribe;
  };

  // Chat functions
  const loadChatMessages = () => {
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const message = {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ChatMessage;
        
        messages.push(message);
        
        if (!message.read && !message.isAdmin) {
          unread++;
        }
      });

      setChatMessages(messages);
      setUnreadChatCount(unread);
    });

    return unsubscribe;
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    const result = await login(loginForm.email, loginForm.password);
    
    if (!result.success) {
      setLoginError(result.error || 'Error de autenticación');
    }
    
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingProduct(true);

    try {
      const trimmedSku = (productForm.sku || '').trim();

      if (!trimmedSku) {
        alert('Por favor ingresa un SKU para el producto.');
        setUploadingProduct(false);
        return;
      }

      let imageUrl = productForm.imagen;
      let imagenesUrls = productForm.imagenes || [];

      // Upload all new images if selected
      if (productImages.length > 0) {
        console.log(`📸 Subiendo ${productImages.length} nuevas imágenes...`);
        const uploadPromises = productImages.map(async (file, index) => {
          const optimizedImage = await optimizeImageFile(file);
          const imageRef = ref(storage, `products/${Date.now()}_${index}_${optimizedImage.name}`);
          const snapshot = await uploadBytes(imageRef, optimizedImage);
          return await getDownloadURL(snapshot.ref);
        });

        const newImagenesUrls = await Promise.all(uploadPromises);
        console.log(`✅ ${newImagenesUrls.length} nuevas imágenes subidas`);

        // Combinar imágenes existentes + nuevas (no reemplazar)
        imagenesUrls = [...imagenesUrls, ...newImagenesUrls];

        // Solo actualizar imagen principal si no existe una
        if (!imageUrl) {
          imageUrl = newImagenesUrls[0];
        }

        console.log(`📦 Total de imágenes: ${imagenesUrls.length}`);
      }

      const priceAsNumber = parseInt(String(productForm.precio).replace(/\D/g, ''), 10) || 0;

      console.log('📦 Datos de imágenes a guardar:', {
        imagen: imageUrl,
        imagenes: imagenesUrls,
        totalImagenes: imagenesUrls.length
      });

      const productData: any = {
        nombre: productForm.nombre,
        precio: priceAsNumber,
        descripcion: productForm.descripcion,
        stock: Number(productForm.stock),
        minStock: Number(productForm.minStock),
        categoria: productForm.categoria,
        categorias: productForm.categorias,
        subcategoria: productForm.subcategoria,
        nuevo: productForm.nuevo,
        oferta: productForm.oferta,
        imagen: imageUrl,
        imagenes: imagenesUrls,
        sku: trimmedSku,
        activo: true,
      };

      // Solo agregar precioOriginal si tiene valor (evitar undefined)
      if (productForm.precioOriginal && productForm.precioOriginal > 0) {
        productData.precioOriginal = productForm.precioOriginal;
      }

      if (!productForm.id) {
        productData.fechaCreacion = new Date().toISOString();
      }

      // No es necesario limpiar porque ya no incluimos undefined
      const cleanedData = productData;

      if (productForm.id) {
        // Update existing product
        try {
          const productRef = doc(db, 'gamerhouse_products', productForm.id);
          await updateDoc(productRef, cleanedData);
          alert('Producto actualizado exitosamente');
          refetch(); // Refetch to show the new data
        } catch (error) {
          console.error("Error updating product in Firestore: ", error);
          alert(`Error al actualizar el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      } else {
        // Create new product
        try {
          const docRef = await addDoc(collection(db, 'gamerhouse_products'), cleanedData);
          console.log('✅ Producto creado con ID:', docRef.id);
          console.log('📸 Imágenes guardadas en Firestore:', cleanedData.imagenes);
          alert('Producto creado exitosamente');
          refetch(); // Refetch to get the new product with its ID
        } catch (error) {
          console.error("Error creating product in Firestore: ", error);
          alert(`Error al crear el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      // Reset form and close modal
      setProductForm({
        id: '',
        sku: '',
        nombre: '',
        precio: 0,
        precioOriginal: undefined,
        descripcion: '',
        stock: 0,
        minStock: 5,
        categoria: '',
        categorias: [],
        subcategoria: '',
        nuevo: false,
        oferta: false,
        imagen: '',
        imagenes: []
      });
      setProductImages([]);
      setProductImagePreviews([]);
      setShowProductModal(false);
    } catch (error) {
      alert('Error al guardar el producto');
    } finally {
      setUploadingProduct(false);
    }
  };

  const editProduct = (product: Product) => {
    if (!product.id) {
      return;
    }
    router.push(`/admin/productos/nuevo?id=${product.id}`);
  };

  const deleteProduct = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await removeProduct(id);
        setSelectedProducts(prev => prev.filter(pId => pId !== id));
        alert('Producto eliminado exitosamente');
      } catch (error) {
        alert('Error al eliminar el producto');
      }
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const productRef = doc(db, 'gamerhouse_products', id);
      await updateDoc(productRef, updates);
      refetch(); // Refetch to show the updated data
      alert('Producto actualizado exitosamente');
    } catch (error) {
      console.error("Error updating product: ", error);
      alert('Error al actualizar el producto');
    }
  };

  const deleteSelectedProducts = async () => {
    if (selectedProducts.length === 0) {
      alert('No hay productos seleccionados');
      return;
    }
    
    if (confirm(`¿Estás seguro de que deseas eliminar ${selectedProducts.length} producto(s)?`)) {
      try {
        await removeProducts(selectedProducts);
        setSelectedProducts([]);
        alert(`${selectedProducts.length} producto(s) eliminado(s) exitosamente`);
      } catch (error) {
        alert('Error al eliminar productos');
      }
    }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(id)) {
        return prev.filter(pId => pId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handlePopupImageUpload = async (file: File) => {
    if (!user) {
      alert(`Debes iniciar sesión como administrador para subir ${popupForm.isVideo ? 'videos' : 'imágenes'} del popup.`);
      return;
    }
    try {
      setPopupImageUploading(true);

      let finalFile = file;
      if (!popupForm.isVideo) {
        finalFile = await optimizeImageFile(file, {
          maxWidthOrHeight: 800,
          maxSizeMB: 0.8,
        });
      }

      const fileName = `config/offer-popup/${Date.now()}-${finalFile.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, finalFile, {
        contentType: finalFile.type || (popupForm.isVideo ? 'video/mp4' : 'image/jpeg')
      });
      const downloadURL = await getDownloadURL(snapshot.ref);
      setPopupForm((prev) => ({ ...prev, mediaUrl: downloadURL }));
    } catch (error) {
      console.error(`Error uploading popup ${popupForm.isVideo ? 'video' : 'image'}:`, error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      if (message.includes('storage/unauthorized')) {
        alert(`❌ No tienes permisos para subir este ${popupForm.isVideo ? 'video' : 'imagen'}. Verifica que estás autenticado como administrador y que las reglas de Firebase Storage lo permiten.`);
      } else {
        alert(`❌ Error al subir ${popupForm.isVideo ? 'el video' : 'la imagen'} del popup: ${message}`);
      }
    } finally {
      setPopupImageUploading(false);
    }
  };

  const popupSizePreset = POPUP_SIZE_PRESETS[popupForm.size] ?? POPUP_SIZE_PRESETS['2x2'];
  const popupRatio = popupSizePreset.height / popupSizePreset.width;
  const popupPreviewStyle = {
    width: `min(${popupSizePreset.width}px, calc(100% - 2rem), calc((100vh - 3rem) / ${popupRatio.toFixed(3)}))`,
    maxWidth: 'calc(100% - 2rem)'
  } as React.CSSProperties;

  // Advanced product filtering function
  const getFilteredProducts = () => {
    return products.filter(product => {
      // Category filter
      if (selectedCategory !== 'all' && !productHasCategory(product, selectedCategory)) {
        return false;
      }

      // Search filter
      if (productSearch) {
        const searchTerm = productSearch.toLowerCase();
        const searchableText = [
          product.nombre,
          product.descripcion || '',
          product.categoria,
          product.subcategoria || '',
          product.sku || ''
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Price range filter
      if (productFilters.priceRange.min && product.precio < parseFloat(productFilters.priceRange.min)) {
        return false;
      }
      if (productFilters.priceRange.max && product.precio > parseFloat(productFilters.priceRange.max)) {
        return false;
      }

      // Stock status filter
      if (productFilters.stockStatus !== 'all') {
        const minStock = product.minStock || 5;
        switch (productFilters.stockStatus) {
          case 'out_of_stock':
            if (product.stock > 0) return false;
            break;
          case 'low_stock':
            if (product.stock === 0 || product.stock > minStock) return false;
            break;
          case 'in_stock':
            if (product.stock <= minStock) return false;
            break;
        }
      }

      // Status filter (active/inactive)
      if (productFilters.status !== 'all') {
        const isActive = product.activo !== false;
        if (productFilters.status === 'active' && !isActive) return false;
        if (productFilters.status === 'inactive' && isActive) return false;
      }

      // Tags filter (nuevo, oferta)
      if (productFilters.tags.length > 0) {
        const hasRequiredTags = productFilters.tags.every(tag => {
          if (tag === 'nuevo') return product.nuevo === true;
          if (tag === 'oferta') return product.oferta === true;
          return false;
        });
        if (!hasRequiredTags) return false;
      }

      return true;
    });
  };

  const selectAllProducts = () => {
    const filteredProducts = getFilteredProducts();
    const allIds = filteredProducts.map(p => p.id);
    setSelectedProducts(allIds);
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const oldStatus = order.status;

      await updateDoc(doc(db, 'gamerhouse_orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Send notification message about status change
      const statusMessages = {
        confirmed: `✅ **Pago Confirmado** - ${new Date().toLocaleString('es-CL')}\n\nTu pedido #${orderId.slice(-8).toUpperCase()} ha sido confirmado exitosamente. Hemos verificado tu pago y ahora estamos preparando tus productos para el envío.\n\n📋 **Siguiente paso:** Verificación de stock y preparación del pedido`,
        preparing: `📦 **Preparando Pedido** - ${new Date().toLocaleString('es-CL')}\n\nEstamos verificando el stock y preparando tu pedido #${orderId.slice(-8).toUpperCase()} para el envío. Nuestro equipo está seleccionando cuidadosamente tus productos.\n\n🚚 **Siguiente paso:** Envío del pedido`,
        shipped: `🚚 **Pedido Enviado** - ${new Date().toLocaleString('es-CL')}\n\n¡Tu pedido #${orderId.slice(-8).toUpperCase()} está en camino! Hemos entregado tu paquete al servicio de envío y pronto estará en tus manos.\n\n📍 **Siguiente paso:** Entrega en tu dirección`,
        delivered: `🎉 **Pedido Entregado** - ${new Date().toLocaleString('es-CL')}\n\n¡Excelente! Tu pedido #${orderId.slice(-8).toUpperCase()} ha sido entregado exitosamente. Esperamos que disfrutes tu compra.\n\n⭐ ¡No olvides dejarnos tu opinión!`,
        cancelled: `❌ **Pedido Cancelado** - ${new Date().toLocaleString('es-CL')}\n\nTu pedido #${orderId.slice(-8).toUpperCase()} ha sido cancelado. Si tienes dudas sobre esta cancelación o necesitas ayuda, no dudes en contactarnos.`
      };

      const statusMessage = statusMessages[newStatus as keyof typeof statusMessages];
      if (statusMessage && order.customerEmail) {
        // Send chat notification
        await sendOrderNotification(orderId, order.customerEmail, order.customerName, statusMessage);

        // Send email notification
        try {
          await notifyOrderStatusChange({
            orderId: orderId,
            oldStatus: oldStatus,
            newStatus: newStatus,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            total: order.total
          });
          console.log('✅ Email de cambio de estado enviado exitosamente');
        } catch (emailError) {
          console.error('❌ Error enviando email de cambio de estado:', emailError);
          // No bloquear el proceso si falla el email
        }
      }

      // Regenerar reporte diario cuando se entrega un pedido
      if (newStatus === 'delivered') {
        try {
          // const today = new Date().toISOString().split('T')[0];
          // const { generateDailyReportUtil } = await import('@/utils/reportUtils');
          // await generateDailyReportUtil(today);
        } catch (error) {
          console.error('Error regenerando reporte diario:', error);
        }
      }
      
      loadOrders();
    } catch (error) {
      alert('Error al actualizar el pedido');
    }
  };

  const sendOrderNotification = async (orderId: string, customerEmail: string, customerName: string, message: string) => {
    try {
      await addDoc(collection(db, 'chat_messages'), {
        orderId: orderId,
        userId: customerEmail, // Use email as userId for guests
        userEmail: customerEmail,
        userName: customerName,
        message: message,
        isAdmin: true,
        timestamp: serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error('Error sending order notification:', error);
    }
  };


  const getOrderMessageCount = (orderId: string) => {
    return chatMessages.filter(msg => msg.orderId === orderId && !msg.read && !msg.isAdmin).length;
  };

  const openChatPopup = (order: Order) => {
    setChatPopupOrder(order);
    setIsChatPopupOpen(true);
  };

  const closeChatPopup = () => {
    setIsChatPopupOpen(false);
    setChatPopupOrder(null);
  };

  const handleDeleteSelectedOrders = async () => {
    if (selectedOrders.length === 0) {
      alert('⚠️ No has seleccionado ningún pedido para eliminar.');
      return;
    }

    if (!confirm(`⚠️ ¿Estás seguro de que quieres eliminar ${selectedOrders.length} pedido(s)?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingOrders(true);
    try {
      // Eliminar pedidos seleccionados
      for (const orderId of selectedOrders) {
        await deleteDoc(doc(db, 'gamerhouse_orders', orderId));

        // Eliminar mensajes de chat asociados
        const messagesQuery = query(
          collection(db, 'chat_messages'),
          where('orderId', '==', orderId)
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        for (const messageDoc of messagesSnapshot.docs) {
          await deleteDoc(messageDoc.ref);
        }
      }

      alert(`✅ ${selectedOrders.length} pedido(s) eliminado(s) exitosamente.`);
      setSelectedOrders([]);
      refetch();
    } catch (error) {
      alert('❌ Error al eliminar pedidos');
      console.error('Error deleting orders:', error);
    } finally {
      setDeletingOrders(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAllOrders = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getOrderTimeline = (order: Order) => {
    const timeline = [
      {
        status: 'pending',
        title: 'Recibido',
        icon: ClockIcon,
        completed: true,
        date: order.createdAt
      },
      {
        status: 'confirmed',
        title: 'Confirmado',
        icon: CreditCardIcon,
        completed: ['confirmed', 'preparing', 'shipped', 'delivered'].includes(order.status),
        date: order.status !== 'pending' ? order.createdAt : null
      },
      {
        status: 'preparing',
        title: 'Preparando',
        icon: CubeIcon,
        completed: ['preparing', 'shipped', 'delivered'].includes(order.status),
        date: order.status === 'preparing' || ['shipped', 'delivered'].includes(order.status) ? order.createdAt : null
      },
      {
        status: 'shipped',
        title: 'Enviado',
        icon: TruckIcon,
        completed: ['shipped', 'delivered'].includes(order.status),
        date: order.status === 'shipped' || order.status === 'delivered' ? order.createdAt : null
      },
      {
        status: 'delivered',
        title: 'Entregado',
        icon: CheckCircleIcon,
        completed: order.status === 'delivered',
        date: order.status === 'delivered' ? order.createdAt : null
      }
    ];

    return timeline.filter(item => order.status !== 'cancelled');
  };

  const toggleGroupExpansion = (groupIndex: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupIndex)) {
      newExpanded.delete(groupIndex);
    } else {
      newExpanded.add(groupIndex);
    }
    setExpandedGroups(newExpanded);
  };

  const groupOrdersByUser = (orders: Order[]) => {
    const grouped: { [key: string]: Order[] } = {};

    orders.forEach(order => {
      // Group by user email OR user ID, prioritizing email
      const key = order.customerEmail || 'unknown-user';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(order);
    });

    // Convert to array and sort each group by date (most recent first)
    return Object.values(grouped).map(userOrders => {
      return userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }).sort((a, b) => new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime());
  };

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading || userAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2"></div>
      </div>
    );
  }

  // Bloquear acceso si no es administrador
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)] flex items-center justify-center px-4">
        <div className="modern-card max-w-md w-full p-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="eyebrow-text text-slate-500">GAMER HOUSE</span>
            <h1 className="text-2xl font-semibold text-slate-900">🛡️ Admin Panel</h1>
          </div>

          {!user ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  className="modern-input mt-2 w-full"
                />
              </div>

              <div>
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                  className="modern-input mt-2 w-full"
                />
              </div>

              {loginError && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-red-600 py-3 text-base font-semibold text-white shadow-[0_30px_70px_-45px_rgba(220,38,38,0.85)] transition disabled:opacity-50"
              >
                {loggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <p className="font-semibold text-rose-600">⛔ Acceso Denegado</p>
                <p className="text-sm text-rose-500 mt-2">
                  No tienes permisos de administrador para acceder a esta página.
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-rose-400 py-2.5 text-sm font-semibold text-white shadow-lg"
              >
                Volver al Inicio
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        #admin-container * {
          font-size: 1.02em !important;
        }
      `}</style>
      <div
        id="admin-container"
        className="relative min-h-screen pb-24 text-slate-900"
        style={{ background: 'var(--surface-alt)' }}
      >

      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-[0_20px_60px_-45px_rgba(15,23,42,0.4)]">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-xl text-red-500 shadow-inner">
                🏪
              </div>
              <h1 className="text-xl font-semibold text-slate-900">
                Gamer House Admin Panel
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-sky-200 hover:text-sky-700"
            >
              <svg className="h-4 w-4 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Compact Admin Header */}
        <div className="rounded-[32px] border border-slate-200 bg-white shadow-[0_45px_110px_-60px_rgba(15,23,42,0.35)] mb-6">
          <div className="relative space-y-6 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-rose-50 text-2xl">
                  ⚡
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Panel</p>
                  <h1 className="text-2xl font-black text-slate-900">Administración Gamer House</h1>
                  <p className="text-sm text-slate-500">Gestiona operaciones, inventario y campañas</p>
                  {userProfile && (
                    <p className="text-xs text-slate-400 mt-2">
                      Sesión iniciada como {`${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || userProfile.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                🎮 GAMERHOUSE
              </div>
            </div>

            {/* Horizontal Navigation */}
            <nav className="flex flex-wrap gap-2">
              {[
                { id: 'dashboard', name: 'Dashboard & Reportes', icon: '🏠' },
                { id: 'products', name: 'Productos & Stock', icon: '📦' },
                { id: 'orders', name: 'Pedidos', icon: '🛒', badge: newOrdersCount > 0 ? newOrdersCount : null, badgeColor: 'bg-pink' },
                { id: 'user-management', name: 'Gestión de Usuario', icon: '👥' },
                { id: 'popup', name: 'Popup Ofertas', icon: '🎉' },
                { id: 'logo', name: 'Logo', icon: '🏪' },
                { id: 'banner', name: 'Banner Dinámico', icon: '📸' },
                { id: 'home-sections', name: 'Secciones Home', icon: '🏠' },
                { id: 'categories', name: 'Categorías', icon: '🏷️' },
                { id: 'discounts', name: 'Cupones & Descuentos', icon: '🎫' },
                { id: 'footer', name: 'Información', icon: '📋' },
                { id: 'bank-details', name: 'Datos Bancarios', icon: '🏦' }
              ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`chip-option relative transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'chip-option-active scale-[1.03]'
                    : 'hover:-translate-y-0.5'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="whitespace-nowrap text-sm font-semibold">{tab.name}</span>
                {'badge' in tab && tab.badge && (
                  <span className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-[0_0_18px_rgba(255,232,141,0.6)] ${tab.badgeColor || 'bg-pink'}`}>
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </button>
            ))}
            </nav>
          </div>
        </div>

        
        {activeTab === 'dashboard' && (
          <div className="space-y-8">

            {/* Dashboard & Reportes Header */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_90px_-55px_rgba(15,23,42,0.3)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner bg-gradient-to-br from-amber-100 to-rose-50 text-xl">
                    🏠
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Resumen</p>
                    <h2 className="text-2xl font-bold text-slate-900">Dashboard & Reportes</h2>
                    <p className="text-slate-500 text-sm">Panel principal con estadísticas y exportación</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const currentMonth = today.toISOString().slice(0, 7);
                      const monthName = today.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

                      // Generate a simple PDF report with current data
                      const reportData = {
                        month: currentMonth,
                        monthName: monthName,
                        totalSales: stats.totalRevenue,
                        totalOrders: stats.totalOrders,
                        averageOrderValue: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0,
                        topProducts: orders.flatMap(order => order.items)
                          .reduce((acc, item) => {
                            const existing = acc.find(p => p.nombre === item.nombre);
                            if (existing) {
                              existing.quantity += item.cantidad;
                              existing.revenue += item.precio * item.cantidad;
                            } else {
                              acc.push({
                                nombre: item.nombre,
                                quantity: item.cantidad,
                                revenue: item.precio * item.cantidad
                              });
                            }
                            return acc;
                          }, [] as any[])
                          .sort((a, b) => b.revenue - a.revenue)
                          .slice(0, 5)
                      };

                      // Simple export alert for now (could be enhanced with actual PDF generation)
                      alert(`Reporte de ${monthName}\n\nVentas totales: ${formatPrice(reportData.totalSales)}\nPedidos: ${reportData.totalOrders}\nVenta promedio: ${formatPrice(reportData.averageOrderValue)}\n\nProducto más vendido: ${reportData.topProducts[0]?.nombre || 'N/A'}`);
                    }}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:from-amber-300 hover:to-rose-300"
                  >
                    📊 Exportar Reporte
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Productos', value: stats.totalProducts, icon: '📦' },
                { label: 'Total Pedidos', value: stats.totalOrders, icon: '🛒' },
                { label: 'Ingresos Totales', value: formatPrice(stats.totalRevenue), icon: '💰' },
                { label: 'Pedidos Pendientes', value: stats.pendingOrders, icon: '⏳' }
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.35)] transition hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-100 to-rose-50 text-2xl">
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                      <p className="text-3xl font-black text-slate-900">{card.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>


            {/* Modern Recent Orders Section */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_35px_90px_-55px_rgba(15,23,42,0.35)]">
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-slate-50 text-lg">
                  📋
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Listado</p>
                  <h3 className="text-xl font-bold text-slate-900">Pedidos recientes</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Pedidos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Total Comprado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Último Pedido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Estados
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {ordersByCustomer.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                          No hay pedidos registrados todavía.
                        </td>
                      </tr>
                    ) : (
                      ordersByCustomer.slice(0, 5).map((group) => (
                        <tr key={group.lastOrderId} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {group.customerName}
                              </div>
                              <div className="text-xs text-slate-400">
                                {group.customerEmail}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                            {group.orderCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                            {formatPrice(group.totalSpent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {group.lastOrderDate.toLocaleDateString('es-CL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(group.statusBreakdown).map(([status, count]) => (
                                <span
                                  key={status}
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    statusClassMap[status as OrderStatus] || 'bg-slate-800 text-white'
                                  }`}
                                >
                                  {statusLabelMap[status as OrderStatus]} · {count}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Gestión de Productos</h2>
              <Link
                href="/admin/productos/nuevo"
                className="text-white px-4 py-2 rounded-md transition-colors inline-block bg-yellow-400" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
                >
<span className="text-lg mr-2">➕</span>
                Agregar Producto
              </Link>
            </div>

            {/* Compact Low Stock Alert Section */}
            {(() => {
              const lowStockProducts = products.filter(product => {
                const minStock = product.minStock || 5;
                return product.stock <= minStock;
              });

              if (lowStockProducts.length === 0) return null;

              // Count by severity
              const outOfStock = lowStockProducts.filter(p => p.stock === 0).length;
              const critical = lowStockProducts.filter(p => p.stock > 0 && p.stock <= (p.minStock || 5) / 2).length;
              const low = lowStockProducts.length - outOfStock - critical;

              return (
                <div className="mb-6">
                  {/* Compact Alert Button */}
                  <div
                    onClick={() => setShowStockAlert(!showStockAlert)}
                    className="bg-gradient-to-r from-pink to-primary hover:from-pink hover:to-primary text-white rounded-xl p-4 shadow-lg shadow-red-600/20 hover:shadow-xl shadow-red-600/30 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] animate-pulse-slow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative mr-3">
                          <ExclamationTriangleIcon className="h-6 w-6 animate-bounce" />
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-300 rounded-full animate-ping"></div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            🚨 {lowStockProducts.length} Producto{lowStockProducts.length !== 1 ? 's' : ''} con Stock Bajo
                          </h3>
                          <div className="flex items-center space-x-3 text-sm">
                            {outOfStock > 0 && (
                              <span className="bg-secondary px-2 py-1 rounded-full text-xs font-bold">
                                {outOfStock} Sin Stock
                              </span>
                            )}
                            {critical > 0 && (
                              <span className="bg-yellow-500 px-2 py-1 rounded-full text-xs font-bold">
                                {critical} Crítico{critical !== 1 ? 's' : ''}
                              </span>
                            )}
                            {low > 0 && (
                              <span className="bg-yellow-600 px-2 py-1 rounded-full text-xs font-bold">
                                {low} Bajo{low !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm mr-2">Click para {showStockAlert ? 'ocultar' : 'ver'}</span>
                        <div className={`transform transition-transform duration-300 ${showStockAlert ? 'rotate-180' : ''}`}>
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Stock List */}
                  {showStockAlert && (
                    <div className="mt-4 bg-slate-800/70 border-2 border-slate-200 rounded-xl shadow-lg shadow-red-600/20 overflow-hidden">
                      <div className="bg-gradient-to-r from-slate-800 to-slate-800 p-4 border-b border-slate-200">
                        <h4 className="font-bold text-pink flex items-center">
                          📋 Lista Detallada de Productos
                          <span className="ml-2 text-sm text-pink">({lowStockProducts.length} productos)</span>
                        </h4>
                      </div>

                      {/* Stock List Table */}
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full table-fixed">
                          <thead className="bg-slate-900 sticky top-0">
                            <tr className="text-left text-xs font-semibold text-yellow-300 uppercase">
                              <th className="w-2/5 px-4 py-2">Producto</th>
                              <th className="w-1/5 px-4 py-2">Estado</th>
                              <th className="w-1/12 px-4 py-2">Stock</th>
                              <th className="w-1/12 px-4 py-2">Mínimo</th>
                              <th className="w-1/5 px-4 py-2">Nivel</th>
                              <th className="w-32 px-4 py-2">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {lowStockProducts.map((product) => {
                              const minStock = product.minStock || 5;
                              const isOutOfStock = product.stock === 0;
                              const isCritical = product.stock <= minStock / 2;
                              const stockPercentage = Math.min((product.stock / minStock) * 100, 100);

                              return (
                                <tr key={product.id} className="hover:bg-slate-900 transition-colors">
                                  <td className="px-4 py-3 align-top">
                                    <div className="font-medium text-white">{product.nombre}</div>
                                    <div className="text-xs text-yellow-300">{product.categoria}</div>
                                  </td>
                                  <td className="px-4 py-3 align-top">
                                    <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                                      isOutOfStock
                                        ? 'bg-slate-800 text-pink'
                                        : isCritical
                                          ? 'bg-slate-800 text-secondary'
                                          : 'bg-warning/20 text-yellow-800'
                                    }`}>
                                      {isOutOfStock ? '🔴 Sin Stock' : isCritical ? '🟠 Crítico' : '🟡 Bajo'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`font-bold ${
                                      isOutOfStock ? 'text-pink' : isCritical ? 'text-yellow-300' : 'text-yellow-700'
                                    }`}>
                                      {product.stock}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-yellow-300">{minStock}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-16 bg-slate-800 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full transition-all duration-300 ${
                                            isOutOfStock ? 'bg-pink' : isCritical ? 'bg-yellow-400' : 'bg-yellow-500'
                                          }`}
                                          style={{ width: `${stockPercentage}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs text-yellow-300">{Math.round(stockPercentage)}%</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        onClick={() => {
                                          const newStock = prompt(`Nuevo stock para "${product.nombre}":`, product.stock.toString());
                                          if (newStock && !isNaN(parseInt(newStock))) {
                                            updateProduct(product.id, { stock: parseInt(newStock) });
                                          }
                                        }}
                                        className="bg-red-600 hover:bg-secondary text-white text-xs px-2 py-1 rounded transition-colors"
                                        title="Ajustar Stock"
                                      >
                                        📈
                                      </button>
                                      <button
                                        onClick={() => {
                                          const minStockNew = prompt(`Stock mínimo para "${product.nombre}":`, minStock.toString());
                                          if (minStockNew && !isNaN(parseInt(minStockNew))) {
                                            updateProduct(product.id, { minStock: parseInt(minStockNew) });
                                          }
                                        }}
                                        className="bg-dark0 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded transition-colors"
                                        title="Configurar Mínimo"
                                      >
                                        ⚙️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Quick Actions Footer */}
                      <div className="bg-slate-900 p-4 border-t border-yellow-300/30">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-yellow-300">
                            💡 Tip: Haz clic en los botones de acción para gestionar el stock rápidamente
                          </span>
                          <button
                            onClick={() => setShowStockAlert(false)}
                            className="bg-slate-800 hover:bg-gray-300 text-yellow-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Cerrar Lista
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}


            {/* Advanced Search and Filters Section */}
            <div className="bg-red-600 hover:bg-secondary-50 to-yellow-50 border border-warning rounded-xl p-6 shadow-lg shadow-red-600/20 mb-6">
              {/* Search Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <div className="h-6 w-6 text-red-600">🔍</div>
                  </div>
                  <h3 className="text-lg font-bold text-secondary">
                    Buscar y Filtrar Productos
                  </h3>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-red-600 hover:bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <span>⚙️</span>
                  <span>{showFilters ? 'Ocultar Filtros' : 'Filtros Avanzados'}</span>
                </button>
              </div>

              {/* Main Search Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="🔍 Buscar por nombre, descripción, SKU o categoría..."
                      className="w-full pl-4 pr-12 py-3 border-2 border-warning rounded-xl focus:border-red-600 focus:outline-none transition-all duration-200 text-sm"
                    />
                    {productSearch && (
                      <button
                        onClick={() => setProductSearch('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-300 hover:text-yellow-300 text-lg"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-warning rounded-xl focus:border-red-600 focus:outline-none transition-all duration-200 text-sm"
                  >
                    <option value="all">📦 Todas las categorías</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced Filters (Collapsible) */}
              {showFilters && (
                <div className="bg-slate-800/70 bg-opacity-80 rounded-xl p-4 space-y-4 border border-warning/30">
                  <h4 className="font-semibold text-secondary flex items-center">
                    🎯 Filtros Avanzados
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium text-yellow-300 mb-2">
                        💰 Rango de Precio
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={productFilters.priceRange.min}
                          onChange={(e) => setProductFilters(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, min: e.target.value }
                          }))}
                          className="w-full px-2 py-2 border border-yellow-300/40 rounded-lg text-xs focus:border-red-600 focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={productFilters.priceRange.max}
                          onChange={(e) => setProductFilters(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, max: e.target.value }
                          }))}
                          className="w-full px-2 py-2 border border-yellow-300/40 rounded-lg text-xs focus:border-red-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div>
                      <label className="block text-sm font-medium text-yellow-300 mb-2">
                        📊 Estado de Stock
                      </label>
                      <select
                        value={productFilters.stockStatus}
                        onChange={(e) => setProductFilters(prev => ({
                          ...prev,
                          stockStatus: e.target.value
                        }))}
                        className="w-full px-2 py-2 border border-yellow-300/40 rounded-lg text-xs focus:border-red-600 focus:outline-none"
                      >
                        <option value="all">Todos</option>
                        <option value="in_stock">Con Stock</option>
                        <option value="low_stock">Stock Bajo</option>
                        <option value="out_of_stock">Sin Stock</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-yellow-300 mb-2">
                        🔘 Estado
                      </label>
                      <select
                        value={productFilters.status}
                        onChange={(e) => setProductFilters(prev => ({
                          ...prev,
                          status: e.target.value
                        }))}
                        className="w-full px-2 py-2 border border-yellow-300/40 rounded-lg text-xs focus:border-red-600 focus:outline-none"
                      >
                        <option value="all">Todos</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                      </select>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-yellow-300 mb-2">
                        🏷️ Etiquetas
                      </label>
                      <div className="space-y-1">
                        <label className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={productFilters.tags.includes('nuevo')}
                            onChange={(e) => {
                              const newTags = e.target.checked
                                ? [...productFilters.tags, 'nuevo']
                                : productFilters.tags.filter(t => t !== 'nuevo');
                              setProductFilters(prev => ({ ...prev, tags: newTags }));
                            }}
                            className="mr-2"
                          />
                          ✨ Nuevos
                        </label>
                        <label className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={productFilters.tags.includes('oferta')}
                            onChange={(e) => {
                              const newTags = e.target.checked
                                ? [...productFilters.tags, 'oferta']
                                : productFilters.tags.filter(t => t !== 'oferta');
                              setProductFilters(prev => ({ ...prev, tags: newTags }));
                            }}
                            className="mr-2"
                          />
                          🔥 Ofertas
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setProductSearch('');
                        setSelectedCategory('all');
                        setProductFilters({
                          priceRange: { min: '', max: '' },
                          stockStatus: 'all',
                          status: 'all',
                          tags: []
                        });
                      }}
                      className="bg-slate-800 hover:bg-gray-300 text-yellow-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🗑️ Limpiar Filtros
                    </button>
                  </div>
                </div>
              )}

              {/* Results Summary */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="bg-warning/20 text-secondary px-3 py-1 rounded-full font-medium">
                    📊 {getFilteredProducts().length} de {products.length} productos
                  </span>
                  {(productSearch || selectedCategory !== 'all' || showFilters) && (
                    <div className="flex items-center space-x-2">
                      {productSearch && (
                        <span className="bg-success/20 text-success px-2 py-1 rounded-full text-xs">
                          🔍 "{productSearch}"
                        </span>
                      )}
                      {selectedCategory !== 'all' && (
                        <span className="bg-warning/20 text-amber-800 px-2 py-1 rounded-full text-xs">
                          📦 {categories.find(c => c.id === selectedCategory)?.name}
                        </span>
                      )}
                      {productFilters.tags.map(tag => (
                        <span key={tag} className="bg-slate-800 text-secondary px-2 py-1 rounded-full text-xs">
                          {tag === 'nuevo' ? '✨ Nuevo' : '🔥 Oferta'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-red-600">
                  💡 Tip: Usa los filtros para encontrar productos específicos
                </div>
              </div>
            </div>

            
            <div className="bg-slate-800/70 rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-yellow-300">
                    {selectedProducts.length} producto(s) seleccionado(s)
                  </span>
                  <button
                    onClick={selectAllProducts}
                    className="text-sm hover:opacity-80 transition-opacity"
                  >
                    Seleccionar todo
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-yellow-300 hover:text-yellow-300"
                  >
                    Limpiar selección
                  </button>
                </div>
                {selectedProducts.length > 0 && (
                  <button
                    onClick={deleteSelectedProducts}
                    className="px-4 py-2 text-white rounded-md text-sm bg-yellow-400"
                  >
                    <span className="text-lg mr-2">🗑️</span>
                    Eliminar seleccionados ({selectedProducts.length})
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_25px_70px_-55px_rgba(15,23,42,0.35)] overflow-hidden">
              <div className="overflow-x-auto">
      <table className="min-w-full table-fixed divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        <input
                          type="checkbox"
                          checked={getFilteredProducts().length > 0 && getFilteredProducts().every(p => selectedProducts.includes(p.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectAllProducts();
                            } else {
                              clearSelection();
                            }
                          }}
                          className="rounded border-yellow-300/40"
                        />
                      </th>
                      <th className="w-2/5 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Producto
                      </th>
                      <th className="w-1/6 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Precio
                      </th>
                      <th className="w-1/6 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Stock
                      </th>
                      <th className="w-1/6 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Categoría
                      </th>
                      <th className="w-40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {getFilteredProducts().map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 py-4 align-top">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="rounded border-yellow-300/40"
                          />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 mr-4">
                              {product.imagen ? (
                                <Image
                                  src={product.imagen}
                                  alt={product.nombre}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 object-cover rounded"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-slate-800 rounded flex items-center justify-center">
                                  📦
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {product.nombre}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                SKU: {product.sku && product.sku.trim() ? product.sku : 'No asignado'}
                              </div>
                              <div className="flex space-x-1 mt-1">
                                {product.nuevo && (
                                  <span className="bg-success/20 text-success text-xs px-2 py-1 rounded-full">
                                    Nuevo
                                  </span>
                                )}
                                {product.oferta && (
                                  <span className="bg-slate-800 text-pink text-xs px-2 py-1 rounded-full">
                                    Oferta
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-white">
                          {formatPrice(product.precio)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-sm font-medium ${
                            product.stock > 10 ? 'text-success' :
                            product.stock > 0 ? 'text-yellow-600' : 'text-pink'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-white capitalize">
                          {product.categoria}
                        </td>
                              <td className="px-4 py-4 text-sm font-medium" onClick={(event) => event.stopPropagation()}>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => editProduct(product)}
                              className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 text-slate-800"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              
              <div className="px-6 py-3 bg-slate-900 border-t border-yellow-300/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-yellow-300">
                    Mostrando <span className="font-bold text-red-600">{getFilteredProducts().length}</span> de <span className="font-medium">{products.length}</span> productos
                    {(productSearch || selectedCategory !== 'all' || productFilters.tags.length > 0) && (
                      <span className="text-red-600 ml-1">con filtros aplicados</span>
                    )}
                  </p>
                  {getFilteredProducts().length !== products.length && (
                    <button
                      onClick={() => {
                        setProductSearch('');
                        setSelectedCategory('all');
                        setProductFilters({
                          priceRange: { min: '', max: '' },
                          stockStatus: 'all',
                          status: 'all',
                          tags: []
                        });
                      }}
                      className="text-xs text-red-600 hover:text-secondary underline"
                    >
                      Ver todos los productos
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'user-management' && (
          <div className="space-y-6">
            <div className="bg-slate-800/70 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">👥 Gestión de Usuarios</h2>
                <button
                  onClick={loadUsers}
                  disabled={usersLoading}
                  className="bg-red-600 hover:bg-secondary text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  {usersLoading ? 'Cargando...' : '🔄 Recargar Usuarios'}
                </button>
              </div>

              {/* Buscador de usuarios */}
              <div className="mb-6 bg-red-600 hover:bg-secondary-50 to-yellow-50 rounded-lg p-6 border border-warning">
                <h3 className="text-lg font-semibold text-white mb-4">🔍 Buscar Usuario por Correo</h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="Ingresa el correo electrónico..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        searchUserByEmail(userSearchQuery);
                      }
                    }}
                    className="flex-1 px-4 py-2 border-2 border-amber-300 rounded-lg focus:border-red-600 focus:outline-none"
                  />
                  <button
                    onClick={() => searchUserByEmail(userSearchQuery)}
                    className="bg-secondary hover:bg-warning text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Buscar
                  </button>
                  {selectedUserDetails && (
                    <button
                      onClick={() => {
                        setUserSearchQuery('');
                        setSelectedUserDetails(null);
                        setSelectedUserOrders([]);
                      }}
                      className="bg-dark0 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Modal de detalles del usuario */}
              {selectedUserDetails && (
                <div
                  className="fixed inset-0 bg-slate-800/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  onClick={() => {
                    setSelectedUserDetails(null);
                    setSelectedUserOrders([]);
                  }}
                >
                  <div
                    className="bg-slate-800/70 rounded-xl border-2 border-amber-300 shadow-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-red-600 hover:bg-secondary-500 to-yellow-500 text-white p-4 flex justify-between items-center">
                      <h3 className="text-xl font-bold">📋 Información del Usuario</h3>
                      <button
                        onClick={() => {
                          setSelectedUserDetails(null);
                          setSelectedUserOrders([]);
                        }}
                        className="text-white hover:bg-slate-800/70/20 rounded-full p-2 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                  <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-sm font-semibold text-yellow-300">Nombre Completo</label>
                        <p className="text-lg font-medium text-white">
                          {selectedUserDetails.firstName} {selectedUserDetails.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-yellow-300">Correo Electrónico</label>
                        <p className="text-lg font-medium text-white">{selectedUserDetails.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-yellow-300">Teléfono</label>
                        <p className="text-lg font-medium text-white">{selectedUserDetails.phone || 'No registrado'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-yellow-300">Rol</label>
                        <p>
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getRoleColor(selectedUserDetails.role || 'cliente')}`}>
                            {selectedUserDetails.role || 'cliente'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-yellow-300">Estado</label>
                        <p>
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${
                            selectedUserDetails.blocked
                              ? 'bg-slate-800 text-pink border-slate-200'
                              : 'bg-success/20 text-success border-success'
                          }`}>
                            {selectedUserDetails.blocked ? '🚫 Bloqueado' : '✅ Activo'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-yellow-300">Fecha de Registro</label>
                        <p className="text-lg font-medium text-white">
                          {selectedUserDetails.createdAt ? new Date(selectedUserDetails.createdAt.toDate()).toLocaleDateString('es-CL') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Historial de compras */}
                    <div className="border-t pt-6">
                      <h4 className="text-lg font-bold text-white mb-4">
                        🛒 Historial de Compras ({selectedUserOrders.length})
                      </h4>

                      {selectedUserOrders.length === 0 ? (
                        <div className="text-center py-8 bg-slate-900 rounded-lg">
                          <p className="text-yellow-300">Este usuario no ha realizado ninguna compra</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedUserOrders.map((order) => (
                            <div key={order.id} className="border rounded-lg p-4 hover:bg-slate-900 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-bold text-yellow-300">
                                      Pedido #{order.id.slice(-8).toUpperCase()}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      order.status === 'delivered' || order.status === 'completed'
                                        ? 'bg-success/20 text-success'
                                        : order.status === 'cancelled'
                                        ? 'bg-slate-800 text-pink'
                                        : 'bg-warning/20 text-yellow-800'
                                    }`}>
                                      {order.status === 'pending' && '⏳ Pendiente'}
                                      {order.status === 'confirmed' && '✅ Confirmado'}
                                      {order.status === 'preparing' && '📦 Preparando'}
                                      {order.status === 'shipped' && '🚚 Enviado'}
                                      {(order.status === 'delivered' || order.status === 'completed') && '✔️ Entregado'}
                                      {order.status === 'cancelled' && '❌ Cancelado'}
                                    </span>
                                  </div>

                                  <div className="text-sm text-yellow-300">
                                    <p>Fecha: {new Date(order.createdAt).toLocaleDateString('es-CL')} - {new Date(order.createdAt).toLocaleTimeString('es-CL')}</p>
                                    <p>Total: <span className="font-bold text-white">{formatPrice(order.total)}</span></p>
                                    <p>Productos: {order.items?.length || 0} artículo(s)</p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => window.open(`/admin/pedido/${order.id}`, '_blank')}
                                  className="bg-red-600 hover:bg-secondary text-white px-3 py-1 rounded-md text-xs transition-colors"
                                >
                                  Ver Detalles
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Resumen estadístico */}
                      {selectedUserOrders.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-yellow-50 rounded-lg p-4 border border-warning">
                            <p className="text-sm font-semibold text-secondary">Total Gastado</p>
                            <p className="text-2xl font-bold text-secondary">
                              {formatPrice(selectedUserOrders.reduce((sum, order) => sum + order.total, 0))}
                            </p>
                          </div>
                          <div className="bg-success/10 rounded-lg p-4 border border-success">
                            <p className="text-sm font-semibold text-success">Pedidos Completados</p>
                            <p className="text-2xl font-bold text-success">
                              {selectedUserOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length}
                            </p>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-4 border border-yellow-300-200">
                            <p className="text-sm font-semibold text-secondary">Promedio por Pedido</p>
                            <p className="text-2xl font-bold text-secondary">
                              {formatPrice(selectedUserOrders.reduce((sum, order) => sum + order.total, 0) / selectedUserOrders.length)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              )}

              {usersLoading ? (
                <div className="text-center py-8">
                  <div className="text-xl">Cargando usuarios...</div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-yellow-300 text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-white mb-2">No hay usuarios encontrados</h3>
                  <p className="text-yellow-300 mb-4">
                    Puede que no haya usuarios registrados o que haya un problema de conexión con Firebase.
                  </p>
                  <button
                    onClick={loadUsers}
                    className="bg-red-600 hover:bg-secondary text-white px-4 py-2 rounded-md"
                  >
                    🔄 Intentar de nuevo
                  </button>
                </div>
              ) : (
                <>
                  {/* Admins y Vendedores - Siempre visibles */}
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-800 rounded-lg p-4 mb-3">
                      <h3 className="text-lg font-semibold text-white">
                        👑 Administradores y Vendedores ({users.filter(u => u.role === 'admin' || u.role === 'vendedor').length})
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left">
                              <div className="text-xs font-semibold tracking-widest uppercase">Usuario</div>
                            </th>
                            <th className="px-6 py-3 text-left">
                              <div className="text-xs font-semibold tracking-widest uppercase">Rol</div>
                            </th>
                            <th className="px-6 py-3 text-left">
                              <div className="text-xs font-semibold tracking-widest uppercase">Estado</div>
                            </th>
                            <th className="px-6 py-3 text-left">
                              <div className="text-xs font-semibold tracking-widest uppercase">Fecha Registro</div>
                            </th>
                            <th className="px-6 py-3 text-left">
                              <div className="text-xs font-semibold tracking-widest uppercase">Acciones</div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {users
                            .filter(user => user.role === 'admin' || user.role === 'vendedor')
                            .map((user) => (
                            <tr
                              key={user.uid}
                              className="hover:bg-yellow-50 cursor-pointer transition-colors"
                              onClick={() => loadUserDetails(user)}
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-sm text-yellow-300">{user.email}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {editingUser === user.uid ? (
                                  <select
                                    defaultValue={user.role}
                                    onClick={(event) => event.stopPropagation()}
                                    onChange={(e) => updateUserRole(user.uid, e.target.value as any)}
                                    className="text-sm border border-yellow-300/40 rounded px-2 py-1"
                                  >
                                    <option value="cliente">Cliente</option>
                                    <option value="vendedor">Vendedor</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                ) : (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.role || 'cliente')}`}>
                                    {user.role || 'cliente'}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                                  user.blocked
                                    ? 'bg-slate-800 text-pink border-slate-200'
                                    : 'bg-success/20 text-success border-success'
                                }`}>
                                  {user.blocked ? '🚫 Bloqueado' : '✅ Activo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-yellow-300">
                                {user.createdAt ? new Date(user.createdAt.toString()).toLocaleDateString('es-CL') : 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                {editingUser === user.uid ? (
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() => setEditingUser(null)}
                                      type="button"
                                      className="inline-flex items-center gap-1 rounded-full border border-yellow-300/30 px-3 py-1 text-xs font-semibold text-yellow-300 transition-all duration-200 transform hover:bg-yellow-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-200 hover:scale-105 active:scale-95"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-3">
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setEditingUser(user.uid);
                                      }}
                                      type="button"
                                      className="inline-flex items-center gap-1 rounded-full border border-yellow-300/30 px-3 py-1 text-xs font-semibold text-slate-600 transition-all duration-200 transform hover:bg-yellow-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-200 hover:scale-105 active:scale-95"
                                    >
                                      Editar Rol
                                    </button>
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        deleteUser(user.uid);
                                      }}
                                      type="button"
                                      className="inline-flex items-center gap-1 rounded-full border border-pink/40 px-3 py-1 text-xs font-semibold text-pink transition-all duration-200 transform hover:bg-pink hover:text-white focus:outline-none focus:ring-2 focus:ring-pink/50 hover:scale-105 active:scale-95"
                                    >
                                      Eliminar
                                    </button>
                                    {user.blocked ? (
                                      <button
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          unblockUser(user.uid);
                                        }}
                                        type="button"
                                        className="inline-flex items-center gap-1 rounded-full border border-green-400/60 px-3 py-1 text-xs font-semibold text-success transition-all duration-200 transform hover:bg-success hover:text-white focus:outline-none focus:ring-2 focus:ring-green-200 hover:scale-105 active:scale-95"
                                      >
                                        ✅ Desbloquear
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          blockUser(user.uid);
                                        }}
                                        type="button"
                                        className="inline-flex items-center gap-1 rounded-full border border-yellow-300/40 px-3 py-1 text-xs font-semibold text-yellow-300 transition-all duration-200 transform hover:bg-yellow-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-200 hover:scale-105 active:scale-95"
                                      >
                                        🚫 Bloquear
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Clientes - Colapsable */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowClientes(!showClientes)}
                      className="w-full bg-red-600 hover:bg-secondary-50 to-yellow-50 rounded-lg p-4 mb-3 hover:from-yellow-100 hover:to-yellow-100 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">
                          👤 Clientes ({users.filter(u => !u.role || u.role === 'cliente').length})
                        </h3>
                        <span className="text-2xl">
                          {showClientes ? '▼' : '▶'}
                        </span>
                      </div>
                    </button>

                    {showClientes && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Usuario
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Rol
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Estado
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Fecha Registro
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {users
                              .filter(user => !user.role || user.role === 'cliente')
                              .map((user) => (
                              <tr
                                key={user.uid}
                                className="hover:bg-yellow-50 cursor-pointer transition-colors"
                                onClick={() => loadUserDetails(user)}
                              >
                                <td className="px-6 py-4">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">
                                      {user.firstName} {user.lastName}
                                    </div>
                                    <div className="text-sm text-yellow-300">{user.email}</div>
                                  </div>
                                </td>
                              <td className="px-6 py-4">
                                {editingUser === user.uid ? (
                                  <select
                                    defaultValue={user.role}
                                    onClick={(event) => event.stopPropagation()}
                                    onChange={(e) => updateUserRole(user.uid, e.target.value as any)}
                                      className="text-sm border border-yellow-300/40 rounded px-2 py-1"
                                    >
                                      <option value="cliente">Cliente</option>
                                      <option value="vendedor">Vendedor</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  ) : (
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.role || 'cliente')}`}>
                                      {user.role || 'cliente'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                                    user.blocked
                                      ? 'bg-slate-800 text-pink border-slate-200'
                                      : 'bg-success/20 text-success border-success'
                                  }`}>
                                    {user.blocked ? '🚫 Bloqueado' : '✅ Activo'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-300">
                                  {user.createdAt ? new Date(user.createdAt.toString()).toLocaleDateString('es-CL') : 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                  {editingUser === user.uid ? (
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        onClick={() => setEditingUser(null)}
                                        type="button"
                                        className="inline-flex items-center gap-1 rounded-full border border-yellow-300/30 px-3 py-1 text-xs font-semibold text-yellow-300 transition-all duration-200 transform hover:bg-yellow-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-200 hover:scale-105 active:scale-95"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap gap-3">
                                      <button
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setEditingUser(user.uid);
                                        }}
                                        type="button"
                                        className="inline-flex items-center gap-1 rounded-full border border-yellow-300/30 px-3 py-1 text-xs font-semibold text-slate-600 transition-all duration-200 transform hover:bg-yellow-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-200 hover:scale-105 active:scale-95"
                                      >
                                        Editar Rol
                                      </button>
                                      <button
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          deleteUser(user.uid);
                                        }}
                                        type="button"
                                        className="inline-flex items-center gap-1 rounded-full border border-pink/40 px-3 py-1 text-xs font-semibold text-pink transition-all duration-200 transform hover:bg-pink hover:text-white focus:outline-none focus:ring-2 focus:ring-pink/50 hover:scale-105 active:scale-95"
                                      >
                                        Eliminar
                                      </button>
                                      {user.blocked ? (
                                        <button
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            unblockUser(user.uid);
                                          }}
                                          type="button"
                                          className="inline-flex items-center gap-1 rounded-full border border-green-400/60 px-3 py-1 text-xs font-semibold text-success transition-all duración-200 transform hover:bg-success hover:text-white focus:outline-none focus:ring-2 focus:ring-green-200 hover:scale-105 active:scale-95"
                                        >
                                          ✅ Desbloquear
                                        </button>
                                      ) : (
                                        <button
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            blockUser(user.uid);
                                          }}
                                          type="button"
                                          className="inline-flex items-center gap-1 rounded-full border border-yellow-300/40 px-3 py-1 text-xs font-semibold text-yellow-300 transition-all duración-200 transform hover:bg-yellow-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-200 hover:scale-105 active:scale-95"
                                        >
                                          🚫 Bloquear
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </>
              )}
            </div>
          </div>
        )}

        
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Modern Orders Header */}
            <div className="bg-white">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 bg-yellow-400">
                    <span className="text-white text-lg">🛒</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Gestión de Pedidos</h2>
                    <p className="text-yellow-300 text-sm">Administra todos los pedidos de clientes</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  {selectedOrders.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-xl border border-warning">
                      <span className="text-sm font-medium text-secondary">
                        {selectedOrders.length} seleccionado(s)
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleDeleteSelectedOrders}
                    disabled={deletingOrders || selectedOrders.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:transform-none"
                    style={{ backgroundColor: selectedOrders.length > 0 ? '#dc2626' : '#9ca3af' }}
                    onMouseEnter={(e) => selectedOrders.length > 0 && !deletingOrders && (e.currentTarget.style.backgroundColor = '#b91c1c')}
                    >
{deletingOrders ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <span>🗑️</span>
                        Eliminar Seleccionados
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sub-tabs para filtrar pedidos */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setOrdersFilter('active')}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md ${
                    ordersFilter === 'active'
                      ? 'bg-gradient-to-r from-primary to-pink text-white scale-105 shadow-lg shadow-red-600/20'
                      : 'bg-slate-800 text-yellow-300 hover:bg-slate-800 hover:scale-105'
                  }`}
                >
                  📋 Pedidos Activos
                </button>
                <button
                  onClick={() => setOrdersFilter('completed')}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md ${
                    ordersFilter === 'completed'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white scale-105 shadow-lg shadow-red-600/20'
                      : 'bg-slate-800 text-yellow-300 hover:bg-slate-800 hover:scale-105'
                  }`}
                >
                  ✅ Historial de Ventas
                </button>
              </div>
            </div>

            {/* Búsqueda y Filtros */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-xl shadow-red-600/30 border border-slate-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Búsqueda */}
                <div>
                  <label className="block text-sm font-semibold text-yellow-300 mb-2">
                    🔍 Buscar pedido
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email, teléfono o ID..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-yellow-300/40 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                {/* Filtro por Estado */}
                <div>
                  <label className="block text-sm font-semibold text-yellow-300 mb-2">
                    📊 Filtrar por estado
                  </label>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-yellow-300/40 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">⏳ Pendiente</option>
                    <option value="pending_verification">🔍 Pendiente Verificación</option>
                    <option value="pending_payment">💳 Pendiente de Pago</option>
                    <option value="confirmed">✅ Confirmado</option>
                    <option value="preparing">📦 Preparando</option>
                    <option value="processing">⚙️ Procesando</option>
                    <option value="shipped">🚚 Enviado</option>
                    <option value="delivered">✔️ Entregado</option>
                    <option value="completed">🎉 Completado</option>
                  </select>
                </div>
              </div>

              {/* Contador de resultados */}
              {(orderSearchQuery || orderStatusFilter !== 'all') && (
                <div className="mt-4 text-sm text-yellow-300">
                  {orders.filter(order => {
                    // Filtro base (activos/completados)
                    let passesMainFilter = false;
                    if (ordersFilter === 'active') {
                      passesMainFilter = ['pending', 'pending_verification', 'pending_payment', 'confirmed', 'preparing', 'processing', 'shipped'].includes(order.status);
                    } else {
                      passesMainFilter = ['delivered', 'completed'].includes(order.status);
                    }
                    if (!passesMainFilter) return false;

                    // Filtro por búsqueda
                    if (orderSearchQuery) {
                      const searchLower = orderSearchQuery.toLowerCase();
                      const matchesSearch =
                        order.customerName?.toLowerCase().includes(searchLower) ||
                        order.customerEmail?.toLowerCase().includes(searchLower) ||
                        order.customerPhone?.toLowerCase().includes(searchLower) ||
                        order.id?.toLowerCase().includes(searchLower);
                      if (!matchesSearch) return false;
                    }

                    // Filtro por estado
                    if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
                      return false;
                    }

                    return true;
                  }).length} pedidos encontrados
                </div>
              )}
            </div>

            {/* Modern Orders Table */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-xl shadow-red-600/30 border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-light">
                  <thead className="bg-gradient-to-r from-slate-800 to-slate-800">
                    <tr>
                      <th className="px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedOrders.length === orders.length && orders.length > 0}
                          onChange={toggleSelectAllOrders}
                          className="w-4 h-4 text-yellow-300 rounded focus:ring-primary"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        Estado & Progreso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {groupOrdersByUser(
                      orders.filter(order => {
                        // Filtro base (activos/completados)
                        let passesMainFilter = false;
                        if (ordersFilter === 'active') {
                          passesMainFilter = ['pending', 'pending_verification', 'pending_payment', 'confirmed', 'preparing', 'processing', 'shipped'].includes(order.status);
                        } else {
                          passesMainFilter = ['delivered', 'completed'].includes(order.status);
                        }
                        if (!passesMainFilter) return false;

                        // Filtro por búsqueda
                        if (orderSearchQuery) {
                          const searchLower = orderSearchQuery.toLowerCase();
                          const matchesSearch =
                            order.customerName?.toLowerCase().includes(searchLower) ||
                            order.customerEmail?.toLowerCase().includes(searchLower) ||
                            order.customerPhone?.toLowerCase().includes(searchLower) ||
                            order.id?.toLowerCase().includes(searchLower);
                          if (!matchesSearch) return false;
                        }

                        // Filtro por estado
                        if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
                          return false;
                        }

                        return true;
                      })
                    ).map((userOrders, groupIndex) => {
                      const mainOrder = userOrders[0]; // Usar el pedido más reciente como principal
                      const totalUserOrders = userOrders.length;
                      const totalAmount = userOrders.reduce((sum, order) => sum + order.total, 0);
                      
                      return (
                        <React.Fragment key={`group-${groupIndex}`}>
                          <tr key={mainOrder.id} className={totalUserOrders > 1 ? 'bg-yellow-50' : ''}>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(mainOrder.id)}
                            onChange={() => toggleOrderSelection(mainOrder.id)}
                            className="w-4 h-4 text-yellow-300 rounded focus:ring-primary"
                          />
                        </td>
                                <td className="px-6 py-4">
                          <div className="flex items-center">
                            {totalUserOrders > 1 && (
                              <button
                                onClick={() => toggleGroupExpansion(groupIndex)}
                                className="mr-2 p-1 rounded hover:bg-amber-200 transition-colors"
                              >
                                {expandedGroups.has(groupIndex) ? '▼' : '▶'}
                              </button>
                            )}
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {mainOrder.customerName}
                                {totalUserOrders > 1 && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-secondary">
                                    {totalUserOrders} pedidos
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-yellow-300">
                                {mainOrder.customerEmail}
                              </div>
                              <div className="text-sm text-yellow-300">
                                {mainOrder.customerPhone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {totalUserOrders > 1 ? (
                            <div>
                              <div className="font-medium">{formatPrice(totalAmount)}</div>
                              <div className="text-xs text-yellow-300">Total {totalUserOrders} pedidos</div>
                            </div>
                          ) : (
                            formatPrice(mainOrder.total)
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {totalUserOrders > 1 ? (
                            <div className="text-xs text-yellow-300">
                              <div className="font-medium">Estados múltiples</div>
                              <div className="text-xs text-yellow-300">Ver detalles individuales</div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Selector de estado */}
                              <div>
                                <select
                                  value={mainOrder.status}
                                  onChange={(e) => updateOrderStatus(mainOrder.id, e.target.value)}
                                  className="w-full text-xs border-2 border-yellow-300-200 rounded-lg px-3 py-2 focus:border-yellow-300 focus:outline-none font-medium"
                                >
                                  <option value="pending">⏳ Pendiente</option>
                                  <option value="confirmed">✅ Confirmado</option>
                                  <option value="preparing">📦 Preparando</option>
                                  <option value="shipped">🚚 Enviado</option>
                                  <option value="delivered">✔️ Entregado</option>
                                  <option value="cancelled">❌ Cancelado</option>
                                </select>
                              </div>

                              {/* Timeline compacto horizontal */}
                              <div className="flex items-center justify-start">
                                {getOrderTimeline(mainOrder).map((step, index) => {
                                  const IconComponent = step.icon;
                                  return (
                                    <React.Fragment key={step.status}>
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                                          step.completed
                                            ? 'bg-success/100 text-white border-green-500 shadow-md'
                                            : 'bg-slate-800 text-yellow-300 border-yellow-300/40'
                                        }`}
                                        title={step.title}
                                      >
                                        <IconComponent className="h-3 w-3" />
                                      </div>
                                      {index < getOrderTimeline(mainOrder).length - 1 && (
                                        <div className={`h-0.5 w-4 ${
                                          step.completed ? 'bg-success/100' : 'bg-gray-300'
                                        }`}></div>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {new Date(mainOrder.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(`/admin/pedido/${mainOrder.id}`, '_blank')}
                              className="relative bg-red-600 hover:bg-secondary text-white px-3 py-1 rounded-md text-xs transition-colors"
                            >
                              📋 Ver Detalles
                              {getOrderMessageCount(mainOrder.id) > 0 && (
                                <span className="absolute -top-2 -right-2 bg-pink text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                  {getOrderMessageCount(mainOrder.id) > 9 ? '9+' : getOrderMessageCount(mainOrder.id)}
                                </span>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Show individual orders when expanded */}
                      {totalUserOrders > 1 && expandedGroups.has(groupIndex) && userOrders.slice(1).map((order, orderIndex) => (
                        <tr key={`${groupIndex}-${orderIndex + 1}`} className="bg-yellow-50 border-l-4 border-amber-300">
                          <td className="px-3 py-3 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="w-4 h-4 text-yellow-300 rounded focus:ring-primary"
                            />
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap pl-12">
                            <div className="text-sm text-yellow-300">
                              <div className="font-medium">Pedido #{order.id.slice(-8).toUpperCase()}</div>
                              <div className="text-xs text-yellow-300">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-white">
                            {formatPrice(order.total)}
                          </td>
                          <td className="px-6 py-3">
                            <div className="space-y-3">
                              {/* Selector de estado */}
                              <div>
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  className="w-full text-xs border-2 border-yellow-300-200 rounded-lg px-3 py-2 focus:border-yellow-300 focus:outline-none font-medium"
                                >
                                  <option value="pending">⏳ Pendiente</option>
                                  <option value="confirmed">✅ Confirmado</option>
                                  <option value="preparing">📦 Preparando</option>
                                  <option value="shipped">🚚 Enviado</option>
                                  <option value="delivered">✔️ Entregado</option>
                                  <option value="cancelled">❌ Cancelado</option>
                                </select>
                              </div>

                              {/* Timeline compacto horizontal */}
                              <div className="flex items-center justify-start">
                                {getOrderTimeline(order).map((step, index) => {
                                  const IconComponent = step.icon;
                                  return (
                                    <React.Fragment key={step.status}>
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                                          step.completed
                                            ? 'bg-success/100 text-white border-green-500 shadow-md'
                                            : 'bg-slate-800 text-yellow-300 border-yellow-300/40'
                                        }`}
                                        title={step.title}
                                      >
                                        <IconComponent className="h-3 w-3" />
                                      </div>
                                      {index < getOrderTimeline(order).length - 1 && (
                                        <div className={`h-0.5 w-4 ${
                                          step.completed ? 'bg-success/100' : 'bg-gray-300'
                                        }`}></div>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-white">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => window.open(`/admin/pedido/${order.id}`, '_blank')}
                                className="relative bg-red-600 hover:bg-secondary text-white px-2 py-1 rounded-md text-xs transition-colors"
                              >
                                📋 Ver Detalles
                                {getOrderMessageCount(order.id) > 0 && (
                                  <span className="absolute -top-2 -right-2 bg-pink text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                    {getOrderMessageCount(order.id) > 9 ? '9+' : getOrderMessageCount(order.id)}
                                  </span>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'b2b' && (
          <div className="space-y-6">
            <div className="bg-slate-800/70 rounded-xl shadow p-6 border border-yellow-300/30">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    🏢 Gestión B2B
                  </h2>
                  <p className="text-sm text-yellow-300">
                    Administra clientes corporativos, cotizaciones y órdenes de compra.
                  </p>
                </div>
              </div>
              <B2BOrderManagement />
            </div>
          </div>
        )}


        {activeTab === 'banner' && (
          <AdminBannerSection />
        )}

        
        {activeTab === 'popup' && (
          <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-50 to-yellow-50 p-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-orange-700 rounded-xl shadow-xl shadow-red-600/30 p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-slate-800/70/20 backdrop-blur-sm rounded-lg p-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">🎯 Gestión de Popup</h1>
                  <p className="text-amber-100">Configura las ventanas emergentes promocionales</p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Configuration Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Configuration */}
                <div className="bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-lg shadow-red-600/20 border border-white/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-red-600 hover:bg-secondary-500 to-amber-600 rounded-lg p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">📝 Configuración Básica</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-yellow-300 mb-2">
                        🏷️ Título del Popup
                      </label>
                      <input
                        type="text"
                        value={popupForm.title}
                        onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })}
                        placeholder="¡Oferta Especial!"
                        className="w-full px-4 py-3 border-2 border-yellow-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-slate-800/70/70"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-yellow-300 mb-2">
                        🎨 Tipo de Popup
                      </label>
                      <select
                        value={popupForm.popupType}
                        onChange={(e) => setPopupForm({ ...popupForm, popupType: e.target.value as 'category' | 'information' })}
                        className="w-full px-4 py-3 border-2 border-yellow-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-slate-800/70/70"
                      >
                        <option value="category">🏷️ Categoría/Promocional</option>
                        <option value="information">ℹ️ Información</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-yellow-300 mb-2">
                        📄 Descripción
                      </label>
                      <textarea
                        value={popupForm.description}
                        onChange={(e) => setPopupForm({ ...popupForm, description: e.target.value })}
                        placeholder="Descripción detallada de la oferta..."
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-yellow-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-slate-800/70/70 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-yellow-300 mb-2">
                        🔗 Texto del Botón
                      </label>
                      <input
                        type="text"
                        value={popupForm.buttonText}
                        onChange={(e) => setPopupForm({ ...popupForm, buttonText: e.target.value })}
                        placeholder="Ver Ofertas"
                        className="w-full px-4 py-3 border-2 border-yellow-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-slate-800/70/70"
                      />
                    </div>
                  </div>
                </div>

                {/* Layout Configuration */}
                <div className="bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-lg shadow-red-600/20 border border-white/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-red-600 hover:bg-secondary-500 to-pink-600 rounded-lg p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">🎯 Configuración de Layout</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-yellow-300 mb-2">
                        📏 Tamaño del Popup
                      </label>
                      <select
                        value={popupForm.size}
                        onChange={(e) => setPopupForm({ ...popupForm, size: (isPopupSize(e.target.value) ? e.target.value : '2x2') })}
                        className="w-full px-4 py-3 border-2 border-yellow-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-slate-800/70/70"
                      >
                        {Object.entries(POPUP_SIZE_PRESETS).map(([value, config]) => (
                          <option key={value} value={value}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-yellow-300 mb-2">
                        📍 Posición en Pantalla
                      </label>
                      <select
                        value={popupForm.position}
                        onChange={(e) => setPopupForm({ ...popupForm, position: e.target.value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' })}
                        className="w-full px-4 py-3 border-2 border-yellow-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-slate-800/70/70"
                      >
                        <option value="bottom-right">🔽➡️ Esquina inferior derecha</option>
                        <option value="bottom-left">🔽⬅️ Esquina inferior izquierda</option>
                        <option value="top-right">🔼➡️ Esquina superior derecha</option>
                        <option value="top-left">🔼⬅️ Esquina superior izquierda</option>
                        <option value="center">🎯 Centro</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Media Configuration */}
                <div className="bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-lg shadow-red-600/20 border border-white/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">🎬 Contenido Multimedia</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-yellow-300 mb-3">
                        📸 Tipo de Contenido
                      </label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="mediaType"
                            checked={!popupForm.isVideo}
                            onChange={() => setPopupForm(prev => ({ ...prev, isVideo: false, mediaUrl: '' }))}
                            className="w-4 h-4 text-red-600 border-yellow-300/40 focus:ring-orange-500"
                          />
                          <span className="text-sm font-medium text-yellow-300">🖼️ Imagen</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="mediaType"
                            checked={popupForm.isVideo}
                            onChange={() => setPopupForm(prev => ({ ...prev, isVideo: true, mediaUrl: '' }))}
                            className="w-4 h-4 text-red-600 border-yellow-300/40 focus:ring-orange-500"
                          />
                          <span className="text-sm font-medium text-yellow-300">🎥 Video</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-yellow-300 mb-2">
                        📤 Subir Archivo
                      </label>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept={popupForm.isVideo ? "video/*" : "image/*"}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handlePopupImageUpload(file);
                            }
                          }}
                          className="w-full px-4 py-3 border-2 border-dashed border-yellow-300/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-slate-800/70/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-success/10 file:text-success hover:file:bg-success/20"
                        />
                        {popupImageUploading && (
                          <div className="flex items-center gap-2 text-success">
                            <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-sm font-medium">Subiendo {popupForm.isVideo ? 'video' : 'imagen'}...</span>
                          </div>
                        )}
                      </div>

                      {popupForm.mediaUrl && (
                        <div className="mt-4 p-4 bg-success/10 rounded-xl border-2 border-green-100">
                          <div className="flex items-center gap-4">
                            {popupForm.isVideo ? (
                              <video
                                src={popupForm.mediaUrl}
                                className="w-20 h-20 rounded-lg object-cover border-2 border-success shadow-sm"
                                muted
                              />
                            ) : (
                              <img
                                loading="lazy"
                                src={popupForm.mediaUrl}
                                alt="Popup"
                                className="w-20 h-20 rounded-lg object-cover border-2 border-success shadow-sm"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-success mb-1">
                                ✅ {popupForm.isVideo ? 'Video' : 'Imagen'} cargada correctamente
                              </p>
                              <button
                                type="button"
                                onClick={() => setPopupForm({ ...popupForm, mediaUrl: '' })}
                                className="text-xs text-pink hover:text-pink font-medium transition-colors"
                              >
                                🗑️ Eliminar {popupForm.isVideo ? 'video' : 'imagen'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activation & Actions */}
                <div className="bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-lg shadow-red-600/20 border border-white/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-pink to-primary rounded-lg p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">⚡ Control y Acciones</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl">
                      <input
                        type="checkbox"
                        id="popup-active"
                        checked={popupForm.active}
                        onChange={(e) => setPopupForm({ ...popupForm, active: e.target.checked })}
                        className="w-5 h-5 text-red-600 border-yellow-300/40 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="popup-active" className="text-sm font-semibold text-white">
                        🎯 Popup Activo (visible en el sitio web)
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setUpdatingPopup(true);

                            await setDoc(doc(db, 'config', 'offer-popup'), {
                              title: popupForm.title,
                              description: popupForm.description,
                              buttonText: popupForm.buttonText,
                              buttonLink: '/popup-ofertas',
                              active: popupForm.active,
                              size: popupForm.size,
                              position: popupForm.position,
                              mediaUrl: popupForm.mediaUrl,
                              isVideo: popupForm.isVideo,
                              popupType: popupForm.popupType,
                              updatedAt: new Date().toISOString()
                            });

                            alert('✅ Popup actualizado exitosamente');
                          } catch (error: unknown) {
                            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                            alert(`❌ Error al actualizar popup: ${errorMessage}`);
                          } finally {
                            setUpdatingPopup(false);
                          }
                        }}
                        disabled={updatingPopup}
                        className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:from-red-700 hover:to-red-700 hover:scale-105 shadow-lg shadow-red-600/20 hover:shadow-xl shadow-red-600/30 transform disabled:opacity-50 disabled:transform-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      >
                        {updatingPopup ? '⏳ Actualizando...' : '💾 Guardar Configuración'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sessionStorage.removeItem('offer-popup-seen');
                          sessionStorage.removeItem('offer-popup-last-shown');
                          window.open('/', '_blank');
                        }}
                        className="flex-1 sm:flex-initial bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:from-green-700 hover:to-teal-700 hover:scale-105 shadow-lg shadow-red-600/20 hover:shadow-xl shadow-red-600/30 transform focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        🧪 Probar Popup
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="lg:col-span-1">
                <div className="bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-lg shadow-red-600/20 border border-white/50 p-6 sticky top-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-red-600 hover:bg-secondary-500 to-orange-600 rounded-lg p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">👁️ Vista Previa</h3>
                  </div>

                  <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl border-2 border-slate-300 p-6 min-h-[400px] shadow-inner">
                    <div
                      className={`absolute ${POPUP_PREVIEW_POSITION_CLASSES[popupForm.position] ?? POPUP_PREVIEW_POSITION_CLASSES['bottom-right']}`}
                      style={popupPreviewStyle}
                    >
                      <div className="relative w-full" style={{ paddingBottom: `${(popupRatio * 100).toFixed(2)}%` }}>
                        <div className="absolute inset-0 rounded-xl shadow-lg overflow-hidden bg-gradient-to-br from-primary to-pink">
                          <button
                            type="button"
                            className="absolute top-2 right-2 z-20 p-1 rounded-full bg-slate-800/80 hover:bg-slate-800/70 transition-all cursor-default shadow-lg shadow-red-600/20"
                            aria-label="Cerrar"
                          >
                            <XMarkIcon className="h-4 w-4 text-yellow-300" />
                          </button>

                          {popupForm.mediaUrl && !popupForm.isVideo && (
                            <>
                              <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${popupForm.mediaUrl})` }}
                              />
                              <div className="absolute inset-0 bg-black/30" />
                            </>
                          )}

                          {popupForm.mediaUrl && popupForm.isVideo && (
                            <>
                              <video
                                autoPlay
                                muted
                                loop
                                className="absolute inset-0 w-full h-full object-cover"
                              >
                                <source src={popupForm.mediaUrl} type="video/mp4" />
                              </video>
                              <div className="absolute inset-0 bg-black/20" />
                            </>
                          )}

                          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center text-white">
                            <div className="text-2xl mb-2">
                              {popupForm.popupType === 'category' ? '🛍️' : '📢'}
                            </div>

                            <h4 className="text-sm font-bold mb-2 leading-tight">
                              {popupForm.title || '¡Oferta Especial!'}
                            </h4>

                            <p className="text-xs mb-3 opacity-90 leading-tight">
                              {popupForm.description || 'Descuentos increíbles por tiempo limitado'}
                            </p>

                            <button
                              type="button"
                              className="bg-slate-800/70 text-yellow-300 font-bold py-1.5 px-3 rounded-md text-xs hover:shadow-lg shadow-red-600/20 transition-all"
                            >
                              {popupForm.buttonText || 'Ver Ofertas'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-red-600 hover:bg-secondary-50 to-yellow-50 rounded-xl border border-warning">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-600 text-sm">📍</span>
                        <span className="text-sm font-semibold text-secondary">Posición actual:</span>
                      </div>
                      <p className="text-xs text-secondary ml-6">
                        {
                          {
                            'top-left': '🔝⬅️ Esquina superior izquierda',
                            'top-right': '🔝➡️ Esquina superior derecha',
                            'bottom-left': '🔽⬅️ Esquina inferior izquierda',
                            'bottom-right': '🔽➡️ Esquina inferior derecha',
                            center: '🎯 Centro de la pantalla'
                          }[popupForm.position]
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'product-layout' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🔲 Configuración del Layout de Productos</h2>
            
            <div className="bg-yellow-50 border border-warning rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-secondary text-xl">ℹ️</div>
                <div className="space-y-2">
                  <h3 className="text-secondary font-semibold">¿Cómo funciona el layout?</h3>
                  <p className="text-sm text-secondary">
                    El layout de productos utiliza una cuadrícula tipo masonry. Puedes activar bloques especiales (hero, horizontales, verticales) y definir cada cuántos productos deben aparecer.
                  </p>
                  <ul className="text-sm text-secondary space-y-1">
                    <li>• <strong>Activo:</strong> habilita o deshabilita el patrón.</li>
                    <li>• <strong>Intervalo:</strong> cada cuántos productos se aplica el diseño.</li>
                    <li>• <strong>Diseño:</strong> tamaño/forma del bloque dentro de la cuadrícula.</li>
                  </ul>
                  {layoutPatternsError && (
                    <div className="mt-2 bg-slate-800/70 border border-warning rounded-md px-3 py-2 text-sm text-secondary">
                      {layoutPatternsError}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/70 rounded-lg shadow-md p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Configurador de Patrones de Layout</h3>
                      <p className="text-sm text-yellow-300">
                        Ajusta el ritmo visual de la grilla principal. Los cambios se reflejan en la home una vez guardados.
                      </p>
                      {layoutPatternsFetched.updatedAt && (
                        <p className="text-xs text-yellow-300 mt-1">
                          Última actualización: {new Date(layoutPatternsFetched.updatedAt).toLocaleString('es-CL')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleResetLayoutPatterns}
                        className="px-4 py-2 text-sm font-medium rounded-md border border-yellow-300/40 text-yellow-300 hover:text-white hover:border-gray-400 transition-colors"
                        disabled={savingLayoutPatterns || layoutPatternsLoading}
                      >
                        Restablecer valores
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveLayoutPatterns}
                        className="text-white font-semibold text-base py-3 px-6 rounded-md transition-colors text-base disabled:opacity-60 bg-yellow-400" onMouseEnter={(e) => {
                          if (!e.currentTarget.hasAttribute('disabled')) {
                            e.currentTarget.style.backgroundColor = '#D13C1A';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--primary)';
                        }}
                        disabled={savingLayoutPatterns || layoutPatternsLoading}
                      >
                        {savingLayoutPatterns ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {orderedLayoutRules.map((rule) => {
                      const meta = LAYOUT_VARIANT_META[rule.variant];
                      return (
                        <div key={rule.variant} className="border border-yellow-300/30 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-2xl">{meta.icon}</div>
                              <h4 className="font-medium text-white">{meta.title}</h4>
                              <p className="text-sm text-yellow-300">{meta.description}</p>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-yellow-300">
                              <span>Activo</span>
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-yellow-300 rounded"
                                checked={rule.enabled}
                                onChange={(e) => updateLayoutRule(rule.variant, (prevRule) => ({
                                  ...prevRule,
                                  enabled: e.target.checked,
                                }))}
                                disabled={savingLayoutPatterns || layoutPatternsLoading}
                              />
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="block text-xs font-semibold text-yellow-300 mb-1">
                                Intervalo (cada cuántos productos)
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={rule.interval}
                                onChange={(e) => {
                                  const value = Math.max(1, Math.min(50, Number(e.target.value) || 1));
                                  updateLayoutRule(rule.variant, (prevRule) => ({
                                    ...prevRule,
                                    interval: value,
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-yellow-300/40 rounded text-sm focus:outline-none focus:ring-1"
                                style={{ '--tw-ring-color': 'var(--primary)' } as any}
                                disabled={savingLayoutPatterns || layoutPatternsLoading}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-yellow-300 mb-1">
                                Diseño del bloque
                              </label>
                              <select
                                value={rule.span}
                                onChange={(e) => {
                                  const value = e.target.value as LayoutPatternSpan;
                                  const allowedValues = meta.spanOptions.map((option) => option.value);
                                  if (!allowedValues.includes(value)) return;
                                  updateLayoutRule(rule.variant, (prevRule) => ({
                                    ...prevRule,
                                    span: value,
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-yellow-300/40 rounded text-sm focus:outline-none focus:ring-1"
                                style={{ '--tw-ring-color': 'var(--primary)' } as any}
                                disabled={savingLayoutPatterns || layoutPatternsLoading}
                              >
                                {meta.spanOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <p className="text-xs text-yellow-300 mt-3">
                            {rule.enabled
                              ? `Activo: se aplica a cada ${rule.interval} producto(s).`
                              : 'Este patrón está deshabilitado temporalmente.'}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

{activeTab === 'home-sections' && (
  <div className="space-y-6">
    {sectionsView === 'list' && (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_90px_-55px_rgba(15,23,42,0.3)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Vitrinas de la home</p>
            <h2 className="text-2xl font-bold text-slate-900">Secciones destacadas</h2>
            <p className="text-sm text-slate-500">Renombra cada bloque y decide qué productos muestra.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {productSectionsLoading && (
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sincronizando…</span>
            )}
            <button
              onClick={() => startSectionEditor()}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-400 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              <span className="text-lg">+</span> Nueva sección
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Cómo funciona:</p>
          <p className="mt-1">1) Cambia título y descripción para que sean claros, 2) selecciona el tipo de contenido y 3) usa el botón "Productos" para decidir qué se muestra.</p>
        </div>

        {productSectionsError && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">
            No pudimos cargar las secciones. {productSectionsError}
          </div>
        )}

        {productSectionsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((item) => (
              <div key={item} className="h-40 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse" />
            ))}
          </div>
        ) : productSections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            Aún no hay secciones configuradas. Crea la primera para controlar la home.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {productSections.map((section) => {
              const productCount = Array.isArray(section.selectedProducts) ? section.selectedProducts.length : 0;
              return (
                <div
                  key={section.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                        {SECTION_TYPE_LABELS[section.type] || '🎯 Personalizada'}
                      </p>
                      <h3 className="text-lg font-semibold text-slate-900">{section.name || 'Sección sin título'}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {section.description || 'Agrega una descripción breve para orientarte desde el admin.'}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={section.enabled !== false}
                        onChange={async (e) => {
                          const updated = productSections.map((item) =>
                            item.id === section.id ? { ...item, enabled: e.target.checked } : item
                          );
                          setProductSections(updated);
                          try {
                            await persistSections(updated);
                          } catch (error) {
                            console.error('Error al actualizar la sección', error);
                          }
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-red-500 focus:ring-red-500"
                      />
                      {section.enabled !== false ? 'Activa' : 'Pausada'}
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-slate-700">
                      📦 {productCount} {productCount === 1 ? 'producto' : 'productos'}
                    </span>
                    {section.type === 'category' && section.categoryId && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-600">
                        🏷️ {section.categoryId}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => startSectionEditor(section)}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                    >
                      ✏️ Editar texto
                    </button>
                    <button
                      onClick={() => {
                        setCurrentSectionId(section.id);
                        setSectionsView('products');
                        setProductSelectorFilters({ category: '', search: '', showOnlySelected: false });
                      }}
                      className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                    >
                      📦 Productos
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('¿Seguro que deseas eliminar esta sección?')) return;
                        const updated = productSections.filter((item) => item.id !== section.id);
                        setProductSections(updated);
                        if (sectionForm?.id === section.id) {
                          setSectionForm(null);
                        }
                        if (currentSectionId === section.id) {
                          setCurrentSectionId('');
                        }
                        try {
                          await persistSections(updated);
                        } catch (error) {
                          console.error('Error al eliminar la sección', error);
                        }
                      }}
                      className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

    {sectionsView === 'edit' && (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_90px_-55px_rgba(15,23,42,0.3)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Editor</p>
            <h2 className="text-2xl font-bold text-slate-900">
              {isEditingExistingSection ? 'Editar sección' : 'Nueva sección'}
            </h2>
            <p className="text-sm text-slate-500">Define el nombre público, describe la sección y, si aplica, escoge la categoría que alimentará el carrusel.</p>
          </div>
          <button
            onClick={() => {
              setSectionsView('list');
              setSectionForm(null);
              setSectionSaveStatus('idle');
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
          >
            ← Volver a la lista
          </button>
        </div>

        {!sectionForm ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            Selecciona una sección desde la lista para editarla.
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Nombre en la home</label>
                  <input
                    type="text"
                    value={sectionForm.name}
                    onChange={(e) => handleSectionFieldChange('name', e.target.value)}
                    placeholder="Ej: Productos destacados"
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Descripción corta</label>
                  <textarea
                    value={sectionForm.description}
                    onChange={(e) => handleSectionFieldChange('description', e.target.value)}
                    rows={3}
                    placeholder="Esto se muestra debajo del título en la home"
                    className="mt-1 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Tipo de contenido</label>
                    <select
                      value={sectionForm.type}
                      onChange={(e) => handleSectionFieldChange('type', e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-red-500 focus:ring-red-500"
                    >
                      <option value="custom">🎯 Selección manual</option>
                      <option value="featured">⭐ Productos destacados automáticos</option>
                      <option value="bestsellers">🔥 Más vendidos automáticos</option>
                      <option value="new">🆕 Últimas novedades</option>
                      <option value="category">🏷️ Mostrar una categoría</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Estado</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sectionForm.enabled}
                        onChange={(e) => handleSectionFieldChange('enabled', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-red-500 focus:ring-red-500"
                      />
                      <span className="text-sm text-slate-600">{sectionForm.enabled ? 'Visible en la home' : 'Oculta temporalmente'}</span>
                    </div>
                  </div>
                </div>
                {sectionForm.type === 'category' && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Categoría fuente</label>
                    <select
                      value={sectionForm.categoryId}
                      onChange={(e) => handleSectionFieldChange('categoryId', e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-red-500 focus:ring-red-500"
                    >
                      <option value="">Selecciona una categoría</option>
                      {availableCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Vista previa</p>
                  <h3 className="text-xl font-bold text-slate-900">{sectionForm.name || 'Nombre de sección'}</h3>
                  <p className="text-sm text-slate-500 mt-1">{sectionForm.description || 'Escribe una descripción para mostrarla en la home.'}</p>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                    <span>{previewSelectedProductIds.length} {previewSelectedProductIds.length === 1 ? 'producto' : 'productos'}</span>
                    <span>{SECTION_TYPE_LABELS[sectionForm.type] || '🎯 Personalizada'}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-700">Productos configurados</p>
                  {previewProducts.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">Aún no hay productos seleccionados. Usa el botón "Productos" en la lista para añadirlos.</p>
                  ) : (
                    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                      {previewProducts.slice(0, 4).map((product) => (
                        <div key={product.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                          {product.imagen && (
                            <img src={product.imagen} alt={product.nombre} className="h-12 w-12 rounded-lg object-cover" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{product.nombre}</p>
                            <p className="text-xs text-slate-500">${product.precio?.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      {previewProducts.length > 4 && (
                        <p className="text-center text-xs text-slate-500">+{previewProducts.length - 4} más</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {sectionSaveStatus !== 'idle' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-600">
                {sectionSaveStatus === 'saving' && 'Guardando cambios…'}
                {sectionSaveStatus === 'success' && 'Cambios guardados correctamente.'}
                {sectionSaveStatus === 'error' && 'No pudimos guardar los cambios. Inténtalo nuevamente.'}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setSectionsView('list');
                  setSectionForm(null);
                  setSectionSaveStatus('idle');
                }}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
                disabled={sectionSaveStatus === 'saving'}
              >
                Cancelar
              </button>
              <button
                onClick={handleSectionSave}
                disabled={sectionSaveStatus === 'saving'}
                className="rounded-2xl bg-gradient-to-r from-red-500 to-amber-400 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60"
              >
                {sectionSaveStatus === 'saving' ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </>
        )}
      </div>
    )}

    {sectionsView === 'products' && (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_90px_-55px_rgba(15,23,42,0.3)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => {
              setSectionsView('list');
              setProductSelectorFilters({ category: '', search: '', showOnlySelected: false });
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
          >
            ← Volver a la lista
          </button>
          <div className="text-sm text-slate-500">
            {currentSection ? `Configurando "${currentSection.name}"` : 'Selecciona una sección para continuar'}
          </div>
        </div>

        {!currentSection ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            Elige una sección desde la vista de lista para asignarle productos.
          </div>
        ) : (
          (() => {
            const filteredProducts = products.filter((product) => {
              const isSelected = currentSection.selectedProducts?.includes(product.id as never) || false;
              if (productSelectorFilters.search) {
                const term = productSelectorFilters.search.toLowerCase();
                const matches =
                  product.nombre.toLowerCase().includes(term) ||
                  product.descripcion?.toLowerCase().includes(term) ||
                  product.categoria?.toLowerCase().includes(term);
                if (!matches) return false;
              }
              if (productSelectorFilters.category) {
                if (!productHasCategory(product, productSelectorFilters.category)) return false;
              }
              if (productSelectorFilters.showOnlySelected && !isSelected) {
                return false;
              }
              return true;
            });
            return (
              <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-sm font-semibold text-slate-700">{currentSection.name}</p>
                    <p className="text-xs text-slate-500">{SECTION_TYPE_LABELS[currentSection.type] || '🎯 Personalizada'}</p>
                    <p className="mt-3 text-sm text-slate-600">
                      {currentSection.selectedProducts?.length || 0} {currentSection.selectedProducts?.length === 1 ? 'producto' : 'productos'} configurados.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Recomendación: mantén máximo 12 productos para que el carrusel sea ligero.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-700">Seleccionados</p>
                    {currentSection.selectedProducts && currentSection.selectedProducts.length > 0 ? (
                      <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                        {currentSection.selectedProducts.map((productId) => {
                          const product = products.find((item) => item.id === productId);
                          if (!product) return null;
                          return (
                            <div key={productId} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                              {product.imagen && (
                                <img src={product.imagen} alt={product.nombre} className="h-10 w-10 rounded-lg object-cover" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">{product.nombre}</p>
                                <p className="text-xs text-slate-500">${product.precio?.toLocaleString()}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">Aún no seleccionas productos para esta sección.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="md:col-span-1">
                        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Buscar</label>
                        <input
                          type="text"
                          value={productSelectorFilters.search}
                          onChange={(e) => setProductSelectorFilters((prev) => ({ ...prev, search: e.target.value }))}
                          placeholder="Ej: Nintendo Switch"
                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:ring-red-500"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Categoría</label>
                        <select
                          value={productSelectorFilters.category}
                          onChange={(e) => setProductSelectorFilters((prev) => ({ ...prev, category: e.target.value }))}
                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:ring-red-500"
                        >
                          <option value="">Todas</option>
                          {availableCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Filtros</label>
                        <label className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={productSelectorFilters.showOnlySelected}
                            onChange={(e) => setProductSelectorFilters((prev) => ({ ...prev, showOnlySelected: e.target.checked }))}
                            className="h-4 w-4 rounded border-slate-300 text-red-500 focus:ring-red-500"
                          />
                          Solo seleccionados
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    Mostrando {filteredProducts.length} de {products.length} productos
                    {productSelectorFilters.category && (
                      <> en “{categories.find((cat) => cat.id === productSelectorFilters.category)?.name || productSelectorFilters.category}”</>
                    )}
                    {productSelectorFilters.search && (
                      <> que coinciden con “{productSelectorFilters.search}”</>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product) => {
                      const isSelected = currentSection.selectedProducts?.includes(product.id as never) || false;
                      return (
                        <div key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={async (e) => {
                                if (e.target.checked && (currentSection.selectedProducts?.length || 0) >= 12) {
                                  alert('Limita la sección a 12 productos para mantenerla ligera.');
                                  return;
                                }
                                const updated = productSections.map((section) => {
                                  if (section.id === currentSection.id) {
                                    const unique = new Set(section.selectedProducts || []);
                                    if (e.target.checked) {
                                      unique.add(product.id);
                                    } else {
                                      unique.delete(product.id);
                                    }
                                    return { ...section, selectedProducts: Array.from(unique) };
                                  }
                                  return section;
                                });
                                setProductSections(updated);
                                try {
                                  await persistSections(updated);
                                } catch (error) {
                                  console.error('Error al actualizar los productos de la sección', error);
                                }
                              }}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-red-500 focus:ring-red-500"
                            />
                            <div className="flex-1">
                              {product.imagen && (
                                <img src={product.imagen} alt={product.nombre} className="mb-2 h-24 w-full rounded-xl object-cover" />
                              )}
                              <p className="text-sm font-semibold text-slate-900">{product.nombre}</p>
                              <p className="text-xs text-slate-500">${product.precio?.toLocaleString()}</p>
                              <p className="text-xs text-slate-400">{product.categoria}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    )}
  </div>
)}
        {activeTab === 'main-banner' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-white">Gestión de Banners (v2)</h2>
              <div className="flex items-center gap-3">
                {isAutoSavingBanner && (
                  <div className="flex items-center gap-2 text-sm text-yellow-300 bg-slate-800 px-3 py-1 rounded-full">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Guardando cambios...</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={saveMainBannerNow}
                  disabled={updatingMainBanner}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-white font-semibold hover:bg-yellow-300 transition disabled:opacity-60"
                >
                  {updatingMainBanner ? 'Sincronizando...' : 'Guardar manualmente'}
                </button>
              </div>
            </div>

            <div className="bg-slate-800/70 rounded-lg shadow-md p-6">
              <form className="space-y-6">
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="mainBannerActive"
                    checked={mainBannerForm.active}
                    onChange={(e) => setMainBannerForm({ ...mainBannerForm, active: e.target.checked })}
                    className="h-4 w-4 border-yellow-300/40 rounded" style={{ color: 'var(--primary)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                  />
                  <label htmlFor="mainBannerActive" className="ml-2 block text-sm font-medium text-yellow-300">
                    Banner Principal Activo
                  </label>
                </div>

                
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Banners del Carrusel</h3>
                  <p className="text-sm text-yellow-300">Selecciona los productos que aparecerán en el banner principal</p>
                  
                  {mainBannerForm.slides.map((slide, index) => (
                    <div key={index} className="border border-yellow-300/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-white">Banner {index + 1}</h4>
                        {mainBannerForm.slides.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newSlides = mainBannerForm.slides.filter((_, i) => i !== index);
                              setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                            }}
                            className="text-pink hover:text-pink text-sm"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-yellow-300 mb-2">
                            Imagen del Banner
                          </label>
                          <div className="mb-3 p-3 bg-yellow-50 border border-warning rounded-lg text-sm">
                            <p className="text-secondary font-medium flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                              Tamaño recomendado: 1920x640px (3:1) | Formato: JPG/PNG | Peso máx: 5MB
                            </p>
                          </div>
                          <input
                            type="file"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {                                  if (!user) {
                                    throw new Error('Usuario no autenticado');
                                  }

                                  const timestamp = Date.now();
                                  const optimizedMainBannerFile = await optimizeImageFile(file);
                                  const fileName = `main-banner/slide-${index}-${timestamp}-${optimizedMainBannerFile.name}`;                                  const storageRef = ref(storage, fileName);                                  const snapshot = await uploadBytes(storageRef, optimizedMainBannerFile);                                  const downloadURL = await getDownloadURL(snapshot.ref);                                  const newSlides = [...mainBannerForm.slides];
                                  newSlides[index] = { ...newSlides[index], imageUrl: downloadURL };
                                  setMainBannerForm({ ...mainBannerForm, slides: newSlides });                                } catch (error) {
                                  console.error('❌ Error uploading main banner image:', error);
                                  const message = error instanceof Error ? error.message : 'Error desconocido';
                                  alert(`❌ Error al subir la imagen: ${message}\nVerifica los permisos de Firebase Storage.`);
                                }
                              }
                            }}
                            className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary)' } as any}
                          />
                          <p className="text-xs text-yellow-300 mt-1">Formatos soportados: JPG, PNG, GIF</p>
                          
                          {slide.imageUrl && (
                            <div className="mt-2">
                              <img
                                loading="lazy"
                                src={slide.imageUrl}
                                alt={`Banner ${index + 1}`}
                                className="w-full h-32 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newSlides = [...mainBannerForm.slides];
                                  newSlides[index] = { ...newSlides[index], imageUrl: "" };
                                  setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                                }}
                                className="mt-2 text-pink hover:text-pink text-sm"
                              >
                                Eliminar imagen
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Título */}
                        <div className="bg-slate-800 p-3 rounded-lg border border-yellow-300-200">
                          <label className="block text-sm font-bold text-yellow-300-hover mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Título del Banner
                          </label>
                          <input
                            type="text"
                            value={slide.title || ''}
                            onChange={(e) => {
                              const newSlides = [...mainBannerForm.slides];
                              newSlides[index] = { ...newSlides[index], title: e.target.value };
                              setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                            }}
                            className="w-full text-sm border-2 border-yellow-300-300 rounded-lg px-3 py-2 focus:border-yellow-300 focus:ring-2 focus:ring-primary-200 focus:outline-none bg-slate-800/70 transition-all"
                            placeholder="Ej: ¡Ofertas Especiales! 🔥"
                          />
                          <p className="text-xs text-yellow-300 mt-1">Este texto aparece grande sobre el banner</p>
                        </div>

                        {/* Subtítulo */}
                        <div className="bg-yellow-50 p-3 rounded-lg border border-warning">
                          <label className="block text-sm font-bold text-secondary mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Subtítulo / Descripción
                          </label>
                          <input
                            type="text"
                            value={slide.subtitle || ''}
                            onChange={(e) => {
                              const newSlides = [...mainBannerForm.slides];
                              newSlides[index] = { ...newSlides[index], subtitle: e.target.value };
                              setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                            }}
                            className="w-full text-sm border-2 border-amber-300 rounded-lg px-3 py-2 focus:border-red-600 focus:ring-2 focus:ring-amber-200 focus:outline-none bg-slate-800/70 transition-all"
                            placeholder="Ej: Hasta 50% de descuento en productos seleccionados"
                          />
                          <p className="text-xs text-red-600 mt-1">Texto descriptivo que acompaña al título</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-yellow-300 mb-2">
                            Tipo de Enlace
                          </label>
                          <select
                            value={slide.linkType || "product"}
                            onChange={(e) => {
                              const newSlides = [...mainBannerForm.slides];
                              newSlides[index] = {
                                ...newSlides[index],
                                linkType: e.target.value as "product" | "category" | "url",
                                productId: e.target.value === "product" ? newSlides[index].productId : "",
                                categoryId: e.target.value === "category" ? newSlides[index].categoryId : "",
                                customUrl: e.target.value === "url" ? newSlides[index].customUrl : ""
                              };
                              setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                            }}
                            className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2 mb-4" style={{ '--tw-ring-color': 'var(--primary)' } as any}
                          >
                            <option value="product">Producto Específico</option>
                            <option value="category">Categoría (múltiples productos en promo)</option>
                            <option value="url">URL Personalizada</option>
                          </select>
                        </div>

                        {slide.linkType === "category" && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-yellow-300 mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                              Seleccionar Categoría o Subcategoría
                            </label>
                            <select
                              value={slide.categoryId || ""}
                              onChange={(e) => {
                                const newSlides = [...mainBannerForm.slides];
                                newSlides[index] = { ...newSlides[index], categoryId: e.target.value };
                                setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                              }}
                              className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary)' } as any}
                            >
                              <option value="">Selecciona una categoría</option>
                              {availableCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-yellow-300 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              El banner redirigirá a todos los productos de esta categoría. Las opciones con "&gt;" son subcategorías.
                            </p>
                          </div>
                        )}

                        {slide.linkType === "product" && (
                          <div>
                            <label className="block text-sm font-medium text-yellow-300 mb-2">
                              Buscar Producto para Redirección
                            </label>
                          <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={bannerSearchTerms[index] || ''}
                            onChange={(e) => {
                              setBannerSearchTerms({ ...bannerSearchTerms, [index]: e.target.value });
                            }}
                            className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2 focus:ring-primary mb-2" style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                          />
                          
                          <select
                            value={slide.productId}
                            onChange={(e) => {
                              const newProductId = e.target.value;                              const newSlides = mainBannerForm.slides.map((s, i) => {
                                if (i === index) {
                                  return { ...s, productId: newProductId };
                                }
                                return s;
                              });
                              setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                            }}
                            className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary)' } as any}
                          >
                            <option value="">Selecciona un producto</option>
                            {products
                              .filter(product => {
                                const searchTerm = bannerSearchTerms[index] || '';
                                if (!searchTerm) return true;
                                const productName = (product.nombre || '').toLowerCase();
                                return productName.includes(searchTerm.toLowerCase());
                              })
                              .map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.nombre} - ${(product.precio || 0).toLocaleString()}
                                </option>
                              ))}
                          </select>
                          
                          {(() => {
                            const selectedProduct = products.find(p => p.id === slide.productId);
                            return selectedProduct && (
                              <div className="mt-3 p-3 bg-slate-900 rounded-lg flex items-center space-x-3">
                                <img
                                  loading="lazy"
                                  src={selectedProduct.imagen || ''}
                                  alt={selectedProduct.nombre || 'Producto'}
                                  className="w-16 h-16 object-cover rounded"
                                />
                                <div>
                                  <h5 className="font-medium text-white">
                                    {selectedProduct.nombre}
                                  </h5>
                                  <p className="text-sm text-yellow-300">
                                    ${(selectedProduct.precio || 0).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        )}
                        
                        {slide.linkType === "category" && (() => {
                          const selectedCategory = categories.find(c => c.id === slide.categoryId);
                          const categoryProducts = products.filter(p => p.categoria === slide.categoryId);
                          return selectedCategory && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <h5 className="font-medium text-white">
                                  {selectedCategory.name}
                                </h5>
                              </div>
                              <p className="text-sm text-yellow-300">
                                {categoryProducts.length} productos en esta categoría
                              </p>
                            </div>
                          );
                        })()}

                        {slide.linkType === "url" && (
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-300">
                            <label className="block text-sm font-bold text-secondary mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              URL Personalizada
                            </label>
                            <input
                              type="text"
                              value={slide.customUrl || ''}
                              onChange={(e) => {
                                const newSlides = [...mainBannerForm.slides];
                                newSlides[index] = { ...newSlides[index], customUrl: e.target.value };
                                setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                              }}
                              className="w-full text-sm border-2 border-amber-300 rounded-lg px-3 py-2 focus:border-red-600 focus:ring-2 focus:ring-amber-200 focus:outline-none bg-slate-800/70 transition-all"
                              placeholder="Ej: https://ejemplo.com o /?category=tecnologia"
                            />
                            <p className="text-xs text-yellow-500 mt-1">URL completa o ruta relativa (/?filter=ofertas)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}


                  <button
                    type="button"
                    onClick={() => {
                      const newSlides = [...mainBannerForm.slides, {
                        linkType: "product" as "product" | "category" | "url",
                        productId: "",
                        categoryId: "",
                        customUrl: "",
                        title: "",
                        subtitle: "",
                        imageUrl: ""
                      }];
                      setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                    }}
                    className="w-full py-3 border-2 border-dashed border-yellow-300/40 rounded-lg text-yellow-300 hover:border-yellow-300 hover:text-yellow-300 transition-colors"
                  >
                    + Agregar Banner
                  </button>
                </div>

                <div className="bg-success/10 border border-success rounded-lg p-4 text-center">
                  <p className="text-success font-medium flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Los cambios se guardan automáticamente
                  </p>
                  <p className="text-success text-sm mt-1">
                    No necesitas hacer clic en ningún botón, todos los cambios se sincronizan con Firebase automáticamente.
                  </p>
                </div>
              </form>


            </div>
          </div>
        )}

        
        {activeTab === 'logo' && (
          <AdminLogoSection />
        )}

        
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Gestión de Categorías</h2>
              <button
                  onClick={() => {
                    setCategoryForm({ id: '', name: '', active: true, subcategorias: [] });
                    setShowCategoryModal(true);
                  }}
                  className="text-white px-4 py-2 rounded-md transition-colors bg-yellow-400"
                >
                  ➕ Agregar Categoría
                </button>
            </div>

            <div className="bg-slate-800/70 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Subcategorías
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {category.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          <div className="flex flex-wrap gap-1">
                            {(category as any).subcategorias && (category as any).subcategorias.length > 0 ? (
                              (category as any).subcategorias.map((sub: any, index: number) => (
                                <div
                                  key={index}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-warning/20 text-secondary group"
                                >
                                  <span>{sub.nombre}</span>
                                  <button
                                    onClick={() => {
                                      setSelectedCategoryForSub(category.id);
                                      setSubcategoryForm({ id: sub.id, nombre: sub.nombre, activa: sub.activa });
                                      setShowSubcategoryModal(true);
                                    }}
                                    className="ml-1 opacity-0 group-hover:opacity-100 hover:text-secondary transition-opacity"
                                    title="Editar subcategoría"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(`¿Eliminar subcategoría "${sub.nombre}"?`)) {
                                        try {
                                          const updatedSubcategorias = (category as any).subcategorias.filter((_: any, i: number) => i !== index);
                                          await updateDoc(doc(db, 'gamerhouse_categorias', category.id), {
                                            subcategorias: updatedSubcategorias
                                          });
                                          setCategories(categories.map(c =>
                                            c.id === category.id ? { ...c, subcategorias: updatedSubcategorias } as any : c
                                          ));
                                        } catch (error) {
                                          console.error('Error eliminando subcategoría:', error);
                                          alert('Error al eliminar subcategoría');
                                        }
                                      }
                                    }}
                                    className="ml-1 opacity-0 group-hover:opacity-100 hover:text-pink transition-opacity"
                                    title="Eliminar subcategoría"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              ))
                            ) : (
                              <span className="text-yellow-300 text-xs">Sin subcategorías</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCategoryForSub(category.id);
                              setSubcategoryForm({ id: '', nombre: '', activa: true });
                              setShowSubcategoryModal(true);
                            }}
                            className="text-xs mt-1 hover:opacity-80 transition-opacity"

                          >
                            + Agregar subcategoría
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            category.active ? 'bg-success/20 text-success' : 'bg-slate-800 text-pink'
                          }`}>
                            {category.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              setCategoryForm({ ...category, subcategorias: (category as any).subcategorias || [] });
                              setShowCategoryModal(true);
                            }}
                            className="hover:opacity-80 transition-opacity"
                          >
                            Editar
                          </button>
                          <button
                            onClick={async () => {
                              const confirmed = window.confirm(`¿Seguro que deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`);
                              if (!confirmed) return;
                              try {
                                await deleteDoc(doc(db, 'gamerhouse_categorias', category.id));
                                setCategories(categories.filter(c => c.id !== category.id));
                                addNotification({
                                  type: 'success',
                                  title: 'Categoría eliminada',
                                  message: `${category.name} se eliminó correctamente.`
                                });
                              } catch (error) {
                                console.error('Error al eliminar categoría', error);
                                addNotification({
                                  type: 'error',
                                  title: 'No se pudo eliminar',
                                  message: 'Inténtalo nuevamente en unos segundos.'
                                });
                              }
                            }}
                            className="hover:opacity-80 transition-opacity"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'discounts' && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_90px_-55px_rgba(15,23,42,0.3)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-50 text-xl">
                    🎫
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Cupones</p>
                    <h2 className="text-2xl font-bold text-slate-900">Gestión de descuentos</h2>
                    <p className="text-slate-500 text-sm">Crea, edita y controla la vigencia de códigos promocionales.</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenDiscountForm}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  + Nuevo cupón
                </button>
              </div>
            </div>

            {showDiscountForm && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_35px_90px_-55px_rgba(15,23,42,0.3)] p-6">
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {discountForm.id ? 'Editar cupón' : 'Nuevo cupón'}
                    </p>
                    <h3 className="text-xl font-bold text-slate-900">
                      {discountForm.id ? `Actualizar ${discountForm.codigo}` : 'Crear cupón'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseDiscountForm}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                  >
                    ← Volver a la lista
                  </button>
                </div>

                <form
                  className="py-6 space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveDiscount();
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Código del cupón
                      </label>
                      <input
                        type="text"
                        value={discountForm.codigo}
                        onChange={(e) => setDiscountForm(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                        placeholder="EJEMPLO20"
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Tipo de descuento
                      </label>
                      <select
                        value={discountForm.tipo}
                        onChange={(e) => setDiscountForm(prev => ({ ...prev, tipo: e.target.value as DiscountType }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      >
                        <option value="porcentaje">Porcentaje (%)</option>
                        <option value="fijo">Monto fijo (CLP)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Valor
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountForm.descuento}
                        onChange={(e) => setDiscountForm(prev => ({ ...prev, descuento: e.target.value }))}
                        placeholder={discountForm.tipo === 'porcentaje' ? 'Ej: 20 para 20%' : 'Ej: 5000'}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Vigencia (inicio)
                      </label>
                      <input
                        type="datetime-local"
                        value={discountForm.fechaInicio}
                        onChange={(e) => setDiscountForm(prev => ({ ...prev, fechaInicio: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Vigencia (término)
                      </label>
                      <input
                        type="datetime-local"
                        value={discountForm.fechaFin}
                        onChange={(e) => setDiscountForm(prev => ({ ...prev, fechaFin: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Estado
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={discountForm.activo}
                          onChange={(e) => setDiscountForm(prev => ({ ...prev, activo: e.target.checked }))}
                          className="rounded border-slate-300"
                        />
                        Cupón activo
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={discountForm.descripcion}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, descripcion: e.target.value }))}
                      rows={2}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="Texto breve que ayude al equipo a recordar el propósito del cupón"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Agregar producto</label>
                      <div className="flex gap-2">
                        <select
                          value={selectedProductOption}
                          onChange={(e) => setSelectedProductOption(e.target.value)}
                          className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                        >
                          <option value="">Selecciona un producto</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.nombre || product.id}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddProductSelection}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900"
                        >
                          Agregar
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Se agregará el ID del producto seleccionado.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Agregar categoría</label>
                      <div className="flex gap-2">
                        <select
                          value={selectedCategoryOption}
                          onChange={(e) => setSelectedCategoryOption(e.target.value)}
                          className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                        >
                          <option value="">Selecciona una categoría</option>
                          {availableCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddCategorySelection}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900"
                        >
                          Agregar
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Se incluirán todos los productos que pertenezcan a esa categoría o subcategoría.</p>
                    </div>
                  </div>

                  {discountForm.selectedProductIds.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">Productos seleccionados</p>
                      <div className="flex flex-wrap gap-2">
                        {discountForm.selectedProductIds.map(productId => (
                          <span key={productId} className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            {productNameMap.get(productId) || productId}
                            <button
                              type="button"
                              onClick={() => handleRemoveProductSelection(productId)}
                              className="text-slate-400 hover:text-red-500"
                              aria-label="Quitar producto del cupón"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {discountForm.selectedCategoryIds.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">Categorías seleccionadas</p>
                      <div className="flex flex-wrap gap-2">
                        {discountForm.selectedCategoryIds.map(categoryId => (
                          <span key={categoryId} className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            {categoryNameMap.get(categoryId) || categoryId}
                            <button
                              type="button"
                              onClick={() => handleRemoveCategorySelection(categoryId)}
                              className="text-slate-400 hover:text-red-500"
                              aria-label="Quitar categoría del cupón"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">IDs adicionales (opcional)</label>
                    <textarea
                      value={discountForm.productosAplicables}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, productosAplicables: e.target.value }))}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="Ingresa los IDs separados por coma: prod-123, prod-456"
                    />
                    <p className="text-xs text-slate-500 mt-1">Útil para añadir IDs manuales o campañas externas.</p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCloseDiscountForm}
                      className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingDiscount}
                      className="rounded-2xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      {savingDiscount ? 'Guardando...' : 'Guardar cupón'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showDiscountForm && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_35px_90px_-55px_rgba(15,23,42,0.45)] p-6">
                {discountsLoading ? (
                  <div className="p-12 text-center text-slate-500">
                    <p className="text-sm">Cargando cupones activos...</p>
                  </div>
                ) : discounts.length === 0 ? (
                  <div className="p-12 text-center space-y-4">
                    <p className="text-lg font-semibold text-slate-900">No hay descuentos configurados</p>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      Crea tu primer cupón para ofrecer descuentos en productos específicos o campañas de temporada.
                    </p>
                    <button
                      onClick={handleOpenDiscountForm}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-900 hover:text-white"
                    >
                      Crear cupón
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        <th className="px-6 py-3 text-left">Código</th>
                        <th className="px-6 py-3 text-left">Tipo</th>
                        <th className="px-6 py-3 text-left">Productos</th>
                        <th className="px-6 py-3 text-left">Vigencia</th>
                        <th className="px-6 py-3 text-left">Estado</th>
                        <th className="px-6 py-3 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {discounts.map((discount) => (
                        <tr key={discount.id} className="text-sm text-slate-600">
                          <td className="px-6 py-4 align-top">
                            <p className="text-base font-semibold text-slate-900 tracking-[0.25em] uppercase">{discount.codigo}</p>
                            {discount.descripcion && (
                              <p className="text-xs text-slate-500 mt-1 max-w-xs">{discount.descripcion}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 align-top">
                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {discount.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo'}
                            </span>
                            <p className="mt-2 text-base font-semibold text-slate-900">{formatDiscountAmount(discount)}</p>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <p className="font-semibold text-slate-900">{discount.productosAplicables.length} producto(s)</p>
                            <p className="text-xs text-slate-500 mt-1 max-w-xs truncate">
                              {discount.productosAplicables.join(', ')}
                            </p>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <p className="font-semibold text-slate-900">Inicio</p>
                            <p className="text-xs text-slate-500 mb-2">{formatReadableDate(discount.fechaInicio)}</p>
                            <p className="font-semibold text-slate-900">Fin</p>
                            <p className="text-xs text-slate-500">{formatReadableDate(discount.fechaFin)}</p>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              discount.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {discount.activo ? 'Activo' : 'Inactivo'}
                            </span>
                            <button
                              onClick={() => handleToggleDiscountStatus(discount)}
                              className="block mt-2 text-xs font-semibold text-slate-900 hover:text-red-500"
                            >
                              {discount.activo ? 'Pausar' : 'Activar'}
                            </button>
                          </td>
                          <td className="px-6 py-4 align-top space-y-2">
                            <button
                              onClick={() => handleEditDiscount(discount)}
                              className="block w-full rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteDiscount(discount)}
                              className="block w-full rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            )}
          </div>
        )}

        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/70 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    {categoryForm.id ? 'Editar Categoría' : 'Agregar Categoría'}
                  </h3>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="text-yellow-300 hover:text-yellow-300"
                  >
                    ✕
                  </button>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-1">
                      ID de la Categoría
                    </label>
                    <input
                      type="text"
                      value={categoryForm.id}
                      onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value })}
                      placeholder="electronicos"
                      className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary)' } as any}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-1">
                      Nombre de la Categoría
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="Electrónicos"
                      className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary)' } as any}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={categoryForm.active}
                      onChange={(e) => setCategoryForm({ ...categoryForm, active: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-yellow-300">
                      Categoría Activa
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(false)}
                      className="flex-1 bg-slate-800 hover:bg-gray-300 text-white font-semibold text-base py-3 px-6 rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (categoryForm.id && categoryForm.name) {
                          try {
                            const categoryData = {
                              name: categoryForm.name,
                              active: categoryForm.active,
                              fechaCreacion: new Date().toISOString()
                            };

                            const existingIndex = categories.findIndex(c => c.id === categoryForm.id);
                            if (existingIndex >= 0) {
                              // Update existing category in Firebase
                              await setDoc(doc(db, 'gamerhouse_categorias', categoryForm.id), categoryData);
                              // Update local state
                              const newCategories = [...categories];
                              newCategories[existingIndex] = categoryForm;
                              setCategories(newCategories);
                            } else {
                              // Add new category to Firebase
                              await setDoc(doc(db, 'gamerhouse_categorias', categoryForm.id), categoryData);
                              // Add to local state
                              setCategories([...categories, categoryForm]);
                            }
                            setShowCategoryModal(false);
                            setCategoryForm({ id: '', name: '', active: true, subcategorias: [] });
                          } catch (error) {
                            alert('Error al guardar categoría');
                          }
                        }
                      }}
                      className="flex-1 text-white font-semibold py-3 px-6 rounded-md transition-colors bg-yellow-400"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {showSubcategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/70 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    {subcategoryForm.id ? 'Editar Subcategoría' : 'Agregar Subcategoría'}
                  </h3>
                  <button
                    onClick={() => setShowSubcategoryModal(false)}
                    className="text-yellow-300 hover:text-yellow-300"
                  >
                    ✕
                  </button>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-1">
                      Nombre de la Subcategoría
                    </label>
                    <input
                      type="text"
                      value={subcategoryForm.nombre}
                      onChange={(e) => setSubcategoryForm({ ...subcategoryForm, nombre: e.target.value })}
                      placeholder="Smartphones"
                      className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary)' } as any}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={subcategoryForm.activa}
                      onChange={(e) => setSubcategoryForm({ ...subcategoryForm, activa: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-yellow-300">
                      Subcategoría Activa
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSubcategoryModal(false)}
                      className="flex-1 bg-slate-800 hover:bg-gray-300 text-white font-semibold text-base py-3 px-6 rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (subcategoryForm.nombre && selectedCategoryForSub) {
                          try {
                            // Find the category and update its subcategories
                            const categoryIndex = categories.findIndex(c => c.id === selectedCategoryForSub);
                            if (categoryIndex >= 0) {
                              const category = categories[categoryIndex];
                              const subcategorias = (category as any).subcategorias || [];

                              let updatedSubcategorias;

                              if (subcategoryForm.id) {
                                // Editar subcategoría existente
                                updatedSubcategorias = subcategorias.map((sub: any) =>
                                  sub.id === subcategoryForm.id
                                    ? { ...sub, nombre: subcategoryForm.nombre, activa: subcategoryForm.activa }
                                    : sub
                                );
                              } else {
                                // Crear nueva subcategoría
                                const newSubcategory = {
                                  id: Date.now().toString(),
                                  nombre: subcategoryForm.nombre,
                                  activa: subcategoryForm.activa
                                };
                                updatedSubcategorias = [...subcategorias, newSubcategory];
                              }

                              const updatedCategory = { ...category, subcategorias: updatedSubcategorias };

                              // Update in Firebase
                              await setDoc(doc(db, 'gamerhouse_categorias', selectedCategoryForSub), {
                                name: category.name,
                                active: category.active,
                                subcategorias: updatedSubcategorias,
                                fechaCreacion: (category as any).fechaCreacion || new Date().toISOString()
                              });

                              // Update local state
                              const newCategories = [...categories];
                              newCategories[categoryIndex] = updatedCategory;
                              setCategories(newCategories);

                              setShowSubcategoryModal(false);
                              setSubcategoryForm({ id: '', nombre: '', activa: true });
                              setSelectedCategoryForSub('');
                            }
                          } catch (error) {
                            alert('Error al guardar subcategoría');
                          }
                        }
                      }}
                      className="flex-1 text-white font-semibold py-3 px-6 rounded-md transition-colors bg-yellow-400"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        
        {showProductModal && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6">
            <div className="bg-slate-800/70/95 backdrop-blur-lg rounded-3xl w-full max-w-6xl 2xl:max-w-[90vw] max-h-[95vh] min-h-[78vh] shadow-lg border border-yellow-300/30 flex flex-col mx-auto">
              {/* Compact Header */}
              <div className="bg-gradient-to-r from-primary to-pink px-5 py-4 sm:px-6 sm:py-5 text-white bg-yellow-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800/70/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
                      {productForm.id ? '📝' : '✨'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {productForm.id ? '📝 Editar Producto' : '✨ Nuevo Producto'}
                      </h3>
                      <p className="text-amber-100 text-xs">
                        {productForm.id ? 'Actualiza la información del producto' : 'Completa la información del producto'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="w-8 h-8 bg-slate-800/70/20 hover:bg-slate-800/70/30 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Compact Scrollable Content */}
              <div className="flex-1 overflow-y-auto bg-transparent">
                <form onSubmit={handleProductSubmit} className="px-6 py-6 lg:px-8 lg:py-7 space-y-6 lg:space-y-7">

                  {/* Compact Basic Info Section */}
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 lg:p-5 shadow-lg shadow-red-600/20 border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-yellow-400">
                        <span className="text-white text-xs">📝</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">Información Básica</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-semibold text-yellow-300 mb-1 flex items-center gap-1">
                          <span>📦</span> Nombre *
                        </label>
                        <input
                          type="text"
                          value={productForm.nombre}
                          onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm border-2 border-yellow-300/30 rounded-lg focus:outline-none transition-all duration-200 bg-slate-800/70/70" style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          placeholder="Ej: Laptop Gaming RGB"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-yellow-300 mb-1 flex items-center gap-1">
                          <span>🏷️</span> SKU *
                        </label>
                        <input
                          type="text"
                          value={productForm.sku}
                          onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                          required
                          placeholder="SKU-001"
                          className="w-full px-3 py-2 text-sm border-2 border-yellow-300/30 rounded-lg focus:border-red-600 focus:outline-none transition-all duration-200 uppercase bg-slate-800/70/70"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-yellow-300 mb-1 flex items-center gap-1">
                          <span>💰</span> Precio ($) *
                        </label>
                        <input
                          type="number"
                          value={productForm.precio}
                          onChange={(e) => setProductForm({ ...productForm, precio: parseFloat(e.target.value) || 0 })}
                          required
                          min="0"
                          step="1"
                          className="w-full px-3 py-2 text-sm border-2 border-yellow-300/30 rounded-lg focus:outline-none transition-all duration-200 bg-slate-800/70/70" style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          placeholder="0"
                        />
                      </div>

                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-semibold text-yellow-300 mb-1 flex items-center gap-1">
                          <span>💸</span> Precio Anterior (Opcional - para mostrar descuento)
                        </label>
                        <input
                          type="number"
                          value={productForm.precioOriginal || ''}
                          onChange={(e) => setProductForm({ ...productForm, precioOriginal: e.target.value ? parseFloat(e.target.value) : undefined })}
                          min="0"
                          step="1"
                          className="w-full px-3 py-2 text-sm border-2 border-yellow-300/30 rounded-lg focus:outline-none transition-all duration-200 bg-slate-800/70/70" style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          placeholder="Dejar vacío si no hay descuento"
                        />
                        <p className="text-xs text-yellow-300 mt-1">
                          Si agregas un precio anterior, se mostrará tachado y el % de descuento
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Compact Stock Section */}
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 lg:p-5 shadow-lg shadow-red-600/20 border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-yellow-400">
                        <span className="text-white text-xs">📊</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">Control de Inventario</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-yellow-300 mb-1 flex items-center gap-1">
                          <span>📦</span> Stock Actual *
                        </label>
                        <input
                          type="number"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                          required
                          min="0"
                          step="1"
                          className="w-full px-3 py-2 text-sm border-2 border-yellow-300/30 rounded-lg focus:border-success focus:outline-none transition-all duration-200 bg-slate-800/70/70"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-yellow-300 mb-1 flex items-center gap-1">
                          <span>⚠️</span> Stock Mínimo *
                        </label>
                        <input
                          type="number"
                          value={productForm.minStock}
                          onChange={(e) => setProductForm({ ...productForm, minStock: Number(e.target.value) })}
                          required
                          min="0"
                          step="1"
                          placeholder="5"
                          className="w-full px-3 py-2 text-sm border-2 border-yellow-300/30 rounded-lg focus:border-success focus:outline-none transition-all duration-200 bg-slate-800/70/70"
                        />
                        <p className="text-xs text-success mt-1">📊 Para alertas de stock bajo</p>
                      </div>
                    </div>
                  </div>

                  {/* Compact Categories Section */}
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 lg:p-5 shadow-lg shadow-red-600/20 border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-yellow-400">
                        <span className="text-white text-xs">📂</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">Categorización</h4>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-semibold text-yellow-300 mb-2 flex items-center gap-1">
                          <span>📂</span> Categorías y Subcategorías * (selecciona todas las que apliquen)
                        </label>
                        <div className="border-2 border-yellow-300/30 rounded-lg p-3 bg-slate-800/70/70 max-h-[55vh] overflow-y-auto space-y-4">
                          {categories.map((category) => {
                            const subcategorias = (category as any).subcategorias || [];
                            const isCategoryChecked = productForm.categorias.includes(category.id);

                            return (
                              <div key={category.id} className="border-b border-yellow-300/30 pb-3 last:border-0">
                                {/* Categoría principal */}
                                <label className="flex items-center gap-2 hover:bg-yellow-50 p-2 rounded cursor-pointer font-medium">
                                  <input
                                    type="checkbox"
                                    checked={isCategoryChecked}
                                    onChange={(e) => {
                                      let newCategorias = [...productForm.categorias];

                                      if (e.target.checked) {
                                        // Agregar categoría
                                        newCategorias.push(category.id);
                                      } else {
                                        // Quitar categoría y todas sus subcategorías
                                        newCategorias = newCategorias.filter(c => {
                                          if (c === category.id) return false;
                                          if (c.startsWith(`${category.id}-`)) return false;
                                          return true;
                                        });
                                      }

                                      setProductForm({
                                        ...productForm,
                                        categorias: newCategorias,
                                        categoria: newCategorias[0]?.split('-')[0] || ''
                                      });
                                    }}
                                    className="rounded border-yellow-300/40 text-yellow-500 focus:ring-amber-500"
                                  />
                                  <span className="text-sm">📂 {category.name}</span>
                                </label>

                                {/* Subcategorías */}
                                {subcategorias.length > 0 && (
                                  <div className="ml-6 mt-2 space-y-1">
                                    {subcategorias.map((sub: any) => {
                                      const subId = `${category.id}-${sub.id}`;
                                      return (
                                        <label key={sub.id} className="flex items-center gap-2 hover:bg-yellow-50 p-1.5 rounded cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={productForm.categorias.includes(subId)}
                                            onChange={(e) => {
                                              let newCategorias = [...productForm.categorias];

                                              if (e.target.checked) {
                                                // Agregar subcategoría y asegurar que categoría padre esté incluida
                                                if (!newCategorias.includes(category.id)) {
                                                  newCategorias.push(category.id);
                                                }
                                                newCategorias.push(subId);
                                              } else {
                                                // Quitar subcategoría
                                                newCategorias = newCategorias.filter(c => c !== subId);
                                              }

                                              setProductForm({
                                                ...productForm,
                                                categorias: newCategorias,
                                                categoria: newCategorias[0]?.split('-')[0] || ''
                                              });
                                            }}
                                            className="rounded border-yellow-300/40 text-red-600 focus:ring-orange-500"
                                          />
                                          <span className="text-xs">📁 {sub.nombre}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {productForm.categorias.length === 0 && (
                          <p className="text-xs text-pink mt-1">Debes seleccionar al menos una categoría o subcategoría</p>
                        )}
                        {productForm.categorias.length > 0 && (
                          <p className="text-xs text-success mt-1">
                            ✓ {productForm.categorias.length} seleccionada(s)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compact Description Section */}
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 lg:p-5 shadow-lg shadow-red-600/20 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-yellow-400">
                        <span className="text-white text-xs">📝</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">Descripción</h4>
                    </div>
                    <textarea
                      value={productForm.descripcion}
                      onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border-2 border-yellow-300/30 rounded-lg focus:border-yellow-300 focus:outline-none transition-all duration-200 resize-none bg-slate-800/70/70"
                      placeholder="Describe las características principales del producto..."
                    />
                  </div>

                  {/* Compact Images Section */}
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 lg:p-5 shadow-lg shadow-red-600/20 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-yellow-400">
                        <span className="text-white text-xs">🖼️</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">Imágenes del Producto</h4>
                    </div>

                    {/* Image Specifications */}
                    <div className="mb-3 p-2 bg-slate-800 border border-yellow-300-200 rounded-lg text-xs">
                      <p className="text-secondary font-medium mb-1">📐 Especificaciones:</p>
                      <ul className="text-yellow-300-hover space-y-0.5">
                        <li>• <strong>Tamaño:</strong> 800x800px (1:1)</li>
                        <li>• <strong>Formato:</strong> JPG o PNG</li>
                        <li>• <strong>Fondo:</strong> Blanco preferible</li>
                        <li>• <strong>Máximo:</strong> 5MB por imagen</li>
                      </ul>
                    </div>

                    {/* Compact Image Upload Area */}
                    <div className="border-2 border-dashed border-yellow-300-200 rounded-lg p-3 text-center bg-slate-800/50 hover:bg-slate-800 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setProductImages(prev => [...prev, ...files]);

                          // Create previews
                          files.forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setProductImagePreviews(prev => [...prev, e.target?.result as string]);
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                        className="hidden"
                        id="product-images"
                      />
                      <label htmlFor="product-images" className="cursor-pointer block">
                        <div className="flex flex-col items-center">
                          <div className="text-2xl mb-1">📸</div>
                          <p className="text-xs font-medium">Agregar imágenes</p>
                          <p className="text-xs" style={{ color: '#D13C1A' }}>Múltiples archivos</p>
                        </div>
                      </label>
                    </div>

                    {/* Compact Image Previews */}
                    {(productImagePreviews.length > 0 || (productForm.imagenes && productForm.imagenes.length > 0)) && (
                      <div className="mt-3 space-y-3">
                        {/* Existing images from product */}
                        {productForm.imagenes && productForm.imagenes.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-yellow-300 mb-2">📦 Imágenes actuales del producto:</p>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                              {productForm.imagenes.map((imageUrl, index) => (
                                <div key={`existing-${index}`} className="relative group">
                                  <img
                                    loading="lazy"
                                    src={imageUrl}
                                    alt={`Actual ${index + 1}`}
                                    className="w-full h-16 object-cover rounded-lg border-2 border-success shadow-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newImagenes = productForm.imagenes?.filter((_, i) => i !== index) || [];
                                      setProductForm(prev => ({
                                        ...prev,
                                        imagenes: newImagenes,
                                        imagen: newImagenes.length > 0 ? newImagenes[0] : ''
                                      }));
                                    }}
                                    className="absolute -top-1 -right-1 bg-pink text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-pink transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    ✕
                                  </button>
                                  <div className="absolute -top-1 -left-1">
                                    <span className="bg-success/100 text-white text-xs px-1.5 py-0.5 rounded-full text-[10px]">#{index + 1}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* New image previews */}
                        {productImagePreviews.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-yellow-300 mb-2">✨ Nuevas imágenes a agregar:</p>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                              {productImagePreviews.map((preview, index) => (
                                <div key={`new-${index}`} className="relative group">
                                  <img
                                    loading="lazy"
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-16 object-cover rounded-lg border-2 border-yellow-300 shadow-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProductImages(prev => prev.filter((_, i) => i !== index));
                                      setProductImagePreviews(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    className="absolute -top-1 -right-1 bg-pink text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-pink transition-colors"
                                  >
                                    ✕
                                  </button>
                                  <div className="absolute -top-1 -left-1">
                                    <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full text-[10px]">Nuevo</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Compact Tags Section */}
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 lg:p-5 shadow-lg shadow-red-600/20 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-yellow-400">
                        <span className="text-white text-xs">🏷️</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">Etiquetas</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={productForm.nuevo}
                          onChange={(e) => setProductForm({ ...productForm, nuevo: e.target.checked })}
                          className="rounded w-4 h-4" style={{ color: 'var(--primary)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                        />
                        <span className="text-xs font-semibold">✨ Nuevo</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={productForm.oferta}
                          onChange={(e) => setProductForm({ ...productForm, oferta: e.target.checked })}
                          className="rounded w-4 h-4" style={{ color: 'var(--primary)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                        />
                        <span className="text-xs font-semibold">🔥 Oferta</span>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modern Compact Bottom Actions - Fixed */}
              <div className="bg-slate-800/70/95 backdrop-blur-sm p-4 border-t border-yellow-300-200 flex-shrink-0">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 bg-gray-400 hover:bg-dark0 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-600/20 hover:shadow-xl shadow-red-600/30 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    onClick={handleProductSubmit}
                    disabled={uploadingProduct}
                    className="flex-[2] text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-lg shadow-red-600/20 hover:shadow-xl shadow-red-600/30"
                    style={{
                      backgroundColor: 'var(--primary)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
                    >
{uploadingProduct ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {productForm.id ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Actualizar
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Crear Producto
                          </>
                        )}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'homepage-content' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">📝 Editar Contenido de la Página Principal</h2>
            
            <div className="bg-success/10 border border-success rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="text-success text-xl mr-3">✨</div>
                <div>
                  <h3 className="text-success font-semibold mb-2">🚀 ¡Súper fácil! Solo selecciona y se guarda automáticamente</h3>
                  <ul className="text-success text-sm space-y-1">
                    <li>• <strong>📁 Subir imágenes:</strong> Haz clic en &quot;Elegir archivo&quot; para subir directamente desde tu computadora</li>
                    <li>• <strong>🎯 Seleccionar enlaces:</strong> Listas desplegables con categorías y productos existentes</li>
                    <li>• <strong>⚡ Guardado automático:</strong> Se guarda automáticamente al cambiar cualquier opción</li>
                    <li>• <strong>👁️ Ver cambios:</strong> Abre la página principal para ver los resultados al instante</li>
                  </ul>
                </div>
              </div>
            </div>
            
            
            <div className="bg-slate-800/70 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Secciones Promocionales de la Página Principal
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      const restoredSections = DEFAULT_PROMOTIONAL_SECTIONS.map((section) => ({ ...section }));
                      const newContent: HomepageContentState = {
                        ...homepageContent,
                        promotionalSections: restoredSections,
                      };

                      setHomepageContent(newContent);
                      autoSaveHomepageContent(newContent);
                      alert('✅ Imágenes por defecto restauradas!');
                    }}
                    className="bg-red-600 hover:bg-secondary text-white text-xs px-3 py-1 rounded transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Restaurar Imágenes
                  </button>

                  {isAutoSaving ? (
                    <div className="flex items-center text-yellow-300 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300 mr-2"></div>
                      Guardando...
                    </div>
                  ) : (
                    <div className="text-success text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Guardado automático activo
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {                  return homepageContent.promotionalSections.map((section, index) => {                    const previewWrapperClasses = (() => {
                      const base = 'relative w-full bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-yellow-300/40';
                      switch (section.position) {
                        case 'large':
                          return `${base} max-w-[240px] aspect-square`;
                        case 'tall':
                          return `${base} max-w-[180px] aspect-[1/2]`;
                        case 'wide':
                          return `${base} max-w-[340px] aspect-[3/1]`;
                        default:
                          return `${base} max-w-[220px] aspect-[4/3]`;
                      }
                    })();

                    return (
                  <div key={section.id} className="border border-yellow-300/30 rounded-lg overflow-hidden hover:border-yellow-300-300 transition-colors">
                    
                    <div className="bg-slate-900 px-4 py-3 border-b">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-white flex items-center gap-1">
                          {section.position === 'large' ? (
                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg> Grande (2x2)</>
                           ) : section.position === 'tall' ? (
                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> Alto (1x2)</>
                           ) : section.position === 'wide' ? (
                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h18M3 12h18M3 16h18" /></svg> Ancho (3:1)</>
                           ) : (
                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" /></svg> Normal (1x1)</>
                           )}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-yellow-300 bg-slate-800/70 px-2 py-1 rounded border flex items-center gap-1">
                            {section.linkType === 'category' ? (
                              <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> Categoría</>
                            ) : section.linkType === 'product' ? (
                              <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> Producto</>
                            ) : section.linkType === 'filter' ? (
                              <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg> Filtro</>
                            ) : (
                              <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> URL</>
                            )}
                          </span>
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar esta sección promocional?')) {
                                const newContent: HomepageContentState = {
                                  ...homepageContent,
                                  promotionalSections: homepageContent.promotionalSections.filter((_, i) => i !== index)
                                };
                                setHomepageContent(newContent);
                                autoSaveHomepageContent(newContent);
                              }
                            }}
                            className="text-pink hover:text-secondary hover:bg-slate-800 p-1 rounded transition-colors"
                            title="Eliminar sección"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold text-yellow-300 flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Vista Previa en Vivo
                        </h5>
                        <div className={`${previewWrapperClasses} mx-auto md:mx-0`}>
                          {section.imageUrl ? (
                            <img
                              src={section.imageUrl}
                              alt={section.title}
                              className="absolute inset-0 h-full w-full object-cover"
                              onError={(e) => {
                                console.error('Error loading image:', section.imageUrl);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-yellow-300 bg-gray-800/60">
                              <div className="text-center">
                                <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div className="text-xs">Sube una imagen</div>
                              </div>
                            </div>
                          )}

                          
                          {section.badgeText && (
                            <div className="absolute top-3 left-3 bg-pink text-white text-xs px-2 py-1 rounded font-bold shadow-lg shadow-red-600/20">
                              {section.badgeText}
                            </div>
                          )}

                          
                          {section.title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent text-white p-3">
                              <div className="font-bold text-sm">{section.title}</div>
                              {section.description && (
                                <div className="text-xs opacity-90 mt-1">{section.description}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      
                      <div className="space-y-3">
                        <h5 className="text-sm font-semibold text-yellow-300 flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Configuración
                        </h5>

                      
                      <div>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => {
                            updateSection(index, { ...section, title: e.target.value });
                          }}
                          className="w-full font-semibold text-white border-0 border-b border-yellow-300/40 bg-transparent pb-1 focus:border-yellow-300 focus:outline-none"
                          placeholder="Título de la sección"
                        />
                        <input
                          type="text"
                          value={section.description}
                          onChange={(e) => {
                            updateSection(index, { ...section, description: e.target.value });
                          }}
                          className="w-full text-sm text-yellow-300 mt-1 border-0 border-b border-yellow-300/40 bg-transparent pb-1 focus:border-yellow-300 focus:outline-none"
                          placeholder="Descripción de la sección"
                        />
                      </div>
                      
                      
                      <input
                        type="text"
                        value={section.badgeText}
                        onChange={(e) => {
                          updateSection(index, { ...section, badgeText: e.target.value });
                        }}
                        placeholder="Texto del badge (ej: OFERTA, NUEVO)"
                        className="w-full text-xs border rounded px-2 py-1 focus:border-yellow-300 focus:outline-none"
                      />
                      
                      
                      <div className="mb-2 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs">
                        <p className="text-amber-800 font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          Resolución recomendada:
                        </p>
                        <p className="text-secondary">
                          {section.position === 'large' ? '1200x1200px (1:1)' :
                           section.position === 'tall' ? '800x1600px (1:2)' :
                           section.position === 'wide' ? '1440x480px (3:1)' : '1200x900px (4:3)'}
                          {' • JPG/PNG • Max 3MB'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, index, section);
                            }
                          }}
                          className="flex-1 text-xs border rounded px-2 py-1 focus:border-yellow-300 focus:outline-none"
                        />
                        {uploadingImages[section.id] && (
                          <div className="flex items-center text-yellow-300 text-xs">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-300 mr-1"></div>
                            Subiendo...
                          </div>
                        )}
                      </div>
                      
                      
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-yellow-300">Tipo de enlace</label>
                        <select
                          value={section.linkType}
                          onChange={(e) => {
                            updateSection(index, { ...section, linkType: e.target.value as any, linkValue: '' });
                          }}
                          className="w-full text-xs border rounded px-2 py-1.5 focus:border-yellow-300 focus:outline-none"
                        >
                          <option value="category">Categoría</option>
                          <option value="product">Producto</option>
                          <option value="filter">Filtro</option>
                          <option value="url">URL personalizada</option>
                        </select>

                        {section.linkType === 'category' ? (
                          <div>
                            <label className="block text-xs font-medium text-yellow-300 mb-1">Seleccionar categoría</label>
                            <select
                              value={section.linkValue}
                              onChange={(e) => {
                                updateSection(index, { ...section, linkValue: e.target.value });
                              }}
                              className="w-full text-xs border rounded px-2 py-1.5 focus:border-yellow-300 focus:outline-none"
                            >
                              <option value="">-- Selecciona una categoría --</option>
                              {availableCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : section.linkType === 'product' ? (
                          <div>
                            <label className="block text-xs font-medium text-yellow-300 mb-1">Seleccionar producto</label>
                            <select
                              value={section.linkValue}
                              onChange={(e) => {
                                updateSection(index, { ...section, linkValue: e.target.value });
                              }}
                              className="w-full text-xs border rounded px-2 py-1.5 focus:border-yellow-300 focus:outline-none"
                            >
                              <option value="">-- Selecciona un producto --</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : section.linkType === 'filter' ? (
                          <div>
                            <label className="block text-xs font-medium text-yellow-300 mb-1">Seleccionar filtro</label>
                            <select
                              value={section.linkValue}
                              onChange={(e) => {
                                updateSection(index, { ...section, linkValue: e.target.value });
                              }}
                              className="w-full text-xs border rounded px-2 py-1.5 focus:border-yellow-300 focus:outline-none"
                            >
                              <option value="">-- Selecciona un filtro --</option>
                              <option value="ofertas">Ofertas</option>
                              <option value="nuevos">Nuevos</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-medium text-yellow-300 mb-1">URL personalizada</label>
                            <input
                              type="text"
                              value={section.linkValue}
                              onChange={(e) => {
                                updateSection(index, { ...section, linkValue: e.target.value });
                              }}
                              placeholder="https://ejemplo.com"
                              className="w-full text-xs border rounded px-2 py-1.5 focus:border-yellow-300 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                      
                      
                      <select
                        value={section.position}
                        onChange={(e) => {
                          updateSection(index, { ...section, position: e.target.value as "large" | "tall" | "normal" | "wide" });
                        }}
                        className="w-full text-xs border rounded px-2 py-1 focus:border-yellow-300 focus:outline-none"
                      >
                        <option value="large">Grande (2x2)</option>
                        <option value="tall">Alto (1x2)</option>
                        <option value="wide">Ancho (2x1)</option>
                        <option value="normal">Normal (1x1)</option>
                      </select>
                      </div>
                    </div>
                  </div>
                    );
                  });
                })()}
              </div>

              {/* Add New Section Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {
                    const newSection: PromotionalSectionState = {
                      id: `section-${Date.now()}`,
                      title: 'Nueva Sección',
                      description: 'Descripción de la sección',
                      imageUrl: '',
                      badgeText: '',
                      linkType: 'category',
                      linkValue: '',
                      position: 'normal',
                      selectedProducts: []
                    };

                    const newContent: HomepageContentState = {
                      ...homepageContent,
                      promotionalSections: [...homepageContent.promotionalSections, newSection]
                    };

                    setHomepageContent(newContent);
                    autoSaveHomepageContent(newContent);
                  }}
                  className="bg-success hover:bg-success/80 text-white font-medium px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar Nueva Sección Promocional
                </button>
              </div>


              <div className="mt-10 border-t border-yellow-300/30 pt-6">
                <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Banners Intermedios
                    </h3>
                    <p className="text-sm text-yellow-300">
                      Banners que aparecen entre secciones de la página principal.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const restored = DEFAULT_MIDDLE_BANNERS.map((banner) => ({ ...banner }));
                      const newContent: HomepageContentState = { ...homepageContent, middleBanners: restored };
                      setHomepageContent(newContent);
                      autoSaveHomepageContent(newContent);
                      alert('✅ Banners restaurados');
                    }}
                    className="bg-red-600 hover:bg-secondary text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Restaurar
                  </button>
                </div>

                <div className="mb-4 p-4 bg-red-600 hover:bg-secondary-50 to-yellow-50 border border-warning rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-secondary text-sm font-bold">Especificaciones Recomendadas</p>
                      <p className="text-secondary text-xs mt-1">Tamaño: 1440x480px (ratio 3:1) • Formato: JPG o PNG • Peso máximo: 4MB</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {homepageContent.middleBanners.map((banner, index) => {
                    const placementLabel = index === 0
                      ? 'Banner entre las primeras secciones'
                      : index === 1
                        ? 'Banner después de la segunda sección'
                        : 'Banner al final de la página';
                    const stateKey = `middle-${banner.id}`;

                    return (
                      <div key={banner.id || `middle-${index}`} className="border-2 border-yellow-300/40 rounded-xl p-5 flex flex-col gap-4 bg-slate-800/70 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-lg">Banner #{index + 1}</h4>
                          {isAutoSaving && (
                            <span className="text-xs text-success flex items-center gap-1">
                              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Guardando...
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-yellow-300 -mt-2">{placementLabel}</p>

                        <div className="space-y-4">
                          {/* Preview Mejorada */}
                          <div className="relative">
                            <div className="absolute -top-2 left-3 z-10">
                              <span className="bg-gradient-to-r from-amber-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-red-600/20">
                                Vista Previa
                              </span>
                            </div>
                            {banner.imageUrl ? (
                              <div className="relative h-48 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl overflow-hidden border-2 border-yellow-300/40 shadow-lg shadow-red-600/20">
                                <img
                                  src={banner.imageUrl}
                                  alt={banner.title}
                                  className="h-full w-full object-cover"
                                />
                                {/* Overlay mejorado con gradiente */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col items-center justify-center text-white p-4">
                                  <h3 className="font-black text-lg text-center drop-shadow-lg shadow-red-600/20 mb-2">{banner.title || 'Tu Título Aquí'}</h3>
                                  <p className="text-sm text-center drop-shadow-md opacity-90">{banner.subtitle || 'Tu subtítulo aquí'}</p>
                                  <button className="mt-3 bg-slate-800/70 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:scale-105 transition-transform">
                                    Ver Más
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl overflow-hidden border-2 border-dashed border-gray-400 flex items-center justify-center">
                                <div className="text-center text-yellow-300">
                                  <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-sm font-medium">Sube una imagen para ver la vista previa</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Título - Mejorado */}
                          <div className="bg-slate-800 p-3 rounded-lg border border-yellow-300-200">
                            <label className="block text-sm font-bold text-yellow-300-hover mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Título Principal
                            </label>
                            <input
                              type="text"
                              value={banner.title}
                              onChange={(e) => updateMiddleBanner(index, { ...banner, title: e.target.value })}
                              className="w-full text-sm border-2 border-yellow-300-300 rounded-lg px-3 py-2 focus:border-yellow-300 focus:ring-2 focus:ring-primary-200 focus:outline-none bg-slate-800/70 transition-all"
                              placeholder="Ej: ¡Ofertas Especiales! 🔥"
                            />
                            <p className="text-xs text-yellow-300 mt-1">Este texto aparece grande en el banner</p>
                          </div>

                          {/* Subtítulo - Mejorado */}
                          <div className="bg-yellow-50 p-3 rounded-lg border border-warning">
                            <label className="block text-sm font-bold text-secondary mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Subtítulo / Descripción
                            </label>
                            <input
                              type="text"
                              value={banner.subtitle}
                              onChange={(e) => updateMiddleBanner(index, { ...banner, subtitle: e.target.value })}
                              className="w-full text-sm border-2 border-amber-300 rounded-lg px-3 py-2 focus:border-red-600 focus:ring-2 focus:ring-amber-200 focus:outline-none bg-slate-800/70 transition-all"
                              placeholder="Ej: Hasta 50% de descuento en productos seleccionados"
                            />
                            <p className="text-xs text-red-600 mt-1">Texto descriptivo que acompaña al título</p>
                          </div>

                          {/* Tipo de Enlace - Mejorado */}
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-300">
                            <label className="block text-sm font-bold text-secondary mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              Destino del Banner
                            </label>
                            <select
                              value={banner.linkType || 'url'}
                              onChange={(e) => {
                                const linkType = e.target.value as 'category' | 'product' | 'filter' | 'url' | 'popup-ofertas';
                                updateMiddleBanner(index, { ...banner, linkType, linkValue: '', ctaLink: '' });
                              }}
                              className="w-full text-sm border-2 border-amber-300 rounded-lg px-3 py-2 focus:border-red-600 focus:ring-2 focus:ring-amber-200 focus:outline-none bg-slate-800/70 transition-all font-medium"
                            >
                              <option value="category">📁 Categoría</option>
                              <option value="product">📦 Producto</option>
                              <option value="filter">🔍 Filtro (Ofertas/Nuevos)</option>
                              <option value="popup-ofertas">🎯 Página de Ofertas Especiales</option>
                              <option value="url">🔗 URL Personalizada</option>
                            </select>

                            {banner.linkType === 'category' ? (
                              <div className="mt-3">
                                <label className="block text-xs font-semibold text-secondary mb-2">
                                  Selecciona la categoría:
                                </label>
                                <select
                                  value={banner.linkValue || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    updateMiddleBanner(index, { ...banner, linkValue: value, ctaLink: `/?category=${value}` });
                                  }}
                                  className="w-full text-sm border-2 border-amber-300 rounded-lg px-3 py-2 focus:border-red-600 focus:ring-2 focus:ring-amber-200 focus:outline-none bg-slate-800/70 transition-all"
                                >
                                  <option value="">-- Selecciona una categoría --</option>
                                  {availableCategories.length === 0 ? (
                                    <option disabled>No hay categorías disponibles</option>
                                  ) : (
                                    availableCategories.map((cat) => (
                                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))
                                  )}
                                </select>
                                {availableCategories.length === 0 && (
                                  <p className="text-xs text-pink mt-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    No se encontraron categorías. Crea categorías primero.
                                  </p>
                                )}
                                {banner.linkValue && (
                                  <p className="text-xs text-success mt-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Enlace: /?category={banner.linkValue}
                                  </p>
                                )}
                              </div>
                            ) : banner.linkType === 'filter' ? (
                              <div className="mt-3">
                                <label className="block text-xs font-semibold text-secondary mb-2">
                                  Selecciona el filtro:
                                </label>
                                <select
                                  value={banner.linkValue || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    updateMiddleBanner(index, { ...banner, linkValue: value, ctaLink: `/?filter=${value}` });
                                  }}
                                  className="w-full text-sm border-2 border-amber-300 rounded-lg px-3 py-2 focus:border-red-600 focus:ring-2 focus:ring-amber-200 focus:outline-none bg-slate-800/70 transition-all"
                                >
                                  <option value="">-- Selecciona un filtro --</option>
                                  <option value="ofertas">Productos en Oferta</option>
                                  <option value="nuevos">Productos Nuevos</option>
                                </select>
                                {banner.linkValue && (
                                  <p className="text-xs text-success mt-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Enlace: /?filter={banner.linkValue}
                                  </p>
                                )}
                              </div>
                            ) : banner.linkType === 'popup-ofertas' ? (
                              <div className="mt-3">
                                <input
                                  type="text"
                                  value="/popup-ofertas"
                                  disabled
                                  className="w-full text-sm border-2 border-yellow-300/40 rounded-lg px-3 py-2 bg-slate-800 text-yellow-300 font-medium"
                                />
                                <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Enlaza a la página de ofertas especiales configurada
                                </p>
                              </div>
                            ) : (
                              <div className="mt-3">
                                <label className="block text-xs font-semibold text-secondary mb-2">
                                  URL completa:
                                </label>
                                <select
                                  value={banner.ctaLink || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (!value) {
                                      return;
                                    }
                                    updateMiddleBanner(index, { ...banner, ctaLink: value, linkValue: value });
                                  }}
                                  className="w-full text-sm border-2 border-amber-300 rounded-lg px-3 py-2 mb-3 focus:border-red-600 focus:ring-2 focus:ring-amber-200 focus:outline-none bg-slate-800/70 transition-all"
                                >
                                  <option value="">-- Selecciona un destino rápido --</option>
                                  {MIDDLE_BANNER_LINK_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={banner.ctaLink || ''}
                                  onChange={(e) => updateMiddleBanner(index, { ...banner, ctaLink: e.target.value, linkValue: e.target.value })}
                                  className="w-full text-sm border-2 border-amber-300 rounded-lg px-3 py-2 focus:border-red-600 focus:ring-2 focus:ring-amber-200 focus:outline-none bg-slate-800/70 transition-all"
                                  placeholder="https://ejemplo.com o /?filter=ofertas"
                                />
                                <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  Ej: https://tupagina.com o /?category=tecnologia
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Subir Imagen - Mejorado */}
                          <div className="bg-success/10 p-3 rounded-lg border border-success">
                            <label className="block text-sm font-bold text-success mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Imagen del Banner
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleMiddleBannerImageUpload(file, index, banner);
                                }
                              }}
                              className="w-full text-sm border-2 border-success rounded-lg px-3 py-2 focus:border-success focus:ring-2 focus:ring-green-200 focus:outline-none bg-slate-800/70 transition-all file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-success/20 file:text-success hover:file:bg-green-200"
                            />
                            {uploadingImages[stateKey] ? (
                              <p className="text-xs text-yellow-300 mt-2 font-medium flex items-center gap-1">
                                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Subiendo imagen...
                              </p>
                            ) : (
                              <p className="text-xs text-success mt-2 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                1440x480px recomendado (ratio 3:1)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Información de Ayuda */}
                <div className="mt-6 bg-red-600 hover:bg-secondary-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-6 shadow-md">
                  <h4 className="font-bold text-secondary mb-4 flex items-center gap-2 text-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Consejos para Banners Efectivos
                  </h4>
                  <ul className="space-y-3 text-sm text-secondary">
                    <li className="flex items-start gap-3 bg-slate-800/70/50 p-2.5 rounded-lg">
                      <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Título claro:</strong> Usa mensajes cortos y directos (ej: "¡Ofertas Imperdibles!")</span>
                    </li>
                    <li className="flex items-start gap-3 bg-slate-800/70/50 p-2.5 rounded-lg">
                      <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Subtítulo descriptivo:</strong> Complementa con información adicional (ej: "Hasta 50% OFF")</span>
                    </li>
                    <li className="flex items-start gap-3 bg-slate-800/70/50 p-2.5 rounded-lg">
                      <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Imágenes de calidad:</strong> Usa imágenes de alta resolución (1440x480px ideal)</span>
                    </li>
                    <li className="flex items-start gap-3 bg-slate-800/70/50 p-2.5 rounded-lg">
                      <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Destino correcto:</strong> Configura el enlace según lo que quieres promocionar</span>
                    </li>
                    <li className="flex items-start gap-3 bg-gradient-to-r from-green-50 to-emerald-50 p-2.5 rounded-lg border border-success">
                      <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span><strong>Auto-guardado:</strong> Los cambios se guardan automáticamente cada 2 segundos</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <a
                  href="/"
                  target="_blank"
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-secondary transition-colors font-semibold shadow-lg shadow-red-600/20 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Ver Página Principal (Nueva pestaña)
                </a>
                <button
                  onClick={() => saveHomepageContent()}
                  className="px-4 py-3 bg-yellow-400 text-white rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Forzar Guardado
                </button>
                <button
                  onClick={() => loadHomepageContent()}
                  className="px-4 py-3 bg-dark0 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Recargar
                </button>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'footer' && (
          <div className="space-y-6">
            <div className="bg-slate-800/70 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Información del Footer</h2>
              
              <form className="space-y-6">
                
                <div>
                  <label className="block text-sm font-medium text-yellow-300 mb-2">
                    Descripción de la Empresa
                  </label>
                  <textarea
                    value={footerForm.companyDescription}
                    onChange={(e) => setFooterForm({ ...footerForm, companyDescription: e.target.value })}
                    placeholder="Tu tienda online de confianza con los mejores productos importados."
                    rows={3}
                    className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                  />
                </div>

                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={footerForm.phone}
                      onChange={(e) => setFooterForm({ ...footerForm, phone: e.target.value })}
                      placeholder="+1 234 567 890"
                      className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4 text-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </label>
                    <input
                      type="email"
                      value={footerForm.email}
                      onChange={(e) => setFooterForm({ ...footerForm, email: e.target.value })}
                      placeholder="info@importadorafyd.com"
                      className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-yellow-300 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={footerForm.address}
                    onChange={(e) => setFooterForm({ ...footerForm, address: e.target.value })}
                    placeholder="Calle Principal 123, Ciudad"
                    className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                  />
                </div>

                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Redes Sociales</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-yellow-300 mb-2">
                        📘 Facebook URL
                      </label>
                      <input
                        type="url"
                        value={footerForm.facebookUrl}
                        onChange={(e) => setFooterForm({ ...footerForm, facebookUrl: e.target.value })}
                        placeholder="https://facebook.com/tu-pagina"
                        className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-yellow-300 mb-2">
                        📷 Instagram URL
                      </label>
                      <input
                        type="url"
                        value={footerForm.instagramUrl}
                        onChange={(e) => setFooterForm({ ...footerForm, instagramUrl: e.target.value })}
                        placeholder="https://instagram.com/tu-cuenta"
                        className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-yellow-300 mb-2">
                        🎵 TikTok URL
                      </label>
                      <input
                        type="url"
                        value={footerForm.tiktokUrl}
                        onChange={(e) => setFooterForm({ ...footerForm, tiktokUrl: e.target.value })}
                        placeholder="https://tiktok.com/@tu-cuenta"
                        className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-yellow-300 mb-2">
                        💬 WhatsApp (número de teléfono)
                      </label>
                      <input
                        type="tel"
                        value={footerForm.whatsappUrl}
                        onChange={(e) => setFooterForm({ ...footerForm, whatsappUrl: e.target.value })}
                        placeholder="912345678 o 56912345678"
                        className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                      />
                      <p className="text-xs text-yellow-300 mt-1">
                        Número de teléfono (se agregará automáticamente el código 56 si no lo incluyes)
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setUpdatingFooter(true);

                      // Update footer configuration using the hook
                      await updateFooterConfig({
                        description: footerForm.companyDescription,
                        contact: {
                          phone: footerForm.phone,
                          email: footerForm.email,
                          address: footerForm.address
                        },
                        socialMedia: {
                          facebook: footerForm.facebookUrl,
                          instagram: footerForm.instagramUrl,
                          tiktok: footerForm.tiktokUrl,
                          whatsapp: footerForm.whatsappUrl
                        }
                      });

                      alert('Información del footer actualizada exitosamente');
                    } catch (error) {
                      console.error('Error updating footer:', error);
                      alert('Error al actualizar la información del footer');
                    } finally {
                      setUpdatingFooter(false);
                    }
                  }}
                  disabled={updatingFooter}
                  className="text-white font-semibold text-base py-3 px-6 rounded-md transition-colors disabled:opacity-50 bg-yellow-400" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
                  >
{updatingFooter ? 'Actualizando...' : 'Actualizar Información'}
                </button>
              </form>
              
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Vista Previa del Footer:</h3>
                <div className="bg-yellow-400 text-white p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">GAMERHOUSE</h4>
                      <p className="text-gray-300 text-sm">{footerForm.companyDescription}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Contacto</h4>
                      <div className="space-y-1 text-gray-300 text-sm">
                        <p>📞 {footerForm.phone}</p>
                        <p>📧 {footerForm.email}</p>
                        <p>📍 {footerForm.address}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Síguenos</h4>
                      <div className="flex space-x-4">
                        <span className="text-2xl cursor-pointer">📘</span>
                        <span className="text-2xl cursor-pointer">📷</span>
                        <span className="text-2xl cursor-pointer">💬</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bank-details' && (
          <div className="space-y-6">
            <div className="bg-slate-800/70 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-white mb-6">🏦 Configuración de Datos Bancarios</h2>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-2">
                      🏛️ Nombre del Banco
                    </label>
                    <input
                      type="text"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      placeholder="Banco de Chile"
                      className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-2">
                      💳 Tipo de Cuenta
                    </label>
                    <select
                      value={bankForm.accountType}
                      onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
                      className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                    >
                      <option value="Cuenta Corriente">Cuenta Corriente</option>
                      <option value="Cuenta Vista">Cuenta Vista</option>
                      <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-2">
                      🔢 Número de Cuenta
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      placeholder="123-456-789-01"
                      className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-2">
                      🆔 RUT del Titular
                    </label>
                    <input
                      type="text"
                      value={bankForm.rut}
                      onChange={(e) => setBankForm({ ...bankForm, rut: e.target.value })}
                      placeholder="12.345.678-9"
                      className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-2">
                      👤 Nombre del Titular
                    </label>
                    <input
                      type="text"
                      value={bankForm.holderName}
                      onChange={(e) => setBankForm({ ...bankForm, holderName: e.target.value })}
                      placeholder="GAMERHOUSE SpA"
                      className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-2">
                      📧 Email para Confirmaciones
                    </label>
                    <input
                      type="email"
                      value={bankForm.email}
                      onChange={(e) => setBankForm({ ...bankForm, email: e.target.value })}
                      placeholder="pagos@importadorafyd.cl"
                      className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setUpdatingBank(true);
                      await updateBankConfig(bankForm);
                      alert('Datos bancarios actualizados exitosamente');
                    } catch (error) {
                      console.error('Error updating bank details:', error);
                      alert('Error al actualizar los datos bancarios');
                    } finally {
                      setUpdatingBank(false);
                    }
                  }}
                  disabled={updatingBank}
                  className="text-white font-semibold text-base py-3 px-6 rounded-md transition-colors disabled:opacity-50 bg-yellow-400" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
                  >
{updatingBank ? 'Actualizando...' : 'Actualizar Datos Bancarios'}
                </button>
              </form>

              {/* Vista previa */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Vista Previa en Checkout:</h3>
                <div className="bg-yellow-50 border border-amber-300 rounded-lg p-4">
                  <div className="bg-slate-800/70 border border-yellow-300/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">📋 Datos para transferencia:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-yellow-300">Banco:</span>
                        <span className="ml-2">{bankForm.bankName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-yellow-300">Tipo de cuenta:</span>
                        <span className="ml-2">{bankForm.accountType}</span>
                      </div>
                      <div>
                        <span className="font-medium text-yellow-300">Número de cuenta:</span>
                        <span className="ml-2">{bankForm.accountNumber}</span>
                      </div>
                      <div>
                        <span className="font-medium text-yellow-300">RUT:</span>
                        <span className="ml-2">{bankForm.rut}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-yellow-300">Titular:</span>
                        <span className="ml-2">{bankForm.holderName}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-yellow-300">Email para confirmación:</span>
                        <span className="ml-2">{bankForm.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>


      {chatPopupOrder && (
        <AdminChatPopup
          order={{...chatPopupOrder, userId: '', updatedAt: ''} as any}
          isOpen={isChatPopupOpen}
          onClose={closeChatPopup}
        />
      )}
    </div>
    </>
  );
}
