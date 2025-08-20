

'use server';

import { adminDb } from '@/lib/firebase/server';
import type { AiModel } from '@/types/ai-model';

// Define a type for the stats object for better type safety.
type DashboardStats = {
  totalUsers: number;
  totalCharacters: number;
  publicCharacters: number;
  privateCharacters: number;
  totalModels: number;
  totalLoras: number;
};

// Return a consistent, zeroed-out object shape on initialization failure or error.
const zeroStats: DashboardStats = {
  totalUsers: 0,
  totalCharacters: 0,
  publicCharacters: 0,
  privateCharacters: 0,
  totalModels: 0,
  totalLoras: 0,
};

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!adminDb) {
    console.error("Database service is unavailable in getDashboardStats.");
    return zeroStats;
  }

  try {
    // Use Promise.all for concurrent data fetching.
    const [
        usersSnapshot, 
        charactersSnapshot, 
        publicCharactersSnapshot,
        modelsSnapshot,
        lorasSnapshot,
    ] = await Promise.all([
      adminDb.collection('users').count().get(),
      adminDb.collection('characters').count().get(),
      adminDb.collection('characters').where('meta.status', '==', 'public').count().get(),
      adminDb.collection('ai_models').where('type', '==', 'model').count().get(),
      adminDb.collection('ai_models').where('type', '==', 'lora').count().get(),
    ]);
    
    const totalUsers = usersSnapshot.data().count;
    const totalCharacters = charactersSnapshot.data().count;
    const publicCharacters = publicCharactersSnapshot.data().count;
    const privateCharacters = totalCharacters - publicCharacters;
    const totalModels = modelsSnapshot.data().count;
    const totalLoras = lorasSnapshot.data().count;

    return {
      totalUsers,
      totalCharacters,
      publicCharacters,
      privateCharacters,
      totalModels,
      totalLoras,
    };
  } catch (error) {
    // Avoid logging errors in production environments for security.
    // A dedicated logging service should be used in a real-world app.
    if (process.env.NODE_ENV !== 'production') {
        console.error("Error fetching dashboard stats:", error);
    }
    // Return zeroed stats on error to prevent breaking the UI.
    return zeroStats;
  }
}


/**
 * Fetches the application's logo URL from the Firestore configuration.
 * Uses a 'no-store' cache policy to ensure the most recent logo is always fetched.
 * @returns {Promise<string | null>} A promise that resolves to the logo URL string, or null if not found.
 */
export async function getLogoUrl(): Promise<string | null> {
    try {
        if (!adminDb) {
            // This should not happen in production, but it's a good safeguard.
            console.error("Firestore is not initialized. Cannot fetch logo URL.");
            return null;
        }
        
        const configDoc = await adminDb.collection('settings').doc('appDetails').get();

        if (configDoc.exists) {
            return configDoc.data()?.logoUrl || null;
        }
        
        return null;

    } catch (error) {
        console.error("Error fetching logo URL from Firestore:", error);
        return null;
    }
}

/**
 * Fetches general application settings.
 * @returns {Promise<{enableAdminFeatures: boolean} | null>}
 */
export async function getUserSettings(): Promise<{enableAdminFeatures: boolean} | null> {
    if (!adminDb) {
        console.error("Database service is unavailable.");
        return null;
    }
    try {
        const settingsDoc = await adminDb.collection('settings').doc('appDetails').get();
        if (settingsDoc.exists) {
            return settingsDoc.data() as {enableAdminFeatures: boolean};
        }
        return null;
    } catch (error) {
        console.error("Error fetching user settings:", error);
        return null;
    }
}
