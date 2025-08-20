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
 * In a real implementation, this would make an API call to a service like remove.bg or ClipDrop.
 * @param buffer The input image buffer.
 * @returns A promise that resolves to a buffer of the image with the background removed.
 */
async function removeBackground(buffer: Buffer): Promise<Buffer> {
    logger.info("Placeholder: Removing background. In a real implementation, this would call an external API.");
    // For now, just return the original buffer.
    // Example with a real API:
    // const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    //   method: 'POST',
    //   body: new URLSearchParams({ image_file_b64: buffer.toString('base64'), size: 'auto' }),
    //   headers: { 'X-Api-Key': 'YOUR_API_KEY' },
    // });
    // if (!response.ok) throw new Error('Background removal failed');
    // const blob = await response.blob();
    // return Buffer.from(await blob.arrayBuffer());
    return buffer;
}


/**
 * Cloud Function that triggers on new file uploads to the 'raw-uploads/' path.
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
    
    logger.log(`Processing image for character '${characterId}' by user '${userId}'.`);
    
    // 2. Download the raw image
    const bucket = getStorage().bucket(fileBucket);
    const downloadResponse = await bucket.file(filePath).download();
    const imageBuffer = downloadResponse[0];
    
    logger.log(`Successfully downloaded '${fileName}'. Starting processing pipeline.`);

    try {
        // --- STEP 1: Remove Background (External API Call Placeholder) ---
        const bufferWithoutBg = await removeBackground(imageBuffer);

        // --- STEP 2: Enhance/Optimize with Sharp ---
        const processedBuffer = await sharp(bufferWithoutBg)
            .resize(1024, 1024, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } })
            .webp({ quality: 90 }) // Convert to WebP for best quality/size ratio
            .toBuffer();
            
        logger.log('Image successfully processed and converted to WebP.');

        // 3. Upload the processed image
        const processedFileName = `${path.parse(fileName).name}.webp`;
        const processedPath = `processed-images/${userId}/${characterId}/${processedFileName}`;
        const file = bucket.file(processedPath);

        await file.save(processedBuffer, {
            metadata: {
                contentType: 'image/webp',
                cacheControl: 'public, max-age=31536000', // Cache aggressively
            },
            public: true,
        });

        const publicUrl = file.publicUrl();
        logger.log(`Processed image uploaded to '${processedPath}'. Public URL: ${publicUrl}`);

        // 4. Update Firestore document
        const characterRef = db.collection('characters').doc(characterId);
        await characterRef.update({
            'visuals.imageUrl': publicUrl,
            'visuals.gallery': [publicUrl], // Replace gallery with the new processed image
            'visuals.isProcessed': true,
        });
        logger.log(`Successfully updated Firestore for character '${characterId}'.`);
        
        // 5. (Optional but recommended) Clean up the original raw file
        await bucket.file(filePath).delete();
        logger.log(`Successfully deleted raw file: '${filePath}'.`);

    } catch (error) {
        logger.error(`Failed to process image for character ${characterId}.`, { error });
        // Optional: Update Firestore to indicate a processing failure
        const characterRef = db.collection('characters').doc(characterId);
        await characterRef.update({ 'visuals.isProcessed': 'failed' });
    }
});
