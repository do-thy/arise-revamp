# ARISE — Model Assets

Place the following files in this directory before running `npx expo prebuild` / a native build.
They are **not** committed and must be supplied manually (see `.kilo/logs/CHANGELOG.md`).

| File | Purpose | Source / Notes |
| --- | --- | --- |
| `door_detector.tflite` | Door object detector (Phase C) | MobileNet-SSD style model. Outputs: boxes `[1,N,4]`, classes `[1,N]`, scores `[1,N]`, count `[1]`. Verify the `door` class index against `DOOR_CLASS_INDEX` in `services/tflite/types.ts`. |
| `door_frame.obj` (+ `.mtl` + textures) | Portal door frame (Phase C) | 3D door frame model loaded by `<Viro3DObject type="OBJ">`. |
| `det_model.onnx` | PaddleOCR DBNet text detection | Exported PaddleOCR detection model. |
| `rec_model.onnx` | PaddleOCR CRNN text recognition | Exported PaddleOCR recognition model. |
| `cls_model.onnx` | PaddleOCR angle classifier | Required when `useAngleCls` is enabled (it is, by default). |

Also drop any textures referenced by `door_frame.mtl` here.
