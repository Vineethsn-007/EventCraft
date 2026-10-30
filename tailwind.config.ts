import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--bg)',
        ring: 'var(--primary)',
        background: 'var(--bg)',
        foreground: 'var(--on-bg)',
        primary: 'var(--primary)',
        'on-primary': 'var(--on-primary)',
        rose: 'var(--rose)',
        amber: 'var(--amber)',
        teal: 'var(--teal)',
        muted: 'var(--muted)',
        'muted-soft': 'var(--muted-soft)',
        secondary: 'var(--primary)',
        // Legacy palettes remapped onto the design tokens so component
        // classes written for the old light theme follow the active theme.
        white: 'var(--bg-elevated)',
        slate: {
          50: 'var(--bg-soft)',
          100: 'var(--bg-soft)',
          200: 'var(--border)',
          300: 'var(--border)',
          400: 'var(--muted)',
          500: 'var(--muted)',
          600: 'var(--muted)',
          700: 'var(--muted)',
          800: 'var(--on-bg)',
          900: 'var(--on-bg)',
        },
        red: {
          600: 'var(--danger)',
          700: 'var(--danger)',
        },
        brand: {
          50: 'rgba(255, 107, 53, 0.12)',
          600: 'var(--primary)',
          700: 'var(--rose)',
          800: 'var(--brand-strong)',
        },
      },
      borderRadius: {
        pill: '100px',
        lg: '12px',
        md: '8px',
        sm: '6px',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0em' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0em' }],
        md: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      spacing: {
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
        32: '8rem',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}