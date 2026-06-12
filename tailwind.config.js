/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        raleway: ['Raleway', 'sans-serif'],
        orbitron: ['Raleway', 'sans-serif'],
        mono: ['Raleway', 'sans-serif'],
        inter: ['Raleway', 'sans-serif'],
      },
      colors: {
        harmoni: {
          green: '#034543',
          'green-dark': '#023836',
          beige: '#FFFBD5',
        },
        cyber: {
          bg: '#034543',
          panel: '#023836',
          cyan: '#FFFBD5',
          purple: '#c8b878',
          green: '#88c98b',
          red: '#e07a5f',
          amber: '#d4b483',
        },
      },
      animation: {
        'scan-line': 'scanLine 3s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'flicker': 'flicker 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'grid-move': 'gridMove 8s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'data-in': 'dataIn 0.4s ease-out forwards',
      },
      keyframes: {
        scanLine: {
          '0%': { top: '-2px' },
          '100%': { top: '100%' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px #06d6f5, 0 0 20px #06d6f540' },
          '50%': { opacity: '0.7', boxShadow: '0 0 20px #06d6f5, 0 0 40px #06d6f560' },
        },
        flicker: {
          '0%, 95%, 100%': { opacity: '1' },
          '96%': { opacity: '0.7' },
          '97%': { opacity: '1' },
          '98%': { opacity: '0.6' },
          '99%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        gridMove: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 40px' },
        },
        dataIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
