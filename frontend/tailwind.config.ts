import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pv: {
          obsidian: '#0B0C10',
          surface: '#1C1D26',
          'surface-2': '#252632',
          lime: '#C8FF00',
          red: '#FF3B3B',
          orange: '#FF6A00',
          white: '#F0F0F0',
          muted: '#7A7B8A',
          border: 'rgba(200, 255, 0, 0.13)',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
