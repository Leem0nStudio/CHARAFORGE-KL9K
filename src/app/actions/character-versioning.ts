
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { Character } from '@/types/character';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserProfile } from '@/types/user';

type ActionResponse = {
    success: boolean;
    message: string;
    characterId?: string;
};

export async function createCharacterVersion(characterId: string): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();
  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }

  try {
    const originalCharRef = adminDb.collection('characters').doc(characterId);
    const originalCharDoc = await originalCharRef.get();

    if (!originalCharDoc.exists) {
      return { success: false, message: 'Character to version not found.' };
    }

    const originalData = originalCharDoc.data() as Character;
    if (originalData.userId !== uid) {
      return { success: false, message: 'Permission denied.' };
    }

    const baseId = originalData.baseCharacterId || originalData.id;
    const existingVersions = originalData.versions || [{ id: originalData.id, name: originalData.versionName, version: originalData.version }];
    const newVersionNumber = Math.max(...existingVersions.map(v => v.version)) + 1;

    const newCharacterRef = adminDb.collection('characters').doc();
    const newVersionName = `v.${newVersionNumber}`;

    const newCharacterData: Omit<Character, 'id' | 'createdAt'> = {
      ...originalData,
      version: newVersionNumber,
      versionName: newVersionName,
      baseCharacterId: baseId || null,
      versions: [], // This will be updated in the transaction
      createdAt: new Date(), // This will be overwritten by server timestamp
      dataPackId: originalData.dataPackId || null, // Ensure null instead of undefined
    };
    
    const newVersionInfo = { id: newCharacterRef.id, name: newVersionName, version: newVersionNumber };
    const updatedVersionsList = [...existingVersions, newVersionInfo];

    const batch = adminDb.batch();

    batch.set(newCharacterRef, {
        ...newCharacterData,
        versions: updatedVersionsList,
        createdAt: FieldValue.serverTimestamp() 
    });

    for (const version of updatedVersionsList) {
        if (version.id !== newCharacterRef.id) {
           const charRef = adminDb.collection('characters').doc(version.id);
           batch.update(charRef, { versions: updatedVersionsList });
        }
    }

    await batch.commit();
    
    revalidatePath('/characters');
    revalidatePath(`/characters/${newCharacterRef.id}/edit`);

    return { success: true, message: `Created new version: ${newVersionName}`, characterId: newCharacterRef.id };

  } catch (error) {
    console.error('Error creating character version:', error);
    const message = error instanceof Error ? error.message : 'Could not create character version.';
    return { success: false, message };
  }
}

export async function branchCharacter(characterId: string): Promise<ActionResponse> {
  const newOwnerId = await verifyAndGetUid();
  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }
  const newOwnerProfile = await adminDb.collection('users').doc(newOwnerId).get().then(doc => doc.data() as UserProfile);

  try {
    const originalCharRef = adminDb.collection('characters').doc(characterId);
    const originalCharDoc = await originalCharRef.get();

    if (!originalCharDoc.exists) {
      return { success: false, message: 'Character to branch not found.' };
    }

    const originalData = originalCharDoc.data() as Character;

    if (originalData.branchingPermissions !== 'public') {
      return { success: false, message: 'This character does not allow branching.' };
    }
     if (originalData.userId === newOwnerId) {
      return { success: false, message: 'You cannot branch your own character. Create a new version instead.' };
    }
    
    const originalAuthorId = originalData.userId; 
    const originalAuthorProfile = await adminDb.collection('users').doc(originalAuthorId).get().then(doc => doc.data() as UserProfile | undefined);

    const newCharacterRef = adminDb.collection('characters').doc();
    const version = 1;
    const versionName = 'v.1';
    const initialVersion = { id: newCharacterRef.id, name: versionName, version: version };

    const newCharacterData = {
      ...originalData,
      userId: newOwnerId,
      userName: newOwnerProfile?.displayName || 'Anonymous',
      status: 'private', 
      isSharedToDataPack: false,
      branchingPermissions: 'private',
      branchedFromId: originalData.id,
      originalAuthorId: originalAuthorId,
      originalAuthorName: originalAuthorProfile?.displayName || 'Anonymous',
      version: version,
      versionName: versionName,
      baseCharacterId: newCharacterRef.id, 
      versions: [initialVersion],
      createdAt: FieldValue.serverTimestamp(),
    };
    
    delete (newCharacterData as any).id;

    await newCharacterRef.set(newCharacterData);
    
    revalidatePath('/characters');
    return { success: true, message: `Successfully branched "${originalData.name}"! It's now in your gallery.`, characterId: newCharacterRef.id };

  } catch (error) {
    console.error('Error branching character:', error);
    const message = error instanceof Error ? error.message : 'Could not branch the character.';
    return { success: false, message };
  }
}

    