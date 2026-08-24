import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { NormalizedRect, ScannerState } from '../types';
import { colors, spacing, typography } from '../theme';
import { ReticleOverlay } from '../components/ui/ReticleOverlay';
import { PillButton } from '../components/ui/PillButton';
import { BottomSheet } from '../components/ui/BottomSheet';
import { PortalScene, type PortalSceneHandle } from '../components/ar/PortalScene';

// 🚨 TOTAL BYPASS IMPORTS 🚨
// import { initializePaddleOcr, ... } from '../services/ocr/paddleOcr';
// import { getRoomByOcrSearchTerm } from '../services/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'PlacardScanner'>;

export function PlacardScannerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const portalRef = useRef<PortalSceneHandle>(null);

  const [state, setState] = useState<ScannerState>({ phase: 'capture' });
  const [reticle, setReticle] = useState<NormalizedRect | null>(null);
  const [frozenUri, setFrozenUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [arMounted, setArMounted] = useState(false);
  const [trackingReady, setTrackingReady] = useState(false);

  const isArPhase = state.phase === 'arPlacement' || state.phase === 'portal';

  useEffect(() => {
    if (isArPhase) {
      const timer = setTimeout(() => setArMounted(true), 350);
      return () => clearTimeout(timer);
    }
    setArMounted(false);
    setTrackingReady(false);
    setFrozenUri(null);
  }, [isArPhase]);

  const handleReticleRect = useCallback((rect: NormalizedRect) => setReticle(rect), []);

  const handleScan = async () => {
    setState({ phase: 'processing' });
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Tiny delay

      const mockRoom = {
        name: "Computer Laboratory 1",
        buildingName: "Digital Campus",
        description: "Main laboratory for network administration and software development capstones.",
        panoImageUrl: "LOCAL_TEST_LAB", 
        schedule: { currentStatus: "available" },
        occupancy: { capacity: 40, currentCount: 12, facilities: ["Workstations", "Projector"] }
      };

      setState({ phase: 'arPlacement', room: mockRoom as any });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState({ phase: 'capture' });
    }
  };

  const handleClose = () => navigation.goBack();

  const handlePlaced = useCallback(() => {
    setState((prev) =>
      prev.phase === 'arPlacement' ? { phase: 'portal', room: prev.room } : prev,
    );
  }, []);

  const handlePlacePortal = useCallback(() => {
    setPlacementError(null);
    portalRef.current?.placePortal();
  }, []);

  const handlePlacementError = useCallback((message: string) => {
    setPlacementError(message);
  }, []);

  const handleTrackingStateChange = useCallback((ready: boolean) => {
    setTrackingReady(ready);
  }, []);

  const renderBottomUI = () => {
    switch (state.phase) {
      case 'capture':
        return (
          <>
            <View style={styles.instructionPill}>
              <Text style={styles.instructionText}>
                TOTAL BYPASS: Tap to launch the AR engine.
              </Text>
            </View>
            <PillButton title="FORCE AR PORTAL" onPress={handleScan} />
          </>
        );
      case 'processing':
        return (
          <View style={styles.processing}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.processingText}>Initializing 3D Space…</Text>
          </View>
        );
      case 'arPlacement':
      case 'portal':
        return null;
    }
  };

  if (!permission) return <View style={styles.center} />;
  if (!permission.granted) return <View style={styles.center} />;

  const reticleColor = colors.reticleTarget;

  if (arMounted && (state.phase === 'arPlacement' || state.phase === 'portal')) {
    const room = state.room;
    return (
      <View style={styles.flex}>
        <PortalScene
          ref={portalRef}
          room={room}
          onPlaced={handlePlaced}
          onPlacementError={handlePlacementError}
          onTrackingStateChange={handleTrackingStateChange}
        />

        {state.phase === 'arPlacement' ? (
          <View style={styles.arHud} pointerEvents="box-none">
            <View style={styles.crosshairContainer} pointerEvents="none">
              <View style={styles.crosshair}>
                <View style={styles.crosshairH} />
                <View style={styles.crosshairV} />
                <View style={styles.crosshairDot} />
              </View>
            </View>
            <View
              style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}
              pointerEvents="box-none"
            >
              <View style={styles.instructionPill}>
                <Text style={styles.instructionText}>
                  TRACKING OVERRIDDEN: Tap button to forcefully spawn the window 2 meters ahead.
                </Text>
              </View>
              {/* 🚨 BRUTE FORCE BUTTON: disabled constraint completely removed 🚨 */}
              <PillButton
                title="SPAWN WINDOW NOW"
                onPress={handlePlacePortal}
                disabled={false} 
              />
            </View>
          </View>
        ) : (
          <BottomSheet room={room} onClose={handleClose} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <ReticleOverlay color={reticleColor} onReticleRect={handleReticleRect} />
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        {renderBottomUI()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surfaceAlt },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.background },
  permissionText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, gap: spacing.md },
  arHud: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  crosshairContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  crosshair: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  crosshairH: { position: 'absolute', top: 27, width: 56, height: 2, borderRadius: 1, backgroundColor: colors.textOnPrimary },
  crosshairV: { position: 'absolute', left: 27, width: 2, height: 56, borderRadius: 1, backgroundColor: colors.textOnPrimary },
  crosshairDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  instructionPill: { backgroundColor: colors.accentTint, borderRadius: 999, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: 'center' },
  instructionText: { ...typography.body, color: colors.primary, textAlign: 'center', fontWeight: 'bold' },
  processing: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: 999, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  processingText: { ...typography.body, color: colors.textPrimary },
  errorText: { ...typography.caption, color: colors.danger, textAlign: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: spacing.sm },
});