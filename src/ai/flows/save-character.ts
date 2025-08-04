
'use server';

/**
 * @fileOverview A server action to save a generated character to Firestore.
 *
 * - saveCharacter - Saves character data to the 'characters' collection.
 * - SaveCharacterInput - The input type for the saveCharacter function.
 */

import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';


const SaveCharacterInputSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string(),
  biography: z.string(),
  imageUrl: z.string(),
});
export type SaveCharacterInput = z.infer<typeof SaveCharacterInputSchema>;


async function getAuthenticatedUser(): Promise<{uid: string, name: string}> {
  let idToken;
  try {
    const cookieStore = cookies();
    idToken = cookieStore.get('firebaseIdToken')?.value;
  } catch (error) {
    console.error('Failed to read cookies on server:', error);
    throw new Error('Server could not read the user session. Please try logging out and back in.');
  }

  if (!idToken) {
    throw new Error('User session not found. Please log in again.');
  }
  
  if(!adminAuth) {
    throw new Error('Authentication service is unavailable on the server.');
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
  const validation = SaveCharacterInputSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(`Invalid character data: ${validation.error.message}`);
  }
  
  if (!adminDb) {
    throw new Error('Database service is not available.');
  }

  const { name, description, biography, imageUrl } = validation.data;
  
  const { uid, name: userName } = await getAuthenticatedUser();
  const userId = uid;

  try {
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
    throw new Error('Could not save character due to a server error.');
  }
}
