'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mockProducts } from '@/data/mockProducts';

export interface Category {
  id: string;
  name: string;
  active: boolean;
  icon?: string;
  subcategorias?: Array<{
    id: string;
    nombre: string;
    activa: boolean;
  }>;
}

const defaultCategories: Category[] = [
  { id: 'all', name: 'Todos los Juegos', active: true, icon: '🎮' },
];

// Icon mapping for gaming/pokémon categories
const categoryIcons: Record<string, string> = {
  'consolas': '🎮',
  'ps5': '🎮',
  'xbox': '🎮',
  'nintendo': '🎮',
  'juegos': '🕹️',
  'pokémon': '⚡',
  'pokemon': '⚡',
  'accesorios': '🎧',
  'merchandise': '👕',
  'tarjetas': '🃏',
  'figuras': '🎨',
  'libros': '📚',
  'mandos': '🕹️',
  'headsets': '🎧',
  'cables': '🔌'
};

// Subcategories mapping from WordPress export
const subcategoriesByCategory: Record<string, Array<{ id: string; nombre: string; activa: boolean }>> = {
  'magic': [
    { id: 'preventa-magic', nombre: 'Preventa Magic', activa: true },
    { id: 'sellado', nombre: 'Sellado', activa: true }
  ],
  'nintendo': [
    { id: 'consolas', nombre: 'Consolas', activa: true },
    { id: 'controles', nombre: 'Controles', activa: true },
    { id: 'portatiles', nombre: 'Portatiles', activa: true }
  ],
  'playstation': [
    { id: 'ps2', nombre: 'Ps2', activa: true },
    { id: 'ps3', nombre: 'Ps3', activa: true },
    { id: 'ps4', nombre: 'Ps4', activa: true },
    { id: 'ps5', nombre: 'Ps5', activa: true }
  ],
  'pokemon-tcg': [
    { id: 'booster-bundle', nombre: 'Booster Bundle', activa: true },
    { id: 'combina-y-combate', nombre: 'Combina Y Combate', activa: true },
    { id: 'elite-trainer-box', nombre: 'Elite Trainer Box', activa: true },
    { id: 'leagle-batle-deck', nombre: 'Leagle Batle Deck', activa: true },
    { id: 'premium-collection', nombre: 'Premium Collection', activa: true },
    { id: 'preventa', nombre: 'Preventa', activa: true },
    { id: 'sobres-sueltos', nombre: 'Sobres sueltos', activa: true },
    { id: 'special-collection', nombre: 'Special Collection', activa: true },
    { id: 'tin-y-mini-tins', nombre: 'Tin Y Mini Tins', activa: true }
  ],
  'singles': [
    { id: 'accesorios', nombre: 'Accesorios', activa: true }
  ]
};

// Generate categories from mock products
const generateCategoriesFromProducts = (): Category[] => {
  const uniqueCategories = [...new Set(mockProducts.map(p => p.categoria))];
  const productCategories: Category[] = uniqueCategories
    .filter(cat => cat)
    .map((category, index) => ({
      id: category.toLowerCase().replace(/\s+/g, '-'),
      name: category,
      active: true,
      icon: categoryIcons[category.toLowerCase()] || '📦'
    }));
  
  return [
    defaultCategories[0], // "Todos los productos"
    ...productCategories
  ];
};

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Set up real-time listener for categories
        const unsubscribe = onSnapshot(
          collection(db, 'gamerhouse_categorias'),
          (snapshot) => {
            // If we have categories in Firebase, use them
            if (!snapshot.empty) {
              const firebaseCategories: Category[] = [];
              
              snapshot.forEach((doc) => {
                const data = doc.data();
                const categoryId = doc.id.toLowerCase().replace(/\s+/g, '-');
                const firebaseSubcategorias = data.subcategorias || [];

                // Use Firebase subcategorías if available, otherwise use the mapping
                const subcategorias = firebaseSubcategorias.length > 0
                  ? firebaseSubcategorias
                  : (subcategoriesByCategory[categoryId] || []);

                firebaseCategories.push({
                  id: doc.id,
                  name: data.name || data.nombre || doc.id,
                  active: data.active !== undefined ? data.active : true,
                  icon: categoryIcons[doc.id.toLowerCase()] || '📦',
                  subcategorias
                });
              });

              // Filter only active categories and sort them
              const activeCategories = firebaseCategories
                .filter(cat => cat.active)
                .sort((a, b) => a.name.localeCompare(b.name));

              // Always include "Todos los productos" at the beginning
              const allCategories = [
                defaultCategories[0], // "Todos los productos"
                ...activeCategories
              ];

              setCategories(allCategories);
            } else {
              // If no categories in Firebase, generate from mock products
              const generatedCategories = generateCategoriesFromProducts();
              setCategories(generatedCategories);
            }
            
            setLoading(false);
          },
          (error) => {
            console.error('Error loading categories:', error);
            // Fallback to generated categories from products on error
            const generatedCategories = generateCategoriesFromProducts();
            setCategories(generatedCategories);
            setError('Error al cargar categorías, usando categorías generadas');
            setLoading(false);
          }
        );

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up categories listener:', error);
        // Fallback to generated categories from products
        const generatedCategories = generateCategoriesFromProducts();
        setCategories(generatedCategories);
        setError('Error al cargar categorías, usando categorías generadas');
        setLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };

    const unsubscribe = loadCategories();
    
    // Cleanup function
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        (unsubscribe as any)();
      }
    };
  }, []);

  const refetch = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'gamerhouse_categorias'));
      
      // If we have categories in Firebase, use them
      if (!snapshot.empty) {
        const firebaseCategories: Category[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const categoryId = doc.id.toLowerCase().replace(/\s+/g, '-');
          const firebaseSubcategorias = data.subcategorias || [];

          // Use Firebase subcategorías if available, otherwise use the mapping
          const subcategorias = firebaseSubcategorias.length > 0
            ? firebaseSubcategorias
            : (subcategoriesByCategory[categoryId] || []);

          firebaseCategories.push({
            id: doc.id,
            name: data.name || data.nombre || doc.id,
            active: data.active !== undefined ? data.active : true,
            icon: categoryIcons[doc.id.toLowerCase()] || '📦',
            subcategorias
          });
        });

        const activeCategories = firebaseCategories
          .filter(cat => cat.active)
          .sort((a, b) => a.name.localeCompare(b.name));

        const allCategories = [
          defaultCategories[0],
          ...activeCategories
        ];

        setCategories(allCategories);
      } else {
        // If no categories in Firebase, generate from mock products
        const generatedCategories = generateCategoriesFromProducts();
        setCategories(generatedCategories);
      }
    } catch (error) {
      console.error('Error refetching categories:', error);
      // Fallback to generated categories from products
      const generatedCategories = generateCategoriesFromProducts();
      setCategories(generatedCategories);
      setError('Error al recargar categorías, usando categorías generadas');
    }
  };

  return {
    categories,
    loading,
    error,
    refetch
  };
}