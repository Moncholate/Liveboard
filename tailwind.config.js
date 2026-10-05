/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        pop: {
          from: { transform: 'scale(.6)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        pop: 'pop .35s cubic-bezier(.2,.9,.3,1.2) both',
      },
    },
  },
  plugins: [],
}
