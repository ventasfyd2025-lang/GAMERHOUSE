'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductosModa() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir inmediatamente a la página principal con el filtro de moda
    router.replace('/?category=moda');
  }, [router]);

  // Mostrar un mensaje de carga mientras se redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-primary/80">Cargando productos de moda...</p>
      </div>
    </div>
  );
}