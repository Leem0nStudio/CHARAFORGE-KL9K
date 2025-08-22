
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import { getFunctions } from 'firebase-admin/functions';
import type { Character } from '@/types/character';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

const CharacterIdSchema = z.string().min(1, 'A character ID is required.');


/**
 * A robust server action to *request* the generation of RPG attributes.
 * It sets the status to 'pending' and enqueues a Cloud Task to trigger the
 * actual Genkit flow execution in the background. This is the correct, reliable
 * way to handle long-running asynchronous tasks without server timeouts.
 * @param characterId The ID of the character to generate attributes for.
 * @returns A promise that resolves to an ActionResponse.
 */
export async function generateAllRpgAttributes(characterId: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const validation = CharacterIdSchema.safeParse(characterId);
    if (!validation.success) {
        return { success: false, message: 'Invalid character ID.' };
    }

    const charRef = adminDb.collection('characters').doc(characterId);

    try {
        const charDoc = await charRef.get();
        if (!charDoc.exists) {
            throw new Error('Character not found.');
        }
        const character = charDoc.data() as Character;
        if (character.meta.userId !== uid) {
            throw new Error('Permission denied.');
        }
        if (!character.core.archetype) {
            throw new Error('Character must have an Archetype (class) assigned to generate attributes.');
        }

        // Step 1: Set status to pending to update the UI immediately
        await charRef.update({ 
            'rpg.statsStatus': 'pending',
            'rpg.skillsStatus': 'pending',
        });
        revalidatePath(`/characters/${characterId}/edit`);

        // Step 2: Enqueue a task for the background worker to process.
        // This is a reliable way to trigger the Genkit flow.
        const queue = getFunctions().taskQueue('triggerRpgGeneration');
        await queue.enqueue({ characterId });
        
        console.log(`Successfully enqueued RPG generation task for character ${characterId}`);

        return { success: true, message: 'Character attribute generation has been started.' };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
         await charRef.update({ 
            'rpg.statsStatus': 'failed',
            'rpg.skillsStatus': 'failed',
        }).catch(() => {});
        revalidatePath(`/characters/${characterId}/edit`);
        return { success: false, message, error: message };
    }
}
