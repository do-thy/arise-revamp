import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PillButton } from './PillButton';
import { colors, radii, spacing, typography } from '../../theme';
import type { Room, RoomMatch } from '../../types';

interface SuggestionPillsProps {
  normalizedText: string;
  matches: RoomMatch[];
  onSelect: (room: Room) => void;
  onCancel: () => void;
}

function percent(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

/** Phase B "No exact match. Did you mean?" suggestion UI. */
export function SuggestionPills({
  normalizedText,
  matches,
  onSelect,
  onCancel,
}: SuggestionPillsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No exact match. Did you mean?</Text>
      <Text style={styles.subtitle}>
        Read: “{normalizedText}”
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
      >
        {matches.map((match) => (
          <PillButton
            key={match.room.id}
            title={`${match.room.id} - ${percent(match.score)}% Match`}
            variant="tint"
            onPress={() => onSelect(match.room)}
            style={styles.pill}
          />
        ))}
      </ScrollView>

      <PillButton title="Cancel" variant="secondary" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pills: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pill: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
});
