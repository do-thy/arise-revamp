import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { Room, RoomStatus } from '../../types';

interface BottomSheetProps {
  room: Room;
  onClose: () => void;
}

const STATUS_LABEL: Record<RoomStatus, string> = {
  available: 'Available now',
  occupied: 'Occupied',
  reserved: 'Reserved',
};

/** Slide-up information sheet; tapping expands to full occupancy/facility details. */
export function BottomSheet({ room, onClose }: BottomSheetProps) {
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close room details"
      >
        <View style={styles.handle} />
      </Pressable>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            {/* Fallback to roomName if name isn't mapped properly */}
            <Text style={styles.title}>{room.name || (room as any).roomName}</Text>
            
            {/* Safely check if schedule and currentStatus exist */}
            {room.schedule?.currentStatus ? (
              <Text style={styles.status}>
                {STATUS_LABEL[room.schedule.currentStatus]}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.details}>
          {/* Safely check for building or buildingName */}
          {room.building || (room as any).buildingName ? (
             <Row label="Building" value={room.building || (room as any).buildingName} />
          ) : null}
          
          {room.floor ? <Row label="Floor" value={room.floor} /> : null}
          
          {room.description ? (
            <View style={styles.descriptionBlock}>
              <Text style={styles.rowLabel}>Description</Text>
              <Text style={styles.descriptionText}>{room.description}</Text>
            </View>
          ) : null}
          
          {/* Safely check occupancy object */}
          {room.occupancy?.capacity && room.occupancy.capacity > 0 ? (
            <Row
              label="Occupancy"
              value={`${room.occupancy.currentCount || 0} / ${room.occupancy.capacity}`}
            />
          ) : null}
          
          {/* Safely check schedule object */}
          {room.schedule?.currentEvent ? (
            <Row label="Now" value={room.schedule.currentEvent} />
          ) : null}
          
          {room.schedule?.nextEvent ? (
            <Row
              label="Next"
              value={`${room.schedule.nextEvent}${
                room.schedule.nextEventTime ? ` · ${room.schedule.nextEventTime}` : ''
              }`}
            />
          ) : null}
          
          {/* Safely check facilities array length */}
          {room.occupancy?.facilities?.length ? (
            <Row label="Facilities" value={room.occupancy.facilities.join(', ')} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sheet,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    gap: spacing.xs,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  status: {
    ...typography.body,
    color: colors.primary,
  },
  close: {
    ...typography.title,
    color: colors.textSecondary,
  },
  details: {
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  descriptionBlock: {
    gap: spacing.xs,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
});