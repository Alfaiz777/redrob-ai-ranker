/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3525cd',
        'primary-dark': '#2a1fa8',
        'primary-light': '#4f46e5',
        'primary-container': '#e2dfff',
        secondary: '#006c49',
        'secondary-container': '#6ffbbe',
        tertiary: '#571ac0',
        'tertiary-container': '#e9ddff',
        surface: '#f9f9ff',
        'surface-low': '#f0f3ff',
        'surface-container': '#e7eefe',
        'surface-high': '#e2e8f8',
        'on-surface': '#151c27',
        'on-surface-variant': '#464555',
        'outline-variant': '#c7c4d8',
        outline: '#777587',
      },
      fontFamily: {
        display: ['Geist', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
