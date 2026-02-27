import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"General Sans"', 'system-ui', 'sans-serif'],
        display: ['"Clash Display"', '"General Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'shimmer': 'shimmer 4s ease-in-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'float-particle': 'floatParticle 20s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { backgroundPosition: '200% center' },
          '50%': { backgroundPosition: '-200% center' },
        },
        breathe: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(255,255,255,0), 0 4px 15px rgba(0,0,0,0.3)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.4)',
          },
        },
        floatParticle: {
          '0%': { transform: 'translateY(100vh) translateX(0)', opacity: '0' },
          '10%': { opacity: '0.6' },
          '90%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-10vh) translateX(80px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
