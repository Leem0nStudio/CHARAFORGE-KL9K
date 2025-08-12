
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { UserPreferences, UserProfile } from '@/types/user';
import { uploadToStorage } from '@/services/storage';

export type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
  newAvatarUrl?: string | null;
};

// Zod schema for validating text fields from the profile form.
// Follows the "Rigorous Server-Side Validation" pattern.
const UpdateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display Name is required').max(50, 'Display Name must be less than 50 characters'),
});


export async function updateUserProfile(prevState: any, formData: FormData): Promise<ActionResponse> {
    try {
        // Pattern: Secure Session Management
        const uid = await verifyAndGetUid();
        if (!adminDb || !adminAuth) {
            throw new Error('Server services not available.');
        }
        
        const displayName = formData.get('displayName') as string;
        const photoFile = formData.get('photoFile') as File | null;

        // Pattern: Rigorous Server-Side Validation
        const validation = UpdateProfileSchema.safeParse({ displayName });

        if (!validation.success) {
            const firstError = validation.error.errors[0];
            return {
                success: false,
                message: `Invalid input for ${firstError.path.join('.')}: ${firstError.message}`,
            };
        }
        
        let finalPhotoUrl: string | null = null;
        
        if (photoFile && photoFile.size > 0) {
            if (photoFile.size > 5 * 1024 * 1024) { // 5MB limit
                return { success: false, message: 'File is too large. Please upload an image smaller than 5MB.' };
            }
            const destinationPath = `usersImg/${uid}/avatar.png`;
            // Pattern: Centralized File Upload Service
            const publicUrl = await uploadToStorage(photoFile, destinationPath);
            // Add a timestamp to bust the cache immediately after upload
            finalPhotoUrl = `${publicUrl}?t=${new Date().getTime()}`;
        }

        const userRef = adminDb.collection('users').doc(uid);
        const updates: { [key: string]: any } = {
            displayName: validation.data.displayName
        };
        
        if (finalPhotoUrl) {
            updates.photoURL = finalPhotoUrl;
            updates.avatarUpdatedAt = FieldValue.serverTimestamp();
        }

        if (Object.keys(updates).length > 0) {
            await userRef.update(updates);
        }
        
        await adminAuth.updateUser(uid, {
            displayName: validation.data.displayName,
            photoURL: finalPhotoUrl ?? undefined,
        });

        revalidatePath('/profile');
        revalidatePath('/'); // Revalidate home page for top creators

        return {
            success: true,
            message: 'Profile updated successfully!',
            newAvatarUrl: finalPhotoUrl
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error("Update Profile Error:", message);
        return { success: false, message: 'Operation failed.', error: message };
    }
}


export async function deleteUserAccount(): Promise<ActionResponse> {
    try {
        // Pattern: Secure Session Management
        const uid = await verifyAndGetUid();
        if (!adminDb || !adminAuth) {
            throw new Error('Server services not available.');
        }

        const userRef = adminDb.collection('users').doc(uid);
        const charactersQuery = adminDb.collection('characters').where('userId', '==', uid);

        await adminDb.runTransaction(async (transaction) => {
            const charactersSnapshot = await transaction.get(charactersQuery);
            charactersSnapshot.docs.forEach(doc => transaction.delete(doc.ref));
            transaction.delete(userRef);
        });

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
        // Pattern: Secure Session Management
        const uid = await verifyAndGetUid();
        if (!adminDb) {
            throw new Error("Database service is unavailable.");
        }

        const userRef = adminDb.collection('users').doc(uid);
        await userRef.set({ preferences }, { merge: true });

        revalidatePath('/profile');
        revalidatePath('/');

        return { success: true, message: "Preferences updated!" };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Update Preferences Error:", error);
        return { success: false, message: "Failed to save preferences." };
    }
}


export async function getPublicUserProfile(uid: string): Promise<Partial<UserProfile> | null> {
    if (!adminDb) {
        console.error('Database service unavailable.');
        return null;
    }
    try {
        const userRef = adminDb.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return null;
        }

        const userData = userDoc.data();
        if (userData?.preferences?.privacy?.profileVisibility !== 'public') {
            return null; // Respect privacy settings
        }
        
        const memberSince = userData.stats?.memberSince;
        const stats = userData.stats ? {
            ...userData.stats,
            memberSince: memberSince instanceof Timestamp ? memberSince.toMillis() : memberSince,
        } : {};

        return {
            uid: userData.uid,
            displayName: userData.displayName || 'Anonymous',
            photoURL: userData.photoURL || null,
            stats,
        };
    } catch(error) {
        console.error(`Error fetching public profile for UID ${uid}:`, error);
        return null;
    }
}


export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!adminDb) {
    console.error('Database service is unavailable.');
    return null;
  }
  try {
    const userRef = adminDb.collection('users').doc(uid);
    const doc = await userRef.get();
    if (!doc.exists) {
      return null;
    }
    const data = doc.data() as UserProfile;
    
    // Serialize all potential Timestamp fields before returning from the server action.
    if (data.stats?.memberSince && (data.stats.memberSince as any) instanceof Timestamp) {
        data.stats.memberSince = (data.stats.memberSince as any).toMillis();
    }
    
    if ((data as any).createdAt && (data as any).createdAt instanceof Timestamp) {
        (data as any).createdAt = (data as any).createdAt.toMillis();
    }
    
    if ((data as any).lastLogin && (data as any).lastLogin instanceof Timestamp) {
        (data as any).lastLogin = (data as any).lastLogin.toMillis();
    }

    return data;
  } catch (error) {
    console.error(`Error fetching user profile for ${uid}:`, error);
    return null;
  }
}
