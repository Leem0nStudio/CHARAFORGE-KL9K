/**
 * @fileoverview Cloud Function for post-upload image processing.
 * This function is triggered when a new image is uploaded to the `raw-uploads/`
 * path in Firebase Storage. It performs several processing steps and saves
 * the result to a different path, updating the character's Firestore document.
 */

import { logger } from 'firebase-functions/v2';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import * as path from 'path';
import sharp from 'sharp';

// Initialize Firebase Admin SDK if not already done
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * Placeholder function for an external background removal service.
 * @param buffer The input image buffer.
 * @returns A promise that resolves to a buffer of the image with the background removed.
 */
async function removeBackground(buffer: Buffer): Promise<Buffer> {
    logger.info("Placeholder: Removing background. In a real implementation, this would call an external API.");
    // Example with a real API like remove.bg or ClipDrop:
    // const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    //   method: 'POST',
    //   body: new URLSearchParams({ image_file_b64: buffer.toString('base64'), size: 'auto' }),
    //   headers: { 'X-Api-Key': 'YOUR_API_KEY_HERE' },
    // });
    // if (!response.ok) throw new Error('Background removal failed');
    // const blob = await response.blob();
    // return Buffer.from(await blob.arrayBuffer());
    
    // For now, we return the original buffer as we have no real implementation.
    return buffer;
}

/**
 * Placeholder function for an external image upscaling service.
 * @param buffer The input image buffer.
 * @returns A promise that resolves to a buffer of the upscaled image.
 */
async function upscaleImage(buffer: Buffer): Promise<Buffer> {
    logger.info("Placeholder: Upscaling image. In a real implementation, this would call an external API.");
    // Example with a real API like Replicate:
    // const response = await fetch('https://api.replicate.com/v1/predictions', {
    //   method: 'POST',
    //   headers: { 'Authorization': 'Token YOUR_API_KEY_HERE', 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ version: "REPLICATE_MODEL_VERSION", input: { image: `data:image/jpeg;base64,${buffer.toString('base64')}` }})
    // });
    // ... polling logic for result ...
    
    // For now, we return the original buffer.
    return buffer;
}


/**
 * Cloud Function that triggers on new file uploads to the 'raw-uploads/' path.
 * This function now handles the full Showcase processing pipeline.
 */
export const processUploadedImage = onObjectFinalized({
    cpu: 2,
    memory: '1GiB',
    region: 'us-central1',
    bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
}, async (event) => {
    const fileBucket = event.bucket;
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    // 1. Path and File Name validation
    if (!contentType?.startsWith('image/')) {
        logger.log(`File '${filePath}' is not an image. Ignoring.`);
        return;
    }
    if (!filePath.startsWith('raw-uploads/')) {
        logger.log(`File '${filePath}' is not in raw-uploads/. This function only processes showcase images. Ignoring.`);
        return;
    }
    
    const pathParts = filePath.split('/');
    if (pathParts.length < 4) {
        logger.warn(`File path '${filePath}' does not have the expected structure (raw-uploads/userId/characterId/fileName). Ignoring.`);
        return;
    }
    const userId = pathParts[1];
    const characterId = pathParts[2];
    const fileName = pathParts[pathParts.length - 1];
    
    logger.log(`Processing showcase image for character '${characterId}' by user '${userId}'.`);
    
    const characterRef = db.collection('characters').doc(characterId);
    
    // 2. Download the raw image
    const bucket = getStorage().bucket(fileBucket);
    const downloadResponse = await bucket.file(filePath).download();
    const imageBuffer = downloadResponse[0];
    
    logger.log(`Successfully downloaded '${fileName}'. Starting processing pipeline.`);

    try {
        // --- STEP 1: Remove Background (Placeholder) ---
        const bufferWithoutBg = await removeBackground(imageBuffer);
        logger.info("Step 1/4: Background removal placeholder complete.");

        // --- STEP 2: Upscale Image (Placeholder) ---
        const upscaledBuffer = await upscaleImage(bufferWithoutBg);
        logger.info("Step 2/4: Upscaling placeholder complete.");

        // --- STEP 3: Normalize & Optimize with Sharp ---
        const processedBuffer = await sharp(upscaledBuffer)
            .resize(1024, 1024, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } }) // Standardize size, ensure transparent bg
            .webp({ quality: 90 }) // Convert to WebP for optimization
            .toBuffer();
        logger.info("Step 3/4: Image successfully normalized and converted to WebP.");
            
        // 4. Upload the processed image to its final destination
        const processedFileName = `${path.parse(fileName).name}.webp`;
        const processedPath = `showcase-images/${userId}/${characterId}/${processedFileName}`;
        const file = bucket.file(processedPath);

        await file.save(processedBuffer, {
            metadata: {
                contentType: 'image/webp',
                cacheControl: 'public, max-age=31536000', // Cache for 1 year
            },
            public: true,
        });

        const publicUrl = file.publicUrl();
        logger.info(`Step 4/4: Processed image uploaded to '${processedPath}'. Public URL: ${publicUrl}`);

        // 5. Update Firestore document with the new showcase URL and status
        await characterRef.update({
            'visuals.showcaseImageUrl': publicUrl,
            'visuals.isShowcaseProcessed': true,
        });
        logger.log(`Successfully updated Firestore for character '${characterId}'.`);
        
        // 6. Clean up the original raw file
        await bucket.file(filePath).delete();
        logger.log(`Successfully deleted raw file: '${filePath}'.`);

    } catch (error) {
        logger.error(`Failed to process showcase image for character ${characterId}.`, { error });
        // Update Firestore to indicate a processing failure
        await characterRef.update({ 'visuals.isShowcaseProcessed': 'failed' });
    }
});
