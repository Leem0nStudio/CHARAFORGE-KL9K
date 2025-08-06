'use server';

import { adminDb } from '@/lib/firebase/server';
import type { DataPack } from '@/types/datapack';

export async function getPublicDataPacks(): Promise<DataPack[]> {
  if (!adminDb) {
    console.error('Database service is unavailable.');
    return [];
  }

  try {
    const dataPacksRef = adminDb.collection('datapacks');
    // For now, all are public. We can add a filter here later.
    const snapshot = await dataPacksRef.orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return [];
    }

    const dataPacks = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Unnamed DataPack',
            author: data.author || 'Unknown Author',
            description: data.description || 'No description available.',
            coverImageUrl: data.coverImageUrl || null,
            type: data.type || 'free',
            price: data.price || 0,
            createdAt: data.createdAt.toDate(),
            schemaUrl: data.schemaUrl,
            optionsBaseUrl: data.optionsBaseUrl,
        } as DataPack;
    });

    return dataPacks;
  } catch (error) {
    console.error("Error fetching public datapacks:", error);
    return [];
  }
}
