/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Charcoal / Navy Industrial Palette
        industrial: {
          950: '#0B0F17', // Base workspace canvas
          900: '#111827', // Card surface
          850: '#161F30', // Elevated card surface
          800: '#1F2937', // Card border / separator
          700: '#374151', // Hover borders / subtle dividers
          600: '#4B5563', // Secondary text
          500: '#6B7280', // Muted text / icons
          400: '#9CA3AF', // Body text (dark)
          300: '#D1D5DB', // Headings (dark)
          200: '#E5E7EB', // Card surface (light)
          100: '#F3F4F6', // Secondary surface (light)
          50: '#F9FAFB',  // Base canvas (light)
        },
        // Apiary Warm Amber / Honey-Gold Accents
        honey: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B', // Primary Brand Honey Gold
          600: '#D97706', // Deep Warm Amber
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        'panel-light': '0 4px 16px -2px rgba(0, 0, 0, 0.05)',
        'glow-amber': '0 0 15px -3px rgba(245, 158, 11, 0.35)',
        'glow-emerald': '0 0 15px -3px rgba(16, 185, 129, 0.35)',
      }
    },
  },
  plugins: [],
}
