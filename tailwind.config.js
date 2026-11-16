/** @type {import('tailwindcss').Config} */
// Tokens come from design/LandEase design system.png (values copied verbatim).
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B10',          // headlines, text
        'ink-pill': '#29282D',   // primary (ink) buttons
        electric: '#2739FF',     // accent, highlight card
        royal: '#3E57D6',        // hero gradient start
        cyan: '#59C5E2',         // hero gradient glow
        'soft-sky': '#5D95D2',   // eyebrow action pill
        sky50: '#EEF6FE',        // icon tiles, notes
        canvas: '#EDF2F8',       // page background
        navy: '#06142E',         // footer, safety bands
        muted: '#5F6470',        // body text
        twotone: '#878E9A',      // headline second half
        sos: '#D92D20',          // SOS and destructive only
        line: '#E2E8F0',         // borders, dividers
        'electric-50': '#EBEEFF',
        'field': '#8C95A4',
      },
      fontFamily: {
        display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '10px', field: '14px', card: '20px', media: '28px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(28,52,104,.06)',
        hover: '0 14px 40px rgba(28,52,104,.10)',
        float: '0 24px 64px rgba(28,52,104,.14)',
        pill: '0 6px 20px rgba(28,52,104,.10)',
      },
      letterSpacing: {
        display: '-0.035em', numeral: '-0.05em', overline: '0.09em', label: '0.06em',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'none' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: {
        'fade-up': 'fadeUp .7s ease-out both',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
}
