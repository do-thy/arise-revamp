import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

type Variant = 'primary' | 'secondary' | 'tint';

interface PillButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const VARIANT_BG: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.surface,
  tint: colors.accentTint,
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: colors.textOnPrimary,
  secondary: colors.primary,
  tint: colors.primary,
};

/** Rounded "pill" action button used throughout ARISE. */
export function PillButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  accessibilityLabel,
}: PillButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: VARIANT_BG[variant],
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={VARIANT_TEXT[variant]} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: VARIANT_TEXT[variant] }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  label: {
    ...typography.button,
  },
});
