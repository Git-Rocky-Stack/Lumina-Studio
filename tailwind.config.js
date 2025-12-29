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
          soft: 'rgba(99, 102, 241, 0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      // Extended border-radius scale for premium UI
      borderRadius: {
        '4xl': '2rem',    // 32px - Modals, major containers
        '5xl': '2.5rem',  // 40px - Hero sections
        '6xl': '3rem',    // 48px - Statement containers
      },
      // Extended font sizes for micro typography
      fontSize: {
        'micro': ['0.625rem', { lineHeight: '1', letterSpacing: '0.2em' }],
        'micro-sm': ['0.5625rem', { lineHeight: '1', letterSpacing: '0.2em' }],
      },
      // Extended letter-spacing for design consistency
      letterSpacing: {
        'mega': '0.4em',
        'ultra': '0.3em',
        'wide': '0.2em',
      },
      // Semantic shadow scale
      boxShadow: {
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
        'elevated': '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.06), 0 8px 16px rgba(0, 0, 0, 0.04)',
        'prominent': '0 8px 16px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.1), 0 24px 48px rgba(0, 0, 0, 0.06)',
        'dramatic': '0 16px 32px rgba(0, 0, 0, 0.1), 0 32px 64px rgba(0, 0, 0, 0.12), 0 48px 96px rgba(0, 0, 0, 0.08)',
        'glow-subtle': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-elevated': '0 0 40px rgba(99, 102, 241, 0.25)',
        'glow-prominent': '0 0 60px rgba(99, 102, 241, 0.35)',
        'accent-subtle': '0 4px 12px rgba(99, 102, 241, 0.15)',
        'accent-elevated': '0 8px 24px rgba(99, 102, 241, 0.25)',
        'accent-prominent': '0 12px 40px rgba(99, 102, 241, 0.35)',
        'inner-subtle': 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
        'inner-deep': 'inset 0 4px 12px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
