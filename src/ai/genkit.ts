import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Retrieve the service account key from environment variables to extract project ID
let projectId: string | undefined = undefined;
try {
  // This logic can be simplified post-migration if project ID is set directly
  if (process.env.GCLOUD_PROJECT) {
      projectId = process.env.GCLOUD_PROJECT;
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      projectId = serviceAccount.project_id;
  }
} catch (e) {
    console.error("Could not determine project ID for Genkit.", e);
}


export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
