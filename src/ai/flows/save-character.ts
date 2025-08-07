
'use server';

/**
 * @fileOverview A server action to save a generated character. This involves two main steps:
 * 1. Uploading the character image to a user-specific folder in Firebase Storage.
 * 2. Saving the character data (including the image URL from Storage) to Firestore.
 *
 * - saveCharacter - The main server action called by the frontend.
 * - SaveCharacterInput - The input type for the saveCharacter function.
 */

import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import { randomUUID } from 'crypto';

const SaveCharacterInputSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string(),
  biography: z.string(),
  imageUrl: z.string().startsWith('data:image/'),
  dataPackId: z.string().optional().nullable(),
});
export type SaveCharacterInput = z.infer<typeof SaveCharacterInputSchema>;


/**
 * Uploads an image from a Data URI to a user-specific folder in Firebase Storage.
 * Images are uploaded as PUBLIC by default.
 * @param dataUri The image represented as a Data URI string.
 * @param userId The UID of the user uploading the image, for folder organization.
 * @returns The public URL of the uploaded image.
 * @throws Throws an error if the upload fails.
 */
async function uploadImageToStorage(dataUri: string, userId: string): Promise<string> {
    const storage = getStorage();
    const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

    const match = dataUri.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
        throw new Error('Invalid Data URI format for image.');
    }
    const contentType = match[1];
    const base64Data = match[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Generate a unique file name inside the user-specific folder.
    const fileName = `usersImg/${userId}/${randomUUID()}.png`;
    const file = bucket.file(fileName);

    await file.save(imageBuffer, {
        metadata: { contentType },
        // By setting public to true, we allow it to be displayed in public galleries.
        public: true,
    });

    // Return the public URL for easier access in galleries.
    return file.publicUrl();
}


export async function saveCharacter(input: SaveCharacterInput) {
  const validation = SaveCharacterInputSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    throw new Error(`Invalid input for ${firstError.path.join('.')}: ${firstError.message}`);
  }
  
  const { name, description, biography, imageUrl: imageDataUri, dataPackId } = validation.data;
  
  try {
    const userId = await verifyAndGetUid();

    if (!adminDb) {
      throw new Error('Database service is not available. Please try again later.');
    }

    const storageUrl = await uploadImageToStorage(imageDataUri, userId);

    const characterRef = adminDb.collection('characters').doc();
    const userRef = adminDb.collection('users').doc(userId);

    await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        const characterData = {
            userId,
            name,
            description,
            biography,
            imageUrl: storageUrl, 
            gallery: [storageUrl],
            status: 'private', // Characters are private by default
            createdAt: FieldValue.serverTimestamp(),
            dataPackId: dataPackId || null,
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

    return { success: true, characterId: characterRef.id };
  } catch (error) {
    console.error('Error saving character:', error);
    const errorMessage = error instanceof Error ? error.message : 'Could not save character due to a server error.';
    throw new Error(errorMessage);
  }
}
