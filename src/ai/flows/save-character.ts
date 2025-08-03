'use server';

/**
 * @fileOverview A server action to save a generated character to Firestore.
 *
 * - saveCharacter - Saves character data to the 'characters' collection.
 * - SaveCharacterInput - The input type for the saveCharacter function.
 */

import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

const SaveCharacterInputSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string(),
  biography: z.string(),
  imageUrl: z.string(),
  userId: z.string(),
  userName: z.string(),
});
export type SaveCharacterInput = z.infer<typeof SaveCharacterInputSchema>;

export async function saveCharacter(input: SaveCharacterInput) {
  const validation = SaveCharacterInputSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { name, description, biography, imageUrl, userId, userName } = validation.data;

  try {
    const characterRef = adminDb.collection('characters').doc();
    const userRef = adminDb.collection('users').doc(userId);

    await adminDb.runTransaction(async (transaction) => {
        // 1. Create the new character
        transaction.set(characterRef, {
            userId,
            userName,
            name,
            description,
            biography,
            imageUrl,
            status: 'private', // 'private' or 'public'
            createdAt: new Date(),
        });

        // 2. Atomically increment the user's character count
        transaction.update(userRef, {
            'stats.charactersCreated': FieldValue.increment(1)
        });
    });

    return { success: true, characterId: characterRef.id };
  } catch (error) {
    console.error('Error saving character to Firestore:', error);
    throw new Error('Could not save character.');
  }
}
