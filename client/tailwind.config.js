/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060B18',
          900: '#0A1128',
          800: '#0F1E3D',
          700: '#1A2E56',
          600: '#2A4374',
          500: '#3D5E99',
        },
        teal: {
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
        sand: {
          50: '#FAF8F5',
          100: '#F3EFEA',
          200: '#E8E2D8',
          300: '#D5CBBF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'Monaco', 'monospace']
      }
    },
  },
  plugins: [],
}
