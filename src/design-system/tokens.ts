/**
 * i2A SchoolOS — Enterprise Design Token System
 * Reference: Master Prompt 05 — Design System & Application Shell
 * 
 * Provides centralized tokens for colors, typography, spacing, radius,
 * elevation, and interaction patterns across Light & Dark themes.
 * Optimized for English & Hindi readability and Apple-grade precision.
 */

export const colors = {
  brand: {
    primary: '#4F46E5', // Indigo 600
    primaryHover: '#4338CA', // Indigo 700
    primaryActive: '#3730A3', // Indigo 800
    primaryLight: '#EEF2FF', // Indigo 50
    primaryDark: '#312E81', // Indigo 900
    secondary: '#06B6D4', // Cyan 500
    accent: '#8B5CF6', // Purple 500
  },
  surface: {
    light: {
      background: '#F8FAFC', // Slate 50
      card: '#FFFFFF',
      cardSubdued: '#F1F5F9', // Slate 100
      overlay: 'rgba(15, 23, 42, 0.45)',
      border: '#E2E8F0', // Slate 200
      borderHover: '#CBD5E1', // Slate 300
    },
    dark: {
      background: '#090D16', // Deep Obsidian
      card: '#111827', // Gray 900 / Slate 900
      cardSubdued: '#1E293B', // Slate 800
      overlay: 'rgba(0, 0, 0, 0.70)',
      border: '#1E293B', // Slate 800
      borderHover: '#334155', // Slate 700
    }
  },
  text: {
    light: {
      primary: '#0F172A', // Slate 900
      secondary: '#475569', // Slate 600
      muted: '#94A3B8', // Slate 400
      inverted: '#FFFFFF',
    },
    dark: {
      primary: '#F8FAFC', // Slate 50
      secondary: '#94A3B8', // Slate 400
      muted: '#64748B', // Slate 500
      inverted: '#0F172A',
    }
  },
  status: {
    success: {
      main: '#10B981',
      bgLight: '#ECFDF5',
      textLight: '#065F46',
      borderLight: '#A7F3D0',
      bgDark: '#064E3B',
      textDark: '#6EE7B7',
      borderDark: '#047857'
    },
    warning: {
      main: '#F59E0B',
      bgLight: '#FFFBEB',
      textLight: '#92400E',
      borderLight: '#FDE68A',
      bgDark: '#78350F',
      textDark: '#FCD34D',
      borderDark: '#B45309'
    },
    danger: {
      main: '#EF4444',
      bgLight: '#FEF2F2',
      textLight: '#991B1B',
      borderLight: '#FECACA',
      bgDark: '#7F1D1D',
      textDark: '#FCA5A5',
      borderDark: '#B91C1C'
    },
    info: {
      main: '#3B82F6',
      bgLight: '#EFF6FF',
      textLight: '#1E40AF',
      borderLight: '#BFDBFE',
      bgDark: '#1E3A8A',
      textDark: '#93C5FD',
      borderDark: '#1D4ED8'
    }
  }
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Devanagari', sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  sizes: {
    display: {
      fontSize: '2rem', // 32px
      lineHeight: '2.5rem',
      fontWeight: '700',
    },
    pageTitle: {
      fontSize: '1.5rem', // 24px
      lineHeight: '2rem',
      fontWeight: '600',
    },
    sectionHeading: {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.625rem',
      fontWeight: '600',
    },
    body: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.375rem',
      fontWeight: '400',
    },
    bodyMedium: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.375rem',
      fontWeight: '500',
    },
    caption: {
      fontSize: '0.75rem', // 12px
      lineHeight: '1.125rem',
      fontWeight: '500',
    },
    badge: {
      fontSize: '0.6875rem', // 11px
      lineHeight: '0.875rem',
      fontWeight: '600',
    }
  }
} as const;

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const layout = {
  headerHeight: '64px',
  sidebarWidthExpanded: '256px',
  sidebarWidthCollapsed: '72px',
  maxContainerWidth: '1280px',
  touchTargetMin: '44px',
} as const;

export const radius = {
  none: '0px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
  cardLight: '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
  cardDark: '0 4px 20px rgba(0, 0, 0, 0.4)',
} as const;

export const transitions = {
  fast: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
  normal: '200ms cubic-bezier(0.16, 1, 0.3, 1)',
  slow: '300ms cubic-bezier(0.16, 1, 0.3, 1)',
} as const;
