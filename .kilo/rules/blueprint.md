# ARISE — Architecture Blueprint

> **Project:** ARISE (Augmented Reality Interactive Spatial Explorer)
> **Stack:** React Native Expo SDK 57 · React 19.2 · RN 0.86 · TypeScript 6
> **Author:** Lead Mobile AI & AR Architect
> **Date:** 2026-08-22

---

## 1. Executive Summary

ARISE is an indoor wayfinding + augmented reality application. A user logs in, scans a
physical room placard with the camera, and the app OCRs the placard text, resolves the
room via fuzzy matching against a room database, then uses on-device door detection and
Viro AR to anchor a **portal** to the detected door. Peering through the portal reveals a
**360° panoramic image** of the matched room, plus an information bottom sheet.

The product is deliberately decoupled into a **Three-Tier Model** so that the heavy
native AI/AR dependencies (OCR, TFLite, Viro) can be swapped, mocked, or stubbed without
touching the presentation layer.

---

## 2. Repository & SDK 57 Compatibility Analysis

### 2.1 Current state

The repository is a **pristine Expo SDK 57 template**:

| File | Status |
| --- | --- |
| `package.json` | `expo ~57.0.15`, `react 19.2.3`, `react-native 0.86.2`, `typescript ~6.0.3` |
| `app.json` | Default config, **no plugins** |
| `App.tsx` | Boilerplate `View`/`Text` |
| `index.ts` | `registerRootComponent(App)` (classic entry, **not** expo-router) |
| `metro.config.js` | **Missing** (defaults used) |

### 2.2 SDK 57 verified APIs (read from versioned docs)

- **`expo-camera` ~57.0.4** — `CameraView` component, `useCameraPermissions()` hook,
  `ref.takePictureAsync(options)`. Returns `{ uri, width, height, base64, exif }`.
  Config plugin `expo-camera` adds `CAMERA` / `NSCameraUsageDescription`.
- **`expo-secure-store` ~57.0.1** — `getItemAsync`, `setItemAsync`, `deleteItemAsync`,
  `isAvailableAsync`. Not supported on web.
- **`expo-image-manipulator`** — `manipulateAsync(uri, actions, saveOptions)` with
  `crop` / `resize` actions; used to crop the captured frame to the reticle bounding box.
- **`expo-linear-gradient`** — gradient surfaces where required.
- **`@reactvision/react-viro` ^2.58** — `ViroARSceneNavigator`, `ViroARScene`,
  `ViroPortalScene`, `ViroPortal`, `Viro360Image`, `Viro3DObject`. Config plugin
  `@reactvision/react-viro` (verified against the official Expo starter kit).
- **`react-native-fast-tflite` ^3.0** — Nitro-Modules based; `loadTensorflowModel(model, delegates)`
  / `useTensorflowModel`; `model.run([ArrayBuffer])`. Requires `tflite` Metro asset ext.
- **`onnxruntime-react-native` ^1.24** — `ort.InferenceSession.create(uri)` + `session.run`.
- **`firebase` ^12** (JS SDK) — `firebase/auth` + `firebase/firestore` with AsyncStorage
  persistence (no `google-services.json` required for email/password).
- **`fuse.js` ^7** — fuzzy matching.
- **`@react-navigation/native` / `native-stack` ^7** — used with explicit `/screens/*` files
  (matches the spec; the project is **not** expo-router based).

### 2.3 New Architecture note

SDK 57 runs **React Native New Architecture only** (legacy arch removed). All selected
native libraries are New-Architecture-compatible:

- `react-native-fast-tflite` is built on Nitro Modules (New-Arch native).
- `@reactvision/react-viro` ^2.58 ships New-Arch-compatible builds.
- `onnxruntime-react-native` 1.24 has New-Arch support but is the **highest risk**
  dependency; it is isolated behind a lazy loader and a graceful-degradation path.

> **Native boundary:** this project **requires `npx expo prebuild`** and a custom dev
> client. It will **not** run in Expo Go because of the native modules (TFLite, Viro,
> onnxruntime, Google Sign-In).

---

## 3. Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION TIER                                           │
│  screens/ · components/ui/ · components/ar/ · navigation/    │
│  (React components, state machines, theme)                   │
└──────────────▲──────────────────────────────▲────────────────┘
               │                              │
┌──────────────┴──────────────┐  ┌────────────┴───────────────┐
│  AI / CV BUSINESS LOGIC TIER │  │  DATA & STORAGE TIER        │
│  services/ocr/               │  │  services/firebase/         │
│  services/tflite/            │  │  services/matching/          │
│  services/matching/          │  │  services/storage/           │
└──────────────▲──────────────┘  └────────────▲────────────────┘
               │                              │
        (hooks bridge the tiers)     (Firestore / SecureStore)
```

### 3.1 Tier responsibilities

| Tier | Modules | Responsibility |
| --- | --- | --- |
| **Presentation** | `screens/`, `components/ui/`, `components/ar/`, `navigation/`, `hooks/` | Render UI, drive the scanner state machine, dispatch to services via hooks |
| **AI/CV Business Logic** | `services/ocr/`, `services/tflite/`, `services/matching/` | OCR inference, vertical-text spatial sorting, door detection, fuzzy room resolution |
| **Data/Storage** | `services/firebase/`, `services/storage/` | Auth session, Firestore room queries, secure session persistence |

---

## 4. Directory Structure

```
arise-revamp/
├── App.tsx                         # Root: SafeAreaProvider + Navigation + auth gate
├── index.ts                        # registerRootComponent (unchanged)
├── app.json                        # Config plugins + permissions
├── metro.config.js                 # tflite/obj/gltf asset extensions
├── .env.example                    # Template for env vars
├── .kilo/
│   ├── rules/blueprint.md
│   └── logs/CHANGELOG.md
├── assets/
│   └── models/                     # door_detector.tflite, door_frame.obj (+ .mtl), OCR .onnx
├── theme/                          # Design system
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── index.ts
├── types/                          # Shared data structures
│   ├── index.ts
│   └── modules.d.ts                # Ambient types for untyped native modules
├── constants/
│   ├── env.ts                      # EXPO_PUBLIC_* env readers + validation
│   └── index.ts
├── navigation/
│   ├── RootNavigator.tsx
│   └── types.ts                    # RootStackParamList
├── screens/
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   └── PlacardScannerScreen.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useDoorDetector.ts
├── services/
│   ├── firebase/
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   ├── rooms.ts
│   │   └── index.ts
│   ├── ocr/
│   │   ├── paddleOcr.ts
│   │   ├── verticalSorter.ts
│   │   ├── crop.ts
│   │   └── types.ts
│   ├── tflite/
│   │   ├── doorDetector.ts
│   │   └── types.ts
│   ├── matching/
│   │   └── fuzzyMatch.ts
│   └── storage/
│       └── secureStore.ts
└── components/
    ├── ui/
    │   ├── PillButton.tsx
    │   ├── Logo.tsx
    │   ├── RadioSelector.tsx
    │   ├── TextField.tsx
    │   ├── Divider.tsx
    │   ├── Avatar.tsx
    │   ├── ReticleOverlay.tsx
    │   ├── SuggestionPills.tsx
    │   └── BottomSheet.tsx
    └── ar/
        ├── ArPortalScene.tsx
        └── ViroPortalRoom.tsx
```

---

## 5. Design System

### 5.1 Color palette (`theme/colors.ts`)

| Token | Value | Usage |
| --- | --- | --- |
| `background` | `#FDFBF7` | Screen background (cream) |
| `surfaceAlt` | `#FAFAFA` | Secondary background |
| `surface` | `#FFFFFF` | Card surfaces |
| `primary` | `#9E001D` | Crimson primary accent |
| `primaryDeep` | `#A3001E` | Crimson alt (buttons pressed) |
| `accentTint` | `#FDECEF` | Soft rose pink (icon backdrops, pills) |
| `reticleSearch` | `#FFCC00` | Yellow corners (match/search state) |
| `reticleTarget` | `#E60000` | Red corners (initial targeting) |
| `mask` | `rgba(0,0,0,0.6)` | Semi-transparent dark overlay |
| `textPrimary` | `#1A1A1A` | Headings/body |
| `textSecondary` | `#6B6B6B` | Muted text |
| `textOnPrimary` | `#FFFFFF` | Text on crimson |
| `border` | `#EDE8E0` | Hairline borders |

### 5.2 Typography (`theme/typography.ts`)

Sans-serif hierarchy: `display` (36/bold), `heading` (26/bold), `title` (20/600),
`body` (16/regular), `caption` (13/regular), `button` (16/600). Highlighting is achieved by
splitting the hero string and rendering the second segment in `primary` (e.g. "Where are you
headed today?" → "Where are you\n**headed today?**").

### 5.3 Spacing / radii

4-pt scale (`spacing.ts`), card radius `16`, pill radius `999`.

---

## 6. Data Structures (`types/index.ts`)

```ts
type Role = 'user' | 'admin';

interface Room {
  id: string;            // Firestore doc id / room number string ("105")
  name: string;          // "Conference Room 105"
  floor: string;         // "1"
  building: string;
  panoramic360Url: string;
  schedule: RoomSchedule;
  occupancy: RoomOccupancy;
}

interface RoomSchedule {
  currentStatus: 'available' | 'occupied' | 'reserved';
  currentEvent?: string;
  nextEvent?: string;
  nextEventTime?: string;
}

interface RoomOccupancy {
  capacity: number;
  currentCount: number;
  facilities: string[]; // ["Projector", "Whiteboard", ...]
}

interface RoomMatch {
  room: Room;
  score: number;         // 0..1 (fuse score or levenshtein similarity)
  isExact: boolean;
}

type OcrResult = { text: string; confidence: number };

type DoorDetection = {
  bbox: { x: number; y: number; width: number; height: number };
  center: { x: number; y: number }; // normalized 0..1 viewport coords
  confidence: number;
  label: string;                    // "door"
};

type Vec3 = [number, number, number];
```

---

## 7. State Machines & Lifecycle Transitions

### 7.1 Auth state machine (`hooks/useAuth.ts`)

```
initializing ──Firebase onAuthStateChanged──► signedOut ──signIn──► signedIn
                                                ▲                     │
                                                └────signOut──────────┘
```

- `AuthContext` exposes `{ status: 'initializing'|'signedOut'|'signedIn', user, signIn, signOut, signInWithGoogle }`.
- Session persistence: `firebase/auth` `getReactNativePersistence(AsyncStorage)`.
- Sensitive refresh tokens are handled by Firebase; we additionally persist the resolved
  user id in `expo-secure-store` for offline bootstrapping (belt & suspenders).

### 7.2 Placard Scanner state machine (`PlacardScannerScreen`)

Discriminated-union state:

```
 ┌───────────┐  SCAN   ┌─────────────┐ OCR done ┌───────────────┐
 │ capture   │ ──────► │ processing  │ ────────► │ suggestions   │ (only if no exact)
 └───────────┘         └─────────────┘           └──────┬────────┘
      ▲                    │ exact match               │ pill selected
      │                    ▼                            ▼
      │              ┌──────────────┐  door found  ┌──────────────┐
      └── cancel ◄─── │  doorScan    │ ───────────► │   portal     │
                      └──────────────┘              └──────────────┘
```

| Phase | Reticle | Bottom UI |
| --- | --- | --- |
| `capture` | Red `#E60000` | "Ensure the entire placard is inside the box." + "SCAN PLACARD" |
| `processing` | Red | Spinner ("Reading placard…") |
| `suggestions` | Yellow `#FFCC00` | "No exact match. Did you mean?" + suggestion pills + Cancel |
| `doorScan` | Yellow | "Point your camera at the door to reveal information." |
| `portal` | hidden | AR scene + information bottom sheet |

### 7.3 Camera lifecycle & native resource handoff (critical)

The camera is a **single exclusive native resource**. Three subsystems compete for it
(2D `expo-camera` preview → TFLite frame loop → Viro AR session). To prevent native
deadlocks we enforce a strict, explicit handoff:

1. **Phase A** owns `expo-camera` (`CameraView`). On scan: capture → `manipulateAsync` crop.
2. **Phase B** does **not** touch the camera (frozen snapshot stays on screen).
3. **Phase C doorScan** keeps `expo-camera` preview alive for the TFLite loop but **unmounts
   the reticle capture path**; the detection loop polls `takePictureAsync` throttled frames.
4. **Phase C portal** must **fully unmount `CameraView`** *before* mounting
   `ViroARSceneNavigator` (and vice-versa on back navigation). We gate on
   `setCameraActive(false)` + a `setTimeout`/`onCameraReady` guard so Viro only mounts
   after the 2D camera surface is released, and re-mount the camera only after Viro unmounts.

This is encoded as a single `ScanPhase` state; the render tree renders **exactly one**
camera consumer at a time (never `CameraView` and `ViroARSceneNavigator` simultaneously).

---

## 8. Service Layer Detail

### 8.1 Firebase (`services/firebase/`)

- `config.ts` — initializes `firebase/app`, `firebase/auth`, `firebase/firestore` from
  `constants/env.ts`. Throws a descriptive error if `EXPO_PUBLIC_FIREBASE_*` are unset.
- `auth.ts` — `signInWithEmail`, `signUp`, `signInWithGoogle`, `signOut`,
  `onAuthStateChanged` bridge, AsyncStorage persistence.
- `rooms.ts` — `getRooms()`, `getRoomById()`, `getRoomByLabel()` against the `rooms`
  Firestore collection.

### 8.2 OCR (`services/ocr/`)

- `crop.ts` — converts reticle rect (dp) → image pixel rect using `width/height` from the
  captured frame and crops via `expo-image-manipulator` (with a safety inset).
- `paddleOcr.ts` — lazy-loads `onnxruntime-react-native`; runs the PaddleOCR ONNX pipeline.
  **Config:** `use_angle_cls: true` (resolves 90°/270°), `det_db_unclip_ratio: 2.0`
  (elongated vertical text blocks). Exposes `recognize(uri): Promise<OcrResult[]>`.
- `verticalSorter.ts` — pure, unit-testable spatial post-processor: groups detected boxes
  whose X-coordinates are within a threshold and sorts by ascending Y to reconstruct
  top-to-bottom vertical strings; falls back to a left-to-right, top-to-bottom sort.

### 8.3 TFLite door detection (`services/tflite/`)

- `doorDetector.ts` — `loadTensorflowModel(require('assets/models/door_detector.tflite'), [])`
  (lazy + cached). `detectDoor(rgbArrayBuffer)` decodes the 4-tensor SSD output
  (boxes/classes/scores/count), finds the highest-score `door` class, and returns
  `DoorDetection` when `confidence >= 0.80` (see `DOOR_CONFIDENCE_THRESHOLD`).
- `hooks/useDoorDetector.ts` — throttled continuous loop that stops on first high-confidence
  detection (per spec) and returns the 2D center for AR raycasting.

### 8.4 Fuzzy matching (`services/matching/`)

- `fuzzyMatch.ts` — `fuse.js` (fuzzy keys on `id`/`name`) + a `levenshteinSimilarity`
  fallback. Normalizes the OCR string (uppercase, strip non-alphanumerics, collapse
  whitespace). Returns `RoomMatch[]` sorted by score; `isExact` is set when the normalized
  string equals a room `id`/`name` after normalization.

### 8.5 Secure storage (`services/storage/`)

- `secureStore.ts` — thin wrapper over `expo-secure-store` for the user id/role, with web
  fallback to `localStorage` guarded by `Platform.OS`.

---

## 9. AR Portal Rendering (`components/ar/`)

- `ViroPortalRoom.tsx` — a `ViroARScene` that:
  1. raycasts the 2D door center against **vertical planes**
     (`arSceneRef.current.performARHitTest({ x, y }, ['ExistingPlane', 'FeaturePoint'])`)
     to obtain world `(X, Y, Z)`;
  2. anchors a `<ViroPortalScene passable={true}>` at that point;
  3. mounts `<ViroPortal>` with the `door_frame.obj` 3D asset;
  4. renders `<Viro360Image source={{ uri: room.panoramic360Url }} />` inside the portal.
- `ArPortalScene.tsx` — wraps `ViroARSceneNavigator` + `ViroPortalRoom`, manages the
  `ViroARSceneNavigator` ref and hit-test request plumbing.

> Viro requires `npx expo prebuild` (ARCore on Android / ARKit on iOS) and the
> `@reactvision/react-viro` config plugin in `app.json`.

---

## 10. Native Boundaries & Manual Actions (summary)

See `.kilo/logs/CHANGELOG.md` for the running list. Key items:

1. **Model files** to place in `assets/models/`:
   - `door_detector.tflite` — SSD MobileNet door detector (4 output tensors).
   - `door_frame.obj` (+ `.mtl` + textures) — portal door frame.
   - PaddleOCR ONNX artifacts — `det_model.onnx`, `rec_model.onnx`, `cls_model.onnx`
     (loaded from app bundle / DocumentPicker).
2. **Firebase** — populate `EXPO_PUBLIC_FIREBASE_*` in `.env`.
3. **Google Sign-In** — `google-services.json` (Android) / `GoogleService-Info.plist` (iOS)
   + `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
4. **Build** — `npx expo prebuild` then `npx expo run:android` / `run:ios` (never Expo Go).

---

## 11. Implementation Phases (roadmap)

1. ✅ Blueprint + logging infra + config plugins + env template.
2. Design system + shared types + env constants.
3. Data/storage services (Firebase, SecureStore) + fuzzy matching (pure logic).
4. AI/CV services (OCR pipeline + vertical sorter + TFLite detector).
5. UI components + AR components.
6. Screens (Login → Home → Scanner) + navigation + root App + hooks.
7. Install dependencies, typecheck, validate.



