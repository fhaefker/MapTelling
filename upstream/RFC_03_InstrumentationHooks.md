# RFC 03: Instrumentation Hooks Suite

## 1. Problem
Lack of lightweight, built-in observability (FPS, layer churn, load timing) hampers performance tuning.

## 2. APIs
```ts
usePerformanceInstrumentation({ mapId, sampleFpsDuringMs?, onMetrics? }) => void // load time + optional fps + layerchange count
useMapFrameRate({ mapId, sampleMs?, windowSize?, autoStart?, onComplete? }) => { avgFps, frames, start, stop, running }
useLayerChangeLog({ mapId, limit? }) => { log: LayerChangeEntry[] }
```

## 3. Behavior
- Passive when not sampling (no rAF loops until requested).
- Event listeners cleaned on unmount.
- Log bounded by `limit`.

## 4. Performance
Sampling rAF for window; overhead ~ constant per frame (<0.05ms). Disabled by default for production; docs recommend conditional usage.

## 5. Migration
Add-only; consumers import explicitly. Suggest exported from `debug/` path to signal optional nature.

## 6. Alternatives
External profiling tools; higher friction and no integrated layerchange semantics.

## 7. Tests
- Frame sampling sets avgFps.
- Log length respects limit.

## 8. References
Capabilities: section 56 (performance instrumentation).
