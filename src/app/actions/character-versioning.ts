

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
    if (originalData.meta.userId !== uid) {
      return { success: false, message: 'Permission denied.' };
    }

    const baseId = originalData.lineage.baseCharacterId || originalData.id;
    const existingVersions = originalData.lineage.versions || [{ id: originalData.id, name: originalData.lineage.versionName, version: originalData.lineage.version }];
    const newVersionNumber = Math.max(...existingVersions.map(v => v.version)) + 1;

    const newCharacterRef = adminDb.collection('characters').doc();
    const newVersionName = `v.${newVersionNumber}`;

    const newCharacterData: Omit<Character, 'id' | 'meta.createdAt'> = {
      ...originalData,
      lineage: {
          ...originalData.lineage,
          version: newVersionNumber,
          versionName: newVersionName,
          baseCharacterId: baseId,
          versions: [], // This will be updated in the transaction
      },
      meta: {
          ...originalData.meta,
          createdAt: new Date(), // Placeholder, will be overwritten by server timestamp
      }
    };
    
    const newVersionInfo = { id: newCharacterRef.id, name: newVersionName, version: newVersionNumber };
    const updatedVersionsList = [...existingVersions, newVersionInfo];

    const batch = adminDb.batch();

    batch.set(newCharacterRef, {
        ...newCharacterData,
        lineage: {
            ...newCharacterData.lineage,
            versions: updatedVersionsList,
        },
        meta: {
            ...newCharacterData.meta,
            createdAt: FieldValue.serverTimestamp()
        }
    });

    for (const version of updatedVersionsList) {
        if (version.id !== newCharacterRef.id) {
           const charRef = adminDb.collection('characters').doc(version.id);
           batch.update(charRef, { 'lineage.versions': updatedVersionsList });
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

    if (originalData.settings.branchingPermissions !== 'public') {
      return { success: false, message: 'This character does not allow branching.' };
    }
     if (originalData.meta.userId === newOwnerId) {
      return { success: false, message: 'You cannot branch your own character. Create a new version instead.' };
    }
    
    const originalAuthorId = originalData.meta.userId; 
    const originalAuthorProfile = await adminDb.collection('users').doc(originalAuthorId).get().then(doc => doc.data() as UserProfile | undefined);

    const newCharacterRef = adminDb.collection('characters').doc();
    const version = 1;
    const versionName = 'v.1';
    const initialVersion = { id: newCharacterRef.id, name: versionName, version: version };

    const newCharacterData: Partial<Character> = {
      ...originalData,
      meta: {
          ...originalData.meta,
          userId: newOwnerId,
          userName: newOwnerProfile?.displayName || 'Anonymous',
          status: 'private', 
          createdAt: FieldValue.serverTimestamp() as any,
      },
      settings: {
          ...originalData.settings,
          isSharedToDataPack: false,
          branchingPermissions: 'private',
      },
      lineage: {
          ...originalData.lineage,
          branchedFromId: originalData.id,
          originalAuthorId: originalAuthorId,
          originalAuthorName: originalAuthorProfile?.displayName || 'Anonymous',
          version: version,
          versionName: versionName,
          baseCharacterId: newCharacterRef.id, 
          versions: [initialVersion],
      }
    };
    
    delete (newCharacterData as any).id;

    await newCharacterRef.set(newCharacterData);
    
    revalidatePath('/characters');
    return { success: true, message: `Successfully branched "${originalData.core.name}"! It's now in your gallery.`, characterId: newCharacterRef.id };

  } catch (error) {
    console.error('Error branching character:', error);
    const message = error instanceof Error ? error.message : 'Could not branch the character.';
    return { success: false, message };
  }
}
