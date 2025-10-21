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
        background: '#1A1A1A',
        foreground: '#FFFFFF',
        'brand-primary': '#FF0000', // Pokéball Red
        'brand-primary-hover': '#CC0000',
        'brand-secondary': '#FFD700', // Pokéball Yellow
        'brand-accent': '#0040FF', // Pokémon Blue
        'brand-success': '#4CAF50',
        'brand-neutral-light': '#2A2A2A',
        'brand-neutral-dark': '#0D0D0D',
        'brand-text-secondary': '#A0A0A0',
        // Gaming/Pokémon brand colors
        'gaming-purple': '#A040EB',
        'gaming-dark': '#1A1A1A',
        'gaming-light': '#F0F0F0',
        'pokeball-red': '#FF0000',
        'pokeball-yellow': '#FFD700',
        'pokeball-blue': '#0040FF',
      },
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
