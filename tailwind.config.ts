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
        /* Paleta GAMER HOUSE - Pikachu Strategy */
        background: '#000000',
        foreground: '#FFFFFF',

        /* Colores Primarios */
        primary: '#FFDE00',                          /* Amarillo Pikachu - Principal */
        secondary: '#E60012',                        /* Rojo Pikachu - Acción */

        /* Variantes de Amarillo */
        'yellow-300': '#FFE533',
        'yellow-400': '#FFDE00',     /* Principal */
        'yellow-500': '#FFB800',     /* Oscuro */

        /* Variantes de Rojo */
        'red-500': '#FF1A1A',
        'red-600': '#E60012',        /* Principal */
        'red-700': '#CC0010',

        /* Grises - Dark Theme */
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

        /* Legacy/Compatibilidad (Mapped to new scheme) */
        'gamerhouse-navy': '#000000',
        'gamerhouse-red': '#E60012',
        'gamerhouse-gold': '#FFDE00',
        'gamerhouse-white': '#FFFFFF',
        'gamerhouse-dark': '#111827',
      },
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
