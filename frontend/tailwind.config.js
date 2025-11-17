/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        profit: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
        },
        loss: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#DC2626',
        },
        neutral: {
          DEFAULT: '#6B7280',
          light: '#9CA3AF',
          dark: '#4B5563',
        },
        primary: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
        },
      },
      animation: {
        'price-flash-up': 'flashUp 0.6s ease-out',
        'price-flash-down': 'flashDown 0.6s ease-out',
      },
      keyframes: {
        flashUp: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
        },
        flashDown: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
        },
      },
    },
  },
  plugins: [],
}
