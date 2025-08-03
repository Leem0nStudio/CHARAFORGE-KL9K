import { initializeApp, getApps, getApp, App, ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// This function handles the initialization of the Firebase Admin SDK.
// It's designed to be robust, avoiding re-initialization and handling
// different environments (production vs. emulators) gracefully.
const createFirebaseAdminApp = (): App | null => {
  // If an app is already initialized, return it to prevent errors.
  if (getApps().length > 0) {
    return getApp();
  }

  // Case 1: Using Firebase Emulators for local development.
  // The `NEXT_PUBLIC_USE_EMULATORS` flag dictates this.
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
    // A projectId is required for emulator initialization.
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      console.error('[server.ts] ERROR: NEXT_PUBLIC_FIREBASE_PROJECT_ID is required for emulator mode.');
      return null;
    }
    return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }

  // Case 2: Production environment, using a service account key.
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // The service account key is essential for production.
  if (!serviceAccountKey) {
    console.error('[server.ts] ERROR: FIREBASE_SERVICE_ACCOUNT_KEY is not set. Server features will be disabled.');
    return null;
  }
  
  // A common mistake is leaving the key as an empty object.
  if (serviceAccountKey === "{}") {
    console.warn('[server.ts] WARN: FIREBASE_SERVICE_ACCOUNT_KEY is an empty JSON object. Server features will be disabled.');
    return null;
  }

  try {
    // The key is often stored with escaped newlines; this replaces them.
    const sanitizedKey = serviceAccountKey.replace(/\\n/g, '\n');
    const serviceAccount: ServiceAccount = JSON.parse(sanitizedKey);

    // Validate the parsed service account for the necessary property.
    if (!serviceAccount.projectId) {
      console.error('[server.ts] ERROR: Service account JSON is missing "project_id".');
      return null;
    }
    
    // Initialize the app with the service account credentials.
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    // Catch any JSON parsing errors.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[server.ts] FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it's valid JSON. Error: ${errorMessage}`);
    return null;
  }
};

// Initialize the app. This will be null if initialization fails.
const adminApp = createFirebaseAdminApp();

// Create getter functions to safely retrieve Firebase services.
// This prevents errors if the main app initialization failed.
const getAdminDb = (): Firestore | null => {
  if (!adminApp) return null;
  try {
    return getFirestore(adminApp);
  } catch (e) {
    console.error('[server.ts] Failed to get Firestore instance:', e);
    return null;
  }
};

const getAdminAuth = (): Auth | null => {
    if (!adminApp) return null;
    try {
        return getAuth(adminApp);
    } catch(e) {
        console.error('[server.ts] Failed to get Auth instance:', e);
        return null;
    }
}

// Export the initialized services. They will be null if something went wrong.
export const admin: App | null = adminApp;
export const adminDb: Firestore | null = getAdminDb();
export const adminAuth: Auth | null = getAdminAuth();
