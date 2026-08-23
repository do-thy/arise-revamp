# ARISE — Architecture Blueprint

> **Project:** ARISE (Augmented Reality Interactive Spatial Explorer)
> **Stack:** React Native Expo SDK 57 · React 19.2 · RN 0.86 · TypeScript 6
> **Author:** Lead Mobile AI & AR Architect
> **Date:** 2026-08-22

---

## 1. Executive Summary

ARISE is an indoor wayfinding + augmented reality application. A user logs in, scans a
physical room placard with the camera, and the app OCRs the placard text, resolves the
room via fuzzy matching against a room database, then uses a deterministic point-and-tap
raycast against Viro AR vertical planes to anchor a **window portal** on a blank wall. Peering
through the portal reveals a **360° panoramic image** of the matched room, plus an
information bottom sheet.

The product is deliberately decoupled into a **Three-Tier Model** so that the heavy
native AI/AR dependencies (OCR, Viro) can be swapped, mocked, or stubbed without
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
  `ViroPortalScene`, `ViroPortal`, `Viro360Image`, `ViroBox`, `ViroNode`,
  `ViroMaterials`. Config plugin `@reactvision/react-viro` (verified against the
  official Expo starter kit).
- ~~`react-native-fast-tflite` ^3.0~~ — **deprecated**: removed with the TFLite door-detection
  pipeline; the npm package remains installed but is unused (see `services/tflite/README.md`).
- **`onnxruntime-react-native` ^1.24** — `ort.InferenceSession.create(uri)` + `session.run`.
- **`firebase` ^12** (JS SDK) — `firebase/auth` + `firebase/firestore` with AsyncStorage
  persistence (no `google-services.json` required for email/password).
- **`fuse.js` ^7** — fuzzy matching.
- **`@react-navigation/native` / `native-stack` ^7** — used with explicit `/screens/*` files
  (matches the spec; the project is **not** expo-router based).

### 2.3 New Architecture note

SDK 57 runs **React Native New Architecture only** (legacy arch removed). All selected
native libraries are New-Architecture-compatible:

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
| **AI/CV Business Logic** | `services/ocr/`, `services/matching/` | OCR inference, vertical-text spatial sorting, fuzzy room resolution |
| **Data/Storage** | `services/firebase/`, `services/storage/` | Auth session, Firestore room queries, secure session persistence |

---

## 4. Directory Structure

```
arise-revamp/
├── App.tsx                         # Root: SafeAreaProvider + Navigation + auth gate
├── index.ts                        # registerRootComponent (unchanged)
├── app.json                        # Config plugins + permissions
├── metro.config.js                 # onnx asset extension (OCR model weights)
├── .env.example                    # Template for env vars
├── .kilo/
│   ├── rules/blueprint.md
│   └── logs/CHANGELOG.md
├── assets/
│   ├── models/                     # OCR .onnx (det / cls / rec)
│   └── 360/                        # room_101.jpg (sample 360° equirectangular texture)
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
│   └── useAuth.tsx
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
│   │   └── README.md               # deprecated (archived)
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
        └── PortalScene.tsx
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
      │              ┌──────────────┐  tap to place ┌──────────────┐
      └── cancel ◄─── │ arPlacement  │ ────────────► │   portal     │
                      └──────────────┘               └──────────────┘
```

| Phase | Viewfinder | Bottom UI |
| --- | --- | --- |
| `capture` | Red `#E60000` | "Ensure the entire placard is inside the box." + "SCAN PLACARD" |
| `processing` | Red | Spinner ("Reading placard…") |
| `suggestions` | Yellow `#FFCC00` | "No exact match. Did you mean?" + suggestion pills + Cancel |
| `arPlacement` | AR + centered crosshair | Guidance banner + "PLACE WINDOW HERE" |
| `portal` | AR (portal anchored) | Room information bottom sheet |

### 7.3 Camera lifecycle & native resource handoff (critical)

The camera is a **single exclusive native resource**. Two subsystems compete for it
(2D `expo-camera` preview → Viro AR session). To prevent native deadlocks we enforce a
strict, explicit handoff:

1. **Phase A** owns `expo-camera` (`CameraView`). On scan: capture → `manipulateAsync` crop.
2. **Phase B** does **not** touch the camera (frozen snapshot stays on screen).
3. **Phase C (`arPlacement` → `portal`)** must **fully unmount `CameraView`** *before*
   mounting `ViroARSceneNavigator` (and vice-versa on back navigation). We gate on a
   `setTimeout`-backed `arMounted` flag so Viro only mounts after the 2D camera surface is
   released, and re-mount the camera only after Viro unmounts.

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

### 8.3 AR placement (deprecated TFLite door detection)

- ~~`services/tflite/`~~ — the automated TFLite door-detection runner (`doorDetector.ts`,
  `frameSource.ts`, `types.ts`) and the `useDoorDetector` hook have been **removed** and
  archived as `services/tflite/README.md`. There is no `door_detector.tflite` requirement.
- Phase C now uses the deterministic point-and-tap raycast placement in
  `components/ar/PortalScene.tsx` (see §9).

### 8.4 Fuzzy matching (`services/matching/`)

- `fuzzyMatch.ts` — `fuse.js` (fuzzy keys on `id`/`name`) + a `levenshteinSimilarity`
  fallback. Normalizes the OCR string (uppercase, strip non-alphanumerics, collapse
  whitespace). Returns `RoomMatch[]` sorted by score; `isExact` is set when the normalized
  string equals a room `id`/`name` after normalization.

### 8.5 Secure storage (`services/storage/`)

- `secureStore.ts` — thin wrapper over `expo-secure-store` for the user id/role, with web
  fallback to `localStorage` guarded by `Platform.OS`.

---

## 9. AR Window Portal Rendering (`components/ar/PortalScene.tsx`)

`PortalScene` is a `forwardRef` component that wraps `ViroARSceneNavigator` and exposes a
`placePortal()` imperative handle to the screen. The portal acts as a **horizontal 6DoF
viewing window** (rather than a doorway) into the 360° classroom environment, providing a
wider, more immersive field of view. **The AR Window Portal is constructed 100%
programmatically using Viro primitives — no external 3D geometry is used.** The official
window dimension ratio is **1 m height × 2 m width (2:1 aspect ratio)**. Its inner
`ViroARScene` implements the stabilized point-and-tap placement:

1. **Tracking gating** — `onTrackingUpdated` is recorded into a ref; placement is rejected
   until the state reaches `ViroTrackingStateConstants.TRACKING_NORMAL`.
2. **Raycast** — on tap (scene `onClick`) or the "PLACE WINDOW HERE" button,
   `performARHitTestWithPoint(0.5, 0.5)` hit-tests the viewport center against detected
   planes. Results of type `ExistingPlane` / `ExistingPlaneUsingExtent` (vertical
   blank walls) within **1.5–3.5 m** of the camera are accepted.
3. **Forward-vector fallback** — if no vertical plane matches, the anchor is projected
   **2.0 m** forward along the camera orientation vector and dropped 0.3 m below the eye:
   `Target = [Cx + fx·2.0, Cy − 0.3, Cz + fz·2.0]`.
4. **Geometric stabilization (upright lock)** — pitch (X) and roll (Z) are forced to
   `0°`; only the yaw is computed so the portal faces the user:
   `Δx = Cx − Px`, `Δz = Cz − Pz`, `θY = atan2(Δx, Δz)·(180/π)`, then
   `rotation={[0, θY, 0]}`.
5. **Scene graph** — `<ViroPortalScene passable position rotation={[0, θY, 0]}>` wraps
   `<ViroPortal>` containing:
   - a `<ViroBox>` portal mask (the 2 m × 1 m cutout),
   - four thin `<ViroBox>` primitives (top / bottom / left / right) grouped under a
     `<ViroNode>` forming the white frame (material `whiteWindowFrame`),
   - `<Viro360Image source={{ uri: room.panoramic360Url }} />` revealed through the portal.

> Viro requires `npx expo prebuild` (ARCore on Android / ARKit on iOS) and the
> `@reactvision/react-viro` config plugin in `app.json`.

---

## 10. Native Boundaries & Manual Actions (summary)

See `.kilo/logs/CHANGELOG.md` for the running list. Key items:

1. **Model files** to place in `assets/`:
   - `assets/models/det_model.onnx` — PaddleOCR DBNet text detection.
   - `assets/models/cls_model.onnx` — PaddleOCR angle classifier.
   - `assets/models/rec_model.onnx` — PaddleOCR text recognition.
   - `assets/360/room_101.jpg` — sample 360° equirectangular room texture.
   (No external 3D geometry or TFLite door detector is required — the window portal is
   built from programmatic Viro primitives, see §9.)
2. **Firebase** — populate `EXPO_PUBLIC_FIREBASE_*` in `.env`.
3. **Google Sign-In** — `google-services.json` (Android) / `GoogleService-Info.plist` (iOS)
   + `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
4. **Build** — `npx expo prebuild` then `npx expo run:android` / `run:ios` (never Expo Go).

---

## 11. Implementation Phases (roadmap)

1. ✅ Blueprint + logging infra + config plugins + env template.
2. Design system + shared types + env constants.
3. Data/storage services (Firebase, SecureStore) + fuzzy matching (pure logic).
4. AI/CV services (OCR pipeline + vertical sorter).
5. UI components + AR components.
6. Screens (Login → Home → Scanner) + navigation + root App + hooks.
7. Install dependencies, typecheck, validate.
8. ✅ Phase C refactor: TFLite door detection → point-and-tap raycast AR placement.



