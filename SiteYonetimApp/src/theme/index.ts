// 🎨 MERKEZI THEME SYSTEM - Frontend Native ile %100 Uyumlu

export const colors = {
  // Primary Colors
  primary: '#0f766e',
  primaryLight: 'rgba(15, 118, 110, 0.08)',
  primaryDark: '#0d5f57',
  
  // Success Colors
  success: '#22c55e',
  successLight: 'rgba(34, 197, 94, 0.08)',
  successDark: '#16a34a',
  
  // Error/Destructive Colors
  error: '#ef4444',
  errorLight: 'rgba(239, 68, 68, 0.08)',
  errorDark: '#dc2626',
  destructive: '#ef4444',
  destructiveLight: 'rgba(239, 68, 68, 0.08)',
  
  // Warning Colors
  warning: '#f59e0b',
  warningLight: 'rgba(245, 158, 11, 0.08)',
  warningDark: '#d97706',
  
  // Info Colors
  info: '#3b82f6',
  infoLight: 'rgba(59, 130, 246, 0.08)',
  infoDark: '#2563eb',
  
  // Gray Scale
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Slate Scale (for text)
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  
  // Text Colors
  textPrimary: '#020617',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textDisabled: '#cbd5e1',
  
  // Background Colors
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  backgroundTertiary: '#f1f5f9',
  
  // Border Colors
  border: '#e5e7eb',
  borderLight: '#f1f5f9',
  borderDark: '#d1d5db',
  
  // Special Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  
  // Income/Expense
  income: '#22c55e',
  incomeLight: 'rgba(34, 197, 94, 0.08)',
  expense: '#ef4444',
  expenseLight: 'rgba(239, 68, 68, 0.08)',
  
  // Status Colors
  statusActive: '#22c55e',
  statusActiveLight: 'rgba(34, 197, 94, 0.08)',
  statusPending: '#f59e0b',
  statusPendingLight: 'rgba(245, 158, 11, 0.08)',
  statusOverdue: '#ef4444',
  statusOverdueLight: 'rgba(239, 68, 68, 0.08)',
  statusCompleted: '#22c55e',
  statusCompletedLight: 'rgba(34, 197, 94, 0.08)',
  
  // Special UI Colors
  liveDot: '#22c55e',
  liveBg: 'rgba(16, 185, 129, 0.12)',
  liveText: '#16a34a',
  
  // Crown/Premium
  crown: '#f59e0b',
  crownLight: 'rgba(245, 158, 11, 0.08)',
};

export const spacing = {
  // Base spacing (4px grid)
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  
  // Specific spacing values
  cardPadding: 10,
  cardPaddingLg: 12,
  sectionGap: 14,
  listGap: 8,
  rowGap: 12,
  
  // Screen padding
  screenPaddingHorizontal: 16,
  screenPaddingVertical: 16,
  screenPaddingBottom: 32,
  
  // Component spacing
  buttonPaddingHorizontal: 12,
  buttonPaddingVertical: 8,
  inputPaddingHorizontal: 12,
  inputPaddingVertical: 10,
  
  // Icon spacing
  iconMargin: 6,
  iconMarginSm: 4,
  iconMarginLg: 8,
};

export const borderRadius = {
  // Border radius values
  none: 0,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  '3xl': 20,
  '4xl': 24,
  full: 999,
  
  // Component specific
  card: 16,
  cardSm: 14,
  cardLg: 20,
  button: 12,
  buttonSm: 10,
  input: 12,
  inputSm: 10,
  badge: 999,
  pill: 999,
  avatar: 999,
  icon: 12,
  modal: 24,
};

export const fontSize = {
  // Font sizes
  xs: 10,
  sm: 11,
  base: 12,
  md: 13,
  lg: 14,
  xl: 15,
  '2xl': 16,
  '3xl': 18,
  '4xl': 20,
  '5xl': 24,
  '6xl': 28,
  '7xl': 32,
  
  // Component specific
  headerTitle: 18,
  headerSubtitle: 12,
  sectionTitle: 14,
  cardTitle: 14,
  cardSubtitle: 12,
  cardMeta: 11,
  buttonText: 13,
  buttonTextLg: 14,
  inputText: 14,
  labelText: 14,
  hintText: 11,
  badgeText: 11,
  statValue: 18,
  statLabel: 11,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const iconSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 22,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  
  // Component specific
  headerIcon: 24,
  cardIcon: 20,
  buttonIcon: 16,
  listIcon: 18,
  statIcon: 16,
  badgeIcon: 14,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Legacy support - keeping old structure for backward compatibility
export const lightTheme = {
  colors: {
    primary: colors.primary,
    secondary: colors.gray500,
    background: colors.background,
    surface: colors.white,
    error: colors.error,
    text: colors.textPrimary,
    onPrimary: colors.white,
    onSecondary: colors.white,
    onBackground: colors.textPrimary,
    onSurface: colors.textPrimary,
    onError: colors.white,
    disabled: colors.gray300,
    placeholder: colors.gray400,
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: colors.error,
  },
  spacing,
  borderRadius,
  fontSize,
};

// Export everything
export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  iconSize,
  shadows,
  lightTheme,
};
