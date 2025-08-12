'use server';

import { config } from 'dotenv';
config();

// This file should only import actual Genkit flows for development/testing purposes.
// Server actions like save-character are part of the Next.js framework, not Genkit's flow system.
import '@/ai/flows/character-bio/flow';
import '@/ai/flows/character-image/flow';
import '@/ai/flows/image-resize/flow';
import '@/ai/flows/text-translation/flow';
import '@/ai/flows/datapack-schema/flow';
import '@/ai/flows/danbooru-tag-suggestion/flow';
import '@/ai/flows/story-generation/flow';
import '@/ai/flows/hf-model-suggestion/flow';

    