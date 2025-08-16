
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { AiModel } from '@/types/ai-model';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

async function getCivitaiModelVersionInfo(versionId: string): Promise<any> {
    const url = `https://civitai.com/api/v1/model-versions/${versionId}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Failed to fetch model version info from Civitai. Status: ${response.status}`);
    }
    return response.json();
}
