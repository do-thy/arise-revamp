# ARISE — Manual Asset Deliverables

Place the following files before running `npx expo prebuild` / a native build.
They are **not** committed and must be supplied manually (see `.kilo/logs/CHANGELOG.md`).

> **3D models deprecated:** external `.obj`/`.mtl` geometry is no longer used. The AR
> window portal is constructed 100% programmatically from Viro primitives (`<ViroBox>`,
> `<ViroNode>`), so no 3D model files are required.

| # | File | Purpose |
| --- | --- | --- |
| 1 | `assets/models/det_model.onnx` | PaddleOCR DBNet text detection model. |
| 2 | `assets/models/cls_model.onnx` | PaddleOCR angle classifier (`useAngleCls` is enabled). |
| 3 | `assets/models/rec_model.onnx` | PaddleOCR CRNN text recognition model. |
| 4 | `assets/360/room_101.jpg` | Sample 360° equirectangular room texture (used as `Room.panoramic360Url`). |
| 5 | `.env` and `google-services.json` | Firebase configuration (see `.env.example`). |

> **Window FOV:** the portal uses a **horizontal window frame** (2:1 aspect ratio,
> 2 m × 1 m) for a wider Field of View (FOV) into the 360° environment.

> **Material:** the window frame uses a code-defined `whiteWindowFrame` material (solid
> `#FFFFFF`, Lambert), so no `.mtl` or image texture files are required.

> **Removed:** `door_detector.tflite` is no longer required — TFLite door detection was
> replaced by point-and-tap raycast AR placement (`components/ar/PortalScene.tsx`).
