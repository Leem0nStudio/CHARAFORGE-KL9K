
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { Character, TimelineEvent } from '@/types/character';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { UserProfile } from '@/types/user';
import { v4 as uuidv4 } from 'uuid';
import { generateCharacterImage } from '@/ai/flows/character-image/flow';
import type { ImageEngineConfig } from '@/ai/flows/character-image/types';
import { uploadToStorage } from '@/services/storage';


type ActionResponse = {
    success: boolean;
    message: string;
    characterId?: string;
    newImageUrl?: string;
};

// Zod validation schemas. Following the "Rigorous Server-Side Validation" pattern.
const UpdateStatusSchema = z.enum(['private', 'public']);
const UpdateCharacterSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  biography: z.string().min(1, "Biography is required.").max(15000, "Biography is too long."),
  alignment: z.enum(['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil']),
});
const SaveCharacterInputSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string(),
  biography: z.string(),
  imageUrl: z.string().startsWith('data:image/'),
  dataPackId: z.string().optional().nullable(),
  tags: z.string().optional(),
});
export type SaveCharacterInput = z.infer<typeof SaveCharacterInputSchema>;


/**
 * Generates a new image for an existing character and adds it to their gallery.
 * This action follows the "Centralized File Upload Service" pattern by calling `uploadToStorage`.
 */
export async function generateNewCharacterImage(characterId: string, description: string, engineConfig: ImageEngineConfig): Promise<ActionResponse & { newImageUrl?: string }> {
     // Pattern: Secure Session Management
     const uid = await verifyAndGetUid(); 
     if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
     }
     
     try {
        const { imageUrl } = await generateCharacterImage({ description, engineConfig });

        if (!imageUrl) {
            return { success: false, message: 'AI failed to generate a new image.' };
        }
        
        const destinationPath = `usersImg/${uid}/${characterId}/${uuidv4()}.png`;
        // Pattern: Centralized File Upload Service
        const publicUrl = await uploadToStorage(imageUrl, destinationPath);
        
        // Add the new image to the character's gallery
        const characterRef = adminDb.collection('characters').doc(characterId);
        await characterRef.update({
            gallery: FieldValue.arrayUnion(publicUrl),
        });

        revalidatePath(`/characters/${characterId}/edit`);

        return { success: true, message: 'New image generated and added to gallery!', newImageUrl: publicUrl };

     } catch(error) {
        const message = error instanceof Error ? error.message : 'Could not generate new image.';
        return { success: false, message };
     }
}


export async function createCharacterVersion(characterId: string): Promise<ActionResponse> {
  // Pattern: Secure Session Management
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
    revalidatePath(`/characters/${newCharacterRef.id}/edit`);

    return { success: true, message: `Created new version: ${newVersionName}`, characterId: newCharacterRef.id };

  } catch (error) {
    console.error('Error creating character version:', error);
    const message = error instanceof Error ? error.message : 'Could not create character version.';
    return { success: false, message };
  }
}


export async function deleteCharacter(characterId: string) {
  // Pattern: Secure Session Management
  const uid = await verifyAndGetUid();
  if (!adminDb) {
    throw new Error('Database service is unavailable.');
  }
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


export async function updateCharacterStatus(
  characterId: string, 
  status: 'private' | 'public',
  isNsfw?: boolean,
): Promise<ActionResponse> {
  // Pattern: Secure Session Management
  const uid = await verifyAndGetUid();
  if (!adminDb) {
      return { success: false, message: 'Database service is unavailable.' };
  }
  // Pattern: Rigorous Server-Side Validation
  const validation = UpdateStatusSchema.safeParse(status);
  if (!validation.success) {
      return { success: false, message: 'Invalid status provided.' };
  }
  
  try {
    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();
    const characterData = characterDoc.data();
    if (!characterDoc.exists || characterData?.userId !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }
    
    const updates: { status: 'private' | 'public'; isNsfw?: boolean } = {
        status: validation.data
    };
    if (typeof isNsfw === 'boolean') {
        updates.isNsfw = isNsfw;
    }

    await characterRef.update(updates);
    
    if (validation.data === 'public' && characterData.dataPackId && characterData.imageUrl) {
        const dataPackRef = adminDb.collection('datapacks').doc(characterData.dataPackId);
        await dataPackRef.update({
            coverImageUrl: characterData.imageUrl,
        });
        revalidatePath(`/datapacks/${characterData.dataPackId}`);
    }

    revalidatePath('/characters');
    revalidatePath('/'); 
    revalidatePath(`/characters/${characterId}/edit`);


    return { success: true, message: `Character status updated.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update character status.';
    return { success: false, message };
  }
}


export async function updateCharacterDataPackSharing(characterId: string, isShared: boolean): Promise<ActionResponse> {
  // Pattern: Secure Session Management
  const uid = await verifyAndGetUid();
  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }

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
    revalidatePath(`/characters/${characterId}/edit`);
    
    return { success: true, message: `Sharing status for DataPack gallery updated.` };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update sharing status.';
    return { success: false, message };
  }
}


export async function updateCharacter(
    characterId: string, 
    data: { name: string, biography: string, alignment: Character['alignment'] }
): Promise<ActionResponse> {
  // Pattern: Secure Session Management
  const uid = await verifyAndGetUid();
  if (!adminDb) {
      return { success: false, message: 'Database service is unavailable.' };
  }
  
  try {
    // Pattern: Rigorous Server-Side Validation
    const validatedFields = UpdateCharacterSchema.safeParse(data);

    if (!validatedFields.success) {
        const firstError = validatedFields.error.errors[0];
        return {
            success: false,
            message: `Invalid input for ${firstError.path.join('.')}: ${firstError.message}`,
        };
    }
    
    const { name, biography, alignment } = validatedFields.data;
    const characterRef = adminDb.collection('characters').doc(characterId);
    
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
        return { success: false, message: 'Permission denied or character not found.' };
    }
  
    await characterRef.update({ name, biography, alignment });

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
  // Pattern: Secure Session Management
  const uid = await verifyAndGetUid();
  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }
  
  try {
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


export async function getCharacters(): Promise<Character[]> {
  if (!adminDb) {
      console.error('Database service is unavailable.');
      return [];
  }
  try {
    // Pattern: Secure Session Management
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
      const createdAt = data.createdAt;
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt),
        version: data.version || 1,
        versionName: data.versionName || `v.${data.version || 1}`,
        baseCharacterId: data.baseCharacterId || null,
        versions: versions,
        branchingPermissions: data.branchingPermissions || 'private',
        alignment: data.alignment || 'True Neutral',
        tags: data.tags || [],
      } as Character;
    });

    return charactersData;

  } catch (error) {
    // Gracefully handle cases where the user is logged out, returning an empty list
    // instead of throwing an error on pages that can be partially public.
    if (error instanceof Error && (error.message.includes('User session not found') || error.message.includes('Invalid or expired'))) {
        console.log('User session not found, returning empty character list.');
        return [];
    }
    console.error("Error fetching characters:", error);
    return [];
  }
}

export async function updateCharacterBranchingPermissions(characterId: string, permissions: 'private' | 'public'): Promise<ActionResponse> {
  // Pattern: Secure Session Management
  const uid = await verifyAndGetUid();
  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }

  try {
    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }

    await characterRef.update({ branchingPermissions: permissions });

    revalidatePath('/characters');
    revalidatePath(`/characters/${characterId}`);
    revalidatePath(`/characters/${characterId}/edit`);

    return { success: true, message: `Branching permissions set to ${permissions}.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update permissions.';
    return { success: false, message };
  }
}

export async function branchCharacter(characterId: string): Promise<ActionResponse> {
  // Pattern: Secure Session Management
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
      // Overwrite ownership and metadata
      userId: newOwnerId,
      userName: newOwnerProfile?.displayName || 'Anonymous',
      status: 'private', 
      isSharedToDataPack: false,
      branchingPermissions: 'private',
      
      // Set lineage
      branchedFromId: originalData.id,
      originalAuthorId: originalAuthorId,
      originalAuthorName: originalAuthorProfile?.displayName || 'Anonymous',

      // Reset versioning for the new branch
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


export async function saveCharacter(input: SaveCharacterInput) {
  // Pattern: Rigorous Server-Side Validation
  const validation = SaveCharacterInputSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    throw new Error(`Invalid input for ${firstError.path.join('.')}: ${firstError.message}`);
  }
  const { name, description, biography, imageUrl: imageDataUri, dataPackId, tags } = validation.data;
  
  // Pattern: Secure Session Management
  const userId = await verifyAndGetUid();
  if (!adminDb) {
    throw new Error('Database service is not available. Please try again later.');
  }
  
  try {
    const characterRef = adminDb.collection('characters').doc();
    
    const destinationPath = `usersImg/${userId}/${characterRef.id}/${uuidv4()}.png`;
    // Pattern: Centralized File Upload Service
    const storageUrl = await uploadToStorage(imageDataUri, destinationPath);

    const userRef = adminDb.collection('users').doc(userId);

    await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        const version = 1;
        const versionName = `v.${version}`;
        const initialVersion = { id: characterRef.id, name: versionName, version: version };
        
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean) : [];

        const characterData = {
            userId,
            name,
            description,
            biography,
            imageUrl: storageUrl,
            gallery: [storageUrl],
            status: 'private',
            createdAt: FieldValue.serverTimestamp(),
            dataPackId: dataPackId || null,
            version: version,
            versionName: versionName,
            baseCharacterId: characterRef.id,
            versions: [initialVersion],
            branchingPermissions: 'private',
            alignment: 'True Neutral',
            tags: tagsArray,
        };

        transaction.set(characterRef, characterData);
        
        if (!userDoc.exists || !userDoc.data()?.stats) {
            transaction.set(userRef, { 
                stats: { charactersCreated: 1 } 
            }, { merge: true });
        } else {
            transaction.update(userRef, {
                'stats.charactersCreated': FieldValue.increment(1)
            });
        }
    });

    revalidatePath('/characters');

    return { success: true, characterId: characterRef.id };
  } catch (error) {
    console.error('Error saving character:', error);
    const errorMessage = error instanceof Error ? error.message : 'Could not save character due to a server error.';
    throw new Error(errorMessage);
  }
}

export async function updateCharacterTimeline(characterId: string, timeline: TimelineEvent[]): Promise<ActionResponse> {
    // Pattern: Secure Session Management
    const uid = await verifyAndGetUid();
    if (!adminDb) {
        return { success: false, message: 'Database service unavailable.' };
    }
    
    try {
        const characterRef = adminDb.collection('characters').doc(characterId);
        const characterDoc = await characterRef.get();
        if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
            return { success: false, message: 'Permission denied or character not found.' };
        }
        
        await characterRef.update({ timeline });
        
        revalidatePath(`/characters/${characterId}/edit`);
        
        return { success: true, message: 'Timeline updated successfully!' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not update timeline.';
        return { success: false, message };
    }
}

export async function getCharacter(characterId: string): Promise<Character | null> {
    if (!adminDb) {
        console.error('Database service is unavailable.');
        return null;
    }
    try {
        const characterRef = adminDb.collection('characters').doc(characterId);
        const characterDoc = await characterRef.get();

        if (!characterDoc.exists) {
            return null;
        }

        const data = characterDoc.data() as Character;
        
        const [userProfile, dataPack] = await Promise.all([
            data.userId ? adminDb.collection('users').doc(data.userId).get() : Promise.resolve(null),
            data.dataPackId ? adminDb.collection('datapacks').doc(data.dataPackId).get() : Promise.resolve(null)
        ]);

        const userName = userProfile?.data()?.displayName || 'Anonymous';
        const dataPackName = dataPack?.data()?.name || null;
        const originalAuthorName = data.originalAuthorId 
            ? (await adminDb.collection('users').doc(data.originalAuthorId).get())?.data()?.displayName || 'Anonymous' 
            : null;
        
        const createdAt = data.createdAt as any;

        return {
            id: characterDoc.id,
            ...data,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt),
            userName,
            dataPackName,
            originalAuthorName,
        } as Character;

    } catch (error) {
        console.error(`Error fetching character ${characterId}:`, error);
        return null;
    }
}
