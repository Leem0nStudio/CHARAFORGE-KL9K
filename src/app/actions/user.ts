
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { DataPack } from '@/types/datapack';
import type { UserPreferences } from '@/types/user';

export type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
  newAvatarUrl?: string | null;
};

// Zod schema for validating text fields from the profile form
const UpdateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display Name is required').max(50, 'Display Name must be less than 50 characters').optional(),
});


async function uploadAvatar(userId: string, file: File): Promise<string> {
    if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
        throw new Error('Firebase Storage bucket is not configured.');
    }
    const storage = getStorage();
    const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    
    const filePath = `usersImg/${userId}/avatar.png`;
    const fileRef = bucket.file(filePath);

    const buffer = Buffer.from(await file.arrayBuffer());

    await fileRef.save(buffer, {
        metadata: { 
            contentType: file.type,
            cacheControl: 'public, max-age=3600', // Cache for 1 hour, then revalidate
        },
        public: true,
    });
    
    // Return the public URL with a timestamp to bust the cache immediately
    return `${fileRef.publicUrl()}?t=${new Date().getTime()}`;
}


export async function updateUserProfile(prevState: any, formData: FormData): Promise<ActionResponse> {
    try {
        const uid = await verifyAndGetUid();
        if (!adminDb || !adminAuth) {
            throw new Error('Server services not available.');
        }
        
        const displayName = formData.get('displayName') as string;
        const photoFile = formData.get('photoFile') as File;

        const validation = UpdateProfileSchema.safeParse({ displayName });

        if (!validation.success) {
            const firstError = validation.error.errors[0];
            return {
                success: false,
                message: `Invalid input for ${firstError.path.join('.')}: ${firstError.message}`,
            };
        }
        
        let finalPhotoUrl: string | null = null;
        let newAvatarUrlForClient: string | null = null;

        if (photoFile && photoFile.size > 0) {
            if (photoFile.size > 5 * 1024 * 1024) { // 5MB limit
                return { success: false, message: 'File is too large. Please upload an image smaller than 5MB.' };
            }
            finalPhotoUrl = await uploadAvatar(uid, photoFile);
            newAvatarUrlForClient = finalPhotoUrl;
        }

        const userRef = adminDb.collection('users').doc(uid);
        const updates: { [key: string]: any } = {};

        if (displayName) {
            updates.displayName = displayName;
        }
        
        if (finalPhotoUrl) {
            updates.photoURL = finalPhotoUrl;
            updates.avatarUpdatedAt = FieldValue.serverTimestamp();
        }

        if (Object.keys(updates).length > 0) {
            await userRef.update(updates);
        }
        
        // Also update the Firebase Auth profile
        await adminAuth.updateUser(uid, {
            displayName: displayName || undefined,
            photoURL: finalPhotoUrl || undefined,
        });

        revalidatePath('/profile');
        revalidatePath('/'); // Revalidate home page for top creators

        return {
            success: true,
            message: 'Profile updated successfully!',
            newAvatarUrl: newAvatarUrlForClient
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error("Update Profile Error:", message);
        return { success: false, message: 'Operation failed.', error: message };
    }
}


export async function deleteUserAccount(): Promise<ActionResponse> {
    try {
        const uid = await verifyAndGetUid();
        if (!adminDb || !adminAuth) {
            throw new Error('Server services not available.');
        }

        // Firestore transaction to delete user data
        const userRef = adminDb.collection('users').doc(uid);
        const charactersQuery = adminDb.collection('characters').where('userId', '==', uid);

        await adminDb.runTransaction(async (transaction) => {
            const charactersSnapshot = await transaction.get(charactersQuery);
            charactersSnapshot.docs.forEach(doc => transaction.delete(doc.ref));
            transaction.delete(userRef);
        });

        // Delete user from Firebase Auth
        await adminAuth.deleteUser(uid);
        
        revalidatePath('/');

        return { success: true, message: 'Your account has been permanently deleted.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error('Delete User Account Error:', error);
        return { success: false, message: 'Failed to delete account.', error: message };
    }
}

export async function updateUserPreferences(preferences: UserPreferences): Promise<ActionResponse> {
    try {
        const uid = await verifyAndGetUid();
        if (!adminDb) {
            throw new Error("Database service is unavailable.");
        }

        const userRef = adminDb.collection('users').doc(uid);
        await userRef.set({ preferences }, { merge: true });

        revalidatePath('/profile');

        return { success: true, message: "Preferences updated!" };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Update Preferences Error:", error);
        return { success: false, message: "Failed to save preferences." };
    }
}


export async function getInstalledDataPacks(): Promise<DataPack[]> {
    try {
        const uid = await verifyAndGetUid();
        if (!adminDb) {
            throw new Error('Database service not available.');
        }
        
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) return [];
        
        const installedPackIds = userDoc.data()?.stats?.installedPacks || [];
        if (installedPackIds.length === 0) return [];
        
        const packsQuery = adminDb.collection('datapacks').where('id', 'in', installedPackIds);
        const packsSnapshot = await packsQuery.get();
        
        return packsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt.toDate(),
            } as DataPack
        });

    } catch (error) {
         if (error instanceof Error && (error.message.includes('User session not found') || error.message.includes('Invalid or expired'))) {
            console.log('User session not found for installed packs, returning empty list.');
            return [];
        }
        console.error("Error fetching installed DataPacks:", error);
        return [];
    }
}
