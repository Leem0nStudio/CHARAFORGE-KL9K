
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { Character } from '@/types/character';

type ActionResponse = {
    success: boolean;
    message: string;
};

export async function deleteCharacter(characterId: string) {
  const uid = await verifyAndGetUid();
  if (!characterId) {
    throw new Error('Character ID is required for deletion.');
  }
  if (!adminDb) {
    throw new Error('Database service is unavailable.');
  }

  const characterRef = adminDb.collection('characters').doc(characterId);
  
  try {
    const characterDoc = await characterRef.get();

    // Security check: ensure the character exists and belongs to the user trying to delete it.
    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
      throw new Error('Permission denied or character not found.');
    }

    await characterRef.delete();
    // Revalidate the path to ensure the UI updates after deletion.
    revalidatePath('/characters');
    return { success: true };
  } catch (error) {
    // Log the actual error for debugging, but throw a generic one to the client.
    console.error("Error deleting character:", error);
    throw new Error(error instanceof Error ? error.message : 'Could not delete character due to a server error.');
  }
}

const UpdateStatusSchema = z.enum(['private', 'public']);

export async function updateCharacterStatus(characterId: string, status: 'private' | 'public') {
  const validation = UpdateStatusSchema.safeParse(status);
  if (!validation.success) {
      throw new Error('Invalid status provided.');
  }

  const uid = await verifyAndGetUid();
  if (!characterId) {
    throw new Error('Character ID is required for status update.');
  }
  if (!adminDb) {
    throw new Error('Database service is unavailable.');
  }

  const characterRef = adminDb.collection('characters').doc(characterId);
  
  try {
    const characterDoc = await characterRef.get();
    const characterData = characterDoc.data();

    // Security check: ensure the character belongs to the user.
    if (!characterDoc.exists || characterData?.userId !== uid) {
      throw new Error('Permission denied or character not found.');
    }

    await characterRef.update({ status: validation.data });
    
    // Revalidate all paths where this character's status matters
    revalidatePath('/characters');
    revalidatePath('/');
    if (characterData?.dataPackId) {
      revalidatePath(`/datapacks/${characterData.dataPackId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating character status:", error);
    throw new Error(error instanceof Error ? error.message : 'Could not update character status due to a server error.');
  }
}


const UpdateCharacterSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  biography: z.string().min(1, "Biography is required.").max(15000, "Biography is too long."),
});

export async function updateCharacter(
    characterId: string, 
    data: { name: string, biography: string }
): Promise<ActionResponse> {
  try {
    const uid = await verifyAndGetUid();

    const validatedFields = UpdateCharacterSchema.safeParse(data);

    if (!validatedFields.success) {
        const firstError = validatedFields.error.errors[0];
        return {
            success: false,
            message: `Invalid input for ${firstError.path.join('.')}: ${firstError.message}`,
        };
    }
    
    if (!adminDb) {
      throw new Error('Database service is unavailable.');
    }
    
    const { name, biography } = validatedFields.data;
    const characterRef = adminDb.collection('characters').doc(characterId);
    
    const characterDoc = await characterRef.get();

    // Security check before updating.
    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
        return { success: false, message: 'Permission denied or character not found.' };
    }
  
    await characterRef.update({ name, biography });

    revalidatePath(`/characters/${characterId}/edit`);
    revalidatePath('/characters');
    
    return { success: true, message: 'Character details updated successfully!' };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update character due to a server error.';
    return { success: false, message };
  }
}

export async function updateCharacterImages(
  characterId: string,
  gallery: string[],
  primaryImageUrl: string,
): Promise<ActionResponse> {
  try {
     const uid = await verifyAndGetUid();

     if (!adminDb) {
       throw new Error('Database service is unavailable.');
     }

     const characterRef = adminDb.collection('characters').doc(characterId);
     const characterDoc = await characterRef.get();
     
     if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
        return { success: false, message: 'Permission denied or character not found.' };
     }

     if (!gallery.includes(primaryImageUrl)) {
        return { success: false, message: 'Primary image must be one of the images in the gallery.'}
     }
     if (gallery.length > 10) {
        return { success: false, message: 'You can add a maximum of 10 images.'}
     }

     await characterRef.update({ 
        gallery: gallery,
        imageUrl: primaryImageUrl,
      });

     revalidatePath(`/characters/${characterId}/edit`);
     revalidatePath('/characters');

     return { success: true, message: 'Image gallery updated successfully!' };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update image gallery due to a server error.';
    return { success: false, message };
  }
}

/**
 * Extracts the file path from a Google Cloud Storage URL.
 * @param {string} url The full `https://storage.googleapis.com/...` URL.
 * @returns {string | null} The path to the file in the bucket, or null if the URL is invalid.
 */
function getPathFromUrl(url: string): string | null {
    try {
        const urlObject = new URL(url);
        // The pathname will be something like `/<bucket-name>/<file-path>`.
        // We want to remove the leading slash and the bucket name.
        const path = urlObject.pathname.substring(1).split('/').slice(1).join('/');
        return path || null;
    } catch (e) {
        console.error(`Invalid GCS URL format: ${url}`);
        return null;
    }
}


/**
 * Fetches characters for the logged-in user and generates signed URLs for their images.
 * This is the secure way to display private images from Firebase Storage.
 * @returns {Promise<Character[]>} A promise that resolves to an array of character objects with accessible image URLs.
 */
export async function getCharactersWithSignedUrls(): Promise<Character[]> {
  try {
    const uid = await verifyAndGetUid();
    if (!adminDb) {
      throw new Error('Database service is unavailable.');
    }
    
    const charactersRef = adminDb.collection('characters');
    const q = charactersRef.where('userId', '==', uid).orderBy('createdAt', 'desc');
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }

    const charactersData = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(), // Convert Firestore Timestamp to JS Date object
      } as Character;
    });

    // Generate signed URLs for each character's image
    const charactersWithUrls = await Promise.all(
      charactersData.map(async (character) => {
        if (!character.imageUrl || !character.imageUrl.startsWith('https://storage.googleapis.com/')) {
          console.warn(`Character ${character.id} has an invalid or missing imageUrl. Using placeholder.`);
          return { ...character, imageUrl: 'https://placehold.co/400x400.png' };
        }

        try {
          const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
          const filePath = getPathFromUrl(character.imageUrl);
          
          if (!filePath) {
             console.warn(`Could not extract file path from URL for character ${character.id}: ${character.imageUrl}`);
             return { ...character, imageUrl: 'https://placehold.co/400x400.png' };
          }
          
          const file = bucket.file(filePath);
          
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
          });

          return { ...character, imageUrl: signedUrl };
        } catch (urlError) {
          console.error(`Failed to get signed URL for character ${character.id}:`, urlError);
          // Return the character with a placeholder or original URL so the app doesn't crash
          return { ...character, imageUrl: 'https://placehold.co/400x400.png' };
        }
      })
    );

    return charactersWithUrls;

  } catch (error) {
    console.error("Error fetching characters with signed URLs:", error);
    // Return an empty array or throw the error, depending on desired client-side handling
    return [];
  }
}
