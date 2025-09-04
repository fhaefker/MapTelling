import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';
import type { Chapter } from '../config/mapConfig';

export interface UseChapterNavigationOptions {
  mapId: string;
  chapters: Chapter[];
  autoplay?: boolean;
  autoplayIntervalMs?: number;
  flyOptions?: Partial<maplibregl.FlyToOptions>;
  initialChapter?: number;
}

export interface ChapterNavigationApi {
  currentChapter: number;
  isPlaying: boolean;
  goToChapter: (index: number, immediate?: boolean) => void;
  next: () => void;
  previous: () => void;
  togglePlay: () => void;
  setPlaying: (play: boolean) => void;
}

// Hook centralising chapter based camera navigation (see capabilities sec40 lifecycle / sec51 hook patterns)
export const useChapterNavigation = (opts: UseChapterNavigationOptions): ChapterNavigationApi => {
  const { mapId, chapters, autoplay = false, autoplayIntervalMs = 4000, flyOptions, initialChapter = 0 } = opts;
  const { map } = useMap({ mapId });
  const [currentChapter, setCurrentChapter] = useState(initialChapter);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoplay);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const applyChapter = useCallback((index: number, immediate?: boolean) => {
    if (!map?.map) return;
    const chapter = chapters[index];
    if (!chapter) return;
    const { center, zoom, bearing = 0, pitch = 0 } = chapter.location;
    if (immediate) {
      map.map.jumpTo({ center, zoom, bearing, pitch });
    } else {
      map.map.flyTo({
        center,
        zoom,
        bearing,
        pitch,
        speed: 0.8,
        curve: 1.42,
        essential: true,
        ...flyOptions,
      });
    }
  }, [map?.map, chapters, flyOptions]);

  const goToChapter = useCallback((index: number, immediate?: boolean) => {
    if (index < 0 || index >= chapters.length) return;
    setCurrentChapter(index);
    applyChapter(index, immediate);
  }, [chapters.length, applyChapter]);

  const next = useCallback(() => {
    setCurrentChapter(prev => {
      const nextIdx = Math.min(chapters.length - 1, prev + 1);
      if (nextIdx !== prev) applyChapter(nextIdx);
      return nextIdx;
    });
  }, [chapters.length, applyChapter]);

  const previous = useCallback(() => {
    setCurrentChapter(prev => {
      const nextIdx = Math.max(0, prev - 1);
      if (nextIdx !== prev) applyChapter(nextIdx);
      return nextIdx;
    });
  }, [applyChapter]);

  const setPlaying = useCallback((play: boolean) => {
    setIsPlaying(play);
  }, []);

  const togglePlay = useCallback(() => setIsPlaying(p => !p), []);

  // Initial camera once map ready
  useEffect(() => {
    if (!map?.map) return;
    applyChapter(initialChapter, true);
  }, [map?.map, applyChapter, initialChapter]);

  // Autoplay interval
  useEffect(() => {
    clearTimer();
    if (!isPlaying) return;
    timerRef.current = setInterval(() => {
      setCurrentChapter(prev => {
        const nextIdx = prev + 1;
        if (nextIdx >= chapters.length) {
          clearTimer();
          setIsPlaying(false);
          return prev;
        }
        applyChapter(nextIdx);
        return nextIdx;
      });
    }, autoplayIntervalMs);
    return clearTimer;
  }, [isPlaying, autoplayIntervalMs, chapters.length, applyChapter]);

  return { currentChapter, isPlaying, goToChapter, next, previous, togglePlay, setPlaying };
};

export default useChapterNavigation;
