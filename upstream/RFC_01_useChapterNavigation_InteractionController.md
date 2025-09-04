# RFC 01: useChapterNavigation & InteractionController

## 1. Problem
Scrollytelling camera logic and interaction toggling repeated across apps → duplication & inconsistent behavior.

## 2. Proposed APIs
```ts
useChapterNavigation(options: {
  mapId: string; chapters: Chapter[]; autoplay?: boolean; autoplayIntervalMs?: number; flyOptions?: Partial<maplibregl.FlyToOptions>; initialChapter?: number;
}): {
  currentChapter: number; isPlaying: boolean; goToChapter(i:number, immediate?:boolean):void; next():void; previous():void; togglePlay():void; setPlaying(b:boolean):void;
}

<InteractionController mapId string enabled boolean modes? {scrollZoom?,dragPan?,keyboard?,doubleClickZoom?,touchZoomRotate?} temporary? boolean />
```

## 3. Behavior Guarantees
- No timers when autoplay disabled.
- Idempotent handler toggling (checks isEnabled()).
- Restores original states if `temporary`.

## 4. Performance
Negligible overhead (<0.1ms per render). No extra listeners beyond map handlers used already.

## 5. Migration
Pure addition; no breaking changes.

## 6. Alternatives
Inline imperative code; rejected due to duplication.

## 7. Test Plan
- Hook navigation index updates.
- Interaction handlers: mock enable/disable calls counted only once per state change.

## 8. References
Capabilities: sections 40 (lifecycle), 47 (extension), 48 (anti-patterns).
