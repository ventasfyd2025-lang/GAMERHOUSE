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

  // Cargar logo desde Firestore
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

      // Optimizar imagen
      const optimizedImage = await optimizeImageFile(file, {
        maxWidth: 300,
        maxHeight: 100,
        quality: 0.9
      });

      // Subir a Firebase Storage
      const timestamp = Date.now();
      const imageRef = ref(storage, `logos/${timestamp}_${optimizedImage.name}`);
      await uploadBytes(imageRef, optimizedImage);
      const downloadURL = await getDownloadURL(imageRef);

      // Actualizar formulario
      setLogoForm(prev => ({ ...prev, image: downloadURL }));
      setLogoFile(null);
      setMessage('Imagen subida exitosamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('Error al subir la imagen');
    } finally {
      setUpdatingLogo(false);
    }
  };

  const handleSaveLogo = async () => {
    try {
      setUpdatingLogo(true);
      setMessage('Guardando logo...');

      await setDoc(doc(db, 'config', 'logo'), logoForm);

      setMessage('Logo guardado exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving logo:', error);
      setMessage('Error al guardar el logo');
    } finally {
      setUpdatingLogo(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Cargando logo...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🏪 Editar Logo</h2>

        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
            <p className="text-sm font-semibold text-gray-600 mb-4">Vista previa del logo:</p>
            <div className="flex items-center gap-4">
              {logoForm.image && (
                <div className="relative w-24 h-24">
                  <Image
                    src={logoForm.image}
                    alt="Logo preview"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div>
                <div className="text-xl font-bold text-gamerhouse-red">{logoForm.text.split('\n')[0]}</div>
                {logoForm.text.includes('\n') && (
                  <div className="text-xl font-bold text-gamerhouse-navy">{logoForm.text.split('\n')[1]}</div>
                )}
              </div>
            </div>
          </div>

          {/* Texto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Texto del Logo
            </label>
            <input
              type="text"
              value={logoForm.text}
              onChange={(e) => setLogoForm(prev => ({ ...prev, text: e.target.value }))}
              placeholder="ej: GAMER HOUSE"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gamerhouse-red outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Usa saltos de línea para logo en múltiples líneas</p>
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Imagen del Logo
            </label>
            <div className="flex gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={updatingLogo}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gamerhouse-red outline-none"
              />
              {logoForm.image && (
                <button
                  onClick={() => setLogoForm(prev => ({ ...prev, image: '' }))}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold"
                >
                  Remover
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Recomendado: 300x100px, máx 2MB</p>
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
            onClick={handleSaveLogo}
            disabled={updatingLogo}
            className="w-full px-6 py-3 bg-gradient-to-r from-gamerhouse-red to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all"
          >
            {updatingLogo ? 'Guardando...' : '💾 Guardar Logo'}
          </button>
        </div>
      </div>
    </div>
  );
}
