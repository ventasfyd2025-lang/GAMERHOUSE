'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Image as ImageIcon, Link2, Save, X as CloseIcon } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import optimizeImageFile from '@/utils/imageProcessing';

interface BannerForm {
  title: string;
  text: string;
  active: boolean;
  images: string[];
  ctaLabel: string;
  ctaUrl: string;
}

export default function AdminBannerSection() {
  const [bannerForm, setBannerForm] = useState<BannerForm>({
    title: '',
    text: '',
    active: true,
    images: [],
    ctaLabel: 'Explorar catálogo',
    ctaUrl: '/productos'
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadBanner = async () => {
      try {
        const [bannerDoc, heroDoc] = await Promise.all([
          getDoc(doc(db, 'config', 'banner')),
          getDoc(doc(db, 'config', 'main-banner')),
        ]);

        const bannerData = bannerDoc.exists() ? bannerDoc.data() as Partial<BannerForm> : {};
        const heroData = heroDoc.exists() ? heroDoc.data() as Record<string, unknown> : {};
        const heroSlides = Array.isArray(heroData.slides) ? heroData.slides : [];
        const sanitizedHeroSlides = heroSlides
          .filter((slide): slide is Record<string, unknown> => Boolean(slide) && typeof slide === 'object')
          .map((slide) => ({
            title: typeof slide.title === 'string' ? slide.title : undefined,
            subtitle: typeof slide.subtitle === 'string' ? slide.subtitle : undefined,
            imageUrl: typeof slide.imageUrl === 'string' ? slide.imageUrl : undefined,
            customUrl: typeof slide.customUrl === 'string' ? slide.customUrl : undefined,
          }));

        const heroImages = sanitizedHeroSlides
          .map((slide) => slide.imageUrl)
          .filter((url): url is string => Boolean(url));

        setBannerForm({
          title: sanitizedHeroSlides[0]?.title || bannerData.title || '',
          text: sanitizedHeroSlides[0]?.subtitle || bannerData.text || '',
          active: heroDoc.exists() ? heroData.active !== false : bannerData.active !== false,
          images: heroImages.length > 0 ? heroImages : (bannerData.images || []),
          ctaLabel: bannerData.ctaLabel || 'Explorar catálogo',
          ctaUrl: (bannerData.ctaUrl || sanitizedHeroSlides[0]?.customUrl || '/productos'),
        });
      } catch (error) {
        console.error('Error loading banner:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBanner();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBanner(true);
      setMessage('Optimizando imagen...');

      const optimizedImage = await optimizeImageFile(file, {
        maxWidth: 1200,
        maxHeight: 600,
        quality: 0.85
      });

      const timestamp = Date.now();
      const imageRef = ref(storage, `banners/${timestamp}_${optimizedImage.name}`);
      await uploadBytes(imageRef, optimizedImage);
      const downloadURL = await getDownloadURL(imageRef);

      setBannerForm(prev => ({
        ...prev,
        images: [downloadURL, ...prev.images.slice(0, 2)]
      }));
      setBannerFile(null);
      setMessage('Imagen subida exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('Error al subir la imagen');
    } finally {
      setUploadingBanner(false);
    }
  };

  const removeImage = (index: number) => {
    setBannerForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSaveBanner = async () => {
    try {
      setUploadingBanner(true);
      setMessage('Guardando banner...');

      const heroSlides = (bannerForm.images.length > 0 ? bannerForm.images : [null]).map((imageUrl, index) => ({
        title: bannerForm.title || `Banner ${index + 1}`,
        subtitle: bannerForm.text,
        imageUrl: imageUrl || '/banner-hero-gamerhouse.jpg',
        linkType: 'url' as const,
        customUrl: bannerForm.ctaUrl || '/productos',
        ctaLabel: bannerForm.ctaLabel || 'Explorar catálogo',
      }));

      await Promise.all([
        setDoc(doc(db, 'config', 'banner'), bannerForm),
        setDoc(doc(db, 'config', 'main-banner'), {
          active: bannerForm.active,
          slides: heroSlides,
          updatedAt: new Date().toISOString(),
        }),
      ]);

      setMessage('Banner guardado exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving banner:', error);
      setMessage('Error al guardar el banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-yellow-300">Cargando banner...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Banner principal</h2>
          <p className="text-gray-500 text-sm mt-1">Actualiza los textos, imágenes y enlaces para el hero de la tienda</p>
        </div>
        {uploadingBanner && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
            <svg className="animate-spin h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Procesando...</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-6">
          {/* Preview */}
          {bannerForm.images[0] && (
            <div className="bg-gray-50 border border-gray-300 rounded-xl p-6">
              <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-400" />
                Vista previa del banner
              </p>
              <div className="relative w-full h-56 rounded-xl overflow-hidden border border-gray-300 shadow-sm">
                <Image
                  src={bannerForm.images[0]}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex flex-col justify-center p-8">
                  <h3 className="text-3xl font-bold text-white mb-2">{bannerForm.title}</h3>
                  <p className="text-gray-100 text-lg">{bannerForm.text}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-5">
            {/* Título */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Título del banner
              </label>
              <input
                type="text"
                value={bannerForm.title}
                onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Nuevos lanzamientos"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gamerhouse-red bg-white text-gray-900 placeholder-gray-400 transition-all"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Descripción o subtítulo
              </label>
              <textarea
                value={bannerForm.text}
                onChange={(e) => setBannerForm(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Ej: Descubre nuestras últimas colecciones"
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gamerhouse-red bg-white text-gray-900 placeholder-gray-400 resize-none transition-all"
              />
            </div>

            {/* Imágenes */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Imágenes del banner
              </label>
              <div className="mb-4 p-4 bg-gray-50 border border-gray-300 rounded-lg text-sm">
                <p className="text-gray-700 font-medium flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>1200x600px recomendado | JPG/PNG | Máx 5MB</span>
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploadingBanner || bannerForm.images.length >= 3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gamerhouse-red bg-white text-gray-900 disabled:opacity-50 transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">Máximo 3 imágenes</p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-gray-400" />
                    Enlace del botón
                  </label>
                  <input
                    type="text"
                    value={bannerForm.ctaUrl}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, ctaUrl: e.target.value }))}
                    placeholder="/productos"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gamerhouse-red bg-white text-gray-900 placeholder-gray-400 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Puedes usar rutas internas o URLs completas.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Texto del botón
                  </label>
                  <input
                    type="text"
                    value={bannerForm.ctaLabel}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, ctaLabel: e.target.value }))}
                    placeholder="Explorar catálogo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gamerhouse-red bg-white text-gray-900 placeholder-gray-400 transition-all"
                  />
                </div>
              </div>

              {/* Lista de imágenes */}
              {bannerForm.images.length > 0 && (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {bannerForm.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-300 shadow-sm group-hover:border-gamerhouse-red transition-all">
                        <Image
                          src={image}
                          alt={`Banner ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                        aria-label="Eliminar imagen"
                      >
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Estado */}
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative inline-flex">
                  <input
                    type="checkbox"
                    checked={bannerForm.active}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  Banner activo (visible en la página)
                </span>
              </label>
            </div>

            {/* Mensaje */}
            {message && (
              <div className={`p-4 rounded-lg text-sm font-medium transition-all ${
                message.toLowerCase().includes('error')
                  ? 'bg-red-50 text-red-700 border border-red-300'
                  : 'bg-green-50 text-green-700 border border-green-300'
              }`}>
                {message}
              </div>
            )}

            {/* Botón guardar */}
            <button
              onClick={handleSaveBanner}
              disabled={uploadingBanner}
              className="w-full px-6 py-3 bg-gamerhouse-red hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-all shadow-sm disabled:shadow-none inline-flex items-center justify-center gap-2"
            >
              {uploadingBanner ? 'Guardando...' : 'Guardar banner'}
              {!uploadingBanner && <Save className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
