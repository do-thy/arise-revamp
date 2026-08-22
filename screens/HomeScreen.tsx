import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/ui/Avatar';
import { colors, radii, shadows, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.brand}>ARISE</Text>
        <Pressable onPress={signOut} accessibilityRole="button" accessibilityLabel="Profile">
          <Avatar name={user?.displayName ?? user?.email ?? 'U'} size={40} />
        </Pressable>
      </View>

      <Text style={styles.hero}>
        Where are you{'\n'}
        <Text style={styles.heroAccent}>headed today?</Text>
      </Text>

      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => navigation.navigate('PlacardScanner')}
        accessibilityRole="button"
      >
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>▣</Text>
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>PLACARD SCANNER</Text>
          <Text style={styles.cardSubtitle}>
            Scan a room placard to open its AR portal
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  brand: {
    ...typography.title,
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  hero: {
    ...typography.display,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxxl,
    marginBottom: spacing.xl,
  },
  heroAccent: {
    color: colors.primary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.9,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    ...typography.heading,
    color: colors.primary,
  },
  cardText: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.button,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chevron: {
    ...typography.heading,
    color: colors.textSecondary,
  },
});
