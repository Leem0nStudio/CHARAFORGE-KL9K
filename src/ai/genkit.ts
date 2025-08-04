
'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebasePlugin } from '@genkit-ai/firebase';
import { config } from 'dotenv';

config({ path: '.env' });

export const ai = genkit({
  plugins: [
    firebasePlugin(),
    googleAI(),
  ],
});
