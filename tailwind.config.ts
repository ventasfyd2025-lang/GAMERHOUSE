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
        /* Paleta GAMERHOUSE - Pikachu Amarillo y Negro */
        background: '#0a0a0a',
        foreground: '#ffffff',

        /* Colores Primarios */
        'primary': 'var(--color-primary)',           /* Amarillo Pikachu */
        'secondary': 'var(--color-secondary)',       /* Naranja-Rojo */
        'accent': 'var(--color-accent)',             /* Amarillo Oscuro */

        /* Estados */
        'success': 'var(--color-success)',           /* Emerald */
        'warning': 'var(--color-warning)',           /* Amber */
        'error': 'var(--color-error)',               /* Red */
        'info': 'var(--color-info)',                 /* Naranja-Rojo */

        /* Fondos Oscuros */
        'bg-darkest': 'var(--color-bg-darkest)',
        'bg-dark-900': 'var(--color-bg-dark-900)',
        'bg-dark-800': 'var(--color-bg-dark-800)',
        'bg-dark-700': 'var(--color-bg-dark-700)',
        'bg-950': 'var(--color-bg-950)',
        'bg-900': 'var(--color-bg-900)',

        /* Texto y Bordes */
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'border-default': 'var(--color-border)',
        'border-light': 'var(--color-border-light)',

        /* Variantes Individuales - Amarillo */
        'yellow-300': '#FFE573',
        'yellow-400': '#FFED4E',
        'yellow-500': '#FFB700',
        /* Variantes Individuales - Naranja */
        'orange-400': '#FF8C42',
        'orange-500': '#FF6B35',
        'orange-600': '#E55100',
        /* Variantes Individuales - Amber */
        'amber-400': '#FFD700',
        'amber-500': '#FFB700',
        'amber-600': '#FFA500',
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
