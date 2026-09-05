/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],

  // Preflight is off: its global resets (notably on headings, lists and form
  // controls) conflict with Angular Material's component styles. The resets we
  // do want live in src/styles/_tokens.scss.
  corePlugins: {
    preflight: false,
  },

  theme: {
    extend: {
      // Channel-triplet tokens keep opacity modifiers working: `bg-primary/10`.
      colors: {
        primary: 'rgb(var(--nx-color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--nx-color-secondary) / <alpha-value>)',
        success: 'rgb(var(--nx-color-success) / <alpha-value>)',
        warning: 'rgb(var(--nx-color-warning) / <alpha-value>)',
        danger: 'rgb(var(--nx-color-danger) / <alpha-value>)',
        background: 'rgb(var(--nx-color-background) / <alpha-value>)',
        surface: 'rgb(var(--nx-color-surface) / <alpha-value>)',
        'border-subtle': 'rgb(var(--nx-color-border) / <alpha-value>)',
        content: 'rgb(var(--nx-color-text) / <alpha-value>)',
        'content-secondary': 'rgb(var(--nx-color-text-secondary) / <alpha-value>)',

        // WCAG-AA-safe steps for coloured TEXT. The fill tokens above fail as
        // small text on Surface; use these with text-* utilities.
        'primary-text': 'rgb(var(--nx-color-primary-text) / <alpha-value>)',
        'secondary-text': 'rgb(var(--nx-color-secondary-text) / <alpha-value>)',
        'success-text': 'rgb(var(--nx-color-success-text) / <alpha-value>)',
        'warning-text': 'rgb(var(--nx-color-warning-text) / <alpha-value>)',
        'danger-text': 'rgb(var(--nx-color-danger-text) / <alpha-value>)',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },

      // Spec 6 radius scale.
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },

      // Spec 6 elevation scale.
      boxShadow: {
        sm: 'var(--nx-shadow-sm)',
        md: 'var(--nx-shadow-md)',
        lg: 'var(--nx-shadow-lg)',
      },
    },
  },

  plugins: [],
};
