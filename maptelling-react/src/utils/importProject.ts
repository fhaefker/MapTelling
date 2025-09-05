import type { Chapter } from '../types/story';
import { safeParseChapters } from '../types/storySchema';

export interface ImportProjectResult {
  chapters: Chapter[];
  images?: { key: string; dataUrl: string; name?: string; size?: number; type?: string }[];
  errors?: string[];
}

export const importProject = (json: any): ImportProjectResult => {
  const errors: string[] = [];
  if (!json || typeof json !== 'object') return { chapters: [], errors: ['invalid root object'] };
  const chaptersRaw = json.chapters;
  const imagesRaw = json.images;
  let chapters: Chapter[] = [];
  if (Array.isArray(chaptersRaw)) {
    const parsed = safeParseChapters(chaptersRaw as any);
    if (parsed.valid) chapters = parsed.value as Chapter[]; else errors.push('chapter validation failed');
  } else {
    errors.push('chapters missing');
  }
  let images: any[] | undefined = undefined;
  if (Array.isArray(imagesRaw)) {
    images = imagesRaw.filter(im => im?.key && im?.dataUrl);
  }
  return { chapters, images, errors: errors.length ? errors : undefined };
};

export default importProject;