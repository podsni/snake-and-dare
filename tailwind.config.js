/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        grape: '#7950F2',
        candy: '#FF5C9D',
        sky: '#4DABF7',
        leaf: '#51CF66',
        sun: '#FFD43B',
        cream: '#F8F5FF',
        ink: '#2B2144',
      },
      fontFamily: {
        display: ['Fredoka', 'Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 16px 40px rgba(121, 80, 242, 0.14)',
        pop: '0 8px 0 rgba(43, 33, 68, 0.12)',
      },
    },
  },
  plugins: [],
}
