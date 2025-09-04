import { z } from 'zod';

export const ChapterLocationSchema = z.object({
  center: z.tuple([z.number(), z.number()]),
  zoom: z.number().min(0).max(24),
  pitch: z.number().min(0).max(85).optional(),
  bearing: z.number().min(-360).max(360).optional(),
});

export const ChapterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  alignment: z.enum(['left','center','right','full']).optional(),
  image: z.string().url().optional().or(z.string().min(1).optional()),
  location: ChapterLocationSchema,
  marker: z.object({ coordinates: z.tuple([z.number(), z.number()]) }).optional(),
});

export const ChapterArraySchema = z.array(ChapterSchema);

export type ChapterParseError = { index: number; errors: string[] };

export function safeParseChapters(data: unknown): { valid: boolean; value: any[]; errors: ChapterParseError[] } {
  if (!Array.isArray(data)) return { valid: false, value: [], errors: [{ index: -1, errors: ['Not an array'] }] };
  const errors: ChapterParseError[] = [];
  const value: any[] = [];
  data.forEach((item, idx) => {
    const res = ChapterSchema.safeParse(item);
    if (res.success) value.push(res.data); else errors.push({ index: idx, errors: res.error.issues.map(i => i.message) });
  });
  return { valid: errors.length === 0, value, errors };
}
