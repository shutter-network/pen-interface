/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"SF Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Neutral scale — 50 is near-white (body), 950 is Shutter black.
        bone: {
          50:  '#f5f7f8',
          100: '#e8edef',
          200: '#cbd6dc',
          300: '#9fb2bd',
          400: '#6d8493',
          500: '#4a6273',
          600: '#2f4655',
          700: '#1e3140',
          800: '#0f202c',
          900: '#071620',
          950: '#051016',
        },
        // Shutter yellow (--color--yellow #fde12d).
        moss: {
          50:  '#fffce6',
          100: '#fff7b3',
          200: '#ffee66',
          300: '#ffe640',
          400: '#ffe12d',
          500: '#fde12d',
          600: '#d9c020',
          700: '#a89210',
          800: '#74650a',
          900: '#4a4106',
          950: '#1a1701',
        },
        // Shutter blue (--color--blue #0044a4) — used for the sidebar / brand
        // surfaces on shutter.network.
        brand: {
          50:  '#e6eeff',
          100: '#c2d5ff',
          200: '#8fb2ff',
          300: '#5c8fff',
          400: '#296cff',
          500: '#0057db',
          600: '#0044a4',
          700: '#003580',
          800: '#00265c',
          900: '#001a3d',
          950: '#000d1f',
        },
      },
    },
  },
  plugins: [],
}
