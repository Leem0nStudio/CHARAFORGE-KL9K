
'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';
import {config} from 'dotenv';

// Explicitly load environment variables from .env file
// This is crucial for ensuring server-side processes have access to them immediately.
config({path: '.env'});

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI(),
  ],
  // logSinks: ['firebase'],
  // traceStore: 'firebase',
});
