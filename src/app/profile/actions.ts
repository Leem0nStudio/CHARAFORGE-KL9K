

'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/navigation';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/server';


export type ActionResponse = {
  success: boolean;
  message: string;
}

// This function centralizes the logic for verifying the user's session from the server-side.
async function verifyAndGetUid(): Promise<{uid: string | null, error: string | null}> {
  // Ensure Firebase Admin services are available before proceeding.
  if(!adminAuth) {
    return { uid: null, error: 'Authentication service is unavailable on the server.' };
  }

  // Retrieve the session cookie.
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  // If no token is found, the user is not authenticated.
  if (!idToken) {
    return { uid: null, error: 'User session not found. Please log in again.' };
  }

  // Verify the token using the Firebase Admin SDK.
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, error: null };
  } catch (error) {
    // Handle cases where the token is invalid or expired.
    return { uid: null, error: 'Invalid or expired user session. Please log in again.' };
  }
}

const UpdateProfileSchema = z.object({
  displayName: z.string().min(3, 'Display name must be at least 3 characters.').max(30, 'Display name cannot exceed 30 characters.'),
});

// This is the Server Action that will be used with useActionState
export async function updateUserProfile(
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const { uid, error } = await verifyAndGetUid();
  if (error || !uid) {
    return { success: false, message: error || 'Failed to verify user.' };
  }

  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }

  const validatedFields = UpdateProfileSchema.safeParse({
    displayName: formData.get('displayName'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.displayName?.[0] || 'Invalid input.',
    };
  }

  try {
    const { displayName } = validatedFields.data;
    // Update both Firebase Auth and Firestore for consistency
    await adminAuth.updateUser(uid, { displayName });
    await adminDb.collection('users').doc(uid).update({ displayName });

    revalidatePath('/profile'); // Revalidate the profile page to show the new name
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
    const { uid, error } = await verifyAndGetUid();
    if (error || !uid) {
        return { success: false, message: error || 'Failed to verify user.' };
    }

    const validatedFields = UpdatePreferencesSchema.safeParse(preferences);

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid preferences data provided.',
        };
    }

    if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
    }

    try {
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
  const { uid, error } = await verifyAndGetUid();
  if (error || !uid) {
      return { success: false, message: error || 'Failed to verify user.' };
  }
    
  if (!adminAuth || !adminDb) {
      return { success: false, message: 'Server services are unavailable to perform deletion.' };
  }
    
  try {
    // Use a transaction to delete the user's data and profile atomically.
    const userRef = adminDb.collection('users').doc(uid);
    const charactersQuery = adminDb.collection('characters').where('userId', '==', uid);
    
    await adminDb.runTransaction(async (transaction) => {
      // Delete all characters created by the user
      const charactersSnapshot = await transaction.get(charactersQuery);
      charactersSnapshot.forEach(doc => {
        transaction.delete(doc.ref);
      });
      // Delete the user's profile document
      transaction.delete(userRef);
    });
    
    // Delete the user from Firebase Authentication
    await adminAuth.deleteUser(uid);
    
    revalidatePath('/'); // Revalidate any pages that might show user data
    return { success: true, message: 'Your account has been permanently deleted.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete your account. Please try again.';
    return { success: false, message };
  }
}
