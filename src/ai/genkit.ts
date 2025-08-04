import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {config} from 'dotenv';

// Explicitly load environment variables from .env file
config({path: '.env'});

export const ai = genkit({
  plugins: [
    // The firebase plugin is used by calling it as a function
    // The import 'firebase' from '@genkit-ai/firebase' is not needed as a named import
    // as the function 'firebase()' is implicitly available after importing the package.
    require('@genkit-ai/firebase').firebase(), // Use require for CommonJS module if direct import fails
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  logSinks: ['firebase'],
  traceStore: 'firebase',
});
