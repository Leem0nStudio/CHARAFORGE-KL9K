
'use server';

import { adminDb } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import type { DataPack, DataPackSchema } from '@/types/datapack';

/**
 * Fetches all public datapacks directly from Firestore.
 * This version assumes that the URLs stored in Firestore (coverImageUrl, schemaUrl)
 * are already public and accessible.
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
            schemaUrl: data.schemaUrl || '',
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


/**
 * Securely fetches a DataPack schema from Firebase Storage using the Admin SDK.
 * This avoids client-side CORS issues by proxying the request through the server.
 * @param {string} packId The ID of the datapack to fetch the schema for.
 * @returns {Promise<DataPackSchema | null>} A promise that resolves to the parsed schema object or null on error.
 */
export async function getDataPackSchema(packId: string): Promise<DataPackSchema | null> {
    if (!adminDb) {
        console.error('Database service is unavailable.');
        return null;
    }
    try {
        const packDoc = await adminDb.collection('datapacks').doc(packId).get();
        if (!packDoc.exists) {
            console.error(`DataPack document with ID "${packId}" not found.`);
            return null;
        }

        const schemaPath = packDoc.data()?.schemaPath;
        if (!schemaPath) {
            console.error(`Schema path is not defined for DataPack "${packId}".`);
            return null;
        }

        const bucket = getStorage().bucket();
        const file = bucket.file(schemaPath);
        const [fileContents] = await file.download();
        
        const schema = JSON.parse(fileContents.toString('utf8'));
        return schema;

    } catch (error) {
        console.error(`Failed to fetch and parse schema for DataPack "${packId}":`, error);
        return null;
    }
}
