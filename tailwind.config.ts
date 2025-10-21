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
        background: '#0A0E27',
        foreground: '#FFFFFF',
        'brand-primary': '#00D9FF', // Cyan Futurista
        'brand-primary-hover': '#00B8CC',
        'brand-secondary': '#B819FF', // Púrpura Neón
        'brand-accent': '#00FFB3', // Verde Neón
        'brand-success': '#00FF88',
        'brand-neutral-light': '#1F2937',
        'brand-neutral-dark': '#0A0E27',
        'brand-text-secondary': '#9CA3AF',
        // Futuristic/Cyberpunk brand colors
        'cyber-blue': '#00D9FF',
        'cyber-purple': '#B819FF',
        'cyber-green': '#00FFB3',
        'cyber-pink': '#FF006E',
        'cyber-dark': '#0A0E27',
        'cyber-light': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
