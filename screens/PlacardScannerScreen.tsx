import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { NormalizedRect, Room, ScannerState } from '../types';
import { colors, spacing, typography } from '../theme';
import { ReticleOverlay } from '../components/ui/ReticleOverlay';
import { SuggestionPills } from '../components/ui/SuggestionPills';
import { PillButton } from '../components/ui/PillButton';
import { BottomSheet } from '../components/ui/BottomSheet';
import { PortalScene, type PortalSceneHandle } from '../components/ar/PortalScene';
import {
  initializePaddleOcr,
  isPaddleOcrInitialized,
  preparePlacard,
  recognize,
} from '../services/ocr/paddleOcr';
import { PADDLE_OCR_MODELS } from '../services/ocr/models';
import { getRooms } from '../services/firebase';
import { matchRooms } from '../services/matching/fuzzyMatch';

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

  const isArPhase = state.phase === 'arPlacement' || state.phase === 'portal';

  // Camera <-> Viro handoff: delay mounting Viro until the 2D camera has released.
  useEffect(() => {
    if (isArPhase) {
      const timer = setTimeout(() => setArMounted(true), 350);
      return () => clearTimeout(timer);
    }
    setArMounted(false);
  }, [isArPhase]);

  const handleReticleRect = useCallback((rect: NormalizedRect) => setReticle(rect), []);

  const handleScan = async () => {
    if (!cameraRef.current || !reticle) {
      setError('Camera is not ready yet.');
      return;
    }
    setError(null);
    setState({ phase: 'processing' });

    try {
      if (!isPaddleOcrInitialized()) {
        await initializePaddleOcr(PADDLE_OCR_MODELS);
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      const croppedUri = await preparePlacard(photo.uri, reticle, photo.width, photo.height);
      setFrozenUri(croppedUri);

      const results = await recognize(croppedUri);
      const text = results.map((r) => r.text).join(' ').trim();

      const rooms = await getRooms();
      const matches = matchRooms(text, rooms);
      const exact = matches.find((m) => m.isExact);

      if (exact) {
        setState({ phase: 'arPlacement', room: exact.room });
      } else {
        setState({
          phase: 'suggestions',
          normalizedText: text || '(no text recognized)',
          matches,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState({ phase: 'capture' });
    }
  };

  const handleSelectRoom = (room: Room) => {
    setState({ phase: 'arPlacement', room });
  };

  const handleCancel = () => {
    setFrozenUri(null);
    setError(null);
    setState({ phase: 'capture' });
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

  const renderBottomUI = () => {
    switch (state.phase) {
      case 'capture':
        return (
          <>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.instructionPill}>
              <Text style={styles.instructionText}>
                Ensure the entire placard is inside the box.
              </Text>
            </View>
            <PillButton title="SCAN PLACARD" onPress={handleScan} />
          </>
        );
      case 'processing':
        return (
          <View style={styles.processing}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.processingText}>Reading placard…</Text>
          </View>
        );
      case 'suggestions':
        return (
          <SuggestionPills
            normalizedText={state.normalizedText}
            matches={state.matches}
            onSelect={handleSelectRoom}
            onCancel={handleCancel}
          />
        );
      case 'arPlacement':
      case 'portal':
        return null;
    }
  };

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          We need camera access to scan placards and place the AR portal.
        </Text>
        <PillButton title="Grant Camera Access" onPress={() => requestPermission()} />
      </View>
    );
  }

  const reticleColor =
    state.phase === 'suggestions' ? colors.reticleSearch : colors.reticleTarget;

  // Phase C: AR viewfinder (placement HUD) or placed portal (bottom sheet).
  if (arMounted && (state.phase === 'arPlacement' || state.phase === 'portal')) {
    const room = state.room;
    return (
      <View style={styles.flex}>
        <PortalScene
          ref={portalRef}
          room={room}
          onPlaced={handlePlaced}
          onPlacementError={handlePlacementError}
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
              {placementError ? (
                <Text style={styles.errorText}>{placementError}</Text>
              ) : null}
              <View style={styles.instructionPill}>
                <Text style={styles.instructionText}>
                  Stand ~2m from the doorway, aim at the base, and tap to place portal.
                </Text>
              </View>
              <PillButton title="PLACE PORTAL HERE" onPress={handlePlacePortal} />
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

      {frozenUri ? (
        <Image source={{ uri: frozenUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}

      <ReticleOverlay color={reticleColor} onReticleRect={handleReticleRect} />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        {renderBottomUI()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  arHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  crosshairContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshair: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairH: {
    position: 'absolute',
    top: 27,
    width: 56,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textOnPrimary,
  },
  crosshairV: {
    position: 'absolute',
    left: 27,
    width: 2,
    height: 56,
    borderRadius: 1,
    backgroundColor: colors.textOnPrimary,
  },
  crosshairDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  instructionPill: {
    backgroundColor: colors.accentTint,
    borderRadius: 999,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  instructionText: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
  },
  processing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  processingText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.sm,
  },
});


