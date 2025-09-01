

'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import { v4 as uuidv4 } from 'uuid';
import { generateCharacterImage as generateCharacterImageFlow } from '@/ai/flows/character-image/flow';
import type { ImageEngineConfig } from '@/ai/flows/character-image/types';
import { uploadToStorage } from '@/services/storage';
import sharp from 'sharp';

type ActionResponse = {
    success: boolean;
    message: string;
    newImageUrl?: string;
};

export async function generateNewCharacterImage(characterId: string, description: string, engineConfig: ImageEngineConfig): Promise<ActionResponse & { newImageUrl?: string }> {
     const uid = await verifyAndGetUid(); 
     const supabase = getSupabaseServerClient();
     
     try {
        const { imageUrl } = await generateCharacterImageFlow({ description, engineConfig });

        if (!imageUrl) {
            return { success: false, message: 'AI failed to generate a new image.' };
        }
        
        const destinationPath = `usersImg/${uid}/${characterId}/${uuidv4()}.png`;
        const publicUrl = await uploadToStorage(imageUrl, destinationPath);
        
        // Fetch current gallery and append
        const { data: characterData, error: fetchError } = await supabase
            .from('characters')
            .select('visual_details')
            .eq('id', characterId)
            .single();

        if(fetchError) throw fetchError;

        const currentGallery = characterData?.visual_details?.gallery || [];
        const newGallery = [...currentGallery, publicUrl];

        const { error: updateError } = await supabase
            .from('characters')
            .update({ visual_details: { ...characterData?.visual_details, gallery: newGallery } })
            .eq('id', characterId);
        
        if (updateError) throw updateError;

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
  const supabase = getSupabaseServerClient();
  
  try {
     const { data: characterData, error: fetchError } = await supabase
        .from('characters')
        .select('user_id, visual_details')
        .eq('id', characterId)
        .single();
     
     if (fetchError || !characterData) throw new Error('Character not found.');
     if (characterData.user_id !== uid) {
        return { success: false, message: 'Permission denied.' };
     }

     if (!gallery.includes(primaryImageUrl)) {
        return { success: false, message: 'Primary image must be one of the images in the gallery.'}
     }
     if (gallery.length > 10) {
        return { success: false, message: 'You can add a maximum of 10 images.'}
     }
     
     const oldPrimaryUrl = characterData.visual_details?.imageUrl;
     
     const newVisuals = {
         ...characterData.visual_details,
         gallery: gallery,
         imageUrl: primaryImageUrl
     };
     
     // If the primary image has changed, reset the showcase state.
     if (primaryImageUrl !== oldPrimaryUrl) {
      console.log('Primary image changed. Resetting showcase state.');
      newVisuals.isShowcaseProcessed = false;
      newVisuals.showcaseImageUrl = null;
      newVisuals.showcaseProcessingStatus = 'idle';
    }

    const { error: updateError } = await supabase
        .from('characters')
        .update({ visual_details: newVisuals })
        .eq('id', characterId);

    if (updateError) throw updateError;

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
    const supabase = getSupabaseServerClient();
    
    try {
        const { data: characterData, error: fetchError } = await supabase
            .from('characters')
            .select('user_id, visual_details')
            .eq('id', characterId)
            .single();

        if (fetchError || !characterData) throw new Error('Character not found.');
        if (characterData.user_id !== uid) {
            return { success: false, message: 'Permission denied.' };
        }

        const imageUrl = characterData.visual_details?.imageUrl;
        if (!imageUrl) {
            return { success: false, message: 'Character has no primary image to reprocess.' };
        }
        
        await supabase
            .from('characters')
            .update({ visual_details: { ...characterData.visual_details, showcaseProcessingStatus: 'removing-background' } })
            .eq('id', characterId);
            
        revalidatePath(`/characters/${characterId}/edit`);
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to fetch original image for reprocessing: ${response.statusText}`);
        
        const imageBuffer = await response.buffer();
        
        // Image processing logic is now directly in the server action
        const processedBuffer = await sharp(imageBuffer)
            .removeBackground()
            .webp({ quality: 90 })
            .toBuffer();

        const destinationPath = `showcase-images/${uid}/${characterId}/${uuidv4()}.webp`;
        const showcaseImageUrl = await uploadToStorage(processedBuffer, destinationPath);

        const newVisuals = {
            ...characterData.visual_details,
            imageUrl: characterData.visual_details.imageUrl, // Keep original primary image
            isShowcaseProcessed: true,
            showcaseImageUrl: showcaseImageUrl,
            showcaseProcessingStatus: 'complete'
        };

        await supabase
            .from('characters')
            .update({ visual_details: newVisuals })
            .eq('id', characterId);
            
        revalidatePath(`/characters/${characterId}/edit`);
        revalidatePath(`/showcase/${characterId}`);
        
        return { success: true, message: 'Image successfully reprocessed.' };
        
    } catch(error) {
        const message = error instanceof Error ? error.message : 'Failed to reprocess image.';
        console.error("Reprocess Error:", message);
        await supabase
            .from('characters')
            .update({ visual_details: { showcaseProcessingStatus: 'failed' } })
            .eq('id', characterId);
         revalidatePath(`/characters/${characterId}/edit`);
        return { success: false, message };
    }
}
