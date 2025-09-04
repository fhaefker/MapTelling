# RFC 07: MlTerrain Component

## 1. Problem
Terrain (raster-dem) integration requires imperative setup: add raster-dem source + call setTerrain + manage exaggeration + cleanup.

## 2. Proposed API
```tsx
<MlTerrain mapId="main" enabled exaggeration={1.8} url="https://example.com/terrain.json" />
// or tiles variant
<MlTerrain mapId="main" tiles={["https://.../{z}/{x}/{y}.png"]} />
```
Props:
| Prop | Type | Default | Notes |
|------|------|---------|-------|
| mapId | string | required | Target map |
| enabled | boolean | true | Toggle terrain on/off |
| exaggeration | number | 1.5 | Vertical exaggeration |
| url | string | - | Style/source URL (raster-dem) |
| tiles | string[] | - | Template tile set (alternative to url) |
| tileSize | 256|512 | 512 | Raster tile size |
| sourceId | string | terrain-dem | Custom source id |
| maxzoom | number | 14 | Max zoom for DEM |

## 3. Behavior
- Adds raster-dem source if missing (url OR tiles required) when enabled.
- Calls `map.setTerrain({ source, exaggeration })`.
- On disable/unmount: resets `setTerrain(null)` but leaves source for fast re-enable.
- Idempotent: re-renders adjust exaggeration if changed.

## 4. Performance
Single source addition; no re-add unless switching url/tiles. Exaggeration change triggers `setTerrain` only.

## 5. Migration
Users with manual terrain setup replace imperative code with component.

## 6. Alternatives Considered
Hook `useTerrain` returning enable/disable functions – less declarative.

## 7. Open Questions
- Remove source on unmount? (Current: keep to permit toggle UX.)
- Provide event for elevation sampling? (Future extension.)

## 8. Test Plan
- Mount with enabled=false (no crash).
- Simulate map load and ensure source addition + setTerrain invocation (mock wrapper extension in future test).

## 9. References
Capabilities sections: 26 (Lücke), 47 (Extension), 50 (Refactor Targets), 56 (Perf).
