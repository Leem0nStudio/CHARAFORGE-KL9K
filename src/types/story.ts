
import type { Character } from './character';

/**
 * Represents a collection of characters, or a "cast", for a story.
 */
export interface StoryCast {
  id: string;
  userId: string;
  name: string;
  description: string;
  characterIds: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Represents a generated story.
 */
export interface Story {
    id: string;
    userId: string;
    castId: string;
    title: string;
    content: string; // The full story text
    prompt: string;
    createdAt: number;
}
