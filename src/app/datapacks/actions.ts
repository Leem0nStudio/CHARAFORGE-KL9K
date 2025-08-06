
'use server';

import { adminDb } from '@/lib/firebase/server';
import type { DataPack } from '@/types/datapack';

/**
 * Fetches all public datapacks directly from Firestore.
 * This version assumes that the URLs stored in Firestore (coverImageUrl, schemaUrl)
 * are already public and accessible. It removes the need for generating signed URLs,
 * simplifying the logic and improving performance.
 * @returns {Promise<DataPack[]>} A promise that resolves to an array of datapack objects.
 */
export async function getPublicDataPacks(): Promise<DataPack[]> {
  if (!adminDb) {
    console.error('Database service is unavailable.');
    return [];
  }

  try {
    const dataPacksRef = adminDb.collection('datapacks');
    const snapshot = await dataPacksRef.orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return [];
    }

    // Map the documents directly to the DataPack type.
    const dataPacksData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Unnamed DataPack',
            author: data.author || 'Unknown Author',
            description: data.description || 'No description available.',
            coverImageUrl: data.coverImageUrl || null,
            schemaUrl: data.schemaUrl || '', // The public URL is used directly.
            type: data.type || 'free',
            price: data.price || 0,
            tags: data.tags || [],
            createdAt: data.createdAt.toDate(),
            schemaPath: data.schemaPath,
            coverImagePath: data.coverImagePath,
        } as DataPack;
    });

    return dataPacksData;

  } catch (error) {
    console.error("Error fetching public datapacks:", error);
    return [];
  }
}
