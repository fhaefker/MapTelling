## MapComponents Extension Proposals (Derived from MapTelling Optimisation)

Context: During refactor we introduced local abstractions (chapter navigation hook, interaction controller, composite track layer) that generalise recurring patterns in scrollytelling + multi-layer composition. This document maps them to potential upstream contributions following guidelines in capabilities sections 44 (Contribution Workflow), 47 (Extension), 48 (Anti-Patterns), 50 (Refactor Targets), 56 (Perf), 57 (Deprecation), 60 (Upgrade).

### 1. useChapterNavigation Hook
Problem: Story / chapter based camera orchestration is re‑implemented across scrollytelling apps. Current wrapper offers low-level map.flyTo only.
Proposed API (stable surface sketch):
```ts
interface UseChapterNavigationOptions {
  mapId: string;
  chapters: Array<{
    id: string; location: { center: [number, number]; zoom: number; bearing?: number; pitch?: number }; meta?: any;
  }>;
  autoplay?: boolean;
  autoplayIntervalMs?: number;
  flyOptions?: Partial<maplibregl.FlyToOptions>;
  initialChapter?: number;
  loop?: boolean; // optional future
}
interface ChapterNavigationApi {
  currentChapter: number;
  isPlaying: boolean;
  goToChapter(index: number, immediate?: boolean): void;
  next(): void; previous(): void;
  togglePlay(): void; setPlaying(play: boolean): void;
}
```
Implementation Notes:
- Pure hook; depends only on useMap.
- No internal timers when not playing (perf idle).
- Emits optional custom events (e.g. `chapterchange`) via wrapper events bus for external analytics if integrated.

Value:
- Reduces ~60 lines imperative camera logic per project.
- Standardises autoplay semantics & cancellation.

Open Questions:
- Provide context provider for nested components to consume chapter state? (Out of initial scope.)

### 2. <InteractionController /> Component
Problem: Repeated manual enable/disable of interaction handlers -> duplication & risk of partial toggles.
Proposed Props:
```ts
interface InteractionControllerProps {
  mapId: string;
  enabled: boolean;
  modes?: { scrollZoom?: boolean; dragPan?: boolean; keyboard?: boolean; doubleClickZoom?: boolean; touchZoomRotate?: boolean };
  temporary?: boolean; // if true resets on unmount
}
```
Behavior:
- Applies unified enable/disable; if modes omitted toggles all.
- Guard against map re-creation (idempotent updates; only call underlying enable/disable if state changes).

Value: De-duplicates code; helps scenario-based UI (story vs explore, print mode freeze, screenshot capture freeze).

### 3. <CompositeGeoJsonLine /> Component (TrackCompositeLayer Generalisation)
Problem: Frequent pattern layering same GeoJSON line with glow / halo / segmentation requiring multiple layers & manual sync.
Proposed Props:
```ts
interface CompositeGeoJsonLineProps {
  mapId: string;
  data: FeatureCollection<LineString|MultiLineString> | string; // URL or object
  idBase?: string; // base id for source + layers
  color?: string;
  width?: number;
  glow?: { width?: number; color?: string; opacity?: number; blur?: number } | false;
  updates?: 'replace-source' | 'diff';
  lineCap?: 'butt' | 'round' | 'square';
  beforeId?: string;
}
```
Implementation:
- Adds single source + up to two layers (glow + main) deterministically.
- Optional incremental diff update (future optimisation) else setData.
- Accepts URL: fetch + abort controller; shows loading state via wrapper event (future standard event `datasource:loading`).

Value:
- Reduces boilerplate for stylised line tracks (routes, paths, GPS traces) & ensures consistent layering order.
- Minimises double-source mistakes which waste memory.

### 4. Performance / Instrumentation Hooks
Opportunity discovered: Need quick measurement of camera & layer churn in story sequences.
Proposed new hooks:
```ts
useMapFrameRate(mapId, { sampleMs?: number, windowSize?: number }) => { fps: number, samples: number[] }
useLayerChangeLog(mapId, { limit?: number }) => { log: Array<{ ts: number; action: 'add'|'remove'|'update'; id: string; type: string }> }
```
Rationale: Aligns with capabilities section 56 instrumentation guidance; codifies patterns.

### 5. Protocol Extension Template
Observation: Adding custom protocol currently needs referencing internal patterns; template generator improves DX.
Deliverable: CLI snippet or docs recipe referencing section 52 pipeline with stub file containing registration + sample transform.

### 6. Deprecation Guard Utility
Add small util: `assertNoDeprecatedLayerProps(layerConfig, componentName)` to surface console warnings (aligns with section 57 strategy).

### 7. Roadmap Alignment
Relates to refactor targets (sec50): consolidating multi-layer patterns & standardising interaction logic reduces API surface complexity pressure when introducing style segmentation.

### 8. Implementation Priority (Impact vs Effort)
| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| useChapterNavigation | Low | High | 1 |
| InteractionController | Low | Medium | 2 |
| CompositeGeoJsonLine | Medium | High | 3 |
| useMapFrameRate | Medium | Medium | 4 |
| useLayerChangeLog | Medium | Medium | 5 |
| Protocol template | Low | Medium | 6 |
| Deprecation guard util | Low | Low | 7 |

### 9. Acceptance Criteria Summary
| Contribution | Criteria |
|--------------|----------|
| useChapterNavigation | Deterministic navigation, no memory leaks, no side effects when idle |
| InteractionController | All handlers toggled consistently, idempotent updates |
| CompositeGeoJsonLine | Single source, predictable layer IDs, cleans up fully |
| useMapFrameRate | Sampling overhead < 1ms per frame, resubscribable |
| useLayerChangeLog | Captures add/remove/update with timestamps, respects limit |
| Protocol template | Clear instructions, runnable minimal example |
| Deprecation guard util | Emits one warning per prop per session |

### 10. Open Risks
- Composite component may overlap with existing MlGeoJsonLayer extension plans; must confirm upstream roadmap.
- Frame rate hook may duplicate external performance tooling; scope should remain light.

### 11. Next Steps
1. Submit RFC issue summarising items 1–3 with API signatures.
2. Build PR for useChapterNavigation + InteractionController (shareable independently).
3. Gather feedback; iterate before CompositeGeoJsonLine.
4. Add instrumentation hooks after consensus on naming.
5. Update capabilities doc section 60 upgrade checklist referencing new utilities when merged.

---
Generated: automated optimisation pass (date: 2025-09-04).
