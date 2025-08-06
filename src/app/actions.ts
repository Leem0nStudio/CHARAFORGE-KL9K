
'use server';

import { adminDb } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import type { Character } from '@/types/character';

/**
 * Fetches public characters and generates signed URLs for their images.
 * This is the secure way to display public images from Firebase Storage.
 * @returns {Promise<Character[]>} A promise that resolves to an array of character objects with accessible image URLs.
 */
export async function getPublicCharacters(): Promise<Character[]> {
  try {
    if (!adminDb) {
      throw new Error('Database service is unavailable.');
    }
    
    const charactersRef = adminDb.collection('characters');
    const q = charactersRef.where('status', '==', 'public').orderBy('createdAt', 'desc').limit(20);
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }

    const charactersData: Character[] = [];
    for (const doc of snapshot.docs) {
        const data = doc.data();
        let userName = 'Anonymous';

        if (data.userId) {
            try {
                const userDoc = await adminDb.collection('users').doc(data.userId).get();
                if (userDoc.exists) {
                    userName = userDoc.data()?.displayName || 'Anonymous';
                }
            } catch (userError) {
                console.error(`Failed to fetch user ${data.userId} for character ${doc.id}:`, userError);
                // Keep userName as 'Anonymous' and continue
            }
        }
        
        charactersData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            userName: userName,
        } as Character);
    }
    
    // Generate signed URLs for each character's image
    const charactersWithUrls = await Promise.all(
      charactersData.map(async (character) => {
        try {
          // This check is important if for some reason an old character doesn't have an image URL
          if (!character.imageUrl || !character.imageUrl.startsWith('https://storage.googleapis.com/')) {
            console.warn(`Character ${character.id} has an invalid or missing imageUrl.`);
            return { ...character, imageUrl: 'https://placehold.co/400x400.png' };
          }
          const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
          // Extract the file path from the full gs:// URL
          const filePath = new URL(character.imageUrl).pathname.substring(1).split('/').slice(1).join('/');
          
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
          console.error(`Failed to get signed URL for public character ${character.id}:`, urlError);
          // Return the character with a placeholder or original URL so the app doesn't crash
          return { ...character, imageUrl: 'https://placehold.co/400x400.png' };
        }
      })
    );

    return charactersWithUrls;

  } catch (error) {
    console.error("Error fetching public characters with signed URLs:", error);
    // Return an empty array or throw the error, depending on desired client-side handling
    return [];
  }
}
