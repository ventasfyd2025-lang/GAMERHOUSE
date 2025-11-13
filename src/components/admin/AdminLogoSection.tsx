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
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">🏪 Editar Logo</h2>
          <p className="text-gray-400 text-sm mt-1">Personaliza el logo de tu tienda</p>
        </div>
        {updatingLogo && (
          <div className="flex items-center gap-2 text-sm text-blue-300 bg-blue-950/50 px-4 py-2 rounded-lg border border-blue-500/30">
            <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Procesando...</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-800/50 to-slate-900 rounded-2xl shadow-xl p-8 border border-slate-700/50 backdrop-blur-sm">
        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-gradient-to-r from-blue-950/20 to-purple-950/20 border border-blue-500/20 rounded-xl p-6 backdrop-blur">
            <p className="text-sm font-semibold text-blue-300 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Vista Previa del Logo
            </p>
            <div className="flex items-center gap-6 bg-slate-900/40 rounded-lg p-4 border border-slate-700/30">
              {logoForm.image && (
                <div className="relative w-24 h-24 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600/50 shadow-lg">
                  <Image
                    src={logoForm.image}
                    alt="Logo preview"
                    fill
                    className="object-contain p-2"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="text-xl font-bold text-white">{logoForm.text.split('\n')[0]}</div>
                {logoForm.text.includes('\n') && (
                  <div className="text-lg font-bold text-blue-400">{logoForm.text.split('\n')[1]}</div>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Texto */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Texto del Logo
              </label>
              <input
                type="text"
                value={logoForm.text}
                onChange={(e) => setLogoForm(prev => ({ ...prev, text: e.target.value }))}
                placeholder="ej: GAMER HOUSE"
                className="w-full px-4 py-3 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900/50 text-white placeholder-gray-500 transition-all"
              />
              <p className="text-xs text-gray-400 mt-2">💡 Usa saltos de línea para logo en múltiples líneas</p>
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Imagen del Logo
              </label>
              <div className="mb-4 p-4 bg-blue-950/30 border border-blue-500/20 rounded-lg text-sm backdrop-blur">
                <p className="text-blue-300 font-medium flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>300x100px recomendado | JPG/PNG | Máx 2MB</span>
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={updatingLogo}
                className="w-full px-4 py-3 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900/50 text-gray-400 disabled:opacity-50 transition-all"
              />
              {logoForm.image && (
                <button
                  type="button"
                  onClick={() => setLogoForm(prev => ({ ...prev, image: '' }))}
                  className="mt-3 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/20 rounded-lg text-sm font-semibold transition-all"
                >
                  ✕ Remover Imagen
                </button>
              )}
            </div>

            {/* Mensaje */}
            {message && (
              <div className={`p-4 rounded-lg text-sm font-medium transition-all ${
                message.includes('❌')
                  ? 'bg-red-950/40 text-red-300 border border-red-500/20'
                  : 'bg-green-950/40 text-green-300 border border-green-500/20'
              }`}>
                {message}
              </div>
            )}

            {/* Botón guardar */}
            <button
              onClick={handleSaveLogo}
              disabled={updatingLogo}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none"
            >
              {updatingLogo ? '⏳ Guardando...' : '💾 Guardar Logo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
