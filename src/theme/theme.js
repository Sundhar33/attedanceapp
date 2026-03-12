import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const colors = {
  primary: '#1565C0',        // main blue
  primaryDark: '#0A3D91',
  secondary: '#1E88E5',

  background: '#F4F6F8',
  surface: '#FFFFFF',

  textPrimary: '#1F2937',
  textSecondary: '#6B7280',

  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#2563EB',

  border: '#E5E7EB',
  disabled: '#9CA3AF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  body: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 12,
    color: colors.textSecondary,
  },
};

export const theme = {
  ...DefaultTheme,
  roundness: radius.md,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    error: colors.danger,
    onPrimary: '#FFFFFF',
    onSurface: colors.textPrimary,
  },
};
