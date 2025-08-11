
'use server';

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
  timeline?: TimelineEvent[]; // New field for the character's timeline
};
