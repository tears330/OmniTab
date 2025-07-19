/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'], // Use class or data-theme attribute for dark mode
  theme: {
    extend: {
      animation: {
        in: 'in 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-from-top-4': 'slide-in-from-top-4 0.2s ease-out',
      },
      keyframes: {
        in: {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top-4': {
          '0%': { transform: 'translateY(-16px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  // eslint-disable-next-line import/no-unresolved, global-require
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark'],
  },
};
