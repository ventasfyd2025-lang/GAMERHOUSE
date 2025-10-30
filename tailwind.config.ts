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
        'primary': 'var(--color-primary)',           /* Amarillo Dorado Brillante */
        'secondary': 'var(--color-secondary)',       /* Rojo Vivo - Detalles */
        'accent': 'var(--color-accent)',             /* Amarillo Oscuro - Acentos */

        /* Estados */
        'success': 'var(--color-success)',           /* Emerald */
        'warning': 'var(--color-warning)',           /* Amber */
        'error': 'var(--color-error)',               /* Rojo Vivo */
        'info': 'var(--color-info)',                 /* Rojo Vivo - Información */

        /* Fondos Oscuros */
        'bg-darkest': 'var(--color-bg-darkest)',
        'bg-dark-900': 'var(--color-bg-dark-900)',
        'bg-dark-800': 'var(--color-bg-dark-800)',
        'bg-dark-700': 'var(--color-bg-dark-700)',
        'bg-950': 'var(--color-bg-950)',
        'bg-900': 'var(--color-bg-900)',

        /* Alias cortos para admin pages */
        'dark': 'var(--color-bg-dark-900)',         /* #1a1a1a - Negro muy oscuro */
        'dark-light': 'var(--color-bg-dark-800)',   /* #2a2a2a - Negro oscuro */
        'pink': 'var(--color-secondary)',           /* #E60012 - Rojo Pikachu */

        /* Texto y Bordes */
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'border-default': 'var(--color-border)',
        'border-light': 'var(--color-border-light)',

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
