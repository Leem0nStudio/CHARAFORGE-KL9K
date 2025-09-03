
export interface StoryCast {
  id: string;
  user_id: string;
  name: string;
  description: string;
  character_ids: string[];
  created_at: number;
  updated_at: number;
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
