/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfaf4',
          100: '#faf3e0',
          200: '#f5e6c0',
          300: '#edd99a',
          400: '#e3c574',
          500: '#d4a843',
        },
        wood: {
          50: '#fdf8f3',
          100: '#f5e8d0',
          200: '#e8c99a',
          300: '#d4a574',
          400: '#b8804a',
          500: '#8b5e3c',
          600: '#6b4226',
          700: '#4a2c14',
          800: '#2d1a08',
          900: '#1a0f04',
        },
        gold: {
          100: '#fef9e7',
          200: '#fcefc4',
          300: '#f9e08a',
          400: '#f4c842',
          500: '#e6a817',
          600: '#c4880a',
          700: '#9a6a06',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Lato"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideIn: { from: { transform: 'translateX(-20px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
      }
    },
  },
  plugins: [],
}
