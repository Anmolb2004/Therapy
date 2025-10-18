/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: '#F97316',
        'primary-dark': '#EA580C',
        secondary: '#111827',
        surface: '#1F2937',
        background: '#111827',
        'text-main': '#F9FAFB',
        'text-light': '#9CA3AF',
        'border-color': '#374151',
      }
    },
  },
  plugins: [],
}