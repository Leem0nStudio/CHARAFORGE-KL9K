'use server';

import { adminDb } from '@/lib/firebase/server';

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
