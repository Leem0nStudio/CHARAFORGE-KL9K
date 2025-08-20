

'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { StoryCast } from '@/types/story';
import { generateStory as generateStoryFlow } from '@/ai/flows/story-generation/flow';
import type { Character } from '@/types/character';

type ActionResponse<T = null> = {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
};

// This now includes the full character sheet for a richer context.
type CharacterDetailsForAI = Pick<Character['core'], 'name' | 'biography' | 'alignment' | 'timeline' | 'archetype' | 'equipment' | 'physicalDescription'>;


export async function getUserCasts(): Promise<StoryCast[]> {
    const uid = await verifyAndGetUid();
     if (!adminDb) {
        return [];
    }
    const castsRef = adminDb.collection('storyCasts');
    const q = castsRef.where('userId', '==', uid).orderBy('updatedAt', 'desc');
    const snapshot = await q.get();

    if (snapshot.empty) {
        return [];
    }
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt as any;
        const updatedAt = data.updatedAt as any;
        return {
            ...data,
            id: doc.id,
            createdAt: createdAt?.toMillis ? createdAt.toMillis() : new Date(createdAt).getTime(),
            updatedAt: updatedAt?.toMillis ? updatedAt.toMillis() : new Date(updatedAt).getTime(),
        } as StoryCast;
    });
}


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

        // Refetch the document to get the server-generated timestamps
        const createdDoc = await newCastRef.get();
        if (!createdDoc.exists) {
            throw new Error("Failed to retrieve the newly created cast.");
        }
        const createdData = createdDoc.data() as any;

        revalidatePath('/lore-forge'); 

        return {
            success: true,
            message: 'New story cast created.',
            data: {
                id: createdDoc.id,
                ...createdData,
                 createdAt: createdData.createdAt.toMillis(),
                 updatedAt: createdData.updatedAt.toMillis(),
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
    
    revalidatePath('/lore-forge');
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
        // Fetch full character details for the cast
        const characterRefs = castData.characterIds.map(id => adminDb.collection('characters').doc(id));
        const characterDocs = await adminDb.getAll(...characterRefs);
        
        const charactersForAI: CharacterDetailsForAI[] = characterDocs.map(doc => {
            if (!doc.exists) {
                // This case should be handled gracefully, maybe the character was deleted
                return null;
            }
            const char = doc.data() as Character;
            return {
                name: char.core.name,
                biography: char.core.biography,
                alignment: char.core.alignment || 'True Neutral',
                timeline: char.core.timeline || [],
                archetype: char.core.archetype || undefined,
                equipment: char.core.equipment || undefined,
                physicalDescription: char.core.physicalDescription || char.generation?.originalPrompt || undefined,
            };
        }).filter((c): c is CharacterDetailsForAI => c !== null);

        if (charactersForAI.length !== castData.characterIds.length) {
             console.warn("Some characters in the cast could not be found and were omitted from the story generation.");
        }
        
        if (charactersForAI.length === 0) {
            return { success: false, message: 'None of the characters in the cast could be found.' };
        }


        // Call the AI flow
        const storyResult = await generateStoryFlow({
            prompt: storyPrompt,
            cast: charactersForAI,
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
