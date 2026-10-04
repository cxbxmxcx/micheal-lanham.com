/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // EMERGENT design palette (design.md)
        void: '#0A0908',
        'void-2': '#0F0E0C',
        panel: '#14110D',
        'panel-line': '#2A241B',
        amber: '#E09B4A',
        copper: '#C2703C',
        ember: '#8A4A22',
        teal: '#69B8AF',
        'teal-dim': '#1E5A55',
        'code-green': '#8FBF6A',
        'code-blue': '#5A8FBF',
        ink: '#F2EDE4',
        muted: '#B4AA98',
        faint: '#A59B88',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        container: '1200px',
      },
      borderRadius: {
        card: '14px',
        btn: '10px',
      },
      boxShadow: {
        'glow-amber': '0 0 24px rgba(224,155,74,0.25)',
        'glow-amber-lg': '0 0 28px rgba(224,155,74,0.45)',
        'glow-teal': '0 0 20px rgba(62,158,150,0.22)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.82)' },
        },
        'glow-pulse': {
          '0%, 100%': { filter: 'drop-shadow(0 0 10px rgba(224,155,74,0.45))' },
          '50%': { filter: 'drop-shadow(0 0 18px rgba(224,155,74,0.75))' },
        },
        'cue-dash': {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '45%': { transform: 'scaleY(1)', transformOrigin: 'top' },
          '55%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
        },
        'divider-drift': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(3px, -6px)' },
          '50%': { transform: 'translate(-4px, 2px)' },
          '75%': { transform: 'translate(5px, 4px)' },
        },
        'spark-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 2.4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite alternate',
        'cue-dash': 'cue-dash 1.6s ease-in-out infinite',
        'divider-drift': 'divider-drift 9s ease-in-out infinite',
        'spark-pulse': 'spark-pulse 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
