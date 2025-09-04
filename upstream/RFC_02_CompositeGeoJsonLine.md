# RFC 02: CompositeGeoJsonLine Component

## 1. Problem
Frequent need for route/track glow + main line → boilerplate (duplicate sources & layers) & risk of drift.

## 2. API
```tsx
<CompositeGeoJsonLine mapId data={FeatureCollection|url} idBase? color? width? glow?={{width,color,opacity,blur}} lineCap? beforeId? updates?="replace-source" />
```

## 3. Behavior
- Single GeoJSON source.
- Optional glow layer below main.
- URL fetch with abort on prop change.
- Paint updates idempotent.

## 4. Performance
One source + up to two line layers. Re-setData only when data ref changes.

## 5. Migration
Pure addition, encourages removal of ad-hoc duplicated layer code.

## 6. Alternatives
Two MlGeoJsonLayer instances manually configured → higher risk of mismatch.

## 7. Tests
- Creates source + (glow?) + main layer.
- Updates paint when props change.

## 8. References
Capabilities: sections 39 (core props), 46 (performance), 47 (extension).
