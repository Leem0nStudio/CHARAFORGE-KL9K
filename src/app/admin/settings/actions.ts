
'use server';

import { revalidatePath } from 'next/cache';
import { verifyIsAdmin } from '@/lib/auth/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { uploadToStorage } from '@/services/storage';

export type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

const LOGO_PATH = 'app-assets/logo.png';

export async function updateLogo(_prevState: any, formData: FormData): Promise<ActionResponse> {
    await verifyIsAdmin();
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
        return { success: false, message: "Database service is not available." };
    }

    const logoFile = formData.get('logo') as File;
    if (!logoFile || logoFile.size === 0) {
        return { success: false, message: 'No file was uploaded.' };
    }
    if (logoFile.type !== 'image/png') {
        return { success: false, message: 'Invalid file type. Must be a PNG.' };
    }

    try {
        const buffer = Buffer.from(await logoFile.arrayBuffer());

        // Use the generic uploadToStorage service, which will handle Supabase.
        const publicUrl = await uploadToStorage(buffer, LOGO_PATH);

        // Upsert the logo URL into a new 'settings' table.
        const { error: dbError } = await supabase
            .from('settings')
            .upsert({ id: 'appDetails', logo_url: publicUrl }, { onConflict: 'id' });

        if (dbError) throw dbError;

        // Revalidate the entire site layout to reflect the new logo.
        revalidatePath('/', 'layout');

        return { success: true, message: 'Logo updated successfully!' };

    } catch(error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error("Update Logo Error:", message);
        return { success: false, message: 'Operation failed.', error: message };
    }
}
