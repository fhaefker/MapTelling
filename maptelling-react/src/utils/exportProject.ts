import type { Chapter } from '../types/story';

export interface ExportProjectOptions {
  chapters: Chapter[];
  images?: { key: string; dataUrl: string; name?: string; size?: number; type?: string }[];
  embedImages?: boolean;
  onlyUsedImages?: boolean; // if true include only images referenced by chapters
}

export interface ExportProjectPayload {
  chapters: Chapter[];
  images?: { key: string; dataUrl: string; name?: string; size?: number; type?: string }[];
  meta: { generated: string; imageCount: number; embedded: boolean; onlyUsed: boolean };
}

export const exportProject = (opts: ExportProjectOptions): ExportProjectPayload => {
  const { chapters, images = [], embedImages = false, onlyUsedImages = true } = opts;
  let included = images;
  if (embedImages && onlyUsedImages) {
    const usedKeys = new Set<string>();
    chapters.forEach(c => { if (c.image && c.image.startsWith('img:')) usedKeys.add(c.image); });
    included = images.filter(i => usedKeys.has(i.key));
  }
  return {
    chapters: [...chapters],
    images: embedImages ? included : undefined,
    meta: { generated: new Date().toISOString(), imageCount: embedImages ? included.length : 0, embedded: embedImages, onlyUsed: onlyUsedImages }
  };
};

export default exportProject;