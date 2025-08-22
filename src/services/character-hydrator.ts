

/**
 * @fileoverview This service provides a centralized function for converting
 * Firestore document data into a fully-typed and serializable `Character` object.
 * Using a single, shared "hydrator" function ensures that character data is
 * processed consistently across all parts of the application, preventing
 * discrepancies and making the system easier to maintain.
 */

import type { Character } from '@/types/character';
import { Timestamp, DocumentData } from 'firebase-admin/firestore';

/**
 * Converts a Firestore document data object into a fully-typed, serializable Character object.
 * This helper function ensures consistency across different read operations.
 * @param docId The ID of the document.
 * @param data The document data from Firestore.
 * @returns A Character object.
 */
export function toCharacterObject(docId: string, data: DocumentData): Character {
    const createdAt = data.meta?.createdAt;
    
    // Default values for backward compatibility with older data structures
    const defaultCore = {
        name: data.name || 'Unnamed',
        biography: data.biography || '',
        physicalDescription: data.physicalDescription || data.description || null,
        birthYear: data.birthYear || null,
        alignment: data.alignment || 'True Neutral',
        archetype: data.archetype || null,
        equipment: data.equipment || [],
        timeline: data.timeline || [],
        tags: data.tags || [],
        rarity: data.rarity || 3,
    };
    const defaultVisuals = {
        imageUrl: data.imageUrl || '',
        gallery: data.gallery || [data.imageUrl].filter(Boolean),
        isProcessed: data.isProcessed || false,
        showcaseImageUrl: data.showcaseImageUrl || null,
        isShowcaseProcessed: data.isShowcaseProcessed || false,
        showcaseProcessingStatus: data.showcaseProcessingStatus || 'idle',
    };
    const defaultMeta = {
        userId: data.userId || '',
        status: data.status || 'private',
        isNsfw: data.isNsfw || false,
        dataPackId: data.dataPackId || null,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date(),
    };
    const defaultLineage = {
        version: data.version || 1,
        versionName: data.versionName || 'v.1',
        baseCharacterId: data.baseCharacterId || docId,
        versions: data.versions || [{ id: docId, name: 'v.1', version: 1 }],
        branchedFromId: data.branchedFromId || null,
        originalAuthorId: data.originalAuthorId || null,
    };
    const defaultSettings = {
        isSharedToDataPack: data.isSharedToDataPack || false,
        branchingPermissions: data.branchingPermissions || 'private',
    };
    const defaultGeneration = {
        textEngine: data.textEngine,
        imageEngine: data.imageEngine,
        wizardData: data.wizardData,
        originalPrompt: data.originalPrompt || data.description,
    };
    const defaultRpg = {
        // This logic is critical for backward compatibility.
        // It checks the new `rpg` object, but falls back to checking the old `archetype` field.
        isPlayable: data.rpg?.isPlayable ?? !!(data.core?.archetype || data.archetype),
        level: data.rpg?.level || 1,
        experience: data.rpg?.experience || 0,
        skills: data.rpg?.skills || [],
        statsStatus: data.rpg?.statsStatus || 'pending',
        skillsStatus: data.rpg?.skillsStatus || 'pending',
        stats: data.rpg?.stats || {
            strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0,
        },
    };

    return {
        id: docId,
        core: { ...defaultCore, ...data.core },
        visuals: { ...defaultVisuals, ...data.visuals },
        meta: { ...defaultMeta, ...data.meta, createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date() },
        lineage: { ...defaultLineage, ...data.lineage },
        settings: { ...defaultSettings, ...data.settings },
        generation: { ...defaultGeneration, ...data.generation },
        rpg: { ...defaultRpg, ...data.rpg }
    } as Character;
}
