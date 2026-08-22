// Metro config for ARISE (Expo SDK 57).
// Adds the native model/asset extensions required by:
//  - react-native-fast-tflite (.tflite)
//  - @reactvision/react-viro (.obj, .mtl, .gltf, .glb, .fbx, .hdr, .bin)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [
  ...(config.resolver.assetExts ?? []),
  'tflite',
  'obj',
  'mtl',
  'gltf',
  'glb',
  'fbx',
  'hdr',
  'bin',
  'onnx',
];

module.exports = config;

