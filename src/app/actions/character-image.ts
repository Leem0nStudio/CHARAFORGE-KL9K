
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { generateCharacterImage as generateCharacterImageFlow } from '@/ai/flows/character-image/flow';
import type { ImageEngineConfig } from '@/ai/flows/character-image/types';
import { uploadToStorage } from '@/services/storage';

type ActionResponse = {
    success: boolean;
    message: string;
    newImageUrl?: string;
};

export async function generateNewCharacterImage(characterId: string, description: string, engineConfig: ImageEngineConfig): Promise<ActionResponse & { newImageUrl?: string }> {
     const uid = await verifyAndGetUid(); 
     if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
     }
     
     try {
        const { imageUrl } = await generateCharacterImageFlow({ description, engineConfig });

        if (!imageUrl) {
            return { success: false, message: 'AI failed to generate a new image.' };
        }
        
        const destinationPath = `usersImg/${uid}/${characterId}/${uuidv4()}.png`;
        const publicUrl = await uploadToStorage(imageUrl, destinationPath);
        
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

export async function updateCharacterImages(
  characterId: string,
  gallery: string[],
  primaryImageUrl: string,
): Promise<ActionResponse> {
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

    
