import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { colors } from '../../theme';
import type { NormalizedRect } from '../../types';

interface ReticleOverlayProps {
  /** Corner-bracket color: `reticleTarget` (red) or `reticleSearch` (yellow). */
  color?: string;
  /** Reports the reticle rect as a fraction (0..1) of the camera viewport. */
  onReticleRect?: (rect: NormalizedRect) => void;
}

const BRACKET = 30;
const BRACKET_THICKNESS = 4;

/**
 * Full-screen semi-transparent mask with a centered transparent window framed by
 * high-contrast corner brackets (blueprint §5.1 viewfinder frame).
 */
export function ReticleOverlay({
  color = colors.reticleTarget,
  onReticleRect,
}: ReticleOverlayProps) {
  const { width, height } = useWindowDimensions();

  const rect = useMemo(() => {
    const w = Math.min(width * 0.84, 460);
    const h = w * 0.56;
    return {
      x: (width - w) / 2,
      y: height * 0.32,
      width: w,
      height: h,
    };
  }, [width, height]);

  useEffect(() => {
    if (width === 0 || height === 0) return;
    onReticleRect?.({
      x: rect.x / width,
      y: rect.y / height,
      width: rect.width / width,
      height: rect.height / height,
    });
  }, [rect, width, height, onReticleRect]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* dark mask panels around the transparent reticle */}
      <View style={[styles.mask, { top: 0, left: 0, right: 0, height: rect.y }]} />
      <View
        style={[styles.mask, { top: rect.y + rect.height, left: 0, right: 0, bottom: 0 }]}
      />
      <View style={[styles.mask, { top: rect.y, height: rect.height, left: 0, width: rect.x }]} />
      <View
        style={[
          styles.mask,
          { top: rect.y, height: rect.height, left: rect.x + rect.width, right: 0 },
        ]}
      />

      {/* corner brackets */}
      <View style={[styles.bracket, { top: rect.y, left: rect.x }, styles.topLeft, { borderColor: color }]} />
      <View style={[styles.bracket, { top: rect.y, right: rect.x }, styles.topRight, { borderColor: color }]} />
      <View style={[styles.bracket, { bottom: height - rect.y - rect.height, left: rect.x }, styles.bottomLeft, { borderColor: color }]} />
      <View style={[styles.bracket, { bottom: height - rect.y - rect.height, right: rect.x }, styles.bottomRight, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    backgroundColor: colors.mask,
  },
  bracket: {
    position: 'absolute',
    width: BRACKET,
    height: BRACKET,
  },
  topLeft: { borderTopWidth: BRACKET_THICKNESS, borderLeftWidth: BRACKET_THICKNESS },
  topRight: { borderTopWidth: BRACKET_THICKNESS, borderRightWidth: BRACKET_THICKNESS },
  bottomLeft: { borderBottomWidth: BRACKET_THICKNESS, borderLeftWidth: BRACKET_THICKNESS },
  bottomRight: { borderBottomWidth: BRACKET_THICKNESS, borderRightWidth: BRACKET_THICKNESS },
});
