import { genkit } from 'genkit';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';

// Retrieve the service account key from environment variables to extract project ID
let projectId: string | undefined = undefined;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      projectId = serviceAccount.project_id;
  }
} catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY to get project ID.", e);
}


export const ai = genkit({
  plugins: [
    googleAI({}),
  ],
});

enableFirebaseTelemetry();
