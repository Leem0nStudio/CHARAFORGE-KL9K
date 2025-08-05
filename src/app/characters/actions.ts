
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/server';

/**
 * A centralized function to verify user's session from the server-side.
 * Throws an error if the user is not authenticated or services are unavailable.
 * @returns {Promise<string>} The authenticated user's UID.
 */
async function verifyAndGetUid(): Promise<string> {
  if (!adminAuth || !adminDb) {
    throw new Error('Authentication or Database service is unavailable on the server.');
  }

  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  if (!idToken) {
    throw new Error('User session not found. Please log in again.');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    throw new Error('Invalid or expired user session. Please log in again.');
  }
}

export async function deleteCharacter(characterId: string) {
  const uid = await verifyAndGetUid();
  if (!characterId) {
    throw new Error('Character ID is required for deletion.');
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

  const characterRef = adminDb.collection('characters').doc(characterId);
  
  try {
    const characterDoc = await characterRef.get();

    // Security check: ensure the character belongs to the user.
    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
      throw new Error('Permission denied or character not found.');
    }

    await characterRef.update({ status: validation.data });
    // Revalidate multiple paths as status change can affect both pages.
    revalidatePath('/characters');
    revalidatePath('/');
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

export type UpdateCharacterState = {
    success: boolean;
    message: string;
};

export async function updateCharacter(
    characterId: string, 
    data: { name: string, biography: string }
): Promise<UpdateCharacterState> {
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
    
    const { name, biography } = validatedFields.data;
    const characterRef = adminDb.collection('characters').doc(characterId);
    
    const characterDoc = await characterRef.get();

    // Security check before updating.
    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
        return { success: false, message: 'Permission denied or character not found.' };
    }
  
    await characterRef.update({ name, biography });

    revalidatePath('/characters');
    revalidatePath(`/characters/${characterId}/edit`);
    
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
): Promise<UpdateCharacterState> {
  try {
     const uid = await verifyAndGetUid();
     const characterRef = adminDb.collection('characters').doc(characterId);
     const characterDoc = await characterRef.get();
     
     if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
        return { success: false, message: 'Permission denied or character not found.' };
     }

     if (!gallery.includes(primaryImageUrl)) {
        return { success: false, message: 'Primary image must be one of the images in the gallery.'}
     }

     await characterRef.update({ 
        gallery: gallery,
        imageUrl: primaryImageUrl,
      });

     revalidatePath('/characters');
     revalidatePath(`/characters/${characterId}/edit`);

     return { success: true, message: 'Image gallery updated successfully!' };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update image gallery due to a server error.';
    return { success: false, message };
  }
}
