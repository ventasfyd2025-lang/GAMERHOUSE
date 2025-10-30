import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      colors: {
        /* Paleta GAMERHOUSE - Amarillo/Rojo Mejorada (menos pesada) */
        background: '#0f1117',
        foreground: '#ffffff',

        /* Colores Primarios - Más suaves */
        primary: '#FFE88D',                          /* Amarillo Suave */
        secondary: '#E74444',                        /* Rojo Más Suave */
        accent: '#FFD966',                           /* Amarillo Acentos */

        /* Estados */
        success: '#10b981',                          /* Emerald - Éxito */
        warning: '#f59e0b',                          /* Amber - Advertencia */
        error: '#E74444',                            /* Rojo Suave */
        info: '#E74444',                             /* Rojo Suave */

        /* Alias para admin pages - usando colores nativos de Tailwind */
        pink: '#E74444',                             /* Rojo Suave */

        /* Variantes de Amarillo - Más Suaves */
        'yellow-300': '#FFF3B0',     /* Amarillo Muy Claro */
        'yellow-400': '#FFE88D',     /* Amarillo Suave - Principal */
        'yellow-500': '#FFD966',     /* Amarillo Medio - Acentos */
        /* Variantes de Rojo - Más Suaves */
        'red-400': '#FF8080',        /* Rojo Muy Claro - Hover */
        'red-500': '#E76666',        /* Rojo Claro */
        'red-600': '#E74444',        /* Rojo Suave - Principal */
        'red-700': '#C73636',        /* Rojo Oscuro */
        /* Variantes Legacy para Compatibilidad */
        'amber-400': '#FFE88D',
        'amber-500': '#FFD966',
        'amber-600': '#FFC547',
        /* Grises - Más Claros */
        'gray-300': '#d1d5db',
        'gray-400': '#9ca3af',
        'gray-500': '#6b7280',
        'gray-600': '#4b5563',
        'gray-700': '#3a4452',
        'gray-800': '#2a3142',
        'gray-900': '#1a1f2e',
        'gray-950': '#0f1117',
        'slate-700': '#2d3748',
        'slate-800': '#1e293b',
        'slate-900': '#0f172a',
      },
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
