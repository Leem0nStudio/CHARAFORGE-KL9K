
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
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get('firebaseIdToken')?.value;

    if (!idToken) {
      throw new Error('User session not found. Please log in again.');
    }
    
    if (!adminAuth) {
      console.error('[ERROR] Firebase Admin Auth is not configured. Check your FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
      throw new Error('Authentication service is not configured. Please contact support.');
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const displayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Anonymous';
    return { uid: decodedToken.uid, name: displayName };
      
  } catch (error) {
    if (error instanceof Error) {
      // Re-lanzar errores específicos sin modificar
      if (error.message.includes('User session not found') || 
          error.message.includes('Authentication service is not configured')) {
        throw error;
      }
      
      // Manejar errores de verificación de token
      if (error.message.includes('expired')) {
        throw new Error('Your session has expired. Please log in again.');
      }
      if (error.message.includes('invalid')) {
        throw new Error('Invalid session. Please log in again.');
      }
    }
    
    console.error('Authentication error:', error);
    throw new Error('Authentication failed. Please try logging in again.');
  }
}

export async function saveCharacter(input: SaveCharacterInput) {
  try {
    // Validación de entrada
    const validation = SaveCharacterInputSchema.safeParse(input);
    if (!validation.success) {
      throw new Error(`Invalid character data: ${validation.error.message}`);
    }
    
    // Verificar que Firebase esté configurado
    if (!adminDb) {
      console.error('[ERROR] Firebase Admin Firestore is not configured. Check your FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
      throw new Error('Database service is not configured. Please contact support.');
    }

    const { name, description, biography, imageUrl } = validation.data;
    
    // Autenticar usuario
    const authUser = await getAuthenticatedUser();
    const { uid: userId, name: userName } = authUser;

    // Guardar en Firestore
    const characterRef = adminDb.collection('characters').doc();
    const userRef = adminDb.collection('users').doc(userId);

    await adminDb.runTransaction(async (transaction) => {
        // 1. Crear el personaje
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

        // 2. Actualizar estadísticas del usuario
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
    // Log detallado para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.error('saveCharacter error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
    
    // Re-lanzar errores específicos de autenticación y configuración
    if (error instanceof Error) {
      if (error.message.includes('not configured') || 
          error.message.includes('session not found') ||
          error.message.includes('session has expired') ||
          error.message.includes('Invalid session')) {
        throw error;
      }
    }
    
    // Error genérico para otros casos
    throw new Error('Could not save character. Please try again.');
  }
}
