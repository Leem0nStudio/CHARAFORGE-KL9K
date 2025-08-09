
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
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
  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }
  const uid = await verifyAndGetUid();

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

    // 1. Create the new character version
    batch.set(newCharacterRef, {
        ...newCharacterData,
        versions: updatedVersionsList, // Set the final version list here
        createdAt: FieldValue.serverTimestamp() 
    });

    // 2. Update the versions list for all related characters
    for (const version of updatedVersionsList) {
        if (version.id !== newCharacterRef.id) { // Don't update the doc we're creating
           const charRef = adminDb.collection('characters').doc(version.id);
           batch.update(charRef, { versions: updatedVersionsList });
        }
    }

    await batch.commit();
    
    revalidatePath('/characters');
    return { success: true, message: `Created new version: ${newVersionName}` };

  } catch (error) {
    console.error('Error creating character version:', error);
    const message = error instanceof Error ? error.message : 'Could not create character version.';
    return { success: false, message };
  }
}


export async function deleteCharacter(characterId: string) {
  if (!adminDb) {
    throw new Error('Database service is unavailable.');
  }
  const uid = await verifyAndGetUid();
  if (!characterId) {
    throw new Error('Character ID is required for deletion.');
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
    console.error("Error deleting character:", error);
    throw new Error(error instanceof Error ? error.message : 'Could not delete character due to a server error.');
  }
}

const UpdateStatusSchema = z.enum(['private', 'public']);

export async function updateCharacterStatus(characterId: string, status: 'private' | 'public'): Promise<ActionResponse> {
  if (!adminDb) {
      return { success: false, message: 'Database service is unavailable.' };
  }
  const validation = UpdateStatusSchema.safeParse(status);
  if (!validation.success) {
      return { success: false, message: 'Invalid status provided.' };
  }

  const uid = await verifyAndGetUid();
  
  try {
    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();
    const characterData = characterDoc.data();
    if (!characterDoc.exists || characterData?.userId !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }

    await characterRef.update({ status: validation.data });
    
    if (validation.data === 'public' && characterData.dataPackId && characterData.imageUrl) {
        const dataPackRef = adminDb.collection('datapacks').doc(characterData.dataPackId);
        await dataPackRef.update({
            coverImageUrl: characterData.imageUrl,
        });
        revalidatePath(`/datapacks/${characterData.dataPackId}`);
    }

    revalidatePath('/characters');
    revalidatePath('/'); 

    return { success: true, message: `Character is now ${validation.data}.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update character status.';
    return { success: false, message };
  }
}


export async function updateCharacterDataPackSharing(characterId: string, isShared: boolean): Promise<ActionResponse> {
  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }
  const uid = await verifyAndGetUid();

  try {
    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();
    const characterData = characterDoc.data();

    if (!characterDoc.exists || characterData?.userId !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }
    
    if (!characterData.dataPackId) {
        return { success: false, message: 'This character was not created with a DataPack.' };
    }

    const updates: { isSharedToDataPack: boolean; status?: 'public' } = { 
        isSharedToDataPack: isShared 
    };
    if (isShared) {
        updates.status = 'public';
        if (characterData.imageUrl) {
            const dataPackRef = adminDb.collection('datapacks').doc(characterData.dataPackId);
            await dataPackRef.update({
                coverImageUrl: characterData.imageUrl,
            });
        }
    }
    await characterRef.update(updates);
    
    revalidatePath('/characters');
    revalidatePath(`/datapacks/${characterData.dataPackId}`);
    revalidatePath('/');
    
    return { success: true, message: `Sharing status for DataPack gallery updated.` };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update sharing status.';
    return { success: false, message };
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
  if (!adminDb) {
      return { success: false, message: 'Database service is unavailable.' };
  }
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
  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }
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
     if (gallery.length > 10) {
        return { success: false, message: 'You can add a maximum of 10 images.'}
     }

     // Ensure imageUrls are public, though they should be by this point
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


export async function getCharacters(): Promise<Character[]> {
  if (!adminDb) {
      console.error('Database service is unavailable.');
      return [];
  }
  try {
    const uid = await verifyAndGetUid();
    
    const charactersRef = adminDb.collection('characters');
    const q = charactersRef.where('userId', '==', uid).orderBy('createdAt', 'desc');
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }

    // Data is already clean from Firestore (public URLs)
    const charactersData = snapshot.docs.map(doc => {
      const data = doc.data();
      const versions = data.versions || [{ id: doc.id, name: data.versionName || 'v.1', version: data.version || 1 }];
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        version: data.version || 1,
        versionName: data.versionName || `v.${data.version || 1}`,
        baseCharacterId: data.baseCharacterId || null,
        versions: versions,
        branchingPermissions: data.branchingPermissions || 'private',
      } as Character;
    });

    return charactersData;

  } catch (error) {
    if (error instanceof Error && (error.message.includes('User session not found') || error.message.includes('Invalid or expired'))) {
        console.log('User session not found, returning empty character list.');
        return [];
    }
    console.error("Error fetching characters:", error);
    return [];
  }
}

export async function updateCharacterBranchingPermissions(characterId: string, permissions: 'private' | 'public'): Promise<ActionResponse> {
  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }
  const uid = await verifyAndGetUid();

  try {
    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }

    await characterRef.update({ branchingPermissions: permissions });

    revalidatePath('/characters');
    return { success: true, message: `Branching permissions set to ${permissions}.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update permissions.';
    return { success: false, message };
  }
}

export async function branchCharacter(characterId: string): Promise<ActionResponse> {
  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }
  const newOwnerId = await verifyAndGetUid();
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

    // Prepare new character data
    const newCharacterRef = adminDb.collection('characters').doc();
    const version = 1;
    const versionName = 'v.1';
    const initialVersion = { id: newCharacterRef.id, name: versionName, version: version };

    const newCharacterData = {
      ...originalData,
      // Overwrite ownership and metadata
      userId: newOwnerId,
      userName: newOwnerProfile.displayName || 'Anonymous',
      status: 'private', 
      isSharedToDataPack: false,
      branchingPermissions: 'private',
      
      // Set lineage
      branchedFromId: originalData.id,
      originalAuthorId: originalData.originalAuthorId || originalData.userId,
      originalAuthorName: originalData.originalAuthorName || originalData.userName,

      // Reset versioning for the new branch
      version: version,
      versionName: versionName,
      baseCharacterId: null, 
      versions: [initialVersion],
      createdAt: FieldValue.serverTimestamp(),
    };

    await newCharacterRef.set(newCharacterData);
    
    revalidatePath('/characters');
    return { success: true, message: `Successfully branched "${originalData.name}"! It's now in your gallery.`, characterId: newCharacterRef.id };

  } catch (error) {
    console.error('Error branching character:', error);
    const message = error instanceof Error ? error.message : 'Could not branch the character.';
    return { success: false, message };
  }
}
