/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff5f7',
          100: '#ffd9da',
          200: '#ffb8c0',
          300: '#ff97a6',
          400: '#f27a90',
          500: '#ea638c',
          600: '#c94a73',
          700: '#a83259',
          800: '#89023e',
          900: '#6b0131',
          950: '#4a0022',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
