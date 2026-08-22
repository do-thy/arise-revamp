/**
 * ARISE color palette.
 * Derived from the UI wireframes (off-white/cream background, deep crimson primary,
 * soft rose tint, high-contrast reticle states).
 */
export const colors = {
  background: '#FDFBF7',
  surfaceAlt: '#FAFAFA',
  surface: '#FFFFFF',
  primary: '#9E001D',
  primaryDeep: '#A3001E',
  accentTint: '#FDECEF',
  reticleSearch: '#FFCC00',
  reticleTarget: '#E60000',
  mask: 'rgba(0, 0, 0, 0.6)',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textOnPrimary: '#FFFFFF',
  border: '#EDE8E0',
  success: '#2E7D32',
  danger: '#B00020',
} as const;

export type AppColors = typeof colors;
