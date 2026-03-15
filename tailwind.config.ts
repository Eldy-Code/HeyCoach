import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Worcester Junior Railers / Rail Dawgs colors
        railers: {
          red: '#C8102E',
          'red-dark': '#A00D24',
          'red-light': '#E8304E',
          black: '#0A0A0A',
          'black-soft': '#1A1A1A',
          'black-card': '#242424',
          white: '#FFFFFF',
          ice: '#E8F4FD',
          'ice-dark': '#C5DFF5',
          silver: '#C0C0C0',
          gold: '#FFD700',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-oswald)', 'Impact', 'sans-serif'],
      },
      backgroundImage: {
        'ice-rink': "url('/ice-texture.svg')",
        'rink-gradient': 'linear-gradient(180deg, #E8F4FD 0%, #C5DFF5 100%)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
        'pulse-red': 'pulseRed 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(200, 16, 46, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(200, 16, 46, 0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
