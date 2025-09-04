# useChapterNavigation Hook

High-level camera + chapter state abstraction (implements Proposal 1 in `MAPCOMPONENTS_EXTENSION_PROPOSALS.md`).

## API
```ts
interface UseChapterNavigationOptions {
  mapId: string;
  chapters: Chapter[]; // must remain index stable
  autoplay?: boolean;
  autoplayIntervalMs?: number; // default 4000
  flyOptions?: Partial<maplibregl.FlyToOptions>;
  initialChapter?: number; // default 0
}
interface ChapterNavigationApi {
  currentChapter: number;
  isPlaying: boolean;
  goToChapter(index: number, immediate?: boolean): void;
  next(): void;
  previous(): void;
  togglePlay(): void;
  setPlaying(play: boolean): void;
}
```

## Usage
```tsx
const nav = useChapterNavigation({ mapId: 'main', chapters });
<button onClick={nav.previous}>Prev</button>
<button onClick={nav.togglePlay}>{nav.isPlaying ? 'Pause' : 'Play'}</button>
```

## Design Notes
- No interval allocated unless `isPlaying`.
- Idempotent map effects; safe before map load.
- Extensible for future chapterchange events.

## Edge Cases
- Out-of-range indices ignored.
- Autoplay stops gracefully at last chapter.
- If chapter array shrinks, current index may clamp on next navigation (left to caller to manage data mutations).

