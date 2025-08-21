

import { z } from 'zod';

/**
 * Represents a single event in a character's history.
 */
export interface TimelineEvent {
  id: string; // Unique identifier for the event
  date: string; // A descriptive date, e.g., "Age 25", "Year of the Comet"
  title: string;
  description: string;
  relatedCharacterIds?: string[];
}

export type ShowcaseProcessingStatus = 'idle' | 'removing-background' | 'upscaling' | 'finalizing' | 'complete' | 'failed';

/**
 * A more professional, modular structure for the Character object.
 * Properties are grouped into logical sub-objects for clarity and maintainability.
 */
export type Character = {
  id: string; // The document ID remains at the top level.

  // Core character sheet information.
  core: {
    name: string;
    archetype: string | null;
    alignment: 'Lawful Good' | 'Neutral Good' | 'Chaotic Good' | 'Lawful Neutral' | 'True Neutral' | 'Chaotic Neutral' | 'Lawful Evil' | 'Neutral Evil' | 'Chaotic Evil';
    biography: string;
    physicalDescription: string | null;
    equipment: string[] | null;
    timeline: TimelineEvent[];
    tags: string[];
    rarity: 1 | 2 | 3 | 4 | 5;
  };

  // Visual assets of the character.
  visuals: {
    imageUrl: string;
    gallery: string[];
    showcaseImageUrl: string | null; // URL for the high-quality, background-removed showcase image
    isShowcaseProcessed: boolean; // Flag for the showcase image processing status
    showcaseProcessingStatus?: ShowcaseProcessingStatus; // Detailed status of the pipeline
  };

  // Metadata about the record itself.
  meta: {
    userId: string;
    userName?: string; // Denormalized for display
    status: 'private' | 'public';
    createdAt: Date;
    isNsfw: boolean;
    dataPackId: string | null;
    dataPackName?: string | null; // Denormalized for display
  };

  // Versioning and branching information.
  lineage: {
    version: number;
    versionName: string;
    baseCharacterId: string | null;
    versions: { id: string; name: string; version: number }[];
    branchedFromId: string | null;
    originalAuthorId: string | null;
    originalAuthorName?: string | null; // Denormalized for display
  };

  // Sharing and permission settings.
  settings: {
    isSharedToDataPack: boolean;
    branchingPermissions: 'private' | 'public';
  };
  
  // Information about the AI engines used for generation.
  generation: {
    textEngine?: 'gemini' | 'openrouter';
    imageEngine?: 'gemini' | 'openrouter' | 'huggingface' | 'vertexai' | 'comfyui' | 'modelslab';
    wizardData?: Record<string, string> | null;
    originalPrompt?: string; // The original simple text prompt
  }
};

// Zod validation schemas updated to reflect the new structure.

export const UpdateCharacterSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  biography: z.string().min(1, "Biography is required.").max(15000, "Biography is too long."),
  alignment: z.enum(['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil']),
  archetype: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  physicalDescription: z.string().optional(),
  rarity: z.number().min(1).max(5).optional(),
});

export const SaveCharacterInputSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  biography: z.string(),
  imageUrl: z.string().startsWith('data:image/'),
  dataPackId: z.string().optional().nullable(),
  tags: z.string().optional(),
  archetype: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  physicalDescription: z.string().optional(),
  textEngine: z.enum(['gemini', 'openrouter']).optional(),
  imageEngine: z.enum(['gemini', 'openrouter', 'huggingface', 'vertexai', 'comfyui', 'modelslab']).optional(),
  wizardData: z.record(z.string()).optional().nullable(),
  originalPrompt: z.string().optional(),
  rarity: z.number().min(1).max(5).optional(),
});
export type SaveCharacterInput = z.infer<typeof SaveCharacterInputSchema>;
