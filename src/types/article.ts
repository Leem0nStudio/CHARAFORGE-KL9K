
import { z } from 'zod';

export interface Article {
    id: string;
    slug: string;
    title: string;
    author: string;
    content: string; // Markdown content
    excerpt?: string;
    status: 'draft' | 'published';
    createdAt: number;
    updatedAt: number;
}


export const UpsertArticleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['draft', 'published']),
});

export type UpsertArticle = z.infer<typeof UpsertArticleSchema>;
