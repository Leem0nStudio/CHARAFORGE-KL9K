/**
 * @fileoverview Cloud Function for post-upload image processing.
 * This function is triggered when a new image is uploaded to the `raw-uploads/`
 * path in Firebase Storage. It performs several processing steps and saves
 * the result to a different path, updating the character's Firestore document.
 * It will also trigger the RPG stat generation flow.
 */

import { logger } from 'firebase-functions/v2';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import * as path from 'path';
import sharp from 'sharp';
import FormData from 'form-data';

// TODO: Import the stat generation flow when it's created.
// import { generateCharacterStats } from '@/ai/flows/generate-character-stats/flow';

// Initialize Firebase Admin SDK if not already done
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * Removes the background from an image using the ClipDrop API.
 * @param buffer The input image buffer.
 * @returns A promise that resolves to a buffer of the image with the background removed.
 */
async function removeBackground(buffer: Buffer): Promise<Buffer> {
    const apiKey = process.env.CLIPDROP_API_KEY;
    if (!apiKey) {
        logger.warn("CLIPDROP_API_KEY is not set. Skipping background removal.");
        return buffer;
    }

    logger.info("Calling ClipDrop API for background removal...");
    
    const form = new FormData();
    form.append('image_file', buffer, 'image.png');

    const response = await fetch('https://api.clipdrop.co/remove-background/v1', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: form as any,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Background removal failed: ${errorText}`);
    }
    
    const resultBuffer = Buffer.from(await response.arrayBuffer());
    logger.info("Successfully removed background.");
    return resultBuffer;
}

/**
 * Upscales an image using the ClipDrop Super Resolution API.
 * @param buffer The input image buffer.
 * @returns A promise that resolves to a buffer of the upscaled image.
 */
async function upscaleImage(buffer: Buffer): Promise<Buffer> {
    const apiKey = process.env.CLIPDROP_API_KEY;
    if (!apiKey) {
        logger.warn("CLIPDROP_API_KEY is not set. Skipping upscaling.");
        return buffer;
    }

    logger.info("Calling ClipDrop API for upscaling...");

    const form = new FormData();
    form.append('image_file', buffer, 'image.png');

    const response = await fetch('https://api.clipdrop.co/super-resolution/v1', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: form as any,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upscaling failed: ${errorText}`);
    }

    const resultBuffer = Buffer.from(await response.arrayBuffer());
    logger.info("Successfully upscaled image.");
    return resultBuffer;
}


/**
 * Cloud Function that triggers on new file uploads to the 'raw-uploads/' path.
 * This function now handles the full Showcase processing pipeline and reports status.
 */
export const processUploadedImage = onObjectFinalized({
    cpu: 2,
    memory: '1GiB',
    region: 'us-central1',
    bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    timeoutSeconds: 300,
}, async (event) => {
    const fileBucket = event.bucket;
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    if (!contentType?.startsWith('image/')) {
        logger.log(`File '${filePath}' is not an image. Ignoring.`);
        return;
    }
    if (!filePath.startsWith('raw-uploads/')) {
        logger.log(`File '${filePath}' is not in raw-uploads/. Ignoring.`);
        return;
    }
    
    const pathParts = filePath.split('/');
    if (pathParts.length < 4) {
        logger.warn(`File path '${filePath}' does not have the expected structure. Ignoring.`);
        return;
    }
    const userId = pathParts[1];
    const characterId = pathParts[2];
    const fileName = pathParts[pathParts.length - 1];
    
    logger.log(`Processing showcase image for character '${characterId}' by user '${userId}'.`);
    
    const characterRef = db.collection('characters').doc(characterId);
    
    const bucket = getStorage().bucket(fileBucket);
    const downloadResponse = await bucket.file(filePath).download();
    const imageBuffer = downloadResponse[0];
    
    logger.log(`Successfully downloaded '${fileName}'. Starting processing pipeline.`);

    try {
        await characterRef.update({ 'visuals.showcaseProcessingStatus': 'removing-background' });
        const bufferWithoutBg = await removeBackground(imageBuffer);
        logger.info("Step 1/4: Background removal complete.");

        await characterRef.update({ 'visuals.showcaseProcessingStatus': 'upscaling' });
        const upscaledBuffer = await upscaleImage(bufferWithoutBg);
        logger.info("Step 2/4: Upscaling complete.");

        await characterRef.update({ 'visuals.showcaseProcessingStatus': 'finalizing' });
        const processedBuffer = await sharp(upscaledBuffer)
            .resize(1024, 1024, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } })
            .webp({ quality: 90 })
            .toBuffer();
        logger.info("Step 3/4: Image successfully normalized and converted to WebP.");
            
        const processedFileName = `${path.parse(fileName).name}.webp`;
        const processedPath = `showcase-images/${userId}/${characterId}/${processedFileName}`;
        const file = bucket.file(processedPath);

        await file.save(processedBuffer, {
            metadata: {
                contentType: 'image/webp',
                cacheControl: 'public, max-age=31536000',
            },
            public: true,
        });

        const publicUrl = file.publicUrl();
        logger.info(`Step 4/4: Processed image uploaded. Public URL: ${publicUrl}`);

        await characterRef.update({
            'visuals.showcaseImageUrl': publicUrl,
            'visuals.isShowcaseProcessed': true,
            'visuals.showcaseProcessingStatus': 'complete',
            // Set initial RPG stats state
            'rpg.statsStatus': 'pending',
        });
        logger.log(`Successfully updated Firestore for character '${characterId}'.`);
        
        // Asynchronously trigger the stat generation. No need to wait for it.
        // TODO: Uncomment this when the stat generation flow is created.
        // generateCharacterStats({ characterId }).catch(err => {
        //     logger.error(`Failed to trigger stat generation for character ${characterId}`, err);
        // });
        
        await bucket.file(filePath).delete();
        logger.log(`Successfully deleted raw file: '${filePath}'.`);

    } catch (error) {
        logger.error(`Failed to process showcase image for character ${characterId}.`, { error });
        await characterRef.update({ 
            'visuals.isShowcaseProcessed': false,
            'visuals.showcaseProcessingStatus': 'failed',
         });
    }
});
