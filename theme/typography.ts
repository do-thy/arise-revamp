import type { TextStyle } from 'react-native';

/**
 * Clean sans-serif type hierarchy (System font, per the wireframes).
 */
export const typography: Record<
  'display' | 'heading' | 'title' | 'body' | 'caption' | 'button',
  TextStyle
> = {
  display: { fontSize: 36, fontWeight: '700', lineHeight: 44 },
  heading: { fontSize: 26, fontWeight: '700', lineHeight: 34 },
  title: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 20 },
};
