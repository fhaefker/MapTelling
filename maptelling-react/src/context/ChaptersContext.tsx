import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { Chapter } from '../config/mapConfig';

interface ChaptersContextValue {
  chapters: Chapter[];
  total: number;
  getByIndex(i: number): Chapter;
  addChapter(ch: Omit<Chapter,'id'> & { id?: string }): Chapter; // dynamic add
}

const ChaptersContext = createContext<ChaptersContextValue | undefined>(undefined);

export const ChaptersProvider: React.FC<{ chapters: Chapter[]; children: React.ReactNode; }> = ({ chapters: initialChapters, children }) => {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const addChapter = useCallback((ch: Omit<Chapter,'id'> & { id?: string }) => {
    const id = ch.id || `chapter_${Date.now().toString(36)}`;
    const chapter: Chapter = { ...ch, id } as Chapter;
    setChapters(prev => [...prev, chapter]);
    return chapter;
  }, []);
  const value = useMemo<ChaptersContextValue>(() => ({
    chapters,
    total: chapters.length,
    getByIndex: (i: number) => chapters[Math.min(Math.max(i, 0), chapters.length - 1)],
    addChapter
  }), [chapters, addChapter]);
  return <ChaptersContext.Provider value={value}>{children}</ChaptersContext.Provider>;
};

export const useChapters = () => {
  const ctx = useContext(ChaptersContext);
  if (!ctx) throw new Error('useChapters must be used within ChaptersProvider');
  return ctx;
};

export default ChaptersProvider;