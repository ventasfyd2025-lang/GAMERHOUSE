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
        /* Paleta GAMERHOUSE - Gaming Moderno */
        background: '#ffffff',
        foreground: '#333333',

        /* Colores Primarios */
        'primary': 'var(--color-primary)',           /* Cyan */
        'secondary': 'var(--color-secondary)',       /* Blue */
        'accent': 'var(--color-accent)',             /* Purple */

        /* Estados */
        'success': 'var(--color-success)',           /* Emerald */
        'warning': 'var(--color-warning)',           /* Amber */
        'error': 'var(--color-error)',               /* Red */
        'info': 'var(--color-info)',                 /* Blue */

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

        /* Variantes Individuales */
        'cyan-300': '#06dba3',
        'cyan-400': '#06b6d4',
        'cyan-500': '#0891b2',
        'blue-400': '#60a5fa',
        'blue-500': '#3b82f6',
        'blue-600': '#2563eb',
        'purple-400': '#d8b4fe',
        'purple-500': '#a855f7',
        'purple-600': '#9333ea',
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
