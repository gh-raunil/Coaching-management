/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e5edff',
          200: '#cddbfe',
          300: '#b4c6fc',
          400: '#8da2fb',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#1e293b',
          900: '#16305e',
          950: '#0b162c',
        },
        navy: {
          DEFAULT: '#16305e',
          dark: '#0f172a',
          light: '#2a4374',
        },
        accent: {
          purple: '#7c3aed',
          teal: '#0d9488',
        },
      },
    },
  },
  plugins: [],
};
