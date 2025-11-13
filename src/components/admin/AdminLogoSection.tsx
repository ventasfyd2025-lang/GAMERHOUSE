'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import optimizeImageFile from '@/utils/imageProcessing';

interface LogoForm {
  text: string;
  image: string;
}

export default function AdminLogoSection() {
  const [logoForm, setLogoForm] = useState<LogoForm>({
    text: 'GAMER HOUSE',
    image: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [updatingLogo, setUpdatingLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const logoDoc = await getDoc(doc(db, 'config', 'logo'));
        if (logoDoc.exists()) {
          const data = logoDoc.data();
          setLogoForm({
            text: data.text || 'GAMER HOUSE',
            image: data.image || ''
          });
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLogo();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUpdatingLogo(true);
      setMessage('Optimizando imagen...');

      const optimizedImage = await optimizeImageFile(file, {
        maxWidth: 300,
        maxHeight: 100,
        quality: 0.9
      });

      const timestamp = Date.now();
      const imageRef = ref(storage, `logos/${timestamp}_${optimizedImage.name}`);
      await uploadBytes(imageRef, optimizedImage);
      const downloadURL = await getDownloadURL(imageRef);

      setLogoForm(prev => ({ ...prev, image: downloadURL }));
      setLogoFile(null);
      setMessage('✅ Imagen subida exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('❌ Error al subir la imagen');
    } finally {
      setUpdatingLogo(false);
    }
  };

  const handleSaveLogo = async () => {
    try {
      setUpdatingLogo(true);
      setMessage('Guardando logo...');

      await setDoc(doc(db, 'config', 'logo'), logoForm);

      setMessage('✅ Logo guardado exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving logo:', error);
      setMessage('❌ Error al guardar el logo');
    } finally {
      setUpdatingLogo(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-yellow-300">Cargando logo...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">🏪 Editar Logo</h2>
        {updatingLogo && (
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
          <div className="border border-yellow-300/30 rounded-lg p-4 bg-slate-900/50">
            <p className="text-sm font-semibold text-yellow-300 mb-3">Vista Previa del Logo:</p>
            <div className="flex items-center gap-4">
              {logoForm.image && (
                <div className="relative w-20 h-20 rounded border border-yellow-300/30 bg-slate-800 flex items-center justify-center">
                  <Image
                    src={logoForm.image}
                    alt="Logo preview"
                    fill
                    className="object-contain p-1"
                  />
                </div>
              )}
              <div>
                <div className="text-lg font-bold text-white">{logoForm.text.split('\n')[0]}</div>
                {logoForm.text.includes('\n') && (
                  <div className="text-lg font-bold text-yellow-300">{logoForm.text.split('\n')[1]}</div>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Texto */}
            <div>
              <label className="block text-sm font-medium text-yellow-300 mb-2">
                Texto del Logo
              </label>
              <input
                type="text"
                value={logoForm.text}
                onChange={(e) => setLogoForm(prev => ({ ...prev, text: e.target.value }))}
                placeholder="ej: GAMER HOUSE"
                className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2 bg-slate-900 text-white"
                style={{ '--tw-ring-color': 'var(--primary)' } as any}
              />
              <p className="text-xs text-yellow-300 mt-1">Usa saltos de línea para logo en múltiples líneas</p>
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-yellow-300 mb-2">
                Imagen del Logo
              </label>
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <p className="text-slate-700 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  Recomendado: 300x100px | Formato: JPG/PNG | Peso máx: 2MB
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={updatingLogo}
                className="w-full px-3 py-2 border border-yellow-300/40 rounded-md focus:outline-none focus:ring-2 bg-slate-900 text-white disabled:opacity-50"
                style={{ '--tw-ring-color': 'var(--primary)' } as any}
              />
              {logoForm.image && (
                <button
                  type="button"
                  onClick={() => setLogoForm(prev => ({ ...prev, image: '' }))}
                  className="mt-2 px-3 py-1 bg-pink text-white rounded-md hover:bg-pink/80 text-sm font-semibold"
                >
                  ✕ Remover Imagen
                </button>
              )}
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
              onClick={handleSaveLogo}
              disabled={updatingLogo}
              className="w-full px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-lg font-semibold disabled:opacity-50 transition-all"
            >
              {updatingLogo ? 'Guardando...' : '💾 Guardar Logo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
