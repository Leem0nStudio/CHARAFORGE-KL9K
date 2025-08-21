

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
            'visuals.gallery': FieldValue.arrayUnion(publicUrl),
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
     
     if (!characterDoc.exists || characterDoc.data()?.meta?.userId !== uid) {
        return { success: false, message: 'Permission denied or character not found.' };
     }

     if (!gallery.includes(primaryImageUrl)) {
        return { success: false, message: 'Primary image must be one of the images in the gallery.'}
     }
     if (gallery.length > 10) {
        return { success: false, message: 'You can add a maximum of 10 images.'}
     }
     
     const oldPrimaryUrl = characterDoc.data()?.visuals?.imageUrl;
     
     await characterRef.update({ 
        'visuals.gallery': gallery,
        'visuals.imageUrl': primaryImageUrl,
      });

    // If the primary image has changed, the old showcase image is no longer valid.
    // Reset the showcase state to prompt the user to reprocess.
    if (primaryImageUrl !== oldPrimaryUrl) {
      console.log('Primary image changed. Resetting showcase state.');
      await characterRef.update({
            'visuals.isShowcaseProcessed': false,
            'visuals.showcaseImageUrl': null,
            'visuals.showcaseProcessingStatus': 'idle',
      });
    }

     revalidatePath(`/characters/${characterId}/edit`);
     revalidatePath('/characters');

     return { success: true, message: 'Image gallery updated successfully!' };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update image gallery due to a server error.';
    return { success: false, message };
  }
}


export async function reprocessCharacterImage(characterId: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
    }
    
    const characterRef = adminDb.collection('characters').doc(characterId);
    
    try {
        const characterDoc = await characterRef.get();
        if (!characterDoc.exists || characterDoc.data()?.meta.userId !== uid) {
            return { success: false, message: 'Permission denied or character not found.' };
        }
        
        const imageUrl = characterDoc.data()?.visuals.imageUrl;
        if (!imageUrl) {
            return { success: false, message: 'Character has no primary image to reprocess.' };
        }

        // Fetching the image using a server-side-safe fetch
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch existing image: ${response.statusText}`);
        }
        const imageBuffer = await response.buffer();

        const destinationPath = `raw-uploads/${uid}/${characterId}/${uuidv4()}.png`;
        await uploadToStorage(imageBuffer, destinationPath, response.headers.get('content-type') || 'image/png');

        // **STRUCTURAL FIX**: Immediately set the status to the first step of processing
        // before returning. This ensures the UI can reflect the "in-progress" state
        // as soon as the action completes.
        await characterRef.update({
            'visuals.isShowcaseProcessed': false,
            'visuals.showcaseImageUrl': null,
            'visuals.showcaseProcessingStatus': 'removing-background',
        });

        revalidatePath(`/characters/${characterId}/edit`);
        return { success: true, message: 'Image reprocessing initiated.' };
        
    } catch(error) {
        const message = error instanceof Error ? error.message : 'Failed to reprocess image.';
        console.error("Reprocess Error:", message);
        await characterRef.update({ 
            'visuals.isShowcaseProcessed': 'failed',
            'visuals.showcaseProcessingStatus': 'failed',
         }).catch(() => {});
        return { success: false, message };
    }
}
