'use server';

import { config } from 'dotenv';
config();

// This file should only import actual Genkit flows for development/testing purposes.
// Server actions like save-character are part of the Next.js framework, not Genkit's flow system.
import '@/ai/flows/generate-character-bio';
import '@/ai/flows/generate-character-image';
import '@/ai/flows/resize-image';
import '@/ai/flows/translate-text';
