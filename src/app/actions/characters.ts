'use server';

import { z } from 'zod';

// This file is being deprecated and its contents moved to more specific files.
// For now, it will re-export the schemas and types for backward compatibility during transition.

// Zod validation schemas. Following the "Rigorous Server-Side Validation" pattern.
export const UpdateStatusSchema = z.enum(['private', 'public']);
export const UpdateCharacterSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  biography: z.string().min(1, "Biography is required.").max(15000, "Biography is too long."),
  alignment: z.enum(['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil']),
});

export const SaveCharacterInputSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string(),
  biography: z.string(),
  imageUrl: z.string().startsWith('data:image/'),
  dataPackId: z.string().optional().nullable(),
  tags: z.string().optional(),
});
export type SaveCharacterInput = z.infer<typeof SaveCharacterInputSchema>;
