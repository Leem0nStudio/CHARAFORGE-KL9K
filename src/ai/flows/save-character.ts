
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
import { verifyAndGetUid } from '@/lib/auth/server';


const SaveCharacterInputSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string(),
  biography: z.string(),
  imageUrl: z.string().refine(val => val.length < 1048487, {
    message: "Image data is too large for database storage."
  }),
});
export type SaveCharacterInput = z.infer<typeof SaveCharacterInputSchema>;


export async function saveCharacter(input: SaveCharacterInput) {
  const validation = SaveCharacterInputSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    throw new Error(`Invalid input for ${firstError.path.join('.')}: ${firstError.message}`);
  }
  
  const { name, description, biography, imageUrl } = validation.data;
  
  try {
    const userId = await verifyAndGetUid();

    if (!adminDb) {
      throw new Error('Database service is not available. Please try again later.');
    }

    const characterRef = adminDb.collection('characters').doc();
    const userRef = adminDb.collection('users').doc(userId);

    await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        transaction.set(characterRef, {
            userId,
            name,
            description,
            biography,
            imageUrl,
            gallery: [imageUrl],
            status: 'private',
            createdAt: FieldValue.serverTimestamp(),
        });
        
        if (!userDoc.exists || !userDoc.data()?.stats) {
            transaction.set(userRef, { 
                stats: { charactersCreated: 1 } 
            }, { merge: true });
        } else {
            transaction.update(userRef, {
                'stats.charactersCreated': FieldValue.increment(1)
            });
        }
    });

    return { success: true, characterId: characterRef.id };
  } catch (error) {
    console.error('Error saving character to Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'Could not save character due to a server error.';
    throw new Error(errorMessage);
  }
}
