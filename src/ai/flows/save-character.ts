'use server';

/**
 * @fileOverview A server action to save a generated character to Firestore.
 *
 * - saveCharacter - Saves character data to the 'characters' collection.
 * - SaveCharacterInput - The input type for the saveCharacter function.
 */

import { ZodError, z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';


const SaveCharacterInputSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string(),
  biography: z.string(),
  imageUrl: z.string().refine(val => val.length < 1048487, {
    message: "Image data is too large for database storage."
  }),
});
export type SaveCharacterInput = z.infer<typeof SaveCharacterInputSchema>;

async function getAuthenticatedUser(): Promise<{ uid: string; name: string }> {
  if (!adminAuth || !adminDb) {
    throw new Error('Server services are not available. Please try again later.');
  }

  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  if (!idToken) {
    throw new Error('User session not found. Please log in again.');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const userName = userRecord.displayName || 'Anonymous';
    return { uid: decodedToken.uid, name: userName };
  } catch (error) {
    console.error('Error verifying auth token or fetching user record:', error);
    throw new Error('Invalid or expired user session. Please log in again.');
  }
}

export async function saveCharacter(input: SaveCharacterInput) {
  if (!adminDb || !adminAuth) {
    throw new Error('Server services are not available. Please try again later.');
  }

  const validation = SaveCharacterInputSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    throw new Error(`Invalid input for ${firstError.path.join('.')}: ${firstError.message}`);
  }
  
  const { name, description, biography, imageUrl } = validation.data;
  
  try {
    const { uid: userId, name: userName } = await getAuthenticatedUser();

    const characterRef = adminDb.collection('characters').doc();
    const userRef = adminDb.collection('users').doc(userId);

    await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        transaction.set(characterRef, {
            userId,
            userName,
            name,
            description,
            biography,
            imageUrl,
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
