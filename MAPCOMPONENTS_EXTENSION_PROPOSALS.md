## MapComponents Extension Proposals (Derived from MapTelling Optimisation)

Context: During refactor we introduced local abstractions (chapter navigation hook, interaction controller, composite track layer) that generalise recurring patterns in scrollytelling + multi-layer composition. This document maps them to potential upstream contributions following guidelines in capabilities sections 44 (Contribution Workflow), 47 (Extension), 48 (Anti-Patterns), 50 (Refactor Targets), 56 (Perf), 57 (Deprecation), 60 (Upgrade).

### 1. useChapterNavigation Hook  
RFC: `upstream/RFC_01_useChapterNavigation_InteractionController.md`
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

### 2. <InteractionController /> Component *(Implemented Locally)*  
RFC: `upstream/RFC_01_useChapterNavigation_InteractionController.md`
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

Implementation Status (2025-09-04):
- Added `src/components/InteractionController.tsx` with props: `mapId`, `enabled`, optional `modes` subset, `temporary` restoration.
- Idempotent state changes (checks `handler.isEnabled()`).
- Captures original states once and restores when `temporary` true on unmount.
- Added unit tests `InteractionController.test.tsx` covering full enable and selective mode override.

### 3. <CompositeGeoJsonLine /> Component (TrackCompositeLayer Generalisation) *(Implemented Locally)*  
RFC: `upstream/RFC_02_CompositeGeoJsonLine.md`
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
Implementation Status (2025-09-04):
- Added `src/components/CompositeGeoJsonLine.tsx` supporting URL or object data, optional glow, customizable width/color, line cap.
- Single source + conditional glow and main layers; cleanup on unmount.
- Unit tests `CompositeGeoJsonLine.test.tsx` verify source & layer creation and glow attributes.
- Integrated into `MapTellingApp` replacing prior `TrackCompositeLayer` usage (legacy retained for comparison).
- Reduces boilerplate for stylised line tracks (routes, paths, GPS traces) & ensures consistent layering order.
- Minimises double-source mistakes which waste memory.

### 4. Performance / Instrumentation Hooks *(Implemented Locally)*  
RFC: `upstream/RFC_03_InstrumentationHooks.md`
Goal: Quick measurement of frame rate, load time, and layer churn (capabilities sec56).
Implemented Hooks:
```ts
usePerformanceInstrumentation({ mapId, sampleFpsDuringMs, onMetrics }) // load time + optional fps + layerchange count
useMapFrameRate({ mapId, sampleMs, windowSize, autoStart, onComplete }) // avg FPS over window
useLayerChangeLog({ mapId, limit }) // rolling log of add/update events
useViewportSync({ sourceMapId, targetMapId, bidirectional?, shouldSync? }) // camera sync utility
```
Implementation Status (2025-09-04): COMPLETE (first iteration)
- Added dedicated `useMapFrameRate` and `useLayerChangeLog` splitting concerns from generic instrumentation.
- Basic tests for mounting & frame sampling (fake timers) and log wiring.
- Mock wrapper extended in `setupTests` to provide simple event bus.
Follow-ups:
- (DONE) Enhance `useLayerChangeLog` to detect remove events and layer id/type diffs.
- Dev overlay prototype integrated (`DevMetricsOverlay`) – candidate for optional upstream debug component (now exported via local `src/debug/`).

### 5. Protocol Extension Template *(Implemented Locally)*  
RFC: `upstream/RFC_04_ProtocolTemplate.md`
Goal: Standardise adding custom data protocols (capabilities sec52) with size limits + transform pipeline.
Artifacts:
- `createTextProtocolHandler(opts)` factory (size guard, optional regex allowlist, transform hook).
- `useRegisterProtocol({ scheme, handler })` thin wrapper.
- Test verifying registration stored in mock registry.
Status (2025-09-04): Initial template added. Future: provide CSV/TSV convenience transform & codemod docs.

### 6. Deprecation Guard Utility  
RFC: `upstream/RFC_05_DeprecationCompat.md`
Add small util: `assertNoDeprecatedLayerProps(layerConfig, componentName)` to surface console warnings (aligns with section 57 strategy).

Implementation Status (2025-09-04):
- Added `warnDeprecated` util (`src/utils/deprecation.ts`) providing one-time console warnings with feature key.
- Next: Integrate into local components if deprecated props detected before upstream removal.
 - Added `GeoJsonLayerCompat` wrapper component that maps `paint` / `layout` into `options` and emits warnings (Proposal #6 implemented locally) plus test.

### 7. Roadmap Alignment
Relates to refactor targets (sec50): consolidating multi-layer patterns & standardising interaction logic reduces API surface complexity pressure when introducing style segmentation.

### 7.1 Upstream Contribution Packaging *(In Progress)*  
RFCs: `RFC_01`..`RFC_06` (see Cross-Link Index)
Planned PR / RFC Bundles (incremental, low coupling):
| PR | Scope | Contents | Pre-Req | Rationale |
|----|-------|----------|---------|-----------|
| 1 | Navigation & Interaction | `useChapterNavigation`, `InteractionController` + docs & tests | none | Small, high-impact primitives; easy review |
| 2 | Composite Line Rendering | `CompositeGeoJsonLine` + tests | 1 | Builds on hook patterns; isolates styling pattern |
| 3 | Instrumentation Core | `useMapFrameRate`, `useLayerChangeLog`, `usePerformanceInstrumentation` (maybe behind feature flag) | 1 | Adds observability without affecting runtime API consumers |
| 4 | Protocol Template | `createTextProtocolHandler`, `useRegisterProtocol` docs snippet | 1 | Enhances extensibility; independent of rendering |
| 5 | Deprecation & Compat | `warnDeprecated`, `GeoJsonLayerCompat` + migration guide | 1 | Assists transition ahead of major release |
| 6 (optional) | Dev Overlay | `DevMetricsOverlay` (opt-in export under `debug/`) | 3 | Optional tooling; keep out of core bundle size path |

RFC Outline (for each PR):
1. Problem Statement
2. Proposed API (TypeScript signatures)
3. Behavioral Guarantees / Idempotence / Cleanup
4. Performance Considerations (baseline cost, sampling overhead)
5. Migration / Adoption Notes
6. Alternatives Considered

Release Notes Draft Segments:
```
### Added
- useChapterNavigation: declarative scrollytelling camera orchestration.
- InteractionController: unified interaction handler toggling.
- CompositeGeoJsonLine: single-source dual-layer line with optional glow.
- Instrumentation hooks: useMapFrameRate, useLayerChangeLog, usePerformanceInstrumentation.
- Protocol template utilities: createTextProtocolHandler, useRegisterProtocol.
  - CSV/TSV convenience transform (query param format=tsv) via `csvOrTsvTransform` helper.
- Deprecation utilities: warnDeprecated, GeoJsonLayerCompat for MlGeoJsonLayer paint/layout migration.
```

Open Coordination Items:
- Confirm naming conventions with maintainers (prefix `Ml` vs plain for hooks/components).
- Decide if instrumentation hooks live under a `debug` namespace to reduce perceived API surface. (DONE locally: `src/debug/index.ts` re-exports.)
- Validate tree-shaking impact (ensure side-effect-free modules, mark package.json `sideEffects: false`). (PARTIAL: sideEffects flag added.)

Next Internal Tasks for Proposal 7:
1. (DONE) Generate RFC markdown stubs (one per PR bundle) – see `upstream/` directory (`RFC_01`..`RFC_06`).
2. (DONE) Add CHANGELOG draft (`CHANGELOG.md`).
3. (DONE) Create issue templates (`.github/ISSUE_TEMPLATE/bug_report.md`, `feature_request.md`).
4. Add cross-links from proposals to RFC files (partial, below) and update as PRs open.
5. Add tree-shaking verification note & sideEffects flag (pending decision once packaging extracted).

Success Criteria Proposal 7:
- All planned RFC stubs exist & reference capabilities sections.
- Proposals doc cross-links to RFC files.
- Each planned PR has isolated diff (no unrelated churn) and green tests locally.

Cross-Link Index:
- RFC 01: `upstream/RFC_01_useChapterNavigation_InteractionController.md`
- RFC 02: `upstream/RFC_02_CompositeGeoJsonLine.md`
- RFC 03: `upstream/RFC_03_InstrumentationHooks.md`
- RFC 04: `upstream/RFC_04_ProtocolTemplate.md`
- RFC 05: `upstream/RFC_05_DeprecationCompat.md`
- RFC 06 (optional): `upstream/RFC_06_DevMetricsOverlay.md`
 - RFC 07 (planned): `upstream/RFC_07_MlTerrain.md`

See `CHANGELOG.md` for aggregated release draft.

### 8. Implementation Priority (Impact vs Effort) *(Expanded)*

Scoring heuristic: Impact (user value / ecosystem reuse) weighted 2x, Effort (estimated engineering days) inverse scaled. Priority = sort by (Impact score desc, Effort asc, dependency order). All core items implemented locally; ordering guides upstream PR sequence & review focus.

| Feature | Effort | Impact | Priority | Readiness | Planned PR | Notes |
|---------|--------|--------|----------|-----------|-----------|-------|
| useChapterNavigation | Low | High | 1 | DONE | PR #1 | Stable; add docs examples |
| InteractionController | Low | Medium | 2 | DONE | PR #1 | Bundled with hook (shared RFC 01) |
| CompositeGeoJsonLine | Medium | High | 3 | DONE | PR #2 | Glow + basic feature signature diff (skips redundant setData) |
| useMapFrameRate | Medium | Medium | 4 | DONE | PR #3 | Exported via debug namespace |
| useLayerChangeLog | Medium | Medium | 5 | DONE | PR #3 | Includes remove/type tracking |
| Protocol template | Low | Medium | 6 | DONE | PR #4 | Includes CSV/TSV transform helper |
| Deprecation guard util (+Compat) | Low | Low | 7 | DONE | PR #5 | One-time warnings covered |
| DevMetricsOverlay *(optional)* | Medium | Medium | 8 | DONE | PR #6 (optional) | Mark experimental in docs |

Legend: Effort (Low ≤1d, Medium 1–2d), Impact (High = broad reuse / DX improvement). Readiness DONE = code + tests + RFC stub.

Dependency Graph Summary:
- PR #1 prerequisite for #2 only conceptually (shared patterns). Others independent except overlay (needs instrumentation hooks).

Review Load Balancing:
- High complexity (CompositeGeoJsonLine, Instrumentation) isolated to separate PRs to keep diff size manageable.

Size / Tree-Shaking Considerations:
- `sideEffects:false` set; debug namespace ensures optional cost. Local prod build ≈5.2 MB dist (includes maplibre + assets); overlay only bundled when imported.
 - Added `npm run build:size` script writing `dist-size.json` (baseline for future CI gate).

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
4. Expand instrumentation: split `usePerformanceInstrumentation` into `useMapFrameRate` + `useLayerChangeLog` per proposed API.
5. Update capabilities doc section 60 upgrade checklist referencing new utilities when merged.

---
Generated: automated optimisation pass (date: 2025-09-04).
