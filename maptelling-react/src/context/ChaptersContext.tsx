import React, { createContext, useContext, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { Chapter } from '../types/story';

interface ChaptersContextValue {
  chapters: Chapter[];
  total: number;
  getByIndex(i: number): Chapter;
  addChapter(ch: Omit<Chapter,'id'> & { id?: string }): Chapter; // dynamic add
}

const ChaptersContext = createContext<ChaptersContextValue | undefined>(undefined);

const LS_KEY = 'maptelling.chapters.extra';

export const ChaptersProvider: React.FC<{ chapters: Chapter[]; children: React.ReactNode; }> = ({ chapters: initialChapters, children }) => {
  const baseRef = useRef<Chapter[]>(initialChapters);
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(LS_KEY);
        if (raw) {
          const parsed: Chapter[] = JSON.parse(raw);
            // basic shape guard
          if (Array.isArray(parsed)) return [...initialChapters, ...parsed];
        }
      }
    } catch {/* ignore */}
    return initialChapters;
  });
  const addChapter = useCallback((ch: Omit<Chapter,'id'> & { id?: string }) => {
    const id = ch.id || `chapter_${Date.now().toString(36)}`;
    const chapter: Chapter = { ...ch, id } as Chapter;
    setChapters(prev => [...prev, chapter]);
    return chapter;
  }, []);
  // Persist only the extra chapters beyond the initial baseline
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const extras = chapters.slice(baseRef.current.length);
        window.localStorage.setItem(LS_KEY, JSON.stringify(extras));
      }
    } catch {/* ignore */}
  }, [chapters]);

  const value = useMemo<ChaptersContextValue>(() => ({
    chapters,
    total: chapters.length,
    getByIndex: (i: number) => chapters[Math.min(Math.max(i, 0), chapters.length - 1)],
    addChapter
  }), [chapters, addChapter]);
  return <ChaptersContext.Provider value={value}>{children}</ChaptersContext.Provider>;
};
export const resetStoredChapters = () => { if (typeof window !== 'undefined') { window.localStorage.removeItem(LS_KEY); } };

export const useChapters = () => {
  const ctx = useContext(ChaptersContext);
  if (!ctx) throw new Error('useChapters must be used within ChaptersProvider');
  return ctx;
};

export default ChaptersProvider;