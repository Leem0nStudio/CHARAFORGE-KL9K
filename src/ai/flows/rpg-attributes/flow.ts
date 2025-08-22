
'use server';

/**
 * @fileOverview This flow is now deprecated and its logic has been moved.
 * Stat generation is a deterministic function in `character-write.ts`.
 * Skill generation is handled by the dedicated `rpg-skills` flow.
 * This file can be removed in a future cleanup.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Character, RpgAttributes } from '@/types/character';
import { 
  GenerateAllRpgAttributesInputSchema,
  GenerateAllRpgAttributesOutputSchema,
  type GenerateAllRpgAttributesInput, 
  type GenerateAllRpgAttributesOutput,
  SkillSchema,
} from './types';


// This flow is no longer used and is kept for historical reference before deletion.
export const generateAllRpgAttributesFlow = ai.defineFlow(
  {
    name: 'generateAllRpgAttributesFlow_DEPRECATED',
    inputSchema: GenerateAllRpgAttributesInputSchema,
    outputSchema: GenerateAllRpgAttributesOutputSchema,
  },
  async (character) => {
      // This logic is now split. Stats are deterministic, skills are in their own flow.
      throw new Error("This flow is deprecated and should not be called.");
  }
);
