
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
  if (!adminAuth || !adminDb) {
    throw new Error('Server services are not available. Please try again later.');
  }

  let idToken;
  try {
    const cookieStore = cookies();
    idToken = cookieStore.get('firebaseIdToken')?.value;
  } catch (error) {
    // This can happen in some server environments.
    console.error('Failed to read cookies on server:', error);
    throw new Error('Server could not read the user session. Please try logging out and back in.');
  }

  if (!idToken) {
    throw new Error('User session not found. Please log in again.');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    // Fallback to a generic name if displayName isn't set
    const displayName = userRecord.displayName || 'Anonymous';
    return { uid: decodedToken.uid, name: displayName };
  } catch (error) {
    console.error('Error verifying auth token or fetching user record:', error);
    // This is a critical security error, indicating a potentially tampered or expired token.
    throw new Error('Invalid or expired user session. Please log in again.');
  }
}

export async function saveCharacter(input: SaveCharacterInput) {
  const validation = SaveCharacterInputSchema.safeParse(input);
  if (!validation.success) {
    // This validation prevents bad data from ever reaching the database.
    throw new Error(`Invalid character data: ${validation.error.message}`);
  }
  
  const { name, description, biography, imageUrl } = validation.data;
  
  const { uid, name: userName } = await getAuthenticatedUser();
  const userId = uid;

  try {
    const characterRef = adminDb.collection('characters').doc();
    const userRef = adminDb.collection('users').doc(userId);

    // Use a transaction to ensure both writes succeed or fail together.
    await adminDb.runTransaction(async (transaction) => {
        transaction.set(characterRef, {
            userId,
            userName,
            name,
            description,
            biography,
            imageUrl,
            status: 'private', // Characters are private by default
            createdAt: FieldValue.serverTimestamp(),
        });

        // Atomically update user stats
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists || !userDoc.data()?.stats) {
            // If stats don't exist, create them.
            transaction.set(userRef, { 
                stats: { charactersCreated: 1 } 
            }, { merge: true });
        } else {
            // Otherwise, increment the existing counter.
            transaction.update(userRef, {
                'stats.charactersCreated': FieldValue.increment(1)
            });
        }
    });

    return { success: true, characterId: characterRef.id };
  } catch (error) {
    console.error('Error saving character to Firestore:', error);
    // Provide a user-friendly error message.
    throw new Error('Could not save character due to a server error.');
  }
}
