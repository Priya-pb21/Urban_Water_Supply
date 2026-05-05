/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        water: {
          50: '#ecfeff',
          100: '#cffafe',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          900: '#164e63'
        },
        ink: '#07111f'
      },
      boxShadow: {
        glow: '0 20px 60px rgba(6, 182, 212, 0.22)'
      }
    }
  },
  plugins: []
};
