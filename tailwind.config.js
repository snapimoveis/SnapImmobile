/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",           // Varre a raiz (App.tsx, index.tsx)
    "./components/**/*.{js,ts,jsx,tsx}", // Varre a pasta components
    "./services/**/*.{js,ts,jsx,tsx}",   // Varre serviços
    "./utils/**/*.{js,ts,jsx,tsx}"       // Varre utilitários
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          purple: '#623aa2', // Roxo da sua marca
          orange: '#e85d04', // Laranja da sua marca
          'orange-hover': '#d05000',
          gray: {
             50: '#f9fafb',
             100: '#f3f4f6'
          }
        }
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
