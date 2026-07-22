import type { Config } from 'tailwindcss';

import { layout, palette, radii, screens, shadows, statusColors } from './src/shared/design/tokens';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    screens: { ...screens },
    extend: {
      colors: {
        brand: {
          green: palette.green,
          green2: palette.green2,
          green3: palette.green3,
          green4: palette.green4,
          'green-hover': palette.greenHover,
          gold: palette.gold,
          gold2: palette.gold2,
          'gold-ink': palette.goldInk,
          'gold-ink-hover': palette.goldInkHover,
          red: palette.red,
          'red-hover': palette.redHover,
          blue: palette.blue,
          'blue-hover': palette.blueHover,
        },
        surface: palette.surface,
        canvas: palette.bg,
        ink: palette.ink,
        'ink-soft': palette.ink2,
        'ink-subtle': palette.inkSubtle,
        subtle: palette.subtle,
        'subtle-hover': palette.subtleHover,
        muted: palette.muted,
        hairline: palette.border,
        'hairline-subtle': palette.borderSubtle,
        'hairline-faint': palette.borderFaint,
        'header-bg': palette.headerBg,
        'row-hover': palette.rowHover,
        track: palette.track,
        status: {
          'success-bg': statusColors.successBg,
          'success-fg': statusColors.successFg,
          'success-border': statusColors.successBorder,
          'danger-bg': statusColors.dangerBg,
          'danger-fg': statusColors.dangerFg,
          'danger-border': statusColors.dangerBorder,
          'info-bg': statusColors.infoBg,
          'info-fg': statusColors.infoFg,
          'warning-bg': statusColors.warningBg,
          'warning-fg': statusColors.warningFg,
          'neutral-bg': statusColors.neutralBg,
          'neutral-fg': statusColors.neutralFg,
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        control: radii.control,
        field: radii.field,
        card: radii.card,
        modal: radii.modal,
        auth: radii.auth,
      },
      boxShadow: {
        card: shadows.card,
        overlay: shadows.overlay,
        panel: shadows.panel,
        topbar: shadows.topbar,
        toast: shadows.toast,
        focus: shadows.focus,
        field: shadows.field,
      },
      spacing: {
        sidebar: layout.sidebarWidth,
      },
      width: {
        sidebar: layout.sidebarWidth,
      },
      backgroundImage: {
        'brand-gradient': `linear-gradient(135deg, ${palette.green}, ${palette.green2})`,
        'brand-gradient-auth': `linear-gradient(135deg, ${palette.green} 0%, ${palette.green2} 50%, ${palette.green4} 100%)`,
        'brand-gradient-sidebar': `linear-gradient(180deg, ${palette.green} 0%, ${palette.green4} 100%)`,
        'brand-gradient-bar': `linear-gradient(180deg, ${palette.green2}, ${palette.green})`,
        'brand-gradient-progress': `linear-gradient(90deg, ${palette.green}, ${palette.green2})`,
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        shimmer: 'shimmer 1.6s infinite',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
};

export default config;
