'use server';

/**
 * @fileOverview A server action to save a generated character to Firestore.
 *
 * - saveCharacter - Saves character data to the 'characters' collection.
 * - SaveCharacterInput - The input type for the saveCharacter function.
 */

import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';

const SaveCharacterInputSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string(),
  biography: z.string(),
  imageUrl: z.string(),
  userId: z.string(),
});
export type SaveCharacterInput = z.infer<typeof SaveCharacterInputSchema>;

export async function saveCharacter(input: SaveCharacterInput) {
  const validation = SaveCharacterInputSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { name, description, biography, imageUrl, userId } = validation.data;

  try {
    const characterRef = await adminDb.collection('characters').add({
      userId,
      name,
      description,
      biography,
      imageUrl,
      status: 'private', // 'private' or 'public'
      createdAt: new Date(),
    });
    return { success: true, characterId: characterRef.id };
  } catch (error) {
    console.error('Error saving character to Firestore:', error);
    throw new Error('Could not save character.');
  }
}
