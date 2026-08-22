import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface AvatarProps {
  name?: string | null;
  imageUri?: string | null;
  size?: number;
}

/** Circular profile avatar with an initial fallback. */
export function Avatar({ name, imageUri, size = 40 }: AvatarProps) {
  const initial = (name?.trim().charAt(0) ?? 'U').toUpperCase();

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: colors.accentTint,
  },
  initial: {
    ...typography.title,
    color: colors.primary,
  },
});
