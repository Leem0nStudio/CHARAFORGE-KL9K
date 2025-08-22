
'use server';

import { config } from 'dotenv';
config();

// This file should only import actual Genkit flows for development/testing purposes.
// Server actions like save-character are part of the Next.js framework, not Genkit's flow system.
import '@/ai/flows/character-sheet/flow';
import '@/ai/flows/character-image/flow';
import '@/ai/flows/text-translation/flow';
import '@/ai/flows/datapack-schema/flow';
import '@/ai/flows/danbooru-tag-suggestion/flow';
import '@/ai/flows/story-generation/flow';
import '@/ai/flows/hf-model-suggestion/flow';
import '@/ai/flows/rpg-attributes/flow';


// Utility files are not flows, so they don't need to be imported here for dev.
// import '@/ai/utils/llm-utils';
