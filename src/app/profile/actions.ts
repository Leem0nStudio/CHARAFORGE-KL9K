
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
    await getAuth(admin).updateUser(uid, { displayName });

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
    
    try {
        const userRef = adminDb.collection('users').doc(uid);
        await userRef.set({ preferences: validatedFields.data }, { merge: true });

        revalidatePath('/profile');
        return { success: true, message: 'Preferences updated successfully.' };
    } catch (error) {
        console.error('Error updating user preferences:', error);
        return { success: false, message: 'Failed to save preferences. Please try again.' };
    }
}


export async function deleteUserAccount(): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();

  try {
    if(adminDb) {
      await adminDb.collection('users').doc(uid).delete();
      const charactersSnapshot = await adminDb.collection('characters').where('userId', '==', uid).get();
      const batch = adminDb.batch();
      charactersSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    
    await getAuth(admin).deleteUser(uid);
    
    cookies().set('firebaseIdToken', '', { maxAge: 0 });

    revalidatePath('/');
    return { success: true, message: 'Your account has been permanently deleted.' };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { success: false, message: 'Failed to delete your account. Please try again.' };
  }
}
