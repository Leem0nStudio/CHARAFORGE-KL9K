import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';
import {config} from 'dotenv';

// Explicitly load environment variables from .env file
config({path: '.env'});

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  logSinks: ['firebase'],
  traceStore: 'firebase',
});
