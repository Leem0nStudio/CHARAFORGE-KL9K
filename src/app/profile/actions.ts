
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb, adminApp } from '@/lib/firebase/server';
import { getStorage, getDownloadURL } from 'firebase-admin/storage';
import { verifyAndGetUid } from '@/lib/auth/server';
import { z } from 'zod';
import type { UserPreferences, UserProfile } from '@/types/user';
import type { DataPack } from '@/types/datapack';
import { getAuth } from 'firebase-admin/auth';

export type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
    newAvatarUrl?: string;
};

// Define a schema for validating the display name
const UpdateProfileSchema = z.object({
  displayName: z.string().min(3, "Display name must be at least 3 characters.").max(30, "Display name cannot be longer than 30 characters.").optional().or(z.literal('')),
  photoUrl: z.string().url("Please provide a valid URL.").optional().or(z.literal('')),
});


// Note: The `photoFile` is handled separately as it's a file buffer
export async function updateUserProfile(prevState: ActionResponse, formData: FormData): Promise<ActionResponse> {
    try {
        const uid = await verifyAndGetUid();
        if (!adminDb || !adminAuth) throw new Error("Server services are not available.");

        const displayName = formData.get('displayName') as string;
        const photoUrl = formData.get('photoUrl') as string;
        const photoFile = formData.get('photoFile') as File;

        const validation = UpdateProfileSchema.safeParse({ displayName, photoUrl });

        if (!validation.success) {
            const firstError = validation.error.errors[0];
            return {
                success: false,
                message: `Invalid input for ${firstError.path.join('.')}: ${firstError.message}`,
            };
        }

        let finalPhotoURL: string | null = null;
        let newAvatarTimestamp: number | null = null;
        
        if (photoFile && photoFile.size > 0) {
            const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
            const filePath = `avatars/${uid}/avatar.png`;
            const file = bucket.file(filePath);

            const buffer = Buffer.from(await photoFile.arrayBuffer());
            await file.save(buffer, {
                metadata: { 
                    contentType: photoFile.type,
                    cacheControl: 'public, max-age=3600', // Cache for 1 hour
                 },
                public: true, 
            });
            finalPhotoURL = file.publicUrl();
            newAvatarTimestamp = Date.now();
        } else if (validation.data.photoUrl) {
            finalPhotoURL = validation.data.photoUrl;
            newAvatarTimestamp = Date.now();
        }
        
        const updates: { displayName?: string, photoURL?: string, avatarUpdatedAt?: number } = {};
        if (validation.data.displayName) {
            updates.displayName = validation.data.displayName;
        }
        if (finalPhotoURL) {
            updates.photoURL = finalPhotoURL;
        }
        if (newAvatarTimestamp) {
            updates.avatarUpdatedAt = newAvatarTimestamp;
        }

        await adminAuth.updateUser(uid, {
            displayName: validation.data.displayName || undefined,
            photoURL: finalPhotoURL || undefined,
        });
        await adminDb.collection('users').doc(uid).set(updates, { merge: true });

        revalidatePath('/profile');
        
        return { 
            success: true, 
            message: 'Profile updated successfully!',
            newAvatarUrl: finalPhotoURL ? `${finalPhotoURL}?t=${newAvatarTimestamp}` : undefined
        };

    } catch(error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error("Update Profile Error:", message);
        return { success: false, message: 'Operation failed.', error: message };
    }
}


export async function deleteUserAccount(): Promise<ActionResponse> {
    try {
        const uid = await verifyAndGetUid();
        if (!adminDb || !adminAuth) throw new Error("Server services are not available.");

        await adminDb.collection('users').doc(uid).delete();
        await adminAuth.deleteUser(uid);
        
        // Note: Associated characters/data in Firestore would need a more complex cleanup,
        // often handled by a Cloud Function triggered on user deletion.

        revalidatePath('/'); // Revalidate the home page
        return { success: true, message: "Your account has been permanently deleted." };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: 'Failed to delete account.', error: message };
    }
}


export async function updateUserPreferences(preferences: UserPreferences): Promise<ActionResponse> {
     try {
        const uid = await verifyAndGetUid();
        if (!adminDb) throw new Error("Server services are not available.");
        
        await adminDb.collection('users').doc(uid).set({ preferences }, { merge: true });
        
        revalidatePath('/profile');
        return { success: true, message: "Your preferences have been saved." };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: 'Failed to save preferences.', error: message };
    }
}
