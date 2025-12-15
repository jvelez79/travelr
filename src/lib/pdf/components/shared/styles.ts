/**
 * PDF Styles for Travelr Export
 * Based on the design system (docs/07-design-system.md)
 */

import { StyleSheet } from '@react-pdf/renderer'

// Design system colors
export const colors = {
  // Primary - Teal
  primary: '#0D9488',
  primaryLight: '#CCFBF1',
  primaryDark: '#134E4A',

  // Neutrals
  background: '#F8FAFC',
  foreground: '#0F172A',
  muted: '#64748B',
  mutedLight: '#F1F5F9',
  border: '#E2E8F0',

  // White
  white: '#FFFFFF',

  // Accent
  purple: '#7C3AED',

  // Status colors
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
}

// Common styles
export const styles = StyleSheet.create({
  // Page
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    backgroundColor: colors.white,
  },

  // Typography
  h1: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  h2: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
    marginBottom: 6,
  },
  h3: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
    marginBottom: 4,
  },
  h4: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
    marginBottom: 2,
  },
  text: {
    fontSize: 10,
    color: colors.foreground,
    lineHeight: 1.5,
  },
  textSmall: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.4,
  },
  textMuted: {
    fontSize: 10,
    color: colors.muted,
    lineHeight: 1.5,
  },

  // Layout
  row: {
    flexDirection: 'row',
  },
  col: {
    flexDirection: 'column',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },

  // Components
  badge: {
    backgroundColor: colors.primaryLight,
    color: colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },

  // Tables
  table: {
    width: '100%',
    marginVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.mutedLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 10,
    color: colors.foreground,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: colors.muted,
  },

  // Page number
  pageNumber: {
    fontSize: 8,
    color: colors.muted,
  },
})

// Helper to create consistent spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
}
