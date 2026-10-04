/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)', surface: 'var(--surface)',
        'surface-soft': 'var(--surface-soft)', line: 'var(--line)',
        accent: 'var(--accent)', teal: 'var(--teal)',
        ink: 'var(--ink)', muted: 'var(--muted)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: { container: '1280px' },
      borderRadius: { card: '16px', btn: '10px' },
    },
  },
  plugins: [],
}
