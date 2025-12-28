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
  textColor: string;
  neonIntensity: number;
}

export default function AdminLogoSection() {
  const [logoForm, setLogoForm] = useState<LogoForm>({
    text: 'GAMER HOUSE',
    image: '',
    textColor: '#ffffff',
    neonIntensity: 0.75,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [updatingLogo, setUpdatingLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const clampNeon = (value: number) => Math.min(Math.max(value, 0.1), 1);
  const neonIntensity = clampNeon(logoForm.neonIntensity ?? 0.75);
  const neonShadow = `0 0 ${6 + neonIntensity * 6}px ${logoForm.textColor}, 0 0 ${16 + neonIntensity * 12}px ${logoForm.textColor}, 0 0 ${28 + neonIntensity * 20}px ${logoForm.textColor}`;
  const previewLines = logoForm.text
    ? logoForm.text.split('\n').map((line) => line.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const logoDoc = await getDoc(doc(db, 'config', 'logo'));
        if (logoDoc.exists()) {
          const data = logoDoc.data();
          setLogoForm({
            text: data.text || 'GAMER HOUSE',
            image: data.image || '',
            textColor: typeof data.textColor === 'string' ? data.textColor : '#ffffff',
            neonIntensity: typeof data.neonIntensity === 'number' ? data.neonIntensity : 0.75,
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
          <h2 className="text-3xl font-bold text-gray-900">🏪 Editar Logo</h2>
          <p className="text-gray-500 text-sm mt-1">Personaliza el logo de tu tienda</p>
        </div>
        {updatingLogo && (
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
          <div className="bg-gray-50 border border-gray-300 rounded-xl p-6">
            <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-gamerhouse-red rounded-full"></span>
              Vista Previa del Logo
            </p>
            <div className="flex items-center gap-6 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              {logoForm.image && (
                <div className="relative w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center border border-white/30 shadow-inner">
                  <Image
                    src={logoForm.image}
                    alt="Logo preview"
                    fill
                    className="object-contain p-2"
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                {previewLines.map((line, index) => (
                  <div
                    key={index}
                    className={`font-black uppercase tracking-[0.2em] text-lg sm:text-2xl ${index > 0 ? 'opacity-80 text-sm sm:text-xl tracking-[0.12em]' : ''}`}
                    style={{
                      color: logoForm.textColor,
                      textShadow: neonShadow,
                    }}
                  >
                    {line}
                  </div>
                ))}
                {previewLines.length === 0 && (
                  <div className="text-white/70 text-sm">Escribe un texto para previsualizarlo aqui.</div>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Texto */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Texto del Logo
              </label>
              <input
                type="text"
                value={logoForm.text}
                onChange={(e) => setLogoForm(prev => ({ ...prev, text: e.target.value }))}
                placeholder="ej: GAMER HOUSE"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gamerhouse-red bg-white text-gray-900 placeholder-gray-400 transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">💡 Usa saltos de línea para logo en múltiples líneas</p>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Color del texto
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={logoForm.textColor}
                  onChange={(e) => setLogoForm((prev) => ({ ...prev, textColor: e.target.value }))}
                  className="w-16 h-12 rounded-lg border border-gray-300 bg-white cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={logoForm.textColor}
                    onChange={(e) => setLogoForm((prev) => ({ ...prev, textColor: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gamerhouse-red bg-white text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Acepta formatos hex (#FF0000) o palabras CSS (red, cyan...).</p>
                </div>
              </div>
            </div>

            {/* Neon intensity */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Intensidad del efecto neón
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={neonIntensity}
                  onChange={(e) => setLogoForm((prev) => ({ ...prev, neonIntensity: parseFloat(e.target.value) }))}
                  className="w-full accent-gamerhouse-red"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Suave</span>
                  <span className="font-semibold text-gray-800">{Math.round(neonIntensity * 100)}%</span>
                  <span>Intenso</span>
                </div>
              </div>
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Imagen del Logo
              </label>
              <div className="mb-4 p-4 bg-gray-50 border border-gray-300 rounded-lg text-sm">
                <p className="text-gray-700 font-medium flex items-center gap-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gamerhouse-red bg-white text-gray-900 disabled:opacity-50 transition-all"
              />
              {logoForm.image && (
                <button
                  type="button"
                  onClick={() => setLogoForm(prev => ({ ...prev, image: '' }))}
                  className="mt-3 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm font-semibold transition-all"
                >
                  ✕ Remover Imagen
                </button>
              )}
            </div>

            {/* Mensaje */}
            {message && (
              <div className={`p-4 rounded-lg text-sm font-medium transition-all ${
                message.includes('❌')
                  ? 'bg-red-50 text-red-700 border border-red-300'
                  : 'bg-green-50 text-green-700 border border-green-300'
              }`}>
                {message}
              </div>
            )}

            {/* Botón guardar */}
            <button
              onClick={handleSaveLogo}
              disabled={updatingLogo}
              className="w-full px-6 py-3 bg-gamerhouse-red hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-all shadow-sm disabled:shadow-none"
            >
              {updatingLogo ? '⏳ Guardando...' : '💾 Guardar Logo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
