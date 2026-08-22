import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

/** "or continue with" divider. */
export function Divider({ label = 'or continue with' }: { label?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
