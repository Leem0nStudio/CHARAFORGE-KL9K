
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
    throw new Error('User is not authenticated.');
  }

  if (!admin) {
    throw new Error('Auth service is unavailable.');
  }

  try {
    const auth = getAuth(admin);
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    throw new Error('Invalid authentication session.');
  }
}

const UpdateProfileSchema = z.object({
  displayName: z.string().min(3, 'Display name must be at least 3 characters.').max(30, 'Display name cannot exceed 30 characters.'),
});

export async function updateUserProfile(formData: FormData): Promise<ActionResponse> {
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
    const auth = getAuth(admin);
    await auth.updateUser(uid, { displayName });

    if(adminDb) {
      const userRef = adminDb.collection('users').doc(uid);
      await userRef.update({ displayName });
    }

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
    const auth = getAuth(admin); // We know admin is available

    if(adminDb) {
      const userRef = adminDb.collection('users').doc(uid);
      const charactersQuery = adminDb.collection('characters').where('userId', '==', uid);
      
      await adminDb.runTransaction(async (transaction) => {
        const charactersSnapshot = await transaction.get(charactersQuery);
        charactersSnapshot.forEach(doc => {
          transaction.delete(doc.ref);
        });
        transaction.delete(userRef);
      });
    }
    
    await auth.deleteUser(uid);
    
    cookies().set('firebaseIdToken', '', { maxAge: 0, path: '/' });

    revalidatePath('/');
    return { success: true, message: 'Your account has been permanently deleted.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete your account. Please try again.';
    return { success: false, message };
  }
}
