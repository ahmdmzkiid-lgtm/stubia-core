/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B3FAB',
          hover: '#1535A0',
        },
        secondary: {
          DEFAULT: '#0EA5E9',
        },
        accent: {
          DEFAULT: '#F59E0B',
        },
        success: {
          DEFAULT: '#10B981',
        },
        danger: {
          DEFAULT: '#EF4444',
        },
        ai: {
          DEFAULT: '#7C3AED',
          hover: '#6D28D9',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
