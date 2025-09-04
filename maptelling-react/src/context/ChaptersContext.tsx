import React, { createContext, useContext, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { Chapter } from '../types/story';
import { ChapterSchema, safeParseChapters } from '../types/storySchema';

interface ChaptersContextValue {
  chapters: Chapter[];
  total: number;
  getByIndex(i: number): Chapter;
  addChapter(ch: Omit<Chapter,'id'> & { id?: string }): Chapter; // dynamic add
  updateChapter(id: string, patch: Partial<Omit<Chapter,'id'>>): Chapter | undefined; // edit existing
  removeChapter(id: string): void; // remove dynamic (non-base) chapter
  resetChapter(id: string): Chapter | undefined; // reset base chapter to original version (overrides cleared)
  getOriginal(id: string): Chapter | undefined; // fetch original base version
  exportChapters(): Chapter[]; // full current chapters (base+extras, overrides applied)
  importChapters(data: Chapter[]): { imported: number; overrides: number; extras: number }; // merge incoming
  baseIds(): string[]; // ids of initial base chapters
}

const ChaptersContext = createContext<ChaptersContextValue | undefined>(undefined);

const LS_KEY = 'maptelling.chapters.extra';
const LS_OVERRIDES_KEY = 'maptelling.chapters.overrides';

export const ChaptersProvider: React.FC<{ chapters: Chapter[]; children: React.ReactNode; }> = ({ chapters: initialChapters, children }) => {
  const baseRef = useRef<Chapter[]>(initialChapters);
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(LS_KEY);
        const rawOverrides = window.localStorage.getItem(LS_OVERRIDES_KEY);
        if (raw) {
          const parsed: Chapter[] = JSON.parse(raw);
            // basic shape guard
          let extras: Chapter[] = Array.isArray(parsed) ? parsed : [];
          let overrides: Record<string, Partial<Chapter>> = {};
          if (rawOverrides) {
            try { overrides = JSON.parse(rawOverrides); } catch {/* ignore */}
          }
          const mergedBase = initialChapters.map(ch => overrides[ch.id] ? { ...ch, ...overrides[ch.id], id: ch.id } as Chapter : ch);
          return [...mergedBase, ...extras];
        }
        // If no extras key but maybe overrides exist
        const rawOv = window.localStorage.getItem(LS_OVERRIDES_KEY);
        if (rawOv) {
          let overrides: Record<string, Partial<Chapter>> = {};
          try { overrides = JSON.parse(rawOv); } catch {/* ignore */}
          const mergedBase = initialChapters.map(ch => overrides[ch.id] ? { ...ch, ...overrides[ch.id], id: ch.id } as Chapter : ch);
          return mergedBase;
        }
      }
    } catch {/* ignore */}
    return initialChapters;
  });
  const addChapter = useCallback((ch: Omit<Chapter,'id'> & { id?: string }) => {
    const id = ch.id || `chapter_${Date.now().toString(36)}`;
    const candidate: Chapter = { ...ch, id } as Chapter;
    const parsed = ChapterSchema.safeParse(candidate);
    if (!parsed.success) {
      // eslint-disable-next-line no-console
      console.warn('[Chapters] addChapter validation failed', parsed.error.issues.map(i=>i.message));
      return candidate; // return anyway but don't persist invalid
    }
    setChapters(prev => [...prev, parsed.data]);
    return parsed.data;
  }, []);
  const updateChapter = useCallback((id: string, patch: Partial<Omit<Chapter,'id'>>) => {
    let updated: Chapter | undefined;
    setChapters(prev => prev.map(ch => {
      if (ch.id === id) {
        const candidate = { ...ch, ...patch, id: ch.id } as Chapter;
        const parsed = ChapterSchema.safeParse(candidate);
        if (!parsed.success) {
          console.warn('[Chapters] updateChapter validation failed', parsed.error.issues.map(i=>i.message));
          updated = candidate; // keep candidate (soft fail)
          return candidate;
        }
        updated = parsed.data;
        return parsed.data;
      }
      return ch;
    }));
    return updated;
  }, []);
  const removeChapter = useCallback((id: string) => {
    setChapters(prev => prev.filter((c, idx) => {
      // only allow removal if not part of original base
      const baseIndex = baseRef.current.findIndex(b => b.id === id);
      if (baseIndex !== -1) return true; // keep base chapters
      return c.id !== id;
    }));
  }, []);
  const getOriginal = useCallback((id: string) => baseRef.current.find(c => c.id === id), []);
  const resetChapter = useCallback((id: string) => {
    const orig = baseRef.current.find(c => c.id === id);
    if (!orig) return undefined;
    let restored: Chapter | undefined;
    setChapters(prev => prev.map(ch => {
      if (ch.id === id) { restored = { ...orig }; return restored; }
      return ch;
    }));
    return restored;
  }, []);
  // Persist only the extra chapters beyond the initial baseline
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const baseCount = baseRef.current.length;
        const extras = chapters.slice(baseCount);
        window.localStorage.setItem(LS_KEY, JSON.stringify(extras));
        // compute overrides vs original base
        const overrides: Record<string, Partial<Chapter>> = {};
        chapters.slice(0, baseCount).forEach((ch, idx) => {
          const orig = baseRef.current[idx];
          if (!orig) return;
            // compare shallow fields; if different store full diff excluding id
          const diff: Partial<Chapter> = {};
          (['title','description','alignment','image','location','marker'] as (keyof Chapter)[]).forEach(k => {
            const oVal = (orig as any)[k];
            const nVal = (ch as any)[k];
            if (JSON.stringify(oVal) !== JSON.stringify(nVal)) (diff as any)[k] = nVal;
          });
          if (Object.keys(diff).length) overrides[ch.id] = diff;
        });
        if (Object.keys(overrides).length) {
          window.localStorage.setItem(LS_OVERRIDES_KEY, JSON.stringify(overrides));
        } else {
          window.localStorage.removeItem(LS_OVERRIDES_KEY);
        }
      }
    } catch {/* ignore */}
  }, [chapters]);

  const exportChapters = useCallback(() => [...chapters], [chapters]);
  const importChapters = useCallback((incoming: Chapter[]) => {
    if (!Array.isArray(incoming)) return { imported: 0, overrides: 0, extras: 0 };
    const parsed = safeParseChapters(incoming);
    if (!parsed.valid) {
      console.warn('[Chapters] import validation errors', parsed.errors);
    }
    const validIncoming: Chapter[] = parsed.value as Chapter[];
    const baseMap = new Map(baseRef.current.map(b => [b.id, b] as [string, Chapter]));
    const overrides: Record<string, Partial<Chapter>> = {};
    const extras: Chapter[] = [];
    validIncoming.forEach(ch => {
      if (!ch || typeof ch !== 'object') return;
      if (!ch.id || !ch.title || !ch.description || !ch.location || !Array.isArray(ch.location.center)) return;
      if (baseMap.has(ch.id)) {
        overrides[ch.id] = { ...ch, id: ch.id } as any;
      } else {
        extras.push(ch as Chapter);
      }
    });
    // rebuild base with overrides
    const newBase = baseRef.current.map(b => overrides[b.id] ? { ...b, ...(overrides[b.id] as Chapter), id: b.id } : b);
    setChapters([...newBase, ...extras]);
    return { imported: incoming.length, overrides: Object.keys(overrides).length, extras: extras.length };
  }, []);
  const baseIds = useCallback(() => baseRef.current.map(b => b.id), []);

  const value = useMemo<ChaptersContextValue>(() => ({
    chapters,
    total: chapters.length,
    getByIndex: (i: number) => chapters[Math.min(Math.max(i, 0), chapters.length - 1)],
    addChapter,
    updateChapter,
    removeChapter,
    resetChapter,
    getOriginal,
    exportChapters,
    importChapters,
    baseIds
  }), [chapters, addChapter, updateChapter, removeChapter, resetChapter, getOriginal, exportChapters, importChapters, baseIds]);
  return <ChaptersContext.Provider value={value}>{children}</ChaptersContext.Provider>;
};
export const resetStoredChapters = () => { if (typeof window !== 'undefined') { window.localStorage.removeItem(LS_KEY); } };

export const useChapters = () => {
  const ctx = useContext(ChaptersContext);
  if (!ctx) throw new Error('useChapters must be used within ChaptersProvider');
  return ctx;
};

export default ChaptersProvider;