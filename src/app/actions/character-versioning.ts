
'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { Character } from '@/types/character';
import { toCharacterObject } from '@/services/character-hydrator';
import { v4 as uuidv4 } from 'uuid';

type ActionResponse = {
    success: boolean;
    message: string;
    characterId?: string;
};

// Helper function to fetch a single character for internal use
async function getCharacterData(characterId: string): Promise<Character | null> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.from('characters').select('*').eq('id', characterId).single();
    if (error || !data) return null;
    return await toCharacterObject(data.id, data);
}

export async function createCharacterVersion(characterId: string): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();
  const supabase = await getSupabaseServerClient();

  try {
    const originalChar = await getCharacterData(characterId);

    if (!originalChar) {
      return { success: false, message: 'Character to version not found.' };
    }

    if (originalChar.meta.userId !== uid) {
      return { success: false, message: 'Permission denied.' };
    }

    const baseId = originalChar.lineage.baseCharacterId || originalChar.id;
    const existingVersions = originalChar.lineage.versions || [{ id: originalChar.id, name: originalChar.lineage.versionName, version: originalChar.lineage.version }];
    const newVersionNumber = Math.max(...existingVersions.map(v => v.version)) + 1;
    const newCharacterId = uuidv4();
    const newVersionName = `v.${newVersionNumber}`;

    const newCharacterData = { ...originalChar };
    // Remove the ID to let Supabase generate it
    delete (newCharacterData as any).id; 
    
    // Create new lineage details
    newCharacterData.lineage = {
      ...originalChar.lineage,
      version: newVersionNumber,
      versionName: newVersionName,
      baseCharacterId: baseId,
      versions: [], // This will be updated later
    };

    // Update meta details
    newCharacterData.meta.createdAt = new Date(); // Will be overwritten by DB default
    
    const newVersionInfo = { id: newCharacterId, name: newVersionName, version: newVersionNumber };
    const updatedVersionsList = [...existingVersions, newVersionInfo];

    // Prepare the new character row for insertion, using snake_case for Supabase columns
    const newRow = {
      id: newCharacterId,
      user_id: uid,
      name: newCharacterData.core.name,
      archetype: newCharacterData.core.archetype,
      biography: newCharacterData.core.biography,
      image_url: newCharacterData.visuals.imageUrl,
      core_details: newCharacterData.core,
      visual_details: newCharacterData.visuals,
      lineage_details: { ...newCharacterData.lineage, versions: updatedVersionsList },
      generation_details: newCharacterData.generation,
      meta_details: newCharacterData.meta,
      settings_details: newCharacterData.settings,
      rpg_details: newCharacterData.rpg,
    };
    
    // Insert new character
    const { error: insertError } = await supabase.from('characters').insert(newRow);
    if (insertError) throw insertError;

    // Update all other versions with the new version list
    for (const version of updatedVersionsList) {
        if (version.id !== newCharacterId) {
            const { error: updateError } = await supabase
                .from('characters')
                .update({ lineage_details: { ...originalChar.lineage, versions: updatedVersionsList } })
                .eq('id', version.id);
            if (updateError) console.warn(`Failed to update version history for ${version.id}`, updateError);
        }
    }

    revalidatePath('/characters');
    revalidatePath(`/showcase/${newCharacterId}/edit`);

    return { success: true, message: `Created new version: ${newVersionName}`, characterId: newCharacterId };

  } catch (error) {
    console.error('Error creating character version:', error);
    const message = error instanceof Error ? error.message : 'Could not create character version.';
    return { success: false, message };
  }
}

export async function branchCharacter(characterId: string): Promise<ActionResponse> {
  const newOwnerId = await verifyAndGetUid();
  const supabase = await getSupabaseServerClient();
  
  const { data: newOwnerProfile, error: profileError } = await supabase.from('users').select('display_name').eq('id', newOwnerId).single();
  if (profileError) throw new Error("Could not fetch new owner's profile.");


  try {
    const originalChar = await getCharacterData(characterId);
    if (!originalChar) return { success: false, message: 'Character to branch not found.' };

    if (originalChar.settings.branchingPermissions !== 'public') {
      return { success: false, message: 'This character does not allow branching.' };
    }
     if (originalChar.meta.userId === newOwnerId) {
      return { success: false, message: 'You cannot branch your own character. Create a new version instead.' };
    }
    
    const newCharacterId = uuidv4();
    const version = 1;
    const versionName = 'v.1';
    const initialVersion = { id: newCharacterId, name: versionName, version: version };

    const newCharacterData = { ...originalChar };
    // Remove the ID to let Supabase generate it
    delete (newCharacterData as any).id; 

    const newRow = {
        id: newCharacterId,
        user_id: newOwnerId,
        name: newCharacterData.core.name,
        archetype: newCharacterData.core.archetype,
        biography: newCharacterData.core.biography,
        image_url: newCharacterData.visuals.imageUrl,
        core_details: newCharacterData.core,
        visual_details: newCharacterData.visuals,
        lineage_details: {
            ...originalChar.lineage,
            branchedFromId: originalChar.id,
            originalAuthorId: originalChar.meta.userId,
            originalAuthorName: originalChar.meta.userName,
            version: version,
            versionName: versionName,
            baseCharacterId: newCharacterId, 
            versions: [initialVersion],
        },
        generation_details: originalChar.generation,
        meta_details: {
            ...originalChar.meta,
            userId: newOwnerId,
            userName: newOwnerProfile?.display_name || 'Anonymous',
            status: 'private', 
            createdAt: new Date().toISOString(),
        },
        settings_details: {
            ...originalChar.settings,
            isSharedToDataPack: false,
            branchingPermissions: 'private',
        },
        rpg_details: originalChar.rpg,
    };
    
    const { error: insertError } = await supabase.from('characters').insert(newRow);
    if (insertError) throw insertError;
    
    revalidatePath('/characters');
    return { success: true, message: `Successfully branched "${originalChar.core.name}"! It's now in your gallery.`, characterId: newCharacterId };

  } catch (error) {
    console.error('Error branching character:', error);
    const message = error instanceof Error ? error.message : 'Could not branch the character.';
    return { success: false, message };
  }
}
