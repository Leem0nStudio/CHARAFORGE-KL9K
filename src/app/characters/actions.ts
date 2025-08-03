
'use server';

import { revalidatePath } from 'next/cache';
import { admin, adminDb } from '@/lib/firebase/server';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

async function verifyAndGetUid() {
  console.log('[actions] Verifying user and getting UID...');
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  if (!idToken) {
    console.error('[actions] No ID token found in cookies.');
    throw new Error('User is not authenticated.');
  }
  
  if(!admin) {
    console.error('[actions] Admin SDK is not initialized.');
    throw new Error('Auth service is unavailable.');
  }


  try {
    const auth = getAuth(admin);
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log(`[actions] Token verified for UID: ${decodedToken.uid}`);
    return decodedToken.uid;
  } catch (error) {
    console.error('[actions] Invalid authentication token:', error);
    throw new Error('Invalid authentication token.');
  }
}

export async function deleteCharacter(characterId: string) {
  console.log(`[actions] deleteCharacter called for ID: ${characterId}`);
  if (!adminDb) throw new Error('Database service is unavailable.');
  const uid = await verifyAndGetUid();
  if (!characterId) {
    throw new Error('Character ID is required.');
  }

  const characterRef = adminDb.collection('characters').doc(characterId);
  
  try {
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
      console.error(`[actions] Permission denied or character not found for ID: ${characterId} and UID: ${uid}`);
      throw new Error('Permission denied or character not found.');
    }

    await characterRef.delete();
    console.log(`[actions] Character ${characterId} deleted successfully.`);
    revalidatePath('/characters');
    return { success: true };
  } catch (error) {
    console.error(`[actions] Error deleting character ${characterId}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Could not delete character.');
  }
}

const UpdateStatusSchema = z.enum(['private', 'public']);

export async function updateCharacterStatus(characterId: string, status: 'private' | 'public') {
  console.log(`[actions] updateCharacterStatus called for ID: ${characterId} with status: ${status}`);
  if (!adminDb) throw new Error('Database service is unavailable.');
  
  const validation = UpdateStatusSchema.safeParse(status);
  if (!validation.success) {
      console.error('[actions] Invalid status provided:', status);
      throw new Error('Invalid status provided.');
  }

  const uid = await verifyAndGetUid();
  if (!characterId) {
    throw new Error('Character ID is required.');
  }

  const characterRef = adminDb.collection('characters').doc(characterId);
  
  try {
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
      console.error(`[actions] Permission denied or character not found for ID: ${characterId} and UID: ${uid}`);
      throw new Error('Permission denied or character not found.');
    }

    await characterRef.update({ status: validation.data });
    console.log(`[actions] Character ${characterId} status updated to ${status}.`);
    revalidatePath('/characters');
    revalidatePath('/'); // Also revalidate home page in case it's featured
    return { success: true };
  } catch (error) {
     console.error(`[actions] Error updating character status for ${characterId}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Could not update character status.');
  }
}


const UpdateCharacterSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name is too long."),
  biography: z.string().min(1, "Biography is required.").max(5000, "Biography is too long."),
});


export async function updateCharacter(characterId: string, formData: FormData) {
  console.log(`[actions] updateCharacter called for ID: ${characterId}`);
  if (!adminDb) throw new Error('Database service is unavailable.');
  const uid = await verifyAndGetUid();

  const validatedFields = UpdateCharacterSchema.safeParse({
    name: formData.get('name'),
    biography: formData.get('biography'),
  });

  if (!validatedFields.success) {
    console.error('[actions] Character update validation failed:', validatedFields.error);
    // This is a simple way to return errors. A more complex app might have a better error handling state.
    redirect(`/characters/${characterId}/edit?error=validation`);
  }
  
  const { name, biography } = validatedFields.data;
  const characterRef = adminDb.collection('characters').doc(characterId);
  
  try {
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
       console.error(`[actions] Permission denied or character not found for update on ID: ${characterId} and UID: ${uid}`);
       throw new Error('Permission denied or character not found.');
    }
  
    await characterRef.update({ name, biography });
     console.log(`[actions] Character ${characterId} updated successfully.`);
  } catch (error) {
    console.error(`[actions] Error updating character ${characterId}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Could not update character.');
  }

  revalidatePath('/characters');
  redirect('/characters');
}
