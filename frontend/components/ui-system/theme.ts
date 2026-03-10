/**
 * Medoflow centralized design tokens.
 * Use these values for consistent styling across the app.
 */

export const theme = {
  colors: {
    primary: '#0F172A',
    accent: '#2563EB',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
    muted: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    // Primary scale for compatibility (primary-600 = accent for CTAs)
    primaryScale: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#2563EB', // CTA color (accent)
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#0F172A',
    },
  },
  radius: {
    lg: '16px',
    md: '12px',
    sm: '8px',
  },
  spacing: {
    page: '1.5rem', // 24px = p-6
    section: '1.5rem', // space-y-6
    card: '1.5rem', // p-6
  },
  shadow: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
  },
} as const;

export type Theme = typeof theme;
