'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { config } from 'dotenv';

config({ path: '.env' });

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI(),
  ],
});
