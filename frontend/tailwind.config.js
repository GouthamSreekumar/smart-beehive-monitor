/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Agricultural Light Theme Palette
        canvas: '#F7F9F6',
        surface: '#FFFFFF',
        border: {
          light: '#E5EAE3',
          subtle: '#EEF2EC',
          hover: '#D4DDD1',
        },
        primary: {
          50: '#F2F7F3',
          100: '#E1ECE3',
          200: '#C2D9C7',
          300: '#94BA9C',
          400: '#689A72',
          500: '#477A55', // Primary agricultural soft forest green
          600: '#3A6445',
          700: '#2F4F37',
          800: '#273F2D',
          900: '#203425',
        },
        honey: {
          50: '#FDF9F2',
          100: '#FAF0DE',
          200: '#F4E0BD',
          300: '#EBCC94',
          400: '#E2B467',
          500: '#D99A35', // Secondary warm honey amber
          600: '#BF8027',
          700: '#98611E',
          800: '#7B4E1D',
          900: '#66411C',
        },
        ink: {
          primary: '#25352B',   // Dark charcoal for headings and primary text
          secondary: '#5C6C5E', // Medium charcoal for secondary labels
          muted: '#788579',     // Muted sage-grey for captions & timestamps
          faint: '#A4B0A5',     // Very soft text for borders / disabled
        },
        status: {
          success: '#477A55',
          warning: '#E6A23C',
          critical: '#D9534F',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(37, 53, 43, 0.04), 0 1px 2px -1px rgba(37, 53, 43, 0.02)',
        'card-hover': '0 4px 12px 0 rgba(37, 53, 43, 0.06), 0 1px 3px -1px rgba(37, 53, 43, 0.04)',
        'dropdown': '0 10px 25px -5px rgba(37, 53, 43, 0.08), 0 8px 10px -6px rgba(37, 53, 43, 0.04)',
      }
    },
  },
  plugins: [],
}
