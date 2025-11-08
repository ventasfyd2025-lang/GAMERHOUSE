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
        /* Paleta GAMER HOUSE - Light Theme Nuevo */
        background: '#ffffff',
        foreground: '#000000',

        /* Colores Primarios - Nuevo Esquema */
        primary: '#dc2626',                          /* Rojo Brillante - Principal */
        secondary: '#1e3a5f',                        /* Azul Marino - Secundario */
        accent: '#fbbf24',                           /* Oro/Amarillo - Acentos */

        /* Estados */
        success: '#10b981',                          /* Emerald - Éxito */
        warning: '#f59e0b',                          /* Amber - Advertencia */
        error: '#dc2626',                            /* Rojo Brillante */
        info: '#1e3a5f',                             /* Azul Marino - Información */

        /* Colores Corporativos GAMER HOUSE */
        'gamerhouse-navy': '#1e3a5f',               /* Azul Marino */
        'gamerhouse-red': '#dc2626',                /* Rojo Brillante */
        'gamerhouse-gold': '#fbbf24',               /* Oro */
        'gamerhouse-white': '#ffffff',              /* Blanco */
        'gamerhouse-dark': '#1f2937',               /* Gris Oscuro */

        /* Variantes de Rojo */
        'red-400': '#f87171',        /* Claro - Hover */
        'red-500': '#ef4444',        /* Medio */
        'red-600': '#dc2626',        /* Principal */
        'red-700': '#b91c1c',        /* Oscuro */

        /* Variantes de Azul */
        'blue-600': '#1e3a5f',       /* Azul Marino Principal */
        'blue-700': '#1a2e47',       /* Más Oscuro */

        /* Variantes de Oro */
        'yellow-300': '#fcd34d',     /* Claro */
        'yellow-400': '#fbbf24',     /* Principal */
        'yellow-500': '#f59e0b',     /* Medio */

        /* Grises - Para tema claro */
        'gray-100': '#f3f4f6',
        'gray-200': '#e5e7eb',
        'gray-300': '#d1d5db',
        'gray-400': '#9ca3af',
        'gray-500': '#6b7280',
        'gray-600': '#4b5563',
        'gray-700': '#374151',
        'gray-800': '#1f2937',
        'gray-900': '#111827',
        'gray-950': '#030712',
      },
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
