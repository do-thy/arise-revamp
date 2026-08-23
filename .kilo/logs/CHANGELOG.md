# ARISE — Progress Changelog

> Human-readable log of all system modifications. Maintained per `.clinerules`.

---

- **Timestamp:** 2026-08-22 12:00
- **Feature / Component:** Architecture Blueprint & Project Baseline
- **Changes Made:** Analyzed the pristine Expo SDK 57 repository, verified versioned APIs
  (expo-camera, expo-secure-store, react-native-fast-tflite v3, @reactvision/react-viro v2,
  firebase v12, fuse.js v7), and authored the Three-Tier architecture blueprint. Documented
  data structures, the scanner state machine (capture → processing → suggestions/doorScan →
  portal), the camera resource-handoff lifecycle, and the full directory layout.
- **Files Affected:** `.kilo/rules/blueprint.md`, `.kilo/logs/CHANGELOG.md`
- **Manual Actions Required by Developer:** None

---

- **Timestamp:** 2026-08-22 12:20
- **Feature / Component:** Native & Environment Configuration
- **Changes Made:** Configured the Expo SDK 57 project for a custom dev client (`npx expo prebuild`). Added config plugins for `expo-camera`, `expo-secure-store`, `react-native-fast-tflite` (Android GPU libs), `@reactvision/react-viro` (AR mode + iOS usage permissions), and `@react-native-google-signin/google-signin`; added CAMERA permission and iOS Info.plist usage strings. Added `metro.config.js` with `tflite`/`obj`/`mtl`/`gltf`/`glb`/`fbx`/`hdr`/`bin`/`onnx` asset extensions. Created `.env.example`, switched scripts to `expo run:android|ios`, and installed all runtime dependencies (firebase v12, fuse.js, react-navigation v7, google-signin, onnxruntime-react-native, react-native-fast-tflite v3, @reactvision/react-viro v2, expo-camera/secure-store/linear-gradient/image-manipulator/file-system/asset, async-storage, screens, safe-area-context).
- **Files Affected:** `app.json`, `metro.config.js`, `.env.example`, `package.json`, `package-lock.json`
- **Manual Actions Required by Developer:** Populate `.env` from `.env.example` (EXPO_PUBLIC_FIREBASE_*). Run `npx expo prebuild` before building.

---

- **Timestamp:** 2026-08-22 12:30
- **Feature / Component:** Design System, Shared Types & Constants
- **Changes Made:** Implemented the wireframe design tokens (cream background `#FDFBF7`, crimson `#9E001D`, rose tint `#FDECEF`, reticle red/yellow, card surfaces) in `theme/`, the Three-Tier shared data structures (`Room`, `RoomMatch`, `DoorDetection`, `ScannerState` discriminated union, `NormalizedRect`, `AppUser`) in `types/`, ambient declarations for binary model assets, and validated env readers in `constants/`.
- **Files Affected:** `theme/colors.ts`, `theme/typography.ts`, `theme/spacing.ts`, `theme/index.ts`, `types/index.ts`, `types/modules.d.ts`, `constants/env.ts`, `constants/index.ts`
- **Manual Actions Required by Developer:** None

---

- **Timestamp:** 2026-08-22 12:40
- **Feature / Component:** Data & Storage Tier (Firebase, SecureStore, Fuzzy Matching)
- **Changes Made:** Implemented Firebase initialization with AsyncStorage-backed auth persistence (Firebase v12 RN build cast for `getReactNativePersistence`), email/password + Google auth + sign-out, Firestore room queries (`getRooms`/`getRoomById`), SecureStore session bootstrap with web fallback, and the fuzzy matching engine (normalization, Fuse.js search, Levenshtein fallback, exact-match detection).
- **Files Affected:** `services/firebase/config.ts`, `services/firebase/auth.ts`, `services/firebase/rooms.ts`, `services/firebase/index.ts`, `services/storage/secureStore.ts`, `services/matching/fuzzyMatch.ts`
- **Manual Actions Required by Developer:** Firebase project + `EXPO_PUBLIC_FIREBASE_*` env vars; for Google sign-in also `google-services.json` (Android), `GoogleService-Info.plist` (iOS), and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

---

- **Timestamp:** 2026-08-22 12:50
- **Feature / Component:** AI/CV Tier (PaddleOCR, TFLite Door Detection)
- **Changes Made:** Built the OCR pipeline (ONNX session loading via onnxruntime-react-native, `use_angle_cls` + `det_db_unclip_ratio: 2.0` config, image crop helper, and the pure vertical-text spatial sorter), and the door detector (fast-tflite v3 model loader, MobileNet-SSD 4-tensor decode, 0.80 confidence gate) plus a throttled detection loop hook and a camera frame source.
- **Files Affected:** `services/ocr/types.ts`, `services/ocr/verticalSorter.ts`, `services/ocr/crop.ts`, `services/ocr/paddleOcr.ts`, `services/ocr/models.ts`, `services/tflite/types.ts`, `services/tflite/doorDetector.ts`, `services/tflite/frameSource.ts`, `hooks/useDoorDetector.ts`
- **Manual Actions Required by Developer:** Place `det_model.onnx`, `rec_model.onnx`, `cls_model.onnx`, `door_detector.tflite`, and `door_frame.obj` (+ `.mtl`/textures) in `assets/models/` (see `assets/models/README.md`). Implement the model-specific PaddleOCR tensor/decode integration points in `services/ocr/paddleOcr.ts` and the JPEG→RGB `decodeFrameToRgb` in `services/tflite/frameSource.ts` (or switch the detection loop to VisionCamera frame processors). Verify `DOOR_CLASS_INDEX` in `services/tflite/types.ts`.

---

- **Timestamp:** 2026-08-22 13:00
- **Feature / Component:** UI & AR Components
- **Changes Made:** Implemented the presentation-tier components: pill buttons, logo, radio selector, text field, divider, avatar, the corner-bracket reticle overlay with dark mask (reporting a normalized rect), suggestion pills, an expandable room information bottom sheet, and the Viro AR portal scene (raycast door center against planes, anchor `ViroPortalScene passable`, `ViroPortal` + `door_frame.obj`, and `Viro360Image`).
- **Files Affected:** `components/ui/*` (9 files), `components/ar/ViroPortalRoom.tsx`, `components/ar/ArPortalScene.tsx`
- **Manual Actions Required by Developer:** None (depends on model assets above).

---

- **Timestamp:** 2026-08-22 13:10
- **Feature / Component:** Screens, Navigation & Root
- **Changes Made:** Implemented the Login (email/password + Google + role selector), Home (hero + placard scanner card), and Placard Scanner (capture → processing → suggestions → doorScan → portal state machine, frozen snapshot, camera↔Viro resource handoff) screens, plus the auth context/hook, the root native-stack navigator with an auth gate, and the root App entry. Validated with `tsc --noEmit` (0 errors).
- **Files Affected:** `screens/LoginScreen.tsx`, `screens/HomeScreen.tsx`, `screens/PlacardScannerScreen.tsx`, `hooks/useAuth.tsx`, `navigation/types.ts`, `navigation/RootNavigator.tsx`, `App.tsx`, `assets/models/README.md`
- **Manual Actions Required by Developer:** None (build-time assets/env already listed above).

---

- **Timestamp:** 2026-08-22 14:00
- **Feature / Component:** AR Portal Placement Architecture Refactor
- **Changes Made:** Removed the automated TFLite door-detection pipeline (`services/tflite/doorDetector.ts`, `frameSource.ts`, `types.ts`, `hooks/useDoorDetector.ts`, and the old `ViroPortalRoom`/`ArPortalScene` components) and replaced it with a deterministic "Point-and-Tap" flow. Implemented `components/ar/PortalScene.tsx` with tracking-state gating, center-viewport raycasting against vertical planes (1.5–3.5 m), a 2.0 m forward-vector fallback, and yaw-only upright stabilization (pitch/roll = 0). Updated Phase C to an `arPlacement → portal` state machine with an AR crosshair HUD + "PLACE PORTAL HERE" button. Validated with `tsc --noEmit` (0 errors).
- **Files Affected:** `.kilo/rules/blueprint.md`, `assets/models/README.md`, `components/ar/PortalScene.tsx`, `screens/PlacardScannerScreen.tsx`, `types/index.ts`, `services/tflite/README.md`, `.kilo/logs/CHANGELOG.md`
- **Manual Actions Required by Developer:** Updated checklist removing TFLite model training; remaining deliverables are `door_frame.obj` (+ `.mtl`), `det_model.onnx`, `cls_model.onnx`, `rec_model.onnx`, `assets/360/room_101.jpg`, plus Firebase `.env` / `google-services.json`.

---

- **Timestamp:** 2026-08-22 14:20
- **Feature / Component:** AR Portal UX Pivot (Door to Window)
- **Changes Made:** Refactored the Phase C HUD guidance banner to "Stand ~2m back, aim at a blank wall, and tap to place the viewing window." and the action button to "PLACE WINDOW HERE". Renamed the required asset from `door_frame.obj` to `window_frame.obj` in `PortalScene.tsx` and updated the blueprint and asset checklist to describe the portal as a horizontal 6DoF viewing window for a wider Field of View (FOV). Validated with `tsc --noEmit` (0 errors).
- **Files Affected:** `components/ar/PortalScene.tsx`, `screens/PlacardScannerScreen.tsx`, `.kilo/rules/blueprint.md`, `assets/models/README.md`, `.kilo/logs/CHANGELOG.md`
- **Manual Actions Required by Developer:** Place `assets/models/window_frame.obj` (+ `.mtl` + textures) instead of `door_frame.obj`.



