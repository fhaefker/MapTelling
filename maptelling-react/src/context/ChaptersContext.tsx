import React, { createContext, useContext, useMemo } from 'react';
import { Chapter } from '../config/mapConfig';

interface ChaptersContextValue {
  chapters: Chapter[];
  total: number;
  getByIndex(i: number): Chapter;
}

const ChaptersContext = createContext<ChaptersContextValue | undefined>(undefined);

export const ChaptersProvider: React.FC<{ chapters: Chapter[]; children: React.ReactNode; }> = ({ chapters, children }) => {
  const value = useMemo<ChaptersContextValue>(() => ({
    chapters,
    total: chapters.length,
    getByIndex: (i: number) => chapters[Math.min(Math.max(i, 0), chapters.length - 1)]
  }), [chapters]);
  return <ChaptersContext.Provider value={value}>{children}</ChaptersContext.Provider>;
};

export const useChapters = () => {
  const ctx = useContext(ChaptersContext);
  if (!ctx) throw new Error('useChapters must be used within ChaptersProvider');
  return ctx;
};

export default ChaptersProvider;