
'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserProfile } from '@/types/user';
import { verifyIsAdmin } from '@/lib/auth/server';

// A type for the sanitized user data we send to the client.
export type SanitizedUser = Pick<UserProfile, 'uid' | 'email'> & {
    disabled: boolean; // Supabase users have a ban_duration, we can simplify to a boolean
    isAdmin: boolean;
};

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

/**
 * Searches for users by email address.
 * Only callable by an authenticated admin.
 * @param emailQuery The email address to search for.
 * @returns A list of sanitized user objects.
 */
export async function searchUsers(emailQuery: string): Promise<SanitizedUser[]> {
    await verifyIsAdmin();
    const supabase = getSupabaseServerClient();

    if (!emailQuery) {
        return [];
    }

    try {
        // Supabase admin client can be used to search users by email
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ email: emailQuery });
        
        if (error) throw error;
        if (users.length === 0) return [];

        return users.map(user => ({
            uid: user.id,
            email: user.email,
            disabled: !!user.banned_until && new Date(user.banned_until) > new Date(),
            isAdmin: user.app_metadata?.role === 'admin',
        }));
    } catch (error: any) {
        console.error('Error searching for user:', error);
        throw new Error('An error occurred while searching for users.');
    }
}

/**
 * Grants admin privileges to a user.
 * Only callable by an authenticated admin.
 * @param uid The UID of the user to grant admin privileges to.
 */
export async function grantAdminRole(uid: string): Promise<ActionResponse> {
    await verifyIsAdmin();
    const supabase = getSupabaseServerClient();
    try {
        const { error: authError } = await supabase.auth.admin.updateUserById(uid, { app_metadata: { role: 'admin' } });
        if (authError) throw authError;

        const { error: dbError } = await supabase.from('users').update({ role: 'admin' }).eq('id', uid);
        if (dbError) throw dbError;
        
        revalidatePath('/admin/users');
        return { success: true, message: 'Admin role granted successfully.' };
    } catch (error: any) {
        return { success: false, message: 'Failed to grant admin role.', error: error.message };
    }
}

/**
 * Revokes admin privileges from a user.
 * Only callable by an authenticated admin.
 * @param uid The UID of the user to revoke admin privileges from.
 */
export async function revokeAdminRole(uid: string): Promise<ActionResponse> {
    await verifyIsAdmin();
    const supabase = getSupabaseServerClient();
    try {
        const { error: authError } = await supabase.auth.admin.updateUserById(uid, { app_metadata: { role: 'user' } });
        if (authError) throw authError;

        const { error: dbError } = await supabase.from('users').update({ role: 'user' }).eq('id', uid);
        if (dbError) throw dbError;
        
        revalidatePath('/admin/users');
        return { success: true, message: 'Admin role revoked successfully.' };
    } catch (error: any) {
        return { success: false, message: 'Failed to revoke admin role.', error: error.message };
    }
}

export async function getDashboardStats(): Promise<{ totalUsers: number; totalCharacters: number; totalDataPacks: number, publicCharacters: number, privateCharacters: number, totalModels: number, totalLoras: number }> {
    await verifyIsAdmin();
    const supabase = getSupabaseServerClient();
    try {
        const { count: totalUsers, error: usersError } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (usersError) throw usersError;

        const { count: totalCharacters, error: charsError } = await supabase.from('characters').select('*', { count: 'exact', head: true });
        if (charsError) throw charsError;

        const { count: totalDataPacks, error: packsError } = await supabase.from('datapacks').select('*', { count: 'exact', head: true });
        if (packsError) throw packsError;
        
        const { count: publicCharacters, error: publicCharsError } = await supabase.from('characters').select('*', { count: 'exact', head: true }).eq('meta_details->>status', 'public');
        if(publicCharsError) throw publicCharsError;
        
        const { count: totalModels, error: modelsError } = await supabase.from('ai_models').select('*', { count: 'exact', head: true }).eq('type', 'model');
        if(modelsError) throw modelsError;

        const { count: totalLoras, error: lorasError } = await supabase.from('ai_models').select('*', { count: 'exact', head: true }).eq('type', 'lora');
        if(lorasError) throw lorasError;

        return {
            totalUsers: totalUsers || 0,
            totalCharacters: totalCharacters || 0,
            totalDataPacks: totalDataPacks || 0,
            publicCharacters: publicCharacters || 0,
            privateCharacters: (totalCharacters || 0) - (publicCharacters || 0),
            totalModels: totalModels || 0,
            totalLoras: totalLoras || 0,
        };
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        // Return default values on error to avoid breaking the dashboard
        return { totalUsers: 0, totalCharacters: 0, totalDataPacks: 0, publicCharacters: 0, privateCharacters: 0, totalModels: 0, totalLoras: 0 };
    }
}
