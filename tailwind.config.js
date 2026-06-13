/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#7F77DD', light: '#EEEDFE', dark: '#3C3489' },
        gold: { DEFAULT: '#EF9F27', light: '#FAEEDA', dark: '#633806' },
      }
    }
  },
  plugins: []
}
