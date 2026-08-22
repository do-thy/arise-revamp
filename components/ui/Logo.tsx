import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../../theme';

interface LogoProps {
  size?: number;
}

/** Crimson square logo with the "A" mark. */
export function Logo({ size = 72 }: LogoProps) {
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: size * 0.24 },
      ]}
    >
      <Text style={[styles.mark, { fontSize: size * 0.5 }]}>A</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  mark: {
    ...typography.display,
    color: colors.textOnPrimary,
  },
});
