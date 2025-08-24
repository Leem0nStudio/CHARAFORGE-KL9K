

'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { Character, TimelineEvent, RpgAttributes } from '@/types/character';
import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { uploadToStorage } from '@/services/storage';
import { UpdateCharacterSchema, SaveCharacterInputSchema, type SaveCharacterInput } from '@/types/character';
import { generateCharacterSheet, getNextLifeState, lifeEventTransitions } from '@/ai/flows/character-sheet/flow';
import type { LifeEventState } from '@/ai/flows/character-sheet/flow';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateDialogueFlow } from '@/ai/flows/dialogue-generation/flow';

// #region Helper Functions for Stat Generation
// This logic is now part of the server action to be used when a character's archetype changes.
type Stat = keyof RpgAttributes['stats'];
const STAT_KEYS: Stat[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const archetypeStatPriorities: Record<string, [Stat, Stat] | [Stat]> = {
    Artificer: ['intelligence', 'constitution'],
    Barbarian: ['strength', 'constitution'],
    Bard: ['charisma', 'dexterity'],
    Cleric: ['wisdom', 'constitution'],
    Druid: ['wisdom', 'constitution'],
    Fighter: ['strength', 'dexterity'],
    Monk: ['dexterity', 'wisdom'],
    Paladin: ['strength', 'charisma'],
    Ranger: ['dexterity', 'wisdom'],
    Rogue: ['dexterity', 'charisma'],
    Sorcerer: ['charisma', 'constitution'],
    Warlock: ['charisma', 'constitution'],
    Wizard: ['intelligence', 'constitution'],
};

function roll4d6DropLowest(): number {
    const rolls = Array(4).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b);
    rolls.shift();
    return rolls.reduce((sum, roll) => sum + roll, 0);
}

function generateBalancedStats(archetype: string): RpgAttributes['stats'] {
    const statPool = Array(6).fill(0).map(() => roll4d6DropLowest());
    statPool.sort((a, b) => b - a);

    const priorities = archetypeStatPriorities[archetype as keyof typeof archetypeStatPriorities] || [];
    const remainingStats = STAT_KEYS.filter(stat => !priorities.includes(stat));

    const finalStats: Partial<RpgAttributes['stats']> = {};

    priorities.forEach((priorityStat) => {
        const value = statPool.shift();
        if (value !== undefined) finalStats[priorityStat] = value;
    });

    remainingStats.forEach(stat => {
        const value = statPool.shift();
        if (value !== undefined) finalStats[stat] = value;
    });

    return finalStats as RpgAttributes['stats'];
}

function calculateRarity(stats: RpgAttributes['stats']): Character['core']['rarity'] {
    const totalScore = Object.values(stats).reduce((sum, value) => sum + value, 0);
    if (totalScore >= 90) return 5;
    if (totalScore >= 80) return 4;
    if (totalScore >= 65) return 3;
    if (totalScore >= 50) return 2;
    return 1;
}
// #endregion


type ActionResponse = {
    success: boolean;
    message: string;
    characterId?: string;
    skills?: RpgAttributes['skills'];
    error?: string;
};

export async function deleteCharacter(characterId: string) {
  const uid = await verifyAndGetUid();
  if (!adminDb) {
    throw new Error('Database service is unavailable.');
  }
  if (!characterId) {
    throw new Error('Character ID is required for deletion.');
  }

  const characterRef = adminDb.collection('characters').doc(characterId);
  
  try {
    const characterDoc = await characterRef.get();
    const characterData = characterDoc.data();

    if (!characterDoc.exists || characterData?.meta?.userId !== uid) {
      throw new Error('Permission denied or character not found.');
    }

    await characterRef.delete();
    revalidatePath('/characters');
    return { success: true };
  } catch (error) {
    console.error("Error deleting character:", error);
    throw new Error(error instanceof Error ? error.message : 'Could not delete character due to a server error.');
  }
}

export async function updateCharacterStatus(
  characterId: string, 
  status: 'private' | 'public',
  isNsfw?: boolean,
): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();
  if (!adminDb) {
      return { success: false, message: 'Database service is unavailable.' };
  }
  
  try {
    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();
    const characterData = characterDoc.data();

    if (!characterDoc.exists || characterData?.meta?.userId !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }
    
    const updates: { 'meta.status': 'private' | 'public'; 'meta.isNsfw'?: boolean } = {
        'meta.status': status
    };
    if (typeof isNsfw === 'boolean') {
        updates['meta.isNsfw'] = isNsfw;
    }

    await characterRef.update(updates);
    
    if (status === 'public' && characterData.meta.dataPackId && characterData.visuals.imageUrl) {
        const dataPackRef = adminDb.collection('datapacks').doc(characterData.meta.dataPackId);
        await dataPackRef.update({
            coverImageUrl: characterData.visuals.imageUrl,
        });
        revalidatePath(`/datapacks/${characterData.meta.dataPackId}`);
    }

    revalidatePath('/characters');
    revalidatePath('/'); 
    revalidatePath(`/characters/${characterId}/edit`);

    return { success: true, message: `Character status updated.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update character status.';
    return { success: false, message };
  }
}

export async function updateCharacterDataPackSharing(characterId: string, isShared: boolean): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();
  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }

  try {
    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();
    const characterData = characterDoc.data();

    if (!characterDoc.exists || characterData?.meta?.userId !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }
    
    if (!characterData.meta.dataPackId) {
        return { success: false, message: 'This character was not created with a DataPack.' };
    }

    const updates: { 'settings.isSharedToDataPack': boolean; 'meta.status'?: 'public' } = { 
        'settings.isSharedToDataPack': isShared 
    };
    if (isShared) {
        updates['meta.status'] = 'public';
        if (characterData.visuals.imageUrl) {
            const dataPackRef = adminDb.collection('datapacks').doc(characterData.meta.dataPackId);
            await dataPackRef.update({
                coverImageUrl: characterData.visuals.imageUrl,
            });
        }
    }
    await characterRef.update(updates);
    
    revalidatePath('/characters');
    revalidatePath(`/datapacks/${characterData.meta.dataPackId}`);
    revalidatePath('/');
    revalidatePath(`/characters/${characterId}/edit`);
    
    return { success: true, message: `Sharing status for DataPack gallery updated.` };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update sharing status.';
    return { success: false, message };
  }
}

export async function updateCharacter(
    characterId: string, 
    data: Partial<Character['core']>
): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();
  if (!adminDb) {
      return { success: false, message: 'Database service is unavailable.' };
  }
  
  try {
    const validatedFields = UpdateCharacterSchema.safeParse(data);

    if (!validatedFields.success) {
        const firstError = validatedFields.error.errors[0];
        return {
            success: false,
            message: `Invalid input for ${firstError.path.join('.')}: ${firstError.message}`,
        };
    }
    
    const { name, biography, alignment, archetype, equipment, physicalDescription, birthYear, weaknesses } = validatedFields.data;
    const characterRef = adminDb.collection('characters').doc(characterId);
    
    const characterDoc = await characterRef.get();
    const existingData = characterDoc.data() as Character;

    if (!characterDoc.exists || existingData?.meta?.userId !== uid) {
        return { success: false, message: 'Permission denied or character not found.' };
    }
    
    const updates: { [key: string]: any } = {
      'core.name': name,
      'core.biography': biography,
      'core.alignment': alignment,
      'core.archetype': archetype || null,
      'core.equipment': equipment || null,
      'core.physicalDescription': physicalDescription || null,
      'core.birthYear': birthYear || null,
      'core.weaknesses': weaknesses || null,
    };
    
    // Check if the archetype has changed.
    const hasArchetypeChanged = existingData.core.archetype !== (archetype || null);
    
    if (hasArchetypeChanged) {
        // If the archetype is changed, reset stats and skills so the user must re-roll.
        updates['rpg.stats'] = { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 };
        updates['core.rarity'] = 1;
        updates['rpg.isPlayable'] = !!archetype;
        updates['rpg.skills'] = [];
        updates['rpg.skillsStatus'] = 'pending';
        updates['rpg.statsStatus'] = 'pending';
    }
  
    await characterRef.update(updates);

    revalidatePath(`/characters/${characterId}/edit`);
    revalidatePath('/characters');
    
    return { success: true, message: 'Character details updated successfully!' };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update character due to a server error.';
    return { success: false, message };
  }
}

export async function saveCharacter(input: SaveCharacterInput) {
  const validation = SaveCharacterInputSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    throw new Error(`Invalid input for ${firstError.path.join('.')}: ${firstError.message}`);
  }
  const { 
      name, biography, imageUrl: imageDataUri, dataPackId,
      archetype, equipment, physicalDescription, textEngine, imageEngine, wizardData, originalPrompt, rarity
  } = validation.data;
  
  const userId = await verifyAndGetUid();
  if (!adminDb) {
    throw new Error('Database service is not available. Please try again later.');
  }
  
  try {
    const characterRef = adminDb.collection('characters').doc();
    
    const destinationPath = `raw-uploads/${userId}/${characterRef.id}/${uuidv4()}.png`;
    const storageUrl = await uploadToStorage(imageDataUri, destinationPath);

    const userRef = adminDb.collection('users').doc(userId);
    
    const isPlayable = !!archetype;
    
    await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data();

        const version = 1;
        const versionName = `v.${version}`;
        const initialVersion = { id: characterRef.id, name: versionName, version: version };
        
        const wizardTags = wizardData ? Object.values(wizardData).map(tag => typeof tag === 'string' ? tag.trim().toLowerCase().replace(/ /g, '_') : '').filter(Boolean) : [];
        const uniqueTags = [...new Set([...wizardTags].filter(Boolean))];

        const characterData: Omit<Character, 'id'> = {
            core: {
                name,
                biography,
                archetype: archetype || null,
                alignment: 'True Neutral',
                equipment: equipment || null,
                physicalDescription: physicalDescription || null,
                birthYear: 'Year 1',
                timeline: [],
                tags: uniqueTags,
                rarity: 1, // Start at rarity 1, will be updated after dice roll
            },
            visuals: {
                imageUrl: storageUrl,
                gallery: [storageUrl],
                showcaseImageUrl: null,
                isShowcaseProcessed: false,
                showcaseProcessingStatus: 'idle',
            },
            meta: {
                userId,
                status: 'private',
                createdAt: FieldValue.serverTimestamp() as any, // Cast for transaction
                isNsfw: false,
                dataPackId: dataPackId || null,
                likes: 0,
            },
            lineage: {
                version: version,
                versionName: versionName,
                baseCharacterId: characterRef.id,
                versions: [initialVersion],
                branchedFromId: null,
                originalAuthorId: null,
            },
            settings: {
                isSharedToDataPack: false,
                branchingPermissions: 'private',
            },
            generation: {
                textEngine: textEngine,
                imageEngine: imageEngine,
                wizardData: wizardData,
                originalPrompt: originalPrompt,
            },
            rpg: {
                isPlayable: isPlayable,
                level: 1,
                experience: 0,
                willpower: { current: 10, max: 10 },
                skills: [],
                statsStatus: isPlayable ? 'pending' : 'complete',
                skillsStatus: 'pending',
                stats: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
            }
        };

        transaction.set(characterRef, characterData);
        
        const userStats = userData?.stats || {};
        const isFirstCharacter = (userStats.charactersCreated || 0) === 0;

        const updates: { [key: string]: any } = {
            'stats.charactersCreated': FieldValue.increment(1)
        };

        if (isFirstCharacter) {
            updates['stats.unlockedAchievements'] = FieldValue.arrayUnion('first_character');
            updates['stats.points'] = FieldValue.increment(10); // Points for first character
        }

        if (!userDoc.exists) {
            transaction.set(userRef, { stats: updates }, { merge: true });
        } else {
            transaction.update(userRef, updates);
        }
    });

    revalidatePath('/characters');
    revalidatePath(`/characters/${characterRef.id}/edit`);

    return { success: true, characterId: characterRef.id };
  } catch (error) {
    console.error('Error saving character:', error);
    const errorMessage = error instanceof Error ? error.message : 'Could not save character due to a server error.';
    throw new Error(errorMessage);
  }
}

export async function updateCharacterTimeline(characterId: string, timeline: TimelineEvent[]): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    if (!adminDb) {
        return { success: false, message: 'Database service unavailable.' };
    }
    
    try {
        const characterRef = adminDb.collection('characters').doc(characterId);
        const characterDoc = await characterRef.get();
        if (!characterDoc.exists || characterDoc.data()?.meta?.userId !== uid) {
            return { success: false, message: 'Permission denied or character not found.' };
        }
        
        await characterRef.update({ 'core.timeline': timeline });
        
        revalidatePath(`/characters/${characterId}/edit`);
        
        return { success: true, message: 'Timeline updated successfully!' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not update timeline.';
        return { success: false, message };
    }
}


export async function updateCharacterBranchingPermissions(characterId: string, permissions: 'private' | 'public'): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();
  if (!adminDb) {
    return { success: false, message: 'Database service is unavailable.' };
  }

  try {
    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();
    const characterData = characterDoc.data();

    if (!characterDoc.exists || characterData?.meta?.userId !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }

    if (permissions === 'public' && characterData?.meta?.status !== 'public') {
        return { success: false, message: 'Character must be public to allow branching.' };
    }

    await characterRef.update({ 'settings.branchingPermissions': permissions });

    revalidatePath(`/characters/${characterId}/edit`);
    return { success: true, message: 'Branching permissions updated.' };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update permissions.';
    return { success: false, message };
  }
}

export async function addCharacterExperience(characterId: string, xp: number): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
    }

    try {
        const characterRef = adminDb.collection('characters').doc(characterId);
        const characterDoc = await characterRef.get();
        if (!characterDoc.exists || characterDoc.data()?.meta.userId !== uid) {
            return { success: false, message: 'Permission denied or character not found.' };
        }
        
        await characterRef.update({
            'rpg.experience': FieldValue.increment(xp)
        });
        
        revalidatePath(`/showcase/${characterId}`);
        
        return { success: true, message: `${xp} XP gained!` };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not add experience.';
        return { success: false, message };
    }
}

// New action to suggest the next timeline event
export async function suggestNextTimelineEvent(characterId: string): Promise<ActionResponse & { data?: TimelineEvent }> {
    const uid = await verifyAndGetUid();
    if (!adminDb) {
        return { success: false, message: 'Database service unavailable.' };
    }

    try {
        const characterRef = adminDb.collection('characters').doc(characterId);
        const doc = await characterRef.get();
        if (!doc.exists || doc.data()?.meta.userId !== uid) {
            return { success: false, message: 'Permission denied or character not found.' };
        }

        const character = doc.data() as Character;
        const lastEvent = character.core.timeline?.[character.core.timeline.length - 1];
        
        // This is a simplified way to map a title to a state. A more robust solution might use AI.
        const findStateFromTitle = (title: string): LifeEventState | null => {
            const lowerTitle = title.toLowerCase();
            for (const state in lifeEventTransitions) {
                if (lowerTitle.includes(state.toLowerCase().replace(/\s/g, ''))) {
                    return state as LifeEventState;
                }
            }
            if (lowerTitle.includes('born') || lowerTitle.includes('childhood')) return 'Humble Beginnings';
            if (lowerTitle.includes('victory') || lowerTitle.includes('succeeded')) return 'Great Victory';
            if (lowerTitle.includes('loss') || lowerTitle.includes('failed')) return 'Devastating Loss';
            return null;
        }

        const lastState = lastEvent ? findStateFromTitle(lastEvent.title) : null;
        const nextState = await getNextLifeState(lastState || 'Humble Beginnings');

        const prompt = `You are a creative writer. Based on the character below and a suggested life event type, generate a concise, compelling timeline event.

Character Name: ${character.core.name}
Character Archetype: ${character.core.archetype}
Character Biography: ${character.core.biography}

Last Timeline Event: ${lastEvent ? `${lastEvent.title} (${lastEvent.date})` : 'None'}

Suggested Next Event Type: "${nextState}"

Generate a JSON object with three fields: "date" (a creative date, like "A Year Later" or "Age 30"), "title" (a short, dramatic title for the event), and "description" (a one-sentence summary of what happened).
`;
        
        const { output } = await ai.generate({
            model: 'googleai/gemini-1.5-flash-latest',
            prompt,
            output: {
                format: 'json',
                schema: z.object({
                    date: z.string(),
                    title: z.string(),
                    description: z.string(),
                })
            }
        });

        if (!output) {
            throw new Error('AI failed to generate a timeline event.');
        }

        const newEvent: TimelineEvent = {
            id: uuidv4(),
            ...output,
        };

        return { success: true, message: 'Event suggested!', data: newEvent };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to suggest an event.';
        return { success: false, message };
    }
}


export async function generateDialogue(characterId: string): Promise<ActionResponse & { dialogueLines?: string[] }> {
    const uid = await verifyAndGetUid();
    if (!adminDb) {
        return { success: false, message: 'Database service unavailable.' };
    }

    try {
        const characterRef = adminDb.collection('characters').doc(characterId);
        const doc = await characterRef.get();
        if (!doc.exists || doc.data()?.meta.userId !== uid) {
            return { success: false, message: 'Permission denied or character not found.' };
        }

        const character = doc.data() as Character;
        
        const result = await generateDialogueFlow({
            name: character.core.name,
            archetype: character.core.archetype || 'Adventurer',
            biography: character.core.biography,
        });

        if (!result.dialogueLines || result.dialogueLines.length === 0) {
            throw new Error('AI failed to generate any dialogue.');
        }

        return { success: true, message: 'Dialogue generated!', dialogueLines: result.dialogueLines };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate dialogue.';
        return { success: false, message };
    }
}

export async function rollForCharacterStats(characterId: string): Promise<ActionResponse & { newStats?: RpgAttributes['stats'] }> {
    const uid = await verifyAndGetUid();
    if (!adminDb) {
        return { success: false, message: "Database service unavailable." };
    }

    try {
        const characterRef = adminDb.collection('characters').doc(characterId);
        const characterDoc = await characterRef.get();
        const characterData = characterDoc.data();

        if (!characterDoc.exists || characterData?.meta.userId !== uid) {
            return { success: false, message: "Permission denied or character not found." };
        }
        if (!characterData.core.archetype) {
            return { success: false, message: "Character must have an Archetype to roll for stats." };
        }

        const newStats = generateBalancedStats(characterData.core.archetype);
        const newRarity = calculateRarity(newStats);

        await characterRef.update({
            'rpg.stats': newStats,
            'core.rarity': newRarity,
            'rpg.statsStatus': 'complete',
        });
        
        revalidatePath(`/characters/${characterId}/edit`);

        return { success: true, message: "Stats rolled successfully!", newStats };

    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to roll for stats.";
        return { success: false, message };
    }
}
