# RFC 05: Deprecation Utilities & Compatibility Layer

## 1. Problem
Deprecated props (e.g. MlGeoJsonLayer.paint/layout) risk silent usage; need guided migration & one-time warnings.

## 2. APIs
```ts
warnDeprecated({ feature, message?, onceKey? })
<GeoJsonLayerCompat paint? layout? options? ...rest /> // maps legacy props -> options.
```

## 3. Behavior
- One console warning per feature key per session.
- Wrapper merges legacy props without mutating caller objects.

## 4. Migration
Consumers replace `MlGeoJsonLayer` with `GeoJsonLayerCompat` until code updated, then revert back or keep wrapper externally.

## 5. Alternatives
Static ESLint rule or codemod only (less immediate runtime feedback).

## 6. Tests
- Warning emitted once per key.
- Wrapper renders without crashing.

## 7. References
Capabilities: section 57 (deprecation & migration).
