/**
 * Ambient module declarations for binary/native assets that Metro resolves to a
 * numeric asset id but TypeScript would otherwise not understand.
 */

declare module '*.tflite' {
  const assetId: number;
  export default assetId;
}

declare module '*.obj' {
  const assetId: number;
  export default assetId;
}

declare module '*.mtl' {
  const assetId: number;
  export default assetId;
}

declare module '*.onnx' {
  const assetId: number;
  export default assetId;
}

declare module '*.glb' {
  const assetId: number;
  export default assetId;
}

declare module '*.gltf' {
  const assetId: number;
  export default assetId;
}
