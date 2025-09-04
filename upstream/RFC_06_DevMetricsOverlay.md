# RFC 06: DevMetricsOverlay (Instrumentation Debug HUD)

## 1. Problem Statement
Developers integrating new instrumentation hooks lack a consolidated, visual surface to verify metrics (FPS, layer changes, load timing) without writing ad‑hoc console logs.

## 2. Proposed Export
```tsx
<DevMetricsOverlay mapId="primary" position="top-right" refreshMs={500} />
```
Namespace: exported under `debug/DevMetricsOverlay` (opt-in, excluded from production bundles via tree-shaking; zero side effects unless rendered).

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| mapId | string | (required) | Target map instance id. |
| position | 'top-left'|'top-right'|'bottom-left'|'bottom-right' | 'top-right' | Screen placement. |
| refreshMs | number | 1000 | Polling interval for snapshot of hook states. |
| minimal | boolean | false | Hide verbose sections (e.g., layer change log) for compact display. |

## 3. Behavior & Guarantees
- Purely developmental: component is inert in production builds if consumer gates it (recommended `process.env.NODE_ENV !== 'production'`).
- Does not register global listeners beyond existing hook subscriptions; unmount cleans all timers.
- Renders semantic sections: Performance (avg FPS), Layers (recent adds/updates), Timing (initial load metrics), Memory hint (placeholder; future integration with perf API).

## 4. Performance Considerations
- Polling cost bounded by `refreshMs`; internal sampling relies on existing hooks that already throttle with `requestAnimationFrame` or event-driven updates.
- No DOM reflow heavy operations; list truncation keeps node count small (<50 rows).

## 5. Migration / Adoption
- Optional drop-in while adopting instrumentation hooks.
- Recommended to wrap in a conditional to avoid bundling in production (or rely on tree-shaking if placed under `debug/`).

## 6. Alternatives Considered
- CLI-based live metrics streaming (higher complexity).
- Browser extension panel (out-of-scope for initial feature set).

## 7. Open Questions
- Should overlay expose a callback for custom metric aggregation? (Defer.)
- Provide theming API or rely on minimal inline styles? (Phase 2.)

## 8. Test Plan
- Snapshot render (JS DOM) verifying sections appear.
- Simulated hook data injection (mocks) to ensure values propagate.
- Unmount test ensures timers cleared (no pending intervals in fake timers).

## 9. Rollout
- Merge behind documentation note: "Not stable API; subject to change until instrumentation feedback cycle complete".
- Collect feedback after first two consumer projects integrate.

## 10. Reference
Relates to capabilities: section 56 (Perf instrumentation) and proposal bundle plan PR 6 (optional).
