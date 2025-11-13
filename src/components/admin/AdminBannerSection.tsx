'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import optimizeImageFile from '@/utils/imageProcessing';

interface BannerForm {
  title: string;
  text: string;
  active: boolean;
  images: string[];
}

export default function AdminBannerSection() {
  const [bannerForm, setBannerForm] = useState<BannerForm>({
    title: '',
    text: '',
    active: true,
    images: []
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadBanner = async () => {
      try {
        const bannerDoc = await getDoc(doc(db, 'config', 'banner'));
        if (bannerDoc.exists()) {
          const data = bannerDoc.data();
          setBannerForm({
            title: data.title || '',
            text: data.text || '',
            active: data.active !== false,
            images: data.images || []
          });
        }
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
      setMessage('✅ Imagen subida exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('❌ Error al subir la imagen');
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

      await setDoc(doc(db, 'config', 'banner'), bannerForm);

      setMessage('✅ Banner guardado exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving banner:', error);
      setMessage('❌ Error al guardar el banner');
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
        <h2 className="text-2xl font-bold text-white">📸 Editar Banner Dinámico</h2>
        {uploadingBanner && (
          <div className="flex items-center gap-2 text-sm text-yellow-300 bg-slate-800 px-3 py-1 rounded-full">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Procesando...</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-slate-800/70 rounded-lg shadow-md p-6">
        <div className="space-y-6">
          {/* Preview */}
          {bannerForm.images[0] && (
            <div className="border border-yellow-300/30 rounded-lg p-4 bg-slate-900/50">
              <p className="text-sm font-semibold text-yellow-300 mb-3">Vista Previa del Banner:</p>
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-yellow-300/30">
                <Image
                  src={bannerForm.images[0]}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{bannerForm.title}</h3>
                  <p className="text-white text-lg">{bannerForm.text}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-yellow-300 mb-2">
                Título del Banner
              </label>
              <input
                type="text"
                value={bannerForm.title}
                onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="ej: ¡Nuevos Productos!"
                className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2 bg-slate-900 text-white"
                style={{ '--tw-ring-color': 'var(--primary)' } as any}
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-yellow-300 mb-2">
                Descripción/Subtítulo
              </label>
              <textarea
                value={bannerForm.text}
                onChange={(e) => setBannerForm(prev => ({ ...prev, text: e.target.value }))}
                placeholder="ej: Descubre nuestras últimas colecciones"
                rows={2}
                className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2 bg-slate-900 text-white resize-none"
                style={{ '--tw-ring-color': 'var(--primary)' } as any}
              />
            </div>

            {/* Imágenes */}
            <div>
              <label className="block text-sm font-medium text-yellow-300 mb-2">
                Imágenes del Banner
              </label>
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <p className="text-slate-700 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  Recomendado: 1200x600px | Formato: JPG/PNG | Peso máx: 5MB
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploadingBanner || bannerForm.images.length >= 3}
                className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2 bg-slate-900 text-white disabled:opacity-50"
                style={{ '--tw-ring-color': 'var(--primary)' } as any}
              />
              <p className="text-xs text-yellow-300 mt-1">Máximo 3 imágenes</p>

              {/* Lista de imágenes */}
              {bannerForm.images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {bannerForm.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full h-20 rounded-lg overflow-hidden bg-slate-800 border border-yellow-300/30">
                        <Image
                          src={image}
                          alt={`Banner ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-pink text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold hover:bg-pink/80"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Estado */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bannerForm.active}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-yellow-300/40"
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span className="text-sm font-medium text-yellow-300">
                  Banner activo (visible en la página)
                </span>
              </label>
            </div>

            {/* Mensaje */}
            {message && (
              <div className={`p-3 rounded-lg text-sm font-medium ${
                message.includes('❌')
                  ? 'bg-red-900/30 text-red-300 border border-red-300/30'
                  : 'bg-green-900/30 text-green-300 border border-green-300/30'
              }`}>
                {message}
              </div>
            )}

            {/* Botón guardar */}
            <button
              onClick={handleSaveBanner}
              disabled={uploadingBanner}
              className="w-full px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-lg font-semibold disabled:opacity-50 transition-all"
            >
              {uploadingBanner ? 'Guardando...' : '💾 Guardar Banner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
