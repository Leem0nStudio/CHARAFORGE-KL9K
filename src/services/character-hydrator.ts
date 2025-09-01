
/**
 * @fileoverview This service provides a centralized function for converting
 * database rows (both Firestore and Supabase) into a fully-typed `Character` object.
 * Using a single, shared "hydrator" function ensures that character data is
 * processed consistently across all parts of the application, preventing
 * discrepancies and making the system easier to maintain.
 */

import type { Character } from '@/types/character';
import { Timestamp, DocumentData } from 'firebase-admin/firestore';

/**
 * Converts a database row (Firestore or Supabase) into a fully-typed, serializable Character object.
 * This helper function ensures consistency across different read operations.
 * It handles both camelCase (from Firestore) and snake_case with JSONB (from Supabase).
 * @param docId The ID of the document.
 * @param data The raw data object from the database.
 * @returns A promise that resolves to a Character object.
 */
export async function toCharacterObject(docId: string, data: DocumentData): Promise<Character> {
    // Check if we're dealing with a Supabase row (with JSONB columns) or a Firestore doc
    const isSupabase = !!data.core_details; 

    const core = isSupabase ? data.core_details : data.core;
    const visuals = isSupabase ? data.visual_details : data.visuals;
    const meta = isSupabase ? data.meta_details : data.meta;
    const lineage = isSupabase ? data.lineage_details : data.lineage;
    const settings = isSupabase ? data.settings_details : data.settings;
    const generation = isSupabase ? data.generation_details : data.generation;
    const rpg = isSupabase ? data.rpg_details : data.rpg;
    
    const createdAtRaw = meta?.createdAt || data.created_at;
    const createdAt = createdAtRaw instanceof Timestamp 
        ? createdAtRaw.toDate() 
        : createdAtRaw ? new Date(createdAtRaw) : new Date();

    const finalCharacter = {
        id: docId,
        core: {
            name: core?.name || data.name || 'Unnamed',
            biography: core?.biography || data.biography || '',
            physicalDescription: core?.physicalDescription || data.physicalDescription || null,
            birthYear: core?.birthYear || data.birthYear || null,
            alignment: core?.alignment || data.alignment || 'True Neutral',
            archetype: core?.archetype || data.archetype || null,
            equipment: core?.equipment || data.equipment || [],
            timeline: core?.timeline || data.timeline || [],
            tags: core?.tags || data.tags || [],
            rarity: core?.rarity || data.rarity || 3,
            weaknesses: core?.weaknesses || data.weaknesses || '',
        },
        visuals: {
            imageUrl: visuals?.imageUrl || data.image_url || '',
            gallery: visuals?.gallery || [visuals?.imageUrl, data.image_url].filter(Boolean),
            showcaseImageUrl: visuals?.showcaseImageUrl || null,
            isShowcaseProcessed: visuals?.isShowcaseProcessed || false,
            showcaseProcessingStatus: visuals?.showcaseProcessingStatus || 'idle',
        },
        meta: {
            userId: meta?.userId || data.user_id || '',
            userName: meta?.userName || undefined, // Will be hydrated later
            status: meta?.status || 'private',
            isNsfw: meta?.isNsfw || false,
            dataPackId: meta?.dataPackId || null,
            dataPackName: meta?.dataPackName || null,
            createdAt: createdAt,
            likes: meta?.likes || 0,
        },
        lineage: {
            version: lineage?.version || 1,
            versionName: lineage?.versionName || 'v.1',
            baseCharacterId: lineage?.baseCharacterId || docId,
            versions: lineage?.versions || [{ id: docId, name: 'v.1', version: 1 }],
            branchedFromId: lineage?.branchedFromId || null,
            originalAuthorId: lineage?.originalAuthorId || null,
            originalAuthorName: lineage?.originalAuthorName || undefined, // Will be hydrated later
        },
        settings: {
            isSharedToDataPack: settings?.isSharedToDataPack || false,
            branchingPermissions: settings?.branchingPermissions || 'private',
        },
        generation: {
            textEngine: generation?.textEngine,
            imageEngine: generation?.imageEngine,
            wizardData: generation?.wizardData,
            originalPrompt: generation?.originalPrompt || core?.physicalDescription,
        },
        rpg: {
            isPlayable: rpg?.isPlayable ?? !!(core?.archetype || data.archetype),
            level: rpg?.level || 1,
            experience: rpg?.experience || 0,
            willpower: rpg?.willpower || { current: 10, max: 10 },
            skills: rpg?.skills || [],
            statsStatus: rpg?.statsStatus || 'pending',
            skillsStatus: rpg?.skillsStatus || 'pending',
            stats: rpg?.stats || { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
        },
    } as Character;
    
    // Asynchronous Hydration Step
    if (!finalCharacter.meta.userName && finalCharacter.meta.userId) {
        try {
            const { getSupabaseServerClient } = await import('@/lib/supabase/server');
            const supabase = await getSupabaseServerClient();
            const { data: userData, error } = await supabase.from('users').select('display_name').eq('id', finalCharacter.meta.userId).single();
            if (userData) {
                finalCharacter.meta.userName = userData.display_name || 'Anonymous';
            }
            if (error) console.warn(`Hydration: Could not fetch user ${finalCharacter.meta.userId}`);
        } catch (e) {
            console.error("Hydration failed for user", e);
        }
    }

    return finalCharacter;
}
