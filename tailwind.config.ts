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
        /* Paleta GAMERHOUSE - Amarillo/Rojo/Negro Alto Contraste */
        background: '#000000',
        foreground: '#ffffff',

        /* Colores Primarios */
        'primary': '#FFDE00',                        /* Amarillo Pikachu */
        'secondary': '#E60012',                      /* Rojo Pikachu */
        'accent': '#FFB800',                         /* Amarillo Oscuro */

        /* Estados */
        'success': '#10b981',                        /* Emerald - Éxito */
        'warning': '#f59e0b',                        /* Amber - Advertencia */
        'error': '#E60012',                          /* Rojo Pikachu */
        'info': '#E60012',                           /* Rojo Pikachu */

        /* Fondos Oscuros */
        'bg-darkest': '#000000',                     /* Negro puro */
        'bg-dark-900': '#1a1a1a',                    /* Negro muy oscuro */
        'bg-dark-800': '#2a2a2a',                    /* Negro oscuro */
        'bg-dark-700': '#3a3a3a',                    /* Gris oscuro */
        'bg-950': '#0d0d0d',                         /* Negro ultra oscuro */
        'bg-900': '#0f0f0f',                         /* Negro muy oscuro */

        /* Alias cortos para admin pages */
        'dark': '#1a1a1a',                          /* Negro muy oscuro */
        'dark-light': '#2a2a2a',                    /* Negro oscuro */
        'pink': '#E60012',                          /* Rojo Pikachu */

        /* Texto y Bordes */
        'text-primary': '#ffffff',                   /* Blanco puro */
        'text-secondary': '#e5e5e5',                 /* Gris claro */
        'text-tertiary': '#b0b0b0',                  /* Gris medio */
        'border-default': '#FFDE00',                 /* Amarillo Pikachu */
        'border-light': '#FFB800',                   /* Amarillo Oscuro */

        /* Variantes de Amarillo - Pikachu */
        'yellow-300': '#FFED4E',     /* Amarillo Claro */
        'yellow-400': '#FFDE00',     /* Amarillo Pikachu - Principal */
        'yellow-500': '#FFB800',     /* Amarillo Oscuro - Acentos */
        /* Variantes de Rojo - Pikachu */
        'red-400': '#FF6B6B',        /* Rojo Claro - Hover */
        'red-500': '#FF4444',        /* Rojo Medio */
        'red-600': '#E60012',        /* Rojo Pikachu - Principal */
        'red-700': '#CC0010',        /* Rojo Muy Oscuro */
        /* Variantes Legacy para Compatibilidad */
        'amber-400': '#FFDE00',
        'amber-500': '#FFB800',
        'amber-600': '#FF9500',
        /* Grises */
        'gray-300': '#d1d5db',
        'gray-400': '#9ca3af',
        'gray-500': '#6b7280',
        'gray-600': '#4b5563',
        'gray-700': '#374151',
        'gray-800': '#1f2937',
        'gray-900': '#111827',
        'gray-950': '#030712',
        'slate-700': '#334155',
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
