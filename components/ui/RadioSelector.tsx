import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

export interface RadioOption<T extends string> {
  label: string;
  value: T;
}

interface RadioSelectorProps<T extends string> {
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Segmented "pill" radio selector (e.g. As User / As Admin). */
export function RadioSelector<T extends string>({
  options,
  value,
  onChange,
}: RadioSelectorProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.pill, selected && styles.pillSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    backgroundColor: 'transparent',
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.button,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.textOnPrimary,
  },
});
