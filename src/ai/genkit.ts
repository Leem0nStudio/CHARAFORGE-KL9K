'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { config } from 'dotenv';

// Cargar variables de entorno antes de cualquier uso
config({ path: '.env' });

export const ai = genkit({
  plugins: [
    firebase({
      projectId: process.env.FIREBASE_PROJECT_ID,
    }),
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});