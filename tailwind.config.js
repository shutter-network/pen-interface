/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"SF Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Warm neutral scale — light end is bone/paper, dark end shifts into
        // forest-tinted near-black so the same scale carries both light and
        // dark surfaces.
        bone: {
          50:  '#faf7f1',
          100: '#f4f1eb',
          200: '#e5ddd0',
          300: '#d0c5b1',
          400: '#9c9585',
          500: '#6f6b5e',
          600: '#4d4d43',
          700: '#333831',
          800: '#24302a',
          900: '#16201a',
          950: '#0f1512',
        },
        // Accent — mint at the light end, deep forest at the dark end.
        moss: {
          50:  '#eef4f0',
          100: '#d7e5db',
          200: '#b5cebb',
          300: '#8bb096',
          400: '#7db089',
          500: '#56916a',
          600: '#2f5d3f',
          700: '#264c34',
          800: '#1f3d2a',
          900: '#17301f',
          950: '#0f2016',
        },
      },
    },
  },
  plugins: [],
}
