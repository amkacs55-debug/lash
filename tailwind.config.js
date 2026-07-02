/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
      colors: {
        cream: '#FAF7F2',
        pink: '#E8BFCF',
        gold: '#C9A86A',
        dark: '#1F1F1F',
      },
    },
  },
  plugins: [],
}
