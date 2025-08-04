
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

async function getAuthenticatedUser(retryCount = 0): Promise<{uid: string, name: string}> {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  if (!idToken) {
    // Si es el primer intento y no hay cookie, podría ser un problema de timing
    if (retryCount === 0) {
      console.warn('Session cookie not found on first attempt, this might be a timing issue');
    }
    
    throw new Error('User session not found. Please log in again.');
  }
  
  if(!adminAuth) {
    throw new Error('Authentication service is unavailable on the server.');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const displayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Anonymous';
    return { uid: decodedToken.uid, name: displayName };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    
    // Si el token está expirado o es inválido, dar mensaje más específico
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new Error('Your session has expired. Please log in again.');
      }
      if (error.message.includes('invalid')) {
        throw new Error('Invalid session. Please log in again.');
      }
    }
    
    throw new Error('Invalid or expired user session. Please log in again.');
  }
}

export async function saveCharacter(input: SaveCharacterInput) {
  // Validación de entrada
  const validation = SaveCharacterInputSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(`Invalid character data: ${validation.error.message}`);
  }
  
  if (!adminDb) {
    throw new Error('Database service is not available.');
  }

  const { name, description, biography, imageUrl } = validation.data;
  
  let authUser: {uid: string, name: string};
  
  try {
    // Intentar obtener usuario autenticado con mejor manejo de errores
    authUser = await getAuthenticatedUser();
  } catch (error) {
    // Log detallado para debugging pero mensaje amigable al usuario
    console.error('Authentication failed in saveCharacter:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      input: { nameLength: name.length, hasImage: !!imageUrl }
    });
    
    // Re-lanzar el error original para que el cliente pueda manejarlo
    throw error;
  }

  const { uid: userId, name: userName } = authUser;

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
            createdAt: FieldValue.serverTimestamp(),
        });

        // 2. Atomically increment the user's character count
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

    console.log(`Character saved successfully: ${characterRef.id} for user ${userId}`);
    return { success: true, characterId: characterRef.id };
    
  } catch (error) {
    // Log detallado del error de Firestore
    console.error('Error saving character to Firestore:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      characterName: name,
      timestamp: new Date().toISOString()
    });
    
    throw new Error('Could not save character due to a server error. Please try again.');
  }
}
