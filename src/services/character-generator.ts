

'use server';

/**
 * @fileoverview This file is deprecated. The logic for saving a character has been
 * migrated to the `saveCharacter` server action in `src/app/actions/character-write.ts`.
 * This was done to correctly handle server-only functions and to consolidate database
 * logic for the new Supabase architecture.
 *
 * This file can be safely removed in the future.
 */

import { verifyAndGetUid } from '@/lib/auth/server';
import type { Character } from '@/types/character';
import { v4 as uuidv4 } from 'uuid';
import { uploadToStorage } from '@/services/storage';
import { SaveCharacterInputSchema, type SaveCharacterInput } from '@/types/character';


/**
 * @deprecated This function is no longer used and has been replaced by the `saveCharacter` server action.
 */
export async function deprecatedSaveCharacter(input: SaveCharacterInput) {
    throw new Error("This function is deprecated. Please use the 'saveCharacter' server action instead.");
}
