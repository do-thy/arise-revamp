import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ArPortalScene } from '../components/ar/ArPortalScene';
import {
  initializePaddleOcr,
  isPaddleOcrInitialized,
  preparePlacard,
  recognize,
} from '../services/ocr/paddleOcr';
import { PADDLE_OCR_MODELS } from '../services/ocr/models';
import { getRooms } from '../services/firebase';
import { matchRooms } from '../services/matching/fuzzyMatch';
import { createCameraFrameSource } from '../services/tflite/frameSource';
import { useDoorDetector } from '../hooks/useDoorDetector';

type Props = NativeStackScreenProps<RootStackParamList, 'PlacardScanner'>;

export function PlacardScannerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [state, setState] = useState<ScannerState>({ phase: 'capture' });
  const [reticle, setReticle] = useState<NormalizedRect | null>(null);
  const [frozenUri, setFrozenUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalMounted, setPortalMounted] = useState(false);

  const isDoorScan = state.phase === 'doorScan';
  const frameSource = useMemo(() => createCameraFrameSource(cameraRef), []);
  const { detection, error: detectionError } = useDoorDetector(isDoorScan, frameSource);

  // On first high-confidence door detection, advance to the AR portal phase.
  useEffect(() => {
    if (state.phase === 'doorScan' && detection) {
      setState({ phase: 'portal', room: state.room, doorCenter: detection.center });
    }
  }, [detection, state]);

  // Camera <-> Viro handoff: delay mounting Viro until the 2D camera has released.
  useEffect(() => {
    if (state.phase === 'portal') {
      const timer = setTimeout(() => setPortalMounted(true), 350);
      return () => clearTimeout(timer);
    }
    setPortalMounted(false);
  }, [state.phase]);

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

      const croppedUri = await preparePlacard(
        photo.uri,
        reticle,
        photo.width,
        photo.height,
      );
      setFrozenUri(croppedUri);

      const results = await recognize(croppedUri);
      const text = results.map((r) => r.text).join(' ').trim();

      const rooms = await getRooms();
      const matches = matchRooms(text, rooms);
      const exact = matches.find((m) => m.isExact);

      if (exact) {
        setState({ phase: 'doorScan', room: exact.room });
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
    setState({ phase: 'doorScan', room });
  };

  const handleCancel = () => {
    setFrozenUri(null);
    setError(null);
    setState({ phase: 'capture' });
  };

  const handleClose = () => navigation.goBack();

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
      case 'doorScan':
        return (
          <>
            {detectionError ? (
              <Text style={styles.errorText}>{detectionError}</Text>
            ) : null}
            <View style={styles.instructionPill}>
              <Text style={styles.instructionText}>
                Point your camera at the door to reveal information.
              </Text>
            </View>
          </>
        );
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
          We need camera access to scan placards and detect doors.
        </Text>
        <PillButton title="Grant Camera Access" onPress={() => requestPermission()} />
      </View>
    );
  }

  const reticleColor =
    state.phase === 'suggestions' || state.phase === 'doorScan'
      ? colors.reticleSearch
      : colors.reticleTarget;

  // Portal phase: camera fully unmounted, Viro engine mounted.
  if (state.phase === 'portal' && portalMounted) {
    return (
      <View style={styles.flex}>
        <ArPortalScene room={state.room} doorCenter={state.doorCenter} />
        <BottomSheet room={state.room} onClose={handleClose} />
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

