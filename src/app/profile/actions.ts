

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
async function verifyAndGetUid(): Promise<string> {
  // Ensure Firebase Admin services are available before proceeding.
  if(!adminAuth) {
    throw new Error('Authentication service is unavailable on the server.');
  }

  // Retrieve the session cookie.
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  // If no token is found, the user is not authenticated.
  if (!idToken) {
    throw new Error('User session not found. Please log in again.');
  }

  // Verify the token using the Firebase Admin SDK.
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    // Handle cases where the token is invalid or expired.
    throw new Error('Invalid or expired user session. Please log in again.');
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
  try {
    const uid = await verifyAndGetUid();
    
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
    try {
        const uid = await verifyAndGetUid();

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
    
    if (!adminAuth || !adminDb) {
        return { success: false, message: 'Server services are unavailable to perform deletion.' };
    }
    
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
