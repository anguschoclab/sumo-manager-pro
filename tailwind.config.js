/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0f14',
        panel: '#0f1720',
        brand: { 50: '#ebf5ff', 500: '#3b82f6', 600: '#2563eb' }
      },
      boxShadow: { card: '0 8px 24px rgba(0,0,0,0.25)' }
    },
  },
  plugins: [],
}
