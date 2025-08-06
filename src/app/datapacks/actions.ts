
'use server';

import { adminDb } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import type { DataPack } from '@/types/datapack';

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

    const dataPacksData = snapshot.docs.map(doc => {
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
            schemaUrl: data.schemaUrl, // Keep the gs:// or https:// URL here
        } as DataPack;
    });

    // Generate signed URLs for each pack's schema
    const packsWithSignedUrls = await Promise.all(
        dataPacksData.map(async (pack) => {
            if (!pack.schemaUrl) {
                console.warn(`DataPack ${pack.id} has no schemaUrl.`);
                return { ...pack, schemaUrl: '' }; // Return an empty string if no schema URL
            }
            try {
                const bucket = getStorage().bucket();
                // Extract file path from URL (works for gs:// and https:// storage URLs)
                const filePath = new URL(pack.schemaUrl).pathname.substring(1).split('/').slice(1).join('/');

                if (!filePath) {
                    throw new Error('Could not extract file path from URL.');
                }
                
                const file = bucket.file(filePath);
                const [signedUrl] = await file.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 60 * 60 * 1000, // 1 hour validity
                });
                return { ...pack, schemaUrl: signedUrl };
            } catch (error) {
                console.error(`Failed to get signed URL for DataPack schema ${pack.id}:`, error);
                return { ...pack, schemaUrl: '' }; // Return empty on error
            }
        })
    );


    return packsWithSignedUrls;
  } catch (error) {
    console.error("Error fetching public datapacks:", error);
    return [];
  }
}
