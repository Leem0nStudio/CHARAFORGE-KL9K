'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { admin } from '@/lib/firebase/server';

async function verifyAndGetUid() {
  const idToken = cookies().get('firebaseIdToken')?.value;
  if (!idToken) {
    throw new Error('User is not authenticated.');
  }
  try {
    const decodedToken = await getAuth(admin).verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    throw new Error('Invalid authentication token.');
  }
}

export async function deleteCharacter(characterId: string) {
  const uid = await verifyAndGetUid();
  if (!characterId) {
    throw new Error('Character ID is required.');
  }

  const characterRef = adminDb.collection('characters').doc(characterId);
  const characterDoc = await characterRef.get();

  if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
    throw new Error('Permission denied or character not found.');
  }

  try {
    await characterRef.delete();
    revalidatePath('/characters');
    return { success: true };
  } catch (error) {
    console.error('Error deleting character from Firestore:', error);
    throw new Error('Could not delete character.');
  }
}

export async function updateCharacterStatus(characterId: string, status: 'private' | 'public') {
  const uid = await verifyAndGetUid();
  if (!characterId) {
    throw new Error('Character ID is required.');
  }

  const characterRef = adminDb.collection('characters').doc(characterId);
  const characterDoc = await characterRef.get();

  if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
    throw new Error('Permission denied or character not found.');
  }

  try {
    await characterRef.update({ status });
    revalidatePath('/characters');
    revalidatePath('/'); // Also revalidate home page in case it's featured
    return { success: true };
  } catch (error) {
    console.error('Error updating character status in Firestore:', error);
    throw new Error('Could not update character status.');
  }
}
