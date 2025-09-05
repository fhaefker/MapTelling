import { useCallback, useState } from 'react';

// Simple in-memory + localStorage image store. Images saved as data URLs; returns a key usable in chapter.image.
// Key format: img:<timestamp>
const LS_KEY = 'maptelling.images.v1';
export interface StoredImage { key: string; dataUrl: string; name?: string; size?: number; type?: string; }

export const useImageStore = () => {
  const [images, setImages] = useState<StoredImage[]>(() => {
    if (typeof window === 'undefined') return [];
    try { const raw = window.localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch {/* ignore */}
    return [];
  });
  const persist = (next: StoredImage[]) => {
    setImages(next); if (typeof window !== 'undefined') { try { window.localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {/* ignore */} }
  };
  const addFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files as any as File[]);
    const added: StoredImage[] = [];
    for (const f of list) {
      if (!f.type.startsWith('image/')) continue;
      const dataUrl: string = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f); });
      const key = `img:${Date.now().toString(36)}:${Math.random().toString(36).slice(2,8)}`;
      added.push({ key, dataUrl, name: f.name, size: f.size, type: f.type });
    }
    if (added.length) persist([...images, ...added]);
    return added;
  }, [images]);
  const remove = useCallback((key: string) => { const next = images.filter(i => i.key !== key); persist(next); }, [images]);
  const getUrl = useCallback((key: string) => {
    const found = images.find(i => i.key === key);
    return found?.dataUrl || null;
  }, [images]);
  return { images, addFiles, remove, getUrl };
};

export default useImageStore;
