
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
  biography: z.string().min(1, "Biography is required.").max(5000, "Biography cannot exceed 5000 characters."),
});

export async function updateCharacter(characterId: string, formData: FormData) {
  const uid = await verifyAndGetUid();

  const validatedFields = UpdateCharacterSchema.safeParse({
    name: formData.get('name'),
    biography: formData.get('biography'),
  });

  // If validation fails, redirect back to the edit page with an error query param.
  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.flatten().fieldErrors.name?.[0] || validatedFields.error.flatten().fieldErrors.biography?.[0] || 'Invalid data';
    redirect(`/characters/${characterId}/edit?error=${encodeURIComponent(errorMessage)}`);
  }
  
  const { name, biography } = validatedFields.data;
  const characterRef = adminDb.collection('characters').doc(characterId);
  
  try {
    const characterDoc = await characterRef.get();

    // Security check before updating.
    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
       throw new Error('Permission denied or character not found.');
    }
  
    await characterRef.update({ name, biography });
  } catch (error) {
    console.error("Error updating character:", error);
    const errorMessage = error instanceof Error ? error.message : 'Could not update character.';
    redirect(`/characters/${characterId}/edit?error=${encodeURIComponent(errorMessage)}`);
  }

  // On success, revalidate and redirect to the main characters page.
  revalidatePath('/characters');
  revalidatePath(`/characters/${characterId}/edit`);
  redirect('/characters');
}
