// Metro config for ARISE (Expo SDK 57).
// Only model-weight asset extensions are required (`onnx` for PaddleOCR; `tflite` is
// retained for the deprecated detector). External 3D geometry (.obj/.mtl/.gltf/.glb/.fbx)
// is no longer used — the window portal is built from Viro primitives.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [
  ...(config.resolver.assetExts ?? []),
  'tflite',
  'onnx',
];

module.exports = config;

