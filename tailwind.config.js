/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f6',
          100: '#fce7ef',
          200: '#fbd0e0',
          300: '#f7aac8',
          400: '#f076a5',
          500: '#e34d85',
          600: '#cc2f68',
          700: '#a92053', // primary — AA contrast with white text (≈6.96:1)
          800: '#861c46',
          900: '#701a3d',
          950: '#3f0a20',
        },
        gold: {
          400: '#e8c477',
          500: '#d4a94f',
          600: '#b3873a',
        },
        ink: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9de',
          300: '#b6b6bf',
          400: '#8c8c99',
          500: '#6b6b78',
          600: '#535360', // AA on white (≈7.57:1)
          700: '#3f3f4a',
          800: '#28282f',
          900: '#18181d',
        },
      },
      fontFamily: {
        sans: [
          'Tahoma',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Geeza Pro',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        popover: '0 8px 24px -4px rgb(0 0 0 / 0.12), 0 2px 8px -2px rgb(0 0 0 / 0.08)',
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
