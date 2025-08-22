

'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { Character, TimelineEvent, RpgAttributes } from '@/types/character';
import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { uploadToStorage } from '@/services/storage';
import { UpdateCharacterSchema, SaveCharacterInputSchema, type SaveCharacterInput } from '@/types/character';
import { rpgArchetypes } from '@/lib/app-config';

// #region New "Intelligent Dice Roll" and Rarity Calculation Logic

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

function generateStats(archetype: string): RpgAttributes['stats'] {
    const statPool = Array(6).fill(0).map(() => roll4d6DropLowest());
    statPool.sort((a, b) => b - a);

    const priorities = archetypeStatPriorities[archetype as keyof typeof archetypeStatPriorities] || [];
    const remainingStats = STAT_KEYS.filter(stat => !priorities.includes(stat));

    const finalStats: Partial<RpgAttributes['stats']> = {};

    priorities.forEach((priorityStat) => {
        finalStats[priorityStat] = statPool.shift();
    });

    remainingStats.forEach(stat => {
        finalStats[stat] = statPool.shift();
    });

    return finalStats as RpgAttributes['stats'];
}

function calculateRarity(stats: RpgAttributes['stats']): Character['core']['rarity'] {
    const totalScore = Object.values(stats).reduce((sum, value) => sum + value, 0);

    if (totalScore >= 90) return 5; // Legendary (Exceptional Rolls)
    if (totalScore >= 80) return 4; // Epic (Very High Rolls)
    if (totalScore >= 65) return 3; // Rare (Good Rolls)
    if (totalScore >= 50) return 2; // Uncommon (Average Rolls)
    return 1; // Common (Low Rolls)
}

// #endregion


type ActionResponse = {
    success: boolean;
    message: string;
    characterId?: string;
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
    
    const { name, biography, alignment, archetype, equipment, physicalDescription } = validatedFields.data;
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
    };
    
    updates['rpg.isPlayable'] = !!archetype;
    
    const hasClassChanged = existingData.core.archetype !== (archetype || null);
    
    if (hasClassChanged) {
        updates['rpg.statsStatus'] = 'pending';
        updates['rpg.skillsStatus'] = 'pending';
        updates['rpg.skills'] = [];
        // If the class changes, we need to regenerate stats and thus recalculate rarity.
        if (archetype) {
            const newStats = generateStats(archetype);
            updates['rpg.stats'] = newStats;
            updates['core.rarity'] = calculateRarity(newStats);
        } else {
             updates['rpg.stats'] = { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 };
             updates['core.rarity'] = 1;
        }
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
      name, biography, imageUrl: imageDataUri, dataPackId, tags, 
      archetype, equipment, physicalDescription, textEngine, imageEngine, wizardData, originalPrompt,
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
    
    // Generate RPG stats and rarity
    const stats = archetype ? generateStats(archetype) : { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 };
    const rarity = archetype ? calculateRarity(stats) : 1;
    const isPlayable = !!archetype;


    await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data();

        const version = 1;
        const versionName = `v.${version}`;
        const initialVersion = { id: characterRef.id, name: versionName, version: version };
        
        const wizardTags = wizardData ? Object.values(wizardData).map(tag => tag.trim().toLowerCase().replace(/ /g, '_')) : [];
        const manualTags = tags ? tags.split(',').map(tag => tag.trim().toLowerCase().replace(/ /g, '_')) : [];
        const uniqueTags = [...new Set([...wizardTags, ...manualTags].filter(Boolean))];

        const characterData: Omit<Character, 'id'> = {
            core: {
                name,
                biography,
                archetype: archetype || null,
                alignment: 'True Neutral',
                equipment: equipment || null,
                physicalDescription: physicalDescription || null,
                timeline: [],
                tags: uniqueTags,
                rarity: rarity,
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
                skills: [],
                statsStatus: isPlayable ? 'pending' : 'complete',
                skillsStatus: isPlayable ? 'pending' : 'complete',
                stats: stats,
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
