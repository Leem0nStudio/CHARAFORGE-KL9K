'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { DataPack } from '@/types/datapack';
import type { UserPreferences } from '@/types/user';

export type ActionResponse = {
  success: boolean;
  message: string;
  error?: string | null;
  newAvatarUrl?: string | null;
}

// Helper to upload avatar and get URL
async function uploadAvatar(uid: string, file: File): Promise<string> {
  const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  const filePath = `avatars/${uid}/avatar.png`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const gcsFile = bucket.file(filePath);
  await gcsFile.save(buffer, {
    metadata: { 
        contentType: file.type,
        // Add cache control to ensure browsers fetch the new logo, but allow caching
        cacheControl: 'public, max-age=3600',
    },
    public: true, // Make the file publicly readable
  });

  return gcsFile.publicUrl();
}

// Zod schema now only validates fields that are not File objects.
const UpdateProfileSchema = z.object({
  displayName: z.string().min(3, 'Display name must be at least 3 characters.').max(30, 'Display name cannot exceed 30 characters.'),
  photoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});


export async function updateUserProfile(
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  
  try {
    const uid = await verifyAndGetUid();
    if (!adminDb || !adminAuth) {
      throw new Error("Server services are not available.");
    }

    const displayName = formData.get('displayName') as string;
    const photoUrl = formData.get('photoUrl') as string;
    const photoFile = formData.get('photoFile') as File;
    
    const validatedFields = UpdateProfileSchema.safeParse({ displayName, photoUrl });

    if (!validatedFields.success) {
      const firstError = validatedFields.error.flatten().fieldErrors;
      const message = firstError.displayName?.[0] || firstError.photoUrl?.[0] || 'Invalid input provided.';
      return { success: false, message };
    }
  
    const { displayName: newDisplayName } = validatedFields.data;
    let newAvatarUrl: string | null = null;
    const now = Date.now();

    // Handle file upload separately after validating text fields
    if (photoFile && photoFile.size > 0) {
        if (photoFile.size > 5 * 1024 * 1024) { // 5MB limit
            return { success: false, message: 'File is too large. Please select an image smaller than 5MB.' };
        }
        newAvatarUrl = await uploadAvatar(uid, photoFile);
    } else if (validatedFields.data.photoUrl) {
        newAvatarUrl = validatedFields.data.photoUrl;
    }
    
    const authUpdatePayload: { displayName: string, photoURL?: string } = { displayName: newDisplayName };
    // Only update photoURL if a new one was actually provided
    if (newAvatarUrl) {
        authUpdatePayload.photoURL = newAvatarUrl;
    }
    
    await adminAuth.updateUser(uid, authUpdatePayload);
    
    const dbUpdatePayload: { displayName: string, photoURL?: string, avatarUpdatedAt?: number } = { displayName: newDisplayName };
    if (newAvatarUrl) {
      dbUpdatePayload.photoURL = newAvatarUrl;
      // This is the cache-busting timestamp
      dbUpdatePayload.avatarUpdatedAt = now;
    }

    await adminDb.collection('users').doc(uid).set(dbUpdatePayload, { merge: true });

    revalidatePath('/profile');
    revalidatePath('/', 'layout');

    return { 
        success: true, 
        message: 'Profile updated successfully!',
        newAvatarUrl: newAvatarUrl,
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
    return { success: false, message, error: message };
  }
}

const UpdatePreferencesSchema = z.object({
    theme: z.enum(['light', 'dark', 'system']),
    notifications: z.object({
        email: z.boolean(),
    }),
    privacy: z.object({
        profileVisibility: z.enum(['public', 'private']),
    }),
});


export async function updateUserPreferences(preferences: UserPreferences): Promise<ActionResponse> {
    try {
        const uid = await verifyAndGetUid();
        
        if (!adminDb) {
          throw new Error("Database service is not available.");
        }

        const validatedFields = UpdatePreferencesSchema.safeParse(preferences);

        if (!validatedFields.success) {
            return {
                success: false,
                message: 'Invalid preferences data provided.',
            };
        }
        
        const userRef = adminDb.collection('users').doc(uid);
        await userRef.set({ preferences: validatedFields.data }, { merge: true });

        revalidatePath('/profile');
        return { success: true, message: 'Preferences updated successfully.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save preferences. Please try again.';
        return { success: false, message };
    }
}


export async function deleteUserAccount(): Promise<ActionResponse> {
  try {
    const uid = await verifyAndGetUid();
      
    if (!adminDb || !adminAuth) {
      throw new Error("Server services are not available.");
    }
    
    const userRef = adminDb.collection('users').doc(uid);
    const charactersQuery = adminDb.collection('characters').where('userId', '==', uid);
    
    await adminDb.runTransaction(async (transaction) => {
      const charactersSnapshot = await transaction.get(charactersQuery);
      charactersSnapshot.forEach(doc => {
        transaction.delete(doc.ref);
      });
      transaction.delete(userRef);
    });
    
    await adminAuth.deleteUser(uid);
    
    revalidatePath('/');
    return { success: true, message: 'Your account has been permanently deleted.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete your account. Please try again.';
    return { success: false, message };
  }
}

export async function getInstalledDataPacks(): Promise<DataPack[]> {
  try {
    const uid = await verifyAndGetUid();
    if (!adminDb) {
      throw new Error('Database service is unavailable.');
    }
    
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return [];
    }

    const installedPacksIds = userDoc.data()?.stats?.installedPacks || [];
    if (installedPacksIds.length === 0) {
      return [];
    }

    const packPromises = installedPacksIds.map((packId: string) => 
        adminDb.collection('datapacks').doc(packId).get()
    );
    
    const packSnapshots = await Promise.all(packPromises);

    const installedPacks = packSnapshots
        .filter(doc => doc.exists)
        .map(doc => {
            const data = doc.data()!;
            return {
                ...data,
                id: doc.id,
                // Explicitly convert Firebase Timestamp fields to JavaScript Date objects for serialization
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                updatedAt: data.updatedAt && data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
                // Add other potential Timestamp fields here if they exist in DataPack
            } as DataPack;
        });

    return installedPacks;

  } catch (error) {
    console.error("Error fetching installed datapacks:", error);
    return [];
  }
}
