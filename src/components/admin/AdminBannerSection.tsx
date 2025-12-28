'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import optimizeImageFile from '@/utils/imageProcessing';
import { HERO_BANNER_PLACEHOLDER } from '@/lib/placeholders';
import { useCategories } from '@/hooks/useCategories';

type SlotKey = 'hero' | 'middle' | 'footer';

interface BannerSlotForm {
  title: string;
  text: string;
  image?: string;
  ctaLabel: string;
  ctaUrl: string;
  linkType: 'url' | 'category';
  categoryId?: string;
  textColor: string;
}

interface BannerForm {
  active: boolean;
  slots: Record<SlotKey, BannerSlotForm>;
}

const SLOT_TEXT_PLACEHOLDER = 'Personaliza este banner desde el panel de administración.';

const SLOT_LABELS: Record<SlotKey, { title: string; description: string }> = {
  hero: {
    title: 'Banner cabecera',
    description: 'Hero principal que aparece al comienzo de la página de inicio.'
  },
  middle: {
    title: 'Banner intermedio',
    description: 'Se muestra entre las secciones principales.'
  },
  footer: {
    title: 'Banner final',
    description: 'Aparece antes del cierre de la página.'
  }
};

const DEFAULT_SLOT: BannerSlotForm = {
  title: '',
  text: '',
  image: '',
  ctaLabel: 'Ver más',
  ctaUrl: '/productos',
  linkType: 'url',
  categoryId: '',
  textColor: '#ffffff'
};

const getDefaultForm = (): BannerForm => ({
  active: true,
  slots: {
    hero: { ...DEFAULT_SLOT },
    middle: { ...DEFAULT_SLOT },
    footer: { ...DEFAULT_SLOT },
  }
});

const sanitizeSlot = (slot?: Record<string, unknown>): BannerSlotForm => ({
  title: typeof slot?.title === 'string' ? slot.title : '',
  text: typeof slot?.text === 'string' && slot.text.trim() !== SLOT_TEXT_PLACEHOLDER ? slot.text : '',
  image: typeof slot?.image === 'string' ? slot.image : '',
  ctaLabel: typeof slot?.ctaLabel === 'string' && slot.ctaLabel.trim() ? slot.ctaLabel : 'Ver más',
  ctaUrl: typeof slot?.ctaUrl === 'string' && slot.ctaUrl.trim() ? slot.ctaUrl : '/productos',
  linkType: slot?.linkType === 'category' ? 'category' : 'url',
  categoryId: typeof slot?.categoryId === 'string' ? slot.categoryId : '',
  textColor: typeof slot?.textColor === 'string' && slot.textColor.trim() ? slot.textColor : '#ffffff'
});

const normalizeBannerForm = (raw?: Record<string, unknown>): BannerForm => {
  const form = getDefaultForm();
  if (!raw) {
    return form;
  }

  if (raw.slots && typeof raw.slots === 'object') {
    const slots = raw.slots as Record<SlotKey, Record<string, unknown>>;
    return {
      active: raw.active !== false,
      slots: {
        hero: { ...form.slots.hero, ...sanitizeSlot(slots.hero) },
        middle: { ...form.slots.middle, ...sanitizeSlot(slots.middle) },
        footer: { ...form.slots.footer, ...sanitizeSlot(slots.footer) },
      }
    };
  }

  const legacyImages = Array.isArray(raw.images)
    ? raw.images.filter((image: unknown): image is string => typeof image === 'string' && image.trim().length > 0)
    : [];

  const buildLegacySlot = (index: number): BannerSlotForm => ({
    title: typeof raw.title === 'string' ? raw.title : '',
    text: typeof raw.text === 'string' ? raw.text : '',
    image: legacyImages[index] || '',
    ctaLabel: typeof raw.ctaLabel === 'string' ? raw.ctaLabel : 'Ver más',
    ctaUrl: typeof raw.ctaUrl === 'string' ? raw.ctaUrl : '/productos',
    linkType: 'url',
    categoryId: '',
    textColor: '#ffffff'
  });

  return {
    active: raw.active !== false,
    slots: {
      hero: buildLegacySlot(0),
      middle: buildLegacySlot(1),
      footer: buildLegacySlot(2),
    }
  };
};

export default function AdminBannerSection() {
  const [bannerForm, setBannerForm] = useState<BannerForm>(getDefaultForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingSlot, setUploadingSlot] = useState<SlotKey | null>(null);
  const { categories } = useCategories();

  useEffect(() => {
    const loadBanner = async () => {
      try {
        const bannerDoc = await getDoc(doc(db, 'config', 'banner'));
        const data = bannerDoc.exists() ? bannerDoc.data() : undefined;
        setBannerForm(normalizeBannerForm(data));
      } catch (error) {
        console.error('Error loading banner:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBanner();
  }, []);

  const handleSlotChange = (slotKey: SlotKey, field: keyof BannerSlotForm, value: string) => {
    setBannerForm((prev) => ({
      ...prev,
      slots: {
        ...prev.slots,
        [slotKey]: {
          ...prev.slots[slotKey],
          [field]: value,
        },
      },
    }));
  };

  const handleImageUpload = async (slotKey: SlotKey, file: File) => {
    try {
      setUploadingSlot(slotKey);
      setMessage('Optimizando imagen...');
      const optimizedImage = await optimizeImageFile(file, {
        maxWidth: 1440,
        maxHeight: 600,
        quality: 0.85,
      });

      const timestamp = Date.now();
      const imageRef = ref(storage, `banners/${slotKey}-${timestamp}_${optimizedImage.name}`);
      await uploadBytes(imageRef, optimizedImage);
      const downloadURL = await getDownloadURL(imageRef);

      handleSlotChange(slotKey, 'image', downloadURL);
      setMessage('Imagen subida exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('Error al subir la imagen');
    } finally {
      setUploadingSlot(null);
    }
  };

  const removeSlotImage = (slotKey: SlotKey) => {
    handleSlotChange(slotKey, 'image', '');
  };

  const handleSaveBanner = async () => {
    try {
      setSaving(true);
      setMessage('Guardando configuración...');

      await setDoc(doc(db, 'config', 'banner'), {
        active: bannerForm.active,
        slots: bannerForm.slots,
        updatedAt: new Date().toISOString(),
      });

      const hero = bannerForm.slots.hero;
      const heroLinkType = hero.linkType === 'category' && hero.categoryId ? 'category' : 'url';
      await setDoc(doc(db, 'config', 'main-banner'), {
        active: bannerForm.active,
        slides: [
          {
            title: hero.title || 'Campaña destacada',
            subtitle: hero.text || '',
            imageUrl: hero.image || HERO_BANNER_PLACEHOLDER,
            linkType: heroLinkType,
            categoryId: heroLinkType === 'category' ? hero.categoryId || undefined : undefined,
            customUrl: heroLinkType === 'url' ? (hero.ctaUrl || '/productos') : undefined,
            ctaLabel: hero.ctaLabel || 'Ver más',
          },
        ],
        updatedAt: new Date().toISOString(),
      });

      setMessage('Banner actualizado correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving banner:', error);
      setMessage('Error al guardar el banner');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2">Cargando configuración de banners...</span>
      </div>
    );
  }

  const slotKeys: SlotKey[] = ['hero', 'middle', 'footer'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Banners de la tienda</h2>
          <p className="text-gray-500 text-sm">Gestiona el banner principal y los banners intermedios desde un solo lugar.</p>
        </div>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>

      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3">
        <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <input
            type="checkbox"
            checked={bannerForm.active}
            onChange={(event) => setBannerForm((prev) => ({ ...prev, active: event.target.checked }))}
            className="h-4 w-4 text-red-500 rounded border-gray-300"
          />
          Mostrar banners en la tienda
        </label>
        <span className="text-xs text-gray-500">(Puedes desactivarlos temporalmente si necesitas ocultarlos)</span>
      </div>

      <div className="space-y-8">
        {slotKeys.map((slotKey) => {
          const slot = bannerForm.slots[slotKey];
          const labels = SLOT_LABELS[slotKey];
          const isUploading = uploadingSlot === slotKey;

          return (
            <div key={slotKey} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-gray-900">{labels.title}</h3>
                <p className="text-sm text-gray-500">{labels.description}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-800">Título</label>
                  <input
                    type="text"
                    value={slot.title}
                    onChange={(event) => handleSlotChange(slotKey, 'title', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder="Ej: Lanzamientos oficiales"
                  />

                  <label className="block text-sm font-semibold text-gray-800">Descripción</label>
                  <textarea
                    value={slot.text}
                    onChange={(event) => handleSlotChange(slotKey, 'text', event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none"
                    placeholder="Texto descriptivo o subtítulo del banner"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800">Texto del botón</label>
                      <input
                        type="text"
                        value={slot.ctaLabel}
                        onChange={(event) => handleSlotChange(slotKey, 'ctaLabel', event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="Ej: Ver más"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800">Tipo de enlace</label>
                      <select
                        value={slot.linkType}
                        onChange={(event) => handleSlotChange(slotKey, 'linkType', event.target.value as BannerSlotForm['linkType'])}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      >
                        <option value="url">URL personalizada</option>
                        <option value="category">Categoría</option>
                      </select>
                    </div>
                  </div>

                  {slot.linkType === 'category' ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-800">Categoría destino</label>
                      <select
                        value={slot.categoryId || ''}
                        onChange={(event) => handleSlotChange(slotKey, 'categoryId', event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      >
                        <option value="">Seleccione una categoría</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">El botón redirigirá a la categoría seleccionada.</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-800">URL del botón</label>
                      <input
                        type="text"
                        value={slot.ctaUrl}
                        onChange={(event) => handleSlotChange(slotKey, 'ctaUrl', event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="/productos"
                      />
                      <p className="text-xs text-gray-500 mt-1">Puedes pegar una URL interna o externa.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">Color del texto</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={slot.textColor}
                        onChange={(event) => handleSlotChange(slotKey, 'textColor', event.target.value)}
                        className="h-12 w-16 rounded-lg border border-gray-300"
                      />
                      <input
                        type="text"
                        value={slot.textColor}
                        onChange={(event) => handleSlotChange(slotKey, 'textColor', event.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Ajusta el color para que contraste con la imagen del banner.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">Imagen del banner</label>
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-dashed border-gray-300 bg-gray-50">
                    {slot.image ? (
                      <>
                        <Image src={slot.image} alt={`Preview ${slotKey}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSlotImage(slotKey)}
                          className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow"
                          aria-label="Eliminar imagen"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <ImageIcon className="h-8 w-8" />
                        <p className="text-sm">Sin imagen</p>
                      </div>
                    )}
                  </div>
                  <label className="block">
                    <span className="sr-only">Seleccionar imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          handleImageUpload(slotKey, file);
                        }
                      }}
                      disabled={isUploading}
                      className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2.5 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                    />
                  </label>
                  <p className="text-xs text-gray-500">Dimensiones sugeridas: 1440x480px • Formato JPG/PNG • Máx 5MB</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">No olvides guardar tus cambios</p>
          <p className="text-xs text-gray-500">
            El banner de cabecera también se sincroniza automáticamente con el hero principal.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveBanner}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
