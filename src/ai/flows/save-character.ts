
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
    // This was the source of the error. cookies() must be awaited.
    const cookieStore = cookies();
    idToken = cookieStore.get('firebaseIdToken')?.value;
  } catch (error) {
    console.error('Failed to read cookies on server:', error);
    // This provides a clearer error message to the client.
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
    const displayName = decodedToken.name || 'Anonymous';
    return { uid: decodedToken.uid, name: displayName };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    throw new Error('Invalid or expired user session. Please log in again.');
  }
}

export async function saveCharacter(input: SaveCharacterInput) {
  const validation = SaveCharacterInputSchema.safeParse(input);
  if (!validation.success) {
    // For server actions, it's better to throw a clear error than to return a complex object.
    throw new Error(`Invalid character data: ${validation.error.message}`);
  }
  
  if (!adminDb) {
    throw new Error('Database service is not available.');
  }

  const { name, description, biography, imageUrl } = validation.data;
  
  // Security Validation: Ensure the user ID is derived from the authenticated session.
  const { uid, name: userName } = await getAuthenticatedUser();
  const userId = uid;

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
            createdAt: FieldValue.serverTimestamp(), // Use server timestamp for consistency
        });

        // 2. Atomically increment the user's character count
        // First, ensure the stats object exists.
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists() || !userDoc.data()?.stats) {
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
    // Log the detailed error on the server, but return a generic message to the client.
    console.error('Error saving character to Firestore:', error);
    throw new Error('Could not save character due to a server error.');
  }
}
