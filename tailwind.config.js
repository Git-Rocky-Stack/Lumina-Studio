/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**",
    "!./dist/**",
    "!./server/**",
    "!./App-concept-analytics-1/**",
    "!./Lumina-Studio/**",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          tertiary: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
