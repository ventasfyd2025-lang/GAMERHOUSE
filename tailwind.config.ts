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
        'primary': '#00D9FF',
        'primary-dark': '#00B8CC',
        'secondary': '#B819FF',
        'accent': '#00FFB3',
        'success': '#00FF88',
        'dark': '#0A0E27',
        'dark-light': '#1F2937',
        'text-secondary': '#9CA3AF',
        'pink': '#FF006E',
      },
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
