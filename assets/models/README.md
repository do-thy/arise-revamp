# ARISE — Manual Asset Deliverables

Place the following files before running `npx expo prebuild` / a native build.
They are **not** committed and must be supplied manually (see `.kilo/logs/CHANGELOG.md`).

| # | File | Purpose |
| --- | --- | --- |
| 1 | `assets/models/door_frame.obj` (+ `.mtl`) | 3D door frame mounted by `<Viro3DObject type="OBJ">` inside the portal. |
| 2 | `assets/models/det_model.onnx` | PaddleOCR DBNet text detection model. |
| 3 | `assets/models/cls_model.onnx` | PaddleOCR angle classifier (`useAngleCls` is enabled). |
| 4 | `assets/models/rec_model.onnx` | PaddleOCR CRNN text recognition model. |
| 5 | `assets/360/room_101.jpg` | Sample 360° equirectangular room texture (used as `Room.panoramic360Url`). |
| 6 | `.env` and `google-services.json` | Firebase configuration (see `.env.example`). |

> **Removed:** `door_detector.tflite` is no longer required — TFLite door detection was
> replaced by point-and-tap raycast AR placement (`components/ar/PortalScene.tsx`).

Also drop any textures referenced by `door_frame.mtl` next to the OBJ.
