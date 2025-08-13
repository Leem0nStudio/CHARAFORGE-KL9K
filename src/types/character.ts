
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


/**
 * Represents the structure of a Character object throughout the application.
 */
export type Character = {
  id: string;
  name: string;
  description: string;
  biography: string;
  imageUrl: string; 
  gallery?: string[]; 
  userId: string;
  status: 'private' | 'public';
  createdAt: Date; 
  userName?: string;
  dataPackId?: string | null;
  isNsfw?: boolean; // Added for explicit NSFW content marking
  isSharedToDataPack?: boolean; // Controls visibility in DataPack gallery
  version: number;
  versionName: string;
  baseCharacterId: string | null;
  versions: { id: string; name: string; version: number }[];
  branchingPermissions?: 'private' | 'public';
  // New lineage fields
  branchedFromId?: string | null;
  originalAuthorId?: string | null;
  originalAuthorName?: string | null;
  dataPackName?: string | null; // Added for display purposes
  alignment: 'Lawful Good' | 'Neutral Good' | 'Chaotic Good' | 'Lawful Neutral' | 'True Neutral' | 'Chaotic Neutral' | 'Lawful Evil' | 'Neutral Evil' | 'Chaotic Evil';
  tags?: string[];
  timeline?: TimelineEvent[]; // New field for the character's timeline
};

// Zod validation schemas for character actions.
// They live here, in a neutral types file, not in a 'use server' file.

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
