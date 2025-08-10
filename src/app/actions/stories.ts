
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import { FieldValue } from 'firebase-admin/firestore';
import type { StoryCast } from '@/types/story';
import { generateStory as generateStoryFlow } from '@/ai/flows/generate-story';
import type { Character } from '@/types/character';

type ActionResponse<T = null> = {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
};

// Placeholder for full character details needed by the AI flow
type CharacterDetailsForAI = Pick<Character, 'name' | 'biography' | 'alignment'>;

export async function createStoryCast(data: { name: string; description: string }): Promise<ActionResponse<StoryCast>> {
    const uid = await verifyAndGetUid();
    if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
    }

    try {
        const newCastRef = adminDb.collection('storyCasts').doc();
        const newCast: Omit<StoryCast, 'id' | 'createdAt' | 'updatedAt'> = {
            userId: uid,
            name: data.name,
            description: data.description,
            characterIds: [],
        };
        
        await newCastRef.set({
            ...newCast,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        const createdDoc = await newCastRef.get();
        const createdData = createdDoc.data() as any;

        revalidatePath('/story-forge'); 

        return {
            success: true,
            message: 'New story cast created.',
            data: {
                id: createdDoc.id,
                ...createdData,
                 createdAt: createdData.createdAt.toDate(),
                 updatedAt: createdData.updatedAt.toDate(),
            } as StoryCast,
        };
    } catch(error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: 'Failed to create cast.', error: message };
    }
}

export async function updateStoryCastCharacters(castId: string, characterIds: string[]): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
    }

    const castRef = adminDb.collection('storyCasts').doc(castId);
    const castDoc = await castRef.get();

    if (!castDoc.exists || castDoc.data()?.userId !== uid) {
        return { success: false, message: 'Permission denied or cast not found.' };
    }

    await castRef.update({
        characterIds: characterIds,
        updatedAt: FieldValue.serverTimestamp(),
    });
    
    revalidatePath('/story-forge');
    return { success: true, message: 'Story cast updated.' };
}

export async function generateStory(castId: string, storyPrompt: string): Promise<ActionResponse<{ title: string; content: string }>> {
    const uid = await verifyAndGetUid();
    if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
    }
    
    const castRef = adminDb.collection('storyCasts').doc(castId);
    const castDoc = await castRef.get();

    if (!castDoc.exists || castDoc.data()?.userId !== uid) {
        return { success: false, message: 'Permission denied or cast not found.' };
    }

    const castData = castDoc.data() as StoryCast;
    if (castData.characterIds.length === 0) {
        return { success: false, message: 'The cast is empty. Add characters before generating a story.' };
    }

    try {
        // Fetch full character details
        const characterDocs = await adminDb.collection('characters').where('id', 'in', castData.characterIds).get();
        const characters = characterDocs.docs.map(doc => doc.data() as Character)
            .map(char => ({
                name: char.name,
                biography: char.biography,
                alignment: char.alignment || 'True Neutral', // Default alignment if not set
            }));

        // Call the AI flow
        const storyResult = await generateStoryFlow({
            prompt: storyPrompt,
            cast: characters,
        });

        // Optionally, save the generated story to Firestore
        // ... (logic to create a 'stories' document)

        return {
            success: true,
            message: 'Story generated successfully!',
            data: {
                title: storyResult.title,
                content: storyResult.story,
            }
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred while generating the story.';
        return { success: false, message, error: message };
    }
}
