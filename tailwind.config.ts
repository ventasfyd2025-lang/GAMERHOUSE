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
        background: '#FFFFFF',
        foreground: '#333333',
        'brand-primary': '#003D82', // Azul intenso Hites
        'brand-primary-hover': '#0056B3',
        'brand-secondary': '#FF6B35', // Naranja Hites
        'brand-accent': '#FF1493', // Rosado intenso para descuentos
        'brand-success': '#28A745',
        'brand-neutral-light': '#F5F5F5',
        'brand-neutral-dark': '#333333',
        'brand-text-secondary': '#666666',
        // Hites brand colors
        'hites-strong-blue': '#003D82',
        'hites-orange': '#FF6B35',
        'hites-hot-pink': '#FF1493',
        'hites-text-black': '#333333',
        'hites-text-gray': '#666666',
        'hites-light-gray': '#F5F5F5',
      },
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
