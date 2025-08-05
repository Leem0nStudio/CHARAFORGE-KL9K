
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/server';

export type ActionResponse = {
  success: boolean;
  message: string;
}

/**
 * A centralized function to verify user's session from the server-side.
 * Throws an error if the user is not authenticated or services are unavailable.
 * @returns {Promise<string>} The authenticated user's UID.
 */
async function verifyAndGetUid(): Promise<string> {
  if (!adminAuth || !adminDb) {
    throw new Error('Authentication or Database service is unavailable on the server.');
  }

  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  if (!idToken) {
    throw new Error('User session not found. Please log in again.');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    throw new Error('Invalid or expired user session. Please log in again.');
  }
}


const UpdateProfileSchema = z.object({
  displayName: z.string().min(3, 'Display name must be at least 3 characters.').max(30, 'Display name cannot exceed 30 characters.'),
});

export async function updateUserProfile(
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  
  try {
    const uid = await verifyAndGetUid();

    const validatedFields = UpdateProfileSchema.safeParse({
      displayName: formData.get('displayName'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: validatedFields.error.flatten().fieldErrors.displayName?.[0] || 'Invalid input.',
      };
    }
  
    const { displayName } = validatedFields.data;

    await adminAuth.updateUser(uid, { displayName });
    await adminDb.collection('users').doc(uid).set({ displayName }, { merge: true });

    revalidatePath('/profile');
    return { success: true, message: 'Profile updated successfully!' };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
    return { success: false, message };
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
export type UserPreferences = z.infer<typeof UpdatePreferencesSchema>;


export async function updateUserPreferences(preferences: UserPreferences): Promise<ActionResponse> {
    try {
        const uid = await verifyAndGetUid();
        
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
