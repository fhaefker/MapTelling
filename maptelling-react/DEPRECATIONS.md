# Deprecations Roadmap

This file tracks components/hooks marked for removal after the current refactor cycle.

## CompositeGeoJsonLine
- Status: Deprecated (see header in `src/components/CompositeGeoJsonLine.tsx`).
- Replacement: `GeoJsonLine` for single simple line use-cases. For glow effect, wrap two `GeoJsonLine` components or extend `GeoJsonLine` with a shadow prop (future proposal).
- Removal Plan:
  - Phase 1 (current): Mark deprecated, keep tests to ensure parity.
  - Phase 2: Introduce `GeoJsonLineGlow` convenience wrapper (optional) and migrate internal usages.
  - Phase 3: Remove `CompositeGeoJsonLine` and its test once no internal usages remain and a minor version boundary is published.

## TrackCompositeLayer
- Status: Legacy placeholder already superseded by line components.
- Plan: Remove in same phase as `CompositeGeoJsonLine` removal.

## Action Items
- [ ] Add `GeoJsonLineGlow` convenience wrapper (optional).
- [ ] Migrate any residual internal uses (currently none in `MapShell`).
- [ ] Publish migration notes in README.
- [ ] Remove deprecated files.

