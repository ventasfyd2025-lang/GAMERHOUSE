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

  // Cargar banner desde Firestore
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

      // Optimizar imagen
      const optimizedImage = await optimizeImageFile(file, {
        maxWidth: 1200,
        maxHeight: 600,
        quality: 0.85
      });

      // Subir a Firebase Storage
      const timestamp = Date.now();
      const imageRef = ref(storage, `banners/${timestamp}_${optimizedImage.name}`);
      await uploadBytes(imageRef, optimizedImage);
      const downloadURL = await getDownloadURL(imageRef);

      // Agregar a lista de imágenes
      setBannerForm(prev => ({
        ...prev,
        images: [downloadURL, ...prev.images.slice(0, 2)] // Máximo 3 imágenes
      }));
      setBannerFile(null);
      setMessage('Imagen subida exitosamente');
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

      await setDoc(doc(db, 'config', 'banner'), bannerForm);

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
    return <div className="text-center p-8">Cargando banner...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 Editar Banner</h2>

        <div className="space-y-6">
          {/* Preview */}
          {bannerForm.images[0] && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
              <p className="text-sm font-semibold text-gray-600 mb-4">Vista previa del banner:</p>
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <Image
                  src={bannerForm.images[0]}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                />
                {/* Overlay con contenido */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center p-8">
                  <h3 className="text-3xl font-bold text-white mb-2">{bannerForm.title}</h3>
                  <p className="text-white text-lg">{bannerForm.text}</p>
                </div>
              </div>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Título del Banner
            </label>
            <input
              type="text"
              value={bannerForm.title}
              onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="ej: ¡Nuevos Productos!"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gamerhouse-red outline-none"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción/Subtítulo
            </label>
            <textarea
              value={bannerForm.text}
              onChange={(e) => setBannerForm(prev => ({ ...prev, text: e.target.value }))}
              placeholder="ej: Descubre nuestras últimas colecciones"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gamerhouse-red outline-none resize-none"
            />
          </div>

          {/* Imágenes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Imágenes del Banner
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploadingBanner || bannerForm.images.length >= 3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gamerhouse-red outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Recomendado: 1200x600px, máx 2MB. Máximo 3 imágenes</p>

            {/* Lista de imágenes */}
            {bannerForm.images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {bannerForm.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-200">
                      <Image
                        src={image}
                        alt={`Banner ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
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
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-semibold text-gray-700">
                Banner activo (visible en la página)
              </span>
            </label>
          </div>

          {/* Mensaje */}
          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              message.includes('Error')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}

          {/* Botón guardar */}
          <button
            onClick={handleSaveBanner}
            disabled={uploadingBanner}
            className="w-full px-6 py-3 bg-gradient-to-r from-gamerhouse-red to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all"
          >
            {uploadingBanner ? 'Guardando...' : '💾 Guardar Banner'}
          </button>
        </div>
      </div>
    </div>
  );
}
