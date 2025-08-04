
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/server';


async function verifyAndGetUid(): Promise<string> {
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  if (!idToken) {
    throw new Error('User session not found. Please log in again.');
  }
  
  if(!adminAuth) {
    throw new Error('Authentication service is unavailable on the server.');
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
  if (!adminDb) throw new Error('Database service is unavailable.');
  
  const uid = await verifyAndGetUid();
  if (!characterId) {
    throw new Error('Character ID is required.');
  }

  const characterRef = adminDb.collection('characters').doc(characterId);
  
  try {
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
      throw new Error('Permission denied or character not found.');
    }

    await characterRef.delete();
    revalidatePath('/characters');
    return { success: true };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Could not delete character.');
  }
}

const UpdateStatusSchema = z.enum(['private', 'public']);

export async function updateCharacterStatus(characterId: string, status: 'private' | 'public') {
  if (!adminDb) throw new Error('Database service is unavailable.');
  
  const validation = UpdateStatusSchema.safeParse(status);
  if (!validation.success) {
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
      throw new Error('Permission denied or character not found.');
    }

    await characterRef.update({ status: validation.data });
    revalidatePath('/characters');
    revalidatePath('/'); // Also revalidate home page in case it's featured
    return { success: true };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Could not update character status.');
  }
}


const UpdateCharacterSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name is too long."),
  biography: z.string().min(1, "Biography is required.").max(5000, "Biography is too long."),
});


export async function updateCharacter(characterId: string, formData: FormData) {
  if (!adminDb) throw new Error('Database service is unavailable.');
  const uid = await verifyAndGetUid();

  const validatedFields = UpdateCharacterSchema.safeParse({
    name: formData.get('name'),
    biography: formData.get('biography'),
  });

  if (!validatedFields.success) {
    redirect(`/characters/${characterId}/edit?error=validation`);
  }
  
  const { name, biography } = validatedFields.data;
  const characterRef = adminDb.collection('characters').doc(characterId);
  
  try {
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
       throw new Error('Permission denied or character not found.');
    }
  
    await characterRef.update({ name, biography });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Could not update character.');
  }

  revalidatePath('/characters');
  redirect('/characters');
}
