
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

const SaveCharacterInputSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string(),
  biography: z.string(),
  imageUrl: z.string(),
  // Add the token to the schema for validation
  idToken: z.string().min(1, 'Auth token is required.'),
});
export type SaveCharacterInput = z.infer<typeof SaveCharacterInputSchema>;


async function getAuthenticatedUser(idToken: string): Promise<{uid: string, name: string}> {
  if (!adminAuth || !adminDb) {
    throw new Error('Server services are not available. Please try again later.');
  }

  if (!idToken) {
    // This is a fallback, but the Zod schema should catch it first.
    throw new Error('User session not found. Please log in again.');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const displayName = userRecord.displayName || 'Anonymous';
    return { uid: decodedToken.uid, name: displayName };
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
    throw new Error(`Invalid character data: ${validation.error.message}`);
  }
  
  const { name, description, biography, imageUrl, idToken } = validation.data;
  
  try {
    // Pass the token to the verification function
    const { uid, name: userName } = await getAuthenticatedUser(idToken);
    const userId = uid;

    const characterRef = adminDb.collection('characters').doc();
    const userRef = adminDb.collection('users').doc(userId);

    await adminDb.runTransaction(async (transaction) => {
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

        const userDoc = await transaction.get(userRef);
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
