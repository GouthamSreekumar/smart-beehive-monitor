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
        // Natural Apicultural Palette
        honey: {
          50: '#fdfbf7',
          100: '#f9f4ea',
          200: '#f3e7ce',
          300: '#e9d3a7',
          400: '#dcbb7a',
          500: '#cfa253', // Deep natural beeswax gold
          600: '#b8893d',
          700: '#946a2f',
          800: '#755227',
          900: '#5c4122',
        },
        sage: {
          50: '#f4f6f4',
          100: '#e5ebe6',
          200: '#ccd8cd',
          500: '#5f8266',
          700: '#3e5843',
        },
        slate: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#868e96',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
          900: '#121416',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
