import { z } from 'zod';

interface AiModelVersion {
  id: string;
  name: string;
  triggerWords?: string[];
}

export interface AiModel {
  id: string;
  name: string;
  type: 'model' | 'lora';
  engine: 'huggingface' | 'gemini' | 'openrouter';
  hf_id: string;
  civitaiModelId?: string;
  versionId?: string;
  coverMediaUrl?: string | null;
  coverMediaType?: 'image' | 'video';
  triggerWords?: string[];
  versions?: AiModelVersion[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // If present, it's a user-specific model
}

export const UpsertModelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['model', 'lora']),
  engine: z.enum(['huggingface', 'gemini', 'openrouter']),
  hf_id: z.string().min(1, 'Execution ID is required'),
  civitaiModelId: z.string().optional(),
  versionId: z.string().optional(),
  coverMediaUrl: z.string().url().nullable().optional(),
  coverMediaType: z.enum(['image', 'video']).optional(),
  triggerWords: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return [];
  }),
  versions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    triggerWords: z.array(z.string()).optional(),
  })).optional(),
});

export type UpsertAiModel = z.infer<typeof UpsertModelSchema>;