'use server';

import { revalidatePath } from 'next/cache';
import { admin, adminDb } from '@/lib/firebase/server';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

type ActionResponse = {
  success: boolean;
  message: string;
}

async function verifyAndGetUid() {
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  if (!idToken) {
    throw new Error('User is not authenticated. No token found.');
  }
  if (!admin) {
    throw new Error('The authentication service is currently unavailable.');
  }
  try {
    const decodedToken = await getAuth(admin).verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying token in server action:', error);
    throw new Error('Invalid authentication token.');
  }
}

// Schema for updating user profile
const UpdateProfileSchema = z.object({
  displayName: z.string().min(3, 'Display name must be at least 3 characters.').max(30, 'Display name cannot exceed 30 characters.'),
});

export async function updateUserProfile(formData: FormData): Promise<ActionResponse> {
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

  try {
    // Update Firebase Auth
    await getAuth(admin).updateUser(uid, { displayName });

    // Update Firestore
    if(adminDb) {
      const userRef = adminDb.collection('users').doc(uid);
      await userRef.update({ displayName });
    }

    revalidatePath('/profile');
    return { success: true, message: 'Profile updated successfully!' };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, message: 'Failed to update profile. Please try again.' };
  }
}

// Note: Changing password requires re-authentication on the client, which is complex with server actions.
// This is a placeholder for a more complete implementation that would handle client-side re-authentication.
export async function updateUserPassword(password: string): Promise<ActionResponse> {
     const uid = await verifyAndGetUid();
     // This is a placeholder. A real implementation needs re-authentication flow.
     console.log(`Password change requested for user ${uid} to ${password}. Skipping due to complexity.`);
     return { success: false, message: "Password change is not yet implemented."};
}


export async function deleteUserAccount(): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();

  try {
     // Delete from Firestore (optional, but good practice)
    if(adminDb) {
      await adminDb.collection('users').doc(uid).delete();
      // Optional: clean up user's content, e.g., characters
      const charactersSnapshot = await adminDb.collection('characters').where('userId', '==', uid).get();
      const batch = adminDb.batch();
      charactersSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    
    // Delete from Firebase Auth
    await getAuth(admin).deleteUser(uid);
    
    // Clear the cookie by setting it to expire immediately
    cookies().set('firebaseIdToken', '', { maxAge: 0 });

    revalidatePath('/');
    return { success: true, message: 'Your account has been permanently deleted.' };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { success: false, message: 'Failed to delete your account. Please try again.' };
  }
}