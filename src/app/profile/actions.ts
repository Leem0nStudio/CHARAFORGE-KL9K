
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { DataPack } from '@/types/datapack';

export type ActionResponse = {
  success: boolean;
  message: string;
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

    if (!adminDb || !adminAuth) {
      throw new Error("Server services are not available.");
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
                createdAt: data.createdAt.toDate(),
            } as DataPack;
        });

    return installedPacks;

  } catch (error) {
    console.error("Error fetching installed datapacks:", error);
    return [];
  }
}
