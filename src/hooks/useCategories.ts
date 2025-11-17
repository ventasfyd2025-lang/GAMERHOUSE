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

// Generate categories from unique product categories (fallback only)
const generateCategoriesFromProducts = (): Category[] => {
  const uniqueCategories = [...new Set(mockProducts.map(p => p.categoria))];
  const productCategories: Category[] = uniqueCategories
    .filter(cat => cat)
    .map((category) => {
      const categoryId = category.toLowerCase().replace(/\s+/g, '-');
      return {
        id: categoryId,
        name: category,
        active: true,
        icon: categoryIcons[categoryId] || '📦',
        subcategorias: [] // Empty, will be populated from Firebase if available
      };
    });

  return [
    defaultCategories[0], // "Todos los productos"
    ...productCategories
  ];
};

const slugify = (value: string): string => (
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'categoria'
);

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
            if (!snapshot.empty) {
              const categoriesMap = new Map<string, Category>();

              const ensureCategory = (rawName: string, data: Record<string, unknown>) => {
                const normalizedId = slugify((data?.id as string) || rawName);
                if (!categoriesMap.has(normalizedId)) {
                  categoriesMap.set(normalizedId, {
                    id: normalizedId,
                    name: rawName,
                    active: data?.active !== false,
                    icon: categoryIcons[normalizedId] || '📦',
                    subcategorias: [],
                  });
                } else if (typeof rawName === 'string') {
                  const existing = categoriesMap.get(normalizedId)!;
                  existing.name = rawName;
                  existing.active = data?.active !== false;
                }
                return categoriesMap.get(normalizedId)!;
              };

              const pushSubcategory = (
                category: Category,
                rawId: string | undefined,
                rawName: string | undefined,
                activa: boolean | undefined,
              ) => {
                if (!rawName && !rawId) {
                  return;
                }
                const subId = slugify(rawId || rawName || 'sub');
                if (category.subcategorias?.some((sub) => slugify(sub.id) === subId)) {
                  return;
                }
                category.subcategorias = [
                  ...(category.subcategorias ?? []),
                  {
                    id: rawId || subId,
                    nombre: rawName || rawId || subId,
                    activa: activa !== false,
                  },
                ];
              };

              snapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data() as Record<string, unknown>;
                const rawName = (data.name || docSnapshot.id || '').toString();
                const parts = rawName.split('>').map((part) => part.trim()).filter(Boolean);
                const mainName = parts[0] || rawName;
                const subName = parts[1];
                const categoryEntry = ensureCategory(mainName, data);

                const rawSubcategorias = Array.isArray(data.subcategorias) ? data.subcategorias : [];
                rawSubcategorias.forEach((sub, index) => {
                  if (sub?.activa === false) {
                    return;
                  }
                  pushSubcategory(
                    categoryEntry,
                    (sub?.id as string) || `sub-${index}`,
                    (sub?.nombre as string) || (sub?.id as string) || `Subcategoría ${index + 1}`,
                    sub?.activa as boolean | undefined,
                  );
                });

                if (subName) {
                  pushSubcategory(categoryEntry, subName, subName, data.active !== false);
                }
              });

              const activeCategories = Array.from(categoriesMap.values())
                .filter((category) => category.active)
                .sort((a, b) => a.name.localeCompare(b.name));

              setCategories([defaultCategories[0], ...activeCategories]);
            } else {
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

        // Process categories with their subcategories
        snapshot.forEach((doc) => {
          const data = doc.data();
          const fullName = data.name || doc.id;

          // Check if this is a main category (no ">") or subcategory
          if (!fullName.includes('>')) {
            // This is a main category
            const categoryId = fullName.toLowerCase().replace(/\s+/g, '-');

            // Find all subcategories for this main category
            const subcategorias: Array<{ id: string; nombre: string; activa: boolean }> = [];
            snapshot.forEach((subDoc) => {
              const subName = subDoc.data().name || subDoc.id;
              if (subName.includes('>')) {
                const parts = subName.split('>').map((s: string) => s.trim());
                const mainCat = parts[0];
                const subCat = parts[1];
                if (mainCat === fullName) {
                  subcategorias.push({
                    id: subCat.toLowerCase().replace(/\s+/g, '-'),
                    nombre: subCat,
                    activa: true
                  });
                }
              }
            });

            firebaseCategories.push({
              id: categoryId,
              name: fullName,
              active: data.active !== undefined ? data.active : true,
              icon: categoryIcons[categoryId] || '📦',
              subcategorias
            });
          }
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
