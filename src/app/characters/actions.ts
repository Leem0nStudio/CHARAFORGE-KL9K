
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
  const validation = UpdateStatusSchema.safeParse(status);
  if (!validation.success) {
      return { success: false, message: 'Invalid status provided.' };
  }

  const uid = await verifyAndGetUid();
  
  try {
    if (!adminDb) throw new Error('Database service is unavailable.');

    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();
    const characterData = characterDoc.data()
    if (!characterDoc.exists || characterData?.userId !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }

    await characterRef.update({ status: validation.data });
    
    revalidatePath('/characters');
    revalidatePath('/'); 

    return { success: true, message: `Character is now ${validation.data}.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update character status.';
    return { success: false, message };
  }
}


export async function updateCharacterDataPackSharing(characterId: string, isShared: boolean): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();

  try {
    if (!adminDb) throw new Error('Database service is unavailable.');
    
    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();
    const characterData = characterDoc.data();

    if (!characterDoc.exists || characterData?.userId !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }
    
    if (!characterData.dataPackId) {
        return { success: false, message: 'This character was not created with a DataPack.' };
    }

    await characterRef.update({ isSharedToDataPack: isShared });

    if (isShared && characterData.imageUrl) {
        const dataPackRef = adminDb.collection('datapacks').doc(characterData.dataPackId);
        await dataPackRef.update({
            coverImageUrl: characterData.imageUrl,
        });
    }

    revalidatePath('/characters');
    revalidatePath(`/datapacks/${characterData.dataPackId}`);
    
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

function getPathFromUrl(url: string): string | null {
    try {
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
            console.error("Storage bucket name is not configured in environment variables.");
            return null;
        }

        const gcsPrefixHttp = `https://storage.googleapis.com/${bucketName}/`;
        if (url.startsWith(gcsPrefixHttp)) {
            return decodeURIComponent(url.substring(gcsPrefixHttp.length));
        }
        
        const urlObject = new URL(url);
        const path = urlObject.pathname.split('/').slice(2).join('/');
        return path ? decodeURIComponent(path) : null;

    } catch (e) {
        console.error(`Could not parse GCS URL: ${url}`, e);
        return null;
    }
}


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
        createdAt: data.createdAt.toDate(),
      } as Character;
    });

    const charactersWithUrls = await Promise.all(
      charactersData.map(async (character) => {
        if (character.status === 'public') {
            return character;
        }
        
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
          return { ...character, imageUrl: 'https://placehold.co/400x400.png' };
        }
      })
    );

    return charactersWithUrls;

  } catch (error) {
    if (error instanceof Error && (error.message.includes('User session not found') || error.message.includes('Invalid or expired'))) {
        console.log('User session not found, returning empty character list.');
        return [];
    }
    console.error("Error fetching characters with signed URLs:", error);
    return [];
  }
}
