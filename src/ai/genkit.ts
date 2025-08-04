
import { genkit } from 'genkit'; 
import { config } from 'dotenv';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';

config({ path: '.env' });

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
enableFirebaseTelemetry();
