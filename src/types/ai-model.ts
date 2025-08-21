

import { z } from 'zod';

interface AiModelVersion {
  id: string;
  name: string;
  baseModel?: string;
  triggerWords?: string[];
}

export type SyncStatus = 'synced' | 'syncing' | 'notsynced';

export interface AiModel {
  id: string;
  name: string;
  type: 'model' | 'lora';
  engine: 'huggingface' | 'gemini' | 'openrouter' | 'vertexai' | 'comfyui' | 'modelslab';
  hf_id: string; // Used for various IDs: HF ID, Vertex Endpoint ID, ModelsLab Model ID etc.
  civitaiModelId?: string;
  modelslabModelId?: string; 
  versionId?: string; // Used by Civitai and ModelsLab
  baseModel?: string; // The base model identifier, e.g., "SDXL 1.0"
  coverMediaUrl?: string | null;
  coverMediaType?: 'image' | 'video';
  triggerWords?: string[];
  versions?: AiModelVersion[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // If present, it's a user-specific model
  syncStatus?: SyncStatus;
  vertexAiAlias?: string; // Alias for Vertex AI LoRAs
  // ComfyUI specific fields
  apiUrl?: string;
  comfyWorkflow?: object;
  // Model Mixer specific field
  mixRecipe?: { 
    script: string,
    hfRepo?: string,
  };
}

export const UpsertModelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['model', 'lora']),
  engine: z.enum(['huggingface', 'gemini', 'openrouter', 'vertexai', 'comfyui', 'modelslab']),
  hf_id: z.string().optional(), // Now optional at the base level
  civitaiModelId: z.string().optional(),
  modelslabModelId: z.string().optional(), 
  versionId: z.string().optional(),
  baseModel: z.string().optional(),
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
    baseModel: z.string().optional(),
    triggerWords: z.array(z.string()).optional(),
  })).optional(),
  syncStatus: z.enum(['synced', 'syncing', 'notsynced']).optional(),
  vertexAiAlias: z.string().optional(),
  apiUrl: z.string().optional(),
  comfyWorkflow: z.any().optional(),
}).refine(data => {
    const requiredEngines = ['huggingface', 'vertexai', 'comfyui', 'modelslab'];
    if (requiredEngines.includes(data.engine)) {
        return !!data.hf_id;
    }
    return true;
}, {
    message: "Execution ID is required for the selected engine.",
    path: ["hf_id"], // Specify which field the error message applies to
});


export type UpsertAiModel = z.infer<typeof UpsertModelSchema>;
