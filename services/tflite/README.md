# TFLite Door Detection — DEPRECATED

The automated TFLite door-detection pipeline (`doorDetector.ts`, `frameSource.ts`,
`types.ts`, and the `useDoorDetector` hook) has been **removed** in favor of the
deterministic "Point-and-Tap" raycast AR placement flow described in
`.kilo/rules/blueprint.md` §7.2/§9 and implemented in `components/ar/PortalScene.tsx`.

There is no longer a requirement for `assets/models/door_detector.tflite`.

> The `react-native-fast-tflite` npm dependency and its `app.json` config plugin remain
> installed but are now unused; they can be removed with `npm uninstall
> react-native-fast-tflite` (and by deleting the plugin entry) in a follow-up cleanup.
