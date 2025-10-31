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
        /* Paleta GAMERHOUSE - Sistema Unificado Mejorado */
        background: '#0f1117',
        foreground: '#ffffff',

        /* Colores Primarios - Refinados y Suaves */
        primary: '#FFE88D',                          /* Amarillo Suave - Principal */
        secondary: '#E74444',                        /* Rojo Suave - Secundario */
        accent: '#FFD966',                           /* Amarillo Medio - Acentos */

        /* Estados */
        success: '#10b981',                          /* Emerald - Éxito */
        warning: '#f59e0b',                          /* Amber - Advertencia */
        error: '#E74444',                            /* Rojo Suave */
        info: '#3b82f6',                             /* Blue - Información */

        /* Alias para compatibilidad */
        pink: '#E74444',                             /* Rojo Suave */

        /* Variantes de Amarillo - Sistema Completo */
        'yellow-300': '#FFF3B0',     /* Muy Claro - Accents */
        'yellow-400': '#FFE88D',     /* Suave - Principal */
        'yellow-500': '#FFD966',     /* Medio - Hover/Focus */
        /* Variantes de Rojo - Sistema Completo */
        'red-400': '#FF8080',        /* Muy Claro - Hover */
        'red-500': '#E76666',        /* Claro */
        'red-600': '#E74444',        /* Suave - Principal */
        'red-700': '#C73636',        /* Oscuro */
        /* Variantes Legacy para Compatibilidad */
        'amber-400': '#FFE88D',
        'amber-500': '#FFD966',
        'amber-600': '#FFC547',
        /* Grises - Profesionales */
        'gray-200': '#e5e7eb',
        'gray-300': '#d1d5db',
        'gray-400': '#9ca3af',
        'gray-500': '#6b7280',
        'gray-600': '#4b5563',
        'gray-700': '#3a4452',
        'gray-800': '#2a3142',
        'gray-900': '#1a1f2e',
        'gray-950': '#0f1117',
        'slate-600': '#475569',
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
