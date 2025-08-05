import { genkit } from 'genkit'; 
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';
// Import your Genkit flows here to ensure they are registered
import './flows/generate-character-bio';
import './flows/generate-character-image';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
enableFirebaseTelemetry();
